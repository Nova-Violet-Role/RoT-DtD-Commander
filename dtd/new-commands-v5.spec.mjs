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

// One creator per schematic, for prompts and for meta-prompts. The schematic
// is pinned in the DOCTYPE as a fixed attribute of the root, so the command
// cannot drift to another shape; the syntax it must use comes from the
// SCHEMA.<schematic>.* entities of cc-schematic.dtd (LAW.SCHEMA.1).
const SCHEMATICS = {
  callout: { sigil: '📣', label: 'the GitHub callout shape', ext: 'md', example: 'a quoted line under a typed callout, one of the five types per case' },
  heredoc: { sigil: '🧾', label: 'a shell here-document', ext: 'sh', example: 'a quoted delimiter around the prompt, so a dollar sign inside it stays a dollar sign' },
  yaml: { sigil: '🧷', label: 'a YAML document', ext: 'yaml', example: 'each section a key with a block scalar, the strip indicator on every literal' },
  nt: { sigil: '🪜', label: 'a NestedText document', ext: 'nt', example: 'each section a key with a multiline string, an angle bracket per line' },
  xml: { sigil: '🏷️', label: 'an XML document with a DOCTYPE', ext: 'md', example: 'a DOCTYPE with the six sections as elements, argument words in CDATA sections' },
  polyglot: { sigil: '🎴', label: 'a polyglot of more than one parser', ext: 'md', example: 'Markdown with YAML front matter holding a NestedText block, each layer literal to the one outside it' },
};
const META_SIGILS = { callout: '🗯️', heredoc: '🧬', yaml: '🧶', nt: '🪆', xml: '🔖', polyglot: '🎩' };

