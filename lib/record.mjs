#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/record.mjs
// The record nesting of dtd/cc-record.dtd, read at Stop by the Adiutor
// (LAW.REC.5, LAW.REC.6). A command declares command-info-types before it
// includes cc-record: record when its run writes a record file under
// RECORD.dir with the command's own name, no-record-nesting when it writes
// none; a RECORD.* entity that names a file declares that file instead. This
// module reads the declaration from a command file, finds the run's record,
// checks its name (the command's own, or a spelled ordinal from
// lib/ordinals.mjs), its frontmatter fields against the declaration, and its
// body as a revision history with evidence, and returns findings of kind
// record. The names and shapes come from the DTD.
//
//   nestingOf(text)            -> 'record' | 'no-record-nesting' | null (not declared)
//   declaredRecords(text)      -> [{ name, kind, file, fields: [{ n, name, model, since }] }]
//   findRecord(dir, command, since) -> { path, file, ordinal, nameOk, mtime } | null
//   checkRecord(text, decl)    -> [findings] on the file's shape
//   recordFindings(cwd, run)   -> [{ kind: 'record', msg }] for the Adiutor
//   controls()                 -> every refusal tripped on purpose
//
//   node lib/record.mjs check <command-file> <cwd> [opened-iso] | controls

import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs';
import { join, dirname, resolve as presolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { parse as parseOrdinal, greek } from './ordinals.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = readFileSync(join(ROOT, 'dtd', 'cc-record.dtd'), 'utf8');
const NL = String.fromCharCode(10);

function ent(name) {
  const m = new RegExp('<!ENTITY\\s+' + name.replace(/\./g, '\\.') + '\\s+"([^"]*)"').exec(DTD);
  if (!m) throw new Error(`cc-record.dtd declares no ${name}`);
  return m[1];
}
export const RECORD_DIR = ent('RECORD.dir');
export const NESTING_DEFAULT = (/<!ENTITY\s+%\s+command-info-types\s+"([^"]*)"/.exec(DTD) || [, 'record'])[1];
export const NO_NESTING = 'no-record-nesting';
export const EVIDENCE_KINDS = (/<!ATTLIST evidence kind \(([^)]+)\)/.exec(DTD) || [, 'file|exit|line|note'])[1].split('|');

function internalSubset(text) {
  const m = /<!DOCTYPE\s+[^\[]*\[([\s\S]*?)\]\s*>/.exec(text);
  return m ? m[1] : '';
}

// LAW.REC.5: the declaration a command makes before the include, or null.
export function nestingOf(text) {
  const sub = internalSubset(text);
  const m = /<!ENTITY\s+%\s+command-info-types\s+"([^"]*)"/.exec(sub);
  if (!m) return null;
  return m[1].trim() === NO_NESTING ? NO_NESTING : 'record';
}

// RECORD.<name> "kind|file|1=a:MODEL@since|2=b:MODEL@since|..." in the internal subset.
export function declaredRecords(text) {
  const sub = internalSubset(text);
  const out = [];
  for (const m of sub.matchAll(/<!ENTITY\s+RECORD\.([\w.-]+)\s+"([^"]*)"/g)) {
    const parts = m[2].split('|');
    if (parts.length < 3) continue;
    const fields = parts.slice(2).map((p) => { const f = /^(\d+)=(\w+):(\w+)@(\d+)$/.exec(p.trim()); return f ? { n: Number(f[1]), name: f[2], model: f[3], since: Number(f[4]) } : null; }).filter(Boolean);
    out.push({ name: m[1], kind: parts[0], file: parts[1], fields });
  }
  return out;
}

