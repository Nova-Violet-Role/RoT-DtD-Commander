#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/tracked-sweep.sh
# Every build target under the resolved trees (commands/, skills/, agents/)
# must be tracked: a target that an ignore rule catches is present on the
# machine that built it and absent from the committed tree, so the build
# drift check passes here and fails on a fresh checkout (measured on the
# first CI run of 5.0.0: agents/dtd-command-inventory.md fell under
# `agents/*`). Counts the ignored files under the three trees and refuses
# any. Ends with its own control: a planted ignored file must be reported.
set -u
cd "$(dirname "$0")/.." || exit 2

ignored() { git status --ignored -s -- commands skills agents | grep '^!!' || true; }

bad="$(ignored)"
n=$(printf '%s' "$bad" | grep -c '^!!' || true)
[ -n "$bad" ] && printf '%s\n' "$bad"

# control: a planted file the rules ignore is reported, then removed
plant="agents/zz-tracked-sweep-control.md"
printf '# planted by checker/tracked-sweep.sh; if you see this, a control did not clean up\n' > "$plant"
git check-ignore -q "$plant" || { echo "tracked-sweep: landed proof failed, the planted file is not ignored"; rm -f "$plant"; exit 1; }
seen=$(ignored | grep -c "$plant" || true)
rm -f "$plant"
[ "$seen" -eq 1 ] && echo "  PASS control: a planted ignored file under agents/ is reported" || { echo "  FAIL control: the planted ignored file was not reported"; exit 1; }

echo "tracked-sweep: $n ignored build targets under commands, skills, agents"
[ "$n" -eq 0 ]