function promptCreator(schematic, meta) {
  const s = SCHEMATICS[schematic];
  const sigil = meta ? META_SIGILS[schematic] : s.sigil;
  const kind = meta ? 'meta-prompt' : 'prompt';
  const key = `create-${kind}-${schematic}`;
  const root = meta ? 'meta_forge' : 'prompt_forge';
  const prefix = meta ? 'META' : 'PROMPT';
  const sectionsEnt = meta ? 'SCHEMA.meta.sections' : 'SCHEMA.prompt.sections';
  const what = meta ? 'a meta-prompt, a prompt that writes prompts' : 'a prompt';
  const q = meta
    ? {
        1: 'Name|What is the meta-prompt called?|A kebab-case name from the argument|The name of the prompts it will write, with meta in front|A name typed under Other|Undecided, ask again after the target',
        2: 'Target|What prompts does it write?|Prompts of one declared schematic, this one|Prompts of any schematic, the schematic asked first|Prompts for one task family named under Other|Undecided',
        3: 'Questions|How many questions does a written prompt ask its user?|Up to twelve in three rounds, the cc-ask shape|Four, one round|None, it takes its arguments and runs|Typed under Other',
        4: 'Arguments|How does a written prompt read its arguments?|The cc-args walk: flags removed, the end token, positional words quoted whole|A single free sentence|Named options only|Typed under Other',
        5: 'Template|What template does every written prompt follow?|The six sections of SCHEMA.prompt.sections, in order|The six sections plus examples|A template typed under Other|Undecided',
        6: 'Checks|What checks does a written prompt carry?|Success criteria as numbered laws, one per promise|A checklist of five boxes|None|Typed under Other',
        7: 'Voice|Which voice profile?|Original, prepared, factual, the text_desc defaults|Paraphrase of a named source, cited|Spontaneous, for brainstorming prompts|Typed under Other',
        8: 'Examples|How many worked examples does it show the written prompt?|One|Three|None|Typed under Other',
        9: 'Output|In which form does a written prompt render its answer?|NestedText, the default form|Markdown with the five callouts|YAML block scalars|Typed under Other',
        10: 'Record|Where does a run record?|artifacts under the prompt name, command-generated filename|Nowhere|Typed under Other|Undecided',
        11: 'Proof|How is it proven?|Read back, guards run, sections in order, one out-of-table syntax planted and refused|Read back only|None, which this command refuses|Typed under Other',
        12: 'License|Which SPDX header heads the file?|AGPL-3.0-or-later OR EUPL-1.2, the repository license|MIT|Apache-2.0|Typed under Other',
      }
    : {
        1: 'Name|What is the prompt called?|A kebab-case name from the argument|The name of the task it performs|A name typed under Other|Undecided, ask again after the objective',
        2: 'Objective|What does the prompt make its reader do?|The one task named in the argument, stated as a verb and an object|A judgement with a declared verdict vocabulary|A transformation of an input into an output form|Typed under Other',
        3: 'Reader|Who reads it?|A Claude Code session, as a slash command|A model called through an API|A person, as a checklist|Typed under Other',
        4: 'Arguments|How does it read its arguments?|The cc-args walk: flags removed, the end token, positional words quoted whole|A single free sentence|Named options only|None',
        5: 'Sections|Which sections does it carry?|The six of SCHEMA.prompt.sections, in order|The six plus worked examples|Objective and process only, the rest one line each|Typed under Other',
        6: 'Voice|Which voice profile?|Original, prepared, factual, the text_desc defaults|Paraphrase of a named source, cited|Spontaneous|Typed under Other',
        7: 'Length|How long?|Under three hundred words of the prompt\'s own voice|Under one hundred|As long as the sections need|Typed under Other',
        8: 'Examples|How many worked examples?|One|Three|None|Typed under Other',
        9: 'Output|In which form does it render its answer?|NestedText, the default form|Markdown with the five callouts|YAML block scalars|Typed under Other',
        10: 'Record|Where does a run record?|artifacts under the prompt name, command-generated filename|Nowhere|Typed under Other|Undecided',
        11: 'Proof|How is it proven?|Read back, guards run, sections in order, one out-of-table syntax planted and refused|Read back only|None, which this command refuses|Typed under Other',
        12: 'License|Which SPDX header heads the file?|AGPL-3.0-or-later OR EUPL-1.2, the repository license|MIT|Apache-2.0|Typed under Other',
      };
  const entities = {};
  for (const [n, v] of Object.entries(q)) entities[`ASK.${prefix}.${n}`] = v;
  return [key, {
    new: true, to: `src/commands/${key}-dtd.md`, root, include: ['cc-args', 'cc-form', 'cc-schematic', 'cc-ask'],
    description: `DTD-native: create ${what} written in ${s.label} through twelve questions in three rounds; every syntax comes from the SCHEMA.${schematic}.* table, the argument words are embedded in a declared class, the file passes the form guards, and a proof plants one out-of-table syntax and shows it refused`,
    argumentHint: `[what the ${kind} is for, or leave blank; --no-gate for autonomous defaults; --verbose prints the file as written]`,
    model: [
      `${root} (args, intake, sections, embedding, file, guards, proof, assumption_made*)`,
      'embedding (#PCDATA)', 'file (#PCDATA)', 'guards (guard+)', 'proof (#PCDATA)',
    ],
    attlist: [
      `${root} schematic (${schematic}) #FIXED "${schematic}"`,
      'embedding reference CDATA #REQUIRED literal CDATA #REQUIRED class (pcdata|cdata|ndata|section) #REQUIRED',
      'file path CDATA #REQUIRED bytes CDATA #REQUIRED',
      'proof tripped (yes|no) #REQUIRED',
    ],
    entities,
    laws: {
      [`${prefix}.1`]: `The schematic of this command is ${schematic}, fixed in its DOCTYPE; the file it writes is ${s.label} and every syntax in it comes from a SCHEMA.${schematic}.* entity (LAW.SCHEMA.1).`,
      [`${prefix}.2`]: `The sections are those of ${sectionsEnt}, rendered in that order; the argument words are embedded through SCHEMA.${schematic}.reference and SCHEMA.${schematic}.literal in the class the intake chose (LAW.SCHEMA.2, LAW.SCHEMA.3).`,
      [`${prefix}.3`]: 'Nothing is written before the gate chose start; every question not asked takes its first option and is listed as an assumption_made.',
      [`${prefix}.4`]: `The file takes the extension SCHEMA.ext.${schematic}, carries the chosen SPDX identifier where its form allows a comment, and passes every cc-form guard of its kind before it is reported (LAW.SCHEMA.4).`,
      [`${prefix}.5`]: 'The proof reads the file back, runs the guards, checks the sections are present in order, and plants one syntax outside the table in a scratch copy to show it refused; a proof that did not trip stops the command before the report (LAW.SCHEMA.5).',
    },
    objective: `Create ${what} for ${ARGS} (or ask what it is for), written in ${s.label}.

The schematic is pinned: ${s.example}. What a literal is, what expands, how a value is referenced, defined, escaped, commented, included or made conditional, is read from the SCHEMA.${schematic}.* table of cc-schematic.dtd, the table cut from the argument-variant references: the quoted heredoc is the CDATA section is the strip block scalar is the NestedText multiline string, and the argument string is always the quoted whole. The sections are ${sectionsEnt}. The file is guarded by cc-form before it is reported and proven by a planted out-of-table syntax that the proof refuses.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and the purpose; render the walk under \`args\`. This is a create- command, so round one always runs (LAW.ASK.10).`,
      `Round 1 of 3: ask ASK.${prefix}.1 to ASK.${prefix}.4 as one AskUserQuestion call, four options each plus Other; render the round.`,
      `Present the gate; on more, round 2 of 3 with ASK.${prefix}.5 to ASK.${prefix}.8; on more again, round 3 of 3 with ASK.${prefix}.9 to ASK.${prefix}.12; on add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.`,
      `Render the \`sections\`: one \`section\` per name of ${sectionsEnt}, in order, each with its text; render the \`embedding\`: the reference syntax SCHEMA.${schematic}.reference, the literal syntax SCHEMA.${schematic}.literal, and the cc-args class chosen for the argument words.`,
      `Write the \`file\` <name>.<schematic>.${s.ext}: ${s.label}, the sections in order, every concept in the syntax the table declares, the SPDX header where a comment is allowed, UTF-8 LF without BOM; re-read it and render path and bytes (LAW.${prefix}.4).`,
      `Run the cc-form guards on the file with node lib/form.mjs and render one \`guard\` per line printed, held yes or no; a guard that did not hold stops the command.`,
      'Run the proof: the sections are present in order; then plant one syntax outside the table in a scratch copy (a sixth callout type, an expanding heredoc around an argument word, a YAML tag, a tab in NestedText, an unescaped ampersand in parsed text, or an inner layer that expands) and show the guards or the section check refuse it; render the `proof` with tripped yes (LAW.SCHEMA.5).',
      'Record the run under artifacts with this command\'s generated filename and report.',
    ],
    map: {
      args: `**${sigil} Args**, the launch walk: count, the flags, the positional words`,
      intake: `**${sigil} Intake**, each \`round\` n of 3 with its questions and the labels or Other text chosen, the \`impactful\` selections when asked for, the gate choice`,
      sections: `**${sigil} Sections**, one line per section in order with its first line`,
      embedding: `**${sigil} Embedding**, the reference syntax, the literal syntax, the class`,
      file: `**${sigil} File**, the path and the bytes, and the file itself under --verbose`,
      guards: `**${sigil} Guards**, one line per guard with held yes or no`,
      proof: `**${sigil} Proof**, the sections check, the planted syntax and its refusal, tripped yes or no`,
      assumption_made: `**${sigil} Assumptions Made**, every ASK.${prefix}.* question not asked, with the first option taken`,
    },
    template: `### ${sigil} Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### ${sigil} Intake

- round 1 of 3: [headers] answered [labels or Other text]
- round 2 of 3: [when asked]
- round 3 of 3: [when asked]
- gate: [start|more|add|impactful] (round N)

### ${sigil} Sections

- [section]: [its first line]

### ${sigil} Embedding

reference: [SCHEMA.${schematic}.reference]; literal: [SCHEMA.${schematic}.literal]; class [pcdata|cdata|ndata|section]

### ${sigil} File

\`<name>.${schematic}.${s.ext}\` ([bytes] B, LF, no BOM)

### ${sigil} Guards

- [guard]: held [yes|no], [detail]

### ${sigil} Proof

sections in order: yes; planted [the out-of-table syntax]: refused by [guard or check]; tripped yes

### ${sigil} Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Round one ran before any file was written',
      `Every syntax in the file is one the SCHEMA.${schematic}.* table declares`,
      'The argument words are embedded in a declared class and never evaluated',
      'Every guard held, the sections are in order, and the planted syntax was refused',
    ],
  }];
}
const PROMPT_CREATORS = Object.fromEntries([
  ...Object.keys(SCHEMATICS).map((s) => promptCreator(s, false)),
  ...Object.keys(SCHEMATICS).map((s) => promptCreator(s, true)),
]);

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

  'create-plugin': {
    new: true, to: 'src/commands/create-plugin-dtd.md', root: 'plugin_creation', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: create a whole Claude Code plugin through twelve questions in three rounds: which creations are in (all of them, or any set), its license from a curated SPDX list, its shell DTD in the DITA shell anatomy with one conditional section per creation, its rendered manifests, one instruction per creation naming the creator command to run next, and a proof that an excluded creation is absent',
    argumentHint: '[plugin name or purpose, or leave blank; --no-gate for autonomous defaults; --verbose prints the shell as written]',
    model: [
      'plugin_creation (args, intake, shell, bundle, manifests, license, instruction*, proof, assumption_made*)',
      'shell (domain+)', 'domain (#PCDATA)',
      'bundle (component*)', 'component (#PCDATA)',
      'manifests (manifest, manifest?)', 'manifest (#PCDATA)',
      'license (#PCDATA)', 'instruction (#PCDATA)', 'proof (#PCDATA)',
    ],
    attlist: [
      'domain name (monitor|moe|router|ot|db|mcp|workflow|skill|hook|command|agent) #REQUIRED included (INCLUDE|IGNORE) #REQUIRED',
      'component kind (command|skill|agent|hook|mcp|monitor|workflow|dtd|doc) #REQUIRED path CDATA #REQUIRED bytes CDATA #REQUIRED',
      'manifest file (plugin.json|marketplace.json) #REQUIRED path CDATA #REQUIRED',
      'license spdx CDATA #REQUIRED source (curated|compound) "curated"',
      'instruction goal CDATA #REQUIRED step CDATA #REQUIRED creation (monitor|moe|router|ot|db|mcp|workflow|skill|hook|command|agent) #REQUIRED',
      'proof tripped (yes|no) #REQUIRED',
    ],
    entities: {
      'ASK.PLUGIN.1': 'Name|What is the plugin called?|A kebab-case name from the argument or the purpose|The name of the repository it lives in|A name typed under Other|Undecided, ask again after the creations',
      'ASK.PLUGIN.2': 'Creations A|Which creations are in? Pick any, this is one of three lists.|All of them, every creation this command knows|A monitor, through create-monitor|A mixture of lenses, through create-moe|A router, through create-router',
      'ASK.PLUGIN.3': 'Creations B|Which creations are in? Second list.|X-of-Thought variants, through create-ot-variants|A database layer, through create-db|An MCP server, through create-mcp|A workflow JSON, through create-workflowjson',
      'ASK.PLUGIN.4': 'Creations C|Which creations are in? Third list.|Skills, through create-skill|Hooks, through create-hook|Commands, through create-slash-command|Agents, through create-subagent',
      'ASK.PLUGIN.5': 'License|Which SPDX license?|AGPL-3.0-or-later OR EUPL-1.2, the license of this repository|MIT|Apache-2.0|An identifier or a compound expression from PLUGIN.licenses, typed under Other',
      'ASK.PLUGIN.6': 'Layout|How is the tree laid out?|src with rdc build rendering commands, skills and agents|Flat, every file where the loader reads it|A monorepo package|Typed under Other',
      'ASK.PLUGIN.7': 'Manifests|Which manifests?|plugin.json and a marketplace.json entry, both rendered|plugin.json only|marketplace.json only|Typed under Other',
      'ASK.PLUGIN.8': 'Contract|How is the DTD shell built?|Its own shell DTD including cc-core, one conditional section per creation|cc-core alone, no shell|One DTD per component, no shell|None, which this command refuses',
      'ASK.PLUGIN.9': 'Sigils|Which sigils head the answers?|One per component, declared in the shell as glyphs with Unicode names|The roster of this repository|Chosen by hand per component under Other|None',
      'ASK.PLUGIN.10': 'Records|Where do its runs record?|artifacts under the plugin root, command-generated names, ordinals for series only|The repository artifacts tree|Nowhere|Typed under Other',
      'ASK.PLUGIN.11': 'Control|How is it proven?|rdc check on every file, both manifests parsed back, one excluded creation shown absent|rdc check only|A manual read|Typed under Other',
      'ASK.PLUGIN.12': 'Version|Which first version?|0.1.0 with a CHANGELOG entry|1.0.0|A date stamp|Typed under Other',
      'PLUGIN.licenses': '0BSD, AFL-3.0, AGPL-3.0-only, AGPL-3.0-or-later, Apache-2.0, Artistic-2.0, BSD-2-Clause, BSD-3-Clause, BSD-3-Clause-Clear, BSD-4-Clause, BSL-1.0, CC-BY-4.0, CC-BY-SA-4.0, CC0-1.0, CECILL-2.1, CERN-OHL-P-2.0, CERN-OHL-S-2.0, CERN-OHL-W-2.0, ECL-2.0, EPL-1.0, EPL-2.0, EUPL-1.1, EUPL-1.2, GFDL-1.3, GPL-2.0-only, GPL-2.0-or-later, GPL-3.0-only, GPL-3.0-or-later, ISC, LGPL-2.1-only, LGPL-2.1-or-later, LGPL-3.0-only, LGPL-3.0-or-later, LPPL-1.3c, MIT, MIT-0, MPL-2.0, MS-PL, MS-RL, MulanPSL-2.0, NCSA, ODbL-1.0, OFL-1.1, OSL-3.0, PostgreSQL, Unlicense, UPL-1.0, Vim, WTFPL, Zlib',
      'PLUGIN.license.default': 'AGPL-3.0-or-later OR EUPL-1.2',
      'PLUGIN.shell.header': 'MODULE, VERSION, DATE',
    },
    laws: {
      'PLUGIN.1': 'The shell DTD follows the shell anatomy: a header comment naming PLUGIN.shell.header, one parameter entity per creation whose value is INCLUDE or IGNORE as the intake chose, one conditional section per creation keyed by that entity, a nesting override naming what may nest in what, the element integration last; it includes cc-core and passes rdc check.',
      'PLUGIN.2': 'Which creations are in is decided by the intake alone and written as the keyword of each section; a creation under IGNORE appears in no manifest, no directory and no README line, and the proof shows the absence.',
      'PLUGIN.3': 'Nothing is written before the gate chose start; every question not asked takes its first option and is listed as an assumption_made; the three creation questions are multi-select and All of them selects every creation.',
      'PLUGIN.4': 'The SPDX identifier is one of PLUGIN.licenses or a compound expression joining its identifiers with OR or AND; an identifier outside the list is refused with the list printed; the chosen expression heads every file whose format allows a comment and fills the license field of every manifest written.',
      'PLUGIN.5': 'Manifests are rendered, never typed: plugin.json and the marketplace.json entry are written from the shell declarations, name, version, description and components, and parsed back before they are reported.',
      'PLUGIN.6': 'Each chosen creation is handed to its creator command by one instruction element naming the command, its arguments and the plugin root; this command writes the shell, the manifests, the directories, the license and the records, and never forges a monitor, a lens roster, a router, a database, an MCP server, a workflow, a skill, a hook, a command or an agent itself.',
      'PLUGIN.7': 'The proof runs rdc check on every file written, parses every manifest back, and shows one creation under IGNORE absent from the bundle; a proof that did not trip stops the command before the report.',
      'PLUGIN.8': 'The plugin records its runs under artifacts at its root with command-generated names; an ordinal appears only where one command produced many files.',
    },
    objective: `Create a Claude Code plugin for ${ARGS} (or ask what it is for when no argument is given): its shell DTD, its tree, its manifests, its license, and one instruction per chosen creation naming the creator command that forges it next.

The shell is built the way the DITA shells are built: a header, a declaration per domain, a conditional section per domain keyed by a parameter entity that says INCLUDE or IGNORE, a nesting override, the element integration last. Here the domains are the creations: monitor, mixture of lenses, router, X-of-Thought variants, database, MCP server, workflow JSON, skills, hooks, commands, agents. The intake asks which are in, in three multi-select lists with All of them as the first choice of the first list, and each chosen creation becomes a section whose keyword is INCLUDE and an instruction to run its creator; each creation left out becomes a section whose keyword is IGNORE and appears nowhere else. The resolver of this repository flattens those sections before anything renders, so the plugin's commands carry no conditional section themselves. The manifests are rendered from the shell, the license comes from a curated SPDX list, and the proof shows one excluded creation absent.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and the name or purpose; render the walk under \`args\`. A plugin is a create- command, so round one always runs (LAW.ASK.10).`,
      'Round 1 of 3: ask ASK.PLUGIN.1 to ASK.PLUGIN.4 as one AskUserQuestion call, four options each plus Other, questions 2 to 4 multi-select (LAW.PLUGIN.3); render the round.',
      'Present the gate; on more, round 2 of 3 with ASK.PLUGIN.5 to ASK.PLUGIN.8; on more again, round 3 of 3 with ASK.PLUGIN.9 to ASK.PLUGIN.12; on add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.',
      'Check the license against PLUGIN.licenses (LAW.PLUGIN.4): an identifier in the list, or a compound expression of listed identifiers joined by OR or AND, passes; anything else is refused with the list printed and the question asked again.',
      'Write the `shell`: dtd/<name>.dtd at the plugin root with the header (PLUGIN.shell.header), one parameter entity per creation set to INCLUDE or IGNORE, one conditional section per creation declaring that creation\'s domain elements and entities, the nesting override, the element integration, and the cc-core include; render one `domain` per creation with its keyword (LAW.PLUGIN.1, LAW.PLUGIN.2).',
      'Write the tree in the chosen layout: the directories the loader reads for every creation under INCLUDE and none for one under IGNORE, a README with the roster, a CHANGELOG with the first version, the license file for the chosen expression; render one `component` per file with its kind, path and bytes; every file UTF-8 LF without BOM with the SPDX header where a comment is allowed.',
      'Render the `manifests`: one `manifest` for plugin.json and, when chosen, one for the marketplace.json entry, each written from the shell declarations and parsed back (LAW.PLUGIN.5); render the `license` with its expression and its source.',
      'Render one `instruction` per creation under INCLUDE (LAW.PLUGIN.6): goal, the plugin root and name; step, the creator command to run next with its arguments, in the order monitor, moe, router, ot, db, mcp, workflow, skill, hook, command, agent.',
      'Run the proof (LAW.PLUGIN.7): rdc check on every file written, JSON.parse on every manifest, and a read of the tree that shows one creation under IGNORE absent from the bundle and the manifests; render the `proof` with tripped yes; a proof that did not trip stops the command before the report.',
      'Report the shell, the bundle, the manifests, the license, the instructions, the proof and the assumptions; record the run under artifacts at the plugin root with this command\'s generated name (LAW.PLUGIN.8).',
    ],
    map: {
      args: '**🧩 Args**, the launch walk: count, the flags, the positional words',
      intake: '**🧩 Intake**, each `round` n of 3 with its questions and the labels or Other text chosen, the multi-select creations as chosen, the `impactful` selections when asked for, the gate choice',
      shell: '**🧩 Shell**, the shell DTD written and one line per creation with INCLUDE or IGNORE',
      bundle: '**🧩 Bundle**, one line per file written with kind, path and bytes',
      manifests: '**🧩 Manifests**, plugin.json and the marketplace.json entry as written and parsed back',
      license: '**🧩 License**, the SPDX expression, curated or compound, and the files it heads',
      instruction: '**🧩 Instruction**, one per chosen creation: the goal and the creator command to run next',
      proof: '**🧩 Proof**, the check run, the manifests parsed, the excluded creation shown absent, tripped yes or no',
      assumption_made: '**🧩 Assumptions Made**, every ASK.PLUGIN.* question not asked, with the first option taken',
    },
    template: `### 🧩 Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### 🧩 Intake

- round 1 of 3: Name, Creations A, Creations B, Creations C answered [labels, the multi-selects listed, or Other text]
- round 2 of 3: [when asked]
- round 3 of 3: [when asked]
- gate: [start|more|add|impactful] (round N)

### 🧩 Shell

\`dtd/<name>.dtd\`: header [MODULE VERSION DATE]; monitor [INCLUDE|IGNORE]; moe [..]; router [..]; ot [..]; db [..]; mcp [..]; workflow [..]; skill [..]; hook [..]; command [..]; agent [..]

### 🧩 Bundle

- [kind] [path] ([bytes] B, LF, no BOM)

### 🧩 Manifests

- plugin.json: [path], parsed back, name [..] version [..] license [..]
- marketplace.json entry: [path], parsed back, or not chosen

### 🧩 License

[SPDX expression] ([curated|compound]); heads [n] files

### 🧩 Instruction

- [creation]: goal [the plugin root and name]; step: run [creator command] [arguments]

### 🧩 Proof

rdc check [n] files, 0 failing; manifests parsed [n]; excluded [creation] absent from bundle and manifests; tripped yes

### 🧩 Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Round one ran before any file was written; the creation questions were multi-select and All of them selected every creation',
      'The shell carries one conditional section per creation with the keyword the intake chose, and an excluded creation appears nowhere else',
      'The license is a curated identifier or a compound of curated identifiers, and it heads every file that allows a comment',
      'The manifests were rendered from the shell and parsed back',
      'One instruction per chosen creation names its creator command; this command forged none of them itself',
      'The proof tripped: check clean, manifests parsed, one excluded creation shown absent',
    ],
  },

  'create-moe': {
    new: true, to: 'src/commands/create-moe-dtd.md', root: 'moe_creation', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: create a mixture of lenses through twelve questions in three rounds: a roster declared once, one element per lens, lane and verdict vocabularies, the voice block content model, an optional formula layer, an environment vocabulary, an exclusion list, and a checker that holds the roster and the agent files identical in both directions, tripped before it ships',
    argumentHint: '[what the lenses are for, or leave blank; --no-gate for autonomous defaults; --verbose prints the roster as written]',
    model: [
      'moe_creation (args, intake, roster, contract, checker, proof, assumption_made*)',
      'roster (lens+)', 'lens (#PCDATA)', 'contract (#PCDATA)', 'checker (#PCDATA)', 'proof (#PCDATA)',
    ],
    attlist: [
      'lens name NMTOKEN #REQUIRED element CDATA #REQUIRED sigil CDATA #REQUIRED bound CDATA #REQUIRED',
      'contract file CDATA #REQUIRED lanes CDATA #REQUIRED verdicts CDATA #REQUIRED',
      'checker file CDATA #REQUIRED directions (both) #FIXED "both"',
      'proof tripped (yes|no) #REQUIRED',
    ],
    entities: {
      'ASK.MOE.1': 'Name|What is the mixture called?|A kebab-case name from the argument|The name of the plugin it belongs to|A name typed under Other|Undecided, ask again after the roster',
      'ASK.MOE.2': 'Lenses|How many lenses?|Nine, the roster of rot-voice.dtd as the model|Five|Three|A number typed under Other',
      'ASK.MOE.3': 'Charters|Where do the charters come from?|One line each from the argument and the conversation, three nouns joined by a times sign and the lane it leads|Borrowed from the nine of rot-voice.dtd and renamed|Typed under Other, one per lens|Left blank, which this command refuses',
      'ASK.MOE.4': 'Bounds|What may each lens never do?|One may-never clause per lens, written verbatim into its file|One clause for all|None, which this command refuses|Typed under Other',
      'ASK.MOE.5': 'Lanes|Which lanes route the turn?|The ten lanes of rot-voice.dtd|Five lanes|One lane per lens|Typed under Other',
      'ASK.MOE.6': 'Verdicts|Which adjudication verdicts?|CONFIRM, OVERRIDE, BOOST, FUSE, ELEVATE|CONFIRM and OVERRIDE only|None, the lenses speak without a verdict|Typed under Other',
      'ASK.MOE.7': 'Frame|Who speaks the frame line?|A router hook the operator arms by hand, printing measured fields|The convening model itself|No frame, stanzas only|Typed under Other',
      'ASK.MOE.8': 'Formula|Does each lens carry a computation layer?|Yes, YAML in a CDATA block under a NOTATION that names the executable it is verified against|No formula|Typed under Other|Later',
      'ASK.MOE.9': 'Environment|Is there a configuration vocabulary?|Yes, ENV entities name, values, effect, read from a KEY=VALUE file that is parsed, never sourced|No configuration|Typed under Other|Later',
      'ASK.MOE.10': 'Exclusions|What may no lens file carry?|A declared list of markers the checker greps for and refuses|None|Typed under Other|Later',
      'ASK.MOE.11': 'Checker|How is the roster held to the files?|Both directions: every declared lens has a file, every file speaks only in its element, nothing undeclared speaks, with a negative control|One direction only|None, which this command refuses|Typed under Other',
      'ASK.MOE.12': 'License|Which SPDX header heads its files?|AGPL-3.0-or-later OR EUPL-1.2, the repository license|MIT|Apache-2.0|Typed under Other',
      'MOE.roster.format': 'name|element|sigil|charter|tools|bound',
    },
    laws: {
      'MOE.1': 'The roster is declared once, one LENS entity per lens in the MOE.roster.format shape, and read by the checker; a lens not in the roster does not exist and a roster line without a file is a failure.',
      'MOE.2': 'A lens speaks only inside its own declared element; analysis is PCDATA and anything quoted from tool output is CDATA behind the fence; a stanza outside its element is refused by the checker.',
      'MOE.3': 'The voice block is one frame element then zero or more lens stanzas in roster order; every lane, verdict and band string the frame may utter is a declared entity.',
      'MOE.4': 'A formula layer, when chosen, is YAML inside a CDATA marked section under a NOTATION that names the executable it is verified against; a formula the checker cannot re-derive from that executable is not declared.',
      'MOE.5': 'Nothing is written before the gate chose start; every question not asked takes its first option and is listed as an assumption_made; the charters and bounds are never left blank.',
      'MOE.6': 'The checker runs both directions and ships with a negative control that plants an undeclared lens file, a roster line without a file and a stanza outside its element, and shows all three refused; a mixture whose control did not trip is not created.',
      'MOE.7': 'The SPDX identifier chosen in the intake heads every file written.',
    },
    objective: `Create a mixture of lenses for ${ARGS} (or ask what it is for): the roster, the voice contract, one agent file per lens, and the checker that holds them identical.

The model is rot-voice.dtd: nine lens elements, a LENS roster of name, element, sigil, charter, tools and bound, LANE and NSIL and BAND vocabularies, a voice block whose content model is one frame then stanzas in roster order, a formula layer as CDATA under a NOTATION that names what it is verified against, an ENV vocabulary, an EXCLUDE list, and checker/voice-contract.sh reading the roster in both directions. This command asks the twelve questions that decide those parts, writes the contract, the files and the checker, and runs the checker with its negative control before it reports.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and the purpose; render the walk under \`args\`. A mixture is a create- command, so round one always runs (LAW.ASK.10).`,
      'Round 1 of 3: ask ASK.MOE.1 to ASK.MOE.4 as one AskUserQuestion call, four options each plus Other; render the round.',
      'Present the gate; on more, round 2 of 3 with ASK.MOE.5 to ASK.MOE.8; on more again, round 3 of 3 with ASK.MOE.9 to ASK.MOE.12; on add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.',
      'Render the `roster`: one `lens` per lens with its name, element, sigil, charter and bound; the sigils are unique and declared as glyphs.',
      'Write the `contract`: dtd/<name>-voice.dtd with the frame and quoted elements, one element per lens, the LENS entities, the lane, verdict and band entities, the voice block content model, the formula NOTATION when chosen, the ENV and EXCLUDE entities when chosen, the LAW entities for every promise the intake made, and the cc-core include (LAW.MOE.1 to LAW.MOE.4).',
      'Write one agent file per lens under agents/: frontmatter with name, description and tools, the charter, the bound clause verbatim, and the rule that it speaks only inside its element (LAW.MOE.2); every file with the SPDX header (LAW.MOE.7).',
      'Write the `checker`: checker/<name>-voice-contract.sh reading the roster from the contract, holding files and declarations identical in both directions, grepping the exclusions, and carrying its negative control.',
      'Run the checker in the foreground under a timeout with stdin closed: the written tree passes; then plant an undeclared lens file, remove a declared file, and insert a stanza outside its element in a scratch copy, and show each refused (LAW.MOE.6); render the `proof` with tripped yes; a control that did not trip stops the command before the report.',
    ],
    map: {
      args: '**🎛️ Args**, the launch walk: count, the flags, the positional words',
      intake: '**🎛️ Intake**, each `round` n of 3 with its questions and the labels or Other text chosen, the `impactful` selections when asked for, the gate choice',
      roster: '**🎛️ Roster**, one line per lens: name, element, sigil, charter, bound',
      contract: '**🎛️ Contract**, the voice DTD written, its lanes and verdicts',
      checker: '**🎛️ Checker**, the checker script written and its two directions',
      proof: '**🎛️ Proof**, the checker run as executed: pass on the tree, three plants refused, tripped yes or no',
      assumption_made: '**🎛️ Assumptions Made**, every ASK.MOE.* question not asked, with the first option taken',
    },
    template: `### 🎛️ Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### 🎛️ Intake

- round 1 of 3: Name, Lenses, Charters, Bounds answered [labels or Other text]
- round 2 of 3: [when asked]
- round 3 of 3: [when asked]
- gate: [start|more|add|impactful] (round N)

### 🎛️ Roster

- [name] | [element] | [sigil] | [charter] | may never [bound]
- [one line per lens]

### 🎛️ Contract

\`dtd/<name>-voice.dtd\`: lanes [..]; verdicts [..]; formula [yes|no]; env [n entities]; exclusions [n]

### 🎛️ Checker

\`checker/<name>-voice-contract.sh\`: declared lens has file [yes]; file speaks only in its element [yes]; nothing undeclared speaks [yes]

### 🎛️ Proof

tree passed; planted undeclared file refused; missing file refused; stanza outside element refused; tripped yes

### 🎛️ Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Round one ran before any file was written',
      'Every lens has a file, every file speaks only in its element, and the roster is declared once',
      'The checker ran both directions and its three plants were refused',
      'Every file written carries the chosen SPDX identifier',
    ],
  },

  'create-router': {
    new: true, to: 'src/commands/create-router-dtd.md', root: 'router_creation', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: create a router through twelve questions in three rounds: a classification scheme of subjects to lanes, a route tree with ids and labels, shortcut tokens bound to targets, a declared state machine, a measured method that is never a second model, a hook the operator arms by hand, and a control with a fixture prompt per subject',
    argumentHint: '[what is routed and where, or leave blank; --no-gate for autonomous defaults; --debug prints the gauge per fixture]',
    model: [
      'router_creation (args, intake, scheme, routes, shortcuts, state, proof, assumption_made*)',
      'scheme (subject+)', 'subject (#PCDATA)', 'routes (route+)', 'route (#PCDATA)', 'shortcuts (shortcut*)', 'shortcut (#PCDATA)', 'state (#PCDATA)', 'proof (#PCDATA)',
    ],
    attlist: [
      'subject key NMTOKEN #REQUIRED lane CDATA #REQUIRED aliases CDATA #IMPLIED',
      'route id NMTOKEN #REQUIRED label CDATA #REQUIRED target CDATA #REQUIRED',
      'shortcut code CDATA #REQUIRED target CDATA #REQUIRED',
      'state kind (stateless|counter|registration) "stateless" expires CDATA #IMPLIED',
      'proof tripped (yes|no) #REQUIRED',
    ],
    entities: {
      'ASK.ROUTER.1': 'Name|What is the router called?|A kebab-case name from the argument|The name of the plugin it belongs to|A name typed under Other|Undecided, ask again after the scheme',
      'ASK.ROUTER.2': 'Input|What does it classify?|The prompt text at UserPromptSubmit|The tool stream at PreToolUse and PostToolUse|Both|Typed under Other',
      'ASK.ROUTER.3': 'Scheme|Where do the subjects come from?|The roster of commands, one subject per command family|A taxonomy typed under Other|The lanes of a mixture of lenses|Undecided',
      'ASK.ROUTER.4': 'Method|How is a subject decided?|A measured keyword gauge with declared weights per subject|One declared regular expression per subject|A second model call, which this command refuses|Typed under Other',
      'ASK.ROUTER.5': 'Targets|What does a route point at?|Commands, by their slash name|Agents|Lanes of a mixture|Typed under Other',
      'ASK.ROUTER.6': 'Shortcuts|Which shortcut tokens?|The three of cc-args, verbose, debug and arguments, and no more|Those plus one code per route|None|Typed under Other',
      'ASK.ROUTER.7': 'Aliases|Do subjects have alternate spellings?|Yes, declared per subject in the gschema aliases shape|No|Typed under Other|Later',
      'ASK.ROUTER.8': 'State|What state does it keep?|None, every prompt is classified alone|A counter per route|A registration per subject with an expiry|Typed under Other',
      'ASK.ROUTER.9': 'Emission|What does it print?|One frame line with the subject, the lane and the measured fields|JSON records to a sink file|Both|Nothing',
      'ASK.ROUTER.10': 'Wiring|How does it run?|A UserPromptSubmit hook the operator arms by hand, never by an install|By hand, on a prompt text given as an argument|As a monitor, which this command refuses|Typed under Other',
      'ASK.ROUTER.11': 'Control|How is it proven?|One fixture prompt per subject routes to its lane and an unknown prompt to the default, tripped|A single fixture|None, which this command refuses|Typed under Other',
      'ASK.ROUTER.12': 'License|Which SPDX header heads its files?|AGPL-3.0-or-later OR EUPL-1.2, the repository license|MIT|Apache-2.0|Typed under Other',
      'ROUTER.default': 'the default lane, taken when no subject scores',
    },
    laws: {
      'ROUTER.1': 'The classification is a declared scheme, one subject element per subject with its lane and its aliases, read by the router code from the contract; a subject the code knows and the contract does not is a failure in either direction.',
      'ROUTER.2': 'The method is measured: declared weights or declared expressions applied to the input; a second model call is never a method, and the frame line prints the numbers the decision was made from.',
      'ROUTER.3': 'The shortcut vocabulary is closed: the three tokens of cc-args and, when chosen, one code per route bound to one target, in the accelerator shape; a token outside the vocabulary is data.',
      'ROUTER.4': 'The state machine is declared: stateless, a counter per route, or a registration per subject with an expiry; a router keeps no state its contract does not name.',
      'ROUTER.5': 'The router arms nothing itself: its hook is registered only by the operator, by hand, and every run ends at a declared ceiling; it never runs as a monitor.',
      'ROUTER.6': 'Nothing is written before the gate chose start; every question not asked takes its first option and is listed as an assumption_made; the control routes one fixture per subject and an unknown prompt to ROUTER.default, and a router whose control did not trip is not created.',
      'ROUTER.7': 'The SPDX identifier chosen in the intake heads every file written.',
    },
    objective: `Create a router for ${ARGS} (or ask what is routed): the scheme, the route tree, the shortcuts, the state, the code and the control.

