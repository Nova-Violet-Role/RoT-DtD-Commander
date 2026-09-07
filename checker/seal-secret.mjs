#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later OR EUPL-1.2
// Copyright 2026 Saimonokuma.
//
// checker/seal-secret.mjs
// The model credential, sealed from the live file into one repository secret,
// re-run at every release rather than copied once. The CLI refreshes the
// credential it holds, so a snapshot sealed at 8.0.0 is expired by 9.0.0;
// the only way a secret stays usable is to seal the current file each time a
// release is cut, from the machine where the CLI keeps it current. The value
// is read from the file, sealed in memory and sent; it is never printed,
// never logged and never written anywhere but the request body.
//
// Sealing is the libsodium sealed box GitHub requires (X25519 and
// XSalsa20-Poly1305), which Node's own crypto does not carry, so the box
// comes from tweetnacl loaded from a directory the operator names: the
// library is not vendored into this tree (a .js file is not a listed class
// and a vendored copy is a copy nobody re-reads). npm install tweetnacl into
// a scratch directory and pass it with --nacl.
//
//   node checker/seal-secret.mjs put --name CLAUDE_CREDENTIALS_JSON --file <path> --nacl <dir> [--repo owner/name]
//   node checker/seal-secret.mjs check --name CLAUDE_CREDENTIALS_JSON [--repo owner/name]
//   node checker/seal-secret.mjs controls --nacl <dir>
//
// rer-outside: manual
// Its controls seal a known message under a generated key pair and open it
// again, and prove that nothing the tool prints contains the value; they need
// the library the operator installs, so the gate does not run them and this
// line records why (LAW.RER.6).

import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const REPO_DEFAULT = 'Nova-Violet-Role/RoT-DtD-Commander';

function token() {
  const r = spawnSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', timeout: 30000 });
  return (/^password=(.+)$/m.exec(r.stdout || '') || [])[1] || null;
}
function api(tok, method, path, body) {
  const args = ['-s', '-m', '60', '-X', method, '-H', `Authorization: Bearer ${tok}`, '-H', 'Accept: application/vnd.github+json', '-H', 'X-GitHub-Api-Version: 2022-11-28', '-o', '-', '-w', '\n%{http_code}', `https://api.github.com${path}`];
  if (body !== undefined) args.push('-H', 'Content-Type: application/json', '--data-binary', '@-');
  const r = spawnSync('curl', args, { input: body === undefined ? undefined : JSON.stringify(body), encoding: 'utf8', timeout: 90000, maxBuffer: 8 * 1024 * 1024 });
  const out = String(r.stdout || '');
  const i = out.lastIndexOf('\n');
  return { code: Number(out.slice(i + 1)), body: out.slice(0, i) };
}
function nacl(dir) {
  const req = createRequire(import.meta.url);
  const p = resolve(dir, 'node_modules', 'tweetnacl');
  const q = existsSync(p) ? p : resolve(dir);
  return req(q);
}

// The sealed box, as libsodium defines it: an ephemeral key pair, a nonce
// that is blake2b(ephemeral public || recipient public), and the ciphertext
// prefixed by the ephemeral public key. tweetnacl carries box and hash
// (sha512) but not blake2b, so the nonce is derived the way libsodium's
// crypto_box_seal does, with a small blake2b written here for that one use.
function blake2b(input, outlen = 24) {
  const IV = [0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n, 0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n];
  const SIGMA = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3], [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4], [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8], [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13], [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9], [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11], [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10], [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5], [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3]];
  const M64 = (1n << 64n) - 1n;
  const rotr = (x, n) => ((x >> BigInt(n)) | (x << BigInt(64 - n))) & M64;
  const h = IV.slice();
  h[0] ^= BigInt(0x01010000 ^ outlen);
  const data = Buffer.from(input);
  const blocks = Math.max(1, Math.ceil(data.length / 128));
  for (let b = 0; b < blocks; b++) {
    const chunk = Buffer.alloc(128);
    data.copy(chunk, 0, b * 128, Math.min(data.length, (b + 1) * 128));
    const m = [];
    for (let i = 0; i < 16; i++) m.push(chunk.readBigUInt64LE(i * 8));
    const t = BigInt(Math.min(data.length, (b + 1) * 128));
    const last = b === blocks - 1;
    const v = h.concat(IV);
    v[12] ^= t & M64; v[13] ^= t >> 64n;
    if (last) v[14] = ~v[14] & M64;
    const G = (a, bb, c, d, x, y) => {
      v[a] = (v[a] + v[bb] + x) & M64; v[d] = rotr(v[d] ^ v[a], 32);
      v[c] = (v[c] + v[d]) & M64; v[bb] = rotr(v[bb] ^ v[c], 24);
      v[a] = (v[a] + v[bb] + y) & M64; v[d] = rotr(v[d] ^ v[a], 16);
      v[c] = (v[c] + v[d]) & M64; v[bb] = rotr(v[bb] ^ v[c], 63);
    };
    for (let r = 0; r < 12; r++) {
      const s = SIGMA[r];
      G(0, 4, 8, 12, m[s[0]], m[s[1]]); G(1, 5, 9, 13, m[s[2]], m[s[3]]); G(2, 6, 10, 14, m[s[4]], m[s[5]]); G(3, 7, 11, 15, m[s[6]], m[s[7]]);
      G(0, 5, 10, 15, m[s[8]], m[s[9]]); G(1, 6, 11, 12, m[s[10]], m[s[11]]); G(2, 7, 8, 13, m[s[12]], m[s[13]]); G(3, 4, 9, 14, m[s[14]], m[s[15]]);
    }
    for (let i = 0; i < 8; i++) h[i] ^= v[i] ^ v[i + 8];
  }
  const out = Buffer.alloc(64);
  for (let i = 0; i < 8; i++) out.writeBigUInt64LE(h[i], i * 8);
  return out.subarray(0, outlen);
}
export function seal(naclLib, recipientPublic, message) {
  const eph = naclLib.box.keyPair();
  const nonce = blake2b(Buffer.concat([Buffer.from(eph.publicKey), Buffer.from(recipientPublic)]), 24);
  const boxed = naclLib.box(message, nonce, recipientPublic, eph.secretKey);
  return Buffer.concat([Buffer.from(eph.publicKey), Buffer.from(boxed)]);
}
export function open(naclLib, recipientSecret, recipientPublic, sealed) {
  const eph = sealed.subarray(0, 32);
  const nonce = blake2b(Buffer.concat([eph, Buffer.from(recipientPublic)]), 24);
  return naclLib.box.open(sealed.subarray(32), nonce, eph, recipientSecret);
}

