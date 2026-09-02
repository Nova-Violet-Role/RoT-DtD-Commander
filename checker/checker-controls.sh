#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/checker-controls.sh
# Trip the checker on purpose. Three mutations of a resolved command, each
# asserted PRESENT before the check runs, each expected to fail with its
# named rule; then the untouched file, expected to pass. Then the XML
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

# Untouched -> pass
out=$(run "$T/commands/pareto-dtd.md"); echo "$out" | grep -q 'failed 0' && echo "PASS M0 untouched file passes" || { echo "FAIL M0"; echo "$out" | tail -3; fail=1; }

# XML: broken instance rejected before the valid one is trusted
if command -v xmlstarlet >/dev/null 2>&1; then
  node -e "import('./lib/dtd.mjs').then(m=>{const t=m.readText('commands/second-order-dtd.md');m.writeLF(process.argv[1],m.extractDtd(t))})" "$T/second_order.dtd"
  sed -e 's/causes="E4"/causes="E9"/' -e '/<assessment/d' examples/second_order.xml > "$T/bad.xml"
  grep -q 'causes="E9"' "$T/bad.xml" || { echo "X1 mutation did not land"; fail=1; }
  if timeout 30 xmlstarlet val -e -d "$T/second_order.dtd" "$T/bad.xml" < /dev/null > "$T/bad.out" 2>&1; then echo "FAIL X1 broken instance accepted"; fail=1; else grep -q 'E9' "$T/bad.out" && echo "PASS X1 broken instance rejected, dangling IDREF named" || { echo "FAIL X1 rejected without naming E9"; fail=1; }; fi
  timeout 30 xmlstarlet val -e -d "$T/second_order.dtd" examples/second_order.xml < /dev/null > /dev/null 2>&1 && echo "PASS X0 valid instance accepted" || { echo "FAIL X0"; fail=1; }
else
  echo "SKIP X1/X0 xmlstarlet not on PATH"
fi

rm -rf "$T"
echo "checker-controls: $([ $fail -eq 0 ] && echo all tripped as designed || echo A CONTROL DID NOT FIRE)"
exit $fail
