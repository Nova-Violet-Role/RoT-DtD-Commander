#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/encoding.mjs
// The encoding sweep, reading bytes instead of calling grep. No text file in
// the tree carries a carriage return, a BOM, or a control byte the encoding
// law forbids (anything under 0x20 that is not TAB or LF, and DEL).
//
// Until 8.0.0 this lived in checker/crlf-sweep.sh as three batched greps,
// each with a GNU flag: mapfile (bash 4), grep -P and grep -U. The macOS
// runner ships bash 3.2 as /bin/bash and BSD grep, so the sweep could not run
// on the one leg it had never been run on (LAW.XOS.4). A byte read needs no
// flag, and one process over every file is faster than three greps.
//
//   node lib/encoding.mjs sweep        every tracked and untracked file, then the three planted controls
//   node lib/encoding.mjs check <f>..  the named files only, no controls
//   node lib/encoding.mjs controls     the planted files alone, exit 1 if one is missed

import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BINARY = /\.(gif|png|tgz|log|zip|jpg|jpeg|ico|woff2?)$/i;

export function judge(buf) {
  let cr = 0;
  let ctl = 0;
  for (const b of buf) {
    if (b === 13) cr++;
    else if ((b < 32 && b !== 9 && b !== 10) || b === 127) ctl++;
  }
  const bom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  // A text file ends with LF (.gitattributes: eol=lf). Judged only where the
  // bytes read as text, never on a GIF or an archive: no NUL byte. The
  // twelfth companion pass on 9.0.0 found dtd/cc-schematic.dtd ending on
  // its last `>` and this sweep with no arm to see it.
  const nolf = buf.length > 0 && buf[buf.length - 1] !== 10 && !buf.includes(0);
  return { cr, ctl, bom, nolf, ok: cr === 0 && ctl === 0 && !bom && !nolf };
}

export function listFiles(root = ROOT) {
  const git = (args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', timeout: 60000 });
  const tracked = git(['ls-files']);
  const others = git(['ls-files', '--others', '--exclude-standard']);
  const out = new Set();
  for (const r of [tracked, others]) for (const l of String(r.stdout || '').split('\n')) if (l.trim()) out.add(l.trim());
  return [...out].filter((f) => !BINARY.test(f) && existsSync(join(root, f)));
}

export function sweep(root = ROOT, files = listFiles(root)) {
  const bad = [];
  for (const f of files) {
    let buf;
    try { buf = readFileSync(join(root, f)); } catch { continue; }
    const j = judge(buf);
    if (j.cr) bad.push(['CR', f, j.cr]);
    if (j.bom) bad.push(['BOM', f, 1]);
    if (j.ctl) bad.push(['CTRL', f, j.ctl]);
    if (j.nolf) bad.push(['NOLF', f, 1]);
  }
  return { checked: files.length, bad };
}

// The three planted files: each must be enumerated by the file list (an
// untracked file inside the tree is a file to judge) and detected by the
// judge, and a clean file must stay quiet. A sweep whose alarm was never
// tripped on purpose proves nothing.
export function controls(root = ROOT, io = console) {
  const plants = {
    'checker/zz-crlf-control.md': Buffer.from('line\r\n'),
    'checker/zz-ctrl-control.md': Buffer.from('x\x05y\n'),
    'checker/zz-bom-control.md': Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('plain\n')]),
    'checker/zz-nolf-control.md': Buffer.from('a text file that stops on its last letter'),
  };
  let fail = 0;
  const say = (ok, text) => { io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  try {
    for (const [f, b] of Object.entries(plants)) writeFileSync(join(root, f), b);
    const files = listFiles(root);
    say(Object.keys(plants).every((f) => files.includes(f)), 'the four planted untracked files are enumerated');
    const r = sweep(root, Object.keys(plants));
    const kinds = r.bad.map((b) => b[0]).sort().join(',');
    say(kinds === 'BOM,CR,CTRL,NOLF', `trip: a planted CR, control byte, BOM and missing final LF are each detected: ${kinds || 'none'}`);
    const gif = judge(Buffer.concat([Buffer.from('GIF89a'), Buffer.from([0, 1, 2, 0x3b])]));
    say(!gif.nolf, 'a binary file, read by its NUL byte, is never asked for a final LF');
    const clean = judge(readFileSync(fileURLToPath(import.meta.url)));
    say(clean.ok, 'a clean file is not reported');
    const tab = judge(Buffer.from('a\tb\n'));
    say(tab.ok, 'TAB and LF are the two control bytes the law allows, and neither is reported');
    const del = judge(Buffer.from('a\x7fb\n'));
    say(del.ctl === 1, 'DEL is reported as a control byte');
  } finally {
    for (const f of Object.keys(plants)) rmSync(join(root, f), { force: true });
  }
  io.log(`encoding controls: 6 run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [verb, ...rest] = process.argv.slice(2);
  if (verb === 'controls') process.exit(controls() ? 0 : 1);
  if (verb === 'check') {
    let bad = 0;
    for (const f of rest) {
      const j = judge(readFileSync(f));
      console.log(`  ${j.ok ? 'OK  ' : 'FAIL'} ${f} cr=${j.cr} ctl=${j.ctl} bom=${j.bom ? 1 : 0}`);
      if (!j.ok) bad++;
    }
    process.exit(bad ? 1 : 0);
  }
  if (verb === 'sweep') {
    const r = sweep();
    for (const [k, f, n] of r.bad) console.log(`${k} ${f}${n > 1 ? ` (${n})` : ''}`);
    const ok = controls();
    console.log(`crlf-sweep: ${r.checked} files checked, ${r.bad.length} bad`);
    process.exit(r.bad.length === 0 && ok ? 0 : 1);
  }
  console.error('usage: node lib/encoding.mjs sweep | check <file...> | controls');
  process.exit(2);
}
