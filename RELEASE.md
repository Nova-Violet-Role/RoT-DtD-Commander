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
