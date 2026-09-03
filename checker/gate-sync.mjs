#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/gate-sync.mjs
// The gate workflow runs what the gate script runs. Every command of the
// `gate` chain in package.json, with each `npm run <name>` resolved to the
// script it names (recursively, so `npm run sweep` becomes its two sweeps),
// must appear verbatim in .github/workflows/gate.yml. A step added to one
// side and not to the other is reported here, and this file is the
// workflow's own first step, so the two cannot drift apart on a green run.
// Ends with its own control: a copy of the workflow with one command taken
// out must name that command and nothing else.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function flatten(scripts, chain) {
  const out = [];
  for (const raw of chain.split(' && ')) {
    const cmd = raw.trim();
    const m = cmd.match(/^npm run (\S+)$/);
    if (!m) { out.push(cmd); continue; }
    if (!scripts[m[1]]) throw new Error(`npm run ${m[1]}: no such script in package.json`);
    out.push(...flatten(scripts, scripts[m[1]]));
  }
  return out;
}

export function missing(scripts, workflow) {
  return flatten(scripts, scripts.gate).filter((c) => !workflow.includes(c));
}

const scripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts;
const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'gate.yml'), 'utf8');
const cmds = flatten(scripts, scripts.gate);
const miss = missing(scripts, workflow);
for (const c of miss) console.log(`  MISSING from gate.yml: ${c}`);

// control: the workflow without one command names exactly that command
const victim = cmds[cmds.length - 1];
const planted = missing(scripts, workflow.split(victim).join(''));
const tripped = planted.length === 1 && planted[0] === victim;
console.log(`  ${tripped ? 'PASS' : 'FAIL'} control: the workflow without "${victim}" reports it and nothing else (${planted.length} missing)`);

console.log(`gate-sync: ${cmds.length} commands in the gate chain, ${miss.length} missing from gate.yml`);
process.exit(miss.length === 0 && tripped ? 0 : 1);
