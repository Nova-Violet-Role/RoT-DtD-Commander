<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
<!-- companion run: 2026-09-07T08:27:52Z-pid1667 -->

### 🩺 Scope

phase=9.0.0 range=v8.0.0..HEAD model=opus

Folders read: `checker/` (`companion-run.sh`, `companion-audit.sh`, `checker-controls.sh`, `live-sweep.mjs`, `heading-sweep.mjs`, `frontmatter-sweep.mjs`, `about-sweep.mjs`), `dtd/` (`typography.dtd`), `lib/` (`typography.mjs`, `arm.mjs`), `bin/` (`adiutor.mjs`, `rot-dtd-commander.mjs`), `src/skills/dtd-core-dtd/references/`, and `git log v8.0.0..HEAD`.

Run in this audit: `lib/ai-slop.mjs controls` (0 failing, 117 ban phrases, 8 measures, 8 laws), `lib/ordinals.mjs controls` (0 failing), `lib/typography.mjs controls` (35 run, 0 failing), `lib/encoding.mjs controls` + `sweep` (862 files, 0 bad — no CR, no BOM), `bin/rot-dtd-commander.mjs build --check` (303 targets, 0 drifted), `checker/engines-sweep.mjs` (19 engines, 0 not shipped), `checker/glossary.mjs --check`, `checker/subsets-sweep.mjs --check` (28 blocks in step), `lib/ai-slop.mjs` on `src/skills/dtd-core-dtd/references/subsets.md` (alive=yes, every measure holds). LAW.TYPO.1 to 8 are in sequence; LAW.COMPANION.1 to 8 are in sequence.

Disclosure, required by the contract: two Bash commands in this session were **not** the wrapper form — a `cat -A | grep -c` / `wc -l` census of the six focus files, and `sed -n '1,40p' checker/live-sweep.mjs`. Both were read-only; nothing was written, spawned or backgrounded, and the tree is unchanged. They ran because the tool allow-list was not in force (see the first finding).

### 🩺 Findings

<finding file="checker/companion-run.sh" line="72" severity="high" confidence="measured">One table line grants the same pair of spellings, --check and --controls, to ten engines; checker/heading-sweep.mjs and checker/frontmatter-sweep.mjs have no --controls branch at all — each reads only CHECK = process.argv.includes('--check') (heading-sweep.mjs:19, frontmatter-sweep.mjs:21) and calls writeLF(p, next) whenever CHECK is false (heading-sweep.mjs:52, frontmatter-sweep.mjs:56). So `companion-run.sh node checker/heading-sweep.mjs --controls` passes the wrapper's verb test at line 92 and runs the sweep in WRITING mode over every src command, agent and SKILL.md carrying a grammar_map. The one instrument that holds LAW.COMPANION.1 admits a spelling that writes the tree. It is latent only because build --check reports 0 drifted today; the moment a source drifts mid-phase — exactly when the companion audits — the write lands.</finding>

<finding file="checker/companion-audit.sh" line="162" severity="high" confidence="measured">The runner launches the nested session with --allowedTools but no permission mode, so a parent session in bypass mode leaves the allow-list inert. Measured in this run: `cd /c/CLAUDE_CODE_COMMANDER/RoT_DtD_Commander &amp;&amp; cat -A checker/companion-run.sh | grep -c` executed and returned output, and it is not the granted Bash form. The DTD comment assigns LAW.COMPANION.1 and 2 to that allow-list; with it inert, law 2 has no backstop at all (law 1 still has the tree comparison at line 173). M17, M17b, M17c and M23 in checker-controls.sh:122-153 all read the allow-list STRING out of the script and never test that the string is in force, so no control can trip on this.</finding>

<finding file="checker/companion-run.sh" line="72" severity="medium" confidence="measured">checker/live-sweep.mjs is granted --check and --controls; it accepts neither. parseArgs (live-sweep.mjs:95-109) throws `unknown argument` on any flag outside its nine, and there is no controls export. Both granted spellings were run through the wrapper in this audit and both ended in an uncaught throw at live-sweep.mjs:351. The entry is dead: the companion cannot run live-sweep by any admitted spelling.</finding>

