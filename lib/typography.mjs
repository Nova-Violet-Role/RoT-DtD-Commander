#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/typography.mjs
// dtd/typography.dtd as code: the glyph and plate contract that cc-figure
// renders against. Everything is read from the declarations; nothing about
// the repertoire, the cell, the classes or the numeral series is repeated
// here, so the file and the code cannot drift without a control seeing it.
//
// The one thing this module does that the DTD cannot: it CHECKS. LAW.TYPO.6
// says so in the declarations, and the corpus is why -- TEI declares 64
// teidata.* of which 63 expand to CDATA, OpenOffice declares 47 datatypes of
// which 42 carry no constraint. A name in a grammar is provenance. The
// arithmetic lives here.
//
//   guarantee()          -> { lo, hi } the code points every leg can draw
//   classes()            -> the repertoire classes and which are switched on
//   resolve(ch, on)      -> what is actually drawn for one character
//   numeral(n)           -> { n, name, form, suffix } the derived figure name
//   cells()              -> the cell, asserted equal to cc-figure's
//   spent()              -> every TYPO.* entity, and whether this module reads it
//   controls()           -> the fixtures; exit 1 if a law did not fire
//
//   node lib/typography.mjs numeral <n>
//   node lib/typography.mjs table
//   node lib/typography.mjs controls

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSubset } from './dtd.mjs';
// The two renderers the renders enumeration names; read at control time only.
import * as figureRenders from './figure.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = readFileSync(join(ROOT, 'dtd', 'typography.dtd'), 'utf8');
const FIG = readFileSync(join(ROOT, 'dtd', 'cc-figure.dtd'), 'utf8');

function entFrom(text, name, what) {
  const m = new RegExp(`<!ENTITY\\s+${name.replace(/\./g, '\\.')}\\s+"([^"]*)"`).exec(text);
  if (!m) throw new Error(`${what} declares no ${name}`);
  return m[1];
}
const ent = (n) => entFrom(DTD, n, 'typography.dtd');
const fig = (n) => entFrom(FIG, n, 'cc-figure.dtd');
const READ = new Set();
function used(n) { READ.add(n); return ent(n); }

// ---- the guarantee (LAW.TYPO.1) ----
export function guarantee() {
  return { lo: Number(used('TYPO.guaranteed.lo')), hi: Number(used('TYPO.guaranteed.hi')), text: used('TYPO.guaranteed') };
}
export const ALLOWED_CONTROL = () => used('TYPO.allowed.control');

// ---- the cell, shared with cc-figure (LAW.TYPO.2) ----
export function cells() {
  const w = Number(used('TYPO.cell.w'));
  const h = Number(used('TYPO.cell.h'));
  const fw = Number(fig('FIG.cell.w'));
  const fh = Number(fig('FIG.cell.h'));
  const agree = w === fw && h === fh;
  const upm = Number(used('TYPO.units_per_em'));
  const asc = Number(used('TYPO.ascent'));
  return {
    w, h, fw, fh, agree,
    units_per_em: upm,
    ascent: asc,
    descent: Number(used('TYPO.descent')),
    cap_height: Number(used('TYPO.cap_height')),
    x_height: Number(used('TYPO.x_height')),
    horiz_adv_x: Number(used('TYPO.horiz_adv_x')),
    // TYPO.baseline states the arithmetic in words; here it is the arithmetic.
    baseline: Math.floor((h * asc) / upm),
    baseline_rule: used('TYPO.baseline'),
    // The advance is half the em: the monospace grid, checked rather than eyed.
    monospace: Number(used('TYPO.horiz_adv_x')) * 2 === upm,
  };
}

// ---- the repertoire (LAW.TYPO.4) ----
export function classes() {
  const names = used('TYPO.classes').split('|').map((s) => s.trim());
  const count = Number(used('TYPO.classes.count'));
  const on = {};
  for (const c of names) {
    if (c === 'ascii') { on[c] = true; continue; }
    const m = new RegExp(`<!ENTITY % typo\\.${c}\\.module\\s+"(INCLUDE|IGNORE)"`).exec(DTD);
    on[c] = m ? m[1] === 'INCLUDE' : false;
  }
  return { names, count, on, declared: names.length === count };
}

