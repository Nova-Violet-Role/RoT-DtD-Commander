#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/companion-audit.sh : run the Scratchpad Companion on one build phase.
#
#   bash checker/companion-audit.sh <phase-name> <git-range> [out-dir] [model] [turns] [seconds]
#
# Foreground only. stdin closed, a turn ceiling, a wall-clock ceiling, the
# whole answer teed to <out-dir>/companion-<phase>.md, the exit code read
# through PIPESTATUS, and the verdict line grepped from the answer:
#   exit 0  COMPANION VERDICT: pass
#   exit 1  COMPANION VERDICT: fail, or no verdict line
#   exit 124 the ceiling fired: the phase is UNAUDITED (LAW.COMPANION.5)
# The contract the companion answers in is checker/companion-audit.dtd.

set -u
phase="${1:?phase name}"
range="${2:?git range, e.g. abc123..HEAD}"
out="${3:-${TMPDIR:-/tmp}}"
model="${4:-opus}"
turns="${5:-40}"
secs="${6:-900}"
here="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$out"
log="$out/companion-$phase.md"
contract="$(cat "$here/checker/companion-audit.dtd")"
stat="$(git -C "$here" diff --stat "$range" | tail -40)"
files="$(git -C "$here" diff --name-only "$range")"

prompt="You are the Scratchpad Companion auditing build phase '$phase' of RoT DtD Commander at $here (git range $range).
Answer in the grammar declared here, one markdown heading per element in declared order, headings '### 🩺 Scope', '### 🩺 Findings', '### 🩺 Verdict', '### 🩺 Next', each with a blank line before and after:

$contract

Anti-stall laws bind you: read and run only, never write, edit, commit, spawn or background anything; every Bash command you run must start with 'timeout 60 ' and end with ' < /dev/null'; never run a command that reads stdin. Cite every finding as file:line you actually read, with severity high|medium|low and confidence measured|reasoned|guessed. Audit for: a declaration in a DTD that the code does not honour, a control that cannot trip, an encoding fault (CR, BOM), a law numbered out of sequence, a claim in a commit message or doc that the tree contradicts, and prose that the AI_SLOP gate (lib/ai-slop.mjs) would fail. Start from the diff stat and file list below, open the files, run 'timeout 60 node lib/ai-slop.mjs controls < /dev/null' and 'timeout 60 node lib/ordinals.mjs controls < /dev/null' yourself. End with exactly one line: 'COMPANION VERDICT: pass' or 'COMPANION VERDICT: fail'.

Diff stat:
$stat

Files changed:
$files"

echo "companion: phase=$phase range=$range model=$model turns=$turns ceiling=${secs}s log=$log"
env -u CLAUDECODE timeout "$secs" claude -p "$prompt" --model "$model" --max-turns "$turns" --output-format text \
  --allowedTools "Read,Grep,Glob,Bash(timeout:*),Bash(git diff:*),Bash(git log:*),Bash(git show:*)" \
  < /dev/null 2>&1 | tee "$log"
rc=${PIPESTATUS[0]}
echo
echo "companion: claude exit=$rc"
if [ "$rc" -eq 124 ]; then echo "companion: CEILING FIRED, phase $phase is UNAUDITED"; exit 124; fi
if grep -q "COMPANION VERDICT: pass" "$log"; then echo "companion: $phase PASS"; exit 0; fi
if grep -q "COMPANION VERDICT: fail" "$log"; then echo "companion: $phase FAIL"; exit 1; fi
echo "companion: no verdict line in $log"; exit 1
