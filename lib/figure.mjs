#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/figure.mjs
// One figure, two renderers, as declared in dtd/cc-figure.dtd. A figure is
// declared once in cells and rendered twice: to characters for the widget
// the harness draws a preview in, and to svg for the disk. The character
// grid bounds the svg and never the reverse (LAW.FIG.2), a figure that does
// not fit its grid is refused and never cut (LAW.FIG.1), and a pair of
// renderings that disagree on the shapes is refused the way build --check
// refuses a command that disagrees with its subset (LAW.FIG.3).
//
//   contract()                 the canvas, the glyphs, the shapes and the laws, read from the subset
//   parse(xml)                 a figure element and its shapes, in document order
//   validate(fig, mode)        LAW.FIG.1 and LAW.FIG.4 for a preview cut, expanded, or an artifact
//   renderCells(fig)           the character rendering, rows of the grid's width
//   renderSvg(fig, theme)      the svg plate, one cell = FIG.cell.w by FIG.cell.h
//   check(fig, cells, svg)     LAW.FIG.3: the shapes the three carry, compared in order
//   thumbnails(figs)           up to four figures side by side inside one cut preview
//   controls()                 every law tripped on purpose
//
//   node lib/figure.mjs render <figure.xml> [cut|expanded|artifact] | check <figure.xml> <cells.txt> <plate.svg> | controls

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSubset } from './dtd.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = join(ROOT, 'dtd', 'cc-figure.dtd');

