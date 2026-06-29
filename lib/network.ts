import { clusterApiUrl } from "@solana/web3.js";
import type { NetworkId } from "./types";

export interface NetworkConfig {
  id: NetworkId;
  label: string;
  rpc: string;
  /** Query suffix for Solscan links. Empty string = mainnet. */
  explorerCluster: string;
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  mainnet: {
    id: "mainnet",
    label: "Mainnet",
    rpc:
      process.env.NEXT_PUBLIC_RPC_MAINNET || clusterApiUrl("mainnet-beta"),
    explorerCluster: "",
  },
  devnet: {
    id: "devnet",
    label: "Devnet",
    rpc: process.env.NEXT_PUBLIC_RPC_DEVNET || clusterApiUrl("devnet"),
    explorerCluster: "devnet",
  },
};

/** $ANSEM SPL mint — prefilled airdrop token. */
export const ANSEM_MINT = "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";

export const DEFAULT_CASHTAG = "ANSEM";

export function solscanTx(signature: string, cluster: string): string {
  const suffix = cluster ? `?cluster=${cluster}` : "";
  return `https://solscan.io/tx/${signature}${suffix}`;
}

export function solscanAddress(address: string, cluster: string): string {
  const suffix = cluster ? `?cluster=${cluster}` : "";
  return `https://solscan.io/account/${address}${suffix}`;
}
