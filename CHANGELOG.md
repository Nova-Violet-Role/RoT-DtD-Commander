<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Changelog

Every number below was produced by the command named beside it on the day of
the release. If one of them does not re-run for you, open the
"A claim in our docs is false" issue; the report is credited here.

## 7.0.0 (2026-09-04)

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

- `node lib/list.mjs controls`: 38 run, 0 failing
- `node lib/starlist.mjs controls`: 28 run, 0 failing
- 131 commands, 22 skills, 5 agents; checked 158; 1435 declarations; 44 gate-chain commands

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
