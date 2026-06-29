"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Key, Gift } from "@phosphor-icons/react";
import { NetworkToggle } from "./NetworkToggle";
import { ApiKeyManager } from "./ApiKeyManager";
import { ClaimRewardsModal } from "./ClaimRewardsModal";
import { BullLogo } from "./ui/BullLogo";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export function Header() {
  const [apiOpen, setApiOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 animate-pulse-glow items-center justify-center rounded-lg bg-gradient-to-b from-neon-soft to-neon text-black shadow-neon">
              <BullLogo className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-bold tracking-wide text-white">
                CASHTAG AIRDROP
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-neon">
                $ANSEM · Solana
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <NetworkToggle />
            <button
              onClick={() => setApiOpen(true)}
              className="btn-ghost !py-1.5"
            >
              <Key size={15} weight="bold" /> API Key
            </button>
            <button
              onClick={() => setClaimOpen(true)}
              className="btn-ghost !py-1.5"
            >
              <Gift size={15} weight="bold" /> Claim Rewards
            </button>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      <ApiKeyManager open={apiOpen} onClose={() => setApiOpen(false)} />
      <ClaimRewardsModal open={claimOpen} onClose={() => setClaimOpen(false)} />
    </>
  );
}
