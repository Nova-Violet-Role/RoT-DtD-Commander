<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# The corpus study: 150 DTD files and the five `$` documents

What was read, what each file family solved, and the four mechanisms 7.0.0
took from them. Two of the findings changed code the same day.

## Strategic summary

The list family did not need inventing. DITA had already solved every part of
it: a constraint module is a blacklist, `subjectScheme` is a whitelist, DITAVAL
is the whole three-class vocabulary with a fourth class we do not have, and the
`.ent`/`.mod`/driver split is why entries can live apart from the grammar that
reads them. The `$` documents then supplied the failure mode: an entry name
arriving from an argument and reaching a declaration, which is exactly what
`lib/list.mjs` did until this study caught it.

## Key questions

- What did each of the 150 files actually declare, and by what mechanism?
- Which mechanisms does the list family need, and where were they already solved?
- What do the `$` documents say that bears on a command taking filetypes from arguments?

## Overview

`cc-resources/.dtd-file-examples` holds 1,660,566 bytes across 150 files: 59
`.dtd` drivers, 55 `.ent` entity sets, 35 `.mod` grammar modules, 1 `.dita`.
Seven families are present.

| family | files | what it is |
|---|---:|---|
| DITA 1.3 (OASIS) | 97 | topic/task/concept/reference/glossary/learning/bookmap, their domains and constraints |
| MathML 2 and 3 | 9 | `mathml3.dtd` (193 elements), the qname module, the DITA driver |
| ISO entity sets | 20 | `isoamsa` … `isotech`, 1,724 named character entities |
| SVG 1.1 | 3 | `svg11-flat-20110816.dtd`, 1,168 entities in one flat file |
| DocBook 4 | 2 | `docbook.dtd`, 362 elements and 362 ATTLISTs |
| small vocabularies | 17 | RSS, GTK (gschema, language, menubar, toolbar, statusbar, accelerator), RFC presence/watcherinfo/reginfo, TEI certainty/gaiji/datatypes, CALS tables, corpus, edoc, figures, analysis, library, libraries, image |
| our own | 2 | `rot-voice.dtd` (9 lens rows), `trust_contract.dtd` (the verdict strings) |

`artifacts/_sweep/byproducts` holds five documents, 86,608 bytes: the `$`
arguments matrix, its DTD variants, the sigil catalogue with ten ranked topics
and a cross-context collision table, the polyglot examples, and the Greek
numbers.

## How it works

**The four-layer split (measured, `task.dtd` lines 54–89).** A DITA driver
declares one parameter entity per module with a PUBLIC identifier and a system
path, then invokes them in order: the `-dec` entities pull `.ent` files
(declarations), the `-def` entities pull `.mod` files (grammar). Nothing is
inlined; a vocabulary is a file you name. This is why `.rot-lists/*.dtd` holds
entries while `cc-list.dtd` holds none of its own — the entries are the `.ent`
layer and the subset is the `.mod` layer.

**The constraint module is a blacklist (measured, `strictTaskbodyConstraint.mod`,
`machineryTaskbodyConstraint.mod`).** It declares no element and no attribute.
It declares eleven parameter entities and then redeclares `%taskbody.content;`
with fewer alternatives than the base module would have given it. Because the
first declaration of a parameter entity binds, a constraint loaded *before* the
base module narrows the grammar without editing it. A blacklist is that shape:
it removes options from a set someone else defined.

**`subjectScheme` is a whitelist (measured, `subjectScheme.mod`, 19 elements,
58 entities).** `subjectdef`, `enumerationdef` and `attributedef` bind an
attribute's legal values to a taxonomy that lives outside the grammar, so the
allowed set changes without the DTD changing. A whitelist is that: the values
are data, the rule that they are the only values is declaration.

**DITAVAL is the whole class vocabulary, and it has a fourth (measured,
`ditaval.dtd`).** The filtering grammar declares:

```
<!ATTLIST prop
  att       CDATA #IMPLIED
  val       CDATA #IMPLIED
  action    (flag|include|exclude|passthrough) #REQUIRED
  ...>
<!ELEMENT val (style-conflict?, (prop | revprop)*)>
```

`exclude` is our black, `flag` is our gray, `include` is our white. The fourth,
`passthrough`, has no counterpart in 7.0.0: it means the processor leaves the
content alone and emits it unjudged, which is different from allowing it. And
`style-conflict` is a declared resolution for two flags landing on the same
content — DITA resolves collisions, where our reachability guard refuses them.
Ours is the stricter choice and it is deliberate, but the corpus shows the
other design exists and is twenty years old.

**The class attribute is provenance (measured, `task.mod`).** Every specialized
element carries `class CDATA "- topic/li task/step "`: its whole ancestry as a
string, so a processor that knows only `topic/li` can still handle a `step`.
Our `scope`/`class` `#FIXED` attributes are the same idea at one level — a file
that claims to be something else is invalid against its own declaration.

