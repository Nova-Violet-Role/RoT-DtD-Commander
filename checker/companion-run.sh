#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/companion-run.sh
# The one Bash form the Scratchpad Companion may run (LAW.COMPANION.1 and 2).
#
#   bash checker/companion-run.sh node <engine.mjs under lib/, checker/ or bin/> <reading verb | file> [args]
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
    # An engine is admitted by what it does, not by where it sits (nineteenth
    # companion pass: a directory test admitted spdx-add, subsets-sweep run
    # bare, seal-secret and the installer). Writers and publishers are
    # refused by name; a bare run is refused except for the engines that only
    # report when bare; otherwise the first argument is a verb from the
    # reading set, or an existing text file the engine judges; build only
    # with --check.
    # The engines the companion may run and the spellings each one reads by,
    # one line per engine (twentieth companion pass: a universal verb set let
    # `readme-index check` reach the writer, and two bare reporters planted
    # in the tree or ran the checker suite). FILE stands for an existing text
    # file the engine judges; BARE for a bare run; build only with --check.
    # counts-sweep, controls-sweep and contract-audit are refused by name:
    # their own controls plant files in the tree or spawn every other suite.
    name="$(basename "$abs")"
    rel="${abs#"$here"/}"
    case "$rel" in
      lib/ai-slop.mjs) verbs="controls table sweep FILE" ;;
      lib/encoding.mjs) verbs="controls sweep check" ;;
      lib/form.mjs) verbs="controls FILE" ;;
      lib/cache.mjs) verbs="controls load" ;;
      lib/list.mjs) verbs="controls reach files" ;;
      lib/cross-os.mjs) verbs="controls matrix" ;;
      lib/schematic.mjs) verbs="controls check" ;;
      lib/ordinals.mjs|lib/typography.mjs|lib/starlist.mjs|lib/geometry.mjs|lib/figure.mjs|lib/ceiling.mjs|lib/amplify.mjs|lib/chain.mjs|lib/license.mjs|lib/record.mjs|lib/task.mjs|lib/workflow.mjs|lib/args.mjs|lib/regression.mjs|lib/headings.mjs|lib/render-check.mjs|lib/dtd.mjs|lib/ledger.mjs|lib/sigil.mjs) verbs="controls" ;;
      checker/enum-sweep.mjs|checker/subsets-sweep.mjs|checker/plates.mjs|checker/glossary.mjs|checker/readme-index.mjs|checker/heading-sweep.mjs|checker/frontmatter-sweep.mjs|checker/badges.mjs|checker/about-sweep.mjs|checker/live-sweep.mjs) verbs="--check --controls" ;;
      checker/gate-sync.mjs|checker/engines-sweep.mjs) verbs="BARE" ;;
      checker/release-notes.mjs) verbs="--versions --controls" ;;
      checker/scala.mjs) verbs="list --controls" ;;
      checker/creators-audit.mjs|checker/pack-claude-ai.mjs) verbs="--controls" ;;
      bin/rot-dtd-commander.mjs) verbs="check list build" ;;
      bin/adiutor.mjs) verbs="doctor ledger suggest controls" ;;
      checker/counts-sweep.mjs|checker/controls-sweep.mjs|checker/contract-audit.mjs) refuse "$name plants in the tree or runs every other suite during its own controls" ;;
      *) refuse "$name is not an engine the companion may run (writer, publisher, or not in the table)" ;;
    esac
    verb="${1:-}"
    if [ -z "$verb" ]; then
      [ "$verbs" = "BARE" ] || refuse "$name run bare is not admitted; its reading spellings are: $verbs"
    elif [ -f "$verb" ]; then
      case " $verbs " in *" FILE "*) ;; *) refuse "$name does not judge a file; its reading spellings are: $verbs" ;; esac
      case "$verb" in
        *.md|*.nt|*.dtd|*.mjs|*.json|*.yml|*.svg|*.txt|*.cff|*.toml) ;;
        *) refuse "$verb is not a text file an engine judges" ;;
      esac
    else
      case " $verbs " in
        *" $verb "*) ;;
        *) refuse "$verb is not a reading spelling of $name; its reading spellings are: $verbs" ;;
      esac
      if [ "$verb" = "build" ]; then
        printf '%s\n' "$@" | grep -q -x -- '--check' || refuse "build writes; only build --check reads"
      fi
    fi
    exec node "$here/lib/ceiling.mjs" 60 node "$abs" "$@" < /dev/null
    ;;
  git)
    if [ "${1:-}" = "-C" ]; then shift 2 || refuse "git -C needs a directory"; fi
    verb="${1:-}"; shift || true
    case "$verb" in
      log|diff|show|status|ls-files|grep|rev-parse|check-ignore|blame|cat-file|describe|shortlog|rev-list|diff-tree|ls-tree|name-rev|show-ref|for-each-ref|count-objects|check-attr|var) ;;
      config)
        # config in its plainest form writes; only its readers are run
        case "${1:-}" in --get|--get-all|--get-regexp|--list|-l) ;; *) refuse "git config ${1:-} writes; only --get, --get-all, --get-regexp and --list read" ;; esac ;;
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
