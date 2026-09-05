<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep Dive: folding the README, and the two unknowns closed against their assumptions

Date: 2026-09-05 · Depth: comprehensive · Use: finish 7.1.0's documentation and retire the open list

## Intake

- known **what**: fold every README section, leave the index open; close the two remaining unknowns
- known **depth**: comprehensive · known **use**: finish the release documentation
- no gap left open among depth, focus and use (LAW.DD.3); no round run
- gate: `start` — both instructions were explicit

## Strategic Summary

Both unknowns closed against the assumption recorded for them: widening
`contract-audit.mjs` past `dtd/` is **wrong**, not merely deferred, because its
use-test is static and a checker DTD is read dynamically; and the `unreached`
escape became a real enumeration rather than eventually. The README now folds
every section behind its heading with the command index alone left open, which
cuts the rendered page without touching a single claim.

## Key Questions

- Should `contract-audit.mjs` scan past `dtd/`?
- Can the `unreached` escape be enumerated?
- What does folding the README actually cost and save?

## Overview

The two unknowns had assumptions attached — "yes, but not this release" and
"yes eventually" — and both turned out to be wrong in an instructive direction.

Widening the audit was attempted, measured, and reverted. It surfaced 27 orphan
declarations, of which **zero** were orphans. Three separate causes, each fixed
and each revealing the next: `walk()` collected `.md` only, so walking `lib/` for
the use corpus returned nothing; names read out of a DTD appear dot-escaped
inside the regex that reads them, so `includes('RER.outside.marker')` cannot
match `RER\.outside\.marker`; and the last residue is read through names
*constructed at runtime* (`'RER.outside.' + w`), which no static search can
follow. That final class is unfixable by widening, and it is the same class that
makes `.rot-lists/*.dtd` unauditable: `lib/list.mjs` builds an entry's ENTITY
name at runtime, so 19 of its 21 declarations look orphaned and none is.

## How It Works

- **The fold** [measured] Ten sections wrapped in `<details>`; the header block
  above the first `##` stays open because `counts-sweep` publishes six badge
  numbers there and a proof nobody can see is not a proof. The generated index
  lost its outer wrapper in `checker/readme-index.mjs` and is now the one open
  region; its per-family folds remain.
- **The anchored line survives** [measured] `counts-sweep.mjs` matches
  `/^(\d+) commands, in the families/` with a start anchor. It sits inside the
  Usage region at column 0 and stays there; an indent would have broken the gate.
- **The enumeration** [measured] `%rer.outside "(spend|nondeterminism|manual)"`
  with a marker `rer-outside:`. `lib/regression.mjs` reads both from the DTD, and
  `checker/live-sweep.mjs` declares `rer-outside: spend`. The previous escape was
  `/\b(kept outside|…|because|reason)\b/` — the bound-in-prose this release's own
  `LAW.ASK.15` condemns.
- **`node lib/regression.mjs contract`** [measured] prints every shape the DTD
  declares, including the three glosses, so a documentation entity has a caller.

## History and Context

`LAW.RER.6` exists because `LAW.ASK.15`, written days earlier in the same
release, says a bound living in prose is not a bound — and the first cut of the
`unreached` arm escaped on prose. The release contradicted itself within a week
and the contradiction was visible only because someone asked whether the unknown
was really closed.

## Patterns and Best Practices

- **A `<details>` shrinks the rendered page, not the file.** README.md went
  63,764 → 64,793 bytes (spoiler markup *adds* bytes) while the visible page
  collapsed to ten headings plus the index.
- **Keep the proof surface open.** Badges and the tagline stay visible; folding
  them would hide the numbers the page exists to expose.
- **When a widening surfaces findings, check the use-test before believing them.**
  Three bugs in a row here, 27 → 12 → 10 → revert.

## Limitations and Edge Cases

