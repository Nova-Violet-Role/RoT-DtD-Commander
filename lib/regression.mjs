#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/regression.mjs
// The walk of checker/regression-extention-retenue.dtd, as code.
//
// REGRESSION  what left between two tags, and whether a reason was recorded
// EXTENTION   what arrived, and whether anything reads it
// RETENUE     what stayed with no reader, and whether the reason is written
//
// The claims arm (LAW.RER.2) is the one that matters. A diff-based detector
// would have returned green on v7.0.0, which deleted no file: the regression
// was a comment claiming the Adiutor reads RECORD.info. It never did. This
// reads the claim, opens the reader it names, and reports the ones that lie.
//
//   claims                report every capability claim whose reader lacks its subject
//   retenue               report every declaration no file reads, without a recorded reason
//   diff <from> <to>      report every declaration removed between two refs with no reason
//   controls              plant each finding on purpose; exit 1 if one did not fire
//
//   node lib/regression.mjs claims | retenue | diff v6.0.0 v7.0.0 | controls

import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, relative, resolve as presolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = presolve(dirname(fileURLToPath(import.meta.url)), '..');
const NL = String.fromCharCode(10);
const DTD = readFileSync(join(ROOT, 'checker', 'regression-extention-retenue.dtd'), 'utf8');

const ent = (name) => {
  const m = new RegExp('<!ENTITY\\s+' + name.replace(/\./g, '\\.') + '\\s+"([^"]*)"').exec(DTD);
  if (!m) throw new Error('regression-extention-retenue.dtd declares no ' + name);
  return m[1];
};
export const VERDICT_CLEAN = ent('RER.verdict.clean');
export const VERDICT_FINDINGS = ent('RER.verdict.findings');
// The severity is read from the DTD, and the DTD puts it inside a conditional
// section: with rer.strict INCLUDE the entity is declared, with IGNORE it is
// not and an unresolved claim is a low finding instead (LAW.RER.2).
export const CLAIM_SEVERITY = /<!ENTITY\s+RER\.claim\.unresolved\.severity\s+"([^"]*)"/.test(DTD)
  ? /<!ENTITY\s+RER\.claim\.unresolved\.severity\s+"([^"]*)"/.exec(DTD)[1] : 'low';

const SCAN_DIRS = ['dtd', 'lib', 'bin', 'checker', 'monitors'];
const TEXT = /\.(mjs|dtd|sh|json)$/;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEXT.test(f)) out.push(p);
  }
  return out;
}
const files = (root = ROOT) => SCAN_DIRS.flatMap((d) => walk(join(root, d)));

// ---------- the vocabulary a claim may be about ----------
// Only this repository's own declared names, so a sentence about someone
// else's software is never a finding.
const SUBJECT = /\b((?:RECORD|LAW|ASK|ARG|GATE|STAR|COMPANION|RER|SECTIONS|BLOCKS)\.[A-Za-z][\w.]*)/;

// An actor a comment may name, and the file that actor is.
const ACTORS = [
  [/\bthe Adiutor\b/i, 'bin/adiutor.mjs'],
  [/\bthe monitor\b/i, 'monitors/commander-adiutor.mjs'],
  [/\bthe installer\b/i, 'bin/rot-dtd-commander.mjs'],
];
const VERB = /\b(reads|checks|consumes|parses)\b/;

