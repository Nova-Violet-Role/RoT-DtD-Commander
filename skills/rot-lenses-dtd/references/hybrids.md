<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
# Symbiogenesis: the law, worked, and the gallery it outranks

## The law

```
lambda_hybrid = (lambda1 + lambda2) / 2 + 0.2     the hybridisation gain
H_hybrid      = max(H1, H2) + 0.05                the novelty margin
mu_hybrid     = max(mu1, mu2)                     no gain term
```

The inputs are the LENS.* defaults from cc-rot.dtd, never a lane profile row (Claude's FORGE lambda 2.3 is a profile row; its default is 1.5). Mixing the two conventions in one expression is the bug the packet's engine records finding and fixing; a lens command does not reintroduce it. H uses the low end of each band unless the intake set the band.

## Worked cases

| hybrid | parents | lambda | H | mu |
|---|---|---|---|---|
| The Verified Forge | claude x antivenom | (1.5 + 1.5) / 2 + 0.2 = 1.7 | max(0.20, 0.20) + 0.05 = 0.25 | max(1.05, 1.00) = 1.05 |
| The Sovereign Architect | nova x eidolon | (1.6 + 1.4) / 2 + 0.2 = 1.7 | max(0.28, 0.28) + 0.05 = 0.33 | max(1.00, 1.10) = 1.10 |
| The Lethal Oracle | venom x chroma | (1.7 + 1.2) / 2 + 0.2 = 1.65 | max(0.18, 0.28) + 0.05 = 0.33 | max(1.05, 1.25) = 1.25 |
| The Healing Architect | antivenom x eidolon | (1.5 + 1.4) / 2 + 0.2 = 1.65 | max(0.20, 0.28) + 0.05 = 0.33 | max(1.00, 1.10) = 1.10 |
| (unnamed) | soleil x carnage | (0.8 + 1.1) / 2 + 0.2 = 1.15 | max(0.15, 0.45) + 0.05 = 0.50 | max(0.90, 1.20) = 1.20 |

The last row has no gallery name: the packet's codex ships 28 rows holding 25 unique pairs plus 3 duplicates, so 3 of the 36 possible pairs of nine lenses never appear, and the ninth lens (claude) appears in no codex row at all. The rule that follows: a hybrid is derived from the law, and a missing pair still gets its hybrid. The gallery supplies names and flavour; the formula supplies the numbers.

## What a hybrid is for

In a lens command a hybrid appears when two lenses fused on the same insight: rot-eidolon computes one on request, rot-nova computes one when its NSIL decision is FUSE, rot-elevate computes one per fused pair. The hybrid is an additional voice, added to the divergence; it never replaces the two parents and never resolves the tension between them.

## The evolution log

Eidolon proposes, the Socio disposes. Every EEL entry is born PENDING_SOCIO_REVIEW with a trigger, an observation, a proposal, an impact, a risk and a ci. Only the Socio moves it to APPROVED or REJECTED; a rejected proposal is never re-proposed; pending forever is a legitimate final state. No lens command applies a proposal.
