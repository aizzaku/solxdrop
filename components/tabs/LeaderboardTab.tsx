"use client";

import { useState } from "react";
import {
  PaperPlaneTilt,
  ArrowSquareOut,
  Trash,
} from "@phosphor-icons/react";
import { useToast } from "@/components/ui/Toast";
import type { LeaderboardEntry, Recipient } from "@/lib/types";

interface Props {
  cashtag: string;
  entries: LeaderboardEntry[];
  updateEntry: (postId: string, patch: Partial<LeaderboardEntry>) => void;
  removeEntry: (postId: string) => void;
  openAirdrop: (recipients: Recipient[]) => void;
  goFetch: () => void;
}

function fmt(n: number): string {
  return n.toLocaleString();
}

function toRecipient(e: LeaderboardEntry): Recipient {
  return { id: e.postId, username: e.username, wallet: e.wallet, amount: "" };
}

export function LeaderboardTab({
  cashtag,
  entries,
  updateEntry,
  removeEntry,
  openAirdrop,
  goFetch,
}: Props) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (postId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });

  const allSelected =
    entries.length > 0 && entries.every((e) => selected.has(e.postId));

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.postId)));

  const airdropSelected = () => {
    const chosen = entries.filter((e) => selected.has(e.postId));
    if (chosen.length === 0) {
      toast("error", "Select at least one row.");
      return;
    }
    openAirdrop(chosen.map(toRecipient));
  };

  if (entries.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-white/50">
          No entries yet for <span className="text-neon">${cashtag}</span>.
        </p>
        <button onClick={goFetch} className="btn-neon mt-4">
          Fetch posts from X →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            <span className="text-neon">${cashtag}</span> Leaderboard
          </h2>
          <p className="text-xs text-white/45">
            {entries.length} post{entries.length === 1 ? "" : "s"} · stored
            locally
          </p>
        </div>
        <button
          onClick={airdropSelected}
          disabled={selected.size === 0}
          className="btn-neon"
        >
          <PaperPlaneTilt size={15} weight="bold" /> Airdrop to Selected (
          {selected.size})
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="border-b border-white/10 text-left font-display text-xs uppercase tracking-wider text-white/45">
            <tr>
              <th className="px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-neon"
                />
              </th>
              <th className="px-2 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Username</th>
              <th className="px-3 py-2.5 text-right font-medium">Likes / RTs</th>
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Wallet Address</th>
              <th className="px-3 py-2.5 font-medium">Post</th>
              <th className="px-3 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const badWallet =
                e.wallet &&
                !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(e.wallet.trim());
              return (
                <tr
                  key={e.postId}
                  className="border-b border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(e.postId)}
                      onChange={() => toggleSelect(e.postId)}
                      className="accent-neon"
                    />
                  </td>
                  <td className="px-2 py-2 font-mono font-bold text-neon">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-semibold text-white">
                    @{e.username}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-white/80">
                    {fmt(e.likes ?? 0)}{" "}
                    <span className="text-white/30">/ {fmt(e.retweets ?? 0)}</span>
                  </td>
                  <td className="px-3 py-2 text-white/50">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={e.wallet}
                      onChange={(ev) =>
                        updateEntry(e.postId, { wallet: ev.target.value })
                      }
                      placeholder="paste wallet…"
                      spellCheck={false}
                      className={`input-base !w-44 !py-1.5 font-mono !text-xs ${
                        badWallet ? "!border-red-500/60" : ""
                      }`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-white/55 hover:text-neon hover:underline"
                    >
                      View <ArrowSquareOut size={12} weight="bold" />
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openAirdrop([toRecipient(e)])}
                        className="inline-flex items-center gap-1.5 rounded-md border border-neon/40 px-2.5 py-1 text-xs font-semibold text-neon transition hover:bg-neon/10"
                      >
                        <PaperPlaneTilt size={13} weight="bold" /> Airdrop
                      </button>
                      <button
                        onClick={() => removeEntry(e.postId)}
                        className="rounded p-1 text-white/30 transition hover:text-red-300"
                        aria-label="Remove"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-white/35">
        Wallet addresses are saved in your browser per cashtag. Use Remove to
        drop a row.
      </p>
    </div>
  );
}
