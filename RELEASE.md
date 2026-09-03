<!--
    This file is part of RoT DtD Commander.
    SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
    Copyright 2026 Saimonokuma.
-->

<div align="center">

# 🜏 RoT DtD Commander — Releases

**Commands that carry their own grammar, and a doctor that reads it**

[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/saimonokuma)
[![Nova-Violet Role](https://img.shields.io/badge/Nova--Violet-Role-9b59b6?style=for-the-badge)](https://github.com/Nova-Violet-Role)
[![License](https://img.shields.io/badge/License-AGPL--3.0_OR_EUPL--1.2-764ba2?style=for-the-badge)](LICENSE)

</div>

---

## v5.1.0 — the gate on every spot, and the scratch

An armed Adiutor now judges every answer, file, commit message and request
body by the AI_SLOP contract before it lands (LAW.SLOP.7, LAW.SLOP.8):
strict, one ledger line per refusal, the escape a fence or a quoted element,
controls C21 to C26 tripped on purpose. `/ai-slop-dtd` is the hand-run form.
`/deep-scratch-dtd` researches a change, builds it in a git worktree under
`.claude/worktrees`, reviews the diff hunk by hunk, amplifies the research
with what the build measured, and asks at a merge gate, with the pros and
cons per file, what may land; `lib/scratch.mjs` carries the worktree, the
diff and the merges with seven controls. Every number is in
[CHANGELOG.md](CHANGELOG.md). The tag is `v5.1.0`.

## v5.0.1 — the privacy policy and the command index

`PRIVACY.md` says what the software reads, writes and sends on your machine,
component by component and measured, what leaves it and to whom, what the
organisation holds and for how long, and the rights with their two structural
limits. The README index is generated from the tree by
`checker/readme-index.mjs`: a map of the twelve families, a badge per family,
a collapsible table each, the skills and the agents; the gate refuses a README
that disagrees with the files, and a version-agreement check refuses a tag
whose version the manifests, the changelog and this file do not share. Every
number is in [CHANGELOG.md](CHANGELOG.md). The tag is `v5.0.1`.

## v5.0.0 — the creator kit

Sixteen prompt and meta-prompt creators over eight schematics, creators for
skills, hooks, commands, subagents, plans, MCP servers and workflow files, a
tasks family, filetype and dork creators, nineteen book-derived commands with
their voice profiles, records that nest, an Adiutor that runs only by hand,
and every count re-measured: 118 commands, 22 skills, 5 agents. Nine
companion runs audited the work, and CI ships the release from the tag. Every
number is in [CHANGELOG.md](CHANGELOG.md). The tag is `v5.0.0`.

## v4.0.0 — the Commander-Adiutor

The Adiutor's monitor, a separate process beside the hooks:
`monitors/commander-adiutor.mjs` tails the ledger and hands every `-dtd`
answer that failed its own grammar to the session as the run closes, one
line each, nothing for a pass, in the words `dtd/adiutor.dtd` declares.
Declared in `monitors/monitors.json` for the plugin path; on the npx path
`rdc install` writes a skills-directory plugin Claude Code loads by itself,
and `rdc uninstall` removes it. Control C12 trips the monitor live; the
doctor gained a `monitor` row; `rdc watch` runs it by hand. Every number is
in [CHANGELOG.md](CHANGELOG.md). The tag is `v4.0.0`.

## v3.2.0 — the lens commands render clean

The SPDX header showed as text on GitHub in the ten `rot-*-dtd.md` files:
line 1 of `dtd/cc-rot.dtd` had a stray prefix before `<!--`, left by an
earlier patch, so the inlined comment never opened as an HTML comment block.
One line restored, ten files rebuilt, verified with GitHub's own rendering.
Every number is in [CHANGELOG.md](CHANGELOG.md). The tag is `v3.2.0`.

## v3.1.0 — the front matter parses

GitHub showed `Error in user YAML ... at line 1 column 32` on
`pareto-dtd.md`: a bare `: ` inside the description. An independent parser
found the same shape in 32 sources; all are quoted, rule C14 refuses the
shape from now on (mutation M6 proves it), and `rdc forge` writes quoted
values. Every number is in [CHANGELOG.md](CHANGELOG.md). The tag is
`v3.1.0`.

## v3.0.0 — every answer in one shape

A full audit of the 68 commands: every heading an answer carries is now a
markdown heading with the command's own sigil and a blank line on each side
(`LAW.CORE.6`, checker rule C13, the Adiutor's `spacing` finding), so no
answer runs together and every command is recognisable at a glance. The nine
lens commands carry their lens emoji where the lens speaks: the stanza, the
bound, the gauge term, the roll-call. `dtd/sigils.json` declares the 75
sigils once; `checker/heading-sweep.mjs` proves the tree is in shape with
its own planted control. Two live turns through the armed hooks closed as
`pass` in the ledger (`/pareto-dtd`, `/rot-chroma-dtd --no-gate`), and the
first failing ones fixed the Stop check for good: the answer of a run is
every assistant text after the command prompt, not the last block. The
marketplace round-trip was measured too, and `rdc prune-plugin` removes the
cache the plugin CLI leaves behind. Every number is in
[CHANGELOG.md](CHANGELOG.md) beside the command that measured it. Install
and verify exactly as below; the tag is `v3.0.0`.

## v2.0.0 — the nine lenses, at full power

Ten commands carry the RoT MoE lenses as declared grammar: nine lenses, each
with its own four questions and one mid-run gate, and `/rot-elevate-dtd`,
which summons all nine with 36 questions in nine rounds. A fifth subset,
`cc-rot.dtd`, declares the lenses, the lanes, the NSIL decisions, the bands,
the bounds, the experts, the interceptors, the TIER 1 stems, the ten weight
profiles, the PRISM gauge, the C_i scale and the hybrid law once, from RoT
MoE v10.0.2. No static instance is committed; the contract audit is a script
with its own control and the Adiutor judges every rendered answer. Every
number is in [CHANGELOG.md](CHANGELOG.md) beside the command that measured
it. Install and verify exactly as below; the tag is `v2.0.0`.

## v1.0.0 — the whole thing, shipped once

There is no pre-release and no patch tier: 1.0.0 is the first tag, and it was
cut only after every claim in the README had a command behind it.

**Install**

```sh
npx github:Nova-Violet-Role/RoT-DtD-Commander install
```

or, as a plugin, from inside Claude Code:

```
/plugin marketplace add Nova-Violet-Role/RoT-DtD-Commander
/plugin install rot-dtd-commander@rot-dtd-commander
```

**What is in it** is listed in [CHANGELOG.md](CHANGELOG.md) with the command
that measured each line.

**Verify it** before you trust it:

```sh
git clone https://github.com/Nova-Violet-Role/RoT-DtD-Commander
cd RoT-DtD-Commander
npm run gate; echo "exit=$?"
```

`gate` runs the build drift check, the checker with XML validation, the eight
Adiutor controls and the two sweeps; the last line of each names its counts.
Then break something on purpose: `bash checker/checker-controls.sh` shows the
checker and the validator refusing three mutations and one broken instance.

**Attached to the release**: the source archive GitHub generates, and the
`npm pack` tarball (`rot-dtd-commander-1.0.0.tgz`), which installs with
`npx ./rot-dtd-commander-1.0.0.tgz install`.

---

<div align="center">

*Reality is the judge.*

</div>
