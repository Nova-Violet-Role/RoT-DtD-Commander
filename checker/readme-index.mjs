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
// 10.0.0: the family prose was hand-written OUTSIDE every marker, so it said
// fifteen families while this table declared seventeen and docs/ drew nineteen
// groups -- three views of one tree that disagreed. It is generated now, from
// the notes on the rows above, and --check refuses a README that drifts.
const PROSE_BEGIN = '<!-- rdc-prose:begin -->';
const PROSE_END = '<!-- rdc-prose:end -->';
const SENTENCE_MAX = 140;

// The families, in the order the README shows them. `rep` names the command
// whose sigil the family borrows; `members` and `patterns` claim commands by
// key (the file name without -dtd.md); `note` says what the family is FOR and
// is the single source for the prose block below and for the glossary page.
//
// 10.0.0: the note used to live in checker/glossary.mjs as a local table of
// FIFTEEN keys beside a seventeen-family index, so `chain` and `sigil` had no
// description anywhere and the hand-written README prose mirrored the same
// fifteen. A note on the row makes a missing one structural: a family declared
// without one is visible here rather than silently absent three files away.
export const FAMILIES = [
  { id: 'thinking', name: 'Thinking models', rep: 'pareto', color: '27ae60',
    note: 'Classical decision frames, each rendered as a grammar rather than a prompt. Reach for one when you know the shape of the thinking you want.',
    members: ['pareto', 'swot', '5-whys', '10-10-10', 'eisenhower-matrix', 'occams-razor', 'inversion', 'one-thing', 'opportunity-cost', 'via-negativa', 'first-principles', 'second-order'] },
  { id: 'research', name: 'Research', rep: 'deep-dive', color: '2980b9',
    note: 'Gather evidence and save a dated report; every claim marked measured, reasoned or guessed, where measured means something was actually run or read.',
    members: ['deep-dive', 'deep-scratch', 'competitive', 'feasibility', 'history', 'landscape', 'open-source', 'options', 'technical', 'hadal-deep-dive', 'hadopelagia-deep-dive'] },
  { id: 'asking', name: 'Asking and deciding', rep: 'ask-me-questions', color: '8e44ad',
    note: 'Gather requirements through a declared state machine: bounded rounds, bounded re-entries, a gate that terminates by declaration rather than by your patience.',
    members: ['ask-me-questions', 'ask-me-many-questions', 'ask-me-everything', 'ask-me-preview', 'brainstorm-meta-clear-section'], patterns: [/^coin-flip/] },
  { id: 'shelf', name: 'The Phantom Books shelf', rep: 'phantom', color: 'd35400',
    note: 'One structure drawn from one book each. The instruments to reach for once the ordinary frames have returned something bland.',
    members: ['phantom', 'tetralemma', 'loci', 'babel', 'catalog', 'count-the-library', 'goetia', 'clean-unclean', 'eleusis', 'voluspa', 'havamal', 'atharvan', 'sutra', 'wu-wei', 'water', 'witnesses', 'four-branches', 'redaction', 'sapiential', 'formula'] },
  { id: 'lenses', name: 'The RoT MoE lenses', rep: 'rot-elevate', color: '16a085',
    note: 'One lens each, committed to a single way of seeing and forbidden from averaging into the others. Their value is the unblended range.',
    patterns: [/^rot-/] },
  { id: 'creators', name: 'Creators', rep: 'create-plugin', color: 'c0392b',
    note: 'Write Claude Code artifacts that pass the checker on the first run. Each gates before it writes.',
    members: ['create-plugin', 'create-moe', 'create-router', 'create-ot-variants', 'create-db', 'create-monitor', 'create-mcp', 'create-workflowjson', 'create-agent-skill', 'create-hook', 'create-slash-command', 'create-subagent', 'create-plan'] },
  { id: 'prompts', name: 'Prompt creators, one per schematic', rep: 'create-prompt', color: '7f8c8d',
    note: 'Eight prompt schematics in a plain and a meta form, with routers that choose for you. The schematic decides how a prompt survives being pasted somewhere that reformats it.',
    patterns: [/^create-(meta-)?prompt(-|$)/] },
  { id: 'filetypes', name: 'File types and dorks', rep: 'create-filetype', color: 'f39c12',
    note: 'Schematic-shaped files for a named format, and search expressions for the open web or a local tree. Reach for a dork when the hard part is the query.',
    patterns: [/^create-filetype/, /^create-dork/] },
  { id: 'tasks', name: 'Tasks', rep: 'create-task', color: '2c3e50',
    note: 'Work that outlives one session: create, audit, compose, run, hand off.',
    members: ['create-task', 'audit-tasks', 'create-workflow-tasks', 'task-run', 'task-handoff'] },
  { id: 'repository', name: 'Repository', rep: 'git-gh-amplification', color: '9b59b6',
    note: 'Operate on a repository as a whole rather than on a file in it.',
    members: ['git-gh-amplification', 'git-gh-matrix-scala', 'repo-git-scalar', 'repo-creativity-askingstorm'] },
  { id: 'audits', name: 'Audits, in the foreground', rep: 'audit-skill', color: '1abc9c',
    note: 'Judge an existing artifact against the contract it claims. They report; they do not rewrite.',
    members: ['audit-skill', 'audit-slash-command', 'audit-subagent', 'ai-slop'] },
  { id: 'growth', name: 'Codebase growth', rep: 'amplify-codebase', color: '16a34a',
    note: 'One fifteen-verb ladder. What these record is what sets the version number, because the release class is computed rather than typed.',
    members: ['amplify-codebase', 'enhance-codebase', 'overhaul-codebase'] },
  { id: 'geometry', name: 'The Graphic and Geometric Suite', rep: 'codebase-surveyor', color: '0e7490',
    note: 'Measure a codebase, draw it, change it, and produce the graphic the three agreed on, on one ladder of one hundred and eight rungs: three profession bands and four domain bands above them, read through the lens of each profession; the surveyor moves nothing, the architect declares bounds and rewrites nothing, the renovator changes only against a survey and a plan on disk, the generator launches the three or produces, and typography is the contract glyph and plate share.',
    members: ['codebase-surveyor', 'codebase-architect', 'codebase-renovator', 'codebase-generator', 'typography'] },
  { id: 'chain', name: 'Inter-operation', rep: 'chain', color: '6b21a8',
    note: 'One command that reads what you asked for and fires the others it names, in the order it declares. Reach for it when the work crosses families and you would otherwise drive each one by hand.',
    members: ['chain'] },
  { id: 'sigil', name: 'The sigil', rep: 'sigil', color: '0f766e',
    note: 'What the dollar tokens mean and how one command hands arguments to the next. Reach for these when you do not know what a token will expand to, or which of the collisions across shell, Make and this Suite you are looking at.',
    members: ['sigil', 'verbs'] },
  { id: 'lists', name: 'The lists', rep: 'file-blacklist', color: 'c0392b',
    note: 'Per-repository white, grey and black lists, plus the starlist of tools the harness may reach. A grey entry obliges a question and records the answer with a date.',
    members: ['file-blacklist', 'code-blacklist', 'file-graylist', 'code-graylist', 'file-whitelist', 'code-whitelist', 'starlist', 'starlist-manager'] },
  { id: 'workflow', name: 'Workflow and the Adiutor', rep: 'RoT-DtD-Commander-Adiutor', color: 'e67e22',
    note: 'The doctor: run it, arm it, read its ledger, compose the workflows it judges. Since 5.0.0 the Adiutor is not armed by default.',
    members: ['whats-next', 'add-to-todos', 'check-todos', 'run-plan', 'heal-skill', 'debug', 'setup-ralph', 'RoT-DtD-Commander-Adiutor'] },
];

