#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/sigil.mjs
// dtd/cc-sigil.dtd as code: the dollar sign measured against the five
// documents under dtd/sigil. The subset names the forms, the documents spell
// them, and this module holds the two to each other in both directions
// (LAW.SIGIL.3). Its second job is to RUN the shell forms on the leg it is on
// and record what each one expanded to beside what the study says, so a form
// a leg's bash lacks is a measured result and not a pass (LAW.SIGIL.7).
//
//   contract()          the documents, the topics, the tiers, the collisions and the laws
//   docs()              every document with its bytes and digest
//   measure()           names to tokens to the ranking document, both directions
//   study(scope)        one form, one tier, or all: the sigil_study as data
//   run(scope)          the shell trials on this leg: the sigil_run as data
//   controls()          every law tripped on purpose
//
//   node lib/sigil.mjs measure | study [form|tier|all] | run [tier|all] | controls

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = join(ROOT, 'dtd', 'cc-sigil.dtd');

export function contract(path = DTD) {
  const text = readFileSync(path, 'utf8');
  const ent = (name) => {
    const m = new RegExp(`<!ENTITY ${name.replace(/[.]/g, '\\.')}\\s+"([^"]*)"`).exec(text);
    if (!m) throw new Error(`cc-sigil.dtd declares no ${name}`);
    return m[1];
  };
  const tiers = {};
  for (const t of ent('SIGIL.tiers').split('|')) tiers[t] = ent(`SIGIL.tier.${t}`).split('|');
  const topics = {};
  for (const n of ent('SIGIL.topics').split('|')) topics[n] = ent(`SIGIL.topic.${n}`);
  return {
    dir: ent('SIGIL.docs.dir'), docs: ent('SIGIL.docs').split('|'), docsCount: Number(ent('SIGIL.docs.count')), ranking: ent('SIGIL.docs.ranking'),
    convention: ent('SIGIL.convention'), positionalUses: Number(ent('SIGIL.positional.uses')), indexBase: Number(ent('SIGIL.index.base')), markup: ent('SIGIL.markup'),
    topics, tiers, formsCount: Number(ent('SIGIL.forms.count')),
    collisions: ent('SIGIL.collisions').split('|'), collisionsCount: Number(ent('SIGIL.collisions.count')),
    trust: { pcdata: ent('SIGIL.trust.pcdata'), cdata: ent('SIGIL.trust.cdata'), ndata: ent('SIGIL.trust.ndata') },
    ceiling: Number(ent('SIGIL.ceiling')), outDir: ent('SIGIL.dir'), unsupported: ent('SIGIL.unsupported'),
    laws: [...text.matchAll(/<!ENTITY (LAW\.SIGIL\.\d+)\s/g)].map((m) => m[1]),
  };
}

