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
