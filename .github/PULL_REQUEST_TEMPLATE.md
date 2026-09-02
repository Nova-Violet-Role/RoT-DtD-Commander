<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->
<!-- Delete any section that genuinely does not apply, and say why it does not.
     A deleted section with no explanation reads as an unanswered question. -->

## What this changes, and what question it answers

<!-- One paragraph. State the adversarial question your change answers:
     "can an answer pass the Adiutor while missing a required heading?" -->

## The evidence

```
<!-- npm run gate; echo "exit=$?"   and its tail. Read the exit code
     DIRECTLY, never through a pipe; when you must pipe, use ${PIPESTATUS[0]}. -->
```

## Checklist

- [ ] `npm run gate` exits **0**, read directly.
- [ ] I edited `src/`, ran `npm run build`, and committed the resolved output;
      `rdc build --check` reports 0 drifted.
- [ ] Any behavioural change ships with a control **I have watched fail**: I
      broke the thing on purpose, saw the guard fire, restored it, saw it pass.
- [ ] A control I added asserts its mutation is **present** before judging.
- [ ] No carriage returns: `bash checker/crlf-sweep.sh` prints 0 bad.
- [ ] New files carry the SPDX header: `bash checker/spdx-sweep.sh` prints 0
      missing. A converted file keeps its MIT portions line.
- [ ] A new command has a `grammar_map` that names every declared element,
      and, if it carries IDREFs or enumerations, short ids (E1, T3) so the
      Adiutor's dangling-reference check at Stop can read them.
- [ ] Documentation numbers I touched were re-measured, not carried over.

## What I could not verify

<!-- Say it plainly. "I have no macOS machine" is a fine answer and a far
     better one than silence. An honest gap is a result. -->
