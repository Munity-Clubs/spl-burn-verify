import { describe, expect, it } from "vitest";

import {
  SplBurnVerificationError,
  TOKEN_2022_PROGRAM_ID_STRING,
  rawTokenAmountFromInfo,
  validateBurnInstruction,
  verifyBurnParsedTransaction,
} from "../index.js";

const TX_SIG = "5".repeat(88);
const DEPLOYER = "Deploy111111111111111111111111111111111111";
const MINT = "Mint111111111111111111111111111111111111111";
const STANDARD_SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const MIN_RAW = 100_000_000_000n;

function parsedTx({
  deployer = DEPLOYER,
  mint = MINT,
  programId = TOKEN_2022_PROGRAM_ID_STRING,
  amountRaw = MIN_RAW.toString(),
  decimals = 6,
  type = "burnChecked",
  signer = true,
  authority = deployer,
  metaErr = null,
} = {}) {
  return {
    slot: 123,
    meta: {
      err: metaErr,
      innerInstructions: [],
    },
    transaction: {
      message: {
        accountKeys: [{ pubkey: deployer, signer }],
        instructions: [
          {
            programId,
            parsed: {
              type,
              info: {
                account: "TokenAccount1111111111111111111111111111",
                mint,
                authority,
                tokenAmount: {
                  amount: amountRaw,
                  decimals,
                },
              },
            },
          },
        ],
      },
    },
  };
}

describe("@munityclubs/spl-burn-verify", () => {
  it("accepts a Token-2022 burnChecked matching mint, authority, decimals, and amount", () => {
    const result = verifyBurnParsedTransaction({
      tx: parsedTx(),
      txSig: TX_SIG,
      expectedAuthority: DEPLOYER,
      expectedMint: MINT,
      minAmountRaw: MIN_RAW,
      decimals: 6,
    });

    expect(result).toEqual({
      txSig: TX_SIG,
      slot: 123,
      amountRaw: MIN_RAW.toString(),
      decimals: 6,
      mint: MINT,
      authority: DEPLOYER,
      instructionType: "burnChecked",
    });
  });

  it("rejects standard SPL Token burns when Token-2022 is required", () => {
    expect(() =>
      verifyBurnParsedTransaction({
        tx: parsedTx({ programId: STANDARD_SPL_TOKEN_PROGRAM }),
        expectedAuthority: DEPLOYER,
        expectedMint: MINT,
        minAmountRaw: MIN_RAW,
        decimals: 6,
      }),
    ).toThrow(SplBurnVerificationError);
  });

  it("returns specific validation failure codes for reusable callers", () => {
    const instruction = parsedTx({ amountRaw: "1" }).transaction.message
      .instructions[0];
    const result = validateBurnInstruction({
      instruction,
      expectedAuthority: DEPLOYER,
      expectedMint: MINT,
      signerPubkeys: new Set([DEPLOYER]),
      minAmountRaw: MIN_RAW,
      decimals: 6,
    });

    expect(result).toMatchObject({ ok: false, code: "amount_too_low" });
  });

  it("rejects wrong mint, wrong decimals, failed transactions, and wrong signer", () => {
    expect(() =>
      verifyBurnParsedTransaction({
        tx: parsedTx(),
        expectedAuthority: DEPLOYER,
        expectedMint: "OtherMint1111111111111111111111111111111",
        minAmountRaw: MIN_RAW,
        decimals: 6,
      }),
    ).toThrow(/expected mint/);

    expect(() =>
      verifyBurnParsedTransaction({
        tx: parsedTx({ decimals: 9 }),
        expectedAuthority: DEPLOYER,
        expectedMint: MINT,
        minAmountRaw: MIN_RAW,
        decimals: 6,
      }),
    ).toThrow(/decimals/);

    expect(() =>
      verifyBurnParsedTransaction({
        tx: parsedTx({ metaErr: { InstructionError: [0, "Custom"] } }),
        expectedAuthority: DEPLOYER,
        expectedMint: MINT,
      }),
    ).toThrow(/failed/);

    expect(() =>
      verifyBurnParsedTransaction({
        tx: parsedTx({ authority: "OtherSigner111111111111111111111111111" }),
        expectedAuthority: DEPLOYER,
        expectedMint: MINT,
        minAmountRaw: MIN_RAW,
        decimals: 6,
      }),
    ).toThrow(/authority/);
  });

  it("parses supported raw amount shapes", () => {
    expect(rawTokenAmountFromInfo({ amount: "10" })).toBe(10n);
    expect(rawTokenAmountFromInfo({ uiTokenAmount: { amount: "11" } })).toBe(11n);
    expect(rawTokenAmountFromInfo({ amount: "1.1" })).toBeNull();
  });
});
