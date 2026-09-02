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

function findHeadingLine(lines, heading) {
  const re = headingLineRe(heading);
  for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) return i;
  return -1;
}

export function checkAnswer(answer, expected, { autonomous = false } = {}) {
  const findings = [];
  if (!answer || !answer.trim()) {
    findings.push({ kind: 'no_answer', msg: 'no assistant text found in the transcript' });
    return { ok: false, findings };
  }
  const lines = answer.split('\n');
  const blank = (i) => i < 0 || i >= lines.length || lines[i].trim() === '';
  let last = -1;
  let orderBroken = null;
  const crammed = [];
  for (const h of expected.headings) {
    const idx = findHeadingLine(lines, h.heading);
    if (idx < 0) {
      if (h.required) findings.push({ kind: 'missing_heading', msg: `required heading "${h.heading}" (element ${h.element}) is absent` });
      continue;
    }
    if (idx < last && !orderBroken) orderBroken = h.heading;
    last = Math.max(last, idx);
    const line = lines[idx].trim();
    const bare = /^#{1,6}\s/.test(line) || /\*\*\s*:?\s*$/.test(line);
    if (!blank(idx - 1) || (bare && !blank(idx + 1))) crammed.push(h.heading);
  }
  if (orderBroken) findings.push({ kind: 'order', msg: `heading "${orderBroken}" appears before a heading declared earlier` });
  if (crammed.length) findings.push({ kind: 'spacing', msg: `heading${crammed.length > 1 ? 's' : ''} without a blank line around ${crammed.length > 1 ? 'them' : 'it'}: ${crammed.map((c) => `"${c}"`).join(', ')}` });
  if (autonomous && expected.autonomousAware && findHeadingLine(lines, 'Assumptions Made') < 0) {
    findings.push({ kind: 'missing_assumptions', msg: 'autonomous run without an Assumptions Made section' });
  }
  if (expected.hasRefs) {
    const defined = new Set();
    for (const m of answer.matchAll(/(?:^|\n)\s*(?:-\s*|\*\*)?([A-Z]{1,2}\d{1,3})\b/g)) defined.add(m[1]);
    const refRe = /(?:from|stands on|decided by|freed by|depends on|requires|through|in|for|by|between|causes|leads to|supported by|ref)\s*:?\s*((?:[A-Z]{1,2}\d{1,3})(?:\s*[, ]\s*[A-Z]{1,2}\d{1,3})*)/g;
    const dangling = new Set();
    for (const m of answer.matchAll(refRe)) {
      for (const id of m[1].split(/[, ]+/)) if (id && !defined.has(id)) dangling.add(id);
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