// The two groups the README shows beside the families. They carry no commands,
// so they are not families, but the prose block covers all nineteen groups.
export const GROUPS = [
  { id: 'skills', name: 'Skills', sigil: '🎓',
    note: 'Each loads itself when its description matches what you are doing; none is invoked by name. A skill states what it writes and gates before it writes.' },
  { id: 'agents', name: 'Agents', sigil: '🕵️',
    note: 'Subagents the Suite dispatches with their own context and their own contract. They report findings; the session decides what to do with them.' },
];

export function classify(key) {
  const hits = FAMILIES.filter((f) => (f.members || []).includes(key) || (f.patterns || []).some((p) => p.test(key)));
  if (hits.length !== 1) throw new Error(`readme-index: ${key} is claimed by ${hits.length} families (${hits.map((h) => h.id).join(', ') || 'none'}); place it in exactly one`);
  return hits[0];
}

// A members array is an ORDER, not only a membership. The geometry bands run
// surveyor, architect, renovator; the lists run black, grey, white within each
// scope. Both render paths used to filter one globally alphabetical list and
// never read the array sitting beside them, so the plates published
// architect, renovator, surveyor and code-black, code-grey, code-white,
// file-black... -- measured 2026-09-07 in docs/family-the-graphic-and-
// geometric-suite.svg and docs/family-the-lists.svg. A pattern family declares
// no order and keeps the alphabetical one; an entry a members array does not
// name sorts after every entry it does.
export function memberRank(f, key) {
  const at = f && f.members ? f.members.indexOf(key) : -1;
  return at === -1 ? Number.MAX_SAFE_INTEGER : at;
}

