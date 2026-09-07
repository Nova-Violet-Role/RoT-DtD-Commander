#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/ceiling.mjs <seconds> <command> [args...]
// A ceiling that exists on every leg. GNU timeout(1) is absent on the macOS
// runner, so a checker that calls it there fails before it measures anything,
// and a ceiling that silently vanishes with the platform is a guard that
// cannot trip (LAW.XOS.5). This one spawns the command in the foreground with
// stdio inherited, kills it when the seconds run out, and exits with the same
// code timeout(1) uses for that, XOS.exit.ceiling, 124; otherwise the child's
// own code, or 128 plus its signal.
//
//   node lib/ceiling.mjs 60 node lib/x.mjs controls
//   node lib/ceiling.mjs controls        trip it on purpose, both directions

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join, dirname } from 'node:path';
import { constants, tmpdir } from 'node:os';

export const CEILING_EXIT = 124;

// An npm shim on Windows (claude.cmd, npm.cmd) is a batch file that runs node
// on a script beside it. The script is read out of the shim text so the
// command runs without a shell: the first hosted scala matrix of 9.1.0 sent a
// prompt with newlines down the shell path and every argument after the
// first newline was lost, so the windows leg answered in plain text where
// json was asked for. Returns the script path, or null for a shim that does
// not name one.
// The target of the shim: the quoted path under %dp0% (or %~dp0), of any
// extension. A modern claude shim wraps a native claude.exe (measured on the
// windows leg of 38e4906: "%dp0%\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe" %*),
// the classic npm shim wraps a .js; an exe is spawned as itself and a script
// through node, and neither goes through a shell.
export function shimTarget(shimPath, text = null) {
  const t = text === null ? readFileSync(shimPath, 'utf8') : text;
  const m = /"%(?:~dp0|dp0%)\\([^"\r\n]+?)"/i.exec(t);
  if (!m) return null;
  const path = join(dirname(shimPath), m[1]);
  if (/\.(m?js|cjs)$/i.test(path)) return { kind: 'script', path };
  if (/\.exe$/i.test(path)) return { kind: 'exe', path };
  return null;
}
export function shimScript(shimPath, text = null) {
  const t = shimTarget(shimPath, text);
  return t && t.kind === 'script' ? t.path : null;
}

