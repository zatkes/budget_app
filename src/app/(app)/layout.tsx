import { TabBar } from "@/components/TabBar";
import { AppTopBar } from "@/components/AppTopBar";
import { LockGate } from "@/components/LockGate";
import { hasAnyCredential, hasPinSet } from "./lock/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [hasCredential, hasPin] = await Promise.all([hasAnyCredential(), hasPinSet()]);
  const lockEnabled = hasCredential || hasPin;

  return (
    <LockGate enabled={lockEnabled}>
      <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full"
          style={{ background: "#8b5cf6", filter: "blur(75px)", opacity: "var(--glow-1)" }}
        />
        <div
          className="pointer-events-none absolute bottom-24 -left-20 h-64 w-64 rounded-full"
          style={{ background: "#c084fc", filter: "blur(85px)", opacity: "var(--glow-2)" }}
        />
        <div
          className="pointer-events-none absolute top-64 left-3/5 h-36 w-36 rounded-full"
          style={{ background: "#7c3aed", filter: "blur(70px)", opacity: "var(--glow-3)" }}
        />

        <div className="relative z-10">
          <AppTopBar />
        </div>
        <main className="relative z-10 flex-1 overflow-y-auto px-5 pt-2 pb-8">{children}</main>
        <div className="relative z-10">
          <TabBar />
        </div>
      </div>
    </LockGate>
  );
}
