#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/workflow.mjs
// The runner of dtd/cc-workflow.dtd. A workflow file is JSON (WORKFLOW.file);
// validate reads it against the declaration and refuses what the runner
// cannot run safely (LAW.WF.2, LAW.WF.6); run walks the steps in the
// foreground, stdin closed, each under its ceiling, the exit read from the
// process and compared to the expected one (LAW.WF.1, LAW.WF.3, LAW.WF.4),
// one record line per step when the step names a record (LAW.WF.5). A
// ceiling that fires kills the whole process tree of the step, not only the
// shell that started it, so nothing is left behind. The defaults, caps and
// forbidden patterns come from the DTD, never from a number typed here.
//
//   validate(obj)            -> [findings]; empty when the file is sound
//   run(file, { dry })       -> Promise of { workflow, verdict, steps: [{ name, exit, status, ms }] }
//   controls()               -> Promise of every refusal tripped on purpose
//
//   node lib/workflow.mjs validate <file>
//   node lib/workflow.mjs run <file> [--dry]
//   node lib/workflow.mjs controls

import { readFileSync, appendFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve as presolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = readFileSync(join(ROOT, 'dtd', 'cc-workflow.dtd'), 'utf8');
const NL = String.fromCharCode(10);
const TAB = String.fromCharCode(9);

function ent(name) {
  const m = new RegExp('<!ENTITY\\s+' + name.replace(/\./g, '\\.') + '\\s+"([^"]*)"').exec(DTD);
  if (!m) throw new Error(`cc-workflow.dtd declares no ${name}`);
  return m[1];
}
function enumOf(element, attr) {
  const m = new RegExp('<!ATTLIST\\s+' + element + '\\b[\\s\\S]*?\\b' + attr + '\\s+\\(([^)]+)\\)').exec(DTD);
  if (!m) throw new Error(`cc-workflow.dtd declares no ${element} ${attr} enumeration`);
  return m[1].split('|').map((s) => s.trim());
}
const list = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

export const CEILING_DEFAULT = Number(ent('WORKFLOW.ceiling.default'));
export const CEILING_MAX = Number(ent('WORKFLOW.ceiling.max'));
export const MAX_STEPS = Number(ent('WORKFLOW.max_steps'));
export const EXIT_CEILING = Number(ent('WORKFLOW.exit.ceiling'));
export const KEYS = list(ent('WORKFLOW.keys'));
export const STEP_KEYS = list(ent('WORKFLOW.step.keys'));
export const FORBIDDEN = list(ent('WORKFLOW.forbidden'));
export const TRIGGERS = enumOf('workflow', 'trigger');
export const ON_FAIL = enumOf('workflow', 'on_fail');
export const RECORD_FIELDS = list(ent('WORKFLOW.record.fields')).map((f) => f.replace(/^\d+\s+/, ''));

// ---------- validate (LAW.WF.2, LAW.WF.6) ----------
export function validate(w) {
  const f = [];
  if (!w || typeof w !== 'object' || Array.isArray(w)) return ['the file is not a JSON object'];
  for (const k of Object.keys(w)) if (!KEYS.includes(k)) f.push(`key ${k} is outside WORKFLOW.keys (${KEYS.join(', ')})`);
  if (typeof w.name !== 'string' || !/^[A-Za-z_][\w.-]*$/.test(w.name)) f.push('name is missing or not a token');
  if (w.trigger !== undefined && !TRIGGERS.includes(w.trigger)) f.push(`trigger ${w.trigger} is outside ${TRIGGERS.join('|')}`);
  if (w.on_fail !== undefined && !ON_FAIL.includes(w.on_fail)) f.push(`on_fail ${w.on_fail} is outside ${ON_FAIL.join('|')}`);
  if (!Array.isArray(w.steps) || w.steps.length === 0) { f.push('steps is missing or empty'); return f; }
  if (w.steps.length > MAX_STEPS) f.push(`${w.steps.length} steps, above WORKFLOW.max_steps ${MAX_STEPS}`);
  const names = new Set();
  w.steps.forEach((s, i) => {
    const at = `step ${i + 1}${s && s.name ? ' (' + s.name + ')' : ''}`;
    if (!s || typeof s !== 'object') { f.push(`${at} is not an object`); return; }
    for (const k of Object.keys(s)) if (!STEP_KEYS.includes(k)) f.push(`${at}: key ${k} is outside WORKFLOW.step.keys (${STEP_KEYS.join(', ')})`);
    if (typeof s.name !== 'string' || !/^[A-Za-z_][\w.-]*$/.test(s.name)) f.push(`${at}: name is missing or not a token`);
    else if (names.has(s.name)) f.push(`${at}: name repeated`); else names.add(s.name);
    if (typeof s.run !== 'string' || !s.run.trim()) f.push(`${at}: run is missing`);
    else {
      if (/&\s*$/.test(s.run)) f.push(`${at}: run ends in an ampersand, a background process (LAW.WF.2)`);
      for (const p of FORBIDDEN) if (s.run.toLowerCase().includes(p.toLowerCase())) f.push(`${at}: run carries ${p}, refused (LAW.WF.2)`);
    }
    if (s.ceiling_secs !== undefined) {
      const c = Number(s.ceiling_secs);
      if (!Number.isInteger(c) || c < 1) f.push(`${at}: ceiling_secs ${s.ceiling_secs} is not a positive integer`);
      else if (c > CEILING_MAX) f.push(`${at}: ceiling_secs ${c} is above WORKFLOW.ceiling.max ${CEILING_MAX}`);
    }
    if (s.expect_exit !== undefined && !Number.isInteger(Number(s.expect_exit))) f.push(`${at}: expect_exit ${s.expect_exit} is not an integer`);
    if (s.cwd !== undefined && typeof s.cwd !== 'string') f.push(`${at}: cwd is not a string`);
    if (s.record !== undefined && typeof s.record !== 'string') f.push(`${at}: record is not a string`);
  });
  return f;
}

export function load(file) {
  const text = readFileSync(presolve(file), 'utf8');
  let w;
  try { w = JSON.parse(text); } catch (e) { return { w: null, findings: ['the file is not JSON: ' + e.message] }; }
  return { w, findings: validate(w) };
}

// ---------- one step: foreground, stdin closed, a ceiling that kills the tree ----------
function killTree(child) {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/F', '/T', '/PID', String(child.pid)], { stdio: 'ignore', windowsHide: true });
  } else {
    try { process.kill(-child.pid, 'SIGKILL'); } catch (e) { try { child.kill('SIGKILL'); } catch (e2) { /* already gone */ } }
  }
}

