// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/arm.mjs
// Additive, reversible hook registration in a Claude Code settings.json.
// Since 5.0.0 nothing calls this unless the operator asks (rdc arm, or
// install --arm): the Adiutor runs by hand by default. The Stop hook, when
// armed, ends at a 300 s ceiling.
//
//   armSettings(path, hookRoot)   -> { backup, added, unchanged }
//   disarmSettings(path)          -> { backup, removed }
//   mergeEnv(path, env)           -> { backup, added, kept, readOnly, created }   (9.1.0, dtd/claude-env.json)
//   envDrift(path, env)           -> { missing, differ, ok }
//   removeEnv(path, env, added)   -> { backup, removed, kept }
//   node lib/arm.mjs controls        the env path on a planted settings.json, six controls
//   hookEntries(hookRoot)         -> the events and commands the Adiutor registers
//
// Contract (each line has a control in bin/adiutor.mjs controls):
//   backs up first and prints the restore command
//   additive merge only: parse, append, write back; never a template rewrite
//   preserves every key it did not add, deep-compared after re-reading from disk
//   auto-restores the backup on any deviation
//   idempotent by command string
//   never leaves the settings directory

import { readFileSync, writeFileSync, existsSync, copyFileSync, statSync, chmodSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve as presolve } from 'node:path';

export const MARKER = 'adiutor.mjs" observe';

export const EVENTS = [
  ['SessionStart', 10],
  ['UserPromptSubmit', 10],
  ['PreToolUse', 5],
  ['PostToolUse', 10],
  ['PostToolUseFailure', 10],
  ['SubagentStop', 10],
  ['PreCompact', 10],
  ['Stop', 300],
  ['StopFailure', 10],
  ['SessionEnd', 10],
];

const NEEDS_MATCHER = new Set(['PreToolUse', 'PostToolUse', 'PostToolUseFailure']);

export function hookCommand(hookRoot, event) {
  const p = hookRoot.replace(/\\/g, '/');
  return `node "${p}/bin/adiutor.mjs" observe ${event}`;
}

export function hookEntries(hookRoot) {
  const out = {};
  for (const [event, timeout] of EVENTS) {
    const entry = { hooks: [{ type: 'command', command: hookCommand(hookRoot, event), timeout }] };
    if (NEEDS_MATCHER.has(event)) entry.matcher = '*';
    out[event] = entry;
  }
  return out;
}

function readJson(path) {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  return raw.trim() ? JSON.parse(raw) : {};
}