// The hands_to a resolved command pins as a #FIXED attribute, or ''.
export function handsTo(key) {
  const p = join(ROOT, 'commands', `${key}-dtd.md`);
  if (!existsSync(p)) return '';
  const m = /hands_to\s+CDATA\s+#FIXED\s+"([^"]*)"/.exec(readFileSync(p, 'utf8'));
  return m ? m[1].replace(/-dtd$/, '') : '';
}
// One sentence per family that hands: each member in band order and where it
// hands, the cycle closed when the last hands to the first, and the members
// with no successor named as running alone.
export function handsSentence(f) {
  const keys = f.rows.map((r) => r.key);
  const hands = keys.map((k) => [k, handsTo(k)]).filter(([, to]) => to);
  if (!hands.length) return '';
  const parts = hands.map(([k, to], i) => (i === 0 ? `\`/${k}-dtd\` hands to \`/${to}-dtd\`` : `which hands ${to === hands[0][0] ? 'back ' : ''}to \`/${to}-dtd\``));
  const alone = keys.filter((k) => !hands.some(([h]) => h === k));
  return `_${parts.join(', ')}${alone.length ? `; ${alone.map((k) => `\`/${k}-dtd\``).join(' and ')} ${alone.length === 1 ? 'runs' : 'run'} alone` : ''}._`;
}

export function orderRows(rows, fam, keyOf = (r) => r.key) {
  return rows.slice().sort((a, b) => {
    const d = memberRank(fam, keyOf(a)) - memberRank(fam, keyOf(b));
    return d !== 0 ? d : String(keyOf(a)).localeCompare(String(keyOf(b)));
  });
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

// A family name as its plate's file slug. Kept identical to slug() in
// checker/glossary.mjs, which writes the plates; the two are asserted equal by
// a control there rather than trusted to stay in step by hand.
export function plateSlug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function render({ sigils, commands, skills, agents }) {
  const fams = FAMILIES.map((f) => ({ ...f, sigil: sigils[f.rep] || '', rows: orderRows(commands.filter((c) => c.family === f.id), f) }));
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
    // The hand-off sentence: a family whose members declare hands_to says how
    // each hands to the next, in band order, and names the members that run
    // alone. Read from the resolved commands, never typed (9.0.0).
    const hand = handsSentence(f);
    if (hand) { out.push(hand); out.push(''); }
    // The plate, not a table. The same 131 commands were being listed twice on
    // one page -- here as markdown rows and again under the glossary as
    // drawings -- and the duplication was the bloat, not the rendering. The
    // plates are drawn by checker/glossary.mjs from the same resolved tree.
    out.push('<picture>');
    out.push(`  <source media="(prefers-color-scheme: dark)" srcset="docs/family-${plateSlug(f.name)}-dark.svg" />`);
    out.push(`  <img alt="${f.name}: ${f.rows.length} commands with the call each one takes" src="docs/family-${plateSlug(f.name)}.svg" />`);
    out.push('</picture>');
    out.push('');
    out.push('</details>');
    out.push('');
  }
  out.push('<a name="index-skills"></a>');
  out.push('<details>');
  out.push(`<summary><b>🎓 Skills</b> · ${skills.length}, each loading itself when its description matches</summary>`);
  out.push('');
  // Plates, like the fifteen families above. These two blocks stayed markdown
  // when the families were drawn, so checker/glossary.mjs was writing
  // family-skills.svg and family-agents.svg that nothing on the page referenced:
  // four orphaned plates and 27 entries rendered unlike every other entry.
  out.push('<picture>');
  out.push('  <source media="(prefers-color-scheme: dark)" srcset="docs/family-skills-dark.svg" />');
  out.push(`  <img alt="Skills: ${skills.length}, each loading itself when its description matches" src="docs/family-skills.svg" />`);
  out.push('</picture>');
  out.push('');
  out.push('</details>');
  out.push('');
  out.push('<a name="index-agents"></a>');
  out.push('<details>');
  out.push(`<summary><b>🕵️ Agents</b> · ${agents.length}</summary>`);
  out.push('');
  out.push('<picture>');
  out.push('  <source media="(prefers-color-scheme: dark)" srcset="docs/family-agents-dark.svg" />');
  out.push(`  <img alt="Agents: ${agents.length}" src="docs/family-agents.svg" />`);
  out.push('</picture>');
  out.push('');
  out.push('</details>');
  out.push('');
  out.push(END);
  return out.join('\n');
}

