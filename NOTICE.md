<!--
    This file is part of RoT DtD Commander.
    SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
    Copyright 2026 Saimonokuma.
-->

# NOTICE — provenance, licensing, and the limits of what is checked

## A. Licensing

**RoT DtD Commander is an original work with declared portions.** It is not a
fork: the repository history begins here; the installer, the twelve shared
subsets, the Adiutor and its monitor, the nineteen book-derived commands and
their router, the power-up commands, the creator kit of 5.0.0, the twelve
original skills and the five agents were written for this repository.
Thirty-four files, listed in section B, keep prose from an MIT upstream
inside a new declared grammar (forty-four did, until 5.0.0 rewrote ten of
them). That fact decides the licence layout.

| file | what it is | why |
|---|---|---|
| `LICENSE` | verbatim AGPL-3.0 text | GitHub's `licensee` reads the **root `LICENSE` file only**; this organisation measured that against its own repositories. Putting AGPL-3.0 at the root is what makes the repository detect as AGPL-3.0 instead of as nothing. |
| `LICENSE-EUPL-1.2` | verbatim EUPL-1.2 text | the second half of the grant, in the place a human looks |
| `LICENSE-MIT-taches-cc-resources` | the upstream MIT text and its copyright line | MIT requires its notice to travel with the portions it covers |
| `LICENSES/AGPL-3.0-or-later.txt`, `LICENSES/EUPL-1.2.txt`, `LICENSES/MIT.txt` | the three texts | the [REUSE](https://reuse.software/) layout, for tooling |

**The grant is `AGPL-3.0-or-later OR EUPL-1.2`, at the recipient's option**, and
it covers every file in this repository. Every source file carries the SPDX tag
and `Copyright 2026 Saimonokuma.` in its own header, enforced by
`checker/spdx-sweep.sh`, which ends with its own negative control. The files in
section B additionally carry
`Portions Copyright 2025 Lex Christopherson, MIT (taches-cc-resources); see NOTICE.md.`

Both texts were fetched from GitHub's licence API at build time
(`gh api licenses/agpl-3.0`, 34523 bytes; `gh api licenses/eupl-1.2`, 13747
bytes) and are byte-identical to the copies under `LICENSES/`.

### A.1 How this differs from the organisation's other repositories

`Nova-Violet-Role/RoT-MoE` is an original work with no declared portions.
`Nova-Violet-Role/claude-rolling-context-Lean-4-` is explicitly a fork whose
root `LICENSE` stays MIT because a fork may not relicense what it inherited.
This repository is the third case: original at the root, with MIT-licensed
prose retained inside files that were rewritten around it. MIT permits that
combination as long as its notice is kept, and it is kept in three places
(the root licence file, `LICENSES/MIT.txt`, and the header of every affected
file).

## B. Declared portions

The upstream is `taches-cc-resources` by Lex Christopherson (MIT, first
commits 2025-11-13). Its original command, skill and agent files are **not**
in this repository. The following files were produced by `rdc forge` from
`dtd/forge-spec.json`: the upstream prose of the objective, process, output
template and success criteria is retained; the frontmatter description, the
DOCTYPE, the trust boundary, the grammar map and the added success criteria
are new.

Commands (24): `5-whys-dtd`, `10-10-10-dtd`, `add-to-todos-dtd`,
`check-todos-dtd`, `competitive-dtd`, `debug-dtd`, `eisenhower-matrix-dtd`,
`feasibility-dtd`, `heal-skill-dtd`, `history-dtd`, `inversion-dtd`,
`landscape-dtd`, `occams-razor-dtd`, `one-thing-dtd`, `open-source-dtd`,
`opportunity-cost-dtd`, `options-dtd`, `pareto-dtd`, `run-plan-dtd`,
`setup-ralph-dtd`, `swot-dtd`, `technical-dtd`, `via-negativa-dtd`,
`whats-next-dtd`. Nine more carried the upstream prose until 5.0.0 rewrote
them from scratch as creators and auditors (`create-agent-skill-dtd`,
`create-hook-dtd`, `create-meta-prompt-dtd`, `create-plan-dtd`,
`create-slash-command-dtd`, `create-subagent-dtd`, `audit-skill-dtd`,
`audit-slash-command-dtd`, `audit-subagent-dtd`); they carry the portions
line no more. This list is measured: it is the set of files under `src/`
whose header carries that line, and the count is the grep's.

Skills (10, whole directories): `create-agent-skills-dtd`, `create-hooks-dtd`,
`create-mcp-servers-dtd`, `create-meta-prompts-dtd`, `create-plans-dtd`,
`create-slash-commands-dtd`, `create-subagents-dtd`, `debug-like-expert-dtd`,
`run-prompt-dtd`, `setup-ralph-dtd` (`create-prompt-dtd` was the eleventh
until 5.0.0 replaced it with the schematic router; nothing of the upstream
remains in it). In each, the
supporting files under `references/`, `templates/`, `workflows/` and similar
are the upstream's text unchanged apart from the SPDX header and line endings.

The three reference notes under `skills/dtd-core-dtd/references/`
(`context-handoff.md`, `meta-prompting.md`, `todo-management.md`) are the
upstream's design notes, retained under the same terms.

Everything else is original: `bin/`, `lib/`, `dtd/`, `checker/`, `monitors/`,
the power-up commands (`first-principles-dtd`, `second-order-dtd`,
`ask-me-questions-dtd` and its two variants, `deep-dive-dtd`, whose prose was
rewritten around the AskUserQuestion grammar), the nineteen book-derived
commands and `phantom-dtd`, the nine lens commands and ELEVATE, the creator
kit of 5.0.0 (the sixteen prompt and meta-prompt creators, the seven artifact
creators, the tasks family, the eight filetype creators and their router, the
two dork creators, the coin flips, the repository commands),
`RoT-DtD-Commander-Adiutor`, the twelve original skills, the five agents, and
every document at the repository root.

### B.1 The lens material (2.0.0)

The ten `/rot-*-dtd` commands, `dtd/cc-rot.dtd` and the `rot-lenses-dtd`
skill transcribe the mechanisms and the measured defaults of the nine lens
charters of this organisation's own RoT MoE packet (v10.0.2, `agents/rot-*.md` and `engine/rot-lean.md`, read from the repository with `gh`;
AGPL-3.0-or-later OR EUPL-1.2, same author). The numbers (lambda, mu, the
entropy and gauge bands, the twelve timelines, the three recursion levels,
the 0.95 strike threshold, the hybrid law) are the charters' own, re-typed
once into `cc-rot.dtd` and bound to the skill's reference by the contract
audit. No Latin seal or parameter the charters do not carry was invented. The
charters' persona prose is not reproduced; the commands carry grammar and
process in this repository's own words.

