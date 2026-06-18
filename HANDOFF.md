# Handoff — `@munityclubs/spl-burn-verify`

> One-page orientation for anyone landing on this repo cold: a new collaborator, a code auditor, a grant reviewer, or future-you after a long context switch.

## What this is

Storage-neutral SPL Token-2022 burn transaction verification helpers. The package takes a parsed Solana transaction and verifies that a documented burn occurred — handling discriminator parsing, multi-instruction transactions, slot/commitment invariants, multisig signer sets, and Token-2022 extension semantics (transfer-fee, interest-bearing, etc.). It does **not** own RPC, database, or app-specific state.

## Current state (2026-05-24)

- **Version:** `v0.1.0` (npm) — published 2026-05-20
- **License:** Apache-2.0
- **Stability:** v0.1 covers standard SPL + Token-2022 burns. Multi-instruction handling and decimal-resolution are exercised in Munity production for burn-to-unlock flows.
- **Experimental:** none in v0.1.
- **Open work:** v0.2 ships fuller confidential-transfer-extension support, batch verification helpers, and additional Token-2022 extension coverage.

## How it fits the Munity stack

- **Munity webapp** uses the package server-side to verify burn-to-unlock claims: a user pastes a Solana transaction signature, the package verifies the documented burn happened with the claimed amount + mint + signer set, and the unlock flow proceeds.
- **Hard rule** that this package never gets paired with: no fiat→crypto burns. Burns originate from on-chain $MUNITY only (see [`project_no_fiat_to_crypto_burns.md`](file:///Users/mind/.claude/projects/-Users-mind-Documents-mindmac-Work-Space-Projects-MUNITY-MUNITY-VSCODE-REPO-munity-full-stack-fullstack-/memory/project_no_fiat_to_crypto_burns.md)).
- **Companion packages:** `@munityclubs/coin-club-verify` (same storage-neutral verification pattern, different surface — deployer verification).

## Where it's deployed

| Surface | Address / URL |
|---|---|
| npm | [`@munityclubs/spl-burn-verify@0.1.0`](https://www.npmjs.com/package/@munityclubs/spl-burn-verify) |
| Source | [github.com/Munity-Clubs/spl-burn-verify](https://github.com/Munity-Clubs/spl-burn-verify) |
| Production consumer | Munity webapp burn-to-unlock flows |
| Subject mint (typical) | $MUNITY [`5nxjUeC4GA5m46KLpLThb5QV4cy3186sV2BZsJ64pump`](https://solscan.io/token/5nxjUeC4GA5m46KLpLThb5QV4cy3186sV2BZsJ64pump) |

## How to verify

```bash
npm view @munityclubs/spl-burn-verify dist
git clone https://github.com/Munity-Clubs/spl-burn-verify
cd spl-burn-verify && npm install && npm test
```

## Roadmap pointer

v0.2 confidential-transfer-extension support + batch verification are scoped under the Sec3 audit (engagement letter on file 2026-05-20). Concrete v0.2 commitments live in Munity SF Standard / Convertible drafts where this package is referenced as a verification primitive.

## Security + disclosure

- See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting policy and in-scope surface.
- Contact: `security@munity.club`
- RFC 9116: [`munity.club/.well-known/security.txt`](https://munity.club/.well-known/security.txt)
- Sec3 third-party audit engagement letter on file 2026-05-20.