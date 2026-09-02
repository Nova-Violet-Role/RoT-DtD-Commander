#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/args.mjs
// The launch-time argument walk of dtd/cc-args.dtd, as code a command may
// run to get its walk as data. The string is split once the way a shell
// splits its positional parameters quoted whole (LAW.ARGS.1): whitespace
// outside quotes separates words, a quoted word keeps its spaces, nothing
// is evaluated. The two flags are recognised and removed, a double hyphen
// ends the options (LAW.ARGS.2), every other word is positional and keeps
// its place. Four guards refuse the shapes the $ARGUMENTS variant files
// name as injection paths (LAW.ARGS.5, LAW.ARGS.6): a word that would be
// evaluated, a path that walks up, a SYSTEM literal, a parameter-entity
// declaration. The flag words and the guard names are read from the DTD.
//
//   walk(text)   -> { count, verbose, debug, words: [{ n, text, quoted }], guards: [{ name, held, detail }] }
//   controls()   -> the fixtures; exit 1 if a guard did not fire
//
//   node lib/args.mjs "<argument string>"     print the walk as lines
//   node lib/args.mjs controls

import { readFileSync } from 'node:fs';
import { join, dirname, resolve as presolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = readFileSync(join(ROOT, 'dtd', 'cc-args.dtd'), 'utf8');

function ent(name) {
  const m = new RegExp(`<!ENTITY\\s+${name.replace(/\./g, '\\.')}\\s+"([^"]*)"`).exec(DTD);
  if (!m) throw new Error(`cc-args.dtd declares no ${name}`);
  return m[1];
}
const token = (name) => ent(name).split(':')[0].trim();
export const VERBOSE = token('ARG.verbose');
export const DEBUG = token('ARG.debug');
export const END = token('ARG.end');
export const GUARDS = (/<!ATTLIST arg_guard[\s\S]*?name\s+\(([^)]+)\)/.exec(DTD) || [, ''])[1].split('|').map((s) => s.trim()).filter(Boolean);

function split(text) {
  const out = [];
  let cur = '';
  let quote = null;
  let quoted = false;
  let has = false;
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      quoted = true;
      has = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (has) out.push({ text: cur, quoted });
      cur = '';
      quoted = false;
      has = false;
      continue;
    }
    cur += ch;
    has = true;
  }
  if (has) out.push({ text: cur, quoted });
  return out;
}

const CHECK = {
  // $( ), backticks, ${ } and a leading $ on a bare word would be evaluated by
  // a shell that received the word unquoted; the walk never evaluates, and it
  // names the word so the command quotes it wherever it goes.
  evaluation(words) {
    const w = words.find((x) => !x.quoted && /\$\(|`|\$\{|^\$[A-Za-z_@#*0-9]/.test(x.text));
    return w ? { held: false, detail: `word ${w.n} would be evaluated by a shell: ${w.text}` } : { held: true, detail: 'no word would be evaluated' };
  },
  traversal(words) {
    const w = words.find((x) => /(^|[\\/])\.\.([\\/]|$)/.test(x.text));
    return w ? { held: false, detail: `word ${w.n} walks up the tree: ${w.text}` } : { held: true, detail: 'no path walks up' };
  },
  // The last two guards read the words joined again: a declaration or a
  // SYSTEM literal is split across words by the walk and must still be seen.
  system(words) {
    const joined = words.map((x) => x.text).join(' ');
    const m = /\bSYSTEM\s+\S+|file:\/\/\S*/i.exec(joined);
    return m ? { held: false, detail: `the words carry a SYSTEM literal or a file URL: ${m[0]}` } : { held: true, detail: 'no SYSTEM literal' };
  },
  pentity(words) {
    const joined = words.map((x) => x.text).join(' ');
    const m = /<!ENTITY\s+%|<!%/.exec(joined);
    return m ? { held: false, detail: 'the words declare a parameter entity: a parameter entity never takes user input' } : { held: true, detail: 'no parameter-entity declaration' };
  },
};

export function walk(text) {
  const raw = split(String(text ?? ''));
  let verbose = false;
  let debug = false;
  let optionsEnded = false;
  const words = [];
  for (const w of raw) {
    if (!optionsEnded && !w.quoted) {
      if (w.text === END) { optionsEnded = true; continue; }
      if (w.text === VERBOSE) { verbose = true; continue; }
      if (w.text === DEBUG) { debug = true; continue; }
    }
    words.push({ n: words.length + 1, text: w.text, quoted: w.quoted });
  }
  const guards = GUARDS.map((name) => ({ name, ...CHECK[name](words) }));
  return { count: words.length, verbose, debug, words, guards };
}

export function controls() {
  const rows = [];
  let bad = 0;
  const t = (ok, line) => { if (!ok) bad++; rows.push(`  ${ok ? 'PASS' : 'FAIL'} ${line}`); };
  const a = walk(`--verbose "John Doe" 1965 -- --debug`);
  t(a.verbose && !a.debug && a.count === 3 && a.words[0].text === 'John Doe' && a.words[0].quoted && a.words[2].text === '--debug', `flags and the end token: verbose=${a.verbose} debug=${a.debug} count=${a.count} words=${a.words.map((w) => w.text).join('|')}`);
  const b = walk(`--debug 'a  b' c`);
  t(b.debug && b.count === 2 && b.words[0].text === 'a  b', `a quoted word keeps its spaces: ${JSON.stringify(b.words[0].text)}`);
  const fixtures = [
    ['evaluation', 'rm $(whoami) now'],
    ['traversal', '../../etc/shadow'],
    ['system', 'x SYSTEM "file:///etc/passwd"'],
    ['pentity', '<!ENTITY % user "x">'],
  ];
  for (const [name, text] of fixtures) {
    const g = walk(text).guards.find((x) => x.name === name);
    t(g && !g.held, `guard ${name} fires on its fixture: ${g ? g.detail : 'not applied'}`);
  }
  const clean = walk(`deploy web-1 "eu west" --verbose`);
  t(clean.guards.every((g) => g.held) && clean.verbose && clean.count === 3, 'a clean string holds every guard');
  const declared = GUARDS.length === Object.keys(CHECK).length && GUARDS.every((g) => g in CHECK);
  t(declared, `the guards the DTD declares are the guards this module checks (${GUARDS.join(', ')})`);
  return { bad, rows };
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [a, ...rest] = process.argv.slice(2);
  if (a === 'controls') {
    const r = controls();
    for (const row of r.rows) console.log(row);
    console.log(`args controls: ${r.bad ? `${r.bad} failing` : 'ok (0 failing)'}, flags ${VERBOSE} ${DEBUG}, end ${END}, guards ${GUARDS.length}`);
    process.exit(r.bad ? 1 : 0);
  }
  const w = walk([a, ...rest].join(' '));
  console.log(`  args count=${w.count} verbose=${w.verbose ? 1 : 0} debug=${w.debug ? 1 : 0}`);
  for (const x of w.words) console.log(`  word n=${x.n}${x.quoted ? ' quoted' : ''}: ${x.text}`);
  for (const g of w.guards) console.log(`  arg_guard ${g.name} held=${g.held ? 'yes' : 'no'}: ${g.detail}`);
  process.exit(w.guards.every((g) => g.held) ? 0 : 1);
}
