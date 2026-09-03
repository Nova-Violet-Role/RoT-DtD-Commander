#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/about-sweep.mjs [--controls]
// The repository's own About section, held to the tree.
//
// Every count the repository publishes has an instrument except the one a
// visitor reads first. The About sat at "5.0.0 ... 118 Claude Code commands"
// through three releases and nothing could tell, because nothing read it: the
// counts sweep guards the README, the manifests and the badges, and the About
// lives on GitHub, not on disk.
//
// This sweep reads it through the API and refuses a drift: the counts must be
// the ones the tree measures, and every capability named in `MUST_NAME` must
// appear. It also holds the three manifest descriptions to each other, which
// needs no network at all.
//
// Without a token there is nothing to read, and that is said out loud and
// exits 0: a check that did not run must never look like a check that passed.
//
//   node checker/about-sweep.mjs            read the About and refuse a drift
//   node checker/about-sweep.mjs --controls plant each drift and watch it named

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { measure } from './counts-sweep.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'Nova-Violet-Role/RoT-DtD-Commander';

// What the About must say, whatever else it says. Each is a capability a
// visitor deciding whether to install would look for.
export const MUST_NAME = ['commands', 'skills', 'agents', 'DTD', 'trust boundary', 'Adiutor', 'DOCTYPE'];
export const CAP = 350;

export function token() {
  const r = spawnSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', timeout: 30000 });
  return (/^password=(.+)$/m.exec(r.stdout || '') || [])[1] || null;
}

export function fetchAbout(tok) {
  const r = spawnSync('curl', ['-s', '-m', '60', '-H', `Authorization: Bearer ${tok}`, `https://api.github.com/repos/${REPO}`], { encoding: 'utf8', timeout: 90000 });
  try {
    const j = JSON.parse(r.stdout || '{}');
    if (j.message) return { error: j.message };
    return { description: j.description || '', topics: j.topics || [] };
  } catch { return { error: 'the API returned something that is not JSON' }; }
}

// The judgement, separated from the fetching so the controls can plant text.
export function judge(about, c = measure(ROOT)) {
  const findings = [];
  const d = String(about.description || '');
  if (!d) findings.push('the About is empty');
  if (d.length > CAP) findings.push(`the About is ${d.length} characters, over the ${CAP} the field allows`);
  // "123 Claude Code commands" and "123 commands" both count.
  for (const [n, label] of [[c.commands, 'commands'], [c.skills, 'skills'], [c.agents, 'agents']]) {
    const m = new RegExp(`(\\d+) (?:Claude Code )?${label}`).exec(d);
    if (!m) findings.push(`the About names no count of ${label}`);
    else if (Number(m[1]) !== n) findings.push(`the About says ${m[1]} ${label}, the tree measures ${n}`);
  }
  for (const word of MUST_NAME) {
    if (!new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(d)) findings.push(`the About names no ${word}`);
  }
  // A version inside the About is release archaeology: it goes stale the day
  // after it is written, which is how this one reached two majors behind.
  const v = /\b\d+\.\d+\.\d+\b/.exec(d);
  if (v) findings.push(`the About carries the version ${v[0]}; it goes stale on the next release and the CHANGELOG already holds it`);
  return findings;
}

// No network: the three descriptions must tell one story.
export function manifests(root = ROOT, c = measure(root)) {
  const findings = [];
  const texts = {
    'package.json': JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).description || '',
    '.claude-plugin/plugin.json': JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8')).description || '',
    '.claude-plugin/marketplace.json': (JSON.parse(readFileSync(join(root, '.claude-plugin', 'marketplace.json'), 'utf8')).plugins || [{}])[0].description || '',
  };
  for (const [file, text] of Object.entries(texts)) {
    if (!text) { findings.push(`${file}: no description`); continue; }
    const m = /(\d+) (?:Claude Code )?commands/.exec(text);
    if (!m) findings.push(`${file}: the description names no count of commands`);
    else if (Number(m[1]) !== c.commands) findings.push(`${file}: the description says ${m[1]} commands, the tree measures ${c.commands}`);
    // The pattern this sweep exists to refuse: a description that grew by one
    // clause per release until it read as a changelog.
    const arch = text.match(/\b\d+\.\d+\.\d+ adds\b|\bfrom \d+\.\d+\.\d+\b|\(\d+\.\d+\.\d+\)/g);
    if (arch) findings.push(`${file}: the description carries release archaeology (${arch.join(', ')}); it says what a release added rather than what the thing is`);
  }
  return findings;
}

function controls() {
  let fail = 0;
  let ran = 0;
  const say = (ok, text) => { ran++; console.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const c = measure(ROOT);
  const good = {
    description: `The creator kit: ${c.commands} Claude Code commands, ${c.skills} skills and ${c.agents} agents that carry their own DTD grammar, laws and trust boundary. The Adiutor checks every answer against the DOCTYPE that produced it.`,
    topics: ['dtd'],
  };
  say(judge(good, c).length === 0, 'an About that matches the tree reports nothing');
  const stale = { ...good, description: good.description.replace(`${c.commands} Claude Code commands`, '118 Claude Code commands') };
  const d1 = judge(stale, c);
  say(d1.length === 1 && /says 118 commands, the tree measures/.test(d1[0]), `trip: a stale count is named: ${d1[0] || 'nothing'}`);
  const versioned = { ...good, description: `RoT DtD Commander 5.0.0, ${good.description}` };
  say(judge(versioned, c).some((f) => /carries the version 5\.0\.0/.test(f)), 'trip: a version inside the About is named as the archaeology it is');
  const quiet = { ...good, description: good.description.replace('The Adiutor checks every answer against the DOCTYPE that produced it.', '') };
  const d3 = judge(quiet, c);
  say(d3.some((f) => /names no Adiutor/.test(f)) && d3.some((f) => /names no DOCTYPE/.test(f)), 'trip: an About that stops naming what it guarantees is named');
  say(judge({ ...good, description: 'x'.repeat(CAP + 1) }, c).some((f) => /over the 350/.test(f)), `trip: an About over the ${CAP} character cap is refused`);
  say(manifests(ROOT, c).length === 0, `the three manifest descriptions agree with the tree and carry no release archaeology`);
  const planted = manifests(ROOT, c).length === 0;
  say(planted, 'the manifests as they stand report nothing');
  console.log(`about-sweep controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv[2] === '--controls') process.exit(controls() ? 0 : 1);
  const c = measure(ROOT);
  const local = manifests(ROOT, c);
  for (const f of local) console.log(`  DRIFT ${f}`);
  const tok = token();
  if (!tok) {
    console.log('  NOT CHECKED no GitHub credential on this machine, so the About itself was not read; the manifests were');
    console.log(`about-sweep: manifests ${local.length === 0 ? 'in step' : `${local.length} drifted`}, the About not read`);
    process.exit(local.length === 0 ? 0 : 1);
  }
  const about = fetchAbout(tok);
  if (about.error) {
    console.log(`  NOT CHECKED the API said: ${about.error}`);
    process.exit(local.length === 0 ? 0 : 1);
  }
  const remote = judge(about, c);
  for (const f of remote) console.log(`  DRIFT ${f}`);
  console.log(`about-sweep: the About is ${about.description.length} of ${CAP} characters with ${about.topics.length} topics, ${remote.length} drifted; manifests ${local.length} drifted`);
  process.exit(remote.length === 0 && local.length === 0 ? 0 : 1);
}
