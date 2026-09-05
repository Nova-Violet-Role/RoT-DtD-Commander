<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep Dive: 7.1.0 (Regression Patch) -> 8.0.0 (Cross-OS Commander)

Date: 2026-09-05 · Depth: comprehensive · Use: drive the 7.1.0 build
Command: /deep-dive-dtd · Gate: start (after one impactful round; all four selections taken)

## Intake

- known **what**: the 7.1.0 to 8.0.0 plan, quoted from the argument
- known **focus**: regression forensics first (round 1)
- known **how**: plan the WSL install too (round 1)
- known **depth**: comprehensive, to drive the build (round 1)
- known **use**: drive the build
- round 1 of 3, select: Focus / Substrate / Depth+Use, all three answered
- gate: `impactful` (round 1), four ranked selections rendered, provenance codebase x3 and command x1
- round 2: "all 4 of them"; gate: `start`

## Strategic Summary

v7.0.0 deleted zero files and removed 236 lines, none of which cost a capability: the
`RECORD.info` "regression" is a memory of a false comment that pass 13 wrote, pass 14
replaced with a second false comment, and pass 15 corrected to the truth. The
`$SIGIL_VARIABLES_VARIANTS.md` document never mentions RECORD or adiutor and cannot
have caused any removal, though it is worth de-flagging for a different reason. The
real defects are three: the ask-me grammar declares an unbounded loop that only
`start` can exit, all five CI jobs run `ubuntu-latest` so macOS is the uncertified
OS rather than Linux, and the local cross-OS substrate does not exist yet.

## Key Questions

1. Did v7.0.0 remove any capability, and did the sigil study cause it?
2. Was adiutor ever able to read `RECORD.info`?
3. Why does the ask-me family loop, and why does it write no numbered file?
4. Where is the codebase actually OS-locked, and to which OS?
5. What substrate exists on this machine for a 3-OS certification, today?
6. What must `cross-os.dtd` and `Regression-Extention-Retenue.dtd` declare?
7. What is wrong with the README, measured rather than felt?

## Overview

RoT DtD Commander at v7.0.0 is 131 command files, 159 skill files, 5 agents, 34 DTD
files, 18 checkers, 18 libraries, 2 binaries, 2 monitors, 13 docs and 295 source
files. Its release discipline is the "companion pass": a nested audit session reads
one build phase, files findings with `file`, `line`, `severity` and `confidence`
attributes, and returns exactly one verdict line. Twenty-seven such passes preceded
v7.0.0.

That discipline is the reason the regression premise fails. The passes are not silent.
Every removal in v6.0.0..v7.0.0 is narrated in a commit message, and the three passes
that touched `RECORD.info` narrate a sequence that looks exactly like a capability
loss from the outside and is the opposite from the inside: a false claim being
retracted. The felt regression is real as a feeling and inverted as a fact.

The 8.0.0 proposal is sound but aimed one degree off target. The codebase is not
Windows-biased in the way the argument assumes. It is Linux-certified by CI and
Windows-exercised by its operator, with macOS certified by nothing at all. The
cross-OS work is therefore not a rescue from Windows tunnel vision; it is closing a
single uncovered OS and turning an implicit certification into a declared one.

## How It Works

### The v7.0.0 delta, whole

`git diff --shortstat v6.0.0 v7.0.0` returns **223 files changed, 9135 insertions(+),
236 deletions(-)** (measured). `git diff --diff-filter=D --name-only v6.0.0 v7.0.0`
returns **zero rows**; `--diff-filter=A` returns **31** (measured). No file was
removed in the entire release.

The 236 deleted lines concentrate in refactors, not amputations (measured, `git diff
--numstat`):

| lines | file | what it was |
|---|---|---|
| 24 | `checker/crlf-sweep.sh` | replaced by a control-byte-counting sweep in pass 15 |
| 19 | `README.md` | prose edit |
| 11 | `checker/contract-audit.mjs` | arm rewrite |
| 10 | `skills/dtd-core-dtd/SKILL.md` (+ src twin) | the `produces` element mirror pass 8 deleted |
| 8 | `.claude-plugin/plugin.json` | manifest |
| 7 | `dtd/creators-v5.spec.mjs` | spec |

