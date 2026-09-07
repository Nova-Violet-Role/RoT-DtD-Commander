#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/companion-run.sh
# The one Bash form the Scratchpad Companion may run (LAW.COMPANION.1 and 2).
#
#   bash checker/companion-run.sh node <engine.mjs under lib/, checker/ or bin/> [args]
#   bash checker/companion-run.sh git [-C <dir>] <reading verb> [args]
#
# Until the eighteenth companion pass on 9.0.0 the runner granted
# Bash(node lib/ceiling.mjs 60 node:*) and the git twin, and a prefix grant
# admits everything after the prefix: node -e with writeFileSync, git commit,
# git checkout. This wrapper runs an engine of this repository or a git verb
# that reads, under the portable ceiling with stdin closed, and refuses by
# name: any other executable, a node flag that evaluates or loads code, a
# script outside the three engine directories, a git verb that writes, and
# any argument carrying shell syntax (redirect, pipe, chain, background,
# substitution). Exit 2 on refusal; the command's own exit otherwise.
set -u
here="$(cd "$(dirname "$0")/.." && pwd)"
refuse() { echo "companion-run: refused: $1"; exit 2; }
[ $# -ge 2 ] || refuse "usage: node <engine.mjs> [args] | git <reading verb> [args]"
tool="$1"; shift
for a in "$@"; do
  case "$a" in
    *'>'*|*'<'*|*'|'*|*';'*|*'&'*|*'`'*|*'$('*|*$'\n'*) refuse "an argument carries shell syntax: $a" ;;
  esac
done
case "$tool" in
  node)
    script="${1:-}"; shift || true
    [ -n "$script" ] || refuse "node needs an engine path"
    case "$script" in -*) refuse "a node flag is not an engine ($script)" ;; esac
    dir="$(cd "$(dirname "$script")" 2>/dev/null && pwd)" || refuse "no such engine: $script"
    abs="$dir/$(basename "$script")"
    [ -f "$abs" ] || refuse "no such engine: $script"
    case "$abs" in
      "$here"/lib/*.mjs|"$here"/checker/*.mjs|"$here"/bin/*.mjs) ;;
      *) refuse "$script is not an engine under lib/, checker/ or bin/ of this repository" ;;
    esac
    for a in "$@"; do
      case "$a" in
        -e|--eval|-p|--print|--input-type*|-r|--require|--require=*|--import|--import=*|--loader|--loader=*|--experimental-*) refuse "node flag $a evaluates or loads code" ;;
      esac
    done
    exec node "$here/lib/ceiling.mjs" 60 node "$abs" "$@" < /dev/null
    ;;
  git)
    if [ "${1:-}" = "-C" ]; then shift 2 || refuse "git -C needs a directory"; fi
    verb="${1:-}"; shift || true
    case "$verb" in
      log|diff|show|status|ls-files|grep|rev-parse|check-ignore|blame|cat-file|describe|shortlog|rev-list|diff-tree|ls-tree|name-rev|show-ref|for-each-ref|count-objects|check-attr|var|config) ;;
      *) refuse "git $verb writes, or is not a reading verb" ;;
    esac
    for a in "$@"; do
      case "$a" in
        --output|--output=*|--set*|--unset*|--add|--replace-all|--edit|-e) refuse "git $verb $a writes" ;;
      esac
    done
    exec node "$here/lib/ceiling.mjs" 60 git -C "$here" "$verb" "$@" < /dev/null
    ;;
  *) refuse "only node and git are run, not $tool" ;;
esac
