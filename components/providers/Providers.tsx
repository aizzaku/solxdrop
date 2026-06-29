"use client";

import { type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { NetworkProvider, useNetwork } from "./NetworkProvider";
import { ToastProvider } from "@/components/ui/Toast";

function SolanaProviders({ children }: { children: ReactNode }) {
  const { config } = useNetwork();

  // Phantom, Solflare and other modern wallets auto-register via the Wallet
  // Standard, so no explicit adapters are required.
  return (
    <ConnectionProvider endpoint={config.rpc}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <ToastProvider>{children}</ToastProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NetworkProvider>
      <SolanaProviders>{children}</SolanaProviders>
    </NetworkProvider>
  );
}
