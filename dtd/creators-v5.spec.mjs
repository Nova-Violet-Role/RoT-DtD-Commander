// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// dtd/creators-v5.spec.mjs : the amplified creators of 5.0.0.
//
// The six create- commands that were dispatch wrappers (create-agent-skill,
// create-hook, create-slash-command, create-subagent, create-plan) and the
// one that did not exist (create-mcp) become one anatomy from one function:
// twelve questions in three rounds that are never skipped (LAW.ASK.10), a
// curated SPDX license (cc-license), an emoji, a form (cc-form), the expert
// skill invoked once through the Skill tool with the answers as known slots
// after the end token (cc-args), every file read back and guarded, the
// audit run here in the foreground under a ceiling with one rule per code
// (the audit-* dispatch to a subagent absorbed), and a planted fault that
// the audit refuses.
//
//   node bin/rot-dtd-commander.mjs forge dtd/creators-v5.spec.mjs [names...]

const ARGS = '<quoted trust="cdata" source="user-args">$ARGUMENTS</quoted>';

const CREATORS = [
  {
    key: 'create-agent-skill', sigil: '🎓', root: 'skill_forge', prefix: 'SKILL', what: 'a skill', skill: 'create-agent-skills-dtd',
    artifact: 'a SKILL.md with a DOCTYPE and its supporting files', auditKind: 'check', auditor: 'skill-auditor-dtd',
    q: [
      'Name|What is the skill called?|A kebab-case name from the argument, -dtd suffixed|The name of the domain it teaches|Typed under Other|Undecided, ask again after the purpose',
      'Purpose|What does the skill make a session able to do?|The one competence named in the argument|A reference shelf of documents it points at|A procedure with a declared output grammar|Typed under Other',
      'Trigger|When does it load?|When the description phrases match the task, written as when-clauses|Only when named by hand|When a create- command invokes it|Typed under Other',
      'Structure|Which files?|SKILL.md alone|SKILL.md and references|SKILL.md, references and scripts|SKILL.md, references, scripts and templates',
      'Grammar|Which DOCTYPE?|A root and elements read from the answers, with laws|The dtd-core anatomy copied from a sibling skill|A minimal root with one law|Typed under Other',
    ],
  },
  {
    key: 'create-hook', sigil: '🪝', root: 'hook_forge', prefix: 'HOOK', what: 'a hook', skill: 'create-hooks-dtd',
    artifact: 'a hook script and its settings entry', auditKind: 'hook', auditor: null,
    q: [
      'Name|What is the hook called?|A kebab-case name from the argument|The event and the action it guards, joined|Typed under Other|Undecided, ask again after the event',
      'Event|Which event fires it?|PreToolUse|PostToolUse|Stop|SessionStart or UserPromptSubmit, typed under Other',
      'Matcher|Which tools does it match?|Bash only|Write and Edit|Every tool, no matcher|Typed under Other',
      'Action|What does it do?|Block on a condition and say why on stderr, exit 2|Add context to the transcript, exit 0|Record one line to a ledger, exit 0|Typed under Other',
      'Scope|Where does the settings entry go?|The project settings.json|The user settings.json|A plugin hooks.json|Printed only, installed by hand',
    ],
  },
  {
    key: 'create-slash-command', sigil: '✍️', root: 'command_forge', prefix: 'CMD', what: 'a slash command', skill: 'create-slash-commands-dtd',
    artifact: 'a command file with a DOCTYPE, a trust boundary and a grammar map', auditKind: 'check', auditor: 'slash-command-auditor-dtd',
    q: [
      'Name|What is the command called?|A kebab-case name from the argument, -dtd suffixed|The verb and the object it performs|Typed under Other|Undecided, ask again after the objective',
      'Objective|What does it make the session do?|The one task named in the argument, a verb and an object|A judgement with a declared verdict vocabulary|A dispatch to a skill with the argument quoted|Typed under Other',
      'Arguments|How does it read its arguments?|The cc-args walk: flags removed, the end token, positional words quoted whole|A single free sentence|Named options only|None',
      'Grammar|Which DOCTYPE?|A root and elements read from the answers, with laws|Copied from a sibling command|A minimal root with one law|Typed under Other',
      'Tools|Which tools may it use?|No restriction|Read, Grep and Glob|Read, Grep, Glob and Bash under a ceiling|Typed under Other',
    ],
  },
  {
    key: 'create-subagent', sigil: '🤖', root: 'agent_forge', prefix: 'AGENT', what: 'a subagent', skill: 'create-subagents-dtd',
    artifact: 'an agent file declared as a roster row with a DOCTYPE', auditKind: 'check', auditor: 'subagent-auditor-dtd',
    q: [
      'Name|What is the agent called?|A kebab-case name from the argument, -dtd suffixed|Its office as a noun|Typed under Other|Undecided, ask again after the office',
      'Office|What does it produce?|A report in one declared element|A findings list with file and line|One verdict line|Typed under Other',
      'Tools|Which tools?|Read, Grep and Glob|Read, Grep, Glob and Bash under a ceiling|Read, Write and Edit|Typed under Other',
      'Bound|What may it never do?|Write, delete, commit or background anything|Run anything|Read outside the named directory|Typed under Other',
      "Summons|How is it summoned?|By hand, in the foreground, never in the background|By a creator's audit step, in the foreground|Never by a hook|Typed under Other",
    ],
  },
  {
    key: 'create-plan', sigil: '🗺️', root: 'plan_forge', prefix: 'PLAN', what: 'a plan', skill: 'create-plans-dtd',
    artifact: 'a brief, a roadmap and phase plans whose tasks each carry a verify step', auditKind: 'plan', auditor: null,
    q: [
      'Name|What is the plan called?|A kebab-case name from the argument|The project name and a date|Typed under Other|Undecided, ask again after the kind',
      'Kind|Which documents?|A brief, a roadmap and the phase plans|A brief alone|A roadmap alone|One phase plan',
      'Phases|How many phases?|Three|One|Five|Typed under Other',
      'Verify|What does each task carry?|One verify command with its expected exit code|A checklist line|A file that must exist|Typed under Other',
      'Execution|How is the plan run?|By run-plan-dtd in the foreground, segment by segment|By the operator by hand|By a session that reads the plan file|Typed under Other',
    ],
  },
  {
    key: 'create-mcp', sigil: '🔌', root: 'mcp_forge', prefix: 'MCP', what: 'an MCP server', skill: 'create-mcp-servers-dtd',
    artifact: 'a Model Context Protocol server with its tool schemas and installation', auditKind: 'mcp', auditor: null,
    q: [
      'Name|What is the server called?|A kebab-case name from the argument|The system it fronts, -mcp suffixed|Typed under Other|Undecided, ask again after the language',
      'Language|Which implementation?|TypeScript with the official SDK|Python with the official SDK|Both, TypeScript first|Typed under Other',
      'Transport|Which transport?|stdio|Streamable HTTP|Both|Typed under Other',
      'Tools|How many tools?|One|A few, named under Other|A large API through the large-api pattern of the skill|Typed under Other',
      'Surface|Beyond tools?|Tools only|Tools and resources|Tools, resources and prompts|Typed under Other',
    ],
  },
  {
    key: 'create-workflowjson', sigil: '🧰', root: 'workflow_forge', prefix: 'WF', what: 'a workflow file', skill: null, extraInclude: ['cc-workflow'],
    artifact: 'a JSON workflow of foreground steps under ceilings (WORKFLOW.file), run by node lib/workflow.mjs', auditKind: 'workflow', auditor: null,
    dir: 'WORKFLOW.dir as <name>.workflow.json',
    q: [
      'Name|What is the workflow called?|A kebab-case name from the argument|The job it runs, as a verb and an object|Typed under Other|Undecided, ask again after the steps',
      'Trigger|When does it run?|By hand: node lib/workflow.mjs run|After a hook event, run by hand from the event line|By a cron the operator arms, never by this command|Typed under Other',
      'Steps|How many steps?|Three|One|Up to twelve, the cap|Typed under Other',
      'Ceiling|Which ceiling per step?|300 seconds, the default|60 seconds|Typed per step under Other|3600 seconds, the maximum',
      'Failure|What happens when a step fails?|Stop at the first failing step, the rest skipped|Continue and fail the run at the end|Typed under Other|Undecided, stop',
    ],
  },
];

