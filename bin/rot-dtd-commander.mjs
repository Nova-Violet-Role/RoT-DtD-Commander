#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// bin/rot-dtd-commander.mjs  (alias: rdc)
// Guided NPX installer for RoT DtD Commander.
//
//   rdc install   [--yes] [--project | --target <dir>] [--commands] [--skills] [--agents]
//                 [--only a,b] [--force] [--dry-run] [--arm]
//   rdc uninstall [--project | --target <dir>] [--force] [--yes]
//   rdc list      [--project | --target <dir>]
//   rdc check     [paths...]
//   rdc build     [--check]
//   rdc resolve   <src.md> <out.md>
//   rdc forge     <spec.json|spec.mjs> [names...]
//   rdc arm | disarm | doctor | controls
//   rdc watch     [--once] [--poll <ms>] [--secs <n>]   run the Commander-Adiutor monitor by hand (300 s ceiling)
//
// Layout: src/ holds the sources with %cc-core; includes; commands/, skills/
// and agents/ hold the RESOLVED files that the plugin loads and the installer
// copies. `rdc build` produces the second from the first; `rdc build --check`
// proves the committed output equals a fresh build. monitors/ holds the
// Commander-Adiutor monitor and manual.json, the declaration rdc watch reads;
// the plugin loader reads nothing there since 5.0.0.
//
// Default target is the user-wide ~/.claude (os.homedir, never $HOME). Every
// write goes through one writer: check, write UTF-8 LF without BOM, re-read
// and verify. Nothing this tool did not write is ever overwritten or removed.
// Installing arms nothing (5.0.0): the Adiutor runs only when the operator
// runs it (rdc doctor, rdc controls, /RoT-DtD-Commander-Adiutor) and the
// monitor only through rdc watch, each under a 300 s ceiling. --arm (or
// rdc arm) registers the hooks deliberately, after stating what they do,
// with a backup of settings.json taken first and the restore command
// printed. No monitor plugin is written: an operator who wants the loader
// to start the monitor declares it in a monitors.json of their own.

import { readdirSync, existsSync, readFileSync, copyFileSync, rmSync, rmdirSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, basename, resolve as presolve, relative, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import os from 'node:os';
import { readText, resolveFile, check, extractDtd, forge, forgeNew, writeLF, verifyFile, normalize } from '../lib/dtd.mjs';
import { armSettings, disarmSettings, EVENTS } from '../lib/arm.mjs';
import { applyHeadings, sigilFor } from '../lib/headings.mjs';

const ROOT = presolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const VERSION = PKG.version;
const NAME = 'rot-dtd-commander';
const TEXT_EXT = new Set(['.md', '.dtd', '.sh', '.mjs', '.js', '.json', '.yml', '.yaml', '.txt', '.tsv', '.csv', '.ps1', '.nu', '.py', '.toml', '.tape']);
const JUNK = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);
const MANIFEST = `.${NAME}-manifest.json`;
const RUNTIME = ['bin/adiutor.mjs', 'lib/dtd.mjs', 'lib/render-check.mjs', 'lib/headings.mjs', 'lib/arm.mjs', 'lib/ledger.mjs', 'monitors/commander-adiutor.mjs', 'dtd/sigils.json', 'dtd/cc-core.dtd', 'dtd/cc-ask.dtd', 'dtd/cc-args.dtd', 'dtd/cc-form.dtd', 'lib/form.mjs', 'dtd/cc-lexicon.dtd', 'lib/args.mjs', 'dtd/cc-schematic.dtd', 'dtd/cc-report.dtd', 'dtd/cc-record.dtd', 'dtd/cc-rot.dtd', 'dtd/adiutor.dtd', 'dtd/ai-slop.dtd', 'lib/ordinals.mjs', 'lib/ai-slop.mjs'];
// The skills-directory plugin older installs wrote to auto-start the monitor;
// 5.0.0 writes none, and the doctor turns red while one is still present.
const MONITOR_PLUGIN = 'rot-dtd-commander-adiutor';
const MONITOR_NAME = 'commander-adiutor';

