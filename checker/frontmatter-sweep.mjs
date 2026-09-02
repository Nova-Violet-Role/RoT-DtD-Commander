#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/frontmatter-sweep.mjs
// Quote every front-matter value that a YAML parser would misread as a bare
// scalar (a `: ` or a ` #` inside it), in every source under src/. This is
// the shape GitHub's front-matter renderer reported on pareto-dtd.md as
// "mapping values are not allowed in this context at line 1 column 32"
// (3.1.0). Values already quoted, or starting with a bracket, a brace or a
// block indicator, are left alone: YAML reads those as it should. Idempotent;
// `--check` reports without writing. Ends with its own control: a planted
// bad front matter must come out quoted and pass rule C14.

import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readText, writeLF, yamlScalar, frontmatterFindings } from '../lib/dtd.mjs';

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

export function quoteFrontmatter(text) {
  if (!text.startsWith('---\n')) return text;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return text;
  const fm = text.slice(4, end);
  const lines = fm.split('\n').map((line) => {
    const m = /^([\w-]+):[ \t]+(.*)$/.exec(line);
    if (!m) return line;
    return `${m[1]}: ${yamlScalar(m[2])}`;
  });
  return text.slice(0, 4) + lines.join('\n') + text.slice(end);
}

let changed = 0;
let same = 0;
for (const p of targets()) {
  const text = readText(p);
  const next = quoteFrontmatter(text);
  if (next === text) same++;
  else {
    changed++;
    if (!CHECK) writeLF(p, next);
    else console.log(`  would change ${p}`);
  }
  for (const f of frontmatterFindings(next)) console.log(`  C14 ${p}: ${f}`);
}
console.log(`frontmatter-sweep: ${changed} ${CHECK ? 'would change' : 'changed'}, ${same} already parse`);

// control: a planted bad front matter has C14 findings, none after quoting, and the quoting is idempotent
const planted = '---\ndescription: Find the vital few: rank every factor\nargument-hint: [topic or blank]\nname: x # not a comment\n---\nbody\n';
const before = frontmatterFindings(planted).length;
const quoted = quoteFrontmatter(planted);
const after = frontmatterFindings(quoted).length;
const idem = quoteFrontmatter(quoted) === quoted;
const shape = quoted.includes('description: "Find the vital few: rank every factor"') && quoted.includes('argument-hint: [topic or blank]') && quoted.includes('name: "x # not a comment"');
const ok = before === 2 && after === 0 && idem && shape;
console.log(ok ? `control: a planted front matter had ${before} C14 findings, none after quoting, the bracketed hint untouched, and the quoting is idempotent` : `CONTROL FAIL: before ${before} after ${after} idempotent ${idem} shape ${shape}\n${quoted}`);
process.exit(ok ? 0 : 1);
