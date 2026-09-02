# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
# The guided installer, end to end, into a scratch target. This tape is also
# the only test of the TTY prompts: a tape that fails to render is a failed test.
Output docs/gifs/install.gif
Set Shell "bash"
Set FontSize 13
Set Width 1100
Set Height 640
Set Padding 12
Set TypingSpeed 35ms
Set Theme "Catppuccin Mocha"

Hide
Type "rm -rf docs/tapes/demo-claude; clear"
Enter
Show

Type "node bin/rot-dtd-commander.mjs install --guided"
Enter
Sleep 1.5s
Type "3"
Enter
Sleep 800ms
Type "docs/tapes/demo-claude"
Enter
Sleep 800ms
Enter
Sleep 2s
Type "y"
Enter
Sleep 5s

Hide
Type "rm -rf docs/tapes/demo-claude; clear"
Enter
Show
Sleep 500ms
