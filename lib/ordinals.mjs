// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/ordinals.mjs : word ordinals for records and artifacts.
//
// Two numeral systems, both spelled for every integer from 1 to 9999:
//
//   greek(n)  the Greek cardinal roots: heis, duo, treis, tessares, pente,
//             hex, hepta, okto, ennea, deka ... This is the record system
//             from 5.0.0 on (LAW.IUPAC.6): an artifact's ordinal token is
//             the Greek cardinal, so the second record of a command is
//             `<name>.duo.md`, never `di`.
//   iupac(n)  the IUPAC numerical multiplier: mono, di, tri, tetra ...
//             icosa, triaconta, hecta, kilia. Kept as the second column and
//             for reading the mono/di names written before 5.0.0.
//
// parse(token) reads either spelling back to its integer, so a directory
// that holds `x.mono.md`, `x.di.md` and `x.treis.md` still counts to 3.
// next(dir, name) returns the first free ordinal for `<name>.<ordinal>.md`
// in `dir`, honouring LAW.IUPAC.4: an ordinal once assigned is never
// reassigned, so the answer is max+1, never the first gap.
//
// CLI: node lib/ordinals.mjs <n> | next <dir> <name> | parse <token> | table | controls

import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve as presolve } from 'node:path';

const NL = String.fromCharCode(10);

// ---------- Greek cardinals ----------
const G_UNIT = ['', 'heis', 'duo', 'treis', 'tessares', 'pente', 'hex', 'hepta', 'okto', 'ennea'];
const G_TEEN = ['deka', 'hendeka', 'dodeka', 'treiskaideka', 'tessareskaideka', 'pentekaideka', 'hekkaideka', 'heptakaideka', 'oktokaideka', 'enneakaideka'];
const G_TENS = ['', '', 'eikosi', 'triakonta', 'tessarakonta', 'pentekonta', 'hexekonta', 'hebdomekonta', 'ogdoekonta', 'enenekonta'];
const G_HUND = ['', 'hekaton', 'diakosioi', 'triakosioi', 'tetrakosioi', 'pentakosioi', 'hexakosioi', 'heptakosioi', 'oktakosioi', 'enakosioi'];
const G_THOU = ['', 'chilioi', 'dischilioi', 'trischilioi', 'tetrakischilioi', 'pentakischilioi', 'hexakischilioi', 'heptakischilioi', 'oktakischilioi', 'enakischilioi'];

