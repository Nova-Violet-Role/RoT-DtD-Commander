#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/companion-audit.sh : run the Scratchpad Companion on one build phase.
#
#   bash checker/companion-audit.sh <phase-name> <git-range> [out-dir] [model] [turns] [seconds]
#
# Foreground only. stdin closed, a turn ceiling, a wall-clock ceiling, the
# raw JSON stream teed to <out-dir>/companion-<phase>.json, the answer
# (the result field, never a hook's stanza) written to
# <out-dir>/companion-<phase>.md, the exit code read through PIPESTATUS,
# and the verdict scored on the LAST non-empty line of the answer only,
# so a companion that quotes its own contract cannot pass by quoting it:
#   exit 0   last line is COMPANION VERDICT: pass
#   exit 1   last line is COMPANION VERDICT: fail, or is not a verdict line
#   exit 124 the ceiling fired: the phase is UNAUDITED (LAW.COMPANION.5)
# The contract the companion answers in is checker/companion-audit.dtd.
# ROTMOE_VOICE=0 silences the voice hooks in the nested session so its
# final message is the audit and not a stanza.

set -u
phase="${1:?phase name}"
range="${2:?git range, e.g. abc123..HEAD}"
out="${3:-${TMPDIR:-/tmp}}"
model="${4:-opus}"
turns="${5:-40}"
secs="${6:-900}"
here="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$out"
raw="$out/companion-$phase.json"
log="$out/companion-$phase.md"
contract="$(cat "$here/checker/companion-audit.dtd")"
stat="$(git -C "$here" diff --stat "$range" | tail -40)"
files="$(git -C "$here" diff --name-only "$range")"

prompt="You are the Scratchpad Companion auditing build phase '$phase' of RoT DtD Commander at $here (git range $range).
Answer in the grammar declared here, one markdown heading per element in declared order, headings '### 🩺 Scope', '### 🩺 Findings', '### 🩺 Verdict', '### 🩺 Next', each with a blank line before and after:

$contract

Your working directory is a scratchpad; the repository is $here, so use absolute paths and 'git -C $here'. Anti-stall laws bind you: read and run only, never write, edit, commit, spawn or background anything; every Bash command you run must start with 'timeout 60 ' and end with ' < /dev/null'; never run a command that reads stdin. Cite every finding as file:line you actually read, with severity high|medium|low and confidence measured|reasoned|guessed. Audit for: a declaration in a DTD that the code does not honour, a control that cannot trip, an encoding fault (CR, BOM), a law numbered out of sequence, a claim in a commit message or doc that the tree contradicts, and prose that the AI_SLOP gate (lib/ai-slop.mjs) would fail. Start from the diff stat and file list below, open the files, run 'timeout 60 node lib/ai-slop.mjs controls < /dev/null' and 'timeout 60 node lib/ordinals.mjs controls < /dev/null' yourself. The very last line of your answer must be exactly 'COMPANION VERDICT: pass' or 'COMPANION VERDICT: fail' and nothing may follow it.

Diff stat:
$stat

Files changed:
$files"

echo "companion: phase=$phase range=$range model=$model turns=$turns ceiling=${secs}s log=$log"
# cwd is the scratchpad, not the repo: a nested session's hooks must not touch the tree (measured: CRLF .gitignore, .claude/, .codemap/, CLAUDE.md).
( cd "$out" && ROTMOE_VOICE=0 CCC_HOOK_AUTOINIT=0 env -u CLAUDECODE timeout "$secs" claude -p "$prompt" --model "$model" --max-turns "$turns" --output-format json --add-dir "$here" \
  --allowedTools "Read,Grep,Glob,Bash(timeout 60 node:*),Bash(timeout 60 git:*),Bash(timeout 60 cat:*)" \
  < /dev/null 2>&1 ) | tee "$raw" | tail -c 400
rc=${PIPESTATUS[0]}
echo
echo "companion: claude exit=$rc"
if [ "$rc" -eq 124 ]; then echo "companion: CEILING FIRED, phase $phase is UNAUDITED"; exit 124; fi
node -e '
const fs = require("fs");
const raw = fs.readFileSync(process.argv[1], "utf8");
let j = null;
try { j = JSON.parse(raw); } catch (e) { const i = raw.indexOf("{"); try { j = JSON.parse(raw.slice(i)); } catch (e2) { j = null; } }
const result = j && typeof j.result === "string" ? j.result : "";
fs.writeFileSync(process.argv[2], result.replace(/\r/g, "") + (result.endsWith("\n") ? "" : "\n"), "utf8");
const meta = j ? `turns=${j.num_turns} cost_usd=${j.total_cost_usd} duration_ms=${j.duration_ms} is_error=${j.is_error} subtype=${j.subtype}` : "no json parsed";
console.log("companion: " + meta + " answer_bytes=" + Buffer.byteLength(result));
' "$raw" "$log"
last="$(grep -v '^[[:space:]]*$' "$log" | tail -1)"
echo "companion: last line: $last"
case "$last" in
  "COMPANION VERDICT: pass") echo "companion: $phase PASS"; exit 0 ;;
  "COMPANION VERDICT: fail") echo "companion: $phase FAIL"; exit 1 ;;
  *) echo "companion: no verdict on the last line of $log"; exit 1 ;;
esac
