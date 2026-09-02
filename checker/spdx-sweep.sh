#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/spdx-sweep.sh
# Every tracked source file carries the SPDX tag. Exit 1 on the first file
# that does not. Ends with its own negative control: a file without the tag
# must be detected, or this sweep proves nothing.
set -u
cd "$(dirname "$0")/.." || exit 2
TAG='SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2'
missing=0
checked=0
while IFS= read -r f; do
  case "$f" in
    *.json|*.jsonl|*.gif|*.png|*.txt|LICENSE*|LICENSES/*|.gitignore|*.tgz) continue ;;
  esac
  [ -f "$f" ] || continue
  checked=$((checked+1))
  if ! grep -q -F "$TAG" "$f"; then
    echo "MISSING $f"
    missing=$((missing+1))
  fi
done < <(git ls-files 2>/dev/null || find src bin lib dtd checker examples docs .github -type f)

# negative control
ctl=$(mktemp)
printf 'no header here\n' > "$ctl"
if grep -q -F "$TAG" "$ctl"; then
  echo "CONTROL FAIL: a file without the tag was not detected"
  rm -f "$ctl"
  exit 1
fi
rm -f "$ctl"
echo "control: a file without the tag is detected"
echo "spdx-sweep: $checked files checked, $missing missing"
[ "$missing" -eq 0 ]
