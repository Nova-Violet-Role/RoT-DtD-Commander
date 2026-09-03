#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/license.mjs
// The curated SPDX list of dtd/cc-license.dtd and its definitions in
// dtd/licenses.json, held to each other in both directions (LAW.LICENSE.3):
// every identifier of LICENSE.list has one definition, every definition
// names an identifier of the list, every family is declared, and no
// definition carries a character an entity value cannot hold. The creators'
// elaborate and mark variants read a licence's definition from here.
//
//   ids()                 -> the identifiers of LICENSE.list, in order
//   definition(id)        -> { id, name, family, definition } or null
//   accepts(expression)   -> { ok, ids, joins, findings } for one identifier or a compound joined by OR or AND
//   controls()            -> both directions, and the refusals tripped
//
//   node lib/license.mjs show <id> | check <expression> | controls

import { readFileSync } from 'node:fs';
import { join, dirname, resolve as presolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = readFileSync(join(ROOT, 'dtd', 'cc-license.dtd'), 'utf8');
const DATA = JSON.parse(readFileSync(join(ROOT, 'dtd', 'licenses.json'), 'utf8'));

function ent(name) {
  const m = new RegExp('<!ENTITY\\s+' + name.replace(/\./g, '\\.') + '\\s+"([^"]*)"').exec(DTD);
  if (!m) throw new Error(`cc-license.dtd declares no ${name}`);
  return m[1];
}
export const LIST = ent('LICENSE.list').split(',').map((s) => s.trim()).filter(Boolean);
export const COUNT = Number(ent('LICENSE.count'));
export const DEFAULT = ent('LICENSE.default');
export const FAMILIES = DATA.families;
const BY_ID = new Map(DATA.licenses.map((l) => [l.id, l]));

export function ids() { return LIST.slice(); }
export function definition(id) { return BY_ID.get(id) || null; }

// LICENSE.join: OR or AND, upper case, one space each side; two or three identifiers make a double or a triple (LAW.LICENSE.1).
export function accepts(expression) {
  const findings = [];
  const parts = String(expression || '').trim().split(/\s+(OR|AND)\s+/);
  const idsFound = [];
  const joins = [];
  parts.forEach((p, i) => { if (i % 2 === 0) idsFound.push(p); else joins.push(p); });
  if (!idsFound.length || idsFound.some((x) => !x)) findings.push('the expression is empty');
  for (const id of idsFound) if (id && !LIST.includes(id)) findings.push(`${id} is not in LICENSE.list`);
  if (/\b(or|and)\b/.test(expression) && !/\s(OR|AND)\s/.test(expression)) findings.push('the join must be OR or AND in upper case with one space each side (LICENSE.join)');
  if (idsFound.length > 3) findings.push(`${idsFound.length} identifiers; a double or a triple at most`);
  const count = idsFound.length === 1 ? 'single' : idsFound.length === 2 ? 'double' : 'triple';
  return { ok: findings.length === 0, ids: idsFound, joins, count, findings };
}

export function controls() {
  const rows = [];
  let bad = 0;
  const row = (ok, msg) => { if (!ok) bad++; rows.push(`  ${ok ? 'PASS' : 'FAIL'} ${msg}`); };
  const defined = DATA.licenses.map((l) => l.id);
  const missing = LIST.filter((id) => !BY_ID.has(id));
  const extra = defined.filter((id) => !LIST.includes(id));
  row(LIST.length === COUNT, `LICENSE.count ${COUNT} equals the list length ${LIST.length}`);
  row(missing.length === 0, `every identifier of LICENSE.list has a definition${missing.length ? ': missing ' + missing.join(', ') : ''}`);
  row(extra.length === 0, `every definition names an identifier of the list${extra.length ? ': extra ' + extra.join(', ') : ''}`);
  const dup = defined.filter((id, i) => defined.indexOf(id) !== i);
  row(dup.length === 0, `no identifier is defined twice${dup.length ? ': ' + dup.join(', ') : ''}`);
  const badFam = DATA.licenses.filter((l) => !FAMILIES.includes(l.family)).map((l) => l.id);
  row(badFam.length === 0, `every family is one of ${FAMILIES.join(', ')}${badFam.length ? '; strange on ' + badFam.join(', ') : ''}`);
  const badChar = DATA.licenses.filter((l) => /[<&%"]/.test(l.definition) || /[<&%"]/.test(l.name)).map((l) => l.id);
  row(badChar.length === 0, `no definition carries a character an entity value cannot hold${badChar.length ? ': ' + badChar.join(', ') : ''}`);
  const empty = DATA.licenses.filter((l) => !l.name || !l.definition || l.definition.length < 20).map((l) => l.id);
  row(empty.length === 0, `every entry has a name and a definition of a sentence${empty.length ? ': ' + empty.join(', ') : ''}`);
  const badId = LIST.filter((id) => !/^[A-Za-z0-9.+-]+$/.test(id));
  row(badId.length === 0, `every identifier is SPDX-shaped${badId.length ? ': ' + badId.join(', ') : ''}`);
  const d = accepts(DEFAULT);
  row(d.ok && d.count === 'double' && d.joins[0] === 'OR', `LICENSE.default is a listed double joined by OR: ${DEFAULT}`);
  const s = accepts('MIT');
  row(s.ok && s.count === 'single', 'a single listed identifier is accepted');
  const t = accepts('MIT AND Apache-2.0 AND BSD-2-Clause');
  row(t.ok && t.count === 'triple', 'a triple joined by AND is accepted');
  const u = accepts('MIT OR WTFPL-3');
  row(!u.ok && u.findings.some((x) => /not in LICENSE.list/.test(x)), `trip: an identifier outside the list is refused: ${u.findings[0] || 'nothing'}`);
  const v = accepts('MIT or Apache-2.0');
  row(!v.ok && v.findings.some((x) => /upper case/.test(x)), `trip: a lower-case join is refused: ${v.findings[0] || 'nothing'}`);
  const w = accepts('MIT OR ISC OR Zlib OR 0BSD');
  row(!w.ok && w.findings.some((x) => /a double or a triple at most/.test(x)), 'trip: four identifiers are refused');
  row(definition('EUPL-1.2') && /other half/.test(definition('EUPL-1.2').definition), 'show reads the definition of a listed identifier');
  row(definition('GPL-4.0') === null, 'show returns null for an identifier outside the list');
  return { bad, rows };
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [a, b] = process.argv.slice(2);
  if (a === 'controls') {
    const r = controls();
    for (const x of r.rows) console.log(x);
    console.log(`license controls: ${r.bad ? `${r.bad} failing` : 'ok (0 failing)'}, ${LIST.length} identifiers, ${DATA.licenses.length} definitions, ${FAMILIES.length} families`);
    process.exit(r.bad ? 1 : 0);
  } else if (a === 'show' && b) {
    const d = definition(b);
    if (!d) { console.log(`${b} is not in LICENSE.list (${LIST.length} identifiers)`); process.exit(1); }
    console.log(`${d.id}: ${d.name} (${d.family}). ${d.definition}`);
    process.exit(0);
  } else if (a === 'check' && b) {
    const r = accepts(process.argv.slice(3).join(' '));
    for (const f of r.findings) console.log('  refused: ' + f);
    console.log(r.ok ? `accepted: ${r.ids.join(' ' + (r.joins[0] || '') + ' ')} (${r.count})` : 'refused');
    process.exit(r.ok ? 0 : 1);
  } else { console.log('usage: node lib/license.mjs show <id> | check <expression> | controls'); process.exit(2); }
}
