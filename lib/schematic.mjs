#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// lib/schematic.mjs
// The semantic schemas of dtd/cc-schematic.dtd rendered in every form. The
// schema list, the form list (SEMANTIC.forms: the six schematics and the
// cc-form kinds beyond them), the concept list, the parts of each schema
// and the cell SEMANTIC.<schema>.<form> all come from the DTD; this module
// renders a cell as a skeleton, reads the part names back out of a
// rendering, and holds the declaration and the code to each other in both
// directions (LAW.SCHEMA.7, LAW.SCHEMA.9).
//
//   parts(schema)          -> [{ name, occurs }] from SEMANTIC.<schema>.parts
//   cell(schema, form)     -> the text of SEMANTIC.<schema>.<form>, or null
//   render(schema, form)   -> the skeleton: a bracketed word where a part's text goes
//   readBack(text, form)   -> the part names a rendering carries, in order
//   check(text, form, [schema]) -> per schema: parts found, in order, missing, absent
//   matrixCheck(dtd)       -> every gap in the SCHEMA and SEMANTIC matrices
//   table()                -> references/semantic-schemas.md, every cell rendered
//   controls()             -> render, guard and read back every cell; trip on purpose
//
//   node lib/schematic.mjs render <schema> <form>   print the skeleton
//   node lib/schematic.mjs parts <schema>           print the parts in order
//   node lib/schematic.mjs cell <schema> <form>     print the declared cell
//   node lib/schematic.mjs check <file> <form> <schema,schema>   one line per schema; exit 1 on a FAIL
//   node lib/schematic.mjs table                    print the reference
//   node lib/schematic.mjs controls                 the controls; exit 1 on a failure

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve as presolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guards } from './form.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DTD = readFileSync(join(ROOT, 'dtd', 'cc-schematic.dtd'), 'utf8');
const FORM_DTD = readFileSync(join(ROOT, 'dtd', 'cc-form.dtd'), 'utf8');
const TABLE_PATH = join(ROOT, 'src', 'skills', 'dtd-core-dtd', 'references', 'semantic-schemas.md');
const NL = String.fromCharCode(10);

function entOf(dtd, name) {
  const m = new RegExp('<!ENTITY\\s+' + name.replace(/\./g, '\\.') + '\\s+"([^"]*)"').exec(dtd);
  return m ? m[1] : null;
}
function enumOf(dtd, element, attr) {
  const m = new RegExp('<!ATTLIST\\s+' + element + '\\b[\\s\\S]*?\\b' + attr + '\\s+\\(([^)]+)\\)').exec(dtd);
  if (!m) throw new Error(`no ${element} ${attr} enumeration declared`);
  return m[1].split('|').map((s) => s.trim()).filter(Boolean);
}
const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

export const SCHEMATICS = enumOf(DTD, 'schematic', 'name');
export const FORMS = list(entOf(DTD, 'SEMANTIC.forms'));
export const SCHEMAS = enumOf(DTD, 'semantic', 'name');
export const CONCEPTS = enumOf(DTD, 'concept', 'name');
export const OCCURS = enumOf(DTD, 'part', 'occurs');
export const CALLOUT_TYPES = (entOf(DTD, 'SEMANTIC.callout.types') || '').match(/\b[A-Z]{3,}\b/g) || [];
export const FORM_KINDS = enumOf(FORM_DTD, 'form', 'kind');
export const FAMILIES = Object.fromEntries((DTD.match(/<!ENTITY SEMANTIC\.family\.([a-z]+)\s+"([^"]*)"/g) || []).map((d) => { const m = /family\.([a-z]+)\s+"([^"]*)"/.exec(d); return [m[1], list(m[2])]; }));

// the cc-form kind each form is guarded as; md is the callout schematic
const KIND = { callout: 'md', heredoc: 'heredoc', yaml: 'yaml', nt: 'nt', xml: 'xml', polyglot: 'polyglot', jmd: 'jmd', json: 'json', toml: 'toml' };
const FENCE = { callout: 'md', heredoc: 'sh', yaml: 'yaml', nt: 'nt', xml: 'xml', polyglot: 'md', jmd: 'md', json: 'json', toml: 'toml' };

