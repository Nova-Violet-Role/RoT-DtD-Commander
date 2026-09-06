#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
# Copyright 2026 Saimonokuma.
#
# checker/crlf-sweep.sh
# No text file in the tree carries a carriage return, a BOM, or a control byte
# the encoding law forbids. The bytes are read by lib/encoding.mjs since 8.0.0:
# the 7.x script used mapfile, grep -P and grep -U, three forms bash 3.2 and
# BSD grep lack, so the sweep could never have run on the macOS leg
# (LAW.XOS.4). The three planted controls travel with it, and the last line
# keeps its shape: crlf-sweep: N files checked, B bad.
set -u
cd "$(dirname "$0")/.." || exit 2
exec node lib/encoding.mjs sweep "$@"
