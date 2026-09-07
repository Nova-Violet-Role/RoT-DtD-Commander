#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/counts-sweep.mjs [--controls]
// Every count the repository publishes, measured from the tree and held
// against the place it is printed: the README badges and tagline, the
// claims rows, the package.json, plugin.json and marketplace.json
// descriptions. Commands, skills and agents are counted from the resolved
// tree; the checked files are their sum; the Adiutor guards are the highest
// control number in bin/adiutor.mjs; the checker controls are the total line
// checker/checker-controls.sh prints when it runs, and its span M0 to M19 is
// read beside it; the declarations
// are what checker/contract-audit.mjs prints. A number in words (twenty-six)
// is read through a small table. The tenth companion pass found three of
// these stale in one release after the gate had passed; this is the
// instrument that was missing. --controls plants a wrong number in a copy of
// each file and proves it is reported.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, 'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24, 'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28, 'twenty-nine': 29, thirty: 30, 'thirty-one': 31, 'thirty-two': 32, 'thirty-three': 33, 'thirty-four': 34, 'thirty-five': 35, 'thirty-six': 36, 'thirty-seven': 37, 'thirty-eight': 38, 'thirty-nine': 39, forty: 40 };
const num = (s) => (/^\d+$/.test(s) ? Number(s) : WORDS[s.toLowerCase()]);

// Run an instrument in the foreground and hand back what it printed. A number
// in a claim row is only a claim until this reads it back.
function runOut(cmd) {
  const parts = cmd.split(' ');
  const r = spawnSync(parts[0], parts.slice(1), { cwd: ROOT, encoding: 'utf8', timeout: 900000, stdio: ['ignore', 'pipe', 'pipe'] });
  return (r.stdout || '') + (r.stderr || '');
}