export function parts(schema, dtd = DTD) {
  const v = entOf(dtd, `SEMANTIC.${schema}.parts`);
  if (v === null) throw new Error(`cc-schematic.dtd declares no SEMANTIC.${schema}.parts`);
  const re = new RegExp('^([a-z_]+)(?:\\s+\\((' + OCCURS.join('|') + ')\\))?$');
  return list(v).map((s) => {
    const m = re.exec(s);
    if (!m) throw new Error(`SEMANTIC.${schema}.parts: cannot read part "${s}"`);
    return { name: m[1], occurs: m[2] || 'one' };
  });
}

export function cell(schema, form, dtd = DTD) {
  return entOf(dtd, `SEMANTIC.${schema}.${form}`);
}

// SEMANTIC.callout.types: an example part is a TIP, a constraint or a
// prerequisite is a WARNING, a part that must occur once is IMPORTANT, and
// a descriptive part is a NOTE. The cells name the same type per part, and
// matrixCheck holds them to it.
export function calloutType(p) {
  if (/example/.test(p.name)) return 'TIP';
  if (/constraint|prereq/.test(p.name)) return 'WARNING';
  if (p.occurs === 'one') return 'IMPORTANT';
  return 'NOTE';
}

const ph = (p, i) => `[${p.name}${p.occurs === 'many' ? ' ' + i : ''}]`;
const TWO = [1, 2];

export function render(schema, form) {
  const ps = parts(schema);
  const out = [];
  const opt = (p, comment) => { if (p.occurs === 'optional') out.push(comment); };
  switch (form) {
    case 'callout':
      for (const p of ps) {
        const t = calloutType(p);
        opt(p, `<!-- ${p.name}: when given -->`);
        if (p.occurs === 'many') for (const i of TWO) out.push(`> [!${t}] ${p.name} ${i}`, `> ${ph(p, i)}`, '');
        else out.push(`> [!${t}] ${p.name}`, `> ${ph(p)}`, '');
      }
      break;
    case 'heredoc':
      for (const p of ps) {
        const V = p.name.toUpperCase();
        opt(p, `# ${p.name}: when given`);
        if (p.occurs === 'many') {
          out.push(`${V}=()`);
          for (const i of TWO) out.push(`${V}+=("$(cat <<'${V}_${i}_EOF'`, ph(p, i), `${V}_${i}_EOF`, ')")');
        } else out.push(`${V}=$(cat <<'${V}_EOF'`, ph(p), `${V}_EOF`, ')');
      }
      break;
    case 'yaml':
      for (const p of ps) {
        opt(p, `# ${p.name}: when given`);
        if (p.occurs === 'many') { out.push(`${p.name}:`); for (const i of TWO) out.push('  - |-', `    ${ph(p, i)}`); }
        else out.push(`${p.name}: |-`, `  ${ph(p)}`);
      }
      break;
    case 'nt':
      for (const p of ps) {
        opt(p, `# ${p.name}: when given`);
        if (p.occurs === 'many') { out.push(`${p.name}:`); for (const i of TWO) out.push('  -', `    > ${ph(p, i)}`); }
        else out.push(`${p.name}:`, `  > ${ph(p)}`);
      }
      break;
    case 'xml': {
      const model = ps.map((p) => p.name + (p.occurs === 'many' ? '+' : p.occurs === 'optional' ? '?' : '')).join(', ');
      out.push(`<!DOCTYPE ${schema} [`, `  <!ELEMENT ${schema} (${model})>`);
      for (const p of ps) out.push(`  <!ELEMENT ${p.name} (#PCDATA)>`);
      out.push(']>', `<${schema}>`);
      for (const p of ps) {
        opt(p, `  <!-- ${p.name}: when given -->`);
        if (p.occurs === 'many') for (const i of TWO) out.push(`  <${p.name}><![CDATA[${ph(p, i)}]]></${p.name}>`);
        else out.push(`  <${p.name}><![CDATA[${ph(p)}]]></${p.name}>`);
      }
      out.push(`</${schema}>`);
      break;
    }
    case 'polyglot':
      out.push('---', `schema: ${schema}`, 'form: polyglot', 'parts:');
      for (const p of ps) out.push(`  - ${p.name}${p.occurs === 'one' ? '' : ' # ' + p.occurs}`);
      out.push('---', '', render(schema, 'callout').replace(/\n+$/, ''));
      break;
    case 'jmd':
      for (const p of ps) {
        opt(p, `<!-- ${p.name}: when given -->`);
        if (p.occurs === 'many') for (const i of TWO) out.push(`# ${p.name} ${i}`, '', ph(p, i), '');
        else out.push(`# ${p.name}`, '', ph(p), '');
      }
      break;
    case 'json': {
      const o = {};
      for (const p of ps) o[p.name] = p.occurs === 'many' ? TWO.map((i) => ph(p, i)) : ph(p);
      out.push(JSON.stringify(o, null, 2));
      break;
    }
    case 'toml':
      for (const p of ps) {
        opt(p, `# ${p.name}: when given`);
        if (p.occurs === 'many') { out.push(`${p.name} = [`); for (const i of TWO) out.push('  """', ph(p, i), '  """,'); out.push(']'); }
        else out.push(`${p.name} = """`, ph(p), '"""');
      }
      break;
    default:
      throw new Error(`unknown form ${form}: one of ${FORMS.join(', ')}`);
  }
  return out.join(NL).replace(/\n+$/, '') + NL;
}

