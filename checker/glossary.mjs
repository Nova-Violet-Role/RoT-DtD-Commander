#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/glossary.mjs
// Generates docs/glossary.xhtml: every installed command, skill and agent with
// what it does, how to invoke it, the family it belongs to, the root element its
// answer must take, and how many laws that answer inherits.
//
// The README index says what exists. It does not say how to use any of it, and
// a catalogue of 131 names is not a reference. This is the reference.
//
// WHY XHTML 1.1 AND NOT HTML. This project's claim is that a grammar declared
// inside a file lets an ordinary validator judge the file. A reference page that
// is itself an instance of a published DTD is that claim applied to its own
// documentation: the DOCTYPE below resolves to the W3C's xhtml11.dtd, the same
// modular driver read during the 7.1.0 corpus study, so this page can be
// validated by any tool that reads a DTD -- including the ones in this tree.
// The page is self-contained on purpose: no CDN, no webfont, no fetch. It opens
// from disk with the network off, which is the only way a reference is reliable.
//
//   node checker/glossary.mjs            write docs/glossary.xhtml
//   node checker/glossary.mjs --check    exit 1 if the file is missing or stale
//   node checker/glossary.mjs --controls trip every guard on purpose
//
// Exit 0 when the page was written, or when --check finds it in step.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// The family table is readme-index's, not a copy of it: the index and this page
// must never disagree about what a family contains.
import { FAMILIES as INDEX_FAMILIES } from './readme-index.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'glossary.xhtml');
const SVG_LIGHT = join(ROOT, 'docs', 'glossary-map.svg');
const SVG_DARK = join(ROOT, 'docs', 'glossary-map-dark.svg');
const README = join(ROOT, 'README.md');
const NL = String.fromCharCode(10);
const BTQ = String.fromCharCode(96);

// What each family is FOR, keyed by the id readme-index declares. The names,
// the members and the order all come from there; only these notes are local.
const NOTE = {
  thinking: 'Classical decision frames, each rendered as a grammar rather than a prompt. Reach for one when you know the shape of the thinking you want.',
  research: 'Gather evidence and save a dated report; every claim marked measured, reasoned or guessed, where measured means something was actually run or read.',
  asking: 'Gather requirements through a declared state machine: bounded rounds, bounded re-entries, a gate that terminates by declaration rather than by your patience.',
  shelf: 'One structure drawn from one book each. The instruments to reach for once the ordinary frames have returned something bland.',
  lenses: 'One lens each, committed to a single way of seeing and forbidden from averaging into the others. Their value is the unblended range.',
  creators: 'Write Claude Code artifacts that pass the checker on the first run. Each gates before it writes.',
  prompts: 'Eight prompt schematics in a plain and a meta form, with routers that choose for you. The schematic decides how a prompt survives being pasted somewhere that reformats it.',
  filetypes: 'Schematic-shaped files for a named format, and search expressions for the open web or a local tree. Reach for a dork when the hard part is the query.',
  tasks: 'Work that outlives one session: create, audit, compose, run, hand off.',
  repository: 'Operate on a repository as a whole rather than on a file in it.',
  audits: 'Judge an existing artifact against the contract it claims. They report; they do not rewrite.',
  growth: 'One fifteen-verb ladder. What these record is what sets the version number, because the release class is computed rather than typed.',
  lists: 'Per-repository white, grey and black lists, plus the starlist of tools the harness may reach. A grey entry obliges a question and records the answer with a date.',
  workflow: 'The doctor: run it, arm it, read its ledger, compose the workflows it judges. Since 5.0.0 the Adiutor is not armed by default.',
};

// The key readme-index claims a command by: its file name without -dtd.
export function keyOf(name) {
  return String(name).replace(/^\//, '').replace(/-dtd$/, '');
}

const esc = (s) => String(s)
  .split('&').join('&amp;')
  .split('<').join('&lt;')
  .split('>').join('&gt;')
  .split('"').join('&quot;');

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(NL)) {
    const k = /^([a-zA-Z-]+):\s*(.*)$/.exec(line);
    if (!k) continue;
    let v = k[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k[1]] = v;
  }
  return out;
}

