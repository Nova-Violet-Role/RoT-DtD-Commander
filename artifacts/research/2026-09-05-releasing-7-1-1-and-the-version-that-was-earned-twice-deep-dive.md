<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep Dive: releasing 7.1.1, and a version number earned rather than typed

Date: 2026-09-05 · Depth: comprehensive · Use: close the 7.1.1 release and record how the number was reached

## Intake

- known **what**: release everything as 7.1.1, install, publish, watch CI
- known **depth**: comprehensive · known **use**: close the release
- no gap left open among depth, focus and use (LAW.DD.3); no round run
- gate: `start` — the instruction named the version, the install, the publish and the watch

## Strategic Summary

The operator asked for 7.1.1 and the recognizer independently computed 7.1.1,
which is only interesting because it could have said otherwise: the number comes
from the top verb of the work this run kept, and one honest reading of that work
would have produced 7.2.0 instead. The release is tagged, pushed, installed and
under CI.

## Key Questions

- What number does this pass actually amount to?
- Does the classification survive scrutiny, or was it fitted to the request?
- Is the release green where it matters?

## Overview

This repository stopped typing its version in 6.0.0. A release records the
possibilities it kept, each on a rung of a fifteen-verb ladder, and the top rung
decides the class: 14 or above is major, 9 or above is mid, below that is minor
with an increment of `0.0.1`. So asking for "7.1.1" is not a decision, it is a
prediction, and the prediction is checked by `checker/release-notes.mjs
--versions`, which refuses a manifest the recognizer disputes.

The load-bearing judgement was one verb. The `unreached` escape stopped being a
prose regex and became the enumeration `%rer.outside "(spend|nondeterminism|
manual)"`. That reads naturally as verb **12, intensification** — "an existing
law is made strict where it was advisory" — and 12 is in the overhaul band, which
computes `mid` and would have published **7.2.0**.

It is not 12. No law was advisory. `LAW.RER.4` said a mechanic nothing exercises
is a finding; it said nothing about how a module may be excused. The escape was a
regular expression inside the arm's implementation, never a declared rule, so
this is verb **6, heighten** — "a bound is raised or a measure is added to what
was unmeasured". The escape was unmeasurable and is now measurable.

## How It Works

- **The recognizer, run** [measured] `recognised 7.1.1 (class minor) from the kept
  verbs 6, 4, 3, 3 at 7.1.0`, and `release-notes versions: one version everywhere,
  7.1.1` across `package.json`, `plugin.json`, `marketplace.json` twice,
  `CHANGELOG.md` and the `RELEASE.md` heading.
- **The run column earns its keep** [measured] Run 4 carries `from: 7.1.0` and
  four marked rows. Without the column added in 7.1.0, `kept` would still include
  7.0.0's verb 15 and every release after a major would compute major for ever.
- **A refusal recorded as a row** [measured] The contract-audit widening is row
  `c3e0de05`, verdict `refused`, `refused_at: 4`. A thing tried and rejected is
  part of the record, not an absence from it.
- **Install** [measured] `337 written, 0 skipped, 0 failed, 0 verify-bad`.
- **Fresh clone** [measured] `git clone . && npm run gate` → exit 0, 97 s, zero
  dependencies.

## History and Context

Two releases in a row now have turned on the same question: what is this work,
on the ladder? For 7.1.0 the answer was verb 9 — a capability the codebase
implied and did not have — which computed `mid` and produced the number asked
for. For 7.1.1 the answer was verb 6, and one rung higher in either direction
would have produced 7.2.0. The ladder is doing real work; it is not decoration
that happens to agree.

## Patterns and Best Practices

- **Classify before you look at the number the classification produces.** The
  temptation to reach for verb 6 because 12 gives the wrong answer is the whole
  failure mode this mechanism exists to prevent.
- **Record a refusal as a row.** `refused` with `refused_at` keeps the attempt in
  the history, so the next release does not re-try it blind.
- **Prove the release in a clone before tagging** — a green local gate says
  nothing about a fresh checkout.

## Limitations and Edge Cases

- **The verb classification is a judgement, not a measurement.** Its inputs are
  measured; the rung is argued. This report states the argument so it can be
  disputed rather than hiding it behind the number it produced.
- **CI is green where it decides the release.** On `7e94346`: gate #53 on tag
  `v7.1.1` success, gate #54 on `main` success, template lint #22 success. tapes
  #33 was still rendering at the time of writing and is not a release gate; it
  records terminal casts. Zero failures across every run of this release.
- **The folded README is untested outside GitHub.** `<details>` degrades to
  everything-expanded on renderers that strip HTML, and to visible tags on ones
  that escape it.

## Current State and Trends

`v7.1.1` tagged at `7e94346` and pushed with `main`. Installed here. The open work
is unchanged and named: a dynamic audit for checker DTDs, and a WSL2 substrate
that has never been attempted, so no `LAW.XOS.*` exists.

## Key Takeaways

1. **The number was predicted, then computed, and the two agreed.** They did not
   have to.
2. **One verb decided the release.** 12 would have published 7.2.0; 6 is the
   honest rung because no law was ever advisory.
3. **A refused attempt is a row in the record**, not a gap in it.

## Remaining Unknowns

- [x] Do the release runs pass? **Closed by measurement**: gate #53 (tag v7.1.1)
      and #54 (main) both success, template lint #22 success. tapes #33 was still
      rendering; it gates nothing.
- [ ] Should a dynamic audit read checker DTDs? (assumed: yes, as its own
      instrument — `contract-audit.mjs` is static and cannot)
- [ ] Is a WSL2 substrate reachable here? (assumed: still unknown; `wsl --install`
      has not been attempted)

## Implementation Context

<claude_context>
<application>
- when_to_use: cutting a release in a repository whose version is computed from
  recorded work rather than chosen
- when_not_to_use: picking a rung to reach a wanted number
- prerequisites: a state record with a run column, and a recognizer the gate runs
</application>
<technical>
- libraries: none
- patterns: classify, then compute, then compare; record refusals with refused_at;
  clone and gate before tagging
- gotchas: minor is 0.0.1 and mid is 0.1.0, so verb 9 versus verb 6 is the whole
  difference between 7.2.0 and 7.1.1
</technical>
<integration>
- works_with: release-notes.mjs --versions, lib/amplify.mjs recognize
- conflicts_with: editing a manifest version by hand
- alternatives: none in this repository; LAW.AMP.14 forbids a typed number
</integration>
</claude_context>

**Next Action:** apply — watch the five runs to conclusion, then the dynamic
checker-DTD audit as the next release's first item.

## Sources

- [run] `node lib/amplify.mjs` recognize via state run 4 — top verb 6, class minor, 7.1.0 becomes 7.1.1 — 2026-09-05
- [run] `node checker/release-notes.mjs --versions` — one version everywhere, 7.1.1 — 2026-09-05
- [run] `npm run gate` — exit 0, 96 s local; exit 0, 97 s in a fresh clone — 2026-09-05
- [run] `npm run install-home` — 337 written, 0 failed, 0 verify-bad — 2026-09-05
- [command] `git push origin main --follow-tags` — `0a23a24..7e94346`, `[new tag] v7.1.1` — 2026-09-05
- [measurement] CI at time of writing: 5 complete success, 5 in progress, 0 failures — 2026-09-05
- [file] `lib/amplify.mjs` recognize — 14 major, 9 mid, else minor — 2026-09-05
- [note] the choice of verb 6 over verb 12 is argued in this report, not measured; it is the one judgement the number rests on
