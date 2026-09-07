// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// controls-sweep.mjs : every `controls` count the release block claims is
// re-run and compared.
//
// CHANGELOG.md opens with the promise that every number in it was produced
// by the command named beside it. The companion audit of 9.0.0 found one
// that was not: `node lib/chain.mjs controls`: 15 run, where the command
// printed 20, carried from an earlier build and never re-run, and it found
// that nothing in the gate reads those lines (checker/release-notes.mjs
// checks version agreement and section shape, never the measurements).
// This sweep reads the newest section of the changelog, finds every claim
// of the shape `node <path> controls`: N run or N passed (and the
// --controls spelling), runs each command in the foreground under the
// portable ceiling with stdin closed, reads the count its last total line
// prints, and refuses on any disagreement with both numbers named.
//
// Usage: node checker/controls-sweep.mjs --check     (the gate step)
//        node checker/controls-sweep.mjs --controls  (the sweep tripped on a planted false count)
//        node checker/controls-sweep.mjs             (report only)

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const CEILING_SECS = 300;

// The newest section: from the first `## ` heading to the next one, or to
// the end of the file when it is the last. Sliced by index, because the
// fifth companion pass measured the first version leaning on \Z, which is
// not an anchor in JavaScript but the letter Z, correct by accident only
// while a later section followed.
export function newestSection(text) {
  const first = /^## /m.exec(text);
  if (!first) return '';
  const rest = text.slice(first.index + 3);
  const next = /^## /m.exec(rest);
  return next ? text.slice(first.index, first.index + 3 + next.index) : text.slice(first.index);
}

// Every claim: `node <path> controls`: N run|passed, or `--controls`. The
// separator between the path and the verb is any whitespace, because
// markdown wraps a backticked span across a line and the third companion
// pass measured the one claim that wrapped, lib/cache.mjs, swept never.
export function claims(section) {
  const out = [];
  const re = /`node\s+((?:lib|checker|bin)\/[\w./-]+\.mjs)\s+(--controls|controls)`:\s*(\d+)\s+(run|passed)/g;
  for (const m of section.matchAll(re)) out.push({ path: m[1], verb: m[2], claimed: Number(m[3]), word: m[4], text: m[0] });
  return out;
}

// The loose count of claims in a section, read by the command alone: every
// backticked `node <anything> controls` or `--controls` followed by a colon,
// whatever is written after it. The strict reader above must find exactly
// as many, so a claim whose path it cannot parse, or whose count is spelled
// in a shape it does not read (prints 12, 12 controls, 0 failing alone), is
// a refusal by number and never a silent miss. The fourth companion pass
// measured the first loose count sharing its tail with the strict one, so
// a new count spelling was invisible to both.
export function looseCount(section) {
  return (section.match(/`node\s+\S+\s+(?:--controls|controls)`\s*:/g) || []).length;
}

// The count a suite prints on its total line, which is the line that opens
// with the suite's name and the word controls (`chain controls: 25 run`,
// `controls: 31 run`, `cache controls: 17 passed`); the first such line,
// because lib/cache.mjs prints its total before its rows and a row may quote
// a number followed by run.
export function countOf(output) {
  for (const l of String(output).split(/\r?\n/)) {
    const m = /^[\w-]*\s*controls:\s*(\d+)\s+(run|passed)\b/.exec(l.trim());
    if (m) return Number(m[1]);
  }
  return null;
}

