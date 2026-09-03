#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/release-notes.mjs <version> | --payload <tag> | --controls
// The release notes of a version are its CHANGELOG.md section: the lines
// after the `## <version> (<date>)` heading up to the next `## ` heading.
// Two refusals: a version with no section, and a heading still marked
// "in progress" (a release is cut only once the heading carries the date
// alone). `--payload v<version>` prints the JSON body the release job in
// .github/workflows/gate.yml posts to the GitHub API: tag_name, a name made
// of the tag and the section's first sentence, and the section as body.
// `--controls` proves both refusals and one extraction on a planted
// changelog, so the job's instrument is known to be able to fail.

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

function controls() {
  const planted = [
    '# Changelog', '',
    '## 2.0.0 (in progress, 2026-01-02)', '', '- not yet', '',
    '## 1.0.0 (2026-01-01)', '', 'The first one: whole, over two', 'lines. Two sentences here.', '', '- a', '- b', '',
    '## 0.9.0 (2025-12-31)', '', '- old', '',
  ].join('\n');
  let fail = 0;
  const say = (ok, text) => { console.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
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
  console.log(`release-notes controls: 4 run, ${fail} failing`);
  return fail === 0;
}

// The check runs only when this file is the entry point, so the exports
// above stay reachable from another module.
function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--controls') process.exit(controls() ? 0 : 1);
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
  if (args[0] === '--payload') {
    const p = payload(args[1] || '', changelog);
    if (!p.ok) { console.error(`release-notes: ${p.reason}`); process.exit(1); }
    process.stdout.write(JSON.stringify(p.json) + '\n');
    process.exit(0);
  }
  if (!args[0]) { console.error('usage: release-notes.mjs <version> | --payload <tag> | --controls'); process.exit(2); }
  const s = section(changelog, args[0]);
  if (!s.ok) { console.error(`release-notes: ${s.reason}`); process.exit(1); }
  process.stdout.write(s.body);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
