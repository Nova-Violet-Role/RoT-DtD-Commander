#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/gate-sync.mjs
// Every command of the `gate` chain in package.json, with each
// `npm run <name>` resolved to the script it names (recursively, so
// `npm run sweep` becomes its two sweeps), must be a run line of
// .github/workflows/gate.yml or a shell segment of one: the value of a
// `run: <cmd>` line, or a line of a `run: |` block, split on the shell
// separators (&&, ||, ;, |) and compared whole. A YAML comment, a step
// commented out, or a mention in prose counts for nothing. One direction
// only: the workflow may run more than the chain (its own shell checks,
// the tapes, the index modes), and that direction is not claimed. This
// file is the workflow's own first step, and the gate script runs it too.
// Three controls: a copy without the last command's run line, a copy with
// that line commented out, and a file that is nothing but comments naming
// every command, each reporting what it lacks.

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
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

function segments(line) {
  return line.split(/&&|\|\||;|\|/).map((s) => s.trim()).filter(Boolean);
}

// The commands a workflow runs: `run: <cmd>` values and the lines of
// `run: |` blocks, comments dropped, each split on the shell separators.
export function runSegments(workflow) {
  const out = [];
  const lines = workflow.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^(?:-\s+)?run:\s*(.*)$/);
    if (!m) continue;
    const value = m[1].trim();
    if (value === '|' || value === '|-' || value === '>' || value === '>-') {
      const indent = raw.search(/\S/);
      let j = i + 1;
      for (; j < lines.length; j++) {
        const l = lines[j];
        if (l.trim() === '') continue;
        if (l.search(/\S/) <= indent) break;
        const s = l.trim();
        if (s.startsWith('#')) continue;
        out.push(...segments(s));
      }
      i = j - 1;
    } else {
      out.push(...segments(value));
    }
  }
  return out;
}

export function missing(scripts, workflow) {
  const segs = new Set(runSegments(workflow));
  return flatten(scripts, scripts.gate).filter((c) => !segs.has(c));
}

function controls(scripts, workflow, cmds) {
  let fail = 0;
  const say = (ok, text) => { console.log(`  ${ok ? 'PASS' : 'FAIL'} control: ${text}`); if (!ok) fail++; };
  const victim = cmds[cmds.length - 1];
  const lines = workflow.split('\n');
  const idx = lines.findIndex((l) => l.trim() === `run: ${victim}`);
  if (idx < 0) { say(false, `landed proof: no run line of gate.yml equals "${victim}"`); return false; }
  const removed = missing(scripts, lines.filter((_, k) => k !== idx).join('\n'));
  say(removed.length === 1 && removed[0] === victim,
    `the workflow without the run line of "${victim}" reports it and nothing else (${removed.length} missing)`);
  const commented = missing(scripts, lines.map((l, k) => (k === idx ? l.replace('run:', '# run:') : l)).join('\n'));
  say(commented.length === 1 && commented[0] === victim,
    `the workflow with that step commented out reports it and nothing else (${commented.length} missing)`);
  const onlyComments = missing(scripts, cmds.map((c) => `# run: ${c}`).join('\n'));
  say(onlyComments.length === cmds.length,
    `a file that is nothing but comments naming every command reports all of them (${onlyComments.length} of ${cmds.length} missing)`);
  return fail === 0;
}

function main() {
  const scripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts;
  const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'gate.yml'), 'utf8');
  const cmds = flatten(scripts, scripts.gate);
  const miss = missing(scripts, workflow);
  for (const c of miss) console.log(`  MISSING from gate.yml: ${c}`);
  const tripped = controls(scripts, workflow, cmds);
  console.log(`gate-sync: ${cmds.length} commands in the gate chain, ${miss.length} missing from gate.yml`);
  process.exit(miss.length === 0 && tripped ? 0 : 1);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
