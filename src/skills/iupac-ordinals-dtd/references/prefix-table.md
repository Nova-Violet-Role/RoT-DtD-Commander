<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# The complete prefix tables

Every root needed to spell any integer from 1 to 9999. Read with `SKILL.md`, which
carries the assembly law; this file is the lookup.

## Units, 1 to 9

The composite column is what you use inside any number larger than 9.

| N | Standalone | Composite |
|---|------------|-----------|
| 1 | mono-      | hen-      |
| 2 | di-        | do-       |
| 3 | tri-       | tri-      |
| 4 | tetra-     | tetra-    |
| 5 | penta-     | penta-    |
| 6 | hexa-      | hexa-     |
| 7 | hepta-     | hepta-    |
| 8 | octa-      | octa-     |
| 9 | nona-      | nona-     |

Only 1 and 2 differ between the columns. Everything from 3 up has one form.

## 10 to 19

| N | Prefix | N | Prefix |
|---|--------|---|--------|
| 10 | deca- | 15 | pentadeca- |
| 11 | undeca- | 16 | hexadeca- |
| 12 | dodeca- | 17 | heptadeca- |
| 13 | trideca- | 18 | octadeca- |
| 14 | tetradeca- | 19 | nonadeca- |

`undeca-` for 11 is the irregular one: it is not built from `hen-`. `dodeca-` for 12
is regular, `do-` + `deca-`.

## 20 to 29

| N | Prefix | N | Prefix |
|---|--------|---|--------|
| 20 | icosa- | 25 | pentacosa- |
| 21 | henicosa- | 26 | hexacosa- |
| 22 | docosa- | 27 | heptacosa- |
| 23 | tricosa- | 28 | octacosa- |
| 24 | tetracosa- | 29 | nonacosa- |

The `i` of `icosa-` survives only in 21, because `hen-` is the only unit root ending
in a consonant. Everywhere else in the decade the root reads `-cosa-`.

## Tens, 30 to 90

| N | Prefix | N | Prefix |
|---|--------|---|--------|
| 30 | triaconta- | 70 | heptaconta- |
| 40 | tetraconta- | 80 | octaconta- |
| 50 | pentaconta- | 90 | nonaconta- |
| 60 | hexaconta- | | |

The 30s show the pattern for every later decade: 31 `hentriaconta-`,
32 `dotriaconta-`, 33 `tritriaconta-`, 34 `tetratriaconta-`.

## Hundreds, 100 to 900

| N | Prefix | N | Prefix |
|---|--------|---|--------|
| 100 | hecta- | 600 | hexacta- |
| 200 | dicta- | 700 | heptacta- |
| 300 | tricta- | 800 | octacta- |
| 400 | tetracta- | 900 | nonacta- |
| 500 | pentacta- | | |

`dicta-` for 200, not a `do-` form.

## Thousands, 1000 to 9000

| N | Prefix | N | Prefix |
|---|--------|---|--------|
| 1000 | kilia- | 6000 | hexalia- |
| 2000 | dilia- | 7000 | heptalia- |
| 3000 | trilia- | 8000 | octalia- |
| 4000 | tetralia- | 9000 | nonalia- |
| 5000 | pentalia- | | |

`dilia-` for 2000, not a `do-` form. That completes the three place roots that refuse
`do-`: 20, 200, 2000.

## The assembly algorithm

```
prefix(N):
  if N == 1: return "mono"
  if N == 2: return "di"
  u = N % 10
  t = (N / 10)  % 10 * 10
  h = (N / 100) % 10 * 100
  k = (N / 1000)% 10 * 1000
  parts = []
  if u: parts += unit_composite(u)     # hen, do, tri, tetra, ...
  if t: parts += tens(t)               # deca, icosa, triaconta, ...
  if h: parts += hundreds(h)           # hecta, dicta, tricta, ...
  if k: parts += thousands(k)          # kilia, dilia, trilia, ...
  return join(parts)                   # smallest place FIRST
```

Two corrections the loop does not express:

1. When `t == 10`, the units and tens fuse into a single 10-to-19 word from the table
   above rather than concatenating (`undeca-`, not `hen-` + `deca-`).
2. When `t == 20` and the unit root ends in a vowel, the `i` of `icosa-` elides
   (`docosa-`, not `do-` + `icosa-`).

## Worked examples

These four are taken verbatim from the source, decomposition included.

| N | units | tens | hundreds | thousands | Prefix |
|---|-------|------|----------|-----------|--------|
| 548 | octa (8) | tetraconta (40) | pentacta (500) | | octatetracontapentacta- |
| 241 | hen (1) | tetraconta (40) | dicta (200) | | hentetracontadicta- |
| 411 | undeca (11) | | tetracta (400) | | undecatetracta- |
| 9267 | hepta (7) | hexaconta (60) | dicta (200) | nonalia (9000) | heptahexacontadictanonalia- |

411 is the load-bearing one: it shows 11 collapsing to `undeca-` inside a composite,
and it shows the units-first order with nothing in the tens place.

Applying the same rules to numbers the source does not spell out:

| N | Construction | Prefix |
|---|--------------|--------|
| 35 | penta (5) + triaconta (30) | pentatriaconta- |
| 48 | octa (8) + tetraconta (40) | octatetraconta- |
| 99 | nona (9) + nonaconta (90) | nonanonaconta- |
| 101 | hen (1) + hecta (100) | henhecta- |
| 486 | hexa (6) + octaconta (80) + tetracta (400) | hexaoctacontatetracta- |

## Two other prefix series, and why they are not this one

**`bis-`, `tris-`, `tetrakis-`** multiply compound or complex features rather than
counting simple identical parts. They are formed by appending `kis` to the base
prefix, with 2 and 3 irregular. They exist to remove ambiguity in a chemical name; a
file ordinal has no ambiguity to remove and never needs them.

**`ter-`, `quinque-`, `sexi-`, `septi-`, `octi-`, `novi-`, `deci-`** count assemblies
of identical units, as in `biphenyl` and `terphenyl`. A third series again, and again
not the one used for ordinals.

## Source

Verified 2026-09-02 against the Wikipedia article *IUPAC numerical multiplier*, which
supplies every table above and the four worked examples. The four examples are quoted
from it; the second table of examples applies its stated rules to other numbers and is
derived, not quoted.