export function runOne(claim, root = ROOT) {
  const r = spawnSync(process.execPath, [join(root, 'lib', 'ceiling.mjs'), String(CEILING_SECS), process.execPath, join(root, claim.path), claim.verb], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  return { ...claim, measured: countOf(out), exit: r.status };
}

export function sweep({ root = ROOT, text = null } = {}) {
  const changelog = text === null ? readFileSync(join(root, 'CHANGELOG.md'), 'utf8') : text;
  const section = newestSection(changelog);
  const found = claims(section);
  const loose = looseCount(section);
  if (found.length !== loose) throw new Error(`controls-sweep: the section carries ${loose} claim shapes and the reader parsed ${found.length}; a claim it cannot read is not swept and the sweep refuses rather than under-reads`);
  // A release block with no claim is not swept: zero claims and zero drift
  // is a green from a sweep that read nothing, and the section that ships
  // has carried at least one since the sweep was written.
  if (found.length === 0) throw new Error(`controls-sweep: the newest section ${JSON.stringify(section.split('\n')[0])} carries no controls claim; a sweep that read nothing does not report zero drift`);
  const seen = new Map();
  const rows = [];
  for (const c of found) {
    const key = `${c.path} ${c.verb}`;
    if (!seen.has(key)) seen.set(key, runOne(c, root));
    const r = seen.get(key);
    rows.push({ ...c, measured: r.measured, exit: r.exit, agree: r.measured === c.claimed });
  }
  return { section: section.split('\n')[0], claims: rows, drifted: rows.filter((r) => !r.agree) };
}

export function report(s) {
  const lines = [];
  for (const r of s.claims) lines.push(`  ${r.agree ? 'ok   ' : 'DRIFT'} ${r.path} ${r.verb}: the changelog says ${r.claimed}, the command prints ${r.measured === null ? 'no total line' : r.measured}`);
  lines.push(`controls-sweep: ${s.claims.length} claims in ${JSON.stringify(s.section)}, ${s.drifted.length} drifted`);
  return lines.join('\n');
}

export function controls() {
  const rows = [];
  let pass = 0;
  let fail = 0;
  const say = (ok, text) => { rows.push(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); ok ? pass++ : fail++; };
  const text = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
  const section = newestSection(text);
  say(section.startsWith('## ') && !/\n## /.test(section.slice(3)), `the newest section is one section: ${JSON.stringify(section.split('\n')[0])}`);
  const lone = newestSection('# title\n\n## 1.0.0 (only)\n\n- `node lib/ceiling.mjs controls`: 7 run, 0 failing\n');
  say(lone.startsWith('## 1.0.0') && claims(lone).length === 1, 'trip: a changelog whose newest section is its last, with no capital letter after it, is read whole');
  let empty = '';
  try { sweep({ text: '## 2.0.0 (silent)\n\nno claims here\n\n## 1.0.0\n' }); } catch (e) { empty = e.message; }
  say(/carries no controls claim/.test(empty), `trip: a section with no claim refuses the sweep rather than reporting zero drift: ${empty.slice(0, 70)}`);
  const found = claims(section);
  say(found.length >= 3 && found.length === looseCount(section), `the release block carries controls claims to re-run, and the reader parses every claim shape the section carries: ${found.length} of ${looseCount(section)}`);
  say(countOf('cache controls: 17 passed, 0 failed\n  PASS a row that quotes 3 run and 2 passed') === 17 && countOf('  PASS a row quoting 9 run\ncontrols: 31 run, 0 failing') === 31 && countOf('nothing here') === null,
    'the total line is the one that opens with the suite name and controls, first or last, never a row quoting a count, and its absence is null');
  const wrapped = '## 0.0.0 (wrapped)\n\n- `node lib/cache.mjs\ncontrols`: 17 passed, 0 failed\n\n## 9.0.0\n';
  const w = claims(newestSection(wrapped));
  say(w.length === 1 && w[0].path === 'lib/cache.mjs' && looseCount(newestSection(wrapped)) === 1, 'trip: a claim markdown wrapped across a line is read, path and count');
  let refused = '';
  try { sweep({ text: '## 0.0.0 (unreadable)\n\n- `node lib/x.py controls`: 4 run, 0 failing\n\n## 9.0.0\n' }); } catch (e) { refused = e.message; }
  say(/1 claim shapes and the reader parsed 0/.test(refused), `trip: a claim shape the reader cannot parse refuses the sweep by count: ${refused.slice(0, 90)}`);
  let spelled = '';
  try { sweep({ text: '## 0.0.0 (spelled)\n\n- `node lib/ceiling.mjs controls`: prints 12, 0 failing\n- `node lib/ceiling.mjs controls`: 12 controls\n\n## 9.0.0\n' }); } catch (e) { spelled = e.message; }
  say(/2 claim shapes and the reader parsed 0/.test(spelled), `trip: a count spelled as prints 12 or 12 controls is a claim the reader does not read, and the sweep refuses by number: ${spelled.slice(0, 80)}`);
  // One real claim re-run, a cheap suite that prints a count (ordinals prints
  // ok with no count, which is exactly the absence countOf reports as null).
  const one = runOne({ path: 'lib/ceiling.mjs', verb: 'controls', claimed: 0, word: 'run' });
  say(one.measured !== null && one.exit === 0, `a suite runs under the ceiling with stdin closed and prints a total: lib/ceiling.mjs ${one.measured} run`);
  const none = runOne({ path: 'lib/ordinals.mjs', verb: 'controls', claimed: 0, word: 'run' });
  say(none.measured === null && none.exit === 0, 'a suite that prints no count is reported as no total line, never as zero');
  // The trip: a planted false count is named with both numbers.
  const planted = `## 0.0.0 (planted)\n\n- \`node lib/ceiling.mjs controls\`: ${one.measured + 5} run, 0 failing\n- \`node lib/ceiling.mjs controls\`: ${one.measured} run, 0 failing\n\n## 9.0.0\n`;
  const s = sweep({ text: planted });
  say(s.claims.length === 2 && s.drifted.length === 1 && s.drifted[0].claimed === one.measured + 5 && s.drifted[0].measured === one.measured,
    `trip: a planted count of ${one.measured + 5} beside a true ${one.measured} is reported as drift with both numbers, and the true one agrees`);
  say(/DRIFT lib\/ceiling\.mjs controls: the changelog says \d+, the command prints \d+/.test(report(s)), 'the report names the path, the claim and the measurement');
  return { pass, fail, rows };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  if (argv.includes('--controls')) {
    const r = controls();
    for (const row of r.rows) console.log(row);
    console.log(`controls-sweep controls: ${r.pass + r.fail} run, ${r.fail} failing`);
    process.exit(r.fail ? 1 : 0);
  }
  const s = sweep();
  console.log(report(s));
  process.exit(argv.includes('--check') && s.drifted.length ? 1 : 0);
}
