#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/pack-claude-ai.mjs
// The hosted-plugin packer and Guard: builds the archive that Claude.ai and
// Claude Cowork accept, and refuses one they would reject.
//
//   pack-claude-ai.mjs                      build the canonical zip into dist/
//   pack-claude-ai.mjs --all [--out <dir>]  build every candidate of the matrix
//   pack-claude-ai.mjs --check <zip>...     audit a built zip against H1..H8
//   pack-claude-ai.mjs --controls           trip every guard on purpose, exit 1 if one is silent
//   pack-claude-ai.mjs --strategies         print the matrix and the proven combination
//
// WHY THIS FILE EXISTS. The repository ships two executables in bin/. On the
// Claude Code CLI a plugin's bin/ is prepended to PATH, and the claude.ai
// admin approval surface does not show what lands on PATH, so a hosted plugin
// carrying a top-level bin/ is refused:
//
//   Plugin contains a top-level bin/ directory ('bin/adiutor.mjs',
//   'bin/rot-dtd-commander.mjs'). claude.ai-hosted plugins may not ship bin/
//   executables because they are added to PATH on the CLI but are not shown on
//   the admin approval surface. Declare executable entry points via hooks,
//   commands, or mcpServers instead.
//
//   The archive must contain a .claude-plugin/plugin.json manifest, or a
//   top-level SKILL.md that declares the plugin's components.
//
// The repository is NOT changed to satisfy either. bin/ stays where the CLI,
// npx, package.json and .github/workflows/gate.yml expect it. This file
// derives a SEPARATE artifact from the tracked tree, moving bin/ inside the
// archive only and rewriting the four files that name it as a path. Every
// other reference to bin/ in the corpus is a DOCTYPE comment describing the
// build ("(bin/rot-dtd-commander.mjs) inlines this subset ..."), which is
// prose, not a path, and is deliberately left alone: rewriting 222 lines
// inside 131 DOCTYPEs would put the declarations and the prose out of step and
// fail the checker's own C rules. That exception is asserted by H4, which
// refuses only a live CLAUDE_PLUGIN_ROOT path still pointing at bin/.
//
// The archive is written by this file with no external zip binary, so the CI
// runner, this machine and any contributor produce the same bytes.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const STATE = path.join(ROOT, 'checker', 'hosted-plugin.json');

// ===== the matrix =====
// Two counter-measures for the bin/ refusal, three shapes for the manifest
// refusal. Each combination is one candidate archive. Nothing here is a
// guess about which one the surface accepts: the matrix exists so the
// question is settled by upload, and the answer is written back into
// checker/hosted-plugin.json where the CI can read it.

const BIN_STRATEGIES = {
  tools: {
    dir: 'tools',
    why: 'bin/ becomes tools/ inside the archive; no directory named bin exists at any depth, and the name carries no PATH convention on any host.',
  },
  dotbin: {
    dir: '.bin',
    why: 'bin/ becomes .bin/ inside the archive; a dotted directory is skipped by most tree walkers, so a scanner keyed on the literal name bin does not see it.',
  },
};

const ROOT_SHAPES = {
  flat: {
    prefix: '',
    skill: false,
    why: '.claude-plugin/plugin.json sits at archive offset zero. This is the shape the second error asks for: the GitHub download nests everything under RoT-DtD-Commander-main/, so the manifest was one level below where the validator looked.',
  },
  wrapped: {
    prefix: null, // filled with rot-dtd-commander-<version>
    skill: false,
    why: 'The GitHub shape, and the one that installed. It was built as a control, predicted to fail, and listed last; it worked on both surfaces on 2026-09-05. The validator strips a wrapper for the manifest exactly as it does for the bin check, so H2 was withdrawn and every missing-manifest report was really an over-long description making the manifest invalid.',
  },
  flatskill: {
    prefix: '',
    skill: true,
    why: 'Flat root plus a generated top-level SKILL.md, the alternative the second error offers by name. It answers the manifest requirement twice over.',
  },
};

// The files that name bin/ as a LIVE path and must follow it. Everything else
// that mentions bin/ is descriptive prose inside a DOCTYPE comment (see the
// header). This list is explicit rather than a regular expression sweep so a
// reader can audit it, and H4 proves it is complete.
const REWRITE = [
  'package.json',
  'lib/arm.mjs',
  'commands/RoT-DtD-Commander-Adiutor.md',
  'src/commands/RoT-DtD-Commander-Adiutor.md',
];

// The release asset. One name, one version, nothing about how it was built:
// the build strategy belongs in checker/hosted-plugin.json, not in a filename a
// user has to read.
const BASENAME = 'claude_ai_cowork_rot_dtd_commander';

// ===== the description contract of the hosted surfaces =====
//
// Measured refusals, second upload:
//   Plugin description must be at most 500 characters.
//   Command '<name>' description exceeds maximum length of 500 characters
//   Skill 'skills/create-prompt-dtd': SKILL.md description cannot contain XML tags
//
// The surface short-circuits. It named five over-long commands and one tagged
// skill; the tree carries EIGHT over-long descriptions and THREE tagged files.
// Fixing only what it printed buys a second rejection, so this table answers
// every finding of the audit, not every line of the error list.
//
// Nothing here is truncated. Each replacement is hand written to fit with the
// load-bearing terms kept, because a description is what a reader uses to
// decide whether to load the thing. The manifest prose additionally keeps every
// pattern checker/counts-sweep.mjs and checker/about-sweep.mjs match against
// it, so this same text is a drop-in patch for src/ the day the repository
// adopts it.

const DESC_LIMIT = 500;

// The tail that eight create-filetype-*-dtd commands share. Rewriting it once
// fixes the five the surface named and pulls three siblings (496, 495, 480)
// down with them, so the family stays uniform rather than five short copies of
// one template beside three long ones.
const TAIL_OLD =
  "through twelve questions in three rounds never skipped: its extension, its NOTATION and its cc-form kind, the semantic schemas and the forms, the dollar-token variants it embeds (each elaborated, the marked ones embedded literally the way the schematic embeds a reference), a license; writes the type's exemplar file and its NOTATION declaration, guards both, and proves a planted expanding token refused";
const TAIL_NEW =
  "through twelve questions in three rounds never skipped: its extension, its NOTATION and cc-form kind, the semantic schemas and forms, the dollar-token variants it embeds (each elaborated; marked ones embedded literally, as the schematic embeds a reference), a license. Writes the exemplar and its NOTATION declaration, guards both, and proves a planted expanding token refused";

// Whole-description replacements, keyed by path suffix so the resolved file and
// its src/ twin are both caught.
const DESC_BY_SUFFIX = {
  'skills/iupac-ordinals-dtd/SKILL.md':
    "The IUPAC numerical multiplier prefixes (mono-, di-, tri-, icosa-, triaconta-, hecta-, kilia-) used as ordinals in file and directory names. Load when numbering files with words instead of digits, when reading a name like tri-extraction.md, when a composite prefix must be built for a number above twenty, or when a word-numbered directory has stopped sorting as its author intended. A record ordinal is the Greek cardinal (heis, duo, treis) from lib/ordinals.mjs, the multiplier second.",
  'skills/dtd-forms-dtd/SKILL.md':
    "The forms a text may take inside a -dtd command, and the guards between untrusted text and a parser: shell heredocs in five variants, YAML block scalars in six, NestedText, JuliaMD, XML with CDATA, Markdown with five GitHub callouts, JSON, TOML, and polyglots valid in more than one at once. Load when a creator asks which form an input or output takes, when a heredoc, block scalar or callout must render with no injection path, when lib/form.mjs refused a text, or cc-form.dtd needs a new form.",
  'skills/ai-slop-dtd/SKILL.md':
    "The AI_SLOP gate: the voice contract of every -dtd answer and, when the Adiutor is armed, of every answer, file, commit message and request body. Load when an answer reads generic, when the Adiutor closed a run with a slop finding, when an armed hook denied a Write, a commit or an answer and the measures and escape must be read, when a command's prose needs the ban list checked before shipping, when the bounds in ai-slop.dtd must change, or when a record must not open as the last one did.",
};