### The RECORD.info question, settled

`git log -S 'RECORD.info' -- bin/adiutor.mjs` returns **zero commits** (measured).
The string has never existed in the Adiutor's source. `git log -S 'RECORD.info' --
dtd/ bin/ lib/` returns exactly three: `af8ab70` (pass 13), `5e6403f` (pass 14),
`6283b7d` (pass 15).

Read in order, they are a retraction, not a removal (measured, commit bodies):

- **pass 13**, 2026-09-04 20:38:35 +0200 — wrote a comment claiming the Adiutor reads
  `RECORD.info` at Stop. It never did.
- **pass 14**, 20:51:41 — the pass 14 body says outright: *"the RECORD.info comment
  written in pass 13 named a reader that does not exist."* It replaced the claim with
  a second one, that the checker reads it. Also false.
- **pass 15**, 21:14:09 — *"Pass 13 wrote that the Adiutor reads RECORD.info at Stop;
  it does not. Pass 14 replaced that with a claim the checker reads it; it does not
  either. Both were guesses stated as fact in a shipped skill reference."*

The truth now sits at `dtd/cc-record.dtd:41`: *"Nothing reads RECORD.info at runtime:
passes 13 and 14 each named a..."*, and `:43` still declares
`<!ENTITY RECORD.info "%command-info-types;">`.

The entity is alive. Five commands override it (measured): `add-to-todos-dtd.md:128`,
`check-todos-dtd.md:127`, `task-handoff-dtd.md:264`, `whats-next-dtd.md:130` all with
`"record"`, and `task-run-dtd.md:264` with `"no-record-nesting"`. It exists so
`%command-info-types;` has a reference and a command's override is a declaration the
contract audit can see.

**Verdict: no capability was removed. A false capability claim was retracted.**
(measured). The regression is in the documentation layer and it has already been
fixed; what was lost is the *belief*, which is the thing worth retaining and is
exactly what `Regression-Extention-Retenue.dtd` should capture.

### The sigil study, exonerated

`$SIGIL_VARIABLES_VARIANTS.md` is at
`C:\CLAUDE_CODE_COMMANDER\artifacts\_sweep\byproducts\$SIGIL_VARIABLES_VARIANTS.md`
— **outside the repository**, untracked. 372 lines, 23,969 bytes, mtime
**2026-09-04 19:03:20** (measured), which is 1h35m before pass 13.

Temporal causality is therefore possible. Content causality is not:
`grep -c 'RECORD\|adiutor\|Adiutor'` on that file returns **0** (measured). The
document never mentions either subject.

Its two flags are both about foreign tooling (measured):

- line 176, `**⚠️ MAJOR TRAP:**` — Makefile `$@` is the Make target; the shell's `$@`
  needs `$$@`.
- line 281, `**Discrepancy flag:**` — Claude Code positional args are 0-based, `$0`
  first, contradicting third-party guides.

Its `UTILITY RANKING` section (line 321) sorts sigils into Tier S/A/B/C/D. "Tier D —
Trap / Deprecated / Dangerous" lists `$[...]`, unquoted `$@`, `${var@P}` on untrusted
input, `${jndi:...}` (Log4Shell), `${{ github.event.* }}` in `run:`. Every entry is a
real hazard in a foreign language. **Not one entry names a RoT DtD Commander
utility** (measured).

There is a real problem, and it is not the one the argument names. The repository uses
`$ARGUMENTS` **553 times across `commands/` and `src/commands/`, and `$0`/`$1`
positional sigils zero times** (measured). The line-281 discrepancy has **zero blast
radius here**. The document's flags are correct as a general reference and are pure
noise for this codebase, which is precisely why a model studying it treats the whole
document as hazardous and reads less of it than it should.

**Verdict: the sigil study caused no removal (measured). Rewrite it for signal
density, not for exoneration.**

### The ask-me loop, root cause

The three ask-me commands declare (measured):

```
ask-me-questions-dtd.md:9    <!DOCTYPE intake_session [
ask-me-questions-dtd.md:210  <!ELEMENT intake_session (task, intake, execution, assumption_made*)>
ask-me-many-questions-dtd.md <!ELEMENT many_session    (task, intake, execution, assumption_made*)>
ask-me-preview-dtd.md        <!ELEMENT preview_session (task, intake, execution, assumption_made*)>
```

`execution` is `(#PCDATA)`. There is no `artifact` element and no `RECORD.*` entity in
any of the three (measured).

The loop lives one level down, in the shared `cc-ask` subset:

```
<!ELEMENT intake (context_analysis, (ask, answer+)*, (round, (impactful, answer)*)*, gate)>
```

Both `*` operators are unbounded. The only thing that bounds the loop is prose:

- `LAW.ASK.3` — *"Work starts only on gate choice start; more, add and impactful
  re-enter the loop... and **more** is refused after round ASK.rounds_per_prompt
  because the enumeration ask.rounds has no further value."*
- `LAW.SESSION.2` (`ask-me-questions-dtd.md:220`) — *"in guided mode the loop ends
  only on gate choice start."*

`LAW.ASK.3` bounds exactly one of the three re-entering choices. The enumeration
`ask.rounds "(1|2|3)"` types the `n` attribute of a `round` element, and `add` and
`impactful` need not consume a round. So **`add` and `impactful` are unbounded by both
the grammar and the laws** (measured, by reading the declarations).

This was demonstrated in this very session: the gate was answered `impactful`, the
impactful element rendered, and the gate ran a second time — legally, and with no
declared ceiling on doing so again.

**Two defects, one cause:**

1. **The loop** — `add` and `impactful` have no declared bound. A user who keeps
   adding context can never reach `start` by exhaustion, only by choice.
2. **No numbered file** — the root simply does not declare one. But the argument's
   framing is wrong: `ask-me` is not the only command without one. Only **9 of 130**
   commands carry an `artifact` element in their root, and only **5 of 130** declare a
   `RECORD.*` entity (measured). **125 of 130 commands write no numbered file.** The
   Greek ordinal machinery in `lib/ordinals.mjs` (`greek(n)` -> `heis, duo, treis...`,
   LAW.IUPAC.4/6) serves the record family, not the command corpus.

The honest statement is not "ask-me is the only one that fails to produce a file". It
is "ask-me is an intake that ends in an unrecorded `execution`, so a session that
loops leaves no trace of what it asked" — which is the defect worth fixing, and it is
fixed by giving the root an `artifact` and giving `add`/`impactful` a bound.

### The cross-OS surface, measured

CI is monoculture. All five jobs (measured):

```
.github/workflows/gate.yml:22           runs-on: ubuntu-latest
.github/workflows/gate.yml:120          runs-on: ubuntu-latest
.github/workflows/gate.yml:162          runs-on: ubuntu-latest
.github/workflows/tapes.yml:20          runs-on: ubuntu-latest
.github/workflows/template-lint.yml:14  runs-on: ubuntu-latest
```

Platform-conditional code is small and deliberate — 7 lines in 3 files (measured):

```
lib/starlist.mjs:73    const finder = process.platform === 'win32' ? 'where' : 'which';
lib/starlist.mjs:101   quote a path containing whitespace on win32
lib/starlist.mjs:109   needShell on win32
lib/starlist.mjs:152   needShell on win32
lib/workflow.mjs:101   win32 branch
lib/workflow.mjs:115   detached: process.platform !== 'win32'
checker/live-sweep.mjs:189  win32 -> taskkill /PID /T /F
```

The `checker/*.sh` corpus is close to POSIX-clean. A scan for GNU-only idioms
(`sed -i`, `grep -P`, `stat -c`, `date -d`, `readlink -f`, `find -printf`, `xargs -r`,
`sort -V`) across all six scripts returns only `head -c` twice, which BSD supports
(measured).

The GNU dependency that would actually break a macOS runner is in CI, not in the
checkers (measured):

```
.github/workflows/gate.yml:109   s=$(stat -c %s "$g")
.github/workflows/tapes.yml:50   $(stat -c %s "$g")
```

BSD `stat` needs `-f %z`. **Adding `macos-latest` to the matrix fails at these two
lines before it reaches a single checker.** That is the first cross-OS defect and it
is two characters wide.

**Verdict: the Windows-bias hypothesis is inverted (measured).** Linux is the
certified OS, Windows is the exercised one, macOS is certified by nothing. The
degression risk runs Linux -> macOS, not Windows -> everything.

### The substrate on this machine, today

| tool | state | measured by |
|---|---|---|
| `podman` | **6.1.0 present** at `~/scoop/shims/podman` | `podman --version`, exit 0 |
| `podman machine` | **zero machines** — header row only | `podman machine list`, exit 0 |
| `docker` | absent | `command -v docker` |
| `wsl` | binary present, **WSL not installed** | `wsl -l -v` -> *"The Windows Subsystem for Linux is not installed."* |
| `qemu-system-x86_64` | present | `command -v` |
| `vagrant` | absent | `command -v` |

Podman on Windows runs Linux containers inside a VM. With no machine and no WSL2, it
can start nothing. The chosen plan (install WSL2 first) is therefore not optional
scaffolding — it is the blocking prerequisite, and `CLAUDE.md` already records "WSL
not installed" as a standing fact of this machine.

### The README, measured rather than felt

944 lines, 69,557 bytes. The `## 🕹️ Usage` section runs lines 204-681: **478 lines,
51% of the file** (measured).

The repository's own slop instrument passes it (measured):

```
node lib/ai-slop.mjs README.md   ->  EXIT=0
slop_verdict alive=yes words=1189 sentences=138
tells 0/0 · hedges 0/4 · fillers 0/8 · closers 0/0
static_share 0.0362/0.4 · rhythm_cv 0.9125/0.35 · lexical_mattr 0.6919/0.55
```

Every measure holds. And the instrument saw **1189 words** in a 69,557-byte file,
because it skips code blocks and tables — roughly 13% of the bytes.

**The README's problem is not prose quality; it is volume and structure, and the
instrument that guards it is blind to both** (measured). De-slopping it will change
nothing. Moving the 478-line Usage section into `docs/` will change everything.

## History and Context

The `RECORD.info` sequence is the most instructive artefact in the repository, because
it is a documented instance of the exact failure mode the argument is worried about,
running in the opposite direction.

Pass 13 needed `%command-info-types;` to have a reference after pass 8 deleted the
`produces` element mirror. `RECORD.info` was the reference. Having created it, pass 13
wrote a comment explaining what reads it — and invented a reader. Pass 14 caught that
the named reader does not exist, and invented a second one. Pass 15 caught both and
wrote the truth.

Three passes, two hallucinated capabilities, one correction. The operator's memory
that "adiutor was really capable of reading RECORD.info" is an accurate memory of
having read pass 13's comment. The comment was the regression; its removal was the
fix.

This is why `Regression-Extention-Retenue.dtd` is the right instrument and why its
scope should be wider than the argument proposes. A diff-based regression detector
would find nothing here: no file was deleted, and the deleted lines were a comment. A
*claim*-based detector — one that checks every capability a comment asserts against a
reader that can be named and run — would have caught pass 13 on the day it shipped.

## Patterns and Best Practices

- **The companion pass**: a nested audit session per build phase, findings carrying
  `file`, `line`, `severity`, `confidence`, exactly one verdict line, scored on the
  last non-empty line only so a companion quoting its own contract cannot pass by
  quoting it (`checker/companion-audit.sh:36-62`). Exit 124 means UNAUDITED, not fail
  (LAW.COMPANION.5). Extend this shape to the OS axis rather than inventing a new one.
- **Declaration before prose**: a bound that lives only in a `LAW.*` string is a bound
  a validator cannot check. The ask-me loop is the counterexample — `ask.rounds
  "(1|2|3)"` is checkable, `LAW.ASK.3`'s sentence about `add` is not.
- **The control that must fail**: every checker here plants a broken input and watches
  the alarm fire. Pass 13's finding that `C30 could not have caught any of it` is the
  house lesson. Every new law in `cross-os.dtd` needs its planted failure.
- **Local-first evidence**: the repo's own commit bodies settled a question that
  reasoning about the diff could not.
- **Sigils as `$ARGUMENTS` only**: 553 uses, zero positional. Keep it.

## Limitations and Edge Cases

- **macOS cannot be virtualized here, legally.** Running macOS on non-Apple hardware
  violates the macOS software licence agreement, so `dockur/macos` under WSL2 is not a
  compliant certification path. The compliant path is GitHub Actions `macos-latest`,
  which is Apple hardware. Plan the WSL2 install for Linux containers; plan macOS
  certification as CI-only. This is the one place the argument's proposal must change.
- **WSL2 install requires a reboot** and is a machine-wide change. It is a
  prerequisite step with an interactive surface — `wsl --install --no-launch` avoids
  the distro first-run prompt, and the exit code must be read directly.
- **Podman with no machine returns exit 0 on `machine list`.** An empty list is not an
  error, so a harness that checks only the exit code will report a healthy substrate
  that can run nothing. `cross-os.dtd` must require a *count*, not a status.
- **`ai-slop.mjs` cannot see 87% of the README.** Any README law written against it
  inherits that blindness. Measure bytes and section spans separately.
- **The gate is ~40 chained npm steps.** A 3-OS matrix multiplies that by three; the
  macOS leg will surface BSD divergence one step at a time, not all at once. Budget
  several passes, not one.
- **`add` and `impactful` remain unbounded** until the grammar changes. Prose alone
  will not fix it, for the same reason `LAW.ASK.3` did not.

## Current State and Trends

v7.0.0 is tagged and the tree is clean (`git status --porcelain` empty, measured).
Eleven tags: v1.0.0 through v7.0.0. The pass cadence is accelerating and the finding
count per pass is falling — pass 15 reported *"seven findings, one high — the lowest
of the release."* The instruments are converging on the code faster than the code is
moving.

The direction of travel is from checked prose toward checked declarations. Passes 22
through 27 are all of this kind: *"a command required an element it never rendered"*,
*"the enforcement had no route from any command"*, *"six laws that governed nothing"*,
*"two CI steps that could not fail"*, *"the law-gap arm could not trip"*. Each is an
instrument that was decorative until someone tripped it on purpose.

8.0.0 extends that axis from the artefact to the platform. The question the release
answers is the same one every pass answers: *is this claim checkable, and has anyone
made it fail?*

## Key Takeaways

1. **No regression exists in v7.0.0 at file granularity — zero files deleted,
   236 lines removed, all narrated.** The `RECORD.info` loss is a memory of pass 13's
   false comment, which pass 15 corrected. Build `Regression-Extention-Retenue.dtd`
   for *claims*, not for diffs: a diff-based detector would have found nothing here.
2. **`$SIGIL_VARIABLES_VARIANTS.md` is exonerated by content** — zero mentions of
   RECORD or adiutor — but should still be rewritten, because its flags fire on
   hazards this codebase never touches (553 `$ARGUMENTS`, zero `$0`), which trains a
   reader to skim the whole document.
3. **The ask-me loop is a grammar defect with a two-line fix**: bound `add` and
   `impactful` with an enumeration the way `more` is bounded, and give the root an
   `artifact`. "Only command without a numbered file" is false — 125 of 130 have none.
4. **The OS bias is inverted.** 5/5 CI jobs are `ubuntu-latest`; macOS is certified by
   nothing. The first thing that breaks on `macos-latest` is `stat -c %s` at
   `gate.yml:109` and `tapes.yml:50`, not any checker.
5. **The local substrate does not exist yet.** podman 6.1.0 with zero machines, WSL
   not installed. WSL2 is a blocking prerequisite, and macOS-in-a-container is not a
   licence-compliant path — macOS certification is CI-only.
6. **The README's fault is 478 lines of Usage (51%), not prose**, and the slop gate
   that guards it reads only 1189 of its words.

## Remaining Unknowns

- [ ] Does the full `npm run gate` chain still pass on this tree today? (assumed: yes,
      since v7.0.0 was tagged green and the tree is clean — not re-run in this session)
- [ ] Which of the ~40 gate steps fail first on `macos-latest`, beyond the two `stat
      -c` lines? (assumed: the BSD/GNU divergence is otherwise small, given the
      checker scan found only `head -c`)
- [ ] Does `wsl --install` succeed on this Windows 11 Pro N build without a feature
      pack? (assumed: yes; N editions lack media features, not the WSL optional
      feature)
- [ ] Is `.dtd-file-examples` (2219 files: JATS, DocBook, TEI, DITA, MathML, SVG,
      XHTML, krita, office) meant as a validation corpus for `cross-os.dtd` or as
      structural precedent? (assumed: structural precedent — real DTDs to imitate in
      form, since none of them concern operating systems)
- [ ] Did any *other* v7.0.0 line removal cost a capability? (assumed: no — the six
      largest deletions are each explained by a pass commit body; the remaining ~150
      lines across ~200 files are 1-2 line edits, not audited individually)

## Implementation Context

### application

- **when_to_use**: the 7.1.0 patch should be built as a companion pass in the existing
  cadence (pass 28+), not as a new release process. The 8.0.0 cross-OS work needs its
  own DTD because it introduces a new axis (the OS) that no existing law names.
- **when_not_to_use**: do not build a diff-based regression detector — it would have
  returned green on the only regression this release actually had. Do not attempt
  local macOS virtualization.
- **prerequisites**: WSL2 installed and a `podman machine` created before any local
  Linux certification claim; `stat -c` replaced before any `macos-latest` job.

### technical

- **`cross-os.dtd`** — draft law set, each needing a planted failure:
  - `LAW.XOS.1` A cross-OS claim names the OS, the runner and the date it was
    measured; an OS not run is declared untested, never assumed.
  - `LAW.XOS.2` A shell instrument is POSIX, or declares its GNU dependency and
    carries the BSD form beside it.
  - `LAW.XOS.3` A local certification names its substrate and its count; a substrate
    that reports zero instances yields UNCERTIFIED, never a pass. (Written against the
    measured `podman machine list` exit-0-on-empty trap.)
  - `LAW.XOS.4` macOS is certified on Apple hardware only; a macOS claim from any
    other host is refused, with the licence as the stated reason.
  - `LAW.XOS.5` Exit 124 from a cross-OS harness is UNCERTIFIED and names the OS that
    timed out, mirroring LAW.COMPANION.5.
  - `LAW.XOS.6` A path an instrument writes uses `/` and LF; an assertion never
    compares a platform separator literally.
- **`Regression-Extention-Retenue.dtd` + `lib/regression.mjs`** — verbs `diff <tagA>
  <tagB>`, `retenue`, `controls`:
  - `LAW.RER.1` Every declaration removed between two tags is listed with the commit
    that removed it and the reason in that commit body; a removal with no recorded
    reason is a regression candidate.
  - `LAW.RER.2` A capability a comment asserts is checked against a named reader
    before it ships; a claim naming no runnable reader is a finding. (This is the law
    that would have caught pass 13.)
  - `LAW.RER.3` *Retenue*: a declaration that survives with no reader is declared
    vestigial together with the reason it is kept — `RECORD.info` is the reference
    case and its reason is that `%command-info-types;` needs a reference.
- **ask-me fix**: declare `ask.adds "(1|2|3)"` and `ask.impactfuls "(1|2)"` before the
  `cc-ask` include (the LAW.ASK.11 driver-file pattern already exists for rounds), add
  the matching bound to `LAW.ASK.3`, and give `intake_session`, `many_session` and
  `preview_session` an `artifact` element.
- **CI**: change `stat -c %s "$g"` to `wc -c < "$g"` at `gate.yml:109` and
  `tapes.yml:50` — POSIX, no branch needed.
- **gotchas**: `podman machine list` exits 0 on an empty list; `ai-slop.mjs` skips code
  blocks and tables; a `LAW.*` sentence is not a checkable bound.

### integration

- **works_with**: the companion-pass harness (`checker/companion-audit.sh`) already
  has the shape a cross-OS audit needs — phase, range, ceilings, PIPESTATUS, one
  verdict line. Extend its scope line with an OS field rather than writing a new
  runner. `lib/starlist.mjs` already carries the only platform-conditional logic that
  matters and already declares `STAR.no_search` for a capability a manager lacks —
  the same pattern fits an OS a substrate cannot provide.
- **conflicts_with**: `dockur/macos` under WSL2 — licence-noncompliant, drop it.
  A diff-only regression detector — it would return green on the case that motivated
  it. De-slopping the README — the gate already passes; the fault is structural.
- **alternatives**: for local Linux, `qemu-system-x86_64` is already present and needs
  no WSL2, at the cost of a slower loop than a podman machine; for the certification
  itself, the GitHub Actions 3-OS matrix is authoritative and the local harness proves
  only that it would pass.

## Next Action

Build 7.1.0 as companion pass 28: fix `stat -c` at the two CI lines, bound `add` and
`impactful` in `cc-ask`, give the three ask-me roots an `artifact`, rewrite
`$SIGIL_VARIABLES_VARIANTS.md` for signal density with the flags removed, and move the
478-line README Usage section into `docs/`. Then install WSL2 and create a podman
machine before writing a single `LAW.XOS.*`, so the first cross-OS law is measured on
a substrate that exists.

## Sources

- [file] `RoT_DtD_Commander/dtd/cc-record.dtd:41-43` — "Nothing reads RECORD.info at runtime" — 2026-09-05
- [file] `RoT_DtD_Commander/commands/ask-me-questions-dtd.md:9,210,220` — root, content model, LAW.SESSION.2 — 2026-09-05
- [file] `RoT_DtD_Commander/commands/ask-me-many-questions-dtd.md`, `ask-me-preview-dtd.md` — roots — 2026-09-05
- [file] `RoT_DtD_Commander/lib/starlist.mjs:73,101,109,152` — platform branches — 2026-09-05
- [file] `RoT_DtD_Commander/lib/workflow.mjs:101,115` — platform branches — 2026-09-05
- [file] `RoT_DtD_Commander/checker/live-sweep.mjs:189` — taskkill branch — 2026-09-05
- [file] `RoT_DtD_Commander/checker/companion-audit.sh:1-62` — audit contract and scorer — 2026-09-05
- [file] `RoT_DtD_Commander/.github/workflows/gate.yml:22,109,120,162` — runners, `stat -c` — 2026-09-05
- [file] `RoT_DtD_Commander/.github/workflows/tapes.yml:20,50` — runner, `stat -c` — 2026-09-05
- [file] `RoT_DtD_Commander/.github/workflows/template-lint.yml:14` — runner — 2026-09-05
- [file] `RoT_DtD_Commander/lib/ordinals.mjs:1-30` — greek/iupac ordinal system — 2026-09-05
- [file] `artifacts/_sweep/byproducts/$SIGIL_VARIABLES_VARIANTS.md:176,281,321` — the two flags, the utility ranking — 2026-09-05
- [command] `git diff --shortstat v6.0.0 v7.0.0` — 223 files, 9135+, 236- — 2026-09-05
- [command] `git diff --diff-filter=D --name-only v6.0.0 v7.0.0` — 0 rows — 2026-09-05
- [command] `git log -S 'RECORD.info' -- bin/adiutor.mjs` — 0 commits — 2026-09-05
- [command] `git log -1 --format=%b af8ab70 5e6403f 6283b7d` — passes 13, 14, 15 bodies — 2026-09-05
- [command] `grep -c 'RECORD\|adiutor' $SIGIL_VARIABLES_VARIANTS.md` — 0 — 2026-09-05
- [command] `grep -rho '$ARGUMENTS\|$[0-9]' commands/ src/commands/ | sort | uniq -c` — 553 $ARGUMENTS, 0 positional — 2026-09-05
- [command] `grep -l '<!ENTITY RECORD\.' commands/*-dtd.md | wc -l` — 5 of 130 — 2026-09-05
- [run] `node lib/ai-slop.mjs README.md` — exit 0, 1189 words, all measures hold — 2026-09-05
- [run] `podman --version` — 6.1.0 — 2026-09-05
- [run] `podman machine list` — exit 0, zero machines — 2026-09-05
- [run] `wsl -l -v` — "The Windows Subsystem for Linux is not installed." — 2026-09-05
- [measurement] README 944 lines / 69,557 bytes; Usage lines 204-681 = 478 lines = 51% — 2026-09-05
- [measurement] GNU-idiom scan of `checker/*.sh` — only `head -c` x2, BSD-safe — 2026-09-05
- [measurement] `cc-resources/.dtd-file-examples` — 2219 files — 2026-09-05
- [note] macOS licensing forbids virtualization on non-Apple hardware — reasoned from the macOS SLA, not verified against a document in this session
