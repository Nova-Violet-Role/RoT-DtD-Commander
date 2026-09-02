// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
// dtd/new-commands-v5.spec.mjs
// The 5.0.0 commands. Consumed by `rdc forge dtd/new-commands-v5.spec.mjs [names]`.
// Every entry is `new: true`. A command that gathers requirements includes
// cc-ask and declares its intake questions as ASK.<NAME>.<key> entities of
// the form "Header|Question|Option A|Option B|Option C|Option D": four
// declared options, Other always the fifth variant (LAW.ASK.7), the first
// option the recommended one. A command that raises its rounds declares the
// override BEFORE the include (predeclare, LAW.ASK.11). A command that takes
// more than a free sentence includes cc-args and renders its launch walk.
//
// Shapes borrowed from cc-resources/.dtd-file-examples, cited by X-number in
// artifacts/research/2026-09-02-v5-second-reading-creators-from-the-examples.md:
//   X1 presence tuples (create-monitor), X25 qandaset and refentry (the
//   repo commands), X27 gf:instruction (brainstorm-meta-clear-section),
//   X9 color (repo-creativity), X5 accelerators (the flags), X13 aliases.

const ARGS = '<quoted trust="cdata" source="user-args">$ARGUMENTS</quoted>';

const MANY_ROUNDS = ['% ask.rounds "(1|2|3|4|5|6|7|8)"', '% ask.of "(8)"', 'ASK.rounds_per_prompt "8"', 'ASK.max_total "30"'];

// The three repository commands share one anatomy: a measured analysis of
// probes, an intake of up to thirty questions in eight rounds, a plan, the
// writes, a verdict per probe. Only the probe list, the question bank and
// the laws differ.
function repoCommand({ key, prefix, sigil, root, description, hint, probes, bank, laws, objective, extraProcess = [], template, success }) {
  const probeEnum = probes.join('|');
  const entities = {};
  for (const [k, v] of Object.entries(bank)) entities[`ASK.${prefix}.${k}`] = v;
  return {
    new: true, to: `src/commands/${key}-dtd.md`, root, include: ['cc-args', 'cc-ask'], predeclare: MANY_ROUNDS,
    description, argumentHint: hint,
    model: [
      `${root} (args, analysis, intake, plan, writes, verdict, assumption_made*)`,
      'analysis (probe+)', 'probe (#PCDATA)',
      'plan (action+)', 'action (#PCDATA)',
      'writes (written*)', 'written (#PCDATA)',
      'verdict (#PCDATA)',
    ],
    attlist: [
      `probe name (${probeEnum}) #REQUIRED present (yes|partial|no) #REQUIRED`,
      'action target CDATA #REQUIRED do (create|amend|keep|remove) #REQUIRED',
      'written path CDATA #REQUIRED bytes CDATA #REQUIRED',
      'verdict perfect (yes|partial|no) #REQUIRED',
    ],
    entities,
    laws,
    objective,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags ARG.verbose and ARG.debug and the positional words; render the walk under \`args\`.`,
      `Measure every probe by reading the tree and running git in the foreground under a timeout with stdin closed, never a network call and never gh; render one \`probe\` per name with present yes, partial or no and the evidence behind it (verbose prints all of it, debug prints the commands).`,
      'Round 1 of ASK.rounds_per_prompt: the four probes that are absent or partial and matter most, one question each from the bank; four options plus Other; render each round.',
      'Present the gate; on more, the next round from the remaining probes and the answers so far, never past ASK.max_total questions in all; on add or impactful, take the answer and present the gate again; on start, every probe not asked takes its first option and is listed under Assumptions Made.',
      'Render the `plan`: one `action` per probe, create, amend, keep or remove, with its target path.',
      ...extraProcess,
      'Write the files the plan creates or amends, each with the repository SPDX header where its format allows a comment, UTF-8 LF without BOM, and re-read each; render one `written` per file with its bytes.',
      'Render the `verdict`: perfect yes only when every probe is present yes after the writes, partial when some are, no when the run wrote nothing.',
    ],
    map: {
      args: `**${sigil} Args**, the launch walk: count, the flags, the positional words`,
      analysis: `**${sigil} Analysis**, one line per probe with present yes, partial or no and its evidence`,
      intake: `**${sigil} Intake**, each round as n of ASK.rounds_per_prompt with its questions and the labels or Other text chosen, the impactful selections when asked for, the gate choice`,
      plan: `**${sigil} Plan**, one action per probe with its target and do`,
      writes: `**${sigil} Writes**, one line per file written with path and bytes`,
      verdict: `**${sigil} Verdict**, perfect yes, partial or no, with the probes still short`,
      assumption_made: `**${sigil} Assumptions Made**, every probe not asked, with the first option taken`,
    },
    template,
    success,
  };
}

