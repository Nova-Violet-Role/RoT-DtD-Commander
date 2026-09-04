#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/counts-sweep.mjs [--controls]
// Every count the repository publishes, measured from the tree and held
// against the place it is printed: the README badges and tagline, the
// claims rows, the package.json, plugin.json and marketplace.json
// descriptions. Commands, skills and agents are counted from the resolved
// tree; the checked files are their sum; the Adiutor guards are the highest
// control number in bin/adiutor.mjs; the checker controls are the highest
// mutation number in checker/checker-controls.sh plus one; the declarations
// are what checker/contract-audit.mjs prints. A number in words (twenty-six)
// is read through a small table. The tenth companion pass found three of
// these stale in one release after the gate had passed; this is the
// instrument that was missing. --controls plants a wrong number in a copy of
// each file and proves it is reported.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const WORDS = { ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, 'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24, 'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28, 'twenty-nine': 29, thirty: 30 };
const num = (s) => (/^\d+$/.test(s) ? Number(s) : WORDS[s.toLowerCase()]);

// Run an instrument in the foreground and hand back what it printed. A number
// in a claim row is only a claim until this reads it back.
function runOut(cmd) {
  const parts = cmd.split(' ');
  const r = spawnSync(parts[0], parts.slice(1), { cwd: ROOT, encoding: 'utf8', timeout: 300000, stdio: ['ignore', 'pipe', 'pipe'] });
  return (r.stdout || '') + (r.stderr || '');
}