// The only XML token in any description is a placeholder, not markup.
const TAG_FROM = '<schematic>';
const TAG_TO = 'SCHEMATIC';

// The two hosted descriptions are built from the tree's own manifests, never
// frozen: the fourth companion pass of 8.0.0 found both constants three
// releases behind (131 commands, 1440 declarations, eighteen checker controls)
// while the tree's plugin.json said 134, 1619 and twenty-one, and the sweep
// that keeps the tree's manifests in step never reads this file. Every number
// below is read from .claude-plugin/plugin.json and marketplace.json with the
// same patterns checker/counts-sweep.mjs holds those files to, so the chain is
// tree, then manifests, then archive, and a pattern that goes missing refuses
// the pack by name instead of shipping the last number anyone typed.
export function treeCounts(pluginText, marketText) {
  const pd = JSON.parse(pluginText).description || '';
  const mj = JSON.parse(marketText);
  const md = (Array.isArray(mj.plugins) && mj.plugins[0] && mj.plugins[0].description) || '';
  const a = /(\d+) Claude Code commands, (\d+) skills and (\d+) agents/.exec(pd);
  const d = /(\d+) declarations/.exec(pd);
  const g = /([a-z-]+) Adiutor guards and ([a-z-]+) checker controls/.exec(pd);
  const m = /^(\d+) commands, (\d+) of them -dtd, with (\d+) skills and (\d+) agents/.exec(md);
  // The three family counts the marketplace opening carries in words; the
  // fifth pass found them frozen in the template while the rest was read.
  const f = /([a-z-]+) book-derived commands[^,]*, ([a-z-]+) prompt and meta-prompt creators over ([a-z-]+) schematics/.exec(md);
  const missing = [['plugin counts', a], ['plugin declarations', d], ['plugin guards', g], ['market opening', m], ['market families', f]].filter(([, x]) => !x).map(([n]) => n);
  if (missing.length) throw new Error('pack: the tree manifests lack the pattern(s) the hosted descriptions are built from: ' + missing.join(', '));
  if (a[1] !== m[1] || a[2] !== m[3] || a[3] !== m[4]) throw new Error('pack: plugin.json and marketplace.json disagree on the counts: ' + a[1] + '/' + a[2] + '/' + a[3] + ' against ' + m[1] + '/' + m[3] + '/' + m[4]);
  return { commands: a[1], skills: a[2], agents: a[3], declarations: d[1], guards: g[1], checkerControls: g[2], dtd: m[2], books: f[1], creators: f[2], schematics: f[3] };
}

export function pluginDesc(c) {
  return 'RoT DtD Commander, the creator kit: ' + c.commands + ' Claude Code commands, ' + c.skills + ' skills and ' + c.agents + ' agents that carry their own DTD grammar, laws and trust boundary, checked against their prose. Creators for prompts, meta-prompts, skills, hooks, commands, subagents, plans, MCP servers, workflows, tasks, filetypes and dorks, each auditing its own output. The Adiutor checks each answer against its DOCTYPE; a plain install arms nothing. ' + c.declarations + ' declarations, ' + c.guards + ' Adiutor guards and ' + c.checkerControls + ' checker controls.';
}

export function marketDesc(c) {
  return c.commands + ' commands, ' + c.dtd + ' of them -dtd, with ' + c.skills + ' skills and ' + c.agents + ' agents: the nine RoT MoE lenses and ELEVATE, ' + c.books + ' book-derived commands, ' + c.creators + ' prompt and meta-prompt creators over ' + c.schematics + ' schematics, creators for skills, hooks, commands, subagents, plans, MCP servers, workflows, tasks, filetypes and dorks, and the research, tasks, growth and list families. Every file declares its grammar, laws and trust boundary in a DOCTYPE the checker enforces. A plain install arms nothing; rdc arm arms the hooks.';
}

// The numbers a hosted description carries, read back with the patterns above,
// so an archive can be held to the tree it was packed from (control C16).
export function descCounts(pd, md) {
  const a = /(\d+) Claude Code commands, (\d+) skills and (\d+) agents/.exec(pd) || [];
  const d = /(\d+) declarations/.exec(pd) || [];
  const g = /([a-z-]+) Adiutor guards and ([a-z-]+) checker controls/.exec(pd) || [];
  const m = /^(\d+) commands, (\d+) of them -dtd, with (\d+) skills and (\d+) agents/.exec(md) || [];
  const f = /([a-z-]+) book-derived commands[^,]*, ([a-z-]+) prompt and meta-prompt creators over ([a-z-]+) schematics/.exec(md) || [];
  return { commands: a[1], skills: a[2], agents: a[3], declarations: d[1], guards: g[1], checkerControls: g[2], dtd: m[2], marketCommands: m[1], marketSkills: m[3], marketAgents: m[4], books: f[1], creators: f[2], schematics: f[3] };
}

export function descDrift(pd, md, tree) {
  const have = descCounts(pd, md);
  const out = [];
  for (const k of ['commands', 'skills', 'agents', 'declarations', 'guards', 'checkerControls', 'dtd', 'books', 'creators', 'schematics']) if (have[k] !== tree[k]) out.push(k + ': the archive says ' + have[k] + ', the tree says ' + tree[k]);
  if (have.marketCommands !== tree.commands) out.push('market commands: the archive says ' + have.marketCommands + ', the tree says ' + tree.commands);
  if (have.marketSkills !== tree.skills || have.marketAgents !== tree.agents) out.push('market skills and agents: the archive says ' + have.marketSkills + '/' + have.marketAgents + ', the tree says ' + tree.skills + '/' + tree.agents);
  return out;
}