// ---------- the names, spelled ----------
// The token is the spelling the ranking document uses, so the measure can
// find it there verbatim. The context is the column of the study.
export const TOKENS = {
  // tier S
  positional: { token: '$1', context: 'shell', topic: 2 }, 'all-args-at': { token: '$@', context: 'shell', topic: 2 }, 'all-args-star': { token: '$*', context: 'shell', topic: 2 }, 'arg-count': { token: '$#', context: 'shell', topic: 2 },
  'default-value': { token: '${var:-default}', context: 'shell', topic: 1 }, 'assign-default': { token: '${var:=}', context: 'shell', topic: 1 }, 'error-if-unset': { token: '${var:?}', context: 'shell', topic: 1 }, 'alternate-value': { token: '${var:+}', context: 'shell', topic: 1 },
  'strip-shortest-prefix': { token: '${var#pat}', context: 'shell', topic: 1 }, 'strip-shortest-suffix': { token: '${var%pat}', context: 'shell', topic: 1 }, 'strip-longest-prefix': { token: '${##}', context: 'shell', topic: 1 }, 'strip-longest-suffix': { token: '${%%}', context: 'shell', topic: 1 },
  'replace-first': { token: '${var/pat/rep}', context: 'shell', topic: 1 }, 'replace-all': { token: '//', context: 'shell', topic: 1 }, length: { token: '${#var}', context: 'shell', topic: 1 }, 'command-substitution': { token: '$(...)', context: 'shell', topic: 1 }, arithmetic: { token: '$((...))', context: 'shell', topic: 1 },
  'last-exit': { token: '$?', context: 'shell', topic: 2 }, pid: { token: '$$', context: 'shell', topic: 2 }, 'last-background-pid': { token: '$!', context: 'shell', topic: 2 }, 'array-all': { token: '"${arr[@]}"', context: 'shell', topic: 1 },
  'make-target': { token: '$@', context: 'make', topic: 4 }, 'make-first-prerequisite': { token: '$<', context: 'make', topic: 4 }, 'make-all-prerequisites': { token: '$^', context: 'make', topic: 4 },
  'compose-default': { token: '${VAR:-default}', context: 'compose', topic: 5 }, 'actions-expression': { token: '${{ }}', context: 'github actions', topic: 5 },
  'postgres-dollar-quote': { token: '$$...$$', context: 'postgresql', topic: 7 }, 'postgres-bind': { token: '$1', context: 'postgresql', topic: 7 }, 'jq-variable': { token: '$var', context: 'jq', topic: 7 },
  'regex-group': { token: '$1', context: 'regex', topic: 6 }, 'regex-whole-match': { token: '$&', context: 'regex', topic: 6 }, 'js-template': { token: '${}', context: 'javascript', topic: 6 }, 'claude-arguments': { token: '$ARGUMENTS', context: 'claude code', topic: 9 },
  // tier A
  'upper-all': { token: '${var^^}', context: 'shell', topic: 1 }, 'lower-all': { token: '${var,,}', context: 'shell', topic: 1 }, indirect: { token: '${!var}', context: 'shell', topic: 1 }, ifs: { token: '$IFS', context: 'shell', topic: 2 },
  lineno: { token: '$LINENO', context: 'shell', topic: 2 }, funcname: { token: '$FUNCNAME', context: 'shell', topic: 2 }, 'bash-source': { token: '$BASH_SOURCE', context: 'shell', topic: 2 }, pipestatus: { token: '$PIPESTATUS', context: 'shell', topic: 2 }, 'bash-rematch': { token: '$BASH_REMATCH', context: 'shell', topic: 2 }, 'quote-transform': { token: '${var@Q}', context: 'shell', topic: 1 },
  'cmake-variable': { token: '${VAR}', context: 'cmake', topic: 4 }, 'cmake-config': { token: '$<CONFIG>', context: 'cmake', topic: 4 }, 'cmake-target-file': { token: '$<TARGET_FILE>', context: 'cmake', topic: 4 },
  'terraform-interpolation': { token: '${}', context: 'terraform', topic: 5 }, 'terraform-literal': { token: '$${}', context: 'terraform', topic: 5 },
  'nginx-host': { token: '$host', context: 'nginx', topic: 7 }, 'nginx-remote': { token: '$remote_addr', context: 'nginx', topic: 7 }, 'grafana-interval': { token: '$__interval', context: 'grafana', topic: 7 }, 'grafana-rate-interval': { token: '$__rate_interval', context: 'grafana', topic: 7 },
  'mongo-root': { token: '$$ROOT', context: 'mongodb', topic: 7 }, 'mongo-now': { token: '$$NOW', context: 'mongodb', topic: 7 },
  'powershell-pipeline-item': { token: '$_', context: 'powershell', topic: 3 }, 'powershell-psitem': { token: '$PSItem', context: 'powershell', topic: 3 },
  'perl-default': { token: '$_', context: 'perl', topic: 6 }, 'perl-errno': { token: '$!', context: 'perl', topic: 6 }, 'perl-eval-error': { token: '$@', context: 'perl', topic: 6 },
  'vscode-tabstop': { token: '$1', context: 'vs code', topic: 6 }, 'vscode-placeholder': { token: '${1:default}', context: 'vs code', topic: 6 },
  // tier B
  substring: { token: '${var:offset:length}', context: 'shell', topic: 1 }, 'replace-prefix': { token: '${var/#}', context: 'shell', topic: 1 }, 'replace-suffix': { token: '${var/%}', context: 'shell', topic: 1 },
  seconds: { token: '$SECONDS', context: 'shell', topic: 2 }, random: { token: '$RANDOM', context: 'shell', topic: 2 }, epochseconds: { token: '$EPOCHSECONDS', context: 'shell', topic: 2 }, 'prefix-names': { token: '${!prefix*}', context: 'shell', topic: 1 },
  'process-substitution-in': { token: '<()', context: 'shell', topic: 1 }, 'process-substitution-out': { token: '>()', context: 'shell', topic: 1 }, 'ansi-c-quote': { token: "$'...'", context: 'shell', topic: 1 }, 'locale-quote': { token: '$"..."', context: 'shell', topic: 1 },
  'make-dir-part': { token: '$(@D)', context: 'make', topic: 4 }, 'make-file-part': { token: '$(@F)', context: 'make', topic: 4 }, 'make-stem': { token: '$*', context: 'make', topic: 4 }, 'make-archive-member': { token: '$%', context: 'make', topic: 4 }, 'make-order-only': { token: '$|', context: 'make', topic: 4 },
  'k8s-variable': { token: '$(VAR)', context: 'kubernetes', topic: 5 }, 'azure-macro': { token: '$[ ]', context: 'azure', topic: 5 }, 'azure-expression': { token: '${{ }}', context: 'azure', topic: 5 },
  'jq-env': { token: '$ENV', context: 'jq', topic: 7 }, 'jq-named': { token: '$ARGS.named', context: 'jq', topic: 7 }, 'jq-base64': { token: '@base64', context: 'jq', topic: 7 }, 'awk-last-field': { token: '$NF', context: 'awk', topic: 6 }, 'awk-second-last': { token: '$(NF-1)', context: 'awk', topic: 6 },
  'vcs-id': { token: '$Id$', context: 'version control', topic: 8 }, 'zsh-lines-flag': { token: '${(f)}', context: 'zsh', topic: 3 }, 'zsh-join-flag': { token: '${(j:,:)}', context: 'zsh', topic: 3 },
  // tier C
  'transform-assignment': { token: '${var@A}', context: 'shell', topic: 1 }, 'transform-attributes': { token: '@a', context: 'shell', topic: 1 }, 'transform-keys': { token: '@K', context: 'shell', topic: 1 }, 'transform-keys-quoted': { token: '@k', context: 'shell', topic: 1 }, 'transform-escape': { token: '@E', context: 'shell', topic: 1 }, 'transform-upper-first': { token: '@u', context: 'shell', topic: 1 }, 'transform-lower-first': { token: '@L', context: 'shell', topic: 1 },
  'toggle-case-all': { token: '${var~~}', context: 'shell', topic: 1 }, srandom: { token: '$SRANDOM', context: 'shell', topic: 2 }, 'bash-subshell': { token: '$BASH_SUBSHELL', context: 'shell', topic: 2 }, bashpid: { token: '$BASHPID', context: 'shell', topic: 2 }, 'bash-argc': { token: '$BASH_ARGC', context: 'shell', topic: 2 }, 'bash-argv': { token: '$BASH_ARGV', context: 'shell', topic: 2 },
  'comp-words': { token: '$COMP_WORDS', context: 'shell', topic: 2 }, compreply: { token: '$COMPREPLY', context: 'shell', topic: 2 }, funcnest: { token: '$FUNCNEST', context: 'shell', topic: 2 }, 'ksh-match': { token: '${.sh.match}', context: 'ksh', topic: 3 }, 'nushell-in': { token: '$in', context: 'nushell', topic: 3 }, 'velocity-quiet': { token: '$!{var}', context: 'velocity', topic: 6 },
  'regex-prematch': { token: '$`', context: 'regex', topic: 6 }, 'regex-postmatch': { token: "$'", context: 'regex', topic: 6 }, 'vcs-log': { token: '$Log$', context: 'version control', topic: 8 }, 'vcs-locker': { token: '$Locker$', context: 'version control', topic: 8 }, 'sysv-make-target': { token: '$$@', context: 'make', topic: 4 },
  // tier D, each with the rule it is used under
  'deprecated-arithmetic': { token: '$[...]', context: 'shell', topic: 1, rule: 'deprecated; write $((...))' }, 'unquoted-at': { token: '$@', context: 'shell', topic: 10, rule: 'always "$@" in double quotes; unquoted it word-splits' }, 'unquoted-star': { token: '$*', context: 'shell', topic: 10, rule: 'quoted, and only when one IFS-joined string is meant' },
  'make-shell-confusion': { token: '$@', context: 'make', topic: 4, rule: 'inside a recipe the shell form is written $$@' }, 'prompt-transform-untrusted': { token: '${var@P}', context: 'shell', topic: 10, rule: 'only on values you wrote; untrusted data goes through @Q first' }, 'indirect-untrusted': { token: '${!var}', context: 'shell', topic: 10, rule: 'the name must come from your own code, never from input' },
  'jndi-lookup': { token: '${jndi:...}', context: 'log4j', topic: 10, rule: 'never; the lookup is the attack' }, 'actions-event-in-run': { token: '${{ github.event.* }}', context: 'github actions', topic: 10, rule: 'bind to an env var first, never inline in run' }, 'eval-args': { token: 'eval "$@"', context: 'shell', topic: 10, rule: 'never on input; quote and validate, or execute "$@" directly' },
  'error-secret-leak': { token: '${var:?secret}', context: 'shell', topic: 10, rule: 'no secret in the message; it is logged' }, 'cvs-log-keyword': { token: '$Log$', context: 'version control', topic: 8, rule: 'never in a file two people edit; the expansion is a merge conflict' }, 'toggle-case-undocumented': { token: '${var~~}', context: 'shell', topic: 1, rule: 'undocumented and may be removed; write ^^ or ,, instead' }, 'toggle-case-first-undocumented': { token: '${var~}', context: 'shell', topic: 1, rule: 'undocumented and may be removed; write ^ or , instead' },
};

