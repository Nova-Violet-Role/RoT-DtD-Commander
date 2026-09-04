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

import { rmSync, readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
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
    grayUse: ent('GRAY.use'),
    grayExplain: ent('GRAY.explain'),
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

// The starlist is not a scope x class list and never was: it has one axis, it
// lands where STAR.file declares, and its command is /starlist-dtd. Pass 2 of
// the 7.0.0 audit found it wearing a scope of "star" and a class of "list",
// landing at star-list.dtd, and naming its author /star-listlist-dtd.
export function starlistPath(root, c = contract()) {
  return join(root, c.dir, starFileName());
}
export function starFileName(file = join(ROOT, 'dtd', 'cc-starlist.dtd')) {
  const m = /<!ENTITY STAR\.file\s+"([^"]*)"/.exec(readFileSync(file, 'utf8'));
  if (!m) throw new Error('cc-starlist.dtd declares no STAR.file');
  return m[1];
}

export function writeStarlist(root, rows, c = contract()) {
  const path = starlistPath(root, c);
  mkdirSync(dirname(path), { recursive: true });
  for (const r of rows || []) {
    if (!NAME.test(String(r.name || ''))) {
      throw new Error(refusal({ asked: `record ${JSON.stringify(String(r.name)).slice(0, 60)} in the starlist`, entry: 'the name', cls: 'the starlist', scope: 'a tool', layer: 'repository',
        reason: 'a tool name becomes part of an ENTITY name and may hold only letters, digits, underscore and hyphen',
        edit: 'record the tool by its binary name alone' }));
    }
  }
  const lines = [...SPDX, '',
    `<!-- ${starFileName()} : what the harness may reach, written by /starlist-dtd.`,
    '     One axis, not two: a tool is reachable or it is absent, and absent is',
    '     recorded rather than assumed. -->', '',
    '<!ELEMENT tools (#PCDATA)>',
    '<!ATTLIST tools',
    '          kind CDATA #FIXED "starlist">', ''];
  // reachable is #REQUIRED on tool, so it is stored rather than inferred from
  // prose in the reason (pass 5).
  for (const r of rows) lines.push(`<!ENTITY STAR.have.${r.name} "${[fold(r.reason), fold(r.date), fold(r.granted), r.reachable === false ? 'no' : 'yes'].join('|')}">`);
  lines.push('');
  writeFileSync(path, lines.join('\n'), 'utf8');
  return { path, count: rows.length };
}

export function readStarlist(path) {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  const rows = [];
  for (const m of text.matchAll(/<!ENTITY STAR\.have\.([A-Za-z0-9_-]+)\s+"([^"]*)">/g)) {
    const [reason, date, granted, reachable] = m[2].split('|');
    rows.push({ name: m[1], reason: (reason || '').trim(), date: (date || '').trim(), granted: (granted || '').trim() || null, reachable: (reachable || 'yes').trim() !== 'no' });
  }
  return rows;
}

export function starlistOf(repoRoot, { machine = machineRoot(), c = contract() } = {}) {
  const byName = new Map();
  for (const r of readStarlist(starlistPath(machine, c))) byName.set(r.name, { ...r, layer: 'machine' });
  for (const r of readStarlist(starlistPath(repoRoot, c))) byName.set(r.name, { ...r, layer: 'repository' });
  return [...byName.values()];
}

export function machineRoot() { return join(os.homedir(), '.claude', 'rot-dtd-commander'); }
export function listPath(root, scope, cls, c = contract()) { return join(root, c.dir, `${scope}-${cls}.dtd`); }

// An entry is one entity: the name, the reason it was listed, the date, and
// for a gray entry the grant that turned it into an exception.
// Whether a list exists at all is different from what it holds: an empty
// white list refuses nothing, and a missing one was never written (pass 2).
export function listExists(path) { return existsSync(path); }

