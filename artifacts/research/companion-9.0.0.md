<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

### 🩺 Scope

phase=9.0.0 range=v8.0.0..HEAD model=opus

Read all seven folders the operator named: `.claude-plugin` (2 files), `.rot-lists` (7), `LICENSES` (3), `agents` (5), `bin` (2), `monitors` (2), `skills` (159) — 180 tracked files, swept for BOM and CR (0 faults) and for out-of-sequence law numbering (0). Also read `dtd/cc-ask.dtd`, `dtd/adiutor.dtd`, `dtd/typography.dtd`, `dtd/cc-args.dtd`, `dtd/cc-schematic.dtd`, `src/skills/dtd-core-dtd/references/subsets.md`, `checker/counts-sweep.mjs`, `checker/hosted-plugin.json`, `CITATION.cff`, and the 20 phase commits.

Ran, each under `node lib/ceiling.mjs 60` with stdin closed: `ai-slop.mjs controls` (0 failing, 117 banned phrases, 8 measures, 8 laws), `ordinals.mjs controls` (0 failing), `adiutor.mjs controls` (31 run, 0 failing), `rot-dtd-commander.mjs check` (checked 166, failed 0), `build --check` (303 targets, 0 drifted), `counts-sweep --controls` (7 run, 0 failing), `controls-sweep --check` (28 claims, 0 drifted), `list.mjs reach` (0 refused), `spdx-sweep.sh` (840 files, 0 missing). No writes, no edits, no spawns, no backgrounded process.

One correction to my own measurement: an early `slop sweep` exit was read as 0 through a pipe to `tail`; re-run without the pipe it is 1, and the missing-directory control is sound. The floor holds.

### 🩺 Findings

<finding file="src/skills/dtd-core-dtd/references/subsets.md" line="181" severity="high" confidence="measured">The gate enumeration reads (start|more|add|impactful) and omits save, the fifth choice this phase exists to add (commit f752332, the fifth gate choice that saves the cache). A tree-wide census counts 121 occurrences of the five-choice form and exactly two of the four-choice one: this file and the build output beside it. dtd/cc-ask.dtd:108 is the five-choice original and dtd/cc-ask.dtd:118 declares GATE.save, which this copy has no line for. The dtd-core-dtd skill is what a reader loads to learn the contract, so 9.0.0 ships a reference that teaches the 8.0.0 gate.</finding>

<finding file="src/skills/dtd-core-dtd/references/subsets.md" line="1741" severity="high" confidence="measured">The finding kind enumeration reads slop|record and stops, omitting gate and cache. dtd/adiutor.dtd:41 declares eleven values ending slop|record|gate|cache, and Adiutor control C31 exercises exactly those two (more=gate impactful=gate save-bare=cache). This file is the only place in the tree still carrying the nine-value form; the eleven-value form appears once, in the DTD itself. Nothing under checker/, lib/ or bin/ reads subsets.md, so no control can report the gap.</finding>

<finding file=".claude-plugin/plugin.json" line="4" severity="high" confidence="measured">The shipped plugin description says checked by rules C1 to C15. The checker's own help text at bin/rot-dtd-commander.mjs:731 says rules C1 to C16, as do README.md:589, CONTRIBUTING.md:25, NOTICE.md:126, skills/dtd-core-dtd/references/checker-rules.md:3 and every one of the five agents. counts-sweep.mjs reads this file at lines 130, 131 and 132 for commands, declarations and guards, and at none of them for the rule range, so the gate stays green while the manifest a plugin surface renders understates the rule set by one.</finding>

<finding file="CITATION.cff" line="15" severity="high" confidence="measured">version is 4.0.0 and date-released is 2026-09-02 while package.json, .claude-plugin/plugin.json and .claude-plugin/marketplace.json all carry 9.0.0; line 22 of the same file says rules C1 to C14. A census of every tracked file for the string CITATION.cff returns three hits, all of them prompt text inside git-gh-amplification-dtd, and zero files under checker/, lib/ or .github/ mention it. GitHub and Zenodo read this file to render the citation, so a release five majors ahead publishes 4.0.0 as its citable version, and no control in the gate can see it.</finding>

