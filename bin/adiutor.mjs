#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// bin/adiutor.mjs
// The RoT DtD Commander Adiutor: a doctor and an advisor in one suite.
//
//   observe <event>   hook entry; reads the Claude Code payload on stdin
//   doctor            health of the installed set, the hooks and the ledger
//   ledger [--last N] the closed runs
//   suggest           prescriptions for every failed run
//   arm | disarm      register or remove the hooks in ~/.claude/settings.json
//   controls          trip every guard on purpose; exit 1 if one does not fire
//
// State lives under <claude dir>/rot-dtd-commander/ (ROT_DTD_STATE overrides):
//   runs/<session>.json  the open run of a session
//   ledger.tsv           one line per closed run, RECORD.run fields 1..10
// Policy: ROT_DTD_ADIUTOR = off | warn | strict (default in POLICY_DEFAULT,
// bound to ADIUTOR.policy.default in dtd/adiutor.dtd by the controls).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, appendFileSync, rmSync, unlinkSync, statSync } from 'node:fs';
import { join, dirname, resolve as presolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { readText, resolveFile, check, parseSubset, splitDoctype } from '../lib/dtd.mjs';
import { expectedFromCommand, checkAnswer, prescribe } from '../lib/render-check.mjs';
import { armSettings, disarmSettings, armedIn, EVENTS, hookCommand } from '../lib/arm.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = presolve(HERE, '..');
export const POLICY_DEFAULT = 'warn';
const STRICT_MAX_BLOCKS = 1;
const RECORD_FIELDS = ['ts', 'session', 'command', 'root', 'expected', 'tools', 'errors', 'status', 'findings', 'prescription'];

function claudeDir() {
  return process.env.CLAUDE_CONFIG_DIR ? presolve(process.env.CLAUDE_CONFIG_DIR) : join(os.homedir(), '.claude');
}
function stateDir() {
  const d = process.env.ROT_DTD_STATE ? presolve(process.env.ROT_DTD_STATE) : join(claudeDir(), 'rot-dtd-commander');
  mkdirSync(join(d, 'runs'), { recursive: true });
  return d;
}
function policy() {
  const p = (process.env.ROT_DTD_ADIUTOR || POLICY_DEFAULT).toLowerCase();
  return ['off', 'warn', 'strict'].includes(p) ? p : POLICY_DEFAULT;
}
function safeId(s) {
  const t = String(s || '').replace(/[^A-Za-z0-9-]/g, '');
  return (t || 'unknown').slice(0, 64);
}
function runPath(session) {
  return join(stateDir(), 'runs', `${safeId(session)}.json`);
}
function readRun(session) {
  const p = runPath(session);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}
function writeRun(run) {
  writeFileSync(runPath(run.session), JSON.stringify(run, null, 2) + '\n', 'utf8');
}
function dropRun(session) {
  const p = runPath(session);
  if (existsSync(p)) unlinkSync(p);
}

// ---------- ledger: RECORD.run, ten fields, CDATA fields JSON-escaped ----------

function cdata(v) {
  return JSON.stringify(v === undefined ? '' : v);
}
function ledgerPath() {
  return join(stateDir(), 'ledger.tsv');
}
export function ledgerLine(run, status, findings = [], prescription = null) {
  const fields = [
    new Date().toISOString(),
    safeId(run.session),
    run.command,
    run.root,
    cdata(run.expected.headings.filter((h) => h.required).map((h) => h.heading).join('|')),
    String(run.tools || 0),
    cdata((run.errors || []).map((e) => `${e.tool}: ${e.head}`).join(' || ')),
    status,
    cdata(findings.map((f) => f.msg).join(' || ')),
    cdata(prescription ? `${prescription.charm} RITE: ${prescription.rite}` : ''),
  ];
  return fields.join('\t');
}
function closeRun(run, status, findings = [], prescription = null) {
  appendFileSync(ledgerPath(), ledgerLine(run, status, findings, prescription) + '\n', 'utf8');
  dropRun(run.session);
}
export function parseLedger(text) {
  const rows = [];
  const bad = [];
  for (const [i, line] of text.split('\n').entries()) {
    if (!line.trim() || line.startsWith('#')) continue;
    const cols = line.split('\t');
    if (cols.length !== RECORD_FIELDS.length) {
      bad.push({ line: i + 1, columns: cols.length });
      continue;
    }
    const row = {};
    RECORD_FIELDS.forEach((k, j) => {
      row[k] = ['expected', 'errors', 'findings', 'prescription'].includes(k) ? safeParse(cols[j]) : cols[j];
    });
    rows.push(row);
  }
  return { rows, bad };
}
function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

// ---------- locating command files ----------

function commandDirs(cwd) {
  const dirs = [join(claudeDir(), 'commands')];
  if (cwd) dirs.unshift(join(cwd, '.claude', 'commands'));
  const plugins = join(claudeDir(), 'plugins', 'cache');
  if (existsSync(plugins)) {
    for (const mk of readdirSync(plugins)) {
      const mkd = join(plugins, mk);
      if (!statSync(mkd).isDirectory()) continue;
      for (const pl of readdirSync(mkd)) {
        const pld = join(mkd, pl);
        if (!statSync(pld).isDirectory()) continue;
        for (const v of readdirSync(pld)) {
          const c = join(pld, v, 'commands');
          if (existsSync(c)) dirs.push(c);
        }
      }
    }
  }
  return dirs;
}
function findCommandFile(name, cwd) {
  for (const d of commandDirs(cwd)) {
    const p = join(d, `${name}.md`);
    if (existsSync(p)) return p;
    if (existsSync(d)) {
      const hit = readdirSync(d).find((f) => f.toLowerCase() === `${name.toLowerCase()}.md`);
      if (hit) return join(d, hit);
    }
  }
  return null;
}

// ---------- transcript ----------

// The answer of the run: every assistant text block written after the user
// entry that invoked the command (the last one naming /<command>), joined
// in order. A turn can close with more than one assistant message (a tool
// call between the answer and a closing stanza, or another plugin's Stop
// hook asking for a last line, which arrives as a user entry that is not a
// prompt), and the answer is all of it, not the last block alone. With no
// command given or no such entry in the file (a hand-fed transcript) every
// assistant text counts. A torn last line is skipped, never a finding
// (LAW.ADIUTOR.2).
export function lastAssistantText(transcriptPath, command = null) {
  if (!transcriptPath || !existsSync(transcriptPath)) return '';
  const texts = [];
  let sinceCommand = null;
  const mark = command ? new RegExp('(^|[\\s>"])/' + command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])', 'i') : null;
  for (const line of readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    if (o.isSidechain) continue;
    const c = o.message && o.message.content;
    if (o.type === 'user') {
      if (!mark) continue;
      const s = typeof c === 'string' ? c : Array.isArray(c) ? c.filter((b) => b && b.type === 'text').map((b) => b.text || '').join('\n') : '';
      if (mark.test(s)) sinceCommand = [];
      continue;
    }
    if (o.type !== 'assistant') continue;
    let t = '';
    if (Array.isArray(c)) t = c.filter((b) => b && b.type === 'text').map((b) => b.text || '').join('\n');
    else if (typeof c === 'string') t = c;
    if (t.trim()) {
      texts.push(t);
      if (sinceCommand) sinceCommand.push(t);
    }
  }
  return (sinceCommand && sinceCommand.length ? sinceCommand : texts).join('\n\n');
}

