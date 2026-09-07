#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/creators-audit.mjs
// The Code Creator family against the whole DTD corpus, per folder. The
// creators write through dtd/cc-schematic.dtd: eight schematics, ten concept
// cells each. This audit holds every folder of the corpus to that grammar:
// one schematic per folder, with the concept cells that carry the folder's
// own mechanic, or a declared refusal naming the folder and the reason.
//
// The rows are declared here and measured against the corpus when the corpus
// is present on the machine (it lives beside the repository, not in it). In
// CI the corpus is absent and the static half runs alone, said out loud: a
// check that did not run must never look like a check that passed.
//
//   node checker/creators-audit.mjs            the audit, exit 1 on a folder with neither
//   node checker/creators-audit.mjs --write    write artifacts/research/<date>-creators-audit.md
//   node checker/creators-audit.mjs --check    refuse a record that drifted from the audit; on a leg with no corpus the counts are carried from the record
//   node checker/creators-audit.mjs --controls a planted folder with neither, a planted cell, and the two corpus trips against a planted corpus, each refused on every leg

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CORPUS = process.env.DTD_CORPUS || resolve(ROOT, '..', 'cc-resources', '.dtd-file-examples');
const RECORD = 'artifacts/research/2026-09-07-creators-audit.md';

// The schematic and its concept cells, read from the grammar so a cell named
// here that the grammar does not declare is a finding.
export function cells() {
  const t = readFileSync(join(ROOT, 'dtd', 'cc-schematic.dtd'), 'utf8');
  const names = (/<!ATTLIST schematic name \(([^)]+)\)/.exec(t) || [, ''])[1].split('|');
  const concepts = (/<!ATTLIST concept\s+name\s+\(([^)]+)\)/.exec(t) || [, ''])[1].split('|');
  const cell = (s, c) => (new RegExp(`<!ENTITY SCHEMA\\.${s}\\.${c}\\s+"([^"]*)"`).exec(t) || [, ''])[1];
  return { schematics: names, concepts, cell };
}

