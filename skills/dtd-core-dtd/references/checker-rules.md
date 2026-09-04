<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
# Checker rules C1 to C16

Applied by `lib/dtd.mjs check()` to the RESOLVED text of a file (includes inlined). An error fails the file; a warning is printed and does not.

| Code | Rule | Fix |
|---|---|---|
| C1 | YAML frontmatter opens at line 1 and has a `description` | Put `---` on line 1; add `description:` |
| C2 | Exactly one `<!DOCTYPE name [ ... ]>`; only ELEMENT, ATTLIST, ENTITY, NOTATION declarations inside | Remove the second DOCTYPE; fix the unknown declaration |
| C3 | The DOCTYPE root is declared as an ELEMENT | Add `<!ELEMENT root (...)>` |
| C4 | Every element named in a content model or ATTLIST is declared | Declare it, or include the subset that does |
| C5 | Every locally declared element, and the root, is named in the body as `<name` or in backticks | Name it in the grammar_map or the prose |
| C6 | No `%name;` remains unresolved | Declare the parameter entity, or fix the include path |
| C7 | Every NDATA channel is named in the body | Add the channel to the trust_boundary |
| C8 | No `(CDATA)` content model | Use `(#PCDATA)` and a `trust (cdata) #FIXED "cdata"` attribute |
| C9 | No BOM, no CR byte | Write with the installer or `writeLF` |
| C10 | LAW.* entities declared, and the body invokes them (the string `LAW.` appears) | Add the success criterion line |
| C11 | Entity values contain no `&`, `%` or `<` | Rephrase the value |
| C12 | No `--` inside a DOCTYPE comment | Rephrase the comment |
| C13 | Every grammar_map heading carries the command's sigil (one sigil per file), the map invokes LAW.CORE.6, every declared heading is rendered in the template as `### <sigil> Heading` (or as bold with the sigil when nested), and every `###` line has a blank line before and after | Run `node checker/heading-sweep.mjs` |
| C14 | No bare front-matter value carries `: ` or ` #`; a YAML parser reads a nested mapping or a comment there (GitHub's renderer: "mapping values are not allowed in this context") | Quote the value, or run `node checker/frontmatter-sweep.mjs` |
| C15 | an element the root requires that no `grammar_map` row renders | a command promising a slot its reader has no way to fill |
| C16 | an entity redeclared after the subset that already declares it | XML binds the first; the second text governs nothing |

Elements declared by an included subset are exempt from C5 in the including file; they are checked across the corpus by the dtd-contract-auditor agent instead.

Controls that were run before the checker's green was trusted: removing `<!ELEMENT factor (#PCDATA)>` from a copy of pareto-dtd.md produced `C4 element vital references undeclared factor` and exit 1; changing `trivial` to `(CDATA)` and adding an undeclared-in-body `orphan` produced C8, C4 and C5 and exit 1.
