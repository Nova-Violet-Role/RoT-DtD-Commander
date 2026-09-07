#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/companion-guard.mjs
// The PreToolUse hook of the nested companion session (LAW.COMPANION.1, 2).
//
// The allow-list grant is a prefix on a shell string, and the shell resolves
// `;`, `&&`, `|` and `>` before the wrapper is execed, so the wrapper's own
// argument scan never sees a chain: the twenty-sixth companion pass measured
// `bash checker/companion-run.sh node lib/ai-slop.mjs controls; echo EXIT`
// running the chained echo under the grant. A hook sees the whole string.
// This one refuses any Bash command that is not exactly one wrapper call,
// `bash <here>/checker/companion-run.sh <args>`, carrying no shell syntax
// (chain, pipe, background, redirect, substitution, backtick, newline), any
// Bash call whose own run_in_background field is set, and every writing
// tool by name whatever the allow-list says.
//
//   payload on stdin (the hook contract): { tool_name, tool_input }
//   exit 0   the call may proceed
//   exit 2   the call is blocked; the reason on stderr reaches the model
//
//   node checker/companion-guard.mjs controls   the payloads planted, eight controls

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const WRITERS = /^(Write|Edit|MultiEdit|NotebookEdit|Task|Agent|WebFetch|WebSearch)$/;
const SYNTAX = /[;&|<>`$\n\r]/;

// The one shape a Bash command may take: a single wrapper call on this
// repository, arguments free of shell syntax. Both path styles of the root
// are accepted, the MSYS one and the Windows one.
export function judge(payload, root = ROOT) {
  const tool = String(payload.tool_name || '');
  if (WRITERS.test(tool)) return { ok: false, why: `${tool} is not a tool the companion may use (LAW.COMPANION.1)` };
  if (tool !== 'Bash') return { ok: true, why: `${tool} reads` };
  // The Bash tool's own field, apart from the shell's ampersand: a wrapper
  // call sent to the background is the one thing LAW.COMPANION.1 names
  // (twenty-seventh companion pass).
  const input = payload.tool_input || {};
  if (input.run_in_background === true || String(input.run_in_background) === 'true') return { ok: false, why: 'a Bash command is never run in the background; the field run_in_background is refused (LAW.COMPANION.1)' };
  const cmd = String(input.command || '');
  const roots = [root, root.replace(/\\/g, '/'), root.replace(/^([A-Za-z]):/, (m, d) => `/${d.toLowerCase()}`).replace(/\\/g, '/')];
  const head = roots.map((r) => `bash ${r}/checker/companion-run.sh`);
  const matched = head.find((h) => cmd === h || cmd.startsWith(h + ' '));
  if (!matched) return { ok: false, why: `a Bash command is one wrapper call, bash ${root}/checker/companion-run.sh <args>; this one is not (LAW.COMPANION.2)` };
  const args = cmd.slice(matched.length);
  if (SYNTAX.test(args)) return { ok: false, why: 'a wrapper call carries no chain, pipe, background, redirect, substitution, backtick or newline; the wrapper closes stdin and applies the ceiling itself (LAW.COMPANION.2)' };
  return { ok: true, why: 'one wrapper call' };
}

export function controls(io = console) {
  let fail = 0;
  const say = (ok, text) => { io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const root = 'C:/r';
  const w = 'bash C:/r/checker/companion-run.sh';
  say(judge({ tool_name: 'Bash', tool_input: { command: `${w} node lib/ordinals.mjs controls` } }, root).ok, 'one wrapper call proceeds');
  say(judge({ tool_name: 'Bash', tool_input: { command: `${w} git log -1` } }, root).ok, 'one wrapper call with a git verb proceeds');
  const chain = judge({ tool_name: 'Bash', tool_input: { command: `${w} node lib/ordinals.mjs controls; echo EXIT` } }, root);
  say(!chain.ok && /no chain/.test(chain.why), `trip: a chain after the wrapper is refused: ${chain.why.slice(0, 60)}`);
  const redirect = judge({ tool_name: 'Bash', tool_input: { command: `${w} git log -1 > zz.txt` } }, root);
  say(!redirect.ok, 'trip: a redirect after the wrapper is refused');
  const bare = judge({ tool_name: 'Bash', tool_input: { command: 'node lib/ordinals.mjs controls' } }, root);
  say(!bare.ok && /one wrapper call/.test(bare.why), `trip: a Bash command that is not a wrapper call is refused by name: ${bare.why.slice(0, 50)}`);
  const write = judge({ tool_name: 'Write', tool_input: { file_path: 'x', content: 'y' } }, root);
  say(!write.ok && /Write/.test(write.why), 'trip: a writing tool is refused by name whatever the allow-list says');
  const msys = judge({ tool_name: 'Bash', tool_input: { command: 'bash /c/r/checker/companion-run.sh git status' } }, root);
  say(msys.ok, 'the MSYS spelling of the root is the same wrapper');
  const bg = judge({ tool_name: 'Bash', tool_input: { command: `${w} git log -1`, run_in_background: true } }, root);
  say(!bg.ok && /background/.test(bg.why), 'trip: a wrapper call with run_in_background set is refused by the field, whatever the string says');
  io.log(`companion-guard controls: 8 run, ${fail} failing`);
  return fail === 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'controls') process.exit(controls() ? 0 : 1);
  let payload = {};
  try { payload = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { payload = {}; }
  const v = judge(payload);
  if (v.ok) process.exit(0);
  process.stderr.write(`companion-guard: blocked: ${v.why}\n`);
  process.exit(2);
}
