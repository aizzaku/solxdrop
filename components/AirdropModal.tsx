"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useNetwork } from "@/components/providers/NetworkProvider";
import { ANSEM_MINT, solscanTx } from "@/lib/network";
import { parseCsv } from "@/lib/csv";
import { runAirdrop, isValidPubkey } from "@/lib/airdrop";
import type {
  Recipient,
  TokenKind,
  AirdropResult,
  TxPhase,
} from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  initialRecipients: Recipient[];
}

function shortAddr(a: string): string {
  if (!a || a.length < 12) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function AirdropModal({ open, onClose, initialRecipients }: Props) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { config } = useNetwork();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<TokenKind>("spl");
  const [mint, setMint] = useState(ANSEM_MINT);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [results, setResults] = useState<Record<string, AirdropResult>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setRecipients(
        initialRecipients.length
          ? initialRecipients.map((r) => ({ ...r }))
          : [{ id: crypto.randomUUID(), username: "", wallet: "", amount: "" }]
      );
      setResults({});
      setDone(false);
    }
  }, [open, initialRecipients]);

  const total = useMemo(
    () =>
      recipients.reduce((sum, r) => {
        const n = parseFloat(r.amount);
        return sum + (Number.isFinite(n) && n > 0 ? n : 0);
      }, 0),
    [recipients]
  );

  const tokenLabel = kind === "sol" ? "SOL" : mint === ANSEM_MINT ? "ANSEM" : "tokens";

  const updateRow = (id: string, patch: Partial<Recipient>) =>
    setRecipients((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) =>
    setRecipients((rs) => rs.filter((r) => r.id !== id));

  const addRow = () =>
    setRecipients((rs) => [
      ...rs,
      { id: crypto.randomUUID(), username: "", wallet: "", amount: "" },
    ]);

  const applyToAll = () => {
    const first = recipients.find((r) => parseFloat(r.amount) > 0)?.amount;
    if (!first) {
      toast("error", "Set an amount on the first row to copy it down.");
      return;
    }
    setRecipients((rs) => rs.map((r) => ({ ...r, amount: first })));
  };

  const handleCsv = async (file: File) => {
    try {
      const rows = await parseCsv(file);
      if (!rows.length) {
        toast("error", "No rows found in CSV.");
        return;
      }
      setRecipients((current) => {
        const next = [...current];
        for (const row of rows) {
          const uname = row.username || "";
          const idx = uname
            ? next.findIndex(
                (r) => r.username.toLowerCase() === uname.toLowerCase()
              )
            : -1;
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              wallet: row.wallet_address || next[idx].wallet,
              amount: row.amount || next[idx].amount,
            };
          } else {
            next.push({
              id: crypto.randomUUID(),
              username: uname,
              wallet: row.wallet_address || "",
              amount: row.amount || "",
            });
          }
        }
        return next.filter(
          (r) => r.username || r.wallet || r.amount
        );
      });
      toast("success", `Imported ${rows.length} row(s) from CSV.`);
    } catch {
      toast("error", "Could not parse that CSV file.");
    }
  };

  const validCount = recipients.filter(
    (r) => isValidPubkey(r.wallet) && parseFloat(r.amount) > 0
  ).length;

  const handleSend = async () => {
    if (!wallet.publicKey) {
      toast("error", "Connect a wallet first.");
      return;
    }
    if (kind === "spl" && !isValidPubkey(mint)) {
      toast("error", "Enter a valid token mint address.");
      return;
    }
    if (validCount === 0) {
      toast("error", "Add at least one valid wallet + amount.");
      return;
    }

    setSending(true);
    setDone(false);
    try {
      const final = await runAirdrop({
        connection,
        wallet,
        kind,
        mint,
        recipients,
        onUpdate: (id, patch) =>
          setResults((prev) => ({
            ...prev,
            [id]: { ...(prev[id] || ({} as AirdropResult)), ...patch },
          })),
      });
      const ok = final.filter((r) => r.phase === "confirmed").length;
      const failed = final.length - ok;
      setDone(true);
      if (failed === 0) toast("success", `Airdrop complete — ${ok} sent.`);
      else toast("info", `${ok} confirmed, ${failed} failed.`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Airdrop failed.");
    } finally {
      setSending(false);
    }
  };

  const rowPhase = (id: string): TxPhase => results[id]?.phase || "idle";

  return (
    <Modal
      open={open}
      onClose={sending ? () => {} : onClose}
      title="Airdrop"
      subtitle="Send tokens to selected creators. Each recipient has its own amount."
      wide
    >
      <div className="space-y-5">
        {/* Token selection */}
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Token
            </label>
            <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
              {(["spl", "sol"] as TokenKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`flex-1 rounded-md px-2 py-1.5 font-display text-xs font-semibold uppercase tracking-wide transition ${
                    kind === k
                      ? "bg-neon text-black shadow-[0_0_14px_-2px_rgba(57,255,20,0.7)]"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {k === "spl" ? "SPL" : "SOL"}
                </button>
              ))}
            </div>
          </div>
          {kind === "spl" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">
                Token Mint Address
              </label>
              <input
                value={mint}
                onChange={(e) => setMint(e.target.value)}
                spellCheck={false}
                className="input-base font-mono text-xs"
              />
              <p className="mt-1 text-[11px] text-white/40">
                Prefilled with $ANSEM. Change to airdrop a different SPL token.
              </p>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-medium uppercase tracking-wider text-white/50">
            Recipients ({recipients.length})
          </div>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCsv(f);
                e.target.value = "";
              }}
            />
            <button onClick={applyToAll} className="btn-ghost !py-1.5 !text-xs">
              Copy 1st amount ↓
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-ghost !py-1.5 !text-xs"
            >
              Import CSV
            </button>
            <button onClick={addRow} className="btn-ghost !py-1.5 !text-xs">
              + Row
            </button>
          </div>
        </div>

        {/* Recipients table */}
        <div className="max-h-[42vh] overflow-y-auto rounded-lg border border-white/10 bg-black/20">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-black/60 text-left font-display text-xs uppercase tracking-wider text-white/45 backdrop-blur">
              <tr>
                <th className="px-3 py-2 font-medium">Username</th>
                <th className="px-3 py-2 font-medium">Wallet Address</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {recipients.map((r) => {
                const phase = rowPhase(r.id);
                const res = results[r.id];
                const badWallet = r.wallet && !isValidPubkey(r.wallet);
                return (
                  <tr
                    key={r.id}
                    className="border-t border-white/5 align-top"
                  >
                    <td className="px-3 py-2">
                      <input
                        value={r.username}
                        onChange={(e) =>
                          updateRow(r.id, { username: e.target.value })
                        }
                        placeholder="handle"
                        className="input-base !py-1.5 !text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.wallet}
                        onChange={(e) =>
                          updateRow(r.id, { wallet: e.target.value })
                        }
                        placeholder="Solana address"
                        spellCheck={false}
                        className={`input-base !py-1.5 font-mono !text-xs ${
                          badWallet ? "!border-red-500/60" : ""
                        }`}
                      />
                      {res?.signature && (
                        <a
                          href={solscanTx(res.signature, config.explorerCluster)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-[11px] text-neon hover:underline"
                        >
                          {shortAddr(res.signature)} ↗
                        </a>
                      )}
                      {res?.error && (
                        <div className="mt-1 text-[11px] text-red-300">
                          {res.error}
                        </div>
                      )}
                    </td>
                    <td className="w-28 px-3 py-2">
                      <input
                        value={r.amount}
                        onChange={(e) =>
                          updateRow(r.id, {
                            amount: e.target.value.replace(/[^0-9.]/g, ""),
                          })
                        }
                        placeholder="0.00"
                        inputMode="decimal"
                        className="input-base !py-1.5 text-right font-mono !text-xs"
                      />
                    </td>
                    <td className="w-28 px-3 py-2">
                      <StatusBadge phase={phase} />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => removeRow(r.id)}
                        disabled={sending}
                        className="rounded p-1 text-white/30 transition hover:bg-white/10 hover:text-red-300 disabled:opacity-30"
                        aria-label="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
              {recipients.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-sm text-white/40"
                  >
                    No recipients. Add a row or import a CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40">
              Total
            </div>
            <div className="font-mono text-2xl font-bold text-neon">
              {total.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}{" "}
              <span className="text-sm text-white/50">{tokenLabel}</span>
            </div>
            <div className="text-[11px] text-white/40">
              {validCount} valid recipient(s) · {config.label}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={sending}
              className="btn-ghost"
            >
              {done ? "Close" : "Cancel"}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || validCount === 0 || !wallet.publicKey}
              className="btn-neon"
            >
              {sending ? (
                <>
                  <Spinner className="h-4 w-4" /> Sending…
                </>
              ) : (
                `Send Airdrop (${validCount})`
              )}
            </button>
          </div>
        </div>
        {!wallet.publicKey && (
          <p className="text-center text-xs text-white/40">
            Connect a wallet to send.
          </p>
        )}
      </div>
    </Modal>
  );
}
