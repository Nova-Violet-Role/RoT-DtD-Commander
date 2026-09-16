#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/companion-audit-sonnet.sh : the sonnet leg of the three-way split.
#
# Shared body, per-model scope declared in checker/companion-audit.dtd
# (answer 39 CompanionSplit): this script fixes scope=sonnet
# (src/commands, the 143 commands) and a default model of its name, then
# execs the shared body, which refuses any scope the DTD does not declare
# (LAW.COMPANION.9). Usage matches the body:
#   bash checker/companion-audit-sonnet.sh <phase> <range> [out] [model] [turns] [secs] [focus]
set -u
here="$(cd "$(dirname "$0")/.." && pwd)"
export COMPANION_SCOPE="${COMPANION_SCOPE:-sonnet}"
if [ $# -lt 4 ]; then
  while [ $# -lt 3 ]; do set -- "$@" ""; done
  set -- "$@" "sonnet"
fi
exec bash "$here/checker/companion-audit.sh" "$@"
