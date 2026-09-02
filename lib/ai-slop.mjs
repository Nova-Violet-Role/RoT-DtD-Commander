// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/ai-slop.mjs : the AI_SLOP gate. Reads its ban list and its bounds from
// dtd/ai-slop.dtd (never from a table of its own), measures a rendered
// answer's own voice, and renders a slop_report.
//
//   scan(text, { prev })  -> { alive, hits, measures, words, sentences }
//   render(report, file)  -> the slop_report as text lines
//   table()               -> the contract as markdown (references/contract.md
//                            of the ai-slop-dtd skill)
//   controls()            -> both directions: every SLOP.* phrase in the
//                            DTD is loaded, every measure in the DTD's
//                            enumeration is computed, a sloppy fixture
//                            fails, a clean fixture passes, a fenced hit is
//                            not a hit, the rendered table has not drifted
//
// CLI: node lib/ai-slop.mjs <file> [--prev <file>] [--json]
//      node lib/ai-slop.mjs controls | table
//      node lib/ai-slop.mjs sweep <dir> [<dir>...]    one line per .md, exit 1 if any fails
//
// What is judged is the answer's OWN voice: frontmatter, the DOCTYPE,
// code fences, inline code, <quoted> elements, tables and headings are
// removed before measuring (LAW.SLOP.1). The static-sentence classifier
// is a proxy: a sentence counts as static when it carries a copula or an
// auxiliary and no other verb the heuristics can see (an -ed or -ing
// token, or a token from VERBS). The numbers it yields are measured; the
// classifier behind them is reasoned, and the report says so.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve as presolve, extname } from 'node:path';
import { parseSubset } from './dtd.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = presolve(HERE, '..');
const DTD_PATH = join(ROOT, 'dtd', 'ai-slop.dtd');
const TABLE_PATH = join(ROOT, 'src', 'skills', 'ai-slop-dtd', 'references', 'contract.md');
const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);

// ---------- the contract, read once ----------
export function contract(path = DTD_PATH) {
  const sub = parseSubset(readFileSync(path, 'utf8'));
  const lists = { tell: [], hedge: [], filler: [], closer: [] };
  const bounds = {};
  for (const [k, v] of sub.entities) {
    const m = k.match(/^SLOP\.(tell|hedge|filler|closer)\.(\d+)$/);
    if (m) { lists[m[1]].push(v); continue; }
    const b = k.match(/^SLOP\.([a-z_]+)\.(max|min)$/);
    if (b) { bounds[b[1] + '.' + b[2]] = Number(v); continue; }
    if (k === 'SLOP.min_words') bounds.min_words = Number(v);
  }
  const att = sub.attlists.find((a) => a.element === 'slop_measure');
  const enumM = att && att.body.match(/name\s+\(([^)]+)\)/);
  const measureNames = enumM ? enumM[1].split('|').map((s) => s.trim()) : [];
  const laws = [...sub.entities.keys()].filter((k) => k.startsWith('LAW.SLOP.'));
  const lawText = new Map(laws.map((k) => [k, sub.entities.get(k)]));
  return { lists, bounds, measureNames, laws, lawText, path };
}