function stableStringify(v) {
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

// Everything in `settings` except entries whose command carries the marker.
function withoutOurs(settings) {
  const s = JSON.parse(JSON.stringify(settings));
  if (!s.hooks) return s;
  for (const ev of Object.keys(s.hooks)) {
    if (!Array.isArray(s.hooks[ev])) continue;
    s.hooks[ev] = s.hooks[ev].filter((e) => !(e && Array.isArray(e.hooks) && e.hooks.some((h) => typeof h.command === 'string' && h.command.includes(MARKER))));
    if (s.hooks[ev].length === 0) delete s.hooks[ev];
  }
  if (Object.keys(s.hooks).length === 0) delete s.hooks;
  return s;
}

function backupOf(path) {
  if (!existsSync(path)) return null;
  const b = `${path}.rot-dtd-commander.${Date.now()}.bak`;
  copyFileSync(path, b);
  return b;
}

// A settings.json that carries the read-only attribute (Windows `attrib +R`,
// or mode 0444 elsewhere) refuses every write with EPERM. The bit is a
// protection the user put there, so it is lifted for the one write and put
// back afterwards, and the caller reports that it was.
export function isReadOnly(path) {
  if (!existsSync(path)) return false;
  return (statSync(path).mode & 0o200) === 0;
}

function write(path, obj) {
  const ro = isReadOnly(path);
  if (ro) chmodSync(path, 0o644);
  try {
    writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  } finally {
    if (ro) chmodSync(path, 0o444);
  }
}

export function armSettings(path, hookRoot) {
  const before = readJson(path);
  const beforeStable = stableStringify(withoutOurs(before));
  const readOnly = isReadOnly(path);
  const backup = backupOf(path);
  const next = JSON.parse(JSON.stringify(before));
  next.hooks = next.hooks || {};
  let added = 0;
  let unchanged = 0;
  for (const [event, entry] of Object.entries(hookEntries(hookRoot))) {
    const list = Array.isArray(next.hooks[event]) ? next.hooks[event] : [];
    const cmd = entry.hooks[0].command;
    const present = list.some((e) => e && Array.isArray(e.hooks) && e.hooks.some((h) => h.command === cmd));
    if (present) unchanged++;
    else {
      list.push(entry);
      added++;
    }
    next.hooks[event] = list;
  }
  write(path, next);
  const after = readJson(path);
  if (stableStringify(withoutOurs(after)) !== beforeStable) {
    if (backup) copyFileSync(backup, path);
    throw new Error('arm: a key not added by the Adiutor changed after the write; backup restored');
  }
  for (const [event, entry] of Object.entries(hookEntries(hookRoot))) {
    const cmd = entry.hooks[0].command;
    const n = (after.hooks[event] || []).filter((e) => e && e.hooks && e.hooks.some((h) => h.command === cmd)).length;
    if (n !== 1) {
      if (backup) copyFileSync(backup, path);
      throw new Error(`arm: ${event} carries ${n} copies of the Adiutor hook after the write; backup restored`);
    }
  }
  return { backup, added, unchanged, readOnly };
}

// ----- the env block (9.1.0) -----
// dtd/claude-env.json ships the env keys a Commander session runs under. The
// installer merges them into settings.json under env; a key the user already
// set is kept and named, the uninstall removes exactly the keys the manifest
// says were added and leaves one the user changed since, and the doctor
// names the drift per key. The same discipline as the hooks: a backup first,
// the file re-read after the write, and nothing but ours may have changed.
function withoutEnvKeys(settings, keys) {
  const s = JSON.parse(JSON.stringify(settings));
  if (s.env && typeof s.env === 'object') {
    for (const k of keys) delete s.env[k];
    if (!Object.keys(s.env).length) delete s.env;
  }
  return s;
}
export function mergeEnv(path, env) {
  const keys = Object.keys(env);
  const created = !existsSync(path);
  const before = readJson(path);
  const beforeStable = stableStringify(withoutEnvKeys(before, keys));
  const readOnly = isReadOnly(path);
  const backup = backupOf(path);
  const next = JSON.parse(JSON.stringify(before));
  next.env = next.env && typeof next.env === 'object' && !Array.isArray(next.env) ? next.env : {};
  const added = [];
  const kept = [];
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(next.env, k)) kept.push(k);
    else { next.env[k] = env[k]; added.push(k); }
  }
  write(path, next);
  const after = readJson(path);
  if (stableStringify(withoutEnvKeys(after, keys)) !== beforeStable) {
    if (backup) copyFileSync(backup, path);
    throw new Error('env: a key not added by the Commander changed after the write; backup restored');
  }
  for (const k of added) {
    if (!after.env || after.env[k] !== env[k]) {
      if (backup) copyFileSync(backup, path);
      throw new Error(`env: ${k} did not land after the write; backup restored`);
    }
  }
  return { backup, added, kept, readOnly, created };
}
export function envDrift(path, env) {
  const s = readJson(path);
  const have = s.env && typeof s.env === 'object' && !Array.isArray(s.env) ? s.env : {};
  const missing = [];
  const differ = [];
  for (const k of Object.keys(env)) {
    if (!Object.prototype.hasOwnProperty.call(have, k)) missing.push(k);
    else if (String(have[k]) !== String(env[k])) differ.push(`${k}=${have[k]}`);
  }
  return { missing, differ, ok: missing.length === 0 && differ.length === 0 };
}
export function removeEnv(path, env, addedKeys) {
  if (!existsSync(path)) return { backup: null, removed: 0, kept: [] };
  const before = readJson(path);
  const beforeStable = stableStringify(withoutEnvKeys(before, addedKeys));
  const backup = backupOf(path);
  const next = JSON.parse(JSON.stringify(before));
  let removed = 0;
  const kept = [];
  if (next.env && typeof next.env === 'object') {
    for (const k of addedKeys) {
      if (!Object.prototype.hasOwnProperty.call(next.env, k)) continue;
      if (String(next.env[k]) === String(env[k])) { delete next.env[k]; removed++; } else kept.push(k);
    }
    if (!Object.keys(next.env).length) delete next.env;
  }
  write(path, next);
  const after = readJson(path);
  if (stableStringify(withoutEnvKeys(after, addedKeys)) !== beforeStable) {
    if (backup) copyFileSync(backup, path);
    throw new Error('env: a key not owned by the Commander changed; backup restored');
  }
  return { backup, removed, kept };
}