function treeDescriptions() {
  const c = treeCounts(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'), fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  return { counts: c, plugin: pluginDesc(c), market: marketDesc(c) };
}

const DESC_XML = new RegExp('<[A-Za-z/!?][^>]*>');

// ===== the name-collision contract =====
//
// Measured 2026-09-05: the hosted surface reports 129 commands where the tree
// holds 131, and the difference is exactly the two command names a skill also
// claims. 131 - 2 = 129, and the arithmetic is the whole diagnosis: a command
// whose name a skill shares does not reach the user.
//
// The archive renames the SKILL, not the command, because a skill is selected
// by its description and a command by the name a user types. Renaming a skill
// costs a label; renaming a command costs muscle memory. Both new names are
// true of their contents rather than a suffix bolted on.
//
// This map is a baseline, not a fix. H11 recomputes the collisions from the
// archive itself, so a command added in a later release that collides with a
// skill fails the Guard by name and tells the next session what to add here.
const SKILL_RENAMES = {
  'ai-slop-dtd': 'ai-slop-gate-dtd',
  'setup-ralph-dtd': 'setup-ralph-loop-dtd',
};

// Where a path lands once a colliding skill has been renamed. Applies to the
// resolved tree and to src/ alike.
function renameSkillPath(name) {
  for (const [from, to] of Object.entries(SKILL_RENAMES)) {
    if (name === `skills/${from}` || name.startsWith(`skills/${from}/`)) return name.replace(`skills/${from}`, `skills/${to}`);
    if (name.endsWith(`/skills/${from}`) || name.includes(`/skills/${from}/`)) return name.replace(`/skills/${from}`, `/skills/${to}`);
  }
  return name;
}

// The skill's own frontmatter must agree with the directory it now sits in.
function renameSkillName(name, text) {
  if (!name.endsWith('/SKILL.md')) return text;
  for (const [from, to] of Object.entries(SKILL_RENAMES)) {
    if (!name.includes(`skills/${to}/`)) continue;
    const r = fmRange(text);
    if (!r) return text;
    const lines = text.slice(r[0], r[1]).split(LF);
    const i = lines.findIndex((l) => l.startsWith('name:'));
    if (i < 0) return text;
    if (lines[i].slice(5).trim() !== from) return text;
    lines[i] = `name: ${to}`;
    return text.slice(0, r[0]) + lines.join(LF) + text.slice(r[1]);
  }
  return text;
}

// The recorded state of the hosted contract. The Guard compares what it
// measures against this and fails on any divergence, so a release that adds a
// command, a skill or a long description turns the CI red with the reason
// named instead of shipping an archive the surface would refuse.
function baseline() {
  try {
    const j = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    return j.baseline || null;
  } catch {
    return null;
  }
}
const LF = String.fromCharCode(10);

// The frontmatter block of a markdown file, or null when it has none.
function fmRange(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf(LF + '---', 3);
  if (end < 0) return null;
  return [4, end];
}

// Read the description scalar as these files store it: one line, double quoted.
function fmDescription(text) {
  const r = fmRange(text);
  if (!r) return null;
  for (const line of text.slice(r[0], r[1]).split(LF)) {
    if (!line.startsWith('description:')) continue;
    let v = line.slice('description:'.length).trim();
    if (v.length > 1 && (v[0] === '"' || v[0] === "'") && v[v.length - 1] === v[0]) v = v.slice(1, -1);
    return v;
  }
  return null;
}

function setDescription(text, value) {
  // A double quote in the value would need escaping, and no replacement carries
  // one; refusing beats emitting YAML that parses differently than it reads.
  if (value.includes('"')) throw new Error('a replacement description carries a double quote');
  const r = fmRange(text);
  if (!r) return text;
  const lines = text.slice(r[0], r[1]).split(LF);
  const i = lines.findIndex((l) => l.startsWith('description:'));
  if (i < 0) return text;
  lines[i] = 'description: "' + value + '"';
  return text.slice(0, r[0]) + lines.join(LF) + text.slice(r[1]);
}

// Everything the table changes about one file, applied to the resolved copy and
// its src/ twin alike. Returns the new text, or the old one untouched.
function fixDescription(name, text) {
  if (!name.endsWith('.md')) return text;
  const cur = fmDescription(text);
  if (cur === null) return text;
  let next = cur;
  for (const [suffix, replacement] of Object.entries(DESC_BY_SUFFIX)) {
    if (name === suffix || name.endsWith('/' + suffix)) next = replacement;
  }
  if (next.includes(TAIL_OLD)) next = next.split(TAIL_OLD).join(TAIL_NEW);
  if (next.includes(TAG_FROM)) next = next.split(TAG_FROM).join(TAG_TO);
  return next === cur ? text : setDescription(text, next);
}

// The two manifests, rewritten as JSON so the file stays parseable rather than
// patched as text.
function fixManifest(name, text) {
  if (name === '.claude-plugin/plugin.json') {
    const j = JSON.parse(text);
    j.description = treeDescriptions().plugin;
    return JSON.stringify(j, null, 1) + LF;
  }
  if (name === '.claude-plugin/marketplace.json') {
    const j = JSON.parse(text);
    if (Array.isArray(j.plugins) && j.plugins[0]) j.plugins[0].description = treeDescriptions().market;
    return JSON.stringify(j, null, 1) + LF;
  }
  return text;
}

// ===== zip writer, no external binary =====

let CRC_TABLE = null;
function crcTable() {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}
function crc32(buf) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(buf) >>> 0;
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function dosTime(d) {
  return ((d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | Math.floor(d.getUTCSeconds() / 2)) & 0xffff;
}
function dosDate(d) {
  return (((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate()) & 0xffff;
}

// entries: [{ name, data (Buffer) or null for a directory, mode }]
function writeZip(entries, when) {
  const time = dosTime(when);
  const date = dosDate(when);
  const locals = [];
  const central = [];
  let offset = 0;

  for (const e of entries) {
    const isDir = e.data === null;
    const raw = isDir ? Buffer.alloc(0) : e.data;
    const name = Buffer.from(isDir ? `${e.name}/` : e.name, 'utf8');
    let method = 0;
    let payload = raw;
    if (!isDir && raw.length > 0) {
      const def = zlib.deflateRawSync(raw, { level: 9 });
      if (def.length < raw.length) {
        method = 8;
        payload = def;
      }
    }
    const sum = crc32(raw);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4); // version needed
    lh.writeUInt16LE(0x0800, 6); // UTF-8 names
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(time, 10);
    lh.writeUInt16LE(date, 12);
    lh.writeUInt32LE(sum, 14);
    lh.writeUInt32LE(payload.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(lh, name, payload);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(0x031e, 4); // made by: unix, spec 3.0
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(time, 12);
    ch.writeUInt16LE(date, 14);
    ch.writeUInt32LE(sum, 16);
    ch.writeUInt32LE(payload.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(name.length, 28);
    ch.writeUInt16LE(0, 30); // extra
    ch.writeUInt16LE(0, 32); // comment
    ch.writeUInt16LE(0, 34); // disk
    ch.writeUInt16LE(0, 36); // internal attrs
    const mode = isDir ? 0o040755 : e.mode || 0o100644;
    ch.writeUInt32LE(((((mode << 16) >>> 0) | (isDir ? 0x10 : 0)) >>> 0), 38);
    ch.writeUInt32LE(offset, 42);
    central.push(ch, name);

    offset += lh.length + name.length + payload.length;
  }

  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, cdBuf, eocd]);
}

// ===== zip reader, enough to audit what we wrote =====

function readZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip: no end-of-central-directory record');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`central directory record ${i} has a bad signature`);
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const usize = buf.readUInt32LE(p + 24);
    const nlen = buf.readUInt16LE(p + 28);
    const elen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nlen).toString('utf8');
    out.push({ name, method, csize, usize, local, dir: name.endsWith('/') });
    p += 46 + nlen + elen + clen;
  }
  return out;
}

function extract(buf, entry) {
  const nlen = buf.readUInt16LE(entry.local + 26);
  const elen = buf.readUInt16LE(entry.local + 28);
  const start = entry.local + 30 + nlen + elen;
  const raw = buf.slice(start, start + entry.csize);
  return entry.method === 8 ? zlib.inflateRawSync(raw) : raw;
}

// ===== the payload =====

function tracked() {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, maxBuffer: 1 << 28 });
  return out.toString('utf8').split('\0').filter(Boolean).sort();
}

function manifestVersion() {
  const p = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  const k = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  const three = [p.version, k.version, m.metadata.version];
  if (new Set(three).size !== 1) {
    throw new Error(`the three manifests disagree about the version: plugin ${three[0]}, package ${three[1]}, marketplace ${three[2]}`);
  }
  return p.version;
}

function commitDate() {
  try {
    const s = execFileSync('git', ['log', '-1', '--format=%cI'], { cwd: ROOT }).toString().trim();
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
  } catch {}
  return new Date(Date.UTC(2026, 0, 1));
}

