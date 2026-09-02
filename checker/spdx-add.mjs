#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/spdx-add.mjs
// Put the SPDX header into every source file that lacks one. Idempotent.
// Converted files (listed by their `to` paths in dtd/forge-spec.json) also
// carry the upstream MIT portions line. Markdown with YAML frontmatter gets
// the header AFTER the frontmatter so checker rule C1 still holds.
//
//   node checker/spdx-add.mjs [--dry-run]

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
const TAG = 'SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2';
const COPY = 'Copyright 2026 Saimonokuma.';
const MIT = 'Portions Copyright 2025 Lex Christopherson, MIT (taches-cc-resources); see NOTICE.md.';
const DIRS = ['src', 'bin', 'lib', 'dtd', 'checker', 'examples', 'docs/tapes', '.github'];
const SKIP = new Set(['.json', '.jsonl', '.gif', '.png', '.txt']);

const spec = JSON.parse(readFileSync(join(ROOT, 'dtd', 'forge-spec.json'), 'utf8'));
const converted = new Set(Object.values(spec).filter((e) => e.from).map((e) => 'src/' + e.to.replace(/\\/g, '/')));

function walk(d) {
  const out = [];
  if (!existsSync(d)) return out;
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function headerFor(ext, isConverted, hasShebang) {
  const lines = [TAG, COPY, ...(isConverted ? [MIT] : [])];
  if (ext === '.md' || ext === '.dtd' || ext === '.xml') return lines.map((l) => `<!-- ${l} -->`).join('\n') + '\n';
  if (ext === '.mjs' || ext === '.js') return lines.map((l) => `// ${l}`).join('\n') + '\n';
  return lines.map((l) => `# ${l}`).join('\n') + '\n';
}

let added = 0;
let present = 0;
for (const d of DIRS) {
  for (const f of walk(join(ROOT, d))) {
    const ext = extname(f).toLowerCase();
    if (SKIP.has(ext)) continue;
    const rel = relative(ROOT, f).split(sep).join('/');
    let text = readFileSync(f, 'utf8');
    if (text.includes('SPDX-License-Identifier')) {
      present++;
      continue;
    }
    const isConverted = converted.has(rel) || [...converted].some((c) => c.endsWith('/SKILL.md') && rel.startsWith(c.replace(/SKILL\.md$/, '')));
    const header = headerFor(ext, isConverted);
    let out;
    if (ext === '.md' && text.startsWith('---\n')) {
      const end = text.indexOf('\n---', 4);
      const cut = end + 4;
      out = text.slice(0, cut) + '\n\n' + header + text.slice(cut).replace(/^\n+/, '\n');
    } else if (text.startsWith('#!')) {
      const nl = text.indexOf('\n') + 1;
      out = text.slice(0, nl) + header + text.slice(nl);
    } else if (ext === '.xml' && text.startsWith('<?xml')) {
      const nl = text.indexOf('\n') + 1;
      out = text.slice(0, nl) + header + text.slice(nl);
    } else out = header + text;
    added++;
    if (!DRY) writeFileSync(f, out, 'utf8');
    console.log(`${DRY ? 'would add' : 'added'}  ${rel}${isConverted ? '  (converted: MIT portions line)' : ''}`);
  }
}
console.log(`\nspdx-add: ${added} added, ${present} already present`);
