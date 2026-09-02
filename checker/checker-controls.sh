#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/checker-controls.sh
# Trip the checker on purpose. Three mutations of a resolved command, each
# asserted PRESENT before the check runs, each expected to fail with its
# named rule; then the untouched file, expected to pass.
# validator: a broken instance must be rejected with a named error before
# the valid instance's pass counts.
set -u
cd "$(dirname "$0")/.." || exit 2
T=$(mktemp -d)
mkdir -p "$T/commands"
cp commands/pareto-dtd.md "$T/commands/pareto-dtd.md"
fail=0
run() { timeout 60 node bin/rot-dtd-commander.mjs check "$1" < /dev/null 2>&1; }

# M1: remove a declaration -> C4
sed 's/  <!ELEMENT factor (#PCDATA)>//' commands/pareto-dtd.md > "$T/commands/m1.md"
grep -q '<!ELEMENT factor' "$T/commands/m1.md" && { echo "M1 mutation did not land"; fail=1; }
out=$(run "$T/commands/m1.md"); echo "$out" | grep -q 'ERR  C4' && echo "PASS M1 removed declaration -> C4" || { echo "FAIL M1"; echo "$out" | tail -3; fail=1; }

# M2: (CDATA) content model -> C8
sed 's/<!ELEMENT trivial (#PCDATA)>/<!ELEMENT trivial (CDATA)>/' commands/pareto-dtd.md > "$T/commands/m2.md"
grep -q 'trivial (CDATA)' "$T/commands/m2.md" || { echo "M2 mutation did not land"; fail=1; }
out=$(run "$T/commands/m2.md"); echo "$out" | grep -q 'ERR  C8' && echo "PASS M2 (CDATA) model -> C8" || { echo "FAIL M2"; fail=1; }

# M3: an element declared but never named -> C5
sed 's/<!ELEMENT trivial (#PCDATA)>/<!ELEMENT trivial (#PCDATA)>\n  <!ELEMENT orphan (#PCDATA)>/' commands/pareto-dtd.md > "$T/commands/m3.md"
grep -q '<!ELEMENT orphan' "$T/commands/m3.md" || { echo "M3 mutation did not land"; fail=1; }
out=$(run "$T/commands/m3.md"); echo "$out" | grep -q 'ERR  C5 element orphan' && echo "PASS M3 orphan element -> C5" || { echo "FAIL M3"; fail=1; }

# M4: a template heading with no blank line before it -> C13
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace('\n\n### 🎯 Bottom Line','\n### 🎯 Bottom Line');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m4.md" || { echo "M4 mutation did not land"; fail=1; }
out=$(run "$T/commands/m4.md"); echo "$out" | grep -q -E 'ERR +C13 .*blank lines' && echo "PASS M4 crammed heading -> C13" || { echo "FAIL M4"; echo "$out" | tail -3; fail=1; }
# M5: a grammar_map heading stripped of its sigil -> C13
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace('**🎯 Bottom Line**','**Bottom Line**');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m5.md" || { echo "M5 mutation did not land"; fail=1; }
out=$(run "$T/commands/m5.md"); echo "$out" | grep -q -E 'ERR +C13 .*no sigil' && echo "PASS M5 heading without sigil -> C13" || { echo "FAIL M5"; echo "$out" | tail -3; fail=1; }
# M6: a front-matter value with a bare ": " (the shape GitHub's renderer rejected) -> C14
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace(/^description: \"(.*)\"\$/m,'description: \$1');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m6.md" || { echo "M6 mutation did not land"; fail=1; }
grep -q '^description: Find the vital few: ' "$T/commands/m6.md" || { echo "M6 mutation did not land"; fail=1; }
out=$(run "$T/commands/m6.md"); echo "$out" | grep -q -E 'ERR +C14' && echo "PASS M6 bare colon in front matter -> C14" || { echo "FAIL M6"; echo "$out" | tail -3; fail=1; }
# Untouched -> pass
out=$(run "$T/commands/pareto-dtd.md"); echo "$out" | grep -q 'failed 0' && echo "PASS M0 untouched file passes" || { echo "FAIL M0"; echo "$out" | tail -3; fail=1; }


rm -rf "$T"
echo "checker-controls: $([ $fail -eq 0 ] && echo all tripped as designed || echo A CONTROL DID NOT FIRE)"
exit $fail
