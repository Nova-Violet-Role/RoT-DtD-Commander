<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

Audit complete. All instruments run, all findings measured against the tree.

### 🩺 Scope

phase=9.0.0 range=v8.0.0..HEAD model=opus

Folders read: `checker/` (companion-audit.sh, spdx-sweep.sh, subsets-sweep.mjs, plates.mjs, counts-sweep.mjs, controls-sweep.mjs, enum-sweep.mjs, creators-audit.mjs, scala.mjs, seal-secret.mjs), `lib/` (cache.mjs, ai-slop.mjs, ordinals.mjs, ceiling.mjs), `dtd/` (52 tracked files, law entities across all), `src/commands/`, `src/skills/`, `src/agents/`, the installed mirrors `commands/` and `skills/`, `artifacts/research/`, `.github/workflows/`, `docs/` and the root `README.md`, `REUSE.toml`, `.gitignore`.

Instruments run, exit codes read directly: `lib/ai-slop.mjs controls` (ban list 117, measures 8, laws 8, 0 failing), `lib/ordinals.mjs controls` (0 failing), `bin/adiutor.mjs controls` (31 guards, 0 failing), `counts-sweep` (139 commands, 22 skills, 5 agents, 60 places in step), `gate-sync` (83 commands, 0 missing), `subsets-sweep --check/--controls` (28 blocks, 5 controls trip), `plates --check/--controls` (16 plates, 8 controls trip), `cache.mjs controls` (20 pass), `ai-slop sweep --tracked` (641 files, 0 slop), plus controls-sweep, enum-sweep, creators-audit and scala controls — all green. I replicated `spdx-sweep.sh` in node because the allow-list grants only node and git, and swept all 867 tracked files myself for CR, BOM, control bytes and final LF: all four zero.

Two leads I opened and closed as clean rather than report: seven files whose `LAW.*` family starts at 4 or 5 are continuous across their include (laws 1–3 sit in the per-command DTD), and all 777 declared laws resolve with contiguous families, so no law is out of sequence and no cited law is undeclared.

### 🩺 Findings

<finding file="artifacts/research/companion-9.0.0.md" line="1" severity="high" confidence="measured">This file is tracked, is 1 byte (a bare newline), carries no SPDX tag, and matches none of the three REUSE.toml annotation globs (REUSE.toml:19 covers only **/*.json, **/*.jsonl and docs/gifs/*.gif). A node replica of the sweep over all 867 tracked files returns checked 842, covered 18, missing 1, naming this path; checker/spdx-sweep.sh:77 ends on [ "$m0" -eq 0 ], so the script exits 1, and .github/workflows/gate.yml:71 runs it as a gate step. The 9.0.0 gate chain is red on HEAD. Fix: add an artifacts/research/companion-*.md ignore rule beside the existing artifacts/cache/ and artifacts/sigil/ rules and untrack the file.</finding>

<finding file="checker/companion-audit.sh" line="125" severity="high" confidence="measured">The runner truncates both records it owns on every pass: line 125 pipes the session through tee "$raw" (companion-9.0.0.json) and line 139 hands "$log" (companion-9.0.0.md) to a node writer. Commit 2989ac7, subject "the companion record carries the license header", added exactly 3 header lines to artifacts/research/companion-9.0.0.md; at HEAD that file is 1 byte and the .json is 0 bytes, so the repair was destroyed by the next run. A committed SPDX header in a runner-truncated file cannot survive one pass, so the pass-13 fix will keep regressing until the files are ignored rather than headed. The v8.0.0 sweep never skipped .md either, so removing the skip list did not cause this; committing runner output did.</finding>

<finding file="README.md" line="600" severity="medium" confidence="measured">The claims table row asserts "every source file carries the SPDX header | bash checker/spdx-sweep.sh: 0 missing | 2026-09-02". The tree returns 1 missing, so the row the README offers a reader as the repository's verification surface is contradicted by HEAD. The date column carries 2026-09-02 while the file that breaks it entered in 81f904d during this phase.</finding>

<finding file="README.md" line="722" severity="medium" confidence="measured">The licence paragraph claims "156 converted files carry the upstream MIT in their SPDX expression". Counting files whose text matches SPDX-License-Identifier: (AGPL-3.0-or-later OR EUPL-1.2) AND MIT gives 312 tracked files: 156 under src/ (132 src/skills plus 24 src/commands) and an identical set of 156 in the installed mirror (132 skills plus 24 commands), verified as the same relative paths. The number states the source half as though it were the repository total, and the sentence's own subject is "every file in this repository". checker/companion-audit.sh:90 repeats the same 156.</finding>

<finding file="REUSE.toml" line="19" severity="low" confidence="measured">The annotation glob **/*.json licenses artifacts/research/companion-9.0.0.json, a 0-byte runner scratchpad, as package content under AGPL-3.0-or-later OR EUPL-1.2. The sweep counts it among its 18 covered files and stays silent, so the annotation written for data files that cannot carry a comment is also the reason an empty generated transcript passes the gate unnoticed. Narrowing the glob or ignoring the runner's output would keep the covered count honest.</finding>

### 🩺 Verdict

The instrument work in this phase is sound and the controls are real: subsets-sweep, plates, cache, controls-sweep, enum-sweep, creators-audit and scala each plant a defect and read it back, and every one of them tripped when I ran it. Encoding is clean across all 867 tracked files on all four arms. Law numbering and law citation are clean corpus-wide, and both leads I chased there dissolved under measurement rather than becoming findings.

The phase fails on its own headline repair. Pass 13 removed the skip list so that "a tagless file is covered by REUSE.toml or it is missing" — a strictly better sweep — and the same phase committed a tagless, runner-truncated transcript into the tree. The sweep is working exactly as designed; it is reporting a real hole. Because `.github/workflows/gate.yml:71` runs it, HEAD does not pass its own gate, and the README row at line 600 advertises the opposite. The deeper fault is that the chosen fix was a committed header in a file the runner rewrites on every invocation, so the defect is scheduled to return on the next pass regardless of what is committed now.

### 🩺 Next

Ignore the companion's own output rather than heading it: add `artifacts/research/companion-*.md` and `artifacts/research/companion-*.json` beside the existing `artifacts/cache/` and `artifacts/sigil/` rules in `.gitignore`, then `git rm --cached` both files. Re-run `bash checker/spdx-sweep.sh` and confirm it prints `0 missing` with its planted-control line still moving the counts by two missing and one covered. Then correct `README.md:722` and `checker/companion-audit.sh:90` to the measured 312, or reword them to say 156 converted sources mirrored twice, and re-render the licence plates with `node checker/plates.mjs` so `docs/section-licence.svg` and its dark twin stop drawing the old number. Finally, consider having `counts-sweep.mjs` read the converted-header count the way it already reads the guard count, so the next drift is caught by an instrument instead of a companion pass.

COMPANION VERDICT: fail
