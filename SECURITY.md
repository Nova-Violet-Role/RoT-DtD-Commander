<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Security Policy

## What this software does to your machine

`rdc install` **writes files under `~/.claude`** (or `./.claude` with
`--project`) and **edits `~/.claude/settings.json`** to arm the Adiutor hooks.
That is the whole security surface, and it is stated first because it is the
thing worth auditing before you run anything here.

The contract, and how each part is verified rather than promised:

| rule | verified by |
|---|---|
| the capability statement is printed before anything is armed | `bin/rot-dtd-commander.mjs` prints it before the confirm prompt and before a `--yes` install writes |
| `settings.json` is backed up first and the restore command printed | `lib/arm.mjs` `armSettings`; the path is in the install output |
| a read-only attribute on `settings.json` is lifted for the one write and put back, and the install output says so | `lib/arm.mjs` `isReadOnly`; measured on this maintainer's machine, where the file carries `attrib +R` |
| additive merge only: parse, append, write back; never a template rewrite | Adiutor control C6 |
| every key not added by the Adiutor is preserved, deep-compared after re-reading from disk; the backup is restored on any deviation | control C6 (a foreign nested key survives arm and disarm) |
| idempotent by command string | control C6 (a second arm adds nothing; exactly one copy per event) |
| `disarm` removes only entries carrying the Adiutor marker | control C6 |
| installed files are recorded in a manifest with their sha256; `uninstall` removes only those, and keeps any the user edited | the `install-roundtrip` job in `.github/workflows/gate.yml`: a scratch target ends at zero files |
| `uninstall` removes a `settings.json` only if this tool created it and it is empty after the disarm, and removes only the backups this tool named | same job; the disarm is verified by re-reading the file before anything is removed |
| every written text file is re-read and verified: UTF-8, LF, no BOM | the installer's writer, `verifyFile` |
| a hook reads stdin to the end, spawns no process, writes only under its state directory, and exits 0 | `bin/adiutor.mjs observe`; LAW.ADIUTOR.4 |
| the Stop hook blocks at most once per run, and only under `ROT_DTD_ADIUTOR=strict` | control C3 |
| a slash command opens a run only if its installed file carries a DOCTYPE | control C8 |

It does **not** phone home, download anything, execute code from the network,
or read any file outside `~/.claude`, the current project's `.claude`, the
transcript path Claude Code hands the hook, and the repository itself.

## Text the hooks treat as data

The transcript, the tool responses and the ledger are read as data. A line in
an answer that reads like an instruction to the Adiutor is checked like any
other line. The command files declare the same boundary for the model in their
`trust_boundary`.

## Reporting a vulnerability

Gate evasion (a way to make a failing answer pass the Stop check), ledger
forgery, a fence escape in a `-dtd` command, or anything that makes the
installer write outside its target: **do not open a public issue.** Use the
repository's private advisory form (Security tab, "Report a vulnerability").
The organisation's [SECURITY.md](https://github.com/Nova-Violet-Role/.github/blob/main/SECURITY.md)
describes what happens next.
