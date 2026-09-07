#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/scala.mjs
// One scala per family, run end to end through a real model on the leg it is
// on. The scala of a family is its members stacked one command token per
// line in band order beneath /chain-dtd --no-gate (CHAIN.declared), or the one
// line so the chain runs without an operator; a family of one member runs
// that member alone, which is the other half of the same law: every command
// runnable alone, every command interoperable in a chain.
//
// Foreground only: stdin closed, a turn ceiling, a wall-clock ceiling through
// lib/ceiling.mjs (the timeout binary is absent on macOS), the raw JSON
// stream and the answer written under the out directory, and the answer
// scored on what it carries rather than on how it reads: every member's
// sigil heading must appear at least once, in the order the members were
// stacked, and a chain of two or more must close with a chain_close line
// naming how many ran. A model that quotes its own contract cannot pass by
// quoting it: the scorer reads headings, and a heading is a line that starts
// with three hashes and the sigil.
//
//   node checker/scala.mjs list                       the families and their scalas
//   node checker/scala.mjs run <family|--all> [--out <dir>] [--model <m>] [--turns <n>] [--secs <n>]
//   node checker/scala.mjs score <answer.md> <family>  score a saved answer
//   node checker/scala.mjs findings <dir>... [--leg <name>] [--run <label>] [--previous <file.nt>] [--out <file.nt>] [--table]
//                                                     the answers of one or more legs read as a NestedText record of findings (9.1.0)
//   node checker/scala.mjs --controls                  three planted answers, each judged as it should be
//
// Exit 0 every scala passed; 1 a scala failed its score; 124 a ceiling fired
// and that family is UNRUN; 2 the arguments are wrong.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { FAMILIES, classify } from './readme-index.mjs';
import { MAX } from '../lib/chain.mjs';
import { toNt, fromNt } from '../lib/cache.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SIGILS = JSON.parse(readFileSync(join(ROOT, 'dtd', 'sigils.json'), 'utf8'));

// The scala of a family: its declared members in order; for a family with no
// members list, the commands the index assigns to it (first family whose
// members name the command, else first whose patterns match it), in name
// order; for one with neither, its representative alone. A member file is
// commands/<m>-dtd.md or, for the Adiutor, commands/<m>.md. A family whose
// files are all absent is returned with no members and every name it lost
// under missing, never filtered away: the seventh companion pass on 9.0.0
// measured the prompts family swallowed while the census said one per
// family. A scala carries at most CHAIN.max links (LAW.CHAIN.1); a family
// with more stacks its first CHAIN.max and says how many it left.
// The prompt a family is measured through. Several tokens are one chain only
// through /chain-dtd (CHAIN.declared; cc-chain is included by the chain
// command alone), so a family of two or more opens with the chain token
// carrying the autonomy token, the members stacked beneath it one per line;
// a family of one is its one command with the token. The first matrix of
// 9.1.0 stacked the members without the chain token, the CLI expanded the
// first as itself with the rest as its user-args, and no grammar in that
// command declared a chain: 32 chains without a close line and 67 skipped
// headings on ubuntu and macOS were that prompt, not the commands.
export function promptOf(tokens) {
  if (!tokens.length) return '';
  if (tokens.length === 1) return `/${tokens[0]} --no-gate`;
  return ['/chain-dtd --no-gate', ...tokens.map((t) => `/${t}`)].join('\n');
}

