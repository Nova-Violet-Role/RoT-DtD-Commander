# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
# A lens command under two instruments: the checker holding the ten lens
# commands to their own DOCTYPE (the engine subset inlined), and the Adiutor
# arming for /rot-chroma-dtd from that DOCTYPE, naming the headings the
# answer must carry.
Output docs/gifs/lens.gif
Set Shell "bash"
Set FontSize 13
Set Width 1100
Set Height 640
Set Padding 12
Set TypingSpeed 30ms
Set Theme "Catppuccin Mocha"

Type "node bin/rot-dtd-commander.mjs check src/commands/rot-*-dtd.md"
Enter
Sleep 5s
Type "clear"
Enter
Type "grep -c 'begin subset cc-rot' commands/rot-chroma-dtd.md; grep -o 'LAW.ROT.[0-9]' commands/rot-elevate-dtd.md | sort -u | tr '\n' ' '; echo"
Enter
Sleep 4s
Type "clear"
Enter
Hide
Type "export ROT_DTD_STATE=docs/tapes/demo-state; rm -rf $ROT_DTD_STATE; mkdir -p docs/tapes/demo-cwd/.claude/commands; cp commands/rot-chroma-dtd.md docs/tapes/demo-cwd/.claude/commands/"
Enter
Show
Type `echo '{"session_id":"lens","cwd":"'$PWD'/docs/tapes/demo-cwd","prompt":"<command-name>/rot-chroma-dtd</command-name> should we keep committing the generated tree"}' | node bin/adiutor.mjs observe UserPromptSubmit`
Enter
Sleep 6s
Hide
Type "rm -rf $ROT_DTD_STATE docs/tapes/demo-cwd; clear"
Enter
Show
Sleep 500ms
