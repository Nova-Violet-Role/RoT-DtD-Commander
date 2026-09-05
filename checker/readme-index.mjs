#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/readme-index.mjs [--check | --controls]
// The command, skill and agent index of the README, generated from the
// resolved tree (commands/, skills/, agents/) and dtd/sigils.json between
// the markers <!-- rdc-index:begin --> and <!-- rdc-index:end -->: a
// mermaid map of the families with their counts, one badge per family that
// jumps to its section, one collapsible table per family (the command, its
// sigil, what it does in the first sentence of the file's own description),
// then the skills and the agents. Every command belongs to exactly one
// family by an explicit rule below; a command no rule claims fails the run,
// so a new command must be placed before it ships. --check regenerates the
// block and compares it with the README (the gate's sweep: exit 1 on any
// difference, the differing lines named); --controls proves that a row
// removed from the README is reported and that an unclaimed name is refused.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BEGIN = '<!-- rdc-index:begin -->';
const END = '<!-- rdc-index:end -->';
const SENTENCE_MAX = 140;

// The families, in the order the README shows them. `rep` names the command
// whose sigil the family borrows; `members` and `patterns` claim commands by
// key (the file name without -dtd.md).
export const FAMILIES = [
  { id: 'thinking', name: 'Thinking models', rep: 'pareto', color: '27ae60',
    members: ['pareto', 'swot', '5-whys', '10-10-10', 'eisenhower-matrix', 'occams-razor', 'inversion', 'one-thing', 'opportunity-cost', 'via-negativa', 'first-principles', 'second-order'] },
  { id: 'research', name: 'Research', rep: 'deep-dive', color: '2980b9',
    members: ['deep-dive', 'deep-scratch', 'competitive', 'feasibility', 'history', 'landscape', 'open-source', 'options', 'technical'] },
  { id: 'asking', name: 'Asking and deciding', rep: 'ask-me-questions', color: '8e44ad',
    members: ['ask-me-questions', 'ask-me-many-questions', 'ask-me-preview', 'brainstorm-meta-clear-section'], patterns: [/^coin-flip/] },
  { id: 'shelf', name: 'The Phantom Books shelf', rep: 'phantom', color: 'd35400',
    members: ['phantom', 'tetralemma', 'loci', 'babel', 'catalog', 'count-the-library', 'goetia', 'clean-unclean', 'eleusis', 'voluspa', 'havamal', 'atharvan', 'sutra', 'wu-wei', 'water', 'witnesses', 'four-branches', 'redaction', 'sapiential', 'formula'] },
  { id: 'lenses', name: 'The RoT MoE lenses', rep: 'rot-elevate', color: '16a085', patterns: [/^rot-/] },
  { id: 'creators', name: 'Creators', rep: 'create-plugin', color: 'c0392b',
    members: ['create-plugin', 'create-moe', 'create-router', 'create-ot-variants', 'create-db', 'create-monitor', 'create-mcp', 'create-workflowjson', 'create-agent-skill', 'create-hook', 'create-slash-command', 'create-subagent', 'create-plan'] },
  { id: 'prompts', name: 'Prompt creators, one per schematic', rep: 'create-prompt', color: '7f8c8d', patterns: [/^create-(meta-)?prompt(-|$)/] },
  { id: 'filetypes', name: 'File types and dorks', rep: 'create-filetype', color: 'f39c12', patterns: [/^create-filetype/, /^create-dork/] },
  { id: 'tasks', name: 'Tasks', rep: 'create-task', color: '2c3e50',
    members: ['create-task', 'audit-tasks', 'create-workflow-tasks', 'task-run', 'task-handoff'] },
  { id: 'repository', name: 'Repository', rep: 'git-gh-amplification', color: '9b59b6',
    members: ['git-gh-amplification', 'repo-git-scalar', 'repo-creativity-askingstorm'] },
  { id: 'audits', name: 'Audits, in the foreground', rep: 'audit-skill', color: '1abc9c',
    members: ['audit-skill', 'audit-slash-command', 'audit-subagent', 'ai-slop'] },
  { id: 'growth', name: 'Codebase growth', rep: 'amplify-codebase', color: '16a34a',
    members: ['amplify-codebase', 'enhance-codebase', 'overhaul-codebase'] },
  { id: 'lists', name: 'The lists', rep: 'file-blacklist', color: 'c0392b',
    members: ['file-blacklist', 'code-blacklist', 'file-graylist', 'code-graylist', 'file-whitelist', 'code-whitelist', 'starlist', 'starlist-manager'] },
  { id: 'workflow', name: 'Workflow and the Adiutor', rep: 'RoT-DtD-Commander-Adiutor', color: 'e67e22',
    members: ['whats-next', 'add-to-todos', 'check-todos', 'run-plan', 'heal-skill', 'debug', 'setup-ralph', 'RoT-DtD-Commander-Adiutor'] },
];

