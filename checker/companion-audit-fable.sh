#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/companion-audit-fable.sh : the fable leg of the three-way split.
#
# Shared body, per-model scope declared in checker/companion-audit.dtd
# (answer 39 CompanionSplit): this script fixes scope=fable
# (src/skills, src/agents, docs, records) and a default model of its name,
# then execs the shared body, which refuses any scope the DTD does not
# declare (LAW.COMPANION.9). Usage matches the body:
#   bash checker/companion-audit-fable.sh <phase> <range> [out] [model] [turns] [secs] [focus]
set -u
here="$(cd "$(dirname "$0")/.." && pwd)"
export COMPANION_SCOPE="${COMPANION_SCOPE:-fable}"
if [ $# -lt 4 ]; then
  while [ $# -lt 3 ]; do set -- "$@" ""; done
  set -- "$@" "fable"
fi
exec bash "$here/checker/companion-audit.sh" "$@"
