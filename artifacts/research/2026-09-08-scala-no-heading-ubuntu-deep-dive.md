<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

### 🤿 Deep Dive: the no-heading answers of the ubuntu leg (run 34172320122, f8ad5b0)

### 🤿 Strategic Summary

Every family of the ubuntu leg, the six passes included, was refused the runtime: 158 Bash calls were denied by the runner's permission gate, and even the plain `node lib/chain.mjs check` was refused under the pattern `Bash(node lib/:*)`. The runner answered `claude --version` with 2.1.197 (published 2026-06-30) while this machine runs 2.1.263 (npm latest, published 2026-09-06) and allows the same calls under the same pattern; the eleven failures are the model refusing to hand-render a plan the law says must be read from the engine, and the six passes are the model hand-rendering it anyway. The fix is three lines of intent: an allow-list that matches on both matchers (`Bash(node:*)`), a runner that runs the version npm calls latest and proves it before the families start, and a scorer that fails any answer whose raw json carries a permission denial.

### 🤿 Key Questions

- Why does the lenses family answer with two headings and no link on ubuntu?
- Is the failure of the families after lenses a regression caused by lenses, or the same cause?
- Why did six families pass on the same leg, and do those passes test the Commander inside the OS?
- What differs between the runner and this machine, where the same patterns allowed the same calls?
- What must change so the seventh matrix measures the Commander's functions and not the permission gate?

### 🤿 Overview

The scala matrix runs seventeen families, each a stack of command tokens under `/chain-dtd --no-gate`, through the real CLI on three hosted legs, and scores every answer by the sigil headings each link must write and by the chain's close line. On the ubuntu leg of run 34172320122 (the sixth matrix, one leg at a time, credential live to 08:07Z) the leg took ninety-one minutes, passed six families and failed eleven, and wrote 74 findings of three kinds: 64 heading, 5 close, 5 count.

The findings are true as written and useless as a diagnosis: the lenses answer carries two headings because the model wrote two paragraphs of its own explaining that `node` is gated, and the "5 headings" of prompts, filetypes, tasks, audits, growth, geometry, lists and workflow are the chain's own arguments, plan and blocker sections written by hand before the model stopped and asked the operator to approve `node`. Nothing regressed after lenses: each family is a fresh `claude -p` process with its own permission state, and the denial count is spread across all seventeen (6 to 17 per family), the passes included.

The operator's reading of the matrix is the right one: the matrix exists to test the Commander's functions inside another OS, the chain is only the fastest way to run them all. A pass produced by a model that was refused the runtime and wrote the links from the command files it could Read tests nothing about the OS. So the answer to the question asked is one cause under every family, and the deliverable of this reading is the list of what the runner must do differently.

### 🤿 How It Works

- The runner installs the CLI with `npm install -g @anthropic-ai/claude-code` (gate.yml line 300) and then runs `node checker/scala.mjs run --all --out "$SCALA_OUT" --turns 150 --secs 2400` (line 339). Measured: gate.yml read in this session.
- `runOne` (checker/scala.mjs lines 173 to 205) spawns `claude -p <prompt> --model opus --max-turns 150 --output-format json --add-dir <ROOT> --allowedTools "Read,Grep,Glob,Write,Bash(node lib/:*),Bash(node <ROOT>/lib/:*),Bash(node <ROOT>/lib/ceiling.mjs:*)"` with cwd ROOT, then scores `result` by headings and close and runs `diagnose()` over the raw output. Measured: file read.
- On the runner `claude --version` answered `2.1.197 (Claude Code)` after the install (job log line 139). On this machine it answers 2.1.263; `npm view @anthropic-ai/claude-code version` answers 2.1.263, published 2026-09-06T02:07:58Z; 2.1.197 was published 2026-06-30T13:31:18Z. Measured: log read, commands run.
- The raw json of every family carries `permission_denials`: 158 in all, every one of tool Bash, 146 single-line and 12 multi-line. Denied shapes include `node lib/chain.mjs check` (11 times in creators alone), `node lib/chain.mjs plan --no-gate`, `node lib/chain.mjs --help`, `node lib/ceiling.mjs 60 node lib/chain.mjs plan '...'`, and the improvisations that followed (`printf ... | node ...`, `for f in ...; do grep ...`). Measured: every scala-*.json of the leg read by script.
- Therefore the pattern `Bash(node lib/:*)` did not admit a command that begins with the string `node lib/` on 2.1.197, while on 2.1.263 this session measured the same patterns admitting the same multi-line plan call with zero denials (step 18 of the run, 2026-09-07). Reasoned: the older matcher compares the pattern's words against the command's words, so the word `lib/` never equals `lib/chain.mjs`; the newer matcher compares the string prefix. The runner's own answers say the same thing in prose: the creators answer reports that a bare `node --version` ran while every `node lib/...` call came back "requires approval". The mechanism is reasoned, not measured; the denials are measured.
- The eleven failures are the model obeying LAW.CHAINRUN.1 ("a link run before the plan was read is a failed answer"): lenses and creators stop after the blocker (2 and 0 headings), the rest write the chain's own sections and stop (5 headings, chain_close absent or `ran 0`). Measured: scala-lenses.md and scala-creators.md read whole, the finding lines of the log read.
- The six passes (thinking 44 headings, asking 27, shelf 66, repository 30, chain 5, sigil 7) are the model hand-rendering the links from the command files after the same denials: thinking carries 17 denials and closes with an offer to re-run the plan verb once `node lib/chain.mjs` is approved. Measured: the json and the answer tails read. The scorer cannot tell a hand-rendered link from a run one, because it reads headings and a close line only. Measured: `score()` read.
- Nothing in the leg is a session limit, a login failure or a ceiling: every family is `is_error false`, `subtype success`, exit 0, with cost between 0.95 and 4.03 dollars and 10 to 55 turns. Measured.

