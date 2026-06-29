import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getMint,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Recipient, TokenKind, AirdropResult } from "./types";

export interface WalletLike {
  publicKey: PublicKey | null;
  signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>;
}

export interface AirdropParams {
  connection: Connection;
  wallet: WalletLike;
  kind: TokenKind;
  mint?: string; // required for spl
  recipients: Recipient[];
  onUpdate: (recipientId: string, patch: Partial<AirdropResult>) => void;
}

export function isValidPubkey(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new PublicKey(value.trim());
    return true;
  } catch {
    return false;
  }
}

/** Convert a human decimal string to base units without float rounding. */
export function toBaseUnits(amount: string, decimals: number): bigint {
  const clean = amount.trim();
  if (!clean) return 0n;
  const [whole, frac = ""] = clean.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const digits = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, "");
  return BigInt(digits || "0");
}

interface ValidRecipient extends Recipient {
  pubkey: PublicKey;
}

function prepare(recipients: Recipient[]): {
  valid: ValidRecipient[];
  invalid: AirdropResult[];
} {
  const valid: ValidRecipient[] = [];
  const invalid: AirdropResult[] = [];
  for (const r of recipients) {
    const amount = parseFloat(r.amount);
    if (!isValidPubkey(r.wallet)) {
      invalid.push({
        recipientId: r.id,
        username: r.username,
        wallet: r.wallet,
        phase: "failed",
        error: "Invalid wallet address",
      });
      continue;
    }
    if (!(amount > 0)) {
      invalid.push({
        recipientId: r.id,
        username: r.username,
        wallet: r.wallet,
        phase: "failed",
        error: "Amount must be greater than 0",
      });
      continue;
    }
    valid.push({ ...r, pubkey: new PublicKey(r.wallet.trim()) });
  }
  return { valid, invalid };
}

/**
 * Build one transaction per recipient, sign them all with a single wallet
 * approval, then send sequentially while reporting per-recipient status.
 */
export async function runAirdrop(
  params: AirdropParams
): Promise<AirdropResult[]> {
  const { connection, wallet, kind, mint, recipients, onUpdate } = params;
  if (!wallet.publicKey) throw new Error("Connect a wallet first.");
  if (!wallet.signAllTransactions)
    throw new Error("Wallet does not support batch signing.");

  const { valid, invalid } = prepare(recipients);
  for (const inv of invalid) onUpdate(inv.recipientId, inv);
  if (valid.length === 0) return invalid;

  const payer = wallet.publicKey;
  let decimals = 9;
  let mintPubkey: PublicKey | null = null;
  let sourceAta: PublicKey | null = null;

  if (kind === "spl") {
    if (!mint || !isValidPubkey(mint))
      throw new Error("Enter a valid token mint address.");
    mintPubkey = new PublicKey(mint.trim());
    const mintInfo = await getMint(connection, mintPubkey);
    decimals = mintInfo.decimals;
    sourceAta = await getAssociatedTokenAddress(mintPubkey, payer);
    try {
      await getAccount(connection, sourceAta);
    } catch {
      throw new Error(
        "Your wallet has no token account for this mint (zero balance)."
      );
    }
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  // Build a transaction per recipient.
  const built = await Promise.all(
    valid.map(async (r) => {
      const tx = new Transaction();
      tx.feePayer = payer;
      tx.recentBlockhash = blockhash;

      if (kind === "sol") {
        const lamports = BigInt(
          Math.round(parseFloat(r.amount) * LAMPORTS_PER_SOL)
        );
        tx.add(
          SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: r.pubkey,
            lamports,
          })
        );
      } else {
        const destAta = await getAssociatedTokenAddress(mintPubkey!, r.pubkey);
        let needsAta = false;
        try {
          await getAccount(connection, destAta);
        } catch {
          needsAta = true;
        }
        if (needsAta) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              payer,
              destAta,
              r.pubkey,
              mintPubkey!
            )
          );
        }
        tx.add(
          createTransferCheckedInstruction(
            sourceAta!,
            mintPubkey!,
            destAta,
            payer,
            toBaseUnits(r.amount, decimals),
            decimals,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }

      onUpdate(r.id, {
        recipientId: r.id,
        username: r.username,
        wallet: r.wallet,
        phase: "pending",
      });
      return { recipient: r, tx };
    })
  );

  const signed = await wallet.signAllTransactions(built.map((b) => b.tx));

  const results: AirdropResult[] = [...invalid];
  for (let i = 0; i < built.length; i++) {
    const { recipient } = built[i];
    try {
      const sig = await connection.sendRawTransaction(signed[i].serialize(), {
        skipPreflight: false,
      });
      onUpdate(recipient.id, { phase: "sent", signature: sig });
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      onUpdate(recipient.id, { phase: "confirmed", signature: sig });
      results.push({
        recipientId: recipient.id,
        username: recipient.username,
        wallet: recipient.wallet,
        phase: "confirmed",
        signature: sig,
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : "Transaction failed";
      onUpdate(recipient.id, { phase: "failed", error });
      results.push({
        recipientId: recipient.id,
        username: recipient.username,
        wallet: recipient.wallet,
        phase: "failed",
        error,
      });
    }
  }

  return results;
}
