<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Changelog

Every number below was produced by the command named beside it on the day of
the release. If one of them does not re-run for you, open the
"A claim in our docs is false" issue; the report is credited here.

## 9.1.0 (2026-09-10)

### Matrix-Commander: every family clean on every leg

The first real three-OS scala matrix, run on the 9.0.0 tree at a4b9b6b,
passed the chain family on every leg and failed the other sixteen on
every leg: 99 findings on ubuntu, 98 on macOS, 114 on windows. The
answers died in the runners' temp directories and only the logs
survived. 9.1.0 keeps the answers, reads them as a record, and fixes
what they name.

- **The scala job keeps its answers.** Every leg uploads
  `scala-<family>.md` and `.json` for the seventeen families, its
  findings file, the smoke result and the install log as the run
  artifact `scala-<os>-<sha>`, ninety days, on failure too; a summary
  job downloads the three legs, prints one table across OS and uploads
  the merged findings file. The sealed credential lives eight hours from
  its login: the credential step reads its expiry and refuses an expired
  one by name before the install, the smoke refuses a result that is an
  error even when it counts a turn (the second matrix answered Not logged
  in seventeen times per leg through a smoke that read the turn count
  alone), and a Not logged in answer is a finding of kind login.
- **The findings as a record.** `node checker/scala.mjs findings
  <dir>...` reads the answers of one or more legs, scores them again and
  writes a NestedText record, `artifacts/research/<date>-scala-findings.nt`
  when run here: one entry per finding with leg, family, member, kind,
  severity, text, fix and status. A previous file's fix and status are
  carried over by key, so a regeneration never loses what was written by
  hand, and a finding the new run no longer shows is kept as fixed.
- **The env block.** `dtd/claude-env.json` ships six keys
  (`CLAUDE_CODE_MAX_OUTPUT_TOKENS`, `BASH_MAX_OUTPUT_LENGTH`,
  `TASK_MAX_OUTPUT_LENGTH`, `MAX_MCP_OUTPUT_TOKENS`,
  `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`,
  `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`). `rdc install` merges them
  into the target `settings.json` under `env`, a key the user already set
  is kept and named, a backup is taken first, `--no-env` skips it;
  `rdc env --yes` does the same on demand and `rdc env --check` compares;
  `rdc uninstall` removes exactly the keys it added; `rdc doctor` has an
  `env` row naming the drift; the scala job writes the block into the
  runner's config dir before the chains. `node lib/arm.mjs controls` runs
  the env path on a planted settings.json, 6 controls; `npm run
  controls:arm` in the gate chain and the workflow, gate chain 85 commands.
- **The Windows shim path.** `lib/ceiling.mjs` ran a `.cmd` shim through
  a shell with every argument quoted, and a prompt with a newline lost
  every argument after it: the windows leg's answers were plain text
  where json was asked for, and only the one-link family survived. The
  ceiling reads the shim for the target it wraps and runs that without a
  shell: a modern claude shim wraps a native `claude.exe` (measured on the
  windows leg of 38e4906, `"%dp0%\node_modules\@anthropic-ai\claude-code\bin\claude.exe" %*`,
  where the first reading looked for a `.js` alone and refused every
  family), the classic npm shim a `.js` run through node. An argument with
  a newline through a shim it cannot read is refused by name, never
  truncated, and the refusal quotes the shim's head; a ceiling refusal in
  a scala answer is a finding of kind ceiling. One control parses both
  templates and passes a two-line argument through a planted shim.
- **The scala measured the wrong prompt.** Several tokens are one chain
  only through `/chain-dtd` (CHAIN.declared; cc-chain is included by the
  chain command alone), and the first matrix stacked the members without
  it: the CLI expanded the first member as itself with the rest as its
  user-args, no grammar in that command declared a chain, and the 32
  chains without a close line and 67 skipped headings on ubuntu and macOS
  were that prompt. A family of two or more opens with
  `/chain-dtd --no-gate` and stacks its members beneath; a family of one
  is its command with the token. The model runs from the checkout, so the
  relative runtime every prose names resolves, Write is allowed so a link
  can write the record it hands on, and MSYS_NO_PATHCONV is set because
  Git Bash on the windows leg rewrote a plan argument opening with a slash
  as a path. `lib/chain.mjs` never counts the chain token as a link, and
  the chain command says a link is run by reading its file. The first probe
  through the chain ran both links of the sigil family and closed, and the
  scorer refused it for rendering alone: the links' headings sat one level
  deeper than the chain's own and the close line was bold. The scorer reads
  a heading of level three or deeper and strips emphasis before the close.
- **The third matrix read as answers.** At 38e4906 the ubuntu leg passed
  nine families and the macOS leg eleven, and every remaining finding had
  a cause the answers name. The permission pattern admitted the runtime
  under a 60 s ceiling alone, so the sigil run verb (300 s) and the bare
  geometry engine were declined: the runtime is allowed under any ceiling
  and bare. The workflow family stacked the Adiutor, whose name does not
  end in -dtd and which lib/chain.mjs never reads as a link, so every leg
  closed with ran 7 of 8: a member that is not a chain token is named as
  unchained and stacked nowhere. The filetypes chain drew five links under
  one sigil: the plan names each link's sigil from dtd/sigils.json (a
  sigil attribute on link) and the chain prose says a link renders under
  the sigil the plan names. The scorer reads a heading carrying the sigil
  after an ordinal (LAW.CORE.6 says carrying) and a close written as
  (ran 8, refused 0) (LAW.CHAIN.8 names the counts). The tasks family
  reached sixty turns on both legs and two heavy families their 1500 s
  ceiling on ubuntu: 150 turns and 2400 s per family under a job ceiling
  of 350 minutes, and a run that reached its turn cap is a finding of
  kind turns.
- **The sixth matrix: the matcher, not the OS.** One leg at a time on a
  credential resealed at 00:07Z, ubuntu and macOS answered 291 permission
  denials under `Bash(node lib/:*)`, the bare `node lib/chain.mjs check`
  among them, on a CLI that printed 2.1.197 where npm latest was 2.1.263;
  the eleven failures per leg were the model refusing to fake a plan the
  law says must be read from the engine, and the six passes per leg were
  the model faking it anyway, one in three turns without a call. The
  runner now hands the CLI `--permission-mode bypassPermissions` (a
  throwaway checkout with a temporary config dir; a user's settings never
  get it), runs the npm-prefix binary and refuses the leg when
  `claude --version` and npm latest disagree, and proves the engine before
  the families with a smoke whose trace must carry a check line. The
  seventh matrix was refused by that check in ten minutes on every leg:
  2.1.263 declares `engines.node >= 22`, the scala job set up node 20,
  and npm installs the newest version whose engines the runner satisfies,
  2.1.197; the scala job sets up node 22.
  `lib/chain.mjs` appends one line per verb to the file ROT_SCALA_TRACE
  names, and a chained family whose trace carries no plan line is a
  finding of kind engine, high; a permission denial is a finding of kind
  denied, high; both fail the family. The plan verb also takes one token
  per argument on one line, `plan --no-gate /a-dtd /b-dtd`, the chain
  prose spells it so, a 429 is a finding of kind limit, and the smoke
  writes the CLI version beside its answer.
- **The eighth matrix: the engine live, the links rendered where the scorer
  reads.** On node 22 the ubuntu leg printed 2.1.263, zero denials, the
  engine traced in every family, and thirteen chains passed with every link
  rendered inline; four (creators, prompts, filetypes, workflow) ran every
  link, creators building sixty-four files, then summarised each in a line
  and pointed at its artifact. The chain prose now says where a link's
  answer goes: in the chain's answer, whole, under `## Link n of N:
  /name-dtd sigil` and then the link's own root, even when its product is
  a file; a link deferred to its artifact is a dropped link
  (LAW.CHAINRUN.2). A chain never pauses: on macOS the research chain
  wrote that it would pause while a sweep finished and ended there after
  39 of 150 turns, so the prose says a link's foreground command runs to
  its end or its ceiling in the same turn and an answer that ends before
  `chain_close` is a failed answer. The leg keeps the checkout's
  `artifacts/chain` records beside its answers, and a vanished finding is
  marked fixed only on a leg the run read.
- **The ninth matrix: the answer is every message.** On CLI 2.1.265 the
  ubuntu leg passed sixteen families with zero denials and ninety-nine
  chain records kept; the lenses chain ran its eight links, wrote their
  eight records, and was scored on two headings, because the json output
  format returns the final assistant message alone and the chain had
  rendered its links across earlier messages. The runner asks for
  stream-json and reads the answer as every assistant text block in
  order, the result from the line of type result, through one parser
  that reads the json shape of the earlier matrices unchanged.
- **The tenth matrix: the diagnoser and the link's own product.** On CLI
  2.1.266 the ubuntu leg passed fifteen families; the thinking chain, 44
  headings and 32 turns, was diagnosed as logged out because a file it
  read quotes the phrase and the verbose raw carries every tool result,
  and the lists chain ran its eight links, each record under
  `artifacts/chain` carrying the link's headings under its sigil, and
  narrated them across 85 messages without one. The diagnoser reads the
  result object and the lines that are not JSON, never a tool result,
  and names a capped run from the result's subtype; the scorer reads a
  link heading missing from the answer from the link's own record, live
  under the checkout on the runner and from the chain directory a leg
  kept when it is read back, and a link missing from both is the finding.
- **The eleventh matrix: the close is the last close.** Ubuntu passed
  seventeen of seventeen with zero findings; on macOS the research chain
  took this scala as its topic, quoted an experiment's `chain_close ran 0
  refused 8` four hundred lines before its own `chain_close ran 8 refused
  0`, and was scored on the experiment. The scorer reads the last
  chain_close line, and the engine's own XML form of the close closes too.
- **The twelfth matrix: a run that called the model is read from its
  numbers.** Ubuntu and macOS passed seventeen of seventeen on the runner;
  on windows the research chain, 87 headings and 64 turns, took this scala
  as its topic and wrote "Not logged in" in its own final message, and the
  phrase alone diagnosed the leg as logged out. A result with more than one
  turn, a cost above zero and no error was a logged-in CLI that knew its
  command, whatever its text says; only its turn cap is named, from the
  subtype. The phrases still read a run of one turn at no cost.
- **The seal: 9.1.0 ships on the twelfth matrix, and here is the whole
  story.** Thirteen matrices were dispatched for this release. The first
  six measured the runner's own permission matcher (every plan call
  denied, 158, 133 and 192 denials per leg) and an older CLI (2.1.197
  where npm latest was 2.1.263); the seventh refused itself by design when
  the CLI check saw node 20 install the older version; the eighth ran the
  engine live on every leg and named two shapes of the model's own making,
  a link summarised in a line and a chain that paused; the ninth, tenth and
  eleventh each named one more fault in how the scorer read a live run: a
  final message scored alone, a phrase inside a tool result taken for a
  logged-out CLI, a link narrated across 85 messages while its record
  carried the headings, an experiment's close read for the chain's. The
  eleventh measured ubuntu 17 of 17 and windows 17 of 17 green on the
  runner, macOS 16 of 17 with that close-line reading as its one finding.
  The twelfth, on 675ba75, measured ubuntu 17 of 17 and macOS 17 of 17
  green on the runner and windows 16 of 17, its one finding the research
  chain's own sentence about the second matrix, "seventeen Not logged in
  answers per leg", read by the diagnoser as the CLI being logged out on a
  run of 64 turns and 87 headings. That reading is fixed in 0f17b0a; the
  twelfth's 51 answers and the eleventh's 51 re-read with it pass 102 of
  102, with zero permission denials and the engine traced in every one.
  The thirteenth matrix, dispatched on 0f17b0a, was cancelled by the
  operator at its gate stage before a leg ran, because a fourth eight-hour
  matrix would have measured the scorer's last phrase and nothing about
  the Commander that the twelfth had not. 9.1.0 is sealed on the twelfth
  matrix's measurement, read with the scorer this release ships; the first
  matrix of 9.2.0 is the run that shows all three legs green on the runner
  in one dispatch, and its findings record starts from zero.
- **The gate's fifth choice, visible.** A question carries at most four
  options, so save could only ride in Other, and the operator watched it
  vanish from the gate. The gate is one ask of two questions now: the
  four re-entries under Gate, and GATE.cache.question under
  GATE.cache.header with GATE.continue beside GATE.save (LAW.CACHE.1);
  every intake row says so.

Measured:

- the twelfth scala matrix (run 34367173453, 675ba75, one leg at a time on node 22, CLI 2.1.266): ubuntu 17 of 17, macOS 17 of 17, windows 16 of 17 on the runner, 51 answers, 0 permission denials, the engine traced in every family, 102 and 103 and 98 chain records kept; re-read with the scorer of 0f17b0a, 51 of 51
- the eleventh scala matrix (run 34312749248, f19c2db): ubuntu 17 of 17, windows 17 of 17, macOS 16 of 17 on the runner; re-read with the scorer of 0f17b0a, 51 of 51
- the thirteenth (run 34413427691, 0f17b0a) cancelled by the operator before a leg ran; the release sealed on the twelfth

- `node lib/ceiling.mjs controls`: 8 run, 0 failing; `node lib/encoding.mjs controls`: 6 run, 0 failing
- `node lib/arm.mjs controls`: 6 run, 0 failing
- `node checker/scala.mjs --controls`: 32 run, 0 failing
- `node lib/chain.mjs controls`: 30 run, 0 failing
- `node checker/contract-audit.mjs`: 2057 declarations, 0 unused, 0 law gaps
- `node checker/gate-sync.mjs`: 85 commands in the gate chain, 0 missing from gate.yml
- `node checker/release-notes.mjs --versions`: one version everywhere, 9.1.0, recognised (class mid) from the verbs kept in run 10
- 143 commands, 23 skills, 5 agents; checked 171; 2057 declarations; 85 gate-chain commands

## 9.0.0 (2026-09-07)

### Interoperable-Commander: every command runnable alone and interoperable in a chain

Several command tokens in one prompt were several prompts that happened to
share a screen: each ran its own intake, each opened its own gate, and what
one wrote reached the next only if the operator pasted it. `dtd/cc-chain.dtd`
makes the stack a declaration: one root, one intake, one gate, each band's
artifact handed on as the next band's user-args, autonomy only by the
`--no-gate` token, every command declaring its successor or none. The
Graphic and Geometric Suite is completed and generalised: four domain bands
above rung 52, twenty figure shapes, a typography contract the plate and the
widget share, and a fourth member that produces the graphic the three agreed
on. The five study documents the argument convention came from are in the
tree and measured by a command of their own. Every count below was produced
by the instrument named beside it on the release day.

- **`dtd/cc-chain.dtd`**, LAW.CHAIN.1 to 8, flat after `ditaval.dtd`; `lib/chain.mjs`
  reads the stacked lines both ways and every `hands_to` in the tree resolves
  (7 declared, 0 dangling); `/chain-dtd` runs a chain as one root.
- **The ladder grows to 108.** `dtd/geometry.dtd` keeps rungs 1 to 52 unmoved and
  adds trigonometry 53 to 66, projection 67 to 80, chromatics 81 to 94,
  restoration 95 to 108, each a module of the driver; three lenses partition the
  fifty-six and every lens reaches every domain (LAW.GEOM.9 to 11).
- **The fourth member.** `/codebase-generator-dtd`, band 53 to 108: with a
  survey, a plan and a renovation on disk it produces one plate of three
  layers to cells, svg and png through `resvg`, every byte counted after the
  write; with nothing on disk it launches the three as one chain. The
  renovator hands to it and it hands back to a fresh survey.
- **Twenty shapes.** `dtd/cc-figure.dtd` after `office/drawing.mod`: circle,
  ellipse, polyline, polygon, path, arc, text, fill, stroke, gradient,
  transform, measure, extrude, rotate3d, contour and layer beside the four of
  8.0.0, seven glyphs, colour as a token and never a hex value, LAW.FIG.6 to 8:
  the seed, the overlay, the thumbnails. The four EXPAND items of the 8.0.0
  file, measured undelivered, are delivered.
- **`dtd/typography.dtd`**, LAW.TYPO.1 to 8: the guarantee, the cell shared with
  the figure, the faces, the numeral derived from its number; each class
  module wraps an element and a switched-off class is invalid against the
  subset. `/typography-dtd` renders the typeset.
- **The sigil.** `dtd/cc-sigil.dtd`, `lib/sigil.mjs`, the five documents under
  `dtd/sigil`, `/sigil-dtd` and `/verbs-dtd`: the forms named in the subset and
  spelled in the documents, because three characters of the sigil grammar are
  markup inside an entity value; 125 forms named, 125 spelled by the ranking,
  both directions; the shell forms run on the leg they are on.
- **The creators against the corpus.** `checker/creators-audit.mjs`: 27 rows,
  24 with a schematic, 14 corpus folders and 10 root grammars, all xml, with the concept cells that carry their
  mechanic, 3 refused for having no grammar, measured against the corpus.
- **One scala per family.** `checker/scala.mjs` stacks each family in band order
  and scores the headings its members own; the `scala` job runs every family
  through a real model on every leg, on a tag or by hand, the credential one
  masked secret.
- **The README says how each family hands on**, generated from the resolved
  `hands_to` attributes, in band order.
- **The credential, sealed from the live file at every release.**
  `checker/seal-secret.mjs` reads the CLI's current credential file, seals it
  as the libsodium box GitHub requires and PUTs it as one repository secret;
  the value is never printed. A snapshot sealed once goes stale when the CLI
  refreshes, so the seal is a release step, not a copy.
- The corpus study behind the design: `artifacts/research/2026-09-07-9-0-0-corpus-study.md`,
  2219 files, 768 grammar files, thirteen sections.

Measured on the release day:

- `node bin/rot-dtd-commander.mjs check`: checked 171, failed 0
- `node bin/rot-dtd-commander.mjs build --check`: 303 targets, 0 drifted, 0 failing
- `node checker/contract-audit.mjs`: 1929 declarations, 0 unused, 0 law gaps
- `node checker/gate-sync.mjs`: 84 commands in the gate chain, 0 missing from gate.yml
- `node lib/figure.mjs controls`: 44 run, 0 failing
- `node lib/geometry.mjs controls`: 50 run, 0 failing
- `node lib/typography.mjs controls`: 35 run, 0 failing
- `node lib/chain.mjs controls`: 26 run, 0 failing
- `node lib/sigil.mjs controls`: 16 run, 0 failing; `node lib/sigil.mjs run` on windows, bash 5.3: 43 pass, 0 fail, 0 unsupported
- `node checker/scala.mjs --controls`: 12 run, 0 failing; `node checker/creators-audit.mjs --controls`: 9 run, 0 failing
- 139 commands, 22 skills, 5 agents; checked 166; 1929 declarations; 84 gate-chain commands

### The fifth gate choice: save your cache first

Every gate had four choices, and three of them re-entered a loop that ran
inside one context that only grew. `dtd/cc-cache.dtd` adds the fifth,
`GATE.save`: the run writes what it holds into `artifacts/cache/<command>.nt`,
NestedText through `lib/cache.mjs`, eight fields in declared order
(`command|saved|reason|task|slots|answers|gate|next`), reads the file back
whole, renders the `cache` element and stops; the next call of the same
command resumes from the file, or names it stale after `CACHE.stale` days.
The form is fixed because it is read in one pass and carries no code: no
value is ever typed, and the control that measures the weight found the nt
lighter than the markdown of the same fields, 579 against 639 bytes on the
sample and 2281 against 2503 on a thirty-answer state. Eight laws,
`LAW.CACHE.1` to `8`; two of them are about the gate and not the file: a
command token that arrives mid-run saves first and opens its own intake
whole (`LAW.CACHE.4`), and an intake that closes on `add`, `more` or
`impactful` without the gate presented again is a failed answer
(`LAW.CACHE.5`). The Adiutor enforces both at Stop through
`lib/render-check.mjs` as findings of kind `gate` and `cache`, guard C31,
`LAW.ADIUTOR.13`. The subset is included after `cc-ask` by every gated
source, 119 of them, and `cc-ask` itself gains the choice in its gate
enumeration, `GATE.save`, `intake (.., gate, cache?)` and an `ASK.exhausted`
that offers start and save. `.nt` enters the white list. `node lib/cache.mjs
controls`: 20 run, 0 failing; `node bin/adiutor.mjs controls`: 31 run, 0
failing; `npm run controls:cache` in the gate chain and the workflow.

### The companion's first pass on 9.0.0: seven findings, all sound

`bash checker/companion-audit.sh 9.0.0 v8.0.0..HEAD artifacts/research opus 60 1800`
closed its first pass as fail in 50 turns with seven findings and no
guess among them. Three were high: the AI_SLOP sweep had never been
pointed at `dtd/sigil`, so four of the five study documents failed a
recognizer that judges every answer before it lands, one on the flat
banned word at `sigil-variables-variants.md`; and `lib/chain.mjs`
declared `artifact-missing` as a refusal and produced it nowhere, so the
one mid-chain failure cc-chain exists to convert into an up-front refusal
was the one it could not report. The sweep now reads `dtd/sigil` in the
gate script and the workflow, gate chain 84 commands; the two arguments
documents each carried a ```` ```markdown ```` paste wrapper on line 3
that was never closed, 65 fences where 64 balance, so their code was
measured as prose, and cutting that one line brought both above the
vocabulary bound without a word of the study touched; the greek-numbers
note gained one long sentence and holds its rhythm at 0.8653; the banned
word became `use`. The chain planner refuses a link that takes an
artifact from a predecessor declaring none, the new `handoff` verb
refuses at run time when the file under `CHAIN.dir` is absent and carries
its bytes when present, `--decline` produces `declined`, `chain_intake`
carries the rounds and questions the plan was given instead of two
literal zeros, the `runs_alone` comment now says what the code computes,
and the subset's rationale names `lib/chain.mjs` rather than a checker
that does not exist. `checker/hosted-plugin.json` says 137 where it said
131, still unconfirmed until the 9.0.0 upload is read. The chain suite
closed that pass at 20 run, 0 failing; `node lib/ai-slop.mjs sweep dtd/sigil
--max 0`: 5 files, 0 slop.

