<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep Dive: the .dtd-file-examples Corpus, Mechanic by Mechanic, Ranked

Date: 2026-09-05 · Depth: comprehensive · Use: drive 7.1.0 and the 8.0.0 cross-os.dtd
Subject: `cc-resources/.dtd-file-examples/` — 2219 files, 17 top-level collections
Method: construct census by `grep -lE` over the 767 DTD-family files, compared against
our own 20 files in `dtd/`

## Strategic Summary

The professional corpus runs on one mechanic above all others — the parameter entity,
in 618 of 767 files — and on a second we have never once used: the conditional-section
module switch, in 90 files, which is exactly the shape `cross-os.dtd` needs. The
mechanic we lean on hardest, NDATA, appears in **zero** files of the entire corpus, so
our trust boundary is either the project's real invention or its most unexamined
assumption. Ranked by what would change our codebase most, the order is: conditional
sections, parameter entities, ID/IDREF, PE-in-ATTLIST, and everything else.

## The corpus, measured

| collection | files | what it is |
|---|---|---|
| `org.oasis-open.dita.v1_3` | 656 | DITA 1.3, the deepest modularization in the tree |
| `xhtml` | 373 | XHTML modularization, the canonical driver/module split |
| `org.oasis-open.dita.v1_2` | 188 | DITA 1.2 |
| `docbook` | 169 | DocBook 4.2-4.5, the module-switch idiom in its clearest form |
| `mathml` | 144 | MathML 2/3 |
| `tei` | 102 | TEI P5, the customization-by-exclusion school |
| `JATS-DTDs` | 98 | journal article tag suite |
| `com.sophos.tocjs` | 85 | a vendor DITA specialization |
| `org.lwdita` | 76 | lightweight DITA |
| `org.dita.specialization.dita11` | 76 | DITA 1.1 specialization |
| `xhtml11` | 67 | XHTML 1.1 |
| `svg` | 55 | SVG 1.0/1.1 |
| `com.elovirta.ooxml` | 35 | OOXML-to-DITA |
| `org.oasis-open.xdita.v0_2_2` | 34 | XDITA |
| `office` | 27 | OpenDocument |
| `dtds` | 12 | assorted |
| `daisy` | 12 | DAISY/OEB talking books |

By extension: 531 `.xsd`, 342 `.ent`, 239 `.rng`, 216 `.dtd`, 210 `.mod`, 156 `.html`,
107 `.xml`, 98 `.rnc`, 80 `.xsl`, 48 `.gif`, 34 `.jar`, 30 `.sch`.

The DTD-family subset this census reads is `.dtd` + `.mod` + `.ent` = **767 files**
(measured, `find -type f`). The `.xsd`/`.rng`/`.rnc`/`.sch` files are the other schema
languages the same standards ship in parallel — evidence in themselves, addressed in
*Limitations*.

## The census

Files containing each construct, out of 767 corpus files and 20 of our own `dtd/*.dtd`:

| # | mechanic | corpus | corpus % | ours | ours % | verdict |
|---|---|---|---|---|---|---|
| 1 | `<!ENTITY %` parameter entity | **618** | 81% | 5 | 25% | **we underuse it** |
| 2 | external PUBLIC identifier | 353 | 46% | 0 | 0% | n/a — we ship no public catalog |
| 3 | ID / IDREF / IDREFS | 214 | 28% | 1 | 5% | **we underuse it** |
| 4 | PE in an ATTLIST AttType | 197 | 26% | 2 | 10% | **we underuse it** |
| 5 | NMTOKEN / NMTOKENS | 138 | 18% | 7 | 35% | in proportion |
| 6 | `#FIXED` | 127 | 17% | 11 | 55% | deliberate excess (the trust attribute) |
| 7 | `EMPTY` content model | 108 | 14% | 8 | 40% | in proportion |
| 8 | **conditional section** `<![ %x; [` | **90** | 12% | **0** | **0%** | **the one mechanic we have never used** |
| 9 | mixed content `(#PCDATA\|…)` | 83 | 11% | 1 | 5% | in proportion (we forbid it by dialect) |
| 10 | namespace-prefix PE | 36 | 5% | 0 | 0% | n/a — no namespaces here |
| 11 | external SYSTEM identifier | 18 | 2% | 20 | 100% | our whole include mechanism |
| 12 | `<!NOTATION` | 13 | 1.7% | 2 | 10% | deliberate excess |
| 13 | `ANY` | 7 | 0.9% | 0 | 0% | correctly avoided |
| 14 | ENTITY / ENTITIES attribute type | 5 | 0.7% | 0 | 0% | correctly avoided |
| 15 | **NDATA** | **0** | **0%** | 4 | 20% | **no precedent anywhere** |

