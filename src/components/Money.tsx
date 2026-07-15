"use client";

import { useHideValues } from "@/components/hide-values-provider";

// Wraps an already-formatted dollar string (e.g. "$86,240") and masks every
// digit with a bullet when the user has hide-values on - the string itself
// stays untouched (still real markup/whitespace), only digits are swapped.
export function Money({ children }: { children: string }) {
  const { hideValues } = useHideValues();
  return <>{hideValues ? children.replace(/[0-9]/g, "•") : children}</>;
}
