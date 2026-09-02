#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/task.mjs
// The runtime of dtd/cc-task.dtd: a project's tasks folder and the registry
// that binds it. validate reads Task.json against the declaration (the keys,
// the enumerations, the step count a length allows, the variables); audit
// checks the registry against the folder in both directions (LAW.TASK.1);
// expand fills a step's dollar variables from the task's own vars alone
// (LAW.TASK.2); toWorkflow turns a task into a workflow the runner of
// lib/workflow.mjs walks (LAW.TASK.3); run does that in the foreground and
// appends the ledger (LAW.TASK.5). Every cap and name comes from the DTD.
//
//   validate(reg)              -> [findings]
//   load(dir)                  -> { reg, findings, path }
//   audit(dir)                 -> { entries: [{ name, state }], counts: { entries, files, drift } }
//   expand(run, vars)          -> { text, findings }
//   toWorkflow(task)           -> a workflow object, or throws on a refused variable
//   register(dir, task)        -> writes the registry entry and the created line
//   run(dir, name)             -> Promise of the workflow result; status and ledger updated
//   close(dir, name, status)   -> sets done, blocked or handed_off and appends the event
//   controls()                 -> Promise of every refusal tripped on purpose
//
//   node lib/task.mjs validate <dir> | audit <dir> | run <dir> <name> | close <dir> <name> <status> [detail] | controls

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { join, dirname, basename, resolve as presolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { validate as wfValidate, run as wfRun } from './workflow.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = readFileSync(join(ROOT, 'dtd', 'cc-task.dtd'), 'utf8');
const NL = String.fromCharCode(10);
const TAB = String.fromCharCode(9);

function ent(name) {
  const m = new RegExp('<!ENTITY\\s+' + name.replace(/\./g, '\\.') + '\\s+"([^"]*)"').exec(DTD);
  if (!m) throw new Error(`cc-task.dtd declares no ${name}`);
  return m[1];
}
function enumOf(element, attr) {
  const m = new RegExp('<!ATTLIST\\s+' + element + '\\b[\\s\\S]*?\\b' + attr + '\\s+\\(([^)]+)\\)').exec(DTD);
  if (!m) throw new Error(`cc-task.dtd declares no ${element} ${attr} enumeration`);
  return m[1].split('|').map((s) => s.trim());
}
const list = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

export const DIR = ent('TASK.dir');
export const FILE = ent('TASK.file');
export const LEDGER = basename(ent('TASK.ledger'));
export const KEYS = list(ent('TASK.keys'));
export const STEP_KEYS = list(ent('TASK.step.keys'));
export const VARS = list(ent('TASK.vars'));
export const NEVER = list(ent('TASK.never'));
export const EVENTS = list(ent('TASK.events'));
export const RECORD_FIELDS = list(ent('TASK.record.fields')).map((f) => f.replace(/^\d+\s+/, ''));
export const STATUSES = enumOf('task', 'status');
export const LENGTHS = enumOf('task', 'length');
export const SCHEMATICS = enumOf('task', 'schematic');
export const STEPS_MAX = Object.fromEntries(LENGTHS.map((l) => [l, Number(ent('TASK.steps.' + l))]));
const TOKEN = /^[A-Za-z_][\w.-]*$/;

// ---------- expand (LAW.TASK.2) ----------
export function expand(run, vars = {}) {
  const findings = [];
  const text = String(run).replace(/\$\{?([A-Za-z_][A-Za-z_0-9]*)\}?/g, (whole, name) => {
    if (NEVER.includes(name)) { findings.push(`$${name} is named in TASK.never and never expands`); return whole; }
    if (!VARS.includes(name)) { findings.push(`$${name} is not a variable of TASK.vars (${VARS.join(', ')})`); return whole; }
    if (!(name in vars)) { findings.push(`$${name} is declared by TASK.vars but not set on this task`); return whole; }
    return String(vars[name]);
  });
  return { text, findings };
}

// ---------- validate (the declaration, LAW.TASK.2, LAW.TASK.6) ----------
export function validateTask(t, i) {
  const f = [];
  const at = `task ${i + 1}${t && t.name ? ' (' + t.name + ')' : ''}`;
  if (!t || typeof t !== 'object' || Array.isArray(t)) return [`${at} is not an object`];
  for (const k of Object.keys(t)) if (!KEYS.includes(k)) f.push(`${at}: key ${k} is outside TASK.keys (${KEYS.join(', ')})`);
  if (typeof t.name !== 'string' || !TOKEN.test(t.name)) f.push(`${at}: name is missing or not a token`);
  if (t.status !== undefined && !STATUSES.includes(t.status)) f.push(`${at}: status ${t.status} is outside ${STATUSES.join('|')}`);
  const length = t.length === undefined ? LENGTHS[0] : t.length;
  if (!LENGTHS.includes(length)) f.push(`${at}: length ${t.length} is outside ${LENGTHS.join('|')}`);
  if (t.schematic !== undefined && !SCHEMATICS.includes(t.schematic)) f.push(`${at}: schematic ${t.schematic} is outside ${SCHEMATICS.join('|')}`);
  if (t.schema !== undefined && (typeof t.schema !== 'string' || !TOKEN.test(t.schema))) f.push(`${at}: schema is not a token`);
  if (typeof t.file !== 'string' || !t.file) f.push(`${at}: file is missing`);
  if (typeof t.created !== 'string' || !t.created) f.push(`${at}: created is missing`);
  const vars = t.vars || {};
  if (typeof vars !== 'object' || Array.isArray(vars)) f.push(`${at}: vars is not an object`);
  else for (const [k, v] of Object.entries(vars)) {
    if (!VARS.includes(k)) f.push(`${at}: var ${k} is not in TASK.vars (${VARS.join(', ')})`);
    if (typeof v !== 'string') f.push(`${at}: var ${k} is not a string`);
  }
  const steps = t.steps || [];
  if (!Array.isArray(steps)) f.push(`${at}: steps is not an array`);
  else {
    const cap = STEPS_MAX[length] || STEPS_MAX[LENGTHS[0]];
    if (steps.length > cap) f.push(`${at}: ${steps.length} steps, above the ${cap} a ${length} task allows (TASK.lengths)`);
    steps.forEach((s, j) => {
      const sat = `${at} step ${j + 1}`;
      if (!s || typeof s !== 'object') { f.push(`${sat} is not an object`); return; }
      for (const k of Object.keys(s)) if (!STEP_KEYS.includes(k)) f.push(`${sat}: key ${k} is outside TASK.step.keys (${STEP_KEYS.join(', ')})`);
      if (typeof s.run !== 'string' || !s.run.trim()) f.push(`${sat}: run is missing`);
      else for (const x of expand(s.run, vars).findings) f.push(`${sat}: ${x}`);
      if (s.ceiling_secs !== undefined && !(Number.isInteger(Number(s.ceiling_secs)) && Number(s.ceiling_secs) > 0)) f.push(`${sat}: ceiling_secs is not a positive integer`);
      if (s.expect_exit !== undefined && !Number.isInteger(Number(s.expect_exit))) f.push(`${sat}: expect_exit is not an integer`);
    });
  }
  return f;
}

export function validate(reg) {
  if (!reg || typeof reg !== 'object' || Array.isArray(reg)) return ['the registry is not a JSON object'];
  const f = [];
  for (const k of Object.keys(reg)) if (k !== 'tasks') f.push(`key ${k} is outside the registry shape (tasks)`);
  if (!Array.isArray(reg.tasks)) { f.push('tasks is missing or not an array'); return f; }
  const names = new Set();
  reg.tasks.forEach((t, i) => {
    for (const x of validateTask(t, i)) f.push(x);
    if (t && typeof t.name === 'string') { if (names.has(t.name)) f.push(`task ${t.name} is registered twice`); names.add(t.name); }
  });
  return f;
}

export function load(dir) {
  const path = join(presolve(dir), FILE);
  if (!existsSync(path)) return { reg: { tasks: [] }, findings: [], path, absent: true };
  let reg;
  try { reg = JSON.parse(readFileSync(path, 'utf8')); } catch (e) { return { reg: null, findings: ['the registry is not JSON: ' + e.message], path }; }
  return { reg, findings: validate(reg), path };
}

function save(path, reg) {
  const out = JSON.stringify(reg, null, 2) + NL;
  if (out.includes('\r')) throw new Error('CR in the registry text');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, out, 'utf8');
}

