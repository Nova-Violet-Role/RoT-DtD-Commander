<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep Dive: the crafted pass, the law that governed nothing, and the release pushed

Date: 2026-09-05 · Depth: comprehensive · Use: close 7.1.0 and record what the pass found
Gate: start

## Intake

- known **what**: whether the crafted pass was complete, then push, tag and follow CI
- known **depth**: comprehensive · known **use**: close 7.1.0
- no gap left open; no round run
- gate: `start` (the argument named the work and authorised the push)

## Strategic Summary

Asked whether the crafted-file pass was really done, the honest answer was no — an
audit had run, an update had not — and pressing on it found `LAW.RER.4`, a law
shipped one commit earlier that referenced nothing, which is precisely the defect
that law is written to catch. It went unseen because `contract-audit.mjs` scans
`dtd/` alone and nine crafted DTDs live elsewhere. The arm now exists, is proved
red on a planted orphan, and v7.1.0 is pushed at `ab737f7`.

## Key Questions

- Was the crafted-file pass actually complete?
- What did pressing on it find?
- Are the three named 7.1.0 items done, and done as specified?

## Overview

The pass had covered four axes across 82 crafted files — encoding, SPDX, syntax,
gate-reachability — and every one came back clean. That cleanliness was the
problem: it meant the axes already had owners (`crlf-sweep`, `spdx-sweep`,
`npm run check`) and the pass had measured nothing new.

The axis with no owner is the one `LAW.RER.4` names: a mechanic implemented and
never exercised. Applying it found the law itself. `checker/regression-extention-retenue.dtd`
declares `LAW.RER.4`; nothing in `lib/`, `checker/`, `bin/`, `src/` or `monitors/`
referenced it. A law that governs nothing is the same class of defect as a
resolver nobody calls, and this one was written to catch exactly that.

`contract-audit.mjs` could not have caught it. Its signature is
`audit({ dtdDir = join(ROOT, 'dtd'), … })`, so the nine crafted DTDs outside that
directory — seven under `.rot-lists/`, plus `checker/companion-audit.dtd` and
`checker/regression-extention-retenue.dtd` — are audited by nothing. The retenue
arm found it only because it scans `checker/` as well.

## How It Works

- **The unreached arm** [measured] `node lib/regression.mjs unreached` reports every
  module carrying a `controls` verb that the gate never runs and that records no
  reason for staying outside it.
- **`expandScripts` is the whole trick** [measured] The gate chain names npm
  scripts, not paths, so a grep for `lib/ai-slop.mjs` cannot match `npm run
  controls:slop`. A first hand pass did exactly that and reported 21 findings;
  expanded transitively the true count was **1**.
- **Proved red, and proved silent** [measured] On a planted temporary tree the arm
  reports `lib/orphan.mjs`, and stays silent on a module the gate reaches and on
  one whose header records why it stays out.
- **The escape and the law were built in order** [measured] The excused module is
  `checker/live-sweep.mjs` — 131 headless `claude -p` sessions, real API spend —
  whose reason was written down in the previous commit precisely so this arm would
  accept it.
- **The three named items, verified rather than remembered** [measured]:
  `%ask.adds "(1|2|3)"` and `%ask.impactfuls "(1|2)"` declared, the gate ATTLIST
  carrying both resolved in the built file, `LAW.ASK.15` present; the sigil doc at
  384 lines with 0 flag markers; and the three ask-me roots carrying **a `RECORD.*`
  declaration each and no `artifact` element**.

## History and Context

The `artifact` substitution deserves its own record, because the plan said one
thing and the build did another.

The declared next action read "give the three ask-me roots an artifact". The
`artifact` element is declared in `cc-report.dtd` as
`dir CDATA #FIXED "artifacts/research"` — it is the research family's saved-report
element and nothing else. An intake command is not a research command, and an
`artifact` element there would have declared a file the command never writes.

The complaint underneath the plan was that ask-me produced no Greek-numbered file.
What produces one is a `RECORD.*` declaration: `lib/record.mjs:75` builds the
regex `^<command>(?:\.([a-z-]+))?\.md$` and validates any ordinal with
`greek(n) === token`. So the build gave all three roots a record under
`artifacts/<command>/` instead. Same goal, correct mechanism, different element
from the one the plan named.

## Patterns and Best Practices

- **A clean sweep on every axis means the axes have owners, not that the code is
  clean.** Look for the axis nothing measures.
- **Expand the build scripts before asking what the build reaches.**
- **Write the escape before the law that needs it**, so the law's first run is
  honest rather than noisy.
- **When a plan names a mechanism, check the mechanism delivers the goal** — and
  say plainly when you substituted one.

## Limitations and Edge Cases

- **Nine crafted DTDs remain outside `contract-audit.mjs`.** The unreached arm
  closed the symptom; the scope itself is unchanged, and widening it may surface
  unused declarations in the seven `.rot-lists` files. Not attempted this release.
