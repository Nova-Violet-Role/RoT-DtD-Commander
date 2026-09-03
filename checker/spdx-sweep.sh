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
    *.json|*.jsonl|*.gif|*.png|*.txt|*.log|LICENSE*|LICENSES/*|.gitignore|*.tgz) continue ;;
  esac
  [ -f "$f" ] || continue
  checked=$((checked+1))
  if ! grep -q -F "$TAG" "$f"; then
    echo "MISSING $f"
    missing=$((missing+1))
  fi
done < <({ git ls-files && git ls-files --others --exclude-standard; } 2>/dev/null || find src bin lib dtd checker examples docs .github -type f)

# negative control: an UNTRACKED file inside the tree without the tag must be enumerated and detected
ctl="checker/zz-untagged-control.md"
printf 'no header here\n' > "$ctl"
seen=0
while IFS= read -r f; do
  if [ "$f" = "$ctl" ] && ! grep -q -F "$TAG" "$f"; then seen=1; fi
done < <({ git ls-files && git ls-files --others --exclude-standard; } 2>/dev/null)
rm -f "$ctl"
if [ "$seen" -ne 1 ]; then
  echo "CONTROL FAIL: a planted untracked file without the tag was not enumerated"
  exit 1
fi
echo "control: a planted untracked file without the tag is enumerated and detected"
echo "spdx-sweep: $checked files checked, $missing missing"
[ "$missing" -eq 0 ]
