#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/subsets-sweep.mjs
// The grammars src/skills/dtd-core-dtd/references/subsets.md quotes, held
// to dtd/. The reference quotes every shared subset and the engines a
// reader needs beside them, verbatim, and nothing read it: the tenth
// companion pass on 9.0.0 measured five of twenty-six blocks behind their
// files, the gate enumeration among them without the choice the release
// exists to add, and the file's own disclaimer conceding it could fall
// behind. Now the gate reads it.
//
//   node checker/subsets-sweep.mjs             re-embed every block from dtd/
//   node checker/subsets-sweep.mjs --check     "N blocks in step", or the drifted names and exit 1
//   node checker/subsets-sweep.mjs --controls  five controls, a planted character tripped
//
// A block is `## <name>.dtd`, prose, then a ```dtd fence whose body is
// dtd/<name>.dtd without its final newline. Every cc-*.dtd must have a
// block: a shared subset a reader cannot find here is one the reference
// does not teach. A root grammar is quoted or not by choice.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REF = 'src/skills/dtd-core-dtd/references/subsets.md';

// Line-wise, because four of the grammars document fences themselves: a
// block's body runs from its ```dtd line to the last ``` line before the
// next `## <name>.dtd` heading, never to the first closing fence it meets.
export function blocks(text) {
  const lines = text.split('\n');
  const offsets = [];
  let at = 0;
  for (const l of lines) { offsets.push(at); at += l.length + 1; }
  const heads = lines.map((l, i) => (/^## [a-z-]+\.dtd$/.test(l) ? i : -1)).filter((i) => i >= 0);
  const out = [];
  heads.forEach((h, k) => {
    const stop = k + 1 < heads.length ? heads[k + 1] : lines.length;
    // Four of the blocks open with a bare fence and no language tag, and a
    // grammar that carries three backticks would be fenced with four; the
    // block closes on the fence it opened with.
    let open = -1;
    let close = -1;
    let fence = '';
    for (let i = h + 1; i < stop; i++) {
      const m = open < 0 ? /^(`{3,4})(dtd)?$/.exec(lines[i]) : null;
      if (m) { open = i; fence = m[1]; continue; }
      if (open >= 0 && lines[i] === fence) close = i;
    }
    if (open < 0 || close < 0) return;
    const bodyStart = offsets[open + 1];
    const bodyEnd = offsets[close] - 1;
    out.push({ name: lines[h].slice(3, -4), body: text.slice(bodyStart, Math.max(bodyStart, bodyEnd)), bodyStart, bodyEnd: Math.max(bodyStart, bodyEnd) });
  });
  return out;
}

const fileBody = (root, name) => readFileSync(join(root, 'dtd', `${name}.dtd`), 'utf8').replace(/\n$/, '');

export function sweep(root = ROOT, text = readFileSync(join(root, REF), 'utf8')) {
  const found = blocks(text);
  const drifted = [];
  const unknown = [];
  for (const b of found) {
    if (!existsSync(join(root, 'dtd', `${b.name}.dtd`))) { unknown.push(b.name); continue; }
    if (fileBody(root, b.name) !== b.body) drifted.push(b.name);
  }
  const shared = readdirSync(join(root, 'dtd')).filter((f) => /^cc-[a-z-]+\.dtd$/.test(f)).map((f) => f.slice(0, -4));
  const missing = shared.filter((s) => !found.some((b) => b.name === s));
  return { count: found.length, drifted, missing, unknown, ok: !drifted.length && !missing.length && !unknown.length };
}

// The text with every block re-quoted from its file; blocks are replaced
// from the last to the first so earlier offsets hold.
export function reembedText(root, text) {
  const changed = [];
  for (const b of blocks(text).reverse()) {
    if (!existsSync(join(root, 'dtd', `${b.name}.dtd`))) throw new Error(`subsets-sweep: ${REF} quotes ${b.name}.dtd and dtd/ has no such file`);
    const want = fileBody(root, b.name);
    if (want !== b.body) { text = text.slice(0, b.bodyStart) + want + text.slice(b.bodyEnd); changed.push(b.name); }
  }
  return { text, changed: changed.reverse() };
}

export function reembed(root = ROOT) {
  const r = reembedText(root, readFileSync(join(root, REF), 'utf8'));
  if (r.changed.length) writeFileSync(join(root, REF), r.text, 'utf8');
  return r.changed;
}

export function controls() {
  let fail = 0;
  const say = (ok, text) => { console.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const text = readFileSync(join(ROOT, REF), 'utf8');
  const s0 = sweep(ROOT, text);
  say(s0.ok && s0.count >= 26, `the tree as it stands: ${s0.count} blocks, ${s0.drifted.length} drifted, ${s0.missing.length} shared subsets missing, ${s0.unknown.length} unknown${s0.ok ? '' : ` (${[...s0.drifted, ...s0.missing, ...s0.unknown].join(', ')})`}`);
  const ask = blocks(text).find((b) => b.name === 'cc-ask');
  const planted = text.slice(0, ask.bodyStart) + ask.body.replace('start|more|add|impactful|save', 'start|more|add|impactful') + text.slice(ask.bodyEnd);
  const s1 = sweep(ROOT, planted);
  say(planted !== text && s1.drifted.length === 1 && s1.drifted[0] === 'cc-ask' && !s1.ok, `trip: the gate enumeration planted without save drifts cc-ask and nothing else: ${s1.drifted.join(', ') || 'nothing'}`);
  const r = reembedText(ROOT, planted);
  say(r.changed.join() === 'cc-ask' && r.text === text, `a re-embed restores the planted block and touches no other: changed ${r.changed.join(', ') || 'nothing'}`);
  const ghost = text.replace('## cc-cache.dtd\n', '## cc-ghost.dtd\n');
  const s2 = sweep(ROOT, ghost);
  say(s2.unknown.join() === 'cc-ghost' && s2.missing.join() === 'cc-cache' && !s2.ok, `trip: a block naming a file dtd/ does not have is unknown, and the shared subset it displaced is missing: unknown ${s2.unknown.join(', ')}, missing ${s2.missing.join(', ')}`);
  let refused = '';
  try { reembedText(ROOT, ghost); } catch (e) { refused = e.message; }
  say(/cc-ghost\.dtd and dtd\/ has no such file/.test(refused), `trip: a re-embed of a block with no file is refused by name: ${refused.slice(0, 80)}`);
  console.log(`subsets-sweep controls: 5 run, ${fail} failing`);
  return fail === 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--controls')) process.exit(controls() ? 0 : 1);
  if (args.includes('--check')) {
    const r = sweep();
    if (r.ok) { console.log(`subsets-sweep: ${r.count} blocks in step`); process.exit(0); }
    const parts = [];
    if (r.drifted.length) parts.push(`${r.drifted.length} of ${r.count} drifted: ${r.drifted.join(', ')}`);
    if (r.missing.length) parts.push(`shared subsets with no block: ${r.missing.join(', ')}`);
    if (r.unknown.length) parts.push(`blocks with no file: ${r.unknown.join(', ')}`);
    console.log(`subsets-sweep: ${parts.join('; ')}`);
    process.exit(1);
  }
  const changed = reembed();
  console.log(`subsets-sweep: re-embedded ${changed.length} of ${sweep().count}${changed.length ? `: ${changed.join(', ')}` : ''}`);
}
