#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/scratch.mjs
// The scratch of /deep-scratch-dtd as code: a git worktree on a branch off
// HEAD under .claude/worktrees/<topic> (LAW.DS.1), the diff of that branch
// against its base as findings to review (LAW.DS.3), the merge of every
// file or of the marked files into the repository (LAW.DS.5), and the
// discard that removes the worktree and its branch (LAW.DS.7). Every git
// call runs in the foreground under a ceiling with its exit code read
// directly; nothing is evaluated.
//
//   open(repo, topic)                -> { path, branch, base }
//   diff(repo, branch, base)         -> [{ file, added, deleted, status }]
//   mergeAll(repo, branch)           -> { ok, out }
//   mergeMarked(repo, branch, paths, base, force) -> { ok, out, refused }
//   revert(repo, base, paths)        -> { ok, out } the red-gate path (LAW.DS.5)
//   discard(repo, topic)             -> { ok, out }
//   controls()                       -> a temp repository walked through all of it
//
//   node lib/scratch.mjs open <topic> | diff <topic> | merge-all <topic> | merge <topic> <path...> | revert <base> [path...] | discard <topic> | controls
//   (the repository is the working directory)

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync, readFileSync, mkdtempSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// SCRATCH.ceiling of commands/deep-scratch-dtd.md (LAW.DS.2); the control below holds the two together.
export const CEILING_S = 300;
export const TOPIC = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function git(repo, args) {
  const r = spawnSync('git', ['-c', 'core.autocrlf=false', ...args], { cwd: repo, encoding: 'utf8', timeout: CEILING_S * 1000, stdio: ['ignore', 'pipe', 'pipe'] });
  return { status: r.status === null ? 124 : r.status, out: (r.stdout || '') + (r.stderr || '') };
}

export function worktreePath(repo, topic) { return join(repo, '.claude', 'worktrees', topic); }
export function branchOf(topic) { return `scratch/${topic}`; }

export function open(repo, topic) {
  if (!TOPIC.test(String(topic || ''))) throw new Error(`scratch: topic "${topic}" is not lower-case letters, digits and hyphens`);
  const path = worktreePath(repo, topic);
  if (existsSync(path)) throw new Error(`scratch: ${path} exists; discard it or pick another topic`);
  const head = git(repo, ['rev-parse', 'HEAD']);
  if (head.status !== 0) throw new Error(`scratch: not a repository with a HEAD: ${head.out.trim()}`);
  mkdirSync(join(repo, '.claude', 'worktrees'), { recursive: true });
  const r = git(repo, ['worktree', 'add', '-b', branchOf(topic), path, 'HEAD']);
  if (r.status !== 0) throw new Error(`scratch: worktree add failed (${r.status}): ${r.out.trim()}`);
  return { path, branch: branchOf(topic), base: head.out.trim() };
}

export function diff(repo, branch, base = 'HEAD') {
  const r = git(repo, ['diff', '--numstat', `${base}...${branch}`]);
  if (r.status !== 0) throw new Error(`scratch: diff failed (${r.status}): ${r.out.trim()}`);
  const names = git(repo, ['diff', '--name-status', `${base}...${branch}`]).out;
  const status = new Map(names.split('\n').filter(Boolean).map((l) => { const [s, ...f] = l.split('\t'); return [f.join('\t'), s.trim()[0]]; }));
  return r.out.split('\n').filter(Boolean).map((l) => {
    const [a, d, ...f] = l.split('\t');
    const file = f.join('\t');
    return { file, added: a === '-' ? 0 : Number(a), deleted: d === '-' ? 0 : Number(d), status: status.get(file) || 'M' };
  });
}

export function mergeAll(repo, branch) {
  const r = git(repo, ['merge', '--no-ff', '--no-edit', branch]);
  return { ok: r.status === 0, out: r.out.trim() };
}

// A marked merge is a checkout over the working tree. When the repository has
// moved on since the scratch was opened, or carries uncommitted work in a
// marked path, that checkout overwrites work the scratch never saw. Every such
// path is refused by name and nothing is written unless force says otherwise
// (LAW.DS.5). Measured during the live exercise of 5.1.0: the main tree held a
// newer lib/scratch.mjs than the branch, and only a deliberate choice not to
// mark it kept the work.
export function mergeMarked(repo, branch, paths, base = null, force = false) {
  if (!paths || !paths.length) return { ok: false, out: 'no path marked', refused: [] };
  const refused = [];
  if (!force) {
    for (const p of paths) {
      const dirty = git(repo, ['diff', '--quiet', 'HEAD', '--', p]).status !== 0 || git(repo, ['diff', '--quiet', '--cached', 'HEAD', '--', p]).status !== 0;
      const moved = base ? git(repo, ['diff', '--quiet', base, 'HEAD', '--', p]).status !== 0 : false;
      if (dirty) refused.push(`${p}: the working tree carries uncommitted work the scratch never saw`);
      else if (moved) refused.push(`${p}: the repository moved since the scratch was opened`);
    }
  }
  if (refused.length) return { ok: false, refused, out: ['refusing to overwrite:', ...refused, 'commit or stash them, or merge with force once you have read the difference'].join('\n') };
  const r = git(repo, ['checkout', branch, '--', ...paths]);
  return { ok: r.status === 0, out: r.out.trim(), refused: [] };
}

