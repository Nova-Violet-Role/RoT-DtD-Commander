<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Word ordinals in a real directory

`SKILL.md` gives the prefixes and the laws. This file is what happens when they meet a
filesystem.

## Why anyone does this

A digit is a slot; a word is a name. `03-extraction.md` says *third file*.
`tri-extraction.md` says *the extraction stage*, and the ordinal rides along without
claiming to be the point. In a set whose members are conceptually ordered but not
sequentially executed — chapters, tiers, layers, phases — the word form reads better
in prose: "see the tri- stage" is a sentence, "see 03" is a coordinate.

It is also a strong visual signal that the set is closed and deliberate. A directory of
`mono-` through `nona-` looks designed. A directory of `1.md` through `9.md` looks
generated.

## The one thing that will bite you

Word ordinals do not sort. This is not a preference; it is the entire practical
difference between the two schemes.

```
deca-summary.md          10   <- first
di-method.md              2
hexa-results.md           6
mono-intro.md             1   <- fourth
tri-data.md               3
```

Every tool that lists files sorts alphabetically by default: a shell listing, a file
picker, a Git status, a rendered directory index, a documentation site nav. All of them
will show 10 before 2 and 6 before 1, and none of them will warn you.

There is no word set that fixes this. `deca` really does precede `di`. The prefixes
were designed to be spoken, not collated.

## The fix: a numeral key, a word name

```
01-mono-intro.md
02-di-method.md
03-tri-data.md
06-hexa-results.md
10-deca-summary.md
```

The numeral is the sort key. The word is the name. Both jobs are done by the thing
suited to it, and the file still reads as *the tri- stage* in prose.

Pad to the width of the largest number the set will ever hold, not the largest it holds
today. A set that grows past 99 with two-digit padding needs a rename of every member,
which is exactly the event the padding existed to prevent.

## When the prefix can stand alone

Drop the numeral only when the order is carried somewhere a sort cannot break:

- an index file or table of contents that lists the members explicitly
- front matter with an `order:` field the renderer reads
- a build manifest that names the sequence
- a set small enough and famous enough that the reader knows it by heart

If none of those hold, the numeral leads.

## Insertion, and why renumbering is a trap

A set with a numeral key invites renumbering, and renumbering is a rename of every
link into the set. Bookmarks, cross-references, anchors, external URLs, a colleague's
notes: all of them break, and none of them break loudly.

So: **an ordinal, once assigned, stays with its file.** A document that belongs
conceptually between 3 and 4 takes the next free number at the end. If the reading
order genuinely matters more than the identity, carry the reading order in an index and
let the ordinals be identities.

If a renumber is truly unavoidable, do it once, in one commit, with a redirect table
written down.

## Where to stop

The word form degrades faster than the digit form:

| Range | Verdict |
|-------|---------|
| 1 to 12 | Ideal. Short words, instantly read. |
| 13 to 20 | Fine. `pentadeca-` is long but legible. |
| 21 to 99 | Give the digits beside the word on first use. `docosa- (22)`. |
| 100 and up | Use digits. `hexaoctacontatetracta-` is correct and unusable. |

A set that is likely to outgrow twenty members should start with digits. Converting a
word-numbered set to digits later is the same rename-everything event described above.

## Collisions to expect

- **Real chemistry.** `octa`, `deca`, `hexadeca` are chemical morphemes. In a
  repository that also discusses chemistry, a grep for the ordinal returns the
  chemistry, and vice versa.
- **`di-` and `mono-` as English prefixes.** They appear inside ordinary words
  (`dimension`, `monitor`), so a prefix search needs the trailing hyphen or a word
  boundary.
- **Spelling variants.** `icosa-` versus `eicosa-` for 20 is a genuine fork in the
  literature. Choose one in a project note and stay with it, or a member of the set
  becomes unfindable.
- **Case and collation.** Keep every prefix lowercase. Mixed case adds a second
  ordering that differs between locales and filesystems.

## A worked directory

A nine-part specification, ordered, stable, and sortable:

```
docs/spec/
  00-index.md              the order lives here, so it is exempt
  01-mono-scope.md
  02-di-vocabulary.md
  03-tri-grammar.md
  04-tetra-trust.md
  05-penta-laws.md
  06-hexa-checker.md
  07-hepta-install.md
  08-octa-migration.md
  09-nona-appendix.md
```

Add a tenth part and it becomes `10-deca-glossary.md` — appended, not inserted, and the
sort still holds. Add a section that belongs after `tri-` and it becomes
`11-undeca-examples.md`, listed in its right place by `00-index.md` and numbered by
when it arrived.
