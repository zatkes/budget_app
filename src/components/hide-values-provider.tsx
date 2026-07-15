"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const HideValuesContext = createContext<{ hideValues: boolean; toggleHideValues: () => void } | null>(null);

export function HideValuesProvider({ children }: { children: React.ReactNode }) {
  const [hideValues, setHideValues] = useState(false);

  useEffect(() => {
    // One-time sync from localStorage on mount - unavailable during the
    // initial server render, so this can only happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHideValues(localStorage.getItem("hideValues") === "true");
  }, []);

  const toggleHideValues = useCallback(() => {
    setHideValues((current) => {
      const next = !current;
      localStorage.setItem("hideValues", String(next));
      return next;
    });
  }, []);

  return (
    <HideValuesContext.Provider value={{ hideValues, toggleHideValues }}>{children}</HideValuesContext.Provider>
  );
}

export function useHideValues() {
  const ctx = useContext(HideValuesContext);
  if (!ctx) throw new Error("useHideValues must be used within HideValuesProvider");
  return ctx;
}