// onSpawn hands the child to a caller that needs it; the signal control below
// is the one caller, and it exists because the third companion pass found the
// signal line read by nobody and tripped by nothing.
export function runUnder(seconds, cmd, args, { stdio = 'inherit', onSpawn = null } = {}) {
  return new Promise((done) => {
    const win = process.platform === 'win32';
    // On Windows a manager is usually a .cmd shim (npm, npx), which spawn cannot
    // exec without a shell; the shell is used for that one shape and no other,
    // with every argument quoted whole.
    let exe = cmd;
    if (win && !/\.[a-z]+$/i.test(cmd)) {
      const w = spawnSync('where', [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const hit = String(w.stdout || '').split(/\r?\n/).map((s) => s.trim()).find((s) => /\.(cmd|bat)$/i.test(s));
      if (hit && !String(w.stdout || '').split(/\r?\n/).some((s) => /\.exe$/i.test(s.trim()))) exe = hit;
    }
    // A shim that names its node script is run through node directly; the
    // shell path is kept only for a shim that does not, and refused there when
    // an argument carries a newline or a quote the shell would cut (9.1.0).
    let target = null;
    let head = '';
    if (win && /\.(cmd|bat)$/i.test(exe)) {
      try { const t = readFileSync(exe, 'utf8'); head = t.slice(0, 300); target = shimTarget(exe, t); } catch (e) { target = null; head = `unreadable: ${e.message}`; }
    }
    const viaShell = win && /\.(cmd|bat)$/i.test(exe) && !target;
    // The refusal quotes the shim, so the next reading of a leg needs no guess
    // about the template it carries.
    if (viaShell && args.some((a) => /[\r\n"]/.test(String(a)))) return done({ code: 2, fired: false, error: `${exe} is a shell shim whose target could not be read, and an argument carries a newline or a quote the shell would cut; refused rather than truncated; the shim reads ${JSON.stringify(head)}` });
    const child = target
      ? (target.kind === 'script' ? spawn(process.execPath, [target.path, ...args], { stdio }) : spawn(target.path, args, { stdio }))
      : viaShell
        ? spawn(`"${exe}" ${args.map((a) => `"${String(a).replace(/"/g, '\\"')}"`).join(' ')}`, { stdio, shell: true })
        : spawn(exe, args, { stdio });
    if (onSpawn) onSpawn(child);
    let fired = false;
    const timer = setTimeout(() => {
      fired = true;
      // The tree, not only the root: on Windows a killed node leaves its
      // children alive, and a ceiling that leaves the work running has not
      // fired at all.
      if (win) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else { try { child.kill('SIGKILL'); } catch { /* already gone */ } }
    }, seconds * 1000);
    child.on('error', (e) => { clearTimeout(timer); done({ code: 127, fired: false, error: String(e.message || e) }); });
    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      if (fired) return done({ code: CEILING_EXIT, fired: true });
      done({ code: code === null ? 128 + ((constants.signals || {})[signal] || 0) : code, fired: false });
    });
  });
}

export async function controls(io = console) {
  let ran = 0;
  let fail = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const me = fileURLToPath(import.meta.url);
  // The signal branch, tripped: a child killed with SIGTERM before its ceiling
  // exits 128 plus the signal's own number, 143 on every leg (Windows reports
  // the kill as code null, signal SIGTERM, measured), never the flat 137 the
  // old line gave every signal.
  const term = (constants.signals || {}).SIGTERM || 15;
  const killed = await runUnder(30, process.execPath, ['-e', 'setTimeout(function(){}, 8000)'], { stdio: 'ignore', onSpawn: (ch) => setTimeout(() => { try { ch.kill('SIGTERM'); } catch { /* gone */ } }, 300) });
  say(!killed.fired && killed.code === 128 + term, `trip: a child killed with SIGTERM under its ceiling exits 128 plus ${term}: ${killed.code}, ceiling fired ${killed.fired}`);
  const t0 = Date.now();
  const slow = spawnSync(process.execPath, [me, '1', process.execPath, '-e', 'setTimeout(function(){}, 8000)'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const took = (Date.now() - t0) / 1000;
  say(slow.status === CEILING_EXIT && took < 6, `trip: a command that outlives its one-second ceiling exits ${CEILING_EXIT} in ${took.toFixed(1)} s, never runs to its own end (LAW.XOS.5)`);
  const quick = spawnSync(process.execPath, [me, '5', process.execPath, '-e', 'process.exit(3)'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(quick.status === 3, `a command that ends under its ceiling keeps its own exit code: ${quick.status}`);
  const zero = spawnSync(process.execPath, [me, '5', process.execPath, '-e', 'process.exit(0)'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(zero.status === 0, 'a command that succeeds under its ceiling exits 0');
  const bad = spawnSync(process.execPath, [me, 'x'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(bad.status === 2 && /usage/.test(bad.stderr), 'a call without a command or with a non-numeric ceiling is refused with the usage, exit 2');
  const npm = spawnSync(process.execPath, [me, '60', 'npm', '--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(npm.status === 0 && /^\d+\./.test(String(npm.stdout).trim()), `a manager that is a .cmd shim on Windows runs under the ceiling too: npm ${String(npm.stdout).trim() || npm.stderr.slice(0, 60)}`);
  const gone = spawnSync(process.execPath, [me, '5', 'no-such-binary-on-any-leg-8b3c'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(gone.status === 127, `a command that cannot be spawned exits 127, the shell's own code for it: ${gone.status}`);
  // The shim path (9.1.0): an npm shim's node script is read from the shim
  // text on every leg; on Windows a planted shim on PATH carries a two-line
  // argument through the ceiling and back whole, which the shell path cut.
  const shimText = '@ECHO off\r\nSETLOCAL\r\nSET "_prog=node"\r\nendLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\node_modules\\probe\\cli.js" %*\r\n';
  const parsed = shimScript('C:\\r\\probe-shim.cmd', shimText) || '';
  const exeShim = shimTarget('C:\\r\\claude.cmd', '@ECHO off\r\nGOTO start\r\n:find_dp0\r\nSET dp0=%~dp0\r\nEXIT /b\r\n:start\r\nSETLOCAL\r\nCALL :find_dp0\r\n"%dp0%\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe"   %*\r\n') || {};
  let whole = true;
  let how = 'the shell path is not taken on this leg';
  if (process.platform === 'win32') {
    const d = mkdtempSync(join(tmpdir(), 'ceiling-shim-'));
    try {
      mkdirSync(join(d, 'node_modules', 'probe'), { recursive: true });
      writeFileSync(join(d, 'node_modules', 'probe', 'cli.js'), 'process.stdout.write(JSON.stringify(process.argv.slice(2)));\n', 'utf8');
      writeFileSync(join(d, 'probe-shim.cmd'), shimText, 'utf8');
      const r = spawnSync(process.execPath, [me, '30', 'probe-shim', 'one\ntwo', '--output-format', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PATH: `${d};${process.env.PATH}` } });
      let got = null;
      try { got = JSON.parse(r.stdout); } catch { got = null; }
      whole = r.status === 0 && Array.isArray(got) && got[0] === 'one\ntwo' && got[2] === 'json';
      how = `through a planted shim on Windows: exit ${r.status}, argv ${JSON.stringify(r.stdout).slice(0, 60)}`;
    } finally { rmSync(d, { recursive: true, force: true }); }
  }
  say(/node_modules[\\/]probe[\\/]cli\.js$/.test(parsed) && exeShim.kind === 'exe' && /claude\.exe$/i.test(exeShim.path) && whole, `a shim resolves to the script (${parsed.replace(/^.*probe-shim\.cmd/, '<dir>')}) or the exe (${exeShim.kind} ${String(exeShim.path || '').replace(/^.*node_modules/, 'node_modules')}) it wraps, and a two-line argument survives ${how}`);
  io.log(`ceiling controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [secs, cmd, ...args] = process.argv.slice(2);
  if (secs === 'controls') {
    controls().then((ok) => process.exit(ok ? 0 : 1));
  } else {
    const s = Number(secs);
    if (!cmd || !(s > 0)) {
      console.error('usage: node lib/ceiling.mjs <seconds> <command> [args...] | controls');
      process.exit(2);
    }
    runUnder(s, cmd, args).then((r) => {
      if (r.error) console.error(`ceiling: cannot run ${cmd}: ${r.error}`);
      if (r.fired) console.error(`ceiling: ${cmd} reached the ${s} s ceiling, exit ${CEILING_EXIT}`);
      process.exit(r.code);
    });
  }
}
