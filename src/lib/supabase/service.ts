import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client for background jobs with no user session to read
// RLS-scoped auth cookies from (the Vercel Cron route). Bypasses RLS -
// never expose this client or its key to the browser.
export function createServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
