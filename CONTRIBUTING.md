<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Contributing to RoT DtD Commander

The organisation-wide rules in
[Nova-Violet-Role/.github/CONTRIBUTING.md](https://github.com/Nova-Violet-Role/.github/blob/main/CONTRIBUTING.md)
apply here in full. This file adds what is specific to this repository; it
relaxes nothing.

## The one rule

> **A claim that has not been measured does not ship.**

Every number in the README names the command that produced it. If you change
a number, you ran that command.

## The gate, first thing, every time

```sh
npm run gate; echo "exit=$?"
```

That runs, in order: `rdc build --check` (the committed resolved tree equals a
fresh resolve of `src/`), `rdc check` (rules C1 to C13 on every source), the
Adiutor controls (nine guards tripped on purpose), the contract audit (every
declaration used, every law numbered densely, with a planted control), the
checker controls (five mutations refused), and the SPDX and CRLF sweeps
(each with its own negative control). Read the exit code directly, never
through a pipe.

## Where the sources are

Edit under `src/`. Never edit `commands/`, `skills/` or `agents/` by hand:
they are build output, and `rdc build --check` will refuse the pull request.
After editing run `npm run build` and commit both.

## Adding a command

Use the `dtd-forge-dtd` skill, or by hand: write the grammar first (root,
children, cardinality, attributes, two to four laws under a new prefix), add
an entry to a spec module shaped like `dtd/new-commands-a.spec.mjs`, run
`rdc forge <spec> <name>`, then `npm run build` and `npm run gate`. A command
whose grammar carries IDREFs uses short ids (E1, T3, R2) so the Adiutor's
dangling-reference check at Stop can read them; in your pull request, quote
the ledger line of one run where you watched that check fail on purpose.

## Watch it fail

A check you have never seen fail is not evidence. `checker/checker-controls.sh`
and `node bin/adiutor.mjs controls` are the repository's own examples: each
mutation is asserted present, then the guard is expected to fire. A new guard
ships with a new control in the same pull request.

## Standards that are not negotiable

- UTF-8, LF, no BOM, in every file. `checker/crlf-sweep.sh` counts bytes with
  `tr`; a text-mode grep is not trusted on Windows.
- The SPDX header in every source file, after the YAML frontmatter in a
  command or skill (rule C1 needs the frontmatter on line 1).
- Entity values with no `&`, `%` or `<`; no `--` inside a DOCTYPE comment.
- Hooks read stdin to the end, spawn nothing, and exit promptly.
- Nothing under `~/.claude` is touched except through the installer's writer
  and the Adiutor's arm, which back up first.

## What gets a pull request sent back

- A resolved file edited by hand.
- A number in a document that was carried over instead of re-measured.
- A guard without a control, or a control whose mutation is not asserted
  present.
- A converted file that lost its MIT portions line (see `NOTICE.md`).
- "It works on my machine" without the exit code.

## Where to look first

`NOTICE.md` for provenance and the limits of what is checked;
`skills/dtd-core-dtd/references/checker-rules.md` for the thirteen rules and
their fixes; `dtd/adiutor.dtd` for the Adiutor's contract.
