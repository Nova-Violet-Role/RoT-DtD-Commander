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
//   hookEntries(hookRoot)         -> the events and commands the Adiutor registers
//
// Contract (each line has a control in bin/adiutor.mjs controls):
//   backs up first and prints the restore command
//   additive merge only: parse, append, write back; never a template rewrite
//   preserves every key it did not add, deep-compared after re-reading from disk
//   auto-restores the backup on any deviation
//   idempotent by command string
//   never leaves the settings directory

import { readFileSync, writeFileSync, existsSync, copyFileSync, statSync, chmodSync } from 'node:fs';

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
  const raw = readFileSync(path, 'utf8').replace(/^﻿/, '');
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
