<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
# Spec entry shape

A spec is a JSON file (`dtd/forge-spec.json`) or an ES module exporting an object (`dtd/new-commands-a.spec.mjs`). Keys are entry names; `node bin/rot-dtd-commander.mjs forge <spec> [names]` builds the ones named, or all.

## Conversion entry (existing original)

```json
"pareto": {
  "from": "commands/pareto.md",
  "to": "commands/pareto-dtd.md",
  "root": "pareto",
  "include": ["cc-ask"],
  "model": ["pareto (vital+, trivial*, bottom_line)", "vital (factor, why, action)", "factor (#PCDATA)"],
  "attlist": ["pareto depth %depth; \"comprehensive\""],
  "laws": {"PARETO.1": "..."},
  "entities": {"SECTIONS.x": "A|B|C"},
  "map": {"vital": "**Vital Few**, one `vital` per factor with `factor`, `why`, `action`"},
  "replace": [["Skill(old)", "Skill(old-dtd)"]],
  "name": "only for files with a name: field",
  "copyDir": false,
  "mapTag": "output_format"
}
```

The forge keeps the original prose, prefixes the description with `DTD-amplified:`, inserts the DOCTYPE and a trust_boundary after the frontmatter, wraps `$ARGUMENTS` in a quoted element (commands only), inserts a grammar_map at the top of output_format (or appends a `mapTag` block), and appends two success criteria.

## New entry (no original)

```js
'tetralemma': {
  new: true, to: 'commands/tetralemma-dtd.md', root: 'tetralemma',
  description: '...', argumentHint: '[...]', allowedTools: 'Read Grep',
  include: [], model: [...], attlist: [...], laws: {...}, entities: {...},
  objective: `... ${ARGS} ...`,
  process: ['step one', 'step two'],
  extra: { intake_gate: '...' },
  map: { proposition: '**Proposition**' },
  template: `**Proposition:** ...`,
  success: ['...'],
}
```

`ARGS` is the constant `<quoted trust="cdata" source="user-args">$ARGUMENTS</quoted>`. The forge assembles frontmatter, DOCTYPE, trust_boundary, objective, process, extra blocks, output_format with grammar_map and template, and success_criteria.

## Rules the entry must satisfy

- Every element in `model` (except those from included subsets) appears in `map` or in the template text in backticks.
- Entity values contain no `&`, `%` or `<`.
- Element names are lowercase with underscores; a root name cannot start with a digit (`5-whys` became `five_whys`).
- Laws are numbered from 1 under one prefix per file.
