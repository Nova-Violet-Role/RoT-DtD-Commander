#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/contract-audit.mjs
// Both directions of the contract: every ELEMENT, general ENTITY and
// parameter entity declared in dtd/*.dtd is used by at least one source
// under src/ (elements and entities) or by a declaration in dtd/ (parameter
// entities, including the subset that declares them); and every LAW.*
// prefix is numbered densely. Exit 1 on any unused declaration or gap.
// Ends with its own negative control: a planted unused declaration in a
// temporary subset must be reported, or the audit proves nothing.

import { readFileSync, readdirSync, writeFileSync, unlinkSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(d) {
  const out = [];
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

function audit({ dtdDir = join(ROOT, 'dtd'), srcDir = join(ROOT, 'src'), builtDirs = ['commands', 'skills', 'agents'] } = {}) {
  const built = builtDirs
    .map((d) => (isAbsolute(d) ? d : join(ROOT, d)))
    .filter((d) => { try { readdirSync(d); return true; } catch { return false; } })
    .flatMap((d) => walk(d))
    .map((p) => ({ p, t: readFileSync(p, 'utf8') }));
  const files = walk(srcDir).map((p) => ({ p, t: readFileSync(p, 'utf8') }));
  const dtds = readdirSync(dtdDir).filter((f) => f.endsWith('.dtd')).map((f) => ({ f, t: readFileSync(join(dtdDir, f), 'utf8') }));
  const unused = [];
  let total = 0;
  for (const { f, t } of dtds) {
    for (const m of t.matchAll(/<!ELEMENT\s+([\w.:-]+)/g)) {
      total++;
      const n = m[1];
      const re = // A bare word is not a use: the third alternative matched any English prose,
      // so an orphaned element named block passed on the word "block" occurring
      // somewhere unrelated (pass 8). An element is used when it is written as
      // markup, quoted as code, or named in a content model.
      new RegExp('(<' + n + '[\\s>/]|`' + n + '`|[(,|]\\s*' + n + '[?*+]?\\s*[),|]|ENTITY % [A-Za-z.-]+ "[^"]*\\b' + n + '\\b)');
      if (!files.some((x) => re.test(x.t))) unused.push(`${f} element ${n}`);
    }
    for (const m of t.matchAll(/<!ENTITY\s+(?!%)([\w.:-]+)/g)) {
      total++;
      if (!files.some((x) => x.t.includes(m[1]))) unused.push(`${f} entity ${m[1]}`);
    }
    for (const m of t.matchAll(/<!ENTITY\s+%\s+([\w.:-]+)/g)) {
      total++;
      const ref = '%' + m[1] + ';';
      const usedInSrc = files.some((x) => x.t.includes(ref));
      const usedInDtd = dtds.some((d) => d.t.replace(m[0], '').includes(ref));
      if (!usedInSrc && !usedInDtd) unused.push(`${f} pentity ${ref}`);
    }
  }
  // law density per prefix over dtd and src, and the order of reading inside each file:
  // a Set forgets position, so the numbers are also kept as they were read and must ascend
  const gaps = [];
  for (const src of [...dtds, ...files]) {
    const read = new Map();
    for (const m of src.t.matchAll(/<!ENTITY\s+LAW\.([A-Z_.]+)\.(\d+)\s/g)) {
      const seq = read.get(m[1]) || [];
      seq.push(Number(m[2]));
      read.set(m[1], seq);
    }
    for (const [p, seq] of read) {
      for (let i = 1; i < seq.length; i++) if (seq[i] <= seq[i - 1]) { gaps.push(`LAW.${p} out of order in ${src.f || src.p}: read ${seq.join(', ')}`); break; }
    }
  }
  // Density is asked of each built document, where the installer has already
  // inlined every subset, so one file holds a whole prefix. Keyed by prefix
  // alone across the tree the Set unioned every source and a hole in one file
  // was filled by another declaring the number (pass 27); asked of src/ alone
  // it fired on every command that extends its subset's numbering.
  for (const b of built) {
    const seen = new Map();
    for (const m of b.t.matchAll(/<!ENTITY\s+LAW\.([A-Z_.]+)\.(\d+)\s/g)) {
      const set = seen.get(m[1]) || new Set();
      set.add(Number(m[2]));
      seen.set(m[1], set);
    }
    for (const [p, set] of seen) {
      const max = Math.max(...set);
      if (set.size !== max) gaps.push(`LAW.${p} in ${b.p}: ${set.size} declared, highest ${max}`);
    }
  }
  return { total, unused, gaps };
}

const r = audit();
for (const u of r.unused) console.log(`  UNUSED ${u}`);
for (const g of r.gaps) console.log(`  GAP ${g}`);
console.log(`contract-audit: ${r.total} declarations, ${r.unused.length} unused, ${r.gaps.length} law gaps`);

// negative control: a planted declaration nobody uses must be reported
const plant = join(ROOT, 'dtd', 'zz-control.dtd');
writeFileSync(plant, '<!ELEMENT never_named_anywhere (#PCDATA)>\n', 'utf8');
let tripped = false;
try {
  const c = audit();
  tripped = c.unused.some((u) => u.includes('never_named_anywhere'));
} finally {
  unlinkSync(plant);
}
console.log(tripped ? 'control: a planted unused declaration is reported' : 'CONTROL FAIL: the planted declaration was not reported');
// negative control: two laws planted in the wrong order must be reported as out of order
const plant2 = join(ROOT, 'dtd', 'zz-order.dtd');
writeFileSync(plant2, '<!ENTITY LAW.ZZORDER.2 "second first">\n<!ENTITY LAW.ZZORDER.1 "first second">\n', 'utf8');
let ordered = false;
try {
  const c = audit();
  ordered = c.gaps.some((g) => /LAW\.ZZORDER out of order/.test(g));
} finally {
  unlinkSync(plant2);
}
console.log(ordered ? 'control: two laws planted out of order are reported' : 'CONTROL FAIL: the planted disorder was not reported');
// the same disorder planted in a source file, so the src arm is exercised and names its file
// planted in a temporary source tree the audit is pointed at, never in src/, so a fired ceiling leaves nothing behind
const tmpSrc = mkdtempSync(join(tmpdir(), 'rot-dtd-contract-audit-'));
const plant3 = join(tmpSrc, 'zz-order-control-dtd.md');
writeFileSync(plant3, '---\ndescription: control\n---\n<!DOCTYPE zz [\n  <!ENTITY LAW.ZZSRC.2 "second first">\n  <!ENTITY LAW.ZZSRC.1 "first second">\n]>\n', 'utf8');
let orderedSrc = false;
let srcMsg = '';
try {
  const c = audit({ srcDir: tmpSrc });
  srcMsg = c.gaps.find((g) => /LAW\.ZZSRC out of order/.test(g)) || '';
  orderedSrc = /zz-order-control-dtd\.md/.test(srcMsg) && !/undefined/.test(srcMsg);
} finally {
  rmSync(tmpSrc, { recursive: true, force: true });
}
console.log(orderedSrc ? 'control: two laws planted out of order in a source are reported with the file named' : 'CONTROL FAIL: the planted disorder in a source was not reported with its file: ' + srcMsg);
// the density arm, planted in a temporary built tree: a prefix that skips a
// number must be reported and must name the document it was read from. Before
// pass 27 this arm keyed one Set by prefix across the whole tree, so a hole in
// one file was filled by another declaring the number and no plant could trip it.
const tmpBuilt = mkdtempSync(join(tmpdir(), 'rot-dtd-density-'));
const plant4 = join(tmpBuilt, 'zz-density-control-dtd.md');
writeFileSync(plant4, '<!DOCTYPE zz [\n  <!ENTITY LAW.ZZDENSE.1 "one">\n  <!ENTITY LAW.ZZDENSE.3 "three, and no two">\n]>\n', 'utf8');
let dense = false;
let denseMsg = '';
try {
  const c = audit({ builtDirs: [tmpBuilt] });
  denseMsg = c.gaps.find((g) => /LAW\.ZZDENSE/.test(g)) || '';
  dense = /zz-density-control-dtd\.md/.test(denseMsg) && /2 declared, highest 3/.test(denseMsg);
} finally {
  rmSync(tmpBuilt, { recursive: true, force: true });
}
console.log(dense ? 'control: a law prefix that skips a number is reported with its document' : 'CONTROL FAIL: the planted density gap was not reported: ' + denseMsg);
process.exit(r.unused.length || r.gaps.length || !tripped || !ordered || !orderedSrc || !dense ? 1 : 0);