### 🤿 History and Context

The third matrix (38e4906) admitted only `node lib/ceiling.mjs 60 node:*`, and its findings named the sigil run verb under a 300 s ceiling and the bare geometry engine as denied; patch L widened the list to `Bash(node lib/:*)`, its absolute form and the ceiling form, and the local probe of the sigil family through the real CLI on 2.1.263 showed zero denials. The fourth matrix (b64e14a) then reported every plan call denied on every leg and was read as a permission problem crossed with the session limit; the relaunch was ordered unchanged, one leg at a time, so the matrix could be read whole. The sixth matrix is that whole reading for one leg, and it shows the denial was never about the limit or the multi-line argument: the pattern that matched on this machine's CLI did not match on the runner's, which is a different, older build. The scorer was written for the failure of the 8.0.0 chains (links summarised in place of run) and counts headings; it was never asked whether the runtime ran.

### 🤿 Patterns and Best Practices

- Match on the word, not on a partial path: `Bash(node:*)` is a word followed by anything and matches under both matchers; a pattern whose last word is a directory prefix (`lib/`) is a bet on one matcher's semantics.
- Prove the permission before spending the families: a smoke that asks the CLI to run `node lib/chain.mjs check` under the same allow-list and requires `permission_denials` to be empty costs one turn and would have refused this leg at minute one.
- Prove the version before trusting it: print `command -v claude` and `claude --version` next to `npm view @anthropic-ai/claude-code version` and refuse the leg when they disagree, or run the binary from `$(npm prefix -g)/bin` explicitly so a preinstalled shim on the image cannot shadow it.
- A denial is a finding of its own and it fails the family: an answer with `permission_denials` non-empty did not test the OS, whatever its headings say (kind denied, severity high, in `diagnose()` and in the record).
- Read the raw json before the scorer's table: the 74 findings were all downstream of one line the table never showed.

### 🤿 Limitations and Edge Cases

- The word-versus-prefix semantics of 2.1.197 are reasoned from 158 denials and one answer's prose, not measured on that build here: the mitigation is the permission smoke on the runner, which measures it in the fixed run before any family starts.
- Why the runner has 2.1.197 after an install of latest is unknown (a preinstalled binary earlier on PATH, or a registry mirror): the mitigation is to print the resolved path and version and to run the npm-prefix binary explicitly.
- `Bash(node:*)` admits every node invocation on the runner, including `node -e`; the runner is a throwaway checkout with a temporary config dir, so the widening costs nothing there, but it must not be copied into a user's settings.
- The model appends `; echo "EXIT=$?"` to read the exit code, as the chain prose asks; a compound command is admitted only when every part is, so `Bash(echo:*)` belongs on the list or the prose must stop asking for it.
- macOS is running the same runtime on the same credential now; the operator ruled to read it whole before acting, even if it fails the same way, and this reading predicts the same 158-shaped denials there.

### 🤿 Current State and Trends

The findings record `artifacts/research/2026-09-07-scala-findings.nt` was regenerated from this leg with the previous record carried over: 262 findings in all, 32 open, 74 of them from this run. The many run is saved in `artifacts/cache/ask-me-many-questions-dtd.nt` (reason token) with the next steps; the scratch patch p910-n.py (plan by words, kinds limit and denied, the CLI version in the smoke) waits, and the fix named here extends it. The runner's CLI version and its permission semantics are now a measured axis of the matrix, beside the OS.

### 🤿 Key Takeaways

