#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/live-sweep.mjs
// Runs every installed -dtd command and -dtd skill through a fresh headless
// Claude Code session (`claude -p`), one session per name, in the foreground
// and under a ceiling, with the armed Adiutor hooks judging each answer at
// Stop. After each session the ledger row for that session is read back by
// its id, and the answer is saved as <out>/<name>/<name>.<ordinal>.md, one
// folder per name under the artifacts directory, where the ordinal is the
// IUPAC multiplier series (mono, di, tri, tetra, penta, hexa, hepta, octa,
// nona, deca, undeca, dodeca, ..., icosa, henicosa, ..., hecta, ..., kilia,
// ...), composed without a cap, so a name re-run any number of times keeps
// every answer beside the last one.
//
// Agents and the monitor cannot run in a headless child without spawning
// subagents, so --static writes them an artifact of the same shape holding
// the checker's verdict on their file (rdc check) and, for the monitor, the
// C12 control line from `node bin/adiutor.mjs controls`.
//
//   node checker/live-sweep.mjs [--kinds commands,skills] [--only a,b]
//        [--skip a,b] [--model opus] [--timeout 900] [--out <dir>]
//        [--topic "<text>"] [--static] [--dry-run]
//
// Exit 0 when every live session closed as pass in the ledger and every
// static check passed; 1 otherwise. Every child gets stdin closed, a
// timeout, and its stdout captured, and a line is printed before and after
// each session so silence has a shape.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, cpSync, rmSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { claudeDir, ledgerPath, parseLedger } from '../lib/ledger.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- the ordinal series ----------
// IUPAC multiplying prefixes (P-14.2): units, tens, hundreds, thousands are
// named from the lowest place upward; 1 is mono alone and hen inside a
// composite, 2 is di alone and do inside one; icosa keeps its i after hen
// (henicosa) and loses it after every other unit (docosa, tricosa). That
// names 1 to 9999 without a collision. Above 9999 the number is split into
// its part below 10000 and its count of myriads (Greek myrias, 10000): the
// count is named by this same rule and suffixed myria, and the two parts
// are joined with a hyphen, so 10010 is deca-monomyria and 100000 is
// decamyria. The split is unique and the joiner keeps the additive and the
// multiplicative readings apart, which keeps the series uncapped.
const UNIT = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona'];
const UNIT_IN = ['', 'hen', 'do', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona'];
const TEN = ['', 'deca', 'icosa', 'triaconta', 'tetraconta', 'pentaconta', 'hexaconta', 'heptaconta', 'octaconta', 'nonaconta'];
const HUNDRED = ['', 'hecta', 'dicta', 'tricta', 'tetracta', 'pentacta', 'hexacta', 'heptacta', 'octacta', 'nonacta'];
const THOUSAND = ['', 'kilia', 'dilia', 'trilia', 'tetralia', 'pentalia', 'hexalia', 'heptalia', 'octalia', 'nonalia'];

export function ordinal(n) {
  if (!Number.isInteger(n) || n < 1) throw new Error(`ordinal: need a positive integer, got ${n}`);
  if (n < 10) return UNIT[n];
  if (n >= 10000) {
    const rest = n % 10000;
    const myriads = Math.floor(n / 10000);
    return (rest ? ordinal(rest) + '-' : '') + ordinal(myriads) + 'myria';
  }
  const u = n % 10;
  const t = Math.floor(n / 10) % 10;
  const h = Math.floor(n / 100) % 10;
  const k = Math.floor(n / 1000);
  let s = '';
  if (u) s += n % 100 === 11 ? 'un' : UNIT_IN[u];
  if (t) s += t === 2 && u >= 2 ? 'cosa' : TEN[t];
  if (h) s += HUNDRED[h];
  if (k) s += THOUSAND[k];
  return s;
}

export function nextOrdinal(dir, name) {
  const taken = new Set(existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith(name + '.') && f.endsWith('.md')).map((f) => f.slice(name.length + 1, -3)) : []);
  for (let i = 1; ; i++) if (!taken.has(ordinal(i))) return { index: i, name: ordinal(i) };
}