// LIST.files is the set a repository may hold. Comparing it to the directory
// turns the declaration into something a reader can act on: a name it does not
// declare is a stray, and a declared name absent was simply never written
// (third companion pass).
// The guarantee the header makes, made true: a file whose FIXED pair does not
// match its filename is mislabelled, and saying so is the whole point of
// writing the pair (pass 8 found the claim with nothing behind it).
export function mislabelled(root, c = contract()) {
  const out = [];
  for (const scope of c.scopes) {
    for (const cls of c.classes) {
      const path = listPath(root, scope, cls, c);
      if (!existsSync(path)) continue;
      const text = readFileSync(path, 'utf8');
      const s = /scope CDATA #FIXED "([^"]*)"/.exec(text);
      const k = /class CDATA #FIXED "([^"]*)"/.exec(text);
      if (!s || !k || s[1] !== scope || k[1] !== cls) {
        out.push(refusal({ asked: `${scope}-${cls}.dtd`, entry: 'the file', cls, scope, layer: 'repository',
          reason: `its declaration says scope "${s ? s[1] : 'nothing'}" class "${k ? k[1] : 'nothing'}"`,
          collides: 'the name of the file it is written in',
          edit: `rewrite it with /${scope}-${cls}list-dtd, or rename it to match its declaration` }));
      }
    }
  }
  // The starlist carries a kind rather than a scope and a class, and was the
  // one file whose own claim nothing checked (pass 14).
  const star = starlistPath(root, c);
  if (existsSync(star) && !/kind CDATA #FIXED "starlist"/.test(readFileSync(star, 'utf8'))) {
    out.push(refusal({ asked: starFileName(), entry: 'the file', cls: 'starlist', scope: 'the starlist', layer: 'repository',
      reason: 'it carries no kind of "starlist"',
      collides: 'the name of the file it is written in, which says starlist.dtd claims another kind',
      edit: 'rewrite it with /starlist-dtd' }));
  }
  return out;
}

export function filesPresent(root, c = contract()) {
  const dir = join(root, c.dir);
  const on = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.dtd')) : [];
  const declared = new Set([...c.files, starFileName()]);
  return { present: on, missing: [...declared].filter((f) => !on.includes(f)), stray: on.filter((f) => !declared.has(f)) };
}

export function readList(path) {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  const rows = [];
  for (const m of text.matchAll(/<!ENTITY LIST\.entry\.([A-Za-z0-9_-]+)\s+"([^"]*)">/g)) {
    const [reason, date, granted, madeBy, becomes] = m[2].split('|');
    rows.push({ name: m[1], reason: (reason || '').trim(), date: (date || '').trim(), granted: (granted || '').trim() || null, madeBy: (madeBy || '').trim() || null, becomes: (becomes || '').trim() || null });
  }
  return rows;
}

// What produces what, read from the entries themselves. Until the third
// companion pass the map existed only inside controls, so the second clause of
// LAW.LIST.4 could not fire in any shipped path.
export function producesOf(lists) {
  const out = {};
  for (const r of [...(lists['code-white'] || []), ...(lists['file-white'] || [])]) {
    if (r.madeBy) out[r.name] = r.madeBy.split(/[,\s]+/).filter(Boolean);
  }
  // A file entry that names what it becomes declares the other end of the pair,
  // which is what --pair always offered and nothing stored (pass 6).
  for (const r of lists['file-white'] || []) {
    if (r.becomes && !out[r.becomes]) out[r.becomes] = [r.name];
  }
  return out;
}

