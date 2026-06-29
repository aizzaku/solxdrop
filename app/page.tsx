"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { FetchTab } from "@/components/tabs/FetchTab";
import { LeaderboardTab } from "@/components/tabs/LeaderboardTab";
import { AirdropModal } from "@/components/AirdropModal";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { DEFAULT_CASHTAG } from "@/lib/network";
import {
  loadLeaderboard,
  saveLeaderboard,
  mergePosts,
} from "@/lib/leaderboardStore";
import type { LeaderboardEntry, Recipient, XPost } from "@/lib/types";

type Tab = "fetch" | "leaderboard";

export default function Home() {
  const [tab, setTab] = useState<Tab>("fetch");
  const [cashtag, setCashtag] = useState(DEFAULT_CASHTAG);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [apiOpen, setApiOpen] = useState(false);

  const [airdropOpen, setAirdropOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  useEffect(() => {
    setEntries(loadLeaderboard(cashtag));
  }, [cashtag]);

  const persist = (next: LeaderboardEntry[]) => {
    setEntries(next);
    saveLeaderboard(cashtag, next);
  };

  const addPosts = (posts: XPost[]) => {
    persist(mergePosts(entries, posts));
    setTab("leaderboard");
  };

  const updateEntry = (postId: string, patch: Partial<LeaderboardEntry>) =>
    persist(entries.map((e) => (e.postId === postId ? { ...e, ...patch } : e)));

  const removeEntry = (postId: string) =>
    persist(entries.filter((e) => e.postId !== postId));

  const openAirdrop = (r: Recipient[]) => {
    setRecipients(r);
    setAirdropOpen(true);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "fetch", label: "Fetch from X" },
    { id: "leaderboard", label: "Leaderboard" },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-7">
        <div className="corners glass animate-fade-up mb-7 overflow-hidden p-6 sm:p-8">
          <div className="hud-label mb-3">
            Viral intelligence // Solana airdrop console
          </div>
          <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-[2.6rem]">
            CASHTAG VIRAL LEADERBOARD{" "}
            <span className="text-neon [text-shadow:0_0_26px_rgba(57,255,20,0.55)]">
              + AIRDROP
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
            Surface the most viral X posts for a cashtag, curate out the bots,
            and airdrop $ANSEM straight to the creators — per-wallet amounts,
            CSV import, one signature.
          </p>
        </div>

        <div className="mb-6 flex gap-1.5">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative rounded-lg px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  active
                    ? "border border-neon/40 bg-neon/10 text-neon shadow-[0_0_20px_-4px_rgba(57,255,20,0.5)]"
                    : "border border-white/10 bg-white/[0.02] text-white/45 hover:border-white/25 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "fetch" ? (
          <FetchTab
            cashtag={cashtag}
            setCashtag={setCashtag}
            onAdd={addPosts}
            onNeedApiKey={() => setApiOpen(true)}
          />
        ) : (
          <LeaderboardTab
            cashtag={cashtag}
            entries={entries}
            updateEntry={updateEntry}
            removeEntry={removeEntry}
            openAirdrop={openAirdrop}
            goFetch={() => setTab("fetch")}
          />
        )}
      </main>

      <AirdropModal
        open={airdropOpen}
        onClose={() => setAirdropOpen(false)}
        initialRecipients={recipients}
      />
      <ApiKeyManager open={apiOpen} onClose={() => setApiOpen(false)} />

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-[11px] text-white/30">
        Built for $ANSEM · Solana · Airdrop tooling. Always verify wallets and
        amounts before sending.
      </footer>
    </div>
  );
}
