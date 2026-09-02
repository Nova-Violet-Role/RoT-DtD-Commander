#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// docs/tapes/render.mjs
// Render a VHS tape to a GIF without vhs: read the same .tape file, type the
// commands, RUN them (stdin fed from the typed lines that follow), capture
// the real output, draw every frame with ffmpeg drawtext, and encode the GIF
// with a per-frame duration. The tape stays the single source; vhs renders
// it identically where vhs runs, and this script renders it where vhs does
// not (on the maintainer's Windows machine vhs stalls before spawning ttyd).
//
//   node docs/tapes/render.mjs docs/tapes/install.tape [more.tape ...]
//
// Requires ffmpeg with the drawtext filter and a monospace TTF
// (RENDER_FONT overrides; defaults try Consolas, Cascadia Mono, DejaVu Sans Mono).

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const FONTS = [
  process.env.RENDER_FONT,
  'C:/Windows/Fonts/consola.ttf',
  'C:/Windows/Fonts/CascadiaMono.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
  '/System/Library/Fonts/Menlo.ttc',
].filter(Boolean);
const FONT = FONTS.find((f) => existsSync(f));
if (!FONT) {
  console.error('render: no monospace font found; set RENDER_FONT');
  process.exit(2);
}
const BG = '0x1e1e2e';
const FG = '0xcdd6f4';
const PROMPT = '$ ';
const COMMAND_PREFIXES = ['node ', 'bash ', 'echo ', 'rm ', 'clear', 'export ', 'ls', 'cat ', 'npm ', 'rdc ', 'git ', 'printf '];