// The eleven collisions of the study, spelled the way its table spells them.
export const COLLISIONS = {
  at: { token: '$@', contexts: 'shell all positional args; make target name; perl eval error' },
  star: { token: '$*', contexts: 'shell all args IFS-joined; make pattern stem' },
  question: { token: '$?', contexts: 'shell last exit code; make newer prerequisites; powershell boolean success; perl child status' },
  dollar: { token: '$$', contexts: 'shell PID; make literal dollar; postgresql dollar-quote delimiter; regex literal dollar; powershell last token of line; compose literal dollar' },
  less: { token: '$<', contexts: 'make first prerequisite; perl real UID' },
  one: { token: '$1', contexts: 'shell first positional; postgresql first bind parameter; regex first capture group; claude code SECOND argument, zero based; vs code tabstop 1' },
  zero: { token: '$0', contexts: 'shell script name; claude code FIRST argument; awk whole record' },
  underscore: { token: '$_', contexts: 'shell last arg of previous command; powershell pipeline item; perl default variable' },
  brace: { token: '${VAR}', contexts: 'shell parameter expansion; make variable reference; powershell scoped variable; terraform and docker interpolation' },
  ampersand: { token: '$&', contexts: 'shell background job control; regex whole match; sed match' },
  bang: { token: '$!', contexts: 'shell last background PID; perl errno' },
};

