<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep Dive: the DTD families ranked, the crafted sweep, and every remaining unknown closed

Date: 2026-09-05 · Depth: comprehensive · Use: drive the release after 7.1.0
Gate: start · Sources: local, 2219 corpus files and 82 crafted files of this repository

## Intake

- known **what**: rank the families, close every unknown, finish the crafted pass
- known **focus**: the xhtml family the earlier study never opened
- known **depth**: comprehensive · known **use**: drive the release after 7.1.0
- no gap left open; no round run
- gate: `start` ("camon partner!")

## Strategic Summary

DITA, the family this repository borrowed from, uses conditional sections in 4 of
its 159 files while SVG uses them in 33 of 54 and TEI in 21 of 60 — we adopted one
composition philosophy without ever seeing the other. XHTML 1.1 holds the answer we
actually need: a 323-line driver that switches modules on and off and a 4689-line
flat build of the same grammar, which is exactly our `dtd/` sources against our
inlined `commands/`. Every remaining unknown from the previous two studies is now
closed by measurement, including a second parser implementation for NDATA.

## Key Questions

- Which DTD family is strongest, and on what axis?
- What did the crafted-file sweep actually find?
- Can every previously-declared unknown be closed?

## Overview

The corpus splits into two schools of composition, and the split does not follow
size or prestige.

**The conditional-section school** switches modules on and off in place:
`<!ENTITY % x.module "INCLUDE">` followed by `<![ %x.module; [ … ]]>`. SVG uses it
in 61% of its DTD-family files, TEI in 35%, DocBook in 16%. TEI takes it furthest,
wrapping *every element* in its own switch and parameterizing the element name
itself (`%n.abbr;`), so a downstream customization can disable or rename any single
element.

**The redeclaration school** narrows a grammar by redefining a parameter entity
*before* the base module loads. DITA is its exemplar — and uses conditional
sections in only 4 of 159 files. Our `.rot-lists` blacklists already borrow this;
the 7.0.0 changelog names DITA's constraint modules as the source.

Between them sits XHTML 1.1's **driver**, which is the pattern this repository is
missing. `xhtml11.dtd` is 323 lines of nothing but switches and module references;
`xhtml11-flat.dtd` is the same grammar at 4689 lines with every module resolved;
`xhtml-math-svg-flat.dtd` composes three grammars into 15,405. We already ship the
same duality — `dtd/*.dtd` sources against installer-inlined `commands/*.md`, with
`build --check` proving they agree — but we have no driver. Our installer inlines
every subset unconditionally. Nothing can be switched off.

## How It Works

- **The XHTML module idiom, four lines, verbatim** [measured, read from
  `xhtml11/dtd/xhtml11.dtd`]:

  ```
  <!ENTITY % xhtml-inlstyle.module "INCLUDE" >
  <![%xhtml-inlstyle.module;[
  <!ENTITY % xhtml-inlstyle.mod
       PUBLIC "-//W3C//ELEMENTS XHTML Inline Style 1.0//EN"
              "xhtml-inlstyle-1.mod" >
  %xhtml-inlstyle.mod;]]>
  ```

  A switch entity, a conditional section, a public identifier, a reference. The
  driver decides which modules exist; the flat build is the result.

- **TEI's per-element switch** [measured, read from `tei/core.dtd`]:
  `<!ENTITY % abbr 'INCLUDE' >` then `<![ %abbr; [ <!ELEMENT %n.abbr; … > ]]>`.
  `tei/core-decl.dtd` holds only the attribute pool; `tei/core.dtd` holds the
  elements. That is our subset/command split at higher resolution.

- **Our resolver already handles the construct** [measured] `flattenConditionals`
  in `lib/dtd.mjs:73` — INCLUDE keeps its content, IGNORE drops it, and a nested
  IGNORE inside an INCLUDE drops only the inner. Exercised for the first time by
  `checker/regression-extention-retenue.dtd` in 7.1.0.

