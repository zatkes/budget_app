"use client";

import { useTheme } from "@/components/theme-provider";
import { useHideValues } from "@/components/hide-values-provider";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";

const pillStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  color: "var(--text)",
  padding: "7px 12px",
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

export function AppTopBar() {
  const { theme, toggleTheme } = useTheme();
  const { hideValues, toggleHideValues } = useHideValues();

  return (
    <div className="flex items-center justify-end gap-2 px-5 pt-3">
      <button onClick={toggleTheme} style={pillStyle} aria-label="Toggle theme">
        {theme === "dark" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M20 14.5A9 9 0 019.5 4a9 9 0 1010.5 10.5z" fill="var(--text)" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" fill="var(--text)" />
            <g stroke="var(--text)" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
              <line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
              <line x1="4.2" y1="19.8" x2="5.6" y2="18.4" />
              <line x1="18.4" y1="5.6" x2="19.8" y2="4.2" />
            </g>
          </svg>
        )}
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>

      <button onClick={toggleHideValues} style={pillStyle} aria-label="Toggle hide values">
        {hideValues ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3l18 18M10.6 10.6a2.5 2.5 0 003.5 3.5M6.6 6.9C4.5 8.3 3 10.5 2 12c1.8 2.9 5.3 7 10 7 1.6 0 3-.4 4.3-1.1M9.9 4.2C10.6 4.1 11.3 4 12 4c4.7 0 8.2 4.1 10 7-.5.8-1.2 1.8-2 2.7"
              stroke="var(--text)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
              stroke="var(--text)"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="var(--text)" strokeWidth="1.8" />
          </svg>
        )}
        {hideValues ? "Show values" : "Hide values"}
      </button>

      <PushSubscribeButton />
    </div>
  );
}
