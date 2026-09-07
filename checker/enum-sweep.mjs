// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// enum-sweep.mjs : every enumeration a template spells is the enumeration
// its grammar declares.
//
// A command's output template spells a choice as a bracketed list,
// `form [unit|teen|ten|compound|plain]`, and its DOCTYPE declares the same
// choice as an ATTLIST enumeration, `form (unit|teen|ten|compound|scale|plain)`.
// Rule C15 of lib/dtd.mjs walks elements against the grammar_map and nothing
// walked an enumeration against the template: the fifth companion pass on
// 9.0.0 measured the carve-out of LAW.TYPO.7 reaching the subset, the engine
// and the control and not the command that renders it, and the fifth gate
// choice reaching cc-ask and three commands while seventy-six templates
// still spelled four.
//
// The rule. For every source file (commands, skills, agents), the DOCTYPE is
// resolved with its includes, every ATTLIST enumeration is read from it, and
// every bracketed list of two or more bar-separated names in the body is
// read as a spelled choice. A spelled list that shares at least
// SHARED values with a declared enumeration is held to it: values the
// enumeration declares and the list omits are a finding, and values the
// list spells that the enumeration does not declare are a finding. The
// threshold keeps [yes|no] from being held to every yes|no enumeration in
// the tree; a list of three names that agrees with an enumeration on three
// is that enumeration.
//
// Usage: node checker/enum-sweep.mjs --check     (the gate step)
//        node checker/enum-sweep.mjs --controls  (tripped on a planted omission)
//        node checker/enum-sweep.mjs             (report only)

import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { splitDoctype, resolveFile } from '../lib/dtd.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
export const SHARED = 3;

export function sources(root = ROOT) {
  const out = [];
  const cmd = join(root, 'src', 'commands');
  if (existsSync(cmd)) for (const f of readdirSync(cmd)) if (f.endsWith('.md')) out.push(join(cmd, f));
  const skills = join(root, 'src', 'skills');
  if (existsSync(skills)) for (const d of readdirSync(skills)) { const p = join(skills, d, 'SKILL.md'); if (existsSync(p)) out.push(p); }
  const agents = join(root, 'src', 'agents');
  if (existsSync(agents)) for (const f of readdirSync(agents)) if (f.endsWith('.md')) out.push(join(agents, f));
  return out;
}

// Every ATTLIST enumeration of a resolved DOCTYPE: attr and its values.
export function enumerations(subset) {
  const out = [];
  // Not anchored to a line start: `<!ATTLIST analysis trust (pcdata) #FIXED "pcdata">`
  // declares its one attribute on the ATTLIST line itself. The default that
  // follows the parenthesis is what tells an enumeration from a content model.
  const re = /(?:^|\s)([\w.:-]+)\s+\(\s*([\w|.:\s-]+?)\s*\)\s+(?:#REQUIRED|#IMPLIED|#FIXED\s+"[^"]*"|"[^"]*")/g;
  for (const m of subset.matchAll(re)) out.push({ attr: m[1], values: m[2].split('|').map((s) => s.trim()).filter(Boolean) });
  return out;
}

// Every spelled choice of a body: a bracketed list of two or more names.
export function spelled(body) {
  const out = [];
  const re = /\[([a-z][\w-]*(?:\|[a-z][\w-]*)+)\]/g;
  const lines = body.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(re)) out.push({ line: i + 1, text: m[0], values: m[1].split('|') });
  });
  return out;
}

export function holdOne(text, baseDir) {
  const d = splitDoctype(text);
  if (!d) return { findings: [], enumerations: 0, spelled: 0 };
  let resolved;
  try {
    const r = resolveFile(text, baseDir);
    resolved = typeof r === 'string' ? r : r.text;
  } catch (e) {
    return { findings: [{ kind: 'unresolved', text: e.message }], enumerations: 0, spelled: 0 };
  }
  const rd = splitDoctype(resolved) || d;
  const enums = enumerations(rd.subset);
  const body = resolved.slice(rd.end);
  const bodyOffset = resolved.slice(0, rd.end).split('\n').length - 1;
  const lists = spelled(body);
  const findings = [];
  const same = (a, b) => a.length === b.length && a.every((v) => b.includes(v));
  for (const l of lists) {
    const set = new Set(l.values);
    // A list that equals a declared enumeration is that enumeration and is
    // held to nothing else: the schematic list spells every schematic and
    // shares seven values with the forms, which is not a finding. Otherwise
    // the list is held to its best match alone, the enumeration sharing the
    // most values with it, and only when they share at least SHARED.
    if (enums.some((e) => same(e.values, l.values))) continue;
    let best = null;
    let bestShared = 0;
    for (const e of enums) {
      const shared = e.values.filter((v) => set.has(v)).length;
      if (shared > bestShared) { best = e; bestShared = shared; }
    }
    if (!best || bestShared < SHARED) continue;
    const missing = best.values.filter((v) => !set.has(v));
    const extra = l.values.filter((v) => !best.values.includes(v));
    if (missing.length) findings.push({ kind: 'omitted', line: l.line + bodyOffset, attr: best.attr, text: `${l.text} spells ${l.values.length} of the ${best.values.length} values ${best.attr} declares (${best.values.join('|')}); omitted ${missing.join('|')}` });
    if (extra.length) findings.push({ kind: 'undeclared', line: l.line + bodyOffset, attr: best.attr, text: `${l.text} spells ${extra.join('|')}, which ${best.attr} (${best.values.join('|')}) does not declare` });
  }
  return { findings, enumerations: enums.length, spelled: lists.length };
}