export function measure(root = ROOT) {
  const commands = readdirSync(join(root, 'commands')).filter((f) => f.endsWith('.md')).length;
  const skills = readdirSync(join(root, 'skills')).filter((d) => existsSync(join(root, 'skills', d, 'SKILL.md'))).length;
  const agents = readdirSync(join(root, 'agents')).filter((f) => f.endsWith('.md')).length;
  const guards = Math.max(...[...readFileSync(join(root, 'bin', 'adiutor.mjs'), 'utf8').matchAll(/control\('C(\d+)/g)].map((m) => Number(m[1])));
  const checkerControls = Math.max(...[...readFileSync(join(root, 'checker', 'checker-controls.sh'), 'utf8').matchAll(/\bM(\d+)\b/g)].map((m) => Number(m[1]))) + 1;
  const audit = spawnSync(process.execPath, [join(root, 'checker', 'contract-audit.mjs')], { cwd: root, encoding: 'utf8', timeout: 120000 });
  const m = String(audit.stdout || '').match(/contract-audit: (\d+) declarations/);
  if (!m) throw new Error(`counts-sweep: contract-audit printed no declarations count: ${String(audit.stdout || audit.stderr).slice(0, 120)}`);
  const gateChain = Number((/gate-sync: (\d+) commands in the gate chain/.exec(runOut('node checker/gate-sync.mjs')) || [])[1] || 0);
  const amplifyControls = Number((/amplify controls: (\d+) run/.exec(runOut('node lib/amplify.mjs controls')) || [])[1] || 0);
  const listControls = Number((/list controls: (\d+) run/.exec(runOut('node lib/list.mjs controls')) || [])[1] || 0);
  const starlistControls = Number((/starlist controls: (\d+) run/.exec(runOut('node lib/starlist.mjs controls')) || [])[1] || 0);
  return {
    gateChain,
    listControls, starlistControls,
    amplifyControls, commands, skills, agents, checked: commands + skills + agents, guards, checkerControls, declarations: Number(m[1]) };
}

// Where each count is printed: a file, a pattern with one capture per
// number, and the measured names the captures must equal.
export function places(c) {
  return [
    { file: 'README.md', re: /badge\/checked-(\d+)_files/, want: [c.checked], label: 'the Checker badge' },
    { file: 'README.md', re: /contract_audit-(\d+)_declarations/, want: [c.declarations], label: 'the Contract badge' },
    { file: 'README.md', re: /guards_tripped_on_purpose-(\d+)_%2B_(\d+)/, want: [c.guards, c.checkerControls], label: 'the Controls badge' },
    { file: 'README.md', re: /\*(\d+) Claude Code slash commands, (\d+) skills and (\d+) agents/, want: [c.commands, c.skills, c.agents], label: 'the tagline' },
    { file: 'README.md', re: /\| (\d+) commands, (\d+) skills, (\d+) agents carry a DOCTYPE/, want: [c.commands, c.skills, c.agents], label: 'the claims row of the counts' },
    { file: 'README.md', re: /`checked (\d+)  failed 0`/, want: [c.checked], label: 'the claims row of the checker' },
    { file: 'README.md', re: /adiutor\.mjs controls\s+# ([a-z-]+) guards;/, want: [c.guards], label: 'the verify line of the guards' },
    { file: 'package.json', re: /(\d+) Claude Code commands/, want: [c.commands], label: 'the package description' },
    { file: 'package.json', re: /(\d+) skills and (\d+) agents/, want: [c.skills, c.agents], label: 'the package description, skills and agents' },
    { file: '.claude-plugin/plugin.json', re: /(\d+) Claude Code commands, (\d+) skills and (\d+) agents/, want: [c.commands, c.skills, c.agents], label: 'the plugin description' },
    { file: '.claude-plugin/plugin.json', re: /(\d+) declarations/, want: [c.declarations], label: 'the plugin description, declarations' },
    { file: '.claude-plugin/plugin.json', re: /([a-z-]+) Adiutor guards and ([a-z-]+) checker controls/, want: [c.guards, c.checkerControls], label: 'the plugin description, guards' },
    { file: '.claude-plugin/marketplace.json', re: /"(\d+) commands, (\d+) of them -dtd/, want: [c.commands, c.commands - 1], label: 'the marketplace plugin description' },
    // The claim rows publish what an instrument prints; a row that no longer
    // re-runs is exactly what this sweep exists to refuse.
    { file: 'README.md', re: /gate-sync\.mjs`: `(\d+) commands in the gate chain/, want: [c.gateChain], label: 'the claims row of the gate chain' },
    { file: 'README.md', re: /amplify\.mjs controls`: `(\d+) run, 0 failing/, want: [c.amplifyControls], label: 'the claims row of the amplify controls' },
    { file: 'README.md', re: /list\.mjs controls`: `(\d+) run, 0 failing/, want: [c.listControls], label: 'the claims row of the list controls' },
    { file: 'CHANGELOG.md', re: /lib\/list\.mjs controls`: (\d+) run/, want: [c.listControls], label: 'the changelog list controls' },
    { file: 'RELEASE.md', re: /lib\/list\.mjs controls` (\d+) run/, want: [c.listControls], label: 'the release notes list controls' },
    { file: 'CHANGELOG.md', re: /lib\/starlist\.mjs controls`: (\d+) run/, want: [c.starlistControls], label: 'the changelog starlist controls' },
    { file: '.claude-plugin/marketplace.json', re: /(\d+) skills and (\d+) agents/, want: [c.skills, c.agents], label: 'the marketplace plugin description, skills and agents' },
  ];
}

export function check(c, texts) {
  const out = [];
  for (const p of places(c)) {
    const text = texts[p.file];
    if (text === undefined) { out.push(`${p.file}: not read`); continue; }
    const m = text.match(p.re);
    if (!m) { out.push(`${p.file}: ${p.label} not found (${p.re.source.slice(0, 50)})`); continue; }
    p.want.forEach((w, i) => { const have = num(m[i + 1]); if (have !== w) out.push(`${p.file}: ${p.label} says ${m[i + 1]}, the tree measures ${w}`); });
  }
  return out;
}

function readAll(root = ROOT) {
  const texts = {};
  for (const f of new Set(places({}).map((p) => p.file))) texts[f] = readFileSync(join(root, f), 'utf8');
  return texts;
}

function controls(c, texts) {
  let fail = 0;
  const say = (ok, text) => { console.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  say(check(c, texts).length === 0, 'the tree as it stands reports nothing');
  const planted = { ...texts, 'README.md': texts['README.md'].replace(/badge\/checked-(\d+)_files/, 'badge/checked-1_files') };
  const d1 = check(c, planted);
  say(d1.length === 1 && /Checker badge says 1, the tree measures/.test(d1[0]), `trip: a planted Checker badge is reported by name: ${d1[0] || 'nothing'}`);
  const words = { ...texts, 'README.md': texts['README.md'].replace(/adiutor\.mjs controls\s+# [a-z-]+ guards;/, 'adiutor.mjs controls         # twenty guards;') };
  const d2 = check(c, words);
  say(d2.length === 1 && /says twenty, the tree measures/.test(d2[0]), `trip: a count in words is read and a stale one reported: ${d2[0] || 'nothing'}`);
  const gone = { ...texts, 'package.json': texts['package.json'].replace(/\d+ Claude Code commands/, 'many commands') };
  const d3 = check(c, gone);
  say(d3.length === 1 && /package description not found/.test(d3[0]), `trip: a count removed from a description is reported as not found: ${d3[0] || 'nothing'}`);
  console.log(`counts-sweep controls: 4 run, ${fail} failing`);
  return fail === 0;
}

function main() {
  const c = measure();
  const texts = readAll();
  const summary = `commands ${c.commands}, skills ${c.skills}, agents ${c.agents}, checked ${c.checked}, guards ${c.guards}, checker controls ${c.checkerControls}, declarations ${c.declarations}`;
  if (process.argv[2] === '--controls') process.exit(controls(c, texts) ? 0 : 1);
  const d = check(c, texts);
  for (const line of d) console.log(`  DRIFT ${line}`);
  console.log(`counts-sweep: ${summary}; ${d.length === 0 ? `${places(c).length} places in step` : `${d.length} places drifted`}`);
  process.exit(d.length === 0 ? 0 : 1);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
