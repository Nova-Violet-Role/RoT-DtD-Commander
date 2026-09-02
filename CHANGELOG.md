<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Changelog

Every number below was produced by the command named beside it on the day of
the release. If one of them does not re-run for you, open the
"A claim in our docs is false" issue; the report is credited here.

## 5.0.0 (in progress, 2026-09-02)

The creator kit. Nothing below is released until the gate is green and the
counts are re-measured.

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
