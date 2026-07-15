"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { getAuthenticationOptions, verifyAuthentication, verifyPin } from "@/app/(app)/lock/actions";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function tryFaceId() {
    setBusy(true);
    setError(null);
    try {
      const options = await getAuthenticationOptions();
      const response = await startAuthentication({ optionsJSON: options });
      const result = await verifyAuthentication(response);
      if (result.success) {
        onUnlock();
      } else {
        setError("Couldn't verify - try again or use your PIN.");
        setShowPin(true);
      }
    } catch {
      // Cancelled, no matching platform credential on this device, timed
      // out, etc. - fall back to PIN rather than leaving a dead end.
      setShowPin(true);
    } finally {
      setBusy(false);
    }
  }

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await verifyPin(pin);
      if (result.success) {
        onUnlock();
      } else if (result.lockedOut) {
        setError("Too many attempts - try again in a few minutes.");
      } else {
        setError("Wrong PIN.");
      }
    } finally {
      setPin("");
      setBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6"
      style={{ background: "linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 45%, var(--bg-3) 100%)" }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full font-display text-xl font-bold text-white shadow-[0_4px_16px_rgba(139,92,246,0.5)]"
        style={{ background: "var(--accent-gradient)" }}
      >
        S+L
      </div>
      <div className="text-center">
        <div className="font-display text-xl font-bold">Sim &amp; Lucia</div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Locked - unlock to continue
        </p>
      </div>

      {!showPin ? (
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={tryFaceId}
            disabled={busy}
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)] disabled:opacity-60"
            style={{ background: "var(--accent-gradient)" }}
          >
            {busy ? "Checking…" : "Unlock with Face ID / Touch ID"}
          </button>
          <button
            onClick={() => setShowPin(true)}
            className="text-sm font-semibold"
            style={{ color: "var(--link)" }}
          >
            Use PIN instead
          </button>
        </div>
      ) : (
        <form onSubmit={submitPin} className="flex w-full max-w-xs flex-col gap-3">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
            maxLength={6}
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="rounded-2xl border px-4 py-3 text-center text-lg tracking-[0.5em] outline-none"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text)" }}
          />
          <button
            type="submit"
            disabled={busy || pin.length < 4}
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)] disabled:opacity-60"
            style={{ background: "var(--accent-gradient)" }}
          >
            Unlock
          </button>
          <button
            type="button"
            onClick={() => {
              setShowPin(false);
              setError(null);
            }}
            className="text-sm font-semibold"
            style={{ color: "var(--link)" }}
          >
            Try Face ID / Touch ID instead
          </button>
        </form>
      )}

      {error && (
        <p className="text-sm" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
