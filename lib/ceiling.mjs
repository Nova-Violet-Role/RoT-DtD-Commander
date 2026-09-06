#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/ceiling.mjs <seconds> <command> [args...]
// A ceiling that exists on every leg. GNU timeout(1) is absent on the macOS
// runner, so a checker that calls it there fails before it measures anything,
// and a ceiling that silently vanishes with the platform is a guard that
// cannot trip (LAW.XOS.5). This one spawns the command in the foreground with
// stdio inherited, kills it when the seconds run out, and exits with the same
// code timeout(1) uses for that, XOS.exit.ceiling, 124; otherwise the child's
// own code, or 128 plus its signal.
//
//   node lib/ceiling.mjs 60 node lib/x.mjs controls
//   node lib/ceiling.mjs controls        trip it on purpose, both directions

import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { constants } from 'node:os';

export const CEILING_EXIT = 124;

// onSpawn hands the child to a caller that needs it; the signal control below
// is the one caller, and it exists because the third companion pass found the
// signal line read by nobody and tripped by nothing.
export function runUnder(seconds, cmd, args, { stdio = 'inherit', onSpawn = null } = {}) {
  return new Promise((done) => {
    const win = process.platform === 'win32';
    // On Windows a manager is usually a .cmd shim (npm, npx), which spawn cannot
    // exec without a shell; the shell is used for that one shape and no other,
    // with every argument quoted whole.
    let exe = cmd;
    if (win && !/\.[a-z]+$/i.test(cmd)) {
      const w = spawnSync('where', [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const hit = String(w.stdout || '').split(/\r?\n/).map((s) => s.trim()).find((s) => /\.(cmd|bat)$/i.test(s));
      if (hit && !String(w.stdout || '').split(/\r?\n/).some((s) => /\.exe$/i.test(s.trim()))) exe = hit;
    }
    const viaShell = win && /\.(cmd|bat)$/i.test(exe);
    const child = viaShell
      ? spawn(`"${exe}" ${args.map((a) => `"${String(a).replace(/"/g, '\\"')}"`).join(' ')}`, { stdio, shell: true })
      : spawn(exe, args, { stdio });
    if (onSpawn) onSpawn(child);
    let fired = false;
    const timer = setTimeout(() => {
      fired = true;
      // The tree, not only the root: on Windows a killed node leaves its
      // children alive, and a ceiling that leaves the work running has not
      // fired at all.
      if (win) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else { try { child.kill('SIGKILL'); } catch { /* already gone */ } }
    }, seconds * 1000);
    child.on('error', (e) => { clearTimeout(timer); done({ code: 127, fired: false, error: String(e.message || e) }); });
    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      if (fired) return done({ code: CEILING_EXIT, fired: true });
      done({ code: code === null ? 128 + ((constants.signals || {})[signal] || 0) : code, fired: false });
    });
  });
}

export async function controls(io = console) {
  let ran = 0;
  let fail = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const me = fileURLToPath(import.meta.url);
  // The signal branch, tripped: a child killed with SIGTERM before its ceiling
  // exits 128 plus the signal's own number, 143 on every leg (Windows reports
  // the kill as code null, signal SIGTERM, measured), never the flat 137 the
  // old line gave every signal.
  const term = (constants.signals || {}).SIGTERM || 15;
  const killed = await runUnder(30, process.execPath, ['-e', 'setTimeout(function(){}, 8000)'], { stdio: 'ignore', onSpawn: (ch) => setTimeout(() => { try { ch.kill('SIGTERM'); } catch { /* gone */ } }, 300) });
  say(!killed.fired && killed.code === 128 + term, `trip: a child killed with SIGTERM under its ceiling exits 128 plus ${term}: ${killed.code}, ceiling fired ${killed.fired}`);
  const t0 = Date.now();
  const slow = spawnSync(process.execPath, [me, '1', process.execPath, '-e', 'setTimeout(function(){}, 8000)'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const took = (Date.now() - t0) / 1000;
  say(slow.status === CEILING_EXIT && took < 6, `trip: a command that outlives its one-second ceiling exits ${CEILING_EXIT} in ${took.toFixed(1)} s, never runs to its own end (LAW.XOS.5)`);
  const quick = spawnSync(process.execPath, [me, '5', process.execPath, '-e', 'process.exit(3)'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(quick.status === 3, `a command that ends under its ceiling keeps its own exit code: ${quick.status}`);
  const zero = spawnSync(process.execPath, [me, '5', process.execPath, '-e', 'process.exit(0)'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(zero.status === 0, 'a command that succeeds under its ceiling exits 0');
  const bad = spawnSync(process.execPath, [me, 'x'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(bad.status === 2 && /usage/.test(bad.stderr), 'a call without a command or with a non-numeric ceiling is refused with the usage, exit 2');
  const npm = spawnSync(process.execPath, [me, '60', 'npm', '--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(npm.status === 0 && /^\d+\./.test(String(npm.stdout).trim()), `a manager that is a .cmd shim on Windows runs under the ceiling too: npm ${String(npm.stdout).trim() || npm.stderr.slice(0, 60)}`);
  const gone = spawnSync(process.execPath, [me, '5', 'no-such-binary-on-any-leg-8b3c'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(gone.status === 127, `a command that cannot be spawned exits 127, the shell's own code for it: ${gone.status}`);
  io.log(`ceiling controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [secs, cmd, ...args] = process.argv.slice(2);
  if (secs === 'controls') {
    controls().then((ok) => process.exit(ok ? 0 : 1));
  } else {
    const s = Number(secs);
    if (!cmd || !(s > 0)) {
      console.error('usage: node lib/ceiling.mjs <seconds> <command> [args...] | controls');
      process.exit(2);
    }
    runUnder(s, cmd, args).then((r) => {
      if (r.error) console.error(`ceiling: cannot run ${cmd}: ${r.error}`);
      if (r.fired) console.error(`ceiling: ${cmd} reached the ${s} s ceiling, exit ${CEILING_EXIT}`);
      process.exit(r.code);
    });
  }
}