function parseTape(text) {
  const ops = [];
  const set = { width: 1100, height: 640, fontSize: 13, padding: 12, out: null };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    let m;
    if ((m = /^Output\s+(.+)$/.exec(line))) set.out = m[1].trim();
    else if ((m = /^Set\s+Width\s+(\d+)/.exec(line))) set.width = +m[1];
    else if ((m = /^Set\s+Height\s+(\d+)/.exec(line))) set.height = +m[1];
    else if ((m = /^Set\s+FontSize\s+(\d+)/.exec(line))) set.fontSize = +m[1];
    else if ((m = /^Set\s+Padding\s+(\d+)/.exec(line))) set.padding = +m[1];
    else if (/^Set\s/.test(line)) continue;
    else if ((m = /^Type\s+(["`])([\s\S]*)\1$/.exec(line))) ops.push({ op: 'type', text: m[2] });
    else if (line === 'Enter') ops.push({ op: 'enter' });
    else if ((m = /^Sleep\s+([\d.]+)(ms|s)$/.exec(line))) ops.push({ op: 'sleep', ms: m[2] === 's' ? +m[1] * 1000 : +m[1] });
    else if (line === 'Hide') ops.push({ op: 'hide' });
    else if (line === 'Show') ops.push({ op: 'show' });
    else throw new Error(`render: unsupported tape line: ${line}`);
  }
  return { set, ops };
}

function isCommand(text) {
  return COMMAND_PREFIXES.some((p) => text.startsWith(p));
}

// Group the ops into a script: each command carries the typed lines that
// follow it (its stdin) until the next command. Frames are planned as the
// ops are walked, so typing and output land where the tape puts them.
function plan(ops) {
  const frames = []; // { lines: string[], ms }
  let screen = [];
  let visible = true;
  let pendingCmd = null; // the command typed but not yet entered
  let i = 0;
  const push = (lines, ms) => {
    if (visible) frames.push({ lines: lines.slice(), ms });
  };
  while (i < ops.length) {
    const o = ops[i];
    if (o.op === 'hide') visible = false;
    else if (o.op === 'show') visible = true;
    else if (o.op === 'sleep') {
      if (frames.length && visible) frames[frames.length - 1].ms += o.ms;
    } else if (o.op === 'type') {
      if (!isCommand(o.text) && pendingCmd === null) throw new Error(`render: typed input "${o.text}" with no command to feed`);
      if (isCommand(o.text)) {
        pendingCmd = o.text;
        const step = Math.max(2, Math.ceil(o.text.length / 18));
        for (let k = step; k < o.text.length; k += step) push([...screen, PROMPT + o.text.slice(0, k)], 60);
        push([...screen, PROMPT + o.text], 350);
      }
    } else if (o.op === 'enter') {
      if (pendingCmd === null) {
        i++;
        continue;
      }
      // gather stdin lines: every following type op that is not a command, with its enter
      const inputs = [];
      let hold = 0;
      let j = i + 1;
      while (j < ops.length) {
        const n = ops[j];
        if (n.op === 'sleep') {
          hold += n.ms;
          j++;
          continue;
        }
        if (n.op === 'type' && !isCommand(n.text)) {
          inputs.push(n.text);
          j++;
          if (ops[j] && ops[j].op === 'enter') j++;
          continue;
        }
        if (n.op === 'enter') {
          inputs.push('');
          j++;
          continue;
        }
        break;
      }
      const cmd = pendingCmd;
      pendingCmd = null;
      if (cmd === 'clear' || cmd.endsWith('; clear')) {
        if (cmd !== 'clear') run(cmd.replace(/;\s*clear$/, ''), inputs);
        screen = [];
        push(screen, 200);
        i = j;
        continue;
      }
      screen.push(PROMPT + cmd);
      const out = run(cmd, inputs);
      const lines = out.split('\n');
      if (lines.length && lines[lines.length - 1] === '') lines.pop();
      const chunks = Math.min(6, Math.max(1, lines.length));
      const per = Math.ceil(lines.length / chunks);
      for (let c = 0; c < chunks; c++) {
        screen.push(...lines.slice(c * per, (c + 1) * per));
        push(screen, 220);
      }
      if (frames.length && visible) frames[frames.length - 1].ms += hold;
      i = j;
      continue;
    }
    i++;
  }
  return frames;
}

// Each command runs in its own bash, so `export NAME=value` segments are
// remembered here and handed to every later command of the same tape.
const sessionEnv = {};

function run(cmd, inputs) {
  for (const seg of cmd.split(';')) {
    const m = /^\s*export\s+([A-Za-z_]\w*)=(.*)$/.exec(seg);
    if (m) sessionEnv[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  const r = spawnSync('bash', ['-lc', cmd], { input: inputs.length ? inputs.join('\n') + '\n' : '', encoding: 'utf8', env: { ...process.env, ...sessionEnv, TERM: 'dumb', NO_COLOR: '1', FORCE_COLOR: '0' }, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  return out.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/\r/g, '');
}

function fit(lines, set) {
  // Consolas and its peers advance about 0.55 em per glyph.
  const lineH = Math.round(set.fontSize * 1.5);
  const rows = Math.floor((set.height - 2 * set.padding) / lineH);
  const cols = Math.floor((set.width - 2 * set.padding) / (set.fontSize * 0.56));
  const tail = lines.slice(-rows).map((l) => (l.length > cols ? l.slice(0, cols - 1) + '…' : l));
  return { text: tail.join('\n'), lineH };
}

function render(tapePath) {
  const { set, ops } = parseTape(readFileSync(tapePath, 'utf8'));
  if (!set.out) throw new Error(`render: ${tapePath} has no Output`);
  const frames = plan(ops);
  const work = join(os.tmpdir(), `render-${basename(tapePath, '.tape')}-${process.pid}`);
  mkdirSync(work, { recursive: true });
  const fontSize = Math.round(set.fontSize * 1.45);
  const list = [];
  frames.forEach((f, idx) => {
    const { text, lineH } = fit(f.lines, { ...set, fontSize });
    const txt = join(work, `f${idx}.txt`);
    const png = join(work, `f${idx}.png`);
    writeFileSync(txt, text || ' ', 'utf8');
    const vf = `drawtext=fontfile='${FONT.replace(/\\/g, '/').replace(/:/g, '\\:')}':textfile='${txt.replace(/\\/g, '/').replace(/:/g, '\\:')}':expansion=none:fontcolor=${FG}:fontsize=${fontSize}:line_spacing=${lineH - fontSize}:x=${set.padding}:y=${set.padding}`;
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${BG}:s=${set.width}x${set.height}:d=0.1`, '-vf', vf, '-frames:v', '1', png], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`ffmpeg frame ${idx}: ${r.stderr}`);
    list.push(`file '${png.replace(/\\/g, '/')}'`, `duration ${(f.ms / 1000).toFixed(3)}`);
  });
  list.push(`file '${join(work, `f${frames.length - 1}.png`).replace(/\\/g, '/')}'`);
  const listPath = join(work, 'list.txt');
  writeFileSync(listPath, list.join('\n') + '\n', 'utf8');
  const out = resolve(set.out);
  mkdirSync(join(out, '..'), { recursive: true });
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-vf', 'fps=10,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=none', '-loop', '0', out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg gif: ${r.stderr}`);
  rmSync(work, { recursive: true, force: true });
  const bytes = statSync(out).size;
  console.log(`rendered ${tapePath} -> ${set.out}  frames ${frames.length}  bytes ${bytes}`);
  return bytes;
}

const tapes = process.argv.slice(2);
if (!tapes.length) {
  console.error('usage: node docs/tapes/render.mjs <tape> [...]');
  process.exit(2);
}
let bad = 0;
for (const t of tapes) {
  try {
    const bytes = render(t);
    if (bytes > 2 * 1024 * 1024) {
      console.error(`render: ${t} produced a GIF over 2 MB`);
      bad++;
    }
  } catch (e) {
    console.error(String(e.message || e));
    bad++;
  }
}
process.exit(bad ? 1 : 0);