// ---------- the families, in prose ----------
// One entry per group, its note read from the row that declares it. A family
// whose note is missing is named as missing rather than skipped, because a
// silently absent description is exactly how chain and sigil went undescribed
// through four releases.
export function renderProse({ sigils, commands, skills, agents }) {
  const out = [];
  out.push(PROSE_BEGIN);
  out.push('');
  out.push(`_Generated by \`node checker/readme-index.mjs\` from the notes on the family rows; \`--check\` refuses a README that disagrees. ${FAMILIES.length} families and ${GROUPS.length} further groups, ${FAMILIES.length + GROUPS.length} in all._`);
  out.push('');
  for (const f of FAMILIES) {
    const n = commands.filter((c) => c.family === f.id).length;
    const sig = sigils[f.rep] || '';
    out.push(`**${sig} ${f.name}** · ${n} ${n === 1 ? 'command' : 'commands'}`);
    out.push('');
    out.push(f.note || '_(no note declared for this family; declare one on its row in checker/readme-index.mjs)_');
    out.push('');
  }
  for (const g of GROUPS) {
    const n = g.id === 'skills' ? skills.length : agents.length;
    out.push(`**${g.sigil} ${g.name}** · ${n}`);
    out.push('');
    out.push(g.note);
    out.push('');
  }
  out.push(PROSE_END);
  return out.join('\n');
}

export function splice(readme, block) {
  const b = readme.indexOf(BEGIN);
  const e = readme.indexOf(END);
  if (b < 0 || e < 0 || e < b) throw new Error('readme-index: the markers rdc-index:begin and rdc-index:end are missing from README.md or out of order');
  return readme.slice(0, b) + block + readme.slice(e + END.length);
}

export function spliceProse(readme, block) {
  const b = readme.indexOf(PROSE_BEGIN);
  const e = readme.indexOf(PROSE_END);
  if (b < 0 || e < 0 || e < b) throw new Error('readme-index: the markers rdc-prose:begin and rdc-prose:end are missing from README.md or out of order');
  return readme.slice(0, b) + block + readme.slice(e + PROSE_END.length);
}

