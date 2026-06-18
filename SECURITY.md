# Security Policy

## Reporting a Vulnerability

If you believe you have found a security vulnerability in `@munityclubs/spl-burn-verify`, please report it privately by emailing **`security@munity.club`**.

Please do **not** open public GitHub issues for suspected security vulnerabilities. The maintainers monitor `security@munity.club` and will route reports to the engineering owner.

## Response Targets

- **First acknowledgment**: within 48 hours of receipt
- **Substantive response with triage outcome**: within 5 business days
- **Coordinated-disclosure default window**: 90 days from report to public disclosure or first patch release, whichever is sooner. Adjusted case-by-case with the reporter.

## In-Scope Surface

- SPL Token-2022 burn-instruction parsing correctness — discriminator confusion, instruction-data length attacks
- Confidential-transfer-extension-aware burn paths (Token-2022 only)
- Mint-decimal-resolution path against off-by-decimal undercounting
- Multi-instruction transaction handling — burn-instruction siblings, fee-payer separation, CPI re-entrance from non-Token programs
- Slot / commitment-level invariants — claims must not advance past requested commitment
- Signer-set verification: burn-from-owner vs burn-from-multisig, freeze-authority interactions
- Token-2022 extension validation (transfer-fee, interest-bearing, memo, immutable-owner) against incorrect amount derivations

## Out of Scope

- Solana RPC provider correctness or availability
- The underlying Token-2022 program correctness (the package surfaces verifiable claims about chain state, not chain semantics)
- Integrator-side caching or stale-data exposure
- Transitive-dependency issues with published advisories
- Network-level attacks (DNS, BGP, TLS downgrade)
- Phishing or social engineering against end users

## Supported Versions

The latest published minor version on the `main` branch is supported. Previous minor versions receive security patches for **90 days** after a new minor ships. Patch releases are tagged and announced in `CHANGELOG.md`.

## Public Audit Status

A third-party security audit (Sec3 engagement letter on file 2026-05-20) of v0.2 is planned (target ship: September 2026) contingent on grant funding. Audit findings will be published in the `audits/` directory of this repository before v0.2 is released to npm.

## Disclosure Acknowledgments

Researchers who report valid vulnerabilities under this policy are credited in the corresponding release notes and, with their permission, in this `SECURITY.md` after disclosure.

## Contact

**`security@munity.club`**

Munity maintains `security@munity.club` as the dedicated channel for vulnerability reports across all `@munityclubs/*` packages. See also: [munity.club/.well-known/security.txt](https://munity.club/.well-known/security.txt) (RFC 9116). PGP key publication is on the v0.2 roadmap.