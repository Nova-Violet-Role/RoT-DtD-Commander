#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/release-notes.mjs <version> | --payload <tag> | --versions [tag] | --controls
// The release notes of a version are its CHANGELOG.md section: the lines
// after the `## <version> (<date>)` heading up to the next `## ` heading.
// Two refusals: a version with no section, and a heading still marked
// "in progress" (a release is cut only once the heading carries the date
// alone). `--payload v<version>` prints the JSON body the release job in
// .github/workflows/gate.yml posts to the GitHub API: tag_name, a name made
// of the tag and the section's first sentence, and the section as body.
// `--controls` proves both refusals and one extraction on a planted
// changelog, so the job's instrument is known to be able to fail.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { versionHolds } from '../lib/amplify.mjs';

// The kept verbs of this release, read from the state record the family writes.
function amplifyState(root) {
  const p = join(root, 'artifacts', 'amplify-codebase', 'state.md');
  if (!existsSync(p)) return null;
  const text = readFileSync(p, 'utf8');
  const from = (/^- from: (.+)$/m.exec(text) || [])[1];
  const kept = [...text.matchAll(/^\| [0-9a-f]{8} \| (?:gap|idea) \| [a-z]+ \| marked \| ([0-9]+) \|/gm)].map((m) => ({ verb: Number(m[1]) }));
  if (!from || !kept.length) return null;
  return { from: from.trim(), kept };
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function section(changelog, version) {
  const lines = changelog.split('\n');
  const esc = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const head = new RegExp(`^## ${esc} \\((.*)\\)\\s*$`);
  const i = lines.findIndex((l) => head.test(l));
  if (i < 0) return { ok: false, reason: `no section for ${version} in CHANGELOG.md` };
  const paren = lines[i].match(head)[1];
  if (/in progress/i.test(paren)) return { ok: false, reason: `${version} is still in progress: ${lines[i]}` };
  let j = i + 1;
  while (j < lines.length && !/^## /.test(lines[j])) j++;
  const body = lines.slice(i + 1, j).join('\n').trim() + '\n';
  return { ok: true, body, date: paren };
}

// The name is the tag and the opening of the section's first paragraph:
// the paragraph's lines joined, cut at the first colon or the first period,
// so "The creator kit: sixteen creators ..." names the release "The creator kit".
export function releaseName(version, body) {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => l.trim() && !/^[-#]/.test(l));
  if (start < 0) return `v${version}`;
  let end = start;
  while (end < lines.length && lines[end].trim()) end++;
  const para = lines.slice(start, end).map((l) => l.trim()).join(' ');
  const sentence = para.split(/:|\.(\s|$)/)[0].trim();
  return sentence ? `v${version}: ${sentence}` : `v${version}`;
}

export function payload(tag, changelog) {
  const version = tag.replace(/^v/, '');
  const s = section(changelog, version);
  if (!s.ok) return s;
  return { ok: true, json: { tag_name: tag, name: releaseName(version, s.body), body: s.body, draft: false, prerelease: false } };
}

// The version is one everywhere: package.json, plugin.json, both fields of
// marketplace.json, the top section of CHANGELOG.md (in progress or dated)
// and a "## v<version>" heading in RELEASE.md; a tag, when given, must be
// v<version>. The release job refused the first v5.0.1 tag because
// package.json still said 5.0.0: this is the check that names that before
// a tag is cut.
export function versions(root = ROOT) {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  const plugin = JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  const mk = JSON.parse(readFileSync(join(root, '.claude-plugin', 'marketplace.json'), 'utf8'));
  const top = readFileSync(join(root, 'CHANGELOG.md'), 'utf8').match(/^## (\d+\.\d+\.\d+) \(([^)]*)\)/m) || [];
  const esc = String(pkg).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const releaseHeading = new RegExp(`^## v${esc}\\b`, 'm').test(readFileSync(join(root, 'RELEASE.md'), 'utf8'));
  return {
    'package.json': pkg,
    'plugin.json': plugin,
    'marketplace.json metadata': mk.metadata && mk.metadata.version,
    'marketplace.json plugin': mk.plugins && mk.plugins[0] && mk.plugins[0].version,
    'CHANGELOG.md top section': top[1],
    changelogState: top[2] || '',
    releaseHeading,
  };
}

export function versionFindings(v, tag = null) {
  const want = v['package.json'];
  const out = [];
  for (const n of ['plugin.json', 'marketplace.json metadata', 'marketplace.json plugin', 'CHANGELOG.md top section']) {
    if (v[n] !== want) out.push(`${n} says ${v[n]}, package.json says ${want}`);
  }
  if (!v.releaseHeading) out.push(`RELEASE.md has no heading "## v${want}"`);
  if (tag && tag !== `v${want}`) out.push(`the tag ${tag} is not v${want}`);
  return out;
}

function controls() {
  const planted = [
    '# Changelog', '',
    '## 2.0.0 (in progress, 2026-01-02)', '', '- not yet', '',
    '## 1.0.0 (2026-01-01)', '', 'The first one: whole, over two', 'lines. Two sentences here.', '', '- a', '- b', '',
    '## 0.9.0 (2025-12-31)', '', '- old', '',
  ].join('\n');
  let fail = 0;
  let ran = 0;
  const say = (ok, text) => {
    ran++; console.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const one = section(planted, '1.0.0');
  say(one.ok && one.body === 'The first one: whole, over two\nlines. Two sentences here.\n\n- a\n- b\n' && one.date === '2026-01-01',
    `a dated section is extracted whole and stops at the next heading: ${JSON.stringify(one.body)}`);
  const p = payload('v1.0.0', planted);
  say(p.ok && p.json.name === 'v1.0.0: The first one' && p.json.tag_name === 'v1.0.0',
    `the payload names the release from the first paragraph, joined across its lines and cut at the colon: ${p.ok ? p.json.name : p.reason}`);
  const two = section(planted, '2.0.0');
  say(!two.ok && /in progress/.test(two.reason), `trip: an in-progress heading is refused: ${two.reason}`);
  const three = section(planted, '3.0.0');
  say(!three.ok && /no section/.test(three.reason), `trip: a version with no section is refused: ${three.reason}`);
  const sound = { 'package.json': '1.0.0', 'plugin.json': '1.0.0', 'marketplace.json metadata': '1.0.0', 'marketplace.json plugin': '1.0.0', 'CHANGELOG.md top section': '1.0.0', changelogState: '2026-01-01', releaseHeading: true };
  say(versionFindings(sound, 'v1.0.0').length === 0, 'versions that agree everywhere, with their tag, report nothing');
  const stray = versionFindings({ ...sound, 'plugin.json': '1.0.1', releaseHeading: false });
  say(stray.length === 2 && /plugin\.json says 1\.0\.1/.test(stray[0]) && /RELEASE\.md/.test(stray[1]),
    `trip: a stray plugin.json version and a missing RELEASE.md heading are both reported: ${stray.join('; ')}`);
  const wrongTag = versionFindings(sound, 'v1.0.1');
  say(wrongTag.length === 1 && /the tag v1\.0\.1 is not v1\.0\.0/.test(wrongTag[0]), `trip: a tag that is not the version is refused: ${wrongTag[0]}`);
  console.log(`release-notes controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

// The check runs only when this file is the entry point, so the exports
// above stay reachable from another module.
function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--controls') process.exit(controls() ? 0 : 1);
  if (args[0] === '--versions') {
    const v = versions();
    for (const k of ['package.json', 'plugin.json', 'marketplace.json metadata', 'marketplace.json plugin', 'CHANGELOG.md top section']) console.log(`  ${k}: ${v[k]}`);
    console.log(`  RELEASE.md heading "## v${v['package.json']}": ${v.releaseHeading ? 'present' : 'MISSING'}; changelog top section ${v.changelogState}${args[1] ? `; tag ${args[1]}` : ''}`);
    const f = versionFindings(v, args[1] || null);
    for (const line of f) console.log(`  DISAGREE ${line}`);
    // LAW.AMP.14: the version is not typed, it is recognised. The state record
    // of the release names the verbs it kept; the recognizer turns them into a
    // number, and a manifest that says anything else is refused by name.
    const stated = amplifyState(ROOT);
    if (stated) {
      const check = versionHolds(v['package.json'], stated.kept, stated.from);
      if (!check.holds) {
        console.log(`  DISPUTED package.json says ${check.version}; the recognizer says ${check.recognised} (class ${check.class}) from the verbs kept at ${stated.from}`);
        f.push('the recognizer disputes the version');
      } else console.log(`  recognised ${check.recognised} (class ${check.class}) from the kept verbs ${stated.kept.map((k) => k.verb).join(', ')} at ${stated.from}`);
    } else {
      // Silence would be indistinguishable from a passing check. A tree with
      // no state record is not subject to LAW.AMP.14; it says so out loud.
      const p = join(ROOT, 'artifacts', 'amplify-codebase', 'state.md');
      if (existsSync(p)) {
        // A record that exists and cannot be read is a broken gate, not an
        // exemption: it would let any version through in silence.
        console.log(`  UNREADABLE ${p} exists but names no version to measure from, or no marked possibility; the recognizer cannot check the version`);
        f.push('the state record cannot be read by the recognizer');
      } else {
        console.log('  NOT CHECKED no state record, so this tree names no kept verbs and LAW.AMP.14 does not bind it');
      }
    }
    console.log(`release-notes versions: ${f.length === 0 ? `one version everywhere, ${v['package.json']}` : `${f.length} disagreements`}`);
    process.exit(f.length === 0 ? 0 : 1);
  }
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
  if (args[0] === '--payload') {
    const p = payload(args[1] || '', changelog);
    if (!p.ok) { console.error(`release-notes: ${p.reason}`); process.exit(1); }
    process.stdout.write(JSON.stringify(p.json) + '\n');
    process.exit(0);
  }
  if (!args[0]) { console.error('usage: release-notes.mjs <version> | --versions [tag] | --payload <tag> | --controls'); process.exit(2); }
  const s = section(changelog, args[0]);
  if (!s.ok) { console.error(`release-notes: ${s.reason}`); process.exit(1); }
  process.stdout.write(s.body);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