// At Stop the transcript can lag the final message by a moment; read again a
// few times before concluding there is no text.
function answerAtStop(payload, command) {
  const wait = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  let text = '';
  for (let i = 0; i < 6; i++) {
    text = lastAssistantText(payload.transcript_path, command);
    if (text.trim()) break;
    wait(250);
  }
  if (!text.trim() && typeof payload.last_assistant_message === 'string') text = payload.last_assistant_message;
  const p = payload.transcript_path;
  const detail = `transcript ${p ? (existsSync(p) ? 'present' : 'missing') : 'not given'}; payload keys ${Object.keys(payload).join(',')}`;
  return { text, detail };
}

// ---------- observe ----------

function readStdinJson() {
  try {
    const raw = readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function slashCommandIn(prompt) {
  const s = String(prompt || '');
  const m = /<command-name>\s*\/([^<\s]+)\s*<\/command-name>/.exec(s) || /^\s*\/([A-Za-z0-9_.:-]+)/.exec(s);
  return m ? m[1] : null;
}

export function observe(event, payload, io = console) {
  const session = payload.session_id || 'unknown';
  const out = (s) => io.log(s);
  switch (event) {
    case 'SessionStart': {
      const lp = ledgerPath();
      if (!existsSync(lp)) return;
      const { rows, bad } = parseLedger(readFileSync(lp, 'utf8'));
      const failed = rows.filter((r) => r.status === 'fail').length;
      const stale = readdirSync(join(stateDir(), 'runs')).length;
      if (failed || stale || bad.length) out(`Adiutor: ${failed} failed run(s), ${stale} open, ${bad.length} malformed ledger line(s). Run /RoT-DtD-Commander-Adiutor for the doctor and the prescriptions.`);
      return;
    }
    case 'UserPromptSubmit': {
      const name = slashCommandIn(payload.prompt);
      if (!name || !/-dtd$/i.test(name)) return;
      const file = findCommandFile(name, payload.cwd);
      if (!file) return;
      const text = readText(file);
      const expected = expectedFromCommand(text);
      if (!expected) return;
      const prev = readRun(session);
      if (prev) closeRun(prev, 'aborted', [{ msg: 'a new -dtd command started before the Stop check' }]);
      const autonomous = /--no-gate/.test(String(payload.prompt || ''));
      writeRun({ session, command: name, file, root: expected.root, expected, tools: 0, errors: [], attempts: 0, autonomous, opened: new Date().toISOString() });
      const req = expected.headings.filter((h) => h.required).map((h) => h.heading);
      out(`Adiutor armed for /${name}: root ${expected.root}; required headings: ${req.join(', ') || 'none declared'}; ${expected.laws} laws; the answer is checked at Stop (policy ${policy()}).`);
      return;
    }
    case 'PreToolUse': {
      const run = readRun(session);
      if (!run) return;
      run.tools = (run.tools || 0) + 1;
      writeRun(run);
      return;
    }
    case 'PostToolUse':
    case 'PostToolUseFailure': {
      const run = readRun(session);
      if (!run) return;
      const resp = payload.tool_response !== undefined ? payload.tool_response : payload.tool_output;
      const s = typeof resp === 'string' ? resp : JSON.stringify(resp || '');
      const isErr = event === 'PostToolUseFailure' || /"is_error"\s*:\s*true|\bexit(?: code)?[ =:]+[1-9]\d*\b|ENOENT|EACCES|Traceback|\bError:/.test(s);
      if (isErr) {
        run.errors = run.errors || [];
        run.errors.push({ tool: payload.tool_name || 'tool', head: s.replace(/\s+/g, ' ').slice(0, 160) });
        writeRun(run);
      }
      return;
    }
    case 'SubagentStop':
    case 'PreCompact':
      return;
    case 'Stop': {
      if (payload.stop_hook_active) return;
      const run = readRun(session);
      if (!run) return;
      const { text: answer, detail } = answerAtStop(payload, run.command);
      const result = checkAnswer(answer, run.expected, { autonomous: run.autonomous });
      for (const f of result.findings) if (f.kind === 'no_answer') f.msg += ` (${detail})`;
      if (result.ok) {
        closeRun(run, 'pass');
        return;
      }
      const rx = prescribe(result.findings, run.expected, run.command);
      const pol = policy();
      run.attempts = (run.attempts || 0) + 1;
      if (pol === 'strict' && run.attempts <= STRICT_MAX_BLOCKS) {
        writeRun(run);
        out(JSON.stringify({ decision: 'block', reason: `Adiutor (strict): the answer to /${run.command} does not carry its declared grammar. ${rx.charm} Rite: ${rx.rite}` }));
        return;
      }
      closeRun(run, 'fail', result.findings, rx);
      if (pol !== 'off') out(JSON.stringify({ systemMessage: `Adiutor: /${run.command} answer failed its grammar: ${result.findings.map((f) => f.msg).join('; ')}. Run /RoT-DtD-Commander-Adiutor for the prescription.` }));
      return;
    }
    case 'StopFailure':
    case 'SessionEnd': {
      const run = readRun(session);
      if (run) closeRun(run, 'aborted', [{ msg: `session ended at ${event} before the Stop check` }]);
      return;
    }
    default:
      return;
  }
}

// ---------- doctor ----------

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}
function ver(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8' });
  return r.error || r.status !== 0 ? null : ((r.stdout || '') + (r.stderr || '')).trim().split('\n')[0];
}

export function doctor({ target = claudeDir(), io = console } = {}) {
  const rows = [];
  const row = (name, ok, detail) => rows.push({ name, ok, detail });
  const manifestPath = join(target, '.rot-dtd-commander-manifest.json');
  if (existsSync(manifestPath)) {
    const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
    let missing = 0;
    let changed = 0;
    for (const f of m.files) {
      if (!existsSync(f.path)) missing++;
      else if (sha256(readFileSync(f.path)) !== f.sha256) changed++;
    }
    row('manifest', missing === 0 && changed === 0, `${m.files.length} files, ${missing} missing, ${changed} changed since install`);
    const mains = m.files.filter((f) => /[\\/](commands|agents)[\\/][^\\/]+\.md$|SKILL\.md$/.test(f.path) && existsSync(f.path));
    let failed = 0;
    for (const f of mains) {
      const t = readText(f.path);
      if (!/<!DOCTYPE/.test(t)) continue;
      const r = check(resolveFile(t, dirname(f.path)).text, {});
      if (!r.ok) failed++;
    }
    row('checker', failed === 0, `${mains.length} installed main files, ${failed} failing C1..C14`);
  } else {
    row('manifest', false, `no manifest at ${manifestPath}; run rdc install`);
  }
  const node = process.versions.node;
  row('node', Number(node.split('.')[0]) >= 20, `node ${node}`);
  const settings = join(target, 'settings.json');
  let parsed = true;
  try {
    if (existsSync(settings)) JSON.parse(readFileSync(settings, 'utf8').replace(/^﻿/, ''));
  } catch {
    parsed = false;
  }
  row('settings.json', parsed, parsed ? 'parses' : 'does not parse; hooks cannot load');
  const armed = parsed ? armedIn(settings) : [];
  row('hooks', armed.length === EVENTS.length, `${armed.length}/${EVENTS.length} Adiutor events armed${armed.length ? ': ' + armed.join(', ') : ''}`);
  const lp = ledgerPath();
  if (existsSync(lp)) {
    const { rows: runs, bad } = parseLedger(readFileSync(lp, 'utf8'));
    const failed = runs.filter((r) => r.status === 'fail').length;
    row('ledger', bad.length === 0, `${runs.length} closed runs, ${failed} failed, ${bad.length} malformed line(s)`);
  } else row('ledger', true, 'empty (no -dtd command has run through the hooks yet)');
  const open = readdirSync(join(stateDir(), 'runs'));
  const stale = open.filter((f) => Date.now() - statSync(join(stateDir(), 'runs', f)).mtimeMs > 86400000);
  row('open runs', stale.length === 0, `${open.length} open, ${stale.length} older than a day`);
  const dup = [];
  const homeCmds = join(target, 'commands');
  if (existsSync(homeCmds)) {
    const names = new Set(readdirSync(homeCmds).filter((f) => /-dtd\.md$/i.test(f)));
    for (const d of commandDirs(null).slice(1)) if (existsSync(d)) for (const f of readdirSync(d)) if (names.has(f)) dup.push(f);
  }
  row('double install', dup.length === 0, dup.length ? `${dup.length} command(s) present both user-wide and in a plugin: ${dup.slice(0, 5).join(', ')}` : 'none');
  // The plugin path and the npx path must never both be active, and a removed
  // plugin must leave nothing behind under plugins/: cache, marketplaces and
  // the registry are each scanned for this package's name.
  const leftovers = [];
  const pdir = join(target, 'plugins');
  const scan = (d, depth) => {
    if (!existsSync(d) || depth > 3) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (/rot-dtd-commander/i.test(e.name)) leftovers.push(join(d, e.name));
      else scan(join(d, e.name), depth + 1);
    }
  };
  scan(join(pdir, 'cache'), 0);
  scan(join(pdir, 'marketplaces'), 0);
  let registered = false;
  const reg = join(pdir, 'installed_plugins.json');
  if (existsSync(reg)) {
    try {
      registered = /rot-dtd-commander/i.test(readFileSync(reg, 'utf8'));
    } catch {}
  }
  const npxInstalled = existsSync(manifestPath);
  const pluginActive = registered || leftovers.length > 0;
  row('plugin state', !(npxInstalled && pluginActive), pluginActive ? `plugin present (${registered ? 'registered' : 'not registered'}; ${leftovers.length} director${leftovers.length === 1 ? 'y' : 'ies'} under plugins/${npxInstalled ? '); the npx set is ALSO installed: keep one' : ')'}${registered ? '' : '; the plugin CLI left this behind: rdc prune-plugin removes it'}` : 'no plugin copy under plugins/cache, plugins/marketplaces or the registry');
  row('policy', true, `${policy()} (ROT_DTD_ADIUTOR=${process.env.ROT_DTD_ADIUTOR || 'unset'}; default ${POLICY_DEFAULT})`);
  for (const r of rows) io.log(`  ${r.ok ? 'OK  ' : 'FAIL'} ${r.name.padEnd(15)} ${r.detail}`);
  const bad = rows.filter((r) => !r.ok).length;
  io.log(`\ndoctor: ${rows.length} checks, ${bad} failing`);
  return bad === 0;
}