<finding file="src/skills/dtd-core-dtd/references/subsets.md" line="3185" severity="medium" confidence="measured">The quoted typography block names GREEK_NUMBERS.md as the source of the Greek series, here and again at line 3311. That path does not exist in the tree. dtd/typography.dtd:48 and :174 name dtd/sigil/greek-numbers.md, the file this phase added, and SIGIL.docs at subsets.md:3556 lists greek-numbers.md by its real name eleven lines further down, so the same file contradicts itself.</finding>

<finding file="src/skills/dtd-core-dtd/references/subsets.md" line="3" severity="medium" confidence="measured">The heading claims the shared subsets, verbatim, and line 5 of the same file concedes it can fall behind the dtd/ it quotes. Comparing all 26 quoted blocks against their files, 5 differ: cc-ask.dtd is nine lines short and stops before the 9.0.0 save paragraph, adiutor.dtd, typography.dtd, cc-args.dtd:46 and cc-schematic.dtd:11 each carry superseded sentences. The disclaimer is honest and the heading is not; one of the two should go, and the phase that added 1224 lines here was the moment to refresh all 26.</finding>

<finding file="skills/dtd-core-dtd/SKILL.md" line="156" severity="medium" confidence="measured">The reference list promises the 26 shared subsets with commentary. dtd/ holds 31 .dtd files and subsets.md has 26 sections, so the number describes the copy rather than the corpus. Two of the five absentees, cc-amplify.dtd and cc-rot.dtd, carry the cc- prefix this repository uses for a shared subset, which makes their absence read as an omission rather than a scope decision.</finding>

<finding file="checker/hosted-plugin.json" line="106" severity="low" confidence="reasoned">The first open unknown asks whether the surface now reports 131 commands instead of 129 and closes by uploading the 7.2.0 archive. The baseline above it has moved to 139 and surfaceReported.why now reasons about 137, so the open question is answerable only for an archive two releases behind. It is defensible as a frozen record of the 7.2.0 upload, but it reads as live and nothing marks it historical.</finding>

### 🩺 Verdict

The instruments are sound. All 31 Adiutor guards trip on purpose and pass, the 166 DOCTYPE-bearing sources check clean in both directions, build --check proves 303 targets undrifted, the counts sweep holds 51 places to a measured 139/22/5, and the seven focus folders carry no encoding fault and no law out of sequence. The slop and ordinals controls both report zero failing, and the sweep floor exits 1 on a directory with nothing to measure, which I confirmed against a missing directory as a control.

What fails is the edge the controls do not reach. `subsets.md` is read by nothing, says so in its own line 5, and is therefore the one file in the corpus where drift is invisible to CI — and this phase left the 9.0.0 gate choice and the two new finding kinds out of it while rewriting 1224 of its lines. `CITATION.cff` is reached by no control at all and publishes 4.0.0. `plugin.json` is read three times by the counts sweep and never for the sentence that is wrong. Three of the four high findings are the same defect wearing different clothes: a claim shipped to a reader that no instrument is pointed at. The repository's own standard is that a count in words gets a sweep; these are counts in words that did not get one.

### 🩺 Next

Add `GATE.save` and the two finding kinds to `src/skills/dtd-core-dtd/references/subsets.md`, then re-quote all 26 blocks from `dtd/` in one pass and rebuild. Give the file the control it lacks: a checker step that reads each `## <name>.dtd` fence and compares it byte for byte with `dtd/<name>.dtd`, tripped on purpose by planting one changed character — that single control closes findings 1, 2, 5 and 6 and stops the class recurring. Correct `plugin.json:4` to C1 to C16 and add a counts-sweep step for the rule range beside the three that already read that file. Bring `CITATION.cff` to 9.0.0 with today's date and C1 to C16, and add it to the sweep so the version field cannot fall behind again. Then decide whether `cc-amplify.dtd` and `cc-rot.dtd` belong in `subsets.md`, and either add them or say in the heading what the 26 excludes.

COMPANION VERDICT: fail
