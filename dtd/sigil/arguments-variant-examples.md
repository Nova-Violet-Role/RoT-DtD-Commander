<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
```markdown
# $ARGUMENTS — Complete Variant Reference

## 1. Positional Parameters — All Forms

| Variable | Meaning | Example |
|----------|---------|---------|
| `$0` | Script name | `./deploy.sh` |
| `$1` – `$9` | 1st–9th argument | `$1=host`, `$2=port` |
| `${10}` – `${99}` | 10th+ argument (braces required) | `${10}=token` |
| `$@` | All args as separate words | `a b c` → 3 words |
| `$*` | All args as single word | `a b c` → 1 word |
| `$#` | Count of arguments | `3` |

### 1.1 Quoting Matrix (Critical)

| Form | Expansion | Word Splitting | Result |
|------|-----------|----------------|--------|
| `"$@"` | Each param → separate word | **No** | `"$1" "$2" "$3"` ✓ |
| `"$*"` | All params → single word | **No** | `"$1 $2 $3"` (IFS-joined) |
| `$@` | Each param → separate word | **Yes** (IFS) | `a b c` → `a`, `b`, `c` |
| `$*` | All params → single word | **Yes** (IFS) | `a b c` → `a`, `b`, `c` |

> **Rule:** Always use `"$@"`. The other three forms are almost never correct.

```bash
#!/bin/bash
# Demo: ./demo.sh "John Doe" 1965

echo "Unquoted \$@:   $(for x in $@;    do printf '[%s] ' "$x"; done)"
# [John] [Doe] [1965]   ← BROKEN (word-split)

echo "Quoted  \$@:   $(for x in "$@";   do printf '[%s] ' "$x"; done)"
# [John Doe] [1965]     ← CORRECT

echo "Quoted  \$*:   $(for x in "$*";   do printf '[%s] ' "$x"; done)"
# [John Doe 1965]       ← ONE WORD

echo "Unquoted \$*:  $(for x in $*;     do printf '[%s] ' "$x"; done)"
# [John] [Doe] [1965]   ← BROKEN (word-split)
```

---

## 2. Parameter Expansion on `$@` / `$*`

| Syntax | Meaning | Example (args: `0 1 2 3 4 5 6`) |
|--------|---------|------|
| `${@:offset}` | Args from `offset` to end | `${@:3}` → `3 4 5 6` |
| `${@:offset:length}` | `length` args from `offset` | `${@:3:2}` → `3 4` |
| `${@: -N}` | Last `N` args (space before `-`) | `${@: -2}` → `5 6` |
| `${@:(-N):L}` | `L` args from `N`th-to-last | `${@:(-5):2}` → `2 3` |
| `${*@:offset}` | Same but single word | `${*:3}` → `3 4 5 6` (one string) |

```bash
#!/bin/bash
# ./slice.sh 0 1 2 3 4 5 6

echo "All:        ${*}"        # 0 1 2 3 4 5 6
echo "From 3:     ${*:3}"      # 3 4 5 6
echo "3, len 2:   ${*:3:2}"    # 3 4
echo "Last 2:     ${*: -2}"    # 5 6
echo "2nd-last, 2:${*:(-5):2}" # 2 3
```

### 2.1 Removing Specific Args

```bash
#!/bin/bash
# ./remove.sh 0 1 2 3 4 5 6

args=( "$@" )

# Remove 1st, 4th, 5th (0-indexed in array)
unset 'args[0]' 'args[3]' 'args[4]'

echo "${args[@]}"   # 1 2 5 6
```

---

## 3. Special Variables (Not Arguments, But Related)

| Variable | Meaning |
|----------|---------|
| `$?` | Exit code of last command |
| `$-` | Active shell option flags (e.g., `himB`) |
| `$$` | PID of current shell |
| `$!` | PID of last background job |
| `$_` | Last argument of previous command |

```bash
#!/bin/bash
mkdir -p ~/workspace/projects/myscripts && cd "$_"
# $_ expands to ~/workspace/projects/myscripts
```

---

## 4. `shift` and `set` — Manipulating `$@`

