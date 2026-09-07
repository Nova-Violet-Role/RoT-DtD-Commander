#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/scala.mjs
// One scala per family, run end to end through a real model on the leg it is
// on. The scala of a family is its members stacked one command token per
// line in band order (LAW.CORE.7, cc-chain.dtd), with --no-gate on the first
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
//   node checker/scala.mjs --controls                  three planted answers, each judged as it should be
//
// Exit 0 every scala passed; 1 a scala failed its score; 124 a ceiling fired
// and that family is UNRUN; 2 the arguments are wrong.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { FAMILIES, classify } from './readme-index.mjs';
import { MAX } from '../lib/chain.mjs';

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
    return { id: f.id, name: f.name, members, tokens, missing, overflow: found.length - kept.length, prompt: tokens.map((t, i) => `/${t}${i === 0 ? ' --no-gate' : ''}`).join('\n') };
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
export function score(answer, members) {
  const lines = String(answer).split(/\r?\n/);
  const heads = lines.filter((l) => /^### /.test(l));
  const findings = [];
  let cursor = 0;
  for (const m of members) {
    const key = m.replace(/-dtd$/, '');
    const sig = SIGILS[key];
    if (!sig) { findings.push(`${m} has no sigil in dtd/sigils.json`); continue; }
    const at = heads.findIndex((h, i) => i >= cursor && h.startsWith(`### ${sig}`));
    if (at < 0) findings.push(`no heading of ${m} (${sig}) after position ${cursor} of ${heads.length} headings`);
    else cursor = at + 1;
  }
  if (members.length >= 2) {
    const close = lines.find((l) => /chain_close\s+ran\s+\d+/.test(l));
    if (!close) findings.push('a chain of two or more carries no chain_close line naming how many ran');
    else {
      const ran = Number((/ran\s+(\d+)/.exec(close) || [])[1]);
      if (ran !== members.length) findings.push(`chain_close says ran ${ran}; the scala stacked ${members.length}`);
    }
  }
  return { ok: findings.length === 0, findings, headings: heads.length };
}

export function runOne(s, { out, model = 'opus', turns = 60, secs = 1500 } = {}) {
  mkdirSync(out, { recursive: true });
  const raw = join(out, `scala-${s.id}.json`);
  const log = join(out, `scala-${s.id}.md`);
  const ceiling = [join(ROOT, 'lib', 'ceiling.mjs'), String(secs)];
  const args = ['-p', s.prompt, '--model', model, '--max-turns', String(turns), '--output-format', 'json', '--add-dir', ROOT,
    '--allowedTools', `Read,Grep,Glob,Bash(node ${join(ROOT, 'lib', 'ceiling.mjs')} 60 node:*),Bash(node ${join(ROOT, 'lib', 'ceiling.mjs')} 60 git:*)`];
  const r = spawnSync(process.execPath, [...ceiling, 'claude', ...args], { cwd: out, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ROTMOE_VOICE: '0', CCC_HOOK_AUTOINIT: '0', CLAUDECODE: '' }, maxBuffer: 64 * 1024 * 1024 });
  writeFileSync(raw, (r.stdout || '') + (r.stderr || ''), 'utf8');
  if (r.status === 124) return { id: s.id, status: 124, unrun: true };
  let j = null;
  try { j = JSON.parse(r.stdout); } catch { const i = String(r.stdout || '').indexOf('{'); try { j = JSON.parse(String(r.stdout).slice(i)); } catch { j = null; } }
  const answer = j && typeof j.result === 'string' ? j.result : '';
  writeFileSync(log, answer.replace(/\r/g, '') + (answer.endsWith('\n') ? '' : '\n'), 'utf8');
  const sc = score(answer, s.members);
  return { id: s.id, status: r.status, unrun: false, ok: sc.ok, findings: sc.findings, headings: sc.headings, turns: j ? j.num_turns : null, cost: j ? j.total_cost_usd : null, log };
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
  console.error('usage: node checker/scala.mjs list | run <family|--all> [--out d] [--model m] [--turns n] [--secs n] | score <answer.md> <family> | --controls');
  process.exit(2);
}
