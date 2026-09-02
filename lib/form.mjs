#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/form.mjs
// The guards of dtd/cc-form.dtd, read from the contract and tripped on
// purpose. A form is a text in a declared shape (heredoc, NestedText, YAML,
// JuliaMD, XML, Markdown, JSON, TOML, or a polyglot); before a command reads
// or renders one, every guard must hold. The caps (FORM.max_depth,
// FORM.max_aliases) and the callout types come from the DTD, never from a
// number typed here (LAW.FORM.2, LAW.FORM.5, LAW.FORM.7).
//
//   guards(text, kind)   -> [{ name, held, detail }] for every guard that applies
//   allHold(text, kind)  -> true when every guard held
//   controls()           -> trips every guard on a fixture; exit 1 if one did not fire
//
//   node lib/form.mjs <file> [kind]     print the guards for a file
//   node lib/form.mjs controls          the negative controls

import { readFileSync } from 'node:fs';
import { join, dirname, resolve as presolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = readFileSync(join(ROOT, 'dtd', 'cc-form.dtd'), 'utf8');

function ent(name) {
  const m = new RegExp(`<!ENTITY\\s+${name.replace(/\./g, '\\.')}\\s+"([^"]*)"`).exec(DTD);
  if (!m) throw new Error(`cc-form.dtd declares no ${name}`);
  return m[1];
}

export const MAX_DEPTH = Number(ent('FORM.max_depth'));
export const MAX_ALIASES = Number(ent('FORM.max_aliases'));
export const DEFAULT_KIND = ent('FORM.default');
export const CALLOUTS = ['note', 'tip', 'important', 'warning', 'caution'].map((k) => ent(`FORM.md.${k}`));
// The alarm form: Markdown whose callouts may take the house vocabulary declared in FORM.alarm.types (the five GitHub types among them).
export const ALARM_TYPES = ent('FORM.alarm.types').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
export const GUARDS = (/<!ATTLIST guard[\s\S]*?name\s+\(([^)]+)\)/.exec(DTD) || [, ''])[1].split('|').map((s) => s.trim()).filter(Boolean);

// Which guards apply to which kind. A polyglot takes every guard of every
// layer it may carry, which is all of them.
const APPLIES = {
  yaml: ['yaml_tags', 'aliases', 'depth', 'tabs'],
  nt: ['depth', 'tabs'],
  heredoc: ['heredoc'],
  xml: ['cdata_end', 'depth'],
  md: ['callout'],
  jmd: ['callout'],
  json: ['depth'],
  toml: ['depth'],
  polyglot: ['yaml_tags', 'aliases', 'depth', 'tabs', 'heredoc', 'cdata_end', 'callout'],
  alarm: ['alarm'],
  polyalarm: ['yaml_tags', 'aliases', 'depth', 'tabs', 'heredoc', 'cdata_end', 'alarm'],
};

function indentDepth(text) {
  let max = 0;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const lead = /^[ \t]*/.exec(line)[0].replace(/\t/g, '  ').length;
    max = Math.max(max, Math.floor(lead / 2));
  }
  return max;
}