export function scalas(root = ROOT, families = FAMILIES) {
  const dir = join(root, 'commands');
  const present = existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.md')).map((n) => n.slice(0, -3)).sort() : [];
  const assign = (name) => {
    const key = name.replace(/-dtd$/, '');
    if (families === FAMILIES) { try { return classify(key); } catch { return null; } }
    return families.find((f) => f.members && f.members.includes(key)) || families.find((f) => f.patterns && f.patterns.some((p) => p.test(key))) || null;
  };
  return families.map((f) => {
    const declared = f.members && f.members.length
      ? f.members
      : (f.patterns && f.patterns.length ? present.filter((n) => assign(n) === f).map((n) => n.replace(/-dtd$/, '')) : [f.rep]);
    const resolved = declared.map((m) => ({ m, token: present.includes(`${m}-dtd`) ? `${m}-dtd` : (present.includes(m) ? m : null) }));
    const found = resolved.filter((r) => r.token);
    const missing = resolved.filter((r) => !r.token).map((r) => r.m);
    const kept = found.slice(0, MAX);
    const members = kept.map((r) => r.m);
    const tokens = kept.map((r) => r.token);
    return { id: f.id, name: f.name, members, tokens, missing, overflow: found.length - kept.length, prompt: promptOf(tokens) };
  });
}

// The census, held in both directions: one scala per family, every family
// with at least one member file, every declared member resolved to a file.
export function census(all = scalas(), families = FAMILIES) {
  const findings = [];
  if (all.length !== families.length) findings.push(`${all.length} scalas for ${families.length} families`);
  for (const s of all) {
    if (!s.members.length) findings.push(`${s.id} has no member file (${s.missing.join(', ') || 'nothing declared'})`);
    else if (s.missing.length) findings.push(`${s.id} lost ${s.missing.join(', ')}: no command file`);
  }
  return { ok: findings.length === 0, findings };
}