// ---------- arguments ----------
function parseArgs(argv) {
  const o = { kinds: ['commands', 'skills'], only: null, skip: new Set(), model: 'opus', timeout: 900, out: null, topic: null, dryRun: false, static: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--kinds') o.kinds = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--only') o.only = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--skip') for (const s of argv[++i].split(',')) o.skip.add(s.trim());
    else if (a === '--model') o.model = argv[++i];
    else if (a === '--timeout') o.timeout = Number(argv[++i]);
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--topic') o.topic = argv[++i];
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--static') o.static = true;
    else throw new Error(`unknown argument ${a}`);
  }
  return o;
}

const DEFAULT_TOPIC = "the RoT DtD Commander 5.0.0 release: the Adiutor Stop check now completes a lagging answer from the payload's last_assistant_message";

// ---------- the roster ----------
export function roster(claude, kinds) {
  const names = [];
  if (kinds.includes('commands')) {
    const d = join(claude, 'commands');
    if (existsSync(d)) for (const f of readdirSync(d)) if (f.endsWith('-dtd.md')) names.push({ name: f.slice(0, -3), kind: 'command', file: join(d, f) });
  }
  if (kinds.includes('skills')) {
    const d = join(claude, 'skills');
    if (existsSync(d)) for (const s of readdirSync(d)) if (s.endsWith('-dtd') && existsSync(join(d, s, 'SKILL.md'))) names.push({ name: s, kind: 'skill', file: join(d, s, 'SKILL.md') });
  }
  return names.sort((a, b) => a.name.localeCompare(b.name));
}

// Files whose DOCTYPE carries the cc-ask gate take --no-gate in a headless
// run; names that write take a scratch working directory seeded for them;
// names that audit a file take a path to a file that exists.
function planFor(entry, topic, work, claude) {
  const text = readFileSync(entry.file, 'utf8');
  const gated = text.includes('begin subset cc-ask');
  const seed = (rel, from) => {
    const p = join(work, rel);
    mkdirSync(dirname(p), { recursive: true });
    cpSync(from, p, { recursive: true });
    return p;
  };
  let arg = topic;
  switch (entry.name) {
    case 'audit-skill-dtd': arg = join(ROOT, 'skills', 'records-dtd', 'SKILL.md'); break;
    case 'audit-slash-command-dtd': arg = join(ROOT, 'commands', 'pareto-dtd.md'); break;
    case 'audit-subagent-dtd': arg = join(ROOT, 'agents', 'skill-auditor-dtd.md'); break;
    case 'heal-skill-dtd': arg = seed('.claude/skills/records-dtd', join(ROOT, 'skills', 'records-dtd')); break;
    case 'catalog-dtd':
      seed('.claude/commands/pareto-dtd.md', join(ROOT, 'commands', 'pareto-dtd.md'));
      seed('.claude/commands/witnesses-dtd.md', join(ROOT, 'commands', 'witnesses-dtd.md'));
      writeFileSync(join(work, 'README.md'), '# Commands\n\n- pareto-dtd\n', 'utf8');
      arg = '.claude/commands README.md';
      break;
    case 'check-todos-dtd':
      writeFileSync(join(work, 'TO-DOS.md'), '# TO-DOS\n\n- [ ] Verify the Adiutor C13 control on a live turn\n- [ ] Tag v5.0.0 after the sweep\n', 'utf8');
      arg = '';
      break;
    case 'add-to-todos-dtd': arg = 'verify the Adiutor C13 control on a live turn before tagging v5.0.0'; break;
    case 'run-plan-dtd':
      writeFileSync(join(work, 'PLAN.md'), '# Plan\n\n1. Create hello.txt containing the word hello.\n2. Read it back and confirm the content.\n', 'utf8');
      arg = 'PLAN.md';
      break;
    case 'setup-ralph-dtd': arg = '.'; break;
    case 'whats-next-dtd': arg = ''; break;
    case 'create-hook-dtd': case 'create-hooks-dtd': arg = 'a PostToolUse hook that logs every Bash command to .claude/bash.log'; break;
    case 'create-slash-command-dtd': case 'create-slash-commands-dtd': arg = 'a /greet command that prints a greeting with the argument as the name'; break;
    case 'create-agent-skill-dtd': case 'create-agent-skills-dtd': arg = 'a skill that explains the IUPAC multiplier prefixes used for file ordinals'; break;
    case 'create-subagent-dtd': case 'create-subagents-dtd': arg = 'a read-only agent that lists the -dtd commands installed on this machine'; break;
    case 'create-meta-prompt-dtd': case 'create-meta-prompts-dtd': arg = 'write a release note for a bug fix in a Stop hook'; break;
    case 'create-plan-dtd': case 'create-plans-dtd': arg = 'release v5.0.0 of a Claude Code plugin after a live sweep of its commands'; break;
    case 'create-prompt-dtd': arg = 'a prompt that asks a reviewer to attest a release from its ledger rows'; break;
    case 'create-mcp-servers-dtd': arg = 'a minimal MCP server exposing one tool that returns the IUPAC ordinal for an integer'; break;
    case 'run-prompt-dtd': arg = 'attest in three lines that 2 plus 2 is 4'; break;
    case 'debug-dtd': case 'debug-like-expert-dtd': arg = 'a Stop hook that reads a transcript before the final message is flushed and judges narration instead of the answer'; break;
    case 'redaction-dtd': arg = `${join(claude, 'rot-dtd-commander', 'ledger.tsv')} and ${join(ROOT, 'CHANGELOG.md')}`; break;
    case 'formula-dtd': arg = join(ROOT, 'CHANGELOG.md'); break;
    case 'clean-unclean-dtd': arg = join(ROOT, 'bin', 'adiutor.mjs'); break;
    case 'loci-dtd': arg = join(ROOT, 'checker'); break;
    case 'rot-soleil-dtd': arg = join(ROOT, 'RELEASE.md'); break;
    case 'rot-antivenom-dtd': arg = join(ROOT, 'bin', 'adiutor.mjs') + ' function answerAtStop'; break;
    case 'dtd-audit-dtd': arg = join(ROOT, 'commands', 'pareto-dtd.md'); break;
    case 'dtd-forge-dtd': arg = 'a /coin-flip-dtd command that returns heads or tails with a declared verdict'; break;
    case 'dtd-eval-dtd': arg = join(ROOT, 'commands', 'witnesses-dtd.md'); break;
    case 'phantom-library-dtd': arg = 'the library of every -dtd answer saved under artifacts'; break;
    case 'records-dtd': arg = join(claude, 'rot-dtd-commander', 'ledger.tsv'); break;
    default: break;
  }
  const prompt = `/${entry.name}${arg ? ' ' + arg : ''}${gated ? ' --no-gate' : ''}`;
  return { name: entry.name, prompt, gated };
}

