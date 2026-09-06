<!--
    This file is part of RoT DtD Commander.
    SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
    Copyright 2026 Saimonokuma.
-->

# Putting a CLI plugin on claude.ai and Claude Cowork

A recipe, written from three rejected uploads and one that worked. If you
maintain a Claude Code plugin that ships executables and you want it installable
by drag-and-drop on a hosted surface, this is the shortest path we found.

Nothing here is theory. Every number was produced by a command named beside it.

---

## The one-paragraph version

The hosted surfaces will not take a repository. They take a *distribution*, and
those are different artifacts. Derive the second from the first, never mutate
the first, and put a guard between them that fails loudly when a future release
breaks the derivation. Three rules cost us three uploads to learn: no `bin/` at
the archive root, no description over 500 characters, no XML tag in a
description. A fourth we learned from a count, not an error.

---

## Round 1 — `bin/` and the wrapper that was innocent

The GitHub *Download ZIP* was refused twice at once:

```
Plugin contains a top-level bin/ directory ('bin/adiutor.mjs',
'bin/rot-dtd-commander.mjs'). claude.ai-hosted plugins may not ship bin/
executables because they are added to PATH on the CLI but are not shown on
the admin approval surface.

The archive must contain a .claude-plugin/plugin.json manifest, or a
top-level SKILL.md that declares the plugin's components.
```

**The first refusal is real and the reason is good.** On the CLI, a plugin's
`bin/` is prepended to PATH. The admin approval surface does not show what lands
on PATH, so an organisation admin approving your plugin cannot see what it would
put in front of `git` or `node`. Refusing the directory outright is the correct
call, and it is worth understanding before you route around it.

**The second refusal was a lie the validator did not know it was telling.** We
read it as a depth problem — GitHub nests everything under
`RoT-DtD-Commander-main/`, so the manifest sits one level below the archive
root — and we built a flat-root archive to answer it. That reading was wrong,
and round 3 proved it. Skip ahead if you want the punchline early: the manifest
was never missing.

### What we actually did about `bin/`

Nothing, in the repository. `bin/adiutor.mjs` and `bin/rot-dtd-commander.mjs`
are still exactly where the CLI, `npx`, `package.json` and the release workflow
expect them. The archive renames the directory as it is built.

Two candidates were built, `tools/` and `.bin/`. **Both cleared the refusal.**
`.bin/` is the one we shipped, because prepending one character is a smaller
change than replacing a word.

Before renaming anything, audit what depends on the name. Ours:

```
$ grep -rn "bin/adiutor\|bin/rot-dtd-commander" commands skills agents dtd docs monitors
commands: 131 files, 143 lines
skills:    24 files,  37 lines
agents:     5 files,   9 lines
dtd:        7 files,  12 lines
docs:      11 files,  21 lines
```

222 lines looks fatal. It is not. **218 of them are the same sentence** — a
comment inside each command's DOCTYPE describing how the build works. Prose, not
a path. Rewriting it would have put 131 DOCTYPEs out of step with the prose
beside them and failed our own checker, which is precisely the regression we
were trying to avoid.

Exactly **four** files name `bin/` as a live path, and only those four follow it:

| file | what breaks if it does not follow |
|---|---|
| `package.json` | its `bin`, `files` and `scripts` fields |
| `lib/arm.mjs:43` | the hook command it registers |
| `commands/RoT-DtD-Commander-Adiutor.md:235` | `<!ENTITY PATH.adiutor.plugin "CLAUDE_PLUGIN_ROOT/bin/adiutor.mjs">` |
| `src/commands/RoT-DtD-Commander-Adiutor.md` | the same, in source |

> **The `files` array is the one people forget.** Move a bundled directory
> without updating `package.json`'s `files`, and you publish a package with a
> missing directory and no error anywhere.

An explicit four-entry list beats a regex sweep when a token appears 222 times
as prose and 4 times as a path. Rule **H4** in our guard then proves the list is
complete, by refusing any *live* `CLAUDE_PLUGIN_ROOT` path still resolving
through `bin/`.

---

## Round 2 — the description contract, and a validator that stops early

Six new refusals. Five named a command whose description exceeded 500
characters; one named a skill whose description contained an XML tag.

**Do not fix the error list.** We audited the whole rule class instead, with two
independent parsers that had to agree:

```
parser agreement: 158/158
over 500 characters: 8      (the validator named 5)
XML tags in a description: 3 (the validator named 1)
manifests over 500: 2       (the validator named 1)
```

The three it never mentioned — `skills/iupac-ordinals-dtd` at 581,
`skills/dtd-forms-dtd` at 550, `skills/ai-slop-dtd` at 545 — were **longer than
every command it did name.** It does not appear to check skill length at all.
Had we fixed only the seven printed lines, upload four would have been refused
with three new names on it.

> An error list is a sample of a rule. Audit the rule.

### The constraint that decides the prose

Shortening a description is easy until something else reads it. Two of ours did:

- `checker/counts-sweep.mjs:68-83` matches **five** patterns against the two
  manifest descriptions — the command/skill/agent counts, the declaration
  count, the guard counts as words, and one anchored to the marketplace
  description's opening quote.
- `checker/about-sweep.mjs` refuses "release archaeology": a description that
  reads as a changelog.

So `plugin.json` had to lose **54%** of its length and `marketplace.json`
**61%**, while keeping every machine-checked token. Both now sit at 497
characters with all five patterns intact.

That is not truncation. It is editing against a specification — the good kind of
problem, because every constraint is testable before a byte ships.

### Two things worth stealing

**Rewrite a shared template tail once.** Eight of our `create-filetype-*-dtd`
commands share one 404-character tail. Rewriting it to 376 fixed the five the
surface named *and* pulled three siblings at 496, 495 and 480 down with them, so
the family stayed uniform instead of five short copies beside three long ones.

**Measure your own replacement before shipping it.** Five of our eight
hand-written first drafts were still over the limit, by 7 to 18 characters. The
verifier caught every one; judgement caught none.

---

## Round 3 — it installed, and it falsified our own rule

We uploaded `dotbin-wrapped`: `bin/` renamed to `.bin/`, and the GitHub wrapper
directory **kept**.

It installed. On claude.ai and on Claude Cowork.

That archive was the one our guard had built as a *control* — the candidate we
predicted would be refused, listed last in our own upload order. The rule that
refused it, H2, was wrong. The surface strips a wrapper level for the manifest
check exactly as it already did for the `bin/` check.

Which means **every "missing manifest" report was the same fault**: an over-long
`plugin.json` description makes the manifest invalid, and an invalid manifest is
reported as an absent one. One cause, reported three times across two rounds,
and we misread it as a structural problem for two of them.

H2 is withdrawn. The control that asserted it was inverted rather than deleted,
so the suite re-proves the falsification on every run instead of leaving it as a
sentence in a changelog:

```
ok   C3 a wrapped archive PASSES (H2 was falsified by an upload that installed)
ok   C3b H2 still fires when NO manifest is reachable at any depth
```

> If your guard and a real upload disagree, the upload is right. Invert the
> control; do not quietly delete it.

---

## Round 4 — the rule nobody reported: name collisions

The install succeeded and the surface reported its inventory:

> 22 Skills / 129 Commands / 5 Agents

Our tree holds **131** commands. Two were missing, and no error said so.

```
command stems that ALSO name a skill: 2
  ai-slop-dtd
  setup-ralph-dtd
```

131 − 2 = 129. Exact. **A command whose name a skill also claims does not reach
the user**, and the only symptom is a count.

We rename the *skill*, in the archive, not the command: a skill is selected by
its description, a command by the name a user types. Renaming a skill costs a
label; renaming a command costs muscle memory.

```
ai-slop-dtd      ->  ai-slop-gate-dtd
setup-ralph-dtd  ->  setup-ralph-loop-dtd
```

Both names are true of their contents rather than a suffix bolted on. Rule
**H11** recomputes the collision set from the archive itself, so a command added
in a later release that collides fails the guard *by name*.

**Check your own inventory against what the surface reports.** It was the only
place this defect was visible.

---

## The guard, and why it has a baseline

`checker/pack-claude-ai.mjs` builds the archive and refuses one the surface
would refuse. Twelve rules; the interesting ones:

| rule | refuses |
|---|---|
| H1 | a `bin/` directory at the root, or one wrapper below it |
| H2 | *withdrawn — falsified by an upload that installed* |
| H4 | a live `CLAUDE_PLUGIN_ROOT` path still pointing at `bin/` |
| H9 | any description over 500 characters, in a component or a manifest |
| H10 | any description carrying something a tag scanner reads as XML |
| H11 | a command name that a skill also claims |
| H12 | **an archive that no longer matches the recorded baseline** |