export function compareProse(readme, block) {
  const b = readme.indexOf(PROSE_BEGIN);
  const e = readme.indexOf(PROSE_END);
  if (b < 0 || e < 0 || e < b) return ['the markers rdc-prose:begin and rdc-prose:end are missing from README.md'];
  const have = readme.slice(b, e + PROSE_END.length).split('\n');
  const want = block.split('\n');
  const diff = [];
  const n = Math.max(have.length, want.length);
  for (let i = 0; i < n; i++) if (have[i] !== want[i]) diff.push(`line ${i + 1} of the prose block: have ${JSON.stringify(have[i] ?? '(missing)').slice(0, 90)} want ${JSON.stringify(want[i] ?? '(missing)').slice(0, 90)}`);
  return diff;
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

function controls(readme, block, data) {
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
  // A members array is an order. Until 9.0.0 both render paths filtered one
  // globally alphabetical list, so the geometry plate published architect,
  // renovator, surveyor and the lists plate put every code- entry before every
  // file- entry. This asserts the declared order AND that the alphabetical
  // order it replaces is genuinely different, so a silent revert goes red
  // instead of passing on a coincidence.
  const geom = FAMILIES.find((f) => f.id === 'geometry');
  const geomRows = orderRows(data.commands.filter((c) => c.family === 'geometry'), geom).map((c) => c.key);
  say(geomRows.join(',') === geom.members.join(','),
    `the geometry rows run in band order: ${geomRows.join(', ')}`);
  const alpha = geomRows.slice().sort((a, b) => a.localeCompare(b));
  say(alpha.join(',') !== geom.members.join(','),
    `trip: the alphabetical order differs and would be wrong: ${alpha.join(', ')}`);
  const listsFam = FAMILIES.find((f) => f.id === 'lists');
  const listRows = orderRows(data.commands.filter((c) => c.family === 'lists'), listsFam).map((c) => c.key);
  say(listRows.join(',') === listsFam.members.join(','),
    `the lists rows run black, grey, white in both scopes: ${listRows.length} rows`);
  const pat = FAMILIES.find((f) => f.id === 'prompts');
  const patRows = orderRows(data.commands.filter((c) => c.family === 'prompts'), pat).map((c) => c.key);
  say(patRows.join(',') === patRows.slice().sort((a, b) => a.localeCompare(b)).join(','),
    `a family with no members array stays alphabetical: ${patRows.length} prompt creators`);
  const lines = readme.split('\n');
  // The index publishes plates, not rows: the same 131 commands were listed twice
  // on one page and the tables came out. These two controls asserted the pareto
  // ROW and went red the moment that happened -- correctly, which is the point of
  // them. They now assert the thing the index actually carries.
  const idx = lines.findIndex((l) => l.includes('src="docs/family-thinking-models.svg"'));
  say(idx >= 0, 'landed proof: the README carries the thinking-models plate');
  const without = lines.filter((_, k) => k !== idx).join('\n');
  const diff = compare(without, block);
  // Removing one line of a <picture> shifts every line after it, so "the first
  // difference names it" was a claim about a table row and is not one about a
  // plate. What is true, and what this guard is for, is that the removal is
  // detected at all.
  say(diff.length > 0, `trip: the README without that plate is reported (${diff.length} differing lines)`);
  say(compare(readme, block).length === 0, 'the README in step reports no difference');
  // 10.0.0: every family carries its own note, and the prose block is generated
  // from them. Until this release the notes lived in checker/glossary.mjs as a
  // table of fifteen beside a seventeen-family index, so chain and sigil had no
  // description anywhere and nothing said so.
  const noteless = FAMILIES.filter((f) => !f.note);
  say(noteless.length === 0, noteless.length === 0
    ? `every family declares a note: ${FAMILIES.length} families, ${GROUPS.length} further groups`
    : `a family declares no note: ${noteless.map((f) => f.id).join(', ')}`);
  const plantedNoteless = [...FAMILIES.map((f) => ({ ...f })), { id: 'a-planted-family', name: 'A planted family' }].filter((f) => !f.note);
  say(plantedNoteless.length === 1 && plantedNoteless[0].id === 'a-planted-family',
    `trip: a family planted without a note is named: ${plantedNoteless.map((f) => f.id).join(', ')}`);
  const proseBlock = renderProse(data);
  say(compareProse(readme, proseBlock).length === 0, `the README prose covers ${FAMILIES.length + GROUPS.length} groups and is in step`);
  const proseWithout = readme.split('\n').filter((l) => !l.includes('Inter-operation')).join('\n');
  say(compareProse(proseWithout, proseBlock).length > 0,
    'trip: a README whose prose drops a family is reported');
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
  if (args[0] === '--controls') process.exit(controls(readme, block, data) ? 0 : 1);
  // The two map plates the block points at. Held to the tree the same way the
  // block is: a drawing that disagrees with the families is a drift like any
  // other, and a picture nobody checks is worse than a fence nobody reads.
  const famRows = FAMILIES.map((f) => ({ ...f, sigil: data.sigils[f.rep] || '', rows: orderRows(data.commands.filter((c) => c.family === f.id), f) }));
  const totals = { commands: data.commands.length, skills: data.skills.length, agents: data.agents.length };
  const plates = [
    [join(ROOT, 'docs', 'families-map.svg'), renderMapSvg(famRows, totals, 'light')],
    [join(ROOT, 'docs', 'families-map-dark.svg'), renderMapSvg(famRows, totals, 'dark')],
  ];
  const prose = renderProse(data);
  if (args[0] === '--check') {
    const diff = compare(readme, block);
    const pdiff = compareProse(readme, prose);
    for (const d of diff.slice(0, 8)) console.log(`  DRIFT ${d}`);
    for (const d of pdiff.slice(0, 8)) console.log(`  DRIFT ${d}`);
    for (const [p, want] of plates) {
      if (!existsSync(p) || readFileSync(p, 'utf8') !== want) {
        console.log(`  DRIFT ${p.split(/[\\/]/).pop()}: the map differs from the families, run node checker/readme-index.mjs`);
        process.exit(1);
      }
    }
    const all = diff.length + pdiff.length;
    console.log(`readme-index: ${summary}; README index and prose ${all === 0 ? 'in step' : `differ on ${all} lines, run node checker/readme-index.mjs`}`);
    process.exit(all === 0 ? 0 : 1);
  }
  for (const [p, want] of plates) writeFileSync(p, want, 'utf8');
  writeFileSync(path, spliceProse(splice(readme, block), prose), 'utf8');
  console.log(`readme-index: ${summary}; README index, prose over ${FAMILIES.length + GROUPS.length} groups, and 2 map plates written`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
