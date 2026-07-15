"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { sendMagicLink } from "./actions";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/home";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const result = await sendMagicLink(email.trim(), next);
    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setError(result.error);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full font-display text-lg font-bold text-white shadow-[0_4px_16px_rgba(139,92,246,0.5)]"
            style={{ background: "var(--accent-gradient)" }}
          >
            S+L
          </div>
          <h1 className="font-display text-2xl font-bold">Sim &amp; Lucia</h1>
          <p className="mt-1 text-sm text-muted">Sign in to see what&apos;s happening with your money.</p>
        </div>

        {status === "sent" ? (
          <div
            className="rounded-2xl border p-5 text-center text-sm"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <p className="font-semibold">Check {email}</p>
            <p className="mt-1 text-muted">
              We sent a sign-in link. Open it on this device to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--card-border)",
                color: "var(--text)",
              }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.45)] disabled:opacity-60"
              style={{ background: "var(--accent-gradient)" }}
            >
              {status === "sending" ? "Sending link…" : "Send sign-in link"}
            </button>
            {status === "error" && error && (
              <p className="text-center text-sm" style={{ color: "var(--negative)" }}>
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
