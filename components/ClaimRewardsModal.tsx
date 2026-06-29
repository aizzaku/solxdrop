"use client";

import { Modal } from "@/components/ui/Modal";

export function ClaimRewardsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Claim Rewards"
      subtitle="Coming soon"
      footer={
        <button onClick={onClose} className="btn-neon w-full">
          Got it
        </button>
      }
    >
      <div className="space-y-3 text-sm text-white/70">
        <p>
          On-chain reward claiming is on the roadmap. In a future release,
          creators who rank on a cashtag leaderboard will be able to connect
          their wallet and claim their allocation directly — no manual airdrop
          needed.
        </p>
        <ul className="list-inside list-disc space-y-1 text-white/55">
          <li>Verifiable, claim-based distribution</li>
          <li>Per-creator allocation tied to impressions</li>
          <li>Self-service claiming with a connected wallet</li>
        </ul>
        <p className="text-white/40">
          For now, use the Airdrop flow to send tokens directly.
        </p>
      </div>
    </Modal>
  );
}