// ---------- the ledger (LAW.TASK.5) ----------
export function ledger(dir, task, event, detail = '') {
  if (!EVENTS.includes(event)) throw new Error(`event ${event} is not one of TASK.events (${EVENTS.join(', ')})`);
  const p = join(presolve(dir), LEDGER);
  mkdirSync(dirname(p), { recursive: true });
  appendFileSync(p, [new Date().toISOString(), task, event, String(detail).replace(/[\t\n\r]+/g, ' ')].join(TAB) + NL, 'utf8');
  return p;
}

// ---------- audit (LAW.TASK.1) ----------
export function audit(dir) {
  const d = presolve(dir);
  const { reg, findings } = load(d);
  const entries = [];
  const declared = new Set();
  const skip = new Set([FILE, LEDGER]);
  for (const t of (reg && reg.tasks) || []) {
    if (!t || typeof t.file !== 'string') continue;
    declared.add(basename(t.file));
    entries.push({ name: t.name, state: existsSync(join(d, t.file)) ? 'declared_and_present' : 'declared_and_missing', file: t.file });
  }
  const files = existsSync(d) ? readdirSync(d).filter((f) => !skip.has(f) && !f.endsWith('.workflow.json') && !f.startsWith('.')) : [];
  for (const f of files) if (!declared.has(f)) entries.push({ name: f.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_.-]/g, '_'), state: 'present_and_orphan', file: f });
  const drift = entries.filter((e) => e.state !== 'declared_and_present').length;
  return { entries, counts: { entries: declared.size, files: files.length, drift }, findings };
}

