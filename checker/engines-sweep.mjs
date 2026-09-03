#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/engines-sweep.mjs
// Every `node lib/x.mjs` a shipped command names must be a file the installer
// writes. Two families shipped without their engines and nothing noticed: the
// commands installed, the libraries they invoke did not, and the first line an
// operator ran would have failed with a missing module.
//
//   node checker/engines-sweep.mjs            refuse a command whose engine does not ship
//   node checker/engines-sweep.mjs --controls plant a miss and watch it named

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The installer's own list, read as text so this sweep never imports (and so
// never runs) the installer.
export function shippedLibs(root = ROOT) {
  const src = readFileSync(join(root, 'bin', 'rot-dtd-commander.mjs'), 'utf8');
  const block = /const RUNTIME = \[([\s\S]*?)\];/.exec(src);
  if (!block) throw new Error('RUNTIME not found in bin/rot-dtd-commander.mjs');
  return new Set([...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

export function invokedLibs(root = ROOT, dir = 'commands') {
  const want = new Map();
  const d = join(root, dir);
  if (!existsSync(d)) return want;
  // A skill is a directory holding SKILL.md; a command is a file.
  const files = [];
  for (const n of readdirSync(d, { withFileTypes: true })) {
    if (n.isDirectory()) { const s = join(d, n.name, 'SKILL.md'); if (existsSync(s)) files.push([`${n.name}/SKILL.md`, s]); }
    else if (n.name.endsWith('.md')) files.push([n.name, join(d, n.name)]);
  }
  for (const [f, path] of files) {
    for (const m of readFileSync(path, 'utf8').matchAll(/node (lib\/[\w.-]+\.mjs)/g)) {
      if (!want.has(m[1])) want.set(m[1], []);
      if (!want.get(m[1]).includes(f)) want.get(m[1]).push(f);
    }
  }
  return want;
}

export function sweep(root = ROOT, { shipped = null } = {}) {
  const ship = shipped || shippedLibs(root);
  // Commands, skills and agents all invoke engines; reading one of the three
  // was reading a third of what the installer ships.
  const want = new Map();
  for (const dir of ['commands', 'skills', 'agents']) {
    for (const [lib, by] of invokedLibs(root, dir)) {
      if (!want.has(lib)) want.set(lib, []);
      want.get(lib).push(...by.map((f) => `${dir}/${f}`));
    }
  }
  const missing = [...want.entries()].filter(([lib]) => !ship.has(lib));
  return { wanted: want.size, missing: missing.map(([lib, by]) => ({ lib, by })) };
}

function controls() {
  let fail = 0;
  let ran = 0;
  const say = (ok, text) => { ran++; console.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const ship = shippedLibs();
  const r = sweep(ROOT, { shipped: ship });
  say(r.missing.length === 0, r.missing.length === 0
    ? `every engine a command invokes is shipped: ${r.wanted} distinct`
    : `a command invokes an engine the installer does not write: ${r.missing.map((m) => `${m.lib} (${m.by.join(', ')})`).join('; ')}`);
  const wanted = [...invokedLibs().keys()];
  say(wanted.includes('lib/amplify.mjs') && wanted.includes('lib/scratch.mjs'),
    `the sweep sees the engines the newest families invoke: ${wanted.join(', ')}`);
  // The trip: take one engine out of the shipped set and watch it named.
  const planted = new Set([...ship].filter((f) => f !== wanted[0]));
  const tripped = sweep(ROOT, { shipped: planted });
  say(tripped.missing.some((m) => m.lib === wanted[0]),
    `trip: an engine removed from the installer's list is named with the commands that need it: ${tripped.missing.map((m) => m.lib).join(', ')}`);
  console.log(`engines-sweep controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv[2] === '--controls') process.exit(controls() ? 0 : 1);
  const r = sweep();
  for (const m of r.missing) console.log(`  MISSING ${m.lib} invoked by ${m.by.join(', ')}`);
  console.log(`engines-sweep: ${r.wanted} engines invoked by commands, skills and agents, ${r.missing.length} not shipped`);
  process.exit(r.missing.length === 0 ? 0 : 1);
}
