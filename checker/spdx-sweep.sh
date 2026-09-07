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

# A REUSE glob: * never crosses a slash, a leading **/ is any depth including
# the root. Translated to a regex, because a shell case glob lets * cross a
# slash and covered a vendored JSON one level below a named directory
# (sixteenth companion pass).
covered() {
  local f="$1" g re
  for g in "${globs[@]}"; do
    re="^$(printf '%s' "$g" | sed 's/[.]/\\./g; s|\*\*/|__ANY__|g; s|\*|[^/]*|g; s|__ANY__|(.*/)?|g')$"
    printf '%s\n' "$f" | grep -q -E "$re" && return 0
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
md="checker/zz-untagged-control.md"; bin="checker/zz-untagged-control.bin"; js="checker/zz-untagged-control.json"; qt="checker/zz-untagged-control-quoted.md"; deep="checker/zz-deep-control/x.json"
printf 'no header here\n' > "$md"; printf 'no header here\n' > "$bin"; printf '{"no": "header"}\n' > "$js"
# a JSON one level below a named directory is covered by nothing: * never crosses a slash
mkdir -p "$(dirname "$deep")"; printf '{"no": "header"}\n' > "$deep"
# a file whose only tag is quoted prose past the header lines is untagged (fifteenth companion pass)
{ for i in $(seq 1 30); do echo "line $i"; done; echo "the prose quotes SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 and that is not a header"; } > "$qt"
out1="$(sweep_once)"
read -r c1 v1 m1 <<< "$(printf '%s\n' "$out1" | tail -1)"
rm -f "$md" "$bin" "$js" "$qt" "$deep"; rmdir "$(dirname "$deep")"
if [ "$m1" -ne $((m0+4)) ] || [ "$v1" -ne $((v0+1)) ] || [ "$c1" -ne "$c0" ]; then
  echo "CONTROL FAIL: planted md, bin, quoted-tag and deep json files must add 4 missing and a planted json 1 covered; read missing $m0 to $m1, covered $v0 to $v1, checked $c0 to $c1"
  exit 1
fi
echo "control: two planted tagless files, one whose only tag is quoted prose and a json one level below a named directory are counted missing, and a planted json is covered by REUSE.toml (missing $m0 to $m1, covered $v0 to $v1)"
# A directory under artifacts/ carrying its own .gitignore is a tool hiding
# its droppings from git status; it is named here rather than trusted
# (sixteenth companion pass: .rot-moe/ held eighteen files behind a one-line
# .gitignore of its own).
foreign() { find artifacts -mindepth 2 -name .gitignore 2>/dev/null | sort; }
f0="$(foreign)"
mkdir -p artifacts/zz-foreign-control; printf '*\n' > artifacts/zz-foreign-control/.gitignore
f1="$(foreign)"
rm -rf artifacts/zz-foreign-control
if ! printf '%s\n' "$f1" | grep -q -F 'artifacts/zz-foreign-control/.gitignore'; then
  echo "CONTROL FAIL: a planted foreign .gitignore under artifacts/ was not named"
  exit 1
fi
echo "control: a planted foreign .gitignore under artifacts/ is named"
if [ -n "$f0" ]; then
  printf 'FOREIGN IGNORE %s\n' $f0
  echo "spdx-sweep: a directory under artifacts/ carries its own .gitignore; remove it and ignore the tool's output from the repository's .gitignore"
  exit 1
fi
echo "spdx-sweep: $c0 files checked, $v0 covered by REUSE.toml, $m0 missing"
[ "$m0" -eq 0 ]