export function classify(key) {
  const hits = FAMILIES.filter((f) => (f.members || []).includes(key) || (f.patterns || []).some((p) => p.test(key)));
  if (hits.length !== 1) throw new Error(`readme-index: ${key} is claimed by ${hits.length} families (${hits.map((h) => h.id).join(', ') || 'none'}); place it in exactly one`);
  return hits[0];
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split('\n')) {
    const k = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (k) out[k[1]] = k[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
  return out;
}

export function firstSentence(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const m = t.match(/^(.*?[.!?])(\s|$)/);
  let s = m ? m[1] : t;
  if (s.length > SENTENCE_MAX) s = s.slice(0, SENTENCE_MAX - 1).replace(/\s+\S*$/, '') + '…';
  return s.replace(/\|/g, '\\|');
}

function badgeText(s) {
  return encodeURIComponent(s.replace(/-/g, '--').replace(/_/g, '__').replace(/ /g, '_'));
}

export function collect(root = ROOT) {
  const sigils = JSON.parse(readFileSync(join(root, 'dtd', 'sigils.json'), 'utf8'));
  const commands = readdirSync(join(root, 'commands')).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const key = f.replace(/\.md$/, '').replace(/-dtd$/, '');
    const fm = frontmatter(readFileSync(join(root, 'commands', f), 'utf8'));
    return { key, token: '/' + f.replace(/\.md$/, ''), sigil: sigils[key] || '', does: firstSentence(fm.description), family: classify(key).id };
  });
  const skills = readdirSync(join(root, 'skills')).filter((d) => existsSync(join(root, 'skills', d, 'SKILL.md'))).sort().map((d) => {
    const fm = frontmatter(readFileSync(join(root, 'skills', d, 'SKILL.md'), 'utf8'));
    return { name: d, does: firstSentence(fm.description) };
  });
  const agents = readdirSync(join(root, 'agents')).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const key = f.replace(/\.md$/, '').replace(/-dtd$/, '');
    const fm = frontmatter(readFileSync(join(root, 'agents', f), 'utf8'));
    return { name: f.replace(/\.md$/, ''), sigil: sigils[key] || '', does: firstSentence(fm.description) };
  });
  return { sigils, commands, skills, agents };
}

// ---------- the family map, drawn ----------
// The hub-and-spoke the mermaid fence used to describe. Each spoke carries the
// family's own declared colour, so the drawing and the badges agree without
// either being told about the other.
const SVG_ESC = (s) => String(s)
  .split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');

export function renderMapSvg(fams, totals, theme) {
  const dark = theme === 'dark';
  const bg = dark ? '#0f1117' : '#ffffff';
  const fg = dark ? '#e6e9ef' : '#1a1d24';
  const dim = dark ? '#9aa3b2' : '#5b6472';
  const hub = dark ? '#1d2230' : '#f2f4f8';
  const rowH = 34, top = 46, hubW = 210, gap = 90, nodeW = 330;
  const H = top + fams.length * rowH + 30;
  const W = 40 + hubW + gap + nodeW + 40;
  const hubX = 40, hubY = Math.round(H / 2 - 34);
  const nodeX = hubX + hubW + gap;
  const S = [];
  S.push('<?xml version="1.0" encoding="UTF-8"?>');
  S.push('<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->');
  S.push('<!-- Copyright 2026 Saimonokuma. GENERATED by checker/readme-index.mjs. -->');
  S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">`);
  S.push(`<rect width="${W}" height="${H}" fill="${bg}"/>`);
  // the hub
  S.push(`<rect x="${hubX}" y="${hubY}" width="${hubW}" height="68" rx="10" fill="${hub}"/>`);
  S.push(`<text x="${hubX + hubW / 2}" y="${hubY + 28}" font-size="14" font-weight="600" fill="${fg}" text-anchor="middle">RoT DtD Commander</text>`);
  S.push(`<text x="${hubX + hubW / 2}" y="${hubY + 50}" font-size="12" fill="${dim}" text-anchor="middle">${totals.commands} commands \u00b7 ${totals.skills} skills \u00b7 ${totals.agents} agents</text>`);
  // the spokes
  fams.forEach((f, i) => {
    const y = top + i * rowH;
    const c = '#' + f.color;
    const x1 = hubX + hubW, y1 = hubY + 34, x2 = nodeX, y2 = y + 11;
    const mid = x1 + (x2 - x1) / 2;
    S.push(`<path d="M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.55"/>`);
    S.push(`<circle cx="${x2}" cy="${y2}" r="3.5" fill="${c}"/>`);
    S.push(`<text x="${x2 + 12}" y="${y2 + 4}" font-size="12.5" fill="${fg}">${SVG_ESC(f.sigil + ' ' + f.name)}</text>`);
    S.push(`<text x="${W - 40}" y="${y2 + 4}" font-size="11.5" fill="${dim}" text-anchor="end">${f.rows.length}</text>`);
  });
  S.push('</svg>');
  return S.join('\n') + '\n';
}

