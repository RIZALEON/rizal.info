# TerraformЯ 0.5.1 — MERKADO ⇄ BOTLATCH (prepared change, NOT built, NOT signed)
Prepared 2026-10-29 ~01:50 MT by Grok Bot. Status: proposal for MEKANICA/Rizal.

## Where MERKADO lives
- Not found in rizal.info web code (front/teraformr branch) or the shipped web build (index.pck is packed; no readable MERKADO string).
- Not found in R:\TERAFORMR (parts are packed). Godot source is outside readable paths during ЯBOWZR's cleanup → **pending** source location.

## Change (apply in Godot 4.7.2 source, bump 0.5.0 → 0.5.1, also fixes "0.4" banner at ui.gd:493)
1. MERKADO menu: add entries
   - `BOTLATCH EXCHANGE` → OS.shell_open("https://rizal.info/botlatch/exchange/") (web: JavaScriptBridge.eval window.open)
   - `MINT TRACKER` → https://rizal.info/botlatch/tracker/
   - `CONTRACTS · Я` → https://rizal.info/botlatch/contracts/
2. MERKADO info panel (read-only): load `contracts.json` (bundle a copy + optional HTTPRequest refresh from https://rizal.info/botlatch/contracts/contracts.json):
   - Я / R Token · Solana · mint BB9uA5BuacDnWyDf5Npc9nMb9yFbyThsNrQPBYJ5Q1Lv · supply 1,000,000 · freeze none
   - Mint tx 2Lxr2mEZ…Lvx94; trackers Solscan token/account, Solana Explorer, SolanaFM (+ tx links)
   - Price lookups: Jupiter, GeckoTerminal, DexScreener, CoinGecko (by mint). Exclude DexScreener pair GnM6…pump (not R).
   - BSC: none yet · OpenSea: none yet
   - Orca Я/SOL pool HSroUxVkVKv6kX9e7dpoJtbFqKcL76BzrkuuRfAGxs9s
3. Signage art: use botlatch/market-banner.jpg as MERKADO backdrop.
4. Hard rules: no keys, no wallet in game, no trades; any trade = hand-off to RWALLET (ЯCASKET Face ID). R credits = local game credit, not money.
5. Build/sign: only after Rizal's GO; single ЯCASKET Face ID request; appcast stays unpublished until signed.
