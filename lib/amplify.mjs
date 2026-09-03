#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/amplify.mjs
// The growth engine of /amplify-codebase-dtd, /enhance-codebase-dtd and
// /overhaul-codebase-dtd. Everything it knows about verbs, layers, ceilings,
// release classes and laws comes from dtd/cc-amplify.dtd; nothing is repeated
// here (LAW.LEX.1 is the precedent).
//
//   contract()                  the ladder, the layers, the ceilings, the classes
//   band(name)                  the verb numbers a command may expose
//   detect(root)                which layers the target declares, and whether any
//   walk(root, layers, io)      the instruments, foreground, ceilinged, exits read
//   idOf(p)                     the stable id of a possibility
//   rank(list)                  gaps before ideas, then risk, then files
//   page(list, offset, size)    the generator's next page and what stays unshown
//   readState/writeState(dir)   the memory between runs (LAW.AMP.6)
//   recognize(kept, from)       the release class and the version it moves to
//   controls(io)                every law tripped on purpose
//
//   node lib/amplify.mjs detect | walk | state | recognize <kept...> | controls

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseSubset } from './dtd.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DTD = join(ROOT, 'dtd', 'cc-amplify.dtd');

export function contract(path = DTD) {
  const sub = parseSubset(readFileSync(path, 'utf8'));
  const e = (k) => sub.entities.get(k) || '';
  const verbs = [];
  for (let i = 1; i <= Number(e('AMP.ladder.count') || 0); i++) {
    const v = e(`AMP.verb.${i}`);
    const [name, gloss] = v.split(':');
    verbs.push({ n: i, name: (name || '').trim(), gloss: (gloss || '').trim() });
  }
  const bands = {};
  for (const b of ['amplify', 'enhance', 'overhaul']) bands[b] = e(`AMP.band.${b}`).split('|').map(Number).filter(Boolean);
  const releases = {};
  for (const r of ['major', 'mid', 'minor', 'alpha', 'beta', 'pre']) {
    const v = e(`AMP.release.${r}`);
    const [inc, why] = v.split(':');
    releases[r] = { increment: (inc || '').trim(), why: (why || '').trim() };
  }
  const laws = [...sub.entities.keys()].filter((k) => k.startsWith('LAW.AMP.'));
  return {
    verbs,
    bands,
    releases,
    laws,
    lawText: new Map(laws.map((k) => [k, sub.entities.get(k)])),
    layers: e('AMP.layers').split('|').map((s) => s.trim()).filter(Boolean),
    ceilingFamily: Number(e('AMP.ceiling.family')),
    ceilingTotal: Number(e('AMP.ceiling.total')),
    page: Number(e('AMP.page')),
    pageMax: Number(e('AMP.page.max')),
    grow: { marked: Number(e('AMP.grow.marked').split(':')[0]), other: Number(e('AMP.grow.other').split(':')[0]), skipped: Number(e('AMP.grow.skipped').split(':')[0]) },
    reopenAfter: Number(e('AMP.reopen.after')),
    rounds: Number(e('AMP.rounds')),
    questions: Number(e('AMP.questions')),
    dir: e('AMP.dir'),
    stateFile: e('AMP.state'),
  };
}

