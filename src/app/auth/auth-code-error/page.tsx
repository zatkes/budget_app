import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12 text-center">
      <div className="max-w-sm">
        <h1 className="font-display text-xl font-bold">That link didn&apos;t work</h1>
        <p className="mt-2 text-sm text-muted">
          It may have expired or already been used. Request a new sign-in link.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-2xl px-4 py-3 text-sm font-semibold text-white"
          style={{ background: "var(--accent-gradient)" }}
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
