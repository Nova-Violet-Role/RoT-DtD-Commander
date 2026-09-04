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
    *.gif|*.png|*.tgz|*.log) continue ;;
  esac
  [ -f "$f" ] || continue
  checked=$((checked+1))
  cr=$(tr -dc '\r' < "$f" | wc -c | tr -d ' ')
  bom=$(head -c 3 "$f" | od -An -tx1 | tr -d ' \n')
  if [ "$cr" != "0" ]; then echo "CR $cr $f"; bad=$((bad+1)); fi
  if [ "$bom" = "efbbbf" ]; then echo "BOM $f"; bad=$((bad+1)); fi
  # The encoding law allows TAB and LF and nothing else below 0x20: a raw 0x05
  # sat in a shipped SKILL.md since before v6.0.0 and no sweep could see it
  # (pass 15 of the 7.0.0 audit).
  # One grep instead of od piped through tr piped through grep: measured at
  # 17 ms per file against 150, which brought the sweep back under its ceiling
  # (pass 16 timed it out at 108 s).
  if LC_ALL=C grep -qP '[\x00-\x08\x0B\x0C\x0E-\x1F]' "$f" 2>/dev/null; then ctrl=1; else ctrl=0; fi
  if [ "$ctrl" != "0" ]; then echo "CTRL $ctrl $f"; bad=$((bad+1)); fi
done < <({ git ls-files && git ls-files --others --exclude-standard; } 2>/dev/null || find src bin lib dtd checker examples docs .github -type f)

# negative control: an UNTRACKED file inside the tree with a planted CR must be enumerated and counted
ctl="checker/zz-crlf-control.md"
printf 'line\r\n' > "$ctl"
seen=0
while IFS= read -r f; do
  if [ "$f" = "$ctl" ]; then c=$(tr -dc '\r' < "$f" | wc -c | tr -d ' '); [ "$c" = "1" ] && seen=1; fi
done < <({ git ls-files && git ls-files --others --exclude-standard; } 2>/dev/null)
rm -f "$ctl"
if [ "$seen" -ne 1 ]; then
  echo "CONTROL FAIL: a planted untracked CR file was not enumerated and counted"
  exit 1
fi
echo "control: a planted untracked CR file is enumerated and counted"
echo "crlf-sweep: $checked files checked, $bad bad"
[ "$bad" -eq 0 ]