export function render({ sigils, commands, skills, agents }) {
  const fams = FAMILIES.map((f) => ({ ...f, sigil: sigils[f.rep] || '', rows: commands.filter((c) => c.family === f.id) }));
  const out = [];
  out.push(BEGIN);
  out.push(`*${commands.length} commands in ${fams.length} families, ${skills.length} skills, ${agents.length} agents. Every family opens below; the rest of this page is folded.*`);
  out.push('');
  out.push('');
  out.push(`_This index is generated by \`node checker/readme-index.mjs\` from the resolved tree; \`--check\` in the gate refuses a README that disagrees with it. ${commands.length} commands in ${fams.length} families, ${skills.length} skills, ${agents.length} agents._`);
  out.push('');
  out.push('<picture>');
  out.push('  <source media="(prefers-color-scheme: dark)" srcset="docs/families-map-dark.svg" />');
  out.push('  <img alt="The Suite as a map: one spoke per family, with its count" src="docs/families-map.svg" />');
  out.push('</picture>');
  out.push('');
  out.push(fams.map((f) => `[![${f.name}](https://img.shields.io/badge/${badgeText(f.sigil + ' ' + f.name)}-${f.rows.length}-${f.color}?style=flat-square)](#family-${f.id})`).join('\n'));
  out.push('');
  for (const f of fams) {
    out.push(`<a name="family-${f.id}"></a>`);
    out.push('<details>');
    out.push(`<summary><b>${f.sigil} ${f.name}</b> · ${f.rows.length} commands</summary>`);
    out.push('');
    out.push('| command | sigil | what it does |');
    out.push('|---|:-:|---|');
    for (const r of f.rows) out.push(`| \`${r.token}\` | ${r.sigil} | ${r.does} |`);
    out.push('');
    out.push('</details>');
    out.push('');
  }
  out.push('<a name="index-skills"></a>');
  out.push('<details>');
  out.push(`<summary><b>🎓 Skills</b> · ${skills.length}, each loading itself when its description matches</summary>`);
  out.push('');
  out.push('| skill | what it holds |');
  out.push('|---|---|');
  for (const s of skills) out.push(`| \`${s.name}\` | ${s.does} |`);
  out.push('');
  out.push('</details>');
  out.push('');
  out.push('<a name="index-agents"></a>');
  out.push('<details>');
  out.push(`<summary><b>🕵️ Agents</b> · ${agents.length}</summary>`);
  out.push('');
  out.push('| agent | sigil | what it does |');
  out.push('|---|:-:|---|');
  for (const a of agents) out.push(`| \`${a.name}\` | ${a.sigil} | ${a.does} |`);
  out.push('');
  out.push('</details>');
  out.push('');
  out.push(END);
  return out.join('\n');
}

export function splice(readme, block) {
  const b = readme.indexOf(BEGIN);
  const e = readme.indexOf(END);
  if (b < 0 || e < 0 || e < b) throw new Error('readme-index: the markers rdc-index:begin and rdc-index:end are missing from README.md or out of order');
  return readme.slice(0, b) + block + readme.slice(e + END.length);
}

export function compare(readme, block) {
  const b = readme.indexOf(BEGIN);
  const e = readme.indexOf(END);
  if (b < 0 || e < 0 || e < b) return ['the markers are missing from README.md'];
  const have = readme.slice(b, e + END.length).split('\n');
  const want = block.split('\n');
  const diff = [];
  const n = Math.max(have.length, want.length);
  for (let i = 0; i < n; i++) if (have[i] !== want[i]) diff.push(`line ${i + 1} of the block: have ${JSON.stringify(have[i] ?? '(missing)').slice(0, 90)} want ${JSON.stringify(want[i] ?? '(missing)').slice(0, 90)}`);
  return diff;
}