function cmdLedger(argv) {
  const n = Number((argv.find((a) => a.startsWith('--last=')) || '').split('=')[1] || (argv.includes('--last') ? argv[argv.indexOf('--last') + 1] : 10)) || 10;
  const lp = ledgerPath();
  if (!existsSync(lp)) return console.log('ledger empty');
  const { rows, bad } = parseLedger(readFileSync(lp, 'utf8'));
  for (const r of rows.slice(-n)) console.log(`  ${r.ts}  ${r.status.padEnd(7)} /${r.command} root=${r.root} tools=${r.tools}${r.findings ? ' findings: ' + r.findings : ''}`);
  console.log(`\n${rows.length} closed runs shown last ${Math.min(n, rows.length)}; malformed ${bad.length}`);
}

function cmdSuggest() {
  const lp = ledgerPath();
  if (!existsSync(lp)) return console.log('no failed runs');
  const { rows } = parseLedger(readFileSync(lp, 'utf8'));
  const failed = rows.filter((r) => r.status === 'fail');
  if (!failed.length) return console.log('no failed runs');
  for (const r of failed.slice(-10)) console.log(`- /${r.command} (${r.ts}): ${r.prescription}`);
}

// ---------- controls ----------

function control(name, fn, results) {
  try {
    const r = fn();
    results.push({ name, ok: !!r.ok, detail: r.detail });
  } catch (e) {
    results.push({ name, ok: false, detail: e.message });
  }
}