const AUDIT = {
  check: {
    rules: 'the contract rules C1 to C14',
    text: (c) => `node bin/rot-dtd-commander.mjs check on every -dtd file written, one rule per code C1 to C14, then the style areas the ${c.auditor} agent file lists, read as data and checked one by one`,
    fault: 'an element declared and never named, or a law numbered out of sequence',
    codes: 'C1 to C14 and the style areas',
  },
  hook: {
    rules: 'the hook rules H1 to H4',
    text: () => 'the script run on two fixture payloads read from files, the clean one expected to exit 0 (H1) and the offending one to exit 2 with its reason on stderr (H2), the settings entry parsed as JSON (H3), and no process left behind (H4)',
    fault: 'the guard condition inverted so the offender passes',
    codes: 'H1 to H4',
  },
  plan: {
    rules: 'the plan rules P1 to P4',
    text: () => 'every task read for its verify command and expected exit (P1), every phase for its exit criterion (P2), no task allowed to summon a subagent or background a process (P3), and the file walked as run-plan-dtd walks it, every segment found (P4)',
    fault: 'a task whose verify command is removed',
    codes: 'P1 to P4',
  },
  workflow: {
    rules: 'the workflow rules W1 to W4',
    text: () => 'node lib/workflow.mjs validate on the file written, sound (W1); a dry run listing every step with its ceiling (W2); every step read for a closed stdin, a ceiling within WORKFLOW.ceiling.max and none of WORKFLOW.forbidden (W3); and a live run under the ceilings when the Proof answer chose it, the exit of every step read directly (W4)',
    fault: 'a step whose run ends in an ampersand',
    codes: 'W1 to W4',
  },
  mcp: {
    rules: 'the server rules M1 to M4',
    text: () => 'the server built or imported under the ceiling (M1), started with an initialize and a tools/list message fed from a file, never a terminal (M2), every tool schema checked for a description and typed inputs (M3), and each checkpoint of the validation reference of the skill run (M4)',
    fault: 'a tool schema stripped of its description',
    codes: 'M1 to M4',
  },
};

