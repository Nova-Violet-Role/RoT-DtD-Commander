#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/figure.mjs
// One figure, two renderers. dtd/cc-figure.dtd declares a figure in cells;
// this module renders it to characters for the AskUserQuestion widget and to
// svg for the disk, from the same element, and refuses the pair when they
// disagree. The character grid bounds the svg and never the reverse
// (LAW.FIG.2), a figure that does not fit its grid is refused and never cut
// (LAW.FIG.1), and a pair of renderings that disagree on the shapes is
// refused the way build --check refuses a command that disagrees with its
// subset (LAW.FIG.3).
//
// 9.0.0: twenty shapes in seven groups, read from the subset. A transform is
// applied by the same arithmetic before either renderer draws (LAW.FIG.3), a
// layer carries a band and the plate colours it by that band (LAW.FIG.7), a
// figure chosen at a gate is carried out as a seed (LAW.FIG.6), and up to
// FIG.thumbnails.max figures sit side by side in one cut preview (LAW.FIG.8).
// The seven glyphs are the ones typography.dtd declares, and its controls
// hold the two files to each other.
//
//   contract()                 the canvas, the glyphs, the shapes, the groups, the tokens and the laws
//   parse(xml)                 a figure element and its shapes, in document order, transforms applied
//   validate(fig, mode)        LAW.FIG.1, LAW.FIG.4, LAW.FIG.7 for a preview cut, expanded, or an artifact
//   renderCells(fig)           the character rendering, exactly grid.rows lines of at most grid.cols
//   renderSvg(fig, theme)      the svg plate, one cell = FIG.cell.w by FIG.cell.h, tokens resolved per theme
//   check(fig, cells, svg)     LAW.FIG.3: the shapes the three carry, compared in order
//   thumbnails(figs)           up to FIG.thumbnails.max figures side by side in one cut preview
//   overlay(layers)            one figure from up to four, each wrapped in a layer of its band
//   seed(fig, option)          the figure carried out of the intake, its seed attribute set
//   controls()                 every law tripped on purpose
//
//   node lib/figure.mjs render <figure.xml> [cut|expanded|artifact] | controls

import { readFileSync, writeFileSync } from 'node:fs';
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
  const groups = {};
  for (const g of ent('FIG.groups').split('|')) groups[g] = ent(`FIG.group.${g}`).split('|');
  return {
    cut: { cols: Number(ent('FIG.cut.cols')), rows: Number(ent('FIG.cut.rows')) },
    expanded: { cols: Number(ent('FIG.exp.cols')), rows: Number(ent('FIG.exp.rows')) },
    cell: { w: Number(ent('FIG.cell.w')), h: Number(ent('FIG.cell.h')) },
    renders: ent('FIG.renders').split('|'),
    shapes: ent('FIG.shapes').split('|'),
    shapesCount: Number(ent('FIG.shapes.count')),
    groups,
    marks: ent('FIG.marks').split('|'),
    colours: ent('FIG.colours').split('|'),
    bands: ent('FIG.bands').split('|'),
    pathCommands: ent('FIG.path.commands').split('|'),
    thumbnailsMax: Number(ent('FIG.thumbnails.max')),
    glyph: { corner: ent('FIG.glyph.corner'), h: ent('FIG.glyph.h'), v: ent('FIG.glyph.v'), diag: ent('FIG.glyph.diag'), back: ent('FIG.glyph.back'), fill: ent('FIG.glyph.fill'), light: ent('FIG.glyph.light') },
    modules: [...text.matchAll(/<!ENTITY % fig\.(\w+)\.module\s+"(INCLUDE|IGNORE)"/g)].map((m) => ({ shape: m[1], keyword: m[2] })),
    laws: [...text.matchAll(/<!ENTITY (LAW\.FIG\.\d+)\s/g)].map((m) => m[1]),
    lawText: new Map([...text.matchAll(/<!ENTITY (LAW\.FIG\.\d+)\s+"([^"]*)"/g)].map((m) => [m[1], m[2]])),
  };
}

