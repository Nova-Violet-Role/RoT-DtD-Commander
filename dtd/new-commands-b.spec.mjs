// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
// dtd/new-commands-b.spec.mjs
// Ten new commands drawn from Phantom-Books-Real-Books, part B. Consumed by
// `rdc forge dtd/new-commands-b.spec.mjs`. Same shape as part A.

const ARGS = '<quoted trust="cdata" source="user-args">$ARGUMENTS</quoted>';

export default {
  'sutra': {
    new: true, to: 'commands/sutra-dtd.md', root: 'sutras',
    description: 'DTD-native: audit the shortcuts in use; every heuristic is written as a rule with the exact domain where it is valid and a counterexample that was tried',
    argumentHint: '[calculation, estimate or decision that used shortcuts, or leave blank for current context]',
    model: ['sutras (calculation, sutra+, audit)', 'calculation (#PCDATA)', 'sutra (rule, domain, counterexample)', 'rule (#PCDATA)', 'domain (#PCDATA)', 'counterexample (#PCDATA)', 'audit (#PCDATA)'],
    attlist: ['sutra id ID #REQUIRED valid (yes|partial|no) #REQUIRED', 'audit unsafe IDREFS #IMPLIED'],
    laws: {
      'SUT.1': 'Every shortcut in use is written as a rule with the exact domain where it is valid.',
      'SUT.2': 'Every sutra has a counterexample or the words no counterexample found after trying, with what was tried; an untried shortcut is untested.',
      'SUT.3': 'The audit lists by unsafe the sutras applied outside their domain in the calculation.',
    },
    objective: `Audit the shortcuts inside ${ARGS} (or the current calculation, estimate or decision if no arguments provided).

The book called Vedic Mathematics is a list of sixteen sutras, each a shortcut that works beautifully inside a narrow domain and silently fails outside it; the book's reception history is mostly people discovering the edges. The engineering use is the heuristic audit: name each shortcut the reasoning used, state the domain where it is valid, try to break it, and list the ones applied outside their domain. Fast reasoning is fine; unaudited fast reasoning is how a wrong number gets three decimal places.`,
    process: [
      'Quote the `calculation`: the chain of reasoning or arithmetic under audit, as data.',
      'Extract every `sutra` in it: a `rule` (the shortcut as a sentence), a `domain` (the exact conditions under which it holds), and give it an id.',
      'For each sutra construct a `counterexample`: an input inside the calculation\'s apparent scope where the rule gives the wrong answer. Try at least one concrete input; write what was tried. Mark valid yes (no counterexample after trying), partial (holds in part of the scope) or no.',
      'Write the `audit`: which sutras the calculation applied outside their domain, by id in unsafe, and what the corrected step is.',
    ],
    map: {
      'calculation': '**Calculation**, quoted',
      'sutra': '**Sutras**, one block per shortcut: id, valid, then `rule`, `domain`, `counterexample`',
      'audit': '**Audit**, the unsafe ids and the corrected steps',
    },
    template: `**Calculation:** [quoted reasoning]

**Sutras:**
- S1 valid [yes|partial|no]
  - rule: [the shortcut]
  - domain: [exact conditions]
  - counterexample: [input and wrong result, or: none found after trying ...]
- S2 ...

**Audit:** unsafe: S2. [corrected step]`,
    success: ['Every shortcut has a stated domain', 'Every counterexample names a concrete input that was tried', 'The audit corrects each unsafe application'],
  },

  'wu-wei': {
    new: true, to: 'commands/wu-wei-dtd.md', root: 'wu_wei',
    description: 'DTD-native: the do-nothing branch as a first-class option; write what happens if nobody acts, cost both branches in the same unit, and choose act, refrain or wait with a named condition',
    argumentHint: '[proposed action or leave blank for current context]',
    model: ['wu_wei (situation, branch, branch, cost, cost, choice)', 'situation (#PCDATA)', 'branch (#PCDATA)', 'cost (#PCDATA)', 'choice (#PCDATA)'],
    attlist: ['branch kind (act|refrain) #REQUIRED', 'cost of (act|refrain) #REQUIRED horizon %horizon; #REQUIRED confidence %confidence; #REQUIRED', 'choice kind (act|refrain|wait) #REQUIRED until CDATA #IMPLIED'],
    laws: {
      'WW.1': 'The refrain branch is written as fully as the act branch: what happens if nobody does anything, at the same horizon.',
      'WW.2': 'Both costs are written in the same unit; a cost of nothing is written as the number zero with its confidence, never left blank.',
      'WW.3': 'A choice of wait names in until the condition that would turn it into act.',
    },
    objective: `Weigh not acting on ${ARGS} (or the current proposal if no arguments provided).

The Tao Te Ching returns again and again to wu wei, acting by not forcing, and to the sage who accomplishes by leaving things alone. The engineering use is to make the do-nothing branch a real option with a real cost instead of the unexamined default that every proposal is measured against. Most proposals are compared with an imaginary zero; this command writes the zero down.`,
    process: [
      'Describe the `situation` as it is now, without the proposal.',
      'Write the act `branch`: what the proposal does and what follows.',
      'Write the refrain branch with the same care: what happens if nobody acts, at the same horizon, including what fixes itself and what gets worse.',
      'Write the `cost` of each branch in one shared unit (hours, money, risk of a named event) at a stated horizon with a confidence.',
      'Write the `choice`: act, refrain, or wait; a wait names the condition in until that would turn it into act.',
    ],
    map: {
      'situation': '**Situation**',
      'branch': '**If We Act** and **If We Refrain**, each a full account',
      'cost': '**Cost of Acting** and **Cost of Refraining**, same unit, horizon, confidence',
      'choice': '**Choice**, act, refrain or wait until',
    },
    template: `**Situation:** [as it is now]

**If We Act:** [what the proposal does and what follows]
**If We Refrain:** [what happens if nobody acts, at the same horizon]

**Cost of Acting:** [number unit] at [horizon] ([confidence])
**Cost of Refraining:** [number unit] at [horizon] ([confidence])

**Choice:** [act|refrain|wait] [until: condition]`,
    success: ['The refrain branch is as detailed as the act branch', 'Both costs share a unit and a horizon', 'A wait names its trigger'],
  },

  'water': {
    new: true, to: 'commands/water-dtd.md', root: 'water',
    description: 'DTD-native: find the path of least resistance through a hard constraint; mark each constraint hard, soft or assumed, find where it yields, and route the course only through yield points',
    argumentHint: '[goal blocked by constraints, or leave blank for current context]',
    model: ['water (goal, constraint+, yield_point+, course)', 'goal (#PCDATA)', 'constraint (#PCDATA)', 'yield_point (#PCDATA)', 'course (#PCDATA)'],
    attlist: ['constraint id ID #REQUIRED hardness (hard|soft|assumed) #REQUIRED checked (true|false) #REQUIRED', 'yield_point in IDREF #REQUIRED', 'course through IDREFS #REQUIRED'],
    laws: {
      'WAT.1': 'Every constraint is marked hard (physics, law, contract), soft (policy, habit) or assumed (nobody checked); an assumed constraint is checked before it is routed around, and checked is true only when the check was run or read.',
      'WAT.2': 'A yield point names the constraint it is found in and the specific place it gives way.',
      'WAT.3': 'The course passes only through yield points; forcing a hard constraint is not a course.',
    },
    objective: `Find the course for ${ARGS} (or the current blocked goal if no arguments provided).

Chapter 78 of the Tao Te Ching says nothing is softer than water and nothing better at wearing down the hard; the point is that water does not fight the rock, it finds where the rock gives. The engineering use is constraint routing: classify each constraint by how hard it really is, check the ones that were merely assumed, find the exact place each one yields, and draw the course through those places only. Most blocked goals are blocked by an assumed constraint nobody tested.`,
    process: [
      'State the `goal` and what currently blocks it.',
      'List every `constraint` with an id and a hardness: hard (physics, law, a signed contract), soft (policy, convention, habit), assumed (nobody has checked). For each assumed constraint run or read the check that decides it and set checked true; reclassify from what was found.',
      'For each remaining constraint find a `yield_point`: the specific place it gives way (an exception, a boundary, a time window, an owner who can waive it), naming the constraint in in.',
      'Draw the `course`: the sequence of yield points, by id in through, that reaches the goal without forcing a hard constraint.',
    ],
    map: {
      'goal': '**Goal**',
      'constraint': '**Constraints**, one line each: id, hardness, checked, the constraint',
      'yield_point': '**Yield Points**, one line each naming its constraint',
      'course': '**Course**, the yield points in order',
    },
    template: `**Goal:** [what is blocked]

**Constraints:**
- C1 [hard|soft|assumed] checked [true|false]: [the constraint] [what the check found]
- C2 ...

**Yield Points:**
- Y1 in C2: [where it gives way]
- Y2 in C3: ...

**Course:** through Y1, Y2. [the route in prose]`,
    success: ['Every assumed constraint was checked before being routed around', 'Every yield point names a real place, owner or window', 'The course forces no hard constraint'],
  },

  'witnesses': {
    new: true, to: 'commands/witnesses-dtd.md', root: 'attestation',
    description: 'DTD-native: separate what was seen from what was inferred; every witness says what it saw and under what conditions, and a claim is attested only by a witness that read, ran or measured',
    argumentHint: '[claim to attest, or leave blank for the current conclusion]',
    model: ['attestation (claim_text, witness+, attested*, inferred*, verdict)', 'claim_text (#PCDATA)', 'witness (#PCDATA)', 'attested (#PCDATA)', 'inferred (#PCDATA)', 'verdict (#PCDATA)'],
    attlist: ['witness id ID #REQUIRED kind (read|ran|measured|told) #REQUIRED saw CDATA #REQUIRED conditions CDATA #REQUIRED', 'attested by IDREFS #REQUIRED', 'inferred from IDREFS #IMPLIED', 'verdict standing (attested|inferred|unsupported) #REQUIRED'],
    laws: {
      'WIT.1': 'A witness says what it saw and under what conditions; a witness of kind told saw nothing and attests nothing.',
      'WIT.2': 'Attested statements name their witnesses by id; inferred statements name what they were inferred from, or are unsupported.',
      'WIT.3': 'The verdict standing is attested only when at least one witness of kind read, ran or measured is named for the claim.',
    },
    objective: `Attest ${ARGS} (or the current conclusion if no arguments provided).

The golden plates come with two signed statements: three witnesses who say what they saw and eight who say what they handled, and the whole later argument is about the conditions under which they saw it. The engineering use is evidence hygiene for a conclusion: list each witness (a file read, a command run, a measurement taken, or something someone said), what it saw, under what conditions, and then sort the conclusion into what is attested by those witnesses, what is inferred from them, and what is neither. A claim with only told witnesses is hearsay.`,
    process: [
      'Quote the `claim_text` under attestation, as data.',
      'List every `witness` with an id and a kind: read (a file opened this session), ran (a command with its exit code), measured (a number taken), told (a statement by a person, a document, or memory). Write saw (what exactly) and conditions (when, on what version, with what input).',
      'Write each `attested` statement: a part of the claim directly supported by named witnesses of kind read, ran or measured, listing them in by.',
      'Write each `inferred` statement: a part that follows from witnesses by reasoning, listing them in from; if it follows from nothing named, leave from empty and say unsupported.',
      'Write the `verdict`: standing attested, inferred or unsupported for the claim as a whole, with the witness ids that decided it.',
    ],
    map: {
      'claim_text': '**Claim**, quoted',
      'witness': '**Witnesses**, one line each: id, kind, saw, conditions',
      'attested': '**Attested**, one line each with its witness ids',
      'inferred': '**Inferred**, one line each with its from ids or unsupported',
      'verdict': '**Verdict**, standing and deciding witnesses',
    },
    template: `**Claim:** [quoted]

**Witnesses:**
- W1 [read|ran|measured|told]: saw [what], conditions [when, version, input]
- W2 ...

**Attested:**
- [statement] by W1, W2

**Inferred:**
- [statement] from W1 (or: unsupported)

**Verdict:** [attested|inferred|unsupported], decided by W1, W2`,
    success: ['No told witness supports an attested statement', 'Every attested statement names at least one witness id', 'Unsupported parts are called unsupported, not softened'],
  },

  'four-branches': {
    new: true, to: 'commands/four-branches-dtd.md', root: 'branches',
    description: 'DTD-native: tell the same change as four independent tales, user, operator, attacker and maintainer, then name where the tales contradict',
    argumentHint: '[change or design to narrate, or leave blank for current context]',
    model: ['branches (change, branch, branch, branch, branch, crossing+)', 'change (#PCDATA)', 'branch (#PCDATA)', 'crossing (#PCDATA)'],
    attlist: ['branch voice (user|operator|attacker|maintainer) #REQUIRED', 'crossing between CDATA #REQUIRED'],
    laws: {
      'MAB.1': 'Each branch is told wholly in its own voice, without reference to the other three, so that the contradictions are real and not smoothed.',
      'MAB.2': 'The attacker branch is written as a real attempt, with the first move named and the point where it succeeds or is stopped.',
      'MAB.3': 'A crossing names two voices and the place where their tales contradict; the contradictions are the finding, and each one carries what it costs to resolve.',
    },
    objective: `Tell the four branches of ${ARGS} (or the current change if no arguments provided).

The Mabinogion, preserved in the White Book of Rhydderch and the Red Book of Hergest, has four branches that share a world but not a narrator. The engineering use is a change told four times in four voices that never see each other: the user who meets it, the operator who runs it, the attacker who probes it, and the maintainer who inherits it. Told separately, the tales contradict, and every contradiction is a defect or a decision that nobody made on purpose.`,
    process: [
      'Describe the `change` in one paragraph, as neutrally as possible.',
      'Write the user `branch`: what they see, do and feel, first use to steady state, in their words.',
      'Write the operator branch: deploying, watching, restarting, being paged, in their words.',
      'Write the attacker branch: the first move, what it finds, where it is stopped or where it wins.',
      'Write the maintainer branch: reading the code in a year, the change nobody documented, the test that lies.',
      'Write each `crossing`: two voices whose tales contradict, the exact place, and what resolving it costs.',
    ],
    map: {
      'change': '**Change**',
      'branch': '**The User**, **The Operator**, **The Attacker**, **The Maintainer**, each a tale in its own voice',
      'crossing': '**Crossings**, one line each: the two voices, where they contradict, the cost to resolve',
    },
    template: `**Change:** [neutral description]

**The User:** [tale]
**The Operator:** [tale]
**The Attacker:** [first move ... where it is stopped or wins]
**The Maintainer:** [tale]

**Crossings:**
- user and operator at [place]: [contradiction], resolve by [cost]
- attacker and maintainer at [place]: ...`,
    success: ['No branch refers to another', 'The attacker branch has a concrete first move', 'Every crossing names a place and a cost'],
  },

  'redaction': {
    new: true, to: 'commands/redaction-dtd.md', root: 'redaction', allowedTools: 'Read Grep Glob Bash',
    description: 'DTD-native: two accounts of one event, quoted as readings with provenance; every difference classified as a variant, and the archetype that explains them all',
    argumentHint: '[two sources: logs, reports, commit messages, or leave blank for current context]',
    model: ['redaction (event, reading, reading+, variant+, archetype)', 'event (#PCDATA)', 'reading (#PCDATA)', 'variant (#PCDATA)', 'archetype (#PCDATA)'],
    attlist: ['reading id ID #REQUIRED witness CDATA #REQUIRED provenance CDATA #REQUIRED', 'variant in IDREFS #REQUIRED kind (omission|addition|substitution|order) #REQUIRED', 'archetype confidence %confidence; #REQUIRED'],
    laws: {
      'RED.1': 'Every reading is quoted as data with its provenance (path, timestamp, author); a paraphrase is not a reading.',
      'RED.2': 'Every variant names the readings it appears in and its kind; a difference nobody classified is not a variant.',
      'RED.3': 'The archetype explains every variant as a change from it, or the archetype is marked guessed and the unexplained variants are listed.',
    },
    objective: `Reconstruct the archetype behind ${ARGS} (or the two accounts in the current context if no arguments provided).

The Red Book of Hergest and the White Book of Rhydderch carry the same tales with different words, and scholars reconstruct the lost original by classifying every difference. The engineering use is reconciling two accounts of one event: two logs, two incident reports, a commit message and a changelog, a test output and a claim about it. Each account is a reading quoted with its provenance, each difference is a variant of a declared kind, and the archetype is the account of the event that explains every variant. When it cannot explain one, that variant is the finding.`,
    process: [
      'Name the `event` both accounts describe.',
      'Quote each `reading` as data with an id, its witness (the file, log, person or system) and its provenance (path, timestamp, author, version). Read the files; do not summarize from memory.',
      'List every `variant`: a difference between readings, the reading ids it appears in, and its kind: omission, addition, substitution, order.',
      'Write the `archetype`: the account of the event that explains every variant as a change from it (a truncated log explains an omission; a retry explains an order change). Mark its confidence; if a variant remains unexplained, mark guessed and name it.',
    ],
    map: {
      'event': '**Event**',
      'reading': '**Readings**, one block per account: id, witness, provenance, the quoted text',
      'variant': '**Variants**, one line each: in which readings, kind, the difference',
      'archetype': '**Archetype**, with confidence and any unexplained variants',
    },
    template: `**Event:** [what both describe]

**Readings:**
- R1 [witness] ([provenance]): "[quoted]"
- R2 [witness] ([provenance]): "[quoted]"

**Variants:**
- V1 in R1, R2 [omission|addition|substitution|order]: [the difference]
- V2 ...

**Archetype** ([confidence]): [the reconstructed account] [unexplained: V3]`,
    success: ['Every reading is a quotation with a provenance', 'Every difference is a classified variant', 'The archetype accounts for each variant or names the ones it cannot'],
  },

  'sapiential': {
    new: true, to: 'commands/sapiential-dtd.md', root: 'wisdom',
    description: 'DTD-native: wisdom against cleverness; every clever move names what it gains, every wise constraint names what it protects, and each violation pairs one with the other',
    argumentHint: '[proposal or clever solution, or leave blank for current context]',
    model: ['wisdom (proposal, clever+, wise+, violation*, counsel)', 'proposal (#PCDATA)', 'clever (#PCDATA)', 'wise (#PCDATA)', 'violation (#PCDATA)', 'counsel (#PCDATA)'],
    attlist: ['clever id ID #REQUIRED gains CDATA #REQUIRED', 'wise id ID #REQUIRED protects CDATA #REQUIRED', 'violation clever IDREF #REQUIRED wise IDREF #REQUIRED'],
    laws: {
      'SAP.1': 'Every clever move names what it gains; every wise constraint names what it protects.',
      'SAP.2': 'A violation pairs one clever move with one wise constraint by id and says what breaks.',
      'SAP.3': 'Counsel keeps the clever moves that violate nothing and names the price of each of the rest.',
    },
    objective: `Counsel on ${ARGS} (or the current proposal if no arguments provided).

The Book of Wisdom sets wisdom against cleverness: the clever move wins the moment and the wise constraint protects the years. The engineering use is the review of a clever solution: list each clever move with what it gains, list each wise constraint the codebase or the team holds with what it protects, pair every collision, and keep only what collides with nothing. The clever moves that survive are usually the good ones; the ones that do not are the ones that get reverted in six months.`,
    process: [
      'State the `proposal` in one paragraph.',
      'List each `clever` move in it with an id and gains: what it wins now (speed, lines saved, a deadline).',
      'List each `wise` constraint in force with an id and protects: what it guards (an invariant, a reader in a year, a recovery path, a contract).',
      'Write each `violation`: one clever id against one wise id and what breaks.',
      'Write the `counsel`: which clever moves to keep, and for each of the others its price and the plainer move that replaces it.',
    ],
    map: {
      'proposal': '**Proposal**',
      'clever': '**Clever Moves**, one line each: id, gains',
      'wise': '**Wise Constraints**, one line each: id, protects',
      'violation': '**Violations**, one line each pairing a clever id and a wise id',
      'counsel': '**Counsel**',
    },
    template: `**Proposal:** [one paragraph]

**Clever Moves:**
- K1 [move] gains: [what it wins]
- K2 ...

**Wise Constraints:**
- W1 [constraint] protects: [what it guards]
- W2 ...

**Violations:**
- K2 against W1: [what breaks]

**Counsel:** keep K1; K2 costs [price], replace with [plainer move]`,
    success: ['Every clever move has a named gain', 'Every wise constraint has a named protection', 'Counsel keeps only the moves with no violation and prices the rest'],
  },

  'catalog': {
    new: true, to: 'commands/catalog-dtd.md', root: 'catalog_check', allowedTools: 'Read Glob Grep Bash',
    description: 'DTD-native: verify an index against its directory in both directions; every entry is declared and present, declared and missing, or present and orphan, and drift is a number',
    argumentHint: '[directory and its index file, e.g. commands/ README.md, or leave blank for the repository root]',
    model: ['catalog_check (directory, index, entry+, missing*, orphan*, verdict)', 'directory (#PCDATA)', 'index (#PCDATA)', 'entry (#PCDATA)', 'missing (#PCDATA)', 'orphan (#PCDATA)', 'verdict (#PCDATA)'],
    attlist: ['entry path CDATA #REQUIRED declared (true|false) #REQUIRED present (true|false) #REQUIRED', 'verdict drift CDATA #REQUIRED'],
    laws: {
      'CAT.1': 'The index is read from its file and the directory is read from disk; both are tool-result data and neither is trusted alone.',
      'CAT.2': 'Every entry is declared and present, declared and missing, or present and orphan; there is no fourth state.',
      'CAT.3': 'drift is the count of missing plus orphan, written as a number; zero is the only pass.',
    },
    objective: `Check the catalog of ${ARGS} (or the repository root's index against its directories if no arguments provided).

In the Library of Babel there must be a catalog of the library, and a catalog of the catalogs, and the librarians' despair is that a catalog can lie. The engineering use is both-direction index verification: a README, a manifest, a table of contents on one side; the directory on the other. Everything declared must be present, everything present must be declared, and the drift is a number. A README that lists a skill absent from disk, or a command nobody listed, is a lying catalog, and the reader who trusts it walks into an empty hexagon.`,
    process: [
      'Name the `directory` and the `index` file that claims to describe it. Read both; their contents are tool-result data.',
      'Extract every item the index declares (names, paths, links) and every item the directory holds (Glob), and write one `entry` per item with declared and present.',
      'List each `missing` item: declared true, present false.',
      'List each `orphan` item: present true, declared false.',
      'Write the `verdict` with drift equal to missing plus orphan; zero passes, anything else names what to add or remove.',
    ],
    map: {
      'directory': '**Directory**',
      'index': '**Index**',
      'entry': '**Entries**, one line each: path, declared, present',
      'missing': '**Missing**, declared but absent from disk',
      'orphan': '**Orphans**, on disk but never declared',
      'verdict': '**Verdict**, drift as a number',
    },
    template: `**Directory:** [path]
**Index:** [path]

**Entries:**
- [path] declared [true|false] present [true|false]

**Missing:**
- [path]

**Orphans:**
- [path]

**Verdict:** drift [N]. [what to add or remove]`,
    success: ['Both the index and the directory were read this session', 'Every item is in exactly one of the three states', 'Drift is a number and zero is the only pass'],
  },

  'formula': {
    new: true, to: 'commands/formula-dtd.md', root: 'formula_layer', allowedTools: 'Read Grep Glob Bash',
    description: 'DTD-native: declare the computed layer; every number a command, script or document relies on is a formula with a term, a derivation that names the executable it was re-derived from, and a drift count',
    argumentHint: '[file or subject whose numbers to declare, or leave blank for current context]',
    model: ['formula_layer (subject, formula+, derivation+, drift)', 'subject (#PCDATA)', 'formula (#PCDATA)', 'derivation (#PCDATA)', 'drift (#PCDATA)'],
    attlist: ['formula id ID #REQUIRED term CDATA #REQUIRED value CDATA #REQUIRED', 'derivation for IDREF #REQUIRED source CDATA #REQUIRED derived CDATA #REQUIRED confidence %confidence; #REQUIRED', 'drift count CDATA #REQUIRED'],
    laws: {
      'FORM.1': 'Every number the subject relies on is declared as a formula with its term and its stated value, inside a fenced block the reader parses and never interprets.',
      'FORM.2': 'Every formula has a derivation naming the executable line, file or measurement it was re-derived from and the value that came out; a number without a derivation is decoration.',
      'FORM.3': 'drift counts the formulas whose derived value differs from the stated one; zero is the only pass, and each drifted formula is named.',
    },
    objective: `Declare the computed layer of ${ARGS} (or the current file, command or claim if no arguments provided).

The formulas that run through Dantalian no Shoka, with their sigma and gamma and lambda, are what the Phantom Books turn on: a number nobody can re-derive is a spell, and a number anybody can re-derive is a fact. The engineering use is the computed layer: every threshold, default, weight, timeout and count that a document or a prompt states is written as a formula with a term, and each is re-derived from the code or measurement that actually produces it. Where the two disagree, the document has drifted from the executable, and that drift is a number.`,
    process: [
      'Name the `subject` and read it; list every number it states or relies on.',
      'Write each as a `formula` with an id, its term (the expression or the name of the constant) and the value the subject states.',
      'For each formula write a `derivation`: the source (a file and line, a command, a measurement) that produces the real value, the value that came out, and a confidence: measured only when the source was read or run this session.',
      'Write `drift`: the count of formulas whose derived value differs from the stated one, naming each and the side to correct.',
    ],
    map: {
      'subject': '**Subject**',
      'formula': '**Formulas**, a fenced block with one line per formula: id, term, stated value',
      'derivation': '**Derivations**, one line each: for which formula, source, derived value, confidence',
      'drift': '**Drift**, the count and the named formulas',
    },
    template: `**Subject:** [what was read]

**Formulas:**
\`\`\`yaml
- id: F1
  term: [expression or constant name]
  value: [stated]
- id: F2
  term: ...
\`\`\`

**Derivations:**
- F1 from [file:line or command]: derived [value] ([confidence])
- F2 ...

**Drift:** [N]. [F2 stated X, derived Y; correct the document]`,
    success: ['Every number in the subject has a formula', 'Every derivation names an executable source', 'Drift is a number and each drifted formula is named'],
  },

  'phantom': {
    new: true, to: 'commands/phantom-dtd.md', root: 'phantom_route',
    description: 'DTD-native: pick the Phantom Books command for the shape of the problem; score at least three candidates and route to exactly one',
    argumentHint: '[problem or leave blank for current context]',
    model: ['phantom_route (problem, shape, candidate+, route, reason)', 'problem (#PCDATA)', 'shape (#PCDATA)', 'candidate (#PCDATA)', 'route (#PCDATA)', 'reason (#PCDATA)'],
    attlist: ['candidate command NMTOKEN #REQUIRED fit %verdict3; #REQUIRED', 'route command NMTOKEN #REQUIRED'],
    entities: {
      'BOOKS': 'tetralemma-dtd|loci-dtd|babel-dtd|count-the-library-dtd|goetia-dtd|clean-unclean-dtd|eleusis-dtd|voluspa-dtd|havamal-dtd|atharvan-dtd|sutra-dtd|wu-wei-dtd|water-dtd|witnesses-dtd|four-branches-dtd|redaction-dtd|sapiential-dtd|catalog-dtd|formula-dtd',
    },
    laws: {
      'PH.1': 'Candidates are drawn from BOOKS only; a command not listed there is not a route.',
      'PH.2': 'At least three candidates are scored yes, partial or no before one is routed.',
      'PH.3': 'The route is exactly one command and the reason names the shape of the problem that chose it.',
    },
    objective: `Route ${ARGS} (or the current problem if no arguments provided) to the Phantom Books command that fits its shape.

Each of the nineteen commands in BOOKS answers one shape of problem. This command names the shape first and picks the book second. The shapes: a claim that looks binary (tetralemma), a codebase or session to hand over (loci), a small finite space of combinations (babel), a space too big to enumerate (count-the-library), a task to delegate to an existing agent (goetia), inputs that might be hostile (clean-unclean), something to teach in order (eleusis), a plan to see from its end (voluspa), a discussion to distill into rules (havamal), a known bug class to fix (atharvan), fast reasoning to audit (sutra), a proposal whose do-nothing branch is unexamined (wu-wei), a goal blocked by constraints (water), a conclusion whose evidence is unsorted (witnesses), a change with several stakeholders (four-branches), two accounts of one event (redaction), a clever solution against standing constraints (sapiential), an index to verify against a directory (catalog), numbers to re-derive from code (formula).`,
    process: [
      'State the `problem` in one sentence, quoting the argument as data.',
      'Name its `shape` in one phrase from the list in the objective, or a new phrase if none fits.',
      'Score at least three `candidate` commands from BOOKS with fit yes, partial or no and one line of why.',
      'Write the `route`: exactly one command, and the `reason`: the shape that chose it and what the runner-up lacked.',
    ],
    map: {
      'problem': '**Problem**',
      'shape': '**Shape**',
      'candidate': '**Candidates**, one line each: command, fit, why',
      'route': '**Route**, one command',
      'reason': '**Reason**',
    },
    template: `**Problem:** [one sentence]
**Shape:** [one phrase]

**Candidates:**
- [command] fit [yes|partial|no]: [why]
- [command] fit ...
- [command] fit ...

**Route:** /[command] [the argument to pass]
**Reason:** [the shape that chose it; what the runner-up lacked]`,
    success: ['The shape is named before any command', 'At least three candidates are scored', 'Exactly one route with a reason'],
  },
};