H12 is the one that matters after today. The others ask whether *this* archive
is well formed. H12 asks whether the world still looks the way it looked when a
human last proved an upload installs — the component counts, the collision set,
the shape. A release that adds a command, a skill, a long description or a new
collision turns CI red with the divergence named:

```
the archive holds 132 commands, the baseline in checker/hosted-plugin.json
records 131. A release changed the tree: re-prove an upload, then update the
baseline.
```

That failure is the point. It is deliberately **not** self-healing: a guard that
silently absorbs drift hides the very thing it exists to surface. The red build
is the message to the next session — extend the table, re-prove an upload, move
the baseline forward.

Every rule has a control that trips it on purpose. `node
checker/pack-claude-ai.mjs --controls` reports `27 run, 0 failing`. The one we
are proudest of is the boring one:

```
ok   C14 H9 does NOT fire at exactly the limit (the boundary is not off by one)
```

A length rule off by one in *that* direction rejects legal files and blames the
platform.

---

## Verify it yourself

```sh
node checker/pack-claude-ai.mjs --controls     # 27 run, 0 failing
node checker/pack-claude-ai.mjs --all          # every candidate, every rule
node checker/pack-claude-ai.mjs --strategies   # the matrix and the proven combination
node checker/badges.mjs --controls             # 6 run, 0 failing
```

And the strongest check, run from inside an extraction of the built archive —
the archive's own checker, on its own rewritten files:

```
$ node .bin/rot-dtd-commander.mjs check
checked 158  failed 0
```

---

## A note on how long this took, and on what was not used

The operator reports the whole 7.2.0 patch — the withdrawal of H2, the collision
renames, the drift baseline, the checksums, the badges, this file — took **13
minutes** of wall time.

That number is only interesting next to what it was drawn from. The schematic
machinery in this repository is a matrix:

```
$ node lib/schematic.mjs table
21 schemas in 4 families (docbook, dita, tei, data), 11 forms, 231 cells
$ node lib/form.mjs controls
form controls: ok (0 failing), guards 8, depth cap 32, alias cap 64
```

**231 rendered cells.** Every semantic schema — `refentry`, `qandaset`,
`procedure`, `glossary`, `biblioentry`, `cmdsynopsis`, `variablelist`,
`revhistory`, `concept`, `task`, `topic`, `glossentry`, `certainty`, `interp`,
`textdesc`, `item`, `key`, `msgset`, `productionset`, `example`, `table` —
crossed with every form it can be carried in, each cell rendered and each
rendering run through the guards of its own form.

The eleven forms, ranked by the guard surface each one needs:

| rank | form | what its guard has to stop |
|---|---|---|
| 1 | `polyalarm` | a polyglot whose Markdown layer is the alarm shape: every guard below, at once |
| 2 | `polyglot` | one byte stream valid to more than one parser without either one winning |
| 3 | `alarm` | a callout that must fire, and the tokens that would stop it firing |
| 4 | `heredoc` | a delimiter appearing inside the body it delimits |
| 5 | `xml` | a `]]>` inside CDATA |
| 6 | `yaml` | tags, aliases, tab indentation, unbounded depth |
| 7 | `callout` | the five GitHub callout kinds, and nesting that breaks them |
| 8 | `nt` | indentation-significant text with no quoting to hide behind |
| 9 | `jmd` | a Markdown that is also a program |
| 10 | `toml` | table headers and multi-line strings |
| 11 | `json` | the one form with no comment channel at all |

**This patch used two of those 231 cells.** The description contract needed a
YAML frontmatter scalar and a JSON object — ranks 6 and 11, the two plainest
things the matrix can render. Nothing about the problem called for a polyglot,
an alarm, or a heredoc that survives its own delimiter.

That is the claim worth taking away, and it is a modest one: the fast patch was
not fast because a clever form was chosen. It was fast because *the form did not
have to be chosen at all* — the grammar already said what a description is,
where it lives, and which guard reads it, so the work was arithmetic instead of
archaeology. The other 229 cells were sitting right there, and the correct move
was to use none of them.

A matrix earns its keep on the day you do not need it.