The shapes come from the examples: a classification map of subjects to lanes, a menu tree of routes with ids and labels, accelerator items binding a code to a target, a settings schema with aliases per subject, a registration state with an expiry. The method is measured, never a second model, in the way the RoT MoE router gauges a turn: weights and counts printed beside the decision. The router is armed only by the operator and proven by a fixture per subject.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and the purpose; render the walk under \`args\`. A router is a create- command, so round one always runs (LAW.ASK.10).`,
      'Round 1 of 3: ask ASK.ROUTER.1 to ASK.ROUTER.4 as one AskUserQuestion call, four options each plus Other; render the round.',
      'Present the gate; on more, round 2 of 3 with ASK.ROUTER.5 to ASK.ROUTER.8; on more again, round 3 of 3 with ASK.ROUTER.9 to ASK.ROUTER.12; on add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.',
      'Render the `scheme`: one `subject` per subject with its key, its lane and its aliases; render the `routes`: one `route` per target with id, label and target; render the `shortcuts`: one `shortcut` per code with its target (LAW.ROUTER.1, LAW.ROUTER.3); render the `state` with its kind and expiry (LAW.ROUTER.4).',
      'Write the contract dtd/<name>-router.dtd: the scheme, the routes, the shortcuts, the state, ROUTER.default, the lane entities, and a LAW entity per promise the intake made; include cc-core.',
      'Write the code hooks/<name>-router.mjs: read the scheme from the contract, apply the declared method to the input, print the chosen emission with the measured fields, keep the declared state and no other, and exit at a ceiling (LAW.ROUTER.2, LAW.ROUTER.5); never arm it; print the arm command the operator may run.',
      'Write the control checker/<name>-router-controls.sh: one fixture prompt per subject expected to land on its lane, one unknown prompt expected to land on ROUTER.default, each run in the foreground under a timeout with stdin closed; run it and render the `proof` with tripped yes (LAW.ROUTER.6); a control that did not trip stops the command before the report.',
    ],
    map: {
      args: '**🚦 Args**, the launch walk: count, the flags, the positional words',
      intake: '**🚦 Intake**, each `round` n of 3 with its questions and the labels or Other text chosen, the `impactful` selections when asked for, the gate choice',
      scheme: '**🚦 Scheme**, one line per subject: key, lane, aliases',
      routes: '**🚦 Routes**, one line per route: id, label, target',
      shortcuts: '**🚦 Shortcuts**, one line per code and its target, or none',
      state: '**🚦 State**, the kind and the expiry',
      proof: '**🚦 Proof**, the control run as executed: each fixture and where it landed, the unknown prompt on the default, tripped yes or no',
      assumption_made: '**🚦 Assumptions Made**, every ASK.ROUTER.* question not asked, with the first option taken',
    },
    template: `### 🚦 Args

count [n]; debug [0|1]; words [each positional word]

### 🚦 Intake

- round 1 of 3: Name, Input, Scheme, Method answered [labels or Other text]
- round 2 of 3: [when asked]
- round 3 of 3: [when asked]
- gate: [start|more|add|impactful] (round N)

### 🚦 Scheme

- [key]: lane [lane]; aliases [..]

### 🚦 Routes

- [id]: [label] to [target]

### 🚦 Shortcuts

- [code] to [target], or none

### 🚦 State

[stateless|counter|registration], expires [..]

### 🚦 Proof

- fixture [subject]: landed [lane]
- unknown prompt: landed [default lane]
tripped yes

### 🚦 Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Round one ran before any file was written',
      'The scheme, the routes, the shortcuts and the state are declared in the contract and read by the code',
      'The method printed the numbers it decided from; no second model was called',
      'The router armed nothing; the control routed every fixture and the unknown prompt as declared',
    ],
  },

  'create-db': {
    new: true, to: 'src/commands/create-db-dtd.md', root: 'db_creation', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: create a database layer through twelve questions in three rounds: records with numbered append-only fields twinned with a sequence model, a store kind from a cat-readable TSV to SQLite to a vector store, one runtime module per kind, a schema verifier, and a control that writes, reads back and refuses a torn row',
    argumentHint: '[what is stored, or leave blank; --no-gate for autonomous defaults; --debug prints every query run]',
    model: [
      'db_creation (args, intake, schema, store, migration, proof, assumption_made*)',
      'schema (record+)', 'record (field+)', 'field (#PCDATA)', 'store (#PCDATA)', 'migration (#PCDATA)', 'proof (#PCDATA)',
    ],
    attlist: [
      'record name NMTOKEN #REQUIRED file CDATA #REQUIRED',
      'field n CDATA #REQUIRED name NMTOKEN #REQUIRED type (atom|integer|float|text|list|tuple|record|map|blob|vector) #REQUIRED since CDATA #REQUIRED key (none|primary|foreign|index|unique) "none"',
      'store kind (tsv|json|sqlite|duckdb|postgres|chroma|lancedb) #REQUIRED path CDATA #REQUIRED',
      'migration policy (append-only) #FIXED "append-only"',
      'proof tripped (yes|no) #REQUIRED',
    ],
    entities: {
      'ASK.DB.1': 'Name|What is the layer called?|A kebab-case name from the argument|The name of the plugin it belongs to|A name typed under Other|Undecided, ask again after the records',
      'ASK.DB.2': 'Store|Which store kind?|A TSV a human can cat, append-only|SQLite through node:sqlite|A vector store, Chroma or LanceDB|DuckDB or Postgres, typed under Other',
      'ASK.DB.3': 'Records|What records does it hold?|The records named in the argument|A ledger of runs, one row per run|A glossary of terms with definitions and locators|Typed under Other',
      'ASK.DB.4': 'Fields|How are fields declared?|Numbered from one, dense, each with a type and the version it appeared in|Free columns, which this command refuses|Typed under Other|Later',
      'ASK.DB.5': 'Keys|Which keys?|One primary key per record and an index per lookup field|A primary key only|None|Typed under Other',
      'ASK.DB.6': 'Types|Which type set?|atom, integer, float, text, list, tuple, record, map, blob, vector|SQL types, mapped onto that set|JSON values only|Typed under Other',
      'ASK.DB.7': 'Runtime|What runs it?|Node built-ins only, one module per store kind|A named client package|Shell tools, sqlite3 or psql|Typed under Other',
      'ASK.DB.8': 'Migration|How does the schema change?|Fields are appended, numbers never reused, since never decreases|In place, which this command refuses|Typed under Other|Later',
      'ASK.DB.9': 'Reading|Can a human read it?|Yes, a cat-readable TSV form is kept beside every binary store|Binary only|Typed under Other|Later',
      'ASK.DB.10': 'Channels|Which channels are declared?|parsed-tsv and append-only-log as NOTATIONs, the files as NDATA entities|None|Typed under Other|Later',
      'ASK.DB.11': 'Control|How is it proven?|Write a row, read it back, refuse a torn row, verify dense numbers and column counts, tripped|Write and read only|None, which this command refuses|Typed under Other',
      'ASK.DB.12': 'License|Which SPDX header heads its files?|AGPL-3.0-or-later OR EUPL-1.2, the repository license|MIT|Apache-2.0|Typed under Other',
      'DB.field.format': 'n=name:type@since',
    },
    laws: {
      'DB.1': 'Every record is declared twice and the two are cross-checked: a RECORD entity of numbered fields in the DB.field.format shape, and a sequence element naming the same fields in the same order; where they disagree neither is trusted.',
      'DB.2': 'Field numbers are dense from one, never reused, and since never decreases as the number grows; a schema that fails one of the three is refused by the verifier.',
      'DB.3': 'The store kind is an enumeration and each kind has one runtime module; a row is written through the module and read back through it, and a cat-readable form is kept beside every binary store when the intake chose reading.',
      'DB.4': 'A torn row, one whose column count differs from the highest field number, is refused on read and named with its line; it is never silently skipped.',
      'DB.5': 'Migration is append-only: a field is added at the end with the version it appeared in; a rewrite of an existing field is refused and printed as a plan the operator runs.',
      'DB.6': 'Nothing is written before the gate chose start; every question not asked takes its first option and is listed as an assumption_made; the control writes, reads back, plants a torn row and shows it refused, and a layer whose control did not trip is not created.',
      'DB.7': 'The SPDX identifier chosen in the intake heads every file written.',
    },
    objective: `Create a database layer for ${ARGS} (or ask what is stored): the schema contract, the store, the runtime module, the verifier and the control.

