"use server";

import { createClient } from "@/lib/supabase/server";

export type SendMagicLinkResult = { ok: true } | { ok: false; error: string };

export async function sendMagicLink(
  email: string,
  redirectPath: string,
): Promise<SendMagicLinkResult> {
  const supabase = await createClient();

  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin) {
    return { ok: false, error: "NEXT_PUBLIC_SITE_URL is not configured." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      // Sign-ups are disabled at the Supabase project level (see SETUP.md) - 
      // this only ever succeeds for the 2 seeded users.
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