// The red-gate path of LAW.DS.5: put the repository back to its base after a
// merge the project gate refused. With no paths, the whole merge is undone
// (reset --hard). With paths, each is restored from the base when the base had
// it and removed when it did not, so a file the merge introduced does not
// survive a revert as an untracked leftover.
export function revert(repo, base, paths = null) {
  if (!paths || !paths.length) {
    const r = git(repo, ['reset', '--hard', base]);
    return { ok: r.status === 0, out: r.out.trim() };
  }
  const out = [];
  let ok = true;
  for (const p of paths) {
    const known = git(repo, ['cat-file', '-e', `${base}:${p}`]).status === 0;
    const r = known ? git(repo, ['checkout', base, '--', p]) : git(repo, ['rm', '-q', '-f', '--ignore-unmatch', p]);
    if (r.status !== 0) { ok = false; out.push(`${p}: ${r.out.trim()}`); }
    else out.push(`${p}: ${known ? 'restored from the base' : 'removed, the base did not have it'}`);
  }
  return { ok, out: out.join('\n') };
}

export function discard(repo, topic) {
  const path = worktreePath(repo, topic);
  const a = git(repo, ['worktree', 'remove', '--force', path]);
  const b = git(repo, ['branch', '-D', branchOf(topic)]);
  return { ok: a.status === 0 && b.status === 0 && !existsSync(path), out: (a.out + b.out).trim() };
}