// One row per entry of the corpus as the 9.0.0 brief lists it. The mechanic is
// what the study measured in that folder; the carries list is the concept
// cells of the xml schematic that carry it. A folder with no grammar is a
// refusal with its reason, never a schematic.
export const ROWS = [
  { name: 'svg', kind: 'folder', schematic: 'xml', carries: ['conditional', 'include', 'definition'], mechanic: '33 of 54 grammar files carry conditional sections; every module a switch, element names parameterised (SVG.rect.qname), two redeclaration hooks' },
  { name: 'xhtml', kind: 'folder', schematic: 'xml', carries: ['include', 'definition', 'type'], mechanic: 'the modularization framework: driver and flat, the method explained rather than used' },
  { name: 'xhtml11', kind: 'folder', schematic: 'xml', carries: ['conditional', 'include'], mechanic: 'the driver: 323 lines of switches resolving to 4689 flat; the pattern geometry.dtd is built on' },
  { name: 'tei', kind: 'folder', schematic: 'xml', carries: ['conditional', 'definition', 'type'], mechanic: 'per-element switches, the element name a parameter entity, the decl and module pair; 63 of 64 datatypes expand to CDATA' },
  { name: 'mathml', kind: 'folder', schematic: 'xml', carries: ['conditional', 'include', 'definition', 'reference'], mechanic: 'mathml2.dtd as a driver profiled by redeclaration; the named character entities of the notation vocabulary' },
  { name: 'docbook', kind: 'folder', schematic: 'xml', carries: ['conditional', 'include', 'type', 'reference'], mechanic: 'the module switch in its clearest form; the ISO entity sets referenced by name; NOTATION linespecific as a handling rule; colsep yesorno in ATTLIST' },
  { name: 'JATS-DTDs', kind: 'folder', schematic: 'xml', carries: ['include', 'definition', 'reference'], mechanic: '81 of 90 files are .ent: variability as vocabulary rather than structure, every character an entity reference' },
  { name: 'daisy', kind: 'folder', schematic: 'xml', carries: ['type', 'definition'], mechanic: '0 conditional sections on purpose: a fixed deliverable; dtbook 2005-1, 2 and 3 identical in element count with the PE set moving' },
  { name: 'office', kind: 'folder', schematic: 'xml', carries: ['include', 'definition', 'type'], mechanic: '14 flat includes; drawing.mod 60 elements to 637 attribute lists; draw:custom-shape referenced and never declared' },
  { name: 'dtds', kind: 'folder', schematic: 'xml', carries: ['type', 'definition'], mechanic: 'twelve Wireshark protocol grammars, each opened by a processing instruction, 11 of 12 with no parameter entity' },
  { name: 'org.oasis-open.dita.v1_2', kind: 'folder', schematic: 'xml', carries: ['definition', 'include'], mechanic: 'composition by redeclaring a parameter entity before the base module loads; 97 grammar files, a subset of 1.3' },
  { name: 'org.oasis-open.dita.v1_3', kind: 'folder', schematic: 'xml', carries: ['definition', 'include', 'type'], mechanic: 'the counter-example: 0 conditional sections in its own 130 files; the shell of eleven banner sections; class attributes with a significant trailing space' },
  { name: 'org.dita.specialization.dita11', kind: 'folder', schematic: 'xml', carries: ['definition', 'include'], mechanic: '36 grammar files, the earliest set; domains declared ahead of the DTDs so they come first' },
  { name: 'org.oasis-open.xdita.v0_2_2', kind: 'folder', schematic: 'xml', carries: ['definition', 'comment'], mechanic: 'customization points shipped as commented-out declarations; excluded-domains declared and referenced nowhere' },
  { name: 'org.lwdita', kind: 'folder', schematic: null, refusal: 'no grammar to write a schematic against: a DITA-OT plugin of 33 jar and 32 xsl files, 0 dtd, mod or ent' },
  { name: 'com.elovirta.ooxml', kind: 'folder', schematic: null, refusal: 'no grammar to write a schematic against: 35 files, 0 dtd, mod or ent' },
  { name: 'com.sophos.tocjs', kind: 'folder', schematic: null, refusal: 'no grammar to write a schematic against: 85 files, 0 dtd, mod or ent' },
  { name: 'XMLSchema.dtd', kind: 'root', schematic: 'xml', carries: ['definition', 'include'], mechanic: 'prefix parameter entities redeclared from the instance internal subset; its own header says it is almost certainly not valid' },
  { name: 'XMLSchema2004.dtd', kind: 'root', schematic: 'xml', carries: ['definition', 'include'], mechanic: 'the same grammar with a date for a version in its name' },
  { name: 'datatypes.dtd', kind: 'root', schematic: 'xml', carries: ['type'], mechanic: 'totalDigits and fractionDigits; the 2001 facets' },
  { name: 'datatypes2004.dtd', kind: 'root', schematic: 'xml', carries: ['type'], mechanic: 'precision and scale; a suffix that names a date, not a revision' },
  { name: 'ModularMonet.dtd', kind: 'root', schematic: 'xml', carries: ['definition'], mechanic: 'a flat vocabulary' },
  { name: 'WMSDKNS.DTD', kind: 'root', schematic: 'xml', carries: ['type', 'definition'], mechanic: 'declarations wrapped in a DOCTYPE, a Wireshark grammar at the root' },
  { name: 'edoc.dtd', kind: 'root', schematic: 'xml', carries: ['definition'], mechanic: 'a recursive type algebra in content models' },
  { name: 'gdb-syscalls.dtd', kind: 'root', schematic: 'xml', carries: ['type'], mechanic: 'a flat enumeration grammar' },
  { name: 'krita.dtd', kind: 'root', schematic: 'xml', carries: ['definition'], mechanic: 'FILTERCONFIG declared to contain filterconfig, which is never declared: the dangling reference no validator reports' },
  { name: 'language.dtd', kind: 'root', schematic: 'xml', carries: ['type'], mechanic: 'a flat vocabulary' },
];

