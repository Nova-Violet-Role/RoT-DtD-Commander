// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/triple.mjs : the ODD-shaped fourth literate source, slice one.
//
// One source per artifact (src/commands/<name>-dtd.md with its DOCTYPE and
// prose) emits three flattened forms: the resolved .md mirror (already built
// by bin/rot-dtd-commander.mjs), the .nt twin (every ELEMENT, ENTITY and LAW
// declaration as NestedText) and the .yaml sidecar (frontmatter, sigil and
// the law roster). TEI ODD emits dtd+rng+rnc from one literate source; this
// emits md+nt+yaml from one command source, which is the only survivable
// reading of a 435-file tree (treiskaideka: DITA at 656 hand-kept files
// proves the alternative fails). Slice one is the emitter plus its controls
// plus a pilot proof; wiring into the build, the installer and the gate is
// a later slice, so this module stands alone and the gate never sees it.
//
// CLI: node lib/triple.mjs emit <src> <outdir> | verify <src> <outdir> | controls

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NL = String.fromCharCode(10);

function fail(text) { console.log(`  FAIL ${text}`); return false; }
function pass(text) { console.log(`  PASS ${text}`); return true; }

export function parseSource(text, srcLabel) {
  const dt = text.match(/<!DOCTYPE\s+([\w-]+)\s*\[/);
  if (!dt) throw new Error(`triple: ${srcLabel} declares no DOCTYPE; an emission without a grammar is not an emission`);
  const root = dt[1];
  const elements = [...text.matchAll(/<!ELEMENT\s+([\w.:-]+)\s+([^>]*?)>/g)].map((m) => ({ name: m[1], model: m[2].trim() }));
  const entities = [...text.matchAll(/<!ENTITY\s+(?!%)\s*([\w.:-]+)\s+"((?:[^"\\]|\\.)*)"/g)].map((m) => ({ name: m[1], value: m[2] }));
  const laws = entities.filter((e) => e.name.startsWith('LAW.')).map((e) => e.name);
  const desc = (text.match(/^description:\s*"((?:[^"\\]|\\.)*)"/m) || [, ''])[1];
  return { root, elements, entities, laws, desc };
}

export function sigilFor(key) {
  const sigils = JSON.parse(readFileSync(join(ROOT, 'dtd', 'sigils.json'), 'utf8'));
  if (!sigils[key]) throw new Error(`triple: no sigil for ${key}; the emitter refuses an unsigned artifact`);
  return sigils[key];
}

export function emitNt(name, key, parsed, sigil) {
  const L = [`# triple emission (nt) of ${name}, generated from src by lib/triple.mjs; do not hand-edit`,
    `root: ${parsed.root}`, `sigil: ${sigil}`, '', 'elements:'];
  for (const e of parsed.elements) L.push(`  - name: ${e.name}`, `    model: ${e.model}`);
  L.push('laws:');
  for (const l of parsed.laws) L.push(`  - ${l}`);
  return L.join(NL) + NL;
}

export function emitYaml(name, key, parsed, sigil) {
  const L = [`# triple emission (yaml) of ${name}, generated from src by lib/triple.mjs; do not hand-edit`,
    `name: ${key}`, `root: ${parsed.root}`, `sigil: ${sigil}`,
    `description: ${JSON.stringify(parsed.desc)}`,
    `elements: [${parsed.elements.map((e) => e.name).join(', ')}]`,
    `entities: ${parsed.entities.length}`, `laws: [${parsed.laws.join(', ')}]`];
  return L.join(NL) + NL;
}

export function outName(src) {
  const file = basename(src);
  if (file === 'SKILL.md') return basename(dirname(src));
  return file.replace(/\.md$/, '');
}

export function emit(src, outDir) {
  const text = readFileSync(src, 'utf8');
  const file = basename(src);
  // A SKILL.md is named by the directory that holds it; anything else is
  // named by its stem without the -dtd suffix (skill keys keep -dtd, so a
  // skill never collides with its command in the registry).
  const key = file === 'SKILL.md' ? basename(dirname(src)) : file.replace(/\.md$/, '').replace(/-dtd$/, '');
  const name = outName(src);
  const parsed = parseSource(text, src);
  const sigil = sigilFor(key);
  mkdirSync(outDir, { recursive: true });
  const nt = join(outDir, `${name}.nt`);
  const yaml = join(outDir, `${name}.yaml`);
  writeFileSync(nt, emitNt(name, key, parsed, sigil));
  writeFileSync(yaml, emitYaml(name, key, parsed, sigil));
  return { nt, yaml, parsed, sigil };
}

