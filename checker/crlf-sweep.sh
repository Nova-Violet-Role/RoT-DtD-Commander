#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/crlf-sweep.sh
# No tracked text file carries a carriage return or a BOM. Counts bytes with
# tr, never with a text-mode grep (which misreports on Windows). Ends with
# its own negative control.
set -u
cd "$(dirname "$0")/.." || exit 2
bad=0
checked=0
while IFS= read -r f; do
  case "$f" in
    *.gif|*.png|*.tgz) continue ;;
  esac
  [ -f "$f" ] || continue
  checked=$((checked+1))
  cr=$(tr -dc '\r' < "$f" | wc -c | tr -d ' ')
  bom=$(head -c 3 "$f" | od -An -tx1 | tr -d ' \n')
  if [ "$cr" != "0" ]; then echo "CR $cr $f"; bad=$((bad+1)); fi
  if [ "$bom" = "efbbbf" ]; then echo "BOM $f"; bad=$((bad+1)); fi
done < <(git ls-files 2>/dev/null || find src bin lib dtd checker examples docs .github -type f)

# negative control: a planted CR must be counted
ctl=$(mktemp)
printf 'line\r\n' > "$ctl"
cr=$(tr -dc '\r' < "$ctl" | wc -c | tr -d ' ')
rm -f "$ctl"
if [ "$cr" != "1" ]; then
  echo "CONTROL FAIL: a planted CR was not counted (got $cr)"
  exit 1
fi
echo "control: a planted CR is counted"
echo "crlf-sweep: $checked files checked, $bad bad"
[ "$bad" -eq 0 ]
