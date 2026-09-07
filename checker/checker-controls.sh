#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/checker-controls.sh
# Trip the checker on purpose. M1 to M8: mutations of a resolved command,
# each asserted PRESENT before the check runs, each expected to fail with
# its named rule (or, for M8, to pass); M0: the untouched file, expected to
# pass; M9 to M16, M18 and M19: the companion scorer on whole planted answers,
# each expected to score as its law says, two verdict lines and none among
# them; M17: the runner's allow-list, a copy granting Write refused, M17b a
# bare Bash refused, M17c the bare timeout refused; M20 to M22: the run
# stamp and the four headings; M33 and M34: M9's mutation proof and a quoted
# element; M23 to M32: the wrapper checker/companion-run.sh
# (the old prefix grant refused, its refusals tripped, git config and the
# engines by the table, the bare arms, every granted spelling walked under
# the tree state), a changed tree, a fired ceiling, the permission mode, the
# suite inside itself refused. The total line at the end,
# checker controls: N run, F failing, counts once per control, and
# CC_PLANT_FAIL=1 runs M0 and one control forced to fail, printing 2 run, 1
# failing at exit 1, the proof checker/counts-sweep.mjs reads.
# validator: a broken instance must be rejected with a named error before
# the valid instance's pass counts.
set -u
cd "$(dirname "$0")/.." || exit 2
PORTABLE_ROOT="$(pwd)"; . checker/portable.sh
# A control suite inside a control suite is refused by name. The twenty-first
# pass's table walk ran about-sweep --controls, whose measurement runs this
# suite, whose walk runs about-sweep again: 521 processes before the kill.
# The mark is inherited by every child, so no table and no engine can fork
# this suite through any path.
if [ -n "${ROT_CHECKER_CONTROLS_RUNNING:-}" ]; then
  echo "checker-controls: refused, a control suite inside a control suite (ROT_CHECKER_CONTROLS_RUNNING is set)"
  exit 3
fi
export ROT_CHECKER_CONTROLS_RUNNING=1
T=$(mktemp -d)
# M25 plants a file at the repository root to move the tree state; a kill
# between the write and the rm must not leave it behind
trap 'rm -f zz-tree-control.tmp artifacts/cache/zz-tree-control.nt checker/zz-m33-runner.sh' EXIT
mkdir -p "$T/commands"
cp commands/pareto-dtd.md "$T/commands/pareto-dtd.md"
fail=0
ran=0
# Every control reports through ok or ko, and ran rises once per control, so
# the total below is the number of controls that ran, never pass plus fail:
# a mutation that fails to land raises fail without being a control (fourth
# companion pass), and ko is the only writer of fail on a control line, so a
# failing control counts once (fifth pass). A count derived from the labels
# missed M17c and published twenty for twenty-one (third pass); M17b fired
# without a line and was not counted at all (fourth pass).
ok() { ran=$((ran+1)); echo "PASS $*"; }
ko() { fail=$((fail+1)); ran=$((ran+1)); echo "FAIL $*"; }
run() { ceil 60 node bin/rot-dtd-commander.mjs check "$1" < /dev/null 2>&1; }
if [ "${CC_PLANT_FAIL:-0}" = "1" ]; then
  out=$(run commands/pareto-dtd.md); echo "$out" | grep -q 'failed 0' && ok "M0 untouched file passes" || ko "M0 the untouched file failed"
  ko "PLANTED a control forced to fail, so the total line is proven to count it once"
  rm -rf "$T"
  echo "checker controls: $ran run, $fail failing"
  exit 1
fi

# M1: remove a declaration -> C4
sed 's/  <!ELEMENT factor (#PCDATA)>//' commands/pareto-dtd.md > "$T/commands/m1.md"
grep -q '<!ELEMENT factor' "$T/commands/m1.md" && { echo "M1 mutation did not land"; fail=$((fail+1)); }
out=$(run "$T/commands/m1.md"); echo "$out" | grep -q 'ERR  C4' && ok "M1 removed declaration -> C4" || { ko "M1"; echo "$out" | tail -3; }