## C. What was left out, and why

- The corpus of encyclopedia article copies that inspired the nineteen
  book-derived commands is CC BY-SA and is not published here. The shelf notes
  in `skills/phantom-library-dtd/references/books.md` are original summaries.
- A folder of third-party example DTDs (Apache Software Foundation, GNOME, IETF
  RFC, Erlang) that served as reading material is not published here. The two
  DTDs of this organisation's own plugins that this layer descends from live in
  their own repositories (`RoT-MoE`, `RoT-DTD-GOAL`).
- Two private notes on DTD usage stay in the maintainer's local folder.

## D. The limits of what is checked

This repository makes measurable claims and each one names its instrument;
the same discipline applies to what the instruments do **not** cover.

- The checker (`rdc check`, rules C1 to C15) proves that a file's DOCTYPE and
  its prose agree: every declared element is named, every named channel is
  fenced, no entity is unresolved, the dialect validates, and every heading of the answer template carries the command's sigil with a blank line on each side (C13). It does not prove
  that a model will obey the grammar: that is measured per run by the
  Adiutor's Stop check, when armed or run by hand, and per build phase by the
  Scratchpad Companion (`checker/companion-audit.sh`), a second session run
  in the foreground that reads the diff and the tree and answers in a
  declared grammar, scored on its finding elements and never on its prose.
  The ai-slop sweep holds every source's voice to a declared bound; it does
  not judge whether the prose is true.
- The AI_SLOP gate as a hook (5.1.0) judges the voice of an answer, a file, a
  commit message or a request body by the declared measures; it does not
  judge whether they are true, a phrase inside a fence or a quoted element is
  data it never sees, and the comment lifter reads a declared table of
  extensions, so a language outside the table has nothing judged. A lifted
  comment block answers to the phrase and verb measures only, not to the two
  prose-shape ones: measured on accesskit-0.24.1/src/geometry.rs, whose
  hand-written doc comments fail the lexical bound at 0.5233 because a geometry
  module repeats its own nouns. The gate reports both numbers and marks them as
  not applying, so nothing is hidden, but a repetitive comment block is not
  called slop for being repetitive.
- `checker/contract-audit.mjs` proves that every element, entity and
  parameter entity declared in the twelve shared subsets and the Adiutor
  contract is used by at least
  one source and that every law prefix is numbered densely; its own control
  plants an unused declaration and requires it to be reported. No static
  example instance is committed (2.0.0 removed them and the `xmlstarlet`
  step): the instrument for a rendered answer is the Adiutor's Stop check,
  which reads headings, their order, their spacing and dangling short ids.
- The Adiutor's Stop check judges the **rendered markdown** of an answer: the
  presence and order of the headings the grammar map declares, the presence of
  an assumptions section on an autonomous run, and that every short id an
  answer references was defined in it. It does not judge whether the content
  under a heading is true. A passing run means the answer had the declared
  shape, nothing more, and the ledger says exactly that. Since 5.0.0 it runs
  only when armed with `--arm` or run by hand (`rdc doctor`, `rdc controls`),
  each under a 300 second ceiling, so a session with a plain install is not
  checked at all until it asks to be.
- `rdc build --check` proves the committed resolved tree equals a fresh
  resolve of `src/` at the commit it ran on, not at every commit; the workflow
  runs it on every push and pull request, and `checker/tracked-sweep.sh`
  refuses a build target an ignore rule catches, the one way the check can
  pass on the machine that built it and fail on a fresh checkout (measured
  on the first CI run of 5.0.0).
- The guided installer's prompts are exercised by `docs/tapes/install.tape`,
  which is also the source of the README's GIF. On this maintainer's machine
  `vhs` stalls before spawning `ttyd`, so the GIFs were rendered by
  `docs/tapes/render.mjs`, which runs the same tape's commands for real with
  the typed answers on stdin (`rdc install --guided`) and draws the captured
  output with `ffmpeg`. What the GIF shows is real output; what it does not
  show is a pseudo-terminal, so a prompt that misbehaves only under a real TTY
  is outside this test here; the `tapes` workflow renders every tape with
  the real `vhs` on Ubuntu on each push that touches them and keeps the
  result as a workflow artifact, so that case is covered there.

## E. Standing on other people's work

- Lex Christopherson, `taches-cc-resources` (MIT): the thinking-model,
  research and workflow commands and the ten skills this layer still carries
  (an eleventh, `create-prompt`, was replaced in 5.0.0).
- The `vhs` and `ttyd` authors: the tape renderer behind the gallery.
- This organisation's own `RoT-MoE` and `RoT-DTD-GOAL`, whose contract DTDs
  and both-direction checkers are the ancestors of `cc-core.dtd` and the
  Adiutor.