const GRAMMAR = /\.(dtd|mod|ent)$/i;
function walk(d) {
  const out = [];
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}
export function measureCorpus(corpus = CORPUS) {
  if (!existsSync(corpus)) return null;
  const entries = readdirSync(corpus);
  const counts = {};
  for (const n of entries) {
    const p = join(corpus, n);
    if (statSync(p).isDirectory()) { const all = walk(p); counts[n] = { files: all.length, grammar: all.filter((f) => GRAMMAR.test(f)).length }; }
    else counts[n] = { files: 1, grammar: GRAMMAR.test(n) ? 1 : 0 };
  }
  return { entries, counts };
}

// A corpus planted from the rows for the two corpus trips, so they run on
// every leg: one entry per row, a folder holding one grammar file where the
// row has a schematic and one jar where it is refused, a root file named by
// the row. The first hosted run of 9.0.0 printed 6 controls against a claim
// of 8 because the trips skipped themselves where the corpus is absent.
export function plantCorpus() {
  const d = mkdtempSync(join(tmpdir(), 'creators-corpus-'));
  for (const r of ROWS) {
    if (r.kind === 'folder') { mkdirSync(join(d, r.name)); writeFileSync(join(d, r.name, r.schematic ? 'a.dtd' : 'a.jar'), '', 'utf8'); }
    else writeFileSync(join(d, r.name), '', 'utf8');
  }
  return d;
}

export function audit({ rows = ROWS, corpus = CORPUS } = {}) {
  const findings = [];
  const c = cells();
  for (const r of rows) {
    if (!r.schematic && !r.refusal) findings.push(`${r.name}: neither a schematic nor a refusal`);
    if (r.schematic && !c.schematics.includes(r.schematic)) findings.push(`${r.name}: schematic ${r.schematic} is not one the grammar declares`);
    if (r.schematic) for (const k of r.carries || []) if (!c.concepts.includes(k) || !c.cell(r.schematic, k)) findings.push(`${r.name}: concept ${k} has no cell in the ${r.schematic} schematic`);
    if (r.schematic && !(r.carries || []).length) findings.push(`${r.name}: a schematic with no concept cell carrying its mechanic`);
  }
  const names = rows.map((r) => r.name);
  if (new Set(names).size !== names.length) findings.push('a folder is audited twice');
  // every concept cell of the xml schematic has a witness in the corpus, or
  // the audit says which has none
  const witnessed = new Set(rows.flatMap((r) => r.carries || []));
  const unwitnessed = c.concepts.filter((k) => !witnessed.has(k));
  const m = measureCorpus(corpus);
  let measured = null;
  if (m) {
    const extra = m.entries.filter((e) => !names.includes(e));
    const missing = names.filter((n) => !m.entries.includes(n));
    for (const e of extra) findings.push(`the corpus holds ${e} and the audit has no row for it`);
    for (const n of missing) findings.push(`the audit names ${n} and the corpus has no such entry`);
    for (const r of rows) {
      const k = m.counts[r.name];
      if (!k) continue;
      if (!r.schematic && k.grammar > 0) findings.push(`${r.name} is refused for having no grammar and the corpus holds ${k.grammar} grammar files there`);
      if (r.schematic && k.grammar === 0) findings.push(`${r.name} is given a schematic and the corpus holds no grammar file there`);
    }
    measured = { entries: m.entries.length, grammarFolders: m.entries.filter((e) => m.counts[e].grammar > 0).length, counts: m.counts };
  }
  return { ok: findings.length === 0, findings, rows, unwitnessed, measured, corpus };
}

