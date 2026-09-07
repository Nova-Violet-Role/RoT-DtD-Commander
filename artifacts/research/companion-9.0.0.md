<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

Audit complete. Writing the answer in the declared grammar.

### 🩺 Scope

phase=9.0.0 range=v8.0.0..HEAD model=opus

Read-and-run only, per LAW.COMPANION.1: no write, edit, commit, spawn or background. Every command ran under `node lib/ceiling.mjs 60` with `< /dev/null` (LAW.COMPANION.2); no ceiling fired, so nothing is recorded unaudited under LAW.COMPANION.5.

Ran both required instruments: `lib/ai-slop.mjs controls` (0 failing, 117 banned phrases, 8 measures, 8 laws, every landed proof printed) and `lib/ordinals.mjs controls` (0 failing). Also ran `controls-sweep` (28 claims, 0 drifted), `counts-sweep` (49 places in step), `enum-sweep` (5619 enumerations, 0 findings), `plates`, `readme-index`, `glossary`, `gate-sync`, `contract-audit`, `rot-dtd-commander check` and `build --check`, plus slop sweeps over `src/commands` (139 files, 0 slop) and `src/skills` (151 files, 0 slop), and `ai-slop.mjs` on README, CHANGELOG, RELEASE and `dtd/geometry.md` — all four inside every bound.

Encoding: all 357 changed files scanned byte-wise — 0 BOM, 0 CR, 0 stray control bytes. Law numbering in the seven new or grown DTDs (`cc-cache`, `cc-chain`, `cc-sigil`, `typography`, `geometry`, `cc-figure`, `codebase-generator`) is contiguous from 1 with no gap; the three new commands declare their roots and their law groups are in sequence. Contract audit: 166 elements across `dtd/`, 0 unused, 0 law gaps. Versions agree at 9.0.0 across package.json, plugin.json and marketplace.json.

Four of my own instruments returned false readings before they returned true ones, and I report the corrections rather than their first output. A blob-empty cross-check called all 166 DTD elements unused; rebuilt, it found 0. A src-versus-installed hash compare called all 139 commands drifted; opening the delta showed the install inlines the subsets, expands parameter entities and resolves marked sections by design. A parameter-entity table built last-wins contradicted the XML first-wins rule and manufactured 1762 phantom differences. And a `seal-secret` exit code read through `tail` reported 0 where the process actually exits 2. Each finding below rests on the corrected measurement.

### 🩺 Findings

<finding file="CHANGELOG.md" line="76" severity="high" confidence="measured">The release-day measured claim reads `- \`node checker/gate-sync.mjs\`: 75 commands in the gate chain, 0 missing from gate.yml`, but running that exact command prints `gate-sync: 77 commands in the gate chain, 0 missing from gate.yml`. The claim quotes the command verbatim and differs only in the number, so it reads as a measurement and is not one; line 83 of the same section states 77, so the release block contradicts itself four lines apart.</finding>

<finding file="checker/counts-sweep.mjs" line="136" severity="high" confidence="measured">The guard for the phrase "N commands in the gate chain" is scoped to `file: 'README.md'`; the CHANGELOG entry at line 137 guards only the different phrasing `(\d+) gate-chain commands`. Tested against the real bytes, the CHANGELOG regex returns false on CHANGELOG.md:76 and false on CHANGELOG.md:122, while the README regex finds nothing in CHANGELOG.md at all. The stale 75 therefore sits in a shape no guard reads, and counts-sweep reports 49 places in step while a contradicted number ships — a control that cannot trip on the very line it was written to protect.</finding>

<finding file="CHANGELOG.md" line="122" severity="medium" confidence="measured">A second stale count in the same 9.0.0 section, `gate script and the workflow, gate chain 75 commands`, in a third phrasing that neither counts-sweep guard matches. Because it is prose rather than a quoted command it will survive any fix aimed only at line 76, so the two must be corrected together.</finding>

<finding file="checker/seal-secret.mjs" line="147" severity="low" confidence="measured">`controls` dispatches on `opt('--nacl', '.')`, and the dependency it needs is not vendored in the tree: `controls --nacl node_modules/tweetnacl-sealedbox-js` fails module resolution and exits 1. The checker appears in no gate.yml step and in no npm script, so its controls run nowhere automated. The usage guard itself is sound — bad flag, bogus subcommand and no args each exit 2, never a false green — so this is unproven coverage rather than a broken alarm.</finding>

### 🩺 Verdict

The phase is structurally sound and its instruments are unusually honest: the ai-slop controls print a landed proof for every arm, including a rotation check that must not hold and a boundary case that must, and the contract audit trips on planted unused declarations and on laws planted out of order. Encoding is clean across all 357 files, 166 declarations are all honoured, and the build transform that makes every installed command differ from its source is a deliberate three-stage inlining, not drift — I confirmed that three separate times after three separate instruments of mine said otherwise.

What fails the phase is narrower and sharper. A release block that opens with the words "Measured on the release day" carries a number that the named command does not print, and it carries it twice. The number is not cosmetic: the gate chain's size is the claim that the gate covers what the project says it covers. The mechanism is worth more than the typo — the guard for this exact sentence shape exists and points at README.md, so the CHANGELOG line wearing the same words is invisible to it. That is the failure mode this repo already names in its own counts-sweep header comment about counts going stale one release after the gate passed, reproduced in a new place. A sweep that reports 49 places in step while a contradicted measurement ships is worse than no sweep, because it converts an unchecked number into an apparently checked one.

Nothing here threatens the code. Everything here threatens the claim that the code is measured, which is the thing this project sells.

### 🩺 Next

Correct CHANGELOG.md:76 to 77 and CHANGELOG.md:122 to 77, then widen the guard rather than only the text: add the `commands in the gate chain` shape to the CHANGELOG entry in counts-sweep.mjs alongside the existing `gate-chain commands` pattern, or normalise both files to one phrasing so a single regex covers them. Prove the widened guard by planting 75 back on line 76 in a scratch copy, confirming the byte delta landed, watching counts-sweep go red and name the file, then reverting and confirming the clean state returns — the alarm is not fixed until it has been seen to fire on the line that beat it. Separately, either vendor the nacl dependency so `seal-secret.mjs controls` can run and join a gate step, or state in the CHANGELOG that its controls need an operator-supplied directory, so an unrunnable control is not counted as a held one.

COMPANION VERDICT: fail
