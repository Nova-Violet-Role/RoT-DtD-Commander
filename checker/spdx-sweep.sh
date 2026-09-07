#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/spdx-sweep.sh
# Every tracked file carries an SPDX tag, or is covered by an annotation of
# REUSE.toml, or is a licence text. The tag is the repository's dual
# licence, or that licence AND MIT on a file converted from
# taches-cc-resources. Exit 1 on any file that is none of the three.
#
# Until 9.0.0 the sweep skipped json, jsonl, gif and a few more by
# extension and reported 0 missing over exactly the files nothing covered,
# while the README wore a REUSE badge (thirteenth companion pass). The
# skip list is gone: a tagless file is covered by REUSE.toml or it is
# missing, and the control plants one of each and reads both counts move.
set -u
cd "$(dirname "$0")/.." || exit 2
TAG_RE='SPDX-License-Identifier: (\(AGPL-3\.0-or-later OR EUPL-1\.2\) AND MIT|AGPL-3\.0-or-later OR EUPL-1\.2)'

# The annotation paths of REUSE.toml, one glob per line. A leading **/ means
# any depth including the root, which a bash case pattern says as two arms.
globs=()
while IFS= read -r g; do globs+=("$g"); done < <(sed -n 's/^path = \[\(.*\)\]$/\1/p' REUSE.toml | tr ',' '\n' | sed 's/[" ]//g' | sed '/^$/d')
[ "${#globs[@]}" -ge 1 ] || { echo "spdx-sweep: REUSE.toml declares no annotation path"; exit 2; }

covered() {
  local f="$1" g p
  for g in "${globs[@]}"; do
    p="${g#\*\*/}"
    # shellcheck disable=SC2254
    case "$f" in $p|*/$p) return 0 ;; esac
  done
  return 1
}

# One pass over every tracked and untracked file: prints "checked covered missing"
# and the MISSING lines.
sweep_once() {
  local f checked=0 covered_n=0 missing=0
  while IFS= read -r f; do
    case "$f" in
      LICENSE*|LICENSES/*) continue ;;
    esac
    [ -f "$f" ] || continue
    if head -n 25 "$f" | grep -q -E "$TAG_RE"; then
      checked=$((checked+1))
    elif covered "$f"; then
      covered_n=$((covered_n+1))
    else
      echo "MISSING $f"
      missing=$((missing+1))
    fi
  done < <({ git ls-files && git ls-files --others --exclude-standard; } 2>/dev/null || find src bin lib dtd checker docs .github -type f)
  echo "$checked $covered_n $missing"
}

out0="$(sweep_once)"
read -r c0 v0 m0 <<< "$(printf '%s\n' "$out0" | tail -1)"
printf '%s\n' "$out0" | grep '^MISSING' || true

# Negative control: three UNTRACKED files planted inside the tree. A tagless
# .md and a tagless .bin are covered by nothing and must be counted missing;
# a tagless .json is covered by REUSE.toml and must be counted covered. The
# counts of a second pass move by exactly those amounts, or the sweep is
# reporting over a hole it cannot see.
md="checker/zz-untagged-control.md"; bin="checker/zz-untagged-control.bin"; js="checker/zz-untagged-control.json"; qt="checker/zz-untagged-control-quoted.md"
printf 'no header here\n' > "$md"; printf 'no header here\n' > "$bin"; printf '{"no": "header"}\n' > "$js"
# a file whose only tag is quoted prose past the header lines is untagged (fifteenth companion pass)
{ for i in $(seq 1 30); do echo "line $i"; done; echo "the prose quotes SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 and that is not a header"; } > "$qt"
out1="$(sweep_once)"
read -r c1 v1 m1 <<< "$(printf '%s\n' "$out1" | tail -1)"
rm -f "$md" "$bin" "$js" "$qt"
if [ "$m1" -ne $((m0+3)) ] || [ "$v1" -ne $((v0+1)) ] || [ "$c1" -ne "$c0" ]; then
  echo "CONTROL FAIL: planted md, bin and quoted-tag files must add 3 missing and a planted json 1 covered; read missing $m0 to $m1, covered $v0 to $v1, checked $c0 to $c1"
  exit 1
fi
echo "control: two planted tagless files and one whose only tag is quoted prose are counted missing, and a planted json is covered by REUSE.toml (missing $m0 to $m1, covered $v0 to $v1)"
echo "spdx-sweep: $c0 files checked, $v0 covered by REUSE.toml, $m0 missing"
[ "$m0" -eq 0 ]
