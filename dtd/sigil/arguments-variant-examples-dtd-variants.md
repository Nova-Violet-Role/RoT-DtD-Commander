<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
```markdown
# DTD / PCDATA / CDATA / NDATA × $ARGUMENTS — Complete Variant Reference

---

## 1. Core Definitions

| Term | Full Name | Context | Parsed? | Special Chars (`<`, `>`, `&`) |
|------|-----------|---------|---------|-------------------------------|
| **PCDATA** | Parsed Character Data | Element content model in DTD | **Yes** — entities resolved, tags parsed | Must be escaped: `&lt;` `&gt;` `&amp;` |
| **CDATA** (section) | Character Data | Marked section `<![CDATA[...]]>` in document | **No** — literal text | Allowed as-is (only `]]>` terminates) |
| **CDATA** (attribute type) | Character Data | `<!ATTLIST` type declaration | **Yes** — entities resolved | Must be escaped |
| **NDATA** | Notation Data | External unparsed entity declaration | **No** — never parsed as XML | N/A (binary/foreign data) |
| **RCDATA** | Replaceable Character Data | HTML/SGML element content | **Yes** — character refs decoded, tags NOT parsed | `<` starts tag; `&` starts entity ref |
| **SDATA** | Specific Data | SGML only (not in XML) | No | Defined by notation |

### 1.1 The Three "CDATA" Confusions

```
┌─────────────────────────────────────────────────────────────────────┐
│  CDATA #1: DTD attribute type                                       │
│  <!ATTLIST img src CDATA #REQUIRED>                                 │
│  → "src can hold any text" (entities ARE resolved)                  │
├─────────────────────────────────────────────────────────────────────┤
│  CDATA #2: Marked section in document                               │
│  <script><![CDATA[ if (a < b) ... ]]></script>                      │
│  → "treat everything between as literal" (entities NOT resolved)    │
├─────────────────────────────────────────────────────────────────────┤
│  CDATA #3: SGML entity type (not in XML)                            │
│  <!ENTITY logo CDATA "logo.png">                                    │
│  → "entity value is raw data" (XML drops this)                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. DTD Declaration Forms (All Variants)

### 2.1 Element Declarations

```dtd
<!ELEMENT name (#PCDATA)>              <!-- text only -->
<!ELEMENT name (child1, child2)>       <!-- element content, fixed order -->
<!ELEMENT name (child1+, child2*)>     <!-- with quantifiers -->
<!ELEMENT name (child1 | child2)*>     <!-- mixed with PCDATA -->
<!ELEMENT name ANY>                     <!-- anything goes -->
<!ELEMENT name EMPTY>                   <!-- no content -->
```

### 2.2 Attribute Declarations — All 8 Types

| Type | Meaning | Example |
|------|---------|---------|
| `CDATA` | Any character data (string) | `<!ATTLIST e x CDATA #REQUIRED>` |
| `ID` | Unique identifier | `<!ATTLIST e x ID #REQUIRED>` |
| `IDREF` | Reference to an ID | `<!ATTLIST e x IDREF #IMPLIED>` |
| `IDREFS` | List of IDREFs | `<!ATTLIST e x IDREFS #IMPLIED>` |
| `ENTITY` | Name of an unparsed entity | `<!ATTLIST img src ENTITY #REQUIRED>` |
| `ENTITIES` | List of entity names | `<!ATTLIST e x ENTITIES #IMPLIED>` |
| `NMTOKEN` | Valid name token | `<!ATTLIST e x NMTOKEN #IMPLIED>` |
| `NMTOKENS` | List of NMTOKENs | `<!ATTLIST e x NMTOKENS #IMPLIED>` |
| `#FIXED "val"` | Fixed value | `<!ATTLIST e x CDATA #FIXED "yes">` |
| `"default"` | Default value | `<!ATTLIST e x CDATA "auto">` |

### 2.3 Entity Declarations — All 4 Forms

