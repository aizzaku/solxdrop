"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NETWORKS, type NetworkConfig } from "@/lib/network";
import type { NetworkId } from "@/lib/types";

interface NetworkContextValue {
  networkId: NetworkId;
  config: NetworkConfig;
  setNetworkId: (id: NetworkId) => void;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);
const STORAGE_KEY = "ansem:network";

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkId, setNetworkIdState] = useState<NetworkId>("mainnet");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as NetworkId | null;
    if (saved === "devnet" || saved === "mainnet") setNetworkIdState(saved);
  }, []);

  const setNetworkId = (id: NetworkId) => {
    setNetworkIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const value = useMemo<NetworkContextValue>(
    () => ({ networkId, config: NETWORKS[networkId], setNetworkId }),
    [networkId]
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
