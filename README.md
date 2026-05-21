# @munityclubs/spl-burn-verify

Storage-neutral SPL Token-2022 burn transaction verification helpers.

Munity uses this pattern for burn-to-unlock utility flows. The package verifies
parsed Solana transaction objects without owning RPC, database, or app-specific
state.

## Install

```bash
npm install @munityclubs/spl-burn-verify
```

## Usage

```js
import { verifyBurnParsedTransaction } from "@munityclubs/spl-burn-verify";

const result = verifyBurnParsedTransaction({
  tx: parsedTransaction,
  txSig,
  expectedAuthority: wallet,
  expectedMint: tokenMint,
  minAmountRaw: 100_000_000_000n,
  decimals: 6,
});

console.log(result.amountRaw, result.authority);
```

## What It Checks

- Transaction did not fail
- Parsed instruction type is `burn` or `burnChecked`
- Instruction uses the SPL Token-2022 program by default
- Mint matches the expected mint
- Raw burn amount meets the minimum
- `burnChecked` decimals match the expected mint decimals
- Expected authority signed the transaction

Apps still need to fetch the parsed transaction, check confirmation status, and
store one-time burn usage in their own persistence layer.

## Development

```bash
yarn install
yarn test
```

## License

Apache-2.0