```dtd
<!-- 1. Internal General Entity (parsed) -->
<!ENTITY copyright "© 2026">

<!-- 2. External General Entity (parsed) -->
<!ENTITY chapter1 SYSTEM "chapter1.xml">

<!-- 3. External General Entity (UNPARSED — NDATA) -->
<!ENTITY logo SYSTEM "logo.gif" NDATA gif>

<!-- 4. Parameter Entity (DTD-only, parsed) -->
<!%ENTITY common SYSTEM "common.dtd">
```

### 2.4 Notation Declarations (Required for NDATA)

```dtd
<!NOTATION gif PUBLIC "GIF Image" "image/gif">
<!NOTATION jpeg SYSTEM "image/jpeg">
<!NOTATION pdf SYSTEM "application/pdf">
<!NOTATION yaml SYSTEM "application/x-yaml">
<!NOTATION nt SYSTEM "application/x-nestedtext">
```

---

## 3. $ARGUMENTS × DTD — Polyglot Examples

### 3.1 Bash → DTD Generation (with `$@`)

```bash
#!/bin/bash
# ./gen_dtd.sh element1 element2 element3

cat > output.dtd <<EOF
<!ELEMENT root (item+)>
<!ELEMENT item (#PCDATA)>
<!ATTLIST item id ID #REQUIRED>
<!ATTLIST item type CDATA "$1">
EOF

# Append dynamic elements from args
for arg in "$@"; do
  echo "<!ELEMENT ${arg} (#PCDATA)>" >> output.dtd
done

# Add NDATA entity for a binary file
echo '<!ENTITY diagram SYSTEM "diagram.png" NDATA png>' >> output.dtd
echo '<!NOTATION png SYSTEM "image/png">' >> output.dtd
```

### 3.2 Bash → XML with CDATA (embedding `$@` safely)

```bash
#!/bin/bash
# ./gen_xml.sh "a < b" 'c & d' 'e > f'

# PCDATA approach: escape special chars
escaped=()
for arg in "$@"; do
  esc=$(printf '%s' "$arg" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')
  escaped+=("$esc")
done

# CDATA approach: no escaping needed
cat > output.xml <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root [
  <!ELEMENT root (item+)>
  <!ELEMENT item (#PCDATA)>
]>
<root>
  <!-- PCDATA items (escaped) -->
  <item>${escaped[0]}</item>
  <item>${escaped[1]}</item>
  <item>${escaped[2]}</item>

  <!-- CDATA items (raw) -->
  <item><![CDATA[$1]]></item>
  <item><![CDATA[$2]]></item>
  <item><![CDATA[$3]]></item>
</root>
EOF
```

### 3.3 `$@` in CDATA Sections — The Safe Embedding

```bash
#!/bin/bash
# ./embed_code.sh "function() { if (a < b) { return a; } }"

cat > output.xml <<EOF
<?xml version="1.0"?>
<code>
  <![CDATA[
$1
  ]]>
</code>
EOF
```

> **Key insight:** CDATA sections are the XML equivalent of a **quoted heredoc** (`<<'EOF'`) — the content is never parsed, so `$@` values containing `<`, `>`, `&` are safe.

### 3.4 `$@` in PCDATA — The Escaped Embedding

```bash
#!/bin/bash
# ./embed_pcdata.sh "Hello <World>" "A & B"

# Must escape: & < >
xml_escape() {
  printf '%s' "$1" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g'
}

cat > output.xml <<EOF
<?xml version="1.0"?>
<root>
  <greeting>$(xml_escape "$1")</greeting>
  <pair>$(xml_escape "$2")</pair>
</root>
EOF
# Output:
# <greeting>Hello &lt;World&gt;</greeting>
# <pair>A &amp; B</pair>
```

### 3.5 `$@` as NDATA Entity References

```bash
#!/bin/bash
# ./gen_unparsed.sh path/to/image.png path/to/data.bin

# $1 = path to a PNG, $2 = path to a binary file
cat > document.xml <<EOF
<?xml version="1.0"?>
<!DOCTYPE doc [
  <!NOTATION png SYSTEM "image/png">
  <!NOTATION bin SYSTEM "application/octet-stream">
  <!ENTITY img1 SYSTEM "$1" NDATA png>
  <!ENTITY data1 SYSTEM "$2" NDATA bin>
  <!ELEMENT doc (figure+)>
  <!ELEMENT figure EMPTY>
  <!ATTLIST figure src ENTITY #REQUIRED>
]>
<doc>
  <figure src="img1"/>
  <figure src="data1"/>
</doc>
EOF
```

