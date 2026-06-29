/**
 * Devnet dry-run: exercises the REAL runAirdrop() from lib/airdrop.ts against
 * live Solana devnet, using a generated keypair as the signing wallet.
 *
 * Proves: SPL ATA-creation + transferChecked, native SOL transfer, batch
 * signing, and confirmation — the same code path the UI uses.
 *
 * Run: npx tsx scripts/devnet-dryrun.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  Connection,
  Keypair,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { runAirdrop, type WalletLike } from "../lib/airdrop";
import type { Recipient } from "../lib/types";

const CLUSTER = "devnet";
const RPC = process.env.DEVNET_RPC || clusterApiUrl(CLUSTER);
const link = (sig: string) => `https://solscan.io/tx/${sig}?cluster=devnet`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const KEY_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  ".devnet-payer.json"
);

/** Reuse a persisted payer so a funded address survives between runs. */
function loadPayer(): Keypair {
  if (process.env.DEVNET_PAYER) {
    const raw = process.env.DEVNET_PAYER.trim();
    const secret = raw.startsWith("[")
      ? Uint8Array.from(JSON.parse(raw))
      : Uint8Array.from(Buffer.from(raw, "base64"));
    return Keypair.fromSecretKey(secret);
  }
  if (existsSync(KEY_PATH)) {
    return Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(readFileSync(KEY_PATH, "utf8")))
    );
  }
  const kp = Keypair.generate();
  writeFileSync(KEY_PATH, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

function walletFor(kp: Keypair): WalletLike {
  return {
    publicKey: kp.publicKey,
    signAllTransactions: async (txs: Transaction[]) => {
      for (const tx of txs) tx.partialSign(kp);
      return txs;
    },
  };
}

function logUpdate(id: string, patch: Record<string, unknown>) {
  if (patch.phase === "confirmed")
    console.log(`   ✓ ${id} confirmed → ${link(String(patch.signature))}`);
  else if (patch.phase === "failed")
    console.log(`   ✗ ${id} failed: ${patch.error}`);
}

/** Best-effort faucet top-up; returns true if the payer ends up funded enough. */
async function ensureFunded(
  connection: Connection,
  payer: Keypair
): Promise<boolean> {
  const need = 0.3 * LAMPORTS_PER_SOL;
  let bal = await connection.getBalance(payer.publicKey);
  if (bal >= need) {
    console.log(`   already funded: ${bal / LAMPORTS_PER_SOL} SOL`);
    return true;
  }
  console.log("→ Requesting 1 SOL from devnet faucet…");
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const sig = await connection.requestAirdrop(
        payer.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      const bh = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction({ signature: sig, ...bh }, "confirmed");
      break;
    } catch (e) {
      console.log(
        `   faucet attempt ${attempt} failed: ${
          e instanceof Error ? e.message.split("\n")[0] : e
        }`
      );
      await sleep(2000);
    }
  }
  bal = await connection.getBalance(payer.publicKey);
  return bal >= need;
}

async function main() {
  const connection = new Connection(RPC, "confirmed");
  const payer = loadPayer();
  const r1 = Keypair.generate();
  const r2 = Keypair.generate();

  console.log("=== ANSEM Airdrop — Devnet dry-run ===");
  console.log("RPC   :", RPC);
  console.log("payer :", payer.publicKey.toBase58());
  console.log("recip1:", r1.publicKey.toBase58());
  console.log("recip2:", r2.publicKey.toBase58());

  if (!(await ensureFunded(connection, payer))) {
    console.log(
      "\n⚠ Payer is not funded and the devnet faucet is rate-limited.\n" +
        "  Fund this address (any amount ≥ 0.3 SOL) then re-run this script:\n" +
        `    ${payer.publicKey.toBase58()}\n` +
        "  Web faucet: https://faucet.solana.com  (select Devnet)\n" +
        "  Or pass a funded key:  DEVNET_PAYER=<base64|json-array> npx tsx scripts/devnet-dryrun.ts\n" +
        "  The payer keypair is persisted at scripts/.devnet-payer.json so it survives re-runs."
    );
    process.exit(2);
  }

  // Create a test SPL mint (6 decimals) and mint supply to payer.
  console.log("\n→ Creating test SPL mint (6 decimals)…");
  const mint = await createMint(connection, payer, payer.publicKey, null, 6);
  console.log("   mint:", mint.toBase58());
  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );
  await mintTo(connection, payer, mint, payerAta.address, payer, 1_000_000_000); // 1,000 tokens
  console.log("   minted 1,000 test tokens to payer ATA");

  const wallet = walletFor(payer);
  const recipients: Recipient[] = [
    {
      id: "spl-1",
      username: "alice",
      wallet: r1.publicKey.toBase58(),
      amount: "12.5",
    },
    {
      id: "spl-2",
      username: "bob",
      wallet: r2.publicKey.toBase58(),
      amount: "7",
    },
  ];

  console.log("\n→ SPL airdrop (transferChecked + auto ATA creation)…");
  const splResults = await runAirdrop({
    connection,
    wallet,
    kind: "spl",
    mint: mint.toBase58(),
    recipients,
    onUpdate: logUpdate,
  });

  console.log("\n→ Native SOL airdrop…");
  const solRecipients: Recipient[] = [
    { id: "sol-1", username: "alice", wallet: r1.publicKey.toBase58(), amount: "0.01" },
    { id: "sol-2", username: "bob", wallet: r2.publicKey.toBase58(), amount: "0.02" },
  ];
  const solResults = await runAirdrop({
    connection,
    wallet,
    kind: "sol",
    recipients: solRecipients,
    onUpdate: logUpdate,
  });

  // Verify balances landed.
  console.log("\n→ Verifying recipient balances…");
  const r1Ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    r1.publicKey
  );
  const r2Ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    r2.publicKey
  );
  console.log(
    `   alice: token=${Number(r1Ata.amount) / 1e6}  SOL=${
      (await connection.getBalance(r1.publicKey)) / LAMPORTS_PER_SOL
    }`
  );
  console.log(
    `   bob  : token=${Number(r2Ata.amount) / 1e6}  SOL=${
      (await connection.getBalance(r2.publicKey)) / LAMPORTS_PER_SOL
    }`
  );

  const all = [...splResults, ...solResults];
  const ok = all.filter((r) => r.phase === "confirmed").length;
  console.log(`\n=== RESULT: ${ok}/${all.length} transfers confirmed ===`);
  if (ok !== all.length) process.exit(1);
}

main().catch((e) => {
  console.error("\nFATAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
