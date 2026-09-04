#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/checker-controls.sh
# Trip the checker on purpose. M1 to M8: mutations of a resolved command,
# each asserted PRESENT before the check runs, each expected to fail with
# its named rule (or, for M8, to pass); M0: the untouched file, expected to
# pass; M9 to M16: the companion scorer on whole planted answers, each
# expected to score as its law says; M17: the runner's allow-list, a copy
# granting Write refused.
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
# M7: a declaration inside an IGNORE conditional section is gone -> C4
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace('  <!ELEMENT factor (#PCDATA)>','  <![ IGNORE [\n  <!ELEMENT factor (#PCDATA)>\n  ]]>');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m7.md" || { echo "M7 mutation did not land"; fail=1; }
grep -q -F '<![ IGNORE [' "$T/commands/m7.md" || { echo "M7 mutation did not land"; fail=1; }
out=$(run "$T/commands/m7.md"); echo "$out" | grep -q 'ERR  C4' && echo "PASS M7 declaration under IGNORE -> C4" || { echo "FAIL M7"; echo "$out" | tail -3; fail=1; }
# M8: the same declaration inside an INCLUDE section keyed by a parameter entity -> pass
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace('  <!ELEMENT factor (#PCDATA)>','  <!ENTITY % keep \"INCLUDE\">\n  <![ %keep; [\n  <!ELEMENT factor (#PCDATA)>\n  ]]>');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m8.md" || { echo "M8 mutation did not land"; fail=1; }
grep -q -F '<![ %keep; [' "$T/commands/m8.md" || { echo "M8 mutation did not land"; fail=1; }
out=$(run "$T/commands/m8.md"); echo "$out" | grep -q 'failed 0' && echo "PASS M8 declaration under INCLUDE keyed by %keep; -> pass" || { echo "FAIL M8"; echo "$out" | tail -3; fail=1; }
# Untouched -> pass
out=$(run "$T/commands/pareto-dtd.md"); echo "$out" | grep -q 'failed 0' && echo "PASS M0 untouched file passes" || { echo "FAIL M0"; echo "$out" | tail -3; fail=1; }