function runStep(s, base) {
  const ceiling = Number(s.ceiling_secs ?? CEILING_DEFAULT);
  const expect = Number(s.expect_exit ?? 0);
  const t0 = Date.now();
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(s.run, { shell: true, cwd: s.cwd ? presolve(base, s.cwd) : base, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, detached: process.platform !== 'win32' });
    } catch (e) {
      return resolve({ exit: -1, status: 'fail', ms: Date.now() - t0, ceiling, expect, stderr: e.message });
    }
    let err = '';
    child.stdout.on('data', () => {});
    child.stderr.on('data', (d) => { err = (err + d).slice(-400); });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, ceiling * 1000);
    child.on('error', (e) => { clearTimeout(timer); resolve({ exit: -1, status: 'fail', ms: Date.now() - t0, ceiling, expect, stderr: e.message }); });
    child.on('close', (code) => {
      clearTimeout(timer);
      const ms = Date.now() - t0;
      if (timedOut) return resolve({ exit: EXIT_CEILING, status: 'ceiling', ms, ceiling, expect, stderr: err });
      const exit = code === null ? -1 : code;
      resolve({ exit, status: exit === expect ? 'pass' : 'fail', ms, ceiling, expect, stderr: err });
    });
  });
}

// ---------- run (LAW.WF.1, WF.3, WF.4, WF.5) ----------
export async function run(file, { dry = false, base } = {}) {
  const { w, findings } = load(file);
  if (findings.length) throw new Error('refused by validate: ' + findings.join('; '));
  const dir = base || dirname(presolve(file));
  const onFail = w.on_fail || ON_FAIL[0];
  const steps = [];
  let halted = false;
  for (const s of w.steps) {
    if (halted) { steps.push({ name: s.name, exit: -1, status: 'skipped', ms: 0 }); continue; }
    if (dry) { steps.push({ name: s.name, exit: -1, status: 'skipped', ms: 0, ceiling: Number(s.ceiling_secs ?? CEILING_DEFAULT), run: s.run }); continue; }
    const r = await runStep(s, dir);
    steps.push({ name: s.name, exit: r.exit, status: r.status, ms: r.ms, ceiling: r.ceiling, expect: r.expect, stderr: r.stderr });
    if (s.record) {
      const p = presolve(dir, s.record);
      mkdirSync(dirname(p), { recursive: true });
      appendFileSync(p, [new Date().toISOString(), w.name, s.name, String(r.exit), r.status, String(r.ms)].join(TAB) + NL, 'utf8');
    }
    if (r.status !== 'pass' && onFail === 'stop') halted = true;
  }
  const verdict = dry ? 'pass' : steps.every((s) => s.status === 'pass') ? 'pass' : 'fail';
  return { workflow: w.name, verdict, steps };
}

