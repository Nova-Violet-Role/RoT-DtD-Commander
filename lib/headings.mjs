// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/headings.mjs
// The shape of a rendered answer's headings, declared once (LAW.CORE.6):
// every heading the grammar_map names is a markdown heading
// `### <sigil> Heading`, the sigil is the command's own (dtd/sigils.json),
// and a blank line stands before and after it.
//
//   sigilFor(name)            -> the sigil for a command or agent file name
//   isSigil(token)            -> true for a token with no letter or digit
//   stripSigil(heading)       -> the heading text without its leading sigil
//   applyHeadings(text, sigil)-> a source with its map and template in shape (idempotent)
//   checkHeadings(text)       -> C13 findings on a resolved or source file

import { readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let SIGILS = null;

export function sigils() {
  if (!SIGILS) {
    SIGILS = JSON.parse(readFileSync(join(ROOT, 'dtd', 'sigils.json'), 'utf8'));
    delete SIGILS._;
  }
  return SIGILS;
}

export function isSigil(token) {
  return !!token && !/[A-Za-z0-9_`*#]/.test(token);
}

export function stripSigil(heading) {
  const t = heading.trim();
  const sp = t.search(/\s/);
  if (sp > 0 && isSigil(t.slice(0, sp))) return t.slice(sp).trim();
  return t;
}

export function sigilFor(name) {
  const key = basename(name).replace(/\.md$/, '').replace(/-dtd$/, '');
  return sigils()[key] || null;
}

function sections(text) {
  const of = /<output_format>([\s\S]*?)<\/output_format>/.exec(text);
  if (!of) return null;
  const gm = /<grammar_map>([\s\S]*?)<\/grammar_map>/.exec(of[1]);
  if (!gm) return null;
  const mapStart = of.index + '<output_format>'.length + gm.index;
  const mapEnd = mapStart + gm[0].length;
  const tplStart = mapEnd;
  const tplEnd = of.index + of[0].length - '</output_format>'.length;
  return { mapStart, mapEnd, tplStart, tplEnd, map: gm[1], template: text.slice(tplStart, tplEnd) };
}

function mapHeadings(map) {
  const out = [];
  for (const line of map.split('\n')) {
    const row = /^-\s+`([\w.:-]+)`:\s*(.*)$/.exec(line.trim());
    if (!row) continue;
    for (const m of row[2].matchAll(/\*\*([^*]+)\*\*/g)) out.push(m[1].replace(/[:\s]+$/, '').trim());
  }
  return out;
}

const LAW_SENTENCE = (sigil) => `Every heading is a markdown heading \`### ${sigil} Heading\` carrying this command's sigil ${sigil}, with a blank line before and after it (LAW.CORE.6).`;

export function applyHeadings(text, sigil) {
  if (!sigil) throw new Error('applyHeadings: no sigil');
  const s = sections(text);
  if (!s) return text;
  // 1. the map: every bold heading carries the sigil; the intro invokes the law
  let map = s.map.replace(/\*\*([^*]+)\*\*/g, (_, h) => `**${sigil} ${stripSigil(h.replace(/[:\s]+$/, ''))}**`);
  if (!map.includes('LAW.CORE.6')) {
    map = map.replace(/(saying so\.)(\n)/, (_, a, b) => `${a} ${LAW_SENTENCE(sigil)}${b}`);
  }
  const names = new Set(mapHeadings(map).map((h) => stripSigil(h).toLowerCase()));
  // 2. the template: headings become `### <sigil> Heading` with blank lines around
  const lines = s.template.split('\n');
  const out = [];
  for (const raw of lines) {
    let line = raw;
    let m;
    if ((m = /^#{1,6}\s+(.+?)\s*$/.exec(line))) {
      // every heading line of the template carries the sigil, map heading or not
      const label = stripSigil(m[1]).replace(/:$/, '').trim();
      out.push('', `### ${sigil} ${label}`, '');
      continue;
    } else if ((m = /^\*\*([^*]+?)\*\*:?\s*(.*)$/.exec(line))) {
      const label = stripSigil(m[1]).replace(/:$/, '').trim();
      if (names.has(label.toLowerCase())) {
        out.push('', `### ${sigil} ${label}`, '');
        if (m[2].trim()) out.push(m[2].trim());
        continue;
      }
    } else if (/^\s+|^(?:[-*]|\d+\.)\s/.test(line)) {
      line = line.replace(/\*\*([^*]+?)\*\*/g, (whole, h) => {
        const label = stripSigil(h).replace(/:$/, '').trim();
        return names.has(label.toLowerCase()) ? `**${sigil} ${label}**` : whole;
      });
    }
    out.push(line);
  }
  // a heading the map declares only for the autonomous run ("or **Assumptions
  // Made** on an autonomous run") is rendered right after the Intake block
  for (const row of map.split('\n')) {
    if (!/autonomous|--no-gate/.test(row)) continue;
    const alt = /\*\*([^*]*Assumptions Made[^*]*)\*\*/.exec(row);
    if (!alt) continue;
    const label = stripSigil(alt[1]).trim();
    const already = out.some((l) => l === `### ${sigil} ${label}` || l.includes(`**${sigil} ${label}**`));
    if (already) continue;
    const at = out.findIndex((l) => /^### .* (Intake|Context Analysis|Questions Asked)$/.test(l));
    const block = ['', `### ${sigil} ${label}`, '', '(autonomous run only) one line per assumption made', ''];
    if (at < 0) out.push(...block);
    else {
      // after the Intake heading, its blank line and its first content line
      let j = at + 1;
      while (j < out.length && out[j].trim() === '') j++;
      if (j < out.length) j++;
      out.splice(j, 0, ...block);
    }
  }
  // collapse runs of blank lines; the template begins with a blank line after
  // </grammar_map> and ends with one newline
  let tpl = out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '\n\n').replace(/\n+$/, '\n');
  if (!tpl.startsWith('\n\n')) tpl = '\n\n' + tpl.replace(/^\n/, '');
  return text.slice(0, s.mapStart) + '<grammar_map>' + map + '</grammar_map>' + tpl + text.slice(s.tplEnd);
}

export function checkHeadings(text) {
  const findings = [];
  const s = sections(text);
  if (!s) return findings;
  const heads = mapHeadings(s.map);
  if (!heads.length) return findings;
  const sigilSet = new Set();
  for (const h of heads) {
    const tok = h.split(/\s+/)[0];
    if (!isSigil(tok)) findings.push(`grammar_map heading "${h}" carries no sigil`);
    else sigilSet.add(tok);
  }
  if (sigilSet.size > 1) findings.push(`grammar_map mixes sigils: ${[...sigilSet].join(' ')}`);
  if (!/LAW\.CORE\.6/.test(s.map)) findings.push('grammar_map does not invoke LAW.CORE.6');
  const tpl = s.template;
  const lines = tpl.split('\n');
  for (const h of heads) {
    const asHeading = new RegExp('(^|\\n)### ' + h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(\\n|$)');
    const asBold = tpl.includes(`**${h}**`);
    if (!asHeading.test(tpl) && !asBold) findings.push(`heading "${h}" is declared in grammar_map but the template never renders it`);
  }
  lines.forEach((line, i) => {
    if (!/^###\s/.test(line)) return;
    const before = i === 0 || lines[i - 1].trim() === '';
    const after = i === lines.length - 1 || lines[i + 1].trim() === '';
    if (!before || !after) findings.push(`template heading "${line.trim()}" is not surrounded by blank lines`);
    const tok = line.replace(/^###\s+/, '').split(/\s+/)[0];
    if (!isSigil(tok)) findings.push(`template heading "${line.trim()}" carries no sigil`);
  });
  return findings;
}