## The ranking

### 1. Conditional sections — the highest-value mechanic we do not have

DocBook and TEI switch whole modules on and off with a two-line idiom (measured,
verbatim from `docbook/*/dtd/*.mod`):

```
<!ENTITY % ISOamsa.module "INCLUDE">
<![ %ISOamsa.module; [
  ...the module...
]]>
```

A downstream author overrides `ISOamsa.module` to `"IGNORE"` *before* the include and
the entire block vanishes at parse time. This is how 90 corpus files let one grammar
serve many profiles without forking.

We already know this exists and named it: `dtd/cc-args.dtd:52` declares
`ARG.embed.section` as *"as a switch: a flag word sets a conditional-section keyword,
INCLUDE or IGNORE, declared before the include"* — a declared embed class with **zero
uses in `dtd/`** (measured). The mechanic is documented in our own contract and never
once exercised.

**Why it matters now:** this is the exact shape `cross-os.dtd` needs. A law block that
is `INCLUDE` on the OS being certified and `IGNORE` elsewhere is a conditional section,
not a runtime branch — and because the installer resolves PEs at build time, the OS
profile would be visible in the built artifact rather than hidden in a checker.

```
<!ENTITY % xos.macos "IGNORE">
<![ %xos.macos; [
  <!ENTITY LAW.XOS.4 "macOS is certified on Apple hardware only...">
]]>
```

### 2. Parameter entities — 81% of the corpus, 25% of us

