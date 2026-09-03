<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep dive: the stale descriptions and the pattern behind them

## Strategic summary

The GitHub About section sat at `RoT DtD Commander 5.0.0 ... 118 Claude Code
commands` through three releases because no instrument read it, while every
number on disk had one. The manifests were not stale but were deformed: each
release appended a clause, so both descriptions had become changelogs. The fix
is one present-tense description per place plus `checker/about-sweep.mjs`,
which reads the About through the API and refuses both faults.

## Key questions

- What did each description actually say, and how far behind was it?
- Why did the About go stale when the README badges did not?
- What is the recurring pattern, and can an instrument refuse it?

## Overview

A repository publishes its counts in many places: badges, a tagline, claim
rows, three manifest descriptions, and the About field a visitor reads first.
`checker/counts-sweep.mjs` grew to guard sixteen of them, one at a time, each
after a companion audit caught it stale. Every place it guards is a file on
disk. The About is not a file: it lives in GitHub's database, reachable only
through the API, so it was outside every sweep the repository owns.

Measured on 2026-09-04, before the change: the About read `RoT DtD Commander
5.0.0, the creator kit: 118 Claude Code commands, 22 skills and 5 agents`. The
tree measured 123 commands, and the published version was 6.0.0. Two majors
and five commands behind, with twenty topics none of which named anything the
last three releases added.

The manifests were current in their numbers and deformed in their prose. The
marketplace description ended `...(5.1.0). 5.2.0 adds the codebase growth
family:` and the plugin description `...and from 6.0.0 the version i` — a
sentence cut off mid-word by an append that never re-read what it was
appending to.

## How it works

The About is a field on the repository object: `PATCH /repos/{owner}/{repo}`
with a `description`, capped at 350 characters, and `PUT /repos/{owner}/{repo}/topics`
with at most twenty names (measured: the new About is 342 characters and the
topic list is exactly 20, both accepted).

`checker/about-sweep.mjs` reads the credential with `git credential fill`, so
it uses the same token every other GitHub call in this repository uses and
stores nothing. `judge()` holds the fetched description to `measure()` from the
counts sweep: the counts of commands, skills and agents must equal the tree's,
every word of `MUST_NAME` must appear, the text must fit the cap, and a
version number inside the About is itself a finding — release archaeology that
goes stale the day after it is written. `manifests()` needs no network and
holds the three descriptions to the same counts, refusing any that carries
`X.Y.Z adds`, `from X.Y.Z` or `(X.Y.Z)`.

Without a credential the network half prints `NOT CHECKED` with the reason and
exits on the manifest half alone. A check that did not run must never look like
a check that passed — the same rule the version gate learned in its seventh
audit pass (measured, this session).

## History and context

Each place was guarded the moment something caught it wrong, never before. The
tenth companion pass of 5.1.0 found three stale counts under a green gate and
produced `counts-sweep.mjs`. The third pass of 6.0.0 found two claim rows no
instrument read and produced two more places. The fifth pass found two
families installed without their engines and produced `engines-sweep.mjs`.

The About was never caught because no audit reads GitHub — the companion reads
a git range and the tree. It took a person opening the repository page to see
`5.0.0` sitting there (reasoned: the operator's own report is what prompted
this).

## Patterns and best practices

- **A description says what a thing is, not what a release added.** The
  changelog is the place for history and already holds it. Measured: both
  manifest descriptions had grown to over a thousand characters of stacked
  clauses; the rewritten plugin description is 1040 characters that read as one
  statement, and the marketplace 1107.
- **Every published number needs an instrument, wherever it is published.**
  On disk or behind an API makes no difference to a reader.
- **A guard that cannot run says so.** The skip line names the reason.
- **Loosen the pattern, never the number.** Rewriting the prose broke three
  sweep patterns; each was widened to accept the new phrasing while still
  capturing and comparing the same integer.

## Limitations and edge cases

- **The About sweep needs a credential.** In CI without one it checks the
  manifests only and says so. Mitigation: the line is printed, never silent.
- **`MUST_NAME` is a judgement, not a measurement.** It asserts that seven
  words appear, not that the sentence is good. Mitigation: it is small and
  every entry is a capability a visitor would search for.
- **Topics are capped at twenty**, so six of the old set were dropped (`agpl`,
  `eupl`, `npx`, `tasks`, `thinking-models`, `workflow`) for six that name what
  now exists (`doctype`, `ai-slop`, `worktree`, `refactoring`, `roadmap`,
  `versioning`). The sweep does not yet judge topics, only counts them.
- **One repository is hard-coded** in `REPO`. A fork would read the original's
  About. Mitigation: it is one constant beside the API call.

## Current state and trends

Measured after the change: `about-sweep: the About is 342 of 350 characters
with 20 topics, 0 drifted; manifests 0 drifted`, controls `7 run, 0 failing`,
gate chain 42 commands, whole gate exit 0. The repository now guards seventeen
published places on disk and one off it.

## Key takeaways

1. The About was the only published claim with no instrument, and it was the
   one a visitor reads first — two majors and five commands behind.
2. The recurring pattern was not staleness but accretion: descriptions grew by
   one clause per release until they read as changelogs, one of them cut off
   mid-word.
3. Rewriting prose breaks the patterns that guard it; widen the pattern, keep
   the number.

## Remaining unknowns

- [ ] Should the topic list be judged and not merely counted? (assumed: no,
      until a release adds a family whose name nobody searches for)
- [ ] Does the release workflow have a credential with `repo` scope, so the
      About sweep could run in CI rather than by hand? (assumed: not
      guaranteed, so the skip path is the designed one)

## Sources

- measurement: `GET /repos/Nova-Violet-Role/RoT-DtD-Commander` before the
  change: description at 5.0.0 with 118 commands, 20 topics — 2026-09-04
- measurement: `PATCH` and `PUT /topics` after: 342 characters, 20 topics — 2026-09-04
- command: `node checker/about-sweep.mjs` → `0 drifted; manifests 0 drifted` — 2026-09-04
- command: `node checker/about-sweep.mjs --controls` → `7 run, 0 failing` — 2026-09-04
- command: `npm run gate` → exit 0, 42 chain commands — 2026-09-04
- file: `checker/counts-sweep.mjs`, sixteen guarded places, three patterns widened
- file: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json`