export function lines(result) {
  const out = result.steps.map((s) => `  step ${s.name}: exit ${s.exit} status ${s.status} ${s.ms} ms${s.ceiling ? ' ceiling ' + s.ceiling + ' s' : ''}${s.status === 'fail' && s.expect !== undefined ? ' (expected ' + s.expect + ')' : ''}`);
  out.push(`workflow ${result.workflow}: ${result.verdict}`);
  return out;
}

// ---------- controls ----------
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function removeDir(dir) {
  for (let i = 0; i < 20; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return true; } catch (e) { sleep(250); }
  }
  return false;
}

export async function controls() {
  const rows = [];
  let bad = 0;
  const row = (ok, msg) => { if (!ok) bad++; rows.push(`  ${ok ? 'PASS' : 'FAIL'} ${msg}`); };
  const dir = join(tmpdir(), 'rot-dtd-workflow-controls-' + process.pid);
  mkdirSync(dir, { recursive: true });
  const write = (name, obj) => { const p = join(dir, name); writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8'); return p; };
  const node = (code) => `node -e "${code}"`;
  try {
    row(CEILING_DEFAULT === 300 && CEILING_MAX === 3600 && MAX_STEPS === 12 && EXIT_CEILING === 124, `the defaults come from the DTD: ceiling ${CEILING_DEFAULT} s, max ${CEILING_MAX} s, ${MAX_STEPS} steps, ceiling exit ${EXIT_CEILING}`);
    const rec = 'ledger.tsv';
    const good = write('good.workflow.json', { name: 'good', steps: [{ name: 'zero', run: node('process.exit(0)'), record: rec }, { name: 'three', run: node('process.exit(3)'), expect_exit: 3, record: rec }] });
    const r1 = await run(good);
    const recLines = readFileSync(join(dir, rec), 'utf8').split(NL).filter(Boolean);
    row(r1.verdict === 'pass' && r1.steps[1].exit === 3, `a sound workflow passes, an expected exit of 3 is a pass: ${lines(r1).join('; ').replace(/\s+/g, ' ')}`);
    row(recLines.length === 2 && recLines.every((l) => l.split(TAB).length === RECORD_FIELDS.length), `the record has one line per step with ${RECORD_FIELDS.length} fields (${RECORD_FIELDS.join(', ')})`);
    const stop = write('stop.workflow.json', { name: 'stop', steps: [{ name: 'one', run: node('process.exit(1)') }, { name: 'after', run: node('process.exit(0)') }] });
    const r2 = await run(stop);
    row(r2.verdict === 'fail' && r2.steps[0].status === 'fail' && r2.steps[1].status === 'skipped', `trip: exit 1 where 0 was expected fails and on_fail stop skips the rest: ${lines(r2).join('; ').replace(/\s+/g, ' ')}`);
    const cont = write('continue.workflow.json', { name: 'cont', on_fail: 'continue', steps: [{ name: 'one', run: node('process.exit(1)') }, { name: 'after', run: node('process.exit(0)') }] });
    const r3 = await run(cont);
    row(r3.verdict === 'fail' && r3.steps[1].status === 'pass', 'trip: on_fail continue runs the step after a failure and the run still fails');
    // the ceiling fires and the whole tree dies: the hanging node under the shell is gone, so the directory can be removed at once
    const slow = write('slow.workflow.json', { name: 'slow', steps: [{ name: 'hang', run: node('setTimeout(function(){},8000)'), ceiling_secs: 1 }] });
    const r4 = await run(slow);
    row(r4.verdict === 'fail' && r4.steps[0].status === 'ceiling' && r4.steps[0].exit === EXIT_CEILING && r4.steps[0].ms < 6000, `trip: a hanging step is cut by its ceiling: exit ${r4.steps[0].exit} status ${r4.steps[0].status} after ${r4.steps[0].ms} ms`);
    const v1 = validate({ name: 'bg', steps: [{ name: 'a', run: 'node -e "1" &' }] });
    row(v1.some((x) => x.includes('ampersand')), `trip: a run ending in an ampersand is refused: ${v1[0] || 'nothing'}`);
    const v2 = validate({ name: 'nested', steps: [{ name: 'a', run: 'claude -p "audit"' }] });
    row(v2.some((x) => x.includes('claude -p')), `trip: a nested session in a step is refused: ${v2[0] || 'nothing'}`);
    const v3 = validate({ name: 'many', steps: Array.from({ length: MAX_STEPS + 1 }, (_, i) => ({ name: 's' + i, run: 'node -e "1"' })) });
    row(v3.some((x) => x.includes('above WORKFLOW.max_steps')), `trip: ${MAX_STEPS + 1} steps are refused: ${v3[0] || 'nothing'}`);
    const v4 = validate({ name: 'keys', daemon: true, steps: [{ name: 'a', run: 'node -e "1"', retry: 3 }] });
    row(v4.some((x) => x.includes('key daemon')) && v4.some((x) => x.includes('key retry')), 'trip: an unknown key on the workflow and on a step is refused by name');
    const v5 = validate({ name: 'cap', steps: [{ name: 'a', run: 'node -e "1"', ceiling_secs: CEILING_MAX + 1 }] });
    row(v5.some((x) => x.includes('above WORKFLOW.ceiling.max')), `trip: a ceiling above ${CEILING_MAX} is refused`);
    const v6 = validate({ name: 'norun', steps: [{ name: 'a' }] });
    row(v6.some((x) => x.includes('run is missing')), 'trip: a step without run is refused');
    let refused = false;
    try { await run(write('bad.workflow.json', { name: 'bad', steps: [{ name: 'a', run: 'node -e "1" &' }] })); } catch (e) { refused = /refused by validate/.test(e.message); }
    row(refused, 'a file validate refuses is never run (LAW.WF.6)');
    const dry = await run(good, { dry: true });
    row(dry.verdict === 'pass' && dry.steps.every((s) => s.status === 'skipped' && s.ceiling === CEILING_DEFAULT), `a dry run lists every step with its ceiling and runs none (${dry.steps.length} steps, ceiling ${CEILING_DEFAULT} s)`);
  } finally {
    const gone = removeDir(dir);
    row(gone, 'nothing was left behind: the fixture directory could be removed after the ceiling trip (the process tree died with the step)');
  }
  return { bad, rows };
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [a, b, c] = process.argv.slice(2);
  if (a === 'controls') {
    const r = await controls();
    for (const x of r.rows) console.log(x);
    console.log(`workflow controls: ${r.bad ? `${r.bad} failing` : 'ok (0 failing)'}, ceiling ${CEILING_DEFAULT} s (max ${CEILING_MAX}), ${MAX_STEPS} steps at most, forbidden ${FORBIDDEN.length} patterns`);
    process.exit(r.bad ? 1 : 0);
  } else if (a === 'validate' && b) {
    const { findings } = load(b);
    for (const f of findings) console.log('  refused: ' + f);
    console.log(findings.length ? `validate: ${findings.length} finding(s)` : 'validate: sound');
    process.exit(findings.length ? 1 : 0);
  } else if (a === 'run' && b) {
    const r = await run(b, { dry: c === '--dry' });
    for (const l of lines(r)) console.log(l);
    process.exit(r.verdict === 'pass' ? 0 : 1);
  } else { console.log('usage: node lib/workflow.mjs validate <file> | run <file> [--dry] | controls'); process.exit(2); }
}
