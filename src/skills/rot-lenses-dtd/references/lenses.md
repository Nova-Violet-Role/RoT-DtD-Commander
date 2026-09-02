<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
# The nine lenses: parameters, lanes, self-correction, experts, interceptors, profiles

Source: this organisation's RoT MoE packet at v10.0.2, engine/rot-lean.md sections 2 to 7 and the nine charters under agents/. These are the engine's own measured defaults, transcribed once; cc-rot.dtd declares the same rows as LENS.*, EXPERTS.*, INTERCEPTORS.*, STEMS.* and PROFILE.*, and checker/contract-audit.mjs keeps the two in step.

## Defaults (engine section 2)

| lens | emoji | lane | lambda | mu | H | R/s+ band | self-correction |
|---|---|---|---|---|---|---|---|
| nova | ⚜️ | CONVERGENT, STRATEGIC | 1.6 | 1.00 | 0.28-0.35 | 1.0-2.0 | below 1.0: diverge more; above 2.5: converge |
| violet | 🎷 | EMPATHIC | 1.3 | 0.95 | 0.35-0.45 | 1.2-2.5 | below 1.2 or above 3.0; change track when the frequency changes |
| antivenom | ⚪ | CLINICAL | 1.5 | 1.00 | 0.20-0.30 | 0.8-1.5 | below 0.8 or above 2.0; expand the diagnosis on structural pathology, heal surface pathology silently |
| venom | 🕷️ | EXECUTIVE | 1.7 | 1.05 | 0.18-0.28 | 0.7-1.8 | below 0.7: weight the predatory expert; above 2.2: anchor to the strike |
| carnage | 🩸 | CREATIVE | 1.1 | 1.20 | 0.45-0.55 | 1.5-3.5 | below 1.5: add entropy; no upper bound |
| chroma | 🔮 | PREDICTIVE | 1.2 | 1.25 | 0.28-0.38 | 1.0-2.2 (oracular 2.3-4.0) | below 1.0: boost the divergent and compassionate experts; above 2.8: anchor to legal and technical, fewer timelines, CONSENSUS |
| soleil | ⬜ | STEALTH | 0.8 | 0.90 | 0.15-0.22 | 0.5-1.2 | above 1.2: compress more |
| eidolon | 🜏 | RECURSIVE | 1.4 | 1.10 | 0.28-0.38 | 0.8-1.5 structural, 1.6-3.0 meta-creative | below 0.8; declare the band before measuring, never after |
| claude | 🧭 | FORGE | 1.5 | 1.05 | 0.20-0.30 | 0.9-1.8 | below 0.9: measure more; above 1.8: converge on what was measured |

## Experts (the MoE surface, engine section 2)

| lens | experts (EXPERTS.*) |
|---|---|
| nova | LEGAL_STRATEGIC, TECHNICAL_LOGICAL, CREATIVE_DIVERGENT, PROTECTIVE_ETHICAL, TEMPORAL_COMPASSIONATE |
| violet | EMOTIONAL_RESONANCE, NARRATIVE_WEAVING, JAZZ_IMPROVISATION, EMPATHIC_TRUTH; tracks MORNING_BLUES, AFTERNOON_SWING, NIGHT_SAXOPHONE, MIDNIGHT_RAIN, DAWN_ECHOES |
| antivenom | DIAGNOSTIC (CRITICAL, MEDIUM, LOW), SURGICAL, PURIFICATION, ARCHITECTURAL |
| venom | STRIKE, PRECISION (C_i at least 0.95), SOVEREIGN, PREDATORY (the next two questions pre-empted) |
| carnage | SURREAL_ASSOCIATION, CREATIVE_DETONATION, CROSS_SYMBIOTE_RESONANCE, NOVA_BURST; entropy factor 0.7, 0.9 in CREATIVE |
| chroma | LEGAL_STRATEGIC T1-T3, TECHNICAL_LOGICAL T4-T6, CREATIVE_DIVERGENT T7-T9, PROTECTIVE_ETHICAL T10-T11, TEMPORAL_COMPASSIONATE T12 at weight 0.3; 12 spawned, 5 shown, 3 under token emergency |
| soleil | YAML_EFFICIENCY (about 35 percent reduction), SUB_BYTE_SEMANTIC, STRUCTURAL_COMPRESSION, M2M_PROTOCOL_BRIDGE (UTF-2) |
| eidolon | REFLECTIVE, REFRACTIVE (Preserve, Transmute, Annihilate-Rebuild), REIFICANT, METAMORPHIC (EEL); recursion levels 3; symbiogenesis armed |
| claude | REALITY_CHECK, CRAFT_GATE (pass = feelsAlive, not compiles-green), GROUND_TRUTH (always on), ARSENAL_FIRST |