> **NDATA = "don't parse this file."** The XML processor records the URI but never reads the content. The *application* (browser, viewer) resolves it.

### 3.6 `$@` in Parameter Entities (DTD-only)

```bash
#!/bin/bash
# ./gen_param_dtd.sh "utf-8" "en"

cat > header.dtd <<EOF
<!ENTITY encoding "ISO-8709-1 $1">
<!ENTITY lang "$2">
<!ELEMENT page (title, body)>
<!ELEMENT title (#PCDATA)>
<!ELEMENT body (#PCDATA)>
<!ATTLIST page lang CDATA "$2">
EOF
```

> ⚠️ Parameter entities (`%entity`) can **only** be used inside DTDs, never in document content.

### 3.7 `$@` in Conditional DTD Sections

```bash
#!/bin/bash
# ./gen_conditional_dtd.sh strict relaxed

mode="${1:-strict}"

cat > output.dtd <<EOF
<!ELEMENT root (title, content)>
<!ELEMENT title (#PCDATA)>

<!%if-strict [
<!ELEMENT content (para+)>
<!ELEMENT para (#PCDATA)>
<!ATTLIST para id ID #REQUIRED>
]>

<!%if-relaxed [
<!ELEMENT content ANY>
]>
EOF
```

### 3.8 `$@` → NestedText via CDATA Extraction

```bash
#!/bin/bash
# ./xml_to_nt.sh "server: localhost" "port: 8080" "db: myapp"

# Step 1: Generate XML with CDATA
cat > temp.xml <<EOF
<?xml version="1.0"?>
<config>
  <value><![CDATA[$1]]></value>
  <value><![CDATA[$2]]></value>
  <value><![CDATA[$3]]></value>
</config>
EOF

# Step 2: Extract CDATA content → NestedText
cat > output.nt <<EOF
config:
EOF
for arg in "$@"; do
  echo "  - $arg" >> output.nt
done
```

### 3.9 `$@` → Markdown Callout via CDATA

```bash
#!/bin/bash
# ./xml_to_md.sh "warning" "Disk usage at 95%"

level="$1"
message="$2"

# Map to callout type
case "$level" in
  warning) callout="warning" ;;
  error)   callout="danger" ;;
  info)    callout="info" ;;
  *)       callout="note" ;;
esac

cat > output.md <<EOF
> [!$callout] Alert
> $message
>
> \`\`\`xml
> <alert level="$level">
>   <![CDATA[$message]]>
> </alert>
> \`\`\`
EOF
```

---

## 4. PCDATA vs CDATA vs NDATA — $ARGUMENTS Comparison Matrix

| Scenario | PCDATA | CDATA Section | NDATA |
|----------|--------|---------------|-------|
| Arg contains `<` | Must escape → `&lt;` | Safe as-is | N/A (binary) |
| Arg contains `&` | Must escape → `&amp;` | Safe as-is | N/A |
| Arg contains `]]>` | Safe | **BROKEN** (terminates section) | N/A |
| Arg is binary | ❌ Invalid | ❌ Invalid | ✅ |
| Arg is multi-line | ✅ (whitespace normalized) | ✅ (preserved) | ✅ |
| Arg contains XML tags | Parsed as markup ❌ | Treated as text ✅ | N/A |
| Parser resolves entities? | **Yes** | **No** | **No** |
| Equivalent shell concept | `<<EOF` (expanded) | `<<'EOF'` (literal) | File reference (not read) |

### 4.1 The `]]>` Collision

```bash
#!/bin/bash
# DANGEROUS: arg contains ]]
arg1='value with ]]> in it'

# CDATA section BREAKS:
cat <<EOF
<item><![CDATA[$arg1]]></item>
EOF
# Output: <item><![CDATA[value with ]]></item>
#                                    ^^^^^ TERMINATES CDATA!
# Remaining: > in it]]></item>  → INVALID XML

# FIX: split or escape
safe=${arg1//\]\]>/\]\]\]\[CDATA[>\[CDATA[}
cat <<EOF
<item><![CDATA[$safe]]></item>
EOF
```