// ---------- the verb heuristics ----------
const COPULA = /\b(is|are|was|were|be|been|being|am|has|have|had|seems?|remains?|becomes?|appears?|exists?|stays?|feels?)\b/i;
const VERBS = new Set(('run reads read write writes build builds ship ships cut cuts keep keeps hold holds name names ' +
  'make makes take takes give gives get gets put puts set sets go goes come comes see sees say says tell tells ' +
  'find finds show shows use uses call calls open opens close closes start starts stop stops move moves ' +
  'print prints fail fails pass passes check checks test tests prove proves measure measures count counts ' +
  'commit commits push pushes pull pulls merge merges edit edits add adds drop drops remove removes delete deletes ' +
  'create creates load loads save saves fetch fetches return returns throw throws catch catches emit emits ' +
  'declare declares render renders parse parses match matches replace replaces split splits join joins ' +
  'ask asks answer answers choose chooses pick picks decide decides refuse refuses accept accepts reject rejects ' +
  'want wants need needs know knows think thinks mean means let lets do does did done went ran wrote built ' +
  'read said told found showed used gave took made came saw kept held cut put got set ' +
  'begin begins end ends turn turns bring brings leave leaves lose loses win wins draw draws fire fires trip trips ' +
  'judge judges report reports list lists mark marks fence fences quote quotes invoke invokes carry carries ' +
  'sort sorts scan scans sweep sweeps guard guards land lands break breaks fix fixes install installs walk walks ' +
  'cost costs pay pays spend spends look looks reach reaches touch touches send sends receive receives ' +
  'try tries stand stands sit sits fall falls rise rises grow grows change changes hear hears speak speaks ' +
  'wait waits watch watches follow follows lead leads meet meets learn learns teach teaches').split(/\s+/));
const VERBISH = /\b\w{3,}(ed|ing)\b/i;

