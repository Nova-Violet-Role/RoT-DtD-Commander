#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/starlist.mjs
// What the harness may reach, and the six managers that reach it, as declared
// in dtd/cc-starlist.dtd. Every manager is an entity, never a branch: a
// seventh is one more declaration and no new code (LAW.STAR.1).
//
// A search runs in the foreground under the manager's own ceiling with its
// exit code read directly, and a manager whose binary is absent is reported
// absent rather than guessed at (LAW.STAR.2). An install runs only after a
// confirmation showing the literal line, and is refused outright when a black
// list names the tool or its filetype (LAW.STAR.3).
//
//   managers()                    the six, from the declarations
//   have(binary)                  is it on this machine
//   search(query, {managers})     foreground, per-manager ceiling, exits read
//   installPlan(tool, mgr, lists) the line, the ceiling, and any refusal
//   measure(root)                 what the tree says before any question
//   readSession/writeSession      the resumable record of the uncapped blocks
//   controls()

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPDX = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->'];

export function contract(file = join(ROOT, 'dtd', 'cc-starlist.dtd')) {
  const text = readFileSync(file, 'utf8');
  const ent = (n) => {
    const m = new RegExp(`<!ENTITY ${n.replace(/\./g, '\\.')}\\s+"([^"]*)"`).exec(text);
    if (!m) throw new Error(`cc-starlist.dtd declares no ${n}`);
    return m[1];
  };
  const names = ent('STAR.managers').split('|');
  const mgrs = names.map((n) => {
    const [binary, search, install, ceiling] = ent(`STAR.mgr.${n}`).split('|');
    return { name: n, binary, search, install, ceiling: Number(ceiling) };
  });
  return {
    managers: mgrs,
    ceilingSearch: Number(ent('STAR.ceiling.search')),
    ceilingInstall: Number(ent('STAR.ceiling.install')),
    dir: ent('STAR.dir'),
    file: ent('STAR.file'),
    session: ent('STAR.session'),
    block: Number(ent('STAR.block')),
    perRound: Number(ent('STAR.per_round')),
    laws: [...text.matchAll(/<!ENTITY (LAW\.STAR\.\d+)\s/g)].map((m) => m[1]),
  };
}

export function managers(c = contract()) { return c.managers; }

// A binary this machine does not have is absent, and absent is a result.
export function have(binary, runner = null) {
  const run = runner || ((b) => spawnSync(b, ['--version'], { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] }));
  try { const r = run(binary); return r && (r.status === 0 || r.status === 1) && !r.error; } catch { return false; }
}

export function search(query, { c = contract(), only = null, runner = null } = {}) {
  const run = runner || ((m, args, secs) => spawnSync(m.binary, args, { encoding: 'utf8', timeout: secs * 1000, stdio: ['ignore', 'pipe', 'pipe'] }));
  const out = [];
  for (const m of c.managers) {
    if (only && !only.includes(m.name)) continue;
    if (!have(m.binary, runner ? (b) => runner({ binary: b }, ['--version'], 20) : null)) { out.push({ manager: m.name, absent: true, hits: [], exit: null }); continue; }
    // The declared bound and the manager's own, whichever is tighter:
    // STAR.ceiling.search was parsed and never used (first companion pass).
    const r = run(m, [...m.search.split(' '), query], Math.min(m.ceiling, c.ceilingSearch));
    const status = r.status === null ? 124 : r.status;
    const hits = String(r.stdout || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^-+$/.test(l)).slice(0, 8);
    out.push({ manager: m.name, absent: false, exit: status, timedOut: status === 124, hits });
  }
  return out;
}

// LAW.STAR.3: the plan is what the confirmation shows. It is refused before
// the question is ever asked when a black list names the tool or its filetype.
export function installPlan(tool, managerName, { c = contract(), lists = {} } = {}) {
  const m = c.managers.find((x) => x.name === managerName);
  if (!m) return { refused: `${managerName} is not one of the declared managers (${c.managers.map((x) => x.name).join(', ')})`, line: null };
  const black = [...(lists['code-black'] || []), ...(lists['file-black'] || [])];
  const hit = black.find((r) => r.name === tool || tool.endsWith(`.${r.name}`) || tool === `.${r.name}`);
  if (hit) {
    return { refused: [`REFUSED install ${tool} via ${managerName}`, `  ${hit.scope || 'file'}-black (${hit.layer || 'repository'}) names ${hit.name}`,
      hit.reason ? `  reason: "${hit.reason}"` : null, `  to resolve: /${hit.scope || 'file'}-blacklist-dtd --drop ${hit.name}`].filter(Boolean).join('\n'), line: null };
  }
  return { refused: null, line: `${m.binary} ${m.install} ${tool}`, manager: m.name, ceiling: Math.min(c.ceilingInstall, m.ceiling * 2), shows: [`${m.binary} ${m.install} ${tool}`, `manager ${m.name}`, `ceiling ${Math.min(c.ceilingInstall, m.ceiling * 2)}s, foreground`] };
}

