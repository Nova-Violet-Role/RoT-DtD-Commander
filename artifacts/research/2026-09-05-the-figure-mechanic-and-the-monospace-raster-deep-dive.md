<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# Deep Dive: the figure mechanic, and the monospace box that turned out to be a raster

Date: 2026-09-05 · Depth: comprehensive · Use: design the 8.0.0 Graphic family's preview mechanic

## Intake

- known **what**: put the SVG DTD family inside the command mechanic; previews carry figures; expand the idea
- known **focus**: the three UI/UX commands and the `preview` element · known **use**: inform the 8.0.0 implementation
- no gap left open among depth, focus and use (LAW.DD.3); no round run
- gate: `start` — the argument named the subject, the angle and the purpose

## Strategic Summary

An SVG cannot render inside an `AskUserQuestion` preview — the field is declared
`(#PCDATA)` and the harness paints it as markdown in a monospace box. That
constraint is the design rather than an obstacle to it: a monospace box is a
raster with declared dimensions, so one declared `figure` can rasterise to
characters for the widget and vectorise to SVG for the disk.

## Key Questions

- Can a preview carry an image? **No** — measured.
- What is the right form of the idea, then?
- What does the SVG family actually give us that we do not have?

## Overview

The request was to put SVG inside the preview. The measurement says the preview
is text: `dtd/cc-ask.dtd:68` declares `<!ELEMENT preview (#PCDATA)>`, the cut
form is **3 lines**, the expanded form **12**, and the harness renders it as
markdown inside a monospace box, where `<img>`, `<svg>` and a data URI all
arrive as characters rather than as a picture. Additionally, **0 of 131**
commands in the tree contain a single box-drawing character today, so nothing
here is being retrofitted onto an existing practice.

The useful reading of that constraint is that a monospace box is not a poor
substitute for a canvas — it *is* a canvas, addressed in cells instead of
pixels, and it comes with a declared size. Three by sixty, twelve by eighty.
Once the canvas has declared dimensions, a figure declared once can be rendered
twice: to cells for the widget, to SVG for the artifact. That is the same
duality the corpus study found in XHTML (`xhtml11.dtd` at 323 lines against
`xhtml11-flat.dtd` at 4,689) and the same one this repository shipped an hour
ago (one `collect()`, one xhtml page, thirty-six SVG plates, one gate refusing
either if it drifts).

## How It Works

- **The preview is text by declaration** [measured] `dtd/cc-ask.dtd:68`,
  `<!ELEMENT preview (#PCDATA)>`; `ASK.preview.cut_lines "3"`,
  `ASK.preview.expanded_lines "12"`.
- **Nothing draws today** [measured] `grep -rl` for box-drawing characters
  across `src/commands/` returns **0 of 131**.
- **SVG's driver is the model to copy** [measured] `svg/svg11.dtd` is **333
  lines carrying 34 module switches**; element names are parameterised
  (`%SVG.rect.`, `%SVG.circle.`, `%SVG.line.`, `%SVG.path.`, `%SVG.text.`,
  `%SVG.g.`) exactly as TEI parameterises `%n.abbr;`; and it carries **two
  redeclaration hooks**, `svg-prefw-redecl.module` and
  `svg-postfw-redecl.module`, both `IGNORE` by default — the DITA
  constraint-module seam built into the graphics driver itself.
- **The proposed shape** [reasoned] `cc-figure.dtd` declares a canvas in cells,
  a small shape vocabulary behind per-module switches, and
  `<!ELEMENT preview (#PCDATA | figure)*>` so that a preview with no figure
  behaves exactly as today and all 131 existing commands are untouched.

## History and Context

`LAW.PREVIEW.2` marks every expanded preview **guessed**, because it describes a
consequence that has not happened yet. For a command that draws, that mark can
finally be removed honestly: the figure chosen at the gate can be carried out of
the intake and into the artifact, so the preview stops predicting the work and
becomes the first draft of it.

## Patterns and Best Practices

- **Let the poorest renderer set the contract.** `LAW.FIG.2` makes the character
  grid the bound on the SVG rather than the reverse: a figure that cannot be read
  at 3×60 is too complex to be a preview, and the plate may add resolution but
  never a shape the cells do not carry.