// The newest file under dir named command.md or command.<ordinal>.md.
export function findRecord(dir, command, since = 0) {
  if (!existsSync(dir)) return null;
  const re = new RegExp('^' + command.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&') + '(?:\\.([a-z-]+))?\\.md$');
  let best = null;
  for (const f of readdirSync(dir)) {
    const m = re.exec(f);
    if (!m) continue;
    const p = join(dir, f);
    const mtime = statSync(p).mtimeMs;
    // LAW.IUPAC.7: the ordinal is the Greek spelling (duo, never di); a token the parser knows under the other system is still refused here
    const n = m[1] ? parseOrdinal(m[1]) : null;
    const nameOk = !m[1] || (n !== null && greek(n) === m[1]);
    if (!best || mtime > best.mtime) best = { path: p, file: f, ordinal: m[1] || null, nameOk, mtime };
  }
  if (best) best.stale = since > 0 && best.mtime < since;
  return best;
}

// LAW.REC.6: the frontmatter fields in declared order, then the revision history.
export function checkRecord(text, decl = null) {
  const f = [];
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!fm) { f.push('no frontmatter block at the top'); }
  else if (decl && decl.fields.length) {
    const keys = fm[1].split(NL).map((l) => (/^([A-Za-z_][\w-]*):/.exec(l) || [])[1]).filter(Boolean);
    let last = -1;
    for (const field of decl.fields) {
      const i = keys.indexOf(field.name);
      if (i < 0) { f.push(`field ${field.n} ${field.name} of RECORD.${decl.name} is missing from the frontmatter`); continue; }
      if (i < last) f.push(`field ${field.n} ${field.name} is out of the declared order`);
      last = Math.max(last, i);
    }
  }
  const body = fm ? text.slice(fm[0].length) : text;
  const heads = [...body.matchAll(/^### revision (\d+)/gm)];
  if (!heads.length) { f.push('no revision heading in the body (RECORD.revision.heading)'); return f; }
  heads.forEach((h, i) => {
    if (Number(h[1]) !== i + 1) f.push(`revision ${h[1]} breaks the dense numbering from 1`);
    const end = i + 1 < heads.length ? heads[i + 1].index : body.length;
    const block = body.slice(h.index, end);
    const ev = [...block.matchAll(/^- evidence (\w+):/gm)];
    if (!ev.length) f.push(`revision ${h[1]} carries no evidence line (RECORD.evidence.line)`);
    for (const e of ev) if (!EVIDENCE_KINDS.includes(e[1])) f.push(`revision ${h[1]}: evidence kind ${e[1]} is not one of ${EVIDENCE_KINDS.join(', ')}`);
  });
  return f;
}

// What the Adiutor asks at Stop. run: { command, opened, nesting, records }.
export function recordFindings(cwd, run) {
  const nesting = run.nesting || null;
  const decls = run.records || [];
  const since = run.opened ? Date.parse(run.opened) : 0;
  const out = [];
  const say = (msg) => out.push({ kind: 'record', msg: 'record: ' + msg });
  // a RECORD.* entity that names a plain file declares that file (add-to-todos and TO-DOS.md)
  for (const d of decls) {
    if (!d.file || /[<*%]/.test(d.file) || d.file === 'ledger.tsv') continue;
    const p = join(cwd, d.file);
    if (!existsSync(p)) { say(`RECORD.${d.name} names ${d.file}, which does not exist after the run (LAW.REC.5)`); continue; }
    if (since && statSync(p).mtimeMs < since) say(`RECORD.${d.name} names ${d.file}, which was not written since the run opened`);
  }
  if (nesting !== 'record') return out;
  const dir = join(cwd, RECORD_DIR, run.command);
  const found = findRecord(dir, run.command, since);
  if (!found) { say(`no record file under ${RECORD_DIR}/${run.command}/ named after the command (LAW.REC.6)`); return out; }
  if (found.stale) say(`${found.file} predates the run; the record was not written in this run`);
  if (!found.nameOk) say(`${found.file} carries ${found.ordinal}, which is not a spelled ordinal (LAW.IUPAC.7)`);
  for (const m of checkRecord(readFileSync(found.path, 'utf8'), decls.find((d) => !d.file || /[<*%]/.test(d.file)) || decls[0] || null)) say(m);
  return out;
}

// ---------- controls ----------
function sleep(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function removeDir(dir) { for (let i = 0; i < 20; i++) { try { rmSync(dir, { recursive: true, force: true }); return true; } catch (e) { sleep(250); } } return false; }

export function controls() {
  const rows = [];
  let bad = 0;
  const row = (ok, msg) => { if (!ok) bad++; rows.push(`  ${ok ? 'PASS' : 'FAIL'} ${msg}`); };
  const cwd = join(tmpdir(), 'rot-dtd-record-controls-' + process.pid);
  const dir = join(cwd, RECORD_DIR, 'x-dtd');
  mkdirSync(dir, { recursive: true });
  const opened = new Date(Date.now() - 60000).toISOString();
  const sound = '---' + NL + 'name: x' + NL + 'date: 2026-09-03' + NL + '---' + NL + '### revision 1 (2026-09-03): did the thing' + NL + '- evidence file: a.md re-read, 12 bytes' + NL;
  try {
    const cmd = (pre, rec) => '<!DOCTYPE x [' + NL + (pre ? '  <!ENTITY % command-info-types "' + pre + '">' + NL : '') + '  <!ENTITY % cc-record SYSTEM "../../dtd/cc-record.dtd">' + NL + '  %cc-record;' + NL + (rec ? '  <!ENTITY RECORD.x "x|artifacts/x-dtd/x-dtd.md|1=name:PCDATA@1|2=date:PCDATA@1">' + NL : '') + ']>' + NL;
    row(nestingOf(cmd('record')) === 'record' && nestingOf(cmd(NO_NESTING)) === NO_NESTING && nestingOf(cmd(null)) === null, 'nestingOf reads record, no-record-nesting, and null when nothing is declared');
    const decl = declaredRecords(cmd('record', true))[0];
    row(decl && decl.name === 'x' && decl.fields.length === 2 && decl.fields[1].name === 'date', `declaredRecords reads RECORD.x with ${decl ? decl.fields.length : 0} fields`);
    const run = { command: 'x-dtd', opened, nesting: 'record', records: [{ name: 'x', kind: 'x', file: 'artifacts/x-dtd/x-dtd.md', fields: decl.fields }] };
    row(recordFindings(cwd, { ...run, nesting: NO_NESTING, records: [] }).length === 0, 'no-record-nesting expects nothing');
    row(recordFindings(cwd, { ...run, nesting: null, records: [] }).length === 0, 'a command that declares nothing is asked nothing');
    const f1 = recordFindings(cwd, run);
    row(f1.length >= 1 && f1.every((x) => x.kind === 'record') && f1.some((x) => /no record file/.test(x.msg)), `trip: a record expected and none written is a record finding: ${f1[0] ? f1[0].msg : 'nothing'}`);
    // each fixture file is stamped one second after the last, so the newest is never a tie
    let stamp = Date.now();
    const put = (name, text) => { const p = join(dir, name); writeFileSync(p, text, 'utf8'); stamp += 1000; const t = new Date(stamp); utimesSync(p, t, t); return p; };
    put('x-dtd.md', sound);
    const f2 = recordFindings(cwd, run);
    row(f2.length === 0, `a sound record passes: ${f2.map((x) => x.msg).join('; ') || 'no finding'}`);
    put(`x-dtd.${greek(2)}.md`, sound);
    const f3 = recordFindings(cwd, run);
    row(f3.length === 0, `a second file with a spelled ordinal (${greek(2)}) passes`);
    const di = put('x-dtd.di.md', sound);
    const f4 = recordFindings(cwd, run);
    row(f4.some((x) => /not a spelled ordinal/.test(x.msg)), `trip: the IUPAC di in place of ${greek(2)} is refused: ${f4[0] ? f4[0].msg : 'nothing'}`);
    rmSync(di);
    const third = `x-dtd.${greek(3)}.md`;
    put(third, '---' + NL + 'name: x' + NL + '---' + NL + '### revision 1 (2026-09-03): did' + NL + '- evidence file: a' + NL);
    const f5 = recordFindings(cwd, run);
    row(f5.some((x) => /field 2 date .* missing/.test(x.msg)) && !f5.some((x) => /not a spelled ordinal/.test(x.msg)), `trip: a missing declared field is reported on ${third}: ${f5[0] ? f5[0].msg : 'nothing'}`);
    put(third, '---' + NL + 'name: x' + NL + 'date: d' + NL + '---' + NL + 'nothing happened' + NL);
    const f6 = recordFindings(cwd, run);
    row(f6.some((x) => /no revision heading/.test(x.msg)), 'trip: a body with no revision is reported');
    put(third, '---' + NL + 'name: x' + NL + 'date: d' + NL + '---' + NL + '### revision 1 (d): did' + NL + 'no list line' + NL + '### revision 3 (d): skipped two' + NL + '- evidence guess: x' + NL);
    const f7 = recordFindings(cwd, run);
    row(f7.some((x) => /carries no evidence line/.test(x.msg)) && f7.some((x) => /breaks the dense numbering/.test(x.msg)) && f7.some((x) => /evidence kind guess/.test(x.msg)), 'trip: a revision without evidence, a gap in the numbering and an unknown evidence kind are each reported');
    const old = new Date(Date.now() - 7200000);
    utimesSync(join(dir, third), old, old);
    // the newest by time is now the duo file (stamped later than the aged third), and it is sound
    const f8 = recordFindings(cwd, run);
    row(f8.length === 0, 'an aged file drops out of the newest position and the sound newer one is judged');
    for (const f of readdirSync(dir)) { const t = new Date(Date.now() - 7200000); utimesSync(join(dir, f), t, t); }
    const f9s = recordFindings(cwd, { ...run, opened: new Date(Date.now() - 3600000).toISOString() });
    row(f9s.some((x) => /predates the run/.test(x.msg)), `trip: a record older than the run is reported stale: ${f9s[0] ? f9s[0].msg : 'nothing'}`);
    const todoRun = { command: 'add-to-todos-dtd', opened, nesting: null, records: [{ name: 'todo', kind: 'todo', file: 'TO-DOS.md', fields: [] }] };
    const f9 = recordFindings(cwd, todoRun);
    row(f9.some((x) => /does not exist after the run/.test(x.msg)), `trip: a RECORD.* file that does not exist after the run is reported: ${f9[0] ? f9[0].msg : 'nothing'}`);
    writeFileSync(join(cwd, 'TO-DOS.md'), '- a todo' + NL, 'utf8');
    row(recordFindings(cwd, todoRun).length === 0, 'a RECORD.* file written in the run passes');
  } finally {
    row(removeDir(cwd), 'nothing was left behind: the fixture directory could be removed');
  }
  return { bad, rows };
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [a, b, c, d] = process.argv.slice(2);
  if (a === 'controls') {
    const r = controls();
    for (const x of r.rows) console.log(x);
    console.log(`record controls: ${r.bad ? `${r.bad} failing` : 'ok (0 failing)'}, dir ${RECORD_DIR}, evidence kinds ${EVIDENCE_KINDS.join(', ')}`);
    process.exit(r.bad ? 1 : 0);
  } else if (a === 'check' && b && c) {
    const text = readFileSync(presolve(b), 'utf8');
    const command = b.replace(/\\/g, '/').split('/').pop().replace(/\.md$/, '');
    const run = { command, opened: d || null, nesting: nestingOf(text), records: declaredRecords(text) };
    const f = recordFindings(c, run);
    console.log(`nesting: ${run.nesting || 'not declared'}; records declared: ${run.records.map((r) => r.name).join(', ') || 'none'}`);
    for (const x of f) console.log('  ' + x.msg);
    console.log(f.length ? `record check: ${f.length} finding(s)` : 'record check: sound');
    process.exit(f.length ? 1 : 0);
  } else { console.log('usage: node lib/record.mjs check <command-file> <cwd> [opened-iso] | controls'); process.exit(2); }
}
