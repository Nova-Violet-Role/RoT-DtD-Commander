# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
# The Adiutor end to end in a scratch state directory: a /pareto-dtd prompt
# opens a run, a Stop with a complete answer closes it as pass, a second run
# with a broken answer closes as fail, then the ledger and the prescription.
# The transcripts are the two committed demo files beside this tape.
Output docs/gifs/doctor.gif
Set Shell "bash"
Set FontSize 13
Set Width 1100
Set Height 640
Set Padding 12
Set TypingSpeed 30ms
Set Theme "Catppuccin Mocha"

Hide
Type "export ROT_DTD_STATE=docs/tapes/demo-state; rm -rf $ROT_DTD_STATE; clear"
Enter
Show

Type `echo '{"session_id":"demo","cwd":"'$PWD'","prompt":"<command-name>/pareto-dtd</command-name>"}' | node bin/adiutor.mjs observe UserPromptSubmit`
Enter
Sleep 2s
Type `echo '{"session_id":"demo","transcript_path":"docs/tapes/demo-transcript.jsonl","stop_hook_active":false}' | node bin/adiutor.mjs observe Stop`
Enter
Sleep 1.5s
Type `echo '{"session_id":"demo","cwd":"'$PWD'","prompt":"<command-name>/pareto-dtd</command-name>"}' | node bin/adiutor.mjs observe UserPromptSubmit`
Enter
Sleep 1.5s
Type `echo '{"session_id":"demo","transcript_path":"docs/tapes/demo-transcript-broken.jsonl","stop_hook_active":false}' | node bin/adiutor.mjs observe Stop`
Enter
Sleep 2.5s
Type "node bin/adiutor.mjs ledger --last 5"
Enter
Sleep 3s
Type "node bin/adiutor.mjs suggest"
Enter
Sleep 4s

Hide
Type "rm -rf $ROT_DTD_STATE; clear"
Enter
Show
Sleep 500ms