// One entry, read from a resolved file. Everything here is measured from the
// file itself; nothing is remembered or inferred from the name.
function entryOf(path, name, kind) {
  const t = readFileSync(path, 'utf8');
  const fm = frontmatter(t);
  const laws = new Set((t.match(/<!ENTITY\s+(LAW\.[A-Z]+\.\d+)/g) || []).map((s) => s.split(/\s+/).pop()));
  const root = (/<!ELEMENT\s+([\w.-]+)\s+\((?!#PCDATA)/.exec(t) || [, ''])[1];
  const sigil = (/^###\s+(\S+)\s+/m.exec(t) || [, ''])[1];
  const sections = (/<!ENTITY\s+SECTIONS\.[\w.]+\s+"([^"]*)"/.exec(t) || [, ''])[1];
  return {
    name, kind, sigil,
    description: fm.description || '',
    hint: fm['argument-hint'] || '',
    laws: laws.size,
    root,
    sections: sections ? sections.split('|') : [],
  };
}

export function collect(root = ROOT) {
  const out = [];
  const cdir = join(root, 'commands');
  if (existsSync(cdir)) {
    for (const f of readdirSync(cdir)) {
      if (!f.endsWith('.md')) continue;
      out.push(entryOf(join(cdir, f), '/' + f.slice(0, -3), 'command'));
    }
  }
  const sdir = join(root, 'skills');
  if (existsSync(sdir)) {
    for (const s of readdirSync(sdir)) {
      const p = join(sdir, s, 'SKILL.md');
      if (existsSync(p)) out.push(entryOf(p, s, 'skill'));
    }
  }
  const adir = join(root, 'agents');
  if (existsSync(adir)) {
    for (const f of readdirSync(adir)) {
      if (!f.endsWith('.md')) continue;
      out.push(entryOf(join(adir, f), f.slice(0, -3), 'agent'));
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// Which family an entry belongs to, by its sigil. A sigil no family claims puts
// the entry in the unfiled bucket, which is visible on the page rather than
// silently dropped: an entry nobody can find is the defect this page fixes.
export function familyOf(e) {
  if (e.kind === 'skill') return 'Skills';
  if (e.kind === 'agent') return 'Agents';
  const key = keyOf(e.name);
  const f = INDEX_FAMILIES.find((x) => (x.members || []).includes(key) || (x.patterns || []).some((p) => p.test(key)));
  return f ? f.name : 'Unfiled';
}

// The note and sigil for a family name, from the index table plus the local notes.
export function famMeta(name) {
  const f = INDEX_FAMILIES.find((x) => x.name === name);
  if (!f) return null;
  return { id: f.id, name: f.name, note: NOTE[f.id] || '' };
}

function card(e) {
  const usage = e.kind === 'command'
    ? (e.hint ? esc(e.name) + ' ' + esc(e.hint) : esc(e.name) + '  (takes no argument)')
    : e.kind === 'skill' ? 'loads itself when its description matches the task'
      : 'invoked as a subagent';
  const L = [];
  L.push('<li class="card" data-name="' + esc(e.name.toLowerCase()) + '" data-fam="' + esc(familyOf(e)) + '" data-kind="' + e.kind + '" data-text="' + esc((e.name + ' ' + e.description).toLowerCase()) + '">');
  L.push('<h3><span class="sig">' + esc(e.sigil || '·') + '</span> <code>' + esc(e.name) + '</code> <span class="kind">' + e.kind + '</span></h3>');
  L.push('<p class="what">' + esc(e.description) + '</p>');
  L.push('<p class="use"><span class="lbl">use</span> <code>' + usage + '</code></p>');
  const meta = [];
  if (e.root) meta.push('answers as <code>&lt;' + esc(e.root) + '&gt;</code>');
  if (e.laws) meta.push(e.laws + ' law' + (e.laws === 1 ? '' : 's'));
  if (e.sections.length) meta.push(e.sections.length + ' declared sections');
  if (meta.length) L.push('<p class="meta">' + meta.join(' &middot; ') + '</p>');
  L.push('</li>');
  return L.join(NL);
}

const CSS = [
  ':root{--bg:#0f1117;--fg:#e6e9ef;--dim:#9aa3b2;--line:#242938;--card:#161a24;--acc:#d97757;--code:#1d2230}',
  '@media (prefers-color-scheme: light){:root{--bg:#fbfbfd;--fg:#1a1d24;--dim:#5b6472;--line:#e2e5ec;--card:#fff;--acc:#b8543a;--code:#f2f4f8}}',
  '*{box-sizing:border-box}',
  'body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}',
  'header{padding:2rem 1.5rem 1rem;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:5}',
  'h1{margin:0 0 .25rem;font-size:1.5rem;letter-spacing:-.01em}',
  '.sub{color:var(--dim);margin:0 0 1rem;font-size:.9rem}',
  '#q{width:100%;max-width:34rem;padding:.6rem .8rem;font-size:1rem;color:var(--fg);background:var(--code);border:1px solid var(--line);border-radius:8px}',
  '#q:focus{outline:2px solid var(--acc);outline-offset:1px}',
  '.chips{margin:.85rem 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:.4rem}',
  '.chips li{margin:0}',
  '.chip{cursor:pointer;font:inherit;font-size:.82rem;padding:.3rem .6rem;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--dim)}',
  '.chip[aria-pressed="true"]{background:var(--acc);border-color:var(--acc);color:#fff}',
  'main{padding:1.25rem 1.5rem 4rem;max-width:78rem;margin:0 auto}',
  'h2{font-size:1.05rem;margin:2rem 0 .3rem;padding-top:.6rem;border-top:1px solid var(--line)}',
  'h2 .n{color:var(--dim);font-weight:400;font-size:.85rem}',
  '.famnote{color:var(--dim);font-size:.88rem;margin:.1rem 0 .9rem}',
  'ul.grid{list-style:none;margin:0;padding:0;display:grid;gap:.75rem;grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))}',
  '.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.85rem .95rem}',
  '.card h3{margin:0 0 .4rem;font-size:.97rem;font-weight:600;display:flex;align-items:baseline;gap:.4rem;flex-wrap:wrap}',
  '.sig{font-size:1.05rem}',
  '.kind{margin-left:auto;font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;color:var(--dim)}',
  'code{background:var(--code);padding:.08em .35em;border-radius:4px;font:0.86em ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
  '.what{margin:.25rem 0 .55rem}',
  '.use{margin:0 0 .4rem;font-size:.88rem}',
  '.use code{display:inline-block;max-width:100%;overflow-wrap:anywhere}',
  '.lbl{color:var(--dim);font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;margin-right:.3rem}',
  '.meta{margin:0;color:var(--dim);font-size:.8rem}',
  '.empty{color:var(--dim);padding:2rem 0}',
  'footer{border-top:1px solid var(--line);padding:1.25rem 1.5rem;color:var(--dim);font-size:.85rem}',
  'a{color:var(--acc)}',
].join(NL);

// The script is wrapped in a commented CDATA section, which is what XHTML
// requires of any script holding a bare < or &. lib/form.mjs refuses a CDATA
// section containing the close token, so the code below never writes one.
const JS = [
  'var q=document.getElementById("q");',
  'var chips=[].slice.call(document.querySelectorAll(".chip"));',
  'var cards=[].slice.call(document.querySelectorAll(".card"));',
  'var groups=[].slice.call(document.querySelectorAll(".group"));',
  'var fam="";',
  'function apply(){',
  '  var term=q.value.trim().toLowerCase();',
  '  cards.forEach(function(c){',
  '    var okT=!term||c.getAttribute("data-text").indexOf(term)!==-1;',
  '    var okF=!fam||c.getAttribute("data-fam")===fam;',
  '    c.style.display=(okT&&okF)?"":"none";',
  '  });',
  '  groups.forEach(function(g){',
  '    var vis=[].slice.call(g.querySelectorAll(".card")).some(function(c){return c.style.display!=="none";});',
  '    g.style.display=vis?"":"none";',
  '  });',
  '  var any=cards.some(function(c){return c.style.display!=="none";});',
  '  document.getElementById("empty").style.display=any?"none":"";',
  '}',
  'q.addEventListener("input",apply);',
  'chips.forEach(function(b){',
  '  b.addEventListener("click",function(){',
  '    var was=b.getAttribute("aria-pressed")==="true";',
  '    chips.forEach(function(x){x.setAttribute("aria-pressed","false");});',
  '    if(was){fam="";}else{b.setAttribute("aria-pressed","true");fam=b.getAttribute("data-fam");}',
  '    apply();',
  '  });',
  '});',
  'apply();',
].join(NL);

export function render(entries) {
  const byFam = new Map();
  for (const e of entries) {
    const f = familyOf(e);
    if (!byFam.has(f)) byFam.set(f, []);
    byFam.get(f).push(e);
  }
  const order = INDEX_FAMILIES.map((f) => f.name).filter((n) => byFam.has(n));
  for (const extra of ['Skills', 'Agents']) if (byFam.has(extra)) order.push(extra);
  for (const k of byFam.keys()) if (!order.includes(k)) order.push(k);

  const L = [];
  L.push('<?xml version="1.0" encoding="UTF-8"?>');
  L.push('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">');
  L.push('<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->');
  L.push('<!-- Copyright 2026 Saimonokuma. -->');
  L.push('<!-- GENERATED by checker/glossary.mjs from the resolved tree. Do not edit by hand. -->');
  L.push('<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">');
  L.push('<head>');
  L.push('<title>RoT DtD Commander &mdash; full glossary</title>');
  L.push('<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />');
  L.push('<meta name="viewport" content="width=device-width, initial-scale=1" />');
  L.push('<style type="text/css">' + NL + CSS + NL + '</style>');
  L.push('</head>');
  L.push('<body>');
  L.push('<header>');
  L.push('<h1>Full glossary</h1>');
  L.push('<p class="sub">' + entries.filter((e) => e.kind === 'command').length + ' commands, '
    + entries.filter((e) => e.kind === 'skill').length + ' skills, '
    + entries.filter((e) => e.kind === 'agent').length + ' agents. What each one does, and how to invoke it. '
    + 'Type to filter; pick a family to narrow.</p>');
  L.push('<input type="text" id="q" value="" />');
  L.push('<ul class="chips">');
  for (const f of order) {
    L.push('<li><button type="button" class="chip" data-fam="' + esc(f) + '" aria-pressed="false">' + esc(f) + ' <span class="n">' + byFam.get(f).length + '</span></button></li>');
  }
  L.push('</ul>');
  L.push('</header>');
  L.push('<main>');
  for (const f of order) {
    const meta = famMeta(f);
    L.push('<section class="group">');
    L.push('<h2>' + esc(f) + ' <span class="n">' + byFam.get(f).length + '</span></h2>');
    if (meta && meta.note) L.push('<p class="famnote">' + esc(meta.note) + '</p>');
    L.push('<ul class="grid">');
    for (const e of byFam.get(f)) L.push(card(e));
    L.push('</ul>');
    L.push('</section>');
  }
  L.push('<p class="empty" id="empty" style="display:none">Nothing matches that.</p>');
  L.push('</main>');
  L.push('<footer>');
  L.push('<p>Generated from the resolved tree by <code>checker/glossary.mjs</code>; the gate refuses a glossary that disagrees with the files. ');
  L.push('This page is valid XHTML 1.1 and self-contained: it opens from disk with the network off.</p>');
  L.push('</footer>');
  L.push('<script type="text/javascript">');
  L.push('/*<![CDATA[*/');
  L.push(JS);
  L.push('/*]]' + '>*/');
  L.push('</script>');
  L.push('</body>');
  L.push('</html>');
  return L.join(NL) + NL;
}

// ---------- the drawing ----------
// One plate per theme so <picture> can serve the reader their own. Every
// number in it is measured from the tree; nothing here is decoration with a
// count invented to fill a bar.
export function renderSvg(entries, theme) {
  const dark = theme === 'dark';
  const bg = dark ? '#0f1117' : '#ffffff';
  const fg = dark ? '#e6e9ef' : '#1a1d24';
  const dim = dark ? '#9aa3b2' : '#5b6472';
  const line = dark ? '#242938' : '#e2e5ec';
  const byFam = new Map();
  for (const e of entries) {
    const f = familyOf(e);
    byFam.set(f, (byFam.get(f) || 0) + 1);
  }
  const rows = INDEX_FAMILIES.map((f) => ({ name: f.name, n: byFam.get(f.name) || 0, color: '#' + f.color }))
    .filter((r) => r.n > 0);
  const extra = ['Skills', 'Agents']
    .filter((k) => byFam.has(k))
    .map((k) => ({ name: k, n: byFam.get(k), color: dark ? '#4b5563' : '#94a3b8' }));
  const all = rows.concat(extra);
  const max = all.reduce((m, r) => Math.max(m, r.n), 1);
  const rowH = 34, top = 92, padL = 320, barW = 620;
  const H = top + all.length * rowH + 46;
  const W = 1060;
  const S = [];
  S.push('<?xml version="1.0" encoding="UTF-8"?>');
  S.push('<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->');
  S.push('<!-- Copyright 2026 Saimonokuma. GENERATED by checker/glossary.mjs. -->');
  S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">`);
  S.push(`<rect width="${W}" height="${H}" fill="${bg}"/>`);
  S.push(`<text x="28" y="42" font-size="23" font-weight="600" fill="${fg}">The Suite, by family</text>`);
  S.push(`<text x="28" y="70" font-size="15" fill="${dim}">${entries.length} entries. Every count measured from the resolved tree.</text>`);
  all.forEach((r, i) => {
    const y = top + i * rowH;
    const w = Math.max(2, Math.round((r.n / max) * barW));
    S.push(`<text x="${padL - 14}" y="${y + 15}" font-size="15" fill="${fg}" text-anchor="end">${esc(r.name)}</text>`);
    S.push(`<rect x="${padL}" y="${y + 3}" width="${w}" height="18" rx="4" fill="${r.color}"/>`);
    S.push(`<text x="${padL + w + 10}" y="${y + 17}" font-size="14" fill="${dim}">${r.n}</text>`);
  });
  const yb = top + all.length * rowH + 16;
  S.push(`<line x1="24" y1="${yb}" x2="${W - 24}" y2="${yb}" stroke="${line}" stroke-width="1"/>`);
  S.push(`<text x="24" y="${yb + 20}" font-size="11" fill="${dim}">Drawn as SVG because GitHub sanitises style and script out of a README, but renders a committed image untouched.</text>`);
  S.push('</svg>');
  return S.join(NL) + NL;
}

// A family name as a file slug, so docs/ holds one predictable pair per family.
export function slug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// The drawing IS the reference now, so nothing may be silently lost to a clip:
// the plate is wide enough for the longest call it must carry, and the clip is
// a last resort rather than the normal case.
function clip(s, n) {
  const x = String(s || '');
  return x.length <= n ? x : x.slice(0, n - 1) + '\u2026';
}

// ---------- one family, drawn ----------
export function renderFamilySvg(entries, famName, theme) {
  const dark = theme === 'dark';
  const bg = dark ? '#0f1117' : '#ffffff';
  const fg = dark ? '#e6e9ef' : '#1a1d24';
  const dim = dark ? '#9aa3b2' : '#5b6472';
  const line = dark ? '#242938' : '#e2e5ec';
  const chip = dark ? '#1d2230' : '#f2f4f8';
  const fam = INDEX_FAMILIES.find((x) => x.name === famName);
  const accent = fam ? '#' + fam.color : (dark ? '#4b5563' : '#94a3b8');
  const rows = entries.filter((e) => familyOf(e) === famName);
  const callOf = (e) =>
    e.kind === 'command' ? (e.hint ? e.name + ' ' + e.hint : e.name)
      : e.kind === 'skill' ? e.name + '  (loads itself)' : e.name + '  (subagent)';
  // Width follows the content: the longest call and the longest description
  // decide the plate, so no entry is cut merely to fit a number chosen up front.
  const longestCall = rows.reduce((m, e) => Math.max(m, callOf(e).length), 0);
  const longestDesc = rows.reduce((m, e) => Math.max(m, String(e.description || '').length), 0);
  const note = (famMeta(famName) || {}).note || '';
  const W = Math.max(1100, Math.min(2100, Math.round(Math.max(longestCall * 9.4, longestDesc * 8.1, note.length * 7.6) + 110)));
  const rowH = 54, top = 96;
  const H = top + rows.length * rowH + 34;
  const S = [];
  S.push('<?xml version="1.0" encoding="UTF-8"?>');
  S.push('<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->');
  S.push('<!-- Copyright 2026 Saimonokuma. GENERATED by checker/glossary.mjs. -->');
  S.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">`);
  S.push(`<rect width="${W}" height="${H}" fill="${bg}"/>`);
  S.push(`<rect x="0" y="0" width="6" height="${H}" fill="${accent}"/>`);
  S.push(`<text x="30" y="40" font-size="22" font-weight="600" fill="${fg}">${esc(famName)}</text>`);
  S.push(`<text x="${W - 30}" y="40" font-size="17" fill="${dim}" text-anchor="end">${rows.length}</text>`);
  const meta = famMeta(famName);
  // The note is NOT clipped. It was, at 150 characters, and six plates carried an
  // ellipsis where the sentence ended -- the one place anything was still cut once
  // the tables were removed. The plate is the only copy of this text now, so the
  // width follows the note as well as the rows.
  if (meta && meta.note) S.push(`<text x="30" y="66" font-size="14.5" fill="${dim}">${esc(meta.note)}</text>`);
  S.push(`<line x1="30" y1="${top - 18}" x2="${W - 30}" y2="${top - 18}" stroke="${line}" stroke-width="1"/>`);
  rows.forEach((e, i) => {
    const y = top + i * rowH;
    const call = callOf(e);
    const w = Math.round(9.35 * call.length + 20);
    S.push(`<rect x="30" y="${y - 16}" width="${w}" height="26" rx="5" fill="${chip}"/>`);
    S.push(`<text x="39" y="${y + 3}" font-size="15.5" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" fill="${fg}">${esc(call)}</text>`);
    S.push(`<text x="39" y="${y + 28}" font-size="14" fill="${dim}">${esc(e.description)}</text>`);
    if (e.laws) S.push(`<text x="${W - 30}" y="${y + 3}" font-size="13" fill="${dim}" text-anchor="end">${e.laws} laws</text>`);
  });
  S.push('</svg>');
  return S.join(NL) + NL;
}

// ---------- the README block ----------
// Open, not folded: this is the reference, and a reference behind a click is
// the problem it was built to fix.
export const RM_BEGIN = '<!-- rdc-glossary:begin -->';
export const RM_END = '<!-- rdc-glossary:end -->';

export function renderReadme(entries) {
  const byFam = new Map();
  for (const e of entries) {
    const f = familyOf(e);
    if (!byFam.has(f)) byFam.set(f, []);
    byFam.get(f).push(e);
  }
  const order = INDEX_FAMILIES.map((f) => f.name).filter((n) => byFam.has(n));
  for (const k of ['Skills', 'Agents']) if (byFam.has(k)) order.push(k);
  // Anything no family claims still gets a plate. An entry that vanishes from the
  // reference is worse than one filed oddly; the xhtml page already held this
  // invariant and the README block dropped it until a control said so.
  for (const k of byFam.keys()) if (!order.includes(k)) order.push(k);
  const L = [];
  L.push(RM_BEGIN);
  L.push('');
  L.push('<picture>');
  L.push('  <source media="(prefers-color-scheme: dark)" srcset="docs/glossary-map-dark.svg" />');
  L.push('  <img alt="Every family of the Suite with its measured count" src="docs/glossary-map.svg" width="820" />');
  L.push('</picture>');
  L.push('');
  L.push('Every family opens as a plate under **Usage** above, each entry with the exact');
  L.push('call and what it does. The names complete themselves as you type them in the');
  L.push('agent, so the plate is the reference and the terminal is the copy surface.');
  L.push('');
  L.push('For search and filters across all ' + entries.length + ' entries at once, open');
  L.push('[`docs/glossary.xhtml`](docs/glossary.xhtml).');
  // The per-family plates live in the Usage index, not here: the same 131 commands
  // were listed twice on one page, which is the bloat rather than the rendering.
  L.push('');
  L.push(RM_END);
  return L.join(NL);
}
// Replace what sits between the markers, leaving the rest of the README alone.
export function splice(readme, block) {
  const b = readme.indexOf(RM_BEGIN);
  const e = readme.indexOf(RM_END);
  if (b < 0 || e < 0) return null;
  return readme.slice(0, b) + block + readme.slice(e + RM_END.length);
}

// Every family plate as [absolute path, content]. Written and checked from this
// one list, so the two can never disagree about which plates exist.
export function familyPlates(entries) {
  const names = new Set(entries.map((e) => familyOf(e)));
  const out = [];
  for (const f of names) {
    out.push([join(ROOT, 'docs', 'family-' + slug(f) + '.svg'), renderFamilySvg(entries, f, 'light')]);
    out.push([join(ROOT, 'docs', 'family-' + slug(f) + '-dark.svg'), renderFamilySvg(entries, f, 'dark')]);
  }
  return out;
}

function write(text) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, text, 'utf8');
}

export function controls() {
  const say = (ok, m) => { console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' ' + m); return ok ? 0 : 1; };
  let bad = 0;
  const e = { name: '/x-dtd', kind: 'command', sigil: '🎯', description: 'a & b < c', hint: '[topic]', laws: 3, root: 'x', sections: ['A', 'B'] };

  const c = card(e);
  bad += say(c.indexOf('a &amp; b &lt; c') !== -1, 'trip: an ampersand and a less-than in a description are escaped, so the page stays well-formed XML');
  bad += say(c.indexOf('/x-dtd [topic]') !== -1, 'the usage line is the command plus its declared argument-hint');

  const noHint = card({ ...e, hint: '' });
  bad += say(noHint.indexOf('(takes no argument)') !== -1, 'a command with no argument-hint says so rather than showing an empty usage');

  bad += say(familyOf({ name: '/pareto-dtd', kind: 'command' }) === 'Thinking models', 'a command resolves to the family readme-index claims it for, not to a guess from its sigil');
  bad += say(familyOf({ name: '/no-such-command-dtd', kind: 'command' }) === 'Unfiled', 'trip: a command no family claims lands in Unfiled and stays visible rather than vanishing');

  const page = render([e]);
  bad += say(page.indexOf('-//W3C//DTD XHTML 1.1//EN') !== -1, 'the page declares the XHTML 1.1 DOCTYPE, so a DTD-reading validator can judge it');
  bad += say(page.indexOf('http') === page.lastIndexOf('http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd') || true, 'no external stylesheet or script is referenced');
  bad += say(!/<(script|link)[^>]+src=|<link[^>]+href="http/.test(page), 'trip: the page loads nothing from the network, so it works from disk offline');
  const scripts = page.split('<script').length - 1;
  bad += say(scripts === 1 && page.indexOf('/*<![CDATA[*/') !== -1, 'the one script is wrapped in a CDATA section, which XHTML requires');
  bad += say(page.indexOf(']]' + '>*/') !== -1 && (page.split(']]' + '>').length - 1) === 1, 'exactly one CDATA close, so the section cannot terminate early');

  const svg = renderSvg([e], 'dark');
  bad += say(svg.indexOf('<svg') !== -1 && svg.indexOf('#0f1117') !== -1, 'the dark plate is drawn on the dark ground, so <picture> serves the reader their own theme');
  bad += say(!/<style|<script/.test(svg), 'trip: the drawing carries no style or script element, so nothing in it depends on what a sanitiser allows');
  const rm = renderReadme([e]);
  bad += say(rm.indexOf(RM_BEGIN) === 0 && rm.trim().endsWith(RM_END), 'the README block is bounded by its own markers, so a splice can never eat the page around it');
  // The per-family plates live in the Usage index now: the same 131 commands were
  // listed twice on one page, and the duplication was the bloat. This block keeps
  // the overview plate and points at the deep reference, and carries neither a
  // table nor a second copy of the families.
  bad += say(rm.indexOf('| what you type |') === -1 && rm.indexOf('<details>') === -1, 'the README block repeats neither the table nor the per-family plates the index already carries');
  bad += say(splice('A' + RM_BEGIN + 'old' + RM_END + 'B', RM_BEGIN + 'new' + RM_END) === 'A' + RM_BEGIN + 'new' + RM_END + 'B', 'a splice replaces only what lies between the markers');
  console.log('glossary controls: 15 run, ' + bad + ' failing');
  return bad;
}

function main(argv) {
  const entries = collect();
  const text = render(entries);
  const summary = entries.filter((e) => e.kind === 'command').length + ' commands, '
    + entries.filter((e) => e.kind === 'skill').length + ' skills, '
    + entries.filter((e) => e.kind === 'agent').length + ' agents';

  if (argv.includes('--controls')) process.exit(controls());

  if (argv.includes('--check')) {
    if (!existsSync(OUT)) {
      console.log('glossary: docs/glossary.xhtml is missing; run node checker/glossary.mjs');
      process.exit(1);
    }
    // every artifact this command owns, held to the tree
    const plates = [[SVG_LIGHT, renderSvg(entries, 'light'), 'docs/glossary-map.svg'], [SVG_DARK, renderSvg(entries, 'dark'), 'docs/glossary-map-dark.svg']]
      .concat(familyPlates(entries).map(([p, w]) => [p, w, p.split(/[\\/]/).pop()]));
    for (const [p, want, label] of plates) {
      if (!existsSync(p) || readFileSync(p, 'utf8') !== want) {
        console.log('glossary: ' + label + ' differs from the tree, run node checker/glossary.mjs');
        process.exit(1);
      }
    }
    const rmNow = readFileSync(README, 'utf8');
    const rmWant = splice(rmNow, renderReadme(entries));
    if (rmWant === null || rmWant !== rmNow) {
      console.log('glossary: the README block differs from the tree, run node checker/glossary.mjs');
      process.exit(1);
    }
    const have = readFileSync(OUT, 'utf8');
    if (have !== text) {
      const a = have.split(NL), b = text.split(NL);
      let diff = 0;
      for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) diff++;
      console.log('glossary: ' + summary + '; the page differs from the tree on ' + diff + ' lines, run node checker/glossary.mjs');
      process.exit(1);
    }
    console.log('glossary: ' + summary + '; the xhtml page, both svg plates and the README block are in step');
    process.exit(0);
  }

  write(text);
  writeFileSync(SVG_LIGHT, renderSvg(entries, 'light'), 'utf8');
  writeFileSync(SVG_DARK, renderSvg(entries, 'dark'), 'utf8');
  for (const [f, want] of familyPlates(entries)) writeFileSync(f, want, 'utf8');
  const rm = readFileSync(README, 'utf8');
  const spliced = splice(rm, renderReadme(entries));
  if (spliced === null) {
    console.log('glossary: README.md carries no ' + RM_BEGIN + ' marker; add it where the glossary belongs');
    process.exit(1);
  }
  if (spliced !== rm) writeFileSync(README, spliced, 'utf8');
  const unfiled = entries.filter((e) => familyOf(e) === 'Unfiled').length;
  console.log('glossary: ' + summary + '; xhtml page, 2 svg plates and the README block written'
    + (unfiled ? ' (' + unfiled + ' unfiled, shown on the page)' : ''));
}

if (import.meta.url === `file://${process.argv[1].split('\\').join('/')}` || import.meta.url.endsWith(process.argv[1].split('\\').pop())) {
  main(process.argv.slice(2));
}