export function measure(root = ROOT) {
  const commands = readdirSync(join(root, 'commands')).filter((f) => f.endsWith('.md')).length;
  const skills = readdirSync(join(root, 'skills')).filter((d) => existsSync(join(root, 'skills', d, 'SKILL.md'))).length;
  const agents = readdirSync(join(root, 'agents')).filter((f) => f.endsWith('.md')).length;
  const guards = Math.max(...[...readFileSync(join(root, 'bin', 'adiutor.mjs'), 'utf8').matchAll(/control\('C(\d+)/g)].map((m) => Number(m[1])));
  // The checker controls are what the script prints when it runs, never a
  // formula over its labels: max(M)+1 could not see M17c and published twenty
  // for twenty-one while this sweep reported every place in step (third
  // companion pass). The span, M0 to M19, is a second number read separately.
  const ccText = readFileSync(join(root, 'checker', 'checker-controls.sh'), 'utf8');
  const checkerSpan = Math.max(...[...ccText.matchAll(/\bM(\d+)\b/g)].map((m) => Number(m[1])));
  // The mutation controls M1 to M7, counted from the labels the script prints
  // through ok, so the gate step name's "seven" is read, not assumed.
  const mutationsRefused = new Set([...ccText.matchAll(/\bok "M([1-7])\b/g)].map((m) => m[1])).size;
  const ccOut = runOut('bash checker/checker-controls.sh');
  const ccm = /checker controls: (\d+) run, (\d+) failing/.exec(ccOut);
  if (!ccm) throw new Error(`counts-sweep: checker-controls.sh printed no total line: ${ccOut.slice(-200)}`);
  // A red control suite is not a count: a total line with a failing count
  // above zero refuses the sweep here, so "36 places in step" can never print
  // green over a script that failed (fourth companion pass).
  if (Number(ccm[2]) !== 0) throw new Error(`counts-sweep: checker-controls.sh reports ${ccm[2]} failing control(s); the count of a red suite is not read: ${ccOut.split(/\r?\n/).filter((l) => /^FAIL/.test(l)).join(' | ').slice(0, 600)}`);
  const checkerControls = Number(ccm[1]);
  const audit = spawnSync(process.execPath, [join(root, 'checker', 'contract-audit.mjs')], { cwd: root, encoding: 'utf8', timeout: 120000 });
  const m = String(audit.stdout || '').match(/contract-audit: (\d+) declarations/);
  if (!m) throw new Error(`counts-sweep: contract-audit printed no declarations count: ${String(audit.stdout || audit.stderr).slice(0, 120)}`);
  const gateChain = Number((/gate-sync: (\d+) commands in the gate chain/.exec(runOut('node checker/gate-sync.mjs')) || [])[1] || 0);
  const amplifyControls = Number((/amplify controls: (\d+) run/.exec(runOut('node lib/amplify.mjs controls')) || [])[1] || 0);
  const listControls = Number((/list controls: (\d+) run/.exec(runOut('node lib/list.mjs controls')) || [])[1] || 0);
  const starlistControls = Number((/starlist controls: (\d+) run/.exec(runOut('node lib/starlist.mjs controls')) || [])[1] || 0);
  // The second companion pass of 8.0.0 found four changelog numbers and two
  // README claims rows stale on the release date while this sweep reported
  // every place in step: a number nothing reads drifts by the next minor.
  const crossOsControls = Number((/cross-os controls: (\d+) run/.exec(runOut('node lib/cross-os.mjs controls')) || [])[1] || 0);
  const geometryControls = Number((/geometry controls: (\d+) run/.exec(runOut('node lib/geometry.mjs controls')) || [])[1] || 0);
  const figureControls = Number((/figure controls: (\d+) run/.exec(runOut('node lib/figure.mjs controls')) || [])[1] || 0);
  const buildTargets = Number((/build --check: (\d+) targets/.exec(runOut('node bin/rot-dtd-commander.mjs build --check')) || [])[1] || 0);
  // The third pass: the changelog said five ceiling controls and the
  // instrument answered six. A number printed once is read here or it drifts.
  const ceilingControls = Number((/ceiling controls: (\d+) run/.exec(runOut('node lib/ceiling.mjs controls')) || [])[1] || 0);
  const encodingControls = Number((/encoding controls: (\d+) run/.exec(runOut('node lib/encoding.mjs controls')) || [])[1] || 0);
  // The three family counts the marketplace opening spells in words, and the
  // hosted packer builds from it: the book-derived commands as the slop gate's
  // shelf prints them, the schematics as the create-prompt variants on disk,
  // the creators as the prompt and meta-prompt variants together (fifth pass:
  // frozen in the packer's template, held by nothing).
  const books = Number((/shelf: (\d+) book-derived commands/.exec(runOut('node lib/ai-slop.mjs controls')) || [])[1] || 0);
  // The hosted packer's control count, published in docs/HOSTED-PLUGIN.md
  // twice and read by nothing until the sixth pass found 23 against 26.
  const hostedOut = runOut('node checker/pack-claude-ai.mjs --controls');
  const hm = /^(\d+) run, (\d+) failing/m.exec(hostedOut);
  if (!hm) throw new Error(`counts-sweep: pack-claude-ai.mjs --controls printed no total line: ${hostedOut.slice(-200)}`);
  // The refusal names the control that failed: on macOS the sweep refused a
  // red packer suite and the log said only "1 failing", so the leg had to be
  // diagnosed from the one control that runs in a temp directory.
  if (Number(hm[2]) !== 0) throw new Error(`counts-sweep: pack-claude-ai.mjs --controls reports ${hm[2]} failing; the count of a red suite is not read: ${hostedOut.split(/\r?\n/).filter((l) => /^FAIL/.test(l)).join(' | ').slice(0, 600)}`);
  const hostedControls = Number(hm[1]);
  // Tenth companion pass: the rule span the manifest publishes, read from
  // the checker's own rule comments, and the grammars the dtd-core
  // reference quotes, counted by heading.
  const rules = Math.max(...[...readFileSync(join(root, 'lib', 'dtd.mjs'), 'utf8').matchAll(/\/\/ C(\d+):/g)].map((m) => Number(m[1])));
  const quotedGrammars = (readFileSync(join(root, 'src', 'skills', 'dtd-core-dtd', 'references', 'subsets.md'), 'utf8').match(/^## [a-z-]+\.dtd$/gm) || []).length;
  // Thirteenth companion pass: the shared subsets by count, and the files
  // converted from taches-cc-resources by the MIT in their SPDX expression.
  const sharedSubsets = readdirSync(join(root, 'dtd')).filter((f) => /^cc-[a-z-]+\.dtd$/.test(f)).length;
  const dtdFiles = readdirSync(join(root, 'dtd')).filter((f) => f.endsWith('.dtd')).length;
  const mitOut = runOut('git grep -l -F EUPL-1.2) -- src');
  const mitFiles = mitOut.split(/\r?\n/).filter((l) => /^src\//.test(l));
  const mitCommands = mitFiles.filter((l) => /^src\/commands\//.test(l)).length;
  const mitSkills = new Set(mitFiles.filter((l) => /^src\/skills\//.test(l)).map((l) => l.split('/')[2])).size;
  // Eighth companion pass: a published number nobody re-read. The release
  // notes suite total, the control suites of the gate chain (every
  // controls: script of package.json) and the claims rows of the README.
  const rnOut = runOut('node checker/release-notes.mjs --controls');
  const rn = /release-notes controls: (\d+) run, (\d+) failing/.exec(rnOut);
  if (!rn || rn[2] !== '0') throw new Error(`counts-sweep: release-notes.mjs --controls printed no green total line: ${rnOut.slice(-200)}`);
  const releaseNotesControls = Number(rn[1]);
  const controlSuites = Object.keys(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts || {}).filter((k) => /^controls:/.test(k)).length;
  const readmeText = readFileSync(join(root, 'README.md'), 'utf8');
  const claimsAt = readmeText.indexOf('<!-- rdc-claims:machine-readable');
  const claimsBlock = claimsAt < 0 ? '' : readmeText.slice(claimsAt, readmeText.indexOf('-->', claimsAt));
  const claims = claimsBlock.split('\n').filter((l) => /^\s*\| /.test(l) && !/^\s*\| claim \|/.test(l) && !/^\s*\|-{3,}/.test(l)).length;
  const cmdNames = readdirSync(join(root, 'commands'));
  const schematics = cmdNames.filter((f) => /^create-prompt-[a-z]+-dtd\.md$/.test(f)).length;
  const creators = schematics + cmdNames.filter((f) => /^create-meta-prompt-[a-z]+-dtd\.md$/.test(f)).length;
  return {
    books, schematics, creators, hostedControls, releaseNotesControls, controlSuites, claims, rules, quotedGrammars, sharedSubsets, dtdFiles, mitFiles: mitFiles.length, mitCommands, mitSkills,
    gateChain,
    listControls, starlistControls, crossOsControls, geometryControls, figureControls, buildTargets, ceilingControls, encodingControls,
    amplifyControls, commands, skills, agents, checked: commands + skills + agents, guards, checkerControls, checkerSpan, mutationsRefused, declarations: Number(m[1]) };
}

// Where each count is printed: a file, a pattern with one capture per
// number, and the measured names the captures must equal.
export function places(c) {
  const p = [
    { file: 'README.md', re: /badge\/checked-(\d+)_files/, want: [c.checked], label: 'the Checker badge' },
    { file: 'README.md', re: /contract_audit-(\d+)_declarations/, want: [c.declarations], label: 'the Contract badge' },
    { file: 'README.md', re: /guards_tripped_on_purpose-(\d+)_%2B_(\d+)/, want: [c.guards, c.checkerControls], label: 'the Controls badge' },
    { file: 'README.md', re: /\*(\d+) Claude Code slash commands, (\d+) skills and (\d+) agents/, want: [c.commands, c.skills, c.agents], label: 'the tagline' },
    { file: 'README.md', re: /\| (\d+) commands, (\d+) skills, (\d+) agents carry a DOCTYPE/, want: [c.commands, c.skills, c.agents], label: 'the claims row of the counts' },
    { file: 'README.md', re: /`checked (\d+)  failed 0`/, want: [c.checked], label: 'the claims row of the checker' },
    { file: 'README.md', re: /^(\d+) commands, in the families/m, want: [c.commands], label: 'the usage sentence' },
    { file: 'README.md', re: /adiutor\.mjs controls\s+# ([a-z-]+) guards;/, want: [c.guards], label: 'the verify line of the guards' },
    { file: 'package.json', re: /(\d+) Claude Code commands/, want: [c.commands], label: 'the package description' },
    { file: 'package.json', re: /(\d+) skills and (\d+) agents/, want: [c.skills, c.agents], label: 'the package description, skills and agents' },
    { file: '.claude-plugin/plugin.json', re: /(\d+) Claude Code commands, (\d+) skills and (\d+) agents/, want: [c.commands, c.skills, c.agents], label: 'the plugin description' },
    { file: '.claude-plugin/plugin.json', re: /(\d+) declarations/, want: [c.declarations], label: 'the plugin description, declarations' },
    { file: '.claude-plugin/plugin.json', re: /([a-z-]+) Adiutor guards and ([a-z-]+) checker controls/, want: [c.guards, c.checkerControls], label: 'the plugin description, guards' },
    { file: '.claude-plugin/marketplace.json', re: /"(\d+) commands, (\d+) of them -dtd/, want: [c.commands, c.commands - 1], label: 'the marketplace plugin description' },
    // The claim rows publish what an instrument prints; a row that no longer
    // re-runs is exactly what this sweep exists to refuse.
    { file: 'README.md', re: /gate-sync\.mjs`: `(\d+) commands in the gate chain/, want: [c.gateChain], label: 'the claims row of the gate chain' },
    { file: 'CHANGELOG.md', re: /(\d+) gate-chain commands/, want: [c.gateChain], label: 'the changelog gate chain' },
    // Ninth companion pass: the changelog's own measured row quoted the
    // command and differed from it only in the number, in two shapes the
    // sweep did not read.
    { file: 'CHANGELOG.md', re: /gate-sync\.mjs`: (\d+) commands in the gate chain/, want: [c.gateChain], label: 'the changelog measured row of the gate chain' },
    { file: 'CHANGELOG.md', re: /gate chain (\d+) commands/, want: [c.gateChain], label: 'the changelog prose of the gate chain' },
    { file: 'README.md', re: /amplify\.mjs controls`: `(\d+) run, 0 failing/, want: [c.amplifyControls], label: 'the claims row of the amplify controls' },
    { file: 'README.md', re: /list\.mjs controls`: `(\d+) run, 0 failing/, want: [c.listControls], label: 'the claims row of the list controls' },
    { file: 'CHANGELOG.md', re: /lib\/list\.mjs controls`: (\d+) run/, want: [c.listControls], label: 'the changelog list controls' },
    { file: 'RELEASE.md', re: /lib\/list\.mjs controls` (\d+) run/, want: [c.listControls], label: 'the release notes list controls' },
    { file: 'CHANGELOG.md', re: /lib\/starlist\.mjs controls`: (\d+) run/, want: [c.starlistControls], label: 'the changelog starlist controls' },
    { file: '.claude-plugin/marketplace.json', re: /(\d+) skills and (\d+) agents/, want: [c.skills, c.agents], label: 'the marketplace plugin description, skills and agents' },
    { file: '.claude-plugin/marketplace.json', re: /([a-z-]+) book-derived commands[^,]*, ([a-z-]+) prompt and meta-prompt creators over ([a-z-]+) schematics/, want: [c.books, c.creators, c.schematics], label: 'the marketplace plugin description, the three families in words' },
    // The claims rows and the Measured block: prose a reader takes as evidence.
    { file: 'README.md', re: /`rdc build --check`: `(\d+) targets, 0 drifted/, want: [c.buildTargets], label: 'the claims row of the build' },
    { file: 'README.md', re: /checker-controls\.sh`: ([a-z-]+) controls M0 to M(\d+)/, want: [c.checkerControls, c.checkerSpan], label: 'the claims row of the checker controls' },
    // The step name spells three numbers: the span, the mutations refused (M1
    // to M7, counted from the script's own labels) and the scorer and runner
    // controls, which are every control that is not M0 to M8. Nothing here is
    // a constant subtracted from a total (fourth companion pass).
    { file: '.github/workflows/gate.yml', re: /checker controls \(M0 to M(\d+) - ([a-z-]+) mutations refused, one under INCLUDE and the untouched file pass, ([a-z-]+) scorer and runner controls\)/, want: [c.checkerSpan, c.mutationsRefused, c.checkerControls - c.mutationsRefused - 2], label: 'the gate step name of the checker controls' },
    { file: 'README.md', re: /contract-audit\.mjs`: `(\d+) declarations, 0 unused/, want: [c.declarations], label: 'the claims row of the contract audit' },
    // Eighth companion pass: the Adiutor and release-notes claims rows, the
    // gate step name, the plate prose the README keeps beside each picture,
    // the verify comment and the alt text of the claims plate. A plate is
    // held to its source by checker/plates.mjs; the source is held to the
    // tree here.
    { file: 'README.md', re: /adiutor\.mjs controls`: `(\d+) run, 0 failing/, want: [c.guards], label: 'the claims row of the Adiutor guards' },
    { file: 'README.md', re: /release-notes\.mjs --controls`: `(\d+) run, 0 failing/, want: [c.releaseNotesControls], label: 'the claims row of the release-notes controls' },
    { file: '.github/workflows/gate.yml', re: /adiutor controls \(([a-z-]+) guards tripped on purpose/, want: [c.guards], label: 'the gate step name of the Adiutor guards' },
    { file: 'README.md', re: /the ([a-z-]+) Adiutor controls, the contract audit/, want: [c.guards], label: 'the verify plate prose of the Adiutor guards' },
    { file: 'README.md', re: /the ([a-z-]+) control suites of the gate chain/, want: [c.controlSuites], label: 'the verify plate prose of the control suites' },
    { file: 'README.md', re: /checker-controls\.sh\s+# M0 to M(\d+): ([a-z-]+) mutations refused, one under INCLUDE and the untouched file pass, then ([a-z-]+) scorer and runner controls/, want: [c.checkerSpan, c.mutationsRefused, c.checkerControls - c.mutationsRefused - 2], label: 'the verify comment of the checker controls' },
    { file: 'README.md', re: /([A-Za-z-]+) prompt and meta-prompt creators, one per schematic and its meta form over ([a-z-]+) schematics/, want: [c.creators, c.schematics], label: 'the about plate prose of the creators' },
    { file: 'README.md', re: /the shelf of ([a-z-]+) book-derived commands/, want: [c.books], label: 'the about plate prose of the shelf' },
    { file: 'README.md', re: /alt="(\d+) claims, each with the command that proves it"/, want: [c.claims], label: 'the alt text of the claims plate' },
    // Tenth companion pass: the manifest said rules C1 to C15 where the
    // checker says C16, CITATION.cff sat at 4.0.0 with counts from 3.x,
    // and the dtd-core skill counted the copy rather than the corpus.
    { file: '.claude-plugin/plugin.json', re: /rules C1 to C(\d+)/, want: [c.rules], label: 'the plugin description, rules' },
    { file: 'README.md', re: /passes rules C1 to C(\d+)/, want: [c.rules], label: 'the claims row of the rules' },
    { file: 'CITATION.cff', re: /rules C1 to C(\d+)/, want: [c.rules], label: 'the citation abstract, rules' },
    { file: 'CITATION.cff', re: /(\d+) Claude Code slash commands, (\d+) skills and (\d+) agents/, want: [c.commands, c.skills, c.agents], label: 'the citation abstract, counts' },
    { file: 'CITATION.cff', re: /([a-z-]+) guards trip on purpose/, want: [c.guards], label: 'the citation abstract, guards' },
    { file: 'src/skills/dtd-core-dtd/SKILL.md', re: /the (\d+) grammars quoted verbatim/, want: [c.quotedGrammars], label: 'the dtd-core skill, quoted grammars' },
    // Thirteenth companion pass: the agent's routing surface named four
    // subsets of nineteen, and the licence plate counted forty-four
    // converted files where the SPDX expression says how many.
    { file: 'src/agents/dtd-contract-auditor.md', re: /every dtd\/cc-\*\.dtd, ([a-z-]+) of them/, want: [c.sharedSubsets], label: 'the contract auditor description, shared subsets' },
    // Fifteenth companion pass: the doctor's subsets row said eighteen where
    // the instrument counts every dtd file, thirty-one.
    { file: 'README.md', re: /row `subsets`: `(\d+) subsets, every one installed`/, want: [c.dtdFiles], label: 'the claims row of the doctor subsets' },
    // Seventeenth companion pass: the same row quotes the suite's total line.
    { file: 'README.md', re: /`checker controls: (\d+) run, 0 failing`/, want: [c.checkerControls], label: 'the claims row quoting the checker total line' },
    { file: 'README.md', re: /(\d+) converted sources, mirrored into the installed copy under commands\/ and skills\/, carry the upstream MIT/, want: [c.mitFiles], label: 'the licence plate prose of the converted files' },
    { file: 'README.md', re: /the ([a-z-]+) commands and ([a-z-]+) skills that carry its MIT today/, want: [c.mitCommands, c.mitSkills], label: 'the supporting plate prose of the converted commands and skills' },
    { file: 'CHANGELOG.md', re: /lib\/cross-os\.mjs controls`: (\d+) run/, want: [c.crossOsControls], label: 'the changelog cross-os controls' },
    { file: 'CHANGELOG.md', re: /matrix --check`, (\d+) controls\./, want: [c.crossOsControls], label: 'the changelog cross-os prose' },
    { file: 'CHANGELOG.md', re: /lib\/geometry\.mjs controls`: (\d+) run/, want: [c.geometryControls], label: 'the changelog geometry controls' },
    { file: 'CHANGELOG.md', re: /lib\/figure\.mjs controls`: (\d+) run/, want: [c.figureControls], label: 'the changelog figure controls' },
    { file: 'CHANGELOG.md', re: /lib\/ceiling\.mjs controls`: (\d+) run, 0 failing; `node lib\/encoding\.mjs controls`: (\d+) run/, want: [c.ceilingControls, c.encodingControls], label: 'the changelog ceiling and encoding controls' },
    { file: 'CHANGELOG.md', re: /checker\/contract-audit\.mjs`: (\d+) declarations/, want: [c.declarations], label: 'the changelog contract audit' },
    { file: 'CHANGELOG.md', re: /checked (\d+); (\d+) declarations; (\d+) gate-chain commands/, want: [c.checked, c.declarations, c.gateChain], label: 'the changelog summary row' },
    { file: 'RELEASE.md', re: /(\d+) declarations; recognised/, want: [c.declarations], label: 'the release notes declarations' },
    // The hosted packer's control count, in the doc's prose, its verify block
    // and the changelog's Measured block (sixth companion pass).
    { file: 'docs/HOSTED-PLUGIN.md', re: /pack-claude-ai\.mjs --controls` reports `(\d+) run, 0 failing`/, want: [c.hostedControls], label: 'the hosted doc prose of the packer controls' },
    { file: 'docs/HOSTED-PLUGIN.md', re: /pack-claude-ai\.mjs --controls\s+# (\d+) run, 0 failing/, want: [c.hostedControls], label: 'the hosted doc verify block of the packer controls' },
    { file: 'CHANGELOG.md', re: /checker\/pack-claude-ai\.mjs --controls`: (\d+) run, 0 failing/, want: [c.hostedControls], label: 'the changelog packer controls' },
  ];
  // The sweep's own size, published in two places: the claims row said 22
  // while the sweep printed 33 (third companion pass). Two rows are added
  // below, so the count each must carry is the length after both.
  const total = p.length + 2;
  p.push({ file: 'README.md', re: /counts-sweep\.mjs`: `(\d+) places in step/, want: [total], label: 'the claims row of this sweep' });
  p.push({ file: 'CHANGELOG.md', re: /the sweep reads (\d+) places, from 22/, want: [total], label: 'the changelog sentence about this sweep' });
  return p;
}

export function check(c, texts) {
  const out = [];
  for (const p of places(c)) {
    const text = texts[p.file];
    if (text === undefined) { out.push(`${p.file}: not read`); continue; }
    const m = text.match(p.re);
    if (!m) { out.push(`${p.file}: ${p.label} not found (${p.re.source.slice(0, 50)})`); continue; }
    p.want.forEach((w, i) => { const have = num(m[i + 1]); if (have !== w) out.push(`${p.file}: ${p.label} says ${m[i + 1]}, the tree measures ${w}`); });
  }
  return out;
}

function readAll(root = ROOT) {
  const texts = {};
  for (const f of new Set(places({}).map((p) => p.file))) texts[f] = readFileSync(join(root, f), 'utf8');
  return texts;
}

function controls(c, texts) {
  let fail = 0;
  const say = (ok, text) => { console.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const d0 = check(c, texts);
  say(d0.length === 0, d0.length === 0 ? 'the tree as it stands reports nothing' : `the tree as it stands drifts: ${d0.join(' | ')}`);
  // The control script counts a failing control exactly once: its plant mode
  // runs M0 and one control forced to fail, and the total line must read two
  // run, one failing, at exit 1 (fifth companion pass: ko and a second
  // increment on the same line were counting one failure as two).
  const plant = spawnSync('bash', ['checker/checker-controls.sh'], { cwd: ROOT, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CC_PLANT_FAIL: '1' } });
  const total = /checker controls: (\d+) run, (\d+) failing/.exec(String(plant.stdout || '') + String(plant.stderr || ''));
  say(plant.status === 1 && total && total[1] === '2' && total[2] === '1', `trip: a planted failing control is counted once by the script's total line: ${total ? `${total[1]} run, ${total[2]} failing` : 'no total line'}, exit ${plant.status}`);
  const planted = { ...texts, 'README.md': texts['README.md'].replace(/badge\/checked-(\d+)_files/, 'badge/checked-1_files') };
  const d1 = check(c, planted);
  say(d1.length === 1 && /Checker badge says 1, the tree measures/.test(d1[0]), `trip: a planted Checker badge is reported by name: ${d1[0] || 'nothing'}`);
  const words = { ...texts, 'README.md': texts['README.md'].replace(/adiutor\.mjs controls\s+# [a-z-]+ guards;/, 'adiutor.mjs controls         # twenty guards;') };
  const d2 = check(c, words);
  say(d2.length === 1 && /says twenty, the tree measures/.test(d2[0]), `trip: a count in words is read and a stale one reported: ${d2[0] || 'nothing'}`);
  const gone = { ...texts, 'package.json': texts['package.json'].replace(/\d+ Claude Code commands/, 'many commands') };
  const d3 = check(c, gone);
  say(d3.length === 1 && /package description not found/.test(d3[0]), `trip: a count removed from a description is reported as not found: ${d3[0] || 'nothing'}`);
  // The three family counts in words: a stale one in the marketplace opening
  // is reported by name (sixth companion pass).
  const fam = { ...texts, '.claude-plugin/marketplace.json': texts['.claude-plugin/marketplace.json'].replace(/([a-z-]+) book-derived commands/, 'twelve book-derived commands') };
  const d4 = check(c, fam);
  say(d4.length === 1 && /three families in words says twelve, the tree measures/.test(d4[0]), `trip: a stale family count in words in the marketplace opening is reported by name: ${d4[0] || 'nothing'}`);
  // The gate step name of the Adiutor guards, in words: a stale one is
  // reported by name (eighth companion pass).
  const step = { ...texts, '.github/workflows/gate.yml': texts['.github/workflows/gate.yml'].replace(/adiutor controls \(([a-z-]+) guards tripped on purpose/, 'adiutor controls (twenty guards tripped on purpose') };
  const d5 = check(c, step);
  say(d5.length === 1 && /gate step name of the Adiutor guards says twenty, the tree measures/.test(d5[0]), `trip: a stale guard count in the gate step name is reported by name: ${d5[0] || 'nothing'}`);
  console.log(`counts-sweep controls: 7 run, ${fail} failing`);
  return fail === 0;
}

function main() {
  const c = measure();
  const texts = readAll();
  const summary = `commands ${c.commands}, skills ${c.skills}, agents ${c.agents}, checked ${c.checked}, guards ${c.guards}, checker controls ${c.checkerControls}, declarations ${c.declarations}`;
  // --controls carries the tree check as its first control and prints the
  // same summary the plain call prints, so one process serves the gate and
  // the instruments behind measure() run once per leg instead of twice
  // (fourth companion pass).
  if (process.argv[2] === '--controls') {
    const ok = controls(c, texts);
    const d = check(c, texts);
    // The drift lines are the whole point of the sweep: the fifth pass found
    // the gate's one invocation printing a count of drifted places and no name.
    for (const line of d) console.log(`  DRIFT ${line}`);
    console.log(`counts-sweep: ${summary}; ${d.length === 0 ? `${places(c).length} places in step` : `${d.length} places drifted`}`);
    process.exit(ok && d.length === 0 ? 0 : 1);
  }
  const d = check(c, texts);
  for (const line of d) console.log(`  DRIFT ${line}`);
  console.log(`counts-sweep: ${summary}; ${d.length === 0 ? `${places(c).length} places in step` : `${d.length} places drifted`}`);
  process.exit(d.length === 0 ? 0 : 1);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
