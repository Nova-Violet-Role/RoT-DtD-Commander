<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# The adiutor layer, run 8

- instrument: node bin/adiutor.mjs controls
- exit: 0
- read: 1 of 1
- walked: yes

- [idea] a dynamic audit for checker/*.dtd, a different instrument from the static one that was widened and reverted as c3e0de05; still unwritten
- [gap] the companion scorer had no control for two verdict lines or for none; M18 and M19 trip both