export function band(command, c = contract()) {
  const key = String(command).replace(/-codebase-dtd$/, '').replace(/^\//, '');
  return c.bands[key] || [];
}
export function verbOf(n, c = contract()) { return c.verbs.find((v) => v.n === Number(n)) || null; }

// Which layers the target actually declares (LAW.AMP.1, LAW.AMP.10). A layer
// is present when the file or directory that carries it exists; `generic` is
// always present, and it is the whole answer for a tree that declares nothing.
export const LAYER_MARKS = {
  schematic: ['dtd/cc-schematic.dtd'],
  form: ['dtd/cc-form.dtd'],
  voice: ['dtd/ai-slop.dtd', 'dtd/cc-lexicon.dtd'],
  args: ['dtd/cc-args.dtd'],
  record: ['dtd/cc-record.dtd'],
  report: ['dtd/cc-report.dtd'],
  task: ['dtd/cc-task.dtd'],
  workflow: ['dtd/cc-workflow.dtd'],
  adiutor: ['dtd/adiutor.dtd'],
  license: ['dtd/cc-license.dtd'],
  rot: ['dtd/cc-rot.dtd'],
};

export function detect(root, c = contract()) {
  const present = [];
  for (const name of c.layers) {
    if (name === 'generic') continue;
    const marks = LAYER_MARKS[name] || [];
    if (marks.some((m) => existsSync(join(root, m)))) present.push(name);
  }
  const declared = present.length > 0;
  present.push('generic');
  return { layers: present, declared };
}

// The instruments a layer runs, in the order they cost. Each is a command and
// its arguments; the walk runs them in the foreground under the ceiling and
// reads the exit code directly (LAW.AMP.2). A layer with no instrument is
// read by hand and says so with an empty instrument.
export const INSTRUMENTS = {
  schematic: [['node', ['checker/contract-audit.mjs']]],
  form: [['node', ['bin/rot-dtd-commander.mjs', 'check']]],
  voice: [['node', ['lib/ai-slop.mjs', 'controls']], ['node', ['lib/ai-slop.mjs', 'sweep', 'src']]],
  args: [['node', ['lib/args.mjs', 'controls']]],
  record: [['node', ['lib/record.mjs', 'controls']]],
  report: [],
  task: [['node', ['lib/task.mjs', 'controls']]],
  workflow: [['node', ['checker/gate-sync.mjs']]],
  adiutor: [['node', ['bin/adiutor.mjs', 'controls']]],
  license: [['node', ['lib/license.mjs', 'controls']]],
  rot: [],
  generic: [],
};

function run(root, cmd, args, seconds) {
  const started = Date.now();
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', timeout: seconds * 1000, stdio: ['ignore', 'pipe', 'pipe'] });
  return { exit: r.status === null ? 124 : r.status, out: ((r.stdout || '') + (r.stderr || '')).trim(), seconds: Math.round((Date.now() - started) / 100) / 10 };
}

function countFiles(root, dir, ext) {
  const p = join(root, dir);
  if (!existsSync(p)) return 0;
  try { return readdirSync(p).filter((f) => f.endsWith(ext) || statSync(join(p, f)).isDirectory()).length; } catch { return 0; }
}

// LAW.AMP.1, LAW.AMP.2, LAW.AMP.9: every layer walked in the foreground under
// its ceiling, instruments first, the sample's denominator stated, and a
// layer that reaches the ceiling rendered timeout rather than empty.
export function walk(root, layers, { c = contract(), io = null, instruments = INSTRUMENTS } = {}) {
  const out = [];
  const started = Date.now();
  for (const name of layers) {
    const elapsed = (Date.now() - started) / 1000;
    if (elapsed > c.ceilingTotal) { out.push({ name, instrument: '', exit: '124', read: 0, of: 0, walked: 'timeout', note: 'the walk reached AMP.ceiling.total before this layer' }); continue; }
    const budget = Math.max(1, Math.min(c.ceilingFamily, c.ceilingTotal - elapsed));
    const insts = instruments[name] || [];
    if (!insts.length) {
      const of = name === 'generic' ? countFiles(root, 'lib', '.mjs') : countFiles(root, 'src/commands', '.md');
      out.push({ name, instrument: '', exit: '-', read: Math.min(of, 12), of, walked: 'yes', note: 'no instrument: read by hand, sampled by newest' });
      if (io) io.log(`  ${name}: read by hand, ${Math.min(of, 12)} of ${of}`);
      continue;
    }
    let worst = 0;
    const lines = [];
    for (const [cmd, args] of insts) {
      const r = run(root, cmd, args, budget);
      worst = r.exit === 124 ? 124 : Math.max(worst, r.exit);
      lines.push(`${cmd} ${args.join(' ')} exit ${r.exit} in ${r.seconds}s: ${r.out.split('\n').slice(-1)[0].slice(0, 120)}`);
      if (io) io.log(`  ${name}: ${cmd} ${args.join(' ')} exit ${r.exit} (${r.seconds}s)`);
    }
    out.push({ name, instrument: insts.map(([cmd, a]) => `${cmd} ${a.join(' ')}`).join(' ; '), exit: String(worst), read: insts.length, of: insts.length, walked: worst === 124 ? 'timeout' : 'yes', note: lines.join('\n') });
  }
  return { layers: out, seconds: Math.round((Date.now() - started) / 100) / 10 };
}

// LAW.AMP.11: the page grows with the answering. The operator's engagement is
// the whole of the movement; the size of the walk only decides how far the
// movement may ever reach, so a small tree cannot flood a good answerer and a
// large one cannot page wide before anything has been answered.
export function ceilingOf(exposed, c = contract()) {
  if (!exposed) return c.page;
  return Math.max(c.page, Math.min(c.pageMax, Math.ceil(exposed / 5)));
}
export function grow(size, round, { c = contract(), exposed = 0 } = {}) {
  const g = c.grow;
  const moved = (Number(round.marked) || 0) * g.marked + (round.other ? g.other : 0) + (round.answered === false ? g.skipped : 0);
  const ceiling = ceilingOf(exposed, c);
  return Math.max(c.page, Math.min(ceiling, (Number(size) || c.page) + moved));
}

// LAW.AMP.6: the id is stable across runs because it is derived from what the
// possibility IS, never from when it was found.
export function idOf(p) {
  const files = [].concat(p.files || []).map((f) => String(f).replace(/\\/g, '/')).sort().join(',');
  return createHash('sha256').update(`${p.layer}|${files}|${p.law || p.adds || p.why || ''}`).digest('hex').slice(0, 8);
}

const RISK = { high: 0, medium: 1, low: 2 };
export function rank(list) {
  return [...list].sort((a, b) => (a.class === b.class ? 0 : a.class === 'gap' ? -1 : 1)
    || (RISK[a.risk] ?? 3) - (RISK[b.risk] ?? 3)
    || [].concat(b.files || []).length - [].concat(a.files || []).length
    || String(a.id).localeCompare(String(b.id)));
}

// LAW.AMP.5: at most `size` per round, the unshown counted beside them.
export function page(list, offset = 0, size = contract().page) {
  const ranked = rank(list);
  const shown = ranked.slice(offset, offset + size);
  return { shown, offset: offset + shown.length, exposed: ranked.length, shown_n: shown.length, unshown: Math.max(0, ranked.length - offset - shown.length) };
}

// ---- the state record (LAW.AMP.6) ----
// Every file this family writes carries the licence tag of the tree it is
// written into, so a sweep finds none of them untagged.
const SPDX = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->'];
const STATE_HEAD = '<!-- amplify-codebase state; one row per possibility, id class layer verdict verb -->';

export function statePath(root, c = contract()) { return join(root, c.dir, c.stateFile); }

export function readState(root, c = contract()) {
  const p = statePath(root, c);
  const empty = { run: 0, verb: 0, offset: 0, page: 0, release: '', walked: [], rows: [] };
  if (!existsSync(p)) return empty;
  const text = readFileSync(p, 'utf8');
  const head = {};
  for (const m of text.matchAll(/^- (run|verb|offset|release|walked|page): (.*)$/gm)) head[m[1]] = m[2].trim();
  const rows = [];
  for (const m of text.matchAll(/^\| ([0-9a-f]{8}) \| (gap|idea) \| ([a-z]+) \| (exposed|marked|refused|done|reopen) \| ([0-9]+) \| ([0-9]*) \| (.*) \|$/gm)) {
    rows.push({ id: m[1], class: m[2], layer: m[3], verdict: m[4], verb: Number(m[5]), refused_at: Number(m[6] || 0), why: m[7].trim() });
  }
  return { run: Number(head.run || 0), verb: Number(head.verb || 0), offset: Number(head.offset || 0), page: Number(head.page || 0), release: head.release || '', walked: (head.walked || '').split(/[, ]+/).filter(Boolean), rows };
}

export function writeState(root, state, c = contract()) {
  const dir = join(root, c.dir);
  mkdirSync(dir, { recursive: true });
  const lines = [...SPDX, STATE_HEAD, '', '# amplify-codebase: the state between runs', '',
    `- run: ${state.run}`, `- verb: ${state.verb}`, `- offset: ${state.offset}`, `- page: ${state.page || 0}`, `- release: ${state.release || ''}`, `- walked: ${(state.walked || []).join(', ')}`,
    '', '| id | class | layer | verdict | verb | refused_at | why |', '|---|---|---|---|---|---|---|'];
  for (const r of state.rows) lines.push(`| ${r.id} | ${r.class} | ${r.layer} | ${r.verdict} | ${r.verb} | ${r.refused_at || ''} | ${String(r.why).replace(/\|/g, '/').slice(0, 160)} |`);
  lines.push('');
  const p = statePath(root, c);
  writeFileSync(p, lines.join('\n'), 'utf8');
  return p;
}

// LAW.AMP.6 and LAW.AMP.12: a done possibility never returns; a refused one
// returns as a reopen after AMP.reopen.after runs, or as soon as a file named
// in its id changes, whichever comes first. The row keeps the run it was
// refused at so a second offer is visibly a second offer.
export function unrefused(list, state, { c = contract(), changed = [] } = {}) {
  const touched = new Set([].concat(changed).map((f) => String(f).replace(/\\/g, '/')));
  const rows = new Map(state.rows.map((r) => [r.id, r]));
  const out = [];
  for (const p of list) {
    const id = p.id || idOf(p);
    const row = rows.get(id);
    if (!row || row.verdict === 'exposed' || row.verdict === 'marked') { out.push(p); continue; }
    if (row.verdict === 'done') continue;
    const at = Number(row.refused_at || row.verb_at || 0);
    const runs = Math.max(0, Number(state.run || 0) - at);
    const moved = [].concat(p.files || []).some((f) => touched.has(String(f).replace(/\\/g, '/')));
    if (runs >= c.reopenAfter || moved) out.push({ ...p, id, verdict: 'reopen', refused_at: at, reopened_by: moved ? 'a change beneath it' : `${runs} runs` });
  }
  return out;
}

// LAW.AMP.13: the walk reads other people's repositories, and a scanned file
// may carry its own DTD. A parameter entity found there is reported as data
// and never expanded, so a foreign tree cannot inject declarations into a run.
export function pentityGuard(text) {
  const found = [];
  for (const m of String(text).matchAll(/<!ENTITY\s+%\s+([\w.:-]+)\s+([^>]*)>/g)) found.push({ name: m[1], raw: m[0], expanded: false });
  for (const m of String(text).matchAll(/%([\w.:-]+);/g)) found.push({ name: m[1], raw: m[0], expanded: false });
  return { found, expanded: 0, data: found.map((f) => f.raw) };
}

// ---- the study: the four documents (LAW.AMP.7) ----
// Text is escaped into PCDATA and never wrapped in a CDATA section: a
// possibility's evidence carries paths and code, and a fragment holding the
// CDATA close delimiter would end the section early (LAW.AMP.13).
export function escapePcdata(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
export const STUDY_KINDS = ['family', 'ledger', 'roadmap', 'handoff'];

export function writeStudy(root, run, { c = contract() } = {}) {
  const dir = join(root, c.dir);
  mkdirSync(dir, { recursive: true });
  const stamp = run.date || new Date().toISOString().slice(0, 10);
  const out = [];
  const put = (kind, name, lines) => {
    const rel = `${c.dir}/${stamp}-${name}.md`;
    writeFileSync(join(root, rel), [...SPDX, '', ...lines].join('\n') + '\n', 'utf8');
    out.push({ kind, path: rel });
  };
  for (const layer of run.layers || []) {
    put('family', `family-${layer.name}`, [
      `# The ${layer.name} layer, run ${run.run}`, '',
      `- instrument: ${layer.instrument || 'none: read by hand'}`,
      `- exit: ${layer.exit}`, `- read: ${layer.read} of ${layer.of}`, `- walked: ${layer.walked}`, '',
      ...(run.possibilities || []).filter((p) => p.layer === layer.name).map((p) => `- [${p.class}] ${escapePcdata(p.why || '')}`),
    ]);
  }
  put('ledger', 'ledger', ['# The possibility ledger', '', '| id | class | verb | layer | confidence | verdict | why |', '|---|---|---|---|---|---|---|',
    ...rank(run.possibilities || []).map((p) => `| ${p.id || idOf(p)} | ${p.class} | ${p.verb} | ${p.layer} | ${p.confidence || ''} | ${p.verdict || 'exposed'} | ${escapePcdata(String(p.why || '')).replace(/\|/g, '/')} |`)]);
  const kept = (run.possibilities || []).filter((p) => p.verdict === 'marked');
  put('roadmap', 'roadmap', [`# The roadmap to ${run.release ? run.release.to : 'the next release'}`, '',
    `Release class: ${run.release ? run.release.class : 'not recognised'}; taken: no.`, '',
    ...kept.map((p, i) => `${i + 1}. verb ${p.verb} — ${escapePcdata(p.why || '')}`)]);
  put('handoff', 'handoff', ['# The handoff for the next run', '',
    `- run: ${run.run}`, `- page: ${run.page || c.page}`, `- offset: ${run.offset || 0}`,
    `- walked: ${(run.layers || []).map((l) => l.name).join(', ')}`,
    `- refused: ${(run.possibilities || []).filter((p) => p.verdict === 'refused').length}`,
    `- verb ended on: ${run.verb || 0}`]);
  return out;
}

export function studyHolds(documents) {
  const kinds = new Set(documents.map((d) => d.kind));
  const missing = STUDY_KINDS.filter((k) => !kinds.has(k));
  return { holds: missing.length === 0, missing };
}

// ---- the release recognizer (LAW.AMP.8) ----
export function bump(from, increment) {
  const a = String(from).split('.').map((n) => Number(n) || 0);
  const b = String(increment).split('.').map((n) => Number(n) || 0);
  while (a.length < b.length) a.push(0);
  const out = a.map((n, i) => n + (b[i] || 0));
  // A carried segment resets the ones below it: 5.1.2 plus 0.1.0 is 5.2.0.
  const first = b.findIndex((n) => n > 0);
  if (first >= 0) for (let i = first + 1; i < out.length; i++) out[i] = 0;
  return out.join('.');
}

export function recognize(kept, from = '0.0.0', { c = contract(), stage = null } = {}) {
  const top = kept.reduce((m, p) => Math.max(m, Number(p.verb) || 0), 0);
  let cls = 'minor';
  if (top >= 14) cls = 'major';
  else if (top >= 9) cls = 'mid';
  if (stage && c.releases[stage]) cls = stage;
  const r = c.releases[cls];
  return { class: cls, from, to: bump(from, r.increment), increment: r.increment, why: r.why, top, taken: 'no' };
}

// ---- the contract as a table (the skill's reference, generated) ----
export function table(c = contract()) {
  const L = [];
  L.push('<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->', '');
  L.push('# The growth contract', '', 'Generated by `node lib/amplify.mjs table` from `dtd/cc-amplify.dtd`. The controls refuse a copy that has drifted from the declarations.', '');
  L.push('## The ladder', '', '| n | verb | what it means | band |', '|---|---|---|---|');
  const bandOf = (n) => Object.keys(c.bands).find((b) => c.bands[b].includes(n)) || '';
  for (const v of c.verbs) L.push(`| ${v.n} | ${v.name} | ${v.gloss} | ${bandOf(v.n)} |`);
  L.push('', '## The bands', '', '| command | verbs |', '|---|---|');
  for (const [b, ns] of Object.entries(c.bands)) L.push(`| /${b}-codebase-dtd | ${ns.map((n) => `${n} ${verbOf(n, c).name}`).join(', ')} |`);
  L.push('', '## The layers and their instruments', '', '| layer | declared by | instruments |', '|---|---|---|');
  for (const name of c.layers) L.push(`| ${name} | ${(LAYER_MARKS[name] || ['(always)']).join(', ')} | ${(INSTRUMENTS[name] || []).map(([cmd, a]) => `\`${cmd} ${a.join(' ')}\``).join(' ; ') || 'read by hand'} |`);
  L.push('', '## The bounds', '', '| entity | value |', '|---|---|');
  L.push(`| AMP.ceiling.family | ${c.ceilingFamily} s |`, `| AMP.ceiling.total | ${c.ceilingTotal} s |`, `| AMP.page | ${c.page} (the floor) |`, `| AMP.page.max | ${c.pageMax} (the ceiling) |`, `| AMP.grow.marked | +${c.grow.marked} |`, `| AMP.grow.other | +${c.grow.other} |`, `| AMP.grow.skipped | ${c.grow.skipped} |`, `| AMP.reopen.after | ${c.reopenAfter} runs |`, `| AMP.rounds | ${c.rounds} |`, `| AMP.questions | ${c.questions} |`, `| AMP.dir | ${c.dir} |`, `| AMP.state | ${c.stateFile} |`);
  L.push('', '## The release classes', '', '| class | increment | when |', '|---|---|---|');
  for (const [k, r] of Object.entries(c.releases)) L.push(`| ${k} | ${r.increment} | ${r.why} |`);
  L.push('', '## The laws', '');
  for (const k of c.laws) L.push(`- **${k}**: ${c.lawText.get(k)}`);
  L.push('');
  return L.join('\n');
}

// LAW.AMP.14: the version a release publishes must equal what the recognizer
// computes from the verbs that release kept. The number stops being typed.
export function versionHolds(version, kept, from, { c = contract(), stage = null } = {}) {
  const r = recognize(kept, from, { c, stage });
  return { holds: String(version) === r.to, recognised: r.to, class: r.class, from, version: String(version) };
}

// ---- controls: every law tripped on purpose ----
export function controls(io = console) {
  let fail = 0;
  const say = (ok, text) => { io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const c = contract();

  say(c.verbs.length === 15 && c.verbs[0].name === 'tweak' && c.verbs[14].name === 'metamorphosis' && c.verbs.every((v, i) => v.n === i + 1 && v.gloss),
    `the ladder is fifteen verbs, ascending, each with a gloss: ${c.verbs[0].name} .. ${c.verbs[14].name}`);
  const all = [...c.bands.amplify, ...c.bands.enhance, ...c.bands.overhaul];
  say(all.length === 15 && new Set(all).size === 15 && Math.min(...all) === 1 && Math.max(...all) === 15,
    `the three bands partition the ladder with no overlap and no gap: ${JSON.stringify(c.bands)}`);
  say(c.laws.length === 14 && c.laws.every((k, i) => k === `LAW.AMP.${i + 1}`), `LAW.AMP.1 to ${c.laws.length}, dense and ascending`);

  const p1 = { layer: 'record', files: ['src/commands/loci-dtd.md', 'src/commands/a.md'], law: 'LAW.REC.5' };
  const p2 = { layer: 'record', files: ['src/commands/a.md', 'src/commands/loci-dtd.md'], law: 'LAW.REC.5' };
  const p3 = { layer: 'record', files: ['src/commands/a.md'], law: 'LAW.REC.5' };
  say(idOf(p1) === idOf(p2) && idOf(p1) !== idOf(p3) && /^[0-9a-f]{8}$/.test(idOf(p1)),
    `the id is stable under file order and changes with the files: ${idOf(p1)} vs ${idOf(p3)}`);

  const list = [
    { id: 'aaaaaaa1', class: 'idea', risk: 'low', files: ['x'], verb: 11 },
    { id: 'aaaaaaa2', class: 'gap', risk: 'low', files: ['x'], verb: 2 },
    { id: 'aaaaaaa3', class: 'gap', risk: 'high', files: ['x', 'y'], verb: 3 },
    { id: 'aaaaaaa4', class: 'idea', risk: 'high', files: ['x'], verb: 13 },
    { id: 'aaaaaaa5', class: 'gap', risk: 'medium', files: ['x'], verb: 4 },
  ];
  const ranked = rank(list);
  say(ranked[0].id === 'aaaaaaa3' && ranked.slice(0, 3).every((p) => p.class === 'gap') && ranked[3].class === 'idea',
    `gaps rank before ideas and risk orders within a class: ${ranked.map((p) => p.class[0] + p.risk[0]).join(' ')}`);

  const pg = page(list, 0, c.page);
  const pg2 = page(list, pg.offset, c.page);
  say(pg.shown_n === 4 && pg.unshown === 1 && pg2.shown_n === 1 && pg2.unshown === 0 && pg2.shown[0].id !== pg.shown[0].id,
    `the generator pages ${c.page} at a time and counts the unshown: ${pg.shown_n}+${pg2.shown_n} of ${pg.exposed}, unshown ${pg.unshown} then ${pg2.unshown}`);

  const st = { rows: [{ id: 'aaaaaaa2', verdict: 'refused' }, { id: 'aaaaaaa5', verdict: 'done' }, { id: 'aaaaaaa1', verdict: 'exposed' }] };
  const left = unrefused(list, st).map((p) => p.id);
  say(!left.includes('aaaaaaa2') && !left.includes('aaaaaaa5') && left.includes('aaaaaaa1') && left.length === 3,
    `a refused or done id is never offered again; an exposed one is: ${left.join(' ')}`);

  say(bump('5.1.0', '0.0.1') === '5.1.1' && bump('5.1.2', '0.1.0') === '5.2.0' && bump('5.1.2', '1.0.0') === '6.0.0' && bump('5.1.0', '0.1.0.0') === '5.2.0.0',
    `the recognizer's arithmetic carries and resets: 5.1.2 + 0.1.0 = ${bump('5.1.2', '0.1.0')}, 5.1.2 + 1.0.0 = ${bump('5.1.2', '1.0.0')}`);
  const rMinor = recognize([{ verb: 2 }, { verb: 3 }], '5.1.0');
  const rMid = recognize([{ verb: 3 }, { verb: 11 }], '5.1.0');
  const rMajor = recognize([{ verb: 15 }], '5.1.0');
  const rBeta = recognize([{ verb: 15 }], '5.1.0', { stage: 'beta' });
  say(rMinor.class === 'minor' && rMinor.to === '5.1.1' && rMid.class === 'mid' && rMid.to === '5.2.0' && rMajor.class === 'major' && rMajor.to === '6.0.0' && rBeta.class === 'beta' && rBeta.to === '5.1.1.0',
    `the class follows the highest verb kept, and a stage overrides it: minor ${rMinor.to}, mid ${rMid.to}, major ${rMajor.to}, beta ${rBeta.to}`);
  say([rMinor, rMid, rMajor, rBeta].every((r) => r.taken === 'no'), 'every recognised release carries taken no: the command names a version and never takes it (LAW.AMP.8)');

  const tmp = join(process.env.TEMP || '/tmp', `rot-amp-${process.pid}`);
  mkdirSync(join(tmp, c.dir), { recursive: true });
  const written = writeState(tmp, { run: 3, verb: 8, offset: 41, release: 'mid 5.2.0', walked: ['schematic', 'record'], rows: [{ id: 'a3f10000', class: 'gap', layer: 'record', verdict: 'refused', verb: 7, why: 'six commands declare a record they never write' }] });
  const back = readState(tmp);
  say(existsSync(written) && back.run === 3 && back.verb === 8 && back.offset === 41 && back.walked.length === 2 && back.rows.length === 1 && back.rows[0].id === 'a3f10000' && back.rows[0].verdict === 'refused',
    `the state record round-trips: run ${back.run}, verb ${back.verb}, offset ${back.offset}, ${back.rows.length} row(s)`);
  const fresh = readState(join(tmp, 'nowhere'));
  say(fresh.run === 0 && fresh.rows.length === 0, 'a target with no state record starts at run 0 with nothing refused');

  const det = detect(ROOT, c);
  say(det.declared && det.layers.includes('schematic') && det.layers.includes('generic') && det.layers.length >= 8,
    `this tree declares ${det.layers.length - 1} layers plus generic: ${det.layers.join(', ')}`);
  const bare = detect(tmp, c);
  say(!bare.declared && bare.layers.length === 1 && bare.layers[0] === 'generic',
    'a tree that declares nothing falls back to the generic layer alone, and the walk says declared no (LAW.AMP.10)');

  const w = walk(ROOT, ['report'], { c });
  say(w.layers[0].walked === 'yes' && w.layers[0].instrument === '' && w.layers[0].of > 0 && w.layers[0].read <= w.layers[0].of,
    `a layer with no instrument is read by hand with its denominator stated: ${w.layers[0].read} of ${w.layers[0].of} (LAW.AMP.9)`);
  // The trip: an instrument that cannot finish inside the ceiling. The budget
  // has a one-second floor, so the instrument sleeps past it on purpose.
  const slow = { voice: [['node', ['-e', 'const t = Date.now(); while (Date.now() - t < 4000);']]] };
  const wTimeout = walk(ROOT, ['voice'], { c: { ...c, ceilingFamily: 1, ceilingTotal: 2 }, instruments: slow });
  say(wTimeout.layers[0].walked === 'timeout' && wTimeout.layers[0].exit === '124',
    `trip: a layer that reaches its ceiling is rendered timeout with exit 124, never empty: walked=${wTimeout.layers[0].walked} exit=${wTimeout.layers[0].exit} (LAW.AMP.1)`);

  say(band('amplify-codebase-dtd', c).length === 5 && band('/overhaul-codebase-dtd', c).includes(15) && !band('amplify-codebase-dtd', c).includes(15),
    'a command exposes only its own band of the ladder (LAW.AMP.4)');

  const ref = join(ROOT, 'dtd', 'ladder.md');
  const want = table(c);
  const have = existsSync(ref) ? readFileSync(ref, 'utf8') : '';
  say(have === want, have === want ? 'dtd/ladder.md is the contract as generated' : `dtd/ladder.md drifted from dtd/cc-amplify.dtd: run node lib/amplify.mjs table and write it to ${ref}`);
  say(/\| 15 \| metamorphosis \|/.test(want) && /AMP.ceiling.total \| 900 s/.test(want) && /\| major \| 1.0.0 \|/.test(want) && want.includes('LAW.AMP.10'),
    'the table renders the ladder, the bounds, the release classes and every law from the declarations alone');

  // LAW.AMP.11: the page grows with the answering, floors, and is held by the
  // ceiling the walk's own size allows.
  const g0 = c.page;
  const g1 = grow(g0, { marked: 2 }, { c, exposed: 100 });
  const g2 = grow(g1, { marked: 1, other: true }, { c, exposed: 100 });
  const g3 = grow(g2, { answered: false }, { c, exposed: 100 });
  const gFloor = grow(c.page, { answered: false }, { c, exposed: 100 });
  say(g1 === g0 + 2 && g2 === g1 + 2 && g3 === g2 - 1 && gFloor === c.page,
    `the page grows with the answering and never falls below the floor: ${g0} -> ${g1} -> ${g2} -> ${g3}, floor held at ${gFloor} (LAW.AMP.11)`);
  const small = grow(12, { marked: 4 }, { c, exposed: 10 });
  const large = grow(4, { marked: 4 }, { c, exposed: 400 });
  say(small === ceilingOf(10, c) && small < large && large <= c.pageMax && ceilingOf(400, c) === c.pageMax,
    `the tree's size only breaks the tie: 10 possibilities cap at ${small}, 400 cap at ${ceilingOf(400, c)}, and the well-answered run reaches ${large} (AMP.grow.tie)`);

  // LAW.AMP.12: a refusal expires, a done possibility does not, and a change
  // beneath a refusal reopens it early.
  const pool = [{ id: 'bbbbbbb1', layer: 'record', files: ['lib/record.mjs'], class: 'gap', risk: 'low' },
    { id: 'bbbbbbb2', layer: 'voice', files: ['lib/ai-slop.mjs'], class: 'gap', risk: 'low' },
    { id: 'bbbbbbb3', layer: 'task', files: ['lib/task.mjs'], class: 'idea', risk: 'low' }];
  const st2 = { run: 5, rows: [{ id: 'bbbbbbb1', verdict: 'refused', refused_at: 2 }, { id: 'bbbbbbb2', verdict: 'refused', refused_at: 3 }, { id: 'bbbbbbb3', verdict: 'done', refused_at: 1 }] };
  const reopened = unrefused(pool, st2, { c });
  say(reopened.length === 1 && reopened[0].id === 'bbbbbbb1' && reopened[0].verdict === 'reopen' && reopened[0].refused_at === 2,
    `a refusal returns after ${c.reopenAfter} runs as a reopen carrying the run it was refused at; a newer refusal stays closed and a done one never returns (LAW.AMP.12)`);
  const early = unrefused(pool, st2, { c, changed: ['lib/ai-slop.mjs'] });
  say(early.some((p) => p.id === 'bbbbbbb2' && p.reopened_by === 'a change beneath it') && !early.some((p) => p.id === 'bbbbbbb3'),
    'a change beneath a refusal reopens it before its runs are up, and no change reopens a done possibility (AMP.reopen.on)');

  // LAW.AMP.7: the study is four kinds, and a missing kind is refused.
  const runFixture = {
    run: 1, date: '2026-09-03', page: 4, offset: 0, verb: 3,
    layers: [{ name: 'record', instrument: 'node lib/record.mjs controls', exit: '0', read: 1, of: 1, walked: 'yes' }],
    possibilities: [{ id: 'ccccccc1', class: 'gap', verb: 3, layer: 'record', confidence: 'measured', verdict: 'marked', why: 'a record declared and never written', files: ['x'], risk: 'low' }],
    release: { class: 'minor', to: '5.2.1' },
  };
  const docs = writeStudy(tmp, runFixture, { c });
  const kinds = docs.map((d) => d.kind);
  say(studyHolds(docs).holds && STUDY_KINDS.every((k) => kinds.includes(k)) && docs.every((d) => existsSync(join(tmp, d.path))),
    `the study writes all four kinds and every path exists: ${kinds.join(', ')} (LAW.AMP.7)`);
  const lacking = studyHolds(docs.filter((d) => d.kind !== 'roadmap'));
  say(!lacking.holds && lacking.missing.join() === 'roadmap',
    `trip: a study missing a kind is refused by name: missing ${lacking.missing.join(', ')}`);

  // LAW.AMP.13, the four guards.
  const nasty = 'a < b && c > d ]]> <!ENTITY % evil "x">';
  const esc = escapePcdata(nasty);
  say(!esc.includes('<') && !esc.includes('>') && esc.includes('&lt;') && esc.includes('&amp;&amp;') && !esc.includes(']]>'),
    'a possibility carrying angle brackets, ampersands and the CDATA close delimiter is escaped into PCDATA, never wrapped in a section (LAW.AMP.13)');
  const literalDoc = { ...runFixture, date: '2026-09-04', possibilities: [{ ...runFixture.possibilities[0], why: 'the text $@ and ${x} and `cmd` and <<EOF must survive' }] };
  const wrote = writeStudy(tmp, literalDoc, { c });
  const ledgerText = readFileSync(join(tmp, wrote.find((d) => d.kind === 'ledger').path), 'utf8');
  say(ledgerText.includes('$@') && ledgerText.includes('${x}') && ledgerText.includes('`cmd`') && ledgerText.includes('&lt;&lt;EOF'),
    'text written into the study is literal: a dollar sign, a brace, a backtick and a heredoc marker survive, the markup characters escaped');
  const foreign = '<!ENTITY % layout SYSTEM "evil.dtd">\n%layout;\n<!ELEMENT x (#PCDATA)>';
  const guard = pentityGuard(foreign);
  say(guard.expanded === 0 && guard.found.length === 2 && guard.found.every((f) => f.expanded === false) && guard.data.join(' ').includes('%layout;'),
    `a parameter entity in a scanned file is reported as data and never expanded: ${guard.found.length} found, ${guard.expanded} expanded (LAW.AMP.13)`);
  const spacey = join(tmp, 'a path with spaces');
  mkdirSync(spacey, { recursive: true });
  const detSpace = detect(spacey, c);
  const walkSpace = walk(spacey, ['generic'], { c });
  say(detSpace.layers.length === 1 && walkSpace.layers[0].walked === 'yes',
    'a target path carrying spaces is one word to the walk, never split (the quoting matrix of the $ reference)');

  // LAW.AMP.14: the version obeys the recognizer.
  const agreed = versionHolds('6.0.0', [{ verb: 15 }], '5.2.0', { c });
  const disputed = versionHolds('6.1.0', [{ verb: 15 }], '5.2.0', { c });
  say(agreed.holds && agreed.recognised === '6.0.0' && !disputed.holds && disputed.recognised === '6.0.0',
    `trip: a manifest version the recognizer disputes is refused by name: 6.1.0 against a recognised ${disputed.recognised} (LAW.AMP.14)`);

  io.log(`amplify controls: 27 run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  const c = contract();
  if (cmd === 'controls') process.exit(controls() ? 0 : 1);
  if (cmd === 'table') { process.stdout.write(table(c)); process.exit(0); }
  if (cmd === 'detect') { const d = detect(process.cwd(), c); console.log(JSON.stringify(d, null, 2)); process.exit(0); }
  if (cmd === 'walk') { const d = detect(process.cwd(), c); const w = walk(process.cwd(), rest.length ? rest : d.layers, { c, io: console }); console.log(`\nwalk: ${w.layers.length} layer(s) in ${w.seconds}s, ${w.layers.filter((l) => l.walked === 'timeout').length} timed out`); process.exit(0); }
  if (cmd === 'state') { const s = readState(process.cwd(), c); console.log(`run ${s.run}, verb ${s.verb}, offset ${s.offset}, release ${s.release || 'none'}, ${s.rows.length} possibility row(s), ${s.rows.filter((r) => r.verdict === 'refused').length} refused`); process.exit(0); }
  if (cmd === 'recognize') {
    // The argument is split like shell words and never evaluated (LAW.AMP.13):
    // --stage=beta is a flag, and a bare word is a verb number.
    let stage = null; let from = process.env.AMP_FROM || '0.0.0';
    const verbs = [];
    for (const w of rest) {
      const m = /^--stage=(.+)$/.exec(w); const f = /^--from=(.+)$/.exec(w);
      if (m) stage = m[1]; else if (f) from = f[1]; else if (/^[0-9]+$/.test(w)) verbs.push({ verb: Number(w) });
    }
    if (stage && !c.releases[stage]) { console.log(`refused: --stage=${stage} is not a declared class (${Object.keys(c.releases).join(', ')})`); process.exit(1); }
    console.log(JSON.stringify(recognize(verbs, from, { c, stage }), null, 2));
    process.exit(0);
  }
  console.log('usage: node lib/amplify.mjs detect | walk [layer...] | state | recognize <verb...> | table | controls');
  process.exit(2);
}
