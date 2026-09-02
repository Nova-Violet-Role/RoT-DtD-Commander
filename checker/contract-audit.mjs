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

import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
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

function audit({ dtdDir = join(ROOT, 'dtd'), srcDir = join(ROOT, 'src') } = {}) {
  const files = walk(srcDir).map((p) => ({ p, t: readFileSync(p, 'utf8') }));
  const dtds = readdirSync(dtdDir).filter((f) => f.endsWith('.dtd')).map((f) => ({ f, t: readFileSync(join(dtdDir, f), 'utf8') }));
  const unused = [];
  let total = 0;
  for (const { f, t } of dtds) {
    for (const m of t.matchAll(/<!ELEMENT\s+([\w.:-]+)/g)) {
      total++;
      const n = m[1];
      const re = new RegExp('(<' + n + '[\\s>/]|`' + n + '`|\\b' + n + '\\b)');
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
  // law density per prefix, over dtd and src
  const laws = new Map();
  const all = [...dtds.map((d) => d.t), ...files.map((x) => x.t)].join('\n');
  for (const m of all.matchAll(/<!ENTITY\s+LAW\.([A-Z_.]+)\.(\d+)\s/g)) {
    const set = laws.get(m[1]) || new Set();
    set.add(Number(m[2]));
    laws.set(m[1], set);
  }
  const gaps = [];
  for (const [p, set] of laws) {
    const max = Math.max(...set);
    if (set.size !== max) gaps.push(`LAW.${p}: ${set.size} declared, highest ${max}`);
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
process.exit(r.unused.length || r.gaps.length || !tripped ? 1 : 0);
