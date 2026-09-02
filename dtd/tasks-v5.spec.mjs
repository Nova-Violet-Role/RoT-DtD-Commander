// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// dtd/tasks-v5.spec.mjs : the tasks family of 5.0.0.
//
// Five commands that inter-operate in a project's tasks folder (cc-task):
// create-task writes a task file in a chosen schematic with a chosen semantic
// schema and registers it; audit-tasks checks the registry against the folder
// both ways and picks an open task; create-workflow-tasks turns chosen tasks
// into a workflow file for lib/workflow.mjs; task-run runs one task's steps in
// the foreground under ceilings through lib/task.mjs; task-handoff closes a
// task with its evidence and record. The four answer variants appear across
// the family (LAW.TASK.4).
//
//   node bin/rot-dtd-commander.mjs forge dtd/tasks-v5.spec.mjs [names...]

const ARGS = '<quoted trust="cdata" source="user-args">$ARGUMENTS</quoted>';

export default {
  'create-task': {
    new: true, to: 'src/commands/create-task-dtd.md', root: 'task_creation', sigil: '📌',
    include: ['cc-args', 'cc-form', 'cc-schematic', 'cc-license', 'cc-task', 'cc-ask'],
    description: 'DTD-native: create a task in the project tasks folder through twelve questions in three rounds never skipped (length select, variables check, steps elaborate, license mark): a task file in the chosen schematic with the parts of the chosen semantic schemas, registered in Task.json through lib/task.mjs with its dollar variables and steps, a todo line imported when named, proven by lib/schematic.mjs check and a planted over-length step the registry refuses',
    argumentHint: '[what the task is, or a TO-DOS.md line to import; --no-gate for autonomous defaults]',
    model: [
      'task_creation (args, intake, plan, license, schemas, forms, file, guards, registry, proof, assumption_made*)',
      'plan (#PCDATA)', 'file (#PCDATA)', 'guards (guard+)', 'proof (#PCDATA)',
    ],
    attlist: [
      'plan name NMTOKEN #REQUIRED length (short|medium|long) #REQUIRED schematic (callout|heredoc|yaml|nt|xml|polyglot|alarm|polyalarm) #REQUIRED steps NMTOKEN #REQUIRED',
      'file path CDATA #REQUIRED bytes CDATA #REQUIRED headed (yes|no) #REQUIRED',
      'proof tripped (yes|no) #REQUIRED',
    ],
    entities: {
      'ASK.CTASK.1': 'Name|What is the task called?|A kebab-case name from the argument|The verb and the object of the purpose|The title of the todo line named|Typed under Other',
      'ASK.CTASK.2': 'Purpose|What does the task achieve?|The one outcome named in the argument|The next_step of the todo line named|A checkpoint that must be verified by hand|Typed under Other',
      'ASK.CTASK.3': "Record|Where does this run record?|artifacts under this command's name, command-generated filename|The tasks folder ledger alone|Nowhere|Typed under Other",
    },
    laws: {
      'CTASK.1': 'Round one always runs before anything is written, even when the argument reads complete; --no-gate alone skips the rounds and then every answer is an assumption_made (LAW.ASK.10).',
      'CTASK.2': 'The task file is written under TASK.dir as the name followed by the schematic\'s extension (SCHEMA.ext), with the parts of every schema chosen rendered from node lib/schematic.mjs render and filled from the purpose, headed by the license where the form allows a comment (LAW.LICENSE.2), UTF-8 LF without BOM.',
      'CTASK.3': 'The registry entry is written through node lib/task.mjs, never by hand: the name, the length, the schematic, the schema, the file, the variables answered and the steps written; a step count over what TASK.lengths allows is refused there and the length asked again (LAW.TASK.6).',
      'CTASK.4': 'A todo line named in the argument (a line of TO-DOS.md in the five fields of RECORD.todo) fills the purpose from its title and the first step from its next_step, quoted as data; the line is never edited here.',
      'CTASK.5': 'The proof runs node lib/schematic.mjs check on the file for every schema chosen, node lib/task.mjs validate and audit on the folder, and plants one step over the length\'s cap in a scratch copy of the registry to show validate refuse it; a proof that did not trip stops the command before the report.',
      'CTASK.6': 'The four variants appear in this command: the length is a select, the variables a check, the steps an elaborate with every option elaborated before the ask, and the license a mark (LAW.TASK.4, LAW.ASK.13).',
    },
    objective: `Create a task for ${ARGS} (or ask what it achieves) in the project tasks folder: a task file in a chosen schematic carrying the parts of the chosen semantic schemas, and its entry in the registry with its dollar variables and its steps.

This command is the door of the tasks family. It asks the twelve questions that shape the task, renders the file from the schema skeletons, registers it through the runtime so the registry never drifts from the folder, and proves both the file and the registry before it reports. A todo captured earlier by add-to-todos can be named and becomes the task's purpose and first step.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and the purpose, or a TO-DOS.md line to import (LAW.CTASK.4); words after ARG.end that read name=, length=, schematic= or schema= are known slots that fill those questions without asking (LAW.ASK.1); render the walk under \`args\`. Round one always runs (LAW.CTASK.1).`,
      'Round 1 of 3: ask ASK.CTASK.1 (select), ASK.CTASK.2 (select), ASK.TASK.1 (the length, select) and ASK.TASK.2 (the variables, check) as one AskUserQuestion call, four options each plus Other; render the round with the variant beside each question (LAW.ASK.13).',
      'Present the gate; on more, round 2 of 3 with ASK.TASK.3 (the steps, elaborate: each way of writing the steps elaborated before the ask), ASK.SCHEMATIC.1 (select), ASK.SCHEMATIC.2 (select) and ASK.SCHEMA.1 (the families, check); on more again, round 3 of 3 with ASK.SCHEMA.2 (select), ASK.FORM.1 (check), ASK.LICENSE.1 (mark: each license elaborated, the marked ones joined) and ASK.CTASK.3 (select); on add or impactful, take the answer and present the gate again; on start, proceed with every unasked question at its first option, listed under Assumptions Made.',
      'Render the `plan`: the name, the length, the schematic (nt when none was chosen), the step count, and the steps as run strings each under a ceiling (CEILING when the variable is set), never more than TASK.lengths allows; render the `license` checked against LICENSE.list (LAW.LICENSE.1).',
      'Render the `schemas` with one `semantic` per schema chosen and its `part` elements, and the `forms` with one `form` per kind chosen (nt alone when none was).',
      'Write the task file under TASK.dir as the name followed by SCHEMA.ext of the schematic: render the skeleton of every schema chosen with node lib/schematic.mjs render, fill the parts from the purpose, head it with the license where the form allows, re-read it, and render the `file` with path, bytes and headed yes or no (LAW.CTASK.2); run the cc-form guards of its kind with node lib/form.mjs and render one `guard` per line under `guards`; a guard that did not hold stops the command.',
      'Register the task through node lib/task.mjs in the foreground (register is called from a one-line node script that imports lib/task.mjs, with stdin closed): the name, the length, the schematic, the first schema, the file, the variables answered with their values, and the steps; then run node lib/task.mjs audit on the folder and render the `registry` with one `entry` per name and its state, and the counts (LAW.CTASK.3, LAW.TASK.1).',
      'Run the proof: node lib/schematic.mjs check on the file for every schema chosen, one line per schema; node lib/task.mjs validate on the folder; then copy the registry to a scratch path, add one step over the cap of the chosen length to this task, run validate on the copy and show the refusal; render the `proof` with the lines and tripped yes (LAW.CTASK.5).',
      'Record the run under artifacts with this command\'s generated filename when ASK.CTASK.3 chose it, and report.',
    ],
    map: {
      args: '**📌 Args**, the launch walk: count, the flags, the positional words, the known slots, the todo line imported when one was named',
      intake: '**📌 Intake**, each `round` n of 3 with its questions, the variant beside each, and the labels or Other text chosen; the gate choice',
      plan: '**📌 Plan**, the name, the length, the schematic, the step count, the steps as run strings with their ceilings',
      license: '**📌 License**, the expression, single, double or triple, listed yes',
      schemas: '**📌 Schemas**, one `semantic` per schema chosen with its parts in order, or none',
      forms: '**📌 Forms**, one `form` per kind chosen',
      file: '**📌 File**, the path, the bytes, headed yes or no',
      guards: '**📌 Guards**, one line per guard with held yes or no',
      registry: '**📌 Registry**, one line per entry with its state, then entries, files and drift',
      proof: '**📌 Proof**, one line per schema from the check, the validate line, the planted over-length step and its refusal, tripped yes',
      assumption_made: '**📌 Assumptions Made**, every question not asked, with the first option taken',
    },
    template: `### 📌 Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]; known slots [name=, length=, schematic=, schema=, or none]; todo line [imported title, or none]

### 📌 Intake

- round 1 of 3: Name (select), Purpose (select), Length (select), Vars (check) answered [labels or Other text]
- round 2 of 3: Steps (elaborate), Schematic (select), Schematic B (select), Schema A (check) [when asked]
- round 3 of 3: Schema B (select), Forms (check), License (mark), Record (select) [when asked]
- gate: [start|more|add|impactful] (round N)

### 📌 Plan

name [name]; length [short|medium|long]; schematic [callout|heredoc|yaml|nt|xml|polyglot|alarm|polyalarm]; steps [n]
- step 1: [run string] (ceiling [secs] s, expect [exit])

### 📌 License

[expression] ([single|double|triple], listed yes)

### 📌 Schemas

- [schema]: parts [in order], or: none

### 📌 Forms

- [kind]

### 📌 File

\`tasks/[name].[ext]\` ([bytes] B, headed [yes|no])

### 📌 Guards

- [guard]: held [yes|no], [detail]

### 📌 Registry

- [name]: [declared_and_present|declared_and_missing|present_and_orphan]
entries [n]; files [n]; drift [n]

### 📌 Proof

schema [name]: [parts] parts, [n] read back in order: ok
validate: sound
planted [n] steps on a [length] task: refused ([the line]); tripped yes

### 📌 Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Round one ran before anything was written',
      'The task file carries every part of every schema chosen, in order, and the registry entry was written through lib/task.mjs',
      'The audit after the write shows drift 0',
      'The planted over-length step was refused',
    ],
  },

  'audit-tasks': {
    new: true, to: 'src/commands/audit-tasks-dtd.md', root: 'task_audit', sigil: '📋',
    include: ['cc-args', 'cc-task', 'cc-ask'],
    description: 'DTD-native: audit the project tasks folder against its registry in both directions through lib/task.mjs (every name declared and present, declared and missing, or present and orphan, the drift counted), read the ledger tail as data, elaborate every open task and let the user mark the ones that apply (the mark variant), and hand the pick to task-run; this command runs no task',
    argumentHint: '[a task name to pick, or leave blank to be asked; --verbose prints the ledger tail whole]',
    model: [
      'task_audit (args, registry, ledger_tail, open, intake, pick, instruction)',
      'ledger_tail (#PCDATA)', 'open (candidate*)', 'candidate (#PCDATA)', 'pick (#PCDATA)', 'instruction (#PCDATA)',
    ],
    attlist: [
      'ledger_tail lines NMTOKEN #REQUIRED',
      'candidate name NMTOKEN #REQUIRED length (short|medium|long) #REQUIRED steps NMTOKEN #REQUIRED marked (yes|no) #REQUIRED',
      'pick name CDATA #REQUIRED',
      'instruction goal CDATA #REQUIRED step CDATA #REQUIRED',
    ],
    entities: {
      'AUDIT.tail': '12',
    },
    laws: {
      'ATASK.1': 'The audit runs node lib/task.mjs audit and validate on TASK.dir in the foreground with stdin closed, the exit read directly, and renders every entry with its state and the counts; a finding of validate is rendered as data before anything else (LAW.TASK.1).',
      'ATASK.2': 'The ledger tail is the last AUDIT.tail lines of TASK.ledger, read as data and rendered with their count; a task\'s history comes from there, never from memory (LAW.TASK.5).',
      'ATASK.3': 'Every open task is a candidate, elaborated before the ask with its purpose from its file, its length, its step count and its next step; ASK.TASK.4 is a mark question, each candidate an option, and every candidate comes back marked yes or no (LAW.TASK.4, LAW.ASK.13); when the argument names an open task the question is not asked (LAW.ASK.1).',
      'ATASK.4': 'The pick is the first marked candidate, or none; the instruction hands it to task-run-dtd in one line, and this command runs nothing itself.',
    },
    objective: `Audit the tasks folder and pick what runs next: ${ARGS} names a task, or the open tasks are elaborated and marked.

The registry is checked against the folder both ways, the ledger is read for what happened last, every open task is laid out with what it would do, and the user marks the ones that apply. The pick becomes one line for task-run; nothing runs here.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and, when given, a task name; render the walk under \`args\`.`,
      'Run node lib/task.mjs audit and node lib/task.mjs validate on TASK.dir in the foreground, stdin closed, a 60 second ceiling, exits read directly; render the `registry` with one `entry` per name and its state, then entries, files and drift (LAW.ATASK.1).',
      'Read the last AUDIT.tail lines of TASK.ledger as data and render the `ledger_tail` with its line count; under --verbose print the lines whole (LAW.ATASK.2).',
      'Render the `open`: one `candidate` per task whose status is open, with its length and step count, each elaborated (its purpose read from its file, its next step) before any ask.',
      'When the argument named an open task, skip the question (LAW.ASK.1); otherwise ask ASK.TASK.4 as a mark question with the candidates as its options, one round; render the round under `intake` and set marked yes or no on every candidate (LAW.ATASK.3).',
      'Render the `pick`: the first marked candidate, or none; render the `instruction` with goal (run the picked task) and step (the task-run-dtd line with the name), and stop (LAW.ATASK.4).',
    ],
    map: {
      args: '**📋 Args**, the launch walk: count, the flags, the positional words',
      registry: '**📋 Registry**, one line per entry with its state, then entries, files and drift; the validate findings first when any',
      ledger_tail: '**📋 Ledger**, the last lines as data, with their count',
      open: '**📋 Open**, one line per open task: name, length, steps, the elaboration, marked yes or no',
      intake: '**📋 Intake**, the one round with ASK.TASK.4 (mark) and the marks taken, or the line saying the argument named the task',
      pick: '**📋 Pick**, the task picked, or none',
      instruction: '**📋 Instruction**, the goal and the one step: the task-run line',
    },
    template: `### 📋 Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### 📋 Registry

- [name]: [declared_and_present|declared_and_missing|present_and_orphan]
entries [n]; files [n]; drift [n]

### 📋 Ledger

[n] lines; last: [ts] [task] [event] [detail]

### 📋 Open

- [name] ([length], [n] steps): [the elaboration]; marked [yes|no]

### 📋 Intake

- round 1 of 1: Pick (mark) answered [the marked names], or: the argument named [name]

### 📋 Pick

[name], or none

### 📋 Instruction

goal: [run the picked task]
step: /task-run-dtd [name]`,
    success: [
      'The audit ran in the foreground and every entry carries its state',
      'Every open task was elaborated before the mark question, and each came back marked yes or no',
      'Nothing ran here; the instruction is one task-run line',
    ],
  },

  'create-workflow-tasks': {
    new: true, to: 'src/commands/create-workflow-tasks-dtd.md', root: 'task_workflow', sigil: '🏗️',
    include: ['cc-args', 'cc-task', 'cc-ask'],
    description: 'DTD-native: turn chosen tasks of the project tasks folder into one workflow file for lib/workflow.mjs (the tasks marked after elaboration, their order, the failure rule, the ceilings), every step\'s dollar variables expanded from its task alone, validated and dry-run before it is reported; the workflow is never run here',
    argumentHint: '[a workflow name and task names, or leave blank to be asked; --no-gate for autonomous defaults]',
    model: [
      'task_workflow (args, intake, selection, workflow_file, validation, proof, assumption_made*)',
      'selection (chosen+)', 'chosen (#PCDATA)', 'workflow_file (#PCDATA)', 'validation (#PCDATA)', 'proof (#PCDATA)',
    ],
    attlist: [
      'chosen name NMTOKEN #REQUIRED steps NMTOKEN #REQUIRED order NMTOKEN #REQUIRED',
      'workflow_file path CDATA #REQUIRED bytes CDATA #REQUIRED steps NMTOKEN #REQUIRED on_fail (stop|continue) #REQUIRED',
      'validation sound (yes|no) #REQUIRED dry_run (yes|no) #REQUIRED',
      'proof tripped (yes|no) #REQUIRED',
    ],
    entities: {
      'ASK.WTASK.1': 'Tasks|Which tasks go into the workflow? Each is elaborated first; mark the ones that apply.|Every open task|The task named in the argument|The tasks whose steps are all written|Typed under Other',
      'ASK.WTASK.2': 'Order|In which order?|Registry order|Short tasks first|Typed under Other, as a list of names|Undecided, registry order',
      'ASK.WTASK.3': 'Failure|What happens when a step fails?|Stop at the first failing step, the rest skipped|Continue and fail the run at the end|Typed under Other|Undecided, stop',
      'ASK.WTASK.4': "Ceiling|Which ceiling per step?|Each step's own, or the task's CEILING variable|300 seconds, the default|60 seconds|Typed under Other",
      'WTASK.ext': 'workflow.json',
    },
    laws: {
      'WTASK.1': 'The workflow file is written under TASK.dir as the name followed by WTASK.ext, its steps taken from the chosen tasks in the chosen order and named task dot n, every run string expanded from its own task\'s variables through the rules of LAW.TASK.2 (a refused variable stops the command with the step named), the ceilings and expected exits carried over.',
      'WTASK.2': 'The file is validated with node lib/workflow.mjs validate and then dry-run with node lib/workflow.mjs run --dry, both in the foreground with stdin closed and their exits read directly; a file validate refuses is deleted and the answer says why.',
      'WTASK.3': 'This command never runs the workflow: the report ends with the line that runs it, node lib/workflow.mjs run on the file, or task-run-dtd per task.',
      'WTASK.4': 'The proof plants one step with a ceiling above WORKFLOW.ceiling.max in a scratch copy of the file and shows validate refuse it; a proof that did not trip stops the command before the report.',
    },
    objective: `Turn tasks into one workflow file: ${ARGS} names a workflow and tasks, or the open tasks are elaborated and marked.

The chosen tasks' steps become the steps of a workflow file the runner walks in the foreground under ceilings; the variables of each step are filled from its own task, the file is validated and dry-run, and a planted fault proves the validation. Running it is a separate act.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags, a workflow name and task names when given; render the walk under \`args\`. Round one always runs (LAW.ASK.10).`,
      'Read the registry with node lib/task.mjs audit and validate in the foreground; elaborate every open task (its purpose, its steps) before the ask; then Round 1 of 1: ask ASK.WTASK.1 (mark, the open tasks as options), ASK.WTASK.2 (select), ASK.WTASK.3 (select) and ASK.WTASK.4 (select) as one AskUserQuestion call; render the round with the variant beside each question (LAW.ASK.13); present the gate.',
      'Render the `selection`: one `chosen` per marked task with its step count and its order.',
      'Compose the workflow: for each chosen task in order, one step per task step named task dot n, the run string expanded from the task\'s own variables (a refusal stops the command), the ceiling and the expected exit carried; on_fail from ASK.WTASK.3; write it under TASK.dir as the name followed by WTASK.ext, UTF-8 LF, re-read it and render the `workflow_file` with path, bytes, step count and on_fail (LAW.WTASK.1).',
      'Run node lib/workflow.mjs validate and node lib/workflow.mjs run --dry on the file, in the foreground, stdin closed, exits read directly; render the `validation` with sound yes or no and dry_run yes or no; a refused file is deleted (LAW.WTASK.2).',
      'Run the proof: copy the file to a scratch path, raise one step\'s ceiling above WORKFLOW.ceiling.max, run validate on the copy and show the refusal; render the `proof` with tripped yes (LAW.WTASK.4).',
      'End with the line that runs the workflow, node lib/workflow.mjs run on the file, and stop (LAW.WTASK.3).',
    ],
    map: {
      args: '**🏗️ Args**, the launch walk: count, the flags, the positional words',
      intake: '**🏗️ Intake**, the one round with its four questions, the variant beside each, the marks and labels taken, the gate choice',
      selection: '**🏗️ Selection**, one line per chosen task: name, steps, order',
      workflow_file: '**🏗️ Workflow**, the path, the bytes, the step count, on_fail',
      validation: '**🏗️ Validation**, validate sound yes or no, the dry run yes or no with every step and its ceiling',
      proof: '**🏗️ Proof**, the planted ceiling, its refusal, tripped yes or no',
      assumption_made: '**🏗️ Assumptions Made**, every question not asked, with the first option taken',
    },
    template: `### 🏗️ Args

count [n]; verbose [0|1]; debug [0|1]; words [each positional word]

### 🏗️ Intake

- round 1 of 1: Tasks (mark), Order (select), Failure (select), Ceiling (select) answered [marked names, labels or Other text]
- gate: [start|more|add|impactful]

### 🏗️ Selection

- [name] ([n] steps, order [i])

### 🏗️ Workflow

\`tasks/[name].workflow.json\` ([bytes] B, [n] steps, on_fail [stop|continue])

### 🏗️ Validation

validate: sound [yes|no]; dry run: [yes|no]
- [task].[n]: ceiling [secs] s

### 🏗️ Proof

planted ceiling [secs] on [task].[n]: refused ([the line]); tripped yes

run it: node lib/workflow.mjs run tasks/[name].workflow.json

### 🏗️ Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'Every open task was elaborated before the mark question',
      'Every step\'s variables were expanded from its own task, and the file validated and dry-ran in the foreground',
      'The workflow was not run here; the closing line runs it',
      'The planted ceiling was refused',
    ],
  },

  'task-run': {
    new: true, to: 'src/commands/task-run-dtd.md', root: 'task_run', sigil: '🏃',
    include: ['cc-args', 'cc-task', 'cc-record'], predeclare: ['% command-info-types "no-record-nesting"'],
    description: 'DTD-native: run one task of the project tasks folder in the foreground through lib/task.mjs (its steps as a workflow under ceilings, stdin closed, every exit read directly), the dollar variables of each step expanded from the task alone and rendered as data before the run, the registry status landing done or blocked, the ledger lines rendered',
    argumentHint: '[the task name]',
    model: [
      'task_run (args, task_ref, expansion, execution, ledger_lines, verdict)',
      'task_ref (#PCDATA)', 'expansion (expanded+)', 'expanded (#PCDATA)', 'execution (step_run+)', 'step_run (#PCDATA)', 'ledger_lines (#PCDATA)', 'verdict (#PCDATA)',
    ],
    attlist: [
      'task_ref name NMTOKEN #REQUIRED status (open|running|done|blocked|handed_off) #REQUIRED length (short|medium|long) #REQUIRED',
      'expanded n NMTOKEN #REQUIRED',
      'step_run name NMTOKEN #REQUIRED exit NMTOKEN #REQUIRED status (pass|fail|ceiling|skipped) #REQUIRED ms NMTOKEN #REQUIRED',
      'ledger_lines count NMTOKEN #REQUIRED',
      'verdict result (pass|fail) #REQUIRED',
    ],
    entities: {
      'RTASK.command': 'node lib/task.mjs run',
    },
    laws: {
      'RTASK.1': 'The task runs through RTASK.command with TASK.dir and the name, in the foreground, stdin closed, every step under its ceiling, the exit of every step read directly from the runner\'s lines and never inferred (LAW.TASK.3).',
      'RTASK.2': 'Before the run, every step\'s run string is rendered expanded from the task\'s own variables as data; a variable the rules of LAW.TASK.2 refuse stops the command before anything runs, with the step named.',
      'RTASK.3': 'The status the registry carries after the run is what the runner wrote, done or blocked, never set by hand here; the ledger lines the run appended are read back and rendered with their count (LAW.TASK.5).',
      'RTASK.4': 'No word of the argument string is passed into a step: the argument names the task and nothing else (LAW.TASK.2).',
      'RTASK.5': 'This command produces no record file of its own: its DOCTYPE declares command-info-types as no-record-nesting before it includes cc-record, the ledger of the tasks folder is the record of a run, and the Adiutor expects no file under artifacts for it (LAW.REC.5).',
    },
    objective: `Run the task ${ARGS} names, in the foreground, step by step under ceilings, and render what the runner measured.

