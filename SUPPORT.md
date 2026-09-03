<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Support

There is no support contract and no queue; there is a small number of people
who care a lot about these tools being correct. The organisation's
[SUPPORT.md](https://github.com/Nova-Violet-Role/.github/blob/main/SUPPORT.md)
says how to reach the right one fastest. For this repository:

| You have | Go to |
|:--|:--|
| A question about a command, a skill or the installer | the **Q&A** discussion |
| A number in the README or NOTICE that does not re-run | Issues, *A claim in our docs is false* |
| A `-dtd` answer the Adiutor passed but should not have, or failed but should not have | Issues, *Something is broken*, with the ledger line |
| A security finding | **not an issue**: see [SECURITY.md](SECURITY.md) |
| A question about your data, or a request to correct or remove it | [PRIVACY.md](PRIVACY.md): an email or a private advisory, answered within a month |
| A new command or a new book to draw from | the **Ideas** discussion |

## What makes a report answerable

- the exact command and its **exit code**, read directly
- `rdc doctor` output, if the installer or the Adiutor is involved
- the ledger line (`rdc ledger --last 1`), if a run is involved
- OS and Node version, and the commit hash or the tag

"It doesn't work" costs a round trip. Everything above saves one.