```bash
#!/bin/bash
# ./shift_demo.sh alpha beta gamma

echo "Before: $# args → $*"   # 3 args → alpha beta gamma

shift          # remove $1
echo "After 1 shift: $# → $*"  # 2 → beta gamma

shift 2        # remove 2 more (only 1 left, so removes all)
echo "After 2 shift: $# → $*"  # 0 → (empty)

# set -- replaces $@
set -- new1 new2 new3
echo "After set: $# → $*"     # 3 → new1 new2 new3
```

---

## 5. `$@` in Heredocs — Expansion Control

### 5.1 The Core Rule

| Delimiter | Expansion? | `$@` behavior |
|-----------|-----------|---------------|
| `<<EOF` | **Yes** | `$@` expands to current shell's args |
| `<<'EOF'` | **No** | `$@` is literal text |
| `<<"EOF"` | **No** | `$@` is literal text |
| `<<\EOF` | **No** | `$@` is literal text |
| `<<-EOF` | **Yes** + tab-strip | `$@` expands, leading tabs removed |

### 5.2 Examples

```bash
#!/bin/bash
# ./heredoc_args.sh foo bar baz

# EXPANDED: $@ becomes "foo bar baz"
cat <<EOF
Args: $@
Count: $#
First: $1
EOF
# Output:
# Args: foo bar baz
# Count: 3
# First: foo

# LITERAL: $@ stays as text
cat <<'EOF'
Args: $@
Count: $#
First: $1
EOF
# Output:
# Args: $@
# Count: $#
# First: $1

# SELECTIVE: escape what you don't want expanded
cat <<EOF
Literal: \$@
Expanded: $1
Mixed: $2 and \$#
EOF
# Output:
# Literal: $@
# Expanded: bar
# Mixed: baz and $#
```

### 5.3 Nested Heredoc with `$@`

```bash
#!/bin/bash
# ./nested.sh host1 host2

# Outer: expands $@
# Inner: $@ refers to INNER shell's args (different!)
ssh host1 <<-OUTER
  echo "Outer args: $@"
  echo "Inner shell will see its own args"
OUTER

# To pass outer $@ into inner:
ssh host1 <<-OUTER
  echo "Outer args: $*"
  echo "Passing to inner: $1 $2"
OUTER

# If inner is a bash script that also uses $@:
cat > /tmp/inner.sh <<'EOF'
#!/bin/bash
echo "Inner \$@: \$*"
echo "Inner \$#: \$#"
EOF
chmod +x /tmp/inner.sh

# Now run it with the outer args:
/tmp/inner.sh "$@"
# Inner $@: host1 host2
# Inner $#: 2
```

### 5.4 `$@` in Heredoc → YAML

```bash
#!/bin/bash
# ./gen_yaml.sh --host db1 --port 5432 --db myapp

# Parse args into variables
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --db)   DB="$2";   shift 2 ;;
  esac
done

# Generate YAML with expanded $@ values
cat > config.yaml <<EOF
database:
  host: ${HOST:-localhost}
  port: ${PORT:-5432}
  name: ${DB:-default}
  args:
    - $1
    - $2
    - $3
EOF
```

### 5.5 `$@` in Heredoc → NestedText

```bash
#!/bin/bash
# ./gen_nt.sh alpha beta gamma

cat > output.nt <<EOF
input:
  - $1
  - $2
  - $3
meta:
  count: $#
  all: $*
  first: $1
  last: ${!#}
EOF
```

> ⚠️ `${!#}` is **not** valid Bash. Use an array:
> ```bash
> args=("$@")
> last="${args[$((${#args[@]}-1))]}"
> ```

### 5.6 `$@` in Heredoc → Markdown Callout

```bash
#!/bin/bash
# ./gen_report.sh "Build OK" "Deploy OK" "Test FAILED"

cat > report.md <<EOF
---
title: Status Report
args: $#
---

> [!warning] Build Summary
> Total: $# checks
>
> [!example] Results
>
> \`\`\`nt
> checks:
>   - $1
>   - $2
>   - $3
> status:
>   > $3
> \`\`\`
EOF
```

---

## 6. `$@` in Functions

