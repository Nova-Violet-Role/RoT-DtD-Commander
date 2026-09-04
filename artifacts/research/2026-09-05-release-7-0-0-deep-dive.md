<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep dive: building, auditing, installing and releasing 7.0.0

Written 2026-09-05, in the session that cut the tag. Every number below was
read from a command run in that session; nothing here is remembered.

## Strategic summary

The twenty-seven-pass companion audit found its last three high findings in
its own instrument, and the release still shipped with two real defects that
no local run could have shown. CI on Linux caught both, because this machine
has all six package managers installed and Linux has none. The lesson of the
release is not that the audit was too long, but that it was measuring one
machine.

## Key questions

- What was left between pass 27 and a tag, and was any of it a real defect?
- Why did a gate that exits 0 locally fail twice on CI?
- What did the twenty-seven passes actually buy, and where did they stop
  paying?
- What should the next release do differently?

## Overview

7.0.0 is the list family: eight commands that declare what a project may
contain (`file-whitelist`, `file-blacklist`, `file-graylist`,
`code-whitelist`, `code-blacklist`, `code-graylist`) and two that bound them
by what the machine can reach (`starlist`, `starlist-manager`). The grammar
lives in `dtd/cc-list.dtd` and `dtd/cc-starlist.dtd`; the entries live in
`.rot-lists/`, apart from the grammar that reads them, which is the `.ent`
and `.mod` split the DITA corpus uses.

The release also carries `LAW.CORE.8`, which puts the gray ask into every
`-dtd` command through the subset they all include, and enforces it in
`bin/adiutor.mjs` at PreToolUse rather than trusting the prose to be obeyed.

Between `v6.0.0` and the tag there are 35 commits, 27 of them closing a
companion audit pass. Two checker rules came out of those passes, C15 and
C16, each tripped on purpose and restored.

## How it works

The build resolves `src/` into `commands/`, `skills/` and `agents/` by
inlining each shared subset into the DOCTYPE, marked with
`<!-- begin subset X -->` and `<!-- end subset X -->`. That inlining is why
the law-density check had to move: a command declares `LAW.AMPLIFY.4` to `6`
while `dtd/amplify-codebase.dtd` declares `1` to `3`, and only the built
document holds the whole prefix. (measured: `commands/amplify-codebase-dtd.md`
contains six `LAW.AMPLIFY` declarations; `src/commands/amplify-codebase-dtd.md`
contains three.)

`checker/contract-audit.mjs` asks the contract in both directions: every
declaration in `dtd/*.dtd` is used by some source, and every `LAW.*` prefix is
numbered densely. Before this release the density arm kept one `Set` per
prefix and unioned every file in the tree into it, so a number missing from
one document was supplied by another document declaring it. (measured: with
that arm keyed per built document, removing `LAW.AUDIT.4` from
`agents/subagent-auditor-dtd.md` reports
`GAP LAW.AUDIT in ...: 4 declared, highest 5`; restoring it returns
`1434 declarations, 0 unused, 0 law gaps`.)

`lib/starlist.mjs` treats each package manager as a declaration, not a
branch: `STAR.mgr.<name>` carries binary, search subcommand, install
subcommand and ceiling. A search subcommand of `-` means the manager installs
but cannot search a registry, which is true of `bun` and `uv`. (measured:
`bun pm ls ripgrep` exits 1 and `uv pip list ripgrep` exits 2, from pass 14.)

Presence is a measurement, not an assumption. `have()` resolves the binary
through `where` or `which`, preferring an extension the platform can actually
spawn, because Node cannot spawn a `.cmd` without a shell at all — its
mitigation for CVE-2024-27980 — and every manager on Windows is a shim.
(measured: six of six managers report present on this machine through the
real spawn.)

## History and context

The shape was borrowed rather than invented. A hundred and fifty DTDs in
`cc-resources/.dtd-file-examples` (1,660,566 bytes) were read in full before
any of the list family was written. DITA narrows a grammar by redeclaring a
parameter entity before the base module loads, which is what a blacklist is;
`subjectScheme` binds an attribute's legal values to a taxonomy held outside
the grammar, which is what a whitelist is.