// The controls: a planted settings.json through merge, keep, drift and remove.
export function controls(io = console) {
  let ran = 0;
  let fail = 0;
  const say = (ok, t) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${t}`); if (!ok) fail++; };
  const env = { A_KEY: '1', B_KEY: '2', C_KEY: '3' };
  const d = mkdtempSync(join(tmpdir(), 'arm-env-'));
  const p = join(d, 'settings.json');
  try {
    const fresh = mergeEnv(p, env);
    const s1 = readJson(p);
    say(fresh.created && fresh.added.length === 3 && fresh.kept.length === 0 && s1.env && s1.env.A_KEY === '1' && s1.env.C_KEY === '3', `a settings.json that did not exist is created with the ${fresh.added.length} keys`);
    writeFileSync(p, JSON.stringify({ theme: 'dark', env: { A_KEY: 'mine', OTHER: 'x' } }, null, 2) + '\n', 'utf8');
    const kept = mergeEnv(p, env);
    const s2 = readJson(p);
    say(kept.added.join() === 'B_KEY,C_KEY' && kept.kept.join() === 'A_KEY' && s2.env.A_KEY === 'mine' && s2.env.OTHER === 'x' && s2.theme === 'dark' && kept.backup && existsSync(kept.backup), `a key the user set is kept and named (${kept.kept.join()}), a foreign key and a foreign setting untouched, a backup taken`);
    const drift = envDrift(p, env);
    say(!drift.ok && drift.missing.length === 0 && drift.differ.join() === 'A_KEY=mine', `trip: the drift names the differing key with its value: ${drift.differ.join()}`);
    const gone = removeEnv(p, env, ['B_KEY', 'C_KEY', 'A_KEY']);
    const s3 = readJson(p);
    say(gone.removed === 2 && gone.kept.join() === 'A_KEY' && s3.env.A_KEY === 'mine' && s3.env.OTHER === 'x' && !('B_KEY' in s3.env), `the removal takes exactly the keys added with their shipped values (${gone.removed}) and keeps the one the user changed (${gone.kept.join()})`);
    writeFileSync(p, JSON.stringify({ env: { A_KEY: '1' } }, null, 2) + '\n', 'utf8');
    const empty = removeEnv(p, env, ['A_KEY']);
    const s4 = readJson(p);
    say(empty.removed === 1 && !('env' in s4) && Object.keys(s4).length === 0, 'an env left empty by the removal is dropped, and the file is left to the caller');
    const none = envDrift(join(d, 'missing.json'), env);
    say(!none.ok && none.missing.length === 3, `trip: a settings.json that does not exist drifts by every key (${none.missing.length} missing)`);
  } finally { rmSync(d, { recursive: true, force: true }); }
  io.log(`arm controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

export function disarmSettings(path) {
  if (!existsSync(path)) return { backup: null, removed: 0 };
  const before = readJson(path);
  const readOnly = isReadOnly(path);
  const backup = backupOf(path);
  const next = withoutOurs(before);
  let removed = 0;
  for (const ev of Object.keys(before.hooks || {})) {
    const b = (before.hooks[ev] || []).length;
    const a = ((next.hooks || {})[ev] || []).length;
    removed += b - a;
  }
  write(path, next);
  const after = readJson(path);
  if (stableStringify(withoutOurs(after)) !== stableStringify(withoutOurs(before))) {
    if (backup) copyFileSync(backup, path);
    throw new Error('disarm: a key not owned by the Adiutor changed; backup restored');
  }
  return { backup, removed, readOnly };
}

export function armedIn(path) {
  const s = readJson(path);
  const out = [];
  for (const [ev, list] of Object.entries(s.hooks || {})) {
    if (Array.isArray(list) && list.some((e) => e && e.hooks && e.hooks.some((h) => typeof h.command === 'string' && h.command.includes(MARKER)))) out.push(ev);
  }
  return out;
}

if (process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'controls') process.exit(controls() ? 0 : 1);
  console.log('usage: node lib/arm.mjs controls');
  process.exit(2);
}