### 4.2 PCDATA Whitespace Normalization

```bash
#!/bin/bash
# PCDATA normalizes: newlines → spaces, tabs → spaces, multiple spaces → one
arg=$'line1\nline2\tline3'

# PCDATA result: "line1 line2 line3"
cat <<EOF
<item>$arg</item>
EOF

# CDATA result: preserved exactly
cat <<EOF
<item><![CDATA[$arg]]></item>
EOF
```

---

## 5. NDATA — Deep Dive with $ARGUMENTS

### 5.1 What NDATA Actually Does

```
┌────────────────────────────────────────────────────────────────┐
│  XML Processor sees:                                           │
│    <!ENTITY img SYSTEM "photo.png" NDATA png>                  │
│                                                                │
│  → Records: "img" → URI "photo.png", type "png"               │
│  → Does NOT read the file                                      │
│  → Does NOT parse the content                                  │
│                                                                │
│  Application (browser, viewer) sees:                           │
│    <figure src="img"/>                                         │
│  → Resolves "img" → "photo.png" → renders as PNG              │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Generating NDATA DTDs from `$@`

```bash
#!/bin/bash
# ./gen_assets.sh logo.png chart.svg data.csv

cat > assets.dtd <<'EOF'
<!NOTATION png SYSTEM "image/png">
<!NOTATION svg SYSTEM "image/svg+xml">
<!NOTATION csv SYSTEM "text/csv">
EOF

for arg in "$@"; do
  ext="${arg##*.}"
  name="${arg%.*}"
  case "$ext" in
    png)  notation="png" ;;
    svg)  notation="svg" ;;
    csv)  notation="csv" ;;
    *)    notation="bin"; echo '<!NOTATION bin SYSTEM "application/octet-stream">' >> assets.dtd ;;
  esac
  echo "<!ENTITY ${name} SYSTEM \"${arg}\" NDATA ${notation}>" >> assets.dtd
done
```

### 5.3 NDATA + `$@` in a Full Document

```bash
#!/bin/bash
# ./report.sh image.png data.csv