// The trials a leg runs. expect is a string compared exactly after trimming,
// or a RegExp. needs is the bash a form requires, read against BASH_VERSINFO.
export const TRIALS = [
  { form: 'positional', script: 'set -- a b c; echo "$1 $2 $3"', expect: 'a b c' },
  { form: 'all-args-at', script: 'set -- "a b" c; printf "%s\\n" "$@" | wc -l', expect: /^2$/ },
  { form: 'all-args-star', script: 'set -- a b; IFS=-; echo "$*"', expect: 'a-b' },
  { form: 'arg-count', script: 'set -- a b c; echo $#', expect: '3' },
  { form: 'default-value', script: 'unset x; echo ${x:-def}', expect: 'def' },
  { form: 'assign-default', script: 'unset x; : ${x:=def}; echo $x', expect: 'def' },
  { form: 'error-if-unset', script: 'unset x; (echo ${x:?required}) 2>/dev/null; echo $?', expect: '1' },
  { form: 'alternate-value', script: 'x=1; echo ${x:+set}', expect: 'set' },
  { form: 'strip-shortest-prefix', script: 'f=a/b/c; echo ${f#*/}', expect: 'b/c' },
  { form: 'strip-longest-prefix', script: 'f=a/b/c; echo ${f##*/}', expect: 'c' },
  { form: 'strip-shortest-suffix', script: 'f=a.tar.gz; echo ${f%.*}', expect: 'a.tar' },
  { form: 'strip-longest-suffix', script: 'f=a.tar.gz; echo ${f%%.*}', expect: 'a' },
  { form: 'replace-first', script: 'x=foo.foo; echo ${x/foo/bar}', expect: 'bar.foo' },
  { form: 'replace-all', script: 'x=foo.foo; echo ${x//foo/bar}', expect: 'bar.bar' },
  { form: 'length', script: 'x=abc; echo ${#x}', expect: '3' },
  { form: 'command-substitution', script: 'echo $(echo hi)', expect: 'hi' },
  { form: 'arithmetic', script: 'echo $((6*7))', expect: '42' },
  { form: 'last-exit', script: 'false; echo $?', expect: '1' },
  { form: 'pid', script: '[ "$$" -gt 0 ] && echo ok', expect: 'ok' },
  { form: 'last-background-pid', script: 'true & p=$!; wait $p; [ "$p" -gt 0 ] && echo ok', expect: 'ok' },
  { form: 'array-all', script: 'a=(x "y z"); printf "%s\\n" "${a[@]}" | wc -l', expect: /^2$/ },
  { form: 'upper-all', script: 'x=abc; echo ${x^^}', expect: 'ABC', needs: '4.0' },
  { form: 'lower-all', script: 'x=ABC; echo ${x,,}', expect: 'abc', needs: '4.0' },
  { form: 'indirect', script: 'p=x; x=v; echo ${!p}', expect: 'v' },
  { form: 'ifs', script: 'x="a b"; IFS=" "; set -- $x; echo $#', expect: '2' },
  { form: 'lineno', script: 'echo $LINENO', expect: /^[0-9]+$/ },
  { form: 'funcname', script: 'f(){ echo $FUNCNAME; }; f', expect: 'f' },
  { form: 'bash-source', script: 'echo ${#BASH_SOURCE[@]}', expect: /^[0-9]+$/ },
  { form: 'pipestatus', script: 'false | true; echo ${PIPESTATUS[0]}', expect: '1' },
  { form: 'bash-rematch', script: '[[ abc =~ b(c) ]] && echo ${BASH_REMATCH[1]}', expect: 'c' },
  { form: 'quote-transform', script: 'x="a b"; echo ${x@Q}', expect: "'a b'", needs: '4.4' },
  { form: 'substring', script: 'x=abcdef; echo ${x:1:3}', expect: 'bcd' },
  { form: 'replace-prefix', script: 'x=aXa; echo ${x/#a/b}', expect: 'bXa' },
  { form: 'replace-suffix', script: 'x=aXa; echo ${x/%a/b}', expect: 'aXb' },
  { form: 'seconds', script: 'echo $SECONDS', expect: /^[0-9]+$/ },
  { form: 'random', script: 'echo $RANDOM', expect: /^[0-9]+$/ },
  { form: 'epochseconds', script: 'echo $EPOCHSECONDS', expect: /^[0-9]{9,}$/, needs: '5.0' },
  { form: 'prefix-names', script: 'foo1=1; foo2=2; echo ${!foo@} | wc -w', expect: /^2$/ },
  { form: 'process-substitution-in', script: 'cat <(echo hi)', expect: 'hi' },
  { form: 'ansi-c-quote', script: "x=$'a\\nb'; echo ${#x}", expect: '3' },
  { form: 'deprecated-arithmetic', script: 'echo $[1+2]', expect: '3', rule: 'run to show it still expands; never written new' },
];