- **The unreached arm accepts a prose reason.** `/\b(kept outside|outside the
  gate|on purpose|deliberately|because|reason)\b/` in the first 4000 bytes is a
  weaker bound than an enumeration, and by this release's own standard
  (`LAW.ASK.15`) a bound that lives in prose is not a bound. It is an improvement
  on nothing, not a proof.
- **CI is green, read from the REST API rather than the HTML.** gate #47 (tag
  v7.1.0), #48 and #49 (main), tapes #29/#30 and template-lint #20 all report
  conclusion success on ubuntu-latest, which is the first evidence that the
  stat -c to wc -c change actually holds on Linux. The Actions HTML page cannot
  answer this: its status icons are SVGs carrying no text, so a fetch of the page
  reports durations and nothing else. The endpoint /actions/runs?per_page=N
  carries a conclusion field per run, and CLAUDE.md line 7 prescribes exactly
  that route: git only, gh prohibited, GitHub via git + REST API with curl. I had
  assumed the whole API was out of bounds and nearly abandoned following CI;
  opening the rule file instead of trusting its one-line summary corrected it.

## Current State and Trends

v7.1.0 is pushed: `be9f8c3..ab737f7  main -> main` and `[new tag] v7.1.0`. The tag
was moved from `01b8f4c` to `ab737f7` before pushing, because it had never left
this machine and the release was not complete at the earlier commit. Local gate
green in 95 s; fresh-clone gate green in 96 s with zero dependencies.

## Key Takeaways

1. **A law that references nothing is the defect it describes.** `LAW.RER.4` was
   unreferenced one commit after being written, and only a checker scanning outside
   `dtd/` could see it.
2. **Four axes clean meant four axes already owned.** The value was in the fifth.
3. **The plan said `artifact`; the goal wanted `RECORD`.** Following the letter
   would have declared a file the command never writes.

## Remaining Unknowns

- [x] Did the tag pass on `ubuntu-latest`? **Closed by measurement**: gate #47 on
      tag v7.1.0 reports conclusion success, as do tapes #29 and template-lint #20.
- [ ] Should `contract-audit.mjs` widen to every tracked `.dtd`? (assumed: yes, but
      not this release — it may surface unused declarations in the seven
      `.rot-lists` files and that is a change with its own blast radius)
- [ ] Should the unreached arm's prose escape become an enumeration? (assumed: yes
      eventually, by this release's own standard; deferred rather than rushed)
- [ ] Is a WSL2 substrate reachable here? (assumed: still unknown — `wsl --install`
      has not been attempted, so no `LAW.XOS.*` is written)

## Implementation Context

<claude_context>
<application>
- when_to_use: auditing a codebase that already has sweeps — look for the axis with
  no owner rather than re-running the ones that pass
- when_not_to_use: as a substitute for reading the files; this pass measures
  properties, it does not review content
- prerequisites: a build chain whose scripts can be expanded transitively
</application>
<technical>
- libraries: none; `lib/regression.mjs` verbs claims, retenue, unreached, diff, controls
- patterns: expandScripts before any reachability grep; write the escape before the
  law; prove an arm red on a planted case and silent on two negative cases
- gotchas: `npm run x` hides paths from grep; contract-audit only scans `dtd/`; the
  `artifact` element is #FIXED to artifacts/research and is not general-purpose
</technical>
<integration>
- works_with: gate-sync (the npm chain and gate.yml must agree), counts-sweep (the
  gate-chain count is published in README and CHANGELOG)
- conflicts_with: adding a gate step without adding its workflow run line —
  gate-sync refuses it immediately
- alternatives: widening contract-audit's scope, which addresses the cause rather
  than this symptom
</integration>
</claude_context>

**Next Action:** apply — watch gate #47 and #48 to conclusion; then widen
`contract-audit.mjs` beyond `dtd/` as the first item of the next release.

## Sources

- [command] `grep -n "dtdDir = " checker/contract-audit.mjs` — `join(ROOT, 'dtd')` — 2026-09-05
- [command] `git ls-files '*.dtd' | grep -v '^dtd/'` — 9 crafted DTDs outside the audit — 2026-09-05
- [measurement] `LAW.RER.4` referenced by 0 files before this change, 2 after — 2026-09-05
- [run] `node lib/regression.mjs unreached` — clean on this tree — 2026-09-05
- [run] planted-orphan control — reports `lib/orphan.mjs`, silent on the reached and the excused — 2026-09-05
- [run] `node lib/regression.mjs controls` — 12 run, 0 failing — 2026-09-05
- [run] `npm run gate` — exit 0, 95 s local; exit 0, 96 s in a fresh clone — 2026-09-05
- [command] `git push origin main --follow-tags` — `be9f8c3..ab737f7`, `[new tag] v7.1.0` — 2026-09-05
- [measurement] the three named items: ask.adds/ask.impactfuls declared and resolved in the built gate ATTLIST; sigil doc 384 lines, 0 flags; ask-me roots artifact-element 0, RECORD 1 each — 2026-09-05
- [file] `lib/record.mjs:75` — the ordinal regex and `greek(n)` validation — 2026-09-05
- [note] the CI conclusion is unresolved at the time of writing; the runs were observed in progress, not passed