export function controls(io = console) {
  let fail = 0;
  let ran = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const repo = mkdtempSync(join(os.tmpdir(), 'rot-dtd-scratch-'));
  const saved = {};
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_NAME', 'GIT_COMMITTER_EMAIL']) { saved[k] = process.env[k]; process.env[k] = k.endsWith('EMAIL') ? 'control@example.invalid' : 'control'; }
  const g = (args, cwd = repo) => git(cwd, args);
  try {
    g(['init', '-q', '-b', 'main']);
    writeFileSync(join(repo, 'a.txt'), 'one\n', 'utf8');
    writeFileSync(join(repo, 'b.txt'), 'two\n', 'utf8');
    g(['add', '.']);
    g(['commit', '-q', '-m', 'base']);
    let threw = '';
    try { open(repo, 'Bad Topic'); } catch (e) { threw = e.message; }
    say(/not lower-case/.test(threw), 'trip: a topic with a space or a capital is refused before any git call');
    const s = open(repo, 'trial');
    say(existsSync(s.path) && s.branch === 'scratch/trial' && /^[0-9a-f]{40}$/.test(s.base), `a worktree opens on scratch/trial off HEAD under .claude/worktrees`);
    writeFileSync(join(s.path, 'a.txt'), 'one\nchanged\n', 'utf8');
    writeFileSync(join(s.path, 'c.txt'), 'new file\n', 'utf8');
    g(['add', '.'], s.path);
    g(['commit', '-q', '-m', 'scratch work'], s.path);
    const d = diff(repo, s.branch, s.base);
    const a = d.find((x) => x.file === 'a.txt');
    const c = d.find((x) => x.file === 'c.txt');
    say(d.length === 2 && a && a.added === 1 && a.deleted === 0 && a.status === 'M' && c && c.status === 'A' && c.added === 1, `the diff is two findings with counts: ${JSON.stringify(d)}`);
    const m = mergeMarked(repo, s.branch, ['c.txt'], s.base);
    say(m.ok && existsSync(join(repo, 'c.txt')) && readFileSync(join(repo, 'a.txt'), 'utf8') === 'one\n', 'merge marked brings c.txt and leaves a.txt as it was');
    writeFileSync(join(repo, 'b.txt'), 'two\nedited in the main tree\n', 'utf8');
    const guarded = mergeMarked(repo, s.branch, ['b.txt'], s.base);
    const forced = mergeMarked(repo, s.branch, ['b.txt'], s.base, true);
    say(!guarded.ok && guarded.refused.length === 1 && /uncommitted work/.test(guarded.refused[0]) && forced.ok, `trip: a marked merge refuses a path the main tree has edited (${guarded.refused[0] || 'nothing refused'}), and force merges it anyway`);
    g(['checkout', '--', 'b.txt']);
    // Back to the base first: the guard above and the merge before it left b.txt and
    // c.txt staged, and the guard would rightly refuse them as uncommitted work.
    g(['reset', '-q', '--hard', 'HEAD']);
    rmSync(join(repo, 'c.txt'), { force: true });
    const m2 = mergeMarked(repo, s.branch, ['a.txt', 'c.txt'], s.base);
    const rv = revert(repo, s.base, ['a.txt', 'c.txt']);
    const backA = readFileSync(join(repo, 'a.txt'), 'utf8') === 'one\n';
    const goneC = !existsSync(join(repo, 'c.txt'));
    // The scratch worktree lives under .claude/ inside the repository, so a global
    // status carries `?? .claude/` by construction; the question is whether the
    // reverted paths and the tree against the base are clean.
    const cleanIdx = g(['status', '--porcelain', '--', 'a.txt', 'b.txt', 'c.txt']).out.trim() === '' && g(['diff', '--name-only', s.base]).out.trim() === '';
    say(m2.ok && rv.ok && backA && goneC && cleanIdx, `a red gate after a marked merge reverts to the base: a.txt restored=${backA}, the new c.txt removed=${goneC}, index and tree clean=${cleanIdx}`);
    g(['reset', '-q', '--hard', 'HEAD']);
    rmSync(join(repo, 'c.txt'), { force: true });
    const all = mergeAll(repo, s.branch);
    say(all.ok && readFileSync(join(repo, 'a.txt'), 'utf8') === 'one\nchanged\n' && existsSync(join(repo, 'c.txt')), `merge all lands both files: ${all.out.split('\n')[0]}`);
    const rv2 = revert(repo, s.base);
    const atBase = g(['rev-parse', 'HEAD']).out.trim() === s.base;
    const restored = readFileSync(join(repo, 'a.txt'), 'utf8') === 'one\n' && !existsSync(join(repo, 'c.txt'));
    say(rv2.ok && atBase && restored, `a red gate after merge-all reverts the whole merge: HEAD back at the base=${atBase}, both files as they were=${restored}`);
    const x = discard(repo, 'trial');
    const gone = g(['branch', '--list', 'scratch/trial']).out.trim() === '';
    say(x.ok && gone, 'discard removes the worktree and the branch');
    let again = '';
    try { open(repo, 'trial'); discard(repo, 'trial'); again = 'reopened'; } catch (e) { again = e.message; }
    say(again === 'reopened', 'the topic can be opened again after a discard');
    const cmd = join(dirname(fileURLToPath(import.meta.url)), '..', 'commands', 'deep-scratch-dtd.md');
    const declared = existsSync(cmd) ? (readFileSync(cmd, 'utf8').match(/SCRATCH\.ceiling\s+"(\d+)"/) || [])[1] : null;
    say(declared !== null && Number(declared) === CEILING_S, `the declared SCRATCH.ceiling (${declared}) is the ceiling this library runs under (${CEILING_S})`);
  } finally {
    for (const k of Object.keys(saved)) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
    try { rmSync(repo, { recursive: true, force: true }); } catch { /* a temp directory */ }
  }
  io.log(`scratch controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, topic, ...rest] = process.argv.slice(2);
  const repo = process.cwd();
  try {
    if (cmd === 'controls') process.exit(controls() ? 0 : 1);
    if (cmd === 'open') { const s = open(repo, topic); console.log(JSON.stringify(s)); process.exit(0); }
    if (cmd === 'diff') { console.log(JSON.stringify(diff(repo, branchOf(topic)), null, 2)); process.exit(0); }
    if (cmd === 'merge-all') { const r = mergeAll(repo, branchOf(topic)); console.log(r.out); process.exit(r.ok ? 0 : 1); }
    if (cmd === 'merge') { const force = rest.includes('--force'); const paths = rest.filter((x) => x !== '--force'); const r = mergeMarked(repo, branchOf(topic), paths, null, force); console.log(r.out || `merged ${paths.length} path(s)`); process.exit(r.ok ? 0 : 1); }
    if (cmd === 'discard') { const r = discard(repo, topic); console.log(r.out || 'discarded'); process.exit(r.ok ? 0 : 1); }
    if (cmd === 'revert') { const r = revert(repo, topic, rest); console.log(r.out || 'reverted'); process.exit(r.ok ? 0 : 1); }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  console.log('usage: node lib/scratch.mjs open <topic> | diff <topic> | merge-all <topic> | merge <topic> <path...> | revert <base> [path...] | discard <topic> | controls');
  process.exit(2);
}
