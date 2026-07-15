import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncAkahu } from "@/lib/akahu/sync";

// Vercel Cron hits this daily (see vercel.json) so bank data stays current
// without anyone having to open the app and click "Sync". Runs before the
// budget-alerts cron so newly-synced transactions get evaluated same day
// (sync itself also evaluates + notifies immediately - see lib/akahu/sync.ts).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const result = await syncAkahu(supabase);

  return NextResponse.json(result);
}
