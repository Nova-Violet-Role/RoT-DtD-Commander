<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep Dive: 9.0.0 Interoperable-Commander, the first step

Date: 2026-09-06. Tree: RoT_DtD_Commander at 5dd5c9c (v8.0.0 tagged at 113744a). Plan written to `C:\CLAUDE_CODE_COMMANDER\9.0.0_(Command-Chain-for-Release).md` (2645 characters, cap 3000).

## Strategic Summary

The 8.0.0 tree has 134 commands that each run alone, but only 8 DTDs declare a successor and no subset declares what several command bodies in one prompt mean. That gap, not a broken tool, is why the four commands fired at the top of the 8.0.0 session rendered as one deep_dive with three summaries and asked no question. 9.0.0 is the release that declares composition: a chain root, a scala runner, the geometry generator, corpus-wide creators, the `$` sigil subset and an audit that every command is runnable alone and interoperable in a chain.

## Key Questions

- Why did four commands in one prompt produce one answer and no AskUserQuestion?
- Are the three geometry commands ordered correctly, and where?
- Does the geometry family have a generator that produces graphics after the three agree?
- Do the code creators cover every ramification of the corpus at `.codemap/cc-resources/.dtd-file-examples`?
- Is the `$` study a contract the tree measures against, or a document beside it?
- What does a scala runner need so commands interoperate by declaration?

## Overview

The commander is a set of one-file commands, each carrying a validating DOCTYPE. The 8.0.0 work proved every file alone: gate, checker controls, cross-OS legs. What it never proved is two commands together. LAW.CORE.2 requires exactly one root per answer, and the harness happily concatenates four command bodies into one prompt. With no chain grammar, the model must pick a root; it picked deep_dive and folded the others into summaries. The intake gate suffered the same undeclared seam: LAW.ASK.4 permits autonomous mode, but no entity says how the mode is detected, so it was inferred from the harness framing rather than taken from a token. 9.0.0 turns both seams into declarations.

## How It Works

