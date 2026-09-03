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
here="$(cd "$(dirname "$0")/.." && pwd)"
vpass="$(grep -o 'COMPANION.verdict.pass *"[^"]*"' "$here/checker/companion-audit.dtd" | sed 's/.*"\(.*\)"/\1/')"
vfail="$(grep -o 'COMPANION.verdict.fail *"[^"]*"' "$here/checker/companion-audit.dtd" | sed 's/.*"\(.*\)"/\1/')"
[ -n "$vpass" ] && [ -n "$vfail" ] || { echo 'companion: verdict entities not found in checker/companion-audit.dtd'; exit 2; }

# The scorer, on one answer file. Reads the LAST non-empty line for the
# verdict; counts a high finding in the element spelling the prompt commands
# (severity="high") and in the bold line spelling a companion once used
# (**high ·); holds the scope line to this run with a fixed-string, whole-line
# match. checker/checker-controls.sh trips it on planted answers (M9 to M12).
score() {
  local log="$1" phase="$2" range="$3" model="$4"
  local last nverdict nhigh scope_ok
  last="$(grep -v '^[[:space:]]*$' "$log" | tail -1)"
  nverdict=$(grep -c '^COMPANION VERDICT' "$log")
  nhigh=$(( $(grep -c 'severity="high"' "$log") + $(grep -c '^\*\*high ·' "$log") ))
  scope_ok=$(grep -c -F -x "phase=$phase range=$range model=$model" "$log")
  echo "companion: last line: $last; verdict lines=$nverdict; high findings=$nhigh; scope line=$scope_ok"
  [ "$nverdict" -eq 1 ] || { echo "companion: LAW.COMPANION.4 broken, $nverdict verdict lines"; return 1; }
  [ "$scope_ok" -eq 1 ] || { echo "companion: LAW.COMPANION.6 broken, the scope line does not match this run"; return 1; }
  if [ "$last" = "$vpass" ]; then echo "companion: $phase PASS"; return 0; fi
  if [ "$last" = "$vfail" ]; then
    [ "$nhigh" -ge 1 ] || { echo "companion: LAW.COMPANION.4 broken, a fail with no high finding"; return 1; }
    echo "companion: $phase FAIL"; return 1
  fi
  echo "companion: no verdict on the last line of $log"; return 1
}

if [ "${1:-}" = "--score" ]; then
  score "${2:?answer file}" "${3:?phase}" "${4:?range}" "${5:-opus}"
  exit $?
fi

phase="${1:?phase name}"
range="${2:?git range, e.g. abc123..HEAD}"
out="${3:-${TMPDIR:-/tmp}}"
model="${4:-opus}"
turns="${5:-40}"
secs="${6:-900}"
mkdir -p "$out"
raw="$out/companion-$phase.json"
log="$out/companion-$phase.md"
contract="$(cat "$here/checker/companion-audit.dtd")"
stat="$(git -C "$here" diff --stat "$range" | tail -40)"
files="$(git -C "$here" diff --name-only "$range")"

prompt="You are the Scratchpad Companion auditing build phase '$phase' of RoT DtD Commander at $here (git range $range).
Answer in the grammar declared here, one markdown heading per element in declared order, headings '### 🩺 Scope', '### 🩺 Findings', '### 🩺 Verdict', '### 🩺 Next', each with a blank line before and after. Write every finding as a finding element on its own lines, exactly this spelling: <finding file=\"path\" line=\"n\" severity=\"high|medium|low\" confidence=\"measured|reasoned|guessed\">the text</finding>; the scorer counts severity=\"high\" and no other spelling of a high finding:

$contract

Your working directory is a scratchpad; the repository is $here, so use absolute paths and 'git -C $here'. Anti-stall laws bind you: read and run only, never write, edit, commit, spawn or background anything; every Bash command you run must start with 'timeout 60 ' and end with ' < /dev/null'; never run a command that reads stdin. Cite every finding as file:line you actually read, with severity high|medium|low and confidence measured|reasoned|guessed. Audit for: a declaration in a DTD that the code does not honour, a control that cannot trip, an encoding fault (CR, BOM), a law numbered out of sequence, a claim in a commit message or doc that the tree contradicts, and prose that the AI_SLOP gate (lib/ai-slop.mjs) would fail. Start from the diff stat and file list below, open the files, run 'timeout 60 node $here/lib/ai-slop.mjs controls < /dev/null' and 'timeout 60 node $here/lib/ordinals.mjs controls < /dev/null' yourself. Open the Scope with exactly this line, then a blank line: 'phase=$phase range=$range model=$model'. A fail verdict needs at least one finding with severity high. The very last line of your answer must be exactly '$vpass' or '$vfail', it must be the only line that starts with 'COMPANION VERDICT', and nothing may follow it.

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
score "$log" "$phase" "$range" "$model"
exit $?