The discipline is the one the trust contract of RoT DTD GOAL learned from column drift: fields are numbered, numbers are never reused, new fields are appended with the version they appeared in, and the numbered declaration is twinned with a sequence element so a typo in either is caught by the other. The vocabulary is DocBook's database classes and EDoc's type set; the constraints are XSD facets; the channels are NOTATIONs. From a TSV a human can cat to SQLite to a vector store is one enumeration on the store kind, with one module and one control per kind.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and what is stored; render the walk under \`args\`. A layer is a create- command, so round one always runs (LAW.ASK.10).`,
      'Round 1 of 3: ask ASK.DB.1 to ASK.DB.4 as one AskUserQuestion call, four options each plus Other; render the round.',
      'Present the gate; on more, round 2 of 3 with ASK.DB.5 to ASK.DB.8; on more again, round 3 of 3 with ASK.DB.9 to ASK.DB.12; on add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.',
      'Render the `schema`: one `record` per record with its file, and one `field` per field with n, name, type, since and key (LAW.DB.1, LAW.DB.2); render the `store` with its kind and path; render the `migration` with its policy (LAW.DB.5).',
      'Write the contract dtd/<name>-schema.dtd: the RECORD entities in DB.field.format, the twin sequence elements, the store enumeration, the NOTATIONs and NDATA entities when chosen, and a LAW entity per promise the intake made; include cc-core.',
      'Write the module lib/<name>-store.mjs for the chosen kind: write a row, read rows, refuse a torn row with its line, keep the cat-readable form when chosen (LAW.DB.3, LAW.DB.4); write the verifier checker/<name>-schema.mjs: dense numbers, since monotone, twin agreement, live column counts.',
      'Run the control in the foreground under a timeout with stdin closed: write one row, read it back equal, plant a torn row in a scratch copy and show it refused, run the verifier on the schema and on a mutated copy with a gap and show the gap named; render the `proof` with tripped yes (LAW.DB.6); a control that did not trip stops the command before the report.',
    ],
    map: {
      args: '**🗄️ Args**, the launch walk: count, the flags, the positional words',
      intake: '**🗄️ Intake**, each `round` n of 3 with its questions and the labels or Other text chosen, the `impactful` selections when asked for, the gate choice',
      schema: '**🗄️ Schema**, one block per record with its numbered fields',
      store: '**🗄️ Store**, the kind, the path, the module',
      migration: '**🗄️ Migration**, the policy and the version fields appear in',
      proof: '**🗄️ Proof**, the control run as executed: row written and read back, torn row refused, gap named, tripped yes or no',
      assumption_made: '**🗄️ Assumptions Made**, every ASK.DB.* question not asked, with the first option taken',
    },
    template: `### 🗄️ Args

count [n]; debug [0|1]; words [each positional word]

### 🗄️ Intake

- round 1 of 3: Name, Store, Records, Fields answered [labels or Other text]
- round 2 of 3: [when asked]
- round 3 of 3: [when asked]
- gate: [start|more|add|impactful] (round N)

### 🗄️ Schema

- record [name] ([file]): 1=[name]:[type]@[since] [key]; 2=[..]; [..]

### 🗄️ Store

[tsv|json|sqlite|duckdb|postgres|chroma|lancedb] at [path]; module \`lib/<name>-store.mjs\`; cat-readable form [yes|no]

### 🗄️ Migration

append-only; highest field [n]; since [versions]

### 🗄️ Proof

wrote 1 row, read back equal; torn row at line [n] refused; verifier: schema ok, mutated copy gap named; tripped yes

### 🗄️ Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Round one ran before any file was written',
      'Every record is declared twice and the two agree; numbers are dense and since is monotone',
      'The torn row was refused with its line and the mutated schema was refused with its gap',
      'Every file written carries the chosen SPDX identifier',
    ],
  },

  'create-ot-variants': {
    new: true, to: 'src/commands/create-ot-variants-dtd.md', root: 'ot_creation', include: ['cc-args', 'cc-ask'],
    description: 'DTD-native: create X-of-Thought variants (chain, tree, graph, skeleton, program, algorithm, buffer, everything) as commands through twelve questions in three rounds: each variant a productionset for its thought structure and a procedure for its walk, every step with a certainty degree and its alternatives, a control that walks a fixture problem through each variant',
    argumentHint: '[which variants and for what, or leave blank; --no-gate for autonomous defaults; --verbose prints every walk]',
    model: [
      'ot_creation (args, intake, variants, grammar, walk, proof, assumption_made*)',
      'variants (variant+)', 'variant (#PCDATA)', 'grammar (production+)', 'production (#PCDATA)', 'walk (step+)', 'step (#PCDATA)', 'proof (#PCDATA)',
    ],
    attlist: [
      'variant kind (chain|tree|graph|skeleton|program|algorithm|buffer|everything) #REQUIRED name NMTOKEN #REQUIRED depth CDATA #REQUIRED branching CDATA "1"',
      'production lhs NMTOKEN #REQUIRED rhs CDATA #REQUIRED',
      'step n CDATA #REQUIRED performance (optional|required) "required" degree CDATA #IMPLIED alternatives CDATA #IMPLIED',
      'proof tripped (yes|no) #REQUIRED',
    ],
    entities: {
      'ASK.OT.1': 'Name|What is the family called?|A kebab-case stem from the argument, each variant adds its kind|The name of the plugin it belongs to|A name typed under Other|Undecided, ask again after the variants',
      'ASK.OT.2': 'Variants A|Which variants? Pick any, this is one of two lists.|All eight|Chain of thought|Tree of thought|Graph of thought',
      'ASK.OT.3': 'Variants B|Which variants? Second list.|Skeleton of thought|Program of thought|Algorithm of thought|Buffer of thought and everything of thought',
      'ASK.OT.4': 'Grammar|How is a variant\'s structure declared?|A productionset per variant, lhs and rhs, the walk derived from it|A prose description, which this command refuses|Typed under Other|Later',
      'ASK.OT.5': 'Depth|How many steps per walk?|Five|Three|Seven|A number typed under Other',
      'ASK.OT.6': 'Branching|How many branches at a node, where the variant branches?|Two|Three|Typed under Other|One, no branching',
      'ASK.OT.7': 'Pruning|How is a branch dropped?|By a declared certainty degree per step, below a declared floor|Never, every branch is walked|Typed under Other|Later',
      'ASK.OT.8': 'Rendering|How is a walk shown?|One heading per step with the variant sigil, alternatives indented|A table of steps|A text drawing of the tree|Typed under Other',
      'ASK.OT.9': 'Buffer|Where do reusable templates live?|A declared file of templates the buffer variant reads and the others may cite|Nowhere, no buffer|Typed under Other|Later',
      'ASK.OT.10': 'Annotation|Is each step annotated?|Yes, an interpretation per step in the analysis shape, span from to|No|Typed under Other|Later',
      'ASK.OT.11': 'Control|How is it proven?|A fixture problem walked by every variant, every walk matching its grammar, tripped by a walk that skips a required step|One variant walked|None, which this command refuses|Typed under Other',
      'ASK.OT.12': 'License|Which SPDX header heads its files?|AGPL-3.0-or-later OR EUPL-1.2, the repository license|MIT|Apache-2.0|Typed under Other',
      'OT.kinds': 'chain, tree, graph, skeleton, program, algorithm, buffer, everything',
    },
    laws: {
      'OT.1': 'Each variant is one command whose DOCTYPE declares its productions, lhs and rhs, and its walk as a procedure of steps; a walk that is not derivable from the productions is a failed answer.',
      'OT.2': 'Every step carries its number, whether it is required or optional, its certainty degree when pruning was chosen, and its alternatives when the variant branches; the depth and the branching are declared numbers, never a feeling.',
      'OT.3': 'The buffer variant reads its templates from the declared file and every other variant cites that file when it reuses one; a template not in the file is not a template.',
      'OT.4': 'Nothing is written before the gate chose start; every question not asked takes its first option and is listed as an assumption_made; the two variant questions are multi-select and All eight selects every kind in OT.kinds.',
      'OT.5': 'The control walks one fixture problem through every variant written, checks each walk against its grammar, and plants a walk that skips a required step to show it refused; a family whose control did not trip is not created.',
      'OT.6': 'The SPDX identifier chosen in the intake heads every file written.',
    },
    objective: `Create a family of X-of-Thought variants for ${ARGS} (or ask which): one command per variant, a shared contract, and a control that walks a fixture through each.