export function render(a, date = '2026-09-07') {
  const L = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->', '', `# The creators against the corpus, ${date}`, '',
    'Generated by `node checker/creators-audit.mjs --write`. One schematic per folder of the corpus, with the concept cells of dtd/cc-schematic.dtd that carry the folder\'s own mechanic, or a declared refusal naming the folder and the reason. The corpus lives beside the repository; the counts are measured when it is present and marked unmeasured when it is not.', '',
    `- corpus: ${a.corpus}`, `- measured: ${a.measured ? `${a.measured.entries} entries, ${a.measured.grammarFolders} with grammar` : 'no, the corpus is absent on this machine'}`, `- rows: ${a.rows.length}, with a schematic ${a.rows.filter((r) => r.schematic).length}, refused ${a.rows.filter((r) => !r.schematic).length}`, '',
    '## Per folder', '', '| entry | kind | files | grammar | schematic | carries | mechanic, or the reason refused |', '|---|---|---|---|---|---|---|'];
  for (const r of a.rows) {
    const k = a.measured ? a.measured.counts[r.name] : null;
    L.push(`| ${r.name} | ${r.kind} | ${k ? k.files : 'unmeasured'} | ${k ? k.grammar : 'unmeasured'} | ${r.schematic || 'refused'} | ${(r.carries || []).join(', ') || ''} | ${r.mechanic || r.refusal} |`);
  }
  L.push('', '## The concept cells of the xml schematic, and their witnesses', '');
  const c = cells();
  for (const k of c.concepts) {
    const w = a.rows.filter((r) => (r.carries || []).includes(k)).map((r) => r.name);
    L.push(`- ${k}: ${c.cell('xml', k)}; witnessed by ${w.length ? w.join(', ') : 'no folder of the corpus'}`);
  }
  if (a.unwitnessed.length) L.push('', `The cells no folder witnesses: ${a.unwitnessed.join(', ')}. The corpus uses NDATA in 0 of its files (measured in the 8.0.0 study), so the binary cell's witness is cc-core.dtd itself, where NDATA classifies trust; the corpus never exposed that possibility, and the audit records that the creators carry a ramification the corpus does not.`);
  L.push('');
  return L.join('\n');
}

// The measured half of a record, read back on a leg that has no corpus: the
// corpus line and the per-row counts. The check on such a leg holds the
// static half to the tree and carries the numbers the writing machine
// measured, and says which it did. The record names a corpus the hosted
// legs do not have, so a check that re-rendered against no corpus there
// could never be in step (second hosted run of 9.0.0).
export function carried(text) {
  const corpus = (/^- corpus: (.+)$/m.exec(text) || [])[1];
  const counts = {};
  for (const m of text.matchAll(/^\| ([^|]+?) \| (?:folder|root) \| (\d+) \| (\d+) \|/gm)) counts[m[1]] = { files: Number(m[2]), grammar: Number(m[3]) };
  const entries = Object.keys(counts);
  if (!corpus || !entries.length) return null;
  return { corpus, measured: { entries: entries.length, grammarFolders: entries.filter((e) => counts[e].grammar > 0).length, counts } };
}

// Whether the record is the audit as rendered: measured against the corpus
// where it is, the counts carried from the record where it is not.
export function inStep(a, rec = join(ROOT, RECORD)) {
  if (!existsSync(rec)) return { same: false, how: `the record ${RECORD} is not written yet` };
  const text = readFileSync(rec, 'utf8');
  if (a.measured) return { same: text === render(a), how: `measured against the corpus, ${a.measured.entries} entries` };
  const c = carried(text);
  if (!c) return { same: false, how: 'the corpus is absent and the record carries no counts to hold' };
  return { same: text === render({ ...a, corpus: c.corpus, measured: c.measured }), how: `the corpus absent here, the counts carried from the record, ${c.measured.entries} entries` };
}