export function readBack(text, form) {
  const names = [];
  const push = (n) => { if (names[names.length - 1] !== n) names.push(n); };
  const lines = text.split(NL);
  const each = (re, g = 1) => { for (const l of lines) { const m = re.exec(l); if (m) push(m[g]); } };
  if (form === 'callout') each(/^>\s*\[!([A-Za-z]+)\]\s+([a-z_]+)/, 2);
  else if (form === 'heredoc') { each(/^([A-Z_]+)\+?=/); for (let i = 0; i < names.length; i++) names[i] = names[i].toLowerCase(); }
  else if (form === 'yaml' || form === 'nt') each(/^([a-z_]+):/);
  else if (form === 'jmd') each(/^# ([a-z_]+)/);
  else if (form === 'json') each(/^\s+"([a-z_]+)":/);
  else if (form === 'toml') each(/^([a-z_]+) = /);
  else if (form === 'xml') {
    const body = text.slice(text.indexOf(']>') + 2);
    for (const m of body.matchAll(/<([a-z_]+)>/g)) push(m[1]);
    names.shift(); // the root
  } else if (form === 'polyglot') {
    const i = text.indexOf('---' + NL);
    const j = text.indexOf(NL + '---', i + 4);
    for (const m of text.slice(i, j).matchAll(/^\s+-\s+([a-z_]+)/gm)) push(m[1]);
  } else throw new Error(`unknown form ${form}`);
  return names;
}

// A written file against the schemas it claims to carry: for each schema,
// the part names read back by form, filtered to that schema, must keep the
// declared order, every part that occurs one or many must be present, and
// an optional part may be absent. The creators' proof runs this on the file
// they wrote (LAW.SCHEMA.5), one line per schema.
export function check(text, form, names) {
  const got = readBack(text, form);
  return names.map((s) => {
    const ps = parts(s);
    const idx = new Map(ps.map((p, i) => [p.name, i]));
    const seen = got.filter((n) => idx.has(n));
    let last = -1;
    let ordered = true;
    for (const n of seen) { const i = idx.get(n); if (i < last) ordered = false; last = Math.max(last, i); }
    const missing = ps.filter((p) => p.occurs !== 'optional' && !seen.includes(p.name)).map((p) => p.name);
    const absent = ps.filter((p) => p.occurs === 'optional' && !seen.includes(p.name)).map((p) => p.name);
    return { schema: s, ok: ordered && missing.length === 0, found: seen.length, parts: ps.length, missing, absent, ordered };
  });
}
export function checkLine(r) {
  return `schema ${r.schema}: ${r.parts} parts, ${r.found} read back${r.ordered ? ' in order' : ' OUT OF ORDER'}${r.absent.length ? ', absent ' + r.absent.join(', ') + ' (optional)' : ''}${r.missing.length ? ', MISSING ' + r.missing.join(', ') : ''}: ${r.ok ? 'ok' : 'FAIL'}`;
}

// Every gap between the DTD's matrices and what this module renders: a
// SCHEMA cell missing for a schematic and a concept, a schematic without
// its extension, a form without its three rules, a schema without a cell
// for a form, or a cell that does not name a part in that form's spelling.
export function matrixCheck(dtd = DTD) {
  const fail = [];
  const forms = list(entOf(dtd, 'SEMANTIC.forms'));
  if (!forms.length) fail.push('SEMANTIC.forms missing');
  for (const s of SCHEMATICS) {
    for (const c of CONCEPTS) if (entOf(dtd, `SCHEMA.${s}.${c}`) === null) fail.push(`SCHEMA.${s}.${c} missing`);
    if (entOf(dtd, `SCHEMA.ext.${s}`) === null) fail.push(`SCHEMA.ext.${s} missing`);
    if (!forms.includes(s)) fail.push(`SEMANTIC.forms does not list the schematic ${s}`);
  }
  for (const form of forms) for (const r of ['part', 'many', 'label']) if (entOf(dtd, `SEMANTIC.${form}.${r}`) === null) fail.push(`SEMANTIC.${form}.${r} missing`);
  for (const s of SCHEMAS) {
    let ps;
    try { ps = parts(s, dtd); } catch (e) { fail.push(e.message); continue; }
    for (const form of forms) {
      const c = entOf(dtd, `SEMANTIC.${s}.${form}`);
      if (c === null) { fail.push(`SEMANTIC.${s}.${form} missing`); continue; }
      for (const p of ps) {
        const want = form === 'callout' ? `${calloutType(p)} ${p.name}` : form === 'heredoc' ? p.name.toUpperCase() : p.name;
        if (!c.includes(want)) fail.push(`SEMANTIC.${s}.${form} does not name ${want}`);
      }
    }
  }
  return fail;
}

// The forms of SEMANTIC.forms against the kinds cc-form declares, md read
// as the callout schematic: what cc-form declares and no form covers, and
// what a form names that cc-form never declared.
export function kindCoverage(forms) {
  const covered = new Set(forms.map((f) => (f === 'callout' ? 'md' : f)));
  return { missing: FORM_KINDS.filter((k) => !covered.has(k)), extra: [...covered].filter((k) => !FORM_KINDS.includes(k)) };
}

export function table() {
  const out = ['<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->', '<!-- Copyright 2026 Saimonokuma. -->', '',
    '# Every semantic schema in every form', '',
    'Generated by `node lib/schematic.mjs table` from dtd/cc-schematic.dtd. The schematic controls render every cell, run the cc-form guards of the form on the rendering, read the part names back in order and hold this file to a fresh render.',
    `${SCHEMAS.length} schemas in ${Object.keys(FAMILIES).length} families (${Object.entries(FAMILIES).map(([f, n]) => f + ': ' + n.join(', ')).join('; ')}), ${FORMS.length} forms (the six schematics and the cc-form kinds beyond them, md being the callout schematic), ${SCHEMAS.length * FORMS.length} cells. A bracketed word is where the part's text goes; a part that occurs many is shown twice; a part that occurs optional is preceded by the form's comment saying when given, except in JSON, which has no comment.`, ''];
  for (const s of SCHEMAS) {
    const ps = parts(s);
    out.push(`## ${s}`, '', `Parts in order: ${ps.map((p) => p.name + (p.occurs === 'one' ? '' : ' (' + p.occurs + ')')).join(', ')}.`, '');
    for (const form of FORMS) {
      out.push(`### ${s} in ${form}`, '', '```dtd', `<!ENTITY SEMANTIC.${s}.${form} "${cell(s, form)}">`, '```', '', '```' + FENCE[form], render(s, form).replace(/\n$/, ''), '```', '');
    }
  }
  return out.join(NL);
}

export function controls() {
  const rows = [];
  let bad = 0;
  const row = (ok, msg) => { if (!ok) bad++; rows.push(`  ${ok ? 'PASS' : 'FAIL'} ${msg}`); };
  const gaps = matrixCheck();
  row(gaps.length === 0, `the matrices are complete: ${SCHEMATICS.length} schematics x ${CONCEPTS.length} concepts, ${SCHEMAS.length} schemas x ${FORMS.length} forms${gaps.length ? ': ' + gaps.slice(0, 3).join('; ') : ''}`);
  const cov = kindCoverage(FORMS);
  row(cov.missing.length === 0 && cov.extra.length === 0, `SEMANTIC.forms covers every cc-form kind (${FORM_KINDS.join(', ')}), md as callout${cov.missing.length ? '; missing ' + cov.missing.join(', ') : ''}${cov.extra.length ? '; unknown ' + cov.extra.join(', ') : ''}`);
  const union = Object.values(FAMILIES).flat();
  const dup = union.filter((s, i) => union.indexOf(s) !== i);
  const notListed = SCHEMAS.filter((s) => !union.includes(s));
  const unknown = union.filter((s) => !SCHEMAS.includes(s));
  row(dup.length === 0 && notListed.length === 0 && unknown.length === 0, `the ${Object.keys(FAMILIES).length} families partition the ${SCHEMAS.length} schemas (${Object.entries(FAMILIES).map(([f, n]) => f + ' ' + n.length).join(', ')})${dup.length ? '; twice: ' + dup.join(', ') : ''}${notListed.length ? '; in no family: ' + notListed.join(', ') : ''}${unknown.length ? '; not a schema: ' + unknown.join(', ') : ''}`);
  const typesUsed = new Set();
  for (const s of SCHEMAS) {
    const ps = parts(s);
    const want = ps.map((p) => p.name);
    for (const p of ps) typesUsed.add(calloutType(p));
    let held = 0, back = 0;
    const notes = [];
    for (const form of FORMS) {
      const text = render(s, form);
      const failed = guards(text, KIND[form]).filter((g) => !g.held);
      if (failed.length === 0) held++; else notes.push(`${form} guard ${failed[0].name}: ${failed[0].detail}`);
      const got = readBack(text, form);
      let same = JSON.stringify(got) === JSON.stringify(want);
      if (same && form === 'polyglot') {
        const body = text.slice(text.indexOf(NL + '---' + NL, 4) + 5);
        same = JSON.stringify(readBack(body, 'callout')) === JSON.stringify(want);
        if (!same) notes.push('polyglot body drifts from its front matter');
      }
      if (same && form === 'json') {
        try { same = JSON.stringify(Object.keys(JSON.parse(text))) === JSON.stringify(want); } catch (e) { same = false; }
        if (!same) notes.push('json does not parse to the parts');
      }
      if (same) back++; else notes.push(`${form} read ${got.join(',')} want ${want.join(',')}`);
    }
    row(held === FORMS.length && back === FORMS.length, `${s}: ${ps.length} parts, guards held in ${held} of ${FORMS.length} forms, parts read back in order in ${back} of ${FORMS.length}${notes.length ? ' (' + notes.join('; ') + ')' : ''}`);
  }
  const strange = [...typesUsed].filter((t) => !CALLOUT_TYPES.includes(t));
  row(strange.length === 0, `every callout type rendered is one of SEMANTIC.callout.types (${CALLOUT_TYPES.join(', ')})${strange.length ? ': ' + strange.join(', ') : ''}`);
  // trips: each check must fire when the thing it checks is broken on purpose
  const mutated = DTD.replace(/(<!ENTITY SEMANTIC\.refentry\.yaml\s+")([^"]*)"/, (a, b, c) => b + c.split('refpurpose').join('purpose') + '"');
  const t1 = matrixCheck(mutated);
  row(t1.some((f) => f === 'SEMANTIC.refentry.yaml does not name refpurpose'), `trip: a cell that drops a part is reported: ${t1[0] || 'nothing reported'}`);
  const t2 = kindCoverage(FORMS.filter((f) => f !== 'toml'));
  row(t2.missing.length === 1 && t2.missing[0] === 'toml', `trip: a form dropped from SEMANTIC.forms is reported as an uncovered cc-form kind: missing ${t2.missing.join(', ') || 'nothing'}`);
  const t3 = SCHEMAS.filter((s) => !Object.values(FAMILIES).flat().filter((x) => x !== 'table').includes(s));
  row(t3.length === 1 && t3[0] === 'table', `trip: a schema dropped from every family is reported as in no family: ${t3.join(', ') || 'nothing'}`);
  const short = render('refentry', 'yaml').split('refpurpose: |-' + NL + '  [refpurpose]' + NL).join('');
  const got = readBack(short, 'yaml');
  row(got.length === parts('refentry').length - 1 && !got.includes('refpurpose'), `trip: a rendering that drops a part reads back short: ${got.length} of ${parts('refentry').length}`);
  // check: a file that carries the schema among other keys passes; a dropped required part and a swapped order fail
  const among = 'role: |-' + NL + '  the reader' + NL + render('refentry', 'yaml') + 'success: |-' + NL + '  done' + NL;
  const c1 = check(among, 'yaml', ['refentry'])[0];
  row(c1.ok && c1.found === 7, `check: the schema among other keys passes: ${checkLine(c1)}`);
  const c2 = check(short, 'yaml', ['refentry'])[0];
  row(!c2.ok && c2.missing.includes('refpurpose'), `trip: check reports a required part missing: ${checkLine(c2)}`);
  const swapped = render('refentry', 'yaml').replace('refname: |-' + NL + '  [refname]' + NL + 'refpurpose: |-' + NL + '  [refpurpose]' + NL, 'refpurpose: |-' + NL + '  [refpurpose]' + NL + 'refname: |-' + NL + '  [refname]' + NL);
  const c3 = check(swapped, 'yaml', ['refentry'])[0];
  row(!c3.ok && !c3.ordered, `trip: check reports parts out of order: ${checkLine(c3)}`);
  const c4 = check(render('qandaset', 'callout').split('<!-- label: when given -->' + NL + '> [!NOTE] label' + NL + '> [label]' + NL + NL).join(''), 'callout', ['qandaset'])[0];
  row(c4.ok && c4.absent.includes('label'), `check: an optional part absent still passes: ${checkLine(c4)}`);
  const alarm = guards(render('refentry', 'callout').split('[!IMPORTANT] refname').join('[!ALARM] refname'), 'md').find((g) => g.name === 'callout');
  row(alarm && !alarm.held, `trip: a sixth callout type is refused by the form guard: ${alarm ? alarm.detail : 'guard not applied'}`);
  const cdata = guards(render('refentry', 'xml').split('[refname]').join('a ]]> inside'), 'xml').find((g) => g.name === 'cdata_end');
  row(cdata && !cdata.held, `trip: a section close planted in a part is refused by the form guard: ${cdata ? cdata.detail : 'guard not applied'}`);
  if (existsSync(join(ROOT, 'src'))) {
    if (!existsSync(TABLE_PATH)) row(false, 'references/semantic-schemas.md is missing: run node lib/schematic.mjs table and write it to ' + TABLE_PATH);
    else row(readFileSync(TABLE_PATH, 'utf8').split(String.fromCharCode(13)).join('') === table(), 'references/semantic-schemas.md equals a fresh render (run node lib/schematic.mjs table to refresh it)');
  } else rows.push('  table drift: no src/ in this tree (installed copy), not applicable');
  return { bad, rows };
}

const isMain = process.argv[1] && presolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [a, b, c] = process.argv.slice(2);
  if (a === 'controls') {
    const r = controls();
    for (const x of r.rows) console.log(x);
    console.log(`schematic controls: ${r.bad ? `${r.bad} failing` : 'ok (0 failing)'}, schemas ${SCHEMAS.length} in ${Object.keys(FAMILIES).length} families, forms ${FORMS.length}, cells ${SCHEMAS.length * FORMS.length}, concepts ${CONCEPTS.length}`);
    process.exit(r.bad ? 1 : 0);
  } else if (a === 'table') process.stdout.write(table());
  else if (a === 'render' && b && c) process.stdout.write(render(b, c));
  else if (a === 'parts' && b) console.log(parts(b).map((p) => `${p.name} ${p.occurs}`).join(NL));
  else if (a === 'cell' && b && c) console.log(cell(b, c) ?? 'undeclared');
  else if (a === 'check' && b && c) {
    const names = list(process.argv[5] || '');
    if (!names.length) { console.log('check: name at least one schema, comma-separated'); process.exit(2); }
    const rs = check(readFileSync(presolve(b), 'utf8'), c, names);
    for (const r of rs) console.log(checkLine(r));
    process.exit(rs.every((r) => r.ok) ? 0 : 1);
  } else { console.log('usage: node lib/schematic.mjs render <schema> <form> | parts <schema> | cell <schema> <form> | check <file> <form> <schema,schema> | table | controls'); process.exit(2); }
}