export function greek(n) {
  n = check(n);
  const parts = [];
  const th = Math.floor(n / 1000);
  const h = Math.floor((n % 1000) / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  if (th) parts.push(G_THOU[th]);
  if (h) parts.push(G_HUND[h]);
  const tu = n % 100;
  if (tu >= 10 && tu <= 19) parts.push(G_TEEN[tu - 10]);
  else {
    if (t) parts.push(G_TENS[t]);
    if (u) parts.push(G_UNIT[u]);
  }
  return parts.join('-');
}

// ---------- IUPAC multipliers ----------
const I_ALONE = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona'];
const I_UNIT = ['', 'hen', 'do', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona'];
const I_TENS = ['', 'deca', 'icosa', 'triaconta', 'tetraconta', 'pentaconta', 'hexaconta', 'heptaconta', 'octaconta', 'nonaconta'];
const I_HUND = ['', 'hecta', 'dicta', 'tricta', 'tetracta', 'pentacta', 'hexacta', 'heptacta', 'octacta', 'nonacta'];
const I_THOU = ['', 'kilia', 'dilia', 'trilia', 'tetralia', 'pentalia', 'hexalia', 'heptalia', 'octalia', 'nonalia'];

export function iupac(n) {
  n = check(n);
  if (n < 10) return I_ALONE[n];
  let s = '';
  const th = Math.floor(n / 1000);
  const h = Math.floor((n % 1000) / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  // least significant place first (LAW.IUPAC.1)
  if (t === 1 && u === 1) s += 'undeca';
  else {
    if (u) s += I_UNIT[u];
    if (t === 2) s += u === 1 || u === 0 ? 'icosa' : 'cosa'; // the twenties elide after a vowel
    else if (t) s += I_TENS[t];
  }
  if (h) s += I_HUND[h];
  if (th) s += I_THOU[th];
  return s;
}

// ---------- reading a token back ----------
const TABLE = new Map();
for (let n = 1; n <= 9999; n++) {
  TABLE.set(greek(n), n);
  const i = iupac(n);
  if (!TABLE.has(i)) TABLE.set(i, n);
}
export function parse(token) {
  const t = String(token || '').toLowerCase().replace(/-$/, '');
  return TABLE.get(t) ?? null;
}

// ---------- the next free ordinal in a directory ----------
export function next(dir, name) {
  if (!existsSync(dir)) return { n: 1, token: greek(1), taken: [] };
  const re = new RegExp('^' + escapeRe(name) + '\\.([a-z-]+)\\.md$');
  const taken = [];
  for (const f of readdirSync(dir)) {
    const m = f.match(re);
    if (!m) continue;
    const n = parse(m[1]);
    if (n) taken.push(n);
  }
  const n = taken.length ? Math.max(...taken) + 1 : 1;
  return { n, token: greek(n), taken: taken.sort((a, b) => a - b) };
}

function check(n) {
  n = Number(n);
  if (!Number.isInteger(n) || n < 1 || n > 9999) throw new RangeError('ordinal out of range 1..9999: ' + n);
  return n;
}
function escapeRe(s) { return s.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&'); }

// ---------- the two systems as a table (references/greek-cardinals.md of iupac-ordinals-dtd) ----------
export function table() {
  const out = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->', '',
    '# Greek cardinals beside the IUPAC multipliers', '',
    'Generated by `node lib/ordinals.mjs table`; the ordinals controls pin twenty-three of these spellings and walk the whole range 1 to 9999 back through parse(). From 5.0.0 a record ordinal is the Greek cardinal (LAW.IUPAC.6): the second record of a command is `<name>.duo.md`. The IUPAC column stays readable, so `mono` and `di` written before 5.0.0 still count.', '',
    '| N | Greek cardinal (record token) | IUPAC multiplier |', '|---|---|---|'];
  const rows = [...Array.from({ length: 30 }, (_, i) => i + 1), 40, 50, 60, 70, 80, 90, 99, 100, 101, 123, 200, 300, 500, 548, 999, 1000, 2000, 2026, 5000, 9999];
  for (const n of rows) out.push('| ' + n + ' | ' + greek(n) + ' | ' + iupac(n) + ' |');
  out.push('', 'Composite cardinals read from the largest place down, joined by a hyphen: 123 is hekaton-eikosi-treis. The teens are single words (treiskaideka, tessareskaideka). The forms follow the standard cardinal table of Attic Greek; the spelling is a reasoned transcription, not a measurement, and the controls pin it so it cannot drift silently.', '');
  return out.join(NL);
}

// ---------- controls: the tables must round-trip and the known spellings must hold ----------
export function controls(io = console) {
  const fail = [];
  const expect = (label, got, want) => { if (got !== want) fail.push(label + ': got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want)); };
  expect('greek 1', greek(1), 'heis');
  expect('greek 2', greek(2), 'duo');
  expect('greek 3', greek(3), 'treis');
  expect('greek 12', greek(12), 'dodeka');
  expect('greek 21', greek(21), 'eikosi-heis');
  expect('greek 123', greek(123), 'hekaton-eikosi-treis');
  expect('greek 2000', greek(2000), 'dischilioi');
  expect('iupac 1', iupac(1), 'mono');
  expect('iupac 2', iupac(2), 'di');
  expect('iupac 11', iupac(11), 'undeca');
  expect('iupac 12', iupac(12), 'dodeca');
  expect('iupac 20', iupac(20), 'icosa');
  expect('iupac 21', iupac(21), 'henicosa');
  expect('iupac 22', iupac(22), 'docosa');
  expect('iupac 548', iupac(548), 'octatetracontapentacta');
  expect('iupac 241', iupac(241), 'hentetracontadicta');
  expect('iupac 411', iupac(411), 'undecatetracta');
  expect('iupac 9267', iupac(9267), 'heptahexacontadictanonalia');
  expect('parse mono', parse('mono'), 1);
  expect('parse di', parse('di'), 2);
  expect('parse duo', parse('duo'), 2);
  expect('parse treis', parse('treis'), 3);
  expect('parse junk', parse('xyzzy'), null);
  for (let n = 1; n <= 9999; n++) {
    if (parse(greek(n)) !== n) { fail.push('greek round-trip ' + n); break; }
  }
  // the control that must hold: the record spelling of 2 is duo, and the old di still reads back as 2
  expect('record 2 is duo not di', greek(2) === 'di', false);
  const ok = fail.length === 0;
  io.log('ordinals controls: ' + (ok ? 'ok' : 'FAIL') + ' (' + fail.length + ' failing)');
  for (const f of fail) io.log('  ' + f);
  return ok;
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [a, b, c] = process.argv.slice(2);
  if (a === 'controls') process.exit(controls() ? 0 : 1);
  else if (a === 'table') process.stdout.write(table());
  else if (a === 'next') { const r = next(presolve(b || '.'), c || ''); console.log(r.n + ' ' + r.token + ' taken=' + (r.taken.join(',') || 'none')); }
  else if (a === 'parse') console.log(parse(b) ?? 'unknown');
  else if (a) console.log(a + ' greek=' + greek(a) + ' iupac=' + iupac(a));
  else { console.log('usage: ordinals.mjs <n> | next <dir> <name> | parse <token> | table | controls'); process.exit(2); }
}
