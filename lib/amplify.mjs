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
const STATE_HEAD = '<!-- amplify-codebase state; one row per possibility, id class layer verdict verb -->';

export function statePath(root, c = contract()) { return join(root, c.dir, c.stateFile); }

export function readState(root, c = contract()) {
  const p = statePath(root, c);
  const empty = { run: 0, verb: 0, offset: 0, release: '', walked: [], rows: [] };
  if (!existsSync(p)) return empty;
  const text = readFileSync(p, 'utf8');
  const head = {};
  for (const m of text.matchAll(/^- (run|verb|offset|release|walked): (.*)$/gm)) head[m[1]] = m[2].trim();
  const rows = [];
  for (const m of text.matchAll(/^\| ([0-9a-f]{8}) \| (gap|idea) \| ([a-z]+) \| (exposed|marked|refused|done) \| ([0-9]+) \| (.*) \|$/gm)) {
    rows.push({ id: m[1], class: m[2], layer: m[3], verdict: m[4], verb: Number(m[5]), why: m[6].trim() });
  }
  return { run: Number(head.run || 0), verb: Number(head.verb || 0), offset: Number(head.offset || 0), release: head.release || '', walked: (head.walked || '').split(/[, ]+/).filter(Boolean), rows };
}

export function writeState(root, state, c = contract()) {
  const dir = join(root, c.dir);
  mkdirSync(dir, { recursive: true });
  const lines = [STATE_HEAD, '', '# amplify-codebase: the state between runs', '',
    `- run: ${state.run}`, `- verb: ${state.verb}`, `- offset: ${state.offset}`, `- release: ${state.release || ''}`, `- walked: ${(state.walked || []).join(', ')}`,
    '', '| id | class | layer | verdict | verb | why |', '|---|---|---|---|---|---|'];
  for (const r of state.rows) lines.push(`| ${r.id} | ${r.class} | ${r.layer} | ${r.verdict} | ${r.verb} | ${String(r.why).replace(/\|/g, '/').slice(0, 160)} |`);
  lines.push('');
  const p = statePath(root, c);
  writeFileSync(p, lines.join('\n'), 'utf8');
  return p;
}

// A refused id is never offered again by any later run (LAW.AMP.6).
export function unrefused(list, state) {
  const closed = new Set(state.rows.filter((r) => r.verdict === 'refused' || r.verdict === 'done').map((r) => r.id));
  return list.filter((p) => !closed.has(p.id || idOf(p)));
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
  L.push(`| AMP.ceiling.family | ${c.ceilingFamily} s |`, `| AMP.ceiling.total | ${c.ceilingTotal} s |`, `| AMP.page | ${c.page} |`, `| AMP.rounds | ${c.rounds} |`, `| AMP.questions | ${c.questions} |`, `| AMP.dir | ${c.dir} |`, `| AMP.state | ${c.stateFile} |`);
  L.push('', '## The release classes', '', '| class | increment | when |', '|---|---|---|');
  for (const [k, r] of Object.entries(c.releases)) L.push(`| ${k} | ${r.increment} | ${r.why} |`);
  L.push('', '## The laws', '');
  for (const k of c.laws) L.push(`- **${k}**: ${c.lawText.get(k)}`);
  L.push('');
  return L.join('\n');
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
  say(c.laws.length === 10 && c.laws.every((k, i) => k === `LAW.AMP.${i + 1}`), `LAW.AMP.1 to ${c.laws.length}, dense and ascending`);

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

  const ref = join(ROOT, 'src', 'skills', 'amplify-codebase-dtd', 'references', 'ladder.md');
  const want = table(c);
  const have = existsSync(ref) ? readFileSync(ref, 'utf8') : '';
  say(have === want, have === want ? 'references/ladder.md is the contract as generated' : `references/ladder.md drifted from dtd/cc-amplify.dtd: run node lib/amplify.mjs table and write it to ${ref}`);
  say(/\| 15 \| metamorphosis \|/.test(want) && /AMP.ceiling.total \| 900 s/.test(want) && /\| major \| 1.0.0 \|/.test(want) && want.includes('LAW.AMP.10'),
    'the table renders the ladder, the bounds, the release classes and every law from the declarations alone');

  io.log(`amplify controls: 17 run, ${fail} failing`);
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
  if (cmd === 'recognize') { const kept = rest.map((n) => ({ verb: Number(n) })); const r = recognize(kept, process.env.AMP_FROM || '0.0.0', { c }); console.log(JSON.stringify(r, null, 2)); process.exit(0); }
  console.log('usage: node lib/amplify.mjs detect | walk [layer...] | state | recognize <verb...> | table | controls');
  process.exit(2);
}
