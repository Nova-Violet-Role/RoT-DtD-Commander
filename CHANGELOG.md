<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Changelog

Every number below was produced by the command named beside it on the day of
the release. If one of them does not re-run for you, open the
"A claim in our docs is false" issue; the report is credited here.

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
