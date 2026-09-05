<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep Dive: NDATA, the byproduct documents, and the version that could not be reached

Date: 2026-09-05 · Depth: comprehensive · Use: drive 7.1.0, and 8.0.0 after it
Gate: start (the argument named the work and closed with "lets get going")

## Strategic Summary

NDATA is standard XML 1.0 and a stock validator accepts our subset — measured
this session — and that is precisely why the design works; what has no precedent
in 2219 corpus files is using it to classify trust rather than file format.
Building the regression instrument surfaced a defect nobody had measured: the
release recognizer folded every past release's verbs into `kept`, so after
7.0.0's verb 15 it could compute nothing but `major` for ever. 7.1.0 shipped only
because that was fixed.

## Key Questions

- Is NDATA our invention, and does the answer strengthen or weaken the design?
- What do the three `$` byproduct documents actually contribute to the codebase?
- What does the TEI family teach that the top-level corpus did not?
- Was any of the remaining 7.1.0 work blocked, and by what?

## Overview

The session's argument asserted that NDATA is a new parameter we created for DTD.
That is not so, and the correction matters because it inverts the risk. `NDATA`
is production `NDataDecl` of XML 1.0, in the specification since 1998. Measured:
a document whose internal subset declares `<!NOTATION untrusted-text SYSTEM …>`
and `<!ENTITY user-args SYSTEM "arguments" NDATA untrusted-text>` returns
**valid, exit 0** from `xmlstarlet val -e`.

Had we invented the keyword, no off-the-shelf validator would parse it and
`cc-core.dtd`'s stated goal — "trust travels as a FIXED attribute so a stock XML
validator can judge a rendered answer" — would be unreachable. The invention is
the *semantics*: NDATA names a stream a parser will not read, and we repurposed
it to name a stream the model must not obey. Across 2219 files of DocBook, DITA,
TEI, JATS, MathML, SVG, XHTML, OpenDocument and DAISY, `NDATA` appears **zero**
times, in any extension. The keyword is everyone's; the use is ours alone.

## How It Works

- **NDATA is spec-legal.** [measured] `xmlstarlet val -e` on the planted document
  returns `valid`, exit 0.
- **No corpus file uses it.** [measured] `grep -rl 'NDATA' .` over all 2219 files
  returns 0. `<!NOTATION` appears in 13, always naming an image or a processing
  format.
- **The byproduct documents are the design source, not notes.**
  `$ARGUMENTS_VARIANT_EXAMPLES_DTD_VARIANTS.md` §4 is a PCDATA/CDATA/NDATA
  comparison matrix whose rows are the trust classes `cc-core.dtd` declares, down
  to the shell analogy: `<<EOF` expanded, `<<'EOF'` literal, a file reference not
  read. §5 is an NDATA deep dive. [measured, read]
