<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Privacy Policy

Version 2, dated 2026-09-03. Applies to RoT DtD Commander 5.0.0 and later,
to this repository on GitHub, and to the places the README links. Every
claim below names the file or the control that measures it, the way
NOTICE.md and SECURITY.md do; a claim you cannot re-run is a defect, and the
issue form "A claim in our docs is false" is the place to report it.

## Who is responsible

Nova-Violet Role, a non-profit organisation established in the European
Union and maintained by [@Saimonokuma](https://github.com/Saimonokuma), is
the controller for the little personal data this project holds (section 5).
Contact: saimonokuma@gmail.com, or the private advisory form under the
repository's Security tab when the matter touches a vulnerability. A request
about your data is answered within one month, the period the GDPR sets; a
security report is acknowledged within seven days, as SECURITY.md says.

## 1. The short version

The software runs on your machine and sends nothing to us. We hold no
telemetry, no crash reports, no usage counts, no account, no cookie. What we
hold is what you give GitHub in public (issues, discussions, pull requests,
stars, commits) and what Ko-fi shows us about a donation. Every other party
that sees your data (GitHub, Anthropic, Ko-fi) does so under its own policy,
and only when you use its service.

## 2. What the software does on your machine, measured

| component | reads | writes | sends |
|---|---|---|---|
| `rdc install` | the repository; `~/.claude` (or `CLAUDE_CONFIG_DIR`, or `./.claude` with `--project`) | commands, skills, agents and the runtime under that directory; a manifest `.rot-dtd-commander-manifest.json` with the target path, the install time and one sha256 per file | nothing: a grep over `bin/`, `lib/` and `monitors/` finds no fetch, no http, no net and no dns module (measured 2026-09-03) |
| `rdc install --arm`, `rdc arm` | `settings.json` | a backup `settings.json.rot-dtd-commander.<n>.bak`, then the hook entries by additive merge (control C6) | nothing |
| the Adiutor hooks, when armed | the payload Claude Code hands every hook (session id, transcript path, working directory, event name); at Stop, the transcript file of the session, to find the last answer of the `-dtd` command (`lastAssistantText`, LAW.ADIUTOR.2) | one run record `rot-dtd-commander/runs/<session>.json` while a run is open (command, root, expected headings, working directory, opening time); one ledger line in `rot-dtd-commander/ledger.tsv` when it closes (RECORD.run: time, session id, command, root, expected headings, tool count, errors, status, findings, prescription); never the answer text, never a prompt | nothing: a hook reads stdin, spawns nothing and writes only under its state directory (LAW.ADIUTOR.4) |
| the AI_SLOP gate, when armed (5.1.0) | at Stop the answer of the turn; at PreToolUse the text of a Write, an Edit or a NotebookEdit and the command of a Bash call, to find a commit message or a request body (a `-F` or `--body-file` path is read from disk) | one ledger line per refusal: the spot and the measures that failed, never the text judged | nothing: a refusal is a hook reply to Claude Code |
| `rdc doctor`, `rdc controls`, `rdc ledger` | the manifest, `settings.json`, the ledger, the plugin registry under `~/.claude/plugins` | nothing; `controls` writes under a temporary state directory it removes | nothing |
| the monitor, `rdc watch` | `ledger.tsv` and nothing else (LAW.ADIUTOR.7) | nothing; it prints to your terminal and ends at 300 s | nothing |
| the task and workflow runners (`lib/task.mjs`, `lib/workflow.mjs`) | the task and workflow files of your project | `tasks/` and its ledger inside your project, and whatever the steps you declared write | whatever the commands you declared send; the runner itself sends nothing |
| the checker, the sweeps, the forge, the build | the repository | the resolved tree and the reports you asked for | nothing |

The state directory is `~/.claude/rot-dtd-commander/`; `ROT_DTD_STATE`
overrides it. `rdc uninstall` removes the files the manifest lists and keeps
`ledger.tsv` and `runs/` (measured 2026-09-03 in a scratch target: both
survived an uninstall that removed every manifest file); delete that
directory to erase them. The manifest and the run records carry the paths of
your machine, which on most systems include your user name; they never leave
the directory they are written in.

## 3. What leaves your machine, and to whom

- **Installing.** `npx github:Nova-Violet-Role/RoT-DtD-Commander install`
  makes npm fetch this repository from GitHub, and `claude plugin install`
  makes Claude Code do the same. GitHub sees that request under its own
  privacy statement. The installer itself makes no request.
- **Running a command.** Every `-dtd` command is a prompt for Claude Code.
  Your prompt, the files the model reads and the answer travel to Anthropic
  through your own Claude Code account, as every Claude Code prompt does,
  under Anthropic's terms with you. This project adds nothing to that flow and
  receives nothing from it. A command that may search the web says so in its
  DOCTYPE (LAW.DD.1 and its siblings): web research happens only when you
  name it in scope, and each such source is marked.
- **The Scratchpad Companion** (`checker/companion-audit.sh`) starts a second
  Claude Code session under the account of whoever runs it, in the
  foreground, with a tool allow-list that carries no writing or spawning tool
  (control M17). It sends the audit contract, the diff and the files that
  session reads to Anthropic the same way. Only a maintainer runs it; nothing
  in an install starts it.
- **CI.** Pushing to this repository or to a fork runs the workflows under
  `.github/workflows/`. The Actions logs of a public repository are public.
  The `release` job posts to the GitHub API of this repository with the
  workflow's own token, on a tag, and nothing else in CI sends anything; the
  workflow file is the record.

## 4. The hosted surfaces

- **GitHub.** Issues, discussions, pull requests, stars, watches and commits
  are public and processed by GitHub under its privacy statement. The issue
  forms ask for a command and its exit code, the output of `rdc doctor` and a
  ledger line, and your OS and Node version; paste only what you want public,
  and redact a path that carries your user name if you prefer. We read what
  you post and answer in the same place; we copy nothing elsewhere.
- **Releases and Actions artifacts.** The release page carries the changelog
  section of the version; the `tapes` workflow keeps rendered GIFs as
  artifacts. Neither carries user data.
- **Badges.** The README loads badges from shields.io and
  claudepluginhub.com. GitHub serves README images through its own proxy, so
  those services see GitHub's request rather than yours; this is reasoned from
  how GitHub renders images, not measured here.
- **Ko-fi.** Donations run on Ko-fi under Ko-fi's policy. We see what Ko-fi
  shows a creator: the name you enter, the amount and the message. We do not
  publish donors.
- **The ClaudePluginHub listing** is a third-party index of this repository's
  public metadata; we hold no account data from it.

## 5. What we hold, and for how long

| data | where | how long | how to change or remove it |
|---|---|---|---|
| issue, discussion and pull-request text, with your GitHub handle | GitHub | while the repository exists | edit or delete your own post; ask us to delete a thread |
| commit metadata (name, email, date) of a contribution | the git history, in every clone and fork | permanent by design; a rewritten history breaks every clone | a `.mailmap` entry corrects the name shown; we add one on request |
| the trailers `Co-Authored-By` and `On-Behalf-Of` on commits made with Claude Code | the git history | permanent | they carry the organisation's own name and contact address, never a contributor's |
| a donation record | Ko-fi | per Ko-fi's policy | through Ko-fi |
| a security report | GitHub's private advisory | until published, then the advisory | you may ask to stay uncredited |

Nothing else. No mailing list, no analytics, no server of ours.

## 6. Your rights

Under the GDPR you may ask what we hold about you, have it corrected or
erased, object to a processing, or take it with you. Write to
saimonokuma@gmail.com or open a private advisory; we answer within one month.
Two limits are structural, not chosen: a commit in a public git history
cannot be erased without rewriting the history of every fork, so erasure
there means a `.mailmap` correction and, on request, a note in the
repository; and what you posted on GitHub is deleted through GitHub's own
controls, which we cannot override. You may complain to the supervisory
authority of your member state.

## 7. Children

The project is developer tooling and is not directed at children. We hold no
age information because we hold no account.

## 8. The licences and this policy

The code, the documents and this file are licensed
`AGPL-3.0-or-later OR EUPL-1.2` (LICENSE, LICENSE-EUPL-1.2, NOTICE.md). The
licence governs what you may do with the work; this policy describes what the
work does with data. Neither changes the other. Section 13 of the AGPL, which
concerns software run as a network service, is not triggered by anything this
project does: nothing here runs as a service. If you run it as one for other
people, you become the controller for their data, and this policy does not
cover them.

## 9. Changes

A change to this policy is dated at the top, listed in CHANGELOG.md, and
announced in the organisation's Announcements discussion before it takes
effect. The git history of this file is the record of every version.
