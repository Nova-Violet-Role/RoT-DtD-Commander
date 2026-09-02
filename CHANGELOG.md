<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Changelog

Every number below was produced by the command named beside it on the day of
the release. If one of them does not re-run for you, open the
"A claim in our docs is false" issue; the report is credited here.

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
