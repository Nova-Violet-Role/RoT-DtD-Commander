#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/cross-os.mjs
// The three legs of dtd/cross-os.dtd as code: the local substrates probed
// and never guessed (LAW.XOS.1), the forbidden shell forms swept out of the
// gate's own instruments (LAW.XOS.4), and the workflow matrix held to the
// declared legs (LAW.XOS.6). Every list this module reads comes from the
// subset; a leg, a substrate or a form added there is honoured on the next
// run without a line of code here.
//
//   contract()                 the legs, the locals, the forms and the laws, read from the subset
//   probe()                    every local substrate, foreground, under XOS.ceiling.probe, rows read not exits
//   sweep()                    every checker script and workflow run line, refused by form, file and line
//   matrix(text)               the gate job's runs-on and matrix against XOS.legs
//   controls()                 every law tripped on purpose
//
//   node lib/cross-os.mjs probe | sweep | matrix --check | controls

import { readFileSync, readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = join(ROOT, 'dtd', 'cross-os.dtd');

export function contract(path = DTD) {
  const text = readFileSync(path, 'utf8');
  const ent = (name) => {
    const m = new RegExp(`<!ENTITY ${name.replace(/[.-]/g, '\\$&')}\\s+"([^"]*)"`).exec(text);
    if (!m) throw new Error(`cross-os.dtd declares no ${name}`);
    return m[1];
  };
  const legs = ent('XOS.legs').split('|');
  const locals = ent('XOS.locals').split('|').map((name) => {
    const [binary, probe, meaning] = ent(`XOS.local.${name}`).split('|');
    return { name, binary, probe, meaning };
  });
  const gnu = ent('XOS.gnu').split('|').map((name) => {
    const [form, lacks, portable] = ent(`XOS.gnu.${name}`).split('|');
    return { name, form, lacks, portable };
  });
  const enumLegs = ((/<!ENTITY % xos\.leg\s+"\(([^)]*)\)"/.exec(text) || [, ''])[1]).split('|').filter(Boolean);
  return {
    legs, legsCount: Number(ent('XOS.legs.count')), enumLegs,
    locals, localsCount: Number(ent('XOS.locals.count')),
    gnu, gnuCount: Number(ent('XOS.gnu.count')),
    macosHost: ent('XOS.macos.host'), macosLocal: ent('XOS.macos.local'),
    ceilingProbe: Number(ent('XOS.ceiling.probe')), exitCeiling: Number(ent('XOS.exit.ceiling')),
    laws: [...text.matchAll(/<!ENTITY (LAW\.XOS\.\d+)\s/g)].map((m) => m[1]),
    lawText: new Map([...text.matchAll(/<!ENTITY (LAW\.XOS\.\d+)\s+"([^"]*)"/g)].map((m) => [m[1], m[2]])),
  };
}

// ---------- LAW.XOS.1: the substrates, probed ----------
// A binary is found the way a shell finds it, so a manager shim on Windows
// (.cmd, .exe) resolves; the probe then runs in the foreground under the
// declared ceiling and its ROWS are read. podman answers exit 0 with a
// header and no machine: that is absent.
function have(binary) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [binary], { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'] });
  return r.status === 0 && String(r.stdout || '').trim().length > 0;
}

export function legOfHost() {
  const env = process.env;
  if (env.XOS_LEG) return { leg: env.XOS_LEG, how: 'declared by the workflow (XOS_LEG)' };
  const by = { linux: 'ubuntu-latest', darwin: 'macos-latest', win32: 'windows-latest' };
  return { leg: by[process.platform] || 'unknown', how: `derived from process.platform ${process.platform}` };
}

export function probe({ c = contract(), runner = spawnSync } = {}) {
  const out = [];
  for (const l of c.locals) {
    if (!have(l.binary)) { out.push({ name: l.name, kind: 'local', present: 'no', probe: l.probe, rows: 0, exit: null, why: `no ${l.binary} on this machine` }); continue; }
    const [cmd, ...args] = l.probe.split(' ');
    const r = runner(cmd, args, { encoding: 'utf8', timeout: c.ceilingProbe * 1000, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
    const text = (String(r.stdout || '') + String(r.stderr || '')).replace(/\x00/g, '');
    const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    let present = 'no';
    let rows = 0;
    let why = '';
    if (l.name === 'podman') {
      // The header is a row of column names; a machine is any row after it.
      rows = Math.max(0, lines.filter((x) => !/^NAME\s+VM TYPE/i.test(x)).length);
      present = r.status === 0 && rows > 0 ? 'yes' : 'no';
      why = r.status === 0 && rows === 0 ? 'exit 0 with a header and zero machine rows: absent (LAW.XOS.1)' : `exit ${r.status}, ${rows} machine row(s)`;
    } else if (l.name === 'wsl2') {
      present = r.status === 0 && !/not installed|no est/i.test(text) ? 'yes' : 'no';
      rows = lines.length;
      why = `exit ${r.status}: ${lines[0] || 'no output'}`;
    } else {
      present = r.status === 0 ? 'yes' : 'no';
      rows = lines.length;
      why = `exit ${r.status}: ${lines[0] || 'no output'}`;
    }
    out.push({ name: l.name, kind: 'local', present, probe: l.probe, rows, exit: r.status, why });
  }
  const host = legOfHost();
  return { host, substrates: out, macos: { host: c.macosHost, local: c.macosLocal } };
}

// ---------- LAW.XOS.4: the forms, swept ----------
// A form counts when it is executed: the first word of a command segment
// (split on &&, ||, ; and |), or a flag on a grep, stat or sed in that
// segment. A comment, a quoted description of the form, and a name inside a
// string a nested session receives are not executions.
const FORM = {
  timeout: (seg) => /^timeout\s+[0-9"$]/.test(seg),
  mapfile: (seg) => /^mapfile\b/.test(seg),
  'grep-P': (seg) => /^grep\b/.test(seg) && /\s-[a-zA-Z]*P/.test(seg),
  'grep-U': (seg) => /^grep\b/.test(seg) && /\s-[a-zA-Z]*U/.test(seg),
  'stat-c': (seg) => /^stat\s+-[a-zA-Z]*c\b/.test(seg),
  sha256sum: (seg) => /^sha256sum\b/.test(seg),
  'sed-n': (seg) => /^sed\b/.test(seg) && /\\n/.test(seg),
};

function segments(line) {
  // strip a trailing comment, then split on the shell separators and the
  // openings of a substitution
  const noComment = line.replace(/(^|\s)#.*$/, '');
  return noComment.split(/&&|\|\||;|\||\$\(|`/).map((s) => s.replace(/^[(\s]+/, '').replace(/^(?:[A-Za-z_]\w*=\S*\s+)+/, '').trim()).filter(Boolean);
}

export function sweepText(text, file, c = contract()) {
  const out = [];
  const lines = text.split('\n');
  const yml = /\.ya?ml$/.test(file);
  let inRun = false;
  let runIndent = -1;
  lines.forEach((raw, i) => {
    let line = raw;
    if (yml) {
      const m = /^(\s*)(?:-\s+)?run:\s*(.*)$/.exec(raw);
      if (m) {
        inRun = m[2].trim() === '|' || m[2].trim() === '>';
        runIndent = m[1].length;
        line = inRun ? '' : m[2];
      } else if (inRun) {
        const ind = raw.match(/^\s*/)[0].length;
        if (raw.trim() && ind <= runIndent) { inRun = false; return; }
      } else return;
    }
    if (/^\s*#/.test(line)) return;
    for (const seg of segments(line)) {
      for (const g of c.gnu) if (FORM[g.name] && FORM[g.name](seg)) out.push({ file, line: i + 1, form: g.name, segment: seg.slice(0, 80), portable: g.portable });
      // env execs a binary: a shell function behind it is never found, on any leg.
      // The companion runner reached ceil that way and exited 127 (8.0.0, first run).
      if (/^env\b.*\bceil\b/.test(seg)) out.push({ file, line: i + 1, form: 'env-function', segment: seg.slice(0, 80), portable: 'a subshell that unsets the variable, then ceil' });
    }
  });
  return out;
}

export function sweep(root = ROOT, c = contract()) {
  const files = [];
  const chk = join(root, 'checker');
  if (existsSync(chk)) for (const f of readdirSync(chk)) if (f.endsWith('.sh')) files.push(join(chk, f));
  const wf = join(root, '.github', 'workflows');
  if (existsSync(wf)) for (const f of readdirSync(wf)) if (/\.ya?ml$/.test(f)) files.push(join(wf, f));
  const findings = [];
  for (const p of files) {
    const rel = relative(root, p).replace(/\\/g, '/');
    // portable.sh is the one file allowed to name the timeout binary: it is
    // where the choice between timeout and lib/ceiling.mjs is made.
    if (rel === 'checker/portable.sh') continue;
    findings.push(...sweepText(readFileSync(p, 'utf8'), rel, c));
  }
  return { files: files.length, findings };
}

// ---------- LAW.XOS.6: the matrix ----------
export function matrix(text, c = contract()) {
  const jobs = {};
  const lines = text.split('\n');
  let job = null;
  let inJobs = false;
  for (const raw of lines) {
    if (/^jobs:\s*$/.test(raw)) { inJobs = true; continue; }
    if (!inJobs) continue;
    const j = /^  ([\w-]+):\s*$/.exec(raw);
    if (j) { job = j[1]; jobs[job] = { runsOn: null, os: null }; continue; }
    if (!job) continue;
    const r = /^\s+runs-on:\s*(.+?)\s*$/.exec(raw);
    if (r && jobs[job].runsOn === null) jobs[job].runsOn = r[1];
    const o = /^\s+os:\s*\[([^\]]*)\]\s*$/.exec(raw);
    if (o) jobs[job].os = o[1].split(',').map((s) => s.trim()).filter(Boolean);
  }
  const findings = [];
  for (const name of ['gate', 'install-roundtrip']) {
    const j = jobs[name];
    if (!j) { findings.push(`the workflow declares no ${name} job`); continue; }
    if (!/\$\{\{\s*matrix\.os\s*\}\}/.test(String(j.runsOn))) findings.push(`job ${name} runs on ${j.runsOn}, one name; LAW.XOS.6 needs runs-on: \${{ matrix.os }}`);
    const have = (j.os || []).slice().sort().join('|');
    const want = c.legs.slice().sort().join('|');
    if (have !== want) findings.push(`job ${name} declares the legs [${(j.os || []).join(', ')}]; XOS.legs is [${c.legs.join(', ')}]${j.os ? `, missing ${c.legs.filter((l) => !(j.os || []).includes(l)).join(', ') || 'nothing'}` : ''}`);
  }
  if (jobs.release && !/\bgate\b/.test(readFileSync(join(ROOT, '.github', 'workflows', 'gate.yml'), 'utf8').split('release:')[1] || '')) findings.push('the release job does not need the gate');
  return { jobs, findings };
}

// ---------- controls: every law tripped on purpose ----------
export function controls(io = console) {
  let ran = 0;
  let fail = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const c = contract();

  say(c.legs.length === c.legsCount && c.legs.length === 3 && c.enumLegs.join('|') === c.legs.join('|'),
    `the legs are an enumeration of ${c.legsCount} and the two spellings agree: ${c.legs.join(', ')}`);
  say(c.locals.length === c.localsCount && c.locals.every((l) => l.binary && l.probe && l.meaning),
    `the local substrates are ${c.localsCount}, each with a binary, a probe and what its answer means`);
  say(c.gnu.length === c.gnuCount && c.gnu.every((g) => g.form && g.lacks && g.portable) && c.gnu.every((g) => FORM[g.name]),
    `the forbidden forms are ${c.gnuCount}, each with the leg that lacks it, the portable form, and a matcher in this module`);
  say(c.laws.length === 7 && c.laws.every((k, i) => k === `LAW.XOS.${i + 1}`), `LAW.XOS.1 to ${c.laws.length}, dense and ascending`);
  say(/licence/.test(c.macosLocal) && /github-actions/.test(c.macosHost), 'the macOS leg names its host and its local refusal is by licence (LAW.XOS.3)');

  // LAW.XOS.1: podman with a header and no rows is absent, with rows present.
  const fake = (rows) => (cmd, args) => ({ status: 0, stdout: ['NAME        VM TYPE     CREATED     LAST UP     CPUS        MEMORY      DISK SIZE', ...rows].join('\n'), stderr: '' });
  const onlyPodman = { ...c, locals: c.locals.filter((l) => l.name === 'podman') };
  const hasPodman = have('podman');
  if (hasPodman) {
    const zero = probe({ c: onlyPodman, runner: fake([]) }).substrates[0];
    const one = probe({ c: onlyPodman, runner: fake(['podman-machine-default  wsl  1 day ago  Currently running  4  2GiB  100GiB']) }).substrates[0];
    say(zero.present === 'no' && zero.rows === 0 && /LAW\.XOS\.1/.test(zero.why), `trip: podman with a header and zero rows at exit 0 reads absent: ${zero.why} (LAW.XOS.1)`);
    say(one.present === 'yes' && one.rows === 1, 'podman with one machine row reads present');
  } else {
    say(true, 'podman is not on this machine, so the zero-row trap is exercised through a planted binary below');
    const dir = mkdtempSync(join(tmpdir(), 'xos-'));
    const shim = join(dir, process.platform === 'win32' ? 'podman.cmd' : 'podman');
    writeFileSync(shim, process.platform === 'win32' ? '@echo NAME  VM TYPE\r\n' : '#!/bin/sh\necho "NAME  VM TYPE"\n', { mode: 0o755 });
    const oldPath = process.env.PATH;
    process.env.PATH = dir + (process.platform === 'win32' ? ';' : ':') + oldPath;
    try {
      const zero = probe({ c: onlyPodman }).substrates[0];
      say(zero.present === 'no' && zero.rows === 0, `trip: a planted podman answering a header alone reads absent: ${zero.why} (LAW.XOS.1)`);
    } finally { process.env.PATH = oldPath; rmSync(dir, { recursive: true, force: true }); }
  }
  const real = probe({ c });
  say(real.substrates.length === c.localsCount && real.substrates.every((s) => ['yes', 'no'].includes(s.present)),
    `every local substrate is probed and lands on yes or no, never guessed: ${real.substrates.map((s) => `${s.name}=${s.present}`).join(' ')} (host leg ${real.host.leg}, ${real.host.how})`);

  // LAW.XOS.4: each form planted in a script is refused by name and line; the
  // real tree is clean; a comment and a nested-session string are not executions.
  const planted = [
    'timeout 60 node x.mjs < /dev/null',
    'mapfile -t FILES < <(ls)',
    'LC_ALL=C grep -lUP "\\r" a b',
    'grep -U x f',
    's=$(stat -c %s "$g")',
    'sha256sum *.zip > SHA256SUMS',
    "sed 's/a/b\\n  c/' f > g",
    '# timeout 5 in a comment counts for nothing',
    'echo "every command you run must start with timeout 60 "',
  ].join('\n');
  const f = sweepText(planted, 'zz.sh', c);
  const forms = [...new Set(f.map((x) => x.form))].sort();
  say(forms.join(',') === c.gnu.map((g) => g.name).sort().join(','),
    `trip: every one of the ${c.gnuCount} forms planted in a script is refused by name: ${forms.join(', ')} (LAW.XOS.4)`);
  say(!f.some((x) => x.line === 8) && !f.some((x) => x.line === 9), 'a comment and a string that merely name a form are not executions');
  const viaEnv = sweepText('( cd x && env -u CLAUDECODE ceil 60 claude -p )\nceil 60 node x.mjs\n', 'zz2.sh', c);
  say(viaEnv.length === 1 && viaEnv[0].form === 'env-function' && viaEnv[0].line === 1, `trip: a shell function reached through env is refused, and the direct call is not: ${viaEnv.map((x) => `${x.form}@${x.line}`).join(' ') || 'nothing'}`);
  say(f.every((x) => x.file === 'zz.sh' && x.line > 0 && x.portable), 'each finding carries its file, its line and the portable form');
  const ymlPlant = 'jobs:\n  gate:\n    runs-on: ubuntu-latest\n    steps:\n      - name: x\n        run: |\n          mapfile -t A < <(ls)\n          echo ok\n      - name: y\n        run: sha256sum a\n      - name: z\n        uses: actions/checkout@v4\n';
  const fy = sweepText(ymlPlant, 'zz.yml', c);
  say(fy.length === 2 && fy[0].form === 'mapfile' && fy[0].line === 7 && fy[1].form === 'sha256sum' && fy[1].line === 10,
    `trip: a form inside a run block and one on a run line are both refused in a workflow, at their lines: ${fy.map((x) => `${x.form}@${x.line}`).join(' ')}`);
  const tree = sweep(ROOT, c);
  say(tree.findings.length === 0, tree.findings.length === 0 ? `the tree's ${tree.files} checker scripts and workflows carry none of the forms` : `the tree carries ${tree.findings.length}: ${tree.findings.map((x) => `${x.file}:${x.line} ${x.form}`).join(', ')}`);

  // LAW.XOS.5: both ceiling paths fire with exit 124.
  const ceil = join(ROOT, 'lib', 'ceiling.mjs');
  const viaNode = spawnSync(process.execPath, [ceil, '1', process.execPath, '-e', 'setTimeout(function(){}, 8000)'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  say(viaNode.status === c.exitCeiling, `trip: the Node ceiling fires with exit ${c.exitCeiling}: ${viaNode.status} (LAW.XOS.5)`);
  const bashOk = have('bash');
  if (bashOk) {
    const script = `PORTABLE_ROOT="${ROOT.replace(/\\/g, '/')}"; . "$PORTABLE_ROOT/checker/portable.sh"; XOS_CEIL=node ceil 1 node -e "setTimeout(function(){}, 8000)"; echo "rc=$?"`;
    const viaCeil = spawnSync('bash', ['-c', script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });
    say(/rc=124/.test(viaCeil.stdout), `trip: ceil from checker/portable.sh on the forced Node path exits ${c.exitCeiling}: ${(viaCeil.stdout || '').trim() || viaCeil.stderr}`);
    const hasTimeout = spawnSync('bash', ['-c', 'command -v timeout'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).status === 0;
    if (hasTimeout) {
      const viaT = spawnSync('bash', ['-c', `PORTABLE_ROOT="${ROOT.replace(/\\/g, '/')}"; . "$PORTABLE_ROOT/checker/portable.sh"; ceil 1 node -e "setTimeout(function(){}, 8000)"; echo "rc=$?"`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });
      say(/rc=124/.test(viaT.stdout), `trip: ceil on the timeout path exits ${c.exitCeiling} too: ${(viaT.stdout || '').trim()}`);
    } else say(true, 'this leg has no timeout binary, so ceil took the Node path above, which is the case the law exists for');
  } else say(true, 'no bash on this machine; the shell wrapper is exercised by the gate on every leg');

  // LAW.XOS.6: the matrix, held; a single-name job refused; a missing leg named.
  const wf = join(ROOT, '.github', 'workflows', 'gate.yml');
  const wfText = existsSync(wf) ? readFileSync(wf, 'utf8') : '';
  const m0 = matrix(wfText, c);
  say(m0.findings.length === 0, m0.findings.length === 0 ? `gate.yml runs gate and install-roundtrip on the matrix ${c.legs.join(', ')}` : `gate.yml: ${m0.findings.join('; ')}`);
  const single = wfText.replace(/runs-on:\s*\$\{\{\s*matrix\.os\s*\}\}/, 'runs-on: ubuntu-latest');
  const m1 = matrix(single, c);
  say(m1.findings.some((x) => /one name/.test(x)), `trip: a gate job pinned to one name is refused: ${m1.findings.find((x) => /one name/.test(x)) || 'nothing'} (LAW.XOS.6)`);
  const twoLegs = wfText.replace(/os:\s*\[[^\]]*\]/, 'os: [ubuntu-latest, windows-latest]');
  const m2 = matrix(twoLegs, c);
  say(m2.findings.some((x) => /missing macos-latest/.test(x)), `trip: a matrix short of a leg names the missing leg: ${m2.findings.find((x) => /missing/.test(x)) || 'nothing'}`);

  io.log(`cross-os controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [verb, flag] = process.argv.slice(2);
  if (verb === 'controls') process.exit(controls() ? 0 : 1);
  if (verb === 'probe') {
    const p = probe();
    console.log(`host leg: ${p.host.leg} (${p.host.how})`);
    for (const s of p.substrates) console.log(`  ${s.present === 'yes' ? 'PRESENT' : 'absent '} ${s.name.padEnd(7)} ${s.probe.padEnd(28)} ${s.why}`);
    console.log(`  macOS: ${p.macos.host}; local ${p.macos.local}`);
    console.log(JSON.stringify(p));
    process.exit(0);
  }
  if (verb === 'sweep') {
    const r = sweep();
    for (const f of r.findings) console.log(`  REFUSED ${f.file}:${f.line} ${f.form}: ${f.segment}  ->  ${f.portable}`);
    console.log(`cross-os sweep: ${r.files} files, ${r.findings.length} forbidden form(s) (LAW.XOS.4)`);
    process.exit(r.findings.length ? 1 : 0);
  }
  if (verb === 'matrix') {
    const r = matrix(readFileSync(join(ROOT, '.github', 'workflows', 'gate.yml'), 'utf8'));
    for (const f of r.findings) console.log(`  DRIFT ${f}`);
    console.log(`cross-os matrix: ${Object.keys(r.jobs).length} jobs; ${r.findings.length === 0 ? 'gate and install-roundtrip run on every leg' : `${r.findings.length} disagreement(s)`}`);
    process.exit(flag === '--check' && r.findings.length ? 1 : 0);
  }
  console.error('usage: node lib/cross-os.mjs probe | sweep | matrix --check | controls');
  process.exit(2);
}