export function controls(naclDir, io = console) {
  let ran = 0, fail = 0;
  const say = (ok, t) => { ran++; io.log(`  ${ok ? 'PASS' : 'FAIL'} ${t}`); if (!ok) fail++; };
  const n = nacl(naclDir);
  say(typeof n.box === 'function' && typeof n.box.keyPair === 'function', 'the sealed-box library loaded from the directory named');
  // blake2b against the RFC 7693 test vector for the empty string, 64 bytes
  const empty = blake2b('', 64).toString('hex');
  say(empty.startsWith('786a02f742015903c6c6fd852552d272'), `blake2b of the empty string matches RFC 7693: ${empty.slice(0, 32)}...`);
  const kp = n.box.keyPair();
  const msg = Buffer.from('the credential that is never printed');
  const sealed = seal(n, kp.publicKey, msg);
  const back = open(n, kp.secretKey, kp.publicKey, sealed);
  say(back && Buffer.from(back).equals(msg) && sealed.length === msg.length + 48, `a message seals to ${sealed.length} bytes and opens again under the recipient key`);
  const other = n.box.keyPair();
  say(open(n, other.secretKey, other.publicKey, sealed) === null, 'trip: a different recipient cannot open it');
  const tampered = Buffer.from(sealed); tampered[40] ^= 1;
  say(open(n, kp.secretKey, kp.publicKey, tampered) === null, 'trip: one flipped byte and the box does not open');
  let printed = '';
  const fakeIo = { log: (s) => { printed += s + '\n'; } };
  report(fakeIo, { name: 'X', bytes: msg.length, keyId: 'k', code: 201 }, msg.toString());
  say(!printed.includes(msg.toString()) && !printed.includes('credential that'), 'what the tool prints carries the byte count and the key id, never the value');
  io.log(`seal-secret controls: ${ran} run, ${fail} failing`);
  return fail === 0;
}
function report(io, r, value) {
  // The value is a parameter here only so the control can prove it is not
  // printed; nothing below reads it.
  void value;
  io.log(`seal-secret: ${r.name} ${r.bytes} bytes sealed under key ${r.keyId}, PUT answered ${r.code}`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/\//g, '\\') || process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname;
if (isMain || (process.argv[1] && /seal-secret\.mjs$/.test(process.argv[1]))) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const verb = args[0];
  const repo = opt('--repo', REPO_DEFAULT);
  if (verb === 'controls') process.exit(controls(opt('--nacl', '.')) ? 0 : 1);
  const tok = token();
  if (!tok) { console.error('seal-secret: no github token in the credential helper'); process.exit(2); }
  if (verb === 'check') {
    const r = api(tok, 'GET', `/repos/${repo}/actions/secrets/${opt('--name', 'CLAUDE_CREDENTIALS_JSON')}`);
    console.log(`seal-secret: GET secret answered ${r.code}${r.code === 200 ? `, updated ${JSON.parse(r.body).updated_at}` : ''}`);
    process.exit(r.code === 200 ? 0 : 1);
  }
  if (verb === 'put') {
    const name = opt('--name', 'CLAUDE_CREDENTIALS_JSON');
    const file = opt('--file', '');
    if (!file || !existsSync(file)) { console.error('seal-secret: --file names no file'); process.exit(2); }
    const n = nacl(opt('--nacl', '.'));
    const key = api(tok, 'GET', `/repos/${repo}/actions/secrets/public-key`);
    if (key.code !== 200) { console.error(`seal-secret: public key answered ${key.code}`); process.exit(1); }
    const { key: pub, key_id } = JSON.parse(key.body);
    const value = readFileSync(file);
    const sealed = seal(n, Buffer.from(pub, 'base64'), value);
    const r = api(tok, 'PUT', `/repos/${repo}/actions/secrets/${name}`, { encrypted_value: sealed.toString('base64'), key_id });
    report(console, { name, bytes: value.length, keyId: key_id, code: r.code }, '');
    process.exit(r.code === 201 || r.code === 204 ? 0 : 1);
  }
  console.log('usage: node checker/seal-secret.mjs put --name N --file F --nacl DIR [--repo owner/name] | check --name N | controls --nacl DIR');
  process.exit(2);
}