### The companion's second pass: a refusal nobody could trip, and a number the command contradicted

The second pass closed as fail in 48 turns with six findings, none guessed.
`band-off` was a declared `link_refusal` value with no producer under a
comment of mine that claimed every value had one; the changelog said the
chain suite ran 15 where the command printed 20; `over-cap` was enforced
through a chain-level entry no element renders; `WHY` and `TAKES` were
read from the subset and read by nothing; `numeral()` took any string as
a suffix against an enumeration of four; and `italic` had no producer.
Every one has an instrument now. The plan takes `--band-off` and refuses
a link on a switched-off band; over the cap every link carries
`link_refusal why="over-cap"` and the close counts them; a link whose
command declares no `args` takes `none`; a fixture tree trips
`no-successor` on purpose; and two controls hold the `why` and `takes`
enumerations to their producers in both directions, so the next dead
value cannot pass. `numeral()` refuses a suffix outside `gon|hedron|ad|meter`
by name, `face()` renders both declared styles and refuses a third, and a
control walks every ATTLIST enumeration of typography.dtd against a
producer table. `checker/controls-sweep.mjs` re-runs every `controls`
count the newest changelog section claims and refuses on disagreement;
tripped on a planted count, then run over this section, where it found
the two counts the pass itself had moved. Gate chain 75 commands.
`node lib/chain.mjs controls`: 26 run, 0 failing; `node lib/typography.mjs
controls`: 35 run, 0 failing; `node checker/controls-sweep.mjs --controls`:
14 run, 0 failing.

### The companion's third pass: the sweep that under-read its own input

Four findings, one high, and the high one was in the instrument the second
pass had built. `checker/controls-sweep.mjs` read its claims with a literal
space between the path and the verb, so the one claim markdown had wrapped
across a line, `lib/cache.mjs`, was never re-run, and its only count guard
passed at three where twelve were on the page: a gate step that reports
zero drift after reading ten of twelve is indistinguishable from one that
read everything. The separator is any whitespace now, a loose count of
claim shapes must equal the strict count or the sweep refuses by number,
and the total line is the one that opens with the suite name, first or
last, never a row quoting a count; a wrapped claim and an unreadable one
are both tripped on purpose. `artifacts/research` joined `dtd/sigil` in the
sweep line, which is the same gap the first pass closed one directory
over, and the recognizer's walker learned that a dot-directory is tool
state: a plugin's distillate under `.rot-moe` had been judged as if the
Suite had written it. One banned word left the corpus deep dive, and the
creators sentence says what the audit prints, 24 with a schematic, 14
folders and 10 root grammars. `node checker/controls-sweep.mjs --controls`:
14 run, 0 failing; `node lib/ai-slop.mjs sweep --tracked dtd/sigil artifacts/research
--max 0`: 21 files, 0 slop.

### The companion's fourth pass: a law with three live counterexamples, pinned by its own control

One high finding, and it was the shape this Suite says an instrument must
never have. LAW.TYPO.7 said that past 99 a numeral is plain and named by
its number; `lib/typography.mjs` named 100, 1000 and 10000 `hecta`,
`chilia` and `myria` under form `ten`; and the derivation control listed
`[100, 'hecta', 'ten']` as a case that must pass, so the suite went green
only while the engine broke the law and would have gone red had it
obeyed. The carve-out is declared now: the form enumeration carries
`scale`, LAW.TYPO.7 names the three exact scales that keep their names
under it, the control asserts the declaration and trips at 1000 and 10000
beside 101, 999 and 1001 as plain, and the unreachable hundreds clause
left `TYPO.numeral.join`, since no compound this engine builds carries a
hundreds part. `looseCount` in the controls sweep counts a claim by its
command rather than by its tail, so a count spelled as `prints 12` or `12
controls` is a refusal by number, tripped on purpose. `node
lib/typography.mjs controls`: 35 run, 0 failing; `node
checker/controls-sweep.mjs --controls`: 14 run, 0 failing.

### The companion's fifth pass: a census that could not differ, and a carve-out that reached everything but the command

Two high findings of one shape: a declaration that reached the subset and
the engine but not the artifact that renders it, with no instrument
between. The sigil run compared its trials to its own trial table, which at
scope all is the same array, so 42 shell forms of tiers S, A and B ran 40
behind a green; the census now holds the tiers to the trials by name in
both directions, `process-substitution-out` and `locale-quote` have trials,
and the run executes 43. The `scale` value of the fourth pass reached
typography.dtd, lib/typography.mjs and its control and not the template of
`typography-dtd`, and no checker walked an enumeration against a template.
`checker/enum-sweep.mjs` does now: every ATTLIST enumeration of a resolved
DOCTYPE against every bracketed choice a source spells, held to its best
match, tripped on a planted omission and a planted undeclared value. Run
over the tree it read 5,619 enumerations against 430 spelled choices and
found 96: seventy-six templates that still spelled four gate choices where
cc-ask declares five, seventeen form-kind lists that never followed
`alarm|polyalarm`, three verdict lists that never followed `reopen`; every
one is spelled whole now and the sweep reports zero. `newestSection` in the
controls sweep leaned on `\Z`, which is the letter Z in JavaScript and not
an anchor; it slices by index now, a one-section changelog is tripped, and
a section with no claim refuses rather than reporting zero drift. `cols`
and `rows` on `typeset` are implied, since the contract alone has no grid,
and `classes` is rendered. Gate chain 75 commands. `node lib/sigil.mjs
controls`: 16 run, 0 failing; `node checker/enum-sweep.mjs --controls`: 9 run, 0 failing; `node checker/controls-sweep.mjs --controls`: 14 run, 0
failing.

### The companion's sixth pass: the guard drawn at the width of the last failure

