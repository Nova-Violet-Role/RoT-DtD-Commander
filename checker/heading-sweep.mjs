#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/heading-sweep.mjs
// Put every source that carries a grammar_map into the heading shape of
// LAW.CORE.6 (lib/headings.mjs applyHeadings), with the sigil of
// dtd/sigils.json. Idempotent: a second run changes nothing. Ends with its
// own control: a planted crammed template must come out reshaped, or the
// sweep proves nothing. `--check` reports without writing.

import { readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readText, writeLF } from '../lib/dtd.mjs';
import { applyHeadings, sigilFor, checkHeadings } from '../lib/headings.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

function targets() {
  const out = [];
  for (const kind of ['commands', 'agents']) {
    const d = join(ROOT, 'src', kind);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter((f) => f.endsWith('.md'))) out.push(join(d, f));
  }
  const sk = join(ROOT, 'src', 'skills');
  if (existsSync(sk)) for (const s of readdirSync(sk)) if (existsSync(join(sk, s, 'SKILL.md'))) out.push(join(sk, s, 'SKILL.md'));
  return out;
}

let changed = 0;
let skipped = 0;
let same = 0;
const missing = [];
for (const p of targets()) {
  const text = readText(p);
  if (!/<output_format>[\s\S]*<grammar_map>/.test(text)) {
    skipped++;
    continue;
  }
  const sigil = sigilFor(p.endsWith('SKILL.md') ? basename(dirname(p)) : p);
  if (!sigil) {
    missing.push(p);
    continue;
  }
  const next = applyHeadings(text, sigil);
  if (next === text) same++;
  else {
    changed++;
    if (!CHECK) writeLF(p, next);
    else console.log(`  would change ${p}`);
  }
  const f = checkHeadings(next);
  for (const m of f) console.log(`  C13 ${basename(p)}: ${m}`);
}
for (const m of missing) console.log(`  NO SIGIL ${m}`);
console.log(`heading-sweep: ${changed} ${CHECK ? 'would change' : 'changed'}, ${same} already in shape, ${skipped} without a grammar_map, ${missing.length} without a sigil`);

// control: a crammed template must be reshaped and the reshaped one must pass C13
const planted = `<!DOCTYPE t [\n<!ELEMENT t (a, b)>\n]>\n<output_format>\n<grammar_map>\nRender the \`t\` root declared in the DOCTYPE as the markdown below. One declared element per heading, in declared order; a required element with nothing to say still appears, with one line saying so.\n- \`a\`: **Alpha**, one line\n- \`b\`: **Beta**, one line\n</grammar_map>\n\n**Alpha:** [x]\n**Beta:** [y]\n</output_format>\n`;
const shaped = applyHeadings(planted, '🧪');
const before = checkHeadings(planted).length;
const after = checkHeadings(shaped).length;
const idem = applyHeadings(shaped, '🧪') === shaped;
const ok = before > 0 && after === 0 && idem && shaped.includes('\n### 🧪 Alpha\n\n[x]\n\n### 🧪 Beta\n\n[y]\n');
console.log(ok ? `control: a crammed template had ${before} C13 findings, none after reshaping, and the reshape is idempotent` : `CONTROL FAIL: before ${before} after ${after} idempotent ${idem}\n${shaped}`);
process.exit(ok && missing.length === 0 && (!CHECK || changed === 0) ? 0 : 1);
