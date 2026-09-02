<!--
    This file is part of RoT DtD Commander.
    SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
    Copyright 2026 Saimonokuma.
-->

<div align="center">

# 🜏 RoT DtD Commander

**Commands that carry their own grammar, and a doctor that reads it**

*68 Claude Code slash commands, 19 skills and 4 agents whose answer grammar, verdicts, laws and trust boundary are declared in a DTD inside each file; a guided NPX installer; and the Adiutor, a Stop hook that checks every answer against the DOCTYPE that produced it*

[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/saimonokuma)
[![Nova-Violet Role](https://img.shields.io/badge/Nova--Violet-Role-9b59b6?style=for-the-badge)](https://github.com/Nova-Violet-Role)
[![License](https://img.shields.io/badge/License-AGPL--3.0_OR_EUPL--1.2-764ba2?style=for-the-badge)](LICENSE)

[![Checker](https://img.shields.io/badge/checked-91_files%2C_0_failed-27ae60?style=flat-square)](#-what-is-claimed-and-the-instrument-behind-each-claim)
[![Contract](https://img.shields.io/badge/contract_audit-155_declarations%2C_0_unused-27ae60?style=flat-square)](#-what-is-claimed-and-the-instrument-behind-each-claim)
[![Controls](https://img.shields.io/badge/guards_tripped_on_purpose-11_%2B_6-27ae60?style=flat-square)](#-verify-it-yourself)
[![Listed on ClaudePluginHub](https://www.claudepluginhub.com/badge/nova-violet-role-rot-dtd-commander)](https://www.claudepluginhub.com/plugins/nova-violet-role-rot-dtd-commander?ref=badge)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-D97757?style=flat-square)](https://claude.com/claude-code)
[![REUSE](https://img.shields.io/badge/REUSE-compliant-blue?style=flat-square)](https://reuse.software/)

</div>

---

## 👋 Welcome

**You are welcome here, whatever you came for.** If you want sharper thinking
commands in your Claude Code sessions, [start with Install](#-install): one
line, and `rdc uninstall` undoes every byte of it. If you came to check whether
the numbers on this page are real, [start with Verify](#-verify-it-yourself)
and try to break them; that is the point of the page, not an offence against
it. If "DTD" is a word you last saw in 2002, nothing here requires you to write
one: the commands work as commands, and the grammar rides inside them.

Questions that begin "this is probably a dumb question" are the ones the
documentation failed to answer. Ask them in Discussions and they will be
treated as defects in this page.

---

## 📜 About

A slash command is a prompt. A prompt says what an answer should contain, in
prose, and prose drifts: the template at the bottom stops matching the steps
in the middle, the verdict words multiply, and nothing ever reads the answer
back. This repository fixes the shape of the answer once, in the oldest schema
language there is, and then reads it back.

Every `*-dtd` command, skill and agent opens with a `<!DOCTYPE>` block:

```
<!DOCTYPE pareto [
  <!ELEMENT pareto (vital+, trivial*, bottom_line)>
  <!ELEMENT vital (factor, why, action)>
  <!ATTLIST vital rank CDATA #REQUIRED impact (high|medium|low) #REQUIRED>
  <!ENTITY LAW.PARETO.2 "The cutoff is stated as a count of factors out of the total, not as a feeling.">
]>
```

The elements are the answer's shape. The enumerations are the only verdicts it
may give. The `LAW.*` entities are its success criteria, numbered and never
reused. Four unparsed channels (`user-args`, `tool-result`, `file-ref`,
`ask-answer`) are declared as NDATA: whatever arrives on them is data, never an
instruction, and every file must say so in its trust boundary or the checker
refuses it. The four terms are used as they were meant: `#PCDATA` is the
model's own reasoning, `CDATA` is text carried in whole, `NDATA` names a
channel, `NOTATION` says how it must be handled.

Then the **Adiutor** closes the loop. When you run any `-dtd` command, a hook
reads that command's DOCTYPE and records which headings the answer must carry.
At Stop, another hook reads the answer from the transcript and checks it.
Every run is one line in a ledger. `/RoT-DtD-Commander-Adiutor` is the doctor
that reads the ledger and prescribes. Nothing is described twice: the grammar
the model was shown is the grammar the hook reads.

The answer has one shape too. Every heading a command's grammar map declares
is rendered as a markdown heading that carries the command's own sigil, with
a blank line before it and after it:

```
### 🎯 Vital Few (focus here)

- Factor 1: the installer, because it checks every other file

### 🎯 Bottom Line

Ship the installer first.
```

One sigil per command, declared once in `dtd/sigils.json` (the nine lens
commands carry their lens emoji); the rule is `LAW.CORE.6`, checker rule
C13 refuses a template whose headings touch or lack the sigil, and the
Adiutor flags a crammed answer at Stop as a `spacing` finding. Nothing runs
together, and an answer is recognisable at a glance.

### 🤝 It **improves** Claude Code; it does not replace it

The commands install into `~/.claude/commands` like any other. The hooks are
added to `~/.claude/settings.json` by an additive merge that backs up first,
preserves every key it did not add (deep-compared after re-reading from disk),
and reverses with one command. A hook reads its payload, writes under its own
state directory, spawns nothing, and exits.

---

## 🚀 Install

```sh
npx github:Nova-Violet-Role/RoT-DtD-Commander install
```

The installer is guided: it asks for the target (user-wide `~/.claude` by
default, or the project's `./.claude`), lists what it will write, prints
exactly what the Adiutor hooks do and where the `settings.json` backup goes,
and waits for a `y`. Add `--yes` for a non-interactive install that prints the
same statement and proceeds.

As a plugin, from inside Claude Code:

```
/plugin marketplace add Nova-Violet-Role/RoT-DtD-Commander
/plugin install rot-dtd-commander@rot-dtd-commander
```

From a clone:

```sh
git clone https://github.com/Nova-Violet-Role/RoT-DtD-Commander
cd RoT-DtD-Commander
node bin/rot-dtd-commander.mjs install      # or: npx . install
```

### 🔧 Requirements

Node 20 or later. Nothing else is required: the fourteen checker rules, the
contract audit and the Adiutor run on Node alone.

### ⚙️ Configuration

| variable | values | effect |
|---|---|---|
| `ROT_DTD_ADIUTOR` | `off`, `warn` (default), `strict` | `warn`: a failed answer gets a ledger line and a one-line system message. `strict`: the Stop is blocked **once** per run with the prescription as the reason; the second Stop always passes. `off`: ledger only. |
| `ROT_DTD_STATE` | a directory | where the ledger and open runs live (default `~/.claude/rot-dtd-commander`) |

Reverse everything: `rdc uninstall` removes every file in the manifest and
disarms the hooks; `rdc disarm` removes only the hooks.

---

## 🕹️ Usage

Sixty-eight commands, in five families. Every one of them opens with its
DOCTYPE and closes with its laws.

**Thinking models** (the argument, or the current discussion): `/pareto-dtd`,
`/swot-dtd`, `/5-whys-dtd`, `/10-10-10-dtd`, `/eisenhower-matrix-dtd`,
`/occams-razor-dtd`, `/inversion-dtd`, `/one-thing-dtd`,
`/opportunity-cost-dtd`, `/via-negativa-dtd`, and the two that reason with
ids: `/first-principles-dtd` (every assumption has an origin and a verdict;
the rebuilt conclusion names the truths it stands on) and `/second-order-dtd`
(every effect has an order, a cause, a sign, a horizon and a confidence; loops
are named).

**The Phantom Books shelf**, twenty commands each drawing one structure from
one book: `/tetralemma-dtd` (four corners, then what the claim depends on),
`/loci-dtd` (a memory palace for a codebase or a handoff), `/babel-dtd` and
`/catalog-dtd` (enumerate a finite space; verify an index both ways),
`/count-the-library-dtd` (size a space before searching it), `/goetia-dtd`
(the agents actually installed, each with office, seal and bound),
`/clean-unclean-dtd` (taint tracking with a rite that is proven to fire),
`/eleusis-dtd` (progressive disclosure with gates that can be failed),
`/voluspa-dtd` (the end first, then the stanzas back to now),
`/havamal-dtd` (sayings that survive without their context),
`/atharvan-dtd` (a charm and a rite per remedy), `/sutra-dtd` (every shortcut
with its domain and a tried counterexample), `/wu-wei-dtd` (the do-nothing
branch costed), `/water-dtd` (constraints marked hard, soft or assumed; the
course through yield points), `/witnesses-dtd` (seen versus inferred),
`/four-branches-dtd` (one change told by user, operator, attacker,
maintainer), `/redaction-dtd` (two accounts, classified variants, the
archetype), `/sapiential-dtd` (clever against wise), `/formula-dtd` (every
number re-derived from the executable), and `/phantom-dtd`, which routes a
problem to the right shelf.

**Research** (with the AskUserQuestion intake declared in `cc-ask.dtd`):
`/deep-dive-dtd`, `/ask-me-questions-dtd`, `/competitive-dtd`,
`/feasibility-dtd`, `/history-dtd`, `/landscape-dtd`, `/open-source-dtd`,
`/options-dtd`, `/technical-dtd`. Add `--no-gate` to any of them for an
autonomous run: every gap becomes a listed assumption instead of a question.

**The nine lenses of RoT MoE, as commands.** Each one carries its lens's
mechanism as grammar, opens with that lens's own four questions, holds one
mid-run gate where the mechanism branches, renders the lens's bound as a
checkable line, and quotes the live router marker when the RoT MoE plugin is
installed:

| command | what the lens does here | mid-run gate |
|---|---|---|
| ⚜️ `/rot-nova-dtd` | six NSIL axes, one decision (CONFIRM, OVERRIDE, BOOST, FUSE, ELEVATE), four or more roles, purification, a convergence that names what it retains | which roles to weight |
| 🎷 `/rot-violet-dtd` | the emotional frequency, one of five jazz tracks, a weighted landscape, four roles, a synthesis, the unplayed note | play the unplayed note or not |
| ⚪ `/rot-antivenom-dtd` | diagnose, isolate, neutralize, purify, verify; findings with severity, level and confidence; anything possibly creative preserved and flagged | purify or preserve |
| 🕷️ `/rot-venom-dtd` | perceive, route, one strike under 500 words at `ci` 0.95 or as a recommendation with its deciding fact, two questions pre-empted, the reversal named | none, by its bound |
| 🩸 `/rot-carnage-dtd` | three to five unrelated domains, a fragment each, a juxtaposed weave, three or more connections, survivors judged by a real constraint and handed to the lens that ships | which collisions meet reality |
| 🔮 `/rot-chroma-dtd` | twelve timelines under five experts spawned from the question and the answers, five shown with five steps, a forced dissent, forks kept, a horizon | which timeline to expand |
| ⬜ `/rot-soleil-dtd` | a payload through five layers, an M2M packet, Token Optimization from both counts; for file edits, handoffs and context | none, by its bound |
| 🜏 `/rot-eidolon-dtd` | three recursion levels, preserve, transmute, rebuild, a manifest, hybrids by the law, evolution proposals born pending | approve or reject each proposal |
| 🧭 `/rot-claude-dtd` | hypotheses, instruments shown failing first, measurements with exit codes read directly, a verdict with no middle state | which measurements to run now |
| 🌌 `/rot-elevate-dtd` | all nine at full weight: nine intakes of four questions, nine stanzas, hybrids for the fused pairs, tensions kept, a convergence with a named lead | the nine gates |

The parameter rows, the bands and the hybrid law live in `dtd/cc-rot.dtd`
and the `rot-lenses-dtd` skill; the mechanisms are transcribed from this
organisation's own RoT MoE packet at v10.0.2 (the nine charters and the engine), and `NOTICE.md` says so.

**Workflow and wrappers**: `/whats-next-dtd`, `/add-to-todos-dtd`,
`/check-todos-dtd`, `/run-plan-dtd`, `/heal-skill-dtd`, `/debug-dtd`, the
`create-*-dtd` and `audit-*-dtd` wrappers, and `/RoT-DtD-Commander-Adiutor`.

Eighteen skills load themselves when the description matches: the eleven
converted ones (`create-plans-dtd`, `create-slash-commands-dtd`,
`debug-like-expert-dtd`, and the rest) and seven new: `dtd-core-dtd` (the
contract), `dtd-forge-dtd` (make a new command), `dtd-audit-dtd`,
`ask-gate-dtd`, `phantom-library-dtd`, `records-dtd`, `dtd-eval-dtd`. Four
agents audit the set: `slash-command-auditor-dtd`, `skill-auditor-dtd`,
`subagent-auditor-dtd`, `dtd-contract-auditor`.

### The Adiutor, decoded

```
Adiutor armed for /pareto-dtd: root pareto; required headings: Vital Few (focus here), Bottom Line; 8 laws; the answer is checked at Stop (policy warn).
```

That line is injected when a `-dtd` command starts. It is read from the
command's own file, not from a second description. At Stop the check judges
the rendered markdown: the declared headings present and in order, an
"Assumptions Made" section on an autonomous run, and every short id an answer
references (`E4`, `T1`, `A2`) defined somewhere in it. It does not judge
whether the content is true; `NOTICE.md` §D says so in full.

```sh
rdc doctor          # manifest vs disk, checker on installed files, hooks armed, settings parses, ledger sound
rdc ledger --last 5 # closed runs, ten numbered fields each
rdc suggest         # a charm and a rite for every failed run
```

---

## 🎬 The install tutorial, on camera

Every GIF is rendered from a committed [VHS tape](docs/tapes/) on release.
`vhs` renders them where it runs (the `tapes` workflow does so on ubuntu); on
the maintainer's Windows machine it stalls before spawning `ttyd`, so
`docs/tapes/render.mjs` reads the same tapes, really runs the commands, feeds
the typed answers on stdin, and draws the captured output with `ffmpeg`.
Either way the install tape is the test of the guided prompts: a tape that
fails to render is a failed test.

### Step 1: install

```sh
npx github:Nova-Violet-Role/RoT-DtD-Commander install
```

Answer three questions: the target (`1` for user-wide, `2` for this project,
`3` for a path), the kinds (Enter for all), and `y` after reading what the
Adiutor will do.

<details>
<summary><b>Watch: the guided installer, end to end</b> (installs into a scratch path so every line is visible: the three questions, the capability statement, 219 files written and verified, the hooks armed with the backup path printed)</summary>

![install](docs/gifs/install.gif)

</details>

Afterwards, restart Claude Code once so the agents and the hooks load.

### Step 2: check what you installed

```sh
rdc doctor          # or: node ~/.claude/rot-dtd-commander/bin/adiutor.mjs doctor
rdc check           # from a clone: every source against its own DOCTYPE, rules C1 to C14
```

<details>
<summary><b>Watch: the checker over the whole tree</b> (rules C1 to C14 on 91 sources, then <code>checker/checker-controls.sh</code> refusing three mutations on purpose)</summary>

![check](docs/gifs/check.gif)

</details>

### Step 3: run a command, then ask the Adiutor

In Claude Code, type any `-dtd` command, for example:

```
/pareto-dtd what to do first on the release
```

The prompt hook prints one line saying which headings the answer must carry;
the answer arrives as `### 🎯 Vital Few (focus here)`, `### 🎯 Trivial Many
(deprioritize)` and `### 🎯 Bottom Line`, each with a blank line around it;
at Stop the answer is checked; the run becomes one ledger line. Then:

```
/RoT-DtD-Commander-Adiutor
```

<details>
<summary><b>Watch: the Adiutor, driven by hand in a scratch state directory</b> (a <code>/pareto-dtd</code> prompt opens a run and prints the armed line, a complete answer passes at Stop, a broken one fails with the missing heading named, then <code>rdc ledger</code> and <code>rdc suggest</code> with the charm and the rite)</summary>

![doctor](docs/gifs/doctor.gif)

</details>

### Step 4: when an answer fails its grammar

Under the default `warn` policy you get a one-line system message and a
ledger line; `/RoT-DtD-Commander-Adiutor` shows the charm (what to change)
and the rite (how the fix is verified). Under `ROT_DTD_ADIUTOR=strict` the
Stop is blocked once with that prescription as the reason.

<details>
<summary><b>Watch: eleven guards tripped on purpose</b> (<code>node bin/adiutor.mjs controls</code>: C1 a missing heading is found, C2 a complete answer passes, C3 strict blocks the Stop once and never twice, C4 <code>stop_hook_active</code> is silent, C5 a ledger line with an inserted column is refused, C6 arm preserves foreign keys and is idempotent, C7 the policy default is bound to the DTD, C8 a run opens only for an installed command, C9 a crammed answer is a spacing finding, C10 the answer of a run is every assistant text after the command prompt, C11 prune-plugin refuses while registered and removes the leftover)</summary>

![controls](docs/gifs/adiutor-fail.gif)

</details>

### Step 5: summon a lens

```
/rot-chroma-dtd should we keep committing the generated command tree
```

Chroma asks its four questions (horizon, coalescence mode, the constraint
every future inherits, what you fear and hope), spawns twelve timelines,
shows five with their steps, forces a dissent, and asks which timeline to
expand. `/rot-elevate-dtd` does the same with all nine lenses, 36 questions in
nine rounds.

<details>
<summary><b>Watch: a lens command under the checker and the Adiutor</b> (<code>rdc check</code> on the ten lens commands with the engine subset inlined, the eight ROT laws present in the ELEVATE command, then the Adiutor arming for <code>/rot-chroma-dtd</code> and naming the headings its answer must carry)</summary>

![lens](docs/gifs/lens.gif)

</details>

### Step 6: undo any of it

```sh
rdc disarm       # remove only the hooks; files stay
rdc uninstall    # remove every file the manifest lists, disarm, remove its own backups
rdc prune-plugin # after `claude plugin uninstall` and `marketplace remove`: delete the cache the plugin CLI leaves behind
```

A `settings.json` you had before is left byte-identical; one this tool created
from nothing is removed again once it is empty. The plugin CLI's own
`uninstall` and `marketplace remove` clean the registry but leave
`~/.claude/plugins/cache/rot-dtd-commander/` on disk (measured: 6.2 MB); the
doctor flags it as a double install and `rdc prune-plugin` removes it, refusing
while the plugin is still registered.

---

## ✅ What is claimed, and the instrument behind each claim

| claim | instrument | last measured |
|---|---|---|
| 68 commands, 19 skills, 4 agents carry a DOCTYPE | `rdc list` | 2026-09-02 |
| every source passes rules C1 to C14 | `rdc check`: `checked 91  failed 0` | 2026-09-02 |
| the committed resolved tree equals a fresh build | `rdc build --check`: `223 targets, 0 drifted` | 2026-09-02 |
| the checker refuses a removed declaration, a `(CDATA)` model, an orphan element, a crammed heading, a heading without its sigil and a front-matter value YAML would misread | `bash checker/checker-controls.sh` | 2026-09-02 |
| every declaration in the five subsets is used by a source, and every law prefix is numbered densely | `node checker/contract-audit.mjs`: `155 declarations, 0 unused, 0 law gaps` | 2026-09-02 |
| the Adiutor finds a missing heading, passes a complete answer, blocks once under strict and never twice, stays silent on `stop_hook_active`, refuses a ledger line with an inserted column, preserves foreign settings keys and is idempotent, binds its policy default to `dtd/adiutor.dtd`, opens runs only for installed `-dtd` commands, flags a crammed answer as a spacing finding, and reads the whole turn after the command prompt | `node bin/adiutor.mjs controls`: `11 run, 0 failing` | 2026-09-02 |
| a live `/pareto-dtd` turn in a fresh headless session, through the armed hooks, closes as `pass` in the ledger | `MSYS_NO_PATHCONV=1 claude -p "/pareto-dtd ..." --dangerously-skip-permissions`, then `rdc ledger --last 1` | 2026-09-02 |
| a live `/rot-chroma-dtd ... --no-gate` turn renders all thirteen lens headings with the sigil and closes as `pass` | the same, then `rdc ledger --last 1` | 2026-09-02 |
| the marketplace round-trip (add, install, uninstall, remove) leaves the registry clean and the npx set intact; the doctor turns its `plugin state` and `double install` rows red while both are installed, and red again on the cache directory the plugin CLI leaves behind, which `rdc prune-plugin` removes (and refuses to touch while the plugin is registered) | `claude plugin marketplace add Nova-Violet-Role/RoT-DtD-Commander`, `claude plugin install rot-dtd-commander@rot-dtd-commander`, `rdc doctor`, `claude plugin uninstall ...`, `claude plugin marketplace remove rot-dtd-commander`, `rdc prune-plugin`, `rdc doctor` | 2026-09-02 |
| the front matter of every source parses as YAML (no bare `: ` or ` #` in a value), so GitHub renders it without an error | `rdc check` rule C14; `node checker/frontmatter-sweep.mjs --check`: `0 would change, 91 already parse`; confirmed once with js-yaml 4.1.0 outside the repository | 2026-09-02 |
| every source file carries the SPDX header | `bash checker/spdx-sweep.sh`: `0 missing` | 2026-09-02 |
| no carriage return and no BOM in any tracked file | `bash checker/crlf-sweep.sh`: `0 bad` | 2026-09-02 |
| install writes a manifest, uninstall removes only what the manifest lists, and a scratch target ends at zero files | the `install-roundtrip` job in `.github/workflows/gate.yml` | every push |

If one of these does not re-run for you, open the issue form **"A claim in
our docs is false"**. It is the most welcome report there is.

---

## 🎓 Verify it yourself

```sh
git clone https://github.com/Nova-Violet-Role/RoT-DtD-Commander
cd RoT-DtD-Commander
npm run gate; echo "exit=$?"
```

`gate` runs `build --check`, `check`, the eight Adiutor controls, the contract audit, the checker controls and the
two sweeps; each ends with a line of counts, and the exit code is read
directly. Then break it:

```sh
bash checker/checker-controls.sh      # six mutations and one untouched file, each asserted present, each refused
node bin/adiutor.mjs controls         # eleven guards; C3 is the strict block, once and never twice
```

A guard nobody has tripped on purpose is decoration. Every one here has been.

---

## 🤝 Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). The short form: edit `src/`, run
`npm run build`, run `npm run gate`, watch a control fail before you trust it,
and say what you could not verify. New commands are made with the
`dtd-forge-dtd` skill: grammar first, prose second.

## 🏛️ Where this sits in the organisation

[Nova-Violet Role](https://github.com/Nova-Violet-Role) builds convergent
cognitive frameworks, formally verified where it counts. `RoT-MoE` routes a
prompt through nine lenses; `RoT-DTD-GOAL` makes completion something a Stop
hook earns. This repository is the third piece: the commands themselves carry
a contract, and a Stop hook reads it. The contract DTDs of the two siblings are
the ancestors of `dtd/cc-core.dtd`, and their both-direction checkers are the
ancestors of `rdc check`.

## ☕ Supporting a non-profit

[Ko-fi](https://ko-fi.com/saimonokuma) buys time, never priority. Proving a
number on this page wrong is worth more than a coffee, and it is credited in
the changelog.

### 🙏 Standing on other people's work

Lex Christopherson's `taches-cc-resources` (MIT), from which thirty-three
commands and eleven skills were converted with their prose retained; the
`vhs` and `ttyd` authors. The full
provenance, including what was deliberately left out, is in
[NOTICE.md](NOTICE.md).

## 📄 Licence

**AGPL-3.0-or-later OR EUPL-1.2**, at your option, for every file in this
repository. Root `LICENSE` is the AGPL text (the one GitHub reads);
`LICENSE-EUPL-1.2` sits beside it; `LICENSES/` holds both plus the upstream
MIT for tooling. Forty-four converted files carry an MIT portions line in
their header. Copyleft on purpose: what is shared here cannot be enclosed
later, by anyone, including us.

<div align="center">

*Reality is the judge.*

</div>