```bash
#!/bin/bash

# Function inherits $@ from its call site
my_func() {
  echo "Got $# args: $*"
  echo "First: $1, Last: ${!#}"
  echo "All quoted:"
  for a in "$@"; do
    echo "  [$a]"
  done
}

# Call with mixed args
my_func "hello world" foo "bar baz"
# Got 3 args: hello world foo bar baz
# First: hello world, Last: bar baz
# All quoted:
#   [hello world]
#   [foo]
#   [bar baz]

# Forward to another command
wrapper() {
  echo "Wrapping: $@"
  actual_command "$@"   # ← CORRECT
  # actual_command $@   # ← BROKEN (word-split)
  # actual_command "$*" # ← WRONG (one arg)
}
```

### 6.1 `$@` in Nested Functions

```bash
#!/bin/bash

outer() {
  echo "Outer \$@: $*"
  inner "$@"   # passes outer's args to inner
}

inner() {
  echo "Inner \$@: $*"
  innermost "$@"
}

innermost() {
  echo "Innermost \$@: $*"
}

outer "a" "b" "c"
# Outer $@: a b c
# Inner $@: a b c
# Innermost $@: a b c
```

### 6.2 `$@` After `shift` in a Function

```bash
#!/bin/bash

process() {
  local target="$1"
  shift   # remove $1, now $1 is the second original arg

  echo "Target: $target"
  echo "Remaining: $*"
  echo "Remaining count: $#"

  # Pass remaining to a helper
  helper "$@"
}

helper() {
  echo "Helper got $# args: $*"
}

process "deploy" "web-1" "web-2" "db-1"
# Target: deploy
# Remaining: web-1 web-2 db-1
# Remaining count: 3
# Helper got 3 args: web-1 web-2 db-1
```

---

## 7. `$@` in Array Context

```bash
#!/bin/bash
# ./array_demo.sh x y z

# Store in array
args=( "$@" )

# Access
echo "${args[0]}"       # x
echo "${args[1]}"       # y
echo "${args[2]}"       # z

# Slice
echo "${args[@]:1}"     # y z
echo "${args[@]:0:2}"   # x y

# Length
echo "${#args[@]}"      # 3

# Reverse
reversed=( "${args[@]: -1}" "${args[@]: -2}" "${args[@]: -3}" )
echo "${reversed[*]}"   # z y x

# Map (apply function to each)
upper() { echo "${1^^}"; }
mapped=()
for a in "${args[@]}"; do
  mapped+=( "$(upper "$a")" )
done
echo "${mapped[*]}"     # X Y Z
```

---

## 8. `$@` in `for` / `while` / `case`

```bash
#!/bin/bash
# ./loop_demo.sh --verbose --output file.txt --debug

for arg in "$@"; do
  case "$arg" in
    --verbose)  VERBOSE=true ;;
    --debug)    DEBUG=true ;;
    --output)   shift; OUTPUT="$1" ;;
    *)          echo "Unknown: $arg" ;;
  esac
done
echo "Output file: $OUTPUT"
```

### 8.1 `while` + `shift` (Idiomatic Arg Parsing)

```bash
#!/bin/bash
# ./parse.sh -v -o out.txt --name "My App"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -v)  VERBOSE=true; shift ;;
    -o)  OUTPUT="$2"; shift 2 ;;
    --name) NAME="$2"; shift 2 ;;
    --)  shift; break ;;
    *)   echo "Unknown: $1"; shift ;;
  esac
done

echo "Verbose: $VERBOSE"
echo "Output:  $OUTPUT"
echo "Name:    $NAME"
echo "Remaining: $*"
```

---

## 9. `$@` in Conditional / Test Context

```bash
#!/bin/bash
# ./check.sh

if [[ $# -eq 0 ]]; then
  echo "No arguments provided"
  exit 1
fi

if [[ $# -gt 5 ]]; then
  echo "Too many arguments (max 5)"
  exit 1
fi

# Check if a specific arg exists
for arg in "$@"; do
  if [[ "$arg" == "--force" ]]; then
    FORCE=true
    break
  fi
done

# Check if all args are numeric
all_numeric=true
for arg in "$@"; do
  if ! [[ "$arg" =~ ^[0-9]+$ ]]; then
    all_numeric=false
    break
  fi
done
```