The shapes are DocBook's: a productionset of lhs and rhs for the thought structure of each variant, a procedure of steps with substeps and step alternatives for its walk, a certainty degree per step from TEI, an interpretation per step from the analysis module. Chain walks a line, tree branches and prunes, graph joins branches, skeleton lays the frame then fills it, program writes and runs code for a step, algorithm searches, buffer reuses templates from a declared file, everything combines them; each is declared, none is described.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags, the stem and the kinds; render the walk under \`args\`. A family is a create- command, so round one always runs (LAW.ASK.10).`,
      'Round 1 of 3: ask ASK.OT.1 to ASK.OT.4 as one AskUserQuestion call, four options each plus Other, questions 2 and 3 multi-select (LAW.OT.4); render the round.',
      'Present the gate; on more, round 2 of 3 with ASK.OT.5 to ASK.OT.8; on more again, round 3 of 3 with ASK.OT.9 to ASK.OT.12; on add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.',
      'Render the `variants`: one `variant` per chosen kind with its name, depth and branching; render the `grammar`: one `production` per rule of each variant (LAW.OT.1); render the `walk` for the fixture: one `step` per step with its performance, degree and alternatives (LAW.OT.2).',
      'Write the shared contract dtd/<stem>-ot.dtd: the kind enumeration, the productions, the step element, the certainty attribute, the buffer file as an NDATA entity when chosen, and a LAW entity per promise the intake made; include cc-core.',
      'Write one command per variant, commands/<stem>-<kind>-dtd.md, whose DOCTYPE includes the shared contract and declares its own productions and walk, whose grammar map renders one heading per step with the variant sigil, and whose SPDX header is the chosen one (LAW.OT.6); write the buffer file when chosen (LAW.OT.3).',
      'Run the control in the foreground under a timeout with stdin closed: walk the fixture through every variant written, check each walk against its grammar with rdc check on the command file and a step-by-step match, plant a walk that skips a required step in a scratch copy and show it refused; render the `proof` with tripped yes (LAW.OT.5); a control that did not trip stops the command before the report.',
    ],
    map: {
      args: '**🧠 Args**, the launch walk: count, the flags, the positional words',
      intake: '**🧠 Intake**, each `round` n of 3 with its questions and the labels or Other text chosen, the multi-select variants as chosen, the `impactful` selections when asked for, the gate choice',
      variants: '**🧠 Variants**, one line per variant: kind, name, depth, branching',
      grammar: '**🧠 Grammar**, the productions per variant, lhs and rhs',
      walk: '**🧠 Walk**, the fixture walked: one line per step with performance, degree and alternatives',
      proof: '**🧠 Proof**, the control run as executed: each variant walked and matched, the skipped step refused, tripped yes or no',
      assumption_made: '**🧠 Assumptions Made**, every ASK.OT.* question not asked, with the first option taken',
    },
    template: `### 🧠 Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### 🧠 Intake

- round 1 of 3: Name, Variants A, Variants B, Grammar answered [labels, the multi-selects listed, or Other text]
- round 2 of 3: [when asked]
- round 3 of 3: [when asked]
- gate: [start|more|add|impactful] (round N)

### 🧠 Variants

- [kind]: \`commands/<stem>-<kind>-dtd.md\`, depth [n], branching [n]

### 🧠 Grammar

- [kind]: [lhs] = [rhs]; [lhs] = [rhs]

### 🧠 Walk

- step 1 (required, degree [..]): [..]; alternatives [..]
- [one line per step of the fixture walk]

### 🧠 Proof

- [kind]: walked [n] steps, matched its grammar
- planted walk skipping a required step: refused
tripped yes

### 🧠 Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Round one ran before any file was written; the variant questions were multi-select and All eight selected every kind',
      'Every variant is a command whose DOCTYPE declares its productions and its walk',
      'Every step carries its number, performance, degree and alternatives as declared',
      'The control walked the fixture through every variant and the skipped step was refused',
    ],
  },

  ...PROMPT_CREATORS,
};
