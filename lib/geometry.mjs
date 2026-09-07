#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/geometry.mjs
// The Graphic and Geometric family of dtd/geometry.dtd as code: one hundred
// and eight rungs, the first fifty-two in three profession bands and the rest
// in four domain bands read through the professions' lenses; a survey that
// measures and moves nothing, a plan that declares bounds and rewrites
// nothing, a renovation that is refused by name unless a survey and a plan
// exist first, and a production that is refused by name unless all three
// exist and otherwise launches them (LAW.GEOM.9 to LAW.GEOM.11). Every measure names its
// instrument and its seconds; a rung with no instrument is left unmeasured
// and named, never estimated (LAW.GEOM.2). One figure is drawn from the
// numbers through lib/figure.mjs, and the plan's figure is the survey's with
// the projections added (LAW.GEOM.7, LAW.GEOM.8).
//
//   contract({off})              the ladder, the bands, the bounds and the laws, read through the driver
//   band(command)                the rungs a command may use
//   survey(root)                 every instrumented rung of band I, foreground, under GEOM.ceiling
//   plan(surveyRecord)           band II: one projection per declared bound, on a survey by path
//   planCheck(survey, plan)      a later survey held to a plan's bounds, each excess named
//   renovate(root, survey, plan) band III: the two preconditions, the colophon and the digest
//   produce(root, s, p, r)       the generator: three preconditions, one plate of three layers, every format named
//   controls()                   every law tripped on purpose
//
//   node lib/geometry.mjs survey [root] [--write] | plan <survey.json> [--write] | plan --check <survey.json> <plan.json>
//                         | renovate <survey.md> <plan.md> [--write]
//                         | produce <survey.md> <plan.md> <renovation.md> [--write] [--no-png] | table | controls

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, resolve, relative, extname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolveSubset } from './dtd.mjs';
import { parse as parseFigure, validate as validateFigure, renderCells, renderSvg, check as checkFigure, contract as figureContract, overlay as overlayFigure, seed as seedFigure } from './figure.mjs';
import { legOfHost } from './cross-os.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DTD_DIR = join(ROOT, 'dtd');
const SPDX = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->'];
const SKIP = new Set(['.git', 'node_modules', '.claude', '.codemap', '.cocoindex_code', '.rot-moe']);
const rel = (root, p) => relative(root, p).replace(/\\/g, '/');

// ---------- the contract, read through the driver ----------
// The subset is resolved the way the installer resolves it, so a band
// switched off before the include is switched off here too (LAW.GEOM.6).
export function contract({ off = [], dtdDir = DTD_DIR } = {}) {
  const pre = off.map((b) => `<!ENTITY % geom.${b}.module "IGNORE">`).join('\n');
  const text = resolveSubset(`${pre}\n<!ENTITY % geometry SYSTEM "geometry.dtd">\n%geometry;`, dtdDir).text;
  const ent = (name) => {
    const m = new RegExp(`<!ENTITY ${name.replace(/[.]/g, '\\.')}\\s+"([^"]*)"`).exec(text);
    if (!m) throw new Error(`geometry.dtd declares no ${name}`);
    return m[1];
  };
  const verbs = [...text.matchAll(/<!ENTITY GEOM\.verb\.(\d+)\s+"([^"]*)"/g)].map((m) => {
    const [name, gloss] = m[2].split(/:\s*/, 2);
    return { n: Number(m[1]), name, gloss: m[2].slice(name.length + 1).trim() };
  }).sort((a, b) => a.n - b.n);
  const bands = {};
  for (const b of ent('GEOM.bands').split('|')) bands[b] = ent(`GEOM.band.${b}`).split('|').map(Number);
  // the domains above the codebase application, and the lenses the three
  // professions read them through (LAW.GEOM.9, LAW.GEOM.10)
  const domains = {};
  for (const d of ent('GEOM.domains').split('|')) domains[d] = ent(`GEOM.domain.${d}`).split('|').map(Number);
  const lenses = {};
  for (const b of ent('GEOM.bands').split('|')) lenses[b] = ent(`GEOM.lens.${b}`).split('|').map(Number);
  return {
    verbs, bands, ladderCount: Number(ent('GEOM.ladder.count')),
    ladderCodebase: Number(ent('GEOM.ladder.codebase')),
    domains, lenses, generator: ent('GEOM.band.generator').split('|').map(Number),
    dir: ent('GEOM.dir'), ceiling: Number(ent('GEOM.ceiling')),
    instrumented: ent('GEOM.instrumented').split('|').map(Number),
    elements: [...text.matchAll(/<!ELEMENT ([\w_]+)/g)].map((m) => m[1]),
    laws: [...text.matchAll(/<!ENTITY (LAW\.GEOM\.\d+)\s/g)].map((m) => m[1]),
    lawText: new Map([...text.matchAll(/<!ENTITY (LAW\.GEOM\.\d+)\s+"([^"]*)"/g)].map((m) => [m[1], m[2]])),
    off,
  };
}

export function band(command, c = contract()) {
  const key = String(command).replace(/^\//, '').replace(/-dtd(\.md)?$/, '').replace(/^codebase-/, '');
  // a band switched off by the driver has no verbs, and no verbs is no band
  // (LAW.GEOM.6); the generator's band is the union of the domains, and a
  // domain switched off leaves it (LAW.GEOM.9)
  const list = key === 'generator' ? c.generator : c.bands[key] || [];
  return list.filter((n) => c.verbs.some((v) => v.n === n));
}
export function verbOf(n, c = contract()) { return c.verbs.find((v) => v.n === Number(n)) || null; }

// ---------- the walk ----------
function walkTree(root) {
  const out = [];
  const go = (dir, depth) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) go(p, depth + 1);
      else if (e.isFile()) out.push({ rel: rel(root, p), bytes: statSync(p).size, depth, ext: extname(e.name).toLowerCase() || '(none)' });
    }
  };
  go(root, 0);
  return out;
}