- **Licensing, from the file headers** [measured]: DITA v1.3 carries **IBM** and
  **OASIS**; TEI is dual **BSD-2-Clause + CC-BY-3.0**, stated in every module
  header; JATS is **NLM / public domain**; MathML carries IBM and W3C; DocBook,
  SVG, XHTML and DAISY carry OASIS and W3C. For a repository that ships SPDX
  headers this is not trivia: TEI and JATS are the two whose terms permit the
  freest reuse of their *shapes*.

## History and Context

The families answer different questions and their mechanics follow.

DAISY (talking books) and OpenDocument use **no** conditional sections at all — 0 of
11 and 0 of 27. Both describe a fixed deliverable format where nothing is meant to
be switched off. JATS is entity-first: 81 of its 90 DTD-family files are `.ent`,
because a journal tag suite's variability lives in *vocabulary*, not structure.
TEI is scholarly encoding where every project needs a different subset of a very
large grammar, so per-element switches are the whole design. SVG's 61% reflects a
specification that had to be profiled down for mobile.

DITA solved the same problem the other way, with specialization and constraint
modules, and that is the half we already took.

## Patterns and Best Practices

- **Driver plus flat build**: ship the modular sources and the resolved artifact,
  and prove they agree. We do this; XHTML names it.
- **A switch entity above every optional module**: the unit of configuration is a
  parameter entity, not a config file.
- **Attribute pool separate from element declarations** (TEI's `-decl` pair): we
  already do this and can push it further.
- **Verify a claim against the reader it names, following one import hop.**
  `dtd/cc-record.dtd:49` says the Adiutor reads the parameter entity at Stop.
  Measured true: `bin/adiutor.mjs:36` imports `nestingOf`, calls it at `:357`, and
  `lib/record.mjs:52` reads `<!ENTITY % command-info-types …>` from the subset.

## Limitations and Edge Cases

- **The crafted sweep found nothing on the axes already covered.** All 82 crafted
  files (29 `.dtd`, 43 `.mjs`, 10 `.sh`) pass encoding (0 BOM, 0 CR, 0 control
  bytes), SPDX (0 missing) and syntax (`node --check` 0 bad, `bash -n` 0 bad).
  `crlf-sweep` and `spdx-sweep` already own those axes.
- **One real gap on the axis nothing measured**: of 23 modules carrying a
  `controls` verb, 22 are reached by the gate once `npm run` is expanded
  transitively. The one that is not is `checker/live-sweep.mjs`, and its exclusion
  is correct — it spawns a fresh headless `claude -p` session per installed name,
  131 of them. The reason is recorded only in its header prose, which is the
  `LAW.RER.3` shape: kept for a reason nothing can read.
- **I produced two false findings on the way here and caught both.** A first pass
  reported 21 modules "not in gate" — the gate string contains `npm run
  controls:slop`, not the file path, so the grep could not match. A second reported
  "dead exports" that were used inside their own file or by commands outside
  `lib/`. Neither is a finding. This is the third and fourth false positive of this
  release, after the diff arm's eleven and the retenue arm's two.
- **The claims arm has a measured blind spot**: 3 comment lines carry a verb and a
  named reader; 2 are invisible to it because the subject is a parameter entity
  (`command-info-types`) rather than a declared `LAW.*`/`RECORD.*` name, and because
  the reader is reached through one import hop. Both of those lines are true. The
  arm is a floor.

## Current State and Trends

7.1.0 is tagged at `01b8f4c`, installed, gate green locally and in a fresh clone.
The direction for the next major is now specific rather than aspirational: a driver
DTD with switch entities, of which `cross-os.dtd` would be the first consumer — an
OS profile that is `INCLUDE` on the platform being certified and `IGNORE`
elsewhere, resolved at build time and visible in the built artifact instead of
hidden in a checker branch.

## Key Takeaways

1. **We borrowed DITA's philosophy and never saw the other one.** DITA uses
   conditional sections in 2.5% of its files; SVG in 61%, TEI in 35%. Our resolver
   has always supported the mechanic we never used.
2. **XHTML 1.1's driver is the missing piece**, and we already have its other half:
   a flat build proven against modular sources.
3. **Every unknown from the two prior studies is closed by measurement**, including
   NDATA under a second parser: expat 2.7.3 parses the subset and reports
   `NOTATION: ['untrusted-text']`, `NDATA: [('user-args','untrusted-text')]`.

## Remaining Unknowns

- [ ] Should `checker/live-sweep.mjs` stay outside the gate? (assumed: yes — 131
      headless sessions is real API spend and nondeterministic in CI; the action is
      to record the reason where an instrument reads it, not to wire it in)
- [ ] Do the `L1`–`L8` verb numbers assigned during the state repair match their
      author's intent? (assumed: the rung each row's own text describes; all are
      `done`, so none affects any computed class — only the operator can confirm)