// ---------- LAW.RER.2: a claim is checked against the reader it names ----------
export function claims(root = ROOT) {
  const out = [];
  for (const p of files(root)) {
    const rel = relative(root, p).replace(/\\/g, '/');
    const lines = readFileSync(p, 'utf8').split('\n');
    lines.forEach((line, i) => {
      // a comment line only: a claim in running code is the code itself
      if (!/^\s*(\/\/|<!--|#)|^\s{5}/.test(line) && !/^\s*(\*|--)/.test(line)) return;
      if (!VERB.test(line)) return;
      // a NEGATED claim is the correction, never the defect: pass 15's line
      // says nothing reads RECORD.info and that is the truth, not a finding.
      if (/\b(nothing|never|does not|do not|no reader|not read)\b/i.test(line)) return;
      const s = SUBJECT.exec(line);
      if (!s) return;
      const subject = s[1].replace(/[.,;:]$/, '');
      let reader = null;
      const path = /\b((?:bin|lib|checker|monitors|dtd)\/[\w.-]+\.(?:mjs|dtd|sh))\b/.exec(line);
      if (path) reader = path[1];
      else for (const [re, f] of ACTORS) if (re.test(line)) { reader = f; break; }
      if (!reader) return;
      const rp = join(root, reader);
      const exists = existsSync(rp);
      const holds = exists && readFileSync(rp, 'utf8').includes(subject);
      if (!holds) {
        out.push({
          kind: 'regression', subject, where: rel + ':' + (i + 1),
          severity: CLAIM_SEVERITY, confidence: 'measured',
          text: exists
            ? 'the comment says ' + reader + ' ' + (VERB.exec(line) || [, 'reads'])[1] + ' ' + subject + '; that file does not contain ' + subject
            : 'the comment names the reader ' + reader + ', which does not exist',
        });
      }
    });
  }
  return out;
}

// ---------- LAW.RER.3: a declaration nothing reads, with no recorded reason ----------
export function retenue(root = ROOT) {
  const all = files(root);
  const corpus = new Map(all.map((p) => [p, readFileSync(p, 'utf8')]));
  const srcDir = join(root, 'src');
  const srcText = existsSync(srcDir) ? walkAll(srcDir).map((p) => readFileSync(p, 'utf8')).join('\n') : '';
  const out = [];
  for (const [p, text] of corpus) {
    if (!p.endsWith('.dtd')) continue;
    const rel = relative(root, p).replace(/\\/g, '/');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      const m = /^<!ENTITY\s+((?:RECORD|LAW|ASK|ARG|GATE|STAR|COMPANION|RER)\.[\w.]+)\s+"/.exec(line);
      if (!m) return;
      const name = m[1];
      let readers = 0;
      for (const [q, t] of corpus) { if (q === p) continue; if (t.includes(name)) readers++; }
      if (srcText.includes(name)) readers++;
      // a self-reference elsewhere in the same file still counts as a reader
      if (text.split(name).length - 1 > 1) readers++;
      if (readers > 0) return;
      // Both ways. A reason can sit above a declaration, and it can sit below:
      // checker/companion-audit.dtd records which instrument holds which law in a
      // block that follows the laws, which is where such a block belongs. An arm
      // that reads only upwards called two of those laws vestigial.
      const near = lines.slice(Math.max(0, i - 12), i + 20).join('\n');
      const reasoned = /\b(kept|exists so|reason|because|so that|needs a reference|holds which law|which instrument)\b/i.test(near);
      out.push({
        kind: 'retenue', subject: name, where: rel + ':' + (i + 1),
        severity: reasoned ? 'low' : 'medium', confidence: 'measured',
        text: reasoned ? 'no reader, and the reason it is kept is recorded above it' : 'no reader anywhere, and no reason recorded above it',
      });
    });
  }
  return out.filter((f) => f.severity !== 'low');
}
function walkAll(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walkAll(p, out); else out.push(p);
  }
  return out;
}

// ---------- LAW.RER.1: what left between two refs, and was a reason recorded ----------
export function diffRefs(from, to, root = ROOT) {
  const git = (...a) => spawnSync('git', ['-C', root, ...a], { encoding: 'utf8', timeout: 120000 });
  const d = git('diff', '-U0', from, to);
  if (d.status !== 0) return { error: (d.stderr || '').trim().slice(0, 200), out: [] };
  const removed = [];
  for (const line of d.stdout.split('\n')) {
    const m = /^-\s*<!(?:ENTITY|ELEMENT)\s+%?\s*([\w.%-]+)/.exec(line);
    if (m) removed.push(m[1]);
  }
  const log = git('log', '--format=%B', from + '..' + to).stdout || '';
  const out = [];
  for (const name of [...new Set(removed)]) {
    if (log.includes(name)) continue;
    // A minus line is not a removal. A rewritten declaration shows its old
    // text as removed while the name survives, and reporting that is the
    // false-positive class this arm was caught producing: eleven names from
    // v6.0.0..v7.0.0, every one of them still declared at v7.0.0. A name is
    // gone only when the tree at `to` no longer holds it (LAW.RER.1).
    if ((git('grep', '-l', name, to, '--', 'src/', 'dtd/', 'checker/').stdout || '').trim() !== '') continue;
    out.push({
      kind: 'regression', subject: name, where: from + '..' + to,
      severity: 'medium', confidence: 'measured',
      text: 'the declaration left the tree and no commit body between the two refs names it',
    });
  }
  return { error: null, out };
}