618 of 767 files declare at least one. We declare them in 5 of 20. The corpus uses them
for four jobs we currently do by hand: naming a reusable content model, naming an
attribute type (see #4), naming a module switch (see #1), and naming a set of elements
that several models share. Our `%ask.rounds`, `%ask.adds`, `%ask.impactfuls` and
`%command-info-types` are the right idea applied in four places where the corpus would
apply it in forty.

### 3. ID / IDREF — 28% of the corpus, one file of ours

The corpus uses `ID` to make cross-references checkable *by the parser*. We check
references in `checker/contract-audit.mjs` instead — code doing a job the grammar could
do. Not urgent, but it is the clearest case where we wrote a checker for something DTDs
already enforce.

### 4. PE in an ATTLIST AttType — 26% of the corpus, now 2 of ours

DocBook 4.x `dbpoolx.mod` writes `colsep %yesorno; #IMPLIED` — the attribute's *type*
comes from a parameter entity. Companion pass 28 used exactly this construct for the
gate's new `adds` and `impactfuls` attributes, which is why it was worth confirming
against the corpus before writing it: it is ordinary practice, not a trick.

### 5. `#FIXED` — we use it 3x more heavily than the corpus, on purpose

17% of the corpus, 55% of our files. `#FIXED` is how `trust (cdata) #FIXED "cdata"`
makes the trust boundary a thing a stock validator can judge. Proportionally our
signature construct, and correctly so.

### 6-13. Everything else is in proportion or correctly avoided

`NMTOKEN`, `EMPTY` and mixed content sit within a factor of two of corpus practice.
`ANY` (7 files) and the `ENTITY`/`ENTITIES` attribute type (5 files) are rare in the
corpus and absent from us — the corpus agrees they are a bad idea.

### 15. NDATA — zero precedent, and that is the headline

`NDATA` appears in **0 of 767 files**. `<!NOTATION` appears in 13, always to name an
image or a processing format, never to classify trust. Our four NDATA channels
(`user-args`, `tool-result`, `file-ref`, `ask-answer`) and the notations behind them are
without precedent in DocBook, DITA, TEI, JATS, MathML, SVG, XHTML, OpenDocument or
DAISY.

Two honest readings, and the evidence does not choose between them:

- **The invention reading.** Those corpora describe *documents*, where nothing arrives
  from an adversary at parse time. A prompt does. Repurposing NOTATION/NDATA from
  "here is a format the parser will not read" to "here is a stream the model must not
  obey" is a real extension of the notation, and it is the project's most original idea.
- **The warning reading.** A construct nobody in thirty years of production DTD work
  used this way has no accumulated tooling, no validator that understands the intent,
  and no community to catch a mistake in it. The four channels are enforced by rule C7
  in our own checker and by nothing else on earth.

Both are true. The mitigation is not to abandon it but to keep C7's control planted and
failing on purpose, because it is the only instrument in the world that reads this.

## What to do with this

1. **Build `cross-os.dtd` on conditional sections**, not on runtime branching, and make
   it the first use of `ARG.embed.section` — a declared class with no uses is the same
   defect class as pass 26's "six laws that governed nothing".
2. **Raise parameter-entity use** where a content model or attribute type repeats. The
   driver-file pattern (LAW.ASK.11) is already this idea; the corpus says apply it far
   more widely.
3. **Leave NDATA alone and keep its control armed.** It is unprecedented, it is load
   bearing, and C7 is its only witness.
4. **Consider ID/IDREF** for the cross-reference checking `contract-audit.mjs` does by
   hand — a later release, not 7.1.0.

## Limitations and Edge Cases

- **The census counts files, not occurrences.** A file using parameter entities four
  hundred times counts once. It measures adoption breadth, never intensity.
- **531 `.xsd`, 239 `.rng` and 98 `.rnc` files sit beside the DTDs**, which is itself a
  finding: every one of these standards also ships XSD and RELAX NG, because DTDs cannot
  express datatypes or namespaces. We are DTD-only by choice; the corpus is DTD-first
  and schema-also. That constrains what we should ever try to express in a DOCTYPE.
- **`grep -lE` over `.dtd`/`.mod`/`.ent` is a text search, not a parse.** A construct
  inside a comment counts. The counts are upper bounds, and the two that matter most
  (NDATA at 0, conditional sections at 90) are robust to that: zero cannot be inflated,
  and the conditional-section pattern was read verbatim from DocBook and TEI.
- **`org.oasis-open.dita.v1_3` alone is 656 files**, 30% of the corpus, so DITA
  practice is over-represented in every percentage above.

## Sources

- [command] `find . -type f | wc -l` in `cc-resources/.dtd-file-examples` — 2219 — 2026-09-05
- [command] `find . -type f \( -name '*.dtd' -o -name '*.mod' -o -name '*.ent' \) | wc -l` — 767 — 2026-09-05
- [command] `grep -lE '<!ENTITY[[:space:]]+%' …` over the 767 — 618 — 2026-09-05
- [command] `grep -lE '<!\[[[:space:]]*(%[A-Za-z._-]+;|INCLUDE|IGNORE)' …` — 90 — 2026-09-05
- [command] `grep -lE 'NDATA' …` — 0 — 2026-09-05
- [command] `grep -lE '<!NOTATION' …` — 13 — 2026-09-05
- [command] `grep -lE '<!ATTLIST[^>]*%[A-Za-z._-]+;' …` — 197 — 2026-09-05
- [file] `docbook/*/dtd/*.mod` — the `ISOamsa.module` INCLUDE/IGNORE idiom, read verbatim — 2026-09-05
- [file] `docbook/4.3/dtd/dbpoolx.mod` — `colsep %yesorno; #IMPLIED` — 2026-09-05
- [file] `RoT_DtD_Commander/dtd/cc-args.dtd:52` — `ARG.embed.section` declared, unused — 2026-09-05
- [measurement] our own `dtd/*.dtd` census, 20 files, same patterns — 2026-09-05
- [note] the invention-versus-warning reading of NDATA is reasoning about the absence, not a measurement of consequences