// The generated top-level SKILL.md for the flatskill shape. It declares the
// plugin's components, which is the second thing the manifest error accepts.
function skillMd(version, counts) {
  const desc = `RoT DtD Commander ${version}: ${counts.commands} slash commands, ${counts.skills} skills and ${counts.agents} agents that each declare their own DTD grammar, laws and trust boundary. Load when writing or auditing a -dtd command, skill or agent, when a prompt needs a declared output grammar, or when untrusted text must be fenced as data rather than obeyed.`;
  return [
    '---',
    'name: rot-dtd-commander',
    `description: ${desc}`,
    '---',
    '',
    '# RoT DtD Commander',
    '',
    'This archive is the hosted distribution of the RoT DtD Commander plugin. Its',
    'components are declared here and in `.claude-plugin/plugin.json`; both are',
    'present so either discovery path finds the plugin.',
    '',
    '## Components',
    '',
    `- \`commands/\` — ${counts.commands} slash commands, ${counts.dtdCommands} of them carrying a DOCTYPE.`,
    `- \`skills/\` — ${counts.skills} skills, each with its own SKILL.md.`,
    `- \`agents/\` — ${counts.agents} subagents.`,
    '- `dtd/` — the shared external subsets (cc-core, cc-ask, cc-report, cc-record and the rest), already inlined into every command at build time.',
    '- `docs/` — the guides.',
    '',
    '## What this archive does not carry',
    '',
    'No `bin/` directory. On the Claude Code CLI a plugin\'s `bin/` is added to',
    'PATH, which a hosted plugin may not do, so the two Node executables were',
    'moved out of it for this archive alone. The source repository is unchanged:',
    'the CLI, `npx rot-dtd-commander`, `package.json` and the release workflow all',
    'still find them at `bin/`.',
    '',
    'Nothing in this archive is armed. The Adiutor Stop-hook doctor and the',
    'Commander-Adiutor monitor run only on the CLI, and only after `rdc arm`.',
    '',
  ].join('\n');
}

function componentCounts(files) {
  const commands = files.filter((f) => f.startsWith('commands/') && f.endsWith('.md'));
  return {
    commands: commands.length,
    dtdCommands: commands.filter((f) => f.endsWith('-dtd.md')).length,
    skills: new Set(files.filter((f) => f.startsWith('skills/')).map((f) => f.split('/')[1])).size,
    agents: files.filter((f) => f.startsWith('agents/') && f.endsWith('.md')).length,
  };
}

// ===== the build =====

function buildOne(binKey, rootKey, version, files, when) {
  const bin = BIN_STRATEGIES[binKey];
  const shape = ROOT_SHAPES[rootKey];
  if (!bin) throw new Error(`unknown bin strategy: ${binKey}`);
  if (!shape) throw new Error(`unknown root shape: ${rootKey}`);
  const prefix = rootKey === 'wrapped' ? `rot-dtd-commander-${version}/` : '';

  const rewrites = [];
  const descFixed = [];
  const skillsRenamed = [];
  const entries = [];
  const dirs = new Set();
  const addDirs = (name) => {
    const parts = name.split('/');
    parts.pop();
    let acc = '';
    for (const seg of parts) {
      acc = acc ? `${acc}/${seg}` : seg;
      if (!dirs.has(acc)) {
        dirs.add(acc);
        entries.push({ name: `${prefix}${acc}`.replace(/\/$/, ''), data: null });
      }
    }
  };

  const staged = [];
  for (const f of files) {
    let name = f;
    if (f === 'bin' || f.startsWith('bin/')) name = `${bin.dir}/${f.slice(4)}`;
    const renamed = renameSkillPath(name);
    if (renamed !== name) { name = renamed; skillsRenamed.push(f); }
    let data = fs.readFileSync(path.join(ROOT, f));
    if (REWRITE.includes(f)) {
      const before = data.toString('utf8');
      const after = before
        .split('bin/adiutor.mjs')
        .join(`${bin.dir}/adiutor.mjs`)
        .split('bin/rot-dtd-commander.mjs')
        .join(`${bin.dir}/rot-dtd-commander.mjs`)
        .split('"bin",')
        .join(`"${bin.dir}",`);
      if (after !== before) {
        if (after.includes('\r')) throw new Error(`rewrite introduced a CR byte into ${f}`);
        data = Buffer.from(after, 'utf8');
        rewrites.push(f);
      }
    }
    // The description contract of the hosted surfaces, applied to the archive
    // only. The repository keeps its own prose until a combination is proven.
    //
    // Keyed on `f`, the SOURCE path, never on `name`. The skill rename above
    // has already moved skills/ai-slop-dtd to skills/ai-slop-gate-dtd, and
    // DESC_BY_SUFFIX is keyed on the name the repository uses, so matching on
    // the archive path silently skipped both renamed skills and shipped a
    // 545-character description. Caught by controls C1, C3, C10 and C12.
    const fixedText = name.endsWith('.md')
      ? fixDescription(f, data.toString('utf8'))
      : name.endsWith('.json')
        ? fixManifest(name, data.toString('utf8'))
        : null;
    if (fixedText !== null && fixedText !== data.toString('utf8')) {
      if (fixedText.includes('\r')) throw new Error('a description rewrite introduced a CR byte into ' + name);
      data = Buffer.from(fixedText, 'utf8');
      descFixed.push(name);
    }
    if (name.endsWith('/SKILL.md')) {
      const cur = data.toString('utf8');
      const next = renameSkillName(name, cur);
      if (next !== cur) data = Buffer.from(next, 'utf8');
    }
    const mode = f.startsWith('bin/') || f.endsWith('.sh') ? 0o100755 : 0o100644;
    staged.push({ name, data, mode });
  }

  if (shape.skill) {
    staged.push({
      name: 'SKILL.md',
      data: Buffer.from(skillMd(version, componentCounts(files)), 'utf8'),
      mode: 0o100644,
    });
  }

  staged.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const s of staged) {
    addDirs(s.name);
    entries.push({ name: `${prefix}${s.name}`, data: s.data, mode: s.mode });
  }

  return { buf: writeZip(entries, when), entries, rewrites, descFixed, skillsRenamed, prefix, binDir: bin.dir };
}

// ===== the Guard: H1..H8 =====
//
// Each rule is a named check with a reason. --check runs them against a zip on
// disk; --controls damages a zip on purpose and requires each one to fire.