// ---------- one session ----------
// A session runs for minutes and prints nothing until it ends, which from
// the outside is what a stall looks like (measured: a batch of ten went
// fifty-five minutes without a visible line and was read as hung). So the
// child is spawned asynchronously, a heartbeat line with the elapsed time
// is printed every HEARTBEAT_MS while it runs, and the ceiling kills the
// whole process tree: on Windows a plain kill reaches claude.exe alone and
// leaves the hooks and helpers it spawned running.
const HEARTBEAT_MS = 30000;
function killTree(pid) {
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  else {
    try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
  }
}
function runOne(plan, o, work, session, io) {
  const env = { ...process.env };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  const args = ['-p', plan.prompt, '--model', o.model, '--output-format', 'json', '--session-id', session, '--dangerously-skip-permissions'];
  const started = Date.now();
  return new Promise((resolveRun) => {
    // No shell: through cmd.exe the prompt is split on its spaces and a
    // trailing --no-gate becomes a CLI option (`error: unknown option`).
    // Node resolves `claude` through PATH and PATHEXT on every platform.
    const child = spawn('claude', args, { cwd: work, env, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    const beat = setInterval(() => io.log(`  ...   ${plan.name}  running ${Math.round((Date.now() - started) / 1000)}s`), HEARTBEAT_MS);
    const ceiling = setTimeout(() => { timedOut = true; killTree(child.pid); }, o.timeout * 1000);
    const finish = (status) => {
      clearInterval(beat);
      clearTimeout(ceiling);
      const seconds = Math.round((Date.now() - started) / 1000);
      let result = '';
      let parsed = null;
      try {
        parsed = JSON.parse(stdout || '');
        result = typeof parsed.result === 'string' ? parsed.result : JSON.stringify(parsed);
      } catch {
        result = stdout || '';
      }
      resolveRun({ exit: status, timedOut, seconds, result, stderr: (stderr || '').slice(-2000), parsed });
    };
    child.on('error', (e) => { stderr += String(e); finish(null); });
    child.on('close', (code) => finish(code));
  });
}

function ledgerRow(session) {
  const lp = ledgerPath();
  if (!existsSync(lp)) return null;
  return parseLedger(readFileSync(lp, 'utf8')).rows.find((row) => row.session === session) || null;
}

function saveArtifact(out, name, ord, head, body) {
  const dir = join(out, name);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.${ord.name}.md`);
  writeFileSync(file, head + (body.endsWith('\n') ? body : body + '\n'), 'utf8');
  return file;
}

// ---------- static artifacts: agents and the monitor ----------
function staticArtifacts(o, out, io, rows) {
  const check = spawnSync(process.execPath, [join(ROOT, 'bin', 'rot-dtd-commander.mjs'), 'check'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 300000 });
  const checkLines = (check.stdout || '').split('\n');
  const agentsDir = join(ROOT, 'src', 'agents');
  const agents = existsSync(agentsDir) ? readdirSync(agentsDir).filter((f) => f.endsWith('-dtd.md')).map((f) => f.slice(0, -3)) : [];
  for (const name of agents) {
    if (o.only && !o.only.includes(name)) continue;
    if (o.skip.has(name)) continue;
    const line = checkLines.find((l) => l.includes(`${name}.md`)) || '';
    const status = /^\s*OK\b/.test(line) ? 'pass' : 'fail';
    const ord = nextOrdinal(join(out, name), name);
    if (o.dryRun) { io.log(`  plan ${name} (agent, static) -> ${name}/${name}.${ord.name}.md`); continue; }
    const head = ['---', `name: ${name}`, 'kind: agent', 'mode: static (rdc check; an agent runs only as a subagent, which this machine forbids)', `ordinal: ${ord.name} (${ord.index})`, `date: ${new Date().toISOString()}`, `verdict: ${status}`, '---', ''].join('\n');
    const body = `### rdc check\n\n\`\`\`\n${line.trim()}\n\`\`\`\n\nExit ${check.status}; the line is the checker's own for \`src/agents/${name}.md\` (rules C1 to C15 of lib/dtd.mjs).\n`;
    const file = saveArtifact(out, name, ord, head, body);
    io.log(`  STATIC ${name}  ${status.toUpperCase()}  -> ${basename(file)}`);
    rows.push({ command: name, status, seconds: 0 });
  }
  const monitor = 'commander-adiutor';
  if ((!o.only || o.only.includes(monitor)) && !o.skip.has(monitor)) {
    const ord = nextOrdinal(join(out, monitor), monitor);
    if (o.dryRun) { io.log(`  plan ${monitor} (monitor, static) -> ${monitor}/${monitor}.${ord.name}.md`); return; }
    const ctl = spawnSync(process.execPath, [join(ROOT, 'bin', 'adiutor.mjs'), 'controls'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000 });
    const lines = (ctl.stdout || '').split('\n');
    const c12 = lines.find((l) => l.includes('C12 ')) || '';
    const summary = lines.find((l) => l.startsWith('controls:')) || '';
    const status = /^\s*PASS\b/.test(c12) ? 'pass' : 'fail';
    const head = ['---', `name: ${monitor}`, 'kind: monitor', 'mode: static (control C12 trips the monitor on a scratch ledger)', `ordinal: ${ord.name} (${ord.index})`, `date: ${new Date().toISOString()}`, `verdict: ${status}`, '---', ''].join('\n');
    const body = `### node bin/adiutor.mjs controls\n\n\`\`\`\n${c12.trim()}\n${summary.trim()}\n\`\`\`\n\nExit ${ctl.status}. The monitor reads the ledger only; C12 starts it on a scratch ledger, appends a pass, a fail and a malformed line, and requires exactly the two lines dtd/adiutor.dtd declares.\n`;
    const file = saveArtifact(out, monitor, ord, head, body);
    io.log(`  STATIC ${monitor}  ${status.toUpperCase()}  -> ${basename(file)}`);
    rows.push({ command: monitor, status, seconds: 0 });
  }
}

// ---------- main ----------
export async function main(argv = process.argv.slice(2), io = console) {
  const o = parseArgs(argv);
  const claude = claudeDir();
  const out = o.out ? resolve(o.out) : join(ROOT, '..', 'artifacts');
  const sweepDir = join(out, '_sweep');
  const workRoot = join(sweepDir, '.work');
  mkdirSync(sweepDir, { recursive: true });
  let entries = roster(claude, o.kinds);
  if (o.only) entries = entries.filter((e) => o.only.includes(e.name));
  entries = entries.filter((e) => !o.skip.has(e.name));
  const topic = o.topic || DEFAULT_TOPIC;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const log = join(sweepDir, `sweep-${stamp}.tsv`);
  const rows = [];
  io.log(`live-sweep: ${entries.length} name(s) (${o.kinds.join('+')}), model ${o.model}, ceiling ${o.timeout} s each, out ${out}/<name>/${o.static ? ', static agents+monitor' : ''}${o.dryRun ? ' (dry run)' : ''}`);
  for (const entry of entries) {
    // A previous session's hooks can leave an indexer holding a database
    // open in the scratch directory (measured: EPERM on lock.mdb); a locked
    // directory is left alone and a fresh one is used beside it.
    let work = join(workRoot, entry.name);
    try {
      rmSync(work, { recursive: true, force: true });
    } catch {
      work = join(workRoot, `${entry.name}.${Date.now()}`);
    }
    mkdirSync(work, { recursive: true });
    const plan = planFor(entry, topic, work, claude);
    const ord = nextOrdinal(join(out, entry.name), entry.name);
    if (o.dryRun) {
      io.log(`  plan ${entry.name} (${entry.kind}) -> ${entry.name}/${entry.name}.${ord.name}.md  prompt: ${plan.prompt}`);
      continue;
    }
    const session = randomUUID();
    io.log(`  START ${entry.name}  session ${session}  prompt: ${plan.prompt}`);
    const r = await runOne(plan, o, work, session, io);
    const row = ledgerRow(session);
    const status = r.timedOut ? 'timeout' : row ? row.status : 'no-ledger-row';
    const findings = row && Array.isArray(row.findings) ? row.findings.map((f) => f.msg || JSON.stringify(f)).join('; ') : '';
    const head = ['---', `name: ${entry.name}`, `kind: ${entry.kind}`, `ordinal: ${ord.name} (${ord.index})`, `session: ${session}`, `model: ${o.model}`, `prompt: ${JSON.stringify(plan.prompt)}`, `date: ${new Date().toISOString()}`, `seconds: ${r.seconds}`, `exit: ${r.timedOut ? 'timeout' : r.exit}`, `ledger: ${status}${findings ? ' ' + JSON.stringify(findings) : ''}`, '---', ''].join('\n');
    const file = saveArtifact(out, entry.name, ord, head, r.result);
    const tail = r.stderr && !row ? '  stderr: ' + r.stderr.replace(/\s+/g, ' ').slice(-300) : '';
    io.log(`  DONE  ${entry.name}  ${status.toUpperCase()}  ${r.seconds}s  exit ${r.timedOut ? 'timeout' : r.exit}  -> ${basename(file)}${findings ? '  findings: ' + findings : ''}${tail}`);
    const line = [new Date().toISOString(), entry.name, session, o.model, String(r.seconds), String(r.timedOut ? 'timeout' : r.exit), status, findings.replace(/\t/g, ' '), basename(file)].join('\t');
    rows.push({ command: entry.name, status, seconds: r.seconds });
    writeFileSync(log, (existsSync(log) ? readFileSync(log, 'utf8') : '') + line + '\n', 'utf8');
  }
  if (o.static) staticArtifacts(o, out, io, rows);
  if (o.dryRun) return 0;
  // Every run is judged, a skill's like a command's (LAW.ADIUTOR.8): the
  // ledger says pass or fail, never skipped.
  const pass = rows.filter((r) => r.status === 'pass').length;
  const bad = rows.filter((r) => r.status !== 'pass');
  io.log(`\nlive-sweep: ${rows.length} run, ${pass} pass, ${bad.length} not pass${bad.length ? ' (' + bad.map((r) => `${r.command}:${r.status}`).join(', ') + ')' : ''}; log ${log}`);
  return bad.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code)).catch((e) => {
    console.error(e.stack || String(e));
    process.exit(2);
  });
}