**The `$` documents supply the threat model (measured,
`$SIGIL_VARIABLES_VARIANTS.md` TOPIC 10).** Log4Shell, `${IFS}` space-less
injection, `${var@P}` prompt-expansion RCE, GitHub Actions `${{ }}` textual
substitution before the shell runs. The common shape: untrusted text reaching
a place that evaluates or parses it. A list command takes a filetype from
`$ARGUMENTS` and writes it into a declaration. That is the same shape.

**Claude Code is 0-based (measured, TOPIC 9).** `$0` is the first argument and
`$1` the second, which inverts the shell habit. `dtd/cc-args.dtd` makes no
1-based claim, so nothing in this repository was wrong; the trap is recorded
here so the next command written does not import the habit.

## History and context

The corpus is not decoration. DITA 1.3 shipped in 2015 after a decade of
specialization work; `strictTaskbodyConstraint.mod` exists because OASIS needed
a way for a publisher to forbid a construct without forking the grammar. That
is the exact problem a blacklist has. Reading the file was faster than
re-deriving the answer, and the answer is better than what an afternoon would
have produced: the first declaration binds, so a narrowing loads first.

## Patterns and best practices

- **Steal the mechanism, name the file.** Each borrowed pattern in
  `dtd/cc-list.dtd` names its source in a comment, so a reader can go and check.
- **Declarations apart from grammar.** The `.ent`/`.mod` split is what makes a
  per-repository list possible at all.
- **A narrowing loads first.** First-declaration-binds is the whole constraint
  mechanism, and it is the same rule `LAW.ASK.11` uses to raise the rounds.
- **Validate before a declaration, not after.** The read pattern was already
  strict; the write was not, and the gap was the bug.

## Limitations and edge cases

- **We have three classes where DITAVAL has four.** `passthrough` — emit it,
  judge nothing — is a real state a repository might want for vendored code.
  Not built; recorded for 7.1.0.
- **We refuse collisions where DITAVAL resolves them.** A `style-conflict`
  equivalent would let two rules land on one entry with declared precedence.
  Our refusal is stricter and louder; the alternative is worth knowing.
- **The ISO entity sets were read as an inventory, not line by line.** 1,724
  named characters across 20 files, each a flat list of
  `<!ENTITY name "&#x...;">`; the mechanism is one line repeated and was read
  once per file, not 1,724 times.
- **`svg11-flat-20110816.dtd` is the counter-example.** 185 KB in one file with
  1,168 entities and no module split at all — the shape the `.ent`/`.mod`
  discipline exists to avoid, kept here as the thing not to do.

## Current state and trends

Two findings from this study changed code the same day:

1. **The injection.** `writeList` wrote an entry name straight into
   `<!ENTITY LIST.entry.<name> "...">`. A name of `x"> <!ENTITY evil "pwned`
   closed the declaration and opened a forged one; the real entry then read
   back as nothing, silently. Fixed: `NAME = /^[A-Za-z0-9_][A-Za-z0-9_-]{0,63}$/`
   is checked before any write, the refusal uses the family's own grammar, and
   a control plants that exact payload.
2. **The field separator.** A reason carrying `|` or `"` corrupted the record.
   Fixed: `fold()` maps `|` to `/` and `"` to `'`, with a control that reads
   the folded value back.

`node lib/list.mjs controls`: 19 run, 0 failing.

## Key takeaways

1. Every mechanism the list family needed was already in the corpus, and each
   one is now cited by the file it came from.
2. DITAVAL has a fourth class and a conflict resolution we chose not to have;
   knowing that makes our two omissions deliberate rather than accidental.
3. The `$` catalogue is a threat model, and applying it to code written the
   same morning found a live injection.

## Remaining unknowns

- [ ] Should `passthrough` become a fourth class? (assumed: no for 7.0.0, and
      recorded as the first candidate for 7.1.0)
- [ ] Should a `style-conflict` equivalent replace the refusal for two rules on
      one entry? (assumed: no — a refusal that names both entries is louder
      than a precedence rule nobody reads)

## Sources

- measurement: 150 files, 1,660,566 bytes, counted by extension and by declaration type — 2026-09-04
- file: `cc-resources/.dtd-file-examples/ditaval.dtd`, the `flag|include|exclude|passthrough` enumeration
- file: `cc-resources/.dtd-file-examples/strictTaskbodyConstraint.mod` and `machineryTaskbodyConstraint.mod`
- file: `cc-resources/.dtd-file-examples/subjectScheme.mod`, 19 elements, 58 entities
- file: `cc-resources/.dtd-file-examples/task.dtd` lines 54–89, the driver wiring; `task.mod`, the class attribute
- file: `cc-resources/.dtd-file-examples/rot-voice.dtd`, `trust_contract.dtd`, this project's own two
- file: `artifacts/_sweep/byproducts/$SIGIL_VARIABLES_VARIANTS.md`, 373 lines, ten topics and the collision table
- file: the four other byproducts, 86,608 bytes in all
- run: `node lib/list.mjs controls` → 19 run, 0 failing — 2026-09-04
- run: the injection probe against `writeList` before the fix, which wrote a forged entity and read back nothing — 2026-09-04