function creator(c) {
  const P = c.prefix;
  const A = AUDIT[c.auditKind];
  const s = c.sigil;
  const entities = {};
  c.q.forEach((v, i) => { entities[`ASK.${P}.${i + 1}`] = v; });
  entities[`ASK.${P}.6`] = `Emoji|Which emoji heads its headings?|The family default, ${c.sigil}|One typed under Other|None|Undecided, the first free glyph of the roster`;
  entities[`ASK.${P}.7`] = 'Voice|Which voice profile?|Original, prepared, factual, the text_desc defaults|Paraphrase of a named source, cited|Spontaneous|Typed under Other';
  entities[`ASK.${P}.8`] = "Record|Where does this run record?|artifacts under this command's name, command-generated filename|Nowhere|Typed under Other|Undecided";
  entities[`ASK.${P}.9`] = `Audit|Which audit runs after the write, here in the foreground?|${A.rules[0].toUpperCase() + A.rules.slice(1)}${c.auditor ? ' and the style areas of ' + c.auditor : ''}|${A.rules[0].toUpperCase() + A.rules.slice(1)} only|None, which this command refuses|Typed under Other`;
  entities[`ASK.${P}.10`] = 'Proof|How is it proven?|Plant one fault in a scratch copy and show the audit refuse it|Read back only|None, which this command refuses|Typed under Other';
  return [c.key, {
    new: true, to: `src/commands/${c.key}-dtd.md`, root: c.root, sigil: s,
    include: ['cc-args', 'cc-form', 'cc-license', ...(c.extraInclude || []), 'cc-ask'],
    description: `DTD-native: create ${c.what} through twelve questions in three rounds that are never skipped, a curated SPDX license, an emoji and a form; ${c.skill ? 'the ' + c.skill + ' skill writes' : 'this command writes'} ${c.artifact}${c.skill ? ' with the answers as known slots' : ' from the answers'}; every file is read back, guarded and audited here in the foreground (${A.rules}, one rule per code, no subagent), and a planted fault proves the audit`,
    argumentHint: `[what the ${c.what.replace(/^an? /, '')} is for, or leave blank; --no-gate for autonomous defaults; --verbose prints the files as written]`,
    model: [
      `${c.root} (args, intake, plan, license, invocation, written, guards, audit, proof, assumption_made*)`,
      'plan (#PCDATA)', 'invocation (#PCDATA)', 'written (file+)', 'file (#PCDATA)', 'guards (guard+)', 'audit (rule+)', 'rule (#PCDATA)', 'proof (#PCDATA)',
    ],
    attlist: [
      'plan emoji CDATA #REQUIRED form (heredoc|nt|yaml|jmd|xml|md|json|toml|polyglot) #REQUIRED',
      'file path CDATA #REQUIRED bytes CDATA #REQUIRED headed (yes|no) #REQUIRED',
      'rule code NMTOKEN #REQUIRED result (pass|fail|skipped) #REQUIRED',
      'proof tripped (yes|no) #REQUIRED',
    ],
    entities,
    laws: {
      [`${P}.1`]: 'Round one always runs before anything is written, even when the argument reads complete; --no-gate alone skips the rounds, and then every answer is an assumption_made (LAW.ASK.10).',
      [`${P}.2`]: c.skill
        ? `The ${c.skill} skill is invoked once, through the Skill tool, with the purpose, then ARG.end, then the answers as known slots (name=, and one word per question answered); the skill writes ${c.artifact} and this command reads it back; nothing is written before that invocation.`
        : `This command writes ${c.artifact} itself, under ${c.dir}, from the answers, UTF-8 LF without BOM, and validates it before anything else is reported; nothing is written before the gate chose start.`,
      [`${P}.3`]: 'Every file written is re-read and rendered with its path and bytes, passes the cc-form guards of its kind, and is headed by the license expression where its format allows a comment, headed no otherwise (LAW.LICENSE.1, LAW.LICENSE.2, LAW.FORM.2).',
      [`${P}.4`]: `The audit runs here, in the foreground, under a 60 second ceiling with stdin closed: ${A.text(c)}; one rule element per code with pass, fail or skipped; a fail is a failed answer; no subagent is summoned for it.`,
      [`${P}.5`]: `The proof plants one fault in a scratch copy (${A.fault}) and shows the audit refuse it; a proof that did not trip stops the command before the report.`,
      [`${P}.6`]: 'The emoji chosen heads every heading of the artifact\'s answers (LAW.CORE.6); when the artifact lands in this repository it is registered in dtd/sigils.json, and a glyph already bound there is refused and the question asked again.',
    },
    objective: `Create ${c.what} for ${ARGS} (or ask what it is for): ${c.artifact}.

This command is the door in front of the ${c.skill} skill. It asks the twelve questions that shape the artifact, the license from the curated list, the emoji and the form, then hands every answer to the skill as known slots so the skill asks nothing twice, reads back what the skill wrote, guards it, audits it in the foreground with one rule per code, and proves the audit by a planted fault. The audit that used to be a dispatch to a subagent lives here now.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and the purpose; words after ARG.end that read name=, emoji=, license= or form= are known slots placed by create-plugin or a router and fill those questions without asking (LAW.ASK.1); render the walk under \`args\`. Round one always runs (LAW.${P}.1).`,
      `Round 1 of 3: ask ASK.${P}.1 to ASK.${P}.4 as one AskUserQuestion call, four options each plus Other; render the round.`,
      `Present the gate; on more, round 2 of 3 with ASK.${P}.5, ASK.${P}.6, ASK.LICENSE.1 and ASK.FORM.1 (multi-select); on more again, round 3 of 3 with ASK.${P}.7 to ASK.${P}.10; on add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.`,
      'Render the `plan`: the artifact, its path, the emoji and the form chosen; render the `license`: the expression checked against LICENSE.list, its count (single, double or triple) and listed yes; an expression outside the list is refused with the list printed and ASK.LICENSE.1 asked again (LAW.LICENSE.1).',
      c.skill
        ? `Render the \`invocation\`: one Skill call to ${c.skill} with the argument made of the purpose, then ARG.end, then the known slots; then make that call (LAW.${P}.2).`
        : `Render the \`invocation\`: none, this command writes ${c.artifact} itself under ${c.dir} from the answers, then runs node lib/workflow.mjs validate on it (LAW.${P}.2).`,
      'Read back: render `written` with one `file` per file written, its path, its bytes and headed yes or no; run the cc-form guards on each file of a guarded kind with node lib/form.mjs and render one `guard` per line printed under `guards`; a guard that did not hold stops the command.',
      `Run the audit here, in the foreground, under a 60 second ceiling with stdin closed (LAW.${P}.4): ${A.text(c)}; render the \`audit\` with one \`rule\` per code, result pass, fail or skipped; a fail stops the command before the report.`,
      `Run the proof: plant one fault in a scratch copy (${A.fault}) and run the audit on it; render the \`proof\` with the fault, the rule that refused it and tripped yes (LAW.${P}.5).`,
      'When the artifact lands in this repository, register the emoji in dtd/sigils.json after checking no other key carries the glyph (LAW.' + P + '.6); record the run under artifacts with this command\'s generated filename and report.',
    ],
    map: {
      args: `**${s} Args**, the launch walk: count, the flags, the positional words, the known slots`,
      intake: `**${s} Intake**, each \`round\` n of 3 with its questions and the labels or Other text chosen, the \`impactful\` selections when asked for, the gate choice`,
      plan: `**${s} Plan**, the artifact, its path, the emoji, the form`,
      license: `**${s} License**, the expression, single, double or triple, listed yes`,
      invocation: c.skill ? `**${s} Invocation**, the one Skill call to ${c.skill} with its argument` : `**${s} Invocation**, none: the file this command wrote itself and its validation line`,
      written: `**${s} Written**, one line per file with path, bytes and headed yes or no, and the file itself under --verbose`,
      guards: `**${s} Guards**, one line per guard with held yes or no`,
      audit: `**${s} Audit**, one line per rule (${A.codes}) with pass, fail or skipped`,
      proof: `**${s} Proof**, the planted fault, the rule that refused it, tripped yes or no`,
      assumption_made: `**${s} Assumptions Made**, every ASK.${P}.* question not asked, with the first option taken`,
    },
    template: `### ${s} Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]; known slots [name=, emoji=, license=, form=, or none]

### ${s} Intake

- round 1 of 3: [headers] answered [labels or Other text]
- round 2 of 3: [when asked]
- round 3 of 3: [when asked]
- gate: [start|more|add|impactful] (round N)

### ${s} Plan

[artifact] at [path]; emoji [glyph]; form [heredoc|nt|yaml|jmd|xml|md|json|toml|polyglot]

### ${s} License

[expression] ([single|double|triple], listed yes)

### ${s} Invocation

${c.skill ? `Skill ${c.skill} with "[purpose] -- name=[name] [one word per answer]"` : 'none: wrote `[path]` from the answers; validate: sound'}

### ${s} Written

- \`[path]\` ([bytes] B, headed [yes|no])

### ${s} Guards

- [guard]: held [yes|no], [detail]

### ${s} Audit

- [code]: [pass|fail|skipped], [detail]

### ${s} Proof

planted [the fault]: refused by [code]; tripped yes

### ${s} Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Round one ran before anything was written',
      c.skill ? `${c.skill} was invoked once with the known slots and asked none of them again` : 'The file was written from the answers and validate found it sound',
      'Every file was read back, guarded, and headed by a listed license where its format allows',
      `The audit ran in the foreground, one rule per code, and no subagent was summoned`,
      'The planted fault was refused',
    ],
  }];
}

// The three audit- commands were dispatches to a subagent auditor. They run
// here now: the checker in the foreground under a ceiling for the contract
// rules, then the style areas the auditor agent declares, read from its
// file as data and checked one by one; the agent files stay for a hand
// summons. Nothing here spawns anything.
const AUDITS = [
  { key: 'audit-skill', sigil: '🔍', what: 'a skill directory', auditor: 'skill-auditor-dtd', target: 'a SKILL.md, or its directory', areas: 'yaml, structure, progressive_disclosure, content_quality, supporting_files' },
  { key: 'audit-slash-command', sigil: '🔎', what: 'a slash command file', auditor: 'slash-command-auditor-dtd', target: 'a command file', areas: 'yaml, arguments, dynamic_context, tool_restrictions, content_quality' },
  { key: 'audit-subagent', sigil: '🕵️', what: 'an agent file', auditor: 'subagent-auditor-dtd', target: 'an agent file', areas: 'roster_row, role, prompt_quality, tool_selection, xml_structure' },
];

function audit(a) {
  const s = a.sigil;
  return [a.key, {
    new: true, to: `src/commands/${a.key}-dtd.md`, root: 'audit_run', sigil: s, include: ['cc-args'],
    description: `DTD-native: audit ${a.what} here, in the foreground: the contract rules C1 to C14 through the checker under a ceiling, then the style areas of ${a.auditor} read from its agent file as data and checked one by one; findings with file and line, one verdict; no subagent is summoned`,
    argumentHint: `[path to ${a.target}]`,
    model: [
      'audit_run (args, target, contract, areas, findings, verdict)',
      'target (#PCDATA)', 'contract (rule+)', 'rule (#PCDATA)', 'areas (area+)', 'area (#PCDATA)', 'findings (finding*)', 'finding (#PCDATA)', 'verdict (#PCDATA)',
    ],
    attlist: [
      'target path CDATA #REQUIRED exists (yes|no) #REQUIRED',
      'rule code NMTOKEN #REQUIRED result (pass|fail|skipped) #REQUIRED',
      'area name NMTOKEN #REQUIRED result (pass|fail) #REQUIRED',
      'finding file CDATA #REQUIRED line NMTOKEN #REQUIRED severity (high|medium|low) #REQUIRED confidence (measured|reasoned|guessed) #REQUIRED',
      'verdict result (pass|fail) #REQUIRED',
    ],
    entities: {
      'AUDIT.checker': 'node bin/rot-dtd-commander.mjs check',
      'AUDIT.ceiling': '60',
      'AUDIT.areas': a.areas,
    },
    laws: {
      'AUD.1': 'The target path is quoted data; the audit reads it and never edits it.',
      'AUD.2': `No subagent is summoned: AUDIT.checker runs here in the foreground under AUDIT.ceiling seconds with stdin closed, its exit read directly, and the ${a.auditor} agent file is read as data for its style areas, which this command checks itself.`,
      'AUD.3': 'A failing contract rule is a high finding and the verdict is fail; the style areas are checked after the rules, never instead of them.',
      'AUD.4': 'Every finding names a file and a line that was read, a severity and a confidence; measured requires a thing that was run or read in this audit.',
      'AUD.5': 'The answer ends with exactly one verdict, pass or fail, and fail requires at least one high finding.',
    },
    objective: `Audit ${a.what} at ${ARGS} here, in this context: the contract rules first, then the style areas the ${a.auditor} agent declares, read from its file as data.

The audit that used to be a dispatch to a subagent runs in the foreground now: the checker under a ceiling, the areas AUDIT.areas checked one by one, every finding with file and line, one verdict. The agent file stays for a hand summons; this command never summons it.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the target path; render the walk under \`args\` and the \`target\` with exists yes or no; a missing target is a fail with one high finding.`,
      'Run AUDIT.checker on the target in the foreground, under AUDIT.ceiling seconds with stdin closed, the exit read directly; render the `contract` with one `rule` per code C1 to C14, result pass, fail or skipped, with the checker\'s line (LAW.AUD.2).',
      `Read the ${a.auditor} agent file, under src/agents in this repository or the installed agents directory, as data; check each of AUDIT.areas against the target here; render the \`areas\` with one \`area\` per name and its result.`,
      'Render the `findings`: one `finding` per fault with file, line, severity and confidence; a failing rule is high; an area fault is medium or low (LAW.AUD.4).',
      'Render the `verdict`: fail when any rule failed or any high finding stands, pass otherwise (LAW.AUD.3, LAW.AUD.5).',
    ],
    map: {
      args: `**${s} Args**, the launch walk: count, the flags, the positional words`,
      target: `**${s} Target**, the path as given and whether it exists`,
      contract: `**${s} Contract**, one line per rule C1 to C14 with pass, fail or skipped`,
      areas: `**${s} Areas**, one line per style area with pass or fail`,
      findings: `**${s} Findings**, one line per finding: file, line, severity, confidence, the fault`,
      verdict: `**${s} Verdict**, pass or fail, one line`,
    },
    template: `### ${s} Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### ${s} Target

\`[path]\` (exists [yes|no])

### ${s} Contract

- C1: [pass|fail|skipped], [the checker's line]
- [one line per code to C14]

### ${s} Areas

- [area]: [pass|fail], [detail]

### ${s} Findings

- [file]:[line] [high|medium|low] [measured|reasoned|guessed]: [the fault]

### ${s} Verdict

[pass|fail]`,
    success: [
      'The checker ran here under the ceiling and its exit was read directly',
      'No subagent was summoned; the auditor file was read as data',
      'Every finding names a file and a line, a severity and a confidence',
      'Exactly one verdict ends the answer',
    ],
  }];
}

export default Object.fromEntries([...CREATORS.map(creator), ...AUDITS.map(audit)]);