The companion audit ran 27 passes against `v6.0.0..HEAD`. Its high-finding
series was:

    6 4 4 1 3 1 1 4 3 2 2 3 3 3 1 1 2 4 1 2 2 3 3 3 3 4 3

The series never converges, and the reason is visible in the findings
themselves rather than in the numbers. Through roughly pass 14 the auditor
was finding defects that predated the audit: two live command injections on
the manager path (pass 5 and pass 7, both proven by running
`zzznosuch & echo ROT_INJECTION_MARKER` and getting the marker back as a
hit), a `have()` that returned true for every name on Windows (pass 12), a
raw `0x05` byte in a shipped skill (pass 15). From about pass 20 the source
shifted: pass 23 found that pass 22's fix had made the Stop gate fail open
for 15 of 131 commands, pass 25 found three survivors of pass 24's rule-range
edit, pass 26 found six laws that governed nothing, pass 27 found the drift
left by pass 26's own `C14` to `C16` sweep. The loop had become
self-generating.

## Patterns and best practices

- **A control that cannot fail proves nothing.** Every rule added in this
  release was tripped on purpose and restored: C15 by dropping a
  `grammar_map` row (`294 written, 1 failing`), C16 by redeclaring an entity
  after its subset, the density arm by planting a prefix that skips a number.
- **The seam must be complete.** `have()` accepted an injected runner but
  still consulted the real filesystem through `resolveBinary`, so a control
  could not simulate an absent tool on a machine that has it. Resolution is a
  named parameter now.
- **Name a seam so it cannot shadow.** The resolver was first called
  `resolve`, which `node:path` already exports into `lib/starlist.mjs`.
  Inside `search()` that shadow would have made `path.resolve` the presence
  test, and `path.resolve` returns a truthy absolute path for any string, so
  every manager on every machine would have read present.
- **Assert the row, not the phrase.** The CI roundtrip grepped a doctor
  summary for `every one installed`; pass 25 reworded it to
  `158 installed main files, 0 failing C1..C16` and a healthy install started
  failing.
- **Keep a test's own output out of the thing it measures.** The roundtrip
  wrote three logs into the scratch target, then asserted the uninstall left
  zero files in it.

## Limitations and edge cases

- **A green local gate is not a green build.** The gate ran `exit 0` here and
  failed twice on CI. Both causes were environmental in the same direction:
  this machine has every manager, CI has none.
- **The audit measures one machine.** No pass ran the suite under a shell
  without the six managers, so no pass could have found the `noSearch`
  ordering. The auditor read diffs; it did not run the code on a second
  platform.
- **`doctor` exits 1 on a correct install.** Arming has been opt-in since
  5.0.0, so an unarmed install is healthy and `doctor` still reports two
  failures. The roundtrip discards that exit on purpose and reads the rows;
  anything else reading `doctor`'s exit will misread it.
- **Two open ledger runs, both older than a day,** are stale rows from
  earlier sessions and make `doctor` report `13 checks, 3 failing` here
  rather than 2. They are not a defect in the release.
- **The tag moved twice** before the release job ran. That is only acceptable
  because no release existed yet; after publication the same fix would have
  been 7.0.1.

## Current state and trends

`v7.0.0` is tagged at `9caeab6`, all four CI runs report success, and the
release is published at
`https://github.com/Nova-Violet-Role/RoT-DtD-Commander/releases/tag/v7.0.0`.
The local install is the released code: 337 files written, 0 failed, 0
verify-bad, and `git describe --tags --exact-match` returns `v7.0.0`.

Measured at the tag:

    build              295 written, 0 failing
    check              158 checked, 0 failed
    contract-audit     1434 declarations, 0 unused, 0 law gaps, 4 controls
    adiutor controls   30 run, 0 failing
    list controls      47 run, 0 failing
    starlist controls  41 run, 0 failing
    crlf-sweep         713 files checked, 0 bad
    spdx-sweep         695 files checked, 0 missing
    counts-sweep       22 places in step
    gate-sync          46 commands in the gate chain, 0 missing
    gate               exit 0

