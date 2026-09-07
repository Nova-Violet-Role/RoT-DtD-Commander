// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// cache.mjs : the save choice of the gate (cc-cache.dtd).
//
// A gated command that is answered `save` writes what it holds into one
// NestedText file under CACHE.dir, reads the file back whole, and stops. The
// next call of the same command starts from that file. Everything the
// contract fixes is read from dtd/cc-cache.dtd here: the directory, the
// form, the eight fields and their order, the stale threshold, the byte
// ceiling, the guards and the reasons. The nt guards themselves are the ones
// lib/form.mjs checks for every form (depth, tabs); this module adds the
// reader and the writer form.mjs never needed, because a guard reads a text
// and a cache has to be built from a state and given back as one.
//
// The reader is the NestedText the writer emits and nothing more: dicts,
// lists, single-line and multiline strings, comments. Inline lists and dicts
// exist in NestedText 3 and are refused here by name, so a file that reaches
// this reader was written by this writer or by a hand that stayed inside the
// three types. No value is ever typed: `1`, `true`, `null` and `!!python`
// come back as the strings they were, which is the whole reason the form was
// fixed (LAW.CACHE.6, LAW.CACHE.7).
//
// Usage: node lib/cache.mjs save <command> --state <state.json> [--root <dir>] [--reason user|size|token]
//        node lib/cache.mjs load <command> [--root <dir>]
//        node lib/cache.mjs consume <command> [--root <dir>]
//        node lib/cache.mjs controls

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { guards as formGuards, MAX_DEPTH } from './form.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DTD = readFileSync(join(HERE, '..', 'dtd', 'cc-cache.dtd'), 'utf8');
const SCHEMATIC_DTD = readFileSync(join(HERE, '..', 'dtd', 'cc-schematic.dtd'), 'utf8');

// The ten cells of the schematic column the form is held to (CACHE.schematic),
// read from cc-schematic.dtd: SCHEMA.<name>.literal to SCHEMA.<name>.binary.
export function schematicCells(name) {
  const cells = {};
  for (const m of SCHEMATIC_DTD.matchAll(new RegExp('<!ENTITY\\s+SCHEMA\\.' + name + '\\.([a-z]+)\\s+"([^"]*)"', 'g'))) cells[m[1]] = m[2];
  return cells;
}

function ent(name) {
  const m = new RegExp('<!ENTITY\\s+' + name.replace(/\./g, '\\.') + '\\s+"([^"]*)"').exec(DTD);
  if (!m) throw new Error(`cc-cache.dtd declares no ${name}`);
  return m[1];
}

export function contract() {
  const fields = ent('CACHE.fields').split('|');
  const laws = [...DTD.matchAll(/<!ENTITY LAW\.CACHE\.(\d+) /g)].map((m) => Number(m[1]));
  return {
    dir: ent('CACHE.dir'),
    form: ent('CACHE.form'),
    schematic: ent('CACHE.schematic'),
    fields,
    fieldsCount: Number(ent('CACHE.fields.count')),
    stale: Number(ent('CACHE.stale')),
    maxBytes: Number(ent('CACHE.max_bytes')),
    guards: ent('CACHE.guards').split('|'),
    reasons: ent('CACHE.reasons').split('|'),
    compact: ent('CACHE.compact'),
    laws,
  };
}

export const CONTRACT = contract();
// Two spaces: NestedText fixes no width, only consistency, and every space
// of indentation is weight the file carries on every nested line.
const INDENT = '  ';

