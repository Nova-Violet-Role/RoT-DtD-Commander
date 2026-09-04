#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/list.mjs
// The black, gray and white lists of dtd/cc-list.dtd as code: the two layers
// with the repository winning, the reachability guard that refuses a mix
// leaving a repository unable to build itself, the three-part markdown
// interlock, the dated gray exception, and one refusal grammar that names the
// colliding entries, their layer and the edit that resolves them.
//
// A list is a declaration, never a configuration file (LAW.LIST.1): every
// entry is an entity in a .dtd under .rot-lists/, which is why this module
// reads and writes DTD text rather than JSON.
//
//   contract()                        the bounds, read from dtd/cc-list.dtd
//   listPath(root, layer, scope, cls) where one list lives
//   readList(path)                    -> [{ name, reason, date, granted }]
//   writeList(path, scope, cls, rows) the entries as declarations
//   layers(repoRoot)                  -> merged, the repository winning
//   reach(lists, present)             -> [refusal] LAW.LIST.4
//   markdown(lists, starlist)         -> { holds, failed } LAW.LIST.7
//   grayAsk(entry, lists)             -> the question and its replacements
//   refusal(parts)                    -> the one grammar, LAW.LIST.6
//   controls()                        every law tripped on purpose
//
//   node lib/list.mjs show [scope] [class] | reach | md | table | controls

import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPDX = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->'];

