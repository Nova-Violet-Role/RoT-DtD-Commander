<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
<!-- Portions Copyright 2025 Lex Christopherson, MIT (taches-cc-resources); see NOTICE.md. -->
<overview>

Standard metadata structure for research and plan outputs. Include it in every research, plan and refine prompt, so the next stage reads the confidence, the dependencies, the open questions and the assumptions from one block instead of hunting for them across the answer.

</overview>

<metadata_structure>

```xml
<metadata>
  <confidence level="{high|medium|low}">

    {Why this confidence level}

  </confidence>
  <dependencies>

    {What's needed to proceed}

  </dependencies>
  <open_questions>

    {What remains uncertain}

  </open_questions>
  <assumptions>

    {What was assumed}

  </assumptions>
</metadata>
```

</metadata_structure>

<confidence_levels>

- **high**: Official docs, verified patterns, clear consensus, few unknowns
- **medium**: Mixed sources, some outdated info, minor gaps, reasonable approach
- **low**: Sparse documentation, conflicting info, significant unknowns, best guess

</confidence_levels>

<dependencies_format>

External requirements that must be met:
```xml
<dependencies>

  - API keys for third-party service
  - Database migration completed
  - Team trained on new patterns

</dependencies>
```

</dependencies_format>

<open_questions_format>

What couldn't be determined or needs validation:
```xml
<open_questions>

  - Actual rate limits under production load
  - Performance with >100k records
  - Specific error codes for edge cases

</open_questions>
```

</open_questions_format>

<assumptions_format>

Context assumed that might need validation:
```xml
<assumptions>

  - Using REST API (not GraphQL)
  - Single region deployment
  - Node.js/TypeScript stack

</assumptions>
```

</assumptions_format>
