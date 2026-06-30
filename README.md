# Cashtag Viral Leaderboard + Airdrop — $ANSEM (Solana)

Find the most viral X (Twitter) posts for a cashtag, curate out suspected bot/fake posts, collect a wallet per creator, and **airdrop tokens directly to them on Solana** — with per-wallet custom amounts and CSV import.

Built around **$ANSEM** (`9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`), but the airdrop mint is editable so you can use any SPL token (or native SOL).

> The leaderboard lives entirely in your browser (localStorage). There is **no smart contract / no on-chain storage** — the only on-chain action is the airdrop itself (SPL/SOL transfers signed by your connected wallet).

---

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **@solana/web3.js** + **@solana/spl-token** for transfers
- **@solana/wallet-adapter** (Phantom, Solflare)
- **PapaParse** for CSV import
- **Web Crypto API (AES-GCM)** for encrypting the X Bearer Token

---

## Running the app

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Optional environment overrides (copy `.env.local.example` → `.env.local`):

```bash
NEXT_PUBLIC_RPC_MAINNET=https://your-mainnet-rpc
NEXT_PUBLIC_RPC_DEVNET=https://your-devnet-rpc
```

The public Solana RPCs work for testing but are rate-limited. For real mainnet
airdrops, use a dedicated RPC (Helius, QuickNode, Triton).

---

## Deploy to Vercel

The app is a standard Next.js 15 project — Vercel auto-detects it, no config needed.

1. Push to GitHub (already done) → in Vercel, **Add New… → Project → Import** this repo.
2. Framework preset: **Next.js** (auto). Build command and output are auto-configured.
3. **Environment variables are optional** — the app builds and runs with zero env vars (X token is entered in-browser; RPC falls back to public endpoints). Add these only when you're ready for mainnet airdrops:
   - `NEXT_PUBLIC_RPC_MAINNET` — your dedicated mainnet RPC
   - `NEXT_PUBLIC_RPC_DEVNET` — (optional) devnet RPC
4. Deploy. The `/api/x/search` proxy runs as a serverless function automatically.

> The X Bearer Token is **never** a Vercel env var — each user enters their own in the app, encrypted in their browser.

---

## Securely adding your X Bearer Token

The token is **encrypted in your browser** and never stored on a server.

1. Get a Bearer Token at [developer.x.com](https://developer.x.com) → your Project → **Keys and tokens**.
   - **Pay-as-you-go** access is required for the `impression_count` metric on the recent-search endpoint.
2. In the app header, click **API Key**, paste the token, and click **Encrypt & Save**.

**How it works:** a non-extractable AES-GCM key is generated and stored in
IndexedDB (its raw bytes never leave the browser's crypto subsystem). Only the
encrypted ciphertext + IV are kept in localStorage. The token is decrypted in
memory only at fetch time, then sent to the app's own route handler
(`/api/x/search`) which proxies the request to X — required because the X API
does not allow direct browser calls (CORS). Use **Remove saved token** to wipe it.

---

## Using the app

### 1. Fetch from X
- Enter a cashtag (defaults to `ANSEM`) and click **Fetch Top Posts**.
- Returns the **top 10 by engagement (likes + reposts) over the last 7 days**. The X API can't sort/filter by popularity and its `impression_count` is unreliable (often far below real views), so the app pulls a `relevancy` batch and ranks it by engagement client-side.
- **Cost:** X bills ~**$0.005 per post returned**. Each fetch pulls `X_SEARCH_MAX_RESULTS` posts (default 50 ≈ $0.25). Raise toward 100 for better coverage of the week's biggest posts, or lower to cut cost.
- Results are **cached locally** — switching tabs or refreshing won't trigger another paid call.
- Click **Add to Leaderboard** to move them over.

### 2. Leaderboard
- Each row: rank, username, impressions, date, post link.
- Paste a **wallet address** per creator (saved automatically per cashtag).
- Use **Remove** to drop a row you don't want.
- Use the checkboxes + **Airdrop to Selected** for bulk, or the per-row **Airdrop** button for a single recipient.

### 3. Airdrop (the core feature)
Opens a modal with:

- **Token selection** — **SPL** (mint prefilled with $ANSEM, editable) or **native SOL**.
- **Recipients table** — Username · Wallet (editable) · **Amount (editable per row)**.
- **Per-wallet amounts** — every recipient has its own amount. Use **Copy 1st amount ↓** to apply the first row's amount to all.
- **Import CSV** — see format below.
- **Live total** at the bottom, plus a count of valid recipients and the active network.
- **Send Airdrop** — your wallet signs all transfers in **one approval** (`signAllTransactions`); each transfer is then sent and confirmed with **live per-recipient status** and a **Solscan link** on success.

For SPL transfers, the recipient's associated token account is created
automatically if it doesn't exist (you pay the small rent). Make sure your
wallet holds enough of the token **and** enough SOL for fees + any ATA rent.

### CSV format

Headers (case-insensitive). `username` and `amount` are optional; `wallet_address` is what you need to send:

```csv
username,wallet_address,amount
ansem,9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump,1000
cryptokaleo,So11111111111111111111111111111111111111112,500
```

On import, rows are matched to existing recipients by **username** (case-insensitive);
unmatched rows are appended. A ready-to-edit `sample-recipients.csv` is included.
`wallet` / `address` and `qty` are accepted as aliases for the columns.

---

## Network switching (Devnet ↔ Mainnet)

Use the **Mainnet / Devnet** toggle in the header. It switches:

- the **RPC endpoint** the wallet connects to, and
- the **Solscan cluster** used for transaction links.

The choice is remembered in localStorage. Test on **Devnet** first (airdrop a
devnet SPL mint or SOL), then switch to **Mainnet** for the real $ANSEM airdrop.

There are no program IDs to manage — this build has no custom on-chain program.

---

## Claim Rewards

The **Claim Rewards** button is a roadmap placeholder (a "coming soon" modal).
Direct airdrops are the supported distribution method today.

---

## Safety notes

- Always double-check wallet addresses and amounts before sending — transfers are irreversible.
- Start on Devnet to validate the flow end-to-end.
- This is prototype tooling. Review the code before using it for large mainnet distributions.
