"use client";

import { useNetwork } from "@/components/providers/NetworkProvider";
import type { NetworkId } from "@/lib/types";

export function NetworkToggle() {
  const { networkId, setNetworkId } = useNetwork();
  const options: NetworkId[] = ["mainnet", "devnet"];

  return (
    <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5 backdrop-blur">
      {options.map((id) => {
        const active = networkId === id;
        return (
          <button
            key={id}
            onClick={() => setNetworkId(id)}
            className={`rounded-md px-3 py-1 font-display text-xs font-semibold uppercase tracking-wide transition ${
              active
                ? "bg-neon text-black shadow-[0_0_14px_-2px_rgba(57,255,20,0.7)]"
                : "text-white/50 hover:text-white"
            }`}
          >
            {id === "mainnet" ? "Mainnet" : "Devnet"}
          </button>
        );
      })}
    </div>
  );
}