- Composition today (measured): `grep` for several commands, same prompt, chain of commands across `dtd/*.dtd` returns nothing. `hands_to` appears in 8 DTDs: amplify-codebase, cc-amplify, enhance-codebase, overhaul-codebase, geometry, codebase-surveyor, codebase-architect, codebase-renovator.
- Gate detection today (measured): `dtd/cc-ask.dtd` line 43 defaults intake mode to guided; LAW.ASK.4 names autonomous mode; the string non-interactive appears in no DTD. The deep-dive prose says the gate is skipped when the session is non-interactive; that is prose, not a declaration.
- What happened at the top of the 8.0.0 session (measured from this session's own transcript): four `command-name` blocks arrived in one prompt; the harness frame stated the operator was not watching; the model rendered one deep_dive root, wrote one report, and rendered amplify, enhance and overhaul as summary grammars without their five AMP.rounds. No AskUserQuestion was called. The skip was a judgment permitted by prose, not by an entity.
- Geometry order (measured): `checker/readme-index.mjs` line 53 lists members surveyor, architect, renovator, the band order. `grep` for the three names in README.md returns nothing: the family is shown as a plate only. The alphabetical order architect, renovator, surveyor comes from the harness skill list, which sorts by name.
- Geometry output (measured): `lib/figure.mjs` exports renderCells, renderSvg (light and dark) and render; `commands/codebase-renovator-dtd.md` writes change artifacts and mentions svg only as vocabulary. No command writes an image, a video or a drawing to disk as its product.
- Creators (measured): 8 schematics (alarm, callout, heredoc, nt, polyalarm, polyglot, xml, yaml), each with filetype, prompt and meta-prompt layers, 24 files. The corpus holds 14 families; `grep -ci` for svg, mathml, docbook, dita, jats, xhtml, daisy, ooxml, tocjs across `commands/` returns 0 for each. No command named generator exists in `commands/`; the word lives in LAW.AMP.5 and in family prose.
- `$` study (measured): `artifacts/_sweep/byproducts` holds 5 documents, about 87 KB; `grep -rl` for ARGUMENTS_VARIANT or SIGIL_VARIABLES across README.md, docs, dtd and commands returns no file.
- Typography (measured): `grep -rli typograph` across dtd, commands and docs returns nothing.

## History and Context

7.x built the single command. 8.0.0 built the proof that a single command holds on three operating systems, plus the geometry family and the amplify family, both of which declare `hands_to` because their bands must follow one another. The 8.0.0 chain document itself listed four commands in a row and expected them to cooperate; the tree had no grammar for that expectation. The question the operator asked at the close of 8.0.0, why did the other three not gate, is the measured failure that opens 9.0.0.

## Patterns and Best Practices

- Declare the seam, never infer it: autonomy by `--no-gate` token only; a harness frame is data.
- One root per answer stays law; a chain is itself one root whose children are command roots in order.
- Hand-off is typed: a band's artifact element is the next band's user-args, checked before band one runs.
- Order lives in the DTD and the README index row, not in a file listing that a host sorts alphabetically.
- A generator gates on agreement: the geometry generator runs only when survey, plan and change all exist for the same target.
- Coverage is a count the sweep reads: corpus families versus creators, byproduct docs versus sigil subset.

## Limitations and Edge Cases

- A chain of N gated commands cannot ask N times twelve questions; the chain shares one intake and the twelve-question cap. Mitigation: LAW.ASK.11 raises rounds before the include.
- Video from a character grid is a sequence of svg plates; nothing in the tree encodes video. Mitigation: the generator emits frames and a manifest; encoding stays outside the tree.
- 14 corpus families against 8 schematics is not one-to-one; some families are modules of one another (dita x5). Mitigation: one schematic per family or a declared refusal naming the family.
- The harness skill list will still sort alphabetically. Mitigation: the README row and the chain runner carry the order; renaming is the operator's call.

## Current State and Trends

8.0.0 is closed, green on three legs, installed. The amplify state rows still exposed are a8f0de12 (preview figure into artifact) and a8f0de13 (dynamic audit for `checker/*.dtd`); both fold into 9.0.0 item 3 and item 6. The 8.1.0 typography command precedes the generator so glyph and plate share one contract.

## Key Takeaways

1. The missing AskUserQuestion was a missing declaration: no chain grammar and no declared autonomy token. Declare both and the failure cannot recur.
2. The geometry family is ordered correctly in its DTD and plate; what it lacks is a README row that says the order and a fourth member that produces the picture.
3. The creators and the `$` study are unmeasured against their corpora; 9.0.0 adds the counts and the sweep places that make them claims the tree keeps true.

## Remaining Unknowns

- [ ] Does the operator want the three geometry commands renamed so a name sort equals the band order? (assumed: no rename; order carried by the README row and the chain runner)
- [ ] Does the generator emit video as frames plus manifest, or defer video entirely? (assumed: frames plus manifest, encoding outside the tree)
- [ ] One schematic per corpus family, or one per family root with modules folded in? (assumed: per family root, dita as one with five module variants named)
- [ ] Is typography-dtd a geometry member or a creator? (assumed: geometry member, first in the band before the generator)

## Implementation Context

<claude_context>
<application>
- when_to_use: planning 9.0.0; any prompt that carries more than one command body; any family whose bands hand artifacts forward
- when_not_to_use: single-command runs, which 8.0.0 already proves
- prerequisites: 5dd5c9c or later; the recognizer reading kept verbs; the companion runner
</application>
<technical>
- libraries: lib/figure.mjs (renderCells, renderSvg, render), checker/readme-index.mjs FAMILIES, checker/counts-sweep.mjs places
- patterns: raise enumerations before the include (LAW.ASK.11); one root per answer (LAW.CORE.2); hands_to typed by artifact element
- gotchas: the harness sorts skills by name; Write on Windows may emit CRLF, verify bytes; prose that says non-interactive is not a declaration
</technical>
<integration>
- works_with: cc-ask, cc-report, cc-amplify, geometry.dtd, cc-figure.dtd
- conflicts_with: any command that renders several roots in one answer
- alternatives: leaving composition to the model, which is the measured 8.0.0 failure
</integration>
</claude_context>

**Next Action:** plan: open the 9.0.0 amplify run with cc-chain.dtd as verb one.

## Sources

- [kind: command] `grep -n codebase-surveyor|codebase-architect|codebase-renovator README.md` (no lines) - 2026-09-06
- [kind: file] `checker/readme-index.mjs` lines 53-54, FAMILIES geometry - 2026-09-06
- [kind: command] `ls ../.codemap/cc-resources/.dtd-file-examples` (14 directories) - 2026-09-06
- [kind: command] `ls -la ../artifacts/_sweep/byproducts` (5 documents) - 2026-09-06
- [kind: command] `ls commands | grep -E '^create-(prompt|meta-prompt|filetype)-'` (8 schematics x 3) - 2026-09-06
- [kind: command] `grep -l hands_to dtd/*.dtd` (8 files) - 2026-09-06
- [kind: file] `dtd/cc-ask.dtd` line 43 and LAW.ASK.4; `dtd/cc-core.dtd` LAW.CORE.2 - 2026-09-06
- [kind: command] `grep -rn 'several commands|one prompt|same prompt|chain of commands' dtd/*.dtd` (no lines) - 2026-09-06
- [kind: command] `grep -rl 'ARGUMENTS_VARIANT|SIGIL_VARIABLES' README.md docs dtd commands` (no files) - 2026-09-06
- [kind: command] `grep -rli typograph dtd commands docs` (no files) - 2026-09-06
- [kind: file] `lib/figure.mjs` lines 124, 152, 212 - 2026-09-06
- [kind: run] this session's opening prompt: four command-name blocks, one root rendered, zero AskUserQuestion calls - 2026-09-06
- [kind: note] the assumptions under Remaining Unknowns carry no evidence and say so