The direction the evidence points is away from more passes of the same audit
and toward a second environment. Three of the four defects found after pass
27 were found by Linux, not by the auditor.

## Key takeaways

1. The audit stopped paying around pass 20, when its findings became
   corrections of the previous pass rather than of the codebase. The stopping
   rule "keep going until a pass reports zero high" could not terminate,
   because each pass created the next pass's work.
2. A second environment found in one CI run what twenty-seven passes on one
   machine could not. Platform coverage is worth more than audit depth once
   the obvious defects are gone.
3. Every fix in this release that mattered came with a control that fails
   without it, and three of those controls failed the first time they were
   written. A control written after the fix, against the fixed code, is the
   one most likely to be vacuous.

## Remaining unknowns

- [ ] Would the companion audit converge if pointed at a frozen tree instead
      of a moving one? (assumed: yes, but the question was not tested — the
      audit always ran against `v6.0.0..HEAD`, which grew with every pass.)
- [ ] Are there further one-machine assumptions in `lib/` that Linux happens
      not to exercise? (assumed: yes; `resolveBinary`'s extension preference
      and `quoteForShell` are both win32-shaped and only the first has a
      Linux path in CI.)
- [ ] Do the two stale open ledger runs indicate a crash path that leaves a
      run open? (assumed: they are from interrupted sessions, not a defect,
      because no failed run correlates with them.)

## Implementation context

**application**

- when_to_use: when a repository needs to declare what it may contain and
  have that declaration enforced at write time rather than reviewed later.
- when_not_to_use: as a security boundary against a hostile author — it
  refuses the tool's own writes, not a shell.
- prerequisites: `.rot-lists/` in the repository, or the machine layer under
  the installed plugin; a tree with neither asks nothing.

**technical**

- libraries: none added. Node built-ins only: `node:fs`, `node:path`,
  `node:child_process`, `node:os`, `node:url`.
- patterns: managers and laws are declarations, never branches; a seventh
  manager is one more `STAR.mgr.*` entity and no new code.
- gotchas: `path.resolve` is imported into `lib/starlist.mjs` and will shadow
  any parameter named `resolve`; `spawnSync` cannot run a `.cmd` without
  `shell: true`; with `shell: true` Node concatenates rather than escapes
  (DEP0190), so both the query and the command path must be guarded — `QUERY`
  and `quoteForShell`.

**integration**

- works_with: the Adiutor at PreToolUse (`LAW.CORE.8`), the checker rules
  C1 to C16, the gate chain of 46 commands, and `gate.yml` which must run
  every one of them.
- conflicts_with: reading `doctor`'s exit code as install health.
- alternatives: a lint config or `.gitignore` would express the file half,
  but neither carries the reason an entry was listed, the layer it came from,
  or the replacements a refusal should offer.

**Next action:** apply — freeze `lib/list.mjs` and `lib/starlist.mjs`, and
point the next audit at a second platform rather than at another diff of the
same tree.

## Sources

- run: `node checker/companion-audit.sh 700-pass27` — 9 findings, 3 high — 2026-09-05
- file: `checker/contract-audit.mjs` — the density arm and its four controls — 2026-09-05
- file: `lib/starlist.mjs` — `have`, `search`, the resolver seam — 2026-09-05
- file: `.github/workflows/gate.yml` — the install-roundtrip job — 2026-09-05
- command: `npm run gate` — exit 0 — 2026-09-05
- command: `node bin/rot-dtd-commander.mjs build` — 295 written, 0 failing — 2026-09-05
- command: `node lib/starlist.mjs controls` — 41 run, 0 failing — 2026-09-05
- command: `node lib/starlist.mjs managers` — six of six present — 2026-09-05
- command: `node bin/rot-dtd-commander.mjs install` — 337 written, 0 failed — 2026-09-05
- run: install roundtrip by hand — removed 337, kept 0, files left 0 — 2026-09-05
- measurement: GitHub Actions runs for `9caeab6` — gate, install-roundtrip, tapes, template lint all success — 2026-09-05
- measurement: `GET /releases/tags/v7.0.0` — published, body 2779 bytes — 2026-09-05
- note: the reading of why the audit series never converged is an interpretation of the findings, not a measurement.
