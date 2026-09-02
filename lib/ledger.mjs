// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/ledger.mjs
// Where the Adiutor keeps its state, and how a ledger line is read.
//
// Shared by bin/adiutor.mjs (the hooks, which write the ledger) and
// monitors/commander-adiutor.mjs (the monitor, which only reads it). One
// resolver, so both sides open the same file under the same environment:
//   CLAUDE_CONFIG_DIR  overrides ~/.claude
//   ROT_DTD_STATE      overrides <claude dir>/rot-dtd-commander
// RECORD_FIELDS is the ten-field RECORD.run of dtd/adiutor.dtd, in order;
// control C7 proves the two lists are equal.

import { mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import os from 'node:os';

export const RECORD_FIELDS = ['ts', 'session', 'command', 'root', 'expected', 'tools', 'errors', 'status', 'findings', 'prescription'];
const CDATA_FIELDS = new Set(['expected', 'errors', 'findings', 'prescription']);

export function claudeDir() {
  return process.env.CLAUDE_CONFIG_DIR ? presolve(process.env.CLAUDE_CONFIG_DIR) : join(os.homedir(), '.claude');
}

export function stateDir() {
  const d = process.env.ROT_DTD_STATE ? presolve(process.env.ROT_DTD_STATE) : join(claudeDir(), 'rot-dtd-commander');
  mkdirSync(join(d, 'runs'), { recursive: true });
  return d;
}

export function ledgerPath() {
  return join(stateDir(), 'ledger.tsv');
}

export function safeId(s) {
  const t = String(s || '').replace(/[^A-Za-z0-9-]/g, '');
  return (t || 'unknown').slice(0, 64);
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

// One line. Returns { row } when it carries exactly the ten fields, or
// { bad: { columns } } when it does not. Blank lines and '#' comments are
// neither: null.
export function parseLedgerLine(line) {
  if (!line.trim() || line.startsWith('#')) return null;
  const cols = line.split('\t');
  if (cols.length !== RECORD_FIELDS.length) return { bad: { columns: cols.length } };
  const row = {};
  RECORD_FIELDS.forEach((k, j) => {
    row[k] = CDATA_FIELDS.has(k) ? safeParse(cols[j]) : cols[j];
  });
  return { row };
}

export function parseLedger(text) {
  const rows = [];
  const bad = [];
  for (const [i, line] of text.split('\n').entries()) {
    const r = parseLedgerLine(line);
    if (!r) continue;
    if (r.bad) bad.push({ line: i + 1, columns: r.bad.columns });
    else rows.push(r.row);
  }
  return { rows, bad };
}