// Two commands wearing one sigil cannot be told apart in a heading, and
// LAW.CORE.6 makes the sigil the mark of which command answered.
export function sigilCollisions(sigils) {
  const seen = new Map();
  const out = [];
  for (const [name, s] of Object.entries(sigils)) {
    if (seen.has(s)) out.push({ sigil: s, names: [seen.get(s), name] });
    else seen.set(s, name);
  }
  return out;
}

function controls(readme, block) {
  let fail = 0;
  let ran = 0;
  const say = (ok, text) => { ran++; console.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };

  // Two commands wearing one sigil cannot be told apart in a heading. 5.1.0
  // gave ai-slop the sigil clean-unclean already had and nothing noticed.
  const live = JSON.parse(readFileSync(join(ROOT, 'dtd', 'sigils.json'), 'utf8'));
  const collisions = sigilCollisions(live);
  say(collisions.length === 0, collisions.length === 0
    ? `every sigil is worn by one command: ${Object.keys(live).length} entries, ${new Set(Object.values(live)).size} distinct`
    : `two commands share a sigil: ${collisions.map((c) => `${c.sigil} on ${c.names.join(' and ')}`).join('; ')}`);
  const planted = sigilCollisions({ ...live, 'a-planted-name': Object.values(live)[0] });
  say(planted.length === 1 && planted[0].names.includes('a-planted-name'),
    `trip: a planted duplicate sigil is named: ${planted.map((c) => c.names.join(' and ')).join('')}`);
  let threw = '';
  try { classify('zz-unclaimed-control'); } catch (e) { threw = e.message; }
  say(/claimed by 0 families/.test(threw), `trip: an unclaimed command name is refused: ${threw.slice(0, 80)}`);
  const lines = readme.split('\n');
  const idx = lines.findIndex((l) => l.startsWith('| `/pareto-dtd` |'));
  say(idx >= 0, 'landed proof: the README carries the pareto row');
  const without = lines.filter((_, k) => k !== idx).join('\n');
  const diff = compare(without, block);
  say(diff.length > 0 && diff.some((d) => /pareto/.test(d)), `trip: the README without the pareto row is reported (${diff.length} differing lines, the first names it)`);
  say(compare(readme, block).length === 0, 'the README in step reports no difference');
  console.log(`readme-index controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

function main() {
  const args = process.argv.slice(2);
  const data = collect();
  const block = render(data);
  const path = join(ROOT, 'README.md');
  const readme = readFileSync(path, 'utf8');
  const fams = FAMILIES.length;
  const summary = `${data.commands.length} commands, ${fams} families, ${data.skills.length} skills, ${data.agents.length} agents`;
  if (args[0] === '--controls') process.exit(controls(readme, block) ? 0 : 1);
  // The two map plates the block points at. Held to the tree the same way the
  // block is: a drawing that disagrees with the families is a drift like any
  // other, and a picture nobody checks is worse than a fence nobody reads.
  const famRows = FAMILIES.map((f) => ({ ...f, sigil: data.sigils[f.rep] || '', rows: data.commands.filter((c) => c.family === f.id) }));
  const totals = { commands: data.commands.length, skills: data.skills.length, agents: data.agents.length };
  const plates = [
    [join(ROOT, 'docs', 'families-map.svg'), renderMapSvg(famRows, totals, 'light')],
    [join(ROOT, 'docs', 'families-map-dark.svg'), renderMapSvg(famRows, totals, 'dark')],
  ];
  if (args[0] === '--check') {
    const diff = compare(readme, block);
    for (const d of diff.slice(0, 8)) console.log(`  DRIFT ${d}`);
    for (const [p, want] of plates) {
      if (!existsSync(p) || readFileSync(p, 'utf8') !== want) {
        console.log(`  DRIFT ${p.split(/[\\/]/).pop()}: the map differs from the families, run node checker/readme-index.mjs`);
        process.exit(1);
      }
    }
    console.log(`readme-index: ${summary}; README block ${diff.length === 0 ? 'in step' : `differs on ${diff.length} lines, run node checker/readme-index.mjs`}`);
    process.exit(diff.length === 0 ? 0 : 1);
  }
  for (const [p, want] of plates) writeFileSync(p, want, 'utf8');
  writeFileSync(path, splice(readme, block), 'utf8');
  console.log(`readme-index: ${summary}; README block and 2 map plates written`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