- **Its §4.1 hazard is already implemented as guards.** [measured] The `]]>`
  collision is caught at `lib/form.mjs:107` ("a section close inside a CDATA
  section"), controlled at `form.mjs:148` and `amplify.mjs:520`, and
  `ai-slop.mjs:516` asserts a refusal carries no CDATA at all. The one place that
  emits a real CDATA section, `lib/schematic.mjs:154`, interpolates `ph(p)` =
  `[name]` from schema part names, never user input.
- **`lib/args.mjs` reads its verbs from the DTD.** [measured] `--verbose`,
  `--debug` and `--` come from `dtd/cc-args.dtd`, and all four injection guards
  (evaluation, traversal, system, pentity) fire on their fixtures, exit 0.
- **The recognizer computes the version.** [measured] `recognize(kept, from)`
  takes the top verb of the kept rows: ≥14 major, ≥9 mid, else minor, with
  increments 1.0.0 / 0.1.0 / 0.0.1.

## History and Context

TEI is the deepest teacher in the corpus and was not visible from the top level.
Its 60 `.dtd` files pair `X-decl.dtd` (the attribute pool) with `X.dtd` (the
elements) — the same split as our `dtd/cc-*.dtd` subsets against the command
files. But TEI goes further than we do in two ways [measured, read from
`tei/core.dtd`]:

```
<!ENTITY % abbr 'INCLUDE' >
<![ %abbr; [
<!ELEMENT %n.abbr; %om.RR; %macro.phraseSeq;>
]]>
```

Every element sits in its own conditional section, so a downstream author
disables any single element by flipping one parameter entity; and `%n.abbr;`
parameterizes the *element name itself*, so a customization can rename it.

We had the machinery for the first of those and had never used it.
`lib/dtd.mjs:73` has carried `flattenConditionals()` since before 7.0.0, with the
comment "no `commands/*.md` carries one" — and no `dtd/*.dtd` did either.
Measured this session: INCLUDE keeps its content, IGNORE drops it, and a nested
IGNORE inside an INCLUDE drops only the inner. The resolver works. 7.1.0's new
DTD is the first file in the repository to reach it.

## Patterns and Best Practices

- **Check an instrument before trusting its first green.** The regression diff
  arm reported eleven declarations removed from v6.0.0..v7.0.0; all eleven were
  still declared at v7.0.0. A minus line is a rewrite as often as a removal.
- **Look both ways for a recorded reason.** The retenue arm called
  `LAW.COMPANION.1` and `.2` vestigial by reading only upwards;
  `companion-audit.dtd` records which instrument holds which law *below* them.
- **Append, never insert.** The state record's new `run` column goes after `why`,
  so a reader predating it still finds `why` at column seven (LAW.REC.2).
- **A rewrite drops what the parser never read.** `writeState` re-emits
  `readState`'s rows, so eight malformed `L1`–`L8` rows vanished when I rewrote
  the file. Restoring them in parseable shape closed the reason they were
  invisible.

## Limitations and Edge Cases

- **The corpus census counts files, not occurrences.** Adoption breadth, never
  intensity.
- **`grep -lE` is a text search, not a parse.** A construct inside a comment
  counts. The two load-bearing numbers survive that: zero cannot be inflated, and
  the conditional-section idiom was read verbatim from DocBook and TEI.
- **`org.oasis-open.dita.v1_3` is 656 files**, 30% of the corpus, so DITA
  practice is over-represented in every percentage.
- **The claims arm only reads comments naming this repository's own vocabulary**
  (`RECORD.*`, `LAW.*`, `ASK.*`, `ARG.*`, `GATE.*`, `STAR.*`, `COMPANION.*`,
  `RER.*`) and a reader it can open. A claim phrased outside that shape is
  invisible to it. It is a floor, not a ceiling.
- **`xmlstarlet` is the only validator on this machine**; `xmllint` is absent, so
  the NDATA acceptance is one implementation's verdict, not two.

## Current State and Trends

7.1.0 is tagged at `01b8f4c` and installed here (337 written, 0 failed, 0
verify-bad). The gate runs green in 95 s locally and 98 s in a fresh clone with
zero dependencies. The direction the evidence points for 8.0.0 is unchanged and
now better supported: `cross-os.dtd` should be built on conditional sections,
which are proven to resolve, rather than on runtime branching.

## Key Takeaways

1. **NDATA being standard is the strength, not a correction to absorb.** A stock
   validator judges our trust boundary because the keyword is everyone's; the
   trust *semantics* are what no corpus file has ever done.
2. **The version could not be reached.** `release-notes.mjs` read `kept` as every
   marked-or-done row with nothing to separate releases, so 7.0.0's verb 15 forced
   `major` for ever. The number stopped being typed in 6.0.0 and started being
   stuck instead.
3. **Two of the three new arms were caught producing false findings during their
   own first run**, and both fixes are controls now. An instrument's first green
   is a hypothesis.

## Remaining Unknowns

- [ ] Does `xmllint` also accept the NDATA subset? (assumed: yes, since the
      construct is XML 1.0 production `NDataDecl`; only `xmlstarlet` was present)
- [ ] Do the `L1`–`L8` verb numbers I assigned match what their authors intended?
      (assumed: the rung each row's own text describes; all are `done` and none
      affects a computed class)
- [ ] Would per-element conditional sections, TEI-style, suit our commands?
      (assumed: not yet — one conditional section exists as of 7.1.0, and the
      pattern earns its second use in `cross-os.dtd` before any wider roll-out)
- [ ] Does the claims arm miss claim shapes phrased outside its vocabulary?
      (assumed: yes; it is a floor, and its ten controls bound what it does catch)

## Implementation Context

<claude_context>
<application>
- when_to_use: before a release, to check claims rather than diffs; and whenever a
  comment asserts that something reads something
- when_not_to_use: as the only regression check — it reads declarations and
  comments, never behaviour
- prerequisites: a git repository with tags, and `checker/regression-extention-retenue.dtd` present
</application>
<technical>
- libraries: none; node built-ins only, zero dependencies in the whole repository
- patterns: read the verbs and severities from the DTD, never hardcode them; put
  the switchable part in a conditional section and let `flattenConditionals`
  resolve it
- gotchas: a minus line in a diff is not a removal; a recorded reason may sit
  below a declaration; `writeState` silently drops rows `readState` could not
  parse; `node -e` under shell quoting eats backslash escapes and quotes, so
  patches belong in a real file
</technical>
<integration>
- works_with: contract-audit.mjs (declarations vs use), companion-audit.sh (a
  nested session's findings), release-notes.mjs (the recognizer)
- conflicts_with: nothing measured
- alternatives: a pure diff-based detector, which would have returned green on the
  only regression v7.0.0 actually had
</integration>
</claude_context>

**Next Action:** apply — push `v7.1.0` and follow CI, then build `cross-os.dtd`
on conditional sections for 8.0.0.

## Sources

- [run] `xmlstarlet val -e` on a planted NDATA document — valid, exit 0 — 2026-09-05
- [command] `grep -rl 'NDATA' .` over 2219 corpus files — 0 — 2026-09-05
- [command] `find tei -type f` — 60 dtd, 21 rng, 21 rnc — 2026-09-05
- [file] `tei/core.dtd`, `tei/core-decl.dtd` — the per-element conditional section and the decl/module split — 2026-09-05
- [file] `artifacts/_sweep/byproducts/$ARGUMENTS_VARIANT_EXAMPLES_DTD_VARIANTS.md` §4, §5 — 2026-09-05
- [file] `artifacts/_sweep/byproducts/$ARGUMENTS_VARIANT_EXAMPLES.md` — 829 lines — 2026-09-05
- [file] `artifacts/_sweep/byproducts/$SIGIL_VARIABLES_VARIANTS.md` — 384 lines after the rewrite — 2026-09-05
- [run] `node lib/dtd.mjs` flattenConditionals, three cases — 0 failing — 2026-09-05
- [run] `node lib/args.mjs controls` — 8 pass, 4 guards — 2026-09-05
- [run] `node lib/regression.mjs controls` — 10 run, 0 failing — 2026-09-05
- [run] `node checker/release-notes.mjs --controls` — 9 run, 0 failing — 2026-09-05
- [run] `npm run gate` in a fresh `git clone` — exit 0, 98 s — 2026-09-05
- [measurement] `recognised 7.1.0 (class mid) from the kept verbs 9, 8, 8, 7, 6, 4, 3 at 7.0.0` — 2026-09-05
- [note] the invention-versus-precedent reading of NDATA's semantics is reasoning about an absence, not a measurement of consequences
