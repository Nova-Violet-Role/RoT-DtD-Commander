// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
// dtd/new-commands-v52.spec.mjs
// The codebase growth family of 5.2.0: three commands on one anatomy, each
// owning a band of the fifteen-verb ladder declared in dtd/cc-amplify.dtd.
// Consumed by `rdc forge dtd/new-commands-v52.spec.mjs`.
//
// The three differ in exactly four places: the band of the ladder they may
// expose, the sigil, the root element, and the sentence that says what kind
// of change they are for. Everything else -- five rounds of four questions,
// the two possibility classes, the paging generator, the state record, the
// four documents, the release recognizer -- is one anatomy written once.

const ARGS = '<quoted trust="cdata" source="user-args">$ARGUMENTS</quoted>';

const FAMILY = [
  {
    key: 'amplify', sigil: '🌱', root: 'amplify_run', prefix: 'AMPLIFY',
    band: 'AMP.band.amplify', verbs: 'tweak, enrich, ameliorate, amplification and magnify',
    next: 'enhance-codebase-dtd',
    what: 'what exists gains beside it: nothing a reader must relearn, nothing removed',
    when: 'the codebase is sound and under-served: the shapes are right and the coverage is thin',
  },
  {
    key: 'enhance', sigil: '🪴', root: 'enhance_run', prefix: 'ENHANCE',
    band: 'AMP.band.enhance', verbs: 'heighten, promote, cultivate, enhancement and upgrade',
    next: 'overhaul-codebase-dtd',
    what: 'a capability the codebase implied becomes actually there, and a habit becomes a declaration',
    when: 'the codebase is sound and unfinished: it says what it does and does not yet do all of it',
  },
  {
    key: 'overhaul', sigil: '🦋', root: 'overhaul_run', prefix: 'OVERHAUL',
    band: 'AMP.band.overhaul', verbs: 'elevation, intensification, evolve, overhaul and metamorphosis',
    next: 'amplify-codebase-dtd (the ladder wraps: after a metamorphosis the small verbs matter again)',
    what: 'an approach is replaced or a layer is lifted into its own subset; the old way is removed, not left beside',
    when: 'the codebase is sound and outgrown: the shape itself is the thing in the way',
  },
];