// The score. Headings only: a line that starts with ### and the member's
// sigil. Every member present, in stacked order; a chain closes.
// A heading is any markdown heading of level three or deeper: the chain
// renders its own at level three and each link's answer beneath it one level
// deeper, which is what "under its own root" means in markdown, and the first
// probe of 9.1.0 measured a chain that ran both links, closed, and was refused
// for #### alone. Emphasis is stripped before the close line is read, because
// a bold ran is still a ran.
const plain = (l) => String(l).replace(/[*`]/g, '');
export function score(answer, members) {
  const lines = String(answer).split(/\r?\n/);
  const heads = lines.filter((l) => /^#{3,6} /.test(l)).map((l) => l.replace(/^#{3,6} /, ''));
  const findings = [];
  let cursor = 0;
  for (const m of members) {
    const key = m.replace(/-dtd$/, '');
    const sig = SIGILS[key];
    if (!sig) { findings.push(`${m} has no sigil in dtd/sigils.json`); continue; }
    const at = heads.findIndex((h, i) => i >= cursor && h.startsWith(sig));
    if (at < 0) findings.push(`no heading of ${m} (${sig}) after position ${cursor} of ${heads.length} headings`);
    else cursor = at + 1;
  }
  if (members.length >= 2) {
    const close = lines.map(plain).find((l) => /chain_close\s+ran\s+\d+/.test(l));
    if (!close) findings.push('a chain of two or more carries no chain_close line naming how many ran');
    else {
      const ran = Number((/ran\s+(\d+)/.exec(close) || [])[1]);
      if (ran !== members.length) findings.push(`chain_close says ran ${ran}; the scala stacked ${members.length}`);
    }
  }
  return { ok: findings.length === 0, findings, headings: heads.length };
}

// The CLI's own refusal, read before any scoring. A chain whose first token
// is a command the CLI does not know answers Unknown command and never calls
// a model: the first hosted scala of 9.0.0 read 18 bytes plus the first
// token from every one of its seventeen families, on three legs, and scored
// them as answers with no heading.
export function diagnose(raw) {
  const m = /Unknown command: (\/\S+)/.exec(String(raw || ''));
  if (m) return `the CLI has no command ${m[1]}: the commander is not installed where this leg reads its commands, and no model was called`;
  // The second hosted matrix of 9.1.0: the sealed credential had expired,
  // every family answered Not logged in inside a result that counted one
  // turn, and the smoke passed on the turn count alone.
  if (/Not logged in/.test(String(raw || ''))) return 'the CLI is not logged in on this leg: the sealed credential is expired or absent, and no model was called';
  return '';
}

export function runOne(s, { out, model = 'opus', turns = 60, secs = 1500 } = {}) {
  mkdirSync(out, { recursive: true });
  const raw = join(out, `scala-${s.id}.json`);
  const log = join(out, `scala-${s.id}.md`);
  const ceiling = [join(ROOT, 'lib', 'ceiling.mjs'), String(secs)];
  // The model runs from the checkout: every command's prose names the runtime
  // as lib/<x>.mjs relative to the tree, the chain writes its record under
  // artifacts/chain and each link its own under artifacts/<name>, and the
  // plan and handoff verbs of lib/chain.mjs are Bash calls the prose spells
  // with the relative ceiling; both spellings are allowed, and Write is,
  // because a link that cannot write its record cannot hand it on.
  // MSYS_NO_PATHCONV: on a Windows leg the Bash tool is Git Bash, which
  // rewrites an argument that opens with a slash as a path, and the first
  // stacked token of a plan call arrived as C:/Program Files/Git/<token>.
  const ceil = join(ROOT, 'lib', 'ceiling.mjs');
  const args = ['-p', s.prompt, '--model', model, '--max-turns', String(turns), '--output-format', 'json', '--add-dir', ROOT,
    '--allowedTools', `Read,Grep,Glob,Write,Bash(node lib/ceiling.mjs 60 node:*),Bash(node lib/ceiling.mjs 60 git:*),Bash(node ${ceil} 60 node:*),Bash(node ${ceil} 60 git:*)`];
  const r = spawnSync(process.execPath, [...ceiling, 'claude', ...args], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ROTMOE_VOICE: '0', CCC_HOOK_AUTOINIT: '0', CLAUDECODE: '', MSYS_NO_PATHCONV: '1' }, maxBuffer: 64 * 1024 * 1024 });
  writeFileSync(raw, (r.stdout || '') + (r.stderr || ''), 'utf8');
  if (r.status === 124) return { id: s.id, status: 124, unrun: true };
  let j = null;
  try { j = JSON.parse(r.stdout); } catch { const i = String(r.stdout || '').indexOf('{'); try { j = JSON.parse(String(r.stdout).slice(i)); } catch { j = null; } }
  const answer = j && typeof j.result === 'string' ? j.result : '';
  writeFileSync(log, answer.replace(/\r/g, '') + (answer.endsWith('\n') ? '' : '\n'), 'utf8');
  const sc = score(answer, s.members);
  const why = diagnose((r.stdout || '') + (r.stderr || ''));
  return { id: s.id, status: r.status, unrun: false, ok: sc.ok && !why, findings: why ? [why, ...sc.findings] : sc.findings, headings: sc.headings, turns: j ? j.num_turns : null, cost: j ? j.total_cost_usd : null, log };
}

// ---------- the findings as a record (9.1.0) ----------
// The answers a leg leaves behind, read again: every family scored as the run
// scored it, the CLI's own refusal and an empty answer named as findings of
// their own, and each finding classified by kind and severity. The record is
// NestedText through lib/cache.mjs, one entry per finding with leg, family,
// member, kind, severity, text, fix and status; a previous record's fix and
// status are carried over by key, so a regeneration never loses what was
// written by hand, and a finding the new run no longer shows is kept as fixed.
export function kindOf(text) {
  const t = String(text);
  if (/^the CLI has no command/.test(t)) return { kind: 'refusal', severity: 'high', member: ((/no command \/([\w-]+?)(?:-dtd)?:/.exec(t) || [])[1]) || 'none' };
  if (/^the CLI is not logged in/.test(t)) return { kind: 'login', severity: 'high', member: 'none' };
  if (/^the answer is empty/.test(t)) return { kind: 'empty', severity: 'high', member: 'none' };
  if (/^the ceiling fired/.test(t)) return { kind: 'unrun', severity: 'high', member: 'none' };
  if (/^no heading of /.test(t)) return { kind: 'heading', severity: 'medium', member: ((/^no heading of (\S+)/.exec(t) || [])[1]) || 'none' };
  if (/carries no chain_close line/.test(t)) return { kind: 'close', severity: 'medium', member: 'none' };
  if (/^chain_close says ran/.test(t)) return { kind: 'count', severity: 'low', member: 'none' };
  return { kind: 'other', severity: 'low', member: 'none' };
}
export function legOf(dir, given = '') {
  if (given) return String(given).replace(/-latest$/, '');
  const m = /scala-(ubuntu|macos|windows)/.exec(String(dir));
  return m ? m[1] : basename(String(dir));
}
export function readLeg(dir, leg) {
  const rows = [];
  const summary = { leg, pass: 0, fail: 0, findings: 0, families: [] };
  for (const s of scalas()) {
    const md = join(dir, `scala-${s.id}.md`);
    const raw = join(dir, `scala-${s.id}.json`);
    if (!existsSync(md) && !existsSync(raw)) continue;
    const answer = existsSync(md) ? readFileSync(md, 'utf8') : '';
    const rawText = existsSync(raw) ? readFileSync(raw, 'utf8') : '';
    const findings = [];
    const why = diagnose(rawText);
    if (why) findings.push(why);
    if (!existsSync(md)) findings.push('the ceiling fired: no answer file was written for this family');
    else if (!answer.trim()) findings.push('the answer is empty: no result came back from the CLI');
    const sc = score(answer, s.members);
    for (const f of sc.findings) findings.push(f);
    let j = null;
    try { j = JSON.parse(rawText); } catch { const i = rawText.indexOf('{'); try { j = JSON.parse(rawText.slice(i)); } catch { j = null; } }
    const fam = { family: s.id, ok: findings.length === 0, headings: sc.headings, turns: j && j.num_turns != null ? String(j.num_turns) : 'none', cost: j && j.total_cost_usd != null ? Number(j.total_cost_usd).toFixed(2) : 'none' };
    summary.families.push(fam);
    if (fam.ok) summary.pass++; else summary.fail++;
    for (const text of findings) { const k = kindOf(text); rows.push({ leg, family: s.id, member: k.member, kind: k.kind, severity: k.severity, text }); }
  }
  summary.findings = rows.length;
  return { rows, summary };
}
const keyOf = (r) => `${r.leg}|${r.family}|${r.kind}|${r.member}|${r.n || '1'}`;
export function findingsRecord(legs, { run = '', previous = null, generated = new Date().toISOString() } = {}) {
  let prevRows = [];
  if (previous) {
    const text = typeof previous === 'string' && existsSync(previous) ? readFileSync(previous, 'utf8') : (typeof previous === 'string' ? previous : '');
    const p = text ? fromNt(text) : null;
    prevRows = p && Array.isArray(p.findings) ? p.findings : [];
  }
  const seen = new Map();
  const out = [];
  for (const l of legs) for (const r of l.rows) {
    const base = `${r.leg}|${r.family}|${r.kind}|${r.member}`;
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    const row = { n: String(n), leg: r.leg, family: r.family, member: r.member, kind: r.kind, severity: r.severity, text: r.text, fix: 'none yet', status: 'open' };
    const p = prevRows.find((x) => keyOf(x) === keyOf(row));
    if (p) { if (p.fix) row.fix = p.fix; if (p.status) row.status = p.status; }
    out.push(row);
  }
  for (const x of prevRows) {
    if (out.some((r) => keyOf(r) === keyOf(x))) continue;
    if (/^fixed/.test(String(x.status || ''))) { out.push({ ...x }); continue; }
    out.push({ ...x, status: `fixed in ${run || 'this run'}` });
  }
  const summary = {};
  for (const l of legs) summary[l.summary.leg] = `pass ${l.summary.pass}, fail ${l.summary.fail}, findings ${l.summary.findings}`;
  const record = { run: run || 'unnamed', generated, legs: legs.map((l) => l.summary.leg).join(', ') || 'none', families: String(scalas().length), summary: Object.keys(summary).length ? summary : 'none', findings: out.length ? out : 'none' };
  return { record, text: toNt(record, 'scala findings, written by node checker/scala.mjs findings; fix and status are kept by hand and carried over by key on the next write') };
}
export function table(legs) {
  const fams = scalas().map((s) => s.id);
  const L = [`| family | ${legs.map((l) => l.summary.leg).join(' | ')} |`, `|---|${legs.map(() => '---').join('|')}|`];
  for (const f of fams) L.push(`| ${f} | ${legs.map((l) => { const x = l.summary.families.find((y) => y.family === f); return x ? (x.ok ? 'PASS' : `FAIL ${x.headings} headings, ${l.rows.filter((r) => r.family === f).length} findings, turns ${x.turns}`) : 'absent'; }).join(' | ')} |`);
  L.push(`| total | ${legs.map((l) => `pass ${l.summary.pass}, fail ${l.summary.fail}, findings ${l.summary.findings}`).join(' | ')} |`);
  return L.join('\n');
}

export function controls(io = console) {
  let ran = 0, fail = 0;
  const say = (ok, t) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${t}`); if (!ok) fail++; };
  const all = scalas();
  const cen = census(all);
  say(all.length === FAMILIES.length && cen.ok && all.every((s) => /--no-gate/.test(s.prompt.split('\n')[0])),
    `${all.length} scalas for ${FAMILIES.length} families, every family with a member file and every declared member resolved, the autonomy token on line one${cen.ok ? '' : `; ${cen.findings.join('; ')}`}`);
  const wf = all.find((s) => s.id === 'workflow');
  say(wf && wf.members.includes('RoT-DtD-Commander-Adiutor') && wf.tokens.includes('RoT-DtD-Commander-Adiutor') && wf.missing.length === 0,
    `the workflow scala resolves the Adiutor by its own filename: ${wf ? wf.members.length : 0} members, ${wf ? wf.missing.length : '?'} missing`);
  const nested = '### ⛓️ Chain\n\n#### 📏 Arguments\n\n#### 🖼️ Plan\n\n- chain_close **ran 2 refused 0** artifact `artifacts/chain/x.md`\n';
  const m5 = score(nested, ['codebase-surveyor-dtd', 'codebase-architect-dtd']);
  say(m5.ok && m5.headings === 3, `a chain whose links render one level deeper and close in bold is read as the run it was: ${m5.headings} headings, ${m5.findings.length} findings`);
  const login = diagnose('{"type":"result","subtype":"success","is_error":true,"num_turns":1,"result":"Not logged in · Please run /login"}');
  say(/not logged in/.test(login) && kindOf(login).kind === 'login' && kindOf(login).severity === 'high' && diagnose('{"result":"### x"}') === '', `trip: a Not logged in result is a finding of kind login before any heading is counted: ${login.slice(0, 60)}`);
  const chainFam = all.find((s) => s.id === 'chain');
  const two = all.find((s) => s.members.length >= 2);
  say(chainFam && chainFam.prompt === '/chain-dtd --no-gate' && two && two.prompt.split('\n')[0] === '/chain-dtd --no-gate' && two.prompt.split('\n').length === two.members.length + 1 && promptOf([]) === '',
    `a family of one is its command with the token (${chainFam ? chainFam.prompt : '?'}); a family of two or more opens with the chain token and stacks its members beneath, ${two ? two.members.length + 1 : '?'} lines for ${two ? two.id : '?'}`);
  const pr = all.find((s) => s.id === 'prompts');
  say(pr && pr.members.length === MAX && pr.overflow > 0 && pr.missing.length === 0,
    `the prompts family stacks ${pr ? pr.members.length : 0} of its ${pr ? pr.members.length + pr.overflow : 0} creators (CHAIN.max ${MAX}) and names the ${pr ? pr.overflow : '?'} it left`);
  const ghostTmp = mkdtempSync(join(tmpdir(), 'scala-ghost-'));
  try {
    mkdirSync(join(ghostTmp, 'commands'), { recursive: true });
    writeFileSync(join(ghostTmp, 'commands', 'a-dtd.md'), '# a\n', 'utf8');
    const fams = [{ id: 'ghost', name: 'Ghost', rep: 'nobody' }, { id: 'half', name: 'Half', rep: 'x', members: ['a', 'b'] }];
    const ghost = scalas(ghostTmp, fams);
    const gc = census(ghost, fams);
    say(ghost.length === 2 && ghost[0].members.length === 0 && ghost[0].missing.join() === 'nobody' && ghost[1].members.join() === 'a' && !gc.ok && /ghost has no member file \(nobody\)/.test(gc.findings.join(';')) && /half lost b/.test(gc.findings.join(';')),
      `trip: a family with no command file is returned with its lost name and the census goes red, and a family missing one member names it: ${gc.findings.join('; ')}`);
  } finally {
    rmSync(ghostTmp, { recursive: true, force: true });
  }
  const geo = all.find((s) => s.id === 'geometry');
  say(geo && geo.members.join(',') === 'codebase-surveyor,codebase-architect,codebase-renovator,codebase-generator,typography', `the geometry scala is the four bands then the contract: ${geo ? geo.members.join(' > ') : 'absent'}`);
  const full = '### 📏 Arguments\n\n### 📏 Survey\n\n### 🖼️ Plan\n\n### 🔨 Renovation\n\n### 🖌️ Production\n\n### 🔤 Typeset\n\n- chain_close ran 5 refused 0 artifact x\n';
  say(score(full, geo.members).ok, 'a planted full answer with every sigil heading in order and a close of five passes');
  const missing = full.replace('### 🔨 Renovation\n\n', '');
  const m1 = score(missing, geo.members);
  say(!m1.ok && /no heading of codebase-renovator/.test(m1.findings[0]), `trip: an answer missing one member's heading is refused by name: ${m1.findings[0]}`);
  const swapped = full.replace('### 🖼️ Plan\n\n### 🔨 Renovation\n\n', '### 🔨 Renovation\n\n### 🖼️ Plan\n\n');
  const m2 = score(swapped, geo.members);
  say(!m2.ok && m2.findings.some((f) => /no heading of codebase-renovator.*after position/.test(f)), 'trip: headings out of the stacked order are refused, because order is the chain');
  const m3 = score(full.replace('ran 5', 'ran 4'), geo.members);
  say(!m3.ok && /chain_close says ran 4; the scala stacked 5/.test(m3.findings[0]), `trip: a close that ran fewer than were stacked is refused: ${m3.findings[0]}`);
  const quoted = full.replace(/^### /gm, 'the heading ### ');
  say(!score(quoted, geo.members).ok, 'trip: a sigil heading quoted inside prose is not a heading and does not count');
  const one = all.find((s) => s.members.length === 1);
  say(one && score(`### ${SIGILS[one.members[0]]} Anything\n`, one.members).ok, `a family of one member passes on its own heading with no close required: ${one ? one.id : 'none'}`);
  const refused = diagnose('Unknown command: /chain-dtd\n');
  say(/the CLI has no command \/chain-dtd/.test(refused) && diagnose('{"type":"result","result":"Unknown command: /sigil-dtd","num_turns":0}') !== '' && diagnose('{"result":"### x"}') === '',
    `trip: the CLI's Unknown command line, bare or inside a json result, is a finding by token before any heading is counted: ${refused.slice(0, 60)}`);
  // The findings as a record (9.1.0): a planted leg with one passing and one
  // failing family, read, classified, written as NestedText and read back;
  // a previous record's fix and status carried over by key, a vanished
  // finding kept as fixed; the leg named from the artifact directory.
  const kinds = ['the CLI has no command /chain-dtd: x', 'the answer is empty: y', 'the ceiling fired: z', 'no heading of pareto (x) after position 0 of 4 headings', 'a chain of two or more carries no chain_close line naming how many ran', 'chain_close says ran 4; the scala stacked 5'].map(kindOf);
  say(kinds.map((k) => `${k.kind}/${k.severity}/${k.member}`).join(' ') === 'refusal/high/chain empty/high/none unrun/high/none heading/medium/pareto close/medium/none count/low/none', `every finding text has a kind, a severity and a member: ${kinds.map((k) => k.kind).join(', ')}`);
  say(legOf('/tmp/legs/scala-macos-latest-abc123') === 'macos' && legOf('/x', 'windows-latest') === 'windows' && legOf('/tmp/other') === 'other', 'the leg is read from the artifact directory name, or from --leg without its -latest');
  const legDir = mkdtempSync(join(tmpdir(), 'scala-leg-'));
  try {
    const th = scalas().find((s) => s.id === 'thinking');
    writeFileSync(join(legDir, 'scala-chain.md'), `### ${SIGILS[one.members[0]]} Chain\n`, 'utf8');
    writeFileSync(join(legDir, 'scala-chain.json'), '{"result":"x","num_turns":3,"total_cost_usd":0.5}', 'utf8');
    writeFileSync(join(legDir, 'scala-thinking.md'), `### ${SIGILS[th.members[0]]} First\n`, 'utf8');
    writeFileSync(join(legDir, 'scala-thinking.json'), '{"result":"y","num_turns":1,"total_cost_usd":0.1}', 'utf8');
    const leg = readLeg(legDir, 'ubuntu');
    const prevText = toNt({ run: 'before', generated: 'x', legs: 'ubuntu', families: '17', summary: 'none', findings: [{ n: '1', leg: 'ubuntu', family: 'thinking', member: 'none', kind: 'close', severity: 'medium', text: 'old', fix: 'the close line added to the prose', status: 'in progress' }, { n: '1', leg: 'ubuntu', family: 'chain', member: 'none', kind: 'empty', severity: 'high', text: 'was empty', fix: 'none yet', status: 'open' }] });
    const rec = findingsRecord([leg], { run: 'r2', previous: prevText, generated: 'now' });
    const back = fromNt(rec.text);
    const close = back.findings.find((f) => f.family === 'thinking' && f.kind === 'close');
    const vanished = back.findings.find((f) => f.family === 'chain' && f.kind === 'empty');
    say(leg.summary.pass === 1 && leg.summary.fail === 1 && leg.summary.findings === th.members.length && back.findings.length === leg.summary.findings + 1 && close && close.fix === 'the close line added to the prose' && close.status === 'in progress' && vanished && vanished.status === 'fixed in r2' && back.summary.ubuntu === `pass 1, fail 1, findings ${leg.summary.findings}`,
      `a planted leg reads as pass 1, fail 1, ${leg.summary.findings} findings; written as NestedText and read back; the previous fix and status carried over by key; the vanished finding kept as fixed in r2`);
    say(/^\| family \| ubuntu \|/.test(table([leg])) && /\| chain \| PASS \|/.test(table([leg])) && /\| thinking \| FAIL /.test(table([leg])), 'the table has one column per leg and one row per family with PASS or the counts');
  } finally { rmSync(legDir, { recursive: true, force: true }); }
  io.log(`scala controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  if (args[0] === '--controls') process.exit(controls() ? 0 : 1);
  if (args[0] === 'list') { for (const s of scalas()) console.log(`${s.id.padEnd(12)} ${s.members.length} ${s.tokens.map((t) => '/' + t).join(' ')}${s.overflow ? ` (+${s.overflow} not stacked)` : ''}${s.missing.length ? ` missing ${s.missing.join(',')}` : ''}`); process.exit(0); }
  if (args[0] === 'score' && args[1] && args[2]) {
    const s = scalas().find((x) => x.id === args[2]);
    if (!s) { console.error(`no family ${args[2]}`); process.exit(2); }
    const sc = score(readFileSync(args[1], 'utf8'), s.members);
    for (const f of sc.findings) console.log(`  FINDING ${f}`);
    console.log(`scala ${s.id}: ${sc.ok ? 'PASS' : 'FAIL'}, ${sc.headings} headings`);
    process.exit(sc.ok ? 0 : 1);
  }
  if (args[0] === 'findings' && args[1]) {
    const dirs = [];
    const o = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--table') o.table = true;
      else if (/^--(out|leg|run|previous)$/.test(args[i])) o[args[i].slice(2)] = args[++i];
      else dirs.push(args[i]);
    }
    if (!dirs.length) { console.error('findings: no directory given'); process.exit(2); }
    const legs = dirs.map((d) => readLeg(d, legOf(d, dirs.length === 1 ? o.leg || '' : '')));
    const read = legs.reduce((n, l) => n + l.summary.families.length, 0);
    if (!read) { console.error(`findings: no scala answer under ${dirs.join(', ')}`); process.exit(1); }
    const { record, text } = findingsRecord(legs, { run: o.run || '', previous: o.previous || null });
    if (o.table) console.log(table(legs));
    if (o.out) {
      writeFileSync(o.out, text, 'utf8');
      const back = fromNt(readFileSync(o.out, 'utf8'));
      if (JSON.stringify(back) !== JSON.stringify(JSON.parse(JSON.stringify(record)))) { console.error(`findings: ${o.out} did not read back as written`); process.exit(1); }
      console.log(`  wrote ${o.out}, ${Buffer.byteLength(text)} bytes, read back equal`);
    }
    const total = Array.isArray(record.findings) ? record.findings.length : 0;
    console.log(`scala findings: ${legs.length} leg(s) ${record.legs}, ${read} answers read, ${total} findings (${Array.isArray(record.findings) ? record.findings.filter((f) => f.status === 'open').length : 0} open)`);
    process.exit(0);
  }
  if (args[0] === 'run' && args[1]) {
    const out = resolve(opt('--out', join(tmpdir(), 'scala')));
    const model = opt('--model', 'opus');
    const turns = Number(opt('--turns', '60'));
    const secs = Number(opt('--secs', '1500'));
    const want = args[1] === '--all' ? scalas() : scalas().filter((s) => s.id === args[1]);
    if (!want.length) { console.error(`no family ${args[1]}`); process.exit(2); }
    let worst = 0;
    for (const s of want) {
      if (!s.members.length) { console.log(`  NO MEMBERS: ${s.id} has no command file (${s.missing.join(', ')})`); worst = Math.max(worst, 1); continue; }
      console.log(`scala ${s.id}: ${s.members.length} link(s), model ${model}, turns ${turns}, ceiling ${secs}s`);
      const r = runOne(s, { out, model, turns, secs });
      if (r.unrun) { console.log(`  CEILING FIRED: ${s.id} is UNRUN`); worst = Math.max(worst, 124); continue; }
      for (const f of r.findings) console.log(`  FINDING ${f}`);
      console.log(`  ${r.ok ? 'PASS' : 'FAIL'} exit ${r.status}, ${r.headings} headings, turns ${r.turns}, cost ${r.cost}, answer ${r.log}`);
      if (!r.ok) worst = Math.max(worst, 1);
    }
    process.exit(worst);
  }
  console.error('usage: node checker/scala.mjs list | run <family|--all> [--out d] [--model m] [--turns n] [--secs n] | score <answer.md> <family> | findings <dir>... [--leg l] [--run r] [--previous f] [--out f] [--table] | --controls');
  process.exit(2);
}