1. One cause, seventeen families: the runner's permission gate refused every `node lib/...` call under `Bash(node lib/:*)` on CLI 2.1.197, and the no-heading answers are the model refusing to fake a plan.
2. The six passes are worth nothing as OS measurements: they were hand-rendered after the same denials, and the scorer must fail an answer that carries a denial.
3. The fixed run needs three things before a family starts: `Bash(node:*)` (and `Bash(echo:*)`) on the allow-list, the CLI version proved against npm latest, and a permission smoke that refuses the leg when the check call is denied.

### 🤿 Remaining Unknowns

- [ ] Does 2.1.197 match `Bash(<prefix>:*)` on whole words? (assumed: yes, from 158 denials of commands that begin with the pattern's string; the permission smoke of the fixed run measures it)
- [ ] Why does the ubuntu image resolve `claude` to 2.1.197 after `npm install -g` of a package whose latest is 2.1.263? (assumed: a binary earlier on PATH; the fixed run prints `command -v claude` and runs the npm-prefix binary)
- [ ] Do macOS and windows show the same denials on this runtime? (assumed: yes; the operator reads macOS whole before acting)
- [ ] Did `node --version` really run on the runner, as the creators answer claims? (assumed: irrelevant to the fix; it was not in the denial list)

### 🤿 Implementation Context

<claude_context>
<application>
- when_to_use: any hosted leg that hands a `--allowedTools` list to a CLI whose version the leg did not choose
- when_not_to_use: a user's own settings.json, where `Bash(node:*)` is too wide
- prerequisites: the checkout as cwd, a temporary CLAUDE_CONFIG_DIR, a sealed credential that no local refresh rotates while the leg runs
</application>
<technical>
- libraries: @anthropic-ai/claude-code 2.1.263 (npm latest 2026-09-06); the runner answered 2.1.197
- patterns: `--allowedTools "Read,Grep,Glob,Write,Bash(node:*),Bash(echo:*)"`; `export PATH="$(npm prefix -g)/bin:$PATH"; hash -r; [ "$(claude --version | cut -d' ' -f1)" = "$(npm view @anthropic-ai/claude-code version)" ]`; a smoke `claude -p "Run exactly: node lib/chain.mjs check" --allowedTools "Bash(node:*)" --max-turns 3 --output-format json` whose `permission_denials` must be empty; `diagnose()` naming a non-empty `permission_denials` as kind denied, severity high, a FAIL
- gotchas: a pattern ending in a directory prefix; a compound command with `echo` on it; a pass with denials counted as a pass
</technical>
<integration>
- works_with: checker/scala.mjs runOne and diagnose, gate.yml scala job, the findings record with --previous
- conflicts_with: reading the scorer's table without the raw json; resealing or refreshing the credential while a leg runs
- alternatives: pinning the CLI to an exact version in gate.yml (stable, but the matrix would stop measuring what users install); running the families with --permission-mode bypassPermissions (measures nothing about the allow-list users get)
</integration>
</claude_context>

**Next Action:** plan: resume the many run from its cache, apply p910-n.py extended with the three changes named here, gate, commit, dispatch after macOS has been read whole.

### 🤿 Sources

- [kind: run] GitHub Actions run 34172320122, job 101896511962 scala (ubuntu-latest), 00:18:41Z to 01:49:42Z - 2026-09-08
- [kind: file] scratchpad job-101896511962.log lines 130 to 352 (the version line, the finding lines, the exit) - 2026-09-08
- [kind: file] artifact scala-ubuntu-latest-f8ad5b0957c80dbecec11e864d398a1134139a82: 17 scala-*.json, 17 scala-*.md, findings-ubuntu-latest.nt, smoke.json, install.log - 2026-09-08
- [kind: file] scala-lenses.md and scala-creators.md read whole - 2026-09-08
- [kind: command] node script over every scala-*.json: 158 permission_denials, 96 distinct shapes, 146 single-line, 12 multi-line, all tool Bash - 2026-09-08
- [kind: command] claude --version (local 2.1.263); npm view @anthropic-ai/claude-code version (2.1.263); npm view @anthropic-ai/claude-code time (2.1.197 on 2026-06-30, 2.1.263 on 2026-09-06) - 2026-09-08
- [kind: file] checker/scala.mjs lines 170 to 215 (runOne, the allow-list); .github/workflows/gate.yml lines 300, 331, 339; src/commands/chain-dtd.md lines 25, 48, 50 - 2026-09-08
- [kind: command] node checker/scala.mjs findings <leg> --run f8ad5b0 --previous artifacts/research/2026-09-07-scala-findings.nt --out the same --table: 262 findings, 32 open, 84491 bytes read back equal - 2026-09-08
- [kind: measurement] local probe of 2026-09-07 (step 18 of the run): the same patterns admitted the multi-line plan call on 2.1.263 with zero denials - 2026-09-07
- [kind: note] the word-versus-prefix matcher semantics of 2.1.197 are reasoned from the denials, not measured on that build; the fixed run's smoke measures them