export function sweep(root = ROOT) {
  const rows = [];
  let enumsTotal = 0;
  let spelledTotal = 0;
  for (const f of sources(root)) {
    const r = holdOne(readFileSync(f, 'utf8'), dirname(f));
    enumsTotal += r.enumerations;
    spelledTotal += r.spelled;
    for (const x of r.findings) rows.push({ file: f.slice(root.length + 1).split('\\').join('/'), ...x });
  }
  return { files: sources(root).length, enumerations: enumsTotal, spelled: spelledTotal, findings: rows };
}

export function report(s) {
  const lines = s.findings.map((f) => `  ${f.kind.toUpperCase().padEnd(10)} ${f.file}:${f.line || 0} ${f.text}`);
  lines.push(`enum-sweep: ${s.files} sources, ${s.enumerations} enumerations resolved, ${s.spelled} choices spelled, ${s.findings.length} finding${s.findings.length === 1 ? '' : 's'}`);
  return lines.join('\n');
}

export function controls() {
  const rows = [];
  let pass = 0;
  let fail = 0;
  const say = (ok, text) => { rows.push(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); ok ? pass++ : fail++; };
  const doc = (enumValues, spelledValues) => `<!DOCTYPE x_run [\n  <!ELEMENT x_run (thing)>\n  <!ELEMENT thing (#PCDATA)>\n  <!ATTLIST thing form (${enumValues}) #REQUIRED>\n]>\n\n<output_format>\n- thing form [${spelledValues}]\n</output_format>\n`;
  const tmp = mkdtempSync(join(tmpdir(), 'enum-sweep-'));
  try {
    const planted = doc('unit|teen|ten|compound|scale|plain', 'unit|teen|ten|compound|plain');
    const plantedLine = planted.split('\n').findIndex((l) => l.includes('[unit')) + 1;
    const omitted = holdOne(planted, tmp);
    say(omitted.findings.length === 1 && omitted.findings[0].kind === 'omitted' && /omitted scale/.test(omitted.findings[0].text) && omitted.findings[0].line === plantedLine,
      `trip: a template that spells five of six values is a finding naming the omitted one at its line: ${(omitted.findings[0] || {}).text}`);
    const extra = holdOne(doc('start|more|add|impactful', 'start|more|add|impactful|save'), tmp);
    say(extra.findings.length === 1 && extra.findings[0].kind === 'undeclared' && /spells save/.test(extra.findings[0].text),
      `trip: a template that spells a value the grammar does not declare is a finding: ${(extra.findings[0] || {}).text}`);
    const equal = holdOne(doc('a|b|c|d', 'a|b|c|d'), tmp);
    say(equal.findings.length === 0 && equal.enumerations === 1 && equal.spelled === 1, 'a template that spells the enumeration whole is no finding');
    const below = holdOne(doc('yes|partial|no', 'yes|no'), tmp);
    say(below.findings.length === 0, `a list sharing fewer than ${SHARED} values with an enumeration is not held to it, so [yes|no] is not every yes|no in the tree`);
    // A real include resolves: the fixture DOCTYPE includes cc-ask from the tree and spells the gate whole and short.
    mkdirSync(join(tmp, 'src', 'commands'), { recursive: true });
    const rel = resolve(tmp, 'src', 'commands');
    const askRef = join(ROOT, 'dtd', 'cc-ask.dtd').split('\\').join('/');
    const withInclude = (choices) => `<!DOCTYPE y_run [\n  <!ENTITY % cc-ask SYSTEM "${askRef}">\n  %cc-ask;\n  <!ELEMENT y_run (intake)>\n]>\n\n<output_format>\n- gate: [${choices}] (round N)\n</output_format>\n`;
    const whole = holdOne(withInclude('start|more|add|impactful|save'), rel);
    const short = holdOne(withInclude('start|more|add|impactful'), rel);
    say(whole.findings.length === 0 && whole.enumerations > 5 && short.findings.length === 1 && /omitted save/.test(short.findings[0].text),
      `an included subset's enumerations are resolved: the gate spelled whole passes, spelled without save is a finding (${whole.enumerations} enumerations resolved through cc-ask)`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const s = sweep();
  say(s.files >= 160 && s.enumerations > 1000 && s.spelled > 200, `the tree is walked: ${s.files} sources, ${s.enumerations} enumerations, ${s.spelled} spelled choices`);
  say(s.findings.length === 0, s.findings.length === 0 ? 'every spelled choice in the tree agrees with its enumeration' : `findings in the tree: ${s.findings.slice(0, 3).map((f) => `${f.file}:${f.line} ${f.text}`).join('; ')}`);
  return { pass, fail, rows };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  if (argv.includes('--controls')) {
    const r = controls();
    for (const row of r.rows) console.log(row);
    console.log(`enum-sweep controls: ${r.pass + r.fail} run, ${r.fail} failing`);
    process.exit(r.fail ? 1 : 0);
  }
  const s = sweep();
  console.log(report(s));
  process.exit(argv.includes('--check') && s.findings.length ? 1 : 0);
}
