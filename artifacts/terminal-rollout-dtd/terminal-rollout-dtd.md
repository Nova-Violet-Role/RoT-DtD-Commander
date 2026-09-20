<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Terminal sections rollout, 2026-09-20

- scope: every file with the cc-ask include. Measured, not estimated:
  `src/commands/*-dtd.md` with `cc-ask SYSTEM` = 121 files.
  `src/skills/*/SKILL.md` with the include = 21 skills.
- patched: 121/121 commands + 1 skill (`create-prompt-dtd`, the only skill
  presenting a gate). Each: `%cc-terminal;` include, gate sentence offering
  the terminal choice on start, `<terminal_gate>` block, one success criterion.
- assessed out, with reason, not silently skipped:
  `debug-dtd.md` (no cc-ask include, pure skill dispatch),
  `RoT-DtD-Commander-Adiutor.md` (closing triage gate rerun/edit/strict/
  dismiss, no start to hang the terminal behind),
  `ask-gate-dtd` (the gate definition itself, not a variant),
  20 gate-less skills (reference layers; their intake executes in commands).
- placement per shape, read from the file, never assumed: book lenses before
  the analysis step; rot lenses on start; list commands before the write;
  geometry bands before plan/produce/change/measure; coin flips before the
  toss; create forges before plan/schema/sections; routers before hand-off;
  chain gates (first-principles Held, second-order Trace) before step 4;
  elevate on the last of nine gates; companion before grants.
- controls tripped on purpose: redaction block written with a wrong law and a
  dropped sentence, caught and repaired before check; skill path first written
  as `../../dtd`, refused by check, corrected to `../../../dtd` (skills sit one
  level deeper than commands); git pathspec case (`git-gh-Companion-dtd.md`)
  returned empty on the lowercase spelling while the file was modified.
- instrument 1: `node bin/rot-dtd-commander.mjs check` full tree,
  173 checked, 0 failed.
- instrument 2: `node bin/rot-dtd-commander.mjs build`, 312 written,
  0 failing; `build --check` after: 312 targets, 0 drifted.
  Generated output spot-checked: `commands/ask-me-questions-dtd.md` carries
  the resolved cc-terminal subset, the `<terminal_gate>` block, step 6b and
  the terminal success criterion.
- generated tree: 269 changed files (src + regenerated commands/ + skills/).
- no batch automation was used; every file read, edited by hand, verified by
  `git diff --stat` plus per-file check before moving on.