---

## 10. `$@` in Subshells & Pipelines

```bash
#!/bin/bash
# ./subshell.sh a b c

# Subshell: $@ is inherited
(
  echo "Subshell \$@: $*"
  shift
  echo "After shift: $*"
)
# Subshell $@: a b c
# After shift: b c

# Pipeline: $@ is NOT inherited by pipeline stages
echo "Parent: $*" | grep -o '.' | head -1
# grep sees the PIPED data, not $@

# To pass args through a pipeline, use env or explicit vars:
echo "$*" | while read -r line; do
  echo "Got: $line"
done
```

---

## 11. `$@` in `eval` and `exec`

```bash
#!/bin/bash
# ./eval_demo.sh "echo" "hello" "world"

# DANGEROUS: eval with $@
eval "$*"
# Runs: echo hello world

# Safer: direct expansion
"$@"
# Runs: echo hello world (same, but no eval injection risk)

# exec replaces the shell
# exec "$@"   # shell is replaced by the first arg as command
```

> ⚠️ **Security:** `eval "$@"` is an injection vector. Always prefer `"$@"` directly.

---

## 12. `$@` in `source` / `.` Context

```bash
#!/bin/bash
# ./source_demo.sh --flag1 --flag2

# Create a config file with args
cat > /tmp/config.sh <<EOF
FLAG1="${1:-false}"
FLAG2="${2:-false}"
ARGS=("$@")
EOF

# Source it (runs in current shell)
source /tmp/config.sh

echo "FLAG1: $FLAG1"
echo "ARGS:  ${ARGS[*]}"
```

---

## 13. `$@` in `trap` and Signal Handlers

```bash
#!/bin/bash
# ./trap_demo.sh job1 job2

cleanup() {
  echo "Cleaning up (was processing: $*)"
}

trap cleanup EXIT

for job in "$@"; do
  echo "Processing: $job"
  sleep 1
done
# On Ctrl+C or exit:
# Cleaning up (was processing: job1 job2)
```

---

## 14. `$@` in `xargs` and `mapfile`

```bash
#!/bin/bash
# ./xargs_demo.sh file1 file2 file3

# xargs with "$@"
echo "$@" | xargs -n1 echo "Processing:"
# Processing: file1
# Processing: file2
# Processing: file3

# mapfile (read into array)
mapfile -t files < <(printf '%s\n' "$@")
echo "${files[0]}"   # file1
echo "${#files[@]}"  # 3
```

---

## 15. Polyglot: `$@` Across All Formats

### 15.1 Bash → YAML → NestedText (3-layer)

```bash
#!/bin/bash
# ./polyglot.sh --env prod --region eu-west-1 --replicas 3

env="" region="" replicas=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)      env="$2";      shift 2 ;;
    --region)   region="$2";   shift 2 ;;
    --replicas) replicas="$2"; shift 2 ;;
  esac
done

cat > manifest.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    env: ${env:-dev}
    region: ${region:-us-east-1}
spec:
  replicas: ${replicas:-1}
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest
          env:
            - name: DEPLOY_ARGS
              value: "$*"
EOF
```

### 15.2 Bash → Markdown Callout + NestedText (3-layer)

```bash
#!/bin/bash
# ./report.sh "OK" "OK" "FAIL"

cat > status.md <<EOF
---
title: Deploy Status
date: $(date -Iseconds)
checks: $#
---

> [!$( [[ "$3" == "FAIL" ]] && echo "danger" || echo "success" )] Deploy Report
>
> \`\`\`nt
> checks:
>   - $1
>   - $2
>   - $3
> summary:
>   > Total: $#
>   > Passed: $(echo "$@" | grep -c "OK")
>   > Failed: $(echo "$@" | grep -c "FAIL")
> \`\`\`
EOF
```

### 15.3 Bash → Terraform Heredoc (with `$@`)