// The seven glyphs cc-figure names, declared here too with their class.
export function figureGlyphs() {
  return {
    corner: used('TYPO.glyph.corner'),
    h: used('TYPO.glyph.h'),
    v: used('TYPO.glyph.v'),
    diag: used('TYPO.glyph.diag'),
    back: used('TYPO.glyph.back'),
    fill: used('TYPO.glyph.fill'),
    light: used('TYPO.glyph.light'),
  };
}

// The same seven glyphs as cc-figure declares them, so the two files can be
// held to each other (LAW.TYPO.2 names the cell; the glyphs follow the cell).
export function figureGlyphsDeclaredByFigure() {
  const out = {};
  for (const k of ['corner', 'h', 'v', 'diag', 'back', 'fill', 'light']) out[k] = fig(`FIG.glyph.${k}`);
  return out;
}
export const RULE_FALLBACK = () => used('TYPO.rule.fallback');

// ---- what is actually drawn (LAW.TYPO.1, LAW.TYPO.3) ----
export function resolve(ch, { on = classes().on, fallback = null } = {}) {
  const g = guarantee();
  const cp = String(ch).codePointAt(0);
  if (cp >= g.lo && cp <= g.hi) return { drawn: ch, via: 'ascii', class: 'ascii' };
  if (fallback && fallback.codePointAt(0) >= g.lo && fallback.codePointAt(0) <= g.hi) {
    return { drawn: fallback, via: 'fallback', class: 'declared' };
  }
  return { drawn: used('TYPO.missing.draws'), via: 'missing_glyph', reason: used('TYPO.missing.reason') };
}

// ---- the numeral series (LAW.TYPO.7) ----
// Source: dtd/sigil/greek-numbers.md. The series is read from
// the declarations, never retyped, so a name and its number cannot disagree.
const UNITS = () => used('TYPO.numeral.units').split('|');
const TEENS = () => used('TYPO.numeral.teens').split('|');
const TENS = () => used('TYPO.numeral.tens').split('|');
export const PLAIN_ABOVE = () => Number(used('TYPO.numeral.plain'));

// The compound stems. dtd/sigil/greek-numbers.md writes the twenties with the stem
// `icosi` and the unit `hena` for one (21 icosihena, 24 icositetra), while its
// tens table names 20 `icosa`. Both spellings are in the source; the exact ten
// takes the table's name and a compound takes the compound stem.
const COMPOUND_STEM = { 20: 'icosi' };
const COMPOUND_UNIT = { 1: 'hena' };

