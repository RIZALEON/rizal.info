> rizal.info copy (2026-11-17, Rizal GO t246u): same verifier as rizal.pw /rtor (from rizal.pw 9a09187/bac2a66). On rizal.info the RWALLET v6 drift gate is wired (rwallet-v6/, needs `RWALLET.sha256.sig.json`); rizal.info has no in-page updater (rdiag), so the version-manifest gate below applies to rizal.pw only.

# /rtor — Rtor verify for rizal.pw (branch rtor-verify-20261117)
`rtor-verify.js` pins Rizal's release public key (keyId prefix e5833fdf, same key as RDRAGON SelfUpdate / rlab-sign / ЯCASKET).
Message format = rlab-update-v1, so ЯCASKET Face ID signatures verify directly. Fail-closed.

Gates added:
- `RDIAG.update.check/hot/force` only act on `/rdragon-version.json` when `/rdragon-version.json.sig.json`
  (kind web, id `rizal.pw-version`, name `rdragon-version.json`) verifies against the owner key + exact bytes.
- RWALLET v6 drift check also requires `RWALLET.sha256.sig.json` (name `RWALLET.sha256`); unsigned = warning.

## Rollout order (do not merge before step 2)
1. Regenerate `rdragon-version.json` (`node tests/diag-profile/make-version-manifest.js`).
2. Rizal commands ThundR to sign it: `~/R/ЯLAB/RTOR/tools/rtor-sign-request --signer thundr --app rizal.pw-version --version <v> --file rdragon-version.json --owner-command "<Rizal: rizal.pw-version <v> <sha12>>" --queue`,
   approve with Face ID on the 17e, copy the produced `rdragon-version.json.sig.json` next to the manifest. Same for `rwallet-v6/RWALLET.sha256`.
3. Merge to main (Rizal) → Pages deploys. Every later manifest change needs a new signature (CI does not sign).

## 2026-11-18 · rtor-finish-20261118 (ЯBOWZR for Rizal, local branch, not pushed)
Parity with rizal.pw branch rtor-finish-20261118:
- `/rtor/feed.json` (`rtor-feed-v1`, `node tests/rtor/make-feed.cjs`): the public files on rizal.info (RWALLET.sha256, appcasts,
  TerraformЯ updates manifest + GIZMO pack), each with size + sha256 + expected `.sig.json`, all `signed: false` / pending.
  No inline signatures, so rtor-verify.js refuses every entry until Rizal's sidecar is published. Test: `node tests/rtor/test-feed.cjs`.
- `/rtor/join/`: same join page as rizal.pw → ЯLOGIN option 3 on https://rizal.pw/login/options/ (Face ID approval, no secrets).
- `/rtor/` links both; the homepage now loads `/rtor/rtor-verify.js` like rizal.pw does. rizal.info still has no rdiag in-page updater.

### Feed consumers are now gated (Rizal YES 2026-11-18, 1:49 PM MT)
- `/rtor/rtor-feeds.js` (`RTOR_FEEDS`): `fetchVerifiedJSON(url)` returns JSON only when `<url>.sig.json` verifies under the pinned
  owner key for that exact file (id + name, ids = `tests/rtor/make-feed.cjs`). Otherwise `{refused, status:"refused: signature missing/invalid", why}`.
- Wired: `/rtor/` checks every feed entry live; `terraformya/updates/` lists patches only from a verified manifest.
  rizal.info also: the TerraformЯ egg (`terraformya/play/`) allows `.pck` patches only from a verified `manifest.json`, and
  `download/notices.js` (ЯBOWZR / ЯBOT update alerts) uses only signed appcasts.
- Native apps (RDRAGON SelfUpdate, ThundR, RCODE, GIZMO) read these appcasts outside this repo; they need the same
  sidecar rule in RtorVerify.swift / rtor_verify.py on their own branches (not done here).
- Until Rizal's sidecars are placed, all of these show "refused: signature missing/invalid" on purpose.
- rizal.info appcasts synced from rizal.pw (byte-identical, so one signature serves both sites). rizal.info-only feeds kept: `dragon-skull/appcast.json`, `rbowzr/appcast.json`, `ybot/appcast.json`.


## 1.1 — lab-device sources (Rizal t176u, 2026-11-18)
"All updates with a source from one of our three devices are accepted for seed, leech, send and receive."
A plain `source` label is spoofable, so device origin is cryptographic:
- `ghostkey.json` (was `rtor-devices.json`, now an alias) pins the lab devices' **public** P-256 keys (iPhone 17e, MacBook Neo, Moto Android; from the Rizal-edited ASSM-RSYNC `trusted-devices.json`), fingerprint = first 12 hex of sha256(raw key), ops `seed leech send receive`.
- A device-sourced sidecar carries `device` (fingerprint) and `p256` (ECDSA-P256-SHA256, raw r||s or DER, base64) over
  `rlab-device-update-v1\n<fp>\n<kind>\n<id>\n<version>\n<name>\n<size>\n<sha256>`.
- `verifyItemFrom(item, op)` / `verifyItemBytesFrom(item, bytes, op)`: owner `e5833fdfbbfe` (ed25519) for every op, or a pinned ACTIVE device allowed that op. Size + sha256 always checked.
- Refused: unsigned, label-only (`source: "neo"`), unknown or revoked device, op not allowed, tampered fields or bytes.
- The list is pinned in the verifier; a remote copy counts only if owner-signed. No private key is ever in this repo or held by a bot.
- Tests: `node tests/rtor/test-devices.cjs` (throwaway in-memory TEST keys).

## 1.2 — GHOSTKEY (Rizal t177u, 2026-11-18): "Change owner command to Ghostkey and integrate all keys into that one"
Private keys cannot be merged, so GHOSTKEY is ONE trust root + keyring (`/rtor/ghostkey.json`, schema `ghostkey-ring-v1`):
- **root** = owner key `e5833fdfbbfe` (ed25519, ЯCASKET / Face ID); **members** = the six registered device/app P-256 keys
  (17e `772af9d72bb8` `cd8e3026fe33` · Neo `f905b7901a31` `75b0428a4d67` `5e110f5d1b4c` · Moto `da2a35874ca0`), each with ops + status.
- Apps check one thing: `verifyGhostkey(item, op)` / `verifyGhostkeyBytes(item, bytes, op)` = signed by the root OR by an ACTIVE member allowed `op`.
- A ring from the web replaces the pinned ring only through `ringFromSigned(ringBytes, sidecar)`: sidecar `ghostkey.json.sig.json`
  (kind `ghostkey`, id `ghostkey-ring`, name `ghostkey.json`) signed by the root. Until Rizal signs it, the ring pinned in the verifier counts.
- The authorization label `owner-command` / `authorized-by-owner-command` is renamed `ghostkey` / `authorized-by-ghostkey`;
  the old names are read-only aliases. A label (either name) without a real signature + size/sha256 is refused.
- Tests: `node tests/rtor/test-ghostkey.cjs`.