- [ ] Is a WSL2 substrate reachable on this machine? (assumed: unknown until
      `wsl --install` runs and reboots; still not attempted, so no `LAW.XOS.*` is
      written — the previous study's condition still binds)

## Implementation Context

<claude_context>
<application>
- when_to_use: composing a grammar that must ship in more than one profile; ranking
  a corpus by a mechanic rather than by reputation
- when_not_to_use: a fixed deliverable format with nothing optional — DAISY and
  OpenDocument correctly use no switches at all
- prerequisites: a resolver that flattens conditional sections (we have one,
  measured), and a build step that proves the flat artifact matches its sources
</application>
<technical>
- libraries: none; `lib/dtd.mjs` flattenConditionals, `checker/regression-extention-retenue.dtd` as the first consumer
- patterns: switch entity above each optional module; attribute pool split from
  element declarations; driver plus flat build, both shipped, both checked
- gotchas: a grep for a file path will not find it behind `npm run <script>` —
  expand scripts transitively; an export used only within its own file is not dead;
  DITA's density is low because it composes by redeclaration, not by switches
</technical>
<integration>
- works_with: the existing `build --check` duality, `.rot-lists` constraint modules
  (already DITA-derived), `contract-audit.mjs`
- conflicts_with: unconditional inlining — a driver is meaningless if the installer
  ignores the switches
- alternatives: DITA-style redeclaration, which we already use for the lists
</integration>
</claude_context>

**Next Action:** plan — a driver DTD with switch entities for the next major, with
`cross-os.dtd` as its first consumer; and record why `live-sweep.mjs` sits outside
the gate in a form an instrument can read.

## Sources

- [file] `xhtml11/dtd/xhtml11.dtd` — 323 lines, the module driver — 2026-09-05
- [file] `xhtml11/dtd/xhtml11-flat.dtd` — 4689 lines, the flat build — 2026-09-05
- [file] `xhtml11/dtd/xhtml-math-svg-flat.dtd` — 15,405 lines, three grammars composed — 2026-09-05
- [file] `tei/core.dtd`, `tei/core-decl.dtd` — per-element switch, attribute-pool split — 2026-09-05
- [command] conditional-section density per family (`grep -rlE '<!\[[[:space:]]*%…'`) — svg 33/54, tei 21/60, docbook 18/116, dita 4/159 — 2026-09-05
- [command] licence scan of each family's own headers — DITA: IBM+OASIS; TEI: BSD+CC; JATS: NLM/public domain — 2026-09-05
- [command] `find JATS-DTDs -type f` — 81 `.ent` of 90 DTD-family files — 2026-09-05
- [measurement] crafted sweep, 82 files: 0 BOM, 0 CR, 0 control bytes, 0 missing SPDX, 0 syntax failures — 2026-09-05
- [measurement] 23 modules with a `controls` verb, 22 reached by the transitively expanded gate, 1 not (`checker/live-sweep.mjs`) — 2026-09-05
- [run] `python3 -c "xml.parsers.expat …"` — expat 2.7.3, parsed ok, NOTATION and NDATA both reported — 2026-09-05
- [command] `grep -n 'nestingOf' bin/adiutor.mjs` — imported at :36, called at :357 — 2026-09-05
- [note] the two-schools framing is reasoning over the measured densities, not a claim any corpus file makes about itself
