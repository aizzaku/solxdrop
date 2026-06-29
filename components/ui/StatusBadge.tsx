import type { TxPhase } from "@/lib/types";
import { Spinner } from "./Spinner";

const LABELS: Record<TxPhase, string> = {
  idle: "Ready",
  pending: "Signing",
  sent: "Sent",
  confirmed: "Confirmed",
  failed: "Failed",
};

export function StatusBadge({ phase }: { phase: TxPhase }) {
  const styles: Record<TxPhase, string> = {
    idle: "border-white/15 text-white/50",
    pending: "border-white/20 text-white/70",
    sent: "border-white/20 text-white/80",
    confirmed: "border-neon/50 text-neon",
    failed: "border-red-500/50 text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[phase]}`}
    >
      {(phase === "pending" || phase === "sent") && (
        <Spinner className="h-3 w-3" />
      )}
      {phase === "confirmed" && (
        <span className="h-1.5 w-1.5 rounded-full bg-neon" />
      )}
      {LABELS[phase]}
    </span>
  );
}