// ----- the writer -----
// A key is one line, never starts like a list item, a string line, a comment
// or an inline collection, and never contains the colon-space that ends it.
function checkKey(key) {
  const k = String(key);
  if (!k.length) throw new Error('an empty key');
  if (/[\r\n]/.test(k)) throw new Error(`a key with a line break: ${JSON.stringify(k)}`);
  if (/^[-#>\[{]/.test(k)) throw new Error(`a key that starts like a list item, a string line, a comment or an inline collection: ${JSON.stringify(k)}`);
  if (/:\s|:$/.test(k)) throw new Error(`a key that contains a colon followed by a space or ending the key: ${JSON.stringify(k)}`);
  return k;
}

// A single-line string is written inline when it survives the reader's trim
// and cannot be mistaken for a collection; everything else goes multiline.
function inline(s) {
  return s.length > 0 && !/[\r\n]/.test(s) && s === s.trim() && !/^[\[{]/.test(s);
}

function emit(value, depth, out) {
  const pad = INDENT.repeat(depth);
  if (depth > MAX_DEPTH) throw new Error(`a value nested deeper than FORM.max_depth ${MAX_DEPTH}`);
  if (Array.isArray(value)) {
    if (!value.length) throw new Error('an empty list has no NestedText form here; write a string that says none');
    for (const item of value) {
      if (typeof item === 'string' && inline(item)) out.push(`${pad}- ${item}`);
      else if (typeof item === 'string') { out.push(`${pad}-`); emitString(item, depth + 1, out); }
      else { out.push(`${pad}-`); emit(item, depth + 1, out); }
    }
    return;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) throw new Error('an empty dict has no NestedText form here; write a string that says none');
    for (const key of keys) {
      const k = checkKey(key);
      const v = value[key];
      if (typeof v === 'string' && inline(v)) out.push(`${pad}${k}: ${v}`);
      else if (typeof v === 'string') { out.push(`${pad}${k}:`); emitString(v, depth + 1, out); }
      else { out.push(`${pad}${k}:`); emit(v, depth + 1, out); }
    }
    return;
  }
  if (typeof value === 'string') { emitString(value, depth, out); return; }
  throw new Error(`a value of type ${typeof value} has no NestedText form: every value is a string, a list or a dict`);
}

function emitString(s, depth, out) {
  const pad = INDENT.repeat(depth);
  for (const line of String(s).split('\n')) out.push(line.length ? `${pad}> ${line}` : `${pad}>`);
}

export function toNt(value, comment = null) {
  const out = [];
  if (comment) out.push(`# ${String(comment).replace(/[\r\n]+/g, ' ')}`);
  emit(value, 0, out);
  return out.join('\n') + '\n';
}

// ----- the reader -----
function classify(body) {
  if (body === '-' || body.startsWith('- ')) return { kind: 'list', rest: body === '-' ? null : body.slice(2) };
  if (body === '>' || body.startsWith('> ')) return { kind: 'string', rest: body === '>' ? '' : body.slice(2) };
  if (/^[\[{]/.test(body)) throw new Error(`an inline list or dict is not read here: ${JSON.stringify(body.slice(0, 40))}`);
  if (body.startsWith(':')) throw new Error(`a multiline key is not read here: ${JSON.stringify(body.slice(0, 40))}`);
  const m = /^(.*?):(?: (.*))?$/.exec(body);
  if (m && !/^(.*?): /.test(body) && !body.endsWith(':')) throw new Error(`a line that is neither a list item, a string line nor a dict item: ${JSON.stringify(body.slice(0, 40))}`);
  if (!m) throw new Error(`a line that is neither a list item, a string line nor a dict item: ${JSON.stringify(body.slice(0, 40))}`);
  // the key ends at the first colon that is followed by a space or ends the line
  const at = body.search(/:( |$)/);
  const key = body.slice(0, at);
  const rest = body[at + 1] === ' ' ? body.slice(at + 2) : null;
  return { kind: 'dict', key, rest };
}

function tokenize(text) {
  const rows = [];
  const lines = String(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].replace(/\r$/, '');
    if (!raw.trim()) continue;
    const ind = /^[ \t]*/.exec(raw)[0];
    if (ind.includes('\t')) throw new Error(`a tab in the indentation at line ${i + 1} (guard tabs)`);
    const body = raw.slice(ind.length);
    if (body.startsWith('#')) continue;
    rows.push({ line: i + 1, indent: ind.length, body });
  }
  return rows;
}

function parseBlock(rows, pos, indent, depth) {
  if (depth > MAX_DEPTH) throw new Error(`a block nested deeper than FORM.max_depth ${MAX_DEPTH} at line ${rows[pos].line} (guard depth)`);
  const first = classify(rows[pos].body);
  if (first.kind === 'string') {
    const parts = [];
    while (pos < rows.length && rows[pos].indent === indent) {
      const c = classify(rows[pos].body);
      if (c.kind !== 'string') throw new Error(`a string block mixed with a ${c.kind} item at line ${rows[pos].line}`);
      parts.push(c.rest);
      pos++;
    }
    if (pos < rows.length && rows[pos].indent > indent) throw new Error(`an indented line under a string block at line ${rows[pos].line}`);
    return { value: parts.join('\n'), pos };
  }
  const value = first.kind === 'list' ? [] : {};
  while (pos < rows.length && rows[pos].indent === indent) {
    const c = classify(rows[pos].body);
    if (c.kind !== first.kind) throw new Error(`a ${first.kind} block mixed with a ${c.kind} item at line ${rows[pos].line}`);
    pos++;
    let item;
    if (c.rest !== null) {
      item = c.rest.trim();
      // NestedText 3 reads a value that opens with a bracket or a brace as an
      // inline list or dict; this reader has no such type, so it refuses the
      // line instead of reading a collection as a string.
      if (/^[\[{]/.test(item)) throw new Error(`an inline list or dict is not read here: ${JSON.stringify(item.slice(0, 40))} at line ${rows[pos - 1].line}`);
      if (pos < rows.length && rows[pos].indent > indent) throw new Error(`an indented line under an inline value at line ${rows[pos].line}`);
    } else {
      if (pos >= rows.length || rows[pos].indent <= indent) item = '';
      else {
        const r = parseBlock(rows, pos, rows[pos].indent, depth + 1);
        item = r.value;
        pos = r.pos;
      }
    }
    if (first.kind === 'list') value.push(item);
    else {
      if (Object.prototype.hasOwnProperty.call(value, c.key)) throw new Error(`a key given twice: ${JSON.stringify(c.key)} at line ${rows[pos - 1].line}`);
      value[c.key] = item;
    }
  }
  if (pos < rows.length && rows[pos].indent > indent) throw new Error(`an indentation that belongs to no item at line ${rows[pos].line}`);
  return { value, pos };
}

export function fromNt(text) {
  const rows = tokenize(text);
  if (!rows.length) return '';
  if (rows[0].indent !== 0) throw new Error(`the first item is indented at line ${rows[0].line}`);
  const r = parseBlock(rows, 0, 0, 0);
  if (r.pos < rows.length) throw new Error(`a line after the top-level block at line ${rows[r.pos].line}`);
  return r.value;
}

// ----- the file -----
function checkName(command) {
  const c = String(command || '').replace(/^\//, '');
  if (!/^[A-Za-z][\w-]*$/.test(c)) throw new Error(`a command name that is not a name: ${JSON.stringify(command)}`);
  return c;
}

export function cachePath(command, root = process.cwd()) {
  return join(resolve(root), CONTRACT.dir, `${checkName(command)}.nt`);
}

function relPath(command) {
  return `${CONTRACT.dir}/${checkName(command)}.nt`;
}

function heldGuards(text) {
  const rows = formGuards(text, CONTRACT.form);
  const names = rows.map((r) => r.name);
  for (const g of CONTRACT.guards) if (!names.includes(g)) throw new Error(`form.mjs checks no guard ${g} for the ${CONTRACT.form} form`);
  const failed = rows.filter((r) => !r.held);
  return { guards: CONTRACT.guards.join('|'), held: failed.length === 0, detail: failed.length ? failed.map((r) => `${r.name}: ${r.detail}`).join('; ') : rows.map((r) => `${r.name}: ${r.detail}`).join('; ') };
}

function fieldsOf(data) {
  return CONTRACT.fields.map((name, i) => ({ n: i + 1, name, value: data[name] }));
}

// The state a run hands the engine is NestedText too: the run writes its
// task, slots, answers, gate and next as the three types, and the engine
// reads that file in one gulp before it writes the canonical one. A state
// in JSON is refused by name, because the release that built this saved its
// first cache through a JSON file in a scratch directory, which is the one
// form the subset exists to keep out of the loop (LAW.CACHE.7).
export function readState(path) {
  if (/\.json$/i.test(path)) throw new Error(`a state in JSON is refused: ${path}; write the state as NestedText (.nt), the form the cache is read in`);
  const text = readFileSync(path, 'utf8');
  const g = heldGuards(text);
  if (!g.held) throw new Error(`a guard did not hold on the state ${path}: ${g.detail}`);
  const data = fromNt(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`the state ${path} is not a dict of task, slots, answers, gate and next`);
  return data;
}

// Answers arrive in any of the three shapes NestedText can carry: a list of
// header and answer dicts, a dict keyed by number and header (the cache's
// own shape), or a dict keyed by header alone.
function normaliseAnswers(a) {
  if (Array.isArray(a)) return a.map((x) => (x && typeof x === 'object' ? { header: String(x.header || ''), answer: String(x.answer || '') } : { header: '', answer: '' }));
  if (a && typeof a === 'object') {
    return Object.entries(a).map(([k, v]) => {
      const m = /^\d+\s+(.*)$/.exec(k);
      return { header: m ? m[1] : k, answer: typeof v === 'string' ? v : JSON.stringify(v) };
    });
  }
  return [];
}

// Build the eight fields in declared order from a state, refusing what the
// contract does not admit. The state carries task, slots, answers, gate and
// next; command, saved and reason are set here.
export function stateToFields(command, state, { now = new Date(), reason = 'user' } = {}) {
  const c = checkName(command);
  if (!CONTRACT.reasons.includes(reason)) throw new Error(`a reason the contract does not name: ${JSON.stringify(reason)} (CACHE.reasons ${CONTRACT.reasons.join('|')})`);
  const s = { ...(state || {}) };
  s.answers = normaliseAnswers(s.answers);
  if (typeof s.task !== 'string' || !s.task.trim()) throw new Error('a state without a task');
  if (!s.slots || typeof s.slots !== 'object' || Array.isArray(s.slots) || !Object.keys(s.slots).length) throw new Error('a state without known slots');
  if (!Array.isArray(s.answers) || !s.answers.length) throw new Error('a state without answers; a run with no answer has nothing to save');
  for (const a of s.answers) {
    if (!a || typeof a.header !== 'string' || !a.header || typeof a.answer !== 'string') throw new Error('an answer without a header and an answer string');
  }
  const g = s.gate || {};
  const gate = { choice: String(g.choice || 'save'), round: String(g.round || '1'), adds: String(g.adds || '0'), impactfuls: String(g.impactfuls || '0') };
  if (typeof s.next !== 'string' || !s.next.trim()) throw new Error('a state without a next step');
  // One line per answer: the key is the answer's number and its header, so a
  // header a later round repeats (Gate, Other) never collides, and the value
  // is the answer as typed. A list of header and answer pairs cost three
  // lines and two keys per answer and weighed more than the markdown.
  const answers = {};
  s.answers.forEach((a, i) => { answers[`${i + 1} ${a.header}`] = a.answer; });
  const data = {
    command: c,
    saved: new Date(now).toISOString(),
    reason,
    task: String(s.task),
    slots: Object.fromEntries(Object.entries(s.slots).map(([k, v]) => [k, String(v)])),
    answers,
    gate,
    next: String(s.next),
  };
  return data;
}

// The answers of a loaded cache as the pairs a resume reads: number, header, answer.
export function answersOf(data) {
  return Object.entries(data.answers || {}).map(([k, v]) => {
    const m = /^(\d+) (.*)$/.exec(k);
    return { n: m ? Number(m[1]) : 0, header: m ? m[2] : k, answer: v };
  });
}

export function save(command, state, { root = process.cwd(), now = new Date(), reason = 'user' } = {}) {
  const data = stateToFields(command, state, { now, reason });
  // No comment line: the first field names the command and the form is
  // fixed by the contract, so a comment would repeat what the file says.
  const text = toNt(data);
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes > CONTRACT.maxBytes) throw new Error(`a cache of ${bytes} bytes is over CACHE.max_bytes ${CONTRACT.maxBytes}; the save is not done`);
  const g = heldGuards(text);
  if (!g.held) throw new Error(`a guard did not hold: ${g.detail}; the save is not done`);
  const file = cachePath(command, root);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text, 'utf8');
  const back = readFileSync(file);
  const equal = back.equals(Buffer.from(text, 'utf8'));
  let parsedBack = null;
  try { parsedBack = fromNt(back.toString('utf8')); } catch (e) { parsedBack = { error: e.message }; }
  const same = equal && JSON.stringify(parsedBack) === JSON.stringify(data);
  if (!same) throw new Error(`the file read back differs from the file written: ${equal ? 'the fields differ' : 'the bytes differ'}; the save is not done`);
  return { file: relPath(command), path: file, bytes, state: 'saved', fields: fieldsOf(data), reread: { ...g, bytesEqual: equal, fieldsEqual: true } };
}

export function load(command, { root = process.cwd(), now = new Date() } = {}) {
  const file = cachePath(command, root);
  if (!existsSync(file)) return null;
  const buf = readFileSync(file);
  const text = buf.toString('utf8');
  const bytes = buf.length;
  if (bytes > CONTRACT.maxBytes) throw new Error(`a cache of ${bytes} bytes is over CACHE.max_bytes ${CONTRACT.maxBytes}; refused`);
  const g = heldGuards(text);
  if (!g.held) throw new Error(`a guard did not hold on ${relPath(command)}: ${g.detail}; refused`);
  const data = fromNt(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${relPath(command)} is not a dict of fields; refused`);
  const keys = Object.keys(data);
  const want = CONTRACT.fields;
  if (keys.length !== want.length || keys.some((k, i) => k !== want[i])) {
    throw new Error(`${relPath(command)} carries the fields ${keys.join('|')}; the contract fixes ${want.join('|')} in that order; refused`);
  }
  if (data.command !== checkName(command)) throw new Error(`${relPath(command)} names the command ${JSON.stringify(data.command)}; refused`);
  if (!CONTRACT.reasons.includes(data.reason)) throw new Error(`${relPath(command)} carries a reason the contract does not name: ${JSON.stringify(data.reason)}; refused`);
  const saved = Date.parse(data.saved);
  if (!Number.isFinite(saved)) throw new Error(`${relPath(command)} carries no readable saved instant; refused`);
  const ageDays = (new Date(now).getTime() - saved) / 86400000;
  const state = ageDays > CONTRACT.stale ? 'stale' : 'resumed';
  return { file: relPath(command), path: file, bytes, state, ageDays: Math.round(ageDays * 100) / 100, data, fields: fieldsOf(data), reread: { ...g, bytesEqual: true, fieldsEqual: true } };
}

export function consume(command, { root = process.cwd() } = {}) {
  const file = cachePath(command, root);
  if (!existsSync(file)) return false;
  unlinkSync(file);
  return true;
}

// ----- the rendering -----
// The cache element as the Intake heading carries it: one line per field,
// the reread, and, on a save, CACHE.compact as the last line of the answer.
function oneLine(v) {
  if (typeof v === 'string') return v.replace(/\s+/g, ' ').trim();
  if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? '' : 's'}: ` + v.map((x) => (typeof x === 'string' ? x : Object.values(x).join(' = '))).join('; ').replace(/\s+/g, ' ');
  return Object.entries(v).map(([k, x]) => `${k} ${oneLine(x)}`).join(', ');
}

export function render(result) {
  const lines = [];
  lines.push(`- cache: \`${result.file}\` ${result.bytes} bytes, form nt, state ${result.state}${result.state === 'stale' ? ` (saved ${result.ageDays} days ago, over CACHE.stale ${CONTRACT.stale})` : ''}`);
  for (const f of result.fields) lines.push(`  - ${f.n} ${f.name}: ${oneLine(f.value).slice(0, 200)}`);
  lines.push(`  - reread: guards ${result.reread.guards.replace('|', ', ')} held ${result.reread.held ? 'yes' : 'no'}; bytes equal ${result.reread.bytesEqual ? 'yes' : 'no'}; fields equal ${result.reread.fieldsEqual ? 'yes' : 'no'}`);
  if (result.state === 'saved') lines.push('', CONTRACT.compact);
  return lines.join('\n');
}

// The markdown the same eight fields would take in an answer: the heading,
// the bold field lines, the numbered answers, the same command, instant and
// reason. Measured against the nt in the controls, because LAW.CACHE.7 says
// lighter and a claim is measured, not asserted.
export function markdownOf(data) {
  const out = ['### ❔ Intake', ''];
  out.push(`**Command:** /${data.command}, saved ${data.saved}, reason ${data.reason}`, '');
  out.push(`**Task:** ${data.task}`, '');
  out.push('**Known slots:**', '');
  for (const [k, v] of Object.entries(data.slots)) out.push(`- **${k}**: ${v}`);
  out.push('', '**Answers:**', '');
  for (const a of answersOf(data)) out.push(`${a.n}. **${a.header}** — ${a.answer}`);
  out.push('', `**Gate:** \`${data.gate.choice}\` (round ${data.gate.round}, adds ${data.gate.adds}, impactfuls ${data.gate.impactfuls})`, '');
  out.push(`**Next:** ${data.next}`, '');
  return out.join('\n');
}

// ----- controls -----
function sampleState() {
  return {
    task: 'Add a fifth gate choice to every gated command.\n\nIt saves the run and stops.',
    slots: { what: 'the save choice', who: 'every command that includes cc-ask', why: 'a context that only grows loses what it did not choose' },
    answers: [
      { header: 'Release', answer: 'In 9.0.0, before the tag' },
      { header: 'What saves', answer: 'all 3 of them together, in NestedText' },
      { header: 'Enforce', answer: 'a completely new law: 1 = true = null = !!python/object' },
    ],
    gate: { choice: 'save', round: '1', adds: '0', impactfuls: '0' },
    next: 'write lib/cache.mjs, then the sweep',
  };
}

export function controls() {
  const rows = [];
  let pass = 0;
  let fail = 0;
  const control = (name, fn) => {
    try {
      const r = fn();
      const ok = r === true || (r && r.ok);
      rows.push(`  ${ok ? 'PASS' : 'FAIL'} ${name}${r && r.detail ? ` (${r.detail})` : ''}`);
      ok ? pass++ : fail++;
    } catch (e) {
      rows.push(`  FAIL ${name} (threw: ${e.message})`);
      fail++;
    }
  };
  const c = CONTRACT;
  control('the contract is read whole: dir, form nt, eight fields in order, stale, ceiling, guards, reasons, eight laws', () => ({
    ok: c.dir === 'artifacts/cache' && c.form === 'nt' && c.fields.length === 8 && c.fieldsCount === 8 && c.fields.join('|') === 'command|saved|reason|task|slots|answers|gate|next' && c.stale === 7 && c.maxBytes === 16384 && c.guards.join('|') === 'depth|tabs' && c.reasons.join('|') === 'user|size|token' && c.laws.length === 8 && c.laws.every((n, i) => n === i + 1),
    detail: `${c.fields.length} fields, stale ${c.stale}, ${c.maxBytes} bytes, laws ${c.laws.join(',')}`,
  }));
  control('the writer is held to the nt schematic of cc-schematic: ten cells read, the literal an angle bracket per line, the comment a hash, every other cell none, and the emitted text carries only those constructs', () => {
    const cells = schematicCells(c.schematic);
    const names = ['literal', 'expanded', 'reference', 'definition', 'escape', 'comment', 'include', 'conditional', 'type', 'binary'];
    const read = names.every((n) => typeof cells[n] === 'string');
    const none = ['expanded', 'reference', 'definition', 'escape', 'include', 'conditional', 'type', 'binary'].every((n) => /^none\b/.test(cells[n] || ''));
    const literal = /angle bracket per line/.test(cells.literal || '');
    const comment = /hash/.test(cells.comment || '');
    const data = stateToFields('ask-me-many-questions-dtd', sampleState(), { now: new Date('2026-09-07T01:00:00Z') });
    const text = toNt(data, 'held to the schematic');
    // Every line is one of the five NestedText constructs or a comment; a
    // multiline string is the literal the cell declares; nothing on any line
    // is a tag, an anchor, an alias, an include, a conditional or a type.
    const lines = text.split('\n').filter((l) => l.length);
    const shapes = lines.every((l) => /^\s*(#.*|-( .*)?|>( .*)?|[^\s#>\-\[{][^\n]*?:( .*)?)$/.test(l));
    const literalLines = lines.filter((l) => /^\s*>/.test(l));
    const literalHeld = literalLines.length >= 3 && literalLines.every((l) => /^\s*>( |$)/.test(l));
    const noneHeld = !lines.some((l) => /^\s*(!|&|\*|%|<!|@include|#if|!!)/.test(l.replace(/^\s*(-|>)\s?/, '')));
    return { ok: c.schematic === 'nt' && read && none && literal && comment && shapes && literalHeld && noneHeld, detail: `${Object.keys(cells).length} cells, ${lines.length} lines, ${literalLines.length} literal lines, shapes ${shapes}, none ${noneHeld}` };
  });
  control('a dict, a list of dicts, a nested dict and a multiline string with a blank line round-trip through toNt and fromNt', () => {
    const x = { a: 'one', b: { c: 'two', d: ['x', { e: 'y', f: 'line one\n\nline three' }] }, g: 'trailing space kept ' };
    const back = fromNt(toNt(x, 'a comment'));
    return { ok: JSON.stringify(back) === JSON.stringify(x), detail: JSON.stringify(back).slice(0, 80) };
  });
  control('no value is ever typed: 1, true, null, an anchor and a python tag come back as the strings they were', () => {
    const x = { a: '1', b: 'true', c: 'null', d: '&anchor *ref', e: '!!python/object:os.system', f: '${HOME}' };
    const back = fromNt(toNt(x));
    return { ok: Object.entries(x).every(([k, v]) => back[k] === v && typeof back[k] === 'string'), detail: Object.values(back).join(' | ') };
  });
  control('a tab in the indentation is refused by the reader and by the guard', () => {
    let threw = '';
    try { fromNt('a:\n\tb: c\n'); } catch (e) { threw = e.message; }
    const g = formGuards('a:\n\tb: c\n', 'nt').find((r) => r.name === 'tabs');
    return { ok: /tab/.test(threw) && g && !g.held, detail: threw };
  });
  control(`a block nested deeper than FORM.max_depth ${MAX_DEPTH} is refused by name`, () => {
    let v = 'leaf';
    for (let i = 0; i <= MAX_DEPTH + 1; i++) v = { k: v };
    let threw = '';
    try { toNt(v); } catch (e) { threw = e.message; }
    return { ok: /max_depth/.test(threw), detail: threw };
  });
  control('an inline list, an inline dict and a multiline key are refused by the reader by name', () => {
    const msgs = [];
    for (const t of ['a: [1, 2]\n', 'a:\n    {b: c}\n', ': key\n    > v\n']) { try { fromNt(t); msgs.push('read'); } catch (e) { msgs.push(e.message); } }
    return { ok: /inline/.test(msgs[0]) && /inline/.test(msgs[1]) && /multiline key/.test(msgs[2]), detail: msgs.join(' / ').slice(0, 120) };
  });
  control('a key with a colon-space, a key that starts like an item and an empty collection are refused by the writer', () => {
    const msgs = [];
    for (const v of [{ 'a: b': 'x' }, { '- a': 'x' }, { a: [] }, { a: {} }]) { try { toNt(v); msgs.push('wrote'); } catch (e) { msgs.push(e.message); } }
    return { ok: /colon/.test(msgs[0]) && /starts like/.test(msgs[1]) && /empty list/.test(msgs[2]) && /empty dict/.test(msgs[3]), detail: msgs.map((m) => m.slice(0, 30)).join(' / ') };
  });
  const root = mkdtempSync(join(tmpdir(), 'cc-cache-'));
  try {
    control('save writes the file under CACHE.dir, reads it back byte-equal, holds both guards and carries the eight fields dense in order', () => {
      const r = save('ask-me-many-questions-dtd', sampleState(), { root, now: new Date('2026-09-07T01:00:00Z') });
      const dense = r.fields.every((f, i) => f.n === i + 1 && f.name === c.fields[i]);
      return { ok: r.state === 'saved' && r.file === 'artifacts/cache/ask-me-many-questions-dtd.nt' && existsSync(r.path) && r.reread.held && r.reread.bytesEqual && dense && r.bytes > 0, detail: `${r.bytes} bytes, ${r.reread.detail}` };
    });
    control('load returns the same fields with state resumed, and the instruction inside an answer is still the string it was', () => {
      const r = load('ask-me-many-questions-dtd', { root, now: new Date('2026-09-08T01:00:00Z') });
      const a = r ? answersOf(r.data) : [];
      return { ok: r && r.state === 'resumed' && a.length === 3 && a[2].n === 3 && a[2].header === 'Enforce' && a[2].answer === 'a completely new law: 1 = true = null = !!python/object' && r.data.task.includes('\n\n') && r.data.gate.choice === 'save', detail: `${r && r.state}, age ${r && r.ageDays} days, ${a.length} answers` };
    });
    control(`a cache saved more than CACHE.stale ${c.stale} days ago loads with state stale, never refused`, () => {
      const r = load('ask-me-many-questions-dtd', { root, now: new Date('2026-09-15T01:00:01Z') });
      return { ok: r && r.state === 'stale' && r.ageDays > c.stale, detail: `age ${r && r.ageDays} days` };
    });
    control('the nt cache weighs less than the markdown of the same eight fields, on the sample and on a thirty-answer state', () => {
      const data = stateToFields('ask-me-many-questions-dtd', sampleState(), { now: new Date('2026-09-07T01:00:00Z') });
      const nt = Buffer.byteLength(toNt(data), 'utf8');
      const md = Buffer.byteLength(markdownOf(data), 'utf8');
      const big = sampleState();
      big.answers = Array.from({ length: 30 }, (_, i) => ({ header: `Q${i + 1}`, answer: `answer number ${i + 1}, chosen from four options and Other` }));
      const bd = stateToFields('ask-me-many-questions-dtd', big, { now: new Date('2026-09-07T01:00:00Z') });
      const bnt = Buffer.byteLength(toNt(bd), 'utf8');
      const bmd = Buffer.byteLength(markdownOf(bd), 'utf8');
      return { ok: nt < md && bnt < bmd, detail: `sample nt ${nt} < md ${md}: ${nt < md}; thirty answers nt ${bnt} < md ${bmd}: ${bnt < bmd}` };
    });
    control('a state over CACHE.max_bytes, a reason the contract does not name, and a state without answers are refused by name and nothing is written', () => {
      const msgs = [];
      const big = { ...sampleState(), task: 'x'.repeat(c.maxBytes) };
      try { save('big-dtd', big, { root }); msgs.push('saved'); } catch (e) { msgs.push(e.message); }
      try { save('why-dtd', sampleState(), { root, reason: 'boredom' }); msgs.push('saved'); } catch (e) { msgs.push(e.message); }
      try { save('mute-dtd', { ...sampleState(), answers: [] }, { root }); msgs.push('saved'); } catch (e) { msgs.push(e.message); }
      const none = !existsSync(cachePath('big-dtd', root)) && !existsSync(cachePath('why-dtd', root)) && !existsSync(cachePath('mute-dtd', root));
      return { ok: /max_bytes/.test(msgs[0]) && /reason/.test(msgs[1]) && /answers/.test(msgs[2]) && none, detail: msgs.map((m) => m.slice(0, 40)).join(' / ') };
    });
    control('a file whose fields are missing, reordered or under another command name is refused by name', () => {
      const msgs = [];
      mkdirSync(join(root, c.dir), { recursive: true });
      writeFileSync(join(root, c.dir, 'short-dtd.nt'), 'command: short-dtd\nsaved: 2026-09-07T01:00:00Z\n', 'utf8');
      writeFileSync(join(root, c.dir, 'other-dtd.nt'), toNt({ ...stateToFields('else-dtd', sampleState()) }), 'utf8');
      for (const n of ['short-dtd', 'other-dtd']) { try { load(n, { root }); msgs.push('loaded'); } catch (e) { msgs.push(e.message); } }
      return { ok: /fields/.test(msgs[0]) && /names the command/.test(msgs[1]), detail: msgs.map((m) => m.slice(0, 50)).join(' / ') };
    });
    control('consume deletes the file, a second consume is false, and load then returns null', () => {
      const a = consume('ask-me-many-questions-dtd', { root });
      const b = consume('ask-me-many-questions-dtd', { root });
      return { ok: a === true && b === false && load('ask-me-many-questions-dtd', { root }) === null, detail: `${a}, ${b}` };
    });
    control('render names the file, its bytes, the form, every field by number and the reread, and ends a save with CACHE.compact', () => {
      const r = save('render-dtd', sampleState(), { root });
      const text = render(r);
      const lines = text.split('\n');
      return { ok: /^- cache: `artifacts\/cache\/render-dtd\.nt` \d+ bytes, form nt, state saved/.test(lines[0]) && c.fields.every((f, i) => lines[i + 1].startsWith(`  - ${i + 1} ${f}:`)) && /reread: guards depth, tabs held yes/.test(lines[9]) && lines[lines.length - 1] === c.compact, detail: lines[0] };
    });
    control('a state written as NestedText is read in one gulp and saved, its answers in any of the three shapes, and a state in JSON is refused by name', () => {
      const ntState = 'task: Resume the close.\nslots:\n  what: the close\nanswers:\n  1 Release: In 9.0.0\n  2 Gate: Start working\ngate:\n  choice: save\n  round: 1\n  adds: 0\n  impactfuls: 0\nnext: read the record\n';
      const listState = 'task: Resume the close.\nslots:\n  what: the close\nanswers:\n  -\n    header: Release\n    answer: In 9.0.0\ngate:\n  choice: save\nnext: read the record\n';
      writeFileSync(join(root, 'state.nt'), ntState, 'utf8');
      writeFileSync(join(root, 'state-list.nt'), listState, 'utf8');
      writeFileSync(join(root, 'state.json'), '{"task": "x"}', 'utf8');
      const a = save('nt-state-dtd', readState(join(root, 'state.nt')), { root });
      const b = save('nt-list-dtd', readState(join(root, 'state-list.nt')), { root });
      let refused = '';
      try { readState(join(root, 'state.json')); } catch (e) { refused = e.message; }
      const la = load('nt-state-dtd', { root });
      return { ok: a.state === 'saved' && b.state === 'saved' && answersOf(la.data).length === 2 && answersOf(la.data)[1].header === 'Gate' && answersOf(load('nt-list-dtd', { root }).data)[0].header === 'Release' && /JSON is refused/.test(refused), detail: `${a.bytes} and ${b.bytes} bytes; ${refused.slice(0, 40)}` };
    });
    control('a command name that is not a name is refused before any path is built', () => {
      let threw = '';
      try { cachePath('../etc/passwd', root); } catch (e) { threw = e.message; }
      return { ok: /not a name/.test(threw), detail: threw };
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  return { pass, fail, rows };
}

// ----- CLI -----
function arg(args, name, dflt = null) {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : dflt;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [verb, ...args] = process.argv.slice(2);
  const root = arg(args, '--root', process.cwd());
  try {
    if (verb === 'controls') {
      const r = controls();
      console.log(`cache controls: ${r.pass} passed, ${r.fail} failed`);
      for (const row of r.rows) console.log(row);
      process.exit(r.fail ? 1 : 0);
    } else if (verb === 'save') {
      const command = args.find((a) => !a.startsWith('--') && a !== arg(args, '--state') && a !== root && a !== arg(args, '--reason'));
      const stateFile = arg(args, '--state');
      if (!command || !stateFile) throw new Error('usage: save <command> --state <state.nt> [--root <dir>] [--reason user|size|token]');
      const state = readState(stateFile);
      const r = save(command, state, { root, reason: arg(args, '--reason', 'user') });
      console.log(render(r));
    } else if (verb === 'load') {
      const command = args.find((a) => !a.startsWith('--') && a !== root);
      const r = load(command, { root });
      if (!r) { console.log(`no cache for /${command} under ${CONTRACT.dir}`); process.exit(0); }
      console.log(render(r));
      console.log(JSON.stringify(r.data, null, 2));
    } else if (verb === 'consume') {
      const command = args.find((a) => !a.startsWith('--') && a !== root);
      console.log(consume(command, { root }) ? `consumed ${relPath(command)}` : `no cache for /${command}`);
    } else {
      console.log('usage: node lib/cache.mjs save <command> --state <state.nt> [--root <dir>] [--reason user|size|token] | load <command> | consume <command> | controls');
      process.exit(2);
    }
  } catch (e) {
    console.error(`cache: ${e.message}`);
    process.exit(1);
  }
}
