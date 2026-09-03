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
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve as presolve, extname, basename } from 'node:path';
import { parseSubset } from './dtd.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = presolve(HERE, '..');
const DTD_PATH = join(ROOT, 'dtd', 'ai-slop.dtd');
const TABLE_PATH = join(ROOT, 'src', 'skills', 'ai-slop-dtd', 'references', 'contract.md');
const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);

// ---------- the lexicon, read once (LAW.LEX.1, LAW.LEX.2) ----------
const LEX_PATH = join(dirname(DTD_PATH), 'cc-lexicon.dtd');
export function lexicon(path = LEX_PATH) {
  const sub = parseSubset(readFileSync(path, 'utf8'));
  const verbs = [];
  const paraphrases = [];
  for (const [k, v] of sub.entities) {
    if (/^LEX\.verb\.\d+$/.test(k)) verbs.push(v);
    else if (/^LEX\.paraphrase\.\d+$/.test(k)) {
      const i = v.indexOf('|');
      paraphrases.push({ from: v.slice(0, i), to: v.slice(i + 1) });
    }
  }
  const bibl = [];
  for (const [k, v] of sub.entities) {
    if (!/^LEX\.bibl\.\d+$/.test(k)) continue;
    const [id, title, locator] = v.split('|');
    bibl.push({ id, title, locator });
  }
  return { verbs, paraphrases, bibl, path };
}

// ---------- the voice profile of a book-derived command (LAW.LEX.5) ----------
// A Phantom-book command fixes its text_desc in its own DOCTYPE, before the
// lexicon include, as #FIXED attribute defaults (the first declaration
// binds), and names the book it draws on as VOICE.source. The gate reads
// both from the file's internal subset.
export function profile(text) {
  const doc = /<!DOCTYPE\s+[^\[]*\[([\s\S]*?)\]\s*>/.exec(text);
  if (!doc) return null;
  const sub = doc[1];
  const att = /<!ATTLIST\s+text_desc\b([\s\S]*?)>/.exec(sub);
  if (!att) return null;
  const out = {};
  for (const m of att[1].matchAll(/(\w+)\s+(?:\([^)]*\)|CDATA)\s+#FIXED\s+"([^"]*)"/g)) out[m[1]] = m[2];
  const src = /<!ENTITY\s+VOICE\.source\s+"([^"]*)"/.exec(sub);
  out.source = src ? src[1] : null;
  return out;
}

// The faults LAW.LEX.5 names: a paraphrase or a translation must name a
// library entry as its source; any source named must be a library entry.
export function voiceFaults(prof, lex = lexicon()) {
  if (!prof) return ['no text_desc profile fixed in the DOCTYPE (LAW.LEX.5)'];
  const f = [];
  const ids = new Set(lex.bibl.map((b) => b.id));
  if ((prof.derivation === 'paraphrase' || prof.derivation === 'translation') && !prof.source) f.push('derivation ' + prof.derivation + ' names no source in a bibl (LAW.LEX.5)');
  if (prof.source && !ids.has(prof.source)) f.push('source ' + prof.source + ' is not a library entry (LEX.bibl.*)');
  for (const k of ['derivation', 'domain', 'factuality', 'preparedness', 'purpose']) if (!prof[k]) f.push('profile fixes no ' + k);
  return f;
}

// The book-derived commands, read from the shelf of the phantom-library skill:
// the Command column of every row whose note is not the shelf itself.
const SHELF_PATH = join(ROOT, 'src', 'skills', 'phantom-library-dtd', 'references', 'books.md');
export function phantomCommands(path = SHELF_PATH) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, 'utf8').split(NL)) {
    if (!line.startsWith('| ') || /^\| Book \|/.test(line) || /^\|---/.test(line)) continue;
    const cells = line.split('|').map((s) => s.trim());
    const cmd = cells[4] || '';
    const note = cells[5] || '';
    if (note === 'this file') continue;
    for (const c of cmd.split(',').map((s) => s.trim()).filter(Boolean)) if (!out.includes(c)) out.push(c);
  }
  return out;
}

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
  const lex = lexicon();
  return { lists, bounds, measureNames, laws, lawText, path, verbs: lex.verbs, paraphrases: lex.paraphrases };
}