- **Declare once, render twice.** One `figure`, two renderers, and a check that
  refuses a pair that disagrees — the shape `build --check` already has.
- **Switch modules, do not branch code.** Copy `svg11.dtd`'s 34 switches: a
  project that wants no scenography redeclares one entity and the grammar loses
  it, instead of the command ignoring it at runtime.

## Limitations and Edge Cases

- **An SVG has no links and no selectable text.** The README plates are correct
  because a CLI agent completes command names as you type them; a figure carrying
  something the user must *copy* — a path, a command, a licence — is the wrong
  use of the mechanic.
- **A figure is a third artifact class.** `.rot-lists` had to be taught `xhtml`
  and `svg` today, and both times `LAW.CORE.8` stopped the build until the class
  was named with a reason and a date. `figure` should enter the white list *with*
  the family rather than after a refusal.
- **Nothing here is built.** Every claim about `cc-figure.dtd` is design, marked
  reasoned; only the measurements of the existing declarations and of the corpus
  are measured.

## Current State and Trends

The 8.0.0 chain document now carries the family, the 52-verb ladder in three
bands, the corpus folders ranked with reasons, the byproduct documents, and this
figure mechanic with six `LAW.FIG.*` bounds. 28,355 bytes, no CR.

## Key Takeaways

1. **The preview cannot hold an image, and that is the design.** A monospace box
   is a raster with a declared size.
2. **The SVG family's real gift is its driver**, not its shapes: 34 switches and
   two redeclaration hooks.
3. **The gate can render.** Four options, four character-thumbnails, one `figure`
   child on an element that already exists — the largest usability change
   available to the whole Suite.

## Remaining Unknowns

- [ ] Do four thumbnails fit legibly in one widget box? (assumed: yes at roughly
      14 columns each within 60 — untested, and the first thing to trip)
- [ ] Does the harness preserve box-drawing characters and alignment in the
      widget on every platform? (assumed: yes, since it is a monospace box —
      unverified on macOS and Linux terminals)
- [ ] Should `figure` live in `cc-ask.dtd` or its own subset? (assumed: its own,
      so non-asking commands can draw too)

## Implementation Context

<claude_context>
<application>
- when_to_use: a command whose choices are spatial — a layout, a structure, a diff
- when_not_to_use: any preview whose content must be copied by the user
- prerequisites: a declared cell canvas, and two renderers held to one figure
</application>
<technical>
- libraries: none; the renderers are ours
- patterns: declare once render twice; module switches over runtime branches;
  the poorest renderer sets the contract
- gotchas: the preview element is (#PCDATA) today, so the content model must be
  widened before anything can nest inside it; 0 of 131 commands draw, so there is
  no existing practice to match
</technical>
<integration>
- works_with: cc-ask.dtd, checker/glossary.mjs's two-renderer pattern
- conflicts_with: putting an img or a data URI in a preview; it renders as text
- alternatives: text previews as today, which remain valid and untouched
</integration>
</claude_context>

**Next Action:** plan — `cc-figure.dtd` and the two renderers, in the 8.0.0 run.

## Sources

- [file] `dtd/cc-ask.dtd:68` — `<!ELEMENT preview (#PCDATA)>` — 2026-09-05
- [file] `dtd/cc-ask.dtd:109-110` — cut 3 lines, expanded 12 — 2026-09-05
- [measurement] box-drawing characters across `src/commands/`: 0 of 131 — 2026-09-05
- [measurement] `svg/svg11.dtd`: 333 lines, 34 `.module` switches — 2026-09-05
- [command] `grep -rhoE '<!ENTITY % SVG\.(rect|circle|line|path|text|g)\.'` — parameterised element names — 2026-09-05
- [measurement] `svg-prefw-redecl.module` / `svg-postfw-redecl.module` both `IGNORE` — 2026-09-05
- [measurement] 62 SVG DTD-family files under `.dtd-file-examples` — 2026-09-05
- [note] the harness renders a preview as markdown in a monospace box; this is from the tool contract, not from a run of my own
- [note] every statement about `cc-figure.dtd` is design, not measurement; nothing was built
