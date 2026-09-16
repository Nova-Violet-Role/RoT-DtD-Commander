<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# 🜏 The `dtd/` folder

**The declarations every command carries, and the environment that lets the model see them all**

This folder holds the source of truth for the Suite. Two kinds of file live here, and one of them is new.

| kind | what it is |
|---|---|
| `*.dtd` | the shared subsets and root grammars. Never read at runtime — `bin/rot-dtd-commander.mjs` inlines them into each command's `DOCTYPE` at install time, so a command is one self-contained file. |
| `*.spec.mjs`, `*.json` | the generators and the tables they read; a family of near-identical commands is one spec here, never N hand-written files. |
| `*.md` | the rendered companions (`ladder.md`, `lists.md`, `geometry.md`), each generated from the `.dtd` beside it. |
| `claude-env.json` | the harness settings a session wants so the Suite arrives whole. Documented below. |

---

## 📐 Why `claude-env.json` exists

A `*-dtd` command is one file that carries its own grammar. That design is deliberate and it is what makes the checker possible: the declarations and the prose travel together, so `checker/` can hold each file to its own DOCTYPE and refuse any file where the two disagree. Nothing is fetched at runtime, nothing can go missing, and a command installed by copy behaves the same on every machine.

It has one consequence worth naming plainly. The Suite is large, its declarations are carried in full, and a harness with default limits will quietly render less of it than exists. `claude-env.json` is the small set of values that lets a session hold the whole thing at once.

Every value here was chosen against a measurement, and each one is stated below with what it buys.

---

## 🔧 The values, and what each is for

### `SLASH_COMMAND_TOOL_CHAR_BUDGET` — `"200000"`

The single ceiling, in characters, on the skill-and-command listing the model receives. When set, it replaces the computed budget entirely.

**Why it is set.** The listing is the index to the Suite. Each entry is a name and the description its own file carries, and half of those descriptions name the contract — `DOCTYPE`, `trust boundary`, `declared grammar`, `gate`, `rounds`. Measured on a full install: **113 of 226 described entries carry that vocabulary, holding 69.5% of the listing's characters, and they average 2.37× the length of the rest.** They are the long entries, and a budget that does not fit them is a budget that drops them first.

Two hundred thousand characters is generous on purpose. It is a ceiling, not an allocation: the listing costs what it costs and the ceiling only decides whether it arrives whole.

> **Write digits, never a suffix.** `"200k"` is not parsed — the variable is ignored and the setting silently does nothing. Measured: `"10000"` brings the listing down to 3.2k tokens, while `"10k"` leaves it at 21.9k, untouched. Plain digits only.

### `skillListingBudgetFraction` — `0.25`

The fallback, kept beside `env` rather than inside it because it is a settings key and not an environment variable. When `SLASH_COMMAND_TOOL_CHAR_BUDGET` is unset, the budget is computed as `(context window) × 4 × fraction`, and `0.25` keeps that fallback comfortably above what any current install needs.

Verify a budget by **plateau**, never by arithmetic: raise the value until the measured listing stops growing, then sit below that ceiling with margin. A char count predicts; only the plateau settles it.

```sh
claude        # then:  /context
# read the Skills line. If it stops rising as the value rises, the listing is whole.
```

### `DISABLE_PROMPT_CACHING` — `"1"`

Turns off prompt caching for the session.

**What it buys.** Determinism at the boundary. Every run of a `*-dtd` command sends its declarations as written, with no cached prefix standing between the file on disk and the request. When the grammar in the file is the contract the checker enforces, a run that is byte-for-byte what the file says is worth having — it is the same reason the subsets are inlined rather than referenced, applied one layer further out.

**What it costs, stated honestly.** A `*-dtd` command's inlined `DOCTYPE` is substantial — measured across a full install, **86.3% of command bytes are declarations, averaging about 52 KB for each command that carries one.** Caching is what makes re-invoking the same command cheap. With caching off, that grammar is re-sent every time. Leave it on for long sessions that lean on one command repeatedly; set it to `"1"` when a run must be reproducible from the files alone, which is what this folder is for.

---

## 🧭 Applying it

`claude-env.json` is a settings fragment. It merges wherever Claude Code reads settings:

```sh
claude --settings dtd/claude-env.json          # one session, nothing on disk changes
```

Or copy its keys into `~/.claude/settings.json` for the machine. Precedence runs user < project < local < `--settings`, and an `env` block set in settings reaches the process — a shell `unset` does **not** override it, which is worth knowing when testing.

---

## ✅ Verify it yourself

Nothing above needs to be taken on trust. Each claim has a command behind it.

```sh
# the listing arrives whole
claude -p --settings dtd/claude-env.json '/context' | grep Skills

# the control: a small budget must visibly truncate
printf '%s\n' '{"env":{"SLASH_COMMAND_TOOL_CHAR_BUDGET":"10000"}}' > /tmp/small.json
claude -p --settings /tmp/small.json '/context' | grep Skills

# the suffix trap: this one must NOT truncate, because the value is ignored
printf '%s\n' '{"env":{"SLASH_COMMAND_TOOL_CHAR_BUDGET":"10k"}}' > /tmp/suffix.json
claude -p --settings /tmp/suffix.json '/context' | grep Skills
```

If the second truncates and the third does not, the parser reads digits only, exactly as documented. An alarm nobody has tripped is not an alarm.

---

## 📎 Related

- `../README.md` — the Suite, its commands and the Adiutor
- `../DTD_GUIDE.md` — how a DOCTYPE is written and what the checker holds it to
- `ladder.md`, `lists.md`, `geometry.md` — the rendered companions generated from the `.dtd` files here