export function verify(src, outDir) {
  const findings = [];
  const text = readFileSync(src, 'utf8');
  const name = outName(src);
  const parsed = parseSource(text, src);
  let nt, yaml;
  try { nt = readFileSync(join(outDir, `${name}.nt`), 'utf8'); }
  catch { findings.push(`missing emission ${name}.nt`); return findings; }
  try { yaml = readFileSync(join(outDir, `${name}.yaml`), 'utf8'); }
  catch { findings.push(`missing emission ${name}.yaml`); return findings; }
  const ntNames = [...nt.matchAll(/^  - name: (\S+)/gm)].map((m) => m[1]);
  const wantEl = parsed.elements.map((e) => e.name);
  for (const w of wantEl) if (!ntNames.includes(w)) findings.push(`nt drops element ${w}`);
  for (const n of ntNames) if (!wantEl.includes(n)) findings.push(`nt carries undeclared element ${n}`);
  const ntLaws = [...nt.matchAll(/^  - (LAW\.\S+)/gm)].map((m) => m[1]);
  for (const w of parsed.laws) if (!ntLaws.includes(w)) findings.push(`nt drops law ${w}`);
  if (!yaml.includes(`root: ${parsed.root}`)) findings.push('yaml names the wrong root');
  if (!yaml.includes(`entities: ${parsed.entities.length}`)) findings.push('yaml carries the wrong entity count');
  return findings;
}

export function controls(io = console) {
  let ran = 0, failed = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) failed++; };
  const dir = mkdtempSync(join(tmpdir(), 'triple-'));
  try {
    const src = join(ROOT, 'src', 'commands', 'ask-me-katabasis-dtd.md');
    const a = emit(src, join(dir, 'a'));
    const b = emit(src, join(dir, 'b'));
    say(readFileSync(a.nt, 'utf8') === readFileSync(b.nt, 'utf8') && readFileSync(a.yaml, 'utf8') === readFileSync(b.yaml, 'utf8'),
      'trip: two emissions of one source are byte-identical (generation, not authoring)');
    say(verify(src, join(dir, 'a')).length === 0, 'trip: a fresh emission verifies with no findings');
    const mut = readFileSync(a.nt, 'utf8').split(NL).filter((l) => !l.startsWith('  - name: ')).join(NL);
    writeFileSync(join(dir, 'a', 'ask-me-katabasis-dtd.nt'), mut);
    const found = verify(src, join(dir, 'a'));
    say(found.length > 0 && /drops element/.test(found[0]), `trip: an emission with every element stripped reports it: ${found[0] || 'nothing'}`);
    let refused = '';
    const plain = join(dir, 'plain.md');
    writeFileSync(plain, '# prose with no grammar block at all\n');
    try { emit(plain, join(dir, 'c')); } catch (e) { refused = String(e.message || e); }
    say(/no DOCTYPE/.test(refused), 'trip: a source with no DOCTYPE is refused by name');
    let nosigil = '';
    const fake = join(dir, 'no-sigil-command-dtd.md');
    writeFileSync(fake, '<!DOCTYPE zz [\n<!ELEMENT zz (#PCDATA)>\n]>\n', 'utf8');
    try { emit(fake, join(dir, 'd')); } catch (e) { nosigil = String(e.message || e); }
    say(/no sigil/.test(nosigil), 'trip: a source with no sigil entry is refused by name');
    const skdir = join(dir, 'ask-me-katabasis');
    mkdirSync(skdir, { recursive: true });
    const sksrc = join(skdir, 'SKILL.md');
    writeFileSync(sksrc, readFileSync(join(ROOT, 'src', 'commands', 'ask-me-katabasis-dtd.md'), 'utf8'), 'utf8');
    let skfail = '';
    try { emit(sksrc, join(dir, 'e')); } catch (e) { skfail = String(e.message || e); }
    say(!skfail && verify(sksrc, join(dir, 'e')).length === 0, 'trip: a SKILL.md is keyed by its directory and emits like any artifact');
  } finally { rmSync(dir, { recursive: true, force: true }); }
  io.log(`triple controls: ${ran} run, ${failed} failing`);
  return failed === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [verb, a, b] = process.argv.slice(2);
  if (verb === 'controls') process.exit(controls() ? 0 : 1);
  else if (verb === 'emit' && a && b) { const r = emit(resolve(a), resolve(b)); console.log(`triple: ${r.nt} ${r.yaml}`); }
  else if (verb === 'verify' && a && b) {
    const f = verify(resolve(a), resolve(b));
    for (const x of f) console.log(`  FINDING ${x}`);
    console.log(`triple verify: ${f.length} finding(s)`);
    process.exit(f.length ? 1 : 0);
  } else { console.error('usage: node lib/triple.mjs emit <src> <outdir> | verify <src> <outdir> | controls'); process.exit(2); }
}