The task's steps are expanded from its own variables and shown before anything runs; the runner walks them as a workflow, stops at the first failure, appends the ledger and sets the status; this command reads those back and reports.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and the task name, nothing else enters a step (LAW.RTASK.4); render the walk under \`args\`.`,
      'Read the registry with node lib/task.mjs validate on TASK.dir; find the task; render the `task_ref` with its name, status and length; a task that is not open or has no steps stops the command with the reason.',
      'Render the `expansion`: one `expanded` per step with its run string expanded from the task\'s variables under the rules of LAW.TASK.2; a refusal stops the command with the step named (LAW.RTASK.2).',
      'Run RTASK.command on TASK.dir and the name in the foreground, stdin closed, under the sum of the steps\' ceilings plus sixty seconds, the exit read directly; render the `execution` with one `step_run` per line the runner printed: name, exit, status, milliseconds (LAW.RTASK.1).',
      'Read the ledger lines the run appended (the run line and the done or blocked line) and render the `ledger_lines` with their count; read the registry again and render the `verdict` with the status it carries, pass when done and fail when blocked (LAW.RTASK.3).',
    ],
    map: {
      args: '**🏃 Args**, the launch walk: count, the flags, the positional words',
      task_ref: '**🏃 Task**, the name, the status before the run, the length',
      expansion: '**🏃 Expansion**, one line per step with its run string expanded',
      execution: '**🏃 Execution**, one line per step: name, exit, status, milliseconds',
      ledger_lines: '**🏃 Ledger**, the lines appended, with their count',
      verdict: '**🏃 Verdict**, pass or fail, the status the registry carries',
    },
    template: `### 🏃 Args

count [n]; verbose [0|1]; debug [0|1]; words [the task name]

### 🏃 Task

[name] ([status], [length])

### 🏃 Expansion

- step [n]: [the run string, expanded]

### 🏃 Execution

- step[n]: exit [code] status [pass|fail|ceiling|skipped] [ms] ms

### 🏃 Ledger

[n] lines appended: [ts] [task] run ...; [ts] [task] [done|blocked] ...

### 🏃 Verdict

[pass|fail] (status [done|blocked])`,
    success: [
      'Every step ran through the runner in the foreground and its exit was read directly',
      'The expansion was rendered before the run and refused nothing, or the command stopped before running',
      'The status reported is the one the registry carries',
    ],
  },

  'task-handoff': {
    new: true, to: 'src/commands/task-handoff-dtd.md', root: 'task_handoff', sigil: '🤝',
    include: ['cc-args', 'cc-task', 'cc-record', 'cc-ask'], predeclare: ['% command-info-types "record"'],
    description: 'DTD-native: close a task of the project tasks folder with its attestation (files, ledger lines, exit codes, each read or run in this session), set its status through the runtime (done, blocked or handed off), write the record under artifacts with the command-generated filename as a revision history the Adiutor checks at Stop, and print the instruction for the next session; the four questions cover outcome, attestation, the next step and the record',
    argumentHint: '[the task name; --no-gate for autonomous defaults]',
    model: [
      'task_handoff (args, task_ref, intake, attestation, record_file, instruction, assumption_made*)',
      'task_ref (#PCDATA)', 'attestation (item+)', 'item (#PCDATA)', 'record_file (#PCDATA)', 'instruction (#PCDATA)',
    ],
    attlist: [
      'task_ref name NMTOKEN #REQUIRED status_before (open|running|done|blocked|handed_off) #REQUIRED status_after (done|blocked|handed_off) #REQUIRED',
      'item kind (file|ledger|exit|note) #REQUIRED confidence (measured|reasoned|guessed) #REQUIRED',
      'record_file path CDATA #REQUIRED bytes CDATA #REQUIRED revisions NMTOKEN #REQUIRED',
      'instruction goal CDATA #REQUIRED step CDATA #REQUIRED',
    ],
    entities: {
      'ASK.HTASK.1': 'Outcome|How does the task end?|Done: every step passed and the result is in place|Blocked: a step failed and the reason is known|Handed off: the next session continues it|Typed under Other',
      'ASK.HTASK.2': 'Evidence|What is carried as evidence? Pick any.|The files changed, each re-read|The ledger lines of this task|The exit codes of the steps run|Typed under Other',
      'ASK.HTASK.3': 'Next|What is the next step? Each option is elaborated first.|Nothing, the task is closed|The failing step, fixed and re-run|A new task created from what was learned|Typed under Other',
      'ASK.HTASK.4': "Record|Where does the record go?|artifacts under this command's name, command-generated filename|The task file itself, appended|Nowhere|Typed under Other",
      'HTASK.dir': 'artifacts/task-handoff-dtd',
      'HTASK.command': 'node lib/task.mjs close',
      'RECORD.handoff': 'handoff|artifacts/task-handoff-dtd/*.md|1=name:PCDATA@1|2=task:PCDATA@1|3=outcome:PCDATA@1|4=date:PCDATA@1|5=next:CDATA@1',
    },
    laws: {
      'HTASK.1': 'The status is set through HTASK.command with TASK.dir, the name and the outcome, which appends the ledger event and rewrites the registry entry; it is never edited by hand, and an outcome outside done, blocked or handed_off is refused (LAW.TASK.5).',
      'HTASK.2': 'Every attestation item is a thing read, run or measured in this session, with its confidence; a recalled item is guessed and says so; an attestation with no measured item cannot close a task as done.',
      'HTASK.3': 'This command declares that it produces one record (command-info-types record, before the cc-record include): the file is written under HTASK.dir, which is RECORD.dir and this command\'s name, named RECORD.filename (a Greek ordinal only when this command writes more than one file in a run, never in place of the name, LAW.IUPAC.7); its frontmatter carries the fields of RECORD.handoff in order and its body is a revhistory, one revision per event as RECORD.revision.heading with at least one evidence line as RECORD.evidence.line under it (LAW.REC.6); the Adiutor checks it at Stop (LAW.ADIUTOR.11).',
      'HTASK.4': 'The instruction says what the next session does, in its own element with a goal and a step; for a handed-off task the step is the task-run line, for a blocked task the fix, for a done task nothing.',
    },
    objective: `Close the task ${ARGS} names with its evidence, its status and its record, and say what comes next.

Four questions in one round: the outcome, the evidence to carry, the next step elaborated, and where the record goes. The status lands through the runtime, the evidence is what this session read or ran, the record keeps the command's own filename, and the instruction is the one line the next session starts from.`,
    process: [
      `Walk the argument string once (LAW.ARGS.1, LAW.ARGS.2): ${ARGS} gives the flags and the task name; render the walk under \`args\`.`,
      'Read the registry with node lib/task.mjs validate on TASK.dir; find the task; render the `task_ref` with its name and its status before; a task that is not in the registry stops the command.',
      'Round 1 of 1: ask ASK.HTASK.1 (select), ASK.HTASK.2 (check), ASK.HTASK.3 (elaborate: each next step elaborated before the ask) and ASK.HTASK.4 (select) as one AskUserQuestion call; render the round with the variant beside each question (LAW.ASK.13); present the gate; on start proceed with every unasked question at its first option.',
      'Gather the `attestation`: one `item` per file re-read, ledger line read, or exit code measured in this session, each with its kind and confidence; a done outcome needs at least one measured item (LAW.HTASK.2).',
      'Set the status through HTASK.command on TASK.dir, the name and the outcome, in the foreground with stdin closed, the exit read directly; read the registry again and render status_after on the `task_ref` (LAW.HTASK.1).',
      'Write the record file under HTASK.dir named after this command (the ordinal from node lib/ordinals.mjs only when a file of this run already exists there), UTF-8 LF: the frontmatter with the five fields of RECORD.handoff in order, then the body as a revision history, one revision heading per event of this task read from the ledger with its evidence lines under it; re-read it, run node lib/record.mjs check on this command file and the project root, and render the `record_file` with path, bytes and the revision count (LAW.HTASK.3, LAW.REC.6).',
      'Render the `instruction` with goal and step for the next session (LAW.HTASK.4), and stop.',
    ],
    map: {
      args: '**🤝 Args**, the launch walk: count, the flags, the positional words',
      task_ref: '**🤝 Task**, the name, the status before and after',
      intake: '**🤝 Intake**, the one round with its four questions, the variant beside each, the labels or Other text chosen, the gate choice',
      attestation: '**🤝 Attestation**, one line per item: kind, confidence, the thing',
      record_file: '**🤝 Record**, the path, the bytes, the revision count, and the check line',
      instruction: '**🤝 Instruction**, the goal and the one step',
      assumption_made: '**🤝 Assumptions Made**, every question not asked, with the first option taken',
    },
    template: `### 🤝 Args

count [n]; verbose [0|1]; debug [0|1]; words [the task name]

### 🤝 Task

[name] ([status before] to [done|blocked|handed_off])

### 🤝 Intake

- round 1 of 1: Outcome (select), Evidence (check), Next (elaborate), Record (select) answered [labels or Other text]
- gate: [start|more|add|impactful]

### 🤝 Attestation

- [file|ledger|exit|note] ([measured|reasoned|guessed]): [the thing]

### 🤝 Record

\`artifacts/task-handoff-dtd/task-handoff-dtd[.ordinal].md\` ([bytes] B, [n] revisions)
record check: sound

### 🤝 Instruction

goal: [what the next session achieves]
step: [/task-run-dtd [name] | the fix | nothing]

### 🤝 Assumptions Made

- [each unasked question, first option taken]`,
    success: [
      'The status landed through the runtime and the ledger carries the event',
      'Every attestation item was read, run or measured here, with its confidence',
      'The record keeps the command-generated filename, its fields are in declared order, and every revision carries evidence',
    ],
  },
};