- **The widening was reverted, not fixed.** `checker/*.dtd` remains unaudited by
  `contract-audit.mjs`. The `unreached` arm covers the specific defect that
  prompted the question (a law nothing references), but the general gap stands
  and now has a measured reason rather than an assumption.
- **`.rot-lists/*.dtd` must never enter that scope.** Its entities are data rows
  addressed by constructed name; auditing them as grammar reports 19 false
  findings.
- **The folded README is untested against non-GitHub renderers.** `<details>`
  is HTML; a renderer that strips it shows every section expanded, which
  degrades gracefully, and one that escapes it shows raw tags, which does not.

## Current State and Trends

Gate green, exit 0, 95 s; `contract-audit: 1440 declarations, 0 unused, 0 law
gaps`; `regression controls: 12 run, 0 failing`; `readme-index` and
`counts-sweep` both in step. README 833 → 882 lines, ten sections folded, index
open.

## Key Takeaways

1. **"Not this release" was the wrong assumption; "not this way" is the answer.**
   The audit's use-test is static and its subject is dynamic.
2. **The release contradicted its own standard**, and only the question exposed it.
3. **Twenty-seven findings, zero real** — the fourth such run today, and the
   reason to check an instrument before believing its first output.

## Remaining Unknowns

- [x] Widen `contract-audit.mjs` past `dtd/`? **Closed: no.** Measured — three
      distinct use-test failures, the last unfixable by static analysis.
- [x] Make the `unreached` escape an enumeration? **Closed: done.**
      `%rer.outside` with three values and a declared marker.
- [ ] Should a separate instrument audit checker DTDs dynamically? (assumed: yes,
      and it is a different tool from `contract-audit.mjs` — deferred, unstarted)
- [ ] Is a WSL2 substrate reachable here? (assumed: still unknown; `wsl --install`
      has not been attempted, so no `LAW.XOS.*` exists)

## Implementation Context

<claude_context>
<application>
- when_to_use: folding a long README while keeping its generated index and proof
  surface visible; closing an unknown by attempting it rather than deferring it
- when_not_to_use: folding a section a checker anchors with `^` at column 0
  without verifying the indent
- prerequisites: a generated-index checker with markers and controls
</application>
<technical>
- libraries: none
- patterns: keep badges outside the fold; one blank line after `<summary>` or
  GitHub will not render the markdown inside; regenerate the index after editing
- gotchas: `walk()` filtered to `.md`; DTD names appear dot-escaped in the regex
  that reads them; runtime-constructed names defeat any static use-test
</technical>
<integration>
- works_with: readme-index.mjs, counts-sweep.mjs, gate-sync.mjs
- conflicts_with: indenting a counts-sweep-anchored line
- alternatives: moving sections to docs/, tried in this release and reversed
</integration>
</claude_context>

**Next Action:** apply — a dynamic audit for checker DTDs, as its own instrument.

## Sources

- [command] `grep -rlE '<!\[[[:space:]]*%…'` per family — svg 33/54, tei 21/60, dita 4/159 — 2026-09-05
- [measurement] widened audit: 27 unused → 12 → 10 after two use-test fixes, then reverted — 2026-09-05
- [file] `lib/list.mjs:59` — "An entry name becomes part of an ENTITY name" — 2026-09-05
- [measurement] `.rot-lists`: 21 declarations, 19 apparently orphaned, none real — 2026-09-05
- [run] `node lib/regression.mjs controls` — 12 run, 0 failing — 2026-09-05
- [run] `node lib/regression.mjs contract` — prints all three glosses — 2026-09-05
- [run] `node checker/readme-index.mjs --controls` — 6 run, 0 failing — 2026-09-05
- [run] `npm run gate` — exit 0, 95 s — 2026-09-05
- [measurement] README 63,764 → 64,793 bytes, 833 → 882 lines, 10 sections folded — 2026-09-05
- [note] the claim that folding degrades gracefully on non-GitHub renderers is reasoned, not tested
