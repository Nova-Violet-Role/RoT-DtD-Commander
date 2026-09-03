#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/ceiling-controls.sh
# Trips the two 300 s ceilings of LAW.ADIUTOR.10 on purpose, at one second,
# and proves each trip landed:
#   K1  rdc watch --secs 1   the monitor stops itself: exit 0, the ceiling
#                            line on stderr, well inside the outer timeout
#   K2  ROT_DTD_CEILING=1 rdc controls   the delegate stops a run that
#                            outlives the ceiling: exit 124, the ceiling line
# Every command runs in the foreground under an outer timeout with stdin
# closed; the exit code is read from the command, never through a pipe.

set -u
cd "$(dirname "$0")/.." || exit 2
bad=0

# K1: the monitor's own ceiling
out=$(mktemp)
timeout 30 node bin/rot-dtd-commander.mjs watch --secs 1 --poll 100 < /dev/null > "$out" 2>&1
rc=$?
if [ "$rc" -eq 0 ] && grep -q '1 s ceiling reached' "$out"; then
  echo "  PASS K1 rdc watch --secs 1 stopped itself: exit 0, ceiling line printed"
else
  echo "  FAIL K1 rdc watch --secs 1: exit $rc"; sed 's/^/        /' "$out"; bad=$((bad + 1))
fi
rm -f "$out"

# K2: the delegate's ceiling around a run that takes longer than one second
out=$(mktemp)
ROT_DTD_CEILING=1 timeout 60 node bin/rot-dtd-commander.mjs controls < /dev/null > "$out" 2>&1
rc=$?
if [ "$rc" -eq 124 ] && grep -q 'reached the 1 s ceiling' "$out"; then
  echo "  PASS K2 ROT_DTD_CEILING=1 rdc controls was stopped: exit 124, ceiling line printed"
else
  echo "  FAIL K2 ROT_DTD_CEILING=1 rdc controls: exit $rc"; tail -5 "$out" | sed 's/^/        /'; bad=$((bad + 1))
fi
rm -f "$out"

# K3: the default is 300 when the override is unset or junk: the monitor
# announces its ceiling on stderr at start; the outer timeout ends the run.
out=$(mktemp)
ROT_DTD_CEILING=junk timeout 3 node bin/rot-dtd-commander.mjs watch --poll 100 < /dev/null > "$out" 2>&1
rc=$?
if [ "$rc" -eq 124 ] && grep -q "ceiling 300 s" "$out"; then
  echo "  PASS K3 the default ceiling is 300 s (announced at start, run ended by the outer timeout)"
else
  echo "  FAIL K3 default ceiling: exit $rc"; sed "s/^/        /" "$out"; bad=$((bad + 1))
fi
rm -f "$out"

echo "ceiling-controls: 3 run, $bad failing"
[ "$bad" -eq 0 ]