Three high findings, and the verdict named their common shape: each new
instrument was drawn tightly around the defect that produced it and left
the adjacent inch uncovered. The typography walk read enumeration values
with a class that had no hyphen, so `generic (monospace|serif|sans-serif)`
never entered it, `serif` and `sans-serif` had no producer, a literal copy
of the three stood in the controls, and a pinned count of six made the
omission permanent; the reader is the one the enumeration sweep uses, the
count is read twice from the file and never pinned, `genericOf` produces
every declared generic and refuses a family that ends on none, and a
fourth value planted in the subset is tripped. The controls sweep read
`controls` claims and not the `run` tally on the block's own line, so the
sigil count the fifth pass moved went stale where the block promised it
could not; it reads `N pass` tallies now and re-runs them, and the block
and the amplify state say 43. No instrument checked heading order against
the content model, and thirteen commands rendered against the sentence
their own grammar_map states: an order arm on the enumeration sweep maps
the rows and the template headings back to the root and refuses an
inversion, tripped on a planted transposition, and the thirteen are in
declared order, `Assumptions Made` last in twelve and `Measured` before
`Intake` in starlist. `ran` on a link admits `yes` and `refused` and no
longer a `no` that nothing produced, and the chain suite walks all ten of
its subset's enumerations against rendered plans. `node lib/typography.mjs
controls`: 35 run, 0 failing; `node lib/chain.mjs controls`: 26 run, 0
failing; `node checker/controls-sweep.mjs --controls`: 14 run, 0 failing;
`node checker/enum-sweep.mjs --controls`: 9 run, 0 failing.

### The companion's seventh pass: a census that filtered away what it was counting

The seventh pass returned fail with six findings, two of them high, all
sound. `checker/scala.mjs` built one scala per family and then filtered
away every family whose member files it could not find, so the prompts
family, whose representative `create-prompt` is a skill, vanished before
the census counted, and the census control asked for at least fifteen
scalas where the index declares seventeen: a bound no census could fail.
The workflow scala resolved its members as `commands/<m>-dtd.md` and lost
the Adiutor, whose file is `commands/RoT-DtD-Commander-Adiutor.md`, so
the scala ran seven of eight. `lib/typography.mjs` and `dtd/typography.dtd`
cited the Greek numbers at a scratch path under `artifacts/_sweep/`; they
name `dtd/sigil/greek-numbers.md`. `checker/seal-secret.mjs` cited
`LAW.RER.4` for the law that is `LAW.RER.6`.

`scalas(root, families)` now derives a pattern family's members through
the index's own `classify`, resolves `<m>-dtd.md` or `<m>.md`, stacks at
most `CHAIN.max` links and says how many it left (prompts: 8 of 17, 9 not
stacked; creators: 8 of 13), and returns a family with no files with its
lost names under `missing`, never filtered. `census()` holds both
directions: one scala per family, every family with a member file, every
declared member resolved; `run --all` marks a family with no members as a
failure instead of skipping it. The controls hold equality against the
family count, the Adiutor by its own filename, the prompts overflow, a
planted ghost family that trips the census red and a planted family
missing one member that names it. `node checker/scala.mjs --controls`:
12 run, 0 failing.

The pass also closed the seam the operator measured in the cache itself:
the first save of this release went through a JSON state file in a
scratch directory, the one form the subset exists to keep out of the loop.
`lib/cache.mjs save --state <state.nt>` reads the state in NestedText,
answers in any of the three shapes the form carries, and refuses a JSON
state by name. `node lib/cache.mjs controls`: 20 run, 0 failing.

### The companion's eighth pass: the plates nobody could re-draw

The eighth pass returned fail with six findings, two of them high, every
one a published number no instrument read back. The Adiutor claims row
said `20 run` and the release-notes row `4 run` where the commands print
31 and 10; the gate step name said thirty guards; the two verify plates
drew `thirty guards; C21 to C29` to every reader, light and dark, under a
header claiming they were generated from README prose, and the claims
plate named a renderer, `checker/claims-plate.mjs`, that had never entered
the tree; and the scala job's `rc=$?` sat after a line `set -e` aborts on,
so the artifact listing was lost on exactly the run that needed it. The
plates were stale far beyond the guards: 131 commands and 158 checked from
2026-09-03, and prose no reader of the README could find as text.

`checker/plates.mjs` ends the class. Every pictured section keeps its
prose in the README beside its picture, `<!-- rdc-section:<name> -->`,
the way the claims rows and the verify commands already did, and the
renderer draws the sixteen plates (seven sections, light and dark, and
the claims pair) from that text: prose wrapped, fences in monospace, a
sub-heading, an indented line, a rule, a centred close. The verify plate
draws the commands of the `rdc-verify:machine-readable` comment, the one
copy the counts sweep reads the guard count from, through a `{{rdc-verify}}`
line, and the comment now carries every command the plate shows.
`--check` holds every file to a fresh render; `--controls` plants a stale
count in the verify source and reads both verify plates drift and nothing
else, a pictured section with no source block refused by name, angle
brackets and quotes escaped, the fence never drawn, the dark plate
carrying the light plate's words. `node checker/plates.mjs --controls`:
8 run, 0 failing; `sweep:plates` and `controls:plates` in the gate chain
and the workflow, two more commands in the gate chain.

The counts sweep gains what the pass named: the two claims rows, the gate
step name, the guard count and the control-suite count in the verify
prose, the checker-controls numbers in the verify comment, the creators
and the shelf in the About prose, and the alt text of the claims plate,
each held against the tree (the release-notes total and the claims rows
measured, the control suites counted from package.json); a stale guard
count planted in the step name is reported by name. The sweep reads 49
places. `node checker/counts-sweep.mjs --controls`: 7 run, 0 failing. The
scala job captures `rc` between `set +e` and `set -e`, as the release job
does.

The cache writes the literal its schematic declares: `SCHEMA.nt.literal`
is an angle bracket per line, and a value longer than one line of prose
is folded at a word boundary into that block, the fold part of the value,
so what is written is what is read back; the operator read the first
cache of this release, every value on one line, as a file the schematic
had never touched. `node lib/cache.mjs controls`: 20 run, 0 failing.

### The companion's ninth pass: the changelog's own measured row

The ninth pass returned fail with four findings, two of them high, three of
them in this file. The measured row `node checker/gate-sync.mjs`: 75
commands in the gate chain quoted the command verbatim and differed from
it only in the number, four lines from a sentence that said 77; a second
phrasing, gate chain 75 commands, sat in the cache section; and the counts
sweep guarded the README's phrasing and the CHANGELOG's summary row while
neither of these two shapes was read by anything. The fourth finding was
low: `checker/seal-secret.mjs controls` failed module resolution when
`tweetnacl-sealedbox-js` was not under `--nacl`, an exit 1 that read as a
red suite instead of a missing dependency.

Both counts read 77. The sweep gains the two CHANGELOG shapes, `gate-sync.mjs`:
N commands in the gate chain and gate chain N commands, each held to the
chain the gate script measures, and reads 51 places. `seal-secret controls`
refuses by name, exit 2, when the module does not resolve from `--nacl`,
and says where to install it.

### The folders the nine passes reached

The operator asked for the count before the tenth pass. Read from the nine
pass sections above, findings landed in eight of the fifteen tracked
directories: `checker` eight times, `lib` six, `dtd` five, `commands` and
`artifacts` twice, `src`, `docs` and `.github` once each, and in the root
files README, CHANGELOG and package.json. No pass ever had a finding in
`.claude-plugin`, `.rot-lists`, `LICENSES`, `agents`, `bin`, `monitors`
or `skills`. Read is wider than found (the scope prose names `src/skills`,
the three manifests and every changed file byte-wise), but those seven
are the folders no pass has yet had to say anything about, so
`checker/companion-audit.sh` takes a seventh argument, a focus line
appended to the prompt as data, and the tenth pass names them.

### The companion's tenth pass: the seven folders, named

The tenth pass took the focus line and returned fail with eight findings,
four of them high, every one in a folder no earlier pass had reached. The
dtd-core skill's reference of the shared subsets quoted the 8.0.0 gate
(`start|more|add|impactful`, no save), the nine finding kinds without
`gate|cache`, and a Greek numbers path that does not exist: five of its
twenty-six quoted blocks sat behind the files they quote, nothing read
the file, and its own disclaimer said so. `.claude-plugin/plugin.json`
said rules C1 to C15 where the checker, the README and every agent say
C16, and the counts sweep read that file three times for other numbers.
`CITATION.cff`, the file GitHub and Zenodo render as the citable version,
said 4.0.0, 2026-09-02, sixty-eight commands and rules C1 to C14, and no
instrument named it. The skill counted "26 shared subsets" where `dtd/`
holds 31 grammars and two of the absentees carry the `cc-` prefix. A
hosted-plugin unknown asked a 7.2.0 question as if it were live.

`checker/subsets-sweep.mjs` re-embeds every quoted block from `dtd/` and
`--check` holds each byte for byte; every `cc-*.dtd` must have a block, so
`cc-amplify.dtd` and `cc-rot.dtd` join and the reference quotes 28
grammars; the reader is line-wise, since four grammars document fences
themselves; the controls plant the gate enumeration without save and read
cc-ask drift alone, restore it by re-embed, and refuse a block naming a
file `dtd/` does not have. `node checker/subsets-sweep.mjs --controls`:
5 run, 0 failing; `sweep:subsets` and `controls:subsets` in the gate chain
and the workflow. The counts sweep reads the rule span from the checker's
own rule comments and holds the manifest, the README row and the citation
to it, holds the citation's counts and guards, and the skill's quoted
count to the reference's headings: 57 places. `CITATION.cff` is 9.0.0,
today, in the tree's counts, and `checker/release-notes.mjs --versions`
reads its version beside the manifests, a stale one tripped by name:
`node checker/release-notes.mjs --controls`: 11 run, 0 failing. The
hosted unknown says it is historical.

### The companion's eleventh pass: the cache in the work tree

The eleventh pass returned fail with five findings, one high: the cache
this release introduces writes `artifacts/cache/<command>.nt` under the
working directory and `.gitignore` had no rule over it, so a save made
inside a repository would have shipped the operator's session in the next
`git add -A`; the sigil census's `artifacts/sigil/run.json` sat in the
same gap. The lower four: the hosted record predicted 137 for an upload
whose renames remove the two collisions (139 is the number, 137 would mean
the renames did not land), `--versions` printed five of the six sources it
compares, `LIST.entry.figure` described a file the tree does not hold,
and `lib/ai-slop.mjs sweep` handed a file died on a scandir stack.

`.gitignore` names both directories, `git check-ignore -v` answers with
the rule, and the cache controls assert it: `CACHE.dir` is ignored by the
repository the module lives in, so the next writer a subset declares
cannot ship without a rule. `node lib/cache.mjs controls`: 20 run, 0
failing. The hosted record predicts 139 and says what 137 would mean;
`--versions` prints CITATION.cff; the figure entry says the tree keeps
none yet and its figures are drawn from answers; a sweep handed a file
refuses by name at exit 2, tripped on purpose in the slop controls.

### The companion's twelfth pass: the control that could not fail

The twelfth pass returned fail with seven findings, one high: a glossary
control asserting no external stylesheet or script ended in `|| true`,
and a planted `<link href="http://example.com/evil.css">` left it green.
The lower six: the glossary reported two plates written where forty were,
its main-detection dereferenced `process.argv[1]` unchecked so the
module could not be imported, the slop sweep walked directories so an
untracked note beside the records was measured here and absent in CI,
`dtd/cc-schematic.dtd` ended on its last `>` with no final LF and the
encoding sweep had no arm to see it, the "root documents" step covered
six of nine, and `docs/HOSTED-PLUGIN.md` sat outside every sweep.

The glossary counts network URLs outside w3.org and a planted stylesheet
moves the count (`node checker/glossary.mjs --controls`: 16 run, 0
failing); both messages compute the plate count; the guard reads
`process.argv[1] &&`. `lib/ai-slop.mjs sweep --tracked` takes its file
set from `git ls-files`, prints tracked N of M, and its control plants an
untracked file the tracked sweep leaves out; the gate and the script sweep
tracked. `lib/encoding.mjs` judges a fourth arm, a text file with no final
LF, never a file with a NUL byte, with a planted file and a planted GIF
(`node lib/encoding.mjs controls`: 6 run, 0 failing); the schematic ends
with LF. The root-documents step runs all nine and the hosted doc.

### The companion's thirteenth pass: the badge, the licence texts and the last four folders

The thirteenth pass, given ninety turns after the first attempt spent
sixty reading, returned fail with five findings, one high, and reached
LICENSES, agents, bin and monitors. The README wore a REUSE badge while
eighteen tracked files (every JSON, JSONL and GIF) carried no SPDX tag,
no sidecar and no `REUSE.toml`, and the SPDX sweep skipped exactly those
extensions and reported 0 missing over them; `LICENSES/MIT.txt` was
referenced by no SPDX expression, the upstream MIT living only in a prose
Portions line; the installer dropped a `RUNTIME` entry whose file is
absent in silence; and the contract auditor's description named four
shared subsets of nineteen.

`REUSE.toml` covers the three extensions under the dual licence. The
156 files converted from taches-cc-resources carry `(AGPL-3.0-or-later OR
EUPL-1.2) AND MIT` and the upstream author's `SPDX-FileCopyrightText`, so
the MIT text is used by the expression that names it. `checker/spdx-sweep.sh`
has no skip list: a tracked file carries one of the two expressions, or
matches an annotation path of `REUSE.toml`, or is a licence text, or it is
missing; its control plants a tagless `.md`, a tagless `.bin` and a
tagless `.json` and reads missing move by two and covered by one. The
installer fails by name on a `RUNTIME` file the tree lacks. The agent
description says every `dtd/cc-*.dtd`, nineteen of them, and the counts
sweep holds that word, the licence plate's converted count and the
supporting plate's converted commands and skills to the tree: 60 places.

### The companion's fourteenth pass: the runner's own record

The fourteenth pass could not start until the runner was repaired: after
thirteen passes the range's changed-file list, folded into one prompt
argument, exceeded the argument limit and `claude` never ran (exit 126,
"Argument list too long"); the runner now folds a list past 200 files to
one line per directory. It then returned fail with five findings, two
high, every one about the records the runner owns: the run that failed had
truncated `artifacts/research/companion-9.0.0.md` to a bare newline before
it started, the next commit swept that in, and a tracked one-byte file
with no header turned the SPDX sweep red; the runner truncated both files
on every pass, so a header committed by hand could not survive one run;
the README's SPDX row read against that state; the licence prose counted
the source half as the repository total; and the `**/*.json` annotation
licensed the runner's raw transcript as package content.

The runner writes the record with its header to a temp file and moves it
into place only when an answer parsed, so an empty run keeps the previous
record. The raw JSON transcript is ignored, a scratch and never a record.
The README's SPDX row says what the sweep holds now, and the licence prose
says 156 converted sources mirrored into the installed copy.

### The companion's fifteenth pass: a record that could score an older run

The fifteenth pass returned fail with five findings, two high. The
keep-the-previous-record branch of the pass before had a hole: a run that
produced nothing left the previous record in place and the runner then
scored it, and its scope line matched this run's byte for byte. The
README's doctor row said eighteen subsets where the instrument counts
every file under `dtd/`, thirty-one, and nothing read the number. The
SPDX test grepped the whole file, so a body quoting the expression passed
as tagged; the companion scorer never checked the `next` element its
grammar declares; and `**/*.json` claimed every future JSON at any depth.

The runner stamps each record with the run that wrote it and scores no
record carrying another stamp (LAW.COMPANION.7); a run with no answer is
unaudited, exit 1, never scored. The four headings must appear in declared
order for a pass (LAW.COMPANION.8). Both are tripped in the checker
controls, M20 and M21, and the planted pass M12 carries the headings. The
SPDX test reads the first twenty-five lines and a fourth plant, a file
whose only tag is quoted prose, is counted missing. `REUSE.toml` names the
JSON directories the repository owns. The doctor row says thirty-one and
the counts sweep holds it to `dtd/`: 61 places.

### The companion's sixteenth pass: the runner's own droppings

The sixteenth pass returned fail with eight findings, one high: the nested
companion session ran with its working directory inside the tree,
`artifacts/research`, and its own hooks left `.claude/`, `.rot-moe/` (18
files, 4 MB of session transcripts behind a one-line `.gitignore` of their
own) and a `CLAUDE.md` there, while the runner's comment said the cwd was
not the repo. The lower seven: the grammar's law map stopped at 5, a
CHANGELOG row quoted the untracked sweep form, the committed record
predated the stamp, the stamp law was skipped on a hand re-score, the
heading capture counted any third-level heading the companion quoted, and
the shell glob behind `REUSE.toml` let `*` cross a slash.

The runner runs the session in a temp scratch outside the tree, removed
after, and writes the records by absolute path; `.rot-moe/` was ignored
under `artifacts/` and those droppings removed (the seventeenth pass found
the live ones at the repository root). A stamped record is
scored only by its run: a hand re-score without the stamp is refused,
M22, and the checker suite is 25. The heading capture counts only the
four declared words. The SPDX sweep translates each annotation glob to a
regex where `*` never crosses a slash, with a planted JSON one level
below a named directory counted missing, and names any directory under
`artifacts/` carrying its own `.gitignore`, a planted one tripped. The law
map names 7 and 8 with their controls.

### The companion's seventeenth pass: the arm aimed at last week's example

The seventeenth pass returned fail with eight findings, two high: the
foreign-ignore arm of the pass before searched under `artifacts/` while
the live `.rot-moe/`, the RoT MoE plugin's state for the build session
itself, sat at the repository root behind its own one-line `.gitignore`,
and the ignore rule was scoped to `artifacts/` too, so the sixteenth
pass's paragraph said the droppings were gone and the tree said
otherwise. The lower six: the README's checker row quoted `22 run` where
the suite prints 25; the Greek table wrote 29 as `icosienna-` against its
own rule while the constructor's control passed by remembering the
divergence; `${#globs[@]}` under `set -u` is an unbound variable on bash
3.2; the runner's usage header promised exit 2 for a bare `--score` and
`${2:?}` gave 1; and the record's `.tmp` staging path was unignored.

The arm walks from the root and names any `.gitignore` the repository does
not track unless the repository's own rule already ignores that
directory, planted at the root and under `artifacts/`; a bare `.rot-moe/`
covers the plugin's state wherever a session runs, and the live directory
stays, it is the running session's. The README row quotes 25 and the
counts sweep holds it (62 places). The table writes `icosiennea-` and the
typography control reads the table's own row against the constructor.
The glob count is `${globs[0]:-}`, the `--score` guard exits 2 as the
header says, and the staging path is ignored.

### The companion's eighteenth pass: a prefix grant is an interpreter

The eighteenth pass returned fail with eight findings, one high: the
runner granted `Bash(node lib/ceiling.mjs 60 node:*)` and the git twin,
and a prefix grant admits everything after the prefix, `node -e` with
`writeFileSync`, `git commit`, `git checkout`, while the comment above it
said that shape was LAW.COMPANION.1 and 2. The lower seven: law 5 had no
control that fires the ceiling; a comment above `globs` still described
the case arms; the narrower `.rot-moe` rule sat beside the bare one; the
typography control proved one row of the Greek table and asserted the
rest; the fail branch printed the LAW.COMPANION.8 message and then `FAIL`;
`find` descended `.git/` and `node_modules/` before filtering; and the
README's checker row kept its old date.

`checker/companion-run.sh` is the one Bash form the companion may run: an
engine of this repository under `lib/`, `checker/` or `bin/`, or a git verb
that reads, under the portable ceiling with stdin closed, refusing by name
any other executable, a node flag that evaluates or loads code, a script
outside the engines, a git verb that writes and any argument carrying
shell syntax (the nineteenth pass narrowed the engine test to what an
engine does). The grant is that wrapper alone, the prompt says so, and the
runner compares HEAD and the porcelain status before and after the
session, a changed tree read as the companion's breach. The checker suite
is 29: M23 refuses a copy granting the old prefixes, M24 trips the
wrapper's refusals and runs an engine, M25 plants a changed tree, M26
fires the ceiling with a `claude` that sleeps and reads UNAUDITED at exit
124 (LAW.COMPANION.5). The typography control compares every row of the
Greek table the constructor names and counts the rows beyond the
carve-out named by number. The seams are closed and the row is dated.

### The companion's nineteenth pass: an engine is what it does

The nineteenth pass returned fail with eight findings, two high, both on
the wrapper of the pass before: its engine test was a directory test, so
`spdx-add`, `subsets-sweep` run bare, `seal-secret` and the installer were
admitted through it, and `config` sat among the reading git verbs where
`git config --file <any path> a.b c` writes anywhere on disk. The lower
six: M24 asserted a file's absence that nothing could have created, the
`renders` producer was a typeof test over exports, the `typeset` comment
said classes is always rendered where the answer renders it and no engine
does, the controls header inventory stopped at M19, and a label lost its
apostrophe.

The wrapper admits an engine by what it does: writers and publishers are
refused by name, a bare run is refused except for the engines that only
report when bare, otherwise the first argument is a verb from the reading
set or a text file the engine judges, and `build` runs only with
`--check`; `git config` runs only as `--get`, `--get-all`, `--get-regexp`
or `--list`. M27 refuses `config --file` and a key write and reads with
`--get`; M28 refuses `spdx-add`, `plates` bare, `cache save` and `build`,
and runs `ordinals controls` and `gate-sync`; M24 reads the refusal by name:
31 checker controls. The `renders` producer renders the figure fixture
through each driver, the `typeset` comment names the answer as its
renderer, and the header inventory reaches M28.

### The companion's twentieth pass: one engine at a time

The twentieth pass returned fail with eight findings, three high, all on
the wrapper's verb set: a universal reading set let `readme-index check`
reach the writer, since four engines treat any token that is not `--check`
or `--controls` as their write mode; `counts-sweep` run bare ran the
checker suite, which plants at the root; and `contract-audit` run bare
plants `dtd/zz-control.dtd` in the tracked tree during its own controls.
The lower five: M28 exercised three arms, the glyph class enumeration
named block unconditionally while its module is IGNORE, the ceiling branch
returned before the tree was compared, M25's plant had no trap, and
`lib/arm.mjs` spelled the BOM with the character itself.

The wrapper carries a table, one engine per line with the spellings it
reads by: FILE for an engine that judges a file, BARE for the two
reporters, `build` only with `--check`; `counts-sweep`, `controls-sweep`
and `contract-audit` are refused by name; an engine outside the table is
refused. M28 adds the dashless `check` against `readme-index`, the two
refused by name and a verb outside an engine's set; M29 runs the two
reporters bare and refuses `glossary` bare and an engine outside the
table; M25 cleans up under a trap: 32 checker controls. The runner
compares the tree before the ceiling branch returns. The glyph class
enumeration is `typo.glyph.classes`, a parameter entity a command
redeclares with the two others when it switches block on, so a glyph in a
switched-off class is invalid against the subset; the enumerations walk
reads the resolved default driver and the class producer follows the
modules; 1929 declarations. The BOM is `\uFEFF`.

### The companion's twenty-first pass: a spelling is measured, not assumed

The twenty-first pass returned fail with eight findings, two high: the
table's shared `--check --controls` line granted `--controls` to two
sweeps that parse only `--check` and fall through to their writer, and
the nested session ran with no permission mode, so a parent in bypass
mode left the allow-list inert and a shell pipeline outside the granted
form ran. The lower six: `live-sweep` reaches the network, the comment
said one line per engine over grouped lines, the node arm ran engines
from the scratch directory, a refusal shared exit 2 with an engine's own
usage line, `about-sweep --check` reached a credential, and `resolve`
carried a parameter it never read.

The table is one line per engine, each spelling measured to exit without
a usage line and to leave the tree as it was; `live-sweep` is refused by
name; the node arm runs from the repository root; a refusal exits 3. The
nested session runs under `--permission-mode default` and `allow_ok`
holds the line to it. M30 walks every spelling the table grants under
the tree state, red on a refusal of the table's own spelling or a moved
tree; M31 refuses a runner copy without the mode: 34 checker controls.
`resolve(ch, { fallback })` says where the class switch lives. The walk
itself forked the suite once: `about-sweep --controls` measures through
`counts-sweep`, which runs the checker suite, whose walk ran `about-sweep`
again, 521 processes before the kill; `about-sweep` is refused by name and
the suite refuses to run inside itself through an environment mark every
child inherits.

### The companion's twenty-second pass: the security page, three rewrites old

The twenty-second pass returned fail with seven findings, one high: the
security surface table still described the companion's grant as Bash
forms starting with `timeout 60`, verified by M17 alone, three rewrites
after the fact. The lower six: the table's comment claimed every spelling
measured while `schematic check` and `cache load` print a usage line
without an argument; M30 excused a usage exit and the ceiling, the very
properties the table claims; its `-ge 40` guard sat below the 69 pairs
the table emits; the recursion guard had no control; and `tree_state`'s
failure string was captured as data by both callers.

`SECURITY.md` names the wrapper, the 300 s ceiling, the permission mode
and the tree comparison, and its evidence cell names M17 to M32; the
counts sweep holds the page's ceiling to the wrapper and its span to the
suite (64 places). The two spellings leave the table. M30 fails a
spelling on a refusal, a usage exit, the ceiling or a usage line, walks
`sweep` and `check` with an argument, and requires the count the table
emits. M32 runs the suite inside itself and reads the refusal by name:
35 checker controls. The runner treats an unreadable tree as unaudited.

### The companion's twenty-third pass: a control that has never been red

The twenty-third pass returned fail with four findings, one high: M9
asserted exit 1 alone, and the scorer exits 1 on every path but a pass,
so M9 could never trip whatever the scorer did. The lower three: the
table's `cache controls` was read as a writer because its output prints
paths relative to its temp root; `--table` returned before the syntax
scan; and a companion quoting `<finding file=` at column zero in a body
would have added a phantom element to the count.

M9 asserts the FAIL path by its own line, its plant carries the four
headings, and M33 proves it by gutting the high count in a copy of the
scorer and reading M9's plant refused for LAW.COMPANION.4. The scorer
counts an element as one whole line, opened and closed, and M34 plants a
quoted opening tag at column zero and a split element and reads neither
counted. `tree_state` reads the ignored artifact directories an engine
could write under, and M25 plants under `artifacts/cache/` as well as at
the root: 37 checker controls. The cache controls say every path they
print is under a temp root; `--table` takes no argument.

### The companion's twenty-fourth pass: the runner's own stream in the reading

The twenty-fourth pass returned fail with three findings, one high: the
tree reading now lists the ignored files under `artifacts/research`, and
the runner tees its own raw stream there during the session, so the first
audit of any phase would have read its own output as a changed tree. The
lower two: the grammar's prompt said a finding element goes on its own
lines, plural, where the scorer counts one line; and M30's coverage
compared a count to itself.

The raw stream is teed to a temp file outside the tree and moved into
place after the second reading; M35 proves it with a `claude` that
answers a pass at once under a phase name with no prior stream, and reads
PASS rather than UNAUDITED. The prompt says one line, opened and closed
on that line. M30's expected count is parsed from the wrapper's rows by
awk, apart from the sed `--table` uses, so the two readers are held to
each other: 38 checker controls.

### The companion's twenty-fifth pass: three pathspecs

The twenty-fifth pass returned fail with five findings, one high: the
ignored-file arm of the tree reading named three artifact directories, so
a write under `dist/` or any other ignored region stayed unread, and M25
planted only where the arm looked. The lower four: the prompt still
ordered two runs in the `ceiling.mjs 60 node` form the grant now refuses,
the security page described the narrower comparison, and
`artifacts/research` carried only the runner's own ignore rules.

The arm reads every ignored file of the whole tree, minus the plugin's
state, the index cache, `node_modules` and the runner's own stream; M25
plants a third file under `dist/` and reads the state move for all three.
The prompt orders its two runs through the wrapper. The security page
says what is compared.

### The companion's twenty-sixth pass: the grant is a prefix on a shell string

The twenty-sixth pass returned fail with six findings, two high, both
measured: `bash checker/companion-run.sh … ; echo EXIT` ran the chained
echo under the one Bash grant, since a prefix grant matches the string
and the shell resolves the chain before the wrapper sees an argument; and
`git grep -O<cmd>` had git spawn the named command with the matched
paths, inside a "reading" verb. The lower four: the security row's
wording, a `sed` fold that collapsed every one-level directory to `.`,
the two table readers keyed on one row shape, and two prompt runs still
ending in `< /dev/null`.

`checker/companion-guard.mjs` is the nested session's PreToolUse hook,
installed by the runner through `--settings`: it refuses any Bash string
that is not one wrapper call with no chain, pipe, background, redirect,
substitution, backtick or newline, and every writing tool by name; its
eight controls plant the payloads, and M36 pipes a chained command
through it and reads the block, then reads the runner installing it. The
wrapper refuses `-O`, `--open-files-in-pager`, `--ext-diff` and the
textconv and pager flags, and runs git with `--no-pager` and a `cat`
pager; M24 probes `git grep -O` and reads exit 3 with no spawn. The fold
keeps a one-level directory, M30 reads the table's rows by a third
reader, the prompt's runs carry no redirect: 39 checker controls,
`controls:guard` in the gate chain (84). Proved live once, outside the
gate: a two-turn nested session told to run the chained wrapper command
reported "Blocked before execution" with the hook's reason in its tool
error, and the chained echo never printed.

### The companion's twenty-seventh pass: the field beside the string

The twenty-seventh pass returned fail with six findings, one high: the
hook read only the command string, so a wrapper call sent through the
Bash tool's own `run_in_background` field would have passed it, the one
act LAW.COMPANION.1 names. The lower five: the law map did not name the
hook, M36 piped one payload where its comment claimed four, the guard's
usage said six controls over seven, the `--table` arm ran with stdin
open, and the reading arm excluded three regions where a write would
have been invisible.

The hook refuses a Bash call whose `run_in_background` field is set
whatever the string says, with a control and the header naming the
field; M36 pipes six payloads through the binary, five blocked with
their reasons and one passed. The law map names the hook and M36. The reading arm
excludes only the runner's own stream, since this session's hooks fire
around the run and never inside it, and M25 plants a fourth file under
the index cache. The `--table` arm reads with stdin closed.

### The companion's twenty-eighth pass: an empty command is not no command

The twenty-eighth pass returned fail with six findings, two high, both
from the twenty-sixth fix: `-c diff.external=` set the external diff to
an empty command rather than to none, so every patch-producing `git
diff` died through the wrapper, and no control ran a patch-producing
verb, so the dead diff was an alarm nothing could trip. The lower four:
`-p` refused as a pager flag where the diff family reads it as patch,
and three counts off by one on the security page, in the law map and in
the pass before.

The diff family runs with `--no-ext-diff --no-textconv` as options of its
own and the config knob is gone; the refusal keeps `-O`, the pager
opener, `--ext-diff` and `--textconv`. M24 runs `git diff` and `git show
-p` through the wrapper and reads a patch from each. The three counts
say four plants and six payloads.

### The companion's twenty-ninth pass: pass

The twenty-ninth pass returned pass at `a999e18`: twenty turns, six
findings, none high, every one a comment or a count beside an instrument
that holds. Closed after the pass, before the tag: the wrapper's ceiling
is one variable its three arms and the security page's place read; the
scorer counts a heading only outside a fence, and M37 quotes a previous
record's four headings inside one and still scores a pass; M36 reads a
runner copy without `--settings` as unwired; the `--table` read runs
under the ceiling; the two stale comments say six payloads and the
table's own count: 40 checker controls. Twenty-nine passes audited
9.0.0, every tracked folder reached, the tenth onward under a focus
line naming what no pass had touched. The first hosted run of the tag
failed on all three legs at M24: its diff arm read `HEAD~1`, which a
depth-one checkout does not have (exit 128), and a full-history clone
never showed it; the arm diffs the empty tree against HEAD, proved in a
depth-one clone, and the tag was moved to the corrected commit before
any release object existed. The second hosted run failed on two faults
this machine cannot show: the creators audit ran its two corpus trips
only where the corpus is, so the hosted legs printed 6 controls against
a claim of 8, and the trips now run on every leg against a planted
corpus, one entry per row with the grammar the row declares, while the
record check on such a leg carries the counts the writing machine
measured and holds the rows, a drifted row refused there too (nine
controls); and the
sigil trial `error-if-unset` expected exit 1 where bash 3.2, the macOS
leg, answers 127, so a trial may carry an older expectation with the
bash it is below, the run names it beside the trial, and the sigil
controls count 16. The third hosted run failed on two more: the wrapper
`checker/companion-run.sh` sat at mode 644 in the index where every other
script is 755 and the executable-bits step refuses it, invisible on a
tree whose filemode is off; and the sigil run claim names windows while
the macOS leg prints 39 pass and 4 unsupported, so a run claim is held on
the leg it names by its pass count and on another leg as pass and
unsupported together with no fail, said beside the claim (fourteen sweep
controls). The tag was moved a third time, still before any release
object existed, and the fourth hosted run shipped the release: every
gate leg green, every install roundtrip green, the release object on
the tag with its three assets. The tag's scala job, the first run of the
hosted chains there has been, failed on all three legs within a minute:
every family answered in 18 bytes plus its first token, the CLI's
`Unknown command` line, because the runner had the repository and the
credential but no commander installed where the CLI reads its commands,
and no model was called (the credential, resealed on suspicion first,
was not the cause). The scala job installs the commander into the
runner's config dir, answers one smoke turn whose raw result is printed,
prints the raw head of any empty answer, and `checker/scala.mjs` names
the refusal as a finding by token before it counts a heading (twelve
controls). The release object was already on the tag, so the tag stays
where it is and the corrected job runs by dispatch on main.

## 8.0.0 (2026-09-06)

### Cross-OS-Commander: the gate runs on every leg, or it is not a gate

Every job of the gate ran on `ubuntu-latest`, five times over, and the tree
was developed on Windows under Git Bash. Nothing had ever run on macOS.
Measured before a line was designed: three checkers called the `timeout`
binary, the encoding sweep used `mapfile`, `grep -P` and `grep -U`, the
release job used `sha256sum`, and one mutation control used a GNU `sed`
newline. The macOS runner has none of those, so a `macos-latest` leg would
have failed before it measured anything. A suite whose gate cannot run on a
user's operating system is not certified for that user, whatever its badges
say. The single-leg approach is replaced, not kept beside: `gate` and
`install-roundtrip` run on the matrix `ubuntu-latest`, `macos-latest`,
`windows-latest`, and the release job needs every leg green.

- **`dtd/cross-os.dtd`**, LAW.XOS.1 to 7. The three legs are an enumeration,
  the four local substrates are probed and never guessed, and the eight shell
  forms a leg lacks are a list the sweep reads, in both directions. `lib/cross-os.mjs`:
  `probe`, `sweep`, `matrix --check`, 27 controls.
- **The podman trap.** `podman machine list` on this machine answers a header
  and zero rows at exit 0; a script that tests the exit code concludes a
  substrate exists. LAW.XOS.1 reads the rows. WSL is not installed (exit 50),
  `wsl --install` needs elevation and a restart, so no command runs it; the
  local Linux leg is recorded refused and the hosted leg carries it. A local
  macOS leg is refused by licence, not by technology.
- **A ceiling that exists on every leg.** `lib/ceiling.mjs` exits 124 where
  `timeout` is absent, `checker/portable.sh` chooses, and both paths are
  tripped on purpose. The encoding sweep reads bytes in Node
  (`lib/encoding.mjs`, every tracked file judged, 0 bad, three planted files caught).
- **The sigil inside a comment.** The arguments sigil in two subset comments
  was substituted by the harness at every invocation; this session's loaded
  command read "the 8.0.0 Cross-OS-Commander variant tables". The comments
  name the document instead.

### The companion refused the first cut, on the release's own thesis

The Scratchpad Companion's first pass over the range returned fail with four
high findings, every one of them the same defect in a different material: a
guard whose scope stopped exactly short of what the release added. The three
new commands instructed the bare `timeout` eight times, and the twenty
command bodies of the Suite carried it forty-four times in all, and the sweep
read only `checker/` and the workflows. The companion runner's own allow-list
granted `Bash(timeout 60 ...)` and control M17 required that form, so a
maintainer repairing it would have been refused. `dtd/geometry.md` failed the
slop gate and nothing ran the gate over it. All of it is taken: the sweep reads
every command, skill and agent body, every one of the forty-four calls is the
portable ceiling now, the nested session runs under `node lib/ceiling.mjs 60`,
M17 is inverted and M17c refuses the old form, the eighth form is declared with
a reverse control, the `portable.sh` exemption is one form wide, a `timeout`
with flags is refused, LAW.GEOM.5 has a control, and the table is swept.

The second pass found what the first could not see, because the first had
not happened yet: this section's own text was spliced. A string replacement
had expanded a dollar sign, the file's title and its SPDX comment sat inside
the sigil bullet, and every instrument on the path exited 0; it would have
shipped as the release body. `checker/release-notes.mjs` refuses a section
carrying the file header, on every push. LAW.GEOM.1 was held by a CDATA
attribute and a sentence; the verb of a measure, a projection and a change is
now an enumeration each band subset raises before the driver, so a surveyor
measure carrying 41 is invalid against its own DOCTYPE. Four numbers in this
changelog and two README claims rows were stale on the release date while the
counts sweep reported every place in step: the sweep reads 64 places, from 22.
The cross-os sweep reads `package.json` scripts and refuses a release job
that does not need every leg; the scorer refuses two verdict lines and none
(M18, M19); `lib/ceiling.mjs` maps a signal to its number. The sigil document
accused of steering flags measured clean, 0 of each, and was left as it was.

The third pass read the second and found the same class one indirection
later. The state record capped a row at 160 characters and the ledger
re-emitted from it lost twenty-nine committed characters mid-word; the cap is
gone and a row of 270 round-trips whole. The checker-control count was a
formula over labels, max(M) plus one, blind to M17c: twenty was published in
three places for a script that runs twenty-one, and the sweep meant to catch
it could not. The script counts what it runs and prints a total line; the sweep reads that
line, the span M0 to M19 beside it, and its own size. The signal line in `lib/ceiling.mjs` had no control; a child
killed with SIGTERM under its ceiling now exits 143 on every leg, and the old
flat 9 fails it at 137. The release-needs check read every job after
`release:` and holds only its own block now; a needs line in a later job no
longer stands in. A form in a `package.json` script is reported at the line
the file declares it.

The fourth pass found the count that ships. `checker/pack-claude-ai.mjs`
rewrote both hosted manifest descriptions from constants three releases old,
131 commands, 1440 declarations and eighteen checker controls, and its own
control C16 pinned the stale marketplace opening as a literal, so it asserted
the wrong number instead of refusing it. The descriptions are built from the
tree's manifests now, with the patterns the counts sweep holds those files to,
a missing pattern refuses the pack by name, and C16 compares every number the
archive carries against the tree; C16b proves a description of three releases
ago is refused, C16c that a manifest without the patterns is. The control
script's total was pass plus fail, which a mutation that fails to land would
inflate; it counts once per control through ok and ko, and M17b, which fired
without a line, is counted: twenty-two. The sweep refuses a total line with a
failing count above zero, reads the gate step name's three numbers from the
script's labels instead of subtracting a constant, and runs its instruments
once per leg.

The fifth pass read the fourth and used what it had built. Importing the
packer to exercise its new exports packed a 5.4 MB archive into `dist/` and
exited the importing process, because the entry point ran at module scope;
it runs only as a script now, C24 imports the module in a child and proves
nothing is written, and `dist/` is ignored. The control script raised
`fail` twice on twenty-one of twenty-two failing paths, so one red control
would have printed two; `ko` is the only writer now, and a plant mode runs
one control forced to fail and prints `2 run, 1 failing`, read by the sweep.
The gate's one invocation of the sweep printed a count of drifted places and
no name; it prints every `DRIFT` line. The marketplace opening's three
family counts, nineteen book-derived commands, sixteen creators over eight
schematics, were frozen in the packer's template and held by nothing; the
sweep measures them from the shelf and the variants on disk, the packer
reads them from the tree, and C16 compares them.

The sixth pass read the guard the fifth had written and found it built on a
decode the rest of the tree does not use: the packer turned its module url
into a path by hand, percent-encoding kept, so on a checkout path carrying a
space the entry point never matched and the packer exited 0 having built
nothing, six gate steps green with it. It reads its path through
fileURLToPath like the other fourteen modules, the predicate is exported and
tested against an encoded url, and C24b copies the module into a directory
with a space in its name and proves it runs there. `docs/HOSTED-PLUGIN.md`
told a reader to run the packer's controls and compare against 23 while the
instrument answered 26; the doc's two lines and the Measured block above
carry what it prints, and the sweep reads all three. C16b plants stale
family counts so the keys added to the comparison have a trip, and the sweep
plants a stale one in the marketplace opening.

The matrix then measured what no pass had: on d1866a9 the ubuntu and windows
legs went green and the macOS leg went red, because `os.tmpdir()` there is a
symlink, `/var` to `/private/var`, Node resolves the main module to the real
path and leaves `process.argv[1]` as typed, and the predicate compared the
two spellings of one file unequal; C24b, the one control that runs from the
temp directory, failed, and the sweep refused the red suite without naming
the control. The predicate compares real paths, C24b runs the copy through a
symlink to its directory on every leg, a junction on Windows, and the sweep's
refusal quotes the FAIL lines. Measured here before the fix: a copy run
through a junction printed nothing at exit 0; after it, the usage.

### The fifteenth family: the Graphic and Geometric Suite

Until now every family reasoned in prose about structure. `dtd/geometry.dtd`
is the first driver in this Suite, the four-line XHTML 1.1 idiom the tree had
never used: three band modules a repository may switch off before the
include, and the command of a switched-off band refuses to run. Fifty-two
rungs, never renumbered. `/codebase-surveyor-dtd` (1 to 17) measures and
moves nothing, its measures fixed at confidence measured by declaration;
`/codebase-architect-dtd` (18 to 35) declares bounds a later survey is held
to, rewrite fixed at no; `/codebase-renovator-dtd` (36 to 52) is refused by
name unless a survey and a plan exist on disk first, and closes with a
colophon and the digests of both. Twelve rungs have an instrument in this
release; the rest are unmeasured and say so.

- **`dtd/cc-figure.dtd`**, one figure, two renderers. A preview is text by
  declaration and the widget is a monospace box of 60 by 3 cells cut, 80 by 12
  expanded; that box is a raster in cells, so the figure is declared once and
  rendered to characters for the widget and to svg for the disk. The character
  grid bounds the svg, never the reverse. Every shape is a module with its
  name a parameter entity, after TEI; `lib/figure.mjs`, 23 controls.
- **The preview may carry a figure.** `preview.content` is a parameter entity
  a command raises before the include (LAW.ASK.16), the way it raises its
  rounds; the 131 existing commands keep the text preview they had, and
  `build --check` proves their resolved text is the same declaration.
- **The corpus, measured for this family.** `svg` uses conditional sections in
  33 of 54 files, the densest in the tree; `xhtml11.dtd` is 323 lines against
  4689 flat; `tei` 21 of 60, `docbook` 18 of 116, `JATS` 4 of 90, `DITA` 4 of
  159, `daisy` and `office` 0. NDATA appears in none of the 2219 files.

### Measured

- `node lib/cross-os.mjs controls`: 27 run, 0 failing
- `node lib/figure.mjs controls`: 23 run, 0 failing
- `node lib/geometry.mjs controls`: 38 run, 0 failing
- `node lib/ceiling.mjs controls`: 7 run, 0 failing; `node lib/encoding.mjs controls`: 6 run, 0 failing
- `node lib/list.mjs controls`: 47 run, 0 failing; `node lib/starlist.mjs controls`: 41 run, 0 failing
- `node checker/pack-claude-ai.mjs --controls`: 27 run, 0 failing
- `node checker/contract-audit.mjs`: 1619 declarations, 0 unused, 0 law gaps
- 134 commands, 22 skills, 5 agents; checked 161; 1619 declarations; 62 gate-chain commands
- recognised 8.0.0 (class major) from the kept verbs 14, 11, 12, 12, 11, 13, 11, 3, 2, 6, 12, 6, 8, 6, 3, 6, 6, 6, 3, 7, 3, 6, 3, 3, 6, 3 at 7.2.0

## 7.2.0 (2026-09-05)

### It installs on claude.ai and Claude Cowork

One archive, dragged into Customize, installs the whole suite on the hosted
surfaces. It took three refused uploads to learn the rules, and the fourth
worked. `checker/pack-claude-ai.mjs` derives that archive from the tracked tree
and refuses one the surface would refuse; the repository itself did not move.

- **`bin/` becomes `.bin/` in the archive alone.** A hosted plugin may not ship
  a PATH directory. The two executables stay where the CLI, `npx`,
  `package.json` and this workflow expect them; four files that name `bin/` as a
  live path follow it inside the archive, and 218 lines that merely describe the
  build are deliberately left alone.
- **Thirty descriptions rewritten at pack time**, none truncated. The surface
  caps a description at 500 characters and refuses XML tags in one. It reported
  5 over-long commands and 1 tagged skill; the tree carried **8 and 3**, so the
  error list was 54% of the truth. `plugin.json` went 1035 to 497 and the
  marketplace description 1274 to 497, both keeping every pattern
  `counts-sweep` and `about-sweep` match against them.
- **Two shadowed commands recovered.** The surface reported 129 commands where
  the tree holds 131, with no error to explain it: `ai-slop-dtd` and
  `setup-ralph-dtd` were each also a skill name, and a command a skill shadows
  never reaches the user. The archive renames the skills to `ai-slop-gate-dtd`
  and `setup-ralph-loop-dtd`; H11 recomputes the collision set so a future
  collision fails by name.
- **H2 withdrawn, falsified by an upload.** It refused a wrapped archive on the
  reading that a nested manifest could not be found. A wrapped archive is what
  installed. Every "missing manifest" report was really the over-long
  description making the manifest invalid: one fault, reported three times. The
  control was inverted rather than deleted, so the suite re-proves it.
- **A baseline, not just rules.** H12 compares the archive against the state
  recorded in `checker/hosted-plugin.json` and fails when a release changes the
  component counts or the collision set, naming the divergence. It does not
  self-heal on purpose: a guard that absorbs drift hides it.
- **Two gradient badges** drawn by `checker/badges.mjs`, not fetched. A
  shields.io half is one flat colour and the brief asked for a transition.
- **Releases carry checksums.** The job attaches
  `claude_ai_cowork_rot_dtd_commander_7.2.0.zip`, a `.sha256` beside it and a
  `SHA256SUMS`, next to the two source archives GitHub attaches itself.
- **`docs/HOSTED-PLUGIN.md`** writes the whole method down so another
  maintainer can repeat it.

`node checker/pack-claude-ai.mjs --controls`: `23 run, 0 failing`.
`node checker/badges.mjs --controls`: `6 run, 0 failing`.
131 commands, 22 skills, 5 agents; checked 158; 1440 declarations; 55 gate-chain commands.
From inside an extraction of the archive, `node .bin/rot-dtd-commander.mjs check`:
`checked 158  failed 0`.

## 7.1.3 (2026-09-05)

### The page is drawn

Every family of the Suite is a plate now: thirty-six SVG drawings, a light and
a dark ground each, served by `<picture>` on `prefers-color-scheme`. Each plate
carries every entry of its family with the exact call you type, what it does and
how many laws its answer inherits, and sizes itself to its own longest line so
the text wraps rather than the plate widening -- GitHub scales any image wider than its ~830px column down to fit, so a wide plate is a SMALL plate.

The mermaid flowchart is gone. It was eleven lines of fence rendered by GitHub's
client at view time, in their colours; the same graph is one file we draw, each
spoke in the colour that family already declares for its badge, so the drawing
and the badges agree without either being told about the other.

### The listing that existed twice

Measured: the Usage index carried **131 markdown table rows** across sixteen
`<details>`, and the glossary block carried sixteen `<details>` of plates. The
same 131 commands, twice, on one page. That was the bloat, not the rendering.
The index keeps the plates and drops the tables; the glossary block points at
`docs/glossary.xhtml` for search and filters instead of repeating what sits
above it. **README.md fell from 63,793 to 40,557 bytes.**

### Nothing is cut

Six plates carried an ellipsis where a family note was clipped at 150
characters &mdash; the one place anything was still truncated once the tables were
removed, and the plate is the only copy of that text now. Measured after: **0
ellipses across 36 plates**. Type went from 10.5&ndash;16px to 13&ndash;22px and rows from
40 to 54 pixels, because a plate that used to sit beside a table now has to be
legible on its own.

### What stays text, and why

The claims table cannot become a drawing: `checker/counts-sweep.mjs` reads eight
numbers straight out of those rows and a grep cannot read a picture. What was
wrong there was three cells running 558, 1000 and 636 characters inside a single
table cell; they say the same thing in one line each now.

`docs/glossary.xhtml` also stays, and stays valid XHTML 1.1: it is the only
surface that carries every string untruncated and searchable.

### Measured

- `node checker/glossary.mjs --controls`: 16 run, 0 failing
- `node checker/readme-index.mjs --controls`: 6 run, 0 failing
- 36 plates, every one 820px wide so GitHub renders it 1:1 rather than scaling it down; 0 ellipses; every plate valid XML
- 131 commands, 22 skills, 5 agents; checked 158; 1440 declarations; 52 gate-chain commands
## 7.1.2 (2026-09-05)

### The glossary

`docs/glossary.xhtml`: every command, skill and agent with what it does and,
for the first time anywhere in this project, **how to invoke it** &mdash; the exact
call including its arguments, read from the `argument-hint` frontmatter that 128
of 131 commands have carried all along and nothing surfaced. Each entry also
names the family that claims it, the root element its answer must take and how
many laws that answer inherits.

Live search, family filters, one self-contained file: no CDN, no webfont, no
fetch. It opens from disk with the network off, which is the only way a
reference is reliable.

It is valid **XHTML 1.1**, and that is not decoration. This project claims a
grammar declared inside a file lets an ordinary validator judge the file; a
reference page that is itself an instance of a published DTD is that claim
applied to its own documentation. The one script is wrapped in a CDATA section,
as XHTML requires, and a control asserts exactly one CDATA close so the section
cannot terminate early.

The family table is imported from `checker/readme-index.mjs`, never copied, so
the index and the glossary cannot drift apart about what a family contains. The
first cut guessed a family from the per-command sigil &mdash; which is a family label
borrowed from one representative command, not a per-command mark &mdash; and put 144
of 158 entries in Unfiled while still rendering a page that looked finished.

### The families section, rewritten

It was 162 lines carrying 94 command names across 15 sentences, six per
sentence, every one already listed with a description in the index directly
above it. It restated the catalogue instead of explaining it. It is 88 lines now
with no command names at all: one paragraph per family, in the index's own
order, saying what the group is for and the moment you would reach for it.

README.md is 58,922 bytes, smaller than the 63,764 it was before the folding
work of 7.1.1 began.

### Measured

- `node checker/glossary.mjs --controls`: 10 run, 0 failing
- `xmlstarlet val -w docs/glossary.xhtml`: valid
- 131 commands, 22 skills, 5 agents; checked 158; 1440 declarations; 52 gate-chain commands
## 7.1.1 (2026-09-05)

### The page, folded

Ten README sections now sit behind their headings and the generated command
index is the one region left open, so the catalogue is what a visitor sees.
The header block stays open on purpose: it carries six numbers `counts-sweep`
publishes, and a proof nobody can see is not a proof. Said plainly, because it
is easy to assume otherwise: a `<details>` shrinks the rendered page, not the
file. README.md grew from 63,764 to 64,793 bytes while the visible page
collapsed to ten headings plus the index.

### A bound that was prose, in the release that condemned prose bounds

The `unreached` arm let a module stay outside the gate if its header matched
`/\b(kept outside|on purpose|because|reason)\b/`. `LAW.ASK.15`, written days
earlier in 7.1.0, says a bound living in prose is not a bound. The release
contradicted itself inside a week and only a question exposed it.

The escape is an enumeration now: `%rer.outside "(spend|nondeterminism|manual)"`
with a declared marker, both read from the DTD, and `checker/live-sweep.mjs`
declares `rer-outside: spend`. `LAW.RER.6` binds it.

### Widening the contract audit: measured, and refused

The open question was whether `contract-audit.mjs` should scan past `dtd/`. It
was tried. It reported 27 orphan declarations of which zero were orphans,
through three separate causes found one after the other: `walk()` collected
`.md` only, so the use corpus for `lib/` was empty; a name read out of a DTD
appears dot-escaped inside the regex that reads it, so a plain `includes` misses
its own reader; and the residue is reached through names built at runtime, which
no static search follows.

That last class is why `.rot-lists/*.dtd` must never enter this scope either.
`lib/list.mjs` builds an entry's ENTITY name at runtime, so 19 of its 21
declarations look orphaned and none is. The widening is reverted and the answer
is now measured rather than assumed: this is the wrong instrument, not a
deferred one. A dynamic audit for checker DTDs is a different tool and is not
written.

### Also

- `node lib/regression.mjs contract` prints every shape the DTD declares, so the
  three glosses have a caller rather than being documentation nobody reads.
- The three ask-me roots carry the `artifact` element the 7.1.0 plan named; the
  build had substituted a `RECORD.*` declaration and said so, which was sound
  reasoning and still not what was asked for. The checker refused three times on
  the way and every refusal was right: C5 wanted the element named in the body,
  C15 a grammar_map row, C13 a template that renders the heading.
- Every saved deep-dive artifact was missing the `intake` its root requires.
  Six were short of it, five repaired. Nothing checks a saved artifact against
  the root that declares it; that instrument does not exist yet.

### Measured

- `node lib/regression.mjs controls`: 12 run, 0 failing
- `node checker/readme-index.mjs --controls`: 6 run, 0 failing
- `node checker/contract-audit.mjs`: 1440 declarations, 0 unused, 0 law gaps
- 131 commands, 22 skills, 5 agents; checked 158; 1440 declarations; 52 gate-chain commands
## 7.1.0 (2026-09-05)

### The regression that never happened

The release opened as a hunt for what v7.0.0 removed. It removed nothing:
`git diff --diff-filter=D --name-only v6.0.0 v7.0.0` returns zero rows, and
`git log -S 'RECORD.info' -- bin/adiutor.mjs` returns zero commits, so the
Adiutor never held the string it was remembered reading. Pass 13 invented that
reader, pass 14 named 13's reader as one that does not exist and invented a
second, pass 15 wrote the truth. The capability was never removed because it
never existed; a false claim about it was, twice.

### Regression, Extention, Retenue

So the new instrument reads claims, not diffs. A diff-based detector would have
returned green on the only regression v7.0.0 actually had.

- `checker/regression-extention-retenue.dtd` and `lib/regression.mjs`, four verbs:
  `claims` opens the reader a comment names and reports the ones that lie,
  `retenue` reports a declaration nothing reads whose reason is written down
  nowhere near it, `diff <from> <to>` reports a declaration that left the tree
  with no commit body naming it, and `controls` plants all of it on purpose.
- Both arms were caught producing findings that were not findings, and both
  fixes are controls now: a rewritten declaration shows its old text on a minus
  line and is not a removal, and a reason can be recorded below a declaration as
  readily as above it.
- The DTD uses a conditional section, the first in this repository to do so.
  `lib/dtd.mjs` has carried `flattenConditionals()` since before 7.0.0 with no
  file in `dtd/` ever reaching it; a resolver nobody exercises is the defect
  class this instrument hunts, so LAW.RER.4 names it and the hunt starts at home.

### The gate that could not run on macOS

`stat -c %s` is GNU. `gate.yml` and `tapes.yml` both used it, so adding
`macos-latest` to the matrix would have failed before reaching a single checker.
Both are `$(( $(wc -c < "$g") ))` now; the arithmetic wrapper is load bearing,
because BSD's `wc` prints leading spaces where `stat` printed none.

### The loop that only the user could end

`LAW.ASK.3` refused `more` after the rounds ran out, because `ask.rounds` is an
enumeration a checker can read. `add` and `impactful` had no such enumeration and
no bound at all, so a guided intake ended only when the user chose to end it.
`ask.adds` and `ask.impactfuls` are enumerations now, the gate carries the
re-entries it has spent, and `LAW.ASK.15` says what happens when all three are
spent. A bound that lives only in prose is not a bound.

The ask-me family also declared no record, which is why it wrote no numbered
file — not because it was the only command that fails to, but because 125 of 130
declare none. All three now declare one under `artifacts/`.

### Read before written

`cc-resources/.dtd-file-examples` is 2219 files, 767 of them DTD-family. The
census behind this release: parameter entities in 618, ID/IDREF in 214, a
parameter entity as an ATTLIST type in 197 (DocBook 4.3 `dbpoolx.mod` spells it
`colsep %yesorno; #IMPLIED`, which is why the gate's new attributes are written
that way), conditional sections in 90, NOTATION in 13, and NDATA in none of them.

NDATA is standard XML — a stock validator accepts our internal subset, which is
the whole point of it. What has no precedent in DocBook, DITA, TEI, JATS, MathML,
SVG, XHTML, OpenDocument or DAISY is using it to classify trust rather than file
format. Rule C7 is the only instrument anywhere that reads it that way.

### Measured

- `node lib/regression.mjs controls`: 10 run, 0 failing
- `node checker/readme-index.mjs --controls`: 6 run, 0 failing
- `node checker/contract-audit.mjs`: 1440 declarations, 0 unused, 0 law gaps
- 131 commands, 22 skills, 5 agents; checked 158; 1440 declarations; 50 gate-chain commands
## 7.0.0 (2026-09-05)

### The lists

Eight commands that declare what a project may contain, what it must ask about, and what it is made of, plus the starlist that bounds them by what this machine can actually reach.

- `/file-blacklist-dtd` and `/code-blacklist-dtd`: refuse a filetype from the source while leaving it usable outside, or refuse a code class outright. Code is the stricter half and implies the file rule, so one entry does both.
- `/file-graylist-dtd` and `/code-graylist-dtd`: mark what must be asked about rather than refused. The ask names the reason recorded when the entry was listed and offers the replacements the white list already allows; a grant is dated and never asked again for that entry.
- `/file-whitelist-dtd` and `/code-whitelist-dtd`: declare what the project is made of and what it becomes in production. A tape in the file scope becomes a gif in the code scope; a pair with one end is rendered incomplete.
- `/starlist-dtd` and `/starlist-manager-dtd`: what the harness may reach, and the six declared managers that reach it. Searches run in the foreground under each manager's own ceiling; an install happens only after a confirmation showing the literal line, and is refused outright for anything a black list names.

### The mechanism, borrowed rather than invented

The corpus in `cc-resources/.dtd-file-examples` decided the shape. DITA's constraint modules narrow a grammar by redeclaring a parameter entity before the base module loads, so a blacklist is a constraint module rather than a configuration file. `subjectScheme` binds an attribute's legal values to a taxonomy held outside the grammar, which is what a whitelist is. The `.ent`/`.mod` split keeps entries apart from the grammar that reads them, so entries live in `.rot-lists/` and `cc-list.dtd` holds none of its own.

### Two layers, one refusal grammar

A machine layer under the installed plugin and a repository layer at `.rot-lists/`; where both name an entry the repository wins, and every refusal says which layer it came from, what it collides with, and the edit that would resolve it.

### The guards

- The reachability guard refuses any combination that would leave a repository unable to build itself, naming both colliding entries.
- The markdown interlock: `.md` is white from the first run and unseated only when a Julia Markdown installation, a black entry for `.md` and `.jmd` in both white scopes all hold together; the refusal names which failed.
- `LAW.CORE.8` carries the gray ask into every `-dtd` command, skill and agent through the subset they all include.

### Measured

- `node lib/list.mjs controls`: 47 run, 0 failing
- `node lib/starlist.mjs controls`: 41 run, 0 failing
- 131 commands, 22 skills, 5 agents; checked 158; 1434 declarations; 46 gate-chain commands

## 6.0.0 (2026-09-03)

The metamorphosis: the version stops being typed. A release names the verbs it
kept, the recognizer turns them into a number, and a manifest that says
anything else is refused by name. What the codebase was — a set of commands
versioned by judgement — it no longer is.

- LAW.AMP.14 and the gate that enforces it: `checker/release-notes.mjs
  --versions` reads `artifacts/amplify-codebase/state.md`, computes the class
  and version from the kept verbs, and refuses a disagreement by name. The
  control plants 6.1.0 against a recognised 6.0.0 and watches it refused.
- The installer ships every subset in dtd/, read from disk. A hand-kept list
  had shipped fourteen of eighteen while reporting nothing wrong:
  `cc-amplify.dtd` was forged against, checked against and never installed.
  A doctor row `subsets` now diffs the repository against the installation, so
  that class of silence cannot recur.
- Three variant subsets, `amplify-codebase.dtd`, `enhance-codebase.dtd` and
  `overhaul-codebase.dtd`: each pins its band as a #FIXED attribute on the
  root, so a command that claims a verb outside its band is invalid XML rather
  than merely wrong prose, and each carries the four guards of the $ reference
  as declarations where they apply.
- LAW.AMP.11, the growing generator: the page starts at AMP.page, moves by
  AMP.grow.marked, AMP.grow.other and AMP.grow.skipped as the rounds are
  answered, and is held under a ceiling the size of the walk allows
  (AMP.grow.tie) and under AMP.page.max. Engagement leads; the tree's size
  only breaks the tie. The size is carried in the state record.
- LAW.AMP.12, the expiring refusal: a refused possibility returns as verdict
  `reopen` after AMP.reopen.after runs or as soon as a file named in its id
  changes, carrying `refused_at` so a second offer reads as one. A possibility
  marked `done` never returns, and the idea class stays generable without
  limit.
- LAW.AMP.13, the four guards: the argument split like shell words and never
  evaluated, the study written literally, every possibility escaped into
  PCDATA and never wrapped in a CDATA section, and a parameter entity found in
  a scanned file reported as data. Four controls, one per guard.
- `writeStudy` writes the four documents of LAW.AMP.7 from the run's own data,
  and `studyHolds` refuses a study missing a kind by name.
- `--stage=alpha|beta|pre` and `--from=` reach the recognizer from the command
  line; an undeclared stage is refused with the declared classes listed.
- The amplify-codebase skill is dissolved: this is a command family, and the
  prose it carried now lives in the three commands themselves, with the
  generated contract at `dtd/ladder.md` beside the declarations it renders.
- Counts: 123 commands, 22 skills, 5 agents; 18 subsets; amplify controls 35.

## 5.2.0 (2026-09-03)

The codebase growth family: three commands that walk a codebase for what
could be done next, on one ladder of fifteen verbs, remembering every
refusal between runs.

- dtd/cc-amplify.dtd, the growth grammar: the ladder AMP.verb.1 to
  AMP.verb.15 ascending by how much a change disturbs (tweak, enrich,
  ameliorate, amplification, magnify, heighten, promote, cultivate,
  enhancement, upgrade, elevation, intensification, evolve, overhaul,
  metamorphosis); three bands that partition it with no overlap and no gap;
  the walk element with a layer per layer and its instrument, exit, read of
  of and walked yes, no or timeout; the possibility element in two classes,
  gap and idea; the generator with its paging counts; the study of four
  documents; the release element carrying taken fixed at no; and LAW.AMP.1
  to LAW.AMP.10.
- /amplify-codebase-dtd, /enhance-codebase-dtd and /overhaul-codebase-dtd,
  forged from one anatomy in dtd/new-commands-v52.spec.mjs and differing in
  four places: the band, the sigil, the root element and the sentence that
  says what kind of change they are for. Each raises the intake to five
  rounds of four questions the only legal way, by declaring ask.rounds,
  ask.of, ASK.rounds_per_prompt and ASK.max_total above its cc-ask include
  (LAW.ASK.11), and each hands a possibility above its band to the command
  that owns it rather than keeping it.
- lib/amplify.mjs: the contract read from the DTD and nothing repeated in
  code, the layer detector, the walk (instruments before reading, each in
  the foreground under AMP.ceiling.family with its exit read directly, a
  ceiling rendered timeout and never as an empty layer), the stable id (a
  hash of layer, files and law, invariant under file order), the ranking
  (gaps before ideas, then risk, then breadth), the pager, the state record
  that round-trips, and the release recognizer whose arithmetic carries and
  resets (5.1.2 plus a mid is 5.2.0, plus a major is 6.0.0). Seventeen
  controls, among them a ceiling tripped on purpose with an instrument that
  cannot finish in time, and the generated reference held against the DTD.
- The skills/amplify-codebase-dtd skill with references/ladder.md generated
  by node lib/amplify.mjs table, so the fifteen verbs, the bands, the
  layers, the bounds, the six release classes and the ten laws are one
  table nobody types twice.
- Counts: 123 commands, 23 skills, 5 agents; checked 151; contract-audit
  1321 declarations, 0 unused; the README index gains the Codebase growth
  family; the gate chain and the workflow gain the amplify controls.

## 5.1.0 (2026-09-03)

The gate on every spot, and the scratch: an armed Adiutor now judges every
answer, file, commit message and request body by the AI_SLOP contract
before it lands, and a new command researches a change, builds it in a git
worktree, reviews the diff, amplifies the research and asks, with the pros
and cons per file, what may land in the repository.

- The AI_SLOP gate as a hook (LAW.SLOP.7, LAW.SLOP.8, LAW.ADIUTOR.12). A
  user who never loads the skill had no gate; now an armed Adiutor judges
  four spots without any command being run: the answer to any turn at Stop
  when no -dtd run is open, the text of a Write, an Edit or a NotebookEdit,
  the message of a git commit (inline, by -F, by a heredoc), and the body
  of a gh pr, gh issue or gh release call or of a curl payload to a pulls,
  issues or releases path. A prose file is judged whole, a code file by its
  lifted comments alone (the extension tables are entities of ai-slop.dtd:
  SLOP.prose.ext, SLOP.comment.slash, hash, dash and angle), a small body
  on the ban list alone. Strict whatever the policy: a failed answer blocks
  the Stop once and the re-fired Stop passes (stop_hook_active); a failed
  Write, Edit, commit or body is denied with the measures and the failing
  phrases quoted inside a quoted element, never a CDATA section; every
  refusal is one ledger line with command slop:stop, slop:write,
  slop:commit or slop:pr; the escape is a fence or a quoted element
  (LAW.SLOP.1). Nothing new is armed: the PreToolUse entry already fires on
  every tool. The doctor gained a slop gate row. Measured before it was
  built: the full profile over 1590 words of the tree's own code comments
  and over the last ten commit messages refused nothing. Controls C21 to
  C26 trip every spot; the slop controls trip the lifter, the parser and
  the refusal; the law count moved from six to eight.
- /ai-slop-dtd, the hand-run form of the hook gate: a file, a commit message
  file or the last answer, judged by the same instrument, the report
  rendered from its output, the escape named; the argument walked by
  cc-args (LAW.ASC.1 to LAW.ASC.3).
- /deep-scratch-dtd (LAW.DS.1 to LAW.DS.7): the intake of cc-ask, the
  research of a deep dive saved as the first report, a scratch that is a git
  worktree under .claude/worktrees on a branch off HEAD (lib/scratch.mjs
  open), the build and every run inside it under a ceiling with exit codes
  read directly, every hunk of the diff a finding with a verdict, a
  severity and a confidence, the research amplified with the build as
  evidence and saved as the second report, then the merge gate: one mark
  question over every changed file with its pro and its con, four choices
  (merge every file, merge the marked files, keep, discard), the command
  applying the merge and running the project gate on the merged tree, a
  red gate reverted and reported. lib/scratch.mjs carries open, diff,
  merge-all, merge, discard and seven controls in a temporary repository.
- The Remaining Unknowns of both 5.1.0 deep dives, closed before the tag
  rather than after it. The NotebookEdit text field was a guess: every field
  name a text-writing tool may use is accepted now and the first string wins,
  with control C28 denying the same sloppy text under five field names and
  staying silent when none carries text. The SubagentStop payload was unknown:
  it is declared as SLOP.spot.5 and judged only when the payload carries an
  answer, blocking that SubagentStop once, with control C29. The mark question
  holds at most four options, which no law said: LAW.DS.4 now marks four files
  per round, twelve across the three rounds, and groups by top directory beyond
  that. The red-gate revert was reasoned, not run: lib/scratch.mjs gained
  revert(), which restores a path the base had and removes one it did not, with
  two controls, and the whole path (open, build, run, diff, marked merge,
  revert, discard) was exercised live in this repository, every exit code read
  directly. The static-share question answered itself against a real file:
  accesskit-0.24.1/src/geometry.rs fails lexical_mattr at 0.5233 on its
  hand-written doc comments, so SLOP.comment.measures declares that a lifted
  comment block answers to the phrase and verb measures only; the two
  prose-shape numbers are still reported, marked as not applying. Twelve
  languages measured through the lifter, six real files judged, one refusal
  found and fixed. The repository ignores its own .claude/worktrees/. The live
  exercise also found a defect nothing had tripped: a marked merge is a checkout
  over the working tree, so a path the repository changed after the scratch was
  opened, or one carrying uncommitted work, was overwritten in silence. Only a
  deliberate choice not to mark lib/scratch.mjs kept this session's own work.
  mergeMarked refuses such a path by name now, force is the override, LAW.DS.5
  says it, and a control edits a file in the main tree and watches the merge
  refuse it and then take it under force.
- Companion run 10 (okto, v5.1.0, opus, 34 turns, 329 s): fail, eight
  findings, three high, all eight sound and closed. Three published counts
  were stale against instruments the release names (package.json still said
  118 commands, the Contract badge and plugin.json said 1253 declarations
  for 1265, the Controls badge 20 guards) and a fourth the pass did not
  list (the Checker badge, 145 for 147): `checker/counts-sweep.mjs` now
  measures commands, skills, agents, their sum, the Adiutor guards, the
  checker controls and the declarations from the tree and holds fourteen
  places to them, numbers in words included, with three planted controls,
  in the gate chain and the workflow. The print loop of the Adiutor
  controls sat above the six new controls, so C21 to C26 never rendered a
  PASS or FAIL line while the count and the exit code moved: the block
  moved above the loop. The PreToolUse deny fell through to the open run's
  tool tally: it returns now, and C27 opens a run, denies a Write and
  asserts the tally did not move. The watch caption said seventeen guards
  and the verify line twenty-six; both say twenty-seven. lib/scratch.mjs
  ran its git calls under a ceiling of sixty seconds while the command
  declared SCRATCH.ceiling 300: the library runs under 300 and an eighth
  control reads the built command and holds the two together.
- Counts: 120 commands, 22 skills, 5 agents; checked 147; 29 Adiutor guards;
  the README index places the two in the research and the audits families;
  PRIVACY.md version 2 (the gate's row), SECURITY.md and NOTICE §D each gain
  a row or a bullet; the manifests say 5.1.0.

## 5.0.1 (2026-09-03)

The privacy policy and the command index: what the software does with your
data, measured line by line, and a README that names every one of the
hundred and eighteen commands, twenty-two skills and five agents from the
tree, with a gate sweep that refuses a README which disagrees with the files.

- The release job refused the first v5.0.1 tag: package.json still said
  5.0.0, and the job's first step is built to refuse exactly that.
  `checker/release-notes.mjs --versions` now holds package.json,
  plugin.json, both marketplace.json fields, the top CHANGELOG section and a
  RELEASE.md heading to one version, refuses a tag that differs, and runs in
  the gate and as the release job's first check (three controls: agreeing
  versions report nothing, a stray manifest and a missing heading are both
  named, a wrong tag is refused). RELEASE.md gained its 5.0.0 and 5.0.1
  entries, and the manifests' descriptions carry no version number.
- The README index. The README named 89 of the 118 commands by token and 15
  of the 22 skills by name, counting the rest by family (the three sets of
  eight schematic creators, the four coin flips, setup-ralph). Now
  `checker/readme-index.mjs` generates the index between two markers from
  commands/, skills/, agents/ and dtd/sigils.json: a mermaid map of the
  twelve families with their counts, one badge per family that jumps to its
  section, one collapsible table per family (the command, its sigil, the
  first sentence of its own description), then the skills and the agents.
  Every command is claimed by exactly one family rule, and an unclaimed
  name fails the run, so a new command is placed before it ships.
  `--check` in the gate regenerates and compares (a removed row is
  reported, control), `--controls` trips both. The skills paragraph
  counted eleven converted skills and three of 5.0.0 where ten and four
  stand (create-prompt-dtd was rewritten as the schematic router), and the
  workflow paragraph named wrappers 5.0.0 had rewritten as creators; both
  corrected.
- PRIVACY.md: the privacy policy, every line of it measured. What the
  software reads, writes and sends on your machine, component by component
  (a grep over bin, lib and monitors finds no network module; the hooks
  keep a run record and a ledger line and never an answer; uninstall keeps
  the ledger and the run records, measured in a scratch target); what
  leaves the machine and to whom (npm and Claude Code fetching the
  repository, your own Claude Code account carrying every prompt to
  Anthropic, the companion under the maintainer's account, the release
  job's one API call); the hosted surfaces (GitHub, the release page and
  the Actions artifacts, the badges through GitHub's proxy, Ko-fi, the
  ClaudePluginHub listing); what the organisation holds and for how long
  (public GitHub posts, commit metadata that a .mailmap corrects, the
  trailers that name the organisation's own account, a donation record, a
  security report); the GDPR rights and the two structural limits (git
  history, GitHub's own controls); children; the licences and the policy
  as two documents that do not change each other, AGPL section 13 not
  triggered; changes dated and announced. README, SECURITY.md and
  SUPPORT.md link it, and the prose sweep in the gate now covers NOTICE,
  SECURITY and PRIVACY beside README and CHANGELOG. An organisation-wide
  draft for Nova-Violet-Role/.github was written beside the research
  record, to be placed by hand.

## 5.0.0 (2026-09-03)

The creator kit: prompt creators for eight schematics, creators for skills,
hooks, commands, subagents, plans, MCP servers and workflow files, a tasks
family, filetype and dork creators, nineteen book-derived commands with their
voice profiles, records that nest, an Adiutor that runs only by hand, and
every count re-measured, one hundred and eighteen commands, twenty-two skills
and five agents. Nine companion runs audited the work; the last three found
only instrument and record faults, all closed before this line was dated.

- The Adiutor and its monitor run only by hand (LAW.ADIUTOR.10). The plugin
  ships no `hooks/hooks.json`; `rdc install` arms nothing unless `--arm` is
  given; the monitor is declared in `monitors/manual.json`, a file the loader
  never reads, and starts only through `rdc watch`; every run of either ends
  at a 300 second ceiling (Stop hook timeout 300, `rdc doctor` and
  `rdc controls` under a 300 s delegate timeout, `rdc watch --secs 300`).
  Measured cause: two sessions lost to the hooks and the monitor talking over
  the work.
- `dtd/cc-ask.dtd`: the rounds are an enumeration (`ask.rounds`, `ask.of`) a
  command raises before the include (LAW.ASK.11); `ASK.max_total`; the back
  token `ASK.back` (LAW.ASK.12).
- `dtd/cc-args.dtd`: the launch-time argument walk (`args`, `word`, ARG.*,
  LAW.ARGS.1 to 4).
- `lib/dtd.mjs`: the first declaration of an entity binds, as XML 1.0
  section 4.2 has it, in the resolver and the parser; `forgeNew` takes
  `predeclare` for driver-file overrides. Conditional sections
  (`<![ INCLUDE [ ]]>`, `<![ IGNORE [ ]]>`, keyed by a parameter entity)
  are flattened innermost first by the resolver and the parser, and the
  DOCTYPE close skips a section close; mutations M7 and M8 in
  `checker/checker-controls.sh` trip it.
- `create-plugin-dtd`: the plugin creator in the DITA shell anatomy, one
  conditional section per creation, a curated SPDX list (`PLUGIN.licenses`),
  rendered manifests, one instruction per creation naming its creator.
- The other four creators, each twelve questions in three rounds with a
  tripped control: `create-moe-dtd` (the roster, the voice contract and the
  two-direction checker in the rot-voice.dtd shape), `create-router-dtd`
  (a classification scheme, a route tree, accelerator shortcuts, a declared
  state machine, a measured method, armed only by hand),
  `create-db-dtd` (numbered append-only fields twinned with a sequence
  model, one store kind from TSV to a vector store, a torn row refused),
  `create-ot-variants-dtd` (eight X-of-Thought kinds as productionsets and
  procedures with step alternatives). Sigils 🎛️ 🚦 🗄️ 🧠.
- `dtd/cc-form.dtd`: the forms a text may take, each a NOTATION with its
  variants as FORM.* entities (five heredoc, six YAML block scalars,
  NestedText, JuliaMD, XML, the five GitHub callouts, six polyglots), the
  `forms`, `form` and `guard` elements, the caps and the default, ASK.FORM.1
  to 4, LAW.FORM.1 to 8. `lib/form.mjs` reads the caps and the callout types
  from the file and trips seven guards on fixtures (`npm run controls:form`,
  in the gate). Skill `dtd-forms-dtd` (🪢) carries the catalogue and examples.
- `dtd/cc-args.dtd`: the embedding classes ARG.embed.* (pcdata, cdata, ndata,
  section, and pentity as the one never granted), the `arg_guard` element,
  LAW.ARGS.5 and 6. `lib/args.mjs` walks an argument string the way the laws
  say (quotes kept, flags removed, the end token) and applies four guards read
  from the DTD: evaluation, traversal, system, pentity; controls in the gate.
- `dtd/cc-lexicon.dtd`: the verb list lifted out of `lib/ai-slop.mjs` as
  LEX.verb.* (272), 35 paraphrases printed beside a hit, a glossary of
  24 terms with a locator each, the library of 16 Phantom-book files, the
  `text_desc` profile; LAW.LEX.1 to 5. The slop controls hold the classifier's
  verb set equal to the declared one, in both directions.
- `dtd/cc-schematic.dtd`: the schematics a prompt may be written in and the
  table that maps every DTD concept onto each (the equivalence table of the
  argument-variant references, cut into SCHEMA.<schematic>.<concept>
  entities), the six prompt sections and the six meta-prompt sections,
  LAW.SCHEMA.1 to 5. Twelve creators generated from one function,
  `create-prompt-<schematic>-dtd` and `create-meta-prompt-<schematic>-dtd`
  for callout, heredoc, yaml, nt, xml and polyglot, each pinning its
  schematic as a fixed attribute of its root, embedding the argument words
  in a declared class, guarding the file with cc-form, and proving itself
  by a planted out-of-table syntax.
- `dtd/cc-schematic.dtd` gains the semantic layer: seven schemas (refentry,
  qandaset, procedure, glossary, textdesc, msgset, productionset) with their
  parts in order as SEMANTIC.*.parts, and per form one rule each for a part,
  a repeated part and a label (SEMANTIC.<form>.part, many, label), so schema
  and form are chosen independently; ASK.SCHEMA.1 and 2 multi-select;
  LAW.SCHEMA.6 to 8. The twelve prompt creators ask the schema in place of
  the sections and examples questions and render a `schemas` child.
- The semantic matrix: one `SEMANTIC.<schema>.<form>` cell per schema per
  form of `SEMANTIC.forms` (the six schematics and the cc-form kinds jmd,
  json and toml, md being callout), sixty-three in all, each naming every
  part in the form's spelling; LAW.SCHEMA.9. The twelve creators ask
  ASK.FORM.1 and 2 in the same round as ASK.SCHEMA.1 and 2, schema and
  form apart, and render a `forms` child (the length and checks questions
  became laws so the count stays twelve). `lib/schematic.mjs` renders a cell as a skeleton, runs the
  cc-form guards on it, reads the parts back in order, trips on a dropped
  part, a dropped rendering, a sixth callout type and a planted CDATA close,
  and pins `references/semantic-schemas.md` (every cell rendered) to a fresh
  render; `controls:schematic` in the gate; the creators print a schema's
  skeleton with `node lib/schematic.mjs render` and fill it in place.
- brainstorm-meta-clear-section as the schematic launcher: ASK.SCHEMATIC.1 and 2,
  SCHEMA.creator.prompt and SCHEMA.creator.meta, LAW.SCHEMA.10 in cc-schematic;
  the command asks the schematic, the schemas, the kind and the forms before
  the clear (eleven questions in three rounds), renders a `launch` element
  naming the matching creator, carries every choice in the handoff as a known
  slot, and its launch line hands the handoff to that creator; LAW.CLEAR.6.
- Fourteen more semantic schemas from the examples folder: DITA concept,
  task, topic and glossentry; DocBook biblioentry, example, table (CALS),
  cmdsynopsis, variablelist and revhistory; TEI certainty and interp; RSS
  item; GSettings key, each with its parts in order and its source named in
  the DTD. Four families (SEMANTIC.family.docbook, dita, tei, data) behind
  ASK.SCHEMA.1 and 2, so the question count stays; the matrix regenerated at
  21 schemas by 9 forms, 189 cells, the families held to the enumeration by
  a control.
- The generic creators become routers: `create-prompt-dtd` (the skill) and
  `create-meta-prompt-dtd` (the command) ask the schematic, the families and
  the forms, render a `launch` element, and hand the purpose plus
  `schematic=`, `schemas=` and `forms=` after the end token to the matching
  per-schematic creator through one Skill call; LAW.ROUTE.1 to 4 and
  LAW.MROUTE.1 to 4. The creators read those known slots after their walk
  and ask none of them again.
- `node lib/schematic.mjs check <file> <form> <schema,schema>`: one line per
  schema, its parts read back by form in order, missing and absent parts
  named, exit 1 on a FAIL; the creators' proof runs it on the file they
  wrote, so the schema proof is a measurement. Four controls: among other
  keys passes, a dropped required part fails, a swapped order fails, an
  absent optional part passes.
- Block 5, the creators amplified: `dtd/creators-v5.spec.mjs` generates
  create-agent-skill, create-hook, create-slash-command, create-subagent,
  create-plan (dispatch wrappers before) and create-mcp (new, 🔌) from one
  anatomy: twelve questions in three rounds never skipped, ASK.LICENSE.1 from
  the new `dtd/cc-license.dtd` (the curated SPDX list, 50 identifiers, single,
  double or triple), an emoji registered in sigils.json and refused on a
  collision, ASK.FORM.1, the expert skill invoked once with the answers as
  known slots after the end token, every file read back and guarded, the
  audit run by the creator itself in the foreground under a ceiling with one
  rule per code (C1 to C14 and the auditor style areas, or H1 to H4, P1 to
  P4, M1 to M4), and a planted fault the audit refuses; LAW.<PREFIX>.1 to 6.
- create-workflowjson (🧰), the seventh creator, with its own runtime:
  `dtd/cc-workflow.dtd` declares a workflow file as JSON steps that run in
  the foreground with stdin closed under a ceiling each (300 s default, 3600
  max, twelve steps at most), an expected exit compared to the exit read
  directly, on_fail stop or continue, and a record line per step;
  LAW.WF.1 to 6. `lib/workflow.mjs validate | run [--dry] | controls`
  refuses a step that backgrounds a process or nests a session, a ceiling
  above the cap, an unknown key or a missing run, and its controls trip a
  hanging step at its ceiling (exit 124), a failing step under stop, and
  every refusal by name; `controls:workflow` in the gate; W1 to W4 as the
  creator's audit.
- Foreground-only plans: run-plan-dtd loses its three routing strategies and
  the Task calls; every segment runs in the operator's context, each
  checkpoint blocks, a fresh context comes from a clear with a handoff written
  by brainstorm-meta-clear-section, never from a subagent; LAW.RUN.3. The
  create-plans-dtd skill (SKILL.md, workflows/execute-phase.md,
  workflows/plan-phase.md, references/scope-estimation.md) says the same.
- The audits absorbed: audit-skill, audit-slash-command and audit-subagent no
  longer dispatch to a subagent; each runs the checker here under a 60 s
  ceiling with stdin closed (one rule per code C1 to C14), reads the auditor
  agent file as data for its style areas and checks them itself, renders
  findings with file, line, severity and confidence, and one verdict;
  LAW.AUD.1 to 5. The auditor agents stay for a hand summons.
- The nineteen Phantom-book commands amplified: each walks its argument
  (cc-args), runs one intake round of ASK.LEX.1 to 4 that is never skipped
  (LAW.ASK.10 extended to book-derived commands, LAW.LEX.6), and fixes its
  voice profile as text_desc attribute defaults before the lexicon include
  (the first declaration binds), naming its book as VOICE.source with a
  LEX.bibl id. The slop sweep reads the profile of every command the shelf
  names and refuses a missing profile, a paraphrase without a source or a
  source outside the library; its controls fire LAW.LEX.5 on purpose.
- The voice pass: forty-one rewrites in fifteen files of the slop baseline,
  one banned word each (the four tells, the hedge and the two fillers that
  `lib/ai-slop.mjs` names), so the sweep baseline falls from 18 to 3 and the
  gate holds it there. Then the three rhythm files got one longer opening sentence each,
  and the baseline is 0: every file under src passes the gate.
- create-plugin includes cc-license and drops its private list; LAW.PLUGIN.4
  cites LICENSE.list and LICENSE.join, and LAW.PLUGIN.6 hands name=, emoji=
  and license= to each creator as known slots after the end token.
- The four answer variants of every question (cc-ask): `variant` on a question,
  select `[...]`, check `[X]`, elaborate `[ ]` (one `elaboration` per option,
  cut into the widget and expanded above the call) and mark (the elaborated
  options listed as markable lines, asked with multiSelect, each answer
  `marked` yes or no); ASK.variant.* and ASK.token.*; the preview elaborated
  to ASK.preview.expanded_lines with the predicted answer and its
  consequence; LAW.ASK.13 and 14. Every generated round names the variant
  beside each question (forty commands re-forged); ask-me-questions,
  ask-me-many-questions and ask-me-preview carry the rule.
- The alarm schematic and its polyglot: cc-form kinds `alarm` and `polyalarm`
  with the house callout vocabulary FORM.alarm.types (ALARM, ANSWER,
  QUESTION, LAW, FRAMEWORK, OUTPUT, PROMPT, CHECKS and the five GitHub
  types), guard `alarm`, LAW.FORM.7 amended; two schematic rows in the
  equivalence table, SEMANTIC.alarm.types, two more form columns in the
  matrix (231 cells), rendered, guarded and read back; four more prompt
  creators (create-prompt-alarm 🚨, create-prompt-polyalarm 🎪,
  create-meta-prompt-alarm 📯, create-meta-prompt-polyalarm 🪅); the
  routers and the launcher offer the alarm shape.
- The tasks family: `dtd/cc-task.dtd` declares a project's tasks folder and
  its registry Task.json (a task with its status, length, schematic, schema,
  file, dollar variables and steps; the audit of folder against registry
  both ways), the variables a step may expand (TASK.vars) and may not
  (TASK.never), the step caps per length, the ledger, LAW.TASK.1 to 6.
  `lib/task.mjs validate | audit | run | close | controls` (twenty controls,
  every refusal tripped, a task run through the workflow runner). Five
  commands from `dtd/tasks-v5.spec.mjs`: create-task 📌 (twelve questions,
  the file in a chosen schematic with the chosen schemas' parts, registered
  through the runtime, a todo line imported), audit-tasks 📋 (the audit,
  the ledger tail, every open task elaborated and marked), create-workflow-
  tasks 🏗️ (chosen tasks into a workflow file, validated and dry-run),
  task-run 🏃 (one task in the foreground under ceilings, the expansion
  shown first), task-handoff 🤝 (evidence, status through the runtime, the
  record with the command-generated filename, the next session's line).
- Free file types: create-filetype-<schematic>-dtd, eight creators from one
  function (📍 🛎️ 🪪 🧲 🧿 🎲 🪁 🧊), each pinned to its schematic: name,
  extension, NOTATION and cc-form kind, the semantic schemas and forms, the
  dollar-token variants marked after elaboration and embedded the way the
  schematic embeds a reference, a license; the exemplar and the NOTATION
  declaration written under filetypes/, guarded, a planted expanding token
  refused. create-filetype-dtd 🪃 routes to them.
- Dorks: create-dork-search-dtd 🕸️ (a query of declared operators for a web
  engine or GitHub code search in narrow, wide and negated phrasings, nothing
  fetched unless asked, an unknown operator refused) and create-dork-local-dtd
  🔦 (a ripgrep and fd hunt by type and content in the foreground under a
  ceiling, fixed-string matching for backslashes, a planted file it must find
  and an empty directory it must report as zero).
- Records and nesting (block 6): cc-record declares the nesting override in
  the DITA idiom (`command-info-types`, record or no-record-nesting, before
  the include; `produces`), the body of a record as a `revhistory` of
  revisions with evidence lines, RECORD.dir, RECORD.filename,
  RECORD.revision.heading, RECORD.evidence.line, LAW.REC.5 and 6.
  `lib/record.mjs` reads the declaration from a command, finds the run's
  record (the command's own name or a spelled ordinal, never di), checks the
  fields and the revisions, and returns findings of kind record; the Adiutor
  reads the nesting when it arms and asks at Stop (LAW.ADIUTOR.11, control
  C20), the monitor prints MONITOR.record; task-handoff declares that it
  produces a record (RECORD.handoff) and task-run that it produces none.
  controls:record in the gate.
- The counts re-measured with `rdc list`: 118 commands, 22 skills, 5
  agents, in README.md, plugin.json, marketplace.json and package.json; a
  paragraph on the 5.0.0 families under Usage.
- The SPDX definitions: `dtd/licenses.json` carries one entry per identifier
  of LICENSE.list (name, family, a one-sentence definition), `lib/license.mjs
  show | check | controls` holds the list and the definitions to each other
  in both directions and accepts a single, a double or a triple joined by OR
  or AND; LICENSE.definitions and LAW.LICENSE.3; controls:license in the gate.
- Companion run 5 (v5-blocks-4-6, opus, 37 turns, 379 s): fail with eight
  findings, two high, four medium and two low, all closed: control C12 now trips the
  MONITOR.record line (three templates held); the README claims table
  re-measured (check 145, build 282, contract-audit 1253, Adiutor controls
  20) and the shelf at nineteen, the skills at twenty-two; LAW.ADIUTOR.9 and
  LAW.LICENSE.2 back in reading order; the contract audit checks the order
  laws are read in, not only their density, with a planted control; the slop
  sweep refuses a sweep of no file, with a control; the monitor's header
  names all three templates.
- Companion run 6 (v5-closing, opus, 26 turns, 254 s): fail with eight
  findings, one high and the rest medium or low, all closed: LAW.ADIUTOR.7
  carves out the record fault it contradicted, and the contract's header
  names three lines; the contract audit names a source file in its order
  message (it read undefined) and plants the disorder in a source too;
  the sweep floor cites no law that does not govern it; the changelog and
  the run 5 record say eight and 379 s; the README skills sentence closes
  its arithmetic (eleven converted, eight of 4.0.0, three of 5.0.0). The
  companion wrote its findings as bold lines instead of finding elements,
  so the script counted no high finding; the substance stood. The records
  of the runs live in the workspace beside this repository, under
  `../artifacts/companion-audit/` as `companion-audit.<ordinal>.md`, which
  this repository does not track. The ordinal numbers the files of this
  command, not the runs (LAW.IUPAC.7): heis is foundations-1 run 2, duo is
  top-1 run 4 (run 3 is closed inside it), treis, tessares and pente are
  runs 5, 6 and 7 of this session, hex is run 8, hepta is run 9; run 1
  captured a hook stanza and left no file.
- Companion run 7 (v5-closing-2, opus, 38 turns, 355 s): fail with two
  high, three medium and two low as its finding elements count (the scorer
  printed three high because it read a sentence of the prose, the fault run
  8 named), all closed at that commit: the prompt commanded the finding
  element spelling and the scorer of that day counted it and the bold
  spelling (an arm run 8 removed), exposed as `companion-audit.sh --score`
  and tripped by the five controls of that day, M9 to M13
  (a high in each spelling, a fail with none, a pass, a scope line of another
  range refused by a whole-line fixed-string match); the record paths and the
  durations above corrected from the runs' own JSON; the subsets index names
  MONITOR.record and eleven laws; the contract audit plants its source
  disorder in a temporary tree, never in src/, and drops a dead alternative.
- Companion run 8 (v5-closing-3, opus, 30 turns, 355 s): fail with three
  high, five medium and two low, all closed: the scorer counts a high
  finding only on a line that opens a finding element (a sentence in the
  prose and a bold line count for nothing; M10 and M14 prove it), the bold
  arm is gone so the prompt's "no other spelling" is true, M13 carries the
  landed proof that the replaced expression accepted the wrong range, the
  synopsis names --score and exit 2, the comments say M9 to M14, the run 7
  counts above are the finding elements' own, the run 5 sentence agrees
  with itself, and the record key above says which file is which run.
- CI for 5.0.0: the gate workflow runs the ten library controls, the slop
  sweep at zero and the release-notes controls it lacked, its step names
  carry the measured counts (twenty guards, M0 to M17), and its first step
  is `checker/gate-sync.mjs`, which proves every command of the gate
  script is a run line of the workflow or a shell segment of one (a line
  removed or a step commented out is reported, a file of comments reports
  all twenty-four; the workflow may run more, and that direction is not
  claimed; the gate script runs it too). A `release` job runs on a tag `v*` after the gate
  and the install round trip and ships the GitHub release through the REST
  API with the CHANGELOG section of that version as its notes
  (`checker/release-notes.mjs`, four controls); a tag that is not
  package.json's version or a section still marked in progress ships
  nothing, and a release already on the tag is left alone. The two shell
  scripts added in 5.0.0 are executable in the index, which the workflow
  checks. The gate job pins Node 20 (`node-version: 20`), so every green
  run of the workflow is the chain measured under that runtime; the README
  badges carry the 5.0.0 counts.
- Companion run 9 (v5-closing-4, opus, 35 turns, 396 s): fail with one
  high, seven medium and three low as its finding elements count (the
  scorer printed two high because a medium finding quoted the attribute in
  its body), all closed, and the count with them: gate-sync reads the
  workflow's run lines and their shell segments, a comment counts for
  nothing (three controls: a run line removed, a step commented out, a file
  of comments) and it claims one direction only; the checker-controls step
  name and the README say seven mutations refused and one passing; both
  new scripts run their check only as the entry point, so their exports
  are reachable; the verdict attribute nothing read is gone and the
  contract says which instrument holds which law; the scorer reads severity
  in the opening tag only (M15), refuses a finding element missing one of
  its four attributes under LAW.COMPANION.3 (M16), and the runner's
  allow-list is proven free of writing and spawning tools with every Bash
  form under its ceiling, a copy granting Write refused (M17; `cat` left
  the list, Read covers it); the release POST carries its content type;
  README and CHANGELOG pass the slop measures and the gate runs them (the
  release ships a changelog section); the run 7 bullet reads as history
  and the Node 20 claim names the workflow run as its artifact.
- The first CI run of 5.0.0 drifted on one target: `agents/dtd-command-inventory.md`
  is built from `src/` but fell under the `agents/*` ignore rule (its name
  does not end in -dtd.md), so it was present on the machine that built it
  and absent from the committed tree; the drift check passed here and
  failed on the fresh checkout. The rule now names it, the file is tracked,
  and `checker/tracked-sweep.sh` in the gate refuses any ignored build
  target under commands, skills or agents, with a planted ignored file as
  its control. The tag v5.0.0 moved to the commit that carries this, before
  any release existed.
- The second CI run of 5.0.0 (a8773ad) failed the SPDX sweep on `check.log`,
  the file the checker step tees into the tree: since 5.0.0 the sweep
  enumerates untracked files too (its control plants one), and the local
  chain never writes that log. The workflow tees outside the tree
  (`$RUNNER_TEMP`) and both sweeps skip `*.log`. With it, the documents
  caught up with the release: the README About carries the creator kit and
  the hand-run Adiutor; NOTICE.md counts the declared portions as the
  portions line measures them (twenty-four commands and ten skills; nine
  creators and auditors and the create-prompt skill were rewritten in 5.0.0
  and carry it no more) and states the limits as they stand; SECURITY.md
  says a plain install arms nothing and names the one network call, the
  release job's; the plugin, marketplace and package manifests carry the
  5.0.0 counts and a fuller keyword set; the repository's About and topics
  were set to the same through the API.
- New commands: git-gh-amplification, repo-git-scalar,
  repo-creativity-askingstorm, brainstorm-meta-clear-section,
  ask-me-many-questions, ask-me-preview, coin-flip, coin-flip-best-of,
  coin-flip-weighted, coin-flip-reveal (with create-monitor from the
  foundation commit).

## 4.0.0 (2026-09-02)

The Commander-Adiutor: the Adiutor's monitor, a separate process beside the
hooks. Major because `rdc install` now writes a second plugin and `rdc doctor`
gained a row that goes red on an install made before this release.

- Reported: on claudepluginhub.com the Adiutor showed only as ten hook
  entries of `type: command`, and the plugin's monitor count was zero.
  Measured in the Claude Code 2.1.235 binary: monitors are their own plugin
  component, loaded from `experimental.monitors ?? monitors` in
  `plugin.json` or, when neither is set, from `monitors/monitors.json` at
  the plugin root. A hook cannot be labelled a monitor, and a bare
  `~/.claude/monitors/` is not scanned; a `.claude-plugin/plugin.json` under
  `~/.claude/skills/<name>/` is, as `<name>@skills-dir`, personal scope.
- Added `monitors/commander-adiutor.mjs`: a persistent process that tails
  `ledger.tsv` from its current end and prints one line per run closed as
  `fail` (`MONITOR.fail`) and one per ledger line the reader refuses
  (`MONITOR.malformed`); nothing for a pass, nothing for history. It reads
  the ledger only, never a transcript, and never writes. Declared for the
  plugin path in `monitors/monitors.json` (`commander-adiutor`, `when:
  always`). `bin/adiutor.mjs` stays the hook engine and imports nothing
  from it.
- Added `lib/ledger.mjs`: the one resolver of the state directory
  (`CLAUDE_CONFIG_DIR`, `ROT_DTD_STATE`) and the one ledger reader, shared
  by the hooks and the monitor so both open the same file. `bin/adiutor.mjs`
  now imports it; its hooks are otherwise untouched.
- `dtd/adiutor.dtd`: `monitor` and `emit` elements, `MONITOR.name`,
  `MONITOR.fail`, `MONITOR.malformed`, and `LAW.ADIUTOR.7`.
- Control C12 starts the monitor on a scratch ledger that already holds one
  failed run, waits for its `watching` line on stderr, appends a pass, a
  fail with two findings and a nine-column line (landed-proof: four lines on
  disk), and requires exactly two printed lines, each matching its DTD
  template with the right command, finding, line number and column count,
  and the history line absent. `node bin/adiutor.mjs controls`:
  `12 run, 0 failing`.
- `rdc install` writes `<target>/skills/rot-dtd-commander-adiutor/` with a
  `.claude-plugin/plugin.json` and a `monitors/monitors.json` whose command
  runs the copied script by absolute path, forward slashes, quoted. Claude
  Code loads it as `rot-dtd-commander-adiutor@skills-dir` on the next
  session. Both files are in the manifest; `rdc uninstall` removes them.
  Measured on a scratch target with `--only pareto-dtd`: `written 17`, the
  doctor's `monitor` row `OK`, then `removed 17  kept 0` and `skills/`
  empty. The capability statement printed before arming names the monitor.
- `rdc watch [--once] [--poll <ms>]` runs the monitor by hand. `rdc doctor`
  gained a `monitor` row: red only when the npx set is installed without
  its monitor plugin; a plugin install starts the monitor from its own
  `monitors/monitors.json` and the row stays green.
- `claude plugin validate .`: `Validation passed`.
- README: the tagline, the Adiutor paragraph, install, the decoded section,
  step 6, the claims table and the verify section name the monitor. The
  skills paragraph said eighteen and named seven new skills while nineteen
  are installed (`rot-lenses-dtd` was missing from it): fixed. Guard counts
  that still said eight or eleven now say twelve.
- The GitHub About was still the 1.0.0 text (58 commands, 18 skills); set
  to the package.json description. claudepluginhub.com holds a scan of
  1.0.0 (58 commands, 18 skills, no `rot-*` file, last commit 01:13 UTC);
  nothing in this repository can refresh it, the listing does.
- Counts at this release: 68 commands, 19 skills, 4 agents, 1 monitor.
- The Adiutor contract is quoted verbatim in the `dtd-core-dtd` skill
  (`references/subsets.md`); the contract audit counts that quotation as
  the use of every `adiutor.dtd` declaration, so it went `5 unused` until
  the quotation was refreshed from the live file, then `0`.
- Numbers on the day: `rdc check`: `checked 91  failed 0`; `rdc build
  --check`: `223 targets, 0 drifted, 0 failing`; `node bin/adiutor.mjs
  controls`: `12 run, 0 failing`; `node checker/contract-audit.mjs`:
  `161 declarations, 0 unused, 0 law gaps`; `bash checker/spdx-sweep.sh`:
  `491 files checked, 0 missing`; `bash checker/crlf-sweep.sh`:
  `508 files checked, 0 bad`; `npm run gate`: exit 0.

## 3.2.0 (2026-09-02)

The lens commands render clean on GitHub again.

- Reported: the SPDX header was visible on github.com in the ten
  `rot-*-dtd.md` files and hidden in every other command. Measured with
  GitHub's own rendering (`gh api .../contents/<file>` with the HTML media
  type): one visible `SPDX-License-Identifier` in the resolved
  `commands/rot-nova-dtd.md`, none in `commands/tetralemma-dtd.md`, none in
  either source file.
- Cause: line 1 of `dtd/cc-rot.dtd` had become
  `🧭|🜏|⬜|🔮|🩸|🕷️|⚪|🎷|⚜️|<!--`. The first, inline version of the
  3.0.0 lens-row patch matched an empty string at the start of the file and
  prepended each sigil there, in reverse order, before the second script
  patched the real rows. With `<!--` no longer at the start of its line,
  CommonMark does not open an HTML comment block, so when the build inlined
  the subset into the ten lens commands GitHub printed the whole header as
  text. Every other subset opens its comment at column 0 and stays hidden.
  The checker did not notice: no rule refuses stray text inside a DOCTYPE,
  and the DTD parser reads declarations by pattern and skips the rest.
- Fix: the line restored to `<!--`; the ten lens files rebuilt. Verified
  after the push with the same rendering call on all ten resolved lens
  files: 0 visible SPDX occurrences. No new checker rule, by choice; the
  gap is known and named here.
- Numbers on the day: `rdc check`: `checked 91  failed 0`; `rdc build
  --check`: `223 targets, 0 drifted, 0 failing`; `npm run gate`: exit 0.

## 3.1.0 (2026-09-02)

The front matter of every source parses as YAML.

- Reported on github.com viewing `pareto-dtd.md`: `Error in user YAML:
  (<unknown>): mapping values are not allowed in this context at line 1
  column 32`. Column 32 is the second colon of
  `description: Find the vital few: rank every factor ...`; a bare YAML
  scalar may not carry `: `, so the parser reads a nested mapping and stops.
  Claude Code's own loader is lenient and ran the command in the live test;
  GitHub's renderer and every strict parser are not.
- Measured with a parser this repository did not write (`js-yaml` 4.1.0,
  installed in a scratch directory, never in the repository): 32 of the 91
  sources failed the same way, pareto at exactly line 1 column 32; 51
  bracketed argument hints parse silently as lists and never error, and were
  left alone.
- `lib/dtd.mjs` gains `yamlScalar` (double quotes only where YAML needs
  them) and rule C14: a bare front-matter value carrying `: ` or ` #` fails
  the file. `checker/frontmatter-sweep.mjs` quoted the 32 values (`32
  changed, 59 already parse`, then `0 would change`), with its own planted
  control; `rdc forge` writes quoted values so a re-forge cannot bring the
  shape back; mutation M6 strips the quotes from pareto's description and
  the checker refuses it: `bash checker/checker-controls.sh` prints six
  passes and `all tripped as designed`.
- After the sweep the independent parser reads all 91 front matters with 0
  errors.
- Numbers on the day: `rdc check`: `checked 91  failed 0`; `rdc build
  --check`: `223 targets, 0 drifted, 0 failing`; `npm run gate`: exit 0.

## 3.0.0 (2026-09-02)

Every answer in one shape: a sigil on every heading, a blank line around it,
and the lens emoji back where the lenses speak.

- The full audit of the 68 commands found two defects in every rendered
  answer: 59 templates rendered their sections as inline bold labels, eight
  of them stacked with no blank line between (the "no space between the
  answers"), and no command carried an emoji. Both are fixed at the root:
  `lib/headings.mjs` declares the shape (`### <sigil> Heading`, blank line
  before and after) and `checker/heading-sweep.mjs` put every source into
  it (`68 changed` on the first run, `0 would change, 71 already in shape`
  on the second, with its own planted crammed template as control).
- `dtd/sigils.json`: one sigil per command, 75 entries (68 commands, three
  converted skills that carry a grammar map, four agents). The nine lens
  commands carry their lens emoji from RoT MoE; `/rot-elevate-dtd` carries
  the galaxy.
- `LAW.CORE.6` in `cc-core.dtd`: every heading is a markdown heading with
  the command's sigil and a blank line on each side; a crammed answer is a
  failed answer. Every grammar map invokes it.
- Checker rule C13: every grammar_map heading carries the file's one sigil,
  the map invokes LAW.CORE.6, every declared heading is rendered in the
  template as `### <sigil> Heading` (or bold with the sigil when nested),
  and every `###` line has a blank line before and after. Two new checker
  controls, M4 (a crammed heading) and M5 (a heading without its sigil),
  are refused: `bash checker/checker-controls.sh` prints five passes and
  `all tripped as designed`.
- The Adiutor's Stop check gains the `spacing` finding kind (declared in
  `dtd/adiutor.dtd`) and matches a heading with or without its sigil, as
  `### Heading` or `**Heading**`; control C9 feeds it a crammed answer:
  `node bin/adiutor.mjs controls`: `9 run, 0 failing`.
- `rdc forge` applies the shape to every forged file, so a re-forge from a
  spec lands in the same shape; the ten lens commands' `Stanza`, `Bound`
  and `Gauge` lines and the elevate roll-call carry the lens emoji, in the
  commands and in `dtd/rot-lenses.spec.mjs`.
- `cc-rot.dtd`: every `LENS.*` row carries its sigil as its second field;
  the skill roster and the README lens table carry them too.
- The intake commands render an `Assumptions Made` heading in their
  template (autonomous runs only), which C13 required; the demo transcripts
  under `docs/tapes/` are in the new shape.
- Two live turns through the armed hooks, in a fresh headless child session
  (`claude -p ... --dangerously-skip-permissions`): `/pareto-dtd` closed as
  `pass` in the ledger, and `/rot-chroma-dtd ... --no-gate` rendered all
  thirteen lens headings with the sigil and closed as `pass`
  (`rdc ledger --last 1`). The first two live runs failed and exposed three
  defects, each fixed with the live transcript as the instrument:
  - The Stop check read only the last assistant text, so when another
    plugin's Stop hook asked for a closing stanza (a user entry that is not
    a prompt, followed by one more assistant message) the answer was
    hidden behind it and the ledger said `no assistant text found`. The
    answer of a run is now every assistant text after the entry that
    invoked the command, read again a few times while the transcript lags,
    with the transcript state in the finding when nothing is there.
    Control C10 feeds a transcript with an earlier turn, a tool call, the
    answer, a hook-feedback entry and a stanza: `10 run, 0 failing`.
  - The ten lens grammars declared `intake` before `router_state` while
    the process and the template put Router first, so an answer that
    followed its own template failed the order check. The declared order
    is now `router_state, intake`; the elevate template renders its intake
    block right after Router.
  - A nested bold heading (Steps under a timeline) was held to the
    blank-line rule, and a short id defined behind a sigil
    (`- **🔮 T3** ...`) was reported dangling. Both fixed in
    `lib/render-check.mjs`.
- Git Bash rewrites a leading `/pareto-dtd` argument into
  `C:/Program Files/Git/pareto-dtd` before a native executable sees it;
  a headless run from Git Bash needs `MSYS_NO_PATHCONV=1` or the prompt
  hook sees no slash command and opens no run.
- The marketplace round-trip, measured on a machine that also has the npx
  set: `claude plugin marketplace add` and `claude plugin install` succeed
  (the plugin CLI needs `settings.json` writable; a read-only attribute
  makes both fail with `EPERM` after the marketplace clone, which the
  doctor then flags as an unregistered directory); with both installed the
  doctor turns `plugin state` and `double install` red; `claude plugin
  uninstall` and `claude plugin marketplace remove` clean
  `installed_plugins.json`, `known_marketplaces.json` and `enabledPlugins`
  but leave `plugins/cache/rot-dtd-commander/` on disk (6.2 MB), which the
  doctor keeps flagging. New command `rdc prune-plugin` removes what the
  plugin CLI left under `plugins/cache` and `plugins/marketplaces` and
  refuses while the plugin is still registered; control C11 proves both
  halves in a scratch `CLAUDE_CONFIG_DIR`. The 202 hook lines of
  `settings.json` were the same set, in the same order, after the
  round-trip.
- Numbers on the day: `rdc check`: `checked 91  failed 0`; `rdc build
  --check`: `223 targets, 0 drifted, 0 failing`;
  `node checker/contract-audit.mjs`: `155 declarations, 0 unused, 0 law
  gaps`; `node bin/adiutor.mjs controls`: `11 run, 0 failing`;
  `npm run gate`: exit 0.

## 2.0.0 (2026-09-02)

The nine RoT MoE lenses as commands, at full power.

- Ten new commands forged from one spec (`dtd/rot-lenses.spec.mjs`):
  `/rot-nova-dtd`, `/rot-violet-dtd`, `/rot-antivenom-dtd`, `/rot-venom-dtd`,
  `/rot-carnage-dtd`, `/rot-chroma-dtd`, `/rot-soleil-dtd`, `/rot-eidolon-dtd`,
  `/rot-claude-dtd`, and `/rot-elevate-dtd`, which summons all nine with
  nine intakes of four questions each. Every command opens with the cc-ask
  intake, carries one lens-shaped mid-run gate (Venom and Soleil ask only at
  intake, by their bounds), renders its lens's bound as a checkable element,
  and quotes the live router marker when RoT MoE is installed.
- A fifth shared subset, `dtd/cc-rot.dtd`, carrying the MoE engine as
  declared grammar from RoT MoE v10.0.2 (read from the organisation's
  repository with `gh`): the lens and lane enumerations, the five NSIL
  decisions, the gauge bands, `router_state`, `tier1`, `expert`,
  `interceptor`, `gauge` with its `term` and `correction`, `stanza`,
  `tension`, `bound`, `hybrid`; the nine LENS.* parameter rows (Violet's
  lambda is 1.3, as the engine table says); EXPERTS.* and INTERCEPTORS.* per
  lens; the TIER 1 STEMS.* per lane; the ten PROFILE.* weight profiles;
  GAUGE.formula (the PRISM gauge with its sigmoid); CI.scale;
  PIPELINE.phases; HYBRID.law; LAW.ROT.1 to 8. Every lens command renders its
  experts, the interceptors that fired and its own gauge term; Nova and
  ELEVATE render the TIER 1 scan; ELEVATE computes nine terms with K 9.
- The `rot-lenses-dtd` skill with the parameter rows, the experts, the
  interceptors, the stems, the ten profiles, the gauge, the C_i scale and the
  hybrid law worked on five pairs.
- No static instances: the `examples/` directory, the `--xml` flag, the
  `xmlstarlet` code path and its controls are removed. The instrument for a
  rendered answer is the Adiutor's Stop check (headings, order, dangling
  short ids); the instrument for the declarations is the contract audit.
- `checker/contract-audit.mjs`: both directions of the contract as a script,
  with a planted unused declaration as its control (154 declarations, 0
  unused, 0 law gaps).
- Adiutor doctor: a `plugin state` row that finds a plugin copy under
  `plugins/cache`, `plugins/marketplaces` or the registry beside the npx set.
- Uninstall reaches zero entries: a `settings.json` this tool created is
  removed once empty after the disarm, with the tool's own backups; empty
  directories are removed climbing towards the target.
- The `tapes` workflow renders every tape with real `vhs` on ubuntu and
  keeps both renders as artifacts; `docs/tapes/render.mjs` draws the same
  tapes with `ffmpeg` where `vhs` stalls.
- README: the gallery is a six-step install tutorial with each GIF behind
  a spoiler, plus a lens chapter.
- Counts at this release: 68 commands, 19 skills, 4 agents
  (`rdc list`); `rdc build --check`: 223 targets, 0 drifted.

## 1.0.0 (2026-09-02)

First public release.

- 58 commands, 18 skills and 4 agents, each carrying a DOCTYPE: an answer
  grammar, a verdict vocabulary, numbered laws and a trust boundary
  (`rdc list`).
- Four shared subsets under `dtd/`: `cc-core`, `cc-ask`, `cc-report`,
  `cc-record`; inlined into every file by `rdc build` with a two-pass
  parameter-entity resolver (`rdc build`: 210 targets written).
- The checker, rules C1 to C12, on every source in both directions
  (`rdc check --xml`: checked 80, failed 0, xml-run 6, xml-invalid 0).
- Six grammars validated against example instances with `xmlstarlet`
  (`examples/`); a broken instance rejected with a named error before the
  valid one is trusted (`checker/checker-controls.sh`).
- The Adiutor: hooks on ten events, a ledger under a numbered append-only
  record, a `/RoT-DtD-Commander-Adiutor` doctor, policy `off|warn|strict`
  bound to the code default; eight controls (`node bin/adiutor.mjs controls`:
  8 run, 0 failing).
- The guided NPX installer with a manifest, a verified byte-level re-read and
  a reversible arm of the hooks.
- Twenty new commands drawn from the Phantom Books shelf, four power-ups with
  the AskUserQuestion grammar, seven new skills, four auditor agents.
- SPDX headers in every source file (`checker/spdx-sweep.sh`: 463 tracked files checked,
  0 missing); no carriage returns anywhere (`checker/crlf-sweep.sh`).
- Licence: AGPL-3.0-or-later OR EUPL-1.2, with MIT portions from
  taches-cc-resources declared in `NOTICE.md`.