// ---- the ATTLIST enumerations, read from the subset ----
// An enumeration is a declaration like any entity: a value the code accepts
// that the subset does not declare is drift, and the companion audit of
// 9.0.0 measured numeral() taking any string as a suffix while the subset
// declared four. Every enumeration is read here and held to a producer in
// the controls, in both directions.
export function enumeration(attr, text = DTD) {
  const m = new RegExp('\\b' + attr + '\\s+\\(([^)]+)\\)').exec(text);
  if (!m) throw new Error(`typography.dtd declares no enumeration ${attr}`);
  return m[1].split('|').map((s) => s.trim()).filter(Boolean);
}
// Every ATTLIST enumeration: a name, a parenthesis, values that may carry a
// hyphen (sans-serif), and a default after it, which is what tells an
// enumeration from a content model. The sixth companion pass on 9.0.0
// measured a character class without the hyphen dropping generic from the
// walk, with a pinned count of six that made the omission permanent.
export function enumerations(text = DTD) {
  const out = [];
  const re = /(?:^|\s)([\w.:-]+)\s+\(\s*([\w|.:\s-]+?)\s*\)\s+(?:#REQUIRED|#IMPLIED|#FIXED\s+"[^"]*"|"[^"]*")/g;
  for (const m of text.matchAll(re)) out.push({ attr: m[1], values: m[2].split('|').map((s) => s.trim()).filter(Boolean) });
  return out;
}
// The independent count: every parenthesised group that a default follows,
// read with the widest class, so a value the reader above cannot spell is a
// disagreement between two readings and never a silent drop.
export function enumerationCount(text = DTD) {
  return (text.match(/\(\s*[^()#]+?\s*\)\s+(?:#REQUIRED|#IMPLIED|#FIXED\s+"[^"]*"|"[^"]*")/g) || []).length;
}
export const SUFFIXES = () => enumeration('suffix');
export const STYLES = () => enumeration('style');
export const ROLES = () => enumeration('role');
export const GENERICS = () => enumeration('generic');

// The generic family a face ends on: the last name of its family list when
// that name is one the subset declares, refused by name otherwise. This is
// the producer of every declared generic, not only the plate's monospace.
export function genericOf(family) {
  const last = String(family).split(',').map((s) => s.trim()).filter(Boolean).pop() || '';
  if (!GENERICS().includes(last)) return { generic: '', why: `a family that does not end on a declared generic: ${JSON.stringify(last)}; declared ${GENERICS().join('|')} (LAW.TYPO.5)` };
  return { generic: last };
}

// One face element: the role names which of the two declared faces, the
// style is one of the two the subset declares, and a value outside either
// enumeration is refused by name (LAW.TYPO.5).
export function face(role, style = 'normal') {
  if (!ROLES().includes(role)) return { role, style, why: `a role the subset does not declare: ${JSON.stringify(role)}; declared ${ROLES().join('|')}` };
  if (!STYLES().includes(style)) return { role, style, why: `a style the subset does not declare: ${JSON.stringify(style)}; declared ${STYLES().join('|')}` };
  const family = used(role === 'plate' ? 'TYPO.face.plate' : 'TYPO.face.widget');
  const generic = role === 'plate' ? genericOf(family).generic : '';
  return { role, family, generic, style, weight: 'normal' };
}

export function numeral(n, suffix = 'gon') {
  const N = Number(n);
  if (!SUFFIXES().includes(suffix)) return { n, name: '', form: 'plain', suffix, why: `a suffix the subset does not declare: ${JSON.stringify(suffix)}; declared ${SUFFIXES().join('|')}` };
  if (!Number.isInteger(N) || N < 1) return { n, name: '', form: 'plain', suffix, why: 'not a positive integer' };
  const plainAbove = PLAIN_ABOVE();
  if (N <= 12) return { n: N, name: UNITS()[N - 1], form: 'unit', suffix };
  if (N <= 19) return { n: N, name: TEENS()[N - 13], form: 'teen', suffix };
  if (N <= plainAbove) {
    const t = Math.floor(N / 10) * 10;
    const u = N % 10;
    const tenName = TENS()[t / 10 - 2];
    if (u === 0) return { n: N, name: tenName, form: 'ten', suffix };
    const stem = COMPOUND_STEM[t] || tenName;
    const unit = COMPOUND_UNIT[u] || UNITS()[u - 1];
    return { n: N, name: stem + unit, form: 'compound', suffix, join: used('TYPO.numeral.join') };
  }
  // Exact scales keep their names; anything else past the plain bound is named
  // by its number, which is what dtd/sigil/greek-numbers.md's own closing note says.
  // An exact scale is the carve-out LAW.TYPO.7 declares, under its own form
  // value: the fourth companion pass on 9.0.0 measured hecta, chilia and
  // myria rendered as form ten against a law that said plain past 99, with
  // a control that pinned the deviation instead of catching it.
  const scales = { 100: used('TYPO.numeral.hundreds'), 1000: used('TYPO.numeral.thousands'), 10000: used('TYPO.numeral.myriads') };
  if (scales[N]) return { n: N, name: scales[N], form: 'scale', suffix };
  return { n: N, name: `${N}-${suffix}`, form: 'plain', suffix, why: used('TYPO.numeral.beyond') };
}

// ---- both directions: is every declaration spent? (the corpus' orphan defect) ----
export function spent() {
  const declared = [...DTD.matchAll(/<!ENTITY\s+(TYPO\.[A-Za-z0-9_.]+)\s+"/g)].map((m) => m[1]);
  const unread = declared.filter((d) => !READ.has(d));
  return { declared, read: [...READ], unread };
}

export function table() {
  const c = cells();
  const k = classes();
  const out = [];
  out.push('| n | name | form |');
  out.push('|---|---|---|');
  for (const n of [1, 3, 4, 5, 6, 8, 12, 13, 17, 20, 21, 24, 29, 30, 32, 40, 50, 90, 99, 100, 1000, 144]) {
    const r = numeral(n);
    out.push(`| ${r.n} | ${r.name} | ${r.form} |`);
  }
  out.push('');
  out.push(`cell ${c.w}x${c.h} (cc-figure ${c.fw}x${c.fh}, agree=${c.agree}), baseline ${c.baseline}, monospace=${c.monospace}`);
  out.push(`classes ${k.names.join('|')} -> ${k.names.map((n) => `${n}=${k.on[n] ? 'on' : 'off'}`).join(' ')}`);
  return out.join('\n');
}

export function controls() {
  let ran = 0;
  let fail = 0;
  const say = (ok, text) => { ran++; console.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };

  // LAW.TYPO.2: the cell is declared once and shared.
  const c = cells();
  say(c.agree, `the cell agrees with cc-figure: typography ${c.w}x${c.h}, figure ${c.fw}x${c.fh}`);
  say(c.monospace, `the advance is half the em: ${c.horiz_adv_x} x 2 = ${c.units_per_em}`);
  say(c.baseline === 12, `the baseline is computed, not chosen: floor(${c.h} * ${c.ascent} / ${c.units_per_em}) = ${c.baseline}`);

  // LAW.TYPO.1 and LAW.TYPO.3: the guarantee, and what happens outside it.
  const g = guarantee();
  say(g.lo === 32 && g.hi === 126, `the guarantee is printable ASCII: ${g.lo} to ${g.hi}`);
  say(resolve('+').via === 'ascii', 'a glyph inside the guarantee is drawn as itself');
  const box = resolve('─', { fallback: '-' });
  say(box.via === 'fallback' && box.drawn === '-',
    `trip: a box-drawing glyph with a declared fallback falls back: U+2500 -> ${JSON.stringify(box.drawn)}`);
  const orphanGlyph = resolve('─');
  say(orphanGlyph.via === 'missing_glyph' && orphanGlyph.drawn === '?',
    `trip: a glyph outside the guarantee with no fallback draws ${JSON.stringify(orphanGlyph.drawn)}, never a box`);
  const badFallback = resolve('─', { fallback: '━' });
  say(badFallback.via === 'missing_glyph',
    'trip: a fallback that is itself outside the guarantee does not resolve (LAW.TYPO.3)');

  // LAW.TYPO.4: the classes are modules and the count is declared.
  const k = classes();
  say(k.declared, `TYPO.classes.count matches the list: ${k.count} classes, ${k.names.join('|')}`);
  say(k.on.ascii === true && k.on.block === false,
    `ascii cannot be switched off and block ships off: ${Object.entries(k.on).map(([a, b]) => `${a}=${b ? 'on' : 'off'}`).join(' ')}`);

  // LAW.TYPO.7: the name is derived from the number.
  const cases = [[1, 'mono', 'unit'], [3, 'tri', 'unit'], [8, 'octa', 'unit'], [12, 'dodeca', 'unit'],
    [13, 'triskaideca', 'teen'], [19, 'enneakaideca', 'teen'], [20, 'icosa', 'ten'],
    [21, 'icosihena', 'compound'], [24, 'icositetra', 'compound'], [30, 'triaconta', 'ten'],
    [32, 'triacontadi', 'compound'], [90, 'enneaconta', 'ten'], [100, 'hecta', 'scale']];
  const wrong = cases.filter(([n, name, form]) => {
    const r = numeral(n);
    return r.name !== name || r.form !== form;
  });
  say(wrong.length === 0, wrong.length === 0
    ? `${cases.length} names derive from their numbers: ${cases.slice(0, 4).map(([n]) => `${n}=${numeral(n).name}`).join(', ')}, ...`
    : `derived names disagree: ${wrong.map(([n, name]) => `${n} wanted ${name} got ${numeral(n).name}`).join('; ')}`);
  // LAW.TYPO.7 in both arms: the three exact scales keep their names under
  // form scale, and the first number past the bound that is not a scale is
  // plain, named by its number, with the reason the law routes it through.
  const scaled = [[100, 'hecta'], [1000, 'chilia'], [10000, 'myria']].map(([n, name]) => [n, name, numeral(n)]);
  say(scaled.every(([, name, r]) => r.form === 'scale' && r.name === name && !r.why),
    `trip: the exact scales keep their names under form scale: ${scaled.map(([n, , r]) => `${n}=${r.name}/${r.form}`).join(' ')}`);
  const past = [101, 999, 1001].map((n) => numeral(n));
  say(past.every((r) => r.form === 'plain' && r.name === `${r.n}-gon` && /number/.test(r.why || '')),
    `trip: past the bound and not a scale is plain, named by number, with TYPO.numeral.beyond as the reason: ${past.map((r) => r.name).join(' ')}`);
  const beyond = numeral(144);
  say(beyond.form === 'plain' && beyond.name === '144-gon',
    `trip: past ${PLAIN_ABOVE()} sides the figure is named by its number: ${beyond.name}`);
  say(numeral(0).form === 'plain' && numeral(-3).form === 'plain',
    'trip: a number that is not a positive integer yields no constructed name');

  // dtd/sigil/greek-numbers.md is internally inconsistent at 29 (its table writes
  // "icosienna", its rule gives icosi + ennea). Reported, not smoothed over:
  // a source that disagrees with itself is a measurement, and hiding it would
  // be the defect the corpus study exists to refuse.
  say(numeral(29).name === 'icosiennea',
    `the construction rule is followed at 29 (${numeral(29).name}); dtd/sigil/greek-numbers.md's own table writes "icosienna" and the two disagree in the source`);

  // LAW.TYPO.1: the two control bytes the law allows, named by the grammar so
  // a renderer never guesses which whitespace is legal in a plate.
  const ctl = ALLOWED_CONTROL();
  say(/U\+0009/.test(ctl) && /U\+000A/.test(ctl) && /nothing else/.test(ctl),
    `the allowed control bytes are named and closed: ${ctl}`);

  // LAW.TYPO.1 again, on the seven glyphs cc-figure draws with: every one of
  // them must be inside the guarantee, or the figure depends on a font.
  const fg = figureGlyphs();
  const outside = Object.entries(fg).filter(([, ch]) => {
    const cp = ch.codePointAt(0);
    return cp < g.lo || cp > g.hi;
  });
  say(outside.length === 0, outside.length === 0
    ? `all seven figure glyphs are inside the guarantee: ${Object.values(fg).join(' ')}`
    : `figure glyphs outside the guarantee: ${outside.map(([k, v]) => `${k}=${v}`).join(', ')}`);
  const ff = figureGlyphsDeclaredByFigure();
  const differ = Object.keys(fg).filter((k) => fg[k] !== ff[k]);
  say(differ.length === 0, differ.length === 0
    ? 'typography.dtd and cc-figure.dtd declare the same seven glyphs, glyph for glyph'
    : `the two files disagree on a glyph: ${differ.map((k) => `${k} typography=${fg[k]} figure=${ff[k]}`).join(', ')}`);

  // Two numeral systems live in this tree on purpose. lib/ordinals.mjs iupac()
  // is the chemist's multiplier (nona, undeca) and names record files
  // (LAW.IUPAC); this module's numeral() is the geometer's prefix (ennea,
  // hendeca) and names figures (LAW.TYPO.7). They are meant to differ at 9,
  // and a later hand that unifies them breaks this line.
  say(numeral(9).name === 'ennea' && numeral(11).name === 'hendeca',
    `the figure numeral is the geometer's, not the chemist's: 9=${numeral(9).name} (ordinals says nona), 11=${numeral(11).name} (ordinals says undeca)`);
  say(/ascii twin/.test(RULE_FALLBACK()),
    `the rule class states where it falls back: ${RULE_FALLBACK().slice(0, 60)}...`);

  // LAW.TYPO.5: a face names a generic family or it is refused.
  const plate = used('TYPO.face.plate');
  const widget = used('TYPO.face.widget');
  say(GENERICS().some((x) => plate.trim().endsWith(x)),
    `the plate face ends in a generic family: ...${plate.slice(-24)}`);
  say(/never named by us/.test(widget),
    "the widget face is the viewer own and is never named by us");
  say(!GENERICS().some((x) => 'Menlo, Consolas'.trim().endsWith(x)),
    'trip: a stack with no generic family would be refused by that same test');

  // LAW.TYPO.4 through the resolver: a class switched off loses its element,
  // and a class switched on with the content redeclared gains it, the way
  // cc-figure switches a shape. The switch removes a declaration; it does
  // not ask a renderer to be careful.
  const base = join(ROOT, 'dtd');
  const on = resolveSubset('<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;\n<!ENTITY % typography SYSTEM "typography.dtd">\n%typography;', base).text;
  say(/<!ELEMENT rule_glyphs/.test(on) && !/<!ELEMENT block_glyphs/.test(on) && /<!ELEMENT typeset \(face\+, glyph\*, rule_glyphs\?, arrow_glyphs\?, math_glyphs\?, greek_glyphs\?, missing_glyph, numeral\*\)>/.test(on),
    'with the default driver the four INCLUDE classes are declared, block is not, and typeset admits exactly the four (LAW.TYPO.4)');
  const noGreek = resolveSubset('<!ENTITY % typo.greek.module "IGNORE">\n<!ENTITY % typo.classes.content "rule_glyphs?, arrow_glyphs?, math_glyphs?">\n<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;\n<!ENTITY % typography SYSTEM "typography.dtd">\n%typography;', base).text;
  say(!/<!ELEMENT greek_glyphs/.test(noGreek) && /<!ELEMENT typeset \(face\+, glyph\*, rule_glyphs\?, arrow_glyphs\?, math_glyphs\?, missing_glyph, numeral\*\)>/.test(noGreek),
    'trip: typo.greek.module IGNORE before the include removes greek_glyphs and typeset no longer admits it (LAW.TYPO.4)');
  const withBlock = resolveSubset('<!ENTITY % typo.block.module "INCLUDE">\n<!ENTITY % typo.classes.content "rule_glyphs?, arrow_glyphs?, math_glyphs?, greek_glyphs?, block_glyphs?">\n<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;\n<!ENTITY % typography SYSTEM "typography.dtd">\n%typography;', base).text;
  say(/<!ELEMENT block_glyphs \(glyph\+\)>/.test(withBlock) && /block_glyphs\?, missing_glyph/.test(withBlock),
    'a command that wants block switches it on in two declarations before the include and the grammar gains it');

  // Both directions: every TYPO.* entity this file declares is read here.
  const s = spent();
  say(s.unread.length === 0, s.unread.length === 0
    ? `every declaration is spent: ${s.declared.length} TYPO.* entities, ${s.read.length} read, 0 orphaned`
    : `orphaned declarations nothing reads: ${s.unread.join(', ')}`);

  // The enumerations are held to producers in both directions (the
  // companion's second pass on 9.0.0: numeral() took banana, italic had no
  // producer, spent() read entities and never an enumeration).
  const banana = numeral(144, 'banana');
  say(banana.name === '' && /does not declare/.test(banana.why) && /gon\|hedron\|ad\|meter/.test(banana.why),
    `trip: a suffix the subset does not declare is refused by name: ${banana.why}`);
  say(SUFFIXES().every((s) => numeral(12, s).suffix === s && numeral(12, s).name === 'dodeca' && numeral(144, s).name === `144-${s}`),
    `every declared suffix is produced: ${SUFFIXES().map((s) => numeral(144, s).name).join(', ')}`);
  const styled = STYLES().map((s) => face('plate', s));
  const badStyle = face('plate', 'oblique');
  const badRole = face('margin');
  say(styled.every((f) => !f.why && f.generic === 'monospace') && badStyle.why && /oblique/.test(badStyle.why) && badRole.why && /margin/.test(badRole.why),
    `both declared styles render a plate face on a generic family and a third is refused: ${styled.map((f) => f.style).join('|')}; ${badStyle.why}`);
  const producers = {
    role: ROLES().map((r) => face(r).role),
    generic: GENERICS().map((g) => genericOf(`Any Face, ${g}`).generic),
    style: STYLES().map((s) => face('plate', s).style),
    class: classes().names,
    form: [1, 13, 20, 21, 100, 144].map((n) => numeral(n).form),
    suffix: SUFFIXES().map((s) => numeral(12, s).suffix),
    renders: ['cells', 'svg', 'both'].filter((r) => (r === 'cells' && typeof figureRenders.renderCells === 'function') || (r === 'svg' && typeof figureRenders.renderSvg === 'function') || (r === 'both' && typeof figureRenders.renderCells === 'function' && typeof figureRenders.renderSvg === 'function')),
  };
  const enums = enumerations();
  const gaps = [];
  for (const e of enums) {
    const made = new Set(producers[e.attr] || []);
    for (const v of e.values) if (!made.has(v)) gaps.push(`${e.attr}=${v}`);
    for (const v of made) if (!e.values.includes(v)) gaps.push(`${e.attr} produces undeclared ${v}`);
  }
  // The count is read twice from the file, never pinned: the reader's count
  // must equal the widest parenthesis count, so an enumeration the reader
  // cannot spell is a disagreement and not a silent drop.
  const genericsMade = GENERICS().map((g) => genericOf(`Georgia, ${g}`));
  const badGeneric = genericOf('Menlo, Consolas');
  say(genericsMade.every((g) => g.generic && !g.why) && genericsMade.map((g) => g.generic).join('|') === GENERICS().join('|') && badGeneric.why && /Consolas/.test(badGeneric.why),
    `every declared generic is produced by genericOf and a family ending on none is refused by name: ${GENERICS().join('|')}; ${badGeneric.why}`);
  const plantedDtd = DTD.replace('sans-serif)', 'sans-serif|cursive)');
  const plantedGeneric = enumerations(plantedDtd).find((e) => e.attr === 'generic');
  say(enumerations(plantedDtd).length === enumerationCount(plantedDtd) && plantedGeneric && plantedGeneric.values.length === 4 && plantedGeneric.values.includes('cursive') && !(producers.generic || []).includes('cursive'),
    `trip: a fourth generic planted in the subset is read by the walk and has no producer, so the walk would go red: ${plantedGeneric ? plantedGeneric.values.join('|') : 'not read'}`);
  say(enums.length === enumerationCount() && enums.length >= 7 && gaps.length === 0,
    `every value of every ATTLIST enumeration has a producer and nothing undeclared is produced: ${enums.map((e) => `${e.attr}(${e.values.length})`).join(' ')}${gaps.length ? `; gaps ${gaps.join(', ')}` : ''}`);

  console.log(`typography controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === 'controls') process.exit(controls() ? 0 : 1);
  if (args[0] === 'table') { console.log(table()); return; }
  if (args[0] === 'numeral') { const r = numeral(args[1], args[2] || 'gon'); console.log(JSON.stringify(r, null, 2)); process.exit(r.name === '' ? 1 : 0); }
  if (args[0] === 'face') { const r = face(args[1], args[2] || 'normal'); console.log(JSON.stringify(r, null, 2)); process.exit(r.why ? 1 : 0); }
  console.log('usage: node lib/typography.mjs numeral <n> [suffix] | table | controls');
}

if (process.argv[1] && process.argv[1].endsWith('typography.mjs')) main();