// ---------- args ----------

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') o.yes = true;
    else if (a === '--project' || a === '-p') o.project = true;
    else if (a === '--global' || a === '-g') o.global = true;
    else if (a === '--target') o.target = argv[++i];
    else if (a === '--commands') o.commands = true;
    else if (a === '--skills') o.skills = true;
    else if (a === '--agents') o.agents = true;
    else if (a === '--only') o.only = (argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--force') o.force = true;
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--check') o.check = true;
    else if (a === '--arm') o.arm = true;
    else if (a === '--no-arm') o.arm = false;
    else if (a === '--secs') o.secs = argv[++i];
    else if (a === '--guided') o.guided = true;
    else if (a === '--once') o.once = true;
    else if (a === '--poll') o.poll = argv[++i];
    else if (a.startsWith('-')) die(`unknown flag ${a}`);
    else o._.push(a);
  }
  return o;
}

function die(msg, code = 2) {
  console.error(`${NAME}: ${msg}`);
  process.exit(code);
}

function targetDir(o) {
  if (o.target) return presolve(o.target);
  if (o.project) return presolve(process.cwd(), '.claude');
  return join(os.homedir(), '.claude');
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function hasDoctype(path) {
  try {
    return /<!DOCTYPE\s+[\w.:-]+\s*\[/.test(readFileSync(path, 'utf8'));
  } catch {
    return false;
  }
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (JUNK.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// ---------- inventory over the resolved tree ----------

function inventory(base = ROOT) {
  const isCmd = (p) => p.endsWith('.md') && statSync(p).isFile();
  const isSkill = (p) => existsSync(join(p, 'SKILL.md'));
  const pick = (dir, isMain, mainOf) => (existsSync(dir) ? readdirSync(dir) : []).filter((f) => isMain(join(dir, f))).filter((f) => hasDoctype(mainOf(join(dir, f)))).sort();
  return {
    commands: pick(join(base, 'commands'), isCmd, (p) => p),
    skills: pick(join(base, 'skills'), isSkill, (p) => join(p, 'SKILL.md')),
    agents: pick(join(base, 'agents'), isCmd, (p) => p),
  };
}

function prepare(src) {
  const text = readText(src);
  const r = resolveFile(text, dirname(src));
  if (!r.hasDoctype) return { text, resolved: r, report: { ok: true, errors: 0, findings: [], stats: {} }, plain: true };
  const report = check(r.text, { includes: r.includes });
  return { text, resolved: r, report, plain: false };
}

function printFindings(label, report) {
  for (const f of report.findings) console.log(`    ${f.level === 'error' ? 'ERR ' : 'warn'} ${f.code} ${f.msg}`);
  const s = report.stats;
  const tail = s.name ? ` root=${s.name} elements=${s.elements} entities=${s.entities} ndata=${s.ndata} laws=${s.laws}` : '';
  console.log(`  ${report.ok ? 'OK  ' : 'FAIL'} ${label}${tail}`);
}

// ---------- build: src/ -> resolved commands/ skills/ agents/ ----------

function buildTargets() {
  const out = [];
  const srcRoot = join(ROOT, 'src');
  for (const kind of ['commands', 'agents']) {
    const d = join(srcRoot, kind);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter((f) => f.endsWith('.md'))) out.push({ kind, src: join(d, f), dest: join(ROOT, kind, f), main: true });
  }
  const sk = join(srcRoot, 'skills');
  if (existsSync(sk)) {
    for (const s of readdirSync(sk)) {
      const sd = join(sk, s);
      if (!existsSync(join(sd, 'SKILL.md'))) continue;
      for (const f of walk(sd)) out.push({ kind: 'skills', src: f, dest: join(ROOT, 'skills', s, relative(sd, f)), main: basename(f) === 'SKILL.md' });
    }
  }
  return out;
}

function produce(t) {
  if (t.main) {
    const p = prepare(t.src);
    return { text: p.resolved.text, report: p.report, binary: null };
  }
  if (TEXT_EXT.has(extname(t.src).toLowerCase())) return { text: normalize(readFileSync(t.src, 'utf8')), report: null, binary: null };
  return { text: null, report: null, binary: readFileSync(t.src) };
}

function cmdBuild(o) {
  const targets = buildTargets();
  let failed = 0;
  let drift = 0;
  let written = 0;
  for (const t of targets) {
    const label = relative(ROOT, t.dest).split(sep).join('/');
    const p = produce(t);
    if (p.report && !p.report.ok) {
      printFindings(label, p.report);
      failed++;
      continue;
    }
    if (o.check) {
      const cur = existsSync(t.dest) ? (p.binary ? readFileSync(t.dest) : normalize(readFileSync(t.dest, 'utf8'))) : null;
      const same = cur !== null && (p.binary ? Buffer.compare(cur, p.binary) === 0 : cur === p.text);
      if (!same) {
        drift++;
        console.log(`  DRIFT ${label}${cur === null ? ' (missing)' : ''}`);
      }
      continue;
    }
    if (p.binary) {
      mkdirSync(dirname(t.dest), { recursive: true });
      copyFileSync(t.src, t.dest);
    } else writeLF(t.dest, p.text);
    written++;
  }
  if (o.check) {
    console.log(`\nbuild --check: ${targets.length} targets, ${drift} drifted, ${failed} failing`);
    process.exit(drift || failed ? 1 : 0);
  }
  console.log(`\nbuild: ${written} written, ${failed} failing`);
  process.exit(failed ? 1 : 0);
}

// ---------- the capability statement, printed before arming ----------

function capabilities(target) {
  const settings = join(target, 'settings.json');
  const state = join(target, NAME);
  return [
    '',
    'The Adiutor will be armed. What that means, before it happens:',
    `  file edited : ${settings} (a timestamped backup is written first; the restore command is printed;`,
    '                a read-only attribute on the file is lifted for the one write and put back)',
    `  hook events : ${EVENTS.map((e) => e[0]).join(', ')}`,
    `  runtime     : ${state} (bin, lib, dtd, monitors; nothing outside it)`,
    '  what it does: when you run any /*-dtd command it reads that command\'s own DOCTYPE, records the headings',
    '                the answer must carry, counts tool calls and errors during the run, and at Stop reads the',
    `                answer from the transcript and checks it. Every closed run is one line in ${join(state, 'ledger.tsv')}.`,
    `  monitor     : never started by Claude Code; rdc watch runs ${MONITOR_NAME} by hand for at most 300 s`,
    '                prints one line per -dtd answer that failed its grammar. It reads the ledger only, never the transcript.',
    '  what it never does: edit your files, spawn a process from a hook, or block a session more than once per run',
    '                (blocking only under ROT_DTD_ADIUTOR=strict; the default policy is warn).',
    '  you decide  : /RoT-DtD-Commander-Adiutor runs the doctor and shows the prescriptions when you want them.',
    `  reverse     : rdc disarm, or /RoT-DtD-Commander-Adiutor --disarm; rdc uninstall removes everything it wrote.`,
    '',
  ].join('\n');
}

// ---------- install ----------

async function cmdInstall(o) {
  let target = targetDir(o);
  const inv = inventory();
  if (inv.commands.length + inv.skills.length + inv.agents.length === 0) die('no resolved artifacts under commands/, skills/, agents/; run rdc build first', 1);
  let kinds = { commands: !!o.commands, skills: !!o.skills, agents: !!o.agents };
  if (!kinds.commands && !kinds.skills && !kinds.agents) kinds = { commands: true, skills: true, agents: true };
  // Guided by default on a terminal; --guided forces the questions even when
  // stdin is a pipe (answers are then echoed so a captured transcript reads
  // exactly as a terminal session would).
  const guided = o.guided || (!o.yes && !o.dryRun && stdin.isTTY && stdout.isTTY);

  if (guided) {
    // On a terminal, readline. Under a pipe, every answer arrives in one
    // chunk and readline would drop the ones after the first, so the whole
    // of stdin is read once and answered from a queue, each answer echoed.
    let ask;
    let rl = null;
    if (stdin.isTTY) {
      rl = createInterface({ input: stdin, output: stdout });
      ask = (q) => rl.question(q);
    } else {
      const queue = readFileSync(0, 'utf8').split('\n');
      ask = async (q) => {
        stdout.write(q);
        const a = queue.length ? queue.shift() : '';
        stdout.write(a + '\n');
        return a;
      };
    }
    console.log(`RoT DtD Commander ${VERSION}: guided install`);
    console.log(`  1) user-wide  ${join(os.homedir(), '.claude')}`);
    console.log(`  2) project    ${presolve(process.cwd(), '.claude')}`);
    console.log('  3) custom path');
    const t = (await ask('target [1]: ')).trim() || '1';
    if (t === '2') target = presolve(process.cwd(), '.claude');
    else if (t === '3') target = presolve((await ask('path: ')).trim());
    const k = (await ask('kinds: commands,skills,agents [all]: ')).trim();
    if (k) kinds = { commands: /commands/.test(k), skills: /skills/.test(k), agents: /agents/.test(k) };
    console.log(`\nwill install into ${target}:`);
    if (kinds.commands) console.log(`  commands (${inv.commands.length}): ${inv.commands.map((f) => f.replace(/\.md$/, '')).join(', ')}`);
    if (kinds.skills) console.log(`  skills   (${inv.skills.length}): ${inv.skills.join(', ')}`);
    if (kinds.agents) console.log(`  agents   (${inv.agents.length}): ${inv.agents.map((f) => f.replace(/\.md$/, '')).join(', ')}`);
    if (o.arm) console.log(capabilities(target));
    const go = (await ask('proceed? [y/N]: ')).trim().toLowerCase();
    if (rl) rl.close();
    if (go !== 'y' && go !== 'yes') die('aborted by user', 1);
  } else if (o.arm && !o.dryRun) {
    console.log(capabilities(target));
  }

  const manifestPath = join(target, MANIFEST);
  const prev = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { files: [] };
  const owned = new Set(prev.files.map((f) => f.path));
  const only = o.only ? new Set(o.only) : null;
  const plan = [];
  const select = (list, kind, strip) => list.filter((n) => !only || only.has(strip(n))).map((n) => ({ kind, name: strip(n), entry: n }));
  if (kinds.commands) plan.push(...select(inv.commands, 'command', (f) => f.replace(/\.md$/, '')));
  if (kinds.skills) plan.push(...select(inv.skills, 'skill', (d) => d));
  if (kinds.agents) plan.push(...select(inv.agents, 'agent', (f) => f.replace(/\.md$/, '')));
  if (plan.length === 0) die('nothing selected', 1);

  console.log(`RoT DtD Commander ${VERSION}: installing ${plan.length} artifact(s) into ${target}${o.dryRun ? ' (dry run)' : ''}`);
  const written = [];
  let failed = 0;
  let skipped = 0;

  const writeOne = (src, dest, label, isMain) => {
    if (existsSync(dest) && !owned.has(dest) && !o.force) {
      console.log(`  SKIP ${label} (exists and was not installed by ${NAME}; use --force)`);
      skipped++;
      return;
    }
    let outText = null;
    let outBuf = null;
    if (isMain) {
      const p = prepare(src);
      if (!p.report.ok) {
        printFindings(label, p.report);
        failed++;
        return;
      }
      outText = p.resolved.text;
    } else if (TEXT_EXT.has(extname(src).toLowerCase())) outText = normalize(readFileSync(src, 'utf8'));
    else outBuf = readFileSync(src);
    if (o.dryRun) {
      console.log(`  plan ${label} -> ${dest}`);
      return;
    }
    try {
      if (outText !== null) {
        const v = writeLF(dest, outText);
        written.push({ path: dest, sha256: sha256(readFileSync(dest)), bytes: v.bytes, label });
        console.log(`  WROTE ${label} (${v.bytes} B, LF, no BOM)`);
      } else {
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(src, dest);
        written.push({ path: dest, sha256: sha256(outBuf), bytes: outBuf.length, label });
        console.log(`  COPIED ${label} (${outBuf.length} B)`);
      }
    } catch (e) {
      console.log(`  FAIL ${label}: ${e.message}`);
      failed++;
    }
  };

  for (const item of plan) {
    const destRoot = join(target, item.kind === 'command' ? 'commands' : item.kind === 'skill' ? 'skills' : 'agents');
    const files = item.kind === 'skill' ? walk(join(ROOT, 'skills', item.entry)) : [join(ROOT, item.kind === 'command' ? 'commands' : 'agents', item.entry)];
    for (const src of files) {
      const rel = item.kind === 'skill' ? join(item.entry, relative(join(ROOT, 'skills', item.entry), src)) : basename(src);
      const isMain = item.kind !== 'skill' || basename(src) === 'SKILL.md';
      writeOne(src, join(destRoot, rel), `${item.kind} ${rel.split(sep).join('/')}`, isMain);
    }
  }

  for (const rel of RUNTIME) {
    const src = join(ROOT, rel);
    if (!existsSync(src)) continue;
    writeOne(src, join(target, NAME, rel), `runtime ${rel}`, false);
  }

  // The monitor plugin: two generated files, tracked in the manifest like
  // every other write, so uninstall removes them and a file this tool did not
  // write is never overwritten. The command carries the absolute path of the
  // copied script, forward slashes, quoted: Node reads it on every platform.
  const writeGenerated = (dest, text, label) => {
    if (existsSync(dest) && !owned.has(dest) && !o.force) {
      console.log(`  SKIP ${label} (exists and was not installed by ${NAME}; use --force)`);
      skipped++;
      return;
    }
    if (o.dryRun) {
      console.log(`  plan ${label} -> ${dest}`);
      return;
    }
    try {
      mkdirSync(dirname(dest), { recursive: true });
      const v = writeLF(dest, text);
      written.push({ path: dest, sha256: sha256(readFileSync(dest)), bytes: v.bytes, label });
      console.log(`  WROTE ${label} (${v.bytes} B, LF, no BOM)`);
    } catch (e) {
      console.log(`  FAIL ${label}: ${e.message}`);
      failed++;
    }
  };
  // 5.0.0: no monitor plugin is written. The monitor is declared in
  // monitors/manual.json and runs only through rdc watch (300 s ceiling).
  console.log('  monitor: not started by Claude Code; run it by hand with rdc watch (ceiling 300 s)');

  if (o.dryRun) {
    console.log(`\nplanned ${plan.length} artifact(s); skipped ${skipped}; failed ${failed}`);
    process.exit(failed ? 1 : 0);
  }

  const keep = prev.files.filter((f) => !written.some((w) => w.path === f.path) && existsSync(f.path));
  const manifest = { tool: NAME, version: VERSION, target, installedAt: new Date().toISOString(), files: [...keep, ...written.map(({ label, ...w }) => w)] };
  writeLF(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  let bad = 0;
  for (const w of written) {
    if (!TEXT_EXT.has(extname(w.path).toLowerCase())) continue;
    const v = verifyFile(w.path);
    if (!v.ok) {
      bad++;
      console.log(`  VERIFY FAIL ${w.path} cr=${v.cr} bom=${v.bom} utf8=${v.utf8}`);
    }
  }
  console.log(`\nwritten ${written.length}  skipped ${skipped}  failed ${failed}  verify-bad ${bad}  manifest ${manifestPath}`);

  if (o.arm && !failed && !bad) {
    try {
      const hadSettings = existsSync(join(target, 'settings.json'));
      const r = armSettings(join(target, 'settings.json'), join(target, NAME));
      if (!hadSettings) {
        manifest.settingsCreated = true;
        writeLF(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
      }
      console.log(`armed ${r.added} event(s) (${r.unchanged} already present) in ${join(target, 'settings.json')}`);
      if (r.readOnly) console.log('settings.json carried the read-only attribute; it was lifted for the write and put back');
      if (r.backup) console.log(`restore: copy "${r.backup}" over settings.json   |   reverse: rdc disarm`);
      else console.log('no settings.json existed; one was created with only the Adiutor hooks');
    } catch (e) {
      console.log(`ARM FAIL ${e.message}`);
      bad++;
    }
  } else console.log('hooks not armed: since 5.0.0 the Adiutor runs only when you run it (rdc doctor, rdc controls, /RoT-DtD-Commander-Adiutor); arm it deliberately with rdc arm or install --arm (Stop ceiling 300 s)');
  if (plan.some((p) => p.kind === 'agent')) console.log('note: if this is the first agent file in that agents directory, restart Claude Code to load it.');
  process.exit(failed || bad ? 1 : 0);
}

async function cmdUninstall(o) {
  const target = targetDir(o);
  const manifestPath = join(target, MANIFEST);
  if (!existsSync(manifestPath)) die(`no manifest at ${manifestPath}; nothing to uninstall`, 1);
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!o.yes && stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout });
    const go = (await rl.question(`remove ${m.files.length} file(s) installed by ${NAME} under ${target}, and disarm its hooks? [y/N]: `)).trim().toLowerCase();
    rl.close();
    if (go !== 'y' && go !== 'yes') die('aborted by user', 1);
  }
  let removed = 0;
  let kept = 0;
  const dirs = new Set();
  for (const f of m.files) {
    if (!existsSync(f.path)) continue;
    const cur = sha256(readFileSync(f.path));
    if (cur !== f.sha256 && !o.force) {
      console.log(`  KEEP ${f.path} (modified since install; use --force)`);
      kept++;
      continue;
    }
    rmSync(f.path);
    removed++;
    dirs.add(dirname(f.path));
    console.log(`  removed ${f.path}`);
  }
  // Remove the directories left empty, climbing towards the target but never
  // removing the target itself or anything with content.
  for (let d of [...dirs].sort((a, b) => b.length - a.length)) {
    while (d !== target && d.startsWith(target) && existsSync(d) && readdirSync(d).length === 0) {
      rmdirSync(d);
      d = dirname(d);
    }
  }
  try {
    const sp = join(target, 'settings.json');
    const r = disarmSettings(sp);
    console.log(`disarmed ${r.removed} hook entry(ies)${r.backup ? `; backup ${r.backup}` : ''}`);
    // A settings.json this tool created from nothing is removed again once it
    // is empty after the disarm; the backups this tool took are removed with
    // it, since the disarm was verified by re-reading the file from disk.
    if (m.settingsCreated && existsSync(sp)) {
      const s = JSON.parse(readFileSync(sp, 'utf8').replace(/^﻿/, '') || '{}');
      if (Object.keys(s).length === 0) {
        rmSync(sp);
        console.log('  removed settings.json (created by this tool; empty after disarm)');
      }
    }
    for (const f of readdirSync(target).filter((f) => /^settings\.json\.rot-dtd-commander\.\d+\.bak$/.test(f))) {
      rmSync(join(target, f));
      console.log(`  removed backup ${f}`);
    }
  } catch (e) {
    console.log(`DISARM FAIL ${e.message}`);
  }
  if (kept === 0) rmSync(manifestPath);
  console.log(`\nremoved ${removed}  kept ${kept}`);
  process.exit(0);
}

function cmdList(o) {
  const target = targetDir(o);
  const inv = inventory();
  const manifestPath = join(target, MANIFEST);
  const m = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { files: [] };
  const installed = new Set(m.files.map((f) => f.path));
  console.log(`RoT DtD Commander ${VERSION}  repo ${ROOT}  target ${target}`);
  const row = (kind, name, src, dest) => {
    const p = prepare(src);
    const st = p.plain ? 'plain' : p.report.ok ? 'OK' : `FAIL(${p.report.errors})`;
    console.log(`  ${kind.padEnd(7)} ${name.padEnd(34)} ${st.padEnd(8)} ${installed.has(dest) ? 'installed' : ''}`);
  };
  for (const f of inv.commands) row('command', f.replace(/\.md$/, ''), join(ROOT, 'commands', f), join(target, 'commands', f));
  for (const d of inv.skills) row('skill', d, join(ROOT, 'skills', d, 'SKILL.md'), join(target, 'skills', d, 'SKILL.md'));
  for (const f of inv.agents) row('agent', f.replace(/\.md$/, ''), join(ROOT, 'agents', f), join(target, 'agents', f));
  console.log(`\ncommands ${inv.commands.length}  skills ${inv.skills.length}  agents ${inv.agents.length}  installed files ${installed.size}`);
}

function cmdCheck(o) {
  let paths = o._;
  if (paths.length === 0) {
    const srcInv = existsSync(join(ROOT, 'src')) ? inventory(join(ROOT, 'src')) : inventory();
    const base = existsSync(join(ROOT, 'src')) ? join(ROOT, 'src') : ROOT;
    paths = [
      ...srcInv.commands.map((f) => join(base, 'commands', f)),
      ...srcInv.skills.map((d) => join(base, 'skills', d, 'SKILL.md')),
      ...srcInv.agents.map((f) => join(base, 'agents', f)),
    ];
  }
  let bad = 0;
  for (const p of paths) {
    const abs = presolve(p);
    let prep;
    try {
      prep = prepare(abs);
    } catch (e) {
      console.log(`  FAIL ${relative(ROOT, abs)}: ${e.message}`);
      bad++;
      continue;
    }
    if (prep.plain) {
      console.log(`  plain ${relative(ROOT, abs)} (no DOCTYPE)`);
      continue;
    }
    printFindings(relative(ROOT, abs), prep.report);
    if (!prep.report.ok) bad++;
  }
  console.log(`\nchecked ${paths.length}  failed ${bad}`);
  process.exit(bad ? 1 : 0);
}

function cmdResolve(o) {
  const [src, out] = o._;
  if (!src || !out) die('usage: resolve <src.md> <out.md>');
  const r = resolveFile(readText(src), dirname(presolve(src)));
  const v = writeLF(presolve(out), r.text);
  console.log(`resolved ${src} -> ${out} (${v.bytes} B; includes ${r.order.join(',') || 'none'})`);
}

// prune-plugin: remove the directories the plugin CLI leaves under
// <claude>/plugins/cache and plugins/marketplaces after `claude plugin
// uninstall` and `claude plugin marketplace remove` (measured 2026-09-02:
// the registry was clean, the cache stayed at 6.2 MB, and the doctor flagged
// a double install). Refuses while installed_plugins.json,
// known_marketplaces.json or settings.json enabledPlugins still name the
// plugin. CLAUDE_CONFIG_DIR or --target choose the .claude directory.
function cmdPrunePlugin(o) {
  const claude = o.target ? presolve(o.target) : process.env.CLAUDE_CONFIG_DIR ? presolve(process.env.CLAUDE_CONFIG_DIR) : join(os.homedir(), '.claude');
  const plug = join(claude, 'plugins');
  const names = (p) => existsSync(p) && /rot-dtd-commander/i.test(readFileSync(p, 'utf8'));
  let registered = names(join(plug, 'installed_plugins.json')) || names(join(plug, 'known_marketplaces.json'));
  const sp = join(claude, 'settings.json');
  if (existsSync(sp)) {
    try {
      const s = JSON.parse(readFileSync(sp, 'utf8'));
      if (Object.keys(s.enabledPlugins || {}).some((k) => /^rot-dtd-commander@/i.test(k))) registered = true;
    } catch {
      // an unreadable settings.json names nothing
    }
  }
  const dirs = [];
  for (const sub of ['cache', 'marketplaces']) {
    const d = join(plug, sub);
    if (!existsSync(d)) continue;
    for (const n of readdirSync(d)) if (/rot-dtd-commander/i.test(n) && statSync(join(d, n)).isDirectory()) dirs.push(join(d, n));
  }
  if (!dirs.length) {
    console.log('prune-plugin: nothing under plugins/cache or plugins/marketplaces names rot-dtd-commander');
    return;
  }
  if (registered) die(`prune-plugin: the plugin is still registered (installed_plugins.json, known_marketplaces.json or enabledPlugins); run \`claude plugin uninstall rot-dtd-commander@rot-dtd-commander\` and \`claude plugin marketplace remove rot-dtd-commander\` first. Left in place: ${dirs.join(', ')}`);
  for (const d of dirs) {
    rmSync(d, { recursive: true, force: true });
    console.log(`removed ${d}`);
  }
  const left = dirs.filter((d) => existsSync(d));
  if (left.length) die(`prune-plugin: still present after removal: ${left.join(', ')}`);
  console.log(`prune-plugin: ${dirs.length} director${dirs.length === 1 ? 'y' : 'ies'} removed; the registry named none of them`);
}

async function cmdForge(o) {
  const [specPath, ...names] = o._;
  if (!specPath) die('usage: forge <spec.json|spec.mjs> [names...]');
  const absSpec = presolve(specPath);
  const spec = absSpec.endsWith('.mjs') ? (await import(pathToFileURL(absSpec).href)).default : JSON.parse(readText(absSpec));
  const wanted = names.length ? new Set(names) : null;
  let n = 0;
  let bad = 0;
  for (const [name, entry] of Object.entries(spec)) {
    if (wanted && !wanted.has(name)) continue;
    const to = presolve(ROOT, entry.to);
    const depth = relative(ROOT, dirname(to)).split(sep).length;
    const up = '../'.repeat(depth);
    const refs = { coreRef: `${up}dtd/cc-core.dtd`, includeRef: (i) => `${up}dtd/${i}.dtd` };
    const text = entry.new ? forgeNew(entry, refs) : forge(readText(presolve(ROOT, entry.from)), entry, refs);
    const sigil = entry.sigil || sigilFor(to);
    if (!sigil) die(`no sigil for ${entry.to} in dtd/sigils.json (LAW.CORE.6)`);
    writeLF(to, applyHeadings(text, sigil));
    const from = entry.from ? presolve(ROOT, entry.from) : null;
    if (entry.copyDir && from) {
      const srcDir = dirname(from);
      const dstDir = dirname(to);
      for (const f of walk(srcDir)) {
        if (basename(f) === 'SKILL.md') continue;
        const dest = join(dstDir, relative(srcDir, f));
        mkdirSync(dirname(dest), { recursive: true });
        if (TEXT_EXT.has(extname(f).toLowerCase())) writeLF(dest, readFileSync(f, 'utf8'));
        else copyFileSync(f, dest);
      }
    }
    const p = prepare(to);
    printFindings(relative(ROOT, to), p.report);
    n++;
    if (!p.report.ok) bad++;
  }
  console.log(`\nforged ${n}  failed-check ${bad}`);
  process.exit(bad ? 1 : 0);
}

// The ceiling every run by hand ends at (5.0.0): 300 s, or ROT_DTD_CEILING
// seconds when set, which is how checker/ceiling-controls.sh trips it.
export function ceilingSecs() {
  const n = Number(process.env.ROT_DTD_CEILING);
  return n > 0 ? n : 300;
}

function delegate(sub, o) {
  // Every run of the Adiutor by hand ends at the ceiling (5.0.0): a doctor or
  // a controls run that hangs costs the ceiling, never a session.
  const secs = ceilingSecs();
  const r = spawnSync(process.execPath, [join(ROOT, 'bin', 'adiutor.mjs'), sub, ...o._], { stdio: 'inherit', timeout: secs * 1000 });
  if (r.error && r.error.code === 'ETIMEDOUT') {
    console.error(`adiutor: ${sub} reached the ${secs} s ceiling and was stopped (exit 124)`);
    process.exit(124);
  }
  process.exit(r.status === null ? 1 : r.status);
}

// ---------- main ----------

const [cmd, ...rest] = process.argv.slice(2);
const o = parseArgs(rest);
switch (cmd) {
  case 'install':
    await cmdInstall(o);
    break;
  case 'uninstall':
    await cmdUninstall(o);
    break;
  case 'prune-plugin':
    cmdPrunePlugin(o);
    break;
  case 'list':
    cmdList(o);
    break;
  case 'check':
    cmdCheck(o);
    break;
  case 'build':
    cmdBuild(o);
    break;
  case 'resolve':
    cmdResolve(o);
    break;
  case 'forge':
    await cmdForge(o);
    break;
  case 'arm':
  case 'disarm':
  case 'doctor':
  case 'controls':
  case 'ledger':
  case 'suggest':
    delegate(cmd, o);
    break;
  case 'watch': {
    // The Commander-Adiutor monitor by hand, the only way it runs since
    // 5.0.0: on this terminal, until Ctrl-C or the ceiling (--secs, default
    // 300, 0 for none).
    const args = [join(ROOT, 'monitors', 'commander-adiutor.mjs')];
    if (o.once) args.push('--once');
    if (o.poll) args.push('--poll', String(o.poll));
    args.push('--secs', String(o.secs === undefined ? ceilingSecs() : o.secs));
    const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
    process.exit(r.status === null ? 1 : r.status);
    break;
  }
  default:
    console.log(`RoT DtD Commander ${VERSION} (rdc)\n\n  install | uninstall | prune-plugin | list | check | build | resolve | forge | arm | disarm | doctor | controls | ledger | suggest | watch\n\n  install   guided by default; --yes for non-interactive; default target ${join(os.homedir(), '.claude')}\n            --project (./.claude) | --target <dir> | --commands --skills --agents | --only a,b | --force | --dry-run | --arm (hooks are not armed unless asked)\n  prune-plugin  remove what the plugin CLI leaves under plugins/cache and plugins/marketplaces after uninstall; refuses while still registered\n  build     [--check]   resolve src/ into commands/, skills/, agents/; --check proves the committed output matches\n  check     [paths...]   check every DOCTYPE-bearing source against its own DOCTYPE, rules C1 to C14\n  doctor    the Adiutor doctor; controls trips every Adiutor guard on purpose; both end at a 300 s ceiling\n  watch     [--once] [--poll <ms>] [--secs <n>]   the Commander-Adiutor monitor by hand, its only way to run: one line per -dtd answer that failed its grammar; stops at 300 s unless --secs says otherwise\n`);
    process.exit(cmd ? 2 : 0);
}