// ---------- stripping to the answer's own voice ----------
export function ownVoice(text) {
  let t = text.split(CR).join('');
  if (t.startsWith('---' + NL)) { const e = t.indexOf(NL + '---', 4); if (e > 0) t = t.slice(e + 4); }
  t = t.replace(/<!DOCTYPE[\s\S]*?\]>\s*/g, '');
  t = t.replace(/```[\s\S]*?```/g, NL);
  t = t.replace(/<quoted\b[^>]*>[\s\S]*?<\/quoted>/gi, ' ');
  t = t.replace(/`[^`\n]*`/g, ' ');
  t = t.replace(/<[^>\n]+>/g, ' ');
  const lines = t.split(NL).filter((l) => !/^\s*(#{1,6}\s|\||<!--)/.test(l));
  return lines.join(NL);
}

function sentences(voice) {
  const out = [];
  for (const raw of voice.split(NL)) {
    const line = raw.replace(/^\s*([-*+]|\d+[.)])\s+/, '').trim();
    if (!line) continue;
    for (const s of line.split(/(?<=[.!?])\s+(?=[A-Z"'(\[])/)) {
      const w = s.replace(/[^\w'-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
      if (w.length) out.push({ text: s.trim(), words: w });
    }
  }
  return out;
}

function isStatic(sent) {
  if (!COPULA.test(sent.text)) return false;
  for (const w of sent.words) if (VERBS.has(w.toLowerCase())) return false;
  return !VERBISH.test(sent.text);
}

function mattr(words, win = 100) {
  const w = words.map((x) => x.toLowerCase());
  if (w.length <= win) return new Set(w).size / Math.max(1, w.length);
  let sum = 0;
  let n = 0;
  const counts = new Map();
  for (let i = 0; i < w.length; i++) {
    counts.set(w[i], (counts.get(w[i]) || 0) + 1);
    if (i >= win) {
      const o = w[i - win];
      const c = counts.get(o) - 1;
      if (c) counts.set(o, c); else counts.delete(o);
    }
    if (i >= win - 1) { sum += counts.size / win; n++; }
  }
  return sum / n;
}

function openings(sents) {
  const s = new Set();
  for (const x of sents) if (x.words.length >= 3) s.add(x.words.slice(0, 3).join(' ').toLowerCase());
  return s;
}
function jaccard(a, b) {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function escapeRe(s) { return s.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&'); }
function phraseRe(p) {
  const core = escapeRe(p).replace(/\s+/g, '\\s+');
  const lead = /^\w/.test(p) ? '\\b' : '';
  const tail = /\w$/.test(p) ? '\\b' : '';
  return new RegExp(lead + core + tail, 'gi');
}
const r2 = (x) => Math.round(x * 100) / 100;

// ---------- the scan ----------
export function scan(text, { prev = null, c = contract() } = {}) {
  const voice = ownVoice(text);
  const sents = sentences(voice);
  const words = sents.flatMap((s) => s.words);
  const nWords = words.length;
  const hits = [];
  const voiceLines = voice.split(NL);
  for (const kind of ['tell', 'hedge', 'filler', 'closer']) {
    for (const phrase of c.lists[kind]) {
      const re = phraseRe(phrase);
      voiceLines.forEach((line, i) => {
        for (const m of line.matchAll(re)) hits.push({ kind, line: i + 1, phrase, at: m.index });
      });
    }
  }
  const count = (k) => hits.filter((h) => h.kind === k).length;
  const per1000 = (k) => (nWords ? (count(k) * 1000) / nWords : 0);
  const staticN = sents.filter(isStatic).length;
  for (const s of sents) if (isStatic(s)) hits.push({ kind: 'static', line: 0, phrase: s.text.slice(0, 80), at: 0 });
  const lens = sents.map((s) => s.words.length);
  const mean = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length) : 0;
  const small = nWords < c.bounds.min_words;
  const prevSents = prev ? sentences(ownVoice(prev)) : null;
  const rotation = prevSents ? jaccard(openings(sents), openings(prevSents)) : null;
  const b = c.bounds;
  const share = sents.length ? staticN / sents.length : 0;
  const cv = mean ? sd / mean : 0;
  const tt = mattr(words);
  const measures = [
    { name: 'tells', value: count('tell'), bound: b['tells.max'], holds: count('tell') <= b['tells.max'] },
    { name: 'hedges', value: r2(per1000('hedge')), bound: b['hedges.max'], holds: small ? count('hedge') <= b['hedges.max'] : per1000('hedge') <= b['hedges.max'] },
    { name: 'fillers', value: r2(per1000('filler')), bound: b['fillers.max'], holds: small ? count('filler') <= b['fillers.max'] : per1000('filler') <= b['fillers.max'] },
    { name: 'closers', value: count('closer'), bound: b['closers.max'], holds: count('closer') <= b['closers.max'] },
    { name: 'static_share', value: r2(share), bound: b['static.max'], holds: small || share <= b['static.max'] },
    { name: 'rhythm_cv', value: r2(cv), bound: b['rhythm.min'], holds: small || cv >= b['rhythm.min'] },
    { name: 'lexical_mattr', value: r2(tt), bound: b['mattr.min'], holds: small || tt >= b['mattr.min'] },
    { name: 'rotation_overlap', value: rotation === null ? 'n/a' : r2(rotation), bound: b['rotation.max'], holds: rotation === null || small || rotation <= b['rotation.max'] },
  ];
  const alive = measures.every((m) => m.holds);
  return { alive, hits, measures, words: nWords, sentences: sents.length, small, classifier: 'reasoned' };
}

export function render(rep, file, prev = null) {
  const out = [];
  out.push('slop_report file=' + file + (prev ? ' prev=' + prev : ''));
  out.push('  slop_verdict alive=' + (rep.alive ? 'yes' : 'no') + ' words=' + rep.words + ' sentences=' + rep.sentences + (rep.small ? ' (under SLOP.min_words: ban list only, LAW.SLOP.6)' : ''));
  for (const h of rep.hits.filter((x) => x.kind !== 'static')) out.push('  slop_hit kind=' + h.kind + ' line=' + h.line + ' ' + JSON.stringify(h.phrase));
  const st = rep.hits.filter((x) => x.kind === 'static');
  for (const h of st.slice(0, 5)) out.push('  slop_hit kind=static ' + JSON.stringify(h.phrase));
  if (st.length > 5) out.push('  slop_hit kind=static ... ' + (st.length - 5) + ' more');
  for (const m of rep.measures) out.push('  slop_measure name=' + m.name + ' value=' + m.value + ' bound=' + m.bound + ' holds=' + (m.holds ? 'yes' : 'no'));
  out.push('  classifier static=' + rep.classifier + ' (copula present and no other verb the heuristics see)');
  return out.join(NL);
}

// one line for a finding, the shape the Adiutor records at Stop
export function summary(rep) {
  return rep.measures.filter((m) => !m.holds).map((m) => m.name + '=' + m.value + ' bound ' + m.bound).join(', ');
}

// ---------- the contract as a table ----------
export function table(c = contract()) {
  const meaning = {
    'tells.max': 'tells allowed in the whole answer',
    'closers.max': 'closers allowed in the whole answer',
    'hedges.max': 'hedges per thousand words',
    'fillers.max': 'fillers per thousand words',
    'static.max': 'share of sentences with no verb beyond a copula or an auxiliary',
    'rhythm.min': 'coefficient of variation of words per sentence',
    'mattr.min': 'moving-average type-token ratio, window 100',
    'rotation.max': 'Jaccard overlap of sentence-opening trigrams with the previous record',
    min_words: 'below this, the ban list alone is judged (LAW.SLOP.6)',
  };
  const out = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->', '',
    '# The AI_SLOP contract, rendered', '',
    'Generated by `node lib/ai-slop.mjs table` from `dtd/ai-slop.dtd`; the slop controls refuse a copy that drifts from the DTD. Every row names the entity a hit is reported against.', '',
    '## Bounds', '', '| Entity | Value | Meaning |', '|---|---|---|'];
  for (const [k, v] of Object.entries(c.bounds)) out.push('| SLOP.' + k + ' | ' + v + ' | ' + (meaning[k] || '') + ' |');
  for (const kind of ['tell', 'hedge', 'filler', 'closer']) {
    out.push('', '## ' + kind.charAt(0).toUpperCase() + kind.slice(1) + 's', '', '| Entity | Phrase |', '|---|---|');
    c.lists[kind].forEach((p, i) => out.push('| SLOP.' + kind + '.' + (i + 1) + ' | ' + p + ' |'));
  }
  out.push('', '## Measures', '', c.measureNames.map((m) => '`' + m + '`').join(', '), '', '## Laws', '');
  for (const l of c.laws) out.push('- ' + l + ': ' + c.lawText.get(l));
  return out.join(NL) + NL;
}

// ---------- controls ----------
const SLOPPY = "In today's fast-paced world, it is worth noting that this guide is a testament to the power of documentation. This section is very important. This part is really crucial. This file is quite robust. This tool is simply seamless. The landscape of tooling is somewhat complex. It could be argued that things are kind of fine. Furthermore, the system is basically holistic. Moreover, the code is essentially transformative. Additionally, the plan is arguably paramount. Let's dive in and delve into the tapestry of features. Overall, this is a game-changer. In conclusion, I hope this helps. Feel free to reach out.";

const CLEAN = 'The checkpoint landed at commit 1f0f4cb after the suite reported 93 checked and none failing. Two files carry the new numeral system. One spells every integer from one to nine thousand nine hundred ninety-nine in Greek cardinals, the other keeps the IUPAC multipliers as a second column so that a directory holding mono, di and treis still counts to three. Run the controls before trusting either table; twenty-three spellings are pinned there, and the round trip walks the whole range. The record scheme changes going forward only. Old names stay. A file inserted between two others takes the next free number, because renumbering a set renames every link into it. Read the artifact directory, not memory, when choosing the next ordinal. That rule is what keeps two sessions from writing the same name.';

export { SLOPPY as SLOPPY_FIXTURE, CLEAN as CLEAN_FIXTURE };

export function controls(io = console) {
  const fail = [];
  const c = contract();
  const declared = Object.values(c.lists).reduce((n, l) => n + l.length, 0);
  if (declared < 100) fail.push('ban list loaded ' + declared + ' phrases, expected at least 100');
  const computed = new Set(scan('x', { c }).measures.map((m) => m.name));
  for (const n of c.measureNames) if (!computed.has(n)) fail.push('measure ' + n + ' declared in ai-slop.dtd but not computed');
  for (const n of computed) if (!c.measureNames.includes(n)) fail.push('measure ' + n + ' computed but not declared in ai-slop.dtd');
  if (c.laws.length < 6) fail.push('LAW.SLOP.* count ' + c.laws.length + ', expected 6');
  const s = scan(SLOPPY, { c });
  const tells = s.hits.filter((h) => h.kind === 'tell').length;
  io.log('sloppy fixture: hits=' + s.hits.length + ' tells=' + tells + ' static_share=' + s.measures[4].value + ' alive=' + s.alive + '  (landed proof: tells must be > 0)');
  if (tells === 0) fail.push('sloppy fixture produced no tell hits: the ban list did not land');
  if (s.alive) fail.push('sloppy fixture judged alive');
  const k = scan(CLEAN, { c });
  io.log('clean fixture: hits=' + k.hits.filter((h) => h.kind !== 'static').length + ' static_share=' + k.measures[4].value + ' rhythm_cv=' + k.measures[5].value + ' mattr=' + k.measures[6].value + ' alive=' + k.alive);
  if (!k.alive) fail.push('clean fixture judged not alive: ' + summary(k));
  const rot = scan(CLEAN, { prev: CLEAN, c });
  const ro = rot.measures.find((m) => m.name === 'rotation_overlap');
  io.log('rotation self-overlap: ' + ro.value + ' bound=' + ro.bound + ' holds=' + ro.holds + '  (landed proof: must be 1 and must not hold)');
  if (ro.value !== 1 || ro.holds) fail.push('rotation control did not trip on an identical previous record');
  const fenced = scan('```' + NL + SLOPPY + NL + '```' + NL + '<quoted trust="cdata">' + SLOPPY + '</quoted>' + NL + 'The gate reads the voice and nothing else.', { c });
  if (fenced.hits.some((h) => h.kind !== 'static')) fail.push('LAW.SLOP.1 broken: a hit inside a fence or a quoted element was counted');
  if (existsSync(TABLE_PATH) && readFileSync(TABLE_PATH, 'utf8').split(CR).join('') !== table(c)) fail.push('references/contract.md drifted from dtd/ai-slop.dtd: run node lib/ai-slop.mjs table and write it to ' + TABLE_PATH);
  const ok = fail.length === 0;
  io.log('slop controls: ' + (ok ? 'ok' : 'FAIL') + ' (' + fail.length + ' failing), ban list ' + declared + ' phrases, measures ' + c.measureNames.length + ', laws ' + c.laws.length);
  for (const f of fail) io.log('  ' + f);
  return ok;
}

// ---------- CLI ----------
function walk(d, out) {
  if (!existsSync(d)) return;
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) { if (e !== 'node_modules' && e !== '.git') walk(p, out); }
    else if (extname(p) === '.md') out.push(p);
  }
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  if (argv[0] === 'controls') process.exit(controls() ? 0 : 1);
  else if (argv[0] === 'table') process.stdout.write(table());
  else if (argv[0] === 'sweep') {
    const files = [];
    for (const d of argv.slice(1)) walk(presolve(d), files);
    let bad = 0;
    for (const f of files) {
      const rep = scan(readFileSync(f, 'utf8'));
      if (!rep.alive) bad++;
      const failing = summary(rep);
      console.log((rep.alive ? '  alive ' : '  SLOP  ') + f + (failing ? '  [' + failing + ']' : ''));
    }
    console.log(NL + 'slop sweep: ' + files.length + ' files, ' + bad + ' slop');
    process.exit(bad ? 1 : 0);
  } else if (argv[0] && !argv[0].startsWith('--')) {
    const file = argv[0];
    const pi = argv.indexOf('--prev');
    const prevPath = pi > 0 ? argv[pi + 1] : null;
    const rep = scan(readFileSync(file, 'utf8'), { prev: prevPath ? readFileSync(prevPath, 'utf8') : null });
    if (argv.includes('--json')) console.log(JSON.stringify({ file, prev: prevPath, ...rep }, null, 2));
    else console.log(render(rep, file, prevPath));
    process.exit(rep.alive ? 0 : 1);
  } else {
    console.log('usage: ai-slop.mjs <file> [--prev <file>] [--json] | controls | table | sweep <dir>...');
    process.exit(2);
  }
}
