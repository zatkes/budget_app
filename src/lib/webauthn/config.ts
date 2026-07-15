import "server-only";

export const RP_NAME = "Sim & Lucia";

// The rpID must be the exact hostname the app is served from - a credential
// registered under one host won't authenticate under a different one, so
// this always tracks whichever origin NEXT_PUBLIC_SITE_URL currently points
// at (localhost in dev, the real domain in prod).
export function getRpID(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  return new URL(url).hostname;
}

export function getOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  return url;
}