// ---------- rendering ----------
function render(findings, scope) {
  console.log(scope);
  for (const f of findings) {
    console.log('<finding kind="' + f.kind + '" subject="' + f.subject + '" where="' + f.where + '" severity="' + f.severity + '" confidence="' + f.confidence + '">' + f.text + '</finding>');
  }
  // LAW.RER.5: one verdict line, and it must agree with the count.
  console.log(findings.length === 0 ? VERDICT_CLEAN : VERDICT_FINDINGS + ' ' + findings.length);
  return findings.length === 0 ? 0 : 1;
}

// ---------- controls: every arm planted on purpose ----------
function controls() {
  let ran = 0, fail = 0;
  const say = (ok, text) => { ran++; console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' ' + text); if (!ok) fail++; };

  const tmp = mkdtempSync(join(tmpdir(), 'rer-'));
  try {
    for (const d of ['dtd', 'lib', 'bin', 'checker', 'monitors']) {
      const p = join(tmp, d);
      if (!existsSync(p)) mkdirSync(p, { recursive: true });
    }
    // 1. a claim whose reader exists but lacks the subject
    writeFileSync(join(tmp, 'bin', 'adiutor.mjs'), '// a reader that holds nothing\nexport const x = 1;\n', 'utf8');
    writeFileSync(join(tmp, 'dtd', 'planted.dtd'), '<!-- the Adiutor reads RECORD.planted at Stop -->\n<!ENTITY RECORD.planted "x">\n<!ENTITY RECORD.planted.use "RECORD.planted">\n', 'utf8');
    const c1 = claims(tmp);
    say(c1.length === 1 && c1[0].subject === 'RECORD.planted' && c1[0].severity === CLAIM_SEVERITY,
      'trip: a claim naming a reader that lacks its subject is reported at severity ' + CLAIM_SEVERITY + ': ' + (c1[0] ? c1[0].where + ' ' + c1[0].text.slice(0, 60) : 'NOTHING REPORTED'));

    // 2. the same claim, negated, is the correction and not a finding
    writeFileSync(join(tmp, 'dtd', 'planted.dtd'), '<!-- nothing reads RECORD.planted at runtime -->\n<!ENTITY RECORD.planted "x">\n<!ENTITY RECORD.planted.use "RECORD.planted">\n', 'utf8');
    say(claims(tmp).length === 0, 'a negated claim is the correction, not a finding: pass 15’s line would not fire');

    // 3. a claim whose reader is satisfied is silent
    writeFileSync(join(tmp, 'bin', 'adiutor.mjs'), '// holds it\nconst s = "RECORD.planted";\n', 'utf8');
    writeFileSync(join(tmp, 'dtd', 'planted.dtd'), '<!-- the Adiutor reads RECORD.planted at Stop -->\n<!ENTITY RECORD.planted "x">\n<!ENTITY RECORD.planted.use "RECORD.planted">\n', 'utf8');
    say(claims(tmp).length === 0, 'a claim whose reader does contain the subject is silent');

    // 4. retenue: a declaration nothing reads, with no reason above it
    writeFileSync(join(tmp, 'dtd', 'vestigial.dtd'), '<!ENTITY LAW.ZZ.1 "a law nothing reads">\n', 'utf8');
    const r1 = retenue(tmp);
    say(r1.some((f) => f.subject === 'LAW.ZZ.1'), 'trip: a declaration with no reader and no recorded reason is reported: ' + (r1[0] ? r1[0].where : 'NOTHING REPORTED'));

    // 5. the same declaration with the reason recorded is not a finding
    writeFileSync(join(tmp, 'dtd', 'vestigial.dtd'), '<!-- kept because the parameter entity needs a reference -->\n<!ENTITY LAW.ZZ.1 "a law nothing reads">\n', 'utf8');
    say(!retenue(tmp).some((f) => f.subject === 'LAW.ZZ.1'), 'a vestigial declaration whose reason is recorded above it is not a finding');

    // 10. the same, with the reason recorded BELOW it: the shape
    // checker/companion-audit.dtd actually uses, and the one this arm missed.
    writeFileSync(join(tmp, 'dtd', 'vestigial.dtd'), '<!ENTITY LAW.ZZ.1 "a law nothing reads">' + NL + 'which instrument holds which law: the runner allow-list does' + NL, 'utf8');
    say(!retenue(tmp).some((f) => f.subject === 'LAW.ZZ.1'), 'a vestigial declaration whose reason is recorded below it is not a finding either');

    // 6. LAW.RER.5: the verdict agrees with the count
    say(VERDICT_CLEAN !== VERDICT_FINDINGS && /clean$/.test(VERDICT_CLEAN) && /findings$/.test(VERDICT_FINDINGS),
      'the two verdicts are declared and distinct: ' + JSON.stringify(VERDICT_CLEAN) + ' / ' + JSON.stringify(VERDICT_FINDINGS));

    // 7. the conditional section in the DTD is live, not decoration
    say(CLAIM_SEVERITY === 'high', 'the conditional section rer.strict is INCLUDE, so an unresolved claim is high (LAW.RER.2)');

    // 8 and 9. The diff arm, on a scratch repository, because three real
    // release ranges all returned clean and an alarm nobody has tripped is
    // not an alarm. 9 is the false-positive class this arm was caught
    // producing: eleven names reported as removed from v6.0.0..v7.0.0 that
    // were all still declared at v7.0.0, because a rewritten declaration
    // shows its old text on a minus line.
    const repo = join(tmp, 'scratch');
    mkdirSync(join(repo, 'dtd'), { recursive: true });
    const g = (...a) => spawnSync('git', ['-C', repo, ...a], { encoding: 'utf8', timeout: 60000 });
    g('init', '-q'); g('config', 'user.email', 'c@example.invalid'); g('config', 'user.name', 'control');
    writeFileSync(join(repo, 'dtd', 'x.dtd'), '<!ENTITY LAW.GONE.1 "leaves">' + NL + '<!ENTITY LAW.STAYS.1 "old text">' + NL, 'utf8');
    g('add', '-A'); g('commit', '-q', '-m', 'before'); g('tag', 'a');
    writeFileSync(join(repo, 'dtd', 'x.dtd'), '<!ENTITY LAW.STAYS.1 "new text, rewritten">' + NL, 'utf8');
    g('add', '-A'); g('commit', '-q', '-m', 'a commit body that names neither'); g('tag', 'b');
    const dr = diffRefs('a', 'b', repo);
    const names = dr.out.map((f) => f.subject);
    say(!dr.error && names.includes('LAW.GONE.1'),
      'trip: a declaration genuinely gone, unnamed by any commit body, is reported: ' + (dr.error ? 'git said ' + dr.error : names.join(', ') || 'NOTHING REPORTED'));
    say(!names.includes('LAW.STAYS.1'),
      'a rewritten declaration whose name survives at the second ref is not reported as removed');
  } finally { rmSync(tmp, { recursive: true, force: true }); }

  console.log('regression controls: ' + ran + ' run, ' + fail + ' failing');
  return fail === 0;
}
// ---------- CLI ----------
function main() {
  const [verb, a, b] = process.argv.slice(2);
  if (verb === 'controls') process.exit(controls() ? 0 : 1);
  if (verb === 'claims') {
    const f = claims();
    process.exit(render(f, 'scope files=' + files().length + ' arm=claims'));
  }
  if (verb === 'retenue') {
    const f = retenue();
    process.exit(render(f, 'scope files=' + files().length + ' arm=retenue'));
  }
  if (verb === 'diff') {
    if (!a || !b) { console.log('regression: diff needs two refs'); process.exit(2); }
    const { error, out } = diffRefs(a, b);
    if (error) { console.log('regression: git said: ' + error); process.exit(2); }
    process.exit(render(out, 'scope from=' + a + ' to=' + b + ' arm=diff'));
  }
  console.log('regression: claims | retenue | diff <from> <to> | controls');
  process.exit(2);
}
const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