// ---------- parse ----------
// A small reader for the elements this subset declares. Attribute values are
// CDATA; text inside a label or a text is escaped PCDATA and unescaped here.
function attrs(s) {
  const out = {};
  for (const m of s.matchAll(/([\w:-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const N = (v) => Number(v);
const KINDS = 'rect|line|label|group|circle|ellipse|polyline|polygon|path|arc|text|fill|stroke|gradient|transform|measure|extrude|rotate3d|contour|layer';
const CONTAINERS = new Set(['group', 'layer']);
const TEXTUAL = new Set(['label', 'text']);

function points(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).map((p) => p.split(',').map(Number));
}
function pathCommands(d) {
  const out = [];
  const re = /([A-Za-z])\s*((?:-?\d+(?:\.\d+)?[\s,]*)*)/g;
  let m;
  while ((m = re.exec(String(d || '')))) {
    const nums = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (!m[1].trim()) continue;
    out.push({ c: m[1], x: nums[0], y: nums[1] });
  }
  return out;
}

export function parse(xml) {
  const m = /<figure\b([^>]*)>([\s\S]*?)<\/figure>/.exec(xml) || /<figure\b([^>]*)\/>/.exec(xml);
  if (!m) throw new Error('no figure element');
  const a = attrs(m[1]);
  const g = /^(\d+)x(\d+)$/.exec(a.grid || '');
  if (!g) throw new Error('figure lacks a grid of the form COLSxROWS');
  const fig = { grid: { cols: N(g[1]), rows: N(g[2]) }, renders: a.renders || 'both', mark: a.mark || 'guessed', title: a.title || '', seed: a.seed || '', shapes: [] };
  const body = m[2] || '';
  const re = new RegExp(`<(${KINDS})\\b([^>]*?)(\\/>|>)`, 'g');
  const stack = []; // [{name, band}]
  let t;
  while ((t = re.exec(body))) {
    const kind = t[1];
    const at = attrs(t[2]);
    const group = stack.length ? stack[stack.length - 1].name : '';
    const chain = stack.map((s) => s.name);
    const band = [...stack].reverse().map((s) => s.band).find(Boolean) || '';
    const base = { kind, group, chain, band };
    if (kind === 'rect') fig.shapes.push({ ...base, x: N(at.x), y: N(at.y), w: N(at.w), h: N(at.h), name: at.name || '' });
    else if (kind === 'line') fig.shapes.push({ ...base, x1: N(at.x1), y1: N(at.y1), x2: N(at.x2), y2: N(at.y2) });
    else if (kind === 'circle') fig.shapes.push({ ...base, cx: N(at.cx), cy: N(at.cy), r: N(at.r), name: at.name || '' });
    else if (kind === 'ellipse') fig.shapes.push({ ...base, cx: N(at.cx), cy: N(at.cy), rx: N(at.rx), ry: N(at.ry), name: at.name || '' });
    else if (kind === 'polyline') fig.shapes.push({ ...base, points: points(at.points) });
    else if (kind === 'polygon') fig.shapes.push({ ...base, points: points(at.points), name: at.name || '' });
    else if (kind === 'path') fig.shapes.push({ ...base, d: at.d || '', cmds: pathCommands(at.d) });
    else if (kind === 'arc') fig.shapes.push({ ...base, cx: N(at.cx), cy: N(at.cy), r: N(at.r), a1: N(at.a1), a2: N(at.a2) });
    else if (kind === 'fill') fig.shapes.push({ ...base, of: at.of || '', colour: at.colour || '' });
    else if (kind === 'stroke') fig.shapes.push({ ...base, of: at.of || '', colour: at.colour || '', width: N(at.width || 1) });
    else if (kind === 'gradient') fig.shapes.push({ ...base, of: at.of || '', from: at.from || '', to: at.to || '', axis: at.axis || 'x' });
    else if (kind === 'transform') fig.shapes.push({ ...base, of: at.of || '', tkind: at.kind || '', args: String(at.args || '').trim().split(/[\s,]+/).filter(Boolean).map(Number) });
    else if (kind === 'measure') fig.shapes.push({ ...base, x1: N(at.x1), y1: N(at.y1), x2: N(at.x2), y2: N(at.y2), value: at.value || '', unit: at.unit || '' });
    else if (kind === 'extrude') fig.shapes.push({ ...base, of: at.of || '', depth: N(at.depth) });
    else if (kind === 'rotate3d') fig.shapes.push({ ...base, of: at.of || '', axis: at.axis || 'z', degrees: N(at.degrees) });
    else if (kind === 'contour') fig.shapes.push({ ...base, source: at.source || '', points: points(at.points), tolerance: N(at.tolerance || 1) });
    else if (TEXTUAL.has(kind)) {
      const closeTag = `</${kind}>`;
      const close = body.indexOf(closeTag, re.lastIndex);
      const text = t[3] === '/>' ? '' : unesc(body.slice(re.lastIndex, close < 0 ? re.lastIndex : close));
      fig.shapes.push({ ...base, x: N(at.x), y: N(at.y), text, role: at.role || 'plate' });
      if (close >= 0) re.lastIndex = close + closeTag.length;
    } else if (CONTAINERS.has(kind)) {
      fig.shapes.push({ ...base, name: at.name || '', lband: at.band || '' });
      if (t[3] !== '/>') stack.push({ name: at.name || '', band: kind === 'layer' ? at.band || '' : '' });
    }
    // closing container tags between here and the next shape pop the stack
    const rest = body.slice(re.lastIndex);
    const next = rest.search(new RegExp(`<(${KINDS})\\b`));
    const segment = next < 0 ? rest : rest.slice(0, next);
    for (const _ of segment.matchAll(/<\/(group|layer)>/g)) stack.pop();
  }
  applyTransforms(fig);
  return fig;
}

// ---------- transforms, applied once, before either renderer ----------
// Every point a shape carries goes through the same arithmetic, so the cells
// and the svg cannot drift on a transformed group (LAW.FIG.3). Rounded to
// the cell, because the cells are the bound.
const deg = (d) => (Number(d) * Math.PI) / 180;
function mapPoints(s, f) {
  if (s.kind === 'rect') {
    const [x1, y1] = f(s.x, s.y), [x2, y2] = f(s.x + s.w - 1, s.y + s.h - 1);
    s.x = Math.min(x1, x2); s.y = Math.min(y1, y2); s.w = Math.abs(x2 - x1) + 1; s.h = Math.abs(y2 - y1) + 1;
  } else if (s.kind === 'line' || s.kind === 'measure') {
    [s.x1, s.y1] = f(s.x1, s.y1); [s.x2, s.y2] = f(s.x2, s.y2);
  } else if (s.kind === 'circle') {
    [s.cx, s.cy] = f(s.cx, s.cy);
  } else if (s.kind === 'ellipse' || s.kind === 'arc') {
    [s.cx, s.cy] = f(s.cx, s.cy);
  } else if (s.points) {
    s.points = s.points.map(([x, y]) => f(x, y));
  } else if (s.cmds) {
    s.cmds = s.cmds.map((c) => (c.x === undefined ? c : { ...c, ...(([x, y]) => ({ x, y }))(f(c.x, c.y)) }));
  } else if (TEXTUAL.has(s.kind)) {
    [s.x, s.y] = f(s.x, s.y);
  }
}
function bbox(shapes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const s of shapes) {
    if (s.kind === 'rect') { take(s.x, s.y); take(s.x + s.w - 1, s.y + s.h - 1); }
    else if (s.kind === 'line' || s.kind === 'measure') { take(s.x1, s.y1); take(s.x2, s.y2); }
    else if (s.kind === 'circle') { take(s.cx - s.r, s.cy - s.r); take(s.cx + s.r, s.cy + s.r); }
    else if (s.kind === 'ellipse' || s.kind === 'arc') { const rx = s.rx ?? s.r, ry = s.ry ?? s.r; take(s.cx - rx, s.cy - ry); take(s.cx + rx, s.cy + ry); }
    else if (s.points) for (const [x, y] of s.points) take(x, y);
    else if (s.cmds) for (const c of s.cmds) if (c.x !== undefined) take(c.x, c.y);
    else if (TEXTUAL.has(s.kind)) take(s.x, s.y);
  }
  if (x0 === Infinity) return null;
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
const inGroup = (s, name) => s.chain.includes(name) || s.name === name;
function applyTransforms(fig) {
  const R = (v) => Math.round(v);
  for (const t of fig.shapes) {
    if (t.kind !== 'transform' && t.kind !== 'rotate3d') continue;
    const members = fig.shapes.filter((s) => s !== t && inGroup(s, t.of) && !CONTAINERS.has(s.kind));
    const box = bbox(members);
    let f = null;
    if (t.kind === 'transform') {
      const [a = 0, b = 0, c = 0] = t.args;
      if (t.tkind === 'translate') f = (x, y) => [R(x + a), R(y + b)];
      else if (t.tkind === 'scale') f = (x, y) => [R(x * a), R(y * (t.args.length > 1 ? b : a))];
      else if (t.tkind === 'rotate') {
        const cx = t.args.length > 1 ? b : box ? box.cx : 0, cy = t.args.length > 2 ? c : box ? box.cy : 0, th = deg(a);
        f = (x, y) => [R(cx + (x - cx) * Math.cos(th) - (y - cy) * Math.sin(th)), R(cy + (x - cx) * Math.sin(th) + (y - cy) * Math.cos(th))];
      } else if (t.tkind === 'skew') { const k = Math.tan(deg(a)); f = (x, y) => [R(x + y * k), y]; }
    } else if (box) {
      const th = deg(t.degrees), co = Math.cos(th);
      if (t.axis === 'z') f = (x, y) => [R(box.cx + (x - box.cx) * co - (y - box.cy) * Math.sin(th)), R(box.cy + (x - box.cx) * Math.sin(th) + (y - box.cy) * co)];
      else if (t.axis === 'x') f = (x, y) => [x, R(box.cy + (y - box.cy) * co)];
      else f = (x, y) => [R(box.cx + (x - box.cx) * co), y];
    }
    if (f) for (const s of members) mapPoints(s, f);
    t.applied = members.length;
  }
}

// ---------- geometry helpers shared by both renderers ----------
function* linePoints(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i++) yield [Math.round(x1 + (dx * i) / (steps || 1)), Math.round(y1 + (dy * i) / (steps || 1))];
}
function lineGlyph(dx, dy, g) { return dy === 0 ? g.h : dx === 0 ? g.v : (dx > 0) === (dy > 0) ? g.back : g.diag; }
// An ellipse in cells: sampled around the circumference, each sample drawn
// with the glyph of its local tangent. A circle is the ellipse with rx = ry.
function* ellipsePoints(cx, cy, rx, ry, a1 = 0, a2 = 360) {
  const n = Math.max(8, Math.ceil(2 * Math.PI * Math.max(rx, ry) * 2));
  const from = deg(a1), to = deg(a2 <= a1 ? a2 + 360 : a2);
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    // the tangent of an ellipse at t is (-rx sin t, ry cos t); the sign of y is
    // flipped because rows grow downward
    yield [Math.round(cx + rx * Math.cos(t)), Math.round(cy - ry * Math.sin(t)), -rx * Math.sin(t), -ry * Math.cos(t)];
  }
}
function tangentGlyph(tx, ty, g) {
  if (Math.abs(ty) < 0.35 * Math.abs(tx)) return g.h;
  if (Math.abs(tx) < 0.35 * Math.abs(ty)) return g.v;
  return (tx > 0) === (ty > 0) ? g.back : g.diag;
}
function polyOf(s) {
  if (s.kind === 'rect') return [[s.x, s.y], [s.x + s.w - 1, s.y], [s.x + s.w - 1, s.y + s.h - 1], [s.x, s.y + s.h - 1]];
  if (s.kind === 'polygon' || s.kind === 'contour') return s.points;
  if (s.kind === 'path') return s.cmds.filter((c) => c.x !== undefined).map((c) => [c.x, c.y]);
  return null;
}
// Point in shape, for the interior a fill or a gradient paints.
function inside(s, x, y) {
  if (s.kind === 'rect') return x > s.x && x < s.x + s.w - 1 && y > s.y && y < s.y + s.h - 1;
  if (s.kind === 'circle') return ((x - s.cx) ** 2) / ((s.r - 0.6) ** 2) + ((y - s.cy) ** 2) / ((s.r - 0.6) ** 2) < 1;
  if (s.kind === 'ellipse') return ((x - s.cx) ** 2) / ((s.rx - 0.6) ** 2) + ((y - s.cy) ** 2) / ((s.ry - 0.6) ** 2) < 1;
  const poly = polyOf(s);
  if (!poly || poly.length < 3) return false;
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
const FILLABLE = new Set(['rect', 'circle', 'ellipse', 'polygon', 'path', 'contour']);
const PAINT = new Set(['fill', 'stroke', 'gradient']);
const STRUCTURAL = new Set(['group', 'layer', 'transform', 'rotate3d']);
const named = (fig, name) => fig.shapes.find((s) => s.name === name && !CONTAINERS.has(s.kind));
const namedGroup = (fig, name) => fig.shapes.find((s) => s.name === name && CONTAINERS.has(s.kind));
// The cell each shape is recognised by in a cells rendering (LAW.FIG.3).
function anchor(s, fig) {
  if (s.kind === 'rect') return [s.x, s.y];
  if (s.kind === 'line' || s.kind === 'measure') return [s.x1, s.y1];
  if (s.kind === 'circle') return [s.cx + s.r, s.cy];
  if (s.kind === 'ellipse') return [s.cx + s.rx, s.cy];
  if (s.kind === 'arc') { const [x, y] = ellipsePoints(s.cx, s.cy, s.r, s.r, s.a1, s.a2).next().value; return [x, y]; }
  if (s.points) return s.points[0] || null;
  if (s.cmds) { const c = s.cmds.find((k) => k.x !== undefined); return c ? [c.x, c.y] : null; }
  if (TEXTUAL.has(s.kind)) return [s.x, s.y];
  if (PAINT.has(s.kind)) { const t = named(fig, s.of); if (!t) return null; const b = bbox([t]); return b ? [Math.round(b.cx), Math.round(b.cy)] : null; }
  if (s.kind === 'extrude') { const g = fig.shapes.filter((k) => inGroup(k, s.of) && k.kind === 'rect'); return g.length ? [g[0].x + s.depth, g[0].y - s.depth] : null; }
  return null;
}

// ---------- LAW.FIG.1, LAW.FIG.4, LAW.FIG.7 ----------
export function validate(fig, mode = 'cut', c = contract()) {
  const refused = [];
  const lim = mode === 'cut' ? c.cut : mode === 'expanded' ? c.expanded : null;
  if (lim && (fig.grid.cols > lim.cols || fig.grid.rows > lim.rows)) refused.push(`grid ${fig.grid.cols}x${fig.grid.rows} exceeds the ${mode} preview of ${lim.cols}x${lim.rows} cells (LAW.FIG.1)`);
  if (fig.grid.cols < 1 || fig.grid.rows < 1) refused.push('grid must be at least 1x1');
  const inGrid = (x, y) => x >= 0 && y >= 0 && x < fig.grid.cols && y < fig.grid.rows;
  const bandsSeen = new Map();
  fig.shapes.forEach((s, i) => {
    const name = `${s.kind}#${i + 1}${s.name ? ` ${s.name}` : ''}`;
    const cross = (what) => refused.push(`${name} ${what} crosses the grid (LAW.FIG.1)`);
    if (!c.shapes.includes(s.kind)) refused.push(`${name} is not a declared shape`);
    if (s.kind === 'rect' && !(inGrid(s.x, s.y) && inGrid(s.x + s.w - 1, s.y + s.h - 1) && s.w >= 2 && s.h >= 2)) refused.push(`${name} at ${s.x},${s.y} ${s.w}x${s.h} crosses the grid or is under 2x2 (LAW.FIG.1)`);
    if ((s.kind === 'line' || s.kind === 'measure') && !(inGrid(s.x1, s.y1) && inGrid(s.x2, s.y2))) cross(`from ${s.x1},${s.y1} to ${s.x2},${s.y2}`);
    if (s.kind === 'circle' && !(inGrid(s.cx - s.r, s.cy - s.r) && inGrid(s.cx + s.r, s.cy + s.r) && s.r >= 1)) cross(`centre ${s.cx},${s.cy} radius ${s.r}`);
    if (s.kind === 'ellipse' && !(inGrid(s.cx - s.rx, s.cy - s.ry) && inGrid(s.cx + s.rx, s.cy + s.ry) && s.rx >= 1 && s.ry >= 1)) cross(`centre ${s.cx},${s.cy} radii ${s.rx},${s.ry}`);
    if (s.kind === 'arc' && !(inGrid(s.cx - s.r, s.cy - s.r) && inGrid(s.cx + s.r, s.cy + s.r) && s.r >= 1)) cross(`centre ${s.cx},${s.cy} radius ${s.r}`);
    if (s.points && (s.points.length < 2 || s.points.some(([x, y]) => !inGrid(x, y)))) cross(`a point of ${s.points.length}`);
    if (s.kind === 'polygon' && s.points.length < 3) refused.push(`${name} has ${s.points.length} points; a polygon needs three`);
    if (s.kind === 'path') {
      const bad = s.cmds.filter((k) => !c.pathCommands.includes(k.c));
      if (bad.length) refused.push(`${name} carries the command ${bad[0].c}, outside ${c.pathCommands.join('|')}: a curve is a shape the cells cannot carry (LAW.FIG.2)`);
      if (s.cmds.some((k) => k.x !== undefined && !inGrid(k.x, k.y))) cross('a point of the path');
    }
    if (TEXTUAL.has(s.kind) && !(inGrid(s.x, s.y) && s.x + s.text.length <= fig.grid.cols)) refused.push(`${name} "${s.text}" at ${s.x},${s.y} crosses the grid (LAW.FIG.1)`);
    if (s.kind === 'measure' && s.x1 === s.x2 && s.y1 === s.y2) refused.push(`${name} has no length to measure`);
    if (s.kind === 'measure' && s.x1 !== s.x2 && s.y1 !== s.y2) refused.push(`${name} is neither horizontal nor vertical; a dimension line runs along one axis`);
    if (PAINT.has(s.kind)) {
      const t = named(fig, s.of);
      if (!t) refused.push(`${name} paints ${JSON.stringify(s.of)}, which names no shape of this figure`);
      else if (s.kind !== 'stroke' && !FILLABLE.has(t.kind)) refused.push(`${name} paints ${s.of}, a ${t.kind}, which has no interior`);
      for (const col of [s.colour, s.from, s.to].filter(Boolean)) if (!c.colours.includes(col)) refused.push(`${name} names the colour ${col}, not a token of ${c.colours.join('|')}`);
    }
    if (s.kind === 'transform' || s.kind === 'rotate3d' || s.kind === 'extrude') {
      if (!namedGroup(fig, s.of)) refused.push(`${name} acts on ${JSON.stringify(s.of)}, which names no group or layer of this figure`);
      if (s.kind === 'transform' && !['translate', 'scale', 'rotate', 'skew'].includes(s.tkind)) refused.push(`${name} has the kind ${s.tkind}`);
      if (s.kind === 'extrude' && !(s.depth >= 1)) refused.push(`${name} has no depth`);
    }
    if (s.kind === 'extrude') {
      const members = fig.shapes.filter((k) => inGroup(k, s.of) && k.kind === 'rect');
      for (const r of members) if (!inGrid(r.x + s.depth, r.y - s.depth) || !inGrid(r.x + r.w - 1 + s.depth, r.y + r.h - 1 - s.depth)) cross(`the extrusion of ${r.name || 'a rect'} by ${s.depth}`);
    }
    if (s.kind === 'layer') {
      if (!c.bands.includes(s.lband)) refused.push(`${name} carries the band ${JSON.stringify(s.lband)}, not one of ${c.bands.join('|')} (LAW.FIG.7)`);
      else if (bandsSeen.has(s.lband)) refused.push(`${name} is a second layer of the band ${s.lband}; one plate carries one layer per band (LAW.FIG.7)`);
      bandsSeen.set(s.lband, name);
    }
  });
  if ((mode === 'cut' || mode === 'expanded') && fig.mark !== 'guessed') refused.push(`a preview figure carries mark ${fig.mark}; a preview is the consequence the model predicts and is marked guessed (LAW.FIG.4)`);
  if (!c.marks.includes(fig.mark)) refused.push(`mark ${fig.mark} is not one of ${c.marks.join('|')}`);
  return { ok: refused.length === 0, refused };
}

// ---------- the cells renderer ----------
export function renderCells(fig, c = contract()) {
  const g = c.glyph;
  const rows = Array.from({ length: fig.grid.rows }, () => Array(fig.grid.cols).fill(' '));
  const put = (x, y, ch) => { if (y >= 0 && y < fig.grid.rows && x >= 0 && x < fig.grid.cols) rows[y][x] = ch; };
  const drawLine = (x1, y1, x2, y2, ch = null) => { const gl = ch || lineGlyph(x2 - x1, y2 - y1, g); for (const [x, y] of linePoints(x1, y1, x2, y2)) put(x, y, gl); };
  const drawPoly = (pts, close) => { for (let i = 0; i + 1 < pts.length; i++) drawLine(...pts[i], ...pts[i + 1]); if (close && pts.length > 2) drawLine(...pts[pts.length - 1], ...pts[0]); };
  const drawEllipse = (cx, cy, rx, ry, a1, a2) => { for (const [x, y, tx, ty] of ellipsePoints(cx, cy, rx, ry, a1, a2)) put(x, y, tangentGlyph(tx, ty, g)); };
  const drawText = (x, y, text) => { for (let i = 0; i < text.length; i++) put(x + i, y, text[i]); };
  const drawRect = (s) => {
    for (let x = s.x; x < s.x + s.w; x++) { put(x, s.y, g.h); put(x, s.y + s.h - 1, g.h); }
    for (let y = s.y; y < s.y + s.h; y++) { put(s.x, y, g.v); put(s.x + s.w - 1, y, g.v); }
    put(s.x, s.y, g.corner); put(s.x + s.w - 1, s.y, g.corner); put(s.x, s.y + s.h - 1, g.corner); put(s.x + s.w - 1, s.y + s.h - 1, g.corner);
    if (s.name) {
      const inner = s.w - 2;
      const txt = s.name.length > inner ? s.name.slice(0, Math.max(0, inner)) : s.name;
      drawText(s.x + 1 + Math.floor((inner - txt.length) / 2), s.y + Math.floor((s.h - 1) / 2), txt);
    }
  };
  // pass one: paint the interiors, so outlines and text are drawn over them
  for (const s of fig.shapes) {
    if (s.kind !== 'fill' && s.kind !== 'gradient') continue;
    const t = named(fig, s.of);
    if (!t) continue;
    const b = bbox([t]);
    if (!b) continue;
    for (let y = Math.floor(b.y0); y <= Math.ceil(b.y1); y++) for (let x = Math.floor(b.x0); x <= Math.ceil(b.x1); x++) {
      if (!inside(t, x, y)) continue;
      if (s.kind === 'fill') put(x, y, g.fill);
      else {
        const p = s.axis === 'y' ? (y - b.y0) / Math.max(1, b.y1 - b.y0) : (x - b.x0) / Math.max(1, b.x1 - b.x0);
        put(x, y, p < 0.5 ? g.fill : g.light);
      }
    }
  }
  // pass two: outlines and text, in document order
  for (const s of fig.shapes) {
    if (s.kind === 'rect') drawRect(s);
    else if (s.kind === 'line') drawLine(s.x1, s.y1, s.x2, s.y2);
    else if (s.kind === 'circle') drawEllipse(s.cx, s.cy, s.r, s.r);
    else if (s.kind === 'ellipse') drawEllipse(s.cx, s.cy, s.rx, s.ry);
    else if (s.kind === 'arc') drawEllipse(s.cx, s.cy, s.r, s.r, s.a1, s.a2);
    else if (s.kind === 'polyline') drawPoly(s.points, false);
    else if (s.kind === 'polygon' || s.kind === 'contour') drawPoly(s.points, true);
    else if (s.kind === 'path') {
      let start = null, cur = null;
      for (const k of s.cmds) {
        if (k.c === 'M') { start = cur = [k.x, k.y]; put(k.x, k.y, g.corner); }
        else if (k.c === 'L' && cur) { drawLine(...cur, k.x, k.y); cur = [k.x, k.y]; }
        else if (k.c === 'Z' && cur && start) { drawLine(...cur, ...start); cur = start; }
      }
    } else if (TEXTUAL.has(s.kind)) drawText(s.x, s.y, s.text);
    else if (s.kind === 'measure') {
      const horiz = s.y1 === s.y2;
      drawLine(s.x1, s.y1, s.x2, s.y2, horiz ? g.h : g.v);
      put(s.x1, s.y1, horiz ? g.v : g.h); put(s.x2, s.y2, horiz ? g.v : g.h);
      const txt = ` ${s.value} ${s.unit} `.trim();
      if (horiz) { const len = Math.abs(s.x2 - s.x1) + 1; if (txt.length <= len - 2) drawText(Math.min(s.x1, s.x2) + Math.floor((len - txt.length) / 2), s.y1, txt); }
      else {
        const len = Math.abs(s.y2 - s.y1) + 1;
        const y0 = Math.min(s.y1, s.y2) + Math.floor(len / 2);
        // beside the rule, to the right when there is room and to the left otherwise
        const x0 = s.x1 + 1 + txt.length <= fig.grid.cols ? s.x1 + 1 : s.x1 - 1 - txt.length;
        drawText(x0, y0, txt);
      }
    } else if (s.kind === 'extrude') {
      for (const r of fig.shapes.filter((k) => inGroup(k, s.of) && k.kind === 'rect')) {
        const o = { ...r, x: r.x + s.depth, y: r.y - s.depth, name: '' };
        drawRect(o);
        const joins = [[r.x, r.y, o.x, o.y], [r.x + r.w - 1, r.y, o.x + o.w - 1, o.y], [r.x + r.w - 1, r.y + r.h - 1, o.x + o.w - 1, o.y + o.h - 1]];
        for (const j of joins) drawLine(...j, g.diag);
        // the joins start and end on corners; the corners stay corners
        for (const [x1, y1, x2, y2] of joins) { put(x1, y1, g.corner); put(x2, y2, g.corner); }
      }
    }
    // stroke, transform, rotate3d, group and layer draw nothing of their own:
    // the outline is the stroke, the moved shape is the transform
  }
  return rows.map((r) => r.join('').replace(/\s+$/, '')).join('\n');
}

// ---------- the svg renderer ----------
const THEME = {
  light: { ground: '#ffffff', ink: '#1a1d24', dim: '#5b6472', box: '#2b5fd9', measured: '#2b5fd9', proposed: '#b8860b', changed: '#c0392b' },
  dark: { ground: '#0f1117', ink: '#e6e9ef', dim: '#9aa3b2', box: '#7aa2f7', measured: '#7aa2f7', proposed: '#e5c07b', changed: '#f7768e' },
};
const BAND_TOKEN = { surveyor: 'measured', architect: 'proposed', renovator: 'changed', generator: 'ink' };

export function renderSvg(fig, theme = 'light', c = contract()) {
  const T = THEME[theme === 'dark' ? 'dark' : 'light'];
  const W = fig.grid.cols * c.cell.w, H = fig.grid.rows * c.cell.h;
  const cx = (x) => x * c.cell.w, cy = (y) => y * c.cell.h;
  const mid = (x) => cx(x) + c.cell.w / 2, midy = (y) => cy(y) + c.cell.h / 2;
  // paint is collected first, so a shape can be emitted with its own paint
  const fills = new Map(), strokes = new Map(), grads = new Map();
  fig.shapes.forEach((s, i) => {
    if (s.kind === 'fill') fills.set(s.of, T[s.colour] || T.ink);
    if (s.kind === 'stroke') strokes.set(s.of, { colour: T[s.colour] || T.ink, width: s.width });
    if (s.kind === 'gradient') grads.set(s.of, { id: `grad${i}`, from: T[s.from] || T.ink, to: T[s.to] || T.ink, axis: s.axis });
  });
  const paintOf = (s, base) => {
    const st = strokes.get(s.name);
    const fillCol = grads.has(s.name) ? `url(#${grads.get(s.name).id})` : fills.get(s.name) || 'none';
    const bandCol = s.band && BAND_TOKEN[s.band] ? T[BAND_TOKEN[s.band]] : null;
    return `fill="${fillCol}" stroke="${st ? st.colour : bandCol || base}" stroke-width="${st ? st.width : 1.5}"`;
  };
  const S = [];
  S.push('<?xml version="1.0" encoding="UTF-8"?>');
  S.push('<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->');
  S.push('<!-- Copyright 2026 Saimonokuma. GENERATED by lib/figure.mjs from one figure element; the character grid is the bound (LAW.FIG.2). -->');
  S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,DejaVu Sans Mono,monospace" font-size="${c.cell.h - 4}" data-grid="${fig.grid.cols}x${fig.grid.rows}" data-mark="${esc(fig.mark)}"${fig.seed ? ` data-seed="${esc(fig.seed)}"` : ''}>`);
  if (fig.title) S.push(`<title>${esc(fig.title)}</title>`);
  if (grads.size) {
    S.push('<defs>');
    for (const [, gr] of grads) S.push(`<linearGradient id="${gr.id}" x1="0" y1="0" x2="${gr.axis === 'y' ? 0 : 1}" y2="${gr.axis === 'y' ? 1 : 0}"><stop offset="0" stop-color="${gr.from}"/><stop offset="1" stop-color="${gr.to}"/></linearGradient>`);
    S.push('</defs>');
  }
  S.push(`<rect width="${W}" height="${H}" fill="${T.ground}"/>`);
  const pts = (arr) => arr.map(([x, y]) => `${mid(x)},${midy(y)}`).join(' ');
  let open = 0;
  const closeTo = (depth) => { while (open > depth) { S.push('</g>'); open--; } };
  for (const s of fig.shapes) {
    closeTo(s.chain.length);
    if (s.kind === 'rect') {
      S.push(`<rect data-shape="rect" x="${cx(s.x) + 1}" y="${cy(s.y) + 1}" width="${s.w * c.cell.w - 2}" height="${s.h * c.cell.h - 2}" rx="3" ${paintOf(s, T.box)}/>`);
      if (s.name) S.push(`<text x="${cx(s.x) + (s.w * c.cell.w) / 2}" y="${cy(s.y) + (s.h * c.cell.h) / 2 + 4}" text-anchor="middle" fill="${T.ink}">${esc(s.name)}</text>`);
    } else if (s.kind === 'line') S.push(`<line data-shape="line" x1="${mid(s.x1)}" y1="${midy(s.y1)}" x2="${mid(s.x2)}" y2="${midy(s.y2)}" stroke="${s.band && BAND_TOKEN[s.band] ? T[BAND_TOKEN[s.band]] : T.dim}" stroke-width="1.2"/>`);
    else if (s.kind === 'circle') S.push(`<circle data-shape="circle" cx="${mid(s.cx)}" cy="${midy(s.cy)}" r="${s.r * c.cell.w}" ${paintOf(s, T.box)}/>`);
    else if (s.kind === 'ellipse') S.push(`<ellipse data-shape="ellipse" cx="${mid(s.cx)}" cy="${midy(s.cy)}" rx="${s.rx * c.cell.w}" ry="${s.ry * c.cell.h}" ${paintOf(s, T.box)}/>`);
    else if (s.kind === 'arc') {
      const a1 = deg(s.a1), a2 = deg(s.a2 <= s.a1 ? s.a2 + 360 : s.a2);
      const x1 = mid(s.cx) + s.r * c.cell.w * Math.cos(a1), y1 = midy(s.cy) - s.r * c.cell.h * Math.sin(a1);
      const x2 = mid(s.cx) + s.r * c.cell.w * Math.cos(a2), y2 = midy(s.cy) - s.r * c.cell.h * Math.sin(a2);
      const large = a2 - a1 > Math.PI ? 1 : 0;
      S.push(`<path data-shape="arc" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${s.r * c.cell.w} ${s.r * c.cell.h} 0 ${large} 0 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${T.box}" stroke-width="1.5"/>`);
    } else if (s.kind === 'polyline') S.push(`<polyline data-shape="polyline" points="${pts(s.points)}" fill="none" stroke="${T.dim}" stroke-width="1.2"/>`);
    else if (s.kind === 'polygon') S.push(`<polygon data-shape="polygon" points="${pts(s.points)}" ${paintOf(s, T.box)}/>`);
    else if (s.kind === 'contour') S.push(`<polygon data-shape="contour" data-source="${esc(s.source)}" points="${pts(s.points)}" fill="none" stroke="${T.changed}" stroke-width="1.2" stroke-dasharray="4 2"/>`);
    else if (s.kind === 'path') {
      const d = s.cmds.map((k) => (k.c === 'Z' ? 'Z' : `${k.c} ${mid(k.x)} ${midy(k.y)}`)).join(' ');
      S.push(`<path data-shape="path" d="${d}" fill="none" stroke="${T.box}" stroke-width="1.5"/>`);
    } else if (s.kind === 'label') S.push(`<text data-shape="label" x="${cx(s.x)}" y="${cy(s.y) + c.cell.h - 4}" fill="${T.ink}">${esc(s.text)}</text>`);
    else if (s.kind === 'text') S.push(`<text data-shape="text" data-role="${esc(s.role)}" x="${cx(s.x)}" y="${cy(s.y) + c.cell.h - 4}" fill="${T.ink}" textLength="${s.text.length * c.cell.w}" lengthAdjust="spacingAndGlyphs">${esc(s.text)}</text>`);
    else if (s.kind === 'fill') S.push(`<g data-shape="fill" data-of="${esc(s.of)}" data-colour="${esc(s.colour)}"/>`);
    else if (s.kind === 'stroke') S.push(`<g data-shape="stroke" data-of="${esc(s.of)}" data-colour="${esc(s.colour)}"/>`);
    else if (s.kind === 'gradient') S.push(`<g data-shape="gradient" data-of="${esc(s.of)}" data-from="${esc(s.from)}" data-to="${esc(s.to)}"/>`);
    else if (s.kind === 'transform') S.push(`<g data-shape="transform" data-of="${esc(s.of)}" data-kind="${esc(s.tkind)}" data-args="${s.args.join(' ')}" data-applied="${s.applied || 0}"/>`);
    else if (s.kind === 'rotate3d') S.push(`<g data-shape="rotate3d" data-of="${esc(s.of)}" data-axis="${s.axis}" data-degrees="${s.degrees}" data-applied="${s.applied || 0}"/>`);
    else if (s.kind === 'measure') {
      const horiz = s.y1 === s.y2;
      S.push(`<g data-shape="measure" data-value="${esc(s.value)}" data-unit="${esc(s.unit)}">`);
      S.push(`<line x1="${mid(s.x1)}" y1="${midy(s.y1)}" x2="${mid(s.x2)}" y2="${midy(s.y2)}" stroke="${T.measured}" stroke-width="1"/>`);
      const tick = horiz ? (x, y) => `<line x1="${mid(x)}" y1="${midy(y) - 5}" x2="${mid(x)}" y2="${midy(y) + 5}" stroke="${T.measured}" stroke-width="1"/>` : (x, y) => `<line x1="${mid(x) - 5}" y1="${midy(y)}" x2="${mid(x) + 5}" y2="${midy(y)}" stroke="${T.measured}" stroke-width="1"/>`;
      S.push(tick(s.x1, s.y1)); S.push(tick(s.x2, s.y2));
      S.push(`<text x="${(mid(s.x1) + mid(s.x2)) / 2 + (horiz ? 0 : c.cell.w)}" y="${(midy(s.y1) + midy(s.y2)) / 2 - (horiz ? 3 : -4)}" text-anchor="${horiz ? 'middle' : 'start'}" fill="${T.measured}">${esc(`${s.value} ${s.unit}`)}</text>`);
      S.push('</g>');
    } else if (s.kind === 'extrude') {
      S.push(`<g data-shape="extrude" data-of="${esc(s.of)}" data-depth="${s.depth}">`);
      for (const r of fig.shapes.filter((k) => inGroup(k, s.of) && k.kind === 'rect')) {
        const dx = s.depth * c.cell.w, dy = -s.depth * c.cell.h;
        S.push(`<rect x="${cx(r.x) + 1 + dx}" y="${cy(r.y) + 1 + dy}" width="${r.w * c.cell.w - 2}" height="${r.h * c.cell.h - 2}" rx="3" fill="none" stroke="${T.proposed}" stroke-width="1"/>`);
        for (const [px, py] of [[r.x, r.y], [r.x + r.w - 1, r.y], [r.x + r.w - 1, r.y + r.h - 1]]) S.push(`<line x1="${mid(px)}" y1="${midy(py)}" x2="${mid(px) + dx}" y2="${midy(py) + dy}" stroke="${T.proposed}" stroke-width="1"/>`);
      }
      S.push('</g>');
    } else if (s.kind === 'group') { S.push(`<g data-shape="group" data-name="${esc(s.name)}">`); open++; }
    else if (s.kind === 'layer') { S.push(`<g data-shape="layer" data-name="${esc(s.name)}" data-band="${esc(s.lband)}" stroke="${T[BAND_TOKEN[s.lband] || 'ink']}">`); open++; }
  }
  closeTo(0);
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
    if (STRUCTURAL.has(s.kind)) { out.push(s.kind); continue; }
    if (s.kind === 'rect') { if (at(s.x, s.y) === c.glyph.corner && at(s.x + s.w - 1, s.y + s.h - 1) === c.glyph.corner) out.push('rect'); continue; }
    if (TEXTUAL.has(s.kind)) { if ((rows[s.y] || '').slice(s.x, s.x + s.text.length) === s.text || !s.text) out.push(s.kind); continue; }
    if (s.kind === 'fill' || s.kind === 'gradient') {
      const a = anchor(s, fig);
      if (a && (at(...a) === c.glyph.fill || at(...a) === c.glyph.light)) out.push(s.kind);
      continue;
    }
    if (s.kind === 'measure') { if (at(s.x1, s.y1) !== ' ' && at(s.x2, s.y2) !== ' ' && rows.some((r) => r.includes(`${s.value} ${s.unit}`) || r.includes(String(s.value)))) out.push('measure'); continue; }
    if (s.kind === 'stroke') { const t = named(fig, s.of); const a = t ? anchor(t, fig) : null; if (a && at(...a) !== ' ') out.push('stroke'); continue; }
    const a = anchor(s, fig);
    if (a && at(...a) !== ' ') out.push(s.kind);
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

// Up to FIG.thumbnails.max figures side by side inside one cut preview: the
// gate renders four character thumbnails and choosing a layout becomes
// looking at four shapes. Each thumbnail is its share of the columns, and a
// thumbnail that does not fit its share is refused, never cut (LAW.FIG.8).
export function thumbnails(figs, c = contract()) {
  if (figs.length < 1 || figs.length > c.thumbnailsMax) throw new Error(`one to ${c.thumbnailsMax} thumbnails (LAW.FIG.8)`);
  const w = Math.floor((c.cut.cols - (figs.length - 1)) / figs.length);
  const cols = figs.map((f, i) => {
    if (f.grid.cols > w || f.grid.rows > c.cut.rows) throw new Error(`thumbnail ${i + 1} is ${f.grid.cols}x${f.grid.rows} and its share is ${w}x${c.cut.rows}; refused, never cut (LAW.FIG.8)`);
    return renderCells(f, c).split('\n').map((l) => l.padEnd(w));
  });
  const out = [];
  for (let y = 0; y < c.cut.rows; y++) out.push(cols.map((rows) => rows[y] || ' '.repeat(w)).join(' ').replace(/\s+$/, ''));
  return out.join('\n');
}

// One plate from up to four figures, each wrapped in a layer of its band, so
// the survey, the plan and the change are three layers of one figure and
// never three figures (LAW.FIG.7). The grid is the largest of the inputs.
export function overlay(layers, { title = '', mark = 'guessed' } = {}) {
  if (!layers.length) throw new Error('an overlay needs at least one layer');
  const figs = layers.map((l) => l.fig || parse(l.xml));
  const cols = Math.max(...figs.map((f) => f.grid.cols)), rows = Math.max(...figs.map((f) => f.grid.rows));
  const body = layers.map((l) => {
    const inner = /<figure\b[^>]*>([\s\S]*?)<\/figure>/.exec(l.xml);
    return `<layer name="${esc(l.name || l.band)}" band="${esc(l.band)}">${inner ? inner[1] : ''}</layer>`;
  }).join('');
  return `<figure grid="${cols}x${rows}" mark="${mark}"${title ? ` title="${esc(title)}"` : ''}>${body}</figure>`;
}

// The figure carried out of the intake into the artifact (LAW.FIG.6): the
// same element with its seed attribute naming the option it was chosen from.
// The mark is the caller's to raise, and only when every shape was drawn from
// something the run read; this function never raises it.
export function seed(xml, option) {
  if (!option) throw new Error('a seed names the option it was chosen from');
  const s = String(xml).replace(/\sseed="[^"]*"/, '');
  return s.replace(/<figure\b/, `<figure seed="${esc(option)}"`);
}

// ---------- controls ----------
export function controls(io = console) {
  let ran = 0;
  let fail = 0;
  const say = (ok, text) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) fail++; };
  const c = contract();
  say(c.shapes.length === c.shapesCount && c.shapes.length === 20 && c.shapes.slice(0, 4).join('|') === 'rect|line|label|group', `the shapes are ${c.shapesCount}, the four of 8.0.0 first: ${c.shapes.join(', ')}`);
  say(c.modules.length === c.shapesCount && c.modules.every((m) => m.keyword === 'INCLUDE') && c.modules.map((m) => m.shape).join('|') === c.shapes.join('|'), 'every shape is a module, INCLUDE by default, in the order of FIG.shapes');
  const grouped = Object.values(c.groups).flat();
  say(grouped.length === c.shapesCount && new Set(grouped).size === c.shapesCount && c.shapes.every((s) => grouped.includes(s)), `the seven groups partition the twenty shapes: ${Object.entries(c.groups).map(([g, l]) => `${g}=${l.length}`).join(' ')}`);
  say(c.groups.surveyor.join() === 'measure' && c.groups.architect.join() === 'extrude,rotate3d' && c.groups.renovator.join() === 'contour', 'three groups belong to one profession each: measure, extrude and rotate3d, contour');
  say(c.laws.length === 8 && c.laws.every((k, i) => k === `LAW.FIG.${i + 1}`), `LAW.FIG.1 to ${c.laws.length}, dense and ascending`);
  say(c.cut.cols === 60 && c.cut.rows === 3 && c.expanded.cols === 80 && c.expanded.rows === 12, `the canvas is the widget's: cut ${c.cut.cols}x${c.cut.rows}, expanded ${c.expanded.cols}x${c.expanded.rows}`);
  say(Object.keys(c.glyph).length === 7 && Object.values(c.glyph).every((g) => g.length === 1 && g.charCodeAt(0) >= 32 && g.charCodeAt(0) < 127), `every one of the seven glyphs is one printable ASCII character: ${Object.values(c.glyph).join(' ')}`);

  // the 8.0.0 figure still renders as it did
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
  const blank = check(fig, ' '.repeat(60) + '\n\n', svg, c);
  say(!blank.ok && /the cells carry \[\]/.test(blank.findings[0]), `trip: a cells rendering that carries none of the shapes is refused: ${blank.findings[0]}`);
  const measured = validate(parse('<figure grid="60x3" mark="measured"><rect x="0" y="0" w="2" h="2"/></figure>'), 'cut', c);
  say(!measured.ok && /LAW\.FIG\.4/.test(measured.refused[0]), `trip: a preview figure marked measured is refused: ${measured.refused[0]} (LAW.FIG.4)`);

  // the sixteen new shapes, every one drawn in cells and carried in svg
  const all = parse(`<figure grid="80x12" mark="measured" title="twenty">
    <layer name="what is" band="surveyor">
      <group name="g"><rect x="1" y="1" w="10" h="4" name="hall"/><circle cx="20" cy="3" r="2" name="well"/></group>
      <ellipse cx="34" cy="3" rx="6" ry="2" name="pond"/>
      <polyline points="44,1 50,4 56,1"/><polygon points="60,1 66,1 63,4" name="gable"/>
      <path d="M 70,1 L 76,1 L 76,4 Z"/><arc cx="6" cy="9" r="2" a1="0" a2="180"/>
      <line x1="11" y1="2" x2="17" y2="2"/><label x="40" y="11">what was measured</label>
      <text x="12" y="8" role="plate">Hall of Measures</text>
      <measure x1="1" y1="6" x2="10" y2="6" value="10" unit="cells"/>
      <measure x1="78" y1="1" x2="78" y2="10" value="9" unit="rows"/>
    </layer>
    <layer name="proposed" band="architect">
      <group name="tower"><rect x="30" y="7" w="8" h="4" name="tower"/></group>
      <extrude of="tower" depth="2"/>
      <group name="wing"><rect x="50" y="7" w="8" h="4"/></group><rotate3d of="wing" axis="y" degrees="60"/>
      <group name="shed"><rect x="62" y="7" w="6" h="3"/></group><transform of="shed" kind="translate" args="2 0"/>
    </layer>
    <layer name="changed" band="renovator">
      <contour source="plan.png" points="12,9 20,9 16,11" tolerance="1"/>
      <fill of="hall" colour="measured"/><stroke of="well" colour="changed" width="2"/><gradient of="pond" from="measured" to="proposed" axis="x"/>
    </layer>
  </figure>`);
  const kinds = new Set(all.shapes.map((s) => s.kind));
  say(kinds.size === 20 && c.shapes.every((s) => kinds.has(s)), `one figure carries all twenty shapes: ${[...kinds].join(', ')}`);
  const vAll = validate(all, 'artifact', c);
  say(vAll.ok, `the twenty-shape figure is valid as an artifact: ${vAll.refused.join('; ') || 'no refusal'}`);
  const cAll = renderCells(all, c), sAll = renderSvg(all, 'light', c);
  const chkAll = check(all, cAll, sAll, c);
  say(chkAll.ok, `cells and svg agree on all twenty, in order: ${chkAll.findings.join('; ') || 'no finding'} (LAW.FIG.3)\n        ${cAll.split('\n').join('\n        ')}`);
  say((sAll.match(/<g data-shape="layer"/g) || []).length === 3 && /data-band="surveyor"/.test(sAll) && /data-band="architect"/.test(sAll) && /data-band="renovator"/.test(sAll), 'the plate carries three layers, one per band, each coloured by its band (LAW.FIG.7)');
  const shed = all.shapes.find((s) => s.kind === 'rect' && s.group === 'shed');
  say(shed.x === 64, `a translate of 2 moved the shed's rect from 62 to ${shed.x} before either renderer drew it (LAW.FIG.3)`);
  const wing = all.shapes.find((s) => s.kind === 'rect' && s.group === 'wing');
  say(wing.w === 4 || wing.w === 5, `rotate3d about y by 60 degrees foreshortened the wing from 8 cells to ${wing.w}, the cosine (rung 70)`);
  say(cAll.split('\n')[6].includes('10 cells') && /9 rows/.test(cAll), 'the two dimension lines carry their value and unit on the rule, the vertical one written to the left because the right edge has no room (the surveyor\'s shape)');
  say(/::/.test(cAll.split('\n')[2]) && /\.\./.test(cAll.split('\n')[3]), 'a fill paints the hall dense and the gradient passes from dense to light across the pond');
  const fill = all.shapes.find((s) => s.kind === 'fill');
  say(anchor(fill, all) && fill.of === 'hall', 'a paint shape is recognised in cells by the centre of what it paints');

  // refusals of the new laws, each by name
  const curve = validate(parse('<figure grid="60x3"><path d="M 1,1 C 5,0 9,0 12,1"/></figure>'), 'cut', c);
  say(!curve.ok && /carries the command C.*LAW\.FIG\.2/.test(curve.refused[0]), `trip: a path with a curve command is refused, a shape the cells cannot carry: ${curve.refused[0]}`);
  const noInterior = validate(parse('<figure grid="60x3"><line x1="1" y1="1" x2="9" y2="1"/><fill of="x" colour="ink"/></figure>'), 'cut', c);
  say(!noInterior.ok && /names no shape/.test(noInterior.refused[0]), `trip: a fill of a name no shape carries is refused: ${noInterior.refused[0]}`);
  const badColour = validate(parse('<figure grid="60x3"><rect x="0" y="0" w="4" h="3" name="r"/><fill of="r" colour="#ff0000"/></figure>'), 'cut', c);
  say(!badColour.ok && /not a token of/.test(badColour.refused[0]), `trip: a hex colour is refused, a token is the only colour the two renderers share: ${badColour.refused[0]}`);
  const twoLayers = validate(parse('<figure grid="60x3"><layer name="a" band="surveyor"/><layer name="b" band="surveyor"/></figure>'), 'cut', c);
  say(!twoLayers.ok && /second layer of the band surveyor.*LAW\.FIG\.7/.test(twoLayers.refused[0]), `trip: two layers of one band on one plate are refused: ${twoLayers.refused[0]}`);
  const badBand = validate(parse('<figure grid="60x3"><layer name="a" band="painter"/></figure>'), 'cut', c);
  say(!badBand.ok && /band "painter".*LAW\.FIG\.7/.test(badBand.refused[0]), `trip: a layer of a band the grammar does not declare is refused: ${badBand.refused[0]}`);
  const slant = validate(parse('<figure grid="60x3"><measure x1="1" y1="0" x2="9" y2="2" value="1" unit="x"/></figure>'), 'cut', c);
  say(!slant.ok && /neither horizontal nor vertical/.test(slant.refused[0]), `trip: a slanted dimension line is refused: ${slant.refused[0]}`);

  // LAW.FIG.6: the seed
  const seeded = seed('<figure grid="60x3" mark="guessed"><rect x="0" y="0" w="4" h="3"/></figure>', 'Four domain bands');
  const sf = parse(seeded);
  say(sf.seed === 'Four domain bands' && sf.mark === 'guessed' && sf.shapes.length === 1, `a figure carried out of the intake keeps its shapes and names its option: seed=${JSON.stringify(sf.seed)}, still guessed (LAW.FIG.6)`);
  let noSeed = '';
  try { seed(seeded, ''); } catch (e) { noSeed = e.message; }
  say(/names the option/.test(noSeed), `trip: a seed with no option is refused: ${noSeed}`);
  say(/data-seed="Four domain bands"/.test(renderSvg(sf, 'light', c)), 'the plate carries the seed it came from');

  // LAW.FIG.8: thumbnails
  const four = thumbnails([fig, fig, fig, fig].map(() => parse('<figure grid="14x3"><rect x="0" y="0" w="6" h="3" name="a"/><circle cx="10" cy="1" r="1"/></figure>')), c).split('\n');
  say(four.length === 3 && four.every((l) => l.length <= 60) && (four[0].match(/\+/g) || []).length === 8, `four thumbnails sit side by side inside one cut preview, ${four[0].length} columns of ${c.cut.cols}: ${four[0]}`);
  let five = '';
  try { thumbnails([fig, fig, fig, fig, fig], c); } catch (e) { five = e.message; }
  say(/one to 4 thumbnails/.test(five), `trip: a fifth thumbnail is refused by the declared maximum: ${five}`);
  let tooWide = '';
  try { thumbnails([fig, fig], c); } catch (e) { tooWide = e.message; }
  say(/is 60x3 and its share is 29x3.*never cut/.test(tooWide), `trip: a thumbnail wider than its share is refused, never cut: ${tooWide}`);
  say(!/[─-╿]/.test(cAll) && !/[─-╿]/.test(four.join('')), 'no box-drawing character anywhere in a cells rendering');

  // overlay: three figures become three layers of one
  const ov = parse(overlay([
    { band: 'surveyor', name: 'survey', xml: '<figure grid="40x3"><rect x="0" y="0" w="6" h="3" name="a"/></figure>' },
    { band: 'architect', name: 'plan', xml: '<figure grid="40x3"><rect x="8" y="0" w="6" h="3" name="b"/></figure>' },
    { band: 'renovator', name: 'change', xml: '<figure grid="60x3"><line x1="6" y1="1" x2="7" y2="1"/></figure>' },
  ], { title: 'one plate' }));
  say(ov.grid.cols === 60 && ov.shapes.filter((s) => s.kind === 'layer').length === 3 && validate(ov, 'artifact', c).ok && ov.shapes.find((s) => s.name === 'b').band === 'architect',
    'three figures overlay into one of three layers, the grid the largest of the three, each shape knowing its band (LAW.FIG.7)');

  // LAW.FIG.5: the driver. A command that declares fig.rect.module IGNORE
  // before the include gets a grammar with no rect, through the resolver
  // every command already builds with.
  const base = join(ROOT, 'dtd');
  const on = resolveSubset('<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;', base).text;
  const off = resolveSubset('<!ENTITY % fig.rect.module "IGNORE">\n<!ENTITY % fig.content "line | label | group">\n<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;', base).text;
  say(/<!ELEMENT rect EMPTY>/.test(on) && /<!ELEMENT figure \(rect \| line \| label \| group \| circle/.test(on) && (on.match(/<!ELEMENT /g) || []).length === 21,
    'with the default driver the resolved grammar declares all twenty shapes and figure admits them');
  say(!/<!ELEMENT rect/.test(off) && /<!ELEMENT figure \(line \| label \| group\)\*>/.test(off) && /<!ELEMENT line EMPTY>/.test(off),
    'trip: fig.rect.module IGNORE declared before the include removes rect from the resolved grammar and figure no longer admits it (LAW.FIG.5)');
  const noPaint = resolveSubset('<!ENTITY % fig.fill.module "IGNORE">\n<!ENTITY % fig.gradient.module "IGNORE">\n<!ENTITY % fig.stroke.module "IGNORE">\n<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;', base).text;
  say(!/<!ELEMENT fill/.test(noPaint) && !/<!ELEMENT gradient/.test(noPaint) && /<!ELEMENT contour/.test(noPaint), 'the whole paint group switches off in three declarations and the other seventeen stay');
  const renamed = resolveSubset('<!ENTITY % fig.n.rect "box">\n<!ENTITY % fig.content "box | line | label | group">\n<!ENTITY % cc-figure SYSTEM "cc-figure.dtd">\n%cc-figure;', base).text;
  say(/<!ELEMENT box EMPTY>/.test(renamed) && !/<!ELEMENT rect/.test(renamed), 'the element name is a parameter entity: a command renames rect to box before the include, as TEI renames n.abbr');

  io.log(`figure controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [verb, a, b] = process.argv.slice(2);
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
  if (verb === 'write' && a && b) {
    const fig = parse(readFileSync(a, 'utf8'));
    const v = validate(fig, 'artifact');
    if (!v.ok) { for (const r of v.refused) console.log(`  REFUSED ${r}`); process.exit(1); }
    const r = render(fig);
    writeFileSync(b, r.svg, 'utf8');
    console.log(r.cells);
    console.log(`wrote ${b}`);
    process.exit(0);
  }
  console.log('usage: node lib/figure.mjs render <figure.xml> [cut|expanded|artifact] | write <figure.xml> <out.svg> | controls');
}