// ---------- the verb heuristics ----------
const COPULA = /\b(is|are|was|were|be|been|being|am|has|have|had|seems?|remains?|becomes?|appears?|exists?|stays?|feels?)\b/i;
// The verb list lives in dtd/cc-lexicon.dtd (LAW.LEX.1); it is read once here.
const VERBS = new Set(lexicon().verbs);
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
  voice.split(NL).forEach((raw, i) => {
    const line = raw.replace(/^\s*([-*+]|\d+[.)])\s+/, '').trim();
    if (!line) return;
    for (const s of line.split(/(?<=[.!?])\s+(?=[A-Z"'(\[])/)) {
      const w = s.replace(/[^\w'-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
      if (w.length) out.push({ text: s.trim(), words: w, line: i + 1 });
    }
  });
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
// Four decimals, used for BOTH the printed value and the holds test (LAW.SLOP.5: numbers that contradict the verdict are worse than none).
const r2 = (x) => Math.round(x * 10000) / 10000;

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
  // LAW.LEX.2: a hit that matches a declared paraphrase carries its replacement.
  for (const h of hits) {
    const p = (c.paraphrases || []).find((x) => x.from.toLowerCase() === h.phrase.toLowerCase());
    if (p) h.say = p.to;
  }
  const count = (k) => hits.filter((h) => h.kind === k).length;
  const per1000 = (k) => (nWords ? (count(k) * 1000) / nWords : 0);
  const staticN = sents.filter(isStatic).length;
  for (const s of sents) if (isStatic(s)) hits.push({ kind: 'static', line: s.line, phrase: s.text.slice(0, 80), at: 0 });
  const lens = sents.map((s) => s.words.length);
  const mean = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length) : 0;
  const small = nWords < c.bounds.min_words;
  const prevSents = prev ? sentences(ownVoice(prev)) : null;
  const rotation = prevSents ? jaccard(openings(sents), openings(prevSents)) : null;
  const b = c.bounds;
  const share = r2(sents.length ? staticN / sents.length : 0);
  const cv = r2(mean ? sd / mean : 0);
  const tt = r2(mattr(words));
  const hedgeD = r2(per1000('hedge'));
  const fillerD = r2(per1000('filler'));
  const rot = rotation === null ? null : r2(rotation);
  const measures = [
    { name: 'tells', value: count('tell'), bound: b['tells.max'], holds: count('tell') <= b['tells.max'] },
    { name: 'hedges', value: hedgeD, bound: b['hedges.max'], holds: small ? count('hedge') <= b['hedges.max'] : hedgeD <= b['hedges.max'] },
    { name: 'fillers', value: fillerD, bound: b['fillers.max'], holds: small ? count('filler') <= b['fillers.max'] : fillerD <= b['fillers.max'] },
    { name: 'closers', value: count('closer'), bound: b['closers.max'], holds: count('closer') <= b['closers.max'] },
    { name: 'static_share', value: share, bound: b['static.max'], holds: small || share <= b['static.max'] },
    { name: 'rhythm_cv', value: cv, bound: b['rhythm.min'], holds: small || cv >= b['rhythm.min'] },
    { name: 'lexical_mattr', value: tt, bound: b['mattr.min'], holds: small || tt >= b['mattr.min'] },
    { name: 'rotation_overlap', value: rot === null ? 'n/a' : rot, bound: b['rotation.max'], holds: rot === null || small || rot <= b['rotation.max'] },
  ];
  const alive = measures.every((m) => m.holds);
  return { alive, hits, measures, words: nWords, sentences: sents.length, small, classifier: 'reasoned' };
}

export function render(rep, file, prev = null) {
  const out = [];
  out.push('slop_report file=' + file + (prev ? ' prev=' + prev : ''));
  out.push('  slop_verdict alive=' + (rep.alive ? 'yes' : 'no') + ' words=' + rep.words + ' sentences=' + rep.sentences + (rep.small ? ' (under SLOP.min_words: ban list only, LAW.SLOP.6)' : ''));
  for (const h of rep.hits.filter((x) => x.kind !== 'static')) out.push('  slop_hit kind=' + h.kind + ' line=' + h.line + ' ' + JSON.stringify(h.phrase) + (h.say === undefined ? '' : h.say === '' ? ' say: cut it' : ' say: ' + JSON.stringify(h.say)));
  const st = rep.hits.filter((x) => x.kind === 'static');
  for (const h of st.slice(0, 5)) out.push('  slop_hit kind=static line=' + h.line + ' ' + JSON.stringify(h.phrase));
  if (st.length > 5) out.push('  slop_hit kind=static ... ' + (st.length - 5) + ' more');
  for (const m of rep.measures) out.push('  slop_measure name=' + m.name + ' value=' + m.value + ' bound=' + m.bound + ' holds=' + (m.holds ? 'yes' : 'no'));
  out.push('  classifier static=' + rep.classifier + ' (copula present and no other verb the heuristics see)');
  return out.join(NL);
}

// one line for a finding, the shape the Adiutor records at Stop
export function summary(rep) {
  return rep.measures.filter((m) => !m.holds).map((m) => m.name + '=' + m.value + ' bound ' + m.bound).join(', ');
}

// ---------- 5.1.0: the four spots (LAW.SLOP.7, LAW.SLOP.8) ----------
// The tables come from the contract: which extensions are prose, which
// comment syntax a code file carries. A file of neither kind has nothing
// to judge and passes.
export function spots(path = DTD_PATH) {
  const sub = parseSubset(readFileSync(path, 'utf8'));
  const get = (k) => (sub.entities.get(k) || '').split('|').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return { prose: get('SLOP.prose.ext'), slash: get('SLOP.comment.slash'), hash: get('SLOP.comment.hash'), dash: get('SLOP.comment.dash'), angle: get('SLOP.comment.angle') };
}

export function extOf(file) {
  const base = String(file || '').replace(/\\/g, '/').split('/').pop() || '';
  if (/^dockerfile$/i.test(base)) return 'dockerfile';
  const m = base.match(/\.([A-Za-z0-9]+)$/);
  return m ? m[1].toLowerCase() : '';
}

// The comments of a code file as prose, one line per comment line; strings,
// identifiers and URLs stay out (a line comment must follow whitespace or
// open the line, so https:// is never one). Block comments by their pairs,
// docstrings for py. null when the extension carries no comment syntax.
export function liftComments(text, ext, t = spots()) {
  const src = String(text || '');
  const out = [];
  const push = (s) => { const v = s.replace(/^[\s*#/<!-]+|[\s*/>-]+$/g, '').trim(); if (v) out.push(v); };
  const e = String(ext || '').toLowerCase();
  if (t.slash.includes(e)) {
    for (const m of src.matchAll(/\/\*[\s\S]*?\*\//g)) for (const l of m[0].split('\n')) push(l);
    for (const l of src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')) { const m = l.match(/(?:^|\s)\/\/(.*)$/); if (m) push(m[1]); }
  } else if (t.hash.includes(e)) {
    for (const l of src.split('\n')) { const m = l.match(/(?:^|\s)#(?!!)(.*)$/); if (m) push(m[1]); }
    if (e === 'py') for (const m of src.matchAll(/("""|''')([\s\S]*?)\1/g)) for (const l of m[2].split('\n')) push(l);
  } else if (t.dash.includes(e)) {
    for (const l of src.split('\n')) { const m = l.match(/(?:^|\s)--(.*)$/); if (m) push(m[1]); }
  } else if (t.angle.includes(e)) {
    for (const m of src.matchAll(/<!--([\s\S]*?)-->/g)) for (const l of m[1].split('\n')) push(l);
  } else return null;
  return out.join('\n');
}

// One spot judged: a prose file whole, a code file by its comments, an
// answer or a message as it is. null when there is nothing to judge.
export function judgeSpot(kind, text, { file = null, prev = null, c = contract(), t = spots() } = {}) {
  let body = String(text || '');
  let how = 'whole';
  if (kind === 'write') {
    const e = extOf(file);
    if (t.prose.includes(e)) how = 'prose';
    else {
      const lifted = liftComments(body, e, t);
      if (lifted === null) return null;
      body = lifted;
      how = 'comments';
    }
  }
  if (!body.trim()) return null;
  const rep = scan(body, { prev, c });
  return { kind, file, how, rep, alive: rep.alive };
}

// The reason a refusal carries back: the measures that failed and the
// phrases inside a quoted element, so they are data to the rewrite and
// never an instruction (LAW.SLOP.8, LAW.CORE.1); no CDATA section, so a
// stray ]]> cannot close it.
function xmlEscape(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
export function refusal(j) {
  const failed = j.rep.measures.filter((m) => !m.holds).map((m) => `${m.name} ${m.value} (bound ${m.bound})`);
  const phrases = [...new Set(j.rep.hits.filter((h) => h.kind !== 'static').map((h) => h.phrase))].slice(0, 12);
  const where = j.kind === 'write' ? `${j.how === 'comments' ? 'the comments of ' : ''}${j.file}` : j.kind === 'stop' ? 'the answer' : j.kind === 'commit' ? 'the commit message' : 'the body';
  const quoted = phrases.length ? ` The phrases: <quoted trust="cdata" source="tool-result">${xmlEscape(phrases.join(' | '))}</quoted>.` : '';
  return `AI_SLOP gate (strict, LAW.SLOP.8): ${where} fails ${failed.join(', ')}.${quoted} Rewrite it in your own voice; a phrase that must stay goes in backticks or a quoted element (LAW.SLOP.1). ${summary(j.rep)}`;
}

// A command line split the way a shell splits its words (LAW.ARGS.1): a
// quoted word keeps its spaces, a backslash inside double quotes escapes
// only a quote, a dollar, a backtick or a backslash, and nothing is run.
export function splitWords(s) {
  const out = [];
  let cur = '';
  let q = null;
  let has = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === q) q = null;
      else if (ch === '\\' && q === '"' && i + 1 < s.length && /["$`\\]/.test(s[i + 1])) cur += s[++i];
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { q = ch; has = true; continue; }
    if (/\s/.test(ch)) { if (cur || has) { out.push(cur); cur = ''; has = false; } continue; }
    if (ch === '\\' && i + 1 < s.length && s[i + 1] !== '\n') { cur += s[++i]; continue; }
    cur += ch;
  }
  if (cur || has) out.push(cur);
  return out;
}

// The text a Bash command carries to a commit or a request body: git commit
// -m, --message=, -F, --file= and a heredoc body; gh pr, issue or release
// with --body, --body-file, --notes, --notes-file; curl --data @file or an
// inline payload to a pulls, issues or releases path, the payload's title,
// name and body. A -F or --body-file path is read from disk as it stands.
export function bashText(command, readFile = (p) => readFileSync(p, 'utf8')) {
  const cmd = String(command || '');
  const words = splitWords(cmd);
  const at = (i) => (i >= 0 && i < words.length ? words[i] : '');
  const end = (w) => /^(&&|\|\||;|\|)$/.test(w);
  const heredoc = () => { const m = cmd.match(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n([\s\S]*?)\n\s*\2\s*$/m); return m ? m[3] : null; };
  const readOr = (p) => { try { return readFile(p); } catch { return null; } };
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === 'git' && words[i + 1] === 'commit') {
      const parts = [];
      for (let k = i + 2; k < words.length && !end(words[k]); k++) {
        const w = words[k];
        if (w === '-m' || w === '--message') parts.push(at(++k));
        else if (w.startsWith('--message=')) parts.push(w.slice(10));
        else if (w === '-F' || w === '--file') { const p = at(++k); parts.push(p === '-' ? heredoc() || '' : readOr(p) || ''); }
        else if (w.startsWith('--file=')) parts.push(readOr(w.slice(7)) || '');
      }
      return parts.some((p) => p && p.trim()) ? { kind: 'commit', text: parts.join('\n\n'), source: 'git commit' } : null;
    }
    if (words[i] === 'gh' && /^(pr|issue|release)$/.test(words[i + 1])) {
      const parts = [];
      for (let k = i + 2; k < words.length && !end(words[k]); k++) {
        const w = words[k];
        if (/^(--body|--notes|-b|-n)$/.test(w)) parts.push(at(++k));
        else if (/^--(body|notes)=/.test(w)) parts.push(w.replace(/^--(body|notes)=/, ''));
        else if (/^(--body-file|--notes-file|-F)$/.test(w)) { const p = at(++k); parts.push(p === '-' ? heredoc() || '' : readOr(p) || ''); }
        else if (/^--(body-file|notes-file)=/.test(w)) parts.push(readOr(w.replace(/^--(body-file|notes-file)=/, '')) || '');
      }
      return parts.some((p) => p && p.trim()) ? { kind: 'pr', text: parts.join('\n\n'), source: `gh ${words[i + 1]}` } : null;
    }
    if (words[i] === 'curl') {
      let url = '';
      let data = null;
      for (let k = i + 1; k < words.length && !end(words[k]); k++) {
        const w = words[k];
        if (/^https?:\/\//.test(w)) url = w;
        else if (/^(--data|-d|--data-raw|--data-binary|--json)$/.test(w)) data = at(++k);
        else if (/^--data=/.test(w)) data = w.slice(7);
      }
      if (!url || !/\/(pulls|issues|releases)(\/|$)/.test(url) || data === null) continue;
      const raw = data.startsWith('@') ? readOr(data.slice(1)) : data;
      if (!raw) return null;
      let text = raw;
      try { const j = JSON.parse(raw); text = [j.title, j.name, j.body].filter((x) => typeof x === 'string').join('\n\n'); } catch { /* not json: judged as it stands */ }
      return text.trim() ? { kind: 'pr', text, source: 'curl ' + url.replace(/^https?:\/\/[^/]+/, '') } : null;
    }
  }
  return null;
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
    'Generated by `node lib/ai-slop.mjs table` from `dtd/ai-slop.dtd`. The slop controls refuse a copy that drifts from the DTD, and this file passes the gate it describes. Every row names the entity a hit is reported against. Change a bound in the DTD, regenerate, run the controls.', '',
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
  if (c.laws.length !== 8) fail.push('LAW.SLOP.* count ' + c.laws.length + ', expected exactly 8; teach the code before adding a law');
  // LAW.SLOP.7 and LAW.SLOP.8 are code: the spot tables, the lifted comments,
  // the command parser and the refusal, each tripped here before the Adiutor
  // trusts them (its controls C21 to C26 trip the hook itself).
  const t = spots();
  if (!(t.prose.includes('md') && t.slash.includes('mjs') && t.hash.includes('py') && t.dash.includes('lua') && t.angle.includes('html'))) fail.push('the spot tables of ai-slop.dtd do not carry md, mjs, py, lua and html');
  const lifted = liftComments('const url = "https://x.y/z"; // a comment here\n/* block\n two */\nconst s = "not // a comment";\n', 'mjs');
  if (!(/a comment here/.test(lifted) && /block/.test(lifted) && /two/.test(lifted) && !/https/.test(lifted))) fail.push('liftComments: the line comment and the block comment are lifted, the URL and the string are not: ' + JSON.stringify(lifted));
  if (liftComments('x', 'png') !== null) fail.push('liftComments: an extension without a comment syntax must return null');
  const commit = bashText('cd "/tmp/a b" && git commit -q -m "first line" -m "second paragraph"');
  if (!(commit && commit.kind === 'commit' && /first line\n\nsecond paragraph/.test(commit.text))) fail.push('bashText: git commit -m twice is one message of two paragraphs: ' + JSON.stringify(commit));
  const here = bashText('git commit -F - <<\'EOF\'\nthe body\nof it\nEOF');
  if (!(here && /the body\nof it/.test(here.text))) fail.push('bashText: a heredoc body given by -F - is read: ' + JSON.stringify(here));
  const pr = bashText('gh pr create --title "t" --body "the pr body"');
  if (!(pr && pr.kind === 'pr' && pr.text === 'the pr body')) fail.push('bashText: gh pr create --body is the body: ' + JSON.stringify(pr));
  const curl = bashText('curl -s -X POST https://api.github.com/repos/o/r/pulls --data \'{"title":"t","body":"the curl body"}\'');
  if (!(curl && curl.kind === 'pr' && /the curl body/.test(curl.text))) fail.push('bashText: a curl payload to a pulls path is read: ' + JSON.stringify(curl));
  if (bashText('ls -la') !== null || bashText('curl https://example.com/other --data x') !== null) fail.push('bashText: a command that carries no commit or body returns null');
  const jFail = judgeSpot('write', SLOPPY, { file: 'notes.md' });
  const jPass = judgeSpot('write', 'export const a = 1;\n', { file: 'a.mjs' });
  if (!(jFail && !jFail.alive && jFail.how === 'prose')) fail.push('judgeSpot: the sloppy fixture as a prose file fails');
  if (jPass !== null) fail.push('judgeSpot: code without comments has nothing to judge');
  const reason = jFail ? refusal(jFail) : '';
  if (!(/<quoted trust="cdata" source="tool-result">/.test(reason) && !/CDATA|\]\]>/.test(reason) && /LAW\.SLOP\.8/.test(reason))) fail.push('refusal: the phrases are quoted, no CDATA section, the law named: ' + reason.slice(0, 120));
  // LAW.LEX.1: the verbs the classifier uses are the verbs the lexicon declares, both directions.
  const lex = lexicon();
  if (lex.verbs.length < 100) fail.push('lexicon declares ' + lex.verbs.length + ' verbs, expected at least 100');
  if (VERBS.size !== new Set(lex.verbs).size || lex.verbs.some((v) => !VERBS.has(v))) fail.push('the verb set the classifier holds differs from LEX.verb.* in cc-lexicon.dtd');
  io.log('lexicon: verbs=' + lex.verbs.length + ' paraphrases=' + lex.paraphrases.length + ' (LAW.LEX.1, LAW.LEX.2)');
  // LAW.LEX.2: a hit that matches a paraphrase carries its replacement in the report.
  const say = scan('We must delve into the tapestry of features in order to ship it. The gate reads that sentence as a series of hits and one of them carries a replacement.', { c });
  const hit = say.hits.find((h) => h.phrase === 'in order to');
  const sayHit = say.hits.find((h) => h.say !== undefined);
  if (hit ? hit.say !== 'to' : !sayHit) fail.push('a hit matching LEX.paraphrase.* did not carry its replacement');
  // LAW.LEX.4: every library locator inside the workspace exists.
  const lexSub = parseSubset(readFileSync(lex.path, 'utf8'));
  let bibl = 0, checked = 0, missing = [];
  for (const [k, v] of lexSub.entities) {
    if (!/^LEX\.bibl\.\d+$/.test(k)) continue;
    bibl++;
    const loc = v.split('|')[2];
    const abs = join(dirname(DTD_PATH), '..', '..', loc);
    if (existsSync(join(dirname(DTD_PATH), '..', '..', 'cc-resources'))) { checked++; if (!existsSync(abs)) missing.push(loc); }
  }
  io.log('library: ' + bibl + ' entries, ' + checked + ' locators checked' + (checked ? '' : ' (workspace folder absent, not checked)') + (missing.length ? ', missing: ' + missing.join(', ') : ''));
  if (missing.length) fail.push('library locators missing: ' + missing.join(', '));
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
  // In a repo checkout (src/ present) the rendered table must exist and match; in an installed tree there is no src/ and the check says so instead of passing on nothing.
  // H1 boundary control: the value printed and the value judged are one number.
  for (const m of scan(CLEAN, { c }).measures) {
    if (typeof m.value === 'number' && m.value !== r2(m.value)) fail.push('measure ' + m.name + ' printed ' + m.value + ' is not the rounded number holds read');
  }
  const edge = { ...c, bounds: { ...c.bounds, 'rhythm.min': scan(CLEAN, { c }).measures[5].value } };
  const edgeRep = scan(CLEAN, { c: edge });
  const edgeM = edgeRep.measures[5];
  io.log('boundary: rhythm_cv=' + edgeM.value + ' bound=' + edgeM.bound + ' holds=' + edgeM.holds + '  (landed proof: equal numbers must hold)');
  if (!edgeM.holds || edgeM.value !== edgeM.bound) fail.push('a measure equal to its bound must hold and print the same number');
  if (existsSync(join(ROOT, 'src'))) {
    if (!existsSync(TABLE_PATH)) fail.push('references/contract.md is missing: run node lib/ai-slop.mjs table and write it to ' + TABLE_PATH);
    else if (readFileSync(TABLE_PATH, 'utf8').split(CR).join('') !== table(c)) fail.push('references/contract.md drifted from dtd/ai-slop.dtd: run node lib/ai-slop.mjs table and write it to ' + TABLE_PATH);
  } else io.log('table drift: no src/ in this tree (installed copy), not applicable');
  // LAW.LEX.5: the profile is read from a DOCTYPE, and its faults fire on purpose
  const fixture = (deriv, source) => '<!DOCTYPE x [' + NL + '  <!ATTLIST text_desc' + NL + '          derivation   (' + deriv + ') #FIXED "' + deriv + '"' + NL + '          domain       CDATA #FIXED "a domain"' + NL + '          factuality   (fact) #FIXED "fact"' + NL + '          preparedness (prepared) #FIXED "prepared"' + NL + '          purpose      CDATA #FIXED "a purpose"' + NL + '          degree       CDATA #FIXED "a degree">' + NL + (source ? '  <!ENTITY VOICE.source "' + source + '">' + NL : '') + ']>' + NL;
  const p1 = profile(fixture('paraphrase', lex.bibl[0] && lex.bibl[0].id));
  if (!p1 || p1.derivation !== 'paraphrase' || p1.domain !== 'a domain' || !p1.source) fail.push('profile() did not read the fixed attributes and the source from a DOCTYPE');
  else if (voiceFaults(p1, lex).length) fail.push('a paraphrase naming a library entry was faulted: ' + voiceFaults(p1, lex).join('; '));
  const p2 = voiceFaults(profile(fixture('paraphrase', null)), lex);
  io.log('voice: paraphrase without a source -> ' + (p2[0] || 'nothing') + '  (landed proof: LAW.LEX.5 must fire)');
  if (!p2.some((x) => x.includes('names no source'))) fail.push('a paraphrase without a source was not faulted (LAW.LEX.5)');
  const p3 = voiceFaults(profile(fixture('original', 'book999')), lex);
  if (!p3.some((x) => x.includes('not a library entry'))) fail.push('a source outside the library was not faulted');
  if (voiceFaults(null, lex).length !== 1) fail.push('a file with no profile must carry exactly one fault');
  if (profile('no doctype here') !== null) fail.push('profile() must be null without a DOCTYPE');
  // the sweep floor: a directory that does not exist yields exit 1, never a green of nothing
  const empty = spawnSync(process.execPath, [fileURLToPath(import.meta.url), 'sweep', join(ROOT, 'no-such-directory-' + process.pid)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
  io.log('sweep floor: a sweep of a missing directory exits ' + empty.status + '  (landed proof: must be 1)');
  if (empty.status !== 1 || !/a sweep of nothing is refused/.test(empty.stdout || '')) fail.push('a sweep that measured no file exited ' + empty.status + ' instead of 1');
  const shelf = phantomCommands();
  io.log('shelf: ' + shelf.length + ' book-derived commands' + (shelf.length ? ' (' + shelf[0] + ' ... ' + shelf[shelf.length - 1] + ')' : ''));
  if (existsSync(join(ROOT, 'src'))) {
    if (shelf.length < 19) fail.push('the shelf names ' + shelf.length + ' book-derived commands, fewer than the nineteen the skill declares');
    for (const s of shelf) if (!existsSync(join(ROOT, 'src', 'commands', s + '.md'))) fail.push('the shelf names ' + s + ' but src/commands has no such file');
  }
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
    const mi = argv.indexOf('--max');
    const max = mi > 0 ? Number(argv[mi + 1]) : 0;
    const dirs = argv.slice(1).filter((a, i, arr) => a !== '--max' && arr[i - 1] !== '--max');
    const files = [];
    for (const d of dirs) walk(presolve(d), files);
    // a sweep that measured nothing is not a pass (a guard, tripped by its control): a renamed directory must go red, not green
    if (!files.length) {
      console.log('slop sweep: no file measured under ' + (dirs.join(', ') || 'no directory') + '; a sweep of nothing is refused');
      process.exit(1);
    }
    let bad = 0;
    let voiceBad = 0;
    let voiced = 0;
    const phantom = new Set(phantomCommands());
    const lex = lexicon();
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      const rep = scan(text);
      if (!rep.alive) bad++;
      const failing = summary(rep);
      console.log((rep.alive ? '  alive ' : '  SLOP  ') + f + (failing ? '  [' + failing + ']' : ''));
      // LAW.LEX.5: a book-derived command carries its voice profile, and the gate reads it
      const name = basename(f).replace(/\.md$/, '');
      const prof = profile(text);
      if (phantom.has(name) || prof) {
        const faults = voiceFaults(prof, lex);
        if (faults.length) voiceBad++; else voiced++;
        console.log((faults.length ? '  VOICE  ' : '  voice  ') + f + (prof ? '  derivation=' + prof.derivation + ' source=' + (prof.source || 'none') : '') + (faults.length ? '  [' + faults.join('; ') + ']' : ''));
      }
    }
    console.log(NL + 'slop sweep: ' + files.length + ' files, ' + bad + ' slop' + (max ? ', baseline ' + max + ' (may only shrink)' : '') + '; voice profiles ' + voiced + ' sound, ' + voiceBad + ' faulty, ' + phantom.size + ' book-derived commands on the shelf');
    process.exit(bad > max || voiceBad > 0 ? 1 : 0);
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