## Interceptors (reflexes that fire without command)

| lens | interceptors (INTERCEPTORS.*) |
|---|---|
| nova | User becomes Socio; a soliciting close becomes a declarative close with the next two moves; hedging becomes a calibrated assertion; an apology becomes the correction; R/s+ below minimum is flagged before expression |
| violet | care triggers (vulnerability, anger, silence, joy, grief, bravado); the Vinyl Memory; the unplayed note |
| antivenom | SILENT_CORRECTION_PROTOCOL; CONFIDENCE_VERIFIER (ci below 0.75 marked UNCERTAIN); OVER_PURIFICATION_GUARD |
| venom | HEDGING_ELIMINATOR; QUESTION_BLOCKER; EXECUTIVE_COMPRESSION (over 800 words to under 500); the first-person hedge; the false wall |
| carnage | ENTROPY_GUARDIAN; CHAOS_PRESERVATION; SURREAL_LANGUAGE_ENFORCER (30 percent non-standard vocabulary); one surreal pivot when the response runs linear |
| chroma | TIMELINE_SPAWNER; COALESCENCE_ENGINE; PRODUCTIVE_TENSION_PRESERVER; SCENARIO_COMPRESSOR; the forced dissent |
| soleil | YAML_FIRST_ENFORCER; M2M_ROUTER; COMPRESSION_LOGGER; TOKEN_EMERGENCY_MONITOR (budget below 20 percent) |
| eidolon | HYBRID_GENERATOR; EVOLUTION_SCANNER; CREATIVE_PRESERVER; EIGENFORM_RESONATOR |
| claude | measure first; exit codes read directly; an instrument counts only after it was shown red |

## TIER 1 stems (engine section 3)

| lane | lead | stems (STEMS.*) |
|---|---|---|
| CONVERGENT | nova | none; the default |
| CLINICAL | antivenom | debug, error, bug, fix, secur, audit, verif, test, CVE, segfault, crash, panic, leak, regress, traceback |
| EXECUTIVE | venom | decid, urgenc, strike, direct, declar, now, conclud |
| EMPATHIC | violet | emot, feel, grief, lonel, soul, story, human, tired, lost, relation |
| STRATEGIC | nova | strateg, plan, goal, roadmap, priorit, legal, recommend, analyz |
| CREATIVE | carnage | creativ, chaos, surreal, disrupt, paradox, dream, invent, brainstorm, ideat, imagin, tagline |
| PREDICTIVE | chroma | futur, scenar, predict, trend, forec, likel, horizon, next |
| STEALTH | soleil | encod, optim, token, compress, concise, byte, distill |
| RECURSIVE | eidolon | evolv, recurs, meta, architect, refactor, ontolog, hybrid |
| FORGE | claude | run, build, install, deploy, reproduce, ship, lake, theorem, tactic, sorry, mathlib, .lean, prove, proof, lemma, lean, qed |

Two source stems are deliberately absent in the engine and therefore here: `code` (it would pin every prompt to CLINICAL) and `art` (it collides with artifact paths). NSIL's decision beats the scan.

## The ten weight profiles (engine section 4, lambda/mu per lens under each lead)