const spec = {};
for (const f of FAMILY) {
  spec[`${f.key}-codebase`] = {
    new: true,
    to: `src/commands/${f.key}-codebase-dtd.md`,
    root: f.root,
    sigil: f.sigil,
    include: ['cc-args', 'cc-ask', 'cc-amplify'],
    // LAW.ASK.11: the rounds are raised only by declaring these four before
    // the cc-ask include; the first declaration binds.
    predeclare: [
      '<!ENTITY % ask.rounds "(1|2|3|4|5)">',
      '<!ENTITY % ask.of     "(5)">',
      '<!ENTITY ASK.rounds_per_prompt "5">',
      '<!ENTITY ASK.max_total "20">',
    ],
    description: `DTD-native: walk a codebase through the layers it declares, expose what could be done as measured gaps and reasoned ideas on the ${f.key} band of the fifteen-verb ladder (${f.verbs}), ask across five rounds of four which to keep, write the study down as four documents, and name the release the kept ones amount to without ever taking it`,
    argumentHint: '[a path to walk, or blank for the current repository; --stage=alpha|beta|pre names a pre-release; --no-gate runs autonomously]',
    model: [`${f.root} (args, intake, walk, generator, study, release, next_verb, assumption_made*)`],
    attlist: [],
    laws: {
      [`${f.prefix}.1`]: `This command exposes only the verbs of ${f.band}, which are ${f.verbs}; a possibility that belongs above the band is rendered as the next_verb element naming its number and the command that owns it, and is never kept here (LAW.AMP.4).`,
      [`${f.prefix}.2`]: `The intake runs five rounds of at most four questions, twenty in all, and the rounds grow: round one is drawn from the walk, and every later round is generated from what the previous answers opened, so a round that would ask nothing new ends the intake early rather than asking to fill its count (LAW.ASK.6, LAW.ASK.11).`,
      [`${f.prefix}.3`]: `A run is bounded and the sequence of runs is not: the state record makes every later invocation continue where this one stopped, so the command is re-entered rather than repeated, and a possibility this run refused is never offered by any run again (LAW.AMP.6).`,
    },
    objective: `Grow the codebase at ${ARGS} (or the repository of the working directory if no arguments provided) by the ${f.key} band of the ladder: ${f.what}.

Use this command when ${f.when}. The three commands of this family are one anatomy over one ladder of fifteen verbs, declared in cc-amplify.dtd and ascending by how much they disturb: tweak, enrich, ameliorate, amplification, magnify, heighten, promote, cultivate, enhancement, upgrade, elevation, intensification, evolve, overhaul, metamorphosis. This one owns ${f.band}. When the run ends it names the next verb up and the command that owns it, so the climb from a tweak to a metamorphosis is a declared chain rather than a thing to remember.

The DOCTYPE declares the whole deliverable. The \`args\` element and its four guards come from cc-args: the argument is split like shell words and never evaluated (LAW.ARGS.1), --stage and --no-gate are read as flags (LAW.ARGS.2, LAW.ARGS.3), and the walk is rendered with its count and its guards (LAW.ARGS.4, LAW.ARGS.5, LAW.ARGS.6). The \`intake\` comes from cc-ask, raised to five rounds of four by the declarations above the include (LAW.ASK.11): a \`context_analysis\` of known and gap slots, up to five \`round\` elements each carrying one \`ask\` of one to four bilateral \`question\` elements with their variants, \`answer\` elements that are data, an \`impactful\` element when the gate asks for one, and a \`gate\` whose only choices are start, more, add and impactful (LAW.ASK.1 to LAW.ASK.14). The \`walk\`, the \`generator\`, the \`study\`, the \`release\` and the \`next_verb\` come from cc-amplify and answer to LAW.AMP.1 to LAW.AMP.10.

Local evidence first, and the two classes are never confused: a \`possibility\` of class gap is measured, naming the instrument and the path that show a declaration the target disagrees with; a possibility of class idea is reasoned or guessed, naming in adds the law, entity or file it would create. The finite half is ranked first; the unbounded half is marked as what it is (LAW.AMP.3, LAW.CORE.4).`,
    process: [
      'Walk the argument through cc-args and render the `args` element with its `arg` words and its four `arg_guard` elements: the first positional word is the target path, blank means the working directory; read --stage and --no-gate (LAW.ARGS.2).',
      'Read the state record first: `timeout 60 node lib/amplify.mjs state` in the target. Its run number, its generator offset, the verb the last run ended on and every closed id are the memory this run continues from; a target with no record starts at run 0 (LAW.AMP.6).',
      'Detect the layers: `timeout 60 node lib/amplify.mjs detect`. A target that declares none of them walks the generic layer alone and the `walk` element carries declared no (LAW.AMP.10).',
      'Walk them: `timeout 900 node lib/amplify.mjs walk` in the foreground, reading each exit code directly. Render one `layer` element per layer with its instrument, its exit, its read of its of, and walked yes, no or timeout; instruments before any reading by hand, and a layer that reached its ceiling says timeout, never no (LAW.AMP.1, LAW.AMP.2, LAW.AMP.9).',
      'Build the possibilities from what the walk returned: every failing instrument, every disagreement between a declaration and the tree, is a `possibility` of class gap with its `evidence` naming the instrument and the path; every shape the codebase implies but does not declare is a possibility of class idea whose evidence names in adds what it would create. Give each its verb from this command\'s band, its `cost` with the file count and the risk, and its id (LAW.AMP.3, LAW.AMP.4).',
      'Drop every id the state record closed, then rank: gaps before ideas, then risk, then breadth (LAW.AMP.6).',
      'Ask in rounds of four (LAW.ASK.6, and the raised count of LAW.ASK.11): round one offers the highest page of possibilities as a mark question with the unshown counted beside them, and asks the scope and the intensity; every later round is generated from the answers just given, pulling in the layers and files they opened. Present the gate after the last round, or earlier when a round would ask nothing new.',
      'Write the study before the answer closes (LAW.AMP.7): one `document` of kind family per layer walked, one of kind ledger ranking every possibility of this run, one of kind roadmap ordering the kept ones toward the named release, and one of kind handoff carrying what the next run needs. Print every path.',
      'Recognise the release: `timeout 60 node lib/amplify.mjs recognize <verb numbers of the kept>`, with --stage overriding the class. Render the `release` element with its class, its from, its to and taken no; name the version and never take it (LAW.AMP.8).',
      'Write the state record back with this run\'s number, the generator offset, the verb it ended on, the release badge and every possibility with its verdict; then render `next_verb` with the number of the verb above this band and the command that owns it (LAW.AMP.4, LAW.AMP.6).',
    ],
    map: {
      args: '**Arguments**, the walk with its count and its four guards',
      intake: '**Intake**, the known and gap slots, each round as n of 5 with its questions, variants and answers, the impactful selections when asked, and the gate choice',
      walk: '**Walk**, the target, whether it declares the layers, the seconds it took, and one line per layer: instrument, exit, read of of, walked',
      generator: '**Possibilities**, the page of this round: id, class, verb, layer, confidence, verdict, why, evidence, cost, with the exposed, shown and unshown counts',
      study: '**Study**, one line per document with its kind and its path',
      release: '**Release**, the class the kept possibilities amount to, from and to, taken no',
      next_verb: '**Next Verb**, the number above this band and the command that owns it',
      assumption_made: '**Assumptions Made**, autonomous run only',
    },
    template: `**Arguments:** [n] word(s): [the walk]; guards: [four, each held]

**Intake:** known [slots]; gaps [slots]; round 1 of 5 [headers, variants, answers]; gate [start]

**Walk:** target [path] declared [yes|no] seconds [n]
- [layer] instrument [command] exit [n] read [n] of [n] walked [yes|no|timeout]

**Possibilities:** exposed [n] shown [n] unshown [n] offset [n]
- [id] [gap|idea] verb [n] [layer] [measured|reasoned|guessed] [exposed|marked|refused|done]
  - why: [one sentence]
  - evidence: instrument [command and path] or adds [law, entity or file]
  - cost: files [n] risk [high|medium|low]

**Study:**
- family [path]
- ledger [path]
- roadmap [path]
- handoff [path]

**Release:** class [major|mid|minor|alpha|beta|pre] from [x.y.z] to [x.y.z] taken no

**Next Verb:** [n] [name] — run /[command]`,
    success: [
      'Every layer walked names its instrument and its exit code, and a ceiling reached is rendered timeout',
      'Every possibility carries its class, and no idea is rendered as measured',
      'Only the verbs of this command\'s band are kept; anything above is handed on by name',
      'No possibility a previous run refused is offered again',
      'The four documents are written and their paths printed',
      'A release is named and never taken',
    ],
  };
}

export default spec;