export function controls(io = console) {
  const tmp = join(os.tmpdir(), `rot-dtd-adiutor-${process.pid}`);
  mkdirSync(join(tmp, 'runs'), { recursive: true });
  process.env.ROT_DTD_STATE = tmp;
  const results = [];
  const cmdText = readText(join(ROOT, existsSync(join(ROOT, 'commands', 'pareto-dtd.md')) ? 'commands/pareto-dtd.md' : 'src/commands/pareto-dtd.md'));
  const expected = expectedFromCommand(resolveFile(cmdText, join(ROOT, 'commands')).text);
  const good = '### 🎯 Vital Few (focus here)\n\n- Factor 1\n\n### 🎯 Trivial Many (deprioritize)\n\n- x\n\n### 🎯 Bottom Line\n\none sentence\n';
  const badAnswer = good.replace('### 🎯 Bottom Line\n\none sentence\n', '');
  const crammed = good.replace(/\n\n### /g, '\n### ');
  const transcript = (text) => {
    const p = join(tmp, 'transcript.jsonl');
    writeFileSync(p, JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } }) + '\n' + '{"type":"assistant","message":{"content":[{"type":"text","te', 'utf8');
    return p;
  };
  const capture = () => {
    const lines = [];
    return { log: (s) => lines.push(String(s)), lines };
  };

  control('C1 missing heading is a finding', () => {
    if (badAnswer.includes('Bottom Line')) return { ok: false, detail: 'mutation did not land' };
    const r = checkAnswer(badAnswer, expected);
    const hit = r.findings.some((f) => f.kind === 'missing_heading' && f.msg.includes('Bottom Line'));
    return { ok: !r.ok && hit, detail: r.findings.map((f) => f.msg).join('; ') };
  }, results);

  control('C2 complete answer passes', () => {
    const r = checkAnswer(good, expected);
    return { ok: r.ok, detail: r.ok ? 'pass' : r.findings.map((f) => f.msg).join('; ') };
  }, results);

  control('C9 crammed headings are a spacing finding', () => {

    if (crammed === good) return { ok: false, detail: 'mutation did not land' };

    const r = checkAnswer(crammed, expected);

    const hit = r.findings.some((f) => f.kind === 'spacing');

    return { ok: !r.ok && hit, detail: r.findings.map((f) => f.msg).join('; ') };

  }, results);

  control('C10 the answer of a run is every assistant text after the command prompt', () => {

    // an earlier turn's answer, then the command, a tool call, the answer,

    // another hook's feedback entry, and a closing stanza: the run's answer is

    // the last three assistant texts joined, and the earlier turn is not in it

    const p = join(tmp, 'turn.jsonl');

    const L = (o) => JSON.stringify(o);

    writeFileSync(p, [

      L({ type: 'user', message: { content: 'an earlier question' } }),

      L({ type: 'assistant', message: { content: [{ type: 'text', text: '### 🎯 Bottom Line\n\nfrom an earlier turn\n' }] } }),

      L({ type: 'user', message: { content: '/pareto-dtd what first' } }),

      L({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', input: {} }] } }),

      L({ type: 'user', message: { content: [{ type: 'tool_result', content: 'x' }] } }),

      L({ type: 'assistant', message: { content: [{ type: 'text', text: good }] } }),

      L({ type: 'user', message: { content: [{ type: 'text', text: 'Stop hook feedback: close with a stanza' }] } }),

      L({ type: 'assistant', message: { content: [{ type: 'text', text: '<rot:claude>🧭 one line</rot:claude>' }] } }),

    ].join('\n') + '\n', 'utf8');

    const t = lastAssistantText(p, 'pareto-dtd');

    const joined = t.includes('### 🎯 Vital Few') && t.includes('<rot:claude>') && !t.includes('from an earlier turn');

    const stanzaLast = t.split('\n\n').pop().includes('<rot:claude>');

    const r = checkAnswer(t, expected);

    return { ok: joined && stanzaLast && r.ok, detail: `joined=${joined} stanzaLast=${stanzaLast} pass=${r.ok}` };

  }, results);

  control('C11 prune-plugin refuses while the plugin is registered, then removes the leftover', () => {

    const cfg = join(tmp, 'cfg');

    const cache = join(cfg, 'plugins', 'cache', 'rot-dtd-commander', 'rot-dtd-commander', '3.0.0');

    mkdirSync(cache, { recursive: true });

    writeFileSync(join(cache, 'x.txt'), 'x', 'utf8');

    writeFileSync(join(cfg, 'plugins', 'installed_plugins.json'), '{"plugins":{"rot-dtd-commander@rot-dtd-commander":[]}}', 'utf8');

    const bin = join(ROOT, 'bin', 'rot-dtd-commander.mjs');

    const env = { ...process.env, CLAUDE_CONFIG_DIR: cfg };

    const first = spawnSync(process.execPath, [bin, 'prune-plugin'], { env, encoding: 'utf8' });

    const refused = first.status !== 0 && existsSync(cache);

    unlinkSync(join(cfg, 'plugins', 'installed_plugins.json'));

    const second = spawnSync(process.execPath, [bin, 'prune-plugin'], { env, encoding: 'utf8' });

    const removed = second.status === 0 && !existsSync(join(cfg, 'plugins', 'cache', 'rot-dtd-commander'));

    return { ok: refused && removed, detail: `refused=${refused} (exit ${first.status}) removed=${removed} (exit ${second.status})` };

  }, results);

  control('C3 Stop under strict blocks once, then passes', () => {
    process.env.ROT_DTD_ADIUTOR = 'strict';
    writeFileSync(join(tmp, 'runs', 'S1.json'), JSON.stringify({ session: 'S1', command: 'pareto-dtd', root: 'pareto', expected, tools: 0, errors: [], attempts: 0, autonomous: false }), 'utf8');
    const tp = transcript(badAnswer);
    const io1 = capture();
    observe('Stop', { session_id: 'S1', transcript_path: tp, stop_hook_active: false }, io1);
    const blocked = io1.lines.some((l) => l.includes('"decision":"block"'));
    const io2 = capture();
    observe('Stop', { session_id: 'S1', transcript_path: tp, stop_hook_active: false }, io2);
    const second = io2.lines.some((l) => l.includes('"decision":"block"'));
    const closed = !existsSync(join(tmp, 'runs', 'S1.json'));
    delete process.env.ROT_DTD_ADIUTOR;
    return { ok: blocked && !second && closed, detail: `first block=${blocked} second block=${second} closed=${closed}` };
  }, results);

  control('C4 stop_hook_active is silent', () => {
    writeFileSync(join(tmp, 'runs', 'S2.json'), JSON.stringify({ session: 'S2', command: 'pareto-dtd', root: 'pareto', expected, tools: 0, errors: [], attempts: 0 }), 'utf8');
    const io = capture();
    observe('Stop', { session_id: 'S2', transcript_path: transcript(badAnswer), stop_hook_active: true }, io);
    const stillOpen = existsSync(join(tmp, 'runs', 'S2.json'));
    rmSync(join(tmp, 'runs', 'S2.json'));
    return { ok: io.lines.length === 0 && stillOpen, detail: `lines=${io.lines.length} open=${stillOpen}` };
  }, results);

  control('C5 ledger refuses an inserted column', () => {
    const run = { session: 'S3', command: 'x-dtd', root: 'x', expected, tools: 1, errors: [] };
    const goodLine = ledgerLine(run, 'pass');
    const cols = goodLine.split('\t');
    cols.splice(4, 0, 'INSERTED');
    const badLine = cols.join('\t');
    if (badLine.split('\t').length !== RECORD_FIELDS.length + 1) return { ok: false, detail: 'mutation did not land' };
    const r = parseLedger(goodLine + '\n' + badLine + '\n');
    return { ok: r.rows.length === 1 && r.bad.length === 1, detail: `rows=${r.rows.length} bad=${r.bad.length}` };
  }, results);

  control('C6 arm preserves foreign keys and is idempotent; a destroyed nested key is detected', () => {
    const sp = join(tmp, 'settings.json');
    writeFileSync(sp, JSON.stringify({ permissions: { allow: ['Read'], deep: { keep: 1 } }, hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo other' }] }] } }, null, 2), 'utf8');
    const a1 = armSettings(sp, join(tmp, 'hookroot'));
    const a2 = armSettings(sp, join(tmp, 'hookroot'));
    const s = JSON.parse(readFileSync(sp, 'utf8'));
    const foreignKept = s.permissions.deep.keep === 1 && s.hooks.Stop.some((e) => e.hooks[0].command === 'echo other');
    const stopCount = s.hooks.Stop.filter((e) => e.hooks[0].command.includes('adiutor.mjs')).length;
    const d = disarmSettings(sp);
    const after = JSON.parse(readFileSync(sp, 'utf8'));
    const restored = after.hooks.Stop.length === 1 && after.permissions.deep.keep === 1;
    return { ok: a1.added === EVENTS.length && a2.added === 0 && a2.unchanged === EVENTS.length && foreignKept && stopCount === 1 && d.removed === EVENTS.length && restored, detail: `added ${a1.added}, second run added ${a2.added}, foreign kept ${foreignKept}, one Stop copy ${stopCount === 1}, disarm removed ${d.removed}, restored ${restored}` };
  }, results);

  control('C7 policy default bound to dtd/adiutor.dtd', () => {
    const dtd = readText(join(ROOT, 'dtd', 'adiutor.dtd'));
    const m = /<!ENTITY ADIUTOR\.policy\.default "([^"]+)">/.exec(dtd);
    const mb = /<!ENTITY ADIUTOR\.strict\.max_blocks "([^"]+)">/.exec(dtd);
    const rec = /<!ENTITY RECORD\.run "([^"]+)">/.exec(dtd);
    const declared = rec ? rec[1].split('|').slice(2).map((f) => f.split('=')[1].split(':')[0]) : [];
    const same = JSON.stringify(declared) === JSON.stringify(RECORD_FIELDS);
    return { ok: !!m && m[1] === POLICY_DEFAULT && !!mb && Number(mb[1]) === STRICT_MAX_BLOCKS && same, detail: `dtd=${m && m[1]} code=${POLICY_DEFAULT}; max_blocks dtd=${mb && mb[1]} code=${STRICT_MAX_BLOCKS}; record fields match=${same}` };
  }, results);

  control('C8 UserPromptSubmit opens a run only for an installed -dtd command', () => {
    const fake = join(tmp, 'cwd', '.claude', 'commands');
    mkdirSync(fake, { recursive: true });
    writeFileSync(join(fake, 'pareto-dtd.md'), resolveFile(cmdText, join(ROOT, 'commands')).text, 'utf8');
    const io = capture();
    observe('UserPromptSubmit', { session_id: 'S4', cwd: join(tmp, 'cwd'), prompt: '<command-name>/pareto-dtd</command-name>' }, io);
    const opened = existsSync(join(tmp, 'runs', 'S4.json'));
    const io2 = capture();
    observe('UserPromptSubmit', { session_id: 'S5', cwd: join(tmp, 'cwd'), prompt: '<command-name>/nonexistent-dtd</command-name>' }, io2);
    const notOpened = !existsSync(join(tmp, 'runs', 'S5.json'));
    return { ok: opened && io.lines.length === 1 && io.lines[0].includes('Adiutor armed') && notOpened && io2.lines.length === 0, detail: `opened=${opened} armed-line=${io.lines.length} unknown-ignored=${notOpened}` };
  }, results);

  for (const r of results) io.log(`  ${r.ok ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  const bad = results.filter((r) => !r.ok).length;
  io.log(`\ncontrols: ${results.length} run, ${bad} failing`);
  rmSync(tmp, { recursive: true, force: true });
  return bad === 0;
}

// ---------- main ----------

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case 'observe': {
      const payload = readStdinJson();
      try {
        observe(rest[0] || payload.hook_event_name, payload);
      } catch (e) {
        process.stderr.write(`adiutor: ${e.message}\n`);
      }
      process.exit(0);
      break;
    }
    case 'doctor':
      process.exit(doctor({}) ? 0 : 1);
      break;
    case 'ledger':
      cmdLedger(rest);
      break;
    case 'suggest':
      cmdSuggest();
      break;
    case 'arm': {
      const hookRoot = rest[0] ? presolve(rest[0]) : join(claudeDir(), 'rot-dtd-commander');
      const r = armSettings(join(claudeDir(), 'settings.json'), hookRoot);
      console.log(`armed ${r.added} event(s), ${r.unchanged} already present; backup ${r.backup || 'none (no settings.json existed)'}`);
      if (r.readOnly) console.log('settings.json carried the read-only attribute; it was lifted for the write and put back');
      if (r.backup) console.log(`restore: copy "${r.backup}" over settings.json`);
      break;
    }
    case 'disarm': {
      const r = disarmSettings(join(claudeDir(), 'settings.json'));
      console.log(`disarmed ${r.removed} entry(ies); backup ${r.backup || 'none'}`);
      break;
    }
    case 'controls':
      process.exit(controls() ? 0 : 1);
      break;
    default:
      console.log('adiutor: observe <event> | doctor | ledger [--last N] | suggest | arm [hookRoot] | disarm | controls');
      process.exit(cmd ? 2 : 0);
  }
}
