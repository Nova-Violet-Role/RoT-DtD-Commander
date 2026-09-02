# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
# The advisor half: eight guards tripped on purpose. C1 is an answer missing a
# required heading; C3 is the strict policy blocking a Stop once with the
# prescription as the reason, then letting the second Stop through.
Output docs/gifs/adiutor-fail.gif
Set Shell "bash"
Set FontSize 13
Set Width 1100
Set Height 640
Set Padding 12
Set TypingSpeed 35ms
Set Theme "Catppuccin Mocha"

Type "node bin/adiutor.mjs controls"
Enter
Sleep 7s
