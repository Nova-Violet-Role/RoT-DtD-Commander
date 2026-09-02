// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/render-check.mjs
// Derive what a -dtd command's answer must contain from its own resolved
// file, then check a rendered markdown answer against it.
//
//   expectedFromCommand(text)          -> { root, laws, headings[], required[], hasRefs, autonomousAware }
//   checkAnswer(answer, expected, opt) -> { ok, findings[] }
//   prescribe(findings, expected, cmd) -> { charm, rite }
//
// What is checkable in rendered markdown: the presence and order of the
// headings the grammar_map declares, the blank line before every heading
// and after every bare one (LAW.CORE.6), the presence of "Assumptions Made"
// on an autonomous run, and that every short id an answer references (E4,
// T1, A2) was defined somewhere in the answer. A heading is matched with or
// without its sigil, as `### Heading` or as `**Heading**`, so an older
// answer is judged by the same rules. The truth of the content is not
// checkable here and the README says so.

import { splitDoctype, parseSubset } from './dtd.mjs';
import { stripSigil } from './headings.mjs';

const OPTIONAL = /[?*]$/;

function stripMd(s) {
  return s.replace(/\*\*/g, '').replace(/[`:]+$/g, '').replace(/\s+$/, '').trim();
}

// Cardinality of each direct child of the root, in declared order.
function rootChildren(model) {
  const inner = model.trim().replace(/^\(/, '').replace(/\)$/, '');
  const out = [];
  for (const part of inner.split(',')) {
    const p = part.trim();
    if (!p) continue;
    const m = /^([\w.:-]+)([?*+]?)$/.exec(p.replace(/[()]/g, ''));
    if (m) out.push({ name: m[1], card: m[2] });
  }
  return out;
}

export function expectedFromCommand(text) {
  const d = splitDoctype(text);
  if (!d) return null;
  const sub = parseSubset(d.subset);
  const rootModel = sub.elements.get(d.name) || '';
  const children = rootChildren(rootModel);
  const required = new Set(children.filter((c) => !OPTIONAL.test(c.card)).map((c) => c.name));
  const body = text.slice(d.end);
  const gm = /<grammar_map>([\s\S]*?)<\/grammar_map>/.exec(body);
  const headings = [];
  let sigil = null;
  if (gm) {
    for (const line of gm[1].split('\n')) {
      const row = /^-\s+`([\w.:-]+)`:\s*(.*)$/.exec(line.trim());
      if (!row) continue;
      const el = row[1];
      const bolds = [...row[2].matchAll(/\*\*([^*]+)\*\*/g)].map((m) => stripMd(m[1]));
      for (const h of bolds) {
        const plain = stripSigil(h);
        if (!sigil && plain !== h) sigil = h.slice(0, h.length - plain.length).trim();
        headings.push({ element: el, heading: plain, required: required.has(el) });
      }
    }
  }
  let hasRefs = false;
  for (const a of sub.attlists) if (/\bIDREFS?\b/.test(a.body)) hasRefs = true;
  const laws = [...sub.entities.keys()].filter((k) => k.startsWith('LAW.')).length;
  const autonomousAware = /--no-gate/.test(body);
  return { root: d.name, laws, headings, required: [...required], hasRefs, autonomousAware, children, sigil };
}

// A heading line: `### [sigil] Heading` or `**[sigil] Heading[:]**`, with any
// indentation; the sigil is optional so older answers still match.
function headingLineRe(heading) {
  const h = stripSigil(heading).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('^\\s*(?:#{1,6}\\s*(?:[^\\w\\s#*]+\\s+)?' + h + '(?!\\w)|\\*\\*(?:[^\\w\\s*]+\\s+)?' + h + '[^\\n]*\\*\\*)', 'i');
}

function findHeadingLine(lines, heading, from = 0) {
  const re = headingLineRe(heading);
  for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i;
  return -1;
}

// The last line that renders this heading, or -1. The anchor of an answer.
function lastHeadingLine(lines, heading) {
  const re = headingLineRe(heading);
  for (let i = lines.length - 1; i >= 0; i--) if (re.test(lines[i])) return i;
  return -1;
}

export function checkAnswer(answer, expected, { autonomous = false } = {}) {
  const findings = [];
  if (!answer || !answer.trim()) {
    findings.push({ kind: 'no_answer', msg: 'no assistant text found in the transcript' });
    return { ok: false, findings };
  }
  const lines = answer.split('\n');
  // The answer of a turn is every assistant text block written since the
  // command, joined in order (control C10), so narration written before the
  // answer shares this string with it. The answer begins where its first
  // declared heading was rendered LAST: a plan, a preview or a half-written
  // section earlier in the turn is context, not the answer, and judging it
  // charged correct answers with order, spacing and dangling-ref findings
  // (control C18). The lines before the anchor stay in the array so the
  // blank line before the first heading is still read; only the search and
  // the reference scan start at it.
  const from = expected.headings.length ? Math.max(0, lastHeadingLine(lines, expected.headings[0].heading)) : 0;
  const blank = (i) => i < 0 || i >= lines.length || lines[i].trim() === '';
  let last = -1;
  let orderBroken = null;
  const crammed = [];
  for (const h of expected.headings) {
    const idx = findHeadingLine(lines, h.heading, from);
    if (idx < 0) {
      if (h.required) findings.push({ kind: 'missing_heading', msg: `required heading "${h.heading}" (element ${h.element}) is absent` });
      continue;
    }
    if (idx < last && !orderBroken) orderBroken = h.heading;
    last = Math.max(last, idx);
    const raw = lines[idx];
    const line = raw.trim();
    // a nested heading (indented, or a list item) is a label inside a block
    // and is not held to the blank-line rule; a top-level one is
    const nested = /^\s+\S/.test(raw) || /^(?:[-*]|\d+\.)\s/.test(raw);
    const bare = /^#{1,6}\s/.test(line) || /\*\*\s*:?\s*$/.test(line);
    if (!nested && (!blank(idx - 1) || (bare && !blank(idx + 1)))) crammed.push(h.heading);
  }
  // A file that declares no rendered heading (every skill, measured 20 of
  // 20) is still judged, never skipped: the shared laws hold for whatever
  // headings the answer chose. LAW.CORE.6 on each top-level markdown heading
  // (the command's sigil, a blank line before and after), LAW.CORE.5 on an
  // autonomous run (an Assumptions Made heading at any level, matched by
  // its words), and the references below. Nothing is declared, so nothing
  // can be missing or out of order.
  const undeclared = expected.headings.length === 0;
  const unsigiled = [];
  if (undeclared) {
    // A `# comment` inside a fenced code block is not a heading (measured:
    // a hook answer's shell script was charged with seven crammed headings).
    let fence = null;
    for (let i = from; i < lines.length; i++) {
      const raw = lines[i];
      const f = /^\s*(`{3,}|~{3,})/.exec(raw);
      if (f) {
        if (!fence) fence = f[1][0];
        else if (f[1][0] === fence) fence = null;
        continue;
      }
      if (fence) continue;
      const m = /^(#{1,6})\s+(.*\S)\s*$/.exec(raw);
      if (!m) continue;
      const text = m[2];
      if (!blank(i - 1) || !blank(i + 1)) crammed.push(text);
      if (expected.sigil && !text.startsWith(expected.sigil)) unsigiled.push(text);
    }
  }
  if (orderBroken) findings.push({ kind: 'order', msg: `heading "${orderBroken}" appears before a heading declared earlier` });
  if (crammed.length) findings.push({ kind: 'spacing', msg: `heading${crammed.length > 1 ? 's' : ''} without a blank line around ${crammed.length > 1 ? 'them' : 'it'}: ${crammed.map((c) => `"${c}"`).join(', ')}` });
  if (unsigiled.length) findings.push({ kind: 'sigil', msg: `heading${unsigiled.length > 1 ? 's' : ''} without the sigil ${expected.sigil}: ${unsigiled.map((c) => `"${c}"`).join(', ')}` });
  const assumptionsPresent = undeclared ? lines.some((l) => /^\s*#{1,6}\s+.*assumptions made/i.test(l) || /\*\*[^*\n]*assumptions made[^*\n]*\*\*/i.test(l)) : findHeadingLine(lines, 'Assumptions Made', from) >= 0;
  if (autonomous && expected.autonomousAware && !assumptionsPresent) {
    findings.push({ kind: 'missing_assumptions', msg: 'autonomous run without an Assumptions Made section' });
  }
  if (expected.hasRefs) {
    const scope = from > 0 ? lines.slice(from).join('\n') : answer;
    const defined = new Set();
    // an id is defined where a line, a list item or a heading begins with it,
    // with or without a sigil in front (`- **🔮 T3** ...`, `### 🔮 T3 ...`)
    for (const m of scope.matchAll(/(?:^|\n)\s*(?:#{1,6}\s*|-\s*|\d+\.\s*)?(?:\*\*)?(?:[^\w\s*#]+\s+)?([A-Z]{1,2}\d{1,3})\b/g)) defined.add(m[1]);
    const refRe = /(?:from|stands on|decided by|freed by|depends on|requires|through|in|for|by|between|causes|leads to|supported by|ref)\s*:?\s*((?:[A-Z]{1,2}\d{1,3})(?:\s*[, ]\s*[A-Z]{1,2}\d{1,3})*)\b(?![a-z])/g;
    // A reference is judged only inside the id families the answer itself
    // defines: an answer that defines T1..T5 and A1..A8 and then says
    // "verified by C3" names the repository's control C3, not a missing
    // answer id (measured on live runs: "by C3" and "by R11b" both closed
    // as fail with no id of that family in the answer). An id followed by
    // a letter, R11b, is a different token and is not R11.
    const families = new Set([...defined].map((id) => id.replace(/\d+$/, '')));
    const dangling = new Set();
    for (const m of scope.matchAll(refRe)) {
      for (const id of m[1].split(/[, ]+/)) if (id && !defined.has(id) && families.has(id.replace(/\d+$/, ''))) dangling.add(id);
    }
    if (dangling.size) findings.push({ kind: 'dangling_ref', msg: `ids referenced but never defined: ${[...dangling].join(', ')}` });
  }
  return { ok: findings.length === 0, findings };
}

export function prescribe(findings, expected, command) {
  const lines = findings.map((f) => f.msg);
  const sig = expected.sigil ? `${expected.sigil} ` : '';
  const charm = `Re-run /${command} and render every declared heading in order as \`### ${sig}Heading\` with a blank line before and after; fix: ${lines.join('; ')}.`;
  const rite = `The Adiutor Stop check passes on the next run of /${command} (root ${expected.root}, ${expected.headings.filter((h) => h.required).length} required headings, ${expected.laws} laws).`;
  return { charm, rite };
}