export function contract(path = DTD) {
  const text = readFileSync(path, 'utf8');
  const ent = (name) => {
    const m = new RegExp(`<!ENTITY ${name.replace(/[.]/g, '\\.')}\\s+"([^"]*)"`).exec(text);
    if (!m) throw new Error(`cc-figure.dtd declares no ${name}`);
    return m[1];
  };
  return {
    cut: { cols: Number(ent('FIG.cut.cols')), rows: Number(ent('FIG.cut.rows')) },
    expanded: { cols: Number(ent('FIG.exp.cols')), rows: Number(ent('FIG.exp.rows')) },
    cell: { w: Number(ent('FIG.cell.w')), h: Number(ent('FIG.cell.h')) },
    renders: ent('FIG.renders').split('|'),
    shapes: ent('FIG.shapes').split('|'),
    shapesCount: Number(ent('FIG.shapes.count')),
    marks: ent('FIG.marks').split('|'),
    glyph: { corner: ent('FIG.glyph.corner'), h: ent('FIG.glyph.h'), v: ent('FIG.glyph.v'), diag: ent('FIG.glyph.diag'), back: ent('FIG.glyph.back') },
    modules: [...text.matchAll(/<!ENTITY % fig\.(\w+)\.module\s+"(INCLUDE|IGNORE)"/g)].map((m) => ({ shape: m[1], keyword: m[2] })),
    laws: [...text.matchAll(/<!ENTITY (LAW\.FIG\.\d+)\s/g)].map((m) => m[1]),
    lawText: new Map([...text.matchAll(/<!ENTITY (LAW\.FIG\.\d+)\s+"([^"]*)"/g)].map((m) => [m[1], m[2]])),
  };
}

// ---------- parse ----------
// A small reader for the one element this subset declares. Attribute
// values are CDATA; text inside a label is escaped PCDATA and unescaped here.
function attrs(s) {
  const out = {};
  for (const m of s.matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const N = (v) => Number(v);

export function parse(xml) {
  const m = /<figure\b([^>]*)>([\s\S]*?)<\/figure>/.exec(xml) || /<figure\b([^>]*)\/>/.exec(xml);
  if (!m) throw new Error('no figure element');
  const a = attrs(m[1]);
  const g = /^(\d+)x(\d+)$/.exec(a.grid || '');
  if (!g) throw new Error('figure lacks a grid of the form COLSxROWS');
  const fig = { grid: { cols: N(g[1]), rows: N(g[2]) }, renders: a.renders || 'both', mark: a.mark || 'guessed', title: a.title || '', shapes: [] };
  const body = m[2] || '';
  const re = /<(rect|line|label|group)\b([^>]*?)(\/>|>)/g;
  const stack = [];
  let t;
  let pos = 0;
  while ((t = re.exec(body))) {
    const kind = t[1];
    const at = attrs(t[2]);
    const group = stack.length ? stack[stack.length - 1] : '';
    if (kind === 'rect') fig.shapes.push({ kind, x: N(at.x), y: N(at.y), w: N(at.w), h: N(at.h), name: at.name || '', group });
    else if (kind === 'line') fig.shapes.push({ kind, x1: N(at.x1), y1: N(at.y1), x2: N(at.x2), y2: N(at.y2), group });
    else if (kind === 'label') {
      const close = body.indexOf('</label>', re.lastIndex);
      const text = t[3] === '/>' ? '' : unesc(body.slice(re.lastIndex, close < 0 ? re.lastIndex : close));
      fig.shapes.push({ kind, x: N(at.x), y: N(at.y), text, group });
      if (close >= 0) re.lastIndex = close + '</label>'.length;
    } else if (kind === 'group') {
      fig.shapes.push({ kind, name: at.name || '', group });
      if (t[3] !== '/>') stack.push(at.name || '');
    }
    pos = re.lastIndex;
    // a closing group tag between here and the next shape pops the stack
    const rest = body.slice(pos);
    const next = rest.search(/<(rect|line|label|group)\b/);
    const segment = next < 0 ? rest : rest.slice(0, next);
    for (const _ of segment.matchAll(/<\/group>/g)) stack.pop();
  }
  return fig;
}

// ---------- LAW.FIG.1, LAW.FIG.4 ----------
export function validate(fig, mode = 'cut', c = contract()) {
  const refused = [];
  const lim = mode === 'cut' ? c.cut : mode === 'expanded' ? c.expanded : null;
  if (lim && (fig.grid.cols > lim.cols || fig.grid.rows > lim.rows)) refused.push(`grid ${fig.grid.cols}x${fig.grid.rows} exceeds the ${mode} preview of ${lim.cols}x${lim.rows} cells (LAW.FIG.1)`);
  if (fig.grid.cols < 1 || fig.grid.rows < 1) refused.push('grid must be at least 1x1');
  fig.shapes.forEach((s, i) => {
    const name = `${s.kind}#${i + 1}${s.name ? ` ${s.name}` : ''}`;
    const inside = (x, y) => x >= 0 && y >= 0 && x < fig.grid.cols && y < fig.grid.rows;
    if (s.kind === 'rect' && !(inside(s.x, s.y) && inside(s.x + s.w - 1, s.y + s.h - 1) && s.w >= 2 && s.h >= 2)) refused.push(`${name} at ${s.x},${s.y} ${s.w}x${s.h} crosses the grid or is under 2x2 (LAW.FIG.1)`);
    if (s.kind === 'line' && !(inside(s.x1, s.y1) && inside(s.x2, s.y2))) refused.push(`${name} from ${s.x1},${s.y1} to ${s.x2},${s.y2} crosses the grid (LAW.FIG.1)`);
    if (s.kind === 'label' && !(inside(s.x, s.y) && s.x + s.text.length <= fig.grid.cols)) refused.push(`${name} "${s.text}" at ${s.x},${s.y} crosses the grid (LAW.FIG.1)`);
    if (!c.shapes.includes(s.kind)) refused.push(`${name} is not a declared shape`);
  });
  if ((mode === 'cut' || mode === 'expanded') && fig.mark !== 'guessed') refused.push(`a preview figure carries mark ${fig.mark}; a preview is the consequence the model predicts and is marked guessed (LAW.FIG.4)`);
  if (!c.marks.includes(fig.mark)) refused.push(`mark ${fig.mark} is not one of ${c.marks.join('|')}`);
  return { ok: refused.length === 0, refused };
}

// ---------- the cells renderer ----------
export function renderCells(fig, c = contract()) {
  const rows = Array.from({ length: fig.grid.rows }, () => Array(fig.grid.cols).fill(' '));
  const put = (x, y, ch) => { if (y >= 0 && y < fig.grid.rows && x >= 0 && x < fig.grid.cols) rows[y][x] = ch; };
  for (const s of fig.shapes) {
    if (s.kind === 'rect') {
      for (let x = s.x; x < s.x + s.w; x++) { put(x, s.y, c.glyph.h); put(x, s.y + s.h - 1, c.glyph.h); }
      for (let y = s.y; y < s.y + s.h; y++) { put(s.x, y, c.glyph.v); put(s.x + s.w - 1, y, c.glyph.v); }
      put(s.x, s.y, c.glyph.corner); put(s.x + s.w - 1, s.y, c.glyph.corner); put(s.x, s.y + s.h - 1, c.glyph.corner); put(s.x + s.w - 1, s.y + s.h - 1, c.glyph.corner);
      if (s.name) {
        const inner = s.w - 2;
        const txt = s.name.length > inner ? s.name.slice(0, Math.max(0, inner)) : s.name;
        const x0 = s.x + 1 + Math.floor((inner - txt.length) / 2);
        const y0 = s.y + Math.floor((s.h - 1) / 2);
        for (let i = 0; i < txt.length; i++) put(x0 + i, y0, txt[i]);
      }
    } else if (s.kind === 'line') {
      const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      const ch = dy === 0 ? c.glyph.h : dx === 0 ? c.glyph.v : (dx > 0) === (dy > 0) ? c.glyph.back : c.glyph.diag;
      for (let i = 0; i <= steps; i++) put(Math.round(s.x1 + (dx * i) / (steps || 1)), Math.round(s.y1 + (dy * i) / (steps || 1)), ch);
    } else if (s.kind === 'label') {
      for (let i = 0; i < s.text.length; i++) put(s.x + i, s.y, s.text[i]);
    }
  }
  return rows.map((r) => r.join('').replace(/\s+$/, '')).join('\n');
}

// ---------- the svg renderer ----------
export function renderSvg(fig, theme = 'light', c = contract()) {
  const dark = theme === 'dark';
  const bg = dark ? '#0f1117' : '#ffffff', fg = dark ? '#e6e9ef' : '#1a1d24', dim = dark ? '#9aa3b2' : '#5b6472', box = dark ? '#7aa2f7' : '#2b5fd9';
  const W = fig.grid.cols * c.cell.w, H = fig.grid.rows * c.cell.h;
  const S = [];
  S.push('<?xml version="1.0" encoding="UTF-8"?>');
  S.push('<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->');
  S.push('<!-- Copyright 2026 Saimonokuma. GENERATED by lib/figure.mjs from one figure element; the character grid is the bound (LAW.FIG.2). -->');
  S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="${c.cell.h - 4}" data-grid="${fig.grid.cols}x${fig.grid.rows}" data-mark="${esc(fig.mark)}">`);
  if (fig.title) S.push(`<title>${esc(fig.title)}</title>`);
  S.push(`<rect width="${W}" height="${H}" fill="${bg}"/>`);
  const cx = (x) => x * c.cell.w, cy = (y) => y * c.cell.h;
  for (const s of fig.shapes) {
    if (s.kind === 'rect') {
      S.push(`<rect data-shape="rect" x="${cx(s.x) + 1}" y="${cy(s.y) + 1}" width="${s.w * c.cell.w - 2}" height="${s.h * c.cell.h - 2}" rx="3" fill="none" stroke="${box}" stroke-width="1.5"/>`);
      if (s.name) S.push(`<text x="${cx(s.x) + (s.w * c.cell.w) / 2}" y="${cy(s.y) + (s.h * c.cell.h) / 2 + 4}" text-anchor="middle" fill="${fg}">${esc(s.name)}</text>`);
    } else if (s.kind === 'line') {
      S.push(`<line data-shape="line" x1="${cx(s.x1) + c.cell.w / 2}" y1="${cy(s.y1) + c.cell.h / 2}" x2="${cx(s.x2) + c.cell.w / 2}" y2="${cy(s.y2) + c.cell.h / 2}" stroke="${dim}" stroke-width="1.2"/>`);
    } else if (s.kind === 'label') {
      S.push(`<text data-shape="label" x="${cx(s.x)}" y="${cy(s.y) + c.cell.h - 4}" fill="${fg}">${esc(s.text)}</text>`);
    } else if (s.kind === 'group') {
      S.push(`<g data-shape="group" data-name="${esc(s.name)}"/>`);
    }
  }
  S.push('</svg>');
  return S.join('\n') + '\n';
}

// ---------- LAW.FIG.3: the shapes each rendering carries, in order ----------
export function shapesOfSvg(svg) {
  return [...String(svg).matchAll(/data-shape="(\w+)"/g)].map((m) => m[1]);
}
export function shapesOfCells(fig, cells, c = contract()) {
  const rows = String(cells).split('\n');
  const at = (x, y) => (rows[y] || '')[x] || ' ';
  const out = [];
  for (const s of fig.shapes) {
    if (s.kind === 'rect') { if (at(s.x, s.y) === c.glyph.corner && at(s.x + s.w - 1, s.y + s.h - 1) === c.glyph.corner) out.push('rect'); }
    else if (s.kind === 'line') { if (at(s.x1, s.y1) !== ' ' && at(s.x2, s.y2) !== ' ') out.push('line'); }
    else if (s.kind === 'label') { if ((rows[s.y] || '').slice(s.x, s.x + s.text.length) === s.text || !s.text) out.push('label'); }
    else if (s.kind === 'group') out.push('group');
  }
  return out;
}
export function check(fig, cells, svg, c = contract()) {
  const declared = fig.shapes.map((s) => s.kind);
  const inSvg = shapesOfSvg(svg);
  const inCells = shapesOfCells(fig, cells, c);
  const findings = [];
  if (inSvg.join() !== declared.join()) findings.push(`the svg carries [${inSvg.join(', ')}] and the figure declares [${declared.join(', ')}] (LAW.FIG.3)`);
  if (inCells.join() !== declared.join()) findings.push(`the cells carry [${inCells.join(', ')}] and the figure declares [${declared.join(', ')}] (LAW.FIG.3)`);
  const g = /data-grid="(\d+)x(\d+)"/.exec(svg);
  const w = /width="(\d+)"/.exec(svg), h = /height="(\d+)"/.exec(svg);
  if (!g || Number(g[1]) !== fig.grid.cols || Number(g[2]) !== fig.grid.rows) findings.push('the svg names a grid the figure did not declare (LAW.FIG.2)');
  if (!w || !h || Number(w[1]) !== fig.grid.cols * c.cell.w || Number(h[1]) !== fig.grid.rows * c.cell.h) findings.push(`the svg is not the cells scaled by ${c.cell.w}x${c.cell.h} (LAW.FIG.2)`);
  const lines = String(cells).split('\n');
  if (lines.length !== fig.grid.rows || lines.some((l) => l.length > fig.grid.cols)) findings.push('the cells rendering leaves its grid (LAW.FIG.1)');
  return { ok: findings.length === 0, findings };
}

export function render(fig, c = contract()) {
  return { cells: renderCells(fig, c), svg: renderSvg(fig, 'light', c), svgDark: renderSvg(fig, 'dark', c) };
}

// Up to four figures side by side inside one cut preview: the gate renders
// four character thumbnails and choosing a layout becomes looking at four
// shapes. Each thumbnail is (cut.cols - 3) / 4 columns wide.
export function thumbnails(figs, c = contract()) {
  if (figs.length < 1 || figs.length > 4) throw new Error('one to four thumbnails');
  const w = Math.floor((c.cut.cols - (figs.length - 1)) / figs.length);
  const cols = figs.map((f) => renderCells(f, c).split('\n').map((l) => l.padEnd(w).slice(0, w)));
  const out = [];
  for (let y = 0; y < c.cut.rows; y++) out.push(cols.map((rows) => rows[y] || ' '.repeat(w)).join(' ').replace(/\s+$/, ''));
  return out.join('\n');
}

// ---------- controls ----------
export function controls(io = console) {
  let ran = 0;
  let fail = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const c = contract();
  say(c.shapes.length === c.shapesCount && c.shapes.join('|') === 'rect|line|label|group', `the shapes are ${c.shapesCount}: ${c.shapes.join(', ')}`);
  say(c.modules.length === c.shapesCount && c.modules.every((m) => m.keyword === 'INCLUDE'), 'every shape is a module, INCLUDE by default');
  say(c.laws.length === 5 && c.laws.every((k, i) => k === `LAW.FIG.${i + 1}`), `LAW.FIG.1 to ${c.laws.length}, dense and ascending`);
  say(c.cut.cols === 60 && c.cut.rows === 3 && c.expanded.cols === 80 && c.expanded.rows === 12, `the canvas is the widget's: cut ${c.cut.cols}x${c.cut.rows}, expanded ${c.expanded.cols}x${c.expanded.rows}`);
  say(Object.values(c.glyph).every((g) => g.length === 1 && g.charCodeAt(0) < 128), 'every glyph is one ASCII character, so no widget font can turn a figure into boxes');

  const xml = '<figure grid="60x3" title="three walls"><rect x="0" y="0" w="12" h="3" name="bin"/><line x1="12" y1="1" x2="19" y2="1"/><rect x="20" y="0" w="12" h="3" name="lib"/><label x="34" y="1">load-bearing</label></figure>';
  const fig = parse(xml);
  say(fig.shapes.length === 4 && fig.shapes.map((s) => s.kind).join() === 'rect,line,rect,label', `a figure parses its shapes in document order: ${fig.shapes.map((s) => s.kind).join(', ')}`);
  const v = validate(fig, 'cut', c);
  const cells = renderCells(fig, c);
  const lines = cells.split('\n');
  say(v.ok && lines.length === 3 && lines.every((l) => l.length <= 60) && /\+-+\+/.test(lines[0]) && /bin/.test(lines[1]) && /load-bearing/.test(lines[1]),
    `a 60x3 figure renders inside the cut widget, corners and names in place:\n        ${lines.join('\n        ')}`);
  const wide = validate(parse('<figure grid="61x3"><rect x="0" y="0" w="2" h="2"/></figure>'), 'cut', c);
  say(!wide.ok && /61x3 exceeds the cut preview of 60x3/.test(wide.refused[0]), `trip: a 61x3 figure is refused for the cut preview by name, never cut: ${wide.refused[0]} (LAW.FIG.1)`);
  const cross = validate(parse('<figure grid="60x3"><rect x="55" y="0" w="10" h="3" name="over"/></figure>'), 'cut', c);
  say(!cross.ok && /rect#1 over .* crosses the grid/.test(cross.refused[0]), `trip: a shape crossing its grid is refused by name: ${cross.refused[0]}`);
  const tall = validate(parse('<figure grid="80x12"><rect x="0" y="0" w="4" h="4"/></figure>'), 'cut', c);
  const tallExp = validate(parse('<figure grid="80x12"><rect x="0" y="0" w="4" h="4"/></figure>'), 'expanded', c);
  say(!tall.ok && tallExp.ok, 'an 80x12 figure fits the expanded preview and not the cut one');

  const svg = renderSvg(fig, 'light', c);
  const dark = renderSvg(fig, 'dark', c);
  say(/width="480" height="48"/.test(svg) && shapesOfSvg(svg).join() === 'rect,line,rect,label' && /#0f1117/.test(dark),
    `the svg is the cells scaled by ${c.cell.w}x${c.cell.h} (480x48) and carries the same four shapes in order; the dark plate is drawn on the dark ground (LAW.FIG.2)`);
  say(!/<style|<script/.test(svg), 'the plate carries no style or script element');
  const chk = check(fig, cells, svg, c);
  say(chk.ok, `the cells and the svg agree with the figure: ${chk.findings.join('; ') || 'no finding'} (LAW.FIG.3)`);
  const dropped = svg.replace(/<line data-shape="line"[^>]*\/>\n/, '');
  const d1 = check(fig, cells, dropped, c);
  say(!d1.ok && /the svg carries \[rect, rect, label\]/.test(d1.findings[0]), `trip: an svg with a shape removed is refused: ${d1.findings[0]}`);
  const swapped = svg.replace('data-shape="line"', 'data-shape="TMP"').replace('data-shape="label"', 'data-shape="line"').replace('data-shape="TMP"', 'data-shape="label"');
  const d2 = check(fig, cells, swapped, c);
  say(!d2.ok && /the svg carries \[rect, label, rect, line\]/.test(d2.findings[0]), `trip: an svg with two shapes swapped is refused on order: ${d2.findings[0]}`);
  const blank = check(fig, ' '.repeat(60) + '\n\n', svg, c);
  say(!blank.ok && /the cells carry \[\]/.test(blank.findings[0]), `trip: a cells rendering that carries none of the shapes is refused: ${blank.findings[0]}`);

  const measured = validate(parse('<figure grid="60x3" mark="measured"><rect x="0" y="0" w="2" h="2"/></figure>'), 'cut', c);
  say(!measured.ok && /LAW\.FIG\.4/.test(measured.refused[0]), `trip: a preview figure marked measured is refused: ${measured.refused[0]} (LAW.FIG.4)`);
  say(validate(parse('<figure grid="120x40" mark="measured"><rect x="0" y="0" w="2" h="2"/></figure>'), 'artifact', c).ok, 'an artifact figure may be larger than any preview and may be marked measured');

  // LAW.FIG.5: the driver. A command that declares fig.rect.module IGNORE
  // before the include gets a grammar with no rect, through the resolver
  // every command already builds with.
  const base = join(ROOT, 'dtd');
  const on = resolveSubset('<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;', base).text;
  const off = resolveSubset('<!ENTITY % fig.rect.module "IGNORE">\n<!ENTITY % fig.content "line | label | group">\n<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;', base).text;
  say(/<!ELEMENT rect EMPTY>/.test(on) && /<!ELEMENT figure \(rect \| line \| label \| group\)\*>/.test(on),
    'with the default driver the resolved grammar declares rect and figure admits it');
  say(!/<!ELEMENT rect/.test(off) && /<!ELEMENT figure \(line \| label \| group\)\*>/.test(off) && /<!ELEMENT line EMPTY>/.test(off),
    'trip: fig.rect.module IGNORE declared before the include removes rect from the resolved grammar and figure no longer admits it (LAW.FIG.5)');
  const renamed = resolveSubset('<!ENTITY % fig.n.rect "box">\n<!ENTITY % fig.content "box | line | label | group">\n<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;', base).text;
  say(/<!ELEMENT box EMPTY>/.test(renamed) && !/<!ELEMENT rect/.test(renamed), 'the element name is a parameter entity: a command renames rect to box before the include, as TEI renames n.abbr');

  const four = thumbnails([fig, fig, fig, fig], c).split('\n');
  say(four.length === 3 && four.every((l) => l.length <= 60), `four thumbnails sit side by side inside one cut preview, ${four[0].length} columns of ${c.cut.cols}`);
  say(!/[─-╿]/.test(cells) && !/[─-╿]/.test(four.join('')), 'no box-drawing character anywhere in a cells rendering');

  io.log(`figure controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [verb, a, b, d] = process.argv.slice(2);
  if (verb === 'controls') process.exit(controls() ? 0 : 1);
  if (verb === 'render' && a) {
    const fig = parse(readFileSync(a, 'utf8'));
    const mode = b || 'artifact';
    const v = validate(fig, mode);
    if (!v.ok) { for (const r of v.refused) console.log(`  REFUSED ${r}`); process.exit(1); }
    const r = render(fig);
    console.log(r.cells);
    console.log(r.svg);
    process.exit(0);
  }
  if (verb === 'check' && a && b && d && existsSync(a)) {
    const r = check(parse(readFileSync(a, 'utf8')), readFileSync(b, 'utf8'), readFileSync(d, 'utf8'));
    for (const f of r.findings) console.log(`  DISAGREE ${f}`);
    console.log(`figure check: ${r.ok ? 'the cells and the svg agree with the figure' : `${r.findings.length} disagreement(s)`}`);
    process.exit(r.ok ? 0 : 1);
  }
  console.error('usage: node lib/figure.mjs render <figure.xml> [cut|expanded|artifact] | check <figure.xml> <cells.txt> <plate.svg> | controls');
  process.exit(2);
}