export function writeList(path, scope, cls, rows, c = contract()) {
  // The #FIXED values are the grammar's own enumerations. Interpolating
  // anything else produces a file that is invalid against the subset it claims
  // (found by the second companion pass of 7.0.0, which had scope="star").
  if (!c.scopes.includes(scope)) throw new Error(`list: scope "${scope}" is not one of ${c.scopes.join(', ')}; the starlist has its own writer`);
  if (!c.classes.includes(cls)) throw new Error(`list: class "${cls}" is not one of ${c.classes.join(', ')}`);
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
    '     The scope and the class below are FIXED, and node lib/list.mjs reach',
    '     refuses a file whose pair disagrees with its own filename. -->', '',
    // An ATTLIST for an element type nothing introduces is not a grammar, and
    // a file that calls itself a .dtd should parse as one (pass 11).
    `<!ELEMENT ${root} (#PCDATA)>`,
    `<!ATTLIST ${root}`,
    `          scope CDATA #FIXED "${scope}"`,
    `          class CDATA #FIXED "${cls}">`, ''];
  for (const r of rows) lines.push(`<!ENTITY LIST.entry.${r.name} "${[fold(r.reason), fold(r.date), fold(r.granted), fold(r.madeBy), fold(r.becomes)].join('|')}">`);
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
  // LAW.LIST.7 says md may be unseated, and names the three conditions that
  // do it. Refusing its absence unconditionally made that interlock
  // unsatisfiable (pass 10), so the interlock is asked first.
  const interlock = markdown(lists, starlist || []);
  for (const scope of ['file', 'code']) {
    const white = lists[`${scope}-white`] || [];
    if (interlock.holds) continue;
    if (white.length && !white.some((r) => r.name === 'md')) {
      out.push(refusal({ asked: `the ${scope} white list`, entry: 'md', cls: 'white', scope, layer: 'repository',
        reason: `md is white in both scopes from the first run; it is unseated only when every condition of the interlock holds, and here ${interlock.failed.length} did not`,
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
  // The declaration's own words travel with the answer as `condition`, so a
  // caller can print what the contract says. The three checks below restate
  // the condition in code rather than deriving it, which is the honest limit
  // of this function (pass 13 corrected the comment, not the code).
  const condition = c.mdCondition;
  if (!starlist.some((t) => /julia/i.test(t) && /markdown|jmd/i.test(t))) failed.push('the starlist carries no Julia Markdown installation');
  if (!has('file-black', 'md') && !has('code-black', 'md')) failed.push('no black list names md');
  if (!(has('file-white', 'jmd') && has('code-white', 'jmd'))) failed.push('the white list does not carry jmd in both the file scope and the code scope');
  return { holds: failed.length === 0, failed, condition, mustHold: c.mdDefault };
}

// LAW.LIST.5: the gray question names the entry, its recorded reason and up
// to three replacements the white list already allows.
export function grayAsk(entry, lists, c = contract()) {
  // LAW.LIST.5: a dated exception is not asked again for that entry. It was
  // declared in four places and honoured in none (pass 9).
  if (entry && entry.granted) {
    return { asked: false, granted: entry.granted, question: null, options: [],
      why: `${entry.name} was granted on ${entry.granted}; LAW.LIST.5 does not ask again for that entry` };
  }
  const replacements = (lists[`${entry.scope}-white`] || []).filter((r) => r.name !== entry.name).slice(0, 3);
  return {
    question: c.grayQuestion,
    entry: entry.name,
    reason: entry.reason,
    listed: entry.date,
    options: [{ label: c.grayUse, kind: 'use' },
      ...replacements.map((r) => ({ label: r.name, kind: 'replace', why: r.reason })),
      { label: c.grayExplain, kind: 'explain' }],
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

  let badScope = '';
  try { writeList(listPath(tmp, 'star', 'list', c), 'star', 'list', [{ name: 'vhs', reason: 'x', date: '2026-09-04' }], c); }
  catch (e) { badScope = e.message; }
  say(/scope "star" is not one of file, code/.test(badScope) && /own writer/.test(badScope),
    `trip: a scope the grammar does not declare is refused rather than written into a FIXED value: ${badScope.slice(0, 70)}`);
  writeStarlist(tmp, [{ name: 'vhs', reason: 'reachable via scoop', date: '2026-09-04' }], c);
  const starRaw = readFileSync(starlistPath(tmp, c), 'utf8');
  const starRows0 = readStarlist(starlistPath(tmp, c));
  say(starRows0[0] && starRows0[0].reachable === true, `a tool records whether it is reachable rather than saying so in prose: ${starRows0[0] ? starRows0[0].reachable : 'nothing'}`);
  writeStarlist(tmp, [{ name: 'scoop', reason: 'not on this machine', date: '2026-09-04', reachable: false }], c);
  say(readStarlist(starlistPath(tmp, c))[0].reachable === false, 'a tool recorded absent reads back absent');
  writeStarlist(tmp, [{ name: 'vhs', reason: 'reachable via scoop', date: '2026-09-04' }], c);
  say(starlistPath(tmp, c).endsWith(starFileName()) && /written by \/starlist-dtd/.test(starRaw) && /#FIXED "starlist"/.test(starRaw),
    `the starlist lands where STAR.file declares and names the command that writes it: ${starFileName()}`);
  say(!listExists(listPath(tmp, 'code', 'black', c)) && listExists(listPath(tmp, 'file', 'black', c)),
    'a list never written is distinguishable from one that exists and is empty');
  const recorded = starlistOf(tmp, { machine: mkdtempSync(join(os.tmpdir(), 'rot-dtd-nostar-')), c });
  say(recorded.length === 1 && recorded[0].name === 'vhs' && recorded[0].layer === 'repository',
    `the starlist is read from disk like any other list, with its layer: ${recorded.map((r) => `${r.name} (${r.layer})`).join(', ') || 'nothing'}`);

  // The clause that could not fire (third companion pass).
  const madeLists = { 'code-white': [{ name: 'dll', reason: 'the shipped artifact', layer: 'repository', madeBy: 'cpp' }, MD], 'code-black': [{ name: 'cpp', reason: 'no C++ here', layer: 'repository' }], 'file-white': [MD], 'file-black': [], 'file-gray': [], 'code-gray': [] };
  const made = producesOf(madeLists);
  say(made.dll && made.dll[0] === 'cpp', `what produces a whitelisted artifact is read from the entry itself: dll <- ${(made.dll || []).join(', ')}`);
  const r8 = reach(madeLists, { produces: made });
  say(r8.length === 1 && /which cpp is what produces/.test(r8[0]),
    'trip: the second clause of LAW.LIST.4 fires from a list read off disk, not only from a control fixture');
  const roundTrip = listPath(tmp, 'code', 'white', c);
  writeList(roundTrip, 'code', 'white', [MD, { name: 'gif', reason: 'the artifact', date: '2026-09-04', madeBy: 'vhs' }], c);
  const back2 = readList(roundTrip).find((r) => r.name === 'gif');
  say(back2 && back2.madeBy === 'vhs', `the maker round-trips through the declaration: gif <- ${back2 ? back2.madeBy : 'nothing'}`);
  const pairLists = { 'file-white': [MD, { name: 'tape', reason: 'the script', layer: 'repository', becomes: 'gif' }], 'code-white': [MD, { name: 'gif', reason: 'the artifact', layer: 'repository' }], 'file-black': [], 'code-black': [], 'file-gray': [], 'code-gray': [] };
  say(producesOf(pairLists).gif && producesOf(pairLists).gif[0] === 'tape',
    `a file entry that names what it becomes declares the pair: gif <- ${(producesOf(pairLists).gif || []).join(', ')}`);
  let starRefusal = '';
  try { writeStarlist(tmp, [{ name: 'a b; rm', reason: 'x', date: '2026-09-04' }], c); } catch (e) { starRefusal = e.message; }
  say(/REFUSED record/.test(starRefusal) && /to resolve:/.test(starRefusal),
    `trip: the starlist refuses a bad name through the family grammar, with an edit: ${starRefusal.split('\n')[0].slice(0, 70)}`);
  say(mislabelled(tmp, c).length === 0, 'a list written by the engine matches its own filename');
  writeList(listPath(tmp, 'file', 'gray', c), 'file', 'gray', [{ name: 'py', reason: 'a second runtime', date: '2026-09-04' }], c);
  const liar = listPath(tmp, 'file', 'gray', c);
  writeFileSync(liar, readFileSync(liar, 'utf8').replace('scope CDATA #FIXED "file"', 'scope CDATA #FIXED "code"'), 'utf8');
  const caught = mislabelled(tmp, c);
  say(caught.length === 1 && /the name of the file it is written in/.test(caught[0]),
    `trip: a file whose FIXED pair disagrees with its filename is refused, which is what its own header promises: ${caught.length}`);
  writeList(liar, 'file', 'gray', [], c);
  const offered = grayAsk({ name: 'ps1', reason: 'outside the ceiling rules', layer: 'repository', scope: 'file' }, { 'file-white': [MD, { name: 'sh', reason: 'the audit', layer: 'repository' }], 'code-white': [] }, c);
  say(offered.options.some((o) => o.label === c.grayUse) && offered.options.some((o) => o.label === c.grayExplain),
    `the ask offers the declared GRAY.use verbatim, so editing the declaration changes the question: ${offered.options.length} options`);
  say(c.grayUse.length > 0 && c.grayExplain.length > 0,
    `the gray entities are read from the declaration rather than restated: "${c.grayUse.slice(0, 40)}"`);
  const unseated = { 'file-white': [{ name: 'jmd', reason: 'the interlock', layer: 'repository' }], 'code-white': [{ name: 'jmd', reason: 'the interlock', layer: 'repository' }], 'file-black': [{ name: 'md', reason: 'unseated deliberately', layer: 'repository' }], 'code-black': [], 'file-gray': [], 'code-gray': [] };
  const inter = markdown(unseated, ['julia-markdown']);
  say(inter.holds, `the interlock LAW.LIST.7 declares can actually be satisfied: ${inter.holds ? 'md may be unseated' : inter.failed.join('; ')}`);
  say(!reach(unseated, { starlist: ['julia-markdown'] }).some((x) => /white list/.test(x)),
    'a tree that satisfies the interlock is not then refused for the absence it just declared (LAW.LIST.7)');
  writeStarlist(tmp, [{ name: 'vhs', reason: 'not on this machine', date: '2026-09-04', reachable: false }], c);
  const absentTool = starlistOf(tmp, { machine: mkdtempSync(join(os.tmpdir(), 'rot-dtd-nostar2-')), c });
  const refusedForAbsent = reach({ 'code-white': [MD, { name: 'vhs', reason: 'the renderer', layer: 'repository' }], 'file-white': [MD], 'file-black': [], 'code-black': [], 'file-gray': [], 'code-gray': [] },
    { starlist: absentTool.filter((r) => r.reachable !== false).map((r) => r.name) });
  say(refusedForAbsent.length === 1 && /vhs/.test(refusedForAbsent[0]),
    `a tool recorded absent is not counted reachable, so a white entry needing it is refused: ${refusedForAbsent.length} (LAW.LIST.4, LAW.STAR.6)`);
  writeStarlist(tmp, [{ name: 'vhs', reason: 'reachable via scoop', date: '2026-09-04' }], c);
  const starPath2 = starlistPath(tmp, c);
  writeFileSync(starPath2, readFileSync(starPath2, 'utf8').replace('kind CDATA #FIXED "starlist"', 'kind CDATA #FIXED "notastarlist"'), 'utf8');
  const badKind = mislabelled(tmp, c);
  say(badKind.length === 1 && /starlist\.dtd claims another kind/.test(badKind[0]),
    `trip: a starlist that claims another kind is refused, the same way the other six are: ${badKind.length}`);
  writeStarlist(tmp, [{ name: 'vhs', reason: 'reachable via scoop', date: '2026-09-04' }], c);
  writeFileSync(join(tmp, c.dir, 'file-purple.dtd'), '<!-- not a list this grammar declares -->\n', 'utf8');
  const strayFound = filesPresent(tmp, c);
  say(strayFound.stray.length === 1 && strayFound.stray[0] === 'file-purple.dtd',
    `trip: a file under .rot-lists that LIST.files does not name is reported as a stray: ${strayFound.stray.join(', ') || 'none'}`);
  rmSync(join(tmp, c.dir, 'file-purple.dtd'));
  const files = filesPresent(tmp, c);
  say(Array.isArray(files.stray) && files.stray.length === 0 && files.present.length > 0,
    `LIST.files is compared to the directory rather than merely declared: ${files.present.length} present, ${files.missing.length} never written, ${files.stray.length} stray`);

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
  if (cmd === 'table') {
    const built = table(c);
    if (rest[0] === '--check') {
      // A generated file nothing re-generates is a claim, not an artifact
      // (third companion pass). Slop measures read vacuously on a table, so
      // this is the instrument that can actually say no.
      const path = join(ROOT, 'dtd', 'lists.md');
      const have = existsSync(path) ? readFileSync(path, 'utf8') : '';
      if (have === built) { console.log(`list table: dtd/lists.md in step, ${built.split('\n').length} lines`); process.exit(0); }
      const a = have.split('\n');
      const b = built.split('\n');
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) console.log(`  line ${i + 1}: on disk "${(a[i] || '').slice(0, 60)}" | generated "${(b[i] || '').slice(0, 60)}"`);
      }
      console.log('list table: dtd/lists.md disagrees with the declarations; run node lib/list.mjs table > dtd/lists.md');
      process.exit(1);
    }
    process.stdout.write(built);
    process.exit(0);
  }
  // --repo-only leaves the machine layer out, so a gate step measures this
  // repository and not the developer's installed plugin (pass 8).
  const repoOnly = rest.includes('--repo-only');
  const lists = layers(process.cwd(), repoOnly ? { c, machine: join(process.cwd(), '.rot-lists-no-machine-layer') } : { c });
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
    // The whole census, not the ten a reader is shown (pass 6).
    const present = (walked.census || walked.languages).map(([e]) => e);
    // What the harness may reach: what the starlist records, plus the managers
    // the probe found present. The probe alone knows only manager names, which
    // refused every tool this repository had actually recorded (first
    // companion pass of 7.0.0).
    // --repo-only has to reach this half too: it redirected the list layers
    // and left the starlist reading the developer's install (pass 11).
    // A tool recorded absent is not reachable, and dropping the flag counted
    // it as reachable in the fourth clause of LAW.LIST.4 (pass 14).
    const starlist = [...starlistOf(process.cwd(), repoOnly ? { c, machine: join(process.cwd(), '.rot-lists-no-machine-layer') } : { c }).filter((r) => r.reachable !== false).map((r) => r.name), ...walked.toolchain];
    const out = reach(lists, { present, starlist, produces: producesOf(lists) });
    for (const r of out) console.log(r);
    // LIST.files against the directory: a stray is a file no declaration names,
    // and a missing one was simply never written (pass 3 and 4 of the audit).
    const files = filesPresent(process.cwd(), c);
    const wrong = mislabelled(process.cwd(), c);
    for (const w of wrong) console.log(w);
    for (const f of files.stray) console.log(`stray: .rot-lists/${f} is not named by LIST.files`);
    console.log(`list files: ${files.present.length} present, ${files.missing.length} never written, ${files.stray.length} stray`);
    console.log(`list reach: ${out.length} refused`);
    process.exit(out.length === 0 && files.stray.length === 0 && wrong.length === 0 ? 0 : 1);
  }
  if (cmd === 'md') {
    // The same starlist the reach verb builds: hardcoding an empty one meant
    // the first condition of the interlock could never hold (pass 10).
    // The same starlist the reach verb builds, with the same two corrections:
    // absent tools filtered out, and --repo-only honoured (pass 15).
    const m = markdown(lists, [...starlistOf(process.cwd(), repoOnly ? { c, machine: join(process.cwd(), '.rot-lists-no-machine-layer') } : { c }).filter((r) => r.reachable !== false).map((r) => r.name)], c);
    console.log(m.holds ? 'md may be unseated: every condition holds' : `md stays white: ${m.failed.join('; ')}`);
    process.exit(0);
  }
  console.log('usage: node lib/list.mjs show [scope] [class] | reach | md | table | controls');
  process.exit(2);
})();