// ---------- register ----------
export function register(dir, task) {
  const d = presolve(dir);
  const { reg, findings } = load(d);
  if (!reg) throw new Error('refused: ' + findings.join('; '));
  const t = { status: 'open', length: LENGTHS[0], schematic: 'nt', schema: 'none', vars: {}, steps: [], created: new Date().toISOString(), ...task };
  const f = validateTask(t, reg.tasks.length);
  if (reg.tasks.some((x) => x && x.name === t.name)) f.push(`task ${t.name} is registered already`);
  if (f.length) throw new Error('refused: ' + f.join('; '));
  reg.tasks.push(t);
  save(join(d, FILE), reg);
  ledger(d, t.name, 'created', t.file);
  return t;
}

// ---------- toWorkflow (LAW.TASK.3) and run ----------
export function toWorkflow(task) {
  const steps = (task.steps || []).map((s, i) => {
    const e = expand(s.run, task.vars || {});
    if (e.findings.length) throw new Error(`step ${i + 1}: ` + e.findings.join('; '));
    const step = { name: 'step' + (s.n !== undefined ? s.n : i + 1), run: e.text };
    if (s.ceiling_secs !== undefined) step.ceiling_secs = Number(s.ceiling_secs);
    if (s.expect_exit !== undefined) step.expect_exit = Number(s.expect_exit);
    return step;
  });
  const w = { name: task.name, on_fail: 'stop', steps };
  const f = wfValidate(w);
  if (f.length) throw new Error('the workflow of ' + task.name + ' is refused: ' + f.join('; '));
  return w;
}

export async function run(dir, name) {
  const d = presolve(dir);
  const { reg, findings, path } = load(d);
  if (!reg || findings.length) throw new Error('refused: ' + findings.join('; '));
  const t = reg.tasks.find((x) => x && x.name === name);
  if (!t) throw new Error(`no task ${name} in ${FILE}`);
  if (!t.steps || !t.steps.length) throw new Error(`task ${name} has no steps to run`);
  const w = toWorkflow(t);
  const wpath = join(d, name + '.workflow.json');
  writeFileSync(wpath, JSON.stringify(w, null, 2) + NL, 'utf8');
  ledger(d, name, 'run', `${w.steps.length} step(s) through ${basename(wpath)}`);
  t.status = 'running';
  save(path, reg);
  const r = await wfRun(wpath, { base: d });
  t.status = r.verdict === 'pass' ? 'done' : 'blocked';
  save(path, reg);
  ledger(d, name, t.status, r.steps.map((s) => `${s.name} exit ${s.exit} ${s.status}`).join('; '));
  return r;
}

// ---------- close (task-handoff, LAW.TASK.5) ----------
export function close(dir, name, status, detail = '') {
  if (!['done', 'blocked', 'handed_off'].includes(status)) throw new Error(`status ${status} is not an outcome (done, blocked, handed_off)`);
  const d = presolve(dir);
  const { reg, findings, path } = load(d);
  if (!reg || findings.length) throw new Error('refused: ' + findings.join('; '));
  const t = reg.tasks.find((x) => x && x.name === name);
  if (!t) throw new Error(`no task ${name} in ${FILE}`);
  const before = t.status;
  t.status = status;
  save(path, reg);
  ledger(d, name, status, detail || `${before} to ${status}`);
  return { before, after: status };
}

// ---------- controls ----------
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function removeDir(dir) {
  for (let i = 0; i < 20; i++) { try { rmSync(dir, { recursive: true, force: true }); return true; } catch (e) { sleep(250); } }
  return false;
}