// LAW.STAR.4: nothing a walk can measure is ever asked.
export function measure(root, { c = contract() } = {}) {
  const exts = new Map();
  const builds = [];
  const BUILD = new Set(['package.json', 'Cargo.toml', 'CMakeLists.txt', 'pyproject.toml', 'go.mod', 'Makefile', 'build.zig', 'vcpkg.json', 'bun.lockb', 'uv.lock']);
  const walk = (dir, depth = 0) => {
    if (depth > 3) return;
    let items = [];
    try { items = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const it of items) {
      if (it.name.startsWith('.') || it.name === 'node_modules' || it.name === 'target') continue;
      if (it.isDirectory()) walk(join(dir, it.name), depth + 1);
      else {
        if (BUILD.has(it.name)) builds.push(it.name);
        const e = it.name.includes('.') ? it.name.split('.').pop().toLowerCase() : null;
        if (e) exts.set(e, (exts.get(e) || 0) + 1);
      }
    }
  };
  walk(root);
  const languages = [...exts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const toolchain = c.managers.filter((m) => have(m.binary)).map((m) => m.name);
  return { languages, builds: [...new Set(builds)], toolchain };
}

export function sessionPath(root, c = contract()) { return join(root, c.dir, c.session); }

export function readSession(root, c = contract()) {
  const p = sessionPath(root, c);
  if (!existsSync(p)) return { block: 0, rounds: 0, measured: '', rows: [] };
  const text = readFileSync(p, 'utf8');
  const head = {};
  for (const m of text.matchAll(/^- (block|rounds|measured): (.*)$/gm)) head[m[1]] = m[2].trim();
  const rows = [...text.matchAll(/^\| (\d+) \| (\d+) \| ([^|]*) \| (.*) \|$/gm)].map((m) => ({ block: Number(m[1]), round: Number(m[2]), header: m[3].trim(), answer: m[4].trim() }));
  return { block: Number(head.block || 0), rounds: Number(head.rounds || 0), measured: head.measured || '', rows };
}

export function writeSession(root, s, c = contract()) {
  const p = sessionPath(root, c);
  mkdirSync(dirname(p), { recursive: true });
  const lines = [...SPDX, '', '# The starlist session, resumable across blocks', '',
    `- block: ${s.block}`, `- rounds: ${s.rounds}`, `- measured: ${s.measured || ''}`, '',
    '| block | round | header | answer |', '|---|---|---|---|',
    ...(s.rows || []).map((r) => `| ${r.block} | ${r.round} | ${r.header} | ${String(r.answer).replace(/\|/g, '/')} |`), ''];
  writeFileSync(p, lines.join('\n'), 'utf8');
  return p;
}

// LAW.STAR.5: a block that closes unsettled opens the next one, carrying
// every answer. The blocks are unbounded; each is a declared enumeration.
export function nextBlock(s, settled, c = contract()) {
  if (settled) return { ...s, done: true };
  return { ...s, block: s.block + 1, rounds: 0, done: false, carried: (s.rows || []).length };
}

export function controls(io = console) {
  let fail = 0;
  let ran = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const c = contract();
  const tmp = mkdtempSync(join(os.tmpdir(), 'rot-dtd-star-'));

  say(c.managers.length === 6 && c.managers.every((m) => m.binary && m.search && m.install && m.ceiling > 0),
    `six managers, each declared with a binary, a search, an install and a ceiling: ${c.managers.map((m) => `${m.name}:${m.ceiling}s`).join(', ')} (LAW.STAR.1)`);
  say(c.laws.length === 6 && c.laws.every((k, i) => k === `LAW.STAR.${i + 1}`), `LAW.STAR.1 to ${c.laws.length}, dense and ascending`);

  // A manager absent from the machine is a result, not a guess.
  const absentAll = search('anything', { c, runner: () => ({ status: 127, error: new Error('not found') }) });
  say(absentAll.length === 6 && absentAll.every((r) => r.absent && r.hits.length === 0),
    `every manager absent is reported absent, with no hits invented: ${absentAll.filter((r) => r.absent).length} of 6 (LAW.STAR.2)`);

  // A search that reaches its ceiling is a timeout, never silence.
  const timed = search('x', { c, only: ['cargo'], runner: (m, a, s) => (a.includes('--version') ? { status: 0, stdout: 'ok' } : { status: null, stdout: '' }) });
  say(timed.length === 1 && timed[0].exit === 124 && timed[0].timedOut,
    `a search that reaches its ceiling is exit 124 and says so: ${timed[0].manager} exit=${timed[0].exit} (LAW.STAR.2)`);
  const hits = search('gcc', { c, only: ['scoop'], runner: (m, a) => (a.includes('--version') ? { status: 0, stdout: 'v' } : { status: 0, stdout: 'gcc 13.2\nmingw 12.0\n----\n' }) });
  say(hits[0].hits.length === 2 && hits[0].exit === 0, `a search that finds returns its hits: ${hits[0].hits.join(', ')}`);

  // The install plan shows the literal line, and a blacklisted tool never
  // reaches the confirmation.
  const plan = installPlan('msys2', 'scoop', { c, lists: {} });
  say(!plan.refused && plan.line === 'scoop install msys2' && plan.shows.length === 3 && /ceiling \d+s, foreground/.test(plan.shows[2]),
    `the confirmation shows the literal line, the manager and the ceiling: ${plan.shows.join(' | ')} (LAW.STAR.3)`);
  const refusedPlan = installPlan('gcc', 'scoop', { c, lists: { 'code-black': [{ name: 'gcc', reason: 'no C toolchain here', layer: 'repository', scope: 'code' }] } });
  say(refusedPlan.line === null && /REFUSED install gcc via scoop/.test(refusedPlan.refused) && /to resolve: \/code-blacklist-dtd --drop gcc/.test(refusedPlan.refused),
    'trip: an install of a blacklisted tool is refused before the confirmation is offered, naming the edit (LAW.STAR.3)');
  say(/not one of the declared managers/.test(installPlan('x', 'apt', { c }).refused), 'trip: an undeclared manager is refused with the six named');

  // The session record resumes.
  mkdirSync(join(tmp, c.dir), { recursive: true });
  writeSession(tmp, { block: 2, rounds: 3, measured: '41 rs, Cargo.toml', rows: [{ block: 1, round: 1, header: 'Target', answer: 'a library' }, { block: 2, round: 1, header: 'Platform', answer: 'windows, linux' }] }, c);
  const s = readSession(tmp, c);
  say(s.block === 2 && s.rounds === 3 && s.rows.length === 2 && s.rows[1].answer === 'windows, linux' && s.measured.includes('Cargo.toml'),
    `the session record round-trips the block, the answers and what the walk measured: block ${s.block}, ${s.rows.length} answers (LAW.STAR.5)`);
  const nb = nextBlock(s, false, c);
  say(nb.block === 3 && nb.carried === 2 && !nb.done, `an unsettled block opens the next one carrying every answer: block ${nb.block}, ${nb.carried} carried`);
  say(nextBlock(s, true, c).done === true, 'a settled session does not open another block');

  // The walk measures before anything is asked.
  writeFileSync(join(tmp, 'Cargo.toml'), '[package]\n', 'utf8');
  writeFileSync(join(tmp, 'a.rs'), 'fn main(){}\n', 'utf8');
  writeFileSync(join(tmp, 'b.rs'), 'fn f(){}\n', 'utf8');
  const m = measure(tmp, { c });
  const rs = m.languages.find(([e]) => e === 'rs');
  say(rs && rs[1] === 2 && m.builds.includes('Cargo.toml'),
    `the tree is measured before the first question: ${m.languages.map(([e, n]) => `${e} ${n}`).join(', ')}; builds ${m.builds.join(', ')} (LAW.STAR.4)`);

  io.log(`starlist controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  const c = contract();
  if (cmd === 'controls') process.exit(controls() ? 0 : 1);
  if (cmd === 'managers') { for (const m of c.managers) console.log(`${m.name}\t${m.binary} ${m.search}\t${m.binary} ${m.install}\t${m.ceiling}s\t${have(m.binary) ? 'present' : 'absent'}`); process.exit(0); }
  if (cmd === 'measure') { const m = measure(process.cwd(), { c }); console.log(JSON.stringify(m, null, 2)); process.exit(0); }
  if (cmd === 'search') {
    if (!rest.length) { console.log('usage: node lib/starlist.mjs search <query>'); process.exit(2); }
    for (const r of search(rest.join(' '), { c })) console.log(r.absent ? `${r.manager}: not installed on this machine` : `${r.manager}: exit ${r.exit}${r.timedOut ? ' (ceiling)' : ''}, ${r.hits.length} hits${r.hits.length ? ': ' + r.hits.slice(0, 3).join(' | ') : ''}`);
    process.exit(0);
  }
  console.log('usage: node lib/starlist.mjs managers | measure | search <query> | controls');
  process.exit(2);
}
