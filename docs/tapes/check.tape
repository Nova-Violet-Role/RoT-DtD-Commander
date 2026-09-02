# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
# The checker over the whole tree, with xmlstarlet on the six examples, then
# the checker refusing three mutations on purpose.
Output docs/gifs/check.gif
Set Shell "bash"
Set FontSize 13
Set Width 1100
Set Height 640
Set Padding 12
Set TypingSpeed 35ms
Set Theme "Catppuccin Mocha"

Type "node bin/rot-dtd-commander.mjs check --xml | grep -E 'xml  valid|^checked'"
Enter
Sleep 6s
Type "clear"
Enter
Type "bash checker/checker-controls.sh"
Enter
Sleep 7s
