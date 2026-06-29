"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { saveToken, hasToken, clearToken } from "@/lib/crypto";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ApiKeyManager({ open, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setSaved(hasToken());
  }, [open]);

  const handleSave = async () => {
    if (!value.trim()) {
      toast("error", "Paste your Bearer Token first.");
      return;
    }
    setBusy(true);
    try {
      await saveToken(value.trim());
      setValue("");
      setSaved(true);
      toast("success", "Token encrypted and saved in your browser.");
      onSaved?.();
      onClose();
    } catch {
      toast("error", "Could not save the token.");
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    clearToken();
    setSaved(false);
    toast("info", "Stored token removed.");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="X API Bearer Token"
      subtitle="Encrypted with AES-GCM in your browser. Never sent to our servers except to proxy the X request."
    >
      <div className="space-y-4">
        {saved && (
          <div className="rounded-lg border border-neon/40 bg-neon/5 px-3 py-2 text-xs text-neon">
            A token is currently saved. Paste a new one to replace it.
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">
            Bearer Token
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="AAAAAAAAAAAAAAAAAAAAA..."
            rows={3}
            className="input-base resize-none font-mono text-xs"
          />
        </div>
        <p className="text-xs text-white/40">
          Create one at developer.x.com → Project → Keys and tokens. Pay-as-you-go
          access is required for impression metrics.
        </p>
        <div className="flex items-center justify-between gap-3">
          {saved ? (
            <button onClick={handleClear} className="btn-danger-ghost">
              Remove saved token
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleSave} disabled={busy} className="btn-neon">
              {busy ? "Saving…" : "Encrypt & Save"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
