#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// monitors/commander-adiutor.mjs
// The Commander-Adiutor monitor. A persistent process that tails the
// Adiutor ledger and hands every failed run to the session as it closes.
//
// This is not the Adiutor. bin/adiutor.mjs holds the hooks: it opens a run,
// judges the answer at Stop and appends one ledger line. This file never
// reads a transcript, never judges anything and never writes; it reads
// ledger.tsv and prints. Every stdout line is a notification in the session
// (the Claude Code Monitor contract), so it prints only what needs acting on:
//
//   MONITOR.fail       one line per run that closed as fail
//   MONITOR.malformed  one line per ledger line that is not the ten-field RECORD.run
//
// and nothing for a pass. Both templates are declared in dtd/adiutor.dtd;
// control C12 in bin/adiutor.mjs trips this monitor on purpose and holds the
// printed lines to those templates.
//
//   node commander-adiutor.mjs [--poll <ms>] [--once] [--from-start]
//     default   start at the current end of the ledger, poll every 1000 ms
//     --once    read the whole ledger from the top, print, exit 0
//   stderr carries one 'watching <path>' line at start; stderr is not a
//   notification.
//
// Started by Claude Code from monitors/monitors.json when this repository is
// installed as a plugin, or from the skills-directory plugin that rdc install
// writes under <target>/skills/rot-dtd-commander-adiutor/. By hand: rdc watch.

import { statSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { resolve as presolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ledgerPath, parseLedgerLine, RECORD_FIELDS } from '../lib/ledger.mjs';

export const MONITOR_NAME = 'commander-adiutor';
export const DOCTOR = '/RoT-DtD-Commander-Adiutor';

export function failLine(command, finding) {
  return `Adiutor: /${command} failed at Stop: ${finding}. Run ${DOCTOR}.`;
}
export function malformedLine(line, columns) {
  return `Adiutor: ledger line ${line} malformed (${columns} fields, expected ${RECORD_FIELDS.length}). Run rdc doctor.`;
}

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
};
const POLL = Math.max(50, Number(opt('--poll', 1000)) || 1000);
const ONCE = args.includes('--once');
const FROM_START = ONCE || args.includes('--from-start');

const path = ledgerPath();
let offset = 0;
let lineNo = 0;
let carry = '';

function emit(s) {
  process.stdout.write(s + '\n');
}

function readFrom(from, to) {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(to - from);
    let got = 0;
    while (got < buf.length) {
      const n = readSync(fd, buf, got, buf.length - got, from + got);
      if (n === 0) break;
      got += n;
    }
    return buf.subarray(0, got).toString('utf8');
  } finally {
    closeSync(fd);
  }
}

function consume(text) {
  const parts = (carry + text).split('\n');
  carry = parts.pop();
  for (const line of parts) {
    lineNo++;
    const r = parseLedgerLine(line);
    if (!r) continue;
    if (r.bad) emit(malformedLine(lineNo, r.bad.columns));
    else if (r.row.status === 'fail') {
      const first = String(r.row.findings || '').split(' || ')[0].trim() || 'no finding recorded';
      emit(failLine(r.row.command, first));
    }
  }
}

function rewind() {
  offset = 0;
  lineNo = 0;
  carry = '';
}

function tick() {
  if (!existsSync(path)) {
    rewind();
    return;
  }
  const size = statSync(path).size;
  if (size < offset) rewind();
  if (size > offset) {
    const text = readFrom(offset, size);
    offset = size;
    consume(text);
  }
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  process.stdout.on('error', () => process.exit(0));
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => process.exit(0));

  if (existsSync(path) && !FROM_START) {
    const size = statSync(path).size;
    const lines = readFrom(0, size).split('\n');
    carry = lines.pop();
    lineNo = lines.length;
    offset = size;
  }
  if (ONCE) {
    tick();
    process.exit(0);
  }
  process.stderr.write(`${MONITOR_NAME}: watching ${path} (poll ${POLL} ms)\n`);
  setInterval(tick, POLL);
}
