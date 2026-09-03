<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Companion audit, run ennea: v6.0.0

Eight passes of `checker/companion-audit.sh v6.0.0 9c508b7..HEAD`, opus, 120
turns, 1800 s. Every pass read the same range against the tree as it then
stood; every finding below was measured by the companion and closed at its
source before the next pass ran.

| pass | turns | findings | high | what the high ones were |
|---|---|---|---|---|
| 1 | 60 | 9 | 4 | predeclare double-wrapped, so the family claimed five rounds and ran on three; the index family entry missing id and rep; no gate could trip on either |
| 2 | 43 | 8 | 5 | the process named an instrument that did not exist; three published numbers that no longer re-ran; the variant subsets naming a law range the release outgrew |
| 3 | 37 | 6 | 3 | one class three times: a tally typed rather than counted, and two claim rows no instrument read |
| 4 | 56 | 7 | 2 | the interpolation shipped as literal prose in all three commands; the doctor row read the home directory whatever target it was given |
| 5 | 43 | 7 | 3 | the engines of two families never installed; nothing asserted a lib a command invokes is shipped; a parser claimed that this tree does not run |
| 6 | 40 | 5 | 2 | the version gate depended on a field its own writer never wrote; it disarmed in silence |
| 7 | 40 | 6 | 1 | the gate failed open: it printed NOT CHECKED and exited 0 whichever way it could not read |
| 8 | 46 | 11 | 2 | the gate went red forever once a release closed its rows as done; LAW.AMP.6 and LAW.AMP.12 declared opposite rules |

## What the passes were worth

Two of these would have shipped a broken release.

The engines of the amplify and scratch families were never in the installer's
list, so six commands installed without the libraries they invoke: the first
line an operator ran would have failed on a missing module, and the gate was
green throughout. And the raised intake was never bound: `predeclare` takes
entity bodies, the spec passed whole declarations, the forge wrapped them
again, and the family that advertised five rounds of twenty questions ran on
the default three of twelve.

Both are instruments now rather than intentions. `checker/engines-sweep.mjs`
reads every `node lib/x.mjs` out of the built commands, skills and agents and
refuses one the installer does not write. An amplify control opens the BUILT
command and reads the bound `ask.rounds` rather than the spec that claims it.

## The lesson

A number in a document is a claim; a number read from an instrument is a
measurement. Three passes running found the same class — a control tally typed
as a literal, a claim row no sweep read — so the fix was structural rather than
local: every tally counts what ran, and `checker/counts-sweep.mjs` grew places
for the claim rows themselves. It caught the next two drifts on its first run
after that, before any audit saw them.