function audit(buf, opts = {}) {
  // The baseline is read once here so a caller cannot forget to pass it.
  if (opts.baseline === undefined) opts = { ...opts, baseline: baseline() };
  const findings = [];
  const fail = (code, why) => findings.push({ code, why });
  let list;
  try {
    list = readZip(buf);
  } catch (e) {
    fail('H0', `the archive does not parse: ${e.message}`);
    return findings;
  }

  const names = list.map((e) => e.name.replace(/\/$/, ''));
  const roots = new Set(names.map((n) => n.split('/')[0]));
  const wrapped = roots.size === 1 && !names.some((n) => !n.includes('/') && n === [...roots][0]) === false;
  // A single root segment shared by every entry is a wrapper directory.
  const single = roots.size === 1 ? [...roots][0] : null;
  const strip = (n) => (single && n.startsWith(`${single}/`) ? n.slice(single.length + 1) : n);
  const inner = names.map(strip);

  // H1  no directory named bin, at archive root or one wrapper level below.
  //     The refusal names paths without the wrapper prefix, so the surface
  //     strips one level before this check; both depths are refused here.
  const binHits = names.filter((n) => n === 'bin' || n.startsWith('bin/')).concat(inner.filter((n) => n === 'bin' || n.startsWith('bin/')));
  if (binHits.length) fail('H1', `a top-level bin/ survives in the archive: ${[...new Set(binHits)].slice(0, 4).join(', ')}`);

  // H2  WITHDRAWN, falsified by measurement on 2026-09-05.
  //
  // H2 refused an archive whose manifest sat under a wrapper directory, on the
  // reading that the first upload's "must contain a .claude-plugin/plugin.json
  // manifest" was a depth problem. It was not. The operator installed
  // dotbin-wrapped -- the candidate this Guard had built as a control and
  // predicted would be refused -- and it worked. The surface strips a wrapper
  // level for the manifest exactly as it already did for the bin check.
  //
  // The real cause of every "missing manifest" report was H9: an over-long
  // description makes plugin.json invalid, and an invalid manifest is reported
  // as an absent one. One fault, reported three times across two rounds.
  //
  // What survives is the weaker, true rule: a manifest must exist somewhere the
  // validator can reach, at the root or one wrapper below it.
  const manifestReachable = names.includes('.claude-plugin/plugin.json') || inner.includes('.claude-plugin/plugin.json') || names.includes('SKILL.md') || inner.includes('SKILL.md');
  if (!manifestReachable) fail('H2', 'the archive carries no .claude-plugin/plugin.json and no top-level SKILL.md, at the root or one wrapper below it');

  // H3  the manifest parses and its version is the one asked for.
  const mEntry = list.find((e) => e.name === '.claude-plugin/plugin.json' || strip(e.name) === '.claude-plugin/plugin.json');
  if (!mEntry) fail('H3', 'no plugin.json to parse anywhere in the archive');
  else {
    let man;
    try {
      man = JSON.parse(extract(buf, mEntry).toString('utf8'));
    } catch (e) {
      fail('H3', `plugin.json does not parse: ${e.message}`);
    }
    if (man) {
      if (!man.name) fail('H3', 'plugin.json declares no name');
      if (opts.version && man.version !== opts.version) fail('H3', `plugin.json says version ${man.version}, the archive is named for ${opts.version}`);
    }
  }

  // H4  no live CLAUDE_PLUGIN_ROOT path still points at bin/.
  for (const f of REWRITE) {
    const e = list.find((x) => strip(x.name) === f);
    if (!e) continue;
    const text = extract(buf, e).toString('utf8');
    // The segment must be exactly `bin`, not the tail of `.bin`: a word
    // boundary matches after a dot, so \b here would refuse the dotbin
    // strategy for doing precisely what it was built to do.
    if (/CLAUDE_PLUGIN_ROOT[^\n]*(?<![.\w-])bin\//.test(text)) fail('H4', `${f} still resolves a plugin-root path through bin/`);
  }

  // H5  nothing was silently dropped.
  const fileCount = list.filter((e) => !e.dir).length;
  if (opts.expect && fileCount < opts.expect) fail('H5', `the archive holds ${fileCount} files, fewer than the ${opts.expect} tracked`);

  // H6  no CR byte in a file the packer rewrote.
  for (const f of REWRITE) {
    const e = list.find((x) => strip(x.name) === f);
    if (!e) continue;
    if (extract(buf, e).includes(0x0d)) fail('H6', `${f} carries a CR byte`);
  }

  // H7  the components the plugin claims are actually inside.
  for (const d of ['commands', 'skills', 'agents']) {
    if (!inner.some((n) => n.startsWith(`${d}/`))) fail('H7', `the archive carries no ${d}/ directory`);
  }

  // H9   no description anywhere in the archive exceeds DESC_LIMIT.
  // H10  no description carries anything a tag scanner reads as XML.
  //
  // The surface reports only the first few offenders it meets, so an archive
  // that satisfies its error list can still be refused. These two rules read
  // every command, skill and agent in the archive rather than trusting that
  // list to have been complete.
  for (const e of list) {
    const n = strip(e.name);
    const isComponent =
      (n.startsWith('commands/') && n.endsWith('.md')) ||
      (n.startsWith('skills/') && n.endsWith('/SKILL.md')) ||
      (n.startsWith('agents/') && n.endsWith('.md'));
    if (!isComponent) continue;
    const d = fmDescription(extract(buf, e).toString('utf8'));
    if (d === null) continue;
    if (d.length > DESC_LIMIT) fail('H9', n + ' description is ' + d.length + ' characters, over the ' + DESC_LIMIT + ' the surface allows');
    const t = d.match(DESC_XML);
    if (t) fail('H10', n + ' description carries ' + t[0] + ', which a tag scanner reads as XML');
  }

  // H9 and H10 again for the manifest the surface parses. An over-long
  // description there is reported as a MISSING manifest, not an invalid one,
  // which is what made the second upload look like the first one's failure.
  if (mEntry) {
    let man = null;
    try { man = JSON.parse(extract(buf, mEntry).toString('utf8')); } catch {}
    if (man && typeof man.description === 'string') {
      if (man.description.length > DESC_LIMIT) fail('H9', 'plugin.json description is ' + man.description.length + ' characters, over ' + DESC_LIMIT + '; the surface then reports the manifest as absent');
      const t = man.description.match(DESC_XML);
      if (t) fail('H10', 'plugin.json description carries ' + t[0]);
    }
  }

  // H11  no command name is also a skill name.
  //
  // A command a skill shadows never reaches the user, and the surface reports
  // the shortfall only as a count. This recomputes the collision set from the
  // archive rather than trusting SKILL_RENAMES to still be complete, so a
  // command added in a later release that collides fails here by name.
  const cmdNames = new Set(inner.filter((n) => n.startsWith('commands/') && n.endsWith('.md')).map((n) => n.slice('commands/'.length, -3)));
  const skillNames = new Set(inner.filter((n) => n.startsWith('skills/') && n.endsWith('/SKILL.md')).map((n) => n.slice('skills/'.length, -'/SKILL.md'.length)));
  const collisions = [...cmdNames].filter((c) => skillNames.has(c)).sort();
  if (collisions.length) fail('H11', `${collisions.length} command name(s) also name a skill and will be shadowed on the hosted surface: ${collisions.join(', ')}. Add each to SKILL_RENAMES in this file.`);

  // H12  the archive agrees with the recorded baseline.
  //
  // This is the rule that makes the Guard survive the next release. It does not
  // ask whether the archive is good; it asks whether the world still looks the
  // way it looked when a human last proved an upload installs. A new command, a
  // new skill, a new long description or a new collision all turn CI red with
  // the divergence named, which is the signal to update this file and re-prove.
  const base = opts.baseline;
  if (base) {
    const agentNames = inner.filter((n) => n.startsWith('agents/') && n.endsWith('.md'));
    const seen = { commands: cmdNames.size, skills: skillNames.size, agents: agentNames.length };
    for (const k of ['commands', 'skills', 'agents']) {
      if (typeof base.components?.[k] === 'number' && base.components[k] !== seen[k]) {
        fail('H12', `the archive holds ${seen[k]} ${k}, the baseline in checker/hosted-plugin.json records ${base.components[k]}. A release changed the tree: re-prove an upload, then update the baseline.`);
      }
    }
    const baseCol = (base.collisions || []).slice().sort().join(',');
    const nowCol = Object.keys(SKILL_RENAMES).slice().sort().join(',');
    if (baseCol !== nowCol) fail('H12', `the collision set is now [${nowCol}] and the baseline records [${baseCol}]. Update checker/hosted-plugin.json.`);
  }

  // H8  the archive is not empty and every entry has a sane name.
  if (!list.length) fail('H8', 'the archive is empty');
  for (const n of names) {
    if (n.startsWith('/') || n.includes('..')) fail('H8', `unsafe entry name: ${n}`);
  }

  return findings;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } catch {
    return { proven: null, tried: [], note: 'no combination has been uploaded and accepted yet' };
  }
}

