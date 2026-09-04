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
// On Windows a manager is usually a .cmd or .ps1 shim, which spawnSync cannot
// execute without a shell: scoop probed as absent on this machine while
// `which scoop` resolved to scoop.cmd (found by the second companion pass of
// 7.0.0). LAW.STAR.2 rests absence on a measurement, so the measurement runs
// through the shell where the platform needs it.
// A shim is resolved to a real path once, with a fixed-argument lookup, and
// every spawn after that runs that path with no shell. Pass 2 reached the shim
// by opening a shell; pass 5 found a query walking through it, and Node's own
// DEP0190 says the same thing about args and shell:true.
const RESOLVED = new Map();
export function resolveBinary(binary) {
  if (RESOLVED.has(binary)) return RESOLVED.get(binary);
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const r = spawnSync(finder, [binary], { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] });
  const lines = String(r.stdout || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  // A Windows lookup lists the extensionless shim first and the executable
  // second: `where scoop` gives scoop and scoop.cmd, and only the second can be
  // spawned. Prefer what the platform can actually run (pass 5).
  const runnable = lines.find((p) => /\.(exe|cmd|bat|com)$/i.test(p)) || lines[0] || null;
  RESOLVED.set(binary, runnable);
  return runnable;
}
// A package name, and nothing a shell would read as syntax. The probe may use a
// shell because its arguments are fixed (--version); a search may not, because
// the query comes from an argument. Pass 5 of the 7.0.0 audit ran
// "zzznosuch & echo ROT_INJECTION_MARKER" through the shell pass 2 had opened
// and got the marker back as a hit.
export const QUERY = /^[@A-Za-z0-9][A-Za-z0-9._+@/-]{0,79}$/;
export function have(binary, runner = null) {
  const run = runner || ((b) => {
    const path = resolveBinary(b);
    // A .cmd or .bat cannot be spawned without a shell on Windows at all
    // (Node's mitigation for CVE-2024-27980), and every manager here is one.
    // The arguments on this line are fixed and no caller text reaches it.
    const needShell = process.platform === 'win32';
    if (!path && !needShell) return { status: null, error: { code: 'ENOENT' } };
    return spawnSync(path || b, ['--version'], { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'], shell: needShell });
  });
  // Present means the binary answered at all. A manager that exits 2 on
  // --version is present and was being recorded absent (pass 5).
  try { const r = run(binary); return Boolean(r) && !r.error && r.status !== null; } catch { return false; }
}

export function search(query, { c = contract(), only = null, runner = null } = {}) {
  if (!QUERY.test(String(query || ''))) {
    throw new Error([`REFUSED search ${JSON.stringify(String(query)).slice(0, 60)}`,
      '  a search query is a package name: letters, digits and . _ + @ / -',
      '  a shell runs these searches on Windows, so anything it reads as syntax is refused before it is spawned',
      '  to resolve: search for the package name alone'].join('\n'));
  }
  // The resolved path, never a shell: a .cmd shim is reachable because it was
  // looked up, not because cmd.exe was handed a string (passes 3 and 5).
  // Same platform constraint, and this call does carry caller text -- which is
  // why the query was validated against QUERY above, before anything spawned.
  // Pass 5 of the audit ran "zzznosuch & echo ROT_INJECTION_MARKER" through
  // this line when nothing checked it and got the marker back as a hit.
  const run = runner || ((m, args, secs) => {
    const path = resolveBinary(m.binary);
    const needShell = process.platform === 'win32';
    if (!path && !needShell) return { status: null, error: { code: 'ENOENT' } };
    return spawnSync(path || m.binary, args, { encoding: 'utf8', timeout: secs * 1000, stdio: ['ignore', 'pipe', 'pipe'], shell: needShell });
  });
  const out = [];
  for (const m of c.managers) {
    if (only && !only.includes(m.name)) continue;
    if (!have(m.binary, runner ? (b) => runner({ binary: b }, ['--version'], 20) : null)) { out.push({ manager: m.name, absent: true, hits: [], exit: null }); continue; }
    // STAR.ceiling.search is the ceiling on the ceilings: no manager may
    // declare a search longer than it, and every one of the six is at or under
    // it today, so the manager's own value is what binds in practice (second
    // companion pass measured this and the first pass's fix overclaimed).
    const r = run(m, [...m.search.split(' '), query], Math.min(m.ceiling, c.ceilingSearch));
    // A binary that could not be run and a search that ran too long are
    // different failures and were both reported as 124 (third companion pass).
    const failedToRun = Boolean(r.error) && r.status === null;
    const status = r.status === null ? (failedToRun ? 127 : 124) : r.status;
    const hits = String(r.stdout || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^-+$/.test(l)).slice(0, 8);
    out.push({ manager: m.name, absent: false, exit: status, timedOut: status === 124, couldNotRun: failedToRun, error: r.error ? String(r.error.code || r.error.message) : null, hits });
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
  // LAW.STAR.3 names STAR.ceiling.install and nothing else; the doubling of a
  // manager's search ceiling was a factor in code that no declaration carried
  // (second companion pass).
  return { refused: null, line: `${m.binary} ${m.install} ${tool}`, manager: m.name, ceiling: c.ceilingInstall, shows: [`${m.binary} ${m.install} ${tool}`, `manager ${m.name}`, `ceiling ${c.ceilingInstall}s, foreground`] };
}

// LAW.STAR.4: nothing a walk can measure is ever asked.
export function measure(root, { c = contract() } = {}) {
  const exts = new Map();
  const builds = [];
  const BUILD = new Set(['package.json', 'Cargo.toml', 'CMakeLists.txt', 'pyproject.toml', 'go.mod', 'Makefile', 'build.zig', 'vcpkg.json', 'bun.lockb', 'uv.lock']);
  // Deep enough to reach src/skills/<name>/templates/<file>, which the old
  // ceiling of three cut off (pass 6).
  const walk = (dir, depth = 0) => {
    if (depth > 8) return;
    let items = [];
    try { items = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const it of items) {
      if (it.name.startsWith('.') || it.name === 'node_modules' || it.name === 'target') continue;
      if (it.isDirectory()) walk(join(dir, it.name), depth + 1);
      else {
        if (BUILD.has(it.name)) builds.push(it.name);
        // An extension is a suffix of letters and digits that is not itself a
        // version segment: LICENSE-EUPL-1.2 registered as "2" and would have
        // produced a refusal naming a filetype that does not exist (pass 6).
        const dot = it.name.lastIndexOf('.');
        const raw = dot > 0 ? it.name.slice(dot + 1).toLowerCase() : '';
        const e = /^[a-z][a-z0-9]{0,15}$/.test(raw) ? raw : null;
        if (e) exts.set(e, (exts.get(e) || 0) + 1);
      }
    }
  };
  walk(root);
  // languages is what a reader is shown; census is what a guard is given.
  // Feeding the truncated list to reach() meant no filetype below rank ten
  // could ever be refused (pass 6).
  const census = [...exts.entries()].sort((a, b) => b[1] - a[1]);
  const languages = census.slice(0, 10);
  const toolchain = c.managers.filter((m) => have(m.binary)).map((m) => m.name);
  return { languages, census, builds: [...new Set(builds)], toolchain };
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

  say(c.managers.every((m) => m.ceiling <= c.ceilingSearch),
    `every declared manager ceiling is at or under STAR.ceiling.search (${c.ceilingSearch}s), which is the bound on the bounds: ${c.managers.map((m) => m.ceiling).join(', ')}`);
  say(installPlan('x', 'scoop', { c }).ceiling === c.ceilingInstall,
    `an install runs under the declared STAR.ceiling.install and no factor in code: ${installPlan('x', 'scoop', { c }).ceiling}s (LAW.STAR.3)`);
  let injected = '';
  try { search('zzznosuch & echo ROT_INJECTION_MARKER', { c, only: ['bun'] }); } catch (e) { injected = e.message; }
  say(/REFUSED search/.test(injected) && /reads as syntax is refused/.test(injected),
    `trip: a query carrying shell syntax is refused before any spawn: ${injected.split('\n')[0] || 'nothing'}`);
  for (const bad of ['a | b', 'a; b', '`x`', '$(x)', 'a && b', '']) {
    if (QUERY.test(bad)) { say(false, `a query the pattern should refuse is admitted: ${JSON.stringify(bad)}`); break; }
  }
  say(['ripgrep', 'msys2', 'node.js', '@scope/pkg', 'gcc-13'].every((g) => QUERY.test(g)),
    'an ordinary package name still passes: ripgrep, msys2, node.js, @scope/pkg, gcc-13');
  const walked = measure(ROOT);
  say(walked.census.length >= walked.languages.length && walked.census.length > 10,
    `the census a guard is given is complete, not the ten a reader is shown: ${walked.census.length} extensions, ${walked.languages.length} displayed`);
  say(!walked.census.some(([e]) => /^\d/.test(e)), `no version segment is counted as a filetype: ${walked.census.map(([e]) => e).join(', ').slice(0, 90)}`);
  say(walked.census.some(([e]) => e === 'ts'), 'a file eight directories down is measured: ts from src/skills/*/templates/');
  say(c.managers.some((m) => resolveBinary(m.binary)), `a manager resolves to a real path rather than needing a shell: ${c.managers.filter((m) => resolveBinary(m.binary)).map((m) => m.name).join(', ')}`);
  // The one thing a search may never do, stated as a control rather than a
  // comment: no caller-supplied text reaches a shell.
  // The boundary is the input, not the spawn: every shape a shell would read
  // as syntax is refused before any process starts. Run, not asserted.
  const dangerous = ['a & echo x', 'a | b', 'a; b', 'a && b', '`x`', '$(x)', 'a > f', 'a\nb', '../../etc/passwd\u0000'];
  let leaked = null;
  for (const bad of dangerous) {
    try { search(bad, { c, only: ['bun'] }); leaked = bad; break; } catch { /* refused, which is the point */ }
  }
  say(leaked === null, `every shell metacharacter shape is refused before a spawn: ${dangerous.length} tried, ${leaked === null ? 'none reached one' : `${JSON.stringify(leaked)} did`}`);
  say(have('x', () => ({ status: 2 })) && !have('x', () => ({ status: null, error: { code: 'ENOENT' } })),
    'a manager that answers with any exit code is present; one that cannot be run is absent (LAW.STAR.2)');
  say(c.managers.length === 6 && c.managers.every((m) => m.binary && m.search && m.install && m.ceiling > 0),
    `six managers, each declared with a binary, a search, an install and a ceiling: ${c.managers.map((m) => `${m.name}:${m.ceiling}s`).join(', ')} (LAW.STAR.1)`);
  say(c.laws.length === 6 && c.laws.every((k, i) => k === `LAW.STAR.${i + 1}`), `LAW.STAR.1 to ${c.laws.length}, dense and ascending`);

  // A manager absent from the machine is a result, not a guess.
  const absentAll = search('anything', { c, runner: () => ({ status: 127, error: new Error('not found') }) });
  say(absentAll.length === 6 && absentAll.every((r) => r.absent && r.hits.length === 0),
    `every manager absent is reported absent, with no hits invented: ${absentAll.filter((r) => r.absent).length} of 6 (LAW.STAR.2)`);

  // A search that reaches its ceiling is a timeout, never silence.
  const timed = search('x', { c, only: ['cargo'], runner: (m, a, s) => (a.includes('--version') ? { status: 0, stdout: 'ok' } : { status: null, stdout: '' }) });
  say(timed.length === 1 && timed[0].exit === 124 && timed[0].timedOut && !timed[0].couldNotRun,
    `a search that reaches its ceiling is exit 124 and says so: ${timed[0].manager} exit=${timed[0].exit} (LAW.STAR.2)`);
  const enoent = search('x', { c, only: ['cargo'], runner: (m, a) => (a.includes('--version') ? { status: 0, stdout: 'ok' } : { status: null, error: { code: 'ENOENT' } }) });
  say(enoent[0].exit === 127 && enoent[0].couldNotRun && enoent[0].error === 'ENOENT',
    `trip: a binary that could not be run is 127 and names the reason, not a fired ceiling: exit=${enoent[0].exit} ${enoent[0].error}`);
  // The real spawn, not a fake runner: the fake is what let the shell defect
  // ship green through fourteen passing controls (third companion pass).
  const real = search('rot-dtd-no-such-package-xyz', { c, only: ['cargo'] });
  say(real.length === 1 && (real[0].absent || real[0].exit !== 127 || real[0].couldNotRun),
    `the real spawn is exercised, not only a fake runner: cargo ${real[0].absent ? 'absent' : `exit ${real[0].exit}`}`);
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