export function controls(io = console) {
  let ran = 0, fail = 0;
  const say = (ok, t) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${t}`); if (!ok) fail++; };
  const a = audit();
  say(a.rows.length === 27 && a.rows.filter((r) => r.schematic).length === 24 && a.rows.filter((r) => !r.schematic).length === 3, `27 rows: 24 with a schematic, 3 refused with a reason (${a.rows.filter((r) => !r.schematic).map((r) => r.name).join(', ')})`);
  say(a.ok, a.ok ? `the audit holds${a.measured ? `, measured against ${a.measured.entries} corpus entries` : ', the corpus absent and said so'}` : `findings: ${a.findings.join('; ')}`);
  say(a.unwitnessed.length === 4 && a.unwitnessed.join() === 'literal,expanded,escape,binary', `the cells no folder witnesses are named: ${a.unwitnessed.join(', ')}`);
  const neither = audit({ rows: [...ROWS, { name: 'planted', kind: 'folder' }], corpus: '/nonexistent' });
  say(!neither.ok && /planted: neither a schematic nor a refusal/.test(neither.findings[0]), `trip: a folder with neither is refused by name: ${neither.findings[0]}`);
  const badCell = audit({ rows: [...ROWS.slice(1), { ...ROWS[0], carries: ['curve'] }], corpus: '/nonexistent' });
  say(!badCell.ok && /concept curve has no cell/.test(badCell.findings[0]), `trip: a concept the grammar does not declare is refused: ${badCell.findings[0]}`);
  // the two corpus trips, on every leg, against the planted corpus: the
  // audit above measured the real one where it is and said so where it is not
  const planted = plantCorpus();
  try {
    const wrong = audit({ rows: ROWS.map((r) => (r.name === 'org.lwdita' ? { ...r, schematic: 'xml', refusal: null, carries: ['include'] } : r)), corpus: planted });
    say(!wrong.ok && /org.lwdita is given a schematic and the corpus holds no grammar file/.test(wrong.findings[0]), `trip: a schematic given to a folder with no grammar is refused against the planted corpus: ${wrong.findings[0]}`);
    const absent = audit({ rows: [...ROWS, { name: 'ghost', kind: 'folder', schematic: 'xml', carries: ['type'], mechanic: 'x' }], corpus: planted });
    say(!absent.ok && absent.findings.some((f) => /the audit names ghost and the corpus has no such entry/.test(f)), 'trip: a row the corpus does not hold is refused against the planted corpus');
  } finally { rmSync(planted, { recursive: true, force: true }); }
  const step = inStep(a);
  say(step.same, `the record is the audit as rendered, ${step.how}`);
  // trip: on a leg with no corpus the counts are carried and the rows are not;
  // a record whose static half drifted is still refused there
  const rec = join(ROOT, RECORD);
  const text = existsSync(rec) ? readFileSync(rec, 'utf8') : '';
  const edited = text.replace('33 of 54 grammar files', '34 of 54 grammar files');
  const cc = carried(edited);
  const bare = audit({ corpus: '/nonexistent' });
  say(text !== '' && edited !== text && cc !== null && render({ ...bare, corpus: cc.corpus, measured: cc.measured }) !== edited && render({ ...bare, corpus: cc.corpus, measured: cc.measured }) === text,
    'trip: on a leg with no corpus a record whose static half drifted is refused; the carried counts do not carry the rows');
  io.log(`creators-audit controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--controls')) process.exit(controls() ? 0 : 1);
  const a = audit();
  for (const f of a.findings) console.log(`  FINDING ${f}`);
  console.log(`creators-audit: ${a.rows.length} rows, ${a.rows.filter((r) => r.schematic).length} with a schematic, ${a.rows.filter((r) => !r.schematic).length} refused; corpus ${a.measured ? `measured, ${a.measured.entries} entries` : 'absent, unmeasured'}; cells unwitnessed ${a.unwitnessed.join(', ') || 'none'}`);
  const rec = join(ROOT, RECORD);
  if (args.includes('--write')) { writeFileSync(rec, render(a), 'utf8'); console.log(`  wrote ${RECORD}`); }
  if (args.includes('--check')) { const step = inStep(a, rec); console.log(step.same ? `  the record is in step, ${step.how}` : `  DRIFT the record differs from the audit (${step.how}); run --write where the corpus is`); if (!step.same) process.exit(1); }
  process.exit(a.ok ? 0 : 1);
}
