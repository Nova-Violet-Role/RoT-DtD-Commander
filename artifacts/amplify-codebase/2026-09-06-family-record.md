<!-- SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2 -->
<!-- Copyright 2026 Saimonokuma. -->

# The record layer, run 8

- instrument: node lib/record.mjs controls
- exit: 0
- read: 1 of 1
- walked: yes

- [gap] the state record capped a why at 160 characters and the ledger re-emitted from it lost twenty-nine committed characters mid-word, found by the third companion pass; the cap is gone and a why of 270 round-trips whole