const IMPORT = /(?:import\s[^'"]*from\s*|import\s*\(\s*|require\(\s*)['"](\.{1,2}\/[^'"]+\.mjs)['"]/g;
function imports(root, file) {
  const out = [];
  let text;
  try { text = readFileSync(join(root, file), 'utf8'); } catch { return out; }
  for (const m of text.matchAll(IMPORT)) out.push(rel(root, resolve(dirname(join(root, file)), m[1])));
  return out;
}

// ---------- band I: the instruments ----------
// Each returns { value, unit, detail } or null when the tree gives it nothing
// to measure, in which case the rung is unmeasured and said so.
const INSTRUMENTS = {
  1: (root, files) => {
    const byTop = {};
    for (const f of files) { const top = f.rel.includes('/') ? f.rel.split('/')[0] : '(root)'; byTop[top] = byTop[top] || { files: 0, bytes: 0 }; byTop[top].files++; byTop[top].bytes += f.bytes; }
    const rows = Object.entries(byTop).map(([dir, v]) => ({ dir, ...v })).sort((a, b) => b.files - a.files);
    return { value: files.length, unit: 'files', detail: { bytes: files.reduce((s, f) => s + f.bytes, 0), byTop: rows } };
  },
  2: (root, files) => {
    const entries = files.filter((f) => /^bin\/[^/]+\.mjs$/.test(f.rel)).map((f) => f.rel);
    if (!entries.length) return null;
    const on = {};
    for (const e of entries) on[e] = imports(root, e);
    return { value: entries.length, unit: 'entries', detail: { entries: on } };
  },
  3: (root, files) => {
    const libs = files.filter((f) => /^lib\/[^/]+\.mjs$/.test(f.rel)).map((f) => f.rel);
    if (!libs.length) return null;
    const fanIn = Object.fromEntries(libs.map((l) => [l, 0]));
    for (const f of files) if (/\.mjs$/.test(f.rel)) for (const i of imports(root, f.rel)) if (i in fanIn && i !== f.rel) fanIn[i]++;
    const zero = libs.filter((l) => fanIn[l] === 0);
    return { value: zero.length, unit: 'modules with no importer', detail: { fanIn, zero } };
  },
  4: (root, files) => {
    const entries = files.filter((f) => /^bin\/[^/]+\.mjs$/.test(f.rel)).map((f) => f.rel);
    if (!entries.length) return null;
    const dist = {};
    const q = entries.map((e) => [e, 0]);
    while (q.length) {
      const [f, d] = q.shift();
      if (f in dist && dist[f] <= d) continue;
      dist[f] = d;
      for (const i of imports(root, f)) q.push([i, d + 1]);
    }
    let far = ['', 0];
    for (const [f, d] of Object.entries(dist)) if (d > far[1]) far = [f, d];
    return { value: far[1], unit: 'hops from an entry', detail: { farthest: far[0], reached: Object.keys(dist).length } };
  },
  5: (root, files) => {
    let deep = { rel: '', depth: 0 };
    for (const f of files) if (f.depth > deep.depth) deep = f;
    return { value: deep.depth, unit: 'levels', detail: { deepest: deep.rel } };
  },
  9: (root) => {
    const p = join(root, 'README.md');
    if (!existsSync(p)) return null;
    const lines = readFileSync(p, 'utf8').split('\n');
    const i = lines.findIndex((l) => /\/[a-z0-9-]+-dtd\b/.test(l));
    return { value: i < 0 ? lines.length : i + 1, unit: 'README lines before the first invocation', detail: { found: i >= 0 } };
  },
  12: (root, files) => {
    const cmdDir = join(root, 'commands');
    if (!existsSync(cmdDir)) return null;
    const a = readdirSync(cmdDir).filter((f) => f.endsWith('.md')).length;
    const readme = existsSync(join(root, 'README.md')) ? readFileSync(join(root, 'README.md'), 'utf8') : '';
    const pkg = existsSync(join(root, 'package.json')) ? readFileSync(join(root, 'package.json'), 'utf8') : '';
    const b = Number((/\*(\d+) Claude Code slash commands/.exec(readme) || [])[1] || NaN);
    const d = Number((/(\d+) Claude Code commands/.exec(pkg) || [])[1] || NaN);
    const readings = { 'commands directory': a, 'README tagline': b, 'package.json description': d };
    const agree = Object.values(readings).filter((v) => v === a).length;
    return { value: agree, unit: 'of 3 instruments agree', detail: { readings } };
  },
  14: (root, files) => {
    const dtds = files.filter((f) => f.ext === '.dtd' && /^dtd\//.test(f.rel));
    if (!dtds.length) return null;
    let n = 0;
    for (const f of dtds) n += (readFileSync(join(root, f.rel), 'utf8').match(/<!(ELEMENT|ENTITY|ATTLIST|NOTATION)\b/g) || []).length;
    return { value: n, unit: 'declarations', detail: { subsets: dtds.length } };
  },
  15: (root, files) => {
    const byExt = {};
    for (const f of files) byExt[f.ext] = (byExt[f.ext] || 0) + 1;
    const rows = Object.entries(byExt).sort((a, b) => b[1] - a[1]);
    const git = spawnSync('git', ['-C', root, 'ls-files'], { encoding: 'utf8', timeout: 60000 });
    const tracked = git.status === 0 ? String(git.stdout).split('\n').filter(Boolean).length : null;
    return { value: rows.length, unit: 'kinds of file', detail: { byExt: rows.slice(0, 12), tracked } };
  },
  16: (root, files) => {
    const seen = new Map();
    for (const f of files) {
      if (!/\.(dtd|md)$/.test(f.rel) || !/^(dtd|src|checker)\//.test(f.rel)) continue;
      for (const m of readFileSync(join(root, f.rel), 'utf8').matchAll(/<!ENTITY\s+LAW\.([A-Z_.]+)\.(\d+)\s/g)) {
        const s = seen.get(m[1]) || new Set(); s.add(Number(m[2])); seen.set(m[1], s);
      }
    }
    if (!seen.size) return null;
    const gaps = [...seen].filter(([, s]) => s.size !== Math.max(...s)).map(([p]) => p);
    return { value: gaps.length, unit: 'law prefixes with a gap', detail: { prefixes: seen.size, laws: [...seen.values()].reduce((n, s) => n + s.size, 0), gaps } };
  },
};

export function drawFigure(measures, { grid = '80x12', mark = 'measured', title = '' } = {}) {
  const plan = measures.find((m) => m.verb === 1);
  const [cols, rows] = grid.split('x').map(Number);
  const shapes = [];
  if (plan && plan.detail && plan.detail.byTop) {
    const tops = plan.detail.byTop.slice(0, rows <= 3 ? 4 : 8);
    const total = tops.reduce((s, t) => s + t.files, 0) || 1;
    let x = 0;
    const h = rows <= 3 ? 3 : 3;
    const usable = cols;
    tops.forEach((t, i) => {
      const w = Math.max(6, Math.min(usable - x, i === tops.length - 1 ? usable - x : Math.round((t.files / total) * usable)));
      if (w >= 6 && x + w <= cols) { shapes.push(`<rect x="${x}" y="0" w="${w}" h="${h}" name="${t.dir.slice(0, w - 2)}"/>`); x += w; }
    });
    if (rows > 3) {
      let y = 4;
      for (const t of tops.slice(0, rows - 4)) { shapes.push(`<label x="0" y="${y}">${String(t.files).padStart(5)} files  ${t.dir}</label>`); y++; }
    }
  }
  for (const m of measures) if (m.verb !== 1 && rows > 3 && shapes.length < 40) {
    const y = 4 + Math.min(rows - 5, measures.indexOf(m));
    if (y < rows && m.verb <= 5) shapes.push(`<label x="${Math.min(cols - 30, 40)}" y="${y}">${m.name} ${m.value} ${m.unit}</label>`.replace(/"/g, '&quot;').replace(/<label x=&quot;/, '<label x="').replace(/&quot; y=&quot;/, '" y="').replace(/&quot;>/, '">'));
  }
  return `<figure grid="${grid}" mark="${mark}"${title ? ` title="${title.replace(/"/g, '&quot;')}"` : ''}>${shapes.join('')}</figure>`;
}

export function survey(root = ROOT, { c = contract(), verbs = null, fc = figureContract() } = {}) {
  const t0 = Date.now();
  const files = walkTree(root);
  const measures = [];
  const unmeasured = [];
  const want = verbs || c.bands.surveyor;
  for (const n of want) {
    const v = verbOf(n, c);
    if (!v) continue;
    if (n === 10 || n === 17) continue; // computed from the others, below
    const inst = INSTRUMENTS[n];
    if (!inst || !c.instrumented.includes(n)) { unmeasured.push({ verb: n, name: v.name, why: 'no instrument in this release' }); continue; }
    const s0 = Date.now();
    const r = inst(root, files);
    const seconds = ((Date.now() - s0) / 1000).toFixed(3);
    if (r === null) { unmeasured.push({ verb: n, name: v.name, why: 'the tree gives this instrument nothing to read' }); continue; }
    measures.push({ verb: n, name: v.name, value: r.value, unit: r.unit, instrument: `lib/geometry.mjs instrument ${n}`, seconds, confidence: 'measured', detail: r.detail || {} });
  }
  if (want.includes(10)) {
    measures.push({ verb: 10, name: 'chronometry', value: measures.reduce((s, m) => s + Number(m.seconds), 0).toFixed(3), unit: 's over every instrument', instrument: 'lib/geometry.mjs instrument 10', seconds: '0.000', confidence: 'measured', detail: { per: Object.fromEntries(measures.map((m) => [m.name, m.seconds])) } });
  }
  const figureXml = drawFigure(measures, { grid: '80x12', mark: 'measured', title: `survey of ${basename(root)}` });
  const cutXml = drawFigure(measures, { grid: '60x3', mark: 'guessed' });
  const fig = parseFigure(figureXml);
  const v = validateFigure(fig, 'artifact', fc);
  if (!v.ok) throw new Error('the survey figure is refused: ' + v.refused.join('; '));
  const cells = renderCells(fig, fc);
  const svg = renderSvg(fig, 'light', fc);
  const svgDark = renderSvg(fig, 'dark', fc);
  const agree = checkFigure(fig, cells, svg, fc);
  if (!agree.ok) throw new Error('the survey figure disagrees with itself: ' + agree.findings.join('; '));
  if (want.includes(17)) measures.push({ verb: 17, name: 'conspectus', value: fig.shapes.length, unit: 'shapes drawn from the measures', instrument: 'lib/figure.mjs renderCells', seconds: '0.000', confidence: 'measured', detail: { grid: '80x12' } });
  return {
    target: root, substrate: legOfHost().leg, read: files.length, of: files.length, seconds: ((Date.now() - t0) / 1000).toFixed(3),
    measures, unmeasured, figure: { xml: figureXml, cut: cutXml, cells, svg, svgDark },
  };
}

// ---------- the artifacts ----------
function stamp(date) { return date || new Date().toISOString().slice(0, 10); }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function writeSurvey(root, s, { c = contract(), date = null } = {}) {
  const dir = join(root, c.dir);
  mkdirSync(dir, { recursive: true });
  const d = stamp(date);
  const md = [...SPDX, '', `# Survey of ${basename(root)}, ${d}`, '',
    `- target: ${rel(root, s.target) || '.'}`, `- substrate: ${s.substrate}`, `- read: ${s.read} of ${s.of} files`, `- seconds: ${s.seconds}`, '',
    '## Measures', '', '| verb | name | value | unit | instrument | seconds |', '|---|---|---|---|---|---|',
    ...s.measures.map((m) => `| ${m.verb} | ${m.name} | ${m.value} | ${esc(m.unit)} | ${m.instrument} | ${m.seconds} |`), '',
    '## Unmeasured, and why', '', ...(s.unmeasured.length ? s.unmeasured.map((u) => `- ${u.verb} ${u.name}: ${u.why}`) : ['- every rung of the band was measured']), '',
    '## The figure, measured', '', '```', s.figure.cells, '```', '', `The plate: ${d}-survey.svg and ${d}-survey-dark.svg, the same figure at ${figureContract().cell.w}x${figureContract().cell.h} pixels a cell (LAW.FIG.2).`, ''];
  const base = join(dir, `${d}-survey`);
  writeFileSync(base + '.md', md.join('\n'), 'utf8');
  writeFileSync(base + '.json', JSON.stringify({ date: d, ...s, figure: { xml: s.figure.xml, cut: s.figure.cut } }, null, 2) + '\n', 'utf8');
  writeFileSync(base + '.svg', s.figure.svg, 'utf8');
  writeFileSync(base + '-dark.svg', s.figure.svgDark, 'utf8');
  return ['.md', '.json', '.svg', '-dark.svg'].map((e) => rel(root, base + e));
}

// ---------- labels placed on measured free space ----------
function placeLabels(baseXml, texts) {
  let xml = baseXml;
  const placed = [];
  let dropped = 0;
  for (const raw of texts) {
    const fig = parseFigure(xml);
    const rows = renderCells(fig).split('\n');
    const cols = fig.grid.cols;
    const text = raw.length > cols ? raw.slice(0, cols) : raw;
    let at = null;
    for (let y = fig.grid.rows - 1; y >= 0 && !at; y--) {
      const used = (rows[y] || '').replace(/\s+$/, '').length;
      if (used === 0) at = [0, y];
      else if (used + 1 + text.length <= cols) at = [cols - text.length, y];
    }
    if (!at) { dropped++; continue; }
    const label = `<label x="${at[0]}" y="${at[1]}">${esc(text)}</label>`;
    placed.push(label);
    xml = xml.replace('</figure>', label + '</figure>');
  }
  return { labels: placed.join(''), dropped };
}

// ---------- band II: the plan ----------
// A projection declares a bound on a surveyor measure. The bound is the
// number a later survey is held to, and planCheck reads it back.
const PROJECTIONS = [
  { verb: 23, on: 1, op: '<=', declares: 'ordinatio: the module is the file, and the footprint stays within the count the survey took' },
  { verb: 22, on: 14, op: '>=', declares: 'stereometry: the declared volume, in declarations, does not shrink without a recorded reason' },
  { verb: 26, on: 3, op: '<=', declares: 'symmetria: the count of library modules nothing imports does not grow' },
  { verb: 29, on: 4, op: '<=', declares: 'infrastructure: no module sits farther from an entry point than the farthest one today' },
  { verb: 33, on: 16, op: '==', bound: 0, declares: 'tessellation: every law prefix is dense, no gap and no overlap in the numbering' },
  { verb: 33, on: 12, op: '==', bound: 3, declares: 'tessellation: the three instruments that count the commands agree' },
  { verb: 34, on: 5, op: '<=', declares: 'quadrature: the nesting goes no deeper than the deepest path today' },
];

export function plan(s, { c = contract(), surveyPath = '' } = {}) {
  if (!surveyPath) throw new Error('a plan names the survey it stands on by path (LAW.GEOM.3)');
  const projections = [];
  for (const p of PROJECTIONS) {
    const m = s.measures.find((x) => x.verb === p.on);
    if (!m) continue;
    projections.push({ verb: p.verb, name: verbOf(p.verb, c).name, declares: p.declares, on: p.on, op: p.op, bound: p.bound !== undefined ? p.bound : Number(m.value), rewrite: 'no' });
  }
  // the plan's figure: the survey's with the projected bounds added as
  // labels, each on free space measured from the survey's own cells
  const base = parseFigure(s.figure.xml);
  const { labels } = placeLabels(s.figure.xml, projections.slice(0, 3).map((p) => `bound ${p.name} ${p.op} ${p.bound} on ${verbOf(p.on, c).name}`));
  const xml = s.figure.xml.replace('</figure>', labels + '</figure>');
  const fig = parseFigure(xml);
  const v = validateFigure(fig, 'artifact');
  if (!v.ok) throw new Error('the plan figure is refused: ' + v.refused.join('; '));
  if (fig.shapes.length < base.shapes.length) throw new Error('the plan figure lost a shape of the survey (LAW.GEOM.8)');
  const cells = renderCells(fig), svg = renderSvg(fig, 'light');
  const agree = checkFigure(fig, cells, svg);
  if (!agree.ok) throw new Error('the plan figure disagrees with itself: ' + agree.findings.join('; '));
  return { survey: surveyPath, target: s.target, projections, figure: { xml, cells, svg, svgDark: renderSvg(fig, 'dark') } };
}

export function planCheck(s, p) {
  const findings = [];
  for (const pr of p.projections) {
    const m = s.measures.find((x) => x.verb === pr.on);
    if (!m) { findings.push(`the survey has no measure ${pr.on} for the bound of ${pr.name}`); continue; }
    const v = Number(m.value), b = Number(pr.bound);
    const ok = pr.op === '<=' ? v <= b : pr.op === '>=' ? v >= b : v === b;
    if (!ok) findings.push(`${pr.name} declared ${m.name} ${pr.op} ${b}; the survey measures ${v}`);
  }
  return { ok: findings.length === 0, findings };
}

export function writePlan(root, p, { c = contract(), date = null } = {}) {
  const dir = join(root, c.dir);
  mkdirSync(dir, { recursive: true });
  const d = stamp(date);
  const md = [...SPDX, '', `# Plan for ${basename(root)}, ${d}`, '', `- survey: ${p.survey}`, `- rewrite: no`, '',
    '## Projections', '', '| verb | name | declares | on | bound |', '|---|---|---|---|---|',
    ...p.projections.map((x) => `| ${x.verb} | ${x.name} | ${esc(x.declares)} | ${x.on} | ${x.op} ${x.bound} |`), '',
    '## The figure, the survey with the projections added', '', '```', p.figure.cells, '```', ''];
  const base = join(dir, `${d}-plan`);
  writeFileSync(base + '.md', md.join('\n'), 'utf8');
  writeFileSync(base + '.json', JSON.stringify({ date: d, survey: p.survey, target: p.target, projections: p.projections, figure: { xml: p.figure.xml } }, null, 2) + '\n', 'utf8');
  writeFileSync(base + '.svg', p.figure.svg, 'utf8');
  writeFileSync(base + '-dark.svg', p.figure.svgDark, 'utf8');
  return ['.md', '.json', '.svg', '-dark.svg'].map((e) => rel(root, base + e));
}

// ---------- band III: the renovation ----------
function dateOf(path) {
  const m = /(\d{4}-\d{2}-\d{2})-(survey|plan)/.exec(basename(path));
  if (m) return m[1];
  try { return statSync(path).mtime.toISOString().slice(0, 10); } catch { return ''; }
}
function sha256(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

export function renovate(root, surveyPath, planPath, { c = contract(), today = null } = {}) {
  const refused = [];
  const sp = surveyPath ? resolve(root, surveyPath) : '';
  const pp = planPath ? resolve(root, planPath) : '';
  if (!surveyPath) refused.push('no survey named: a renovation with no survey behind it is refused (LAW.GEOM.4)');
  else if (!existsSync(sp)) refused.push(`the survey ${surveyPath} does not exist under ${c.dir} (LAW.GEOM.4)`);
  else if (!rel(root, sp).startsWith(c.dir + '/')) refused.push(`the survey ${surveyPath} is not under ${c.dir}`);
  if (!planPath) refused.push('no plan named: a renovation with no plan declared first is refused (LAW.GEOM.4)');
  else if (!existsSync(pp)) refused.push(`the plan ${planPath} does not exist under ${c.dir} (LAW.GEOM.4)`);
  else if (!rel(root, pp).startsWith(c.dir + '/')) refused.push(`the plan ${planPath} is not under ${c.dir}`);
  const sd = sp && existsSync(sp) ? dateOf(sp) : '';
  const pd = pp && existsSync(pp) ? dateOf(pp) : '';
  const td = stamp(today);
  if (sd && pd && pd < sd) refused.push(`the plan (${pd}) is earlier than the survey (${sd}); a plan stands on a survey, never the reverse (LAW.GEOM.4)`);
  if (pd && td < pd) refused.push(`the change (${td}) is earlier than the plan (${pd})`);
  if (refused.length) return { ok: false, refused };
  const who = spawnSync('git', ['-C', root, 'config', 'user.name'], { encoding: 'utf8', timeout: 10000 });
  const head = spawnSync('git', ['-C', root, 'log', '-1', '--format=%h %cI'], { encoding: 'utf8', timeout: 10000 });
  let terms = '';
  try { terms = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).license || ''; } catch { /* no manifest */ }
  return {
    ok: true, refused: [],
    survey: { path: rel(root, sp), date: sd, sha256: sha256(sp) },
    plan: { path: rel(root, pp), date: pd, sha256: sha256(pp) },
    colophon: { who: String(who.stdout || '').trim() || 'unknown', when: td, head: String(head.stdout || '').trim(), terms: terms || 'undeclared' },
  };
}

export function writeRenovation(root, r, { c = contract(), date = null } = {}) {
  const dir = join(root, c.dir);
  mkdirSync(dir, { recursive: true });
  const d = stamp(date);
  const md = [...SPDX, '', `# Renovation of ${basename(root)}, ${d}`, '',
    `- survey: ${r.survey.path} (${r.survey.date}) sha256 ${r.survey.sha256}`, `- plan: ${r.plan.path} (${r.plan.date}) sha256 ${r.plan.sha256}`, '',
    '## Changes', '', '| verb | file | before | after |', '|---|---|---|---|', '', '(one row per change, written by the run that makes it)', '',
    '## Colophon', '', `- who: ${r.colophon.who}`, `- when: ${r.colophon.when}`, `- head: ${r.colophon.head}`, `- terms: ${r.colophon.terms}`, '',
    '## Diplomatics', '', 'The two digests above are what this renovation stands on; a survey or a plan rewritten after the fact no longer matches them.', ''];
  const p = join(dir, `${d}-renovation.md`);
  writeFileSync(p, md.join('\n'), 'utf8');
  return rel(root, p);
}

// ---------- band IV to VII: the production ----------
// The rung each shape of a plate embodies, so a production can say which
// rungs of the domains it used and which domains it left unused, by what it
// drew rather than by what it claims (LAW.GENERATOR.4). Every production
// writes a record, which is rung 108.
const RUNG_OF_SHAPE = { extrude: 73, rotate3d: 70, contour: 105, gradient: 87, fill: 89, stroke: 89, arc: 53, measure: 104 };
const RUNG_OF_LAYER = { surveyor: 94, architect: 75, renovator: 103 };
function rasteriser() {
  const r = spawnSync('resvg', ['--version'], { encoding: 'utf8', timeout: 10000 });
  return r.status === 0 ? String(r.stdout || r.stderr).trim() : '';
}
export function produce(root, surveyPath, planPath, renovationPath, { c = contract(), fc = figureContract(), today = null, png = true, seed = '' } = {}) {
  const refused = [];
  const missing = [];
  const paths = { survey: surveyPath, plan: planPath, renovation: renovationPath };
  const abs = {};
  for (const [k, p] of Object.entries(paths)) {
    if (!p) { refused.push(`no ${k} named: a production stands on a survey, a plan and a renovation (LAW.GEOM.11)`); missing.push(k); continue; }
    abs[k] = resolve(root, p);
    if (!existsSync(abs[k])) { refused.push(`the ${k} ${p} does not exist under ${c.dir} (LAW.GEOM.11)`); missing.push(k); continue; }
    if (!rel(root, abs[k]).startsWith(c.dir + '/')) refused.push(`the ${k} ${p} is not under ${c.dir}`);
  }
  const dates = Object.fromEntries(Object.entries(abs).map(([k, p]) => [k, existsSync(p) ? dateOf(p) : '']));
  if (dates.survey && dates.plan && dates.plan < dates.survey) refused.push(`the plan (${dates.plan}) is earlier than the survey (${dates.survey}) (LAW.GEOM.11)`);
  if (dates.plan && dates.renovation && dates.renovation < dates.plan) refused.push(`the renovation (${dates.renovation}) is earlier than the plan (${dates.plan}) (LAW.GEOM.11)`);
  // with all three missing the generator does not refuse: it launches
  if (missing.length === 3) return { ok: false, launch: true, refused, chain: ['codebase-surveyor-dtd', 'codebase-architect-dtd', 'codebase-renovator-dtd', 'codebase-generator-dtd'] };
  if (refused.length) return { ok: false, launch: false, refused };
  const sJ = JSON.parse(readFileSync(abs.survey.replace(/\.md$/, '.json'), 'utf8'));
  const pJ = JSON.parse(readFileSync(abs.plan.replace(/\.md$/, '.json'), 'utf8'));
  const sansExt = (p) => rel(root, resolve(root, p)).replace(/\.(md|json)$/, '');
  if (sansExt(pJ.survey || '') !== sansExt(abs.survey)) refused.push(`the plan stands on ${pJ.survey}, not on the survey named (LAW.GEOM.11)`);
  const rMd = readFileSync(abs.renovation, 'utf8');
  if (!rMd.includes(rel(root, abs.survey)) || !rMd.includes(rel(root, abs.plan))) refused.push('the renovation does not name both the survey and the plan given (LAW.GEOM.11)');
  if (refused.length) return { ok: false, launch: false, refused };
  // the three layers of one plate: the survey's shapes, the plan's additions,
  // the renovation's recorded changes (LAW.FIG.7, LAW.GEOM.8)
  const inner = (xml) => (/<figure\b[^>]*>([\s\S]*?)<\/figure>/.exec(xml) || [])[1] || '';
  const sInner = inner(sJ.figure.xml);
  const pInner = inner(pJ.figure.xml);
  const pOnly = pInner.startsWith(sInner) ? pInner.slice(sInner.length) : pInner;
  const changes = [...rMd.matchAll(/^\| (\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm)].map((m) => ({ verb: Number(m[1]), file: m[2].trim(), before: m[3].trim(), after: m[4].trim() }));
  const grid = /grid="(\d+)x(\d+)"/.exec(sJ.figure.xml);
  const gridText = grid ? `${grid[1]}x${grid[2]}` : '80x12';
  // the renovation's labels go on free space measured from the two layers
  // beneath them, never on a row assumed empty
  const texts = changes.length
    ? changes.slice(0, 3).map((ch) => `${ch.verb} ${ch.file}: ${ch.before} to ${ch.after}`)
    : [`0 changes recorded in ${basename(abs.renovation)}`];
  const rInner = placeLabels(`<figure grid="${gridText}">${sInner}${pOnly}</figure>`, texts).labels;
  let xml = overlayFigure([
    { band: 'surveyor', name: 'survey', xml: `<figure grid="${gridText}">${sInner}</figure>` },
    { band: 'architect', name: 'plan', xml: `<figure grid="${gridText}">${pOnly}</figure>` },
    { band: 'renovator', name: 'renovation', xml: `<figure grid="${gridText}">${rInner}</figure>` },
  ], { title: `production of ${basename(root)}`, mark: 'measured' });
  if (seed) xml = seedFigure(xml, seed);
  const fig = parseFigure(xml);
  const v = validateFigure(fig, 'artifact', fc);
  if (!v.ok) return { ok: false, launch: false, refused: v.refused.map((r) => `the production figure is refused: ${r}`) };
  const cells = renderCells(fig, fc);
  const svg = renderSvg(fig, 'light', fc);
  const svgDark = renderSvg(fig, 'dark', fc);
  const agree = checkFigure(fig, cells, svg, fc);
  if (!agree.ok) return { ok: false, launch: false, refused: agree.findings.map((f) => `the production figure disagrees with itself: ${f}`) };
  // the rungs, by what was drawn
  const used = new Set([108]);
  for (const s of fig.shapes) { if (RUNG_OF_SHAPE[s.kind]) used.add(RUNG_OF_SHAPE[s.kind]); if (s.kind === 'layer' && RUNG_OF_LAYER[s.lband]) used.add(RUNG_OF_LAYER[s.lband]); }
  const unused = Object.entries(c.domains).filter(([, ns]) => !ns.some((n) => used.has(n))).map(([d]) => ({ domain: d, why: `no shape of this plate embodies a rung of ${d}` }));
  const rungs = [...used].sort((a, b) => a - b).filter((n) => c.verbs.some((v) => v.n === n)).map((n) => ({ n, name: verbOf(n, c).name, lens: Object.keys(c.lenses).find((b) => c.lenses[b].includes(n)) || '' }));
  const rv = rasteriser();
  return {
    ok: true, launch: false, refused: [],
    target: sJ.target, date: stamp(today),
    survey: { path: rel(root, abs.survey), date: dates.survey, sha256: sha256(abs.survey) },
    plan: { path: rel(root, abs.plan), date: dates.plan, sha256: sha256(abs.plan) },
    renovation: { path: rel(root, abs.renovation), date: dates.renovation, sha256: sha256(abs.renovation) },
    changes: changes.length, seed,
    figure: { xml, cells, svg, svgDark },
    rungs, unused,
    png: png ? (rv ? { tool: 'resvg', version: rv } : { tool: 'resvg', absent: 'the resvg binary is absent on this leg; the png is unmeasured, never drawn by another tool' }) : { tool: 'resvg', skipped: '--no-png' },
  };
}
export function writeProduction(root, pr, { c = contract(), date = null } = {}) {
  const dir = join(root, c.dir);
  mkdirSync(dir, { recursive: true });
  const d = stamp(date || pr.date);
  const base = join(dir, `${d}-production`);
  const produced = [];
  const count = (p) => statSync(p).size;
  writeFileSync(base + '.svg', pr.figure.svg, 'utf8');
  produced.push({ verb: 108, format: 'svg', path: rel(root, base + '.svg'), bytes: count(base + '.svg') });
  writeFileSync(base + '-dark.svg', pr.figure.svgDark, 'utf8');
  produced.push({ verb: 108, format: 'svg', path: rel(root, base + '-dark.svg'), bytes: count(base + '-dark.svg') });
  writeFileSync(base + '.cells.txt', pr.figure.cells + '\n', 'utf8');
  produced.push({ verb: 108, format: 'cells', path: rel(root, base + '.cells.txt'), bytes: count(base + '.cells.txt') });
  let pngLine = '';
  if (pr.png && pr.png.version) {
    const r = spawnSync('resvg', [base + '.svg', base + '.png'], { encoding: 'utf8', timeout: 60000 });
    if (r.status === 0 && existsSync(base + '.png')) produced.push({ verb: 108, format: 'png', path: rel(root, base + '.png'), bytes: count(base + '.png') });
    else pngLine = `png unmeasured: resvg exited ${r.status}: ${String(r.stderr || '').trim().slice(0, 120)}`;
  } else pngLine = `png unmeasured: ${pr.png.absent || pr.png.skipped}`;
  const md = [...SPDX, '', `# Production of ${basename(root)}, ${d}`, '',
    `- target: ${rel(root, pr.target) || '.'}`, `- survey: ${pr.survey.path} (${pr.survey.date}) sha256 ${pr.survey.sha256}`, `- plan: ${pr.plan.path} (${pr.plan.date}) sha256 ${pr.plan.sha256}`, `- renovation: ${pr.renovation.path} (${pr.renovation.date}) sha256 ${pr.renovation.sha256}`, `- changes drawn: ${pr.changes}`, pr.seed ? `- seed: ${pr.seed}` : '- seed: none, no figure was chosen at the gate', '',
    '## Produced', '', '| verb | format | path | bytes |', '|---|---|---|---|', ...produced.map((p) => `| ${p.verb} | ${p.format} | ${p.path} | ${p.bytes} |`), ...(pngLine ? ['', `- ${pngLine}`] : []), '',
    '## Rungs used, by what was drawn', '', ...pr.rungs.map((r) => `- ${r.n} ${r.name} (${r.lens} lens)`), '', '## Domains left unused, and why', '', ...(pr.unused.length ? pr.unused.map((u) => `- ${u.domain}: ${u.why}`) : ['- every domain contributed a rung']), '',
    '## The plate, three layers of one figure', '', '```', pr.figure.cells, '```', ''];
  writeFileSync(base + '.md', md.join('\n'), 'utf8');
  writeFileSync(base + '.json', JSON.stringify({ date: d, target: pr.target, survey: pr.survey, plan: pr.plan, renovation: pr.renovation, produced, rungs: pr.rungs, unused: pr.unused, png: pr.png, figure: { xml: pr.figure.xml } }, null, 2) + '\n', 'utf8');
  return { record: rel(root, base + '.md'), produced, pngLine };
}

// ---------- the contract as a table ----------
export function table(c = contract()) {
  const L = [...SPDX, '', '# The geometry contract', '', `Generated by \`node lib/geometry.mjs table\` from \`dtd/geometry.dtd\`, read through its own driver. ${c.ladderCount} rungs: the first ${c.ladderCodebase} in three profession bands, the codebase application, and ${c.ladderCount - c.ladderCodebase} above them in four domain bands, each a module a repository may switch off before the include, and the command of a switched-off band refuses to run rather than answering outside its subset. Each profession reads the domains through its lens; the generator's band is their union. A rung is never renumbered; a rung without an instrument in this release is left unmeasured and named, which is the one thing a survey may say about it. The controls refuse a copy that has drifted from the declarations.`, '',
    '## The ladder', '', '| n | verb | what it does | band | lens |', '|---|---|---|---|---|'];
  const bandOf = (n) => Object.keys(c.bands).find((b) => c.bands[b].includes(n)) || Object.keys(c.domains).find((d) => c.domains[d].includes(n)) || '';
  const lensOf = (n) => (n <= c.ladderCodebase ? '' : Object.keys(c.lenses).find((b) => c.lenses[b].includes(n)) || '');
  for (const v of c.verbs) L.push(`| ${v.n} | ${v.name} | ${v.gloss} | ${bandOf(v.n)} | ${lensOf(v.n)} |`);
  L.push('', '## The bands', '', '| command | verbs |', '|---|---|');
  for (const [b, ns] of Object.entries(c.bands)) L.push(`| /codebase-${b}-dtd | ${ns[0]} ${verbOf(ns[0], c).name} to ${ns[ns.length - 1]} ${verbOf(ns[ns.length - 1], c).name} (${ns.length}) |`);
  L.push(`| /codebase-generator-dtd | ${c.generator[0]} ${verbOf(c.generator[0], c).name} to ${c.generator[c.generator.length - 1]} ${verbOf(c.generator[c.generator.length - 1], c).name} (${c.generator.length}), the union of the domains |`);
  L.push('', '## The domains', '', '| domain | rungs | surveyor lens | architect lens | renovator lens |', '|---|---|---|---|---|');
  for (const [d, ns] of Object.entries(c.domains)) {
    const lens = (b) => ns.filter((n) => c.lenses[b].includes(n)).map((n) => `${n} ${verbOf(n, c).name}`).join(', ');
    L.push(`| ${d} | ${ns[0]} to ${ns[ns.length - 1]} | ${lens('surveyor')} | ${lens('architect')} | ${lens('renovator')} |`);
  }
  L.push('', '## Instrumented in this release', '', c.instrumented.map((n) => `${n} ${verbOf(n, c) ? verbOf(n, c).name : '?'}`).join(', '), '');
  L.push('## The laws', '');
  for (const k of c.laws) L.push(`- **${k}**: ${c.lawText.get(k)}`);
  L.push('');
  return L.join('\n');
}

// ---------- controls ----------
export function controls(io = console) {
  let ran = 0;
  let fail = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const c = contract();
  say(c.verbs.length === c.ladderCount && c.ladderCount === 108 && c.verbs.every((v, i) => v.n === i + 1 && v.gloss) && c.verbs[0].name === 'planimetry' && c.verbs[51].name === 'diplomatics' && c.verbs[52].name === 'chord' && c.verbs[107].name === 'documentation',
    `the ladder is ${c.ladderCount} rungs, dense and ascending: ${c.verbs[0].name} .. ${c.verbs[51].name} | ${c.verbs[52].name} .. ${c.verbs[107].name}`);
  const all = [...c.bands.surveyor, ...c.bands.architect, ...c.bands.renovator];
  say(all.length === c.ladderCodebase && new Set(all).size === 52 && c.bands.surveyor.length === 17 && c.bands.architect.length === 18 && c.bands.renovator.length === 17 && Math.max(...all) === 52,
    `the three bands partition the first ${c.ladderCodebase} rungs 17, 18, 17 with no overlap and no gap, and none of them moved (LAW.GEOM.1)`);
  const dom = Object.values(c.domains).flat();
  say(Object.keys(c.domains).length === 4 && dom.length === 56 && new Set(dom).size === 56 && Math.min(...dom) === 53 && Math.max(...dom) === 108 && Object.values(c.domains).every((d) => d.length === 14),
    `the four domains partition rungs 53 to 108, fourteen each: ${Object.entries(c.domains).map(([d, l]) => `${d} ${l[0]}-${l[l.length - 1]}`).join(', ')} (LAW.GEOM.9)`);
  say(c.generator.join() === dom.join(), 'the generator band is the union of the four domains, in order (LAW.GEOM.9)');
  const lensed = Object.values(c.lenses).flat();
  const eachDomain = Object.keys(c.bands).every((b) => Object.values(c.domains).every((d) => d.some((n) => c.lenses[b].includes(n))));
  say(lensed.length === 56 && new Set(lensed).size === 56 && [...new Set(lensed)].sort((a, b) => a - b).join() === dom.join() && eachDomain,
    `the three lenses partition the fifty-six, ${Object.entries(c.lenses).map(([b, l]) => `${b} ${l.length}`).join(', ')}, and every lens reaches every domain (LAW.GEOM.10)`);
  say(c.laws.length === 11 && c.laws.every((k, i) => k === `LAW.GEOM.${i + 1}`), `LAW.GEOM.1 to ${c.laws.length}, dense and ascending`);
  say(band('codebase-surveyor-dtd', c).length === 17 && band('/codebase-renovator-dtd', c).includes(52) && !band('codebase-architect-dtd', c).includes(1) && band('codebase-generator-dtd', c).length === 56 && !band('codebase-generator-dtd', c).includes(52),
    'a command exposes only its own band of the ladder, the generator the fifty-six above the codebase application');
  say(c.instrumented.every((n) => INSTRUMENTS[n] || [10, 17].includes(n) || n >= 18) && c.bands.surveyor.filter((n) => c.instrumented.includes(n)).length === 12,
    `GEOM.instrumented names ${c.instrumented.length} rungs and every surveyor rung it names has an instrument in this module`);

  // LAW.GEOM.6: the driver. A band switched off loses its verbs and elements,
  // and band() of that command is empty, which is the refusal.
  const off = contract({ off: ['renovator'] });
  say(off.verbs.length === 91 && !off.elements.includes('renovation') && off.elements.includes('survey') && band('codebase-renovator-dtd', off).length === 0,
    `trip: geom.renovator.module IGNORE before the include removes rungs 36 to 52 and the renovation element; the renovator's band is empty and it refuses (LAW.GEOM.6)`);
  const offS = contract({ off: ['surveyor'] });
  say(offS.verbs.length === 91 && !offS.elements.includes('survey') && offS.elements.includes('plan'), 'the surveyor band switches off the same way, and the other two stay');
  const offC = contract({ off: ['chromatics'] });
  say(offC.verbs.length === 94 && !offC.verbs.some((v) => v.n >= 81 && v.n <= 94) && band('codebase-generator-dtd', offC).length === 42 && offC.elements.includes('production'),
    `trip: geom.chromatics.module IGNORE removes rungs 81 to 94, the generator's band shrinks to ${band('codebase-generator-dtd', offC).length}, and the production element stays (LAW.GEOM.9)`);
  const offR = contract({ off: ['restoration'] });
  say(!offR.elements.includes('production') && band('codebase-generator-dtd', offR).length === 42, 'trip: the restoration domain switched off takes the production element with it');

  // a planted tree: the instruments measure what was planted
  const tmp = mkdtempSync(join(tmpdir(), 'geom-'));
  mkdirSync(join(tmp, 'bin'), { recursive: true });
  mkdirSync(join(tmp, 'lib', 'deep', 'deeper'), { recursive: true });
  mkdirSync(join(tmp, 'commands'), { recursive: true });
  writeFileSync(join(tmp, 'bin', 'cli.mjs'), "import { a } from '../lib/a.mjs';\n", 'utf8');
  writeFileSync(join(tmp, 'lib', 'a.mjs'), "import { b } from './b.mjs';\nexport const a = 1;\n", 'utf8');
  writeFileSync(join(tmp, 'lib', 'b.mjs'), 'export const b = 2;\n', 'utf8');
  writeFileSync(join(tmp, 'lib', 'orphan.mjs'), 'export const o = 3;\n', 'utf8');
  writeFileSync(join(tmp, 'lib', 'deep', 'deeper', 'leaf.txt'), 'x\n', 'utf8');
  writeFileSync(join(tmp, 'commands', 'one-dtd.md'), '---\ndescription: x\n---\n', 'utf8');
  writeFileSync(join(tmp, 'README.md'), '# t\n\n*1 Claude Code slash commands*\n\nrun /one-dtd\n', 'utf8');
  writeFileSync(join(tmp, 'package.json'), '{"description":"1 Claude Code commands"}\n', 'utf8');
  try {
    const s = survey(tmp, { c });
    const m = (n) => s.measures.find((x) => x.verb === n);
    say(m(1).value === 8 && m(1).detail.byTop[0].dir === 'lib', `planimetry counts the planted footprint: ${m(1).value} files, largest quire ${m(1).detail.byTop[0].dir}`);
    say(m(5).value === 3 && /leaf\.txt$/.test(m(5).detail.deepest), `bathymetry finds the deepest path at ${m(5).value} levels: ${m(5).detail.deepest}`);
    say(m(4).value === 2 && m(4).detail.farthest === 'lib/b.mjs', `hypsometry measures the farthest module at ${m(4).value} hops: ${m(4).detail.farthest}`);
    say(m(3).value === 1 && m(3).detail.zero[0] === 'lib/orphan.mjs', `goniometry names the module nothing imports: ${m(3).detail.zero.join(', ')}`);
    say(m(12).value === 3, `triangulation: three instruments agree on the command count (${m(12).value} of 3)`);
    say(m(9).value === 5, `ergonometry: the first invocation sits on README line ${m(9).value}`);
    say(s.measures.every((x) => x.confidence === 'measured' && x.instrument && x.unit && x.seconds !== undefined), 'every measure is measured, with an instrument, a unit and its seconds (LAW.GEOM.2)');
    say(s.unmeasured.length >= 5 && s.unmeasured.every((u) => u.why), `rungs without an instrument are unmeasured and say why: ${s.unmeasured.map((u) => u.verb).join(', ')} (LAW.GEOM.2)`);
    const fig = parseFigure(s.figure.xml);
    say(fig.mark === 'measured' && validateFigure(fig, 'artifact').ok && checkFigure(fig, s.figure.cells, s.figure.svg).ok && fig.shapes.length === m(17).value,
      `the survey draws one figure marked measured whose shapes are the measures, ${fig.shapes.length} of them, and the cells agree with the plate (LAW.GEOM.7)`);
    const cut = parseFigure(s.figure.cut);
    say(validateFigure(cut, 'cut').ok && cut.mark === 'guessed', 'the cut figure fits the 60x3 widget and is marked guessed, as a preview must be (LAW.FIG.4)');
    // the survey writes its artifact and nothing else
    const wrote = writeSurvey(tmp, s, { c, date: '2026-09-06' });
    say(wrote.length === 4 && wrote.every((p) => existsSync(join(tmp, p)) && p.startsWith(c.dir + '/')), `the survey artifact is written under ${c.dir}: ${wrote.join(', ')}`);
    // the plan
    let noSurvey = '';
    try { plan(s, { c }); } catch (e) { noSurvey = e.message; }
    say(/names the survey/.test(noSurvey), `trip: a plan naming no survey is refused by name: ${noSurvey} (LAW.GEOM.3)`);
    const p = plan(s, { c, surveyPath: wrote[1] });
    say(p.projections.length >= 5 && p.projections.every((x) => x.rewrite === 'no' && typeof x.bound === 'number'), `the plan carries ${p.projections.length} projections, each with a numeric bound and rewrite no (LAW.GEOM.3)`);
    say(parseFigure(p.figure.xml).shapes.length > parseFigure(s.figure.xml).shapes.length, 'the plan figure is the survey figure with the projections added (LAW.GEOM.8)');
    const wroteP = writePlan(tmp, p, { c, date: '2026-09-06' });
    say(planCheck(s, JSON.parse(readFileSync(join(tmp, wroteP[1]), 'utf8'))).ok, 'the survey the plan stands on satisfies every bound it declared');
    const worse = { ...s, measures: s.measures.map((x) => (x.verb === 5 ? { ...x, value: 9 } : x)) };
    const pc = planCheck(worse, p);
    say(!pc.ok && /quadrature declared bathymetry <= 3; the survey measures 9/.test(pc.findings[0]), `trip: a later survey deeper than the bound is named: ${pc.findings[0]}`);
    // the renovation: refused by name without a survey, without a plan, out of order; accepted with both
    const r0 = renovate(tmp, '', '', { c });
    say(!r0.ok && /no survey named/.test(r0.refused[0]) && /no plan named/.test(r0.refused[1]), `trip: a renovation with neither is refused by name: ${r0.refused[0]} (LAW.GEOM.4)`);
    const r1 = renovate(tmp, wrote[0], `${c.dir}/2026-09-07-plan.md`, { c });
    say(!r1.ok && /does not exist/.test(r1.refused[0]), `trip: a renovation naming a plan that does not exist is refused: ${r1.refused[0]}`);
    mkdirSync(join(tmp, c.dir), { recursive: true });
    writeFileSync(join(tmp, c.dir, '2026-09-01-plan.md'), '# older plan\n', 'utf8');
    const r2 = renovate(tmp, wrote[0], `${c.dir}/2026-09-01-plan.md`, { c, today: '2026-09-06' });
    say(!r2.ok && /earlier than the survey/.test(r2.refused[0]), `trip: a plan dated before its survey is refused: ${r2.refused[0]}`);
    const r3 = renovate(tmp, wrote[0], wroteP[0], { c, today: '2026-09-06' });
    say(r3.ok && r3.survey.sha256.length === 64 && r3.plan.sha256.length === 64 && r3.colophon.when === '2026-09-06', `a renovation with a survey and a plan on disk is accepted, and its diplomatics record both digests (LAW.GEOM.4, verb 52)`);
    const rp = writeRenovation(tmp, r3, { c, date: '2026-09-06' });
    say(existsSync(join(tmp, rp)) && /## Colophon/.test(readFileSync(join(tmp, rp), 'utf8')), `the renovation record closes with a colophon (verb 47): ${rp}`);
    // the generator: launches with nothing, refuses by name with one missing, produces with all three (LAW.GEOM.11)
    const g0 = produce(tmp, '', '', '', { c, png: false });
    say(!g0.ok && g0.launch && g0.chain.length === 4 && g0.chain[0] === 'codebase-surveyor-dtd' && g0.chain[3] === 'codebase-generator-dtd', `with nothing on disk the generator launches the chain in band order: ${g0.chain.join(' > ')} (LAW.GEOM.11)`);
    const g1 = produce(tmp, wrote[0], wroteP[0], '', { c, png: false });
    say(!g1.ok && !g1.launch && /no renovation named/.test(g1.refused[0]), `trip: a production with the renovation missing is refused by name, not launched: ${g1.refused[0]}`);
    const g2 = produce(tmp, wrote[0], wroteP[0], rp, { c, png: false, today: '2026-09-06', seed: 'Four domain bands' });
    say(g2.ok && g2.figure && g2.rungs.some((r) => r.n === 108) && g2.seed === 'Four domain bands', g2.ok
      ? `a production with all three on disk is accepted, seeded, and names rung 108 documentation by what it wrote: rungs ${g2.rungs.map((r) => r.n).join(' ')}`
      : `a production with all three on disk was refused: ${g2.refused.join('; ')}`);
    if (!g2.ok) throw new Error('production refused; the controls below it cannot run: ' + g2.refused.join('; '));
    const gf = parseFigure(g2.figure.xml);
    say(gf.mark === 'measured' && gf.seed === 'Four domain bands' && gf.shapes.filter((x) => x.kind === 'layer').length === 3 && ['surveyor', 'architect', 'renovator'].every((b) => gf.shapes.some((x) => x.kind === 'layer' && x.lband === b)),
      'the production is one figure of three layers, surveyor, architect and renovator, marked measured (LAW.FIG.7, LAW.GEOM.8)');
    say(g2.unused.length >= 1 && g2.unused.every((u) => /no shape of this plate embodies/.test(u.why)), `the domains no shape embodied are named unused with why: ${g2.unused.map((u) => u.domain).join(', ')} (LAW.GENERATOR.4)`);
    const gw = writeProduction(tmp, g2, { c, date: '2026-09-06' });
    say(gw.produced.length === 3 && gw.produced.every((x) => x.bytes > 0 && existsSync(join(tmp, x.path))) && /png unmeasured: --no-png/.test(gw.pngLine) && existsSync(join(tmp, gw.record)),
      `the production writes cells, svg and a dark svg with their bytes read back, and a skipped png is named unmeasured: ${gw.produced.map((x) => `${x.format} ${x.bytes}`).join(', ')}; ${gw.pngLine}`);
  } finally { rmSync(tmp, { recursive: true, force: true }); }

  // the built commands pin their band as a #FIXED attribute
  for (const [cmd, want] of [['codebase-surveyor-dtd', '1-17'], ['codebase-architect-dtd', '18-35'], ['codebase-renovator-dtd', '36-52'], ['codebase-generator-dtd', '53-108']]) {
    const built = join(ROOT, 'commands', `${cmd}.md`);
    if (!existsSync(built)) { say(false, `${cmd} is not built yet`); continue; }
    const text = readFileSync(built, 'utf8');
    const m = /band\s+CDATA\s+#FIXED\s+"([^"]+)"/.exec(text);
    say(!!m && m[1] === want, `the built ${cmd} pins band ${m ? m[1] : 'MISSING'} as a #FIXED attribute (LAW.GEOM.1)`);
  }
  // LAW.GEOM.5: the gate precedes the drawing in every command of the family.
  // What can be measured of a runtime obligation is its declaration: the built
  // command's process names the intake before the instrument that draws, and
  // names --no-gate as the one way past it.
  for (const [cmd, draw] of [['codebase-surveyor-dtd', 'geometry.mjs survey'], ['codebase-architect-dtd', 'geometry.mjs plan'], ['codebase-renovator-dtd', 'geometry.mjs renovate <survey.md> <plan.md> --write']]) {
    const built = join(ROOT, 'commands', `${cmd}.md`);
    if (!existsSync(built)) { say(false, `${cmd} is not built yet`); continue; }
    const proc = (/<process>([\s\S]*?)<\/process>/.exec(readFileSync(built, 'utf8')) || [, ''])[1];
    const intakeAt = proc.indexOf('Run the intake');
    const drawAt = proc.indexOf(draw);
    say(intakeAt >= 0 && drawAt > intakeAt && /--no-gate/.test(proc) && /LAW\.GEOM\.5/.test(proc),
      `${cmd}: the intake (step at ${intakeAt}) precedes the instrument that draws (at ${drawAt}), --no-gate is the one way past it, and LAW.GEOM.5 is named (LAW.GEOM.5)`);
  }
  // LAW.GEOM.1 is held by the grammar, not by prose: the built command's
  // DOCTYPE carries the verb of its element as an enumeration of its band, so a
  // validator refuses a measure carrying 41 in the surveyor.
  for (const [cmd, el, lo, hi, outside] of [['codebase-surveyor-dtd', 'measure', 1, 17, 41], ['codebase-architect-dtd', 'projection', 18, 35, 3], ['codebase-renovator-dtd', 'change', 36, 52, 20]]) {
    const built = join(ROOT, 'commands', `${cmd}.md`);
    if (!existsSync(built)) { say(false, `${cmd} is not built yet`); continue; }
    const m = new RegExp(`<!ATTLIST ${el}\\s+verb\\s+\\(([^)]*)\\)\\s+#REQUIRED`).exec(readFileSync(built, 'utf8'));
    const en = m ? m[1].split('|').map(Number) : [];
    say(en.length === hi - lo + 1 && en[0] === lo && en[en.length - 1] === hi && !en.includes(outside),
      `trip: the built ${cmd} holds the verb of a ${el} to the enumeration ${lo} to ${hi}, so a ${el} carrying ${outside} is invalid against the subset (LAW.GEOM.1)`);
  }
  const want = table(c);
  const ref = join(ROOT, 'dtd', 'geometry.md');
  const have = existsSync(ref) ? readFileSync(ref, 'utf8') : '';
  say(have === want, have === want ? 'dtd/geometry.md is the contract as generated' : `dtd/geometry.md drifted from dtd/geometry.dtd: run node lib/geometry.mjs table and write it to ${ref}`);

  io.log(`geometry controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const verb = args[0];
  const write = args.includes('--write');
  if (verb === 'controls') process.exit(controls() ? 0 : 1);
  if (verb === 'table') { process.stdout.write(table()); process.exit(0); }
  if (verb === 'survey') {
    const root = resolve(args[1] && !args[1].startsWith('--') ? args[1] : process.cwd());
    const s = survey(root);
    console.log(`survey of ${root} on ${s.substrate}: ${s.measures.length} measures, ${s.unmeasured.length} unmeasured, ${s.read} files, ${s.seconds} s`);
    for (const m of s.measures) console.log(`  ${String(m.verb).padStart(2)} ${m.name.padEnd(14)} ${String(m.value).padStart(8)} ${m.unit}  (${m.instrument}, ${m.seconds} s)`);
    for (const u of s.unmeasured) console.log(`  ${String(u.verb).padStart(2)} ${u.name.padEnd(14)} unmeasured: ${u.why}`);
    console.log(s.figure.cells);
    if (write) for (const p of writeSurvey(root, s)) console.log(`  wrote ${p}`);
    process.exit(0);
  }
  if (verb === 'plan' && args[1] === '--check') {
    const s = JSON.parse(readFileSync(args[2], 'utf8'));
    const p = JSON.parse(readFileSync(args[3], 'utf8'));
    const r = planCheck(s, p);
    for (const f of r.findings) console.log(`  EXCEEDED ${f}`);
    console.log(`plan check: ${r.ok ? 'every bound holds' : `${r.findings.length} bound(s) exceeded`}`);
    process.exit(r.ok ? 0 : 1);
  }
  if (verb === 'plan' && args[1]) {
    const s = JSON.parse(readFileSync(args[1], 'utf8'));
    const root = resolve(s.target || process.cwd());
    const p = plan(s, { surveyPath: rel(root, resolve(args[1])) });
    for (const x of p.projections) console.log(`  ${x.verb} ${x.name.padEnd(14)} ${x.op} ${String(x.bound).padStart(6)} on ${x.on}: ${x.declares}`);
    console.log(p.figure.cells);
    if (write) for (const f of writePlan(root, p)) console.log(`  wrote ${f}`);
    process.exit(0);
  }
  if (verb === 'renovate') {
    const root = process.cwd();
    const r = renovate(root, args[1] || '', args[2] || '');
    if (!r.ok) { for (const f of r.refused) console.log(`  REFUSED ${f}`); process.exit(1); }
    console.log(`renovation stands on ${r.survey.path} (${r.survey.date}) and ${r.plan.path} (${r.plan.date}); colophon ${r.colophon.who} ${r.colophon.when} ${r.colophon.terms}`);
    if (write) console.log(`  wrote ${writeRenovation(root, r)}`);
    process.exit(0);
  }
  if (verb === 'produce') {
    const root = process.cwd();
    const pr = produce(root, args[1] || '', args[2] || '', args[3] || '', { png: !args.includes('--no-png'), seed: (args.find((a) => a.startsWith('--seed=')) || '').slice(7) });
    if (pr.launch) { console.log('LAUNCH: nothing on disk; the chain in band order is ' + pr.chain.map((k) => '/' + k).join(' then ')); process.exit(3); }
    if (!pr.ok) { for (const f of pr.refused) console.log(`  REFUSED ${f}`); process.exit(1); }
    console.log(`production of ${pr.target} stands on ${pr.survey.path}, ${pr.plan.path}, ${pr.renovation.path}; ${pr.changes} change(s) drawn; rungs ${pr.rungs.map((r) => r.n).join(' ')}; unused ${pr.unused.map((u) => u.domain).join(' ') || 'none'}`);
    console.log(pr.figure.cells);
    if (write) { const w = writeProduction(root, pr); for (const p of w.produced) console.log(`  wrote ${p.path} (${p.format}, ${p.bytes} bytes)`); if (w.pngLine) console.log(`  ${w.pngLine}`); console.log(`  wrote ${w.record}`); }
    process.exit(0);
  }
  console.error('usage: node lib/geometry.mjs survey [root] [--write] | plan <survey.json> [--write] | plan --check <survey.json> <plan.json> | renovate <survey.md> <plan.md> [--write] | produce <survey.md> <plan.md> <renovation.md> [--write] [--no-png] [--seed=option] | table | controls');
  process.exit(2);
}