cat > report.xml <<EOF
<?xml version="1.0"?>
<!DOCTYPE report [
  <!NOTATION png SYSTEM "image/png">
  <!NOTATION csv SYSTEM "text/csv">
  <!ENTITY chart SYSTEM "$1" NDATA png>
  <!ENTITY data  SYSTEM "$2" NDATA csv>
  <!ELEMENT report (title, figure, table)>
  <!ELEMENT title (#PCDATA)>
  <!ELEMENT figure EMPTY>
  <!ELEMENT table EMPTY>
  <!ATTLIST figure src ENTITY #REQUIRED>
  <!ATTLIST table src ENTITY #REQUIRED>
]>
<report>
  <title>Quarterly Report</title>
  <figure src="chart"/>
  <table src="data"/>
</report>
EOF
```

---

## 6. Polyglot: DTD × YAML × NestedText × Markdown

### 6.1 Bash → XML/DTD → YAML (3-layer)

```bash
#!/bin/bash
# ./polyglot1.sh "prod" "eu-west-1" "3"

cat > config.xml <<EOF
<?xml version="1.0"?>
<!DOCTYPE config [
  <!ELEMENT config (env, region, replicas)>
  <!ELEMENT env (#PCDATA)>
  <!ELEMENT region (#PCDATA)>
  <!ELEMENT replicas (#PCDATA)>
  <!ATTLIST config version CDATA "1.0">
]>
<config version="1.0">
  <env><![CDATA[$1]]></env>
  <region><![CDATA[$2]]></region>
  <replicas>$3</replicas>
</config>
EOF

# Equivalent YAML (what the XML represents)
cat > config.yaml <<EOF
config:
  version: "1.0"
  env: $1
  region: $2
  replicas: $3
EOF
```

### 6.2 Bash → XML/CDATA → NestedText (3-layer)

```bash
#!/bin/bash
# ./polyglot2.sh "server: localhost" "port: 8080"

# XML with CDATA holding NestedText
cat > wrapper.xml <<EOF
<?xml version="1.0"?>
<schema>
  <nt><![CDATA[
server:
  host: $1
  port: $2
  status:
    > healthy
    > uptime: 99.97%
  ]]></nt>
</schema>
EOF
```

Extracting the CDATA content gives valid `.nt`.

### 6.3 Bash → XML/NDATA → Binary (3-layer)

```bash
#!/bin/bash
# ./polyglot3.sh "payload.sh" "checksum"

# The NDATA entity points to a script
cat > manifest.xml <<EOF
<?xml version="1.0"?>
<!DOCTYPE manifest [
  <!NOTATION script SYSTEM "application/x-sh">
  <!ENTITY payload SYSTEM "$1" NDATA script>
  <!ELEMENT manifest (name, artifact)>
  <!ELEMENT name (#PCDATA)>
  <!ELEMENT artifact EMPTY>
  <!ATTLIST artifact src ENTITY #REQUIRED>
  <!ATTLIST artifact checksum CDATA "$2">
]>
<manifest>
  <name>deploy-script</name>
  <artifact src="payload" checksum="$2"/>
</manifest>
EOF
```

### 6.4 Full-Stack: Bash → XML → DTD → CDATA → NT → MD Callout (5-layer)

```bash
#!/bin/bash
# ./fullstack.sh "Build" "Deploy" "Test"

cat > full.xml <<EOF
<?xml version="1.0"?>
<!DOCTYPE pipeline [
  <!ELEMENT pipeline (meta, steps)>
  <!ELEMENT meta (title, count)>
  <!ELEMENT title (#PCDATA)>
  <!ELEMENT count (#PCDATA)>
  <!ELEMENT steps (step+)>
  <!ELEMENT step (#PCDATA)>
  <!ATTLIST pipeline args CDATA "$*">
]>
<pipeline args="$*">
  <meta>
    <title>CI/CD Report</title>
    <count>$#</count>
  </meta>
  <steps>
    <step><![CDATA[$1]]></step>
    <step><![CDATA[$2]]></step>
    <step><![CDATA[$3]]></step>
  </steps>
</pipeline>
EOF
```

**Five valid interpretations:**

| Layer | Parser | Sees |
|-------|--------|------|
| 1 | **Bash** | Heredoc, expands `$1 $2 $3 $# $*` |
| 2 | **XML** | Well-formed document with CDATA sections |
| 3 | **DTD** | Validates structure (pipeline → meta + steps) |
| 4 | **CDATA** | Raw text: "Build", "Deploy", "Test" |
| 5 | **Application** | Extracts text → renders as list or callout |

---

## 7. Security: $ARGUMENTS × DTD/CDATA/NDATA Injection

### 7.1 XML External Entity (XXE) via `$@`

```bash
#!/bin/bash
# DANGEROUS: $1 = "file:///etc/passwd"
cat > vulnerable.xml <<EOF
<?xml version="1.0"?>
<!DOCTYPE root [
  <!ENTITY xxe SYSTEM "$1">
]>
<root>&xxe;</root>
EOF
# Parser reads /etc/passwd and includes it in the document!
```

**Mitigation:**
```bash
# 1. Disable DTD processing in the parser
# 2. Validate $1 against a whitelist
[[ "$1" =~ ^[a-zA-Z0-9._/-]+$ ]] || exit 1
# 3. Use CDATA for untrusted content (no entity resolution)
```

### 7.2 CDATA Termination Injection

```bash
#!/bin/bash
# DANGEROUS: $1 = "]]><script>alert(1)</script>"
cat > output.xml <<EOF
<msg><![CDATA[$1]]></msg>
EOF
# Output: <msg><![CDATA[]]><script>alert(1)</script>]]></msg>
# → CDATA terminates early, raw <script> is injected!

# FIX:
safe=${1//\]\]>/\]\]\]\[CDATA[>\[CDATA[}
cat > output.xml <<EOF
<msg><![CDATA[$safe]]></msg>
EOF
```

### 7.3 PCDATA Escape Bypass

```bash
#!/bin/bash
# If you forget to escape:
# $1 = '"><img src=x onerror=alert(1)>'
cat > output.xml <<EOF
<item attr="$1">$1</item>
EOF
# → <item attr=""><img src=x onerror=alert(1)">"><img src=x onerror=alert(1)></item>
# → Attribute breakout + element injection

# FIX: escape all 5 XML special chars
xml_escape() {
  printf '%s' "$1" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g; s/'"'"'/\&apos;/g'
}
```

### 7.4 NDATA Path Traversal

```bash
#!/bin/bash
# DANGEROUS: $1 = "../../etc/shadow"
cat > doc.xml <<EOF
<!ENTITY evil SYSTEM "$1" NDATA bin>
EOF
# Application resolves to /etc/shadow

# FIX:
[[ "$1" != ".."/* && "$1" != */../* ]] || exit 1
[[ "$1" =~ ^[a-zA-Z0-9._/-]+$ ]] || exit 1
```

### 7.5 Parameter Entity DTD Injection

```bash
#!/bin/bash
# DANGEROUS: $1 = '"><!ENTITY xxe SYSTEM "file:///etc/passwd">'
cat > dtd.dtd <<EOF
<!%ENTITY user "$1">
EOF
# → DTD is corrupted, new entity declared

# FIX: parameter entities should NEVER take user input directly
```

### 7.6 Billion Laughs via `$@` (DoS)

```bash
#!/bin/bash
# If $@ contains 9 nested anchor/alias levels:
# (This is a YAML attack, but the XML equivalent is recursive entities)

cat > dos.xml <<EOF
<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
  <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
  <!ENTITY lol5 "&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;&lol4;">
]>
<lolz>&lol5;</lolz>
EOF
# 9^5 = 59,049 "lol" strings from ~500 bytes
```

---

## 8. SGML Extensions (Beyond XML)

### 8.1 SDATA (Specific Data) — SGML Only

```sgml
<!ENTITY logo SDATA "logo.png">
<!-- SGML: entity value is raw data, not parsed -->
<!-- XML: does NOT support SDATA -->
```

### 8.2 RCDATA (Replaceable Character Data)

```html
<!-- HTML: title is RCDATA -->
<title>5 < 6 & 7 > 6</title>
<!-- < starts a tag (parsed), & starts an entity ref (decoded) -->
<!-- But &lt; and &amp; ARE decoded -->

<!-- XML equivalent: use CDATA section -->
<title><![CDATA[5 < 6 & 7 > 6]]></title>
```

### 8.3 SGML Data Attributes on Entities

```sgml
<!-- SGML allows data attributes on entity declarations -->
<!ENTITY config SYSTEM "config.yaml" NDATA yaml
       (encoding, line-endings)>

<!-- XML does NOT support this -->
```

---

## 9. Equivalent Mapping: Shell × XML × YAML × NT

| Concept | Shell | XML/DTD | YAML | NestedText |
|---------|-------|---------|------|------------|
| Literal string (no expansion) | `<<'EOF'` | `<![CDATA[...]]>` | `"\|-"` (block scalar strip) | `> text` (multiline) |
| Expanded string | `<<EOF` | PCDATA (entities resolved) | `\|` (literal block) | `key: value` |
| Binary/foreign data | `cat file.bin` | `NDATA notation` | N/A | N/A |
| Escape special chars | `printf '%q'` | `&lt;` `&gt;` `&amp;` | Quote with `"` | N/A (no special chars) |
| Comment | `#` | `<!-- -->` | `#` | `#` |
| Variable reference | `$1` | `&entity;` | `*alias` | N/A |
| Definition | `VAR=value` | `<!ENTITY name "val">` | `&anchor` | N/A |
| Conditional | `if` / `case` | `<!%if [ ... ]>` | N/A | N/A |
| Include | `source file` | `<!ENTITY x SYSTEM "file">` | N/A | N/A |
| Type declaration | N/A | `<!NOTATION>` / `<!ATTLIST>` | N/A | N/A |