export function contract(file = join(ROOT, 'dtd', 'cc-list.dtd')) {
  const text = readFileSync(file, 'utf8');
  const ent = (name) => {
    const m = new RegExp(`<!ENTITY ${name.replace(/\./g, '\\.')}\\s+"([^"]*)"`).exec(text);
    if (!m) throw new Error(`cc-list.dtd declares no ${name}`);
    return m[1];
  };
  return {
    classes: ent('LIST.classes').split('|'),
    scopes: ent('LIST.scopes').split('|'),
    dir: ent('LIST.dir'),
    files: ent('LIST.files').split('|'),
    mdDefault: ent('LIST.md.default'),
    mdCondition: ent('LIST.md.condition'),
    grayQuestion: ent('GRAY.question'),
    laws: [...text.matchAll(/<!ENTITY (LAW\.LIST\.\d+)\s/g)].map((m) => m[1]),
    lawText: new Map([...text.matchAll(/<!ENTITY (LAW\.LIST\.\d+)\s+"([^"]*)"/g)].map((m) => [m[1], m[2]])),
  };
}

// An entry name becomes part of an ENTITY name, so it may hold only what an
// XML name may hold. The read pattern has always been this strict; the write
// was not, and a name carrying a quote and an angle bracket closed the
// declaration and opened a forged one (control: the injection below).
export const NAME = /^[A-Za-z0-9_][A-Za-z0-9_-]{0,63}$/;
// The record is pipe-separated, so a reason may not carry a pipe, and a quote
// would close the entity value. Neither is an error worth refusing a write
// over: both are folded, and the fold is visible in what reads back.
export function fold(s) { return String(s == null ? '' : s).replace(/[|"\r\n]/g, (c) => (c === '|' ? '/' : c === '"' ? "'" : ' ')); }

// The starlist is a list like the others and lives beside them, so it is read
// the same way: the machine layer first, the repository layer over it.
export function starlistOf(repoRoot, { machine = machineRoot(), c = contract() } = {}) {
  const byName = new Map();
  for (const r of readList(listPath(machine, 'star', 'list', c))) byName.set(r.name, { ...r, layer: 'machine' });
  for (const r of readList(listPath(repoRoot, 'star', 'list', c))) byName.set(r.name, { ...r, layer: 'repository' });
  return [...byName.values()];
}

export function machineRoot() { return join(os.homedir(), '.claude', 'rot-dtd-commander'); }
export function listPath(root, scope, cls, c = contract()) { return join(root, c.dir, `${scope}-${cls}.dtd`); }

// An entry is one entity: the name, the reason it was listed, the date, and
// for a gray entry the grant that turned it into an exception.
export function readList(path) {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  const rows = [];
  for (const m of text.matchAll(/<!ENTITY LIST\.entry\.([A-Za-z0-9_-]+)\s+"([^"]*)">/g)) {
    const [reason, date, granted] = m[2].split('|');
    rows.push({ name: m[1], reason: (reason || '').trim(), date: (date || '').trim(), granted: (granted || '').trim() || null });
  }
  return rows;
}

export function writeList(path, scope, cls, rows) {
  for (const r of rows || []) {
    if (!NAME.test(String(r.name || ''))) {
      throw new Error(refusal({ asked: `list ${JSON.stringify(String(r.name)).slice(0, 60)}`, entry: 'the name', cls, scope, layer: 'repository',
        reason: 'an entry name becomes part of an ENTITY name and may hold only letters, digits, underscore and hyphen',
        edit: 'pass the extension or class name alone, without quotes, angle brackets or spaces' }));
    }
  }
  mkdirSync(dirname(path), { recursive: true });
  const root = `${scope}_${cls}`;
  const lines = [...SPDX, '',
    `<!-- ${scope}-${cls}.dtd : one entry per entity, written by /${scope}-${cls}list-dtd.`,
    '     The scope and the class are FIXED here, so a file claiming another is',
    '     invalid against its own declaration rather than merely mislabelled. -->', '',
    `<!ATTLIST ${root}`,
    `          scope CDATA #FIXED "${scope}"`,
    `          class CDATA #FIXED "${cls}">`, ''];
  for (const r of rows) lines.push(`<!ENTITY LIST.entry.${r.name} "${[fold(r.reason), fold(r.date), fold(r.granted)].join('|')}">`);
  lines.push('');
  writeFileSync(path, lines.join('\n'), 'utf8');
  return { path, count: rows.length };
}

// LAW.LIST.3: both layers hold, and where they name the same entry the
// repository wins. Every merged row remembers which layer it came from,
// because a refusal that cannot say where the rule lives cannot be argued
// with.
export function layers(repoRoot, { machine = machineRoot(), c = contract() } = {}) {
  const out = {};
  for (const scope of c.scopes) {
    for (const cls of c.classes) {
      const key = `${scope}-${cls}`;
      const byName = new Map();
      for (const r of readList(listPath(machine, scope, cls, c))) byName.set(r.name, { ...r, layer: 'machine', scope, class: cls });
      for (const r of readList(listPath(repoRoot, scope, cls, c))) byName.set(r.name, { ...r, layer: 'repository', scope, class: cls });
      out[key] = [...byName.values()];
    }
  }
  return out;
}

const flat = (lists) => Object.values(lists).flat();

// LAW.LIST.6: one grammar. What was asked, which list, which layer, the entry
// it collides with, and the edit that resolves it.
export function refusal({ asked, entry, cls, scope, layer, reason, collides = null, edit }) {
  const lines = [`REFUSED ${asked}`,
    `  ${scope}-${cls} (${layer}) names ${entry}`];
  if (reason) lines.push(`  reason: "${reason}"`);
  if (collides) lines.push(`  collides with ${collides}`);
  lines.push(`  to resolve: ${edit}`);
  return lines.join('\n');
}

// LAW.LIST.4: the reachability guard. Every refusal names the two entries
// that collide, so the operator can see which half to change.
export function reach(lists, { present = [], produces = {}, starlist = null } = {}) {
  const out = [];
  const find = (scope, cls, name) => (lists[`${scope}-${cls}`] || []).find((r) => r.name === name);
  for (const scope of ['file', 'code']) {
    for (const w of lists[`${scope}-white`] || []) {
      const b = find(scope, 'black', w.name);
      if (b) out.push(refusal({ asked: `${w.name} in ${scope}-white`, entry: w.name, cls: 'black', scope, layer: b.layer, reason: b.reason,
        collides: `${scope}-white (${w.layer})`, edit: `drop ${w.name} from one of the two lists` }));
    }
  }
  // A code class blacklisted while a whitelisted class needs it to be made.
  for (const w of lists['code-white'] || []) {
    for (const maker of produces[w.name] || []) {
      const b = find('code', 'black', maker);
      if (b) out.push(refusal({ asked: `${w.name} in code-white`, entry: maker, cls: 'black', scope: 'code', layer: b.layer, reason: b.reason,
        collides: `code-white ${w.name}, which ${maker} is what produces`,
        edit: `keep ${maker} in file-black only, or drop ${w.name} from code-white` }));
    }
  }
  // A code entry implies its file entry (LAW.LIST.2): a code black cannot be
  // a file white.
  for (const b of lists['code-black'] || []) {
    const w = find('file', 'white', b.name);
    if (w) out.push(refusal({ asked: `${b.name} in file-white`, entry: b.name, cls: 'black', scope: 'code', layer: b.layer, reason: b.reason,
      collides: `file-white (${w.layer}); code is the stricter half and implies the file rule`,
      edit: `drop ${b.name} from code-black, or from file-white` }));
  }
  // LAW.LIST.4's fourth clause, which LAW.STAR.6 rests on: a class promised
  // in production that this machine has no way to provide. Passing no starlist
  // means the question was not asked, which is different from asking it and
  // finding nothing; a null starlist checks nothing and says so by omission.
  if (starlist) {
    const reachable = new Set(starlist.map((t) => String(t).split(/[\s|]/)[0]));
    // An artifact is produced; a tool is installed. Only a tool needs the
    // starlist to reach it, so a code-white name that is also a file type this
    // repository holds, or that something else produces, is exempt. The first
    // companion pass of 7.0.0 found this asking a package manager to provide a
    // .gif, and md was the same mistake in a smaller costume.
    const artifacts = new Set([
      ...(lists['file-white'] || []).map((r) => r.name),
      ...Object.keys(produces),
    ]);
    for (const w of lists['code-white'] || []) {
      if (artifacts.has(w.name)) continue;
      if (!reachable.has(w.name)) {
        out.push(refusal({ asked: `${w.name} in code-white`, entry: w.name, cls: 'white', scope: 'code', layer: w.layer,
          reason: w.reason, collides: 'a starlist that cannot reach it',
          edit: `record ${w.name} with /starlist-dtd, or drop it from code-white` }));
      }
    }
  }
  // The default LIST.md.default declares: md is white in BOTH scopes from the
  // first run. The phase that wrote these lists put it in one, and nothing
  // noticed (found by the first companion pass of 7.0.0).
  for (const scope of ['file', 'code']) {
    const white = lists[`${scope}-white`] || [];
    if (white.length && !white.some((r) => r.name === 'md')) {
      out.push(refusal({ asked: `the ${scope} white list`, entry: 'md', cls: 'white', scope, layer: 'repository',
        reason: 'md is white in both scopes from the first run and is unseated only under the interlock',
        collides: 'a non-empty white list that does not carry it',
        edit: `add md to ${scope}-white, or unseat it under every condition of the interlock` }));
    }
  }
  // A language the tree actually contains with nothing white to build it.
  const whiteNames = new Set((lists['file-white'] || []).map((r) => r.name));
  if (whiteNames.size) {
    for (const ext of present) {
      if (!whiteNames.has(ext) && !(lists['file-black'] || []).some((r) => r.name === ext) && !(lists['file-gray'] || []).some((r) => r.name === ext)) {
        out.push(refusal({ asked: `the tree contains ${ext}`, entry: ext, cls: 'white', scope: 'file', layer: 'repository',
          reason: 'the white list is not empty, so anything unlisted cannot be built',
          collides: 'a non-empty file-white that does not name it',
          edit: `add ${ext} to file-white, or to file-gray if it should be asked about` }));
      }
    }
  }
  return out;
}

// LAW.LIST.7: all three conditions together, and the refusal names the one
// that failed.
export function markdown(lists, starlist = [], c = contract()) {
  const has = (key, name) => (lists[key] || []).some((r) => r.name === name);
  const failed = [];
  // The condition text is read from the declaration rather than restated, so
  // editing LIST.md.condition changes what this reports (the low finding of
  // the first companion pass: a declaration nothing consumes drifts).
  const condition = c.mdCondition;
  if (!starlist.some((t) => /julia/i.test(t) && /markdown|jmd/i.test(t))) failed.push('the starlist carries no Julia Markdown installation');
  if (!has('file-black', 'md') && !has('code-black', 'md')) failed.push('no black list names md');
  if (!(has('file-white', 'jmd') && has('code-white', 'jmd'))) failed.push('the white list does not carry jmd in both the file scope and the code scope');
  return { holds: failed.length === 0, failed, condition, mustHold: c.mdDefault };
}

// LAW.LIST.5: the gray question names the entry, its recorded reason and up
// to three replacements the white list already allows.
export function grayAsk(entry, lists, c = contract()) {
  const replacements = (lists[`${entry.scope}-white`] || []).filter((r) => r.name !== entry.name).slice(0, 3);
  return {
    question: c.grayQuestion,
    entry: entry.name,
    reason: entry.reason,
    listed: entry.date,
    options: [{ label: 'Use it anyway, and record the exception', kind: 'use' },
      ...replacements.map((r) => ({ label: r.name, kind: 'replace', why: r.reason })),
      { label: 'Tell me more about what it breaks', kind: 'explain' }],
  };
}

export function grant(entry, forWhat, why, date = new Date().toISOString().slice(0, 10)) {
  return { ...entry, granted: `granted ${date} for ${forWhat}: ${why}` };
}

export function table(c = contract()) {
  const L = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->', '',
    '# The lists, as declared', '', 'Generated by `node lib/list.mjs table` from `dtd/cc-list.dtd`.', '',
    '| class | what it does |', '|---|---|'];
  const text = readFileSync(join(ROOT, 'dtd', 'cc-list.dtd'), 'utf8');
  for (const cls of c.classes) {
    const m = new RegExp(`<!ENTITY LIST\\.class\\.${cls}\\s+"([^"]*)"`).exec(text);
    L.push(`| ${cls} | ${m ? m[1] : ''} |`);
  }
  L.push('', '| scope | what it governs |', '|---|---|');
  for (const s of c.scopes) {
    const m = new RegExp(`<!ENTITY LIST\\.scope\\.${s}\\s+"([^"]*)"`).exec(text);
    L.push(`| ${s} | ${m ? m[1] : ''} |`);
  }
  L.push('', '| law | text |', '|---|---|');
  for (const k of c.laws) L.push(`| ${k} | ${c.lawText.get(k)} |`);
  return L.join('\n') + '\n';
}

// The eight of the family, and what each must pin. Hand-written is the point;
// held in step is the price. This reads the BUILT commands, because what
// drifts is what installs, not what sits in src/.
export const FAMILY = [
  { name: 'file-blacklist', scope: 'file', cls: 'black' },
  { name: 'code-blacklist', scope: 'code', cls: 'black' },
  { name: 'file-graylist', scope: 'file', cls: 'gray' },
  { name: 'code-graylist', scope: 'code', cls: 'gray' },
  { name: 'file-whitelist', scope: 'file', cls: 'white' },
  { name: 'code-whitelist', scope: 'code', cls: 'white' },
  { name: 'starlist', scope: 'star', cls: null },
  { name: 'starlist-manager', scope: null, cls: null },
];

export function familyHolds(root = ROOT, c = contract()) {
  const declared = new Set(c.laws);
  const out = [];
  for (const f of FAMILY) {
    const file = join(root, 'commands', `${f.name}-dtd.md`);
    if (!existsSync(file)) { out.push(`${f.name}: not built`); continue; }
    const text = readFileSync(file, 'utf8');
    if (!text.includes('begin subset cc-list')) out.push(`${f.name}: does not include cc-list`);
    if (f.scope && !new RegExp(`scope\\s+CDATA #FIXED "${f.scope}"`).test(text)) out.push(`${f.name}: does not pin its scope as ${f.scope}`);
    if (f.cls && !new RegExp(`class\\s+CDATA #FIXED "${f.cls}"`).test(text)) out.push(`${f.name}: does not pin its class as ${f.cls}`);
    for (const cited of new Set([...text.matchAll(/(LAW\.LIST\.\d+)/g)].map((m) => m[1]))) {
      if (!declared.has(cited)) out.push(`${f.name}: cites ${cited}, which cc-list.dtd does not declare`);
    }
  }
  return out;
}

export function controls(io = console) {
  let fail = 0;
  let ran = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const c = contract();
  const tmp = mkdtempSync(join(os.tmpdir(), 'rot-dtd-list-'));

  say(c.classes.join('|') === 'black|gray|white' && c.scopes.join('|') === 'file|code',
    `the classes and the scopes come from the declarations: ${c.classes.join(', ')} over ${c.scopes.join(', ')}`);
  say(c.laws.length === 8 && c.laws.every((k, i) => k === `LAW.LIST.${i + 1}`), `LAW.LIST.1 to ${c.laws.length}, dense and ascending`);

  // A list is a declaration: written as a .dtd, read back as entries.
  const p = listPath(tmp, 'file', 'black', c);
  writeList(p, 'file', 'black', [{ name: 'cpp', reason: 'may produce a dll, may not enter the source', date: '2026-09-04' }]);
  const back = readList(p);
  const raw = readFileSync(p, 'utf8');
  say(back.length === 1 && back[0].name === 'cpp' && back[0].date === '2026-09-04' && /#FIXED "file"/.test(raw) && /#FIXED "black"/.test(raw),
    'an entry round-trips through a .dtd whose scope and class are FIXED in the file itself (LAW.LIST.1)');

  // The repository wins, and the merged row remembers where it came from.
  const machine = mkdtempSync(join(os.tmpdir(), 'rot-dtd-list-m-'));
  writeList(listPath(machine, 'file', 'black', c), 'file', 'black', [{ name: 'exe', reason: 'never on this machine', date: '2026-01-01' }, { name: 'cpp', reason: 'machine-wide', date: '2026-01-01' }]);
  const merged = layers(tmp, { machine, c });
  const cpp = merged['file-black'].find((r) => r.name === 'cpp');
  const exe = merged['file-black'].find((r) => r.name === 'exe');
  say(merged['file-black'].length === 2 && cpp.layer === 'repository' && cpp.reason.startsWith('may produce') && exe.layer === 'machine',
    `both layers hold and the repository wins the entry they share: cpp from ${cpp.layer}, exe from ${exe.layer} (LAW.LIST.3)`);

  // The reachability guard, on the case the spec was written around.
  const MD = { name: 'md', reason: 'white in both scopes from the first run', layer: 'repository' };
  const poisoned = { 'code-black': [{ name: 'cpp', reason: 'no C++ compiles here', layer: 'repository' }], 'code-white': [{ name: 'dll', reason: 'the shipped artifact', layer: 'repository' }, MD], 'file-white': [], 'file-black': [], 'file-gray': [], 'code-gray': [] };
  const r1 = reach(poisoned, { produces: { dll: ['cpp'] } });
  say(r1.length === 1 && /nothing/.test(r1[0]) === false && /collides with code-white dll/.test(r1[0]) && /to resolve:/.test(r1[0]),
    `trip: a code class blacklisted while a whitelisted artifact needs it is refused with both entries named (LAW.LIST.4)`);
  const both = { 'file-white': [{ name: 'py', reason: 'scripts', layer: 'repository' }, MD], 'file-black': [{ name: 'py', reason: 'no second runtime', layer: 'machine' }], 'code-white': [], 'code-black': [], 'file-gray': [], 'code-gray': [] };
  const r2 = reach(both);
  say(r2.length === 1 && /file-black \(machine\)/.test(r2[0]) && /drop py from one of the two lists/.test(r2[0]),
    'trip: one entry in both black and white is refused, naming the layer each came from (LAW.LIST.3, LAW.LIST.4)');
  const strict = { 'code-black': [{ name: 'cpp', reason: 'none here', layer: 'repository' }], 'file-white': [{ name: 'cpp', reason: 'headers', layer: 'repository' }, MD], 'code-white': [], 'file-black': [], 'file-gray': [], 'code-gray': [] };
  say(reach(strict).some((x) => /stricter half/.test(x)), 'trip: a code blacklist and a file whitelist of the same name is refused, because code implies file (LAW.LIST.2)');
  const clean = { 'file-white': [{ name: 'mjs', reason: 'the toolchain', layer: 'repository' }, MD], 'file-black': [], 'file-gray': [], 'code-white': [], 'code-black': [], 'code-gray': [] };
  say(reach(clean, { present: ['mjs'] }).length === 0, 'a set that leaves the repository able to build itself reports nothing');
  say(reach(clean, { present: ['mjs', 'rs'] }).some((x) => /the tree contains rs/.test(x)),
    'trip: a language the tree contains with nothing white to build it is refused by name');

  // The markdown interlock: all three, and the refusal names what failed.
  const none = markdown({ 'file-white': [], 'code-white': [], 'file-black': [], 'code-black': [] }, []);
  say(!none.holds && none.failed.length === 3, `trip: with none of the three conditions met the removal of md is refused on all three counts: ${none.failed.length}`);
  const two = markdown({ 'file-white': [{ name: 'jmd' }], 'code-white': [], 'file-black': [{ name: 'md' }], 'code-black': [] }, ['julia-markdown 0.1']);
  say(!two.holds && two.failed.length === 1 && /both the file scope and the code scope/.test(two.failed[0]),
    `trip: two of three is still a refusal, and it names the one that failed: ${two.failed[0]}`);
  const all = markdown({ 'file-white': [{ name: 'jmd' }], 'code-white': [{ name: 'jmd' }], 'file-black': [{ name: 'md' }], 'code-black': [] }, ['julia-markdown 0.1']);
  say(all.holds && all.failed.length === 0, 'with the starlist, the black entry and jmd in both scopes, md may be unseated (LAW.LIST.7)');

  // The gray question draws its replacements from the white list.
  const g = grayAsk({ name: 'py', scope: 'file', reason: 'the toolchain is Node; a second runtime splits the gate', date: '2026-09-04' },
    { 'file-white': [{ name: 'mjs', reason: 'runs under the gate you have' }, { name: 'sh', reason: 'no runtime added' }] });
  say(g.options.length === 4 && g.options[0].kind === 'use' && g.options[1].label === 'mjs' && g.options.at(-1).kind === 'explain' && g.reason.includes('second runtime'),
    `the gray question names the entry, its recorded reason and the replacements the white list allows: ${g.options.map((o) => o.label).join(' / ')} (LAW.LIST.5)`);
  const granted = grant(g, 'scripts/bench.py', 'one-off benchmark, not part of the build', '2026-09-04');
  say(/granted 2026-09-04 for scripts\/bench\.py/.test(granted.granted), `an exception carries its date, what it was granted for and why: ${granted.granted}`);

  // The refusal grammar itself.
  const text = refusal({ asked: 'write src/build.cpp', entry: 'cpp', cls: 'black', scope: 'file', layer: 'repository', reason: 'may produce a dll', edit: '/file-blacklist-dtd --drop cpp' });
  say(/REFUSED write src\/build\.cpp/.test(text) && /\(repository\)/.test(text) && /to resolve: \/file-blacklist-dtd --drop cpp/.test(text),
    'every refusal names what was asked, the list, the layer and the edit that resolves it (LAW.LIST.6)');

  // The study of the corpus found this one in code written the same day: a
  // name straight from an argument, written into a declaration.
  let injected = '';
  try { writeList(listPath(tmp, 'file', 'gray', c), 'file', 'gray', [{ name: 'x"> <!ENTITY evil "pwned', reason: 'probe', date: '2026-09-04' }]); }
  catch (e) { injected = e.message; }
  say(/REFUSED list/.test(injected) && /may hold only letters/.test(injected) && !existsSync(listPath(tmp, 'file', 'gray', c)),
    `trip: an entry name that would close its own declaration is refused and nothing is written: ${injected.split('\n')[0] || 'nothing'}`);
  const folded = listPath(tmp, 'code', 'gray', c);
  writeList(folded, 'code', 'gray', [{ name: 'py', reason: 'a reason with a | pipe and a " quote', date: '2026-09-04' }]);
  const readBack = readList(folded)[0];
  say(readBack && readBack.name === 'py' && readBack.reason === "a reason with a / pipe and a ' quote",
    `a reason carrying the field separator or a quote is folded, not lost: "${readBack ? readBack.reason : 'nothing'}"`);

  // The fourth clause of LAW.LIST.4 (first companion pass of 7.0.0).
  const unreachable = { 'code-white': [{ name: 'rustc', reason: 'the shipped artifact', layer: 'repository' }, { name: 'md', reason: 'default', layer: 'repository' }], 'file-white': [{ name: 'md', reason: 'default', layer: 'repository' }], 'code-black': [], 'file-black': [], 'file-gray': [], 'code-gray': [] };
  const r5 = reach(unreachable, { starlist: ['node', 'bun'] });
  say(r5.length === 1 && /a starlist that cannot reach it/.test(r5[0]) && /record rustc with \/starlist-dtd/.test(r5[0]),
    `trip: a class promised in production that the starlist cannot reach is refused (LAW.LIST.4, LAW.STAR.6): ${r5.length}`);
  say(reach(unreachable, {}).length === 0, 'with no starlist passed the reachability clause asks nothing rather than guessing');
  const noMd = { 'file-white': [{ name: 'mjs', reason: 'x', layer: 'repository' }], 'code-white': [], 'file-black': [], 'code-black': [], 'file-gray': [], 'code-gray': [] };
  // md exempt from the starlist clause: a correctly-formed list carries it and
  // no manager provides a markdown.
  say(reach({ 'code-white': [MD], 'file-white': [MD], 'file-black': [], 'code-black': [], 'file-gray': [], 'code-gray': [] }, { starlist: ['node'] }).length === 0,
    'a code-white name that is also a file type is an artifact, and an artifact is not asked to be reachable');
  const artifactPair = { 'file-white': [MD, { name: 'tape', reason: 'the script', layer: 'repository' }], 'code-white': [MD, { name: 'gif', reason: 'the artifact', layer: 'repository' }, { name: 'vhs', reason: 'the renderer', layer: 'repository' }], 'file-black': [], 'code-black': [], 'file-gray': [], 'code-gray': [] };
  const r6 = reach(artifactPair, { starlist: ['vhs'], produces: { gif: ['vhs'] } });
  say(r6.length === 0, `a produced artifact is exempt and its renderer is reachable, so a real pair reports nothing: ${r6.length}`);
  const r7 = reach(artifactPair, { starlist: [], produces: { gif: ['vhs'] } });
  say(r7.length === 1 && /vhs/.test(r7[0]), `trip: the renderer itself is still asked for, and refused when the starlist cannot reach it: ${r7.length}`);
  say(reach(noMd).some((x) => /the file white list/.test(x) && /md/.test(x)),
    'trip: a non-empty white list that does not carry md is refused, because LIST.md.default says both scopes');
  const withCondition = markdown({ 'file-white': [], 'code-white': [], 'file-black': [], 'code-black': [] }, []);
  say(withCondition.condition === c.mdCondition && withCondition.mustHold === c.mdDefault && c.mdCondition.length > 0,
    'the interlock reports the declared condition text rather than restating it');

  const starPath = listPath(tmp, 'star', 'list', c);
  writeList(starPath, 'star', 'list', [{ name: 'vhs', reason: 'reachable via scoop', date: '2026-09-04' }]);
  const recorded = starlistOf(tmp, { machine: mkdtempSync(join(os.tmpdir(), 'rot-dtd-nostar-')), c });
  say(recorded.length === 1 && recorded[0].name === 'vhs' && recorded[0].layer === 'repository',
    `the starlist is read from disk like any other list, with its layer: ${recorded.map((r) => `${r.name} (${r.layer})`).join(', ') || 'nothing'}`);

  // The eight, held to the subset they share.
  const fam = familyHolds();
  say(fam.length === 0, `the eight built commands pin their scope and class and cite no undeclared law: ${fam.length ? fam.join('; ') : `${FAMILY.length} in step`}`);
  const planted = familyHolds(mkdtempSync(join(os.tmpdir(), 'rot-dtd-empty-')));
  say(planted.length === FAMILY.length && planted.every((x) => /not built/.test(x)),
    `trip: a tree missing the family reports every one of the eight by name: ${planted.length}`);

  io.log(`list controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await (async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  // The reach branch awaits an import, so main is async.
  const c = contract();
  if (cmd === 'controls') process.exit(controls() ? 0 : 1);
  if (cmd === 'table') { process.stdout.write(table(c)); process.exit(0); }
  const lists = layers(process.cwd(), { c });
  if (cmd === 'show') {
    const keys = rest.length ? [`${rest[0]}-${rest[1] || 'black'}`] : Object.keys(lists);
    for (const k of keys) for (const r of lists[k] || []) console.log(`${k} ${r.name} (${r.layer}) ${r.reason}${r.granted ? ` [${r.granted}]` : ''}`);
    console.log(`lists: ${Object.entries(lists).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);
    process.exit(0);
  }
  if (cmd === 'reach') {
    // Measured by the same walk the starlist commands use: a leading dot is
    // not an extension boundary, and a directory is not a file (found by the
    // first companion pass of 7.0.0, which produced eleven false refusals).
    const { measure } = await import('./starlist.mjs');
    const walked = measure(process.cwd());
    const present = walked.languages.map(([e]) => e);
    // What the harness may reach: what the starlist records, plus the managers
    // the probe found present. The probe alone knows only manager names, which
    // refused every tool this repository had actually recorded (first
    // companion pass of 7.0.0).
    const starlist = [...starlistOf(process.cwd(), { c }).map((r) => r.name), ...walked.toolchain];
    const out = reach(lists, { present, starlist });
    for (const r of out) console.log(r);
    console.log(`list reach: ${out.length} refused`);
    process.exit(out.length === 0 ? 0 : 1);
  }
  if (cmd === 'md') {
    const m = markdown(lists, []);
    console.log(m.holds ? 'md may be unseated: every condition holds' : `md stays white: ${m.failed.join('; ')}`);
    process.exit(0);
  }
  console.log('usage: node lib/list.mjs show [scope] [class] | reach | md | table | controls');
  process.exit(2);
})();