export async function controls() {
  const rows = [];
  let bad = 0;
  const row = (ok, msg) => { if (!ok) bad++; rows.push(`  ${ok ? 'PASS' : 'FAIL'} ${msg}`); };
  const dir = join(tmpdir(), 'rot-dtd-task-controls-' + process.pid, DIR);
  mkdirSync(dir, { recursive: true });
  try {
    row(STEPS_MAX.short === 1 && STEPS_MAX.medium === 5 && STEPS_MAX.long === 12 && VARS.length === 9 && NEVER.length === 3, `the caps come from the DTD: short ${STEPS_MAX.short}, medium ${STEPS_MAX.medium}, long ${STEPS_MAX.long} steps; ${VARS.length} variables, ${NEVER.length} never`);
    writeFileSync(join(dir, 'alpha.nt'), 'title:' + NL + '  > alpha' + NL, 'utf8');
    writeFileSync(join(dir, 'beta.nt'), 'title:' + NL + '  > beta' + NL, 'utf8');
    register(dir, { name: 'alpha', file: 'alpha.nt', vars: { TASK: 'alpha', CEILING: '5' }, steps: [{ n: 1, run: 'node -e "process.exit(0)"', ceiling_secs: 5 }] });
    register(dir, { name: 'beta', file: 'beta.nt', length: 'medium', vars: { TASK: 'beta' }, steps: [{ n: 1, run: 'node -e "process.exit(2)"' }, { n: 2, run: 'node -e "process.exit(0)"' }] });
    const a1 = audit(dir);
    row(a1.counts.entries === 2 && a1.counts.drift === 0 && a1.entries.every((e) => e.state === 'declared_and_present'), `two registered tasks with their files audit clean: entries ${a1.counts.entries}, files ${a1.counts.files}, drift ${a1.counts.drift}`);
    unlinkSync(join(dir, 'beta.nt'));
    writeFileSync(join(dir, 'stray.md'), '# stray' + NL, 'utf8');
    const a2 = audit(dir);
    row(a2.counts.drift === 2 && a2.entries.some((e) => e.name === 'beta' && e.state === 'declared_and_missing') && a2.entries.some((e) => e.state === 'present_and_orphan'), `trip: a missing file and a stray file are both reported: drift ${a2.counts.drift} (${a2.entries.filter((e) => e.state !== 'declared_and_present').map((e) => e.name + ' ' + e.state).join(', ')})`);
    writeFileSync(join(dir, 'beta.nt'), 'title:' + NL + '  > beta' + NL, 'utf8');
    unlinkSync(join(dir, 'stray.md'));
    const e1 = expand('run $TASK for ${LENGTH}', { TASK: 'alpha', LENGTH: 'short' });
    row(e1.text === 'run alpha for short' && e1.findings.length === 0, `expand fills declared and set variables: ${e1.text}`);
    const e2 = expand('echo $ARGUMENTS', { TASK: 'x' });
    row(e2.findings.some((x) => x.includes('TASK.never')), `trip: $ARGUMENTS never expands: ${e2.findings[0] || 'nothing'}`);
    const e3 = expand('echo $FOO', { TASK: 'x' });
    row(e3.findings.some((x) => x.includes('not a variable of TASK.vars')), `trip: a variable outside TASK.vars is refused: ${e3.findings[0] || 'nothing'}`);
    const e4 = expand('echo $OWNER', { TASK: 'x' });
    row(e4.findings.some((x) => x.includes('not set')), `trip: a declared but unset variable is refused: ${e4.findings[0] || 'nothing'}`);
    const v1 = validate({ tasks: [{ name: 'over', file: 'over.nt', created: 'now', length: 'short', steps: [{ run: 'node -e "1"' }, { run: 'node -e "1"' }] }] });
    row(v1.some((x) => x.includes('above the 1')), `trip: a short task with two steps is refused: ${v1[0] || 'nothing'}`);
    const v2 = validate({ tasks: [{ name: 'st', file: 'st.nt', created: 'now', status: 'paused' }] });
    row(v2.some((x) => x.includes('status paused')), 'trip: a status outside the enumeration is refused');
    const v3 = validate({ tasks: [{ name: 'vv', file: 'vv.nt', created: 'now', vars: { FOO: 'x' } }] });
    row(v3.some((x) => x.includes('var FOO is not in TASK.vars')), 'trip: a variable outside TASK.vars on a task is refused');
    const v4 = validate({ tasks: [{ name: 'kk', file: 'kk.nt', created: 'now', priority: 1 }], extra: true });
    row(v4.some((x) => x.includes('key priority')) && v4.some((x) => x.includes('key extra')), 'trip: an unknown key on a task and on the registry is refused by name');
    let dup = false;
    try { register(dir, { name: 'alpha', file: 'alpha.nt' }); } catch (e) { dup = /registered already/.test(e.message); }
    row(dup, 'trip: registering a name twice is refused');
    const w = toWorkflow(load(dir).reg.tasks[0]);
    row(w.steps.length === 1 && w.steps[0].name === 'step1' && wfValidate(w).length === 0, `toWorkflow yields a workflow the runner validates: ${w.steps.length} step, on_fail ${w.on_fail}`);
    const r1 = await run(dir, 'alpha');
    const reg1 = load(dir).reg;
    row(r1.verdict === 'pass' && reg1.tasks[0].status === 'done', `a task runs in the foreground through the workflow runner and lands done: ${r1.steps.map((s) => s.name + ' exit ' + s.exit).join(', ')}`);
    const r2 = await run(dir, 'beta');
    const reg2 = load(dir).reg;
    row(r2.verdict === 'fail' && reg2.tasks[1].status === 'blocked' && r2.steps[1].status === 'skipped', `trip: a failing step blocks the task and skips the rest: ${r2.steps.map((s) => s.name + ' ' + s.status).join(', ')}`);
    const lines = readFileSync(join(dir, LEDGER), 'utf8').split(NL).filter(Boolean);
    const events = lines.map((l) => l.split(TAB)[2]);
    row(lines.every((l) => l.split(TAB).length === RECORD_FIELDS.length) && events.filter((e) => e === 'created').length === 2 && events.includes('run') && events.includes('done') && events.includes('blocked'), `the ledger has ${lines.length} lines of ${RECORD_FIELDS.length} fields: ${events.join(', ')}`);
    let bad_ev = false;
    try { ledger(dir, 'alpha', 'paused'); } catch (e) { bad_ev = /TASK.events/.test(e.message); }
    row(bad_ev, 'trip: an event outside TASK.events is refused');
    const c1 = close(dir, 'beta', 'handed_off', 'to the next session');
    const after = load(dir).reg.tasks[1].status;
    row(c1.before === 'blocked' && after === 'handed_off' && readFileSync(join(dir, LEDGER), 'utf8').split(NL).filter(Boolean).pop().split(TAB)[2] === 'handed_off', `close sets the status through the registry and appends the event: ${c1.before} to ${after}`);
    let badClose = false;
    try { close(dir, 'beta', 'open'); } catch (e) { badClose = /not an outcome/.test(e.message); }
    row(badClose, 'trip: close refuses a status that is not an outcome');
  } finally {
    const gone = removeDir(dirname(dir));
    row(gone, 'nothing was left behind: the fixture directory could be removed');
  }
  return { bad, rows };
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [a, b, c] = process.argv.slice(2);
  if (a === 'controls') {
    const r = await controls();
    for (const x of r.rows) console.log(x);
    console.log(`task controls: ${r.bad ? `${r.bad} failing` : 'ok (0 failing)'}, ${VARS.length} variables, steps ${LENGTHS.map((l) => l + ' ' + STEPS_MAX[l]).join(', ')}, ${STATUSES.length} statuses`);
    process.exit(r.bad ? 1 : 0);
  } else if (a === 'validate' && b) {
    const { findings, absent } = load(b);
    if (absent) console.log(`validate: no ${FILE} under ${b}`);
    for (const f of findings) console.log('  refused: ' + f);
    console.log(findings.length ? `validate: ${findings.length} finding(s)` : 'validate: sound');
    process.exit(findings.length ? 1 : 0);
  } else if (a === 'audit' && b) {
    const r = audit(b);
    for (const e of r.entries) console.log(`  ${e.state === 'declared_and_present' ? 'ok     ' : 'DRIFT  '} ${e.name}: ${e.state} (${e.file})`);
    for (const f of r.findings) console.log('  refused: ' + f);
    console.log(`audit: ${r.counts.entries} entries, ${r.counts.files} files, drift ${r.counts.drift}`);
    process.exit(r.counts.drift || r.findings.length ? 1 : 0);
  } else if (a === 'run' && b && c) {
    const r = await run(b, c);
    for (const s of r.steps) console.log(`  step ${s.name}: exit ${s.exit} status ${s.status} ${s.ms} ms`);
    console.log(`task ${c}: ${r.verdict}`);
    process.exit(r.verdict === 'pass' ? 0 : 1);
  } else if (a === 'close' && b && c && process.argv[5]) {
    const r = close(b, c, process.argv[5], process.argv.slice(6).join(' '));
    console.log(`task ${c}: ${r.before} to ${r.after}`);
    process.exit(0);
  } else { console.log('usage: node lib/task.mjs validate <dir> | audit <dir> | run <dir> <name> | close <dir> <name> <done|blocked|handed_off> [detail] | controls'); process.exit(2); }
}