# M2: (CDATA) content model -> C8
sed 's/<!ELEMENT trivial (#PCDATA)>/<!ELEMENT trivial (CDATA)>/' commands/pareto-dtd.md > "$T/commands/m2.md"
grep -q 'trivial (CDATA)' "$T/commands/m2.md" || { echo "M2 mutation did not land"; fail=$((fail+1)); }
out=$(run "$T/commands/m2.md"); echo "$out" | grep -q 'ERR  C8' && ok "M2 (CDATA) model -> C8" || { ko "M2"; }

# M3: an element declared but never named -> C5
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace('<!ELEMENT trivial (#PCDATA)>','<!ELEMENT trivial (#PCDATA)>\\n  <!ELEMENT orphan (#PCDATA)>');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m3.md" || { echo "M3 mutation did not land"; fail=$((fail+1)); }
grep -q '<!ELEMENT orphan' "$T/commands/m3.md" || { echo "M3 mutation did not land"; fail=$((fail+1)); }
out=$(run "$T/commands/m3.md"); echo "$out" | grep -q 'ERR  C5 element orphan' && ok "M3 orphan element -> C5" || { ko "M3"; }

# M4: a template heading with no blank line before it -> C13
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace('\n\n### 🎯 Bottom Line','\n### 🎯 Bottom Line');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m4.md" || { echo "M4 mutation did not land"; fail=$((fail+1)); }
out=$(run "$T/commands/m4.md"); echo "$out" | grep -q -E 'ERR +C13 .*blank lines' && ok "M4 crammed heading -> C13" || { ko "M4"; echo "$out" | tail -3; }
# M5: a grammar_map heading stripped of its sigil -> C13
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace('**🎯 Bottom Line**','**Bottom Line**');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m5.md" || { echo "M5 mutation did not land"; fail=$((fail+1)); }
out=$(run "$T/commands/m5.md"); echo "$out" | grep -q -E 'ERR +C13 .*no sigil' && ok "M5 heading without sigil -> C13" || { ko "M5"; echo "$out" | tail -3; }
# M6: a front-matter value with a bare ": " (the shape GitHub's renderer rejected) -> C14
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace(/^description: \"(.*)\"\$/m,'description: \$1');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m6.md" || { echo "M6 mutation did not land"; fail=$((fail+1)); }
grep -q '^description: Find the vital few: ' "$T/commands/m6.md" || { echo "M6 mutation did not land"; fail=$((fail+1)); }
out=$(run "$T/commands/m6.md"); echo "$out" | grep -q -E 'ERR +C14' && ok "M6 bare colon in front matter -> C14" || { ko "M6"; echo "$out" | tail -3; }
# M7: a declaration inside an IGNORE conditional section is gone -> C4
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace('  <!ELEMENT factor (#PCDATA)>','  <![ IGNORE [\n  <!ELEMENT factor (#PCDATA)>\n  ]]>');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m7.md" || { echo "M7 mutation did not land"; fail=$((fail+1)); }
grep -q -F '<![ IGNORE [' "$T/commands/m7.md" || { echo "M7 mutation did not land"; fail=$((fail+1)); }
out=$(run "$T/commands/m7.md"); echo "$out" | grep -q 'ERR  C4' && ok "M7 declaration under IGNORE -> C4" || { ko "M7"; echo "$out" | tail -3; }
# M8: the same declaration inside an INCLUDE section keyed by a parameter entity -> pass
node -e "const fs=require('fs');const t=fs.readFileSync('commands/pareto-dtd.md','utf8');const u=t.replace('  <!ELEMENT factor (#PCDATA)>','  <!ENTITY % keep \"INCLUDE\">\n  <![ %keep; [\n  <!ELEMENT factor (#PCDATA)>\n  ]]>');if(u===t){process.exit(3)};fs.writeFileSync(process.argv[1],u)" "$T/commands/m8.md" || { echo "M8 mutation did not land"; fail=$((fail+1)); }
grep -q -F '<![ %keep; [' "$T/commands/m8.md" || { echo "M8 mutation did not land"; fail=$((fail+1)); }
out=$(run "$T/commands/m8.md"); echo "$out" | grep -q 'failed 0' && ok "M8 declaration under INCLUDE keyed by %keep; -> pass" || { ko "M8"; echo "$out" | tail -3; }
# Untouched -> pass
out=$(run "$T/commands/pareto-dtd.md"); echo "$out" | grep -q 'failed 0' && ok "M0 untouched file passes" || { ko "M0"; echo "$out" | tail -3; }


# M9..M17: the companion scorer on planted answers (LAW.COMPANION.3, 4 and 6) and the runner's allow-list (1 and 2)
scope="phase=p range=a..b model=opus"
score() { bash checker/companion-audit.sh --score "$1" p a..b opus >/dev/null 2>&1; }
printf '### 🩺 Scope\n\n%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="high" confidence="measured">planted</finding>\n\n### 🩺 Verdict\n\nsound\n\n### 🩺 Next\n\nnothing\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m9.md"
# M9 asserts the FAIL path by its own line, not exit 1 alone: the scorer exits 1 on every path but a pass (twenty-third companion pass)
out=$(bash checker/companion-audit.sh --score "$T/m9.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q '^companion: p FAIL$' && ! echo "$out" | grep -q 'broken' && ok "M9 a fail with a high finding in the element spelling scores as a fail through the FAIL path itself (exit 1, no law named broken)" || { ko "M9 exit=$rc: $(echo "$out" | tail -1 | cut -c1-120)"; }
printf '%s\n\n### 🩺 Findings\n\n**high · measured · x:1** planted in the bold spelling\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m10.md"
out=$(bash checker/companion-audit.sh --score "$T/m10.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'high findings=0' && echo "$out" | grep -q 'a fail with no high finding' && ok "M10 a bold line is not a finding: high findings=0 and the fail is refused" || { ko "M10 exit=$rc"; }
printf '%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="low" confidence="measured">planted</finding>\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m11.md"
out=$(bash checker/companion-audit.sh --score "$T/m11.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'a fail with no high finding' && ok "M11 a fail with no high finding breaks LAW.COMPANION.4 (exit 1, named)" || { ko "M11 exit=$rc"; }
printf '### 🩺 Scope\n\n%s\n\n### 🩺 Findings\n\nnone\n\n### 🩺 Verdict\n\nsound\n\n### 🩺 Next\n\nnothing\n\nCOMPANION VERDICT: pass\n' "$scope" > "$T/m12.md"
score "$T/m12.md"; rc=$?; [ $rc -eq 0 ] && ok "M12 a pass with the scope line scores as a pass (exit 0)" || { ko "M12 exit=$rc"; }
printf 'phase=p range=axxb model=opus\n\nCOMPANION VERDICT: pass\n' > "$T/m13.md"
old=$(grep -c "^phase=p range=a..b model=opus\$" "$T/m13.md"); [ "$old" -eq 1 ] || { echo "M13 landed proof failed: the replaced expression should have matched axxb, got $old"; fail=$((fail+1)); }
out=$(bash checker/companion-audit.sh --score "$T/m13.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'LAW.COMPANION.6' && ok "M13 the replaced expression accepted axxb for a..b (landed proof), the whole-line fixed-string match refuses it" || { ko "M13 exit=$rc"; }
printf '%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="low" confidence="measured">planted</finding>\n\n### 🩺 Next\n\nRaise the severity="high" on the next run.\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m14.md"
out=$(bash checker/companion-audit.sh --score "$T/m14.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'high findings=0' && echo "$out" | grep -q 'a fail with no high finding' && ok "M14 the attribute in prose counts for nothing: high findings=0 and the fail is refused" || { ko "M14 exit=$rc"; }

printf '%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="medium" confidence="measured">the body quotes severity="high" and it counts for nothing</finding>\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m15.md"
out=$(bash checker/companion-audit.sh --score "$T/m15.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'high findings=0' && echo "$out" | grep -q 'a fail with no high finding' && ok "M15 the attribute quoted in a finding body counts for nothing: high findings=0 and the fail is refused" || { ko "M15 exit=$rc"; echo "$out" | tail -2; }
printf '%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="high">planted without a confidence</finding>\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m16.md"
out=$(bash checker/companion-audit.sh --score "$T/m16.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'LAW.COMPANION.3' && ok "M16 a finding element without its confidence is refused under LAW.COMPANION.3" || { ko "M16 exit=$rc"; echo "$out" | tail -2; }
printf '%s\n\n### 🩺 Findings\n\nnone\n\nCOMPANION VERDICT: pass\nCOMPANION VERDICT: pass\n' "$scope" > "$T/m18.md"
out=$(bash checker/companion-audit.sh --score "$T/m18.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'LAW.COMPANION.4 broken, 2 verdict lines' && ok "M18 two verdict lines are refused under LAW.COMPANION.4 (exit 1, named)" || { ko "M18 exit=$rc"; echo "$out" | tail -2; }
printf '%s\n\n### 🩺 Findings\n\nnone\n\n### 🩺 Verdict\n\npass, but the line is missing\n' "$scope" > "$T/m19.md"
out=$(bash checker/companion-audit.sh --score "$T/m19.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q '0 verdict lines' && ok "M19 an answer with no verdict line is refused (exit 1, 0 verdict lines)" || { ko "M19 exit=$rc"; echo "$out" | tail -2; }
# M20, M21: the stamp of the run (LAW.COMPANION.7) and the four headings in order (LAW.COMPANION.8)
printf '<!-- companion run: 2026-01-01T00:00:00Z-pid1 -->\n\n### 🩺 Scope\n\n%s\n\n### 🩺 Findings\n\nnone\n\n### 🩺 Verdict\n\nsound\n\n### 🩺 Next\n\nnothing\n\nCOMPANION VERDICT: pass\n' "$scope" > "$T/m20.md"
out=$(bash checker/companion-audit.sh --score "$T/m20.md" p a..b opus 2026-01-01T00:00:00Z-pid2 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'LAW.COMPANION.7' && ok "M20 a record stamped by another run is refused by name, so an empty run can never score the previous record" || { ko "M20 exit=$rc"; }
printf '### 🩺 Scope\n\n%s\n\n### 🩺 Findings\n\nnone\n\n### 🩺 Next\n\nnothing\n\n### 🩺 Verdict\n\nsound\n\nCOMPANION VERDICT: pass\n' "$scope" > "$T/m21.md"
out=$(bash checker/companion-audit.sh --score "$T/m21.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'LAW.COMPANION.8' && ok "M21 a pass whose headings are out of declared order is refused by name" || { ko "M21 exit=$rc"; }
out=$(bash checker/companion-audit.sh --score "$T/m20.md" p a..b opus 2>&1); rc=$?; [ $rc -eq 1 ] && echo "$out" | grep -q 'scored only by its run' && ok "M22 a stamped record scored with no stamp is refused: a hand re-score cannot read a stale record as a pass" || { ko "M22 exit=$rc"; }
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
  # Every Bash form starts with the portable ceiling. The 7.x control required
  # the literal timeout binary here, which the macOS leg lacks: it mandated the
  # form LAW.XOS.4 forbids (first companion pass of 8.0.0).
  # Every Bash form is the wrapper, checker/companion-run.sh, since 9.0.0: a
  # prefix grant of node or git admitted node -e and git commit (M23).
  echo "$a" | grep -o 'Bash([^)]*)' | grep -v -q -F 'Bash(bash $here/checker/companion-run.sh:*)' && return 1
  # The permission mode is explicit on the same line, or a parent in bypass
  # mode hands the nested session every tool (M31).
  grep -q -- '--allowedTools "[^"]*" --permission-mode default' "$1" || return 1
  return 0
}
sed 's/--allowedTools "Read,/--allowedTools "Write,Read,/' checker/companion-audit.sh > "$T/m17.sh"
grep -q -- '--allowedTools "Write,Read,' "$T/m17.sh" || { echo "M17 mutation did not land"; fail=$((fail+1)); }
sed 's/--allowedTools "Read,\([^"]*\)"/--allowedTools "Read,Bash"/' checker/companion-audit.sh > "$T/m17b.sh"
# M17c: the 7.x form, a bare timeout in the allow-list, is refused now (LAW.XOS.4)
sed 's/Bash(bash $here\/checker\/companion-run.sh:\*)/Bash(timeout 60 node:*)/' checker/companion-audit.sh > "$T/m17c.sh"
grep -q -- 'Bash(timeout 60 node:\*)' "$T/m17c.sh" || { echo "M17c mutation did not land"; fail=$((fail+1)); }
allow_ok "$T/m17c.sh"; r3=$?
[ $r3 -eq 1 ] && ok "M17c a bare timeout in the allow-list is refused: the ceiling must be the portable one" || { ko "M17c a bare timeout in the allow-list was admitted"; }
grep -q -- '--allowedTools "Read,Bash"' "$T/m17b.sh" || { echo "M17b mutation did not land"; fail=$((fail+1)); }
allow_ok "$T/m17b.sh"; r2=$?
[ $r2 -eq 1 ] && ok "M17b a bare Bash in the allow-list, the widest grant there is, is refused" || ko "M17b DID NOT FIRE: a bare Bash in the allow-list was admitted"
allow_ok "$T/m17.sh"; r1=$?; allow_ok checker/companion-audit.sh; r0=$?
[ $r1 -eq 1 ] && [ $r0 -eq 0 ] && ok "M17 the runner's allow-list carries no writing or spawning tool and every Bash form starts with the portable ceiling; a copy granting Write is refused" || { ko "M17 planted=$r1 real=$r0"; }
# M23: the old prefix grant, Bash(node lib/ceiling.mjs 60 node:*), is refused: a prefix admits node -e and git commit
sed 's/Bash(bash $here\/checker\/companion-run.sh:\*)/Bash(node $here\/lib\/ceiling.mjs 60 node:*),Bash(node $here\/lib\/ceiling.mjs 60 git:*)/' checker/companion-audit.sh > "$T/m23.sh"
grep -q -- 'Bash(node $here/lib/ceiling.mjs 60 node:\*)' "$T/m23.sh" || { echo "M23 mutation did not land"; fail=$((fail+1)); }
allow_ok "$T/m23.sh"; r23=$?
[ $r23 -eq 1 ] && ok "M23 a copy granting the old node and git prefixes is refused: a prefix grant is an interpreter" || { ko "M23 the old prefix grant was admitted"; }
# M24: the wrapper refuses by name: node -e, a script outside the engines, git commit, an argument with a redirect; and runs an engine
w=checker/companion-run.sh
bash $w node -e 'process.exit(0)' >/dev/null 2>&1; r24a=$?
bash $w node "$T/m9.md" >/dev/null 2>&1; r24b=$?
bash $w git commit -m x >/dev/null 2>&1; r24c=$?
out24d=$(bash $w git log '-1' '>' "$T/redirect" 2>&1); r24d=$?
bash $w node lib/ceiling.mjs controls >/dev/null 2>&1; r24e=$?
bash $w git rev-parse HEAD >/dev/null 2>&1; r24f=$?
[ $r24a -eq 3 ] && [ $r24b -eq 3 ] && [ $r24c -eq 3 ] && [ $r24d -eq 3 ] && echo "$out24d" | grep -q 'shell syntax' && [ $r24e -eq 0 ] && [ $r24f -eq 0 ] && ok "M24 the wrapper refuses node -e, a script outside the engines, git commit and a redirect argument (exit 3 each) and runs an engine and a reading git verb" || { ko "M24 wrapper: -e=$r24a outside=$r24b commit=$r24c redirect=$r24d engine=$r24e git=$r24f"; }
# M25: a tree that changed during the audit is read as a breach of LAW.COMPANION.1
t0=$(bash checker/companion-audit.sh --tree-state); printf 'planted\n' > zz-tree-control.tmp; t1=$(bash checker/companion-audit.sh --tree-state); rm -f zz-tree-control.tmp
# and under an ignored artifact directory, which the plain status never lists
mkdir -p artifacts/cache; printf 'planted\n' > artifacts/cache/zz-tree-control.nt; t2=$(bash checker/companion-audit.sh --tree-state); rm -f artifacts/cache/zz-tree-control.nt
[ "$t0" != "$t1" ] && echo "$t1" | grep -q 'zz-tree-control.tmp' && [ "$t0" != "$t2" ] && echo "$t2" | grep -q 'artifacts/cache/zz-tree-control.nt' && ok "M25 a file planted during the audit moves the tree state the runner compares, at the root and under an ignored artifact directory" || { ko "M25 the tree state did not move for both plants"; }
# M26: LAW.COMPANION.5: a ceiling that fires is UNAUDITED, exit 124, never a pass; a claude that sleeps past a one-second ceiling
mkdir -p "$T/bin" "$T/out"; printf '#!/usr/bin/env bash\nsleep 8\n' > "$T/bin/claude"; chmod +x "$T/bin/claude"
# on the Windows leg node finds a command through PATHEXT, so the sleeping twin is a .cmd
printf '@ping -n 9 127.0.0.1 >nul\r\n' > "$T/bin/claude.cmd"
out=$(PATH="$T/bin:$PATH" bash checker/companion-audit.sh ctl-ceiling v8.0.0..HEAD "$T/out" opus 5 1 2>&1); r26=$?
[ $r26 -eq 124 ] && echo "$out" | grep -q 'CEILING FIRED' && echo "$out" | grep -q 'UNAUDITED' && ok "M26 a ceiling that fires records the phase UNAUDITED at exit 124 (LAW.COMPANION.5), never a pass" || { ko "M26 exit=$r26: $(echo "$out" | grep "^companion:" | tail -3 | tr '
' ' ' | cut -c1-300)"; }
# M27: git config in its writing forms is refused and writes nothing; its readers run
bash $w git config --file "$T/cfg" a.b c >/dev/null 2>&1; r27a=$?
bash $w git config core.hooksPath x >/dev/null 2>&1; r27b=$?
bash $w git config --get core.bare >/dev/null 2>&1; r27c=$?
[ $r27a -eq 3 ] && [ $r27b -eq 3 ] && [ ! -e "$T/cfg" ] && [ $r27c -eq 0 ] && ok "M27 git config --file and a key write are refused (exit 3, no file written) and --get reads" || { ko "M27 config: file=$r27a key=$r27b get=$r27c"; }
# M28: an engine is admitted by what it does: writers by name, a bare run, a writing verb and build without --check are refused; a reading verb, a bare reporter and build --check run
bash $w node checker/spdx-add.mjs >/dev/null 2>&1; r28a=$?
bash $w node checker/plates.mjs >/dev/null 2>&1; r28b=$?
bash $w node lib/cache.mjs save x --state y >/dev/null 2>&1; r28c=$?
bash $w node bin/rot-dtd-commander.mjs build >/dev/null 2>&1; r28d=$?
bash $w node lib/ordinals.mjs controls >/dev/null 2>&1; r28e=$?
bash $w node checker/gate-sync.mjs >/dev/null 2>&1; r28f=$?
out28g=$(bash $w node checker/readme-index.mjs check 2>&1); r28g=$?
bash $w node checker/counts-sweep.mjs >/dev/null 2>&1; r28h=$?
bash $w node checker/contract-audit.mjs >/dev/null 2>&1; r28i=$?
bash $w node lib/ceiling.mjs check >/dev/null 2>&1; r28j=$?
[ $r28a -eq 3 ] && [ $r28b -eq 3 ] && [ $r28c -eq 3 ] && [ $r28d -eq 3 ] && [ $r28e -eq 0 ] && [ $r28f -eq 0 ] && [ $r28g -eq 3 ] && echo "$out28g" | grep -q 'not a reading spelling' && [ $r28h -eq 3 ] && [ $r28i -eq 3 ] && [ $r28j -eq 3 ] && ok "M28 spdx-add by name, plates bare, cache save, build without --check, a dashless check against readme-index, counts-sweep and contract-audit by name and a verb outside ceiling's set are refused (exit 3); ordinals controls and gate-sync run" || { ko "M28 engines: add=$r28a bare=$r28b save=$r28c build=$r28d ordinals=$r28e sync=$r28f dashless=$r28g counts=$r28h contract=$r28i ceiling=$r28j"; }
# M29: the bare arms: every reporter the table names as BARE runs bare at exit 0, a bare run of an admitted engine that is not one is refused, and an engine outside the table is refused
bash $w node checker/gate-sync.mjs >/dev/null 2>&1; r29a=$?
bash $w node checker/engines-sweep.mjs >/dev/null 2>&1; r29b=$?
out29c=$(bash $w node checker/glossary.mjs 2>&1); r29c=$?
out29d=$(bash $w node lib/arm.mjs controls 2>&1); r29d=$?
[ $r29a -eq 0 ] && [ $r29b -eq 0 ] && [ $r29c -eq 3 ] && echo "$out29c" | grep -q 'run bare is not admitted' && [ $r29d -eq 3 ] && echo "$out29d" | grep -q 'not an engine the companion may run' && ok "M29 gate-sync and engines-sweep run bare (exit 0); glossary bare and an engine outside the table are refused by name (exit 3)" || { ko "M29 bare arms: sync=$r29a engines=$r29b glossary=$r29c arm=$r29d"; }
# A spelling is bad on the wrapper's refusal (3), an engine's usage exit (2),
# the ceiling (124), or a usage line in its output; an engine's own 1 is a
# verdict (doctor on a stale install). A spelling that takes an argument is
# walked with one (twenty-second companion pass: 124 and a usage exit were
# excused, and two granted spellings printed usage lines).
bad30=""; n30=0
want30=$(bash $w --table | wc -l | tr -d ' ')
t0=$(bash checker/companion-audit.sh --tree-state)
while read -r e s; do
  case "$s" in BARE) args="" ;; FILE) args="README.md" ;; build) args="build --check" ;; sweep) args="sweep --tracked dtd/sigil" ;; check) args="check README.md" ;; *) args="$s" ;; esac
  # shellcheck disable=SC2086
  out30=$(bash $w node "$e" $args 2>&1); rc=$?
  n30=$((n30+1))
  case $rc in 3) bad30="$bad30 $e[$s]=refused" ;; 2) bad30="$bad30 $e[$s]=usage-exit" ;; 124) bad30="$bad30 $e[$s]=ceiling" ;; esac
  echo "$out30" | grep -q -i -E '^usage:|unknown argument' && bad30="$bad30 $e[$s]=usage-line"
done < <(bash $w --table)
t1=$(bash checker/companion-audit.sh --tree-state)
[ "$t0" != "$t1" ] && bad30="$bad30 tree-moved($(diff <(printf '%s\n' "$t0") <(printf '%s\n' "$t1") | grep '^[<>]' | tr '\n' ' ' | cut -c1-160))"
[ "$n30" -eq "$want30" ] && [ "$n30" -ge 60 ] && [ -z "$bad30" ] && ok "M30 every spelling the table grants runs without a refusal, a usage exit, a usage line or the ceiling, and the walk leaves the tree as it was ($n30 of $want30 spellings walked)" || { ko "M30 table walk: $n30 of $want30 spellings;$bad30"; }
# M31: a runner copy with no explicit permission mode is refused: a parent in bypass mode would hand the nested session every tool
sed 's/ --permission-mode default//' checker/companion-audit.sh > "$T/m31.sh"
grep -q -- '--permission-mode default' "$T/m31.sh" && { echo "M31 mutation did not land"; fail=$((fail+1)); }
allow_ok "$T/m31.sh"; r31=$?
[ $r31 -eq 1 ] && ok "M31 a runner copy without --permission-mode default is refused" || { ko "M31 a runner without a permission mode was admitted"; }
# M32: a control suite inside a control suite is refused by name (the mark every child inherits)
out32=$(ROT_CHECKER_CONTROLS_RUNNING=1 bash checker/checker-controls.sh 2>&1); r32=$?
[ $r32 -eq 3 ] && echo "$out32" | grep -q 'a control suite inside a control suite' && ok "M32 the suite refuses to run inside itself, exit 3 by name: no table and no engine can fork it" || { ko "M32 nested suite exit=$r32"; }
# M33: the mutation proof of M9: a scorer whose high count is gutted refuses M9's plant for LAW.COMPANION.4, so M9 can go red
# the copy sits under checker/ so its own here resolves to this repository; the trap removes it
sed 's/^  nhigh=.*/  nhigh=0/' checker/companion-audit.sh > checker/zz-m33-runner.sh
grep -q '^  nhigh=0$' checker/zz-m33-runner.sh || { echo "M33 mutation did not land"; fail=$((fail+1)); }
out33=$(bash checker/zz-m33-runner.sh --score "$T/m9.md" p a..b opus 2>&1); r33=$?
rm -f checker/zz-m33-runner.sh
[ $r33 -eq 1 ] && echo "$out33" | grep -q 'a fail with no high finding' && ! echo "$out33" | grep -q '^companion: p FAIL$' && ok "M33 with the high count gutted, M9's plant is refused for LAW.COMPANION.4 and the FAIL line never prints: M9 can go red" || { ko "M33 gutted scorer exit=$r33"; }
# M34: a finding element quoted at column zero in a body, unclosed on its line, is prose, never a phantom element (LAW.COMPANION.3)
printf '### 🩺 Scope\n\n%s\n\n### 🩺 Findings\n\n<finding file="x" line="1" severity="high" confidence="measured">the grammar opens a finding as\n<finding file="y" line="2"\nand closes it later</finding>\n\n### 🩺 Verdict\n\nsound\n\n### 🩺 Next\n\nnothing\n\nCOMPANION VERDICT: fail\n' "$scope" > "$T/m34.md"
out34=$(bash checker/companion-audit.sh --score "$T/m34.md" p a..b opus 2>&1); r34=$?
[ $r34 -eq 1 ] && echo "$out34" | grep -q 'findings=0 sound=0' && echo "$out34" | grep -q 'a fail with no high finding' && ok "M34 a finding element split across lines and a quoted opening tag at column zero are neither counted nor faulted: findings=0, the fail refused for its high count" || { ko "M34 exit=$r34: $(echo "$out34" | head -1 | cut -c1-160)"; }

rm -rf "$T"
echo "checker controls: $ran run, $fail failing"
echo "checker-controls: $([ $fail -eq 0 ] && echo all tripped as designed || echo A CONTROL DID NOT FIRE)"
[ $fail -eq 0 ] && exit 0 || exit 1