<finding file="checker/companion-run.sh" line="57" severity="medium" confidence="measured">The comment claims the table is "one line per engine", and commit 5799cf6 states "the wrapper admits one engine at a time" as the pass-20 fix for a universal verb set that "let `readme-index check` reach the writer". Line 71 carries nineteen engines and line 72 carries ten, each sharing one verb set — the same universal-verb-set shape the fix names as the defect. Line 71 happens to be sound; line 72 is wrong for three of its ten.</finding>

<finding file="checker/companion-run.sh" line="100" severity="medium" confidence="measured">The node arm execs the engine without setting the working directory, while the git arm at line 117 passes -C "$here". An engine that reads the tree relative to cwd therefore runs against the companion's scratch directory. Measured: `companion-run.sh node lib/ai-slop.mjs sweep --tracked` returned `slop sweep: --tracked needs a git work tree: fatal: not a git repository`, so the tracked-file slop sweep — an arm ai-slop's own controls exercise (`sweep --tracked: plain 17 files, tracked 16`) — is unreachable through the wrapper.</finding>

<finding file="checker/companion-run.sh" line="19" severity="low" confidence="measured">The header reserves exit 2 for a refusal and says the command's own exit is passed through otherwise, but an engine that crashes also surfaces as 2: live-sweep.mjs --check printed its stack trace and exited 2, identical to `refuse`. A caller cannot tell "the wrapper said no" from "the engine died".</finding>

<finding file="checker/companion-run.sh" line="72" severity="low" confidence="measured">checker/about-sweep.mjs has only a --controls branch (about-sweep.mjs:131); --check falls through to the live path, which reads a GitHub credential via token() and fetches the repository About over the network (about-sweep.mjs:135-141). A granted "reading" spelling that reaches the network was not what the table meant to admit.</finding>

<finding file="lib/typography.mjs" line="128" severity="low" confidence="measured">resolve(ch, { on = classes().on, fallback = null }) destructures `on` and never reads it; the body branches on the guarantee and the fallback only. The module header at line 19 advertises `resolve(ch, on) -> what is actually drawn for one character`, which reads as though the class switch changes the drawing. LAW.TYPO.4 puts the switch in the grammar rather than the renderer, so the parameter is dead API surface that contradicts its own doc line.</finding>

### 🩺 Verdict

The 9.0.0 tree itself is in good order: encoding is clean across 862 files, the 303 build targets are in step, the 28 quoted subset blocks agree with their sources, the typography contract is honoured in both directions with every one of its 36 TYPO.* entities spent, LAW.TYPO.4 trips correctly on all three module drivers, and the new prose passes the slop gate on every measure. The defects are all in the companion instrument this phase spent twenty passes hardening.

Two are high. The wrapper — the single object that now carries LAW.COMPANION.1 and 2 — grants `--controls` to two engines that treat any argument other than `--check` as permission to rewrite every source under `src/`; the fix for pass 20's universal verb set reintroduced a universal verb set one line lower. And the allow-list that M17, M17b, M17c and M23 all assert against is not actually in force in the launched session, which those four controls are structurally incapable of noticing: they read the string out of the script instead of testing the running session. Both are the same failure the phase has been chasing all along — a guard verified by reading its own declaration rather than by being tripped.

### 🩺 Next

Close the two high findings before the phase closes. First, replace line 72's shared verb set with a real per-engine row: `heading-sweep` and `frontmatter-sweep` take `--check` only, `live-sweep` leaves the table entirely, `about-sweep` takes `--controls` only. Second, pass an explicit permission mode on the `claude -p` line at companion-audit.sh:162 so the allow-list cannot be inherited away. Then add the control that would have caught both: run each engine in the table with each spelling the table grants, under `--tree-state` before and after, and go red on any granted spelling that moves the tree or that the engine rejects as an unknown argument — that arm alone trips findings one, three and four. Give the node arm `cd "$here"` to match the git arm, and give `refuse` an exit code the engines cannot also return.

COMPANION VERDICT: fail