export default {
  'create-monitor': {
    new: true, to: 'src/commands/create-monitor-dtd.md', root: 'monitor_creation', include: ['cc-ask'],
    description: 'DTD-native: create a Claude Code monitor (a persistent process beside the hooks) through twelve questions in three rounds, with its own line contract, its JSON declaration and a control that trips it before it ships',
    argumentHint: '[what the monitor should watch, or leave blank; add --no-gate for autonomous defaults]',
    model: ['monitor_creation (intake, monitor, wiring, proof, assumption_made*)', 'monitor (#PCDATA)', 'wiring (#PCDATA)', 'proof (#PCDATA)'],
    attlist: ['monitor name NMTOKEN #REQUIRED file CDATA #REQUIRED runtime (node|bash|python|powershell) "node"', 'wiring declaration CDATA #REQUIRED', 'proof tripped (yes|no) #REQUIRED'],
    entities: {
      'ASK.MONITOR.1': 'Name|What is the monitor called?|A kebab-case name from its purpose, such as ledger-watch|The name of the source it tails|The name of the event it reports|The name of an existing monitor with a suffix',
      'ASK.MONITOR.2': 'Source|What does it watch?|The Adiutor ledger, ledger.tsv, from its current end|A log file|A directory, for files that appear|A process or a port',
      'ASK.MONITOR.3': 'Event|What counts as an event?|A new line in the source|A file appearing|A status field changing|A threshold crossed',
      'ASK.MONITOR.4': 'Emit|What does it print?|One line per failed event, in the words its DTD declares|One line per event|A summary every N events|Nothing until asked',
      'ASK.MONITOR.5': 'Silence|What does a pass look like?|Nothing, a pass prints no line|A heartbeat every N seconds|One line per pass|A count when the session closes',
      'ASK.MONITOR.6': 'Runtime|What runs it?|Node ESM, a .mjs beside monitors.json|Bash|Python through uv|PowerShell',
      'ASK.MONITOR.7': 'Start|When does it start?|By hand only, declared in monitors/manual.json and run with rdc watch under a 300 second ceiling|With the session, declared in monitors/monitors.json, which the loader starts on its own|On the first -dtd command|When the source first appears',
      'ASK.MONITOR.8': 'Stop|When does it stop?|With the session|On an idle timeout|On a declared stop file|Never, it is restarted by the loader',
      'ASK.MONITOR.9': 'State|Where does it keep state?|Nowhere, it tails from the current end|An offset file under the state directory|In memory only|In the source itself',
      'ASK.MONITOR.10': 'Contract|Which DTD declares its lines?|Its own DTD file beside the .mjs, MONITOR.* entities|An extension of adiutor.dtd|cc-core alone|None, and the checker refuses it',
      'ASK.MONITOR.11': 'Control|How is it proven?|Plant an event, start it under a ceiling, read the line, stop it|A unit test of the parser only|A manual run|The doctor checks it later',
      'ASK.MONITOR.12': 'License|Which SPDX header heads its files?|AGPL-3.0-or-later OR EUPL-1.2, the repository license|MIT|Apache-2.0|CC0-1.0',
    },
    laws: {
      'MONITOR.1': 'A monitor is declared in JSON: monitors/manual.json for one the operator runs by hand, monitors/monitors.json or plugin.json experimental.monitors for one the loader starts with every session; the intake chooses and by hand is the default; the declared command is what runs its file; a hook is never labelled a monitor and a bare ~/.claude/monitors/ is never scanned.',
      'MONITOR.2': 'A monitor reads one declared source and prints only lines declared as MONITOR.* entities in its own DTD; a pass prints nothing unless the intake chose otherwise.',
      'MONITOR.3': 'The twelve ASK.MONITOR.* questions are offered as three rounds of four; no file is written before the gate chose start; every question not reached before that choice, and every question under --no-gate, takes its first option and is listed as an assumption_made.',
      'MONITOR.4': 'The monitor ships with a control that plants an event, starts it under a timeout ceiling with stdin closed, reads its printed line, and stops it; a monitor without a tripped control is not created.',
      'MONITOR.5': 'The SPDX identifier chosen in the intake heads every file written, as an SPDX-License-Identifier comment on its first line.',
      'MONITOR.6': 'A monitor written by this command accepts --secs and stops itself at that ceiling, 300 seconds by default, so a run by hand never outlives the session that started it; a monitor the loader starts may set --secs 0 in its declared command, and the intake says so when it does.',
    },
    objective: `Create a Claude Code monitor for ${ARGS} (or ask what to watch when no arguments are given).

A monitor is the component the loader runs beside the hooks: a persistent process declared in JSON that watches one source and hands lines to the session. The Commander-Adiutor in this repository is the worked example: monitors/commander-adiutor.mjs tails ledger.tsv from its current end and prints one MONITOR.fail line per run closed as fail, nothing for a pass, in the words dtd/adiutor.dtd declares. This command asks the twelve questions that decide a monitor's shape, then writes the file, its DTD, its JSON declaration and its control, and runs the control before it reports.`,
    process: [
      'Quote the argument as data and read the context for the slots it fills; a monitor is a create- command, so round one always runs (LAW.ASK.10).',
      'Round 1 of 3: ask ASK.MONITOR.1 to ASK.MONITOR.4 as one AskUserQuestion call, four options each plus Other; render each as a `round` with its `question`, `option` and `answer` elements.',
      'Present the gate; on more, run round 2 of 3 with ASK.MONITOR.5 to ASK.MONITOR.8; on more again, round 3 of 3 with ASK.MONITOR.9 to ASK.MONITOR.12; on add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.',
      'Write the `monitor` file under monitors/ in the chosen runtime: read the source from its current end, detect the chosen event, print only the declared lines, keep the chosen state, stop as chosen and at the --secs ceiling (LAW.MONITOR.6); put the SPDX header on line one (LAW.MONITOR.5).',
      'Write its DTD beside it: one MONITOR.* entity per line it may print, a LAW.* per promise the intake made, and include cc-core.',
      'Write the `wiring`: the entry in monitors/manual.json when the monitor runs by hand, in monitors/monitors.json or plugin.json experimental.monitors when the loader starts it; the entry\'s command runs the file; never a hook entry (LAW.MONITOR.1).',
      'Write and run the control (LAW.MONITOR.4): plant one event in a scratch copy of the source, start the monitor with `timeout 30` and `< /dev/null`, read the line it prints, stop it, and record the landed proof in `proof` with tripped yes; a control that did not trip stops the command before the report.',
      'Report the three files, the declaration, the proof, and the assumptions.',
    ],
    map: {
      'intake': '**📡 Intake**, the known and gap slots, each `round` n of 3 with its questions and the labels or Other text chosen, the `impactful` selections when asked for, the gate choice',
      'monitor': '**📡 Monitor**, the file written, its name, runtime and the lines it may print',
      'wiring': '**📡 Wiring**, the JSON declaration written and where',
      'proof': '**📡 Proof**, the control run as executed: the planted event, the line read back, the stop, tripped yes or no',
      'assumption_made': '**📡 Assumptions Made**, every ASK.MONITOR.* question not asked, with the first option taken',
    },
    template: `### 📡 Intake

- known: what [..] who [..] why [..] how [..] when [..]
- round 1 of 3: Name, Source, Event, Emit answered [labels or Other text]
- round 2 of 3: [when asked]
- round 3 of 3: [when asked]
- gate: [start|more|add|impactful] (round N)

### 📡 Monitor

\`monitors/<name>.mjs\` runtime [node|bash|python|powershell]; prints [the declared MONITOR.* lines]; contract \`monitors/<name>.dtd\`

### 📡 Wiring

[monitors/manual.json entry for a monitor run by hand, or the monitors/monitors.json or plugin.json experimental.monitors entry for one the loader starts, quoted]

### 📡 Proof

planted [event]; started under timeout 30, stdin closed; read back: [the line]; stopped; tripped yes

### 📡 Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Round one ran before any file was written, and no round exceeded four questions',
      'Every file written carries the chosen SPDX identifier on its first line',
      'The declaration is JSON under monitors or plugin.json, never a hook, and manual.json unless the intake chose the loader',
      'The control tripped: the planted event produced the declared line and the monitor stopped under its ceiling',
      'The monitor stops itself at its --secs ceiling, 300 seconds unless the intake chose otherwise',
    ],
  },

  'git-gh-amplification': repoCommand({
    key: 'git-gh-amplification', prefix: 'GH', sigil: '🐙', root: 'gh_amplification',
    description: 'DTD-native: measure a repository\'s GitHub face (README, license, contributing, templates, discussions, workflows, releases, funding, citation, changelog, badges), ask up to thirty questions in eight rounds about what is missing, then write what was chosen; git only, never gh',
    hint: '[path to the repository, or leave blank for the current one; --verbose prints the evidence, --debug prints the commands]',
    probes: ['readme', 'license', 'contributing', 'code_of_conduct', 'security', 'issue_templates', 'pr_template', 'discussions', 'workflows', 'releases', 'tags', 'topics', 'funding', 'citation', 'changelog', 'badges'],
    bank: {
      readme: 'README|The README is thin or missing. What does it need?|A one-line purpose, an install block, a usage block and a license line|A full tutorial with screenshots|A badge row and a table of contents only|Leave it as it is',
      license: 'License|No LICENSE file was found. Which license?|The repository license already declared in package.json or the SPDX headers|MIT|Apache-2.0|AGPL-3.0-or-later',
      contributing: 'Contributing|No CONTRIBUTING.md. What should it say?|How to run the gate, how to name a branch, what a commit trailer looks like|A pointer to the issue tracker only|A code of conduct link and nothing else|Skip it',
      code_of_conduct: 'Conduct|No CODE_OF_CONDUCT.md. Which text?|Contributor Covenant 2.1, verbatim, with the contact line filled|A short house rule of five lines|A link to an organisation-wide document|Skip it',
      security: 'Security|No SECURITY.md. What policy?|Report privately to the owner address, acknowledged within seven days, fixed in the next release|GitHub private vulnerability reporting only|No policy, issues are public|Skip it',
      issue_templates: 'Issues|No issue templates. Which forms?|Bug report and feature request as YAML forms with required fields|One free-text template|A blank issue with a checklist|Skip them',
      pr_template: 'Pull requests|No pull request template. What does it ask?|What changed, how it was verified, which gate ran, the trailer line|A checklist of five boxes|A one-line summary only|Skip it',
      discussions: 'Discussions|Discussions are not set up. Which categories?|Announcements, Q and A, Ideas, Show and tell|Q and A only|Announcements only|Leave discussions off',
      workflows: 'Workflows|No CI workflow was found. What runs on push?|The repository gate, on ubuntu and windows, node 20 and 22|A lint step only|A release workflow on tags only|No CI',
      releases: 'Releases|No release notes are attached to tags. How are releases cut?|A tag per version with CHANGELOG text as the release body|GitHub releases written by hand|No releases, tags only|Skip it',
      tags: 'Tags|Versions are not tagged. What is the tag shape?|vMAJOR.MINOR.PATCH annotated tags, signed off|Bare version numbers|Date tags|No tags',
      topics: 'Topics|Repository topics are unknown from the tree. Which set?|The package.json keywords, lower-case, at most twenty|Five broad topics|Language and framework names only|None',
      funding: 'Funding|No FUNDING.yml. Which channel?|The ko-fi page named in the commit trailers|GitHub Sponsors|Open Collective|None',
      citation: 'Citation|No CITATION.cff. What does it carry?|Title, authors, version, date released, license, repository URL|Title and authors only|A DOI placeholder|Skip it',
      changelog: 'Changelog|No CHANGELOG.md, or the top entry is stale. What is the shape?|Keep a Changelog headings with measured numbers beside each claim|A list of commit subjects per release|A link to the releases page|Skip it',
      badges: 'Badges|The README carries no badges. Which row?|License, version, gate status, node version|License only|Every badge shields.io offers for the stack|None',
    },
    laws: {
      'GH.1': 'Every probe is measured by reading the tree or running git in the foreground under a timeout with stdin closed; gh, a network call or a guess is never a measurement, and a probe that could not be measured is rendered as partial with the reason.',
      'GH.2': 'A question is asked only for a probe that is absent or partial; a probe present yes is never asked about, and no prompt exceeds ASK.max_total questions in all.',
      'GH.3': 'Nothing is written before the gate chose start; every probe not asked takes its first option and is listed as an assumption_made.',
      'GH.4': 'Every file written carries the repository SPDX identifier where its format allows a comment, is written UTF-8 LF without BOM, and is re-read before it is reported.',
      'GH.5': 'The verdict is perfect yes only when every probe is present yes after the writes; anything else is partial or no, with the short probes named.',
    },
    objective: `Amplify the GitHub face of ${ARGS}: measure sixteen probes, ask about the ones that are short, write what was chosen, and say how far from perfect the repository still is.

The probes are the files and settings a visitor meets before the code: README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue and pull request templates, discussion categories, workflows, releases, tags, topics, FUNDING, CITATION, CHANGELOG, badges. Each is measured from the tree and from git; each short one becomes a question with four options and Other; the answers become a plan and the plan becomes files. The DocBook shapes behind this: a legalnotice for the license, a copyright of year and holder, a revhistory revision for the changelog entry.`,
    template: `### 🐙 Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### 🐙 Analysis

- readme: [yes|partial|no], [evidence]
- license: [yes|partial|no], [evidence]
- [one line per probe, sixteen in all]

### 🐙 Intake

- round 1 of 8: [headers] answered [labels or Other text]
- round N of 8: [when asked]
- gate: [start|more|add|impactful] (round N)

### 🐙 Plan

- [probe]: [create|amend|keep|remove] [target path]

### 🐙 Writes

- [path] ([bytes] B, LF, no BOM)

### 🐙 Verdict

perfect [yes|partial|no]; short: [probes still not yes]

### 🐙 Assumptions Made

- [each probe not asked, first option taken]`,
    success: [
      'Every probe was measured before any question was asked, and no question named a probe present yes',
      'No prompt asked more than ASK.max_total questions, and no round more than ASK.max_questions',
      'Every file written carries the SPDX header its format allows and was re-read',
      'The verdict names every probe still short',
    ],
  }),

  'repo-git-scalar': repoCommand({
    key: 'repo-git-scalar', prefix: 'SCALAR', sigil: '🌿', root: 'git_scalar',
    description: 'DTD-native: measure how a repository\'s git scales (ignore and attributes files, line endings, LFS, hooks, branch model, tags, signing, trailers, worktrees, submodules, sparse checkout, layout, remotes, default branch, history), ask up to thirty questions in eight rounds, then write what was chosen',
    hint: '[path to the repository, or leave blank for the current one; --verbose prints the evidence, --debug prints the commands]',
    probes: ['gitignore', 'gitattributes', 'line_endings', 'lfs', 'hooks', 'branch_model', 'tags', 'signing', 'trailers', 'worktrees', 'submodules', 'sparse', 'layout', 'remotes', 'default_branch', 'history'],
    bank: {
      gitignore: 'Ignore|The .gitignore is missing or thin. What does it cover?|node_modules, build output, editor files, OS files, the state directory|A language template from GitHub|Only what is tracked by mistake today|Leave it',
      gitattributes: 'Attributes|No .gitattributes. What does it declare?|text=auto eol=lf for every text file, binary for images and archives, linguist rules for generated trees|eol=lf only|Nothing, rely on core.autocrlf|Skip it',
      line_endings: 'Endings|CR bytes were found in tracked text files. What now?|Normalise to LF with a renormalize commit and a sweep that refuses CR|Leave CRLF where it is|Convert only source files|Skip it',
      lfs: 'LFS|Large blobs are tracked in history. What is done?|Track the extensions in .gitattributes with LFS from now on, history untouched|Rewrite history with LFS migrate|Nothing, the blobs are small enough|Skip it',
      hooks: 'Hooks|No client hooks are versioned. Which hooks?|A pre-commit that runs the sweeps and a commit-msg that checks the trailers, installed by a script|A pre-push that runs the gate|None|Skip it',
      branch_model: 'Branches|No branch model is stated. Which model?|Trunk-based, short branches, tags for releases|GitHub flow with pull requests|Git flow with develop and release branches|Undecided',
      tags: 'Tags|Versions are untagged or unannotated. What tag shape?|vMAJOR.MINOR.PATCH annotated, one per CHANGELOG release|Lightweight tags|Date tags|No tags',
      signing: 'Signing|Commits are unsigned. What signing?|SSH signing with the allowed signers file versioned|GPG signing|Sign tags only|None',
      trailers: 'Trailers|Commit trailers are inconsistent. Which trailers?|Co-Authored-By and On-Behalf-Of on every commit, checked by a hook|Signed-off-by only|Whatever the author writes|None',
      worktrees: 'Worktrees|No worktree convention. What convention?|One worktree per branch under a sibling directory, listed in the README|None, checkouts only|A worktree per release line|Skip it',
      submodules: 'Submodules|Nested repositories or vendored trees were found. What is done?|Declare them as submodules with pinned commits|Subtree merge them|Vendor them as plain files|Leave them',
      sparse: 'Sparse|The tree is large. Sparse checkout?|Cone mode with the top directories listed in the README|No sparse checkout|Scalar-style sparse for the largest directories|Skip it',
      layout: 'Layout|The top level is crowded. What layout?|src, dist or build, docs, scripts, checker, one manifest at the root|A monorepo with packages|Leave it',
      remotes: 'Remotes|More than one remote, or none. Which is canonical?|origin, to the URL package.json names|upstream and origin, fork model|None yet|Skip it',
      default_branch: 'Default|The default branch is not main. What is done?|Rename to main and update the remote HEAD|Keep the current name|Undecided',
      history: 'History|The history has merge noise or huge commits. What hygiene?|Squash merges from now on, no rewrite of the past|Rebase merges|Rewrite the past with filter-repo|Leave it',
    },
    laws: {
      'SCALAR.1': 'Every probe is measured by git in the foreground under a timeout with stdin closed: count-objects, rev-list, ls-files, config, remote, tag, worktree list, submodule status; a number that was not read from git is not a measurement.',
      'SCALAR.2': 'A question is asked only for a probe that is absent or partial; no prompt exceeds ASK.max_total questions in all.',
      'SCALAR.3': 'History is never rewritten by this command; a rewrite is a plan line the operator runs, printed with the exact commands and a warning.',
      'SCALAR.4': 'Every file written is UTF-8 LF without BOM, carries the SPDX header where its format allows a comment, and is re-read before it is reported.',
      'SCALAR.5': 'The verdict is perfect yes only when every probe is present yes after the writes; anything else is partial or no, with the short probes named.',
    },
    objective: `Measure how the git of ${ARGS} scales and make it scale: sixteen probes read from git, a question for each short one, a plan, the writes, a verdict.

The numbers come from git: object count and pack size, commit count, tracked file count, the largest blobs, remotes, tags, worktrees, submodules, the config that decides line endings. The writes are the files git reads: .gitignore, .gitattributes, hook scripts, an allowed signers file, a README section on the branch model. Nothing rewrites history; a rewrite is printed as a plan the operator runs.`,
    extraProcess: ['For every plan line that would rewrite history (LAW.SCALAR.3), print the exact commands under a warning instead of running them.'],
    template: `### 🌿 Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### 🌿 Analysis

- gitignore: [yes|partial|no], [evidence]
- line_endings: [yes|partial|no], [CR files counted]
- [one line per probe, sixteen in all, with the git numbers read]

### 🌿 Intake

- round 1 of 8: [headers] answered [labels or Other text]
- round N of 8: [when asked]
- gate: [start|more|add|impactful] (round N)

### 🌿 Plan

- [probe]: [create|amend|keep|remove] [target path or the commands the operator runs]

### 🌿 Writes

- [path] ([bytes] B, LF, no BOM)

### 🌿 Verdict

perfect [yes|partial|no]; short: [probes still not yes]

### 🌿 Assumptions Made

- [each probe not asked, first option taken]`,
    success: [
      'Every number in the analysis was read from a git command that ran',
      'No history was rewritten; every rewrite is a printed plan line with a warning',
      'No prompt asked more than ASK.max_total questions',
      'The verdict names every probe still short',
    ],
  }),

  'repo-creativity-askingstorm': repoCommand({
    key: 'repo-creativity-askingstorm', prefix: 'STORM', sigil: '🎨', root: 'asking_storm',
    description: 'DTD-native: a storm of up to thirty questions in eight rounds about the creative face of a repository (voice, tagline, logo, sigils, badges, gifs, screenshots, palette, headings, emoji, sections, social preview, contents, callouts, footer, links), a declared palette of hex swatches, then the writes',
    hint: '[path to the repository, or leave blank for the current one; --verbose prints the evidence, --debug prints the commands]',
    probes: ['voice', 'tagline', 'logo', 'sigils', 'badges', 'gifs', 'screenshots', 'palette', 'headings', 'emoji', 'sections', 'social_preview', 'contents', 'callouts', 'footer', 'links'],
    bank: {
      voice: 'Voice|The README voice is flat. What voice?|Short declaratives, one idea per sentence, a measured number beside every claim|A narrative that opens with a story|A terse reference card|Leave it',
      tagline: 'Tagline|There is no tagline under the title. Which shape?|One line that names what the tool does and for whom|A question the reader has|A quotation from the project|None',
      logo: 'Logo|No logo or banner. What is used?|The project sigil rendered large, SVG, with the palette colours|A wordmark in a monospace face|A photograph or illustration the operator supplies|None',
      sigils: 'Sigils|Command sigils are unused in the README. How are they shown?|A roster table of every command with its sigil, one line each|Only the headline commands|Inline beside each mention|Not shown',
      badges: 'Badges|Badge colours clash with the palette. What colours?|The palette primary for license and version, the accent for the gate status|Default shields colours|One flat colour|No badges',
      gifs: 'GIFs|No animated tutorial. What is done?|Describe the frames of the existing recording in a numbered list beside the link, no reconstruction|Record a new one with the palette terminal theme|Replace with still screenshots|None',
      screenshots: 'Screenshots|No screenshots. Which?|The install prompt, one command answer with its headings, the doctor output|The terminal only|None',
      palette: 'Palette|No palette is declared. Which swatches?|Primary, secondary, accent, background, text and badge as six hex swatches, written to a palette file|Two colours, primary and accent|The terminal theme colours|None',
      headings: 'Headings|Headings are uneven. What rule?|One emoji sigil per top heading, sentence case, no trailing punctuation|Plain headings|Numbered headings|Leave them',
      emoji: 'Emoji|Emoji are scattered. What rule?|Only sigils from the roster, one per heading, none in prose|None anywhere|Free use|Leave it',
      sections: 'Sections|Sections are out of order. Which order?|Purpose, install, use, how it works, the gate, contributing, license|Install first|Reference first|Leave it',
      social_preview: 'Preview|No social preview image. What is made?|A 1280 by 640 SVG with the sigil, the name and the tagline on the background swatch|A screenshot|None',
      contents: 'Contents|No table of contents. What kind?|A generated list of the top headings with anchors|A short list of three entry points|None',
      callouts: 'Callouts|Callouts are missing or of unknown types. Which types?|Only the five GitHub alert types, NOTE, TIP, IMPORTANT, WARNING, CAUTION|NOTE and WARNING only|Obsidian callouts too|None',
      footer: 'Footer|No footer. What does it carry?|The license line, the author line, the support link named in the trailers|The license line only|A sitemap of links|None',
      links: 'Links|Links are bare URLs or broken. What is done?|Every link named, every relative link checked against the tree|Bare URLs kept|Only external links checked|Leave them',
    },
    laws: {
      'STORM.1': 'A palette swatch is a hex value of exactly six lower-case hexadecimal digits after a hash, one per declared role, written to the palette file and quoted from it; a colour not in the palette is not used in anything the command writes.',
      'STORM.2': 'A GIF is described frame by frame in words beside its link; it is never reconstructed, decoded or generated by this command.',
      'STORM.3': 'A callout the command writes is one of the five GitHub alert types and nothing else; an ALARM type does not exist and is refused.',
      'STORM.4': 'Every probe is measured by reading the tree; a question is asked only for a probe that is absent or partial; no prompt exceeds ASK.max_total questions in all.',
      'STORM.5': 'Nothing is written before the gate chose start; every file written is UTF-8 LF without BOM with the SPDX header where its format allows a comment, and is re-read before it is reported.',
      'STORM.6': 'The verdict is perfect yes only when every probe is present yes after the writes; anything else is partial or no, with the short probes named.',
    },
    objective: `Storm the creative face of ${ARGS} with questions until its voice, palette, images and structure are declared and written.

Sixteen probes are read from the tree: the README voice, tagline, logo, sigils, badges, animated recordings, screenshots, palette, headings, emoji, section order, social preview, contents, callouts, footer, links. Each short probe becomes a question; the answers declare a palette of six hex swatches in the way image.dtd declares a colour, describe recordings frame by frame, and fix the callouts to the five GitHub types. The writes are the README, a palette file, an SVG preview, and nothing that decodes an image.`,
    template: `### 🎨 Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### 🎨 Analysis

- voice: [yes|partial|no], [evidence]
- palette: [yes|partial|no], [swatches found]
- [one line per probe, sixteen in all]

### 🎨 Intake

- round 1 of 8: [headers] answered [labels or Other text]
- round N of 8: [when asked]
- gate: [start|more|add|impactful] (round N)

### 🎨 Plan

- [probe]: [create|amend|keep|remove] [target path]
- palette: primary #[hex] secondary #[hex] accent #[hex] background #[hex] text #[hex] badge #[hex]

### 🎨 Writes

- [path] ([bytes] B, LF, no BOM)

### 🎨 Verdict

perfect [yes|partial|no]; short: [probes still not yes]

### 🎨 Assumptions Made

- [each probe not asked, first option taken]`,
    success: [
      'Every colour written is a six-digit lower-case hex swatch declared in the palette',
      'No image was decoded or generated; every recording is described in words',
      'Every callout written is one of the five GitHub alert types',
      'No prompt asked more than ASK.max_total questions',
    ],
  }),

  'brainstorm-meta-clear-section': {
    new: true, to: 'src/commands/brainstorm-meta-clear-section-dtd.md', root: 'clear_section', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: brainstorm a topic, then transmigrate the bigger prompt that came out of it into a handoff file for the next context section and print the instruction to clear and resume; the command never runs /clear itself',
    argumentHint: '[topic or the prompt to carry over; --verbose prints the ideas discarded, --debug prints the file bytes]',
    model: ['clear_section (args, intake, brainstorm, transmigration, instruction, assumption_made*)', 'brainstorm (idea+)', 'idea (#PCDATA)', 'transmigration (#PCDATA)', 'instruction (#PCDATA)'],
    attlist: ['idea rank CDATA #REQUIRED kept (yes|no) #REQUIRED', 'transmigration path CDATA #REQUIRED bytes CDATA #REQUIRED', 'instruction goal CDATA #REQUIRED step CDATA #REQUIRED'],
    entities: {
      'ASK.CLEAR.1': 'Topic|What is brainstormed?|The argument as given|The open question of the current section|A section of the plan that is stalling|Something typed under Other',
      'ASK.CLEAR.2': 'Carry|What travels to the next section?|The goal, the state, the files touched, the next step, and the bigger prompt whole|The bigger prompt only|A three-line summary|Nothing but the topic',
      'ASK.CLEAR.3': 'Count|How many ideas?|Seven, ranked, three kept|Three|Twelve, unranked|As many as come',
      'ASK.CLEAR.4': 'Launch|How is the next section opened?|The operator runs the clear command, then the launch line printed here|The launch line alone, no clear|A new session|Left to the operator',
      'CLEAR.dir': 'artifacts/handoff',
      'CLEAR.command': 'the clear command of the terminal, a slash followed by the word clear',
    },
    laws: {
      'CLEAR.1': 'This command never runs the clear command itself; it writes the handoff file and prints an instruction element whose goal and step tell the operator to clear and how to resume.',
      'CLEAR.2': 'The bigger prompt is transmigrated whole as CDATA into the handoff file under CLEAR.dir, byte for byte, never rewritten, summarised or shortened.',
      'CLEAR.3': 'The handoff file carries what the next section needs to resume: the goal, the state as of this run, the files touched, the next step, and the prompt; a handoff missing one of these is not written.',
      'CLEAR.4': 'An instruction is a distinct speech act from a verdict: it says what to do next, never what happened, and it is rendered in its own element with its goal and its step.',
      'CLEAR.5': 'Every idea is rendered with its rank and whether it was kept; verbose prints the discarded ones in full.',
    },
    objective: `Brainstorm ${ARGS}, keep the strongest ideas, fold them into the bigger prompt the next context section will start from, write that prompt whole into a handoff file, and print the instruction to clear and resume.

The shape is borrowed from the instruction channel of the RoT DTD GOAL trust contract: when a queue advances, the gate is not reporting a result but issuing an instruction, and that is tagged as its own element with a goal and a step so a reader can tell what happened from what to do next. Here the instruction is always the same two moves: run CLEAR.command, then open the next section with the launch line that names the handoff file.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and the topic or the prompt; render the walk under \`args\`.`,
      'Round 1 of 3: ask ASK.CLEAR.1 to ASK.CLEAR.4 as one AskUserQuestion call, four options each plus Other; render the round.',
      'Present the gate; on more, add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.',
      'Render the `brainstorm`: the chosen count of `idea` elements, ranked, the kept ones marked; the ideas come from the topic, the conversation and the files named in it, each idea one sentence with a verb.',
      'Compose the bigger prompt: the goal, the state as of this run, the files touched, the next step, and the kept ideas folded into the prompt the operator gave, whole (LAW.CLEAR.2, LAW.CLEAR.3).',
      'Write the handoff file under CLEAR.dir as `<date>-<slug>.md`, UTF-8 LF without BOM with the SPDX header, re-read it and render the `transmigration` with path and bytes.',
      'Render the `instruction` with goal and step: step one is CLEAR.command, step two is the launch line, the at-sign reference to the handoff file followed by the command or sentence that resumes the work.',
    ],
    map: {
      args: '**🌀 Args**, the launch walk: count, the flags, the positional words',
      intake: '**🌀 Intake**, the round with its four questions and the labels or Other text chosen, the gate choice',
      brainstorm: '**🌀 Brainstorm**, the ideas ranked, kept ones marked',
      transmigration: '**🌀 Transmigration**, the handoff file written, its path and bytes, what it carries',
      instruction: '**🌀 Instruction**, the goal and the two steps: clear, then the launch line',
      assumption_made: '**🌀 Assumptions Made**, every question not asked, with the first option taken',
    },
    template: `### 🌀 Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### 🌀 Intake

- round 1 of 3: Topic, Carry, Count, Launch answered [labels or Other text]
- gate: [start|more|add|impactful] (round 1)

### 🌀 Brainstorm

1. [idea] (kept)
2. [idea] (kept)
3. [idea]
[one line per idea, ranked]

### 🌀 Transmigration

\`artifacts/handoff/<date>-<slug>.md\` ([bytes] B, LF, no BOM): goal, state, files touched, next step, the prompt whole

### 🌀 Instruction

goal: [the goal the next section resumes]
step 1: run the clear command
step 2: [the launch line, an at-sign reference to the handoff file, then the resuming command or sentence]

### 🌀 Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'The clear command was never run by this command; the instruction names it as a step',
      'The handoff file holds the prompt byte for byte, the goal, the state, the files and the next step, and was re-read',
      'Every idea carries a rank and a kept mark',
      'The instruction is its own element, with a goal and a step, and says nothing about what happened',
    ],
  },

  'ask-me-many-questions': {
    new: true, to: 'src/commands/ask-me-many-questions-dtd.md', root: 'many_session', include: ['cc-ask'], predeclare: MANY_ROUNDS,
    description: 'Gather requirements through up to thirty bilateral questions in eight rounds of four before executing any task; the rounds are raised in the DOCTYPE before the ask grammar is included, and the impactful selection, the previews and the back token are all in force',
    argumentHint: '[task or leave blank; add --no-gate for autonomous mode]',
    model: ['many_session (task, intake, execution, assumption_made*)', 'task (#PCDATA)', 'execution (#PCDATA)'],
    attlist: ['task kind (write|build|figure|other) #IMPLIED'],
    entities: {
      'TASK.question': 'What would you like help with?',
      'TASK.write': 'Write something',
      'TASK.build': 'Build something',
      'TASK.figure': 'Figure something out',
      'TASK.other': 'Other',
    },
    laws: {
      'MANY.1': 'The rounds are raised to eight by the four declarations that precede the include of the ask grammar in this DOCTYPE (LAW.ASK.11); the enumeration the checker reads is (1|2|3|4|5|6|7|8) and ASK.max_total is thirty, so the eighth round asks at most two questions.',
      'MANY.2': 'Each round is one ask element with one to four questions, then the gate is offered only after a round that closed a slot; a round whose every question was answered Other with the back token re-asks and does not count.',
      'MANY.3': 'Execution opens with a restatement of every known slot and every answer received, thirty at most, so the work can be audited against what was asked.',
    },
    objective: `Use the Intake and Decision Gate pattern with a long intake to gather requirements before executing ${ARGS}.

This is the ask-me-questions command with its rounds raised: eight rounds of four, thirty questions at most, every question bilateral (four declared options plus Other), previews cut and expanded, the impactful selection on the gate, and the back token to re-ask a question. The raise is declared, not promised: the DOCTYPE declares ask.rounds, ask.of, ASK.rounds_per_prompt and ASK.max_total before it includes cc-ask, and the first declaration binds.`,
    process: [
      'Check whether context was provided in the argument; if not, use AskUserQuestion with TASK.question to set the `task`.',
      'Analyze the task and the conversation into known and gap slots; never ask about a known slot (LAW.ASK.1).',
      'Ask round one about the gaps; chain rounds while open detail remains, never past round ASK.rounds_per_prompt and never past ASK.max_total questions in all (LAW.ASK.6, LAW.MANY.1); render each round as n of ASK.rounds_per_prompt.',
      'Present the gate after each round; loop on more, add or impactful (LAW.ASK.9) until the gate choice is start; a reply of ASK.back re-asks the question just asked (LAW.ASK.12).',
      'Execute the task with the full context; open the `execution` with the restatement (LAW.MANY.3).',
    ],
    map: {
      task: '**❔ Task**, with its kind when it came from TASK.question',
      intake: '**❔ Intake**, the known and gap slots, then each round as n of 8 with its questions and answers (Other answers quoted as typed), the impactful selections when the gate asked for them, then the gate choice and round number',
      execution: '**❔ Execution**, opening with the restatement, then the work itself',
      assumption_made: '**❔ Assumptions Made**, autonomous mode only',
    },
    template: `### ❔ Task

[the task, kind: write|build|figure|other]

### ❔ Intake

- known: what [..] who [..] why [..] how [..] when [..]
- gaps: [slots asked about]
- round 1 of 8: [question headers] answered [labels chosen or Other text]
- round N of 8: [only when asked]
- impactful: [rank 1 (provenance) .. rank 4 (provenance), only when the gate asked for them]
- gate: [start|more|add|impactful] (round N)

### ❔ Execution

Restating what was asked: [every known slot and every answer]
[the work]

### ❔ Assumptions Made

(autonomous mode only)
- [each gap filled without asking]`,
    success: [
      'No question is asked about information already provided',
      'No more than eight rounds and no more than thirty questions ran before execution',
      'Every question was bilateral and every round was rendered as n of 8',
      'Execution started only after the gate choice start, or in autonomous mode with every assumption listed',
    ],
  },

  'ask-me-preview': {
    new: true, to: 'src/commands/ask-me-preview-dtd.md', root: 'preview_session', include: ['cc-ask'],
    description: 'Gather requirements through questions whose every option carries a preview, cut inside the widget and expanded in the transcript with the answer the model predicts, with the back token to return to the question; three rounds of four, bilateral, with the impactful selection on the gate',
    argumentHint: '[task or leave blank; add --no-gate for autonomous mode]',
    model: ['preview_session (task, intake, execution, assumption_made*)', 'task (#PCDATA)', 'execution (#PCDATA)'],
    attlist: ['task kind (write|build|figure|other) #IMPLIED'],
    entities: {
      'TASK.question': 'What would you like help with?',
      'TASK.write': 'Write something',
      'TASK.build': 'Build something',
      'TASK.figure': 'Figure something out',
      'TASK.other': 'Other',
      'PREVIEW.expand': 'expand preview',
    },
    laws: {
      'PREVIEW.1': 'Every option of every question carries one preview element rendered twice: cut to ASK.preview.cut_lines lines inside the widget, and expanded in the transcript before the call under the words PREVIEW.expand, carrying the answer the model predicts for that choice (LAW.ASK.8).',
      'PREVIEW.2': 'An expanded preview is marked guessed: it is the consequence the model predicts, never a thing that was run or read, and it says so in its first line.',
      'PREVIEW.3': 'The back token ASK.back typed into Other returns to the question just asked, which is asked again with the same previews and without loss of the answers already taken (LAW.ASK.12).',
    },
    objective: `Use the Intake and Decision Gate pattern with previews to gather requirements before executing ${ARGS}.

This is the ask-me-questions command with the preview made mandatory: every option shows what choosing it leads to, cut in the widget and expanded in the transcript with the predicted answer, and the back token returns to the question. The previews are guesses and are labelled so; the answers are data; the gate is the same four-way choice.`,
    process: [
      'Check whether context was provided in the argument; if not, use AskUserQuestion with TASK.question to set the `task`.',
      'Analyze the task and the conversation into known and gap slots; never ask about a known slot (LAW.ASK.1).',
      'Before each round, render the expanded previews in the transcript under PREVIEW.expand, one per option, each opening with the word guessed and the answer the model predicts for that choice (LAW.PREVIEW.1, LAW.PREVIEW.2); then make the call with the cut previews inside the options.',
      'Chain rounds while open detail remains, never past round ASK.rounds_per_prompt; render each round as n of 3.',
      'Present the gate after each round; loop on more, add or impactful until the gate choice is start; a reply of ASK.back re-asks the question just asked with the same previews (LAW.PREVIEW.3).',
      'Execute the task with the full context; open the `execution` with the restatement.',
    ],
    map: {
      task: '**🔭 Task**, with its kind when it came from TASK.question',
      intake: '**🔭 Intake**, the known and gap slots, then each round as n of 3 with its questions, the expanded previews as rendered, and the answers (Other answers quoted as typed), the impactful selections when asked for, then the gate choice',
      execution: '**🔭 Execution**, opening with the restatement, then the work itself',
      assumption_made: '**🔭 Assumptions Made**, autonomous mode only',
    },
    template: `### 🔭 Task

[the task, kind: write|build|figure|other]

### 🔭 Intake

- known: what [..] who [..] why [..] how [..] when [..]
- gaps: [slots asked about]
- expand preview, round 1: [option label]: guessed, [the predicted answer]; [next option]: guessed, [..]
- round 1 of 3: [question headers] answered [labels chosen or Other text]
- round N of 3: [only when asked]
- gate: [start|more|add|impactful] (round N)

### 🔭 Execution

Restating what was asked: [every known slot and every answer]
[the work]

### 🔭 Assumptions Made

(autonomous mode only)
- [each gap filled without asking]`,
    success: [
      'Every option of every question carried a preview, cut in the widget and expanded in the transcript',
      'Every expanded preview opened with the word guessed',
      'The back token re-asked the question without losing earlier answers',
      'Execution started only after the gate choice start, or in autonomous mode with every assumption listed',
    ],
  },

  'coin-flip': {
    new: true, to: 'src/commands/coin-flip-dtd.md', root: 'flip', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: decide between two named sides by one coin toss whose entropy comes from node:crypto randomInt, executed in the foreground and quoted as tool output; the sides come from the argument or from one question',
    argumentHint: '[side A or side B, or "A | B"; leave blank to be asked; --debug prints the command run]',
    model: ['flip (args, intake, call, toss, result, assumption_made*)', 'call (side, side)', 'side (#PCDATA)', 'toss (#PCDATA)', 'result (#PCDATA)'],
    attlist: ['side face (heads|tails) #REQUIRED', 'toss source (crypto) #FIXED "crypto" value (0|1) #REQUIRED', 'result winner (heads|tails) #REQUIRED'],
    entities: {
      'ASK.FLIP.1': 'Sides|What are the two sides?|The two words or phrases separated by or, from the argument|Two options typed under Other, one per line|Yes and no|Now and later',
      'FLIP.source': 'node:crypto randomInt(2), run in the foreground under a timeout with stdin closed',
      'FLIP.heads': '0',
      'FLIP.tails': '1',
    },
    laws: {
      'FLIP.1': 'The toss is one execution of FLIP.source whose printed value is quoted as tool output; a value that was not printed by that command is not a toss.',
      'FLIP.2': 'There are exactly two sides, heads and tails, each bound to one named option before the toss; FLIP.heads and FLIP.tails map the printed value to the face.',
      'FLIP.3': 'One toss per run; a second toss in the same run is refused, and the record carries the command output verbatim.',
    },
    objective: `Flip a coin between the two sides named in ${ARGS}, or ask for them, and report which side won.

The entropy is real: FLIP.source runs, prints 0 or 1, and the printed digit is quoted as tool output before it is read as heads or tails. The command does not weigh, repeat or interpret the toss; its three variants do that, each in its own command.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives two sides split on the word or, a vertical bar, or a comma; render the walk under \`args\`.`,
      'When fewer than two sides were given, round 1 of 3: ask ASK.FLIP.1 with four options plus Other; present the gate; on start, bind the sides.',
      'Render the `call` with its two `side` elements: heads bound to the first option, tails to the second (LAW.FLIP.2).',
      'Run `timeout 10 node -e "console.log(require(\'node:crypto\').randomInt(2))" < /dev/null` in the foreground, quote its stdout as tool output, and render the `toss` with source crypto and the printed value (LAW.FLIP.1).',
      'Render the `result`: the winner is the side whose face FLIP.heads or FLIP.tails names for the printed value; no second toss (LAW.FLIP.3).',
    ],
    map: {
      args: '**🪙 Args**, the launch walk: count, the flags, the positional words',
      intake: '**🪙 Intake**, the round when asked, its answer, the gate choice; one line saying the sides came from the argument otherwise',
      call: '**🪙 Call**, heads bound to the first side, tails to the second',
      toss: '**🪙 Toss**, the command run and its printed value, quoted',
      result: '**🪙 Result**, the winning side by name',
      assumption_made: '**🪙 Assumptions Made**, every question not asked, with the first option taken',
    },
    template: `### 🪙 Args

count [n]; debug [0|1]; words [each positional word]

### 🪙 Intake

[round 1 of 3: Sides answered [labels or Other text]; gate start] or: sides taken from the argument, no round needed

### 🪙 Call

heads: [side A]; tails: [side B]

### 🪙 Toss

source crypto; printed: [0|1]

### 🪙 Result

winner: [heads|tails], [the side by name]

### 🪙 Assumptions Made

- [each unasked question, first option taken, or none]`,
    success: [
      'The printed value came from a command that ran and was quoted before it was read',
      'Exactly two sides were bound before the toss',
      'One toss only',
    ],
  },

  'coin-flip-best-of': {
    new: true, to: 'src/commands/coin-flip-best-of-dtd.md', root: 'series', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: decide between two named sides by a best-of series of three, five or seven coin tosses, each its own node:crypto randomInt execution quoted as tool output, the majority winning',
    argumentHint: '[side A or side B; --of 3|5|7; leave blank to be asked; --debug prints every command run]',
    model: ['series (args, intake, call, toss+, result, assumption_made*)', 'call (side, side)', 'side (#PCDATA)', 'toss (#PCDATA)', 'result (#PCDATA)'],
    attlist: ['call of (3|5|7) #REQUIRED', 'side face (heads|tails) #REQUIRED', 'toss n CDATA #REQUIRED source (crypto) #FIXED "crypto" value (0|1) #REQUIRED', 'result winner (heads|tails) #REQUIRED heads CDATA #REQUIRED tails CDATA #REQUIRED'],
    entities: {
      'ASK.BEST.1': 'Sides|What are the two sides?|The two words or phrases separated by or, from the argument|Two options typed under Other, one per line|Yes and no|Now and later',
      'ASK.BEST.2': 'Series|Best of how many?|Three|Five|Seven|Typed under Other, odd only',
      'BEST.source': 'node:crypto randomInt(2), run once per toss in the foreground under a timeout with stdin closed',
    },
    laws: {
      'BEST.1': 'Every toss is its own execution of BEST.source, numbered n from 1, its printed value quoted as tool output; a series whose tosses came from one call is refused.',
      'BEST.2': 'The series length is odd, three, five or seven, bound before the first toss, and the series stops when one face can no longer be overtaken.',
      'BEST.3': 'The result carries the count of each face and the winner is the majority face; a tie cannot occur and a run that reports one has miscounted.',
    },
    objective: `Decide between the two sides named in ${ARGS} by a best-of series of coin tosses and report the count and the winner.

Each toss is real and separate: BEST.source runs once per toss, its digit is quoted, and the series stops early when the outcome is settled. The odd length makes a tie impossible, which is the point of the variant.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the two sides and, after the option of, the series length; render the walk under \`args\`.`,
      'When a side or the length is missing, round 1 of 3: ask ASK.BEST.1 and ASK.BEST.2 in one call; present the gate; on start, bind them.',
      'Render the `call` with of and the two `side` elements, heads bound to the first option (LAW.BEST.2).',
      'For n from 1 while neither face has a majority: run `timeout 10 node -e "console.log(require(\'node:crypto\').randomInt(2))" < /dev/null`, quote its stdout, render one `toss` with n and the printed value (LAW.BEST.1).',
      'Render the `result` with the heads count, the tails count and the winner (LAW.BEST.3).',
    ],
    map: {
      args: '**🥇 Args**, the launch walk: count, the flags, the positional words',
      intake: '**🥇 Intake**, the round when asked, its answers, the gate choice; one line saying the sides and length came from the argument otherwise',
      call: '**🥇 Call**, best of N, heads bound to the first side, tails to the second',
      toss: '**🥇 Toss**, one line per toss with n and the printed value, quoted',
      result: '**🥇 Result**, the counts and the winning side by name',
      assumption_made: '**🥇 Assumptions Made**, every question not asked, with the first option taken',
    },
    template: `### 🥇 Args

count [n]; debug [0|1]; words [each positional word]

### 🥇 Intake

[round 1 of 3: Sides, Series answered [labels or Other text]; gate start] or: taken from the argument, no round needed

### 🥇 Call

best of [3|5|7]; heads: [side A]; tails: [side B]

### 🥇 Toss

- toss 1: printed [0|1]
- toss 2: printed [0|1]
- [one line per toss run]

### 🥇 Result

heads [count], tails [count]; winner: [heads|tails], [the side by name]

### 🥇 Assumptions Made

- [each unasked question, first option taken, or none]`,
    success: [
      'Every toss line came from its own command that ran and was quoted',
      'The series length was odd and bound before the first toss',
      'The series stopped when the outcome was settled and the counts add up to the tosses run',
    ],
  },

  'coin-flip-weighted': {
    new: true, to: 'src/commands/coin-flip-weighted-dtd.md', root: 'weighted', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: decide between two named sides by one toss weighted by the odds the operator declares, the entropy from node:crypto randomInt over one hundred, the odds quoted as the operator\'s belief and never adjusted',
    argumentHint: '[side A or side B; --odds 70; leave blank to be asked; --debug prints the command run]',
    model: ['weighted (args, intake, call, toss, result, assumption_made*)', 'call (side, side)', 'side (#PCDATA)', 'toss (#PCDATA)', 'result (#PCDATA)'],
    attlist: ['call odds CDATA #REQUIRED', 'side face (heads|tails) #REQUIRED weight CDATA #REQUIRED', 'toss source (crypto) #FIXED "crypto" value CDATA #REQUIRED', 'result winner (heads|tails) #REQUIRED'],
    entities: {
      'ASK.WEIGHT.1': 'Sides|What are the two sides?|The two words or phrases separated by or, from the argument|Two options typed under Other, one per line|Yes and no|Now and later',
      'ASK.WEIGHT.2': 'Odds|How likely is the first side, in percent?|Seventy|Fifty, a fair coin|Ninety|Typed under Other, a whole number from 1 to 99',
      'WEIGHT.source': 'node:crypto randomInt(100), run in the foreground under a timeout with stdin closed',
    },
    laws: {
      'WEIGHT.1': 'The odds are the operator\'s declared belief, a whole number from 1 to 99 for the first side, quoted as an answer or an argument word and never adjusted by the command.',
      'WEIGHT.2': 'The toss is one execution of WEIGHT.source whose printed value is quoted; heads wins when the value is below the odds, tails otherwise, and the rule is stated beside the result.',
      'WEIGHT.3': 'One toss per run, and the record carries the odds, the printed value and the rule so the outcome can be re-derived.',
    },
    objective: `Decide between the two sides named in ${ARGS} by one toss weighted by the odds the operator declares, and report the value, the rule and the winner.

The weight is the operator's, quoted; the entropy is real, one execution of WEIGHT.source printing a number from 0 to 99; the rule is fixed and stated, so anyone reading the record can re-derive the winner from the two numbers.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the two sides and, after the option odds, the whole number; render the walk under \`args\`.`,
      'When a side or the odds is missing, round 1 of 3: ask ASK.WEIGHT.1 and ASK.WEIGHT.2 in one call; present the gate; on start, bind them (LAW.WEIGHT.1).',
      'Render the `call` with odds and the two `side` elements, heads with weight odds and tails with weight one hundred minus odds.',
      'Run `timeout 10 node -e "console.log(require(\'node:crypto\').randomInt(100))" < /dev/null`, quote its stdout, render the `toss` with the printed value (LAW.WEIGHT.2).',
      'Render the `result`: heads when the value is below the odds, tails otherwise, with the rule written beside it (LAW.WEIGHT.3).',
    ],
    map: {
      args: '**🎚️ Args**, the launch walk: count, the flags, the positional words',
      intake: '**🎚️ Intake**, the round when asked, its answers, the gate choice; one line saying the sides and odds came from the argument otherwise',
      call: '**🎚️ Call**, the odds, heads with its weight, tails with its weight',
      toss: '**🎚️ Toss**, the command run and its printed value, quoted',
      result: '**🎚️ Result**, the rule and the winning side by name',
      assumption_made: '**🎚️ Assumptions Made**, every question not asked, with the first option taken',
    },
    template: `### 🎚️ Args

count [n]; debug [0|1]; words [each positional word]

### 🎚️ Intake

[round 1 of 3: Sides, Odds answered [labels or Other text]; gate start] or: taken from the argument, no round needed

### 🎚️ Call

odds [n]; heads: [side A] weight [n]; tails: [side B] weight [100 minus n]

### 🎚️ Toss

source crypto; printed: [0 to 99]

### 🎚️ Result

rule: heads when printed is below the odds; winner: [heads|tails], [the side by name]

### 🎚️ Assumptions Made

- [each unasked question, first option taken, or none]`,
    success: [
      'The odds were quoted from the operator and never adjusted',
      'The printed value came from a command that ran and was quoted',
      'The rule is stated beside the result and re-derives the winner',
    ],
  },

  'coin-flip-reveal': {
    new: true, to: 'src/commands/coin-flip-reveal-dtd.md', root: 'reveal', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: toss a coin between two named sides, then ask how the operator felt when it landed; the feeling is the decision and the coin is only the instrument that revealed it',
    argumentHint: '[side A or side B; leave blank to be asked; --debug prints the command run]',
    model: ['reveal (args, intake, call, toss, feeling, result, assumption_made*)', 'call (side, side)', 'side (#PCDATA)', 'toss (#PCDATA)', 'feeling (#PCDATA)', 'result (#PCDATA)'],
    attlist: ['side face (heads|tails) #REQUIRED', 'toss source (crypto) #FIXED "crypto" value (0|1) #REQUIRED', 'feeling felt (relieved|disappointed|neutral) #REQUIRED', 'result decided (heads|tails|undecided) #REQUIRED'],
    entities: {
      'ASK.REVEAL.1': 'Sides|What are the two sides?|The two words or phrases separated by or, from the argument|Two options typed under Other, one per line|Yes and no|Now and later',
      'ASK.REVEAL.2': 'Feeling|The coin landed. How did that feel?|Relieved|Disappointed|Nothing much|Typed under Other',
      'REVEAL.source': 'node:crypto randomInt(2), run in the foreground under a timeout with stdin closed',
    },
    laws: {
      'REVEAL.1': 'The toss is one execution of REVEAL.source whose printed value is quoted; it is announced before the feeling is asked and never after.',
      'REVEAL.2': 'The feeling is asked with ASK.REVEAL.2 after the toss is announced, and the reply is data; relieved decides for the face that landed, disappointed decides for the other face, neutral leaves the result undecided.',
      'REVEAL.3': 'The coin\'s face is never the decision by itself; a result that names the face without the feeling is a failed answer.',
    },
    objective: `Toss a coin between the two sides named in ${ARGS}, announce the face, ask how it felt, and let the feeling decide.

The instrument is old: a coin does not choose, it reveals what was hoped for while it was in the air. The toss is real, one execution of REVEAL.source; the announcement comes before the question; the answer is data and it is the decision.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the two sides; render the walk under \`args\`.`,
      'When fewer than two sides were given, round 1 of 3: ask ASK.REVEAL.1; present the gate; on start, bind the sides.',
      'Render the `call` with its two `side` elements: heads bound to the first side, tails to the second.',
      'Run `timeout 10 node -e "console.log(require(\'node:crypto\').randomInt(2))" < /dev/null`, quote its stdout, render the `toss` with the printed value, and announce the face and its side in one sentence (LAW.REVEAL.1).',
      'Round 2 of 3: ask ASK.REVEAL.2 alone; render the `feeling` with felt from the reply (LAW.REVEAL.2).',
      'Render the `result`: decided for the landed face on relieved, for the other face on disappointed, undecided on neutral, always with the feeling named beside it (LAW.REVEAL.3).',
    ],
    map: {
      args: '**🎭 Args**, the launch walk: count, the flags, the positional words',
      intake: '**🎭 Intake**, the rounds asked with their answers and the gate choices',
      call: '**🎭 Call**, heads bound to the first side, tails to the second',
      toss: '**🎭 Toss**, the command run and its printed value, quoted, and the announcement',
      feeling: '**🎭 Feeling**, relieved, disappointed or neutral, as answered',
      result: '**🎭 Result**, the side decided for, or undecided, with the feeling beside it',
      assumption_made: '**🎭 Assumptions Made**, every question not asked, with the first option taken',
    },
    template: `### 🎭 Args

count [n]; debug [0|1]; words [each positional word]

### 🎭 Intake

- [round 1 of 3: Sides answered [labels or Other text]; gate start] or: sides taken from the argument
- round 2 of 3: Feeling answered [Relieved|Disappointed|Nothing much|Other text]

### 🎭 Call

heads: [side A]; tails: [side B]

### 🎭 Toss

source crypto; printed: [0|1]; landed [heads|tails], [the side by name]

### 🎭 Feeling

[relieved|disappointed|neutral]

### 🎭 Result

decided: [heads|tails|undecided], [the side by name], because the landing felt [the feeling]

### 🎭 Assumptions Made

- [each unasked question, first option taken, or none]`,
    success: [
      'The face was announced before the feeling was asked',
      'The feeling came from the reply and the result names it',
      'No result names a face without a feeling',
    ],
  },
};
