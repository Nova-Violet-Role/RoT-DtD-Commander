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
// headings the grammar_map declares, the presence of "Assumptions Made" on
// an autonomous run, and that every short id an answer references (E4, T1,
// A2) was defined somewhere in the answer. The truth of the content is not
// checkable here and the README says so.

import { splitDoctype, parseSubset, modelRefs } from './dtd.mjs';

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
  if (gm) {
    for (const line of gm[1].split('\n')) {
      const row = /^-\s+`([\w.:-]+)`:\s*(.*)$/.exec(line.trim());
      if (!row) continue;
      const el = row[1];
      const bolds = [...row[2].matchAll(/\*\*([^*]+)\*\*/g)].map((m) => stripMd(m[1]));
      for (const h of bolds) headings.push({ element: el, heading: h, required: required.has(el) });
    }
  }
  let hasRefs = false;
  for (const a of sub.attlists) if (/\bIDREFS?\b/.test(a.body)) hasRefs = true;
  const laws = [...sub.entities.keys()].filter((k) => k.startsWith('LAW.')).length;
  const autonomousAware = /--no-gate/.test(body);
  return { root: d.name, laws, headings, required: [...required], hasRefs, autonomousAware, children };
}

function findHeading(answer, heading) {
  const h = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(^|\\n)\\s*(?:\\*\\*' + h + '[^\\n]*\\*\\*|#{1,4}\\s*' + h + '\\b)', 'i');
  const m = re.exec(answer);
  return m ? m.index : -1;
}

export function checkAnswer(answer, expected, { autonomous = false } = {}) {
  const findings = [];
  if (!answer || !answer.trim()) {
    findings.push({ kind: 'no_answer', msg: 'no assistant text found in the transcript' });
    return { ok: false, findings };
  }
  let lastPos = -1;
  let orderBroken = null;
  for (const h of expected.headings) {
    const pos = findHeading(answer, h.heading);
    if (pos < 0) {
      if (h.required) findings.push({ kind: 'missing_heading', msg: `required heading "${h.heading}" (element ${h.element}) is absent` });
      continue;
    }
    if (pos < lastPos && !orderBroken) orderBroken = h.heading;
    lastPos = Math.max(lastPos, pos);
  }
  if (orderBroken) findings.push({ kind: 'order', msg: `heading "${orderBroken}" appears before a heading declared earlier` });
  if (autonomous && expected.autonomousAware && findHeading(answer, 'Assumptions Made') < 0) {
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
  const charm = `Re-run /${command} and render every declared heading in order; fix: ${lines.join('; ')}.`;
  const rite = `The Adiutor Stop check passes on the next run of /${command} (root ${expected.root}, ${expected.headings.filter((h) => h.required).length} required headings, ${expected.laws} laws).`;
  return { charm, rite };
}