const CHECK = {
  yaml_tags(text) {
    const m = /(^|\s)(!![a-z]+\/[a-z_]+|![a-z]+\/object|!ruby\/[a-z]+|!!js\/[a-z]+)/i.exec(text);
    return m ? { held: false, detail: `tag ${m[2].trim()} names a language object or function` } : { held: true, detail: 'no language tag' };
  },
  aliases(text) {
    const anchors = (text.match(/&[A-Za-z_][\w-]*/g) || []).length;
    const aliases = (text.match(/\*[A-Za-z_][\w-]*/g) || []).length;
    const n = anchors + aliases;
    return n > MAX_ALIASES ? { held: false, detail: `${n} anchors and aliases, cap ${MAX_ALIASES}` } : { held: true, detail: `${n} anchors and aliases` };
  },
  depth(text) {
    const d = indentDepth(text);
    return d > MAX_DEPTH ? { held: false, detail: `nesting ${d}, cap ${MAX_DEPTH}` } : { held: true, detail: `nesting ${d}` };
  },
  tabs(text) {
    const m = /^( *)\t/m.exec(text);
    return m ? { held: false, detail: 'a tab in the indentation' } : { held: true, detail: 'no tab in the indentation' };
  },
  heredoc(text) {
    // Every here-document opener must use a delimiter not used by an enclosing
    // opener, and a value that carries a dollar sign must sit under a quoted
    // delimiter: an expanding heredoc with $ in its body is the injection path.
    const openers = [...text.matchAll(/<<-?\s*(['"]?)([A-Za-z_][\w]*)\1/g)];
    const seen = new Map();
    for (const o of openers) {
      if (seen.has(o[2])) return { held: false, detail: `delimiter ${o[2]} reused` };
      seen.set(o[2], !!o[1]);
    }
    for (const o of openers) {
      const quoted = !!o[1];
      const bodyStart = o.index + o[0].length;
      const end = text.indexOf(`\n${o[2]}`, bodyStart);
      const body = text.slice(bodyStart, end < 0 ? undefined : end);
      if (!quoted && /\$[{(A-Za-z_@#*0-9]/.test(body)) return { held: false, detail: `expanding heredoc ${o[2]} carries a dollar value` };
    }
    return { held: true, detail: `${openers.length} here-document(s), delimiters unique, values under quoted delimiters` };
  },
  cdata_end(text) {
    const sections = [...text.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g)];
    for (const s of sections) if (s[1].includes(']]>')) return { held: false, detail: 'a section close inside a CDATA section' };
    const open = (text.match(/<!\[CDATA\[/g) || []).length;
    const close = (text.match(/\]\]>/g) || []).length;
    if (open > close) return { held: false, detail: 'a CDATA section never closes' };
    if (close > open) return { held: false, detail: 'a section close with no section' };
    return { held: true, detail: `${open} CDATA section(s), closes balanced` };
  },
  callout(text) {
    for (const m of text.matchAll(/^>\s*\[!([A-Za-z]+)\]/gm)) {
      if (!CALLOUTS.includes(m[1].toUpperCase())) return { held: false, detail: `callout type ${m[1]} is not one of ${CALLOUTS.join(', ')}` };
    }
    return { held: true, detail: 'every callout is a GitHub type' };
  },
  alarm(text) {
    for (const m of text.matchAll(/^>\s*\[!([A-Za-z-]+):?\]/gm)) {
      if (!ALARM_TYPES.includes(m[1].toUpperCase())) return { held: false, detail: `callout type ${m[1]} is not one of ${ALARM_TYPES.join(', ')}` };
    }
    return { held: true, detail: 'every callout is a declared house type' };
  },
};

export function guards(text, kind = DEFAULT_KIND) {
  const names = APPLIES[kind];
  if (!names) throw new Error(`unknown form kind ${kind}`);
  return names.map((name) => ({ name, ...CHECK[name](text) }));
}

export function allHold(text, kind = DEFAULT_KIND) {
  return guards(text, kind).every((g) => g.held);
}

// ---------- controls ----------
// One fixture per guard, each expected to FAIL its guard, plus one clean
// text per kind expected to pass every guard.
export function controls() {
  const fixtures = [
    ['yaml_tags', 'yaml', '!!python/object/apply:os.system\n- id\n'],
    ['aliases', 'yaml', Array.from({ length: MAX_ALIASES + 1 }, (_, i) => `k${i}: &a${i} [*a${Math.max(0, i - 1)}]`).join('\n') + '\n'],
    ['depth', 'yaml', Array.from({ length: MAX_DEPTH + 2 }, (_, i) => ' '.repeat(i * 2) + 'a:').join('\n') + '\n'],
    ['tabs', 'nt', 'server:\n\thost: localhost\n'],
    ['heredoc', 'heredoc', 'cat <<EOF\ncommand: $1\nEOF\n'],
    ['cdata_end', 'xml', '<msg><![CDATA[value with ]]> inside]]></msg>\n'],
    ['callout', 'md', '> [!ALARM] Custom\n> refused\n'],
    ['alarm', 'alarm', '> [!FOO] Custom\n> refused\n'],
  ];
  const clean = [
    ['yaml', 'server:\n  host: localhost\n  note: |-\n    two lines\n    of text\n'],
    ['nt', 'server:\n  host: localhost\n  note:\n    > two lines\n    > of text\n'],
    ['heredoc', "cat <<'EOF'\ncommand: $1\nEOF\n"],
    ['xml', '<msg><![CDATA[a < b && c > d]]></msg>\n'],
    ['md', '> [!NOTE]\n> a note\n\n> [!CAUTION]\n> a caution\n'],
    ['alarm', '> [!ALARM] the ceiling\n> fired\n\n> [!ANSWER]\n> exit 124\n\n> [!Framework:]\n> the five moves\n'],
    ['polyalarm', '---\nschema: refentry\n---\n\n> [!LAW] refname\n> the name\n'],
  ];
  const rows = [];
  let bad = 0;
  for (const [name, kind, text] of fixtures) {
    const g = guards(text, kind).find((x) => x.name === name);
    const fired = g && !g.held;
    if (!fired) bad++;
    rows.push(`  ${fired ? 'PASS' : 'FAIL'} guard ${name} fires on its fixture: ${g ? g.detail : 'guard not applied'}`);
  }
  for (const [kind, text] of clean) {
    const ok = allHold(text, kind);
    if (!ok) bad++;
    rows.push(`  ${ok ? 'PASS' : 'FAIL'} clean ${kind} holds every guard`);
  }
  const declared = GUARDS.length === Object.keys(CHECK).length && GUARDS.every((g) => g in CHECK);
  if (!declared) bad++;
  rows.push(`  ${declared ? 'PASS' : 'FAIL'} the guards the DTD declares are the guards this module checks (${GUARDS.join(', ')})`);
  return { bad, rows };
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [a, b] = process.argv.slice(2);
  if (a === 'controls') {
    const r = controls();
    for (const row of r.rows) console.log(row);
    console.log(`form controls: ${r.bad ? `${r.bad} failing` : 'ok (0 failing)'}, guards ${GUARDS.length}, depth cap ${MAX_DEPTH}, alias cap ${MAX_ALIASES}, default ${DEFAULT_KIND}`);
    process.exit(r.bad ? 1 : 0);
  }
  if (!a) {
    console.log('usage: node lib/form.mjs <file> [kind] | controls');
    process.exit(2);
  }
  const text = readFileSync(presolve(a), 'utf8');
  const out = guards(text, b || DEFAULT_KIND);
  for (const g of out) console.log(`  guard ${g.name} held=${g.held ? 'yes' : 'no'}: ${g.detail}`);
  process.exit(out.every((g) => g.held) ? 0 : 1);
}