const sha = (buf) => createHash('sha256').update(buf).digest('hex');
export function docs(c = contract()) {
  return c.docs.map((name) => {
    const p = join(ROOT, c.dir, name);
    const buf = existsSync(p) ? readFileSync(p) : null;
    return { name, path: p, present: !!buf, bytes: buf ? buf.length : 0, sha256: buf ? sha(buf) : '' };
  });
}

// The tokens the ranking section of the study spells, verbatim, in backticks.
export function rankedTokens(c = contract()) {
  const p = join(ROOT, c.dir, c.ranking);
  if (!existsSync(p)) return null;
  const text = readFileSync(p, 'utf8');
  const start = text.indexOf('## UTILITY RANKING');
  const end = text.indexOf('## Details', start);
  let section = text.slice(start, end < 0 ? undefined : end);
  const out = new Set();
  // a token that carries a backtick is written in a double-backtick span with
  // a space on each side; read those first, or every pair after one shifts
  section = section.replace(/``\s(.+?)\s``/g, (w, t) => { out.add(t); return ' '; });
  for (const m of section.matchAll(/`([^`\n]+)`/g)) out.add(m[1]);
  return out;
}

// ---------- both directions (LAW.SIGIL.3, LAW.SIGIL.4) ----------
export function measure(c = contract(), tokens = TOKENS) {
  const findings = [];
  const seen = new Map();
  for (const [tier, names] of Object.entries(c.tiers)) {
    for (const n of names) {
      if (seen.has(n)) findings.push(`form ${n} is in two tiers, ${seen.get(n)} and ${tier} (LAW.SIGIL.4)`);
      seen.set(n, tier);
      if (!tokens[n]) findings.push(`form ${n} of tier ${tier} has no token in lib/sigil.mjs (LAW.SIGIL.3)`);
    }
  }
  const declared = seen.size;
  if (declared !== c.formsCount) findings.push(`SIGIL.forms.count says ${c.formsCount}, the tiers name ${declared}`);
  for (const n of Object.keys(tokens)) if (!seen.has(n)) findings.push(`token ${n} is in no tier of the subset (LAW.SIGIL.4)`);
  const ranked = rankedTokens(c);
  let found = 0;
  const missing = [];
  const unranked = [];
  if (ranked) {
    for (const [n, t] of Object.entries(tokens)) {
      if (!seen.has(n)) continue;
      if (ranked.has(t.token)) found++; else missing.push(`${n} = ${t.token}`);
    }
    const covered = new Set(Object.values(tokens).map((t) => t.token));
    // a ranked token no name spells; ranges and prose in backticks are not tokens
    for (const t of ranked) if (!covered.has(t) && /\$|\{|@/.test(t) && !/^\$[1-9]$|–/.test(t)) unranked.push(t);
    for (const m of missing) findings.push(`the ranking does not spell ${m} (LAW.SIGIL.3)`);
    for (const t of unranked) findings.push(`the ranking spells ${t} and no form names it (LAW.SIGIL.3)`);
  } else findings.push(`the ranking document ${c.ranking} is absent under ${c.dir}`);
  for (const k of c.collisions) if (!COLLISIONS[k]) findings.push(`collision ${k} has no row in lib/sigil.mjs (LAW.SIGIL.5)`);
  if (c.collisions.length !== c.collisionsCount) findings.push(`SIGIL.collisions.count says ${c.collisionsCount}, the list names ${c.collisions.length}`);
  return { ok: findings.length === 0, findings, declared, found, missing, unranked, rankedCount: ranked ? ranked.size : 0 };
}

export function study(scope = 'all', c = contract()) {
  const m = measure(c);
  const ranked = rankedTokens(c) || new Set();
  const tierOf = (n) => Object.keys(c.tiers).find((t) => c.tiers[t].includes(n)) || '';
  let names = Object.keys(TOKENS).filter(tierOf);
  if (scope !== 'all') names = c.tiers[scope] ? c.tiers[scope] : names.filter((n) => n === scope || TOKENS[n].token === scope);
  const forms = names.map((n) => ({ name: n, ...TOKENS[n], tier: tierOf(n), found: ranked.has(TOKENS[n].token) ? 'yes' : 'no' }));
  const cols = Object.entries(COLLISIONS).filter(([k]) => c.collisions.includes(k)).map(([k, v]) => ({ name: k, ...v }));
  return { scope, docs: docs(c), forms, collisions: scope === 'all' ? cols : cols.filter((x) => forms.some((f) => f.token === x.token)), verdict: { declared: m.declared, found: m.found, missing: m.missing.length, unranked: m.unranked.length }, findings: m.findings };
}

// ---------- the run (LAW.SIGIL.7) ----------
export function bashVersion() {
  const r = spawnSync('bash', ['-c', 'echo ${BASH_VERSINFO[0]}.${BASH_VERSINFO[1]}'], { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] });
  return r.status === 0 ? String(r.stdout).trim() : '';
}
const vge = (have, need) => { const [a, b] = have.split('.').map(Number), [c, d] = need.split('.').map(Number); return a > c || (a === c && b >= d); };
export function run(scope = 'all', c = contract()) {
  const bash = bashVersion();
  const os = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : process.platform;
  const tierOf = (n) => Object.keys(c.tiers).find((t) => c.tiers[t].includes(n)) || '';
  const trials = TRIALS.filter((t) => scope === 'all' || tierOf(t.form) === scope || t.form === scope).map((t) => {
    if (t.needs && bash && !vge(bash, t.needs)) return { form: t.form, tier: tierOf(t.form), expect: String(t.expect), actual: '', result: 'unsupported', needs: `bash ${t.needs}, this leg has ${bash}` };
    const r = spawnSync('bash', ['-c', t.script], { encoding: 'utf8', timeout: c.ceiling * 1000, stdio: ['ignore', 'pipe', 'pipe'] });
    const actual = String(r.stdout || '').trim();
    const ok = t.expect instanceof RegExp ? t.expect.test(actual) : actual === t.expect;
    return { form: t.form, tier: tierOf(t.form), expect: String(t.expect), actual: actual || String(r.stderr || '').trim().slice(0, 80), result: ok ? 'pass' : 'fail', rule: t.rule || '' };
  });
  const tally = { pass: trials.filter((t) => t.result === 'pass').length, fail: trials.filter((t) => t.result === 'fail').length, unsupported: trials.filter((t) => t.result === 'unsupported').length };
  return { leg: { os, bash }, trials, tally, ok: tally.fail === 0 };
}

export function writeRun(root, r, { c = contract(), date = null } = {}) {
  const dir = join(root, c.outDir);
  mkdirSync(dir, { recursive: true });
  const d = date || new Date().toISOString().slice(0, 10);
  const p = join(dir, `${d}-run-${r.leg.os}.md`);
  const md = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->', '', `# Sigil run on ${r.leg.os}, bash ${r.leg.bash}, ${d}`, '',
    '| form | tier | expect | actual | result |', '|---|---|---|---|---|',
    ...r.trials.map((t) => `| ${t.form} | ${t.tier} | ${t.expect.replace(/\|/g, '\\|')} | ${String(t.actual).replace(/\|/g, '\\|')} | ${t.result}${t.needs ? ` (${t.needs})` : ''} |`), '',
    `tally: pass ${r.tally.pass}, fail ${r.tally.fail}, unsupported ${r.tally.unsupported}`, ''];
  writeFileSync(p, md.join('\n'), 'utf8');
  return p;
}

