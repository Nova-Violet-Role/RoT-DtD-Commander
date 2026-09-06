# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/portable.sh : sourced by every shell checker of the gate.
# One function. ceil <seconds> <command...> is GNU timeout where the runner has
# it and node lib/ceiling.mjs where it does not (the macOS runner ships none),
# and it exits 124 either way when the ceiling fires (LAW.XOS.5). Set
# XOS_CEIL=node to force the Node path, which is how the control proves the
# second path fires and not only the first.
#
#   . "$here/checker/portable.sh"
#   ceil 60 node bin/rot-dtd-commander.mjs check "$f" < /dev/null
ceil() {
  if [ "${XOS_CEIL:-}" = "node" ] || ! command -v timeout >/dev/null 2>&1; then
    node "${PORTABLE_ROOT:-.}/lib/ceiling.mjs" "$@"
  else
    timeout "$@"
  fi
}