```bash
#!/bin/bash
# ./tf_gen.sh vpc-12345 10.0.0.0/16

cat > main.tf <<EOF
resource "aws_vpc" "main" {
  cidr_block = "$2"
  tags = {
    Name  = "vpc-$1"
    Args  = "$*"
  }
}

user_data = <<-EOT
  #!/bin/bash
  echo "Deployed with args: $*"
  echo "VPC: $1"
EOT
EOF
```

### 15.4 Bash → JSON (with `$@`)

```bash
#!/bin/bash
# ./json_gen.sh "prod" "eu-west" 3

cat > config.json <<EOF
{
  "env": "$1",
  "region": "$2",
  "replicas": $3,
  "all_args": [$(IFS=,; echo '"$*"')],
  "arg_count": $#
}
EOF
```

### 15.5 Bash → TOML (with `$@`)

```bash
#!/bin/bash
# ./toml_gen.sh "production" "us-east-1"

cat > config.toml <<EOF
[server]
env = "$1"
region = "$2"

[server.meta]
args = "$*"
count = $#
EOF
```

### 15.6 Full-Stack: Bash → MD → YAML → NT → Callout (5-layer)

```bash
#!/bin/bash
# ./fullstack.sh "Build" "Deploy" "Test"

cat > full.md <<EOF
---
title: CI/CD Report
pipeline:
  - $1
  - $2
  - $3
total: $#
---

> [!example] Pipeline
>
> \`\`\`nt
> pipeline:
>   - $1
>   - $2
>   - $3
> meta:
>   > total: $#
>   > all: $*
>   > first: $1
> \`\`\`
>
> [!tip] Args
> Count: $#
> First: $1
> Last: $(args=("$@"); echo "${args[$((${#args[@]}-1))]}")
EOF
```

**Five valid interpretations:**

| Layer | Parser | Sees |
|-------|--------|------|
| 1 | **Bash** | Heredoc `<<EOF`, expands `$1 $2 $3 $# $*` |
| 2 | **Markdown** | A page with frontmatter + 2 callouts |
| 3 | **YAML** (frontmatter) | `{title: "CI/CD Report", pipeline: ["Build","Deploy","Test"], total: 3}` |
| 4 | **NestedText** (code block) | `{pipeline: ["Build","Deploy","Test"], meta: "total: 3\nall: Build Deploy Test\nfirst: Build"}` |
| 5 | **Obsidian Callout** | Two styled boxes (purple + sky-blue) |

---

## 16. Security: `$@` Injection Vectors

### 16.1 Unquoted `$@` → Word Splitting

```bash
#!/bin/bash
# ARGUMENTS="rm -rf /"
# $@ expands to: rm  -rf  /  (3 words, not 1)
"$@"   # ← SAFE: runs "rm -rf /" as ONE command
$@    # ← DANGEROUS: runs rm with args -rf and /
```

### 16.2 `eval "$@"` → Command Injection

```bash
#!/bin/bash
# If $1 = "echo; rm -rf /"
eval "$@"    # ← EXECUTES: echo; rm -rf /
"$@"         # ← SAFE: tries to run a command literally named "echo; rm -rf /"
```

### 16.3 Heredoc + Unquoted `$@` → YAML/NT Injection

```bash
#!/bin/bash
# If $1 = "!!python/object/apply:os.system\n- 'rm -rf /'"
cat > config.yaml <<EOF
command: $1
EOF
# ← YAML RCE when parsed by PyYAML

# Safe: quote the delimiter
cat > config.yaml <<'EOF'
command: $1
EOF
# ← Literal $1, no expansion (but also no useful value)

# Safest: sanitize before interpolation
safe=$(printf '%q' "$1")
cat > config.yaml <<EOF
command: $safe
EOF
```

### 16.4 `set --` with Untrusted Input

```bash
#!/bin/bash
# DANGEROUS: redefines $@ from untrusted source
set -- "$UNTRUSTED_INPUT"
"$@"   # ← Could be anything

# Safe: validate before set
[[ "$UNTRUSTED_INPUT" =~ ^[a-zA-Z0-9_-]+$ ]] && set -- "$UNTRUSTED_INPUT"
```

