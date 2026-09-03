// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
// dtd/new-commands-v51.spec.mjs
// Two commands of 5.1.0: /ai-slop-dtd, the hand-run form of the AI_SLOP hook
// gate, and /deep-scratch-dtd, research, a build in a git worktree, the diff
// reviewed, the research amplified, and a merge gate with the pros and cons
// per file. Consumed by `rdc forge dtd/new-commands-v51.spec.mjs`.

const ARGS = '<quoted trust="cdata" source="user-args">$ARGUMENTS</quoted>';

export default {
  'ai-slop': {
    new: true, to: 'src/commands/ai-slop-dtd.md', root: 'ai_slop_check', include: ['cc-args', 'ai-slop'],
    description: 'DTD-native: judge a file, a commit message file or the last answer by the AI_SLOP gate, the hand-run form of the hook gate: the same measures, the same escape, nothing written',
    argumentHint: '[a file, a commit message file, or blank for the last answer of this session; --verbose prints every hit with its line]',
    model: ['ai_slop_check (args, target, slop_report, escape)', 'target (#PCDATA)', 'escape (#PCDATA)'],
    attlist: ['target kind (answer|file|commit|text) #REQUIRED', 'escape needed (yes|no) #REQUIRED'],
    laws: {
      'ASC.1': 'The target is judged by lib/ai-slop.mjs, run in the foreground under a ceiling with its exit code read directly, and the slop_report is rendered from its output with every slop_measure and its bound (LAW.SLOP.5); a verdict without its numbers was not given.',
      'ASC.2': 'The command is the hand-run form of the hook gate of LAW.SLOP.7: the same measures, the same escape of LAW.SLOP.8, and it writes nothing but the scratch file of the last answer; a file named in the argument is read, never changed.',
      'ASC.3': 'The argument is walked by cc-args: the first positional word is the target file, blank means the last answer of this session written to a scratch file first, and --verbose prints every slop_hit with its line.',
    },
    objective: `Judge ${ARGS} (a file, a commit message file, or blank for the last answer of this session) by the AI_SLOP gate of ai-slop.dtd, the way the armed hook judges the four spots of LAW.SLOP.7, and render the report.

The gate is lib/ai-slop.mjs: the runtime copy under the Claude directory, rot-dtd-commander/lib/ai-slop.mjs, or the repository's lib/ai-slop.mjs when run inside it. Its three layers hold here as everywhere: a banned phrase in the answer's own voice is a hit while a fence, an inline code span, a quoted element, a table row or a heading is data (LAW.SLOP.1); a sentence whose only verb is a copula is static and the static share is bounded (LAW.SLOP.2); sentence length moves and the vocabulary turns over (LAW.SLOP.3); two consecutive records of one command share few openings (LAW.SLOP.4); the report is the verdict with its numbers (LAW.SLOP.5); a small body is judged on the ban list alone (LAW.SLOP.6); the four hook spots and their strictness (LAW.SLOP.7, LAW.SLOP.8). This command is the name to type when no hook is armed, or when a hook denied a Write, a commit or an answer and the measures must be read in full.

The argument walk is the one cc-args declares: the string is read once and split like shell words, never evaluated (LAW.ARGS.1); --verbose and --debug are the flags and a double hyphen ends the options (LAW.ARGS.2); verbose prints the evidence and debug the commands run (LAW.ARGS.3); the walk is rendered under the args element with its count (LAW.ARGS.4); a word is embedded in one declared class (LAW.ARGS.5); the four guards hold and each is rendered as an arg_guard element (LAW.ARGS.6).`,
    process: [
      'Walk the argument (LAW.ASC.3) and render the `args` element with its `arg` words and its `arg_guard` elements: the first positional word is the `target` file; blank means the last answer of this session, written to a scratch file under the session scratchpad before it is judged; note --verbose.',
      'Run `timeout 60 node <runtime>/lib/ai-slop.mjs <file>` in the foreground and read its exit code directly (LAW.ASC.1); with --verbose add every `slop_hit` line to the report.',
      'Render the `slop_report` from that output, never recomputed: the `slop_verdict`, every `slop_hit` with its kind and line, every `slop_measure` with its value and bound.',
      'Write the `escape` (LAW.ASC.2): when the gate holds, needed no; when it fails, needed yes, which phrases to rewrite and which, if any, must stay and go into backticks or a quoted element (LAW.SLOP.1, LAW.SLOP.8).',
    ],
    map: {
      'args': '**Arguments**, the walk with its count and its guards',
      'target': '**Target**, its kind (answer, file, commit or text) and the file judged',
      'slop_report': '**Slop Report**, the verdict, the hits, the measures with their bounds, as lib/ai-slop.mjs printed them',
      'escape': '**Escape**, needed yes or no, and the rewrite or the fence',
    },
    template: `**Arguments:** [count] word(s): [the walk]; guards: [four, each held or named]

**Target:** [answer|file|commit|text] [path]

**Slop Report:**
- verdict: alive [yes|no], words [n], sentences [n]
- hits: [kind line phrase, one per line, with --verbose]
- measures: tells [v] bound [b] holds [yes|no]; hedges ...; fillers ...; closers ...; static_share ...; rhythm_cv ...; lexical_mattr ...; rotation_overlap ...

**Escape:** needed [yes|no]. [the rewrite, or the phrases that must stay and their fence]`,
    success: ['The report is rendered from the instrument\'s output with every measure and its bound', 'Nothing is written but the scratch file of the last answer', 'A failed gate names the rewrite and the escape'],
  },

  'deep-scratch': {
    new: true, to: 'src/commands/deep-scratch-dtd.md', root: 'deep_scratch', include: ['cc-ask', 'cc-report'],
    description: 'DTD-native: research a change, build it in a git worktree under .claude/worktrees, review the diff hunk by hunk, amplify the research with the build as evidence, then a merge gate with the pros and cons per file: merge all, merge the marked files, keep or discard, and the project gate runs on the merged tree',
    argumentHint: '[what to build or change, or leave blank for the current discussion; --no-gate skips the intake and never the merge gate]',
    entities: {
      'SECTIONS.deep_scratch': 'Key Questions|Overview|How It Works|History and Context|Patterns and Best Practices|Limitations and Edge Cases|Current State and Trends|Key Takeaways|Remaining Unknowns',
      'BLOCKS.deep_scratch': 'application|technical|integration',
      'MERGE.question': 'The diff is reviewed. Which files land in the repository?',
      'MERGE.all': 'Merge every file',
      'MERGE.marked': 'Merge the marked files',
      'MERGE.keep': 'Keep the scratch for another round',
      'MERGE.discard': 'Discard the scratch',
      'SCRATCH.dir': '.claude/worktrees',
      'SCRATCH.branch': 'scratch/ followed by the topic',
      'SCRATCH.ceiling': '300',
    },
    model: [
      'deep_scratch (intake, report, scratch, diff_review, report, merge_gate, artifact, artifact, assumption_made*)',
      'scratch (worktree, build+, run+)', 'worktree EMPTY', 'build (#PCDATA)', 'run (#PCDATA)',
      'diff_review (finding+)', 'finding (#PCDATA)',
      'merge_gate (pro+, con+, ask, answer+, verdict)', 'pro (#PCDATA)', 'con (#PCDATA)', 'verdict EMPTY',
    ],
    attlist: [
      'worktree path CDATA #REQUIRED branch CDATA #REQUIRED base CDATA #REQUIRED',
      'build file CDATA #REQUIRED kind (new|changed) #REQUIRED',
      'run command CDATA #REQUIRED exit CDATA #REQUIRED ceiling CDATA #REQUIRED',
      'finding file CDATA #REQUIRED hunk CDATA #REQUIRED verdict (kept|changed|dropped) #REQUIRED severity %severity; #REQUIRED confidence %confidence; #REQUIRED',
      'pro file CDATA #REQUIRED lines CDATA #REQUIRED',
      'con file CDATA #REQUIRED lines CDATA #REQUIRED',
      'verdict choice (merged-all|merged-marked|kept|discarded) #REQUIRED gate (green|red|not-run) #REQUIRED',
    ],
    laws: {
      'DS.1': 'The scratch is a git worktree under SCRATCH.dir on the branch SCRATCH.branch off HEAD, opened with node lib/scratch.mjs open; nothing is written outside it before the merge gate, and a topic that is not lower-case letters, digits and hyphens is refused.',
      'DS.2': 'Every build step and every run happen inside the worktree, in the foreground, under SCRATCH.ceiling seconds, with the exit code read directly; a claim the first report marked reasoned is re-marked measured by a run or marked failed, never left as it was.',
      'DS.3': 'Every hunk of node lib/scratch.mjs diff is one finding with its file, its hunk, a verdict of kept, changed or dropped, a severity and a confidence; a hunk without a finding was not reviewed.',
      'DS.4': 'The merge gate is one mark question over every changed file with its pro and its con and the lines each carries, asked with MERGE.question and the four choices MERGE.all, MERGE.marked, MERGE.keep and MERGE.discard; --no-gate skips the intake and never the merge gate.',
      'DS.5': 'The chosen files are merged by the command, merge-all for every file and merge with the marked paths otherwise, and the project gate runs on the merged tree before the answer closes; a red gate is reverted to the base and reported as the verdict gate red.',
      'DS.6': 'Two reports are saved under artifacts/research, the deep-dive of phase one and the deep-scratch of phase three, each as one artifact, and both paths are printed.',
      'DS.7': 'Discard removes the worktree and its branch with node lib/scratch.mjs discard; keep leaves both and prints the path; the verdict says which.',
    },
    objective: `Research, build and judge ${ARGS} (or the current discussion if no arguments provided) in four phases: the research of a deep dive, a build in a git worktree that touches nothing else, the diff reviewed hunk by hunk with the research amplified by what the build measured, and a merge gate that lists the pros and cons of landing each file in the repository before anything lands.

The DOCTYPE declares the whole deliverable. The \`intake\` of cc-ask: a \`context_analysis\` of \`known\` and \`gap\` slots, up to three \`round\` elements each one \`ask\` of one to four \`question\` elements with two to four \`option\` elements carrying a \`label\`, a \`description\` and an optional \`preview\` or \`elaboration\`, \`answer\` elements that are data, an \`impactful\` element of ranked \`selection\` elements when the gate asks for them, and the \`gate\` (LAW.ASK.1, LAW.ASK.2, LAW.ASK.3, LAW.ASK.4, LAW.ASK.5, LAW.ASK.6, LAW.ASK.7, LAW.ASK.8, LAW.ASK.9, LAW.ASK.10, LAW.ASK.11, LAW.ASK.12, LAW.ASK.13, LAW.ASK.14). The \`report\` of cc-report, twice: a \`strategic_summary\` first, one \`section\` per name in SECTIONS.deep_scratch in that order, a \`claude_context\` of one \`block\` per name in BLOCKS.deep_scratch, one \`next_action\`, and \`sources\` of \`source\` elements each with a kind (LAW.REPORT.1, LAW.REPORT.2, LAW.REPORT.3, LAW.REPORT.4). Between the two reports the \`scratch\` (its \`worktree\`, every \`build\`, every \`run\`) and the \`diff_review\` of \`finding\` elements; after the second report the \`merge_gate\` (a \`pro\` and a \`con\` per file, the \`ask\`, the \`answer\` elements, the \`verdict\`), then one \`artifact\` per report and the \`assumption_made\` elements of an autonomous run (LAW.CORE.5).

Local evidence first: files read, commands run, the worktree measured. The scratch never leaves SCRATCH.dir (LAW.DS.1), every run is ceilinged (LAW.DS.2), every hunk is a finding (LAW.DS.3), the merge gate is never skipped (LAW.DS.4), the command applies the merge and runs the gate on the result (LAW.DS.5), two reports are saved (LAW.DS.6), and discard or keep is said in the verdict (LAW.DS.7).`,
    process: [
      'Intake: read the argument and the conversation into `known` and `gap` slots; ask up to three rounds, one to four questions each, every question with its variant and its bilateral Other; present the gate; start only on start. With --no-gate skip the intake, write every gap as an `assumption_made`, and still stop at the merge gate (LAW.DS.4).',
      'Research: write the first `report`, the nine sections in SECTIONS.deep_scratch order, every claim marked measured, reasoned or guessed; save it as the first `artifact`, `YYYY-MM-DD-<topic>-deep-dive.md` under artifacts/research, and print the path (LAW.DS.6).',
      'Open the scratch from the repository root: `timeout 60 node lib/scratch.mjs open <topic>` with the topic in lower-case letters, digits and hyphens (LAW.DS.1); render the `worktree` with its path, branch and base.',
      'Build inside the worktree only: every Write and every Edit under its path, one `build` line per file with kind new or changed; commit there with `git -C <path> add -A && git -C <path> commit`.',
      'Run inside the worktree: the project gate, the tests or the controls that measure the phase-one claims, each under `timeout SCRATCH.ceiling` with the exit code read directly, one `run` line each (LAW.DS.2).',
      'Diff: `timeout 60 node lib/scratch.mjs diff <topic>` for the files with their counts, and `git diff <base>...<branch>` for the hunks; write one `finding` per hunk with file, hunk, verdict kept, changed or dropped, severity and confidence (LAW.DS.3); a changed or dropped hunk is edited in the worktree and committed before the next phase.',
      'Amplify: write the second `report` with every phase-one claim re-marked by what the runs measured, the diff findings folded into How It Works and Limitations, and the `next_action`; save it as the second `artifact`, `YYYY-MM-DD-<topic>-deep-scratch.md`, and print the path (LAW.DS.6).',
      'Merge gate: one `pro` and one `con` per changed file, each with the lines it carries; then the mark question MERGE.question with the four options MERGE.all, MERGE.marked, MERGE.keep and MERGE.discard, multiSelect for the marked files; the replies are `answer` elements (LAW.DS.4).',
      'Apply and close: merge-all with `node lib/scratch.mjs merge-all <topic>`, the marked files with `node lib/scratch.mjs merge <topic> <path...>`, then the project gate on the merged tree under the ceiling; a red gate is reverted (`git reset --hard <base>` after merge-all, `git checkout HEAD -- <paths>` after a marked merge) and the `verdict` carries gate red (LAW.DS.5); keep prints the worktree path; discard runs `node lib/scratch.mjs discard <topic>` (LAW.DS.7); render the `verdict` with its choice and its gate.',
    ],
    map: {
      'intake': '**Intake**, the known and gap slots, each round with its questions and answers, the gate choice; or the assumptions of an autonomous run',
      'report': '**Research** (phase one) and **Amplified Research** (phase three): the strategic summary, the nine sections in SECTIONS.deep_scratch order, the claude_context blocks, the next action, the sources',
      'scratch': '**Scratch**: the worktree (path, branch, base), one line per build (file, new or changed), one line per run (command, exit, ceiling)',
      'diff_review': '**Diff Review**: one line per finding (file, hunk, verdict kept, changed or dropped, severity, confidence)',
      'merge_gate': '**Merge Gate**: the pro and the con per file with its lines, the mark question and its answers, the verdict with its choice and its gate',
      'artifact': '**Artifacts**: the two paths under artifacts/research',
      'assumption_made': '**Assumptions Made**, autonomous run only',
    },
    template: `**Intake:** known [slots]; gaps [slots]; round 1 of 3 [headers and answers]; gate [start]

**Research:** [strategic summary, then the nine sections, the claude_context, the next action, the sources]

**Scratch:**
- worktree: path [.claude/worktrees/<topic>] branch [scratch/<topic>] base [sha]
- build: [file] [new|changed]
- run: [command] exit [n] ceiling [s]

**Diff Review:**
- finding: [file] [hunk] [kept|changed|dropped] [severity] [confidence]: [what was found]

**Amplified Research:** [the second report, every phase-one claim re-marked]

**Merge Gate:**
- pro: [file] [lines]: [what the merge gives]
- con: [file] [lines]: [what the merge risks]
- ask: [MERGE.question; the marked files]
- answer: [the reply]
- verdict: choice [merged-all|merged-marked|kept|discarded] gate [green|red|not-run]

**Artifacts:** [path one], [path two]`,
    success: ['Nothing outside the worktree changes before the merge gate', 'Every run has an exit code read directly and every phase-one claim is re-marked', 'Every hunk is a finding and every changed file has a pro and a con', 'The merge gate is asked, the chosen merge is applied, and the gate runs on the merged tree', 'Two reports are saved and their paths printed'],
  },
};