# M9..M17: the companion scorer on planted answers (LAW.COMPANION.3, 4 and 6) and the runner's allow-list (1 and 2)
scope="phase=p range=a..b model=opus"
score() { bash checker/companion-audit.sh --score "$1" p a..b opus >/dev/null 2>&1; }
printf '%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="high" confidence="measured">planted</finding>\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m9.md"
score "$T/m9.md"; rc=$?; [ $rc -eq 1 ] && echo "PASS M9 a fail with a high finding in the element spelling scores as a fail (exit 1)" || { echo "FAIL M9 exit=$rc"; fail=1; }
printf '%s\n\n### 🩺 Findings\n\n**high · measured · x:1** planted in the bold spelling\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m10.md"
out=$(bash checker/companion-audit.sh --score "$T/m10.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'high findings=0' && echo "$out" | grep -q 'a fail with no high finding' && echo "PASS M10 a bold line is not a finding: high findings=0 and the fail is refused" || { echo "FAIL M10 exit=$rc"; fail=1; }
printf '%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="low" confidence="measured">planted</finding>\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m11.md"
out=$(bash checker/companion-audit.sh --score "$T/m11.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'a fail with no high finding' && echo "PASS M11 a fail with no high finding breaks LAW.COMPANION.4 (exit 1, named)" || { echo "FAIL M11 exit=$rc"; fail=1; }
printf '%s\n\n### 🩺 Findings\n\nnone\n\nCOMPANION VERDICT: pass\n' "$scope" > "$T/m12.md"
score "$T/m12.md"; rc=$?; [ $rc -eq 0 ] && echo "PASS M12 a pass with the scope line scores as a pass (exit 0)" || { echo "FAIL M12 exit=$rc"; fail=1; }
printf 'phase=p range=axxb model=opus\n\nCOMPANION VERDICT: pass\n' > "$T/m13.md"
old=$(grep -c "^phase=p range=a..b model=opus\$" "$T/m13.md"); [ "$old" -eq 1 ] || { echo "M13 landed proof failed: the replaced expression should have matched axxb, got $old"; fail=1; }
out=$(bash checker/companion-audit.sh --score "$T/m13.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'LAW.COMPANION.6' && echo "PASS M13 the replaced expression accepted axxb for a..b (landed proof), the whole-line fixed-string match refuses it" || { echo "FAIL M13 exit=$rc"; fail=1; }
printf '%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="low" confidence="measured">planted</finding>\n\n### 🩺 Next\n\nRaise the severity="high" on the next run.\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m14.md"
out=$(bash checker/companion-audit.sh --score "$T/m14.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'high findings=0' && echo "$out" | grep -q 'a fail with no high finding' && echo "PASS M14 the attribute in prose counts for nothing: high findings=0 and the fail is refused" || { echo "FAIL M14 exit=$rc"; fail=1; }

printf '%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="medium" confidence="measured">the body quotes severity="high" and it counts for nothing</finding>\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m15.md"
out=$(bash checker/companion-audit.sh --score "$T/m15.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'high findings=0' && echo "$out" | grep -q 'a fail with no high finding' && echo "PASS M15 the attribute quoted in a finding body counts for nothing: high findings=0 and the fail is refused" || { echo "FAIL M15 exit=$rc"; echo "$out" | tail -2; fail=1; }
printf '%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="high">planted without a confidence</finding>\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m16.md"
out=$(bash checker/companion-audit.sh --score "$T/m16.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'LAW.COMPANION.3' && echo "PASS M16 a finding element without its confidence is refused under LAW.COMPANION.3" || { echo "FAIL M16 exit=$rc"; echo "$out" | tail -2; fail=1; }
# M17: the runner's allow-list carries no writing or spawning tool and every Bash form starts with its ceiling; a copy granting Write is refused
# A bare Bash in the allow-list is the widest grant there is, and the old
# second stage could not see it: grep -o 'Bash([^)]*)' emitted nothing, so the
# grep -v that followed exited 1 and the && never fired (pass 17).
allow_ok() {
  local a tools bare_bash; a=$(grep -o -- '--allowedTools "[^"]*"' "$1"); [ -n "$a" ] || return 2
  echo "$a" | grep -q -E 'Write|Edit|NotebookEdit|Agent|Task' && return 1
  tools=$(echo "$a" | sed 's/.*--allowedTools "//; s/"$//')
  bare_bash=$(echo "$tools" | tr ',' '\n' | grep -c '^Bash$' || true)
  [ "$bare_bash" != "0" ] && return 1
  echo "$a" | grep -o 'Bash([^)]*)' | grep -v -q 'Bash(timeout 60 ' && return 1
  return 0
}
sed 's/--allowedTools "Read,/--allowedTools "Write,Read,/' checker/companion-audit.sh > "$T/m17.sh"
grep -q -- '--allowedTools "Write,Read,' "$T/m17.sh" || { echo "M17 mutation did not land"; fail=1; }
sed 's/--allowedTools "Read,\([^"]*\)"/--allowedTools "Read,Bash"/' checker/companion-audit.sh > "$T/m17b.sh"
grep -q -- '--allowedTools "Read,Bash"' "$T/m17b.sh" || { echo "M17b mutation did not land"; fail=1; }
allow_ok "$T/m17b.sh"; r2=$?
[ $r2 -eq 1 ] || { echo "M17b DID NOT FIRE: a bare Bash in the allow-list was admitted"; fail=1; }
allow_ok "$T/m17.sh"; r1=$?; allow_ok checker/companion-audit.sh; r0=$?
[ $r1 -eq 1 ] && [ $r0 -eq 0 ] && echo "PASS M17 the runner's allow-list carries no writing or spawning tool and every Bash form starts with timeout 60; a copy granting Write is refused" || { echo "FAIL M17 planted=$r1 real=$r0"; fail=1; }

rm -rf "$T"
echo "checker-controls: $([ $fail -eq 0 ] && echo all tripped as designed || echo A CONTROL DID NOT FIRE)"
exit $fail
