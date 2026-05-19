export const TOKEN_2022_PROGRAM_ID_STRING =
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export const DEFAULT_BURN_TYPES = new Set([
  "burn",
  "burnchecked",
  "burn_checked",
]);

export class SplBurnVerificationError extends Error {
  constructor(code, message, status = 422) {
    super(message);
    this.name = "SplBurnVerificationError";
    this.code = code;
    this.status = status;
  }
}

function fail(code, message, status) {
  throw new SplBurnVerificationError(code, message, status);
}

function asPubkeyString(value) {
  if (!value) return "";
  if (typeof value?.toBase58 === "function") return value.toBase58();
  if (value?.pubkey) return asPubkeyString(value.pubkey);
  return String(value || "").trim();
}

function samePubkey(a, b) {
  const A = asPubkeyString(a);
  const B = asPubkeyString(b);
  return Boolean(A && B && A === B);
}

export function rawTokenAmountFromInfo(info = {}) {
  const raw =
    info?.tokenAmount?.amount ??
    info?.amount ??
    info?.uiTokenAmount?.amount ??
    "";
  const normalized = String(raw || "").trim();
  if (!/^(0|[1-9]\d*)$/.test(normalized)) return null;
  try {
    return BigInt(normalized);
  } catch {
    return null;
  }
}

export function decimalsFromInfo(info = {}) {
  const raw =
    info?.tokenAmount?.decimals ??
    info?.decimals ??
    info?.uiTokenAmount?.decimals;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

export function signerSetFromTransaction(tx) {
  const keys = tx?.transaction?.message?.accountKeys || [];
  const signers = new Set();

  for (const key of keys) {
    const signer =
      key?.signer === true ||
      key?.isSigner === true ||
      key?.signature === true;
    if (signer) {
      const pubkey = asPubkeyString(key?.pubkey || key);
      if (pubkey) signers.add(pubkey);
    }
  }

  return signers;
}

export function transactionInstructions(tx) {
  const topLevel = tx?.transaction?.message?.instructions || [];
  const inner = [];

  for (const entry of tx?.meta?.innerInstructions || []) {
    for (const instruction of entry?.instructions || []) {
      inner.push(instruction);
    }
  }

  return [...topLevel, ...inner];
}

function parsedType(instruction) {
  return String(instruction?.parsed?.type || "")
    .replace(/[_\s-]/g, "")
    .toLowerCase();
}

function hasSigner(signers, wallet) {
  for (const signer of signers) {
    if (samePubkey(signer, wallet)) return true;
  }
  return false;
}

export function validateBurnInstruction({
  instruction,
  expectedAuthority,
  expectedMint,
  signerPubkeys,
  minAmountRaw = 1n,
  decimals,
  tokenProgramId = TOKEN_2022_PROGRAM_ID_STRING,
} = {}) {
  const type = parsedType(instruction);
  if (!DEFAULT_BURN_TYPES.has(type)) {
    return { ok: false, code: "not_burn_instruction" };
  }

  if (!samePubkey(instruction?.programId, tokenProgramId)) {
    return { ok: false, code: "wrong_token_program" };
  }

  const info = instruction?.parsed?.info || {};
  if (expectedMint && !samePubkey(info?.mint, expectedMint)) {
    return { ok: false, code: "wrong_mint" };
  }

  const amountRaw = rawTokenAmountFromInfo(info);
  if (amountRaw === null) {
    return { ok: false, code: "invalid_amount" };
  }
  const minRaw = BigInt(minAmountRaw);
  if (amountRaw < minRaw) {
    return { ok: false, code: "amount_too_low", amountRaw };
  }

  const observedDecimals = decimalsFromInfo(info);
  if (
    type === "burnchecked" &&
    decimals !== undefined &&
    observedDecimals !== Number(decimals)
  ) {
    return {
      ok: false,
      code: "decimals_mismatch",
      amountRaw,
      decimals: observedDecimals,
    };
  }

  const authority = info?.authority || info?.owner || info?.multisigAuthority;
  if (expectedAuthority && !samePubkey(authority, expectedAuthority)) {
    return { ok: false, code: "signer_mismatch", amountRaw, decimals };
  }

  if (expectedAuthority && !hasSigner(signerPubkeys || new Set(), expectedAuthority)) {
    return { ok: false, code: "signer_mismatch", amountRaw, decimals };
  }

  return {
    ok: true,
    instructionType: type === "burnchecked" ? "burnChecked" : "burn",
    amountRaw,
    decimals: observedDecimals ?? decimals ?? null,
    mint: asPubkeyString(info.mint),
    authority: asPubkeyString(authority),
  };
}

function firstSpecificFailure(failures) {
  const priority = [
    "wrong_mint",
    "amount_too_low",
    "decimals_mismatch",
    "signer_mismatch",
    "invalid_amount",
    "wrong_token_program",
  ];

  for (const code of priority) {
    const match = failures.find((failure) => failure.code === code);
    if (match) return match;
  }
  return failures[0] || { code: "no_token_burn" };
}

function throwInstructionFailure(failure) {
  if (failure.code === "wrong_mint") {
    fail("wrong_mint", "Burn mint is not the expected mint");
  }
  if (failure.code === "amount_too_low") {
    fail("amount_too_low", "Burn amount is below the required minimum");
  }
  if (failure.code === "decimals_mismatch") {
    fail("decimals_mismatch", "Burn decimals do not match the expected mint");
  }
  if (failure.code === "signer_mismatch") {
    fail("signer_mismatch", "Burn authority must sign the transaction");
  }
  if (failure.code === "invalid_amount") {
    fail("invalid_amount", "Burn amount is invalid");
  }
  fail(
    "no_token_burn",
    "Transaction does not contain a matching token burn instruction",
  );
}

export function verifyBurnParsedTransaction({
  tx,
  txSig,
  expectedAuthority,
  expectedMint,
  minAmountRaw = 1n,
  decimals,
  tokenProgramId = TOKEN_2022_PROGRAM_ID_STRING,
} = {}) {
  if (tx?.meta?.err) {
    fail("transaction_failed", "Transaction failed", 409);
  }

  const signerPubkeys = signerSetFromTransaction(tx);
  const failures = [];

  for (const instruction of transactionInstructions(tx)) {
    const result = validateBurnInstruction({
      instruction,
      expectedAuthority,
      expectedMint,
      signerPubkeys,
      minAmountRaw,
      decimals,
      tokenProgramId,
    });
    if (result.ok) {
      return {
        txSig,
        slot: tx?.slot ?? null,
        amountRaw: result.amountRaw.toString(),
        decimals: result.decimals,
        mint: result.mint,
        authority: result.authority,
        instructionType: result.instructionType,
      };
    }
    if (result.code !== "not_burn_instruction") failures.push(result);
  }

  throwInstructionFailure(firstSpecificFailure(failures));
}