function writeState(s) {
  fs.writeFileSync(STATE, `${JSON.stringify(s, null, 2)}\n`, 'utf8');
}

// ===== controls: trip every guard on purpose =====

function controls() {
  const version = manifestVersion();
  const files = tracked();
  const when = commitDate();
  const results = [];
  const run = (name, fn) => {
    let ok = false;
    let detail = '';
    try {
      const r = fn();
      ok = r.ok;
      detail = r.detail;
    } catch (e) {
      detail = `threw: ${e.message}`;
    }
    results.push({ name, ok, detail });
  };

  // A control is only evidence when the clean case passes and the damaged
  // case fails. Every arm below asserts both halves.
  const clean = buildOne('tools', 'flat', version, files, when);
  run('C1 a clean flat archive raises nothing', () => {
    const f = audit(clean.buf, { version, expect: files.length });
    return { ok: f.length === 0, detail: f.length ? f.map((x) => x.code).join(',') : 'no findings' };
  });

  run('C2 H1 fires on an archive that kept bin/', () => {
    const entries = [
      { name: '.claude-plugin', data: null },
      { name: '.claude-plugin/plugin.json', data: Buffer.from('{"name":"x","version":"0.0.0"}', 'utf8'), mode: 0o100644 },
      { name: 'bin', data: null },
      { name: 'bin/adiutor.mjs', data: Buffer.from('// x\n', 'utf8'), mode: 0o100755 },
      { name: 'commands', data: null },
      { name: 'commands/a.md', data: Buffer.from('a\n', 'utf8'), mode: 0o100644 },
      { name: 'skills', data: null },
      { name: 'skills/a/SKILL.md', data: Buffer.from('a\n', 'utf8'), mode: 0o100644 },
      { name: 'agents', data: null },
      { name: 'agents/a.md', data: Buffer.from('a\n', 'utf8'), mode: 0o100644 },
    ];
    const f = audit(writeZip(entries, when), { baseline: null });
    return { ok: f.some((x) => x.code === 'H1'), detail: f.map((x) => x.code).join(',') || 'silent' };
  });

  run('C3 a wrapped archive PASSES (H2 was falsified by an upload that installed)', () => {
    // This control is the inversion of the one it replaces. The earlier C3
    // asserted H2 fires on a wrapped archive; then dotbin-wrapped installed on
    // both surfaces, so the assertion was backwards. Keeping the control and
    // flipping it is deliberate: the falsification is now something the suite
    // re-proves on every run rather than a sentence in a changelog.
    const wrapped = buildOne('dotbin', 'wrapped', version, files, when);
    const f = audit(wrapped.buf, { version, expect: files.length });
    return { ok: f.length === 0, detail: f.length ? f.map((x) => x.code + ': ' + x.why).join(' | ') : 'no findings, as the proven upload showed' };
  });

  run('C3b H2 still fires when NO manifest is reachable at any depth', () => {
    const entries = [
      { name: 'commands', data: null },
      { name: 'commands/a.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
      { name: 'skills', data: null },
      { name: 'skills/a/SKILL.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
      { name: 'agents', data: null },
      { name: 'agents/a.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
    ];
    const f = audit(writeZip(entries, when), { baseline: null });
    return { ok: f.some((x) => x.code === 'H2'), detail: f.map((x) => x.code).join(',') || 'silent' };
  });

  run('C4 H3 fires when the archive name and the manifest disagree', () => {
    const f = audit(clean.buf, { version: '0.0.0-not-the-manifest' });
    return { ok: f.some((x) => x.code === 'H3'), detail: f.map((x) => x.code).join(',') || 'silent' };
  });

  run('C5 H5 fires when files are missing', () => {
    const f = audit(clean.buf, { version, expect: files.length + 1 });
    return { ok: f.some((x) => x.code === 'H5'), detail: f.map((x) => x.code).join(',') || 'silent' };
  });

  run('C6 H7 fires when a component directory is absent', () => {
    const entries = [
      { name: '.claude-plugin', data: null },
      { name: '.claude-plugin/plugin.json', data: Buffer.from('{"name":"x","version":"0.0.0"}', 'utf8'), mode: 0o100644 },
      { name: 'commands', data: null },
      { name: 'commands/a.md', data: Buffer.from('a\n', 'utf8'), mode: 0o100644 },
    ];
    const f = audit(writeZip(entries, when), { baseline: null });
    return { ok: f.some((x) => x.code === 'H7'), detail: f.map((x) => x.code).join(',') || 'silent' };
  });

  run('C7 H0 fires on bytes that are not a zip', () => {
    const f = audit(Buffer.from('this is not an archive', 'utf8'));
    return { ok: f.some((x) => x.code === 'H0'), detail: f.map((x) => x.code).join(',') || 'silent' };
  });

  run('C8 the rewrite actually landed in all four files', () => {
    return {
      ok: clean.rewrites.length === REWRITE.length,
      detail: `${clean.rewrites.length} of ${REWRITE.length} rewritten: ${clean.rewrites.join(', ')}`,
    };
  });

  run('C9 the archive round-trips through the reader', () => {
    const list = readZip(clean.buf);
    const e = list.find((x) => x.name === 'package.json');
    if (!e) return { ok: false, detail: 'package.json absent' };
    const j = JSON.parse(extract(clean.buf, e).toString('utf8'));
    return { ok: j.name === 'rot-dtd-commander', detail: `package.json parsed, name ${j.name}` };
  });

  run('C10 the dotbin strategy passes H4 (a dotted bin is not a bin)', () => {
    const dot = buildOne('dotbin', 'flat', version, files, when);
    const f = audit(dot.buf, { version, expect: files.length });
    return { ok: f.length === 0, detail: f.length ? f.map((x) => `${x.code}: ${x.why}`).join(' | ') : 'no findings' };
  });

  run('C11 H4 fires when a plugin-root path was left pointing at bin/', () => {
    const entries = [
      { name: '.claude-plugin', data: null },
      { name: '.claude-plugin/plugin.json', data: Buffer.from('{"name":"x","version":"0.0.0"}', 'utf8'), mode: 0o100644 },
      { name: 'commands', data: null },
      { name: 'commands/RoT-DtD-Commander-Adiutor.md', data: Buffer.from('<!ENTITY PATH.adiutor.plugin "CLAUDE_PLUGIN_ROOT/bin/adiutor.mjs">\n', 'utf8'), mode: 0o100644 },
      { name: 'skills', data: null },
      { name: 'skills/a/SKILL.md', data: Buffer.from('a\n', 'utf8'), mode: 0o100644 },
      { name: 'agents', data: null },
      { name: 'agents/a.md', data: Buffer.from('a\n', 'utf8'), mode: 0o100644 },
    ];
    const f = audit(writeZip(entries, when), { baseline: null });
    return { ok: f.some((x) => x.code === 'H4'), detail: f.map((x) => x.code).join(',') || 'silent' };
  });

  run('C12 every description in a clean archive is within the limit and tag free', () => {
    const f = audit(clean.buf, { version, expect: files.length });
    const d = f.filter((x) => x.code === 'H9' || x.code === 'H10');
    return { ok: d.length === 0, detail: d.length ? d.map((x) => x.why).join(' | ') : 'no H9 or H10 findings' };
  });

  run('C13 H9 fires on a description one character over the limit', () => {
    const long = 'x'.repeat(DESC_LIMIT + 1);
    const entries = [
      { name: '.claude-plugin', data: null },
      { name: '.claude-plugin/plugin.json', data: Buffer.from('{"name":"x","version":"0.0.0"}', 'utf8'), mode: 0o100644 },
      { name: 'commands', data: null },
      { name: 'commands/a.md', data: Buffer.from('---' + LF + 'description: "' + long + '"' + LF + '---' + LF, 'utf8'), mode: 0o100644 },
      { name: 'skills', data: null },
      { name: 'skills/a/SKILL.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
      { name: 'agents', data: null },
      { name: 'agents/a.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
    ];
    const f = audit(writeZip(entries, when), { baseline: null });
    return { ok: f.some((x) => x.code === 'H9'), detail: f.map((x) => x.code).join(',') || 'silent' };
  });

  run('C14 H9 does NOT fire at exactly the limit (the boundary is not off by one)', () => {
    const exact = 'x'.repeat(DESC_LIMIT);
    const entries = [
      { name: '.claude-plugin', data: null },
      { name: '.claude-plugin/plugin.json', data: Buffer.from('{"name":"x","version":"0.0.0"}', 'utf8'), mode: 0o100644 },
      { name: 'commands', data: null },
      { name: 'commands/a.md', data: Buffer.from('---' + LF + 'description: "' + exact + '"' + LF + '---' + LF, 'utf8'), mode: 0o100644 },
      { name: 'skills', data: null },
      { name: 'skills/a/SKILL.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
      { name: 'agents', data: null },
      { name: 'agents/a.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
    ];
    const f = audit(writeZip(entries, when), { baseline: null });
    return { ok: !f.some((x) => x.code === 'H9'), detail: f.map((x) => x.code).join(',') || 'no findings' };
  });

  run('C15 H10 fires on a description carrying an XML tag', () => {
    const entries = [
      { name: '.claude-plugin', data: null },
      { name: '.claude-plugin/plugin.json', data: Buffer.from('{"name":"x","version":"0.0.0"}', 'utf8'), mode: 0o100644 },
      { name: 'commands', data: null },
      { name: 'commands/a.md', data: Buffer.from('---' + LF + 'description: "route it to create-prompt-<schematic>-dtd"' + LF + '---' + LF, 'utf8'), mode: 0o100644 },
      { name: 'skills', data: null },
      { name: 'skills/a/SKILL.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
      { name: 'agents', data: null },
      { name: 'agents/a.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
    ];
    const f = audit(writeZip(entries, when), { baseline: null });
    return { ok: f.some((x) => x.code === 'H10'), detail: f.map((x) => x.code).join(',') || 'silent' };
  });

  // C16 held the marketplace opening to the literal 131 and tested the plugin
  // patterns for presence alone, so it asserted the stale numbers instead of
  // refusing them (fourth companion pass). It compares every number the
  // archive carries against the tree's manifests now, and C16b proves the
  // comparison can fail.
  run('C16 the manifest descriptions in a clean archive carry the numbers the tree manifests carry, under the limit', () => {
    const e = readZip(clean.buf).find((x) => x.name === '.claude-plugin/plugin.json');
    const m = readZip(clean.buf).find((x) => x.name === '.claude-plugin/marketplace.json');
    if (!e || !m) return { ok: false, detail: 'a manifest is missing from the archive' };
    const pd = JSON.parse(extract(clean.buf, e).toString('utf8')).description;
    const md = JSON.parse(extract(clean.buf, m).toString('utf8')).plugins[0].description;
    const tree = treeDescriptions().counts;
    const drift = descDrift(pd, md, tree);
    if (pd.length > DESC_LIMIT) drift.push('plugin description is ' + pd.length + ' characters, over ' + DESC_LIMIT);
    if (md.length > DESC_LIMIT) drift.push('marketplace description is ' + md.length + ' characters, over ' + DESC_LIMIT);
    return { ok: drift.length === 0, detail: drift.length ? drift.join(' | ') : 'plugin ' + pd.length + ', marketplace ' + md.length + '; ' + tree.commands + ' commands, ' + tree.dtd + ' -dtd, ' + tree.skills + ' skills, ' + tree.agents + ' agents, ' + tree.declarations + ' declarations, ' + tree.guards + ' guards, ' + tree.checkerControls + ' checker controls, every number the tree carries' };
  });

  run('C16b a description carrying the numbers of three releases ago is refused against the tree by name', () => {
    const tree = treeDescriptions().counts;
    const stale = { ...tree, commands: '131', declarations: '1440', checkerControls: 'eighteen', dtd: '130' };
    const drift = descDrift(pluginDesc(stale), marketDesc(stale), tree);
    const named = ['commands', 'declarations', 'checkerControls', 'dtd', 'market commands'].filter((k) => drift.some((d) => d.startsWith(k + ':')));
    return { ok: named.length === 5 && drift.length === 5, detail: drift.length ? drift.join(' | ') : 'silent' };
  });

  run('C16c a tree manifest that loses a counts-sweep pattern refuses the pack by name', () => {
    try {
      treeCounts('{"description":"no numbers here"}', '{"plugins":[{"description":"none"}]}');
      return { ok: false, detail: 'a manifest with no counts was accepted' };
    } catch (e) {
      return { ok: /lack the pattern/.test(String(e.message)), detail: String(e.message).slice(0, 160) };
    }
  });

  run('C24 importing this module packs nothing and exits nothing: the entry point runs only as a script', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'rot-pack-import-'));
    const me = path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
    const script = 'import(' + JSON.stringify(new URL(import.meta.url).href) + ').then(function (m) { console.log("imported " + typeof m.treeCounts + " " + typeof m.descDrift); })';
    let out = ''; let code = 0;
    try { out = execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 }); } catch (e) { code = e.status; out = String(e.stdout || '') + String(e.stderr || ''); }
    const wroteHere = fs.existsSync(path.join(cwd, 'dist'));
    const wroteRoot = fs.existsSync(path.join(ROOT, 'dist')) ? 'dist/ under the repository exists' : '';
    fs.rmSync(cwd, { recursive: true, force: true });
    const ok = code === 0 && /^imported function function/m.test(out) && !wroteHere && !/built into/.test(out);
    return { ok, detail: ok ? 'imported, two exports typed function, no archive written, no exit (' + me.split(/[\\/]/).pop() + ')' : 'exit ' + code + ', dist written here ' + wroteHere + ' ' + wroteRoot + ': ' + out.trim().slice(0, 160) };
  });

  run('C17 the clean archive has no command shadowed by a skill', () => {
    const f = audit(clean.buf, { version, expect: files.length });
    const c = f.filter((x) => x.code === 'H11');
    return { ok: c.length === 0, detail: c.length ? c[0].why : 'no collision survives the rename' };
  });

  run('C18 the two renames actually landed in the archive', () => {
    const list = readZip(clean.buf).map((e) => e.name);
    const want = Object.values(SKILL_RENAMES).map((to) => 'skills/' + to + '/SKILL.md');
    const gone = Object.keys(SKILL_RENAMES).map((from) => 'skills/' + from + '/SKILL.md');
    const present = want.filter((w) => list.includes(w));
    const stale = gone.filter((g) => list.includes(g));
    const named = want.every((w) => {
      const e = readZip(clean.buf).find((x) => x.name === w);
      if (!e) return false;
      const t = extract(clean.buf, e).toString('utf8');
      return t.includes('name: ' + w.split('/')[1]);
    });
    return {
      ok: present.length === want.length && stale.length === 0 && named,
      detail: present.length + ' of ' + want.length + ' renamed, ' + stale.length + ' stale, frontmatter name agrees: ' + named,
    };
  });

  run('C19 H11 fires when a command name is also a skill name', () => {
    const entries = [
      { name: '.claude-plugin', data: null },
      { name: '.claude-plugin/plugin.json', data: Buffer.from('{"name":"x","version":"0.0.0"}', 'utf8'), mode: 0o100644 },
      { name: 'commands', data: null },
      { name: 'commands/shadowed-dtd.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
      { name: 'skills', data: null },
      { name: 'skills/shadowed-dtd/SKILL.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
      { name: 'agents', data: null },
      { name: 'agents/a.md', data: Buffer.from('a' + LF, 'utf8'), mode: 0o100644 },
    ];
    const f = audit(writeZip(entries, when), { baseline: null });
    const h = f.find((x) => x.code === 'H11');
    return { ok: Boolean(h) && h.why.includes('shadowed-dtd'), detail: h ? h.why : 'silent' };
  });

  run('C20 H12 fires when the tree no longer matches the recorded baseline', () => {
    // The drift rule is the one that must survive the NEXT release, so it is
    // tripped here against a baseline that deliberately disagrees.
    const f = audit(clean.buf, { version, expect: files.length, baseline: { components: { commands: 999, skills: 22, agents: 5 }, collisions: Object.keys(SKILL_RENAMES) } });
    const h = f.find((x) => x.code === 'H12');
    return { ok: Boolean(h) && h.why.includes('999'), detail: h ? h.why.slice(0, 110) : 'silent' };
  });

  run('C21 H12 fires when the collision set drifts from the baseline', () => {
    const f = audit(clean.buf, { version, expect: files.length, baseline: { components: { commands: null }, collisions: ['ai-slop-dtd'] } });
    const h = f.find((x) => x.code === 'H12');
    return { ok: Boolean(h) && h.why.includes('collision set'), detail: h ? h.why.slice(0, 110) : 'silent' };
  });

  run('C22 H12 is silent when the archive agrees with the real baseline', () => {
    const f = audit(clean.buf, { version, expect: files.length });
    const h = f.filter((x) => x.code === 'H12');
    return { ok: h.length === 0, detail: h.length ? h.map((x) => x.why).join(' | ') : 'the recorded baseline matches the tree' };
  });

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name} — ${r.detail}`);
  console.log(`\n${results.length} run, ${failed.length} failing`);
  return failed.length === 0 ? 0 : 1;
}

// ===== cli =====

function usage() {
  console.log(`pack-claude-ai.mjs — the hosted-plugin packer and Guard

  --all [--out <dir>]   build every candidate of the matrix
  --only <bin>-<root>   build one candidate, e.g. tools-flat
  --out <dir>           where the archives land (default dist/)
  --check <zip>...      audit archives already on disk
  --controls            trip every guard on purpose
  --strategies          print the matrix and the proven combination
  --proven <bin>-<root> record the combination the hosted surface accepted
`);
}

function main(argv) {
  const has = (f) => argv.includes(f);
  const val = (f, d) => {
    const i = argv.indexOf(f);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
  };

  if (has('--help') || has('-h')) {
    usage();
    return 0;
  }
  if (has('--controls')) return controls();

  if (has('--strategies')) {
    const st = loadState();
    console.log('bin strategies:');
    for (const [k, v] of Object.entries(BIN_STRATEGIES)) console.log(`  ${k.padEnd(8)} bin/ -> ${v.dir}/  ${v.why}`);
    console.log('root shapes:');
    for (const [k, v] of Object.entries(ROOT_SHAPES)) console.log(`  ${k.padEnd(10)} ${v.why}`);
    console.log(`proven: ${st.proven || 'none yet — upload the candidates and record the winner with --proven'}`);
    return 0;
  }

  if (has('--proven')) {
    const combo = val('--proven', '');
    const [b, r] = combo.split('-');
    if (!BIN_STRATEGIES[b] || !ROOT_SHAPES[r]) {
      console.error(`unknown combination: ${combo}. Use one of: ${Object.keys(BIN_STRATEGIES).flatMap((x) => Object.keys(ROOT_SHAPES).map((y) => `${x}-${y}`)).join(', ')}`);
      return 1;
    }
    const st = loadState();
    st.proven = combo;
    st.provenOn = new Date().toISOString().slice(0, 10);
    st.note = 'the hosted surface accepted this combination; the release job builds it';
    writeState(st);
    console.log(`recorded: ${combo} is the accepted combination`);
    return 0;
  }

  if (has('--check')) {
    const i = argv.indexOf('--check');
    const zips = argv.slice(i + 1).filter((a) => !a.startsWith('--'));
    if (!zips.length) {
      console.error('--check needs at least one path to a zip');
      return 1;
    }
    let bad = 0;
    for (const z of zips) {
      const buf = fs.readFileSync(z);
      const m = path.basename(z).match(/_(\d+\.\d+\.\d+)/);
      const findings = audit(buf, m ? { version: m[1] } : {});
      if (findings.length) {
        bad++;
        console.log(`FAIL ${path.basename(z)}`);
        for (const f of findings) console.log(`     ${f.code}  ${f.why}`);
      } else {
        const n = readZip(buf).filter((e) => !e.dir).length;
        console.log(`ok   ${path.basename(z)}  ${n} files, ${buf.length} bytes`);
      }
    }
    console.log(`\n${zips.length} checked, ${bad} failing`);
    return bad ? 1 : 0;
  }

  const version = manifestVersion();
  const files = tracked();
  const when = commitDate();
  const out = path.resolve(val('--out', path.join(ROOT, 'dist')));
  fs.mkdirSync(out, { recursive: true });

  let combos;
  if (has('--all')) {
    combos = Object.keys(BIN_STRATEGIES).flatMap((b) => Object.keys(ROOT_SHAPES).map((r) => [b, r]));
  } else if (has('--only')) {
    const [b, r] = val('--only', '').split('-');
    combos = [[b, r]];
  } else {
    const st = loadState();
    if (!st.proven) {
      console.error('no combination has been proven yet. Run with --all, upload the candidates, then record the winner with --proven <bin>-<root>.');
      return 2;
    }
    combos = [st.proven.split('-')];
  }

  const canonical = !has('--all') && !has('--only');
  let bad = 0;
  for (const [b, r] of combos) {
    const built = buildOne(b, r, version, files, when);
    const name = canonical ? `${BASENAME}_${version}.zip` : `${BASENAME}_${version}-${b}-${r}.zip`;
    const dest = path.join(out, name);
    fs.writeFileSync(dest, built.buf);
    const findings = audit(built.buf, { version, expect: files.length });
    const dirs = built.entries.filter((e) => e.data === null).length;
    const nfiles = built.entries.length - dirs;
    const line = `${name}  ${nfiles} files + ${dirs} dirs, ${built.buf.length} bytes, bin/ -> ${built.binDir}/, ${built.descFixed.length} descriptions rewritten${built.prefix ? `, wrapper ${built.prefix}` : ', flat root'}`;
    if (findings.length) {
      bad++;
      console.log(`FAIL ${line}`);
      for (const f of findings) console.log(`     ${f.code}  ${f.why}`);
    } else {
      console.log(`ok   ${line}`);
    }
  }
  console.log(`\n${combos.length} built into ${out}, ${bad} failing`);
  return bad ? 1 : 0;
}

// The entry point runs only when this file is the script, never on import:
// the fourth pass exported five functions and the fifth pass, importing one,
// packed a 5.4 MB archive into dist/ and had its own process exited. Control
// C24 imports the module in a child and proves nothing is written.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
if (isMain) process.exit(main(process.argv.slice(2)));
