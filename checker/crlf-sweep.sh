#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/crlf-sweep.sh
# No text file in the tree carries a carriage return, a BOM, or a control byte
# the encoding law forbids (anything under 0x20 that is not TAB or LF, and DEL).
# Ends with its own negative control.
#
# Three batched greps, not three processes per file: the per-file loop measured
# 150 ms a file and took 108 s over 713 files, which blows the 60 s ceiling
# every command in this project runs under (found by pass 17 of the 7.0.0
# audit, which also caught the comment claiming otherwise).
set -u
cd "$(dirname "$0")/.." || exit 2

ctl="checker/zz-crlf-control.md"
# A kill between planting the control and removing it used to leave an
# untracked CR-carrying file behind, which the next run would report as a real
# failure (pass 17). The trap removes it however this script ends.
trap 'rm -f "$ctl"' EXIT INT TERM

list_files() {
  { git ls-files && git ls-files --others --exclude-standard; } 2>/dev/null \
    || find src bin lib dtd checker examples docs .github -type f 2>/dev/null
}

# The files to judge, binaries excluded, one enumeration reused by every check.
mapfile -t FILES < <(list_files | grep -v -E '\.(gif|png|tgz|log)$' | while IFS= read -r f; do [ -f "$f" ] && printf '%s\n' "$f"; done)
checked=${#FILES[@]}
bad=0

emit() { # emit <label> <file...>
  local label="$1"; shift
  for f in "$@"; do [ -n "$f" ] && { echo "$label $f"; bad=$((bad+1)); }; done
}

if [ "$checked" -gt 0 ]; then
  # One grep per rule over the whole list. -l prints the file once however many
  # times the byte occurs, which is all a refusal needs.
  # -U is not optional: without binary mode grep strips CR on Windows and
  # reports every CRLF file clean, which is the misreport this sweep has
  # always warned about (measured again in pass 17).
  mapfile -t CR_HITS   < <(LC_ALL=C grep -lUP '\r' "${FILES[@]}" 2>/dev/null)
  mapfile -t CTRL_HITS < <(LC_ALL=C grep -lUP '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]' "${FILES[@]}" 2>/dev/null)
  # A BOM is only a BOM at offset 0, so it is the one rule that reads heads.
  mapfile -t BOM_HITS  < <(for f in "${FILES[@]}"; do
      [ "$(head -c 3 "$f" | od -An -tx1 | tr -d ' \n')" = "efbbbf" ] && printf '%s\n' "$f"
    done)
  emit "CR"   "${CR_HITS[@]:-}"
  emit "BOM"  "${BOM_HITS[@]:-}"
  emit "CTRL" "${CTRL_HITS[@]:-}"
fi

# negative control: an UNTRACKED file inside the tree with a planted CR must be
# enumerated and counted.
printf 'line\r\n' > "$ctl"
seen=0
while IFS= read -r f; do
  if [ "$f" = "$ctl" ]; then c=$(tr -dc '\r' < "$f" | wc -c | tr -d ' '); [ "$c" = "1" ] && seen=1; fi
done < <(list_files)
rm -f "$ctl"
if [ "$seen" -ne 1 ]; then
  echo "CONTROL FAIL: a planted untracked CR file was not enumerated and counted"
  exit 1
fi
echo "control: a planted untracked CR file is enumerated and counted"
echo "crlf-sweep: $checked files checked, $bad bad"
[ "$bad" -eq 0 ]