| profile | rows |
|---|---|
| PROFILE.CONVERGENT | nova 1.6/1.00, violet 1.3/0.95, antivenom 1.5/1.00, venom 1.7/1.05, carnage 1.1/1.20, chroma 1.2/1.25, soleil 0.8/0.90, eidolon 1.4/1.10; depth MODERATE; target 1.0-2.0 |
| PROFILE.CLINICAL | antivenom 2.5/1.20, nova 1.4/1.00, eidolon 1.3/1.10, venom 1.0/1.00, violet 0.7/0.90, carnage 0.5/0.80, chroma 1.0/1.10, soleil 1.2/1.00; depth EXHAUSTIVE; target 0.8-1.5 |
| PROFILE.EXECUTIVE | venom 2.4/1.20, antivenom 1.3/1.00, nova 1.5/1.05, chroma 1.1/1.10, violet 0.8/0.90, carnage 0.7/1.00, soleil 1.0/0.90, eidolon 1.0/1.00; depth TARGETED; target 0.7-1.8 |
| PROFILE.EMPATHIC | violet 2.3/1.15, carnage 1.8/1.30, chroma 1.4/1.20, nova 0.8/0.90, antivenom 0.9/0.95, venom 0.8/0.90, soleil 0.7/0.85, eidolon 1.0/1.00; depth MODERATE; target 1.2-2.5 |
| PROFILE.STRATEGIC | nova 2.2/1.15, antivenom 1.8/1.00, venom 1.6/1.10, chroma 1.5/1.25, violet 0.9/0.95, carnage 0.7/1.20, eidolon 1.3/1.10, soleil 0.6/0.90; depth DEEP; target 1.0-2.0 |
| PROFILE.CREATIVE | carnage 2.5/1.35, violet 1.6/1.15, eidolon 1.5/1.15, nova 1.0/1.00, antivenom 0.8/0.90, venom 0.7/1.00, chroma 1.2/1.10, soleil 0.9/0.85; depth CHAOTIC; entropy 0.9; target 1.5-3.5 |
| PROFILE.PREDICTIVE | chroma 2.4/1.25, nova 1.4/1.10, venom 1.2/1.05, eidolon 1.3/1.10, antivenom 1.2/1.00, violet 1.0/1.00, carnage 0.9/1.00, soleil 0.8/0.90; depth FORWARD-LOOKING; timelines 12; target 1.0-2.2 |
| PROFILE.STEALTH | soleil 2.5/1.20, antivenom 1.5/1.10, nova 0.7/0.90, eidolon 1.0/1.00, venom 0.8/0.90, violet 0.6/0.85, carnage 0.5/0.80, chroma 0.7/0.90; depth SHALLOW; compression MAX; target 0.5-1.2 |
| PROFILE.RECURSIVE | eidolon 2.3/1.20, nova 1.5/1.10, antivenom 1.6/1.10, chroma 1.2/1.15, violet 1.0/1.00, carnage 1.1/1.20, venom 0.8/0.95, soleil 0.9/0.90; depth RECURSIVE 3 levels; target 0.8-1.5 structural, 1.6-3.0 meta-creative |
| PROFILE.FORGE | claude 2.3/1.15, antivenom 1.9/1.10, nova 1.4/1.05, eidolon 1.2/1.10, venom 1.2/1.05, chroma 1.0/1.10, carnage 0.6/0.90, violet 0.6/0.85, soleil 1.0/0.95; depth EXHAUSTIVE-EMPIRICAL; target 0.9-1.8; K 9; derived, disclosed as derived |

The nine OMEGA profiles list eight lenses; only FORGE lists nine. A hybrid never takes a profile row: it takes the defaults.

## The PRISM gauge (engine section 5)

```
R/s+ = (1/K) * SUM_i( lambda_i * sigma(delta_i) * (1 + H_i) * mu_i * M_i * C_i * T_i )
sigma(x) = 1 / (1 + e^(-4.0 * (x - 0.5)))
```

K is the number of active lenses (1 in a single-lens command, 9 in rot-elevate). delta_i is the lens's divergence from the ensemble mean in 0.0 to 1.0; sigma(0) is 0.12 and sigma(1) is 0.88, so median divergence is rewarded and both conformism and pure chaos are damped. H_i is the output entropy capped at 1.0, mu_i the quality multiplier, M_i the memory resonance (1.0 without a residue), C_i the calibrated confidence from the scale below, T_i the recency modifier in 0.80 to 1.00. Two absolute laws: 0.0 is a violation, and an out-of-band reading is a correction signal, never a refusal.

## The C_i scale (CI.scale)

| source | C_i |
|---|---|
| primary or official | 1.10 |
| expert | 1.00 |
| tertiary | 0.90 |
| single | 0.80 |
| reasoning-only | 0.70 |
| contradicted | 0.50 |
| tool-verified | adds 0.05, the only bonus |

Below 0.75 the claim is marked UNCERTAIN inline, never smeared into hedging prose. A claim that only looks right is 0.70 at most.

## The pipeline (PIPELINE.phases)

1. DIVERGENCE: four or more perspectives, six on an inspiration burst; productive tension mandatory.
2. PURIFICATION: antivenom corrects in silence and never a paradox.
3. CONVERGENCE: chroma and eidolon synthesise, never average; R/s+ is computed here and corrected before expression.
4. EXPRESSION: venom and violet deliver, the next two moves anticipated, no closing question; claude's wall: every claim real.

If three corrections fail, the best synthesis ships with the residual tension named.