// ---------- controls ----------
export function controls(io = console) {
  let ran = 0;
  let fail = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const c = contract();
  const d = docs(c);
  say(d.length === c.docsCount && d.every((x) => x.present && x.bytes > 1000), `the ${c.docsCount} documents are present under ${c.dir}: ${d.map((x) => `${x.name} ${x.bytes} B`).join(', ')}`);
  say(Object.keys(c.topics).length === 10 && Object.keys(c.tiers).join('|') === 'S|A|B|C|D', 'ten topics and five tiers are declared');
  say(c.laws.length === 8 && c.laws.every((k, i) => k === `LAW.SIGIL.${i + 1}`), `LAW.SIGIL.1 to ${c.laws.length}, dense and ascending`);
  const m = measure(c);
  say(m.ok, m.ok ? `both directions hold: ${m.declared} forms named, ${m.found} spelled by the ranking of ${m.rankedCount} tokens, 0 missing, 0 unranked (LAW.SIGIL.3)` : `the measure has findings: ${m.findings.slice(0, 6).join('; ')}`);
  // planted: a form with no token, a token the ranking does not spell, a form in two tiers
  const noTok = measure(c, Object.fromEntries(Object.entries(TOKENS).filter(([k]) => k !== 'pid')));
  say(!noTok.ok && noTok.findings.some((f) => /form pid of tier S has no token/.test(f)), `trip: a form with no token is named: ${noTok.findings.find((f) => /pid/.test(f))}`);
  const wrongTok = measure(c, { ...TOKENS, pid: { ...TOKENS.pid, token: '$PID' } });
  say(!wrongTok.ok && wrongTok.findings.some((f) => /does not spell pid = \$PID/.test(f)), `trip: a token the ranking does not spell is named: ${wrongTok.findings.find((f) => /\$PID/.test(f))}`);
  const twice = { ...c, tiers: { ...c.tiers, A: [...c.tiers.A, 'pid'] } };
  say(!measure(twice).ok && measure(twice).findings.some((f) => /pid is in two tiers/.test(f)), 'trip: a form in two tiers is refused by name (LAW.SIGIL.4)');
  // the one convention, measured on the tree
  const cmds = join(ROOT, 'src', 'commands');
  let positional = 0, whole = 0;
  for (const f of readdirSync(cmds)) {
    const t = readFileSync(join(cmds, f), 'utf8');
    whole += (t.match(/\$ARGUMENTS\b/g) || []).length;
    positional += (t.match(/\$[0-9]\b/g) || []).length;
  }
  say(positional === c.positionalUses && whole > 100, `the one convention holds on the tree: $${c.convention} ${whole} times, positional shorthand ${positional} (LAW.SIGIL.1)`);
  say(COLLISIONS.one.contexts.includes('SECOND') && COLLISIONS.zero.contexts.includes('FIRST') && c.indexBase === 0, 'the collision table carries the zero based index of Claude Code, first is $0 (LAW.SIGIL.5)');
  // SIGIL.markup: the tokens that carry markup exist in the engine and in the
  // documents, and no ENTITY value of the subset carries one (rule C11).
  const values = [...readFileSync(DTD, 'utf8').matchAll(/<!ENTITY\s+[\w.]+\s+"([^"]*)"/g)].map((m) => m[1]);
  const marked = Object.values(TOKENS).filter((t) => /[&%<]/.test(t.token)).length;
  say(marked >= 5 && values.every((v) => !/[&%<]/.test(v)), `${marked} tokens carry markup and are spelled in the engine, none in an entity value of the subset (SIGIL.markup, rule C11)`);
  say(Object.values(TOKENS).filter((t) => c.tiers.D.includes(Object.keys(TOKENS).find((k) => TOKENS[k] === t))).every((t) => t.rule), 'every tier D form carries the rule it is used under (LAW.SIGIL.6)');
  // the run on this leg
  const r = run('all', c);
  say(r.leg.bash !== '' && r.trials.length === TRIALS.length, `the run knows its leg: ${r.leg.os}, bash ${r.leg.bash}, ${r.trials.length} trials`);
  say(r.ok, r.ok ? `every supported form expanded as the study says: pass ${r.tally.pass}, unsupported ${r.tally.unsupported} (LAW.SIGIL.7)` : `forms that did not expand as the study says: ${r.trials.filter((t) => t.result === 'fail').map((t) => `${t.form} expected ${t.expect} got ${JSON.stringify(t.actual)}`).join('; ')}`);
  say(r.trials.every((t) => t.result !== 'unsupported' || /bash \d\.\d, this leg has/.test(t.needs)), 'an unsupported form names the bash it needs and the bash this leg has, never a pass');
  const fake = { ...c, ceiling: 1 };
  const slow = spawnSync('bash', ['-c', 'sleep 3; echo late'], { encoding: 'utf8', timeout: fake.ceiling * 1000, stdio: ['ignore', 'pipe', 'pipe'] });
  say(slow.status === null && slow.signal, `trip: a trial past the ceiling is killed, signal ${slow.signal}, and its output is not read as a result`);
  io.log(`sigil controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [verb, a] = process.argv.slice(2);
  if (verb === 'controls') process.exit(controls() ? 0 : 1);
  if (verb === 'measure') {
    const m = measure();
    for (const f of m.findings) console.log(`  FINDING ${f}`);
    console.log(`sigil measure: ${m.declared} forms named, ${m.found} spelled by the ranking, ${m.missing.length} missing, ${m.unranked.length} unranked`);
    process.exit(m.ok ? 0 : 1);
  }
  if (verb === 'study') {
    const s = study(a || 'all');
    for (const d of s.docs) console.log(`  doc ${d.name} ${d.bytes} B ${d.sha256.slice(0, 12)}`);
    for (const f of s.forms) console.log(`  ${f.tier} ${f.name.padEnd(26)} ${f.token.padEnd(22)} ${f.context.padEnd(16)} topic ${f.topic} found ${f.found}${f.rule ? `  rule: ${f.rule}` : ''}`);
    for (const x of s.collisions) console.log(`  collision ${x.name} ${x.token}: ${x.contexts}`);
    console.log(`verdict: declared ${s.verdict.declared} found ${s.verdict.found} missing ${s.verdict.missing} unranked ${s.verdict.unranked}`);
    process.exit(s.findings.length ? 1 : 0);
  }
  if (verb === 'run') {
    const r = run(a && a !== '--write' ? a : 'all');
    console.log(`leg ${r.leg.os} bash ${r.leg.bash}`);
    for (const t of r.trials) console.log(`  ${t.result.padEnd(11)} ${t.tier} ${t.form.padEnd(26)} expect ${t.expect.padEnd(14)} actual ${JSON.stringify(t.actual)}${t.needs ? `  ${t.needs}` : ''}`);
    console.log(`tally: pass ${r.tally.pass}, fail ${r.tally.fail}, unsupported ${r.tally.unsupported}`);
    if (process.argv.includes('--write')) console.log(`  wrote ${writeRun(process.cwd(), r)}`);
    process.exit(r.ok ? 0 : 1);
  }
  console.log('usage: node lib/sigil.mjs measure | study [form|tier|all] | run [tier|all] [--write] | controls');
}
