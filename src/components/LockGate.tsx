"use client";

import { useEffect, useState } from "react";
import { LockScreen } from "@/components/LockScreen";

const UNLOCKED_KEY = "app-unlocked";

// Gates the app behind Face ID/Touch ID/PIN once at least one has been
// enrolled - a client-side lock on top of the real Supabase session, not a
// replacement for it. sessionStorage means each fresh tab/launch re-locks;
// switching tabs or a soft-reload within the same session stays unlocked.
export function LockGate({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    // One-time check of this tab's unlock state on mount - sessionStorage
    // isn't available during the initial server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnlocked(sessionStorage.getItem(UNLOCKED_KEY) === "true");
  }, [enabled]);

  if (!enabled || unlocked) return <>{children}</>;

  return (
    <LockScreen
      onUnlock={() => {
        sessionStorage.setItem(UNLOCKED_KEY, "true");
        setUnlocked(true);
      }}
    />
  );
}
