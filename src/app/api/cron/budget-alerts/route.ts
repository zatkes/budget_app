import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { evaluateAllBudgets } from "@/lib/alerts/evaluate";
import { notifyFiredAlerts } from "@/lib/alerts/notify";

// Vercel Cron hits this daily (see vercel.json) with an
// `Authorization: Bearer ${CRON_SECRET}` header - this is what catches
// pacing and fixed_expected/balance_cap alerts even on days nobody opens the
// app. Threshold alerts also fire immediately after a manual Akahu sync
// (see lib/akahu/sync.ts) - this route is the backstop, not the only path.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const firedAlerts = await evaluateAllBudgets(supabase);
  await notifyFiredAlerts(supabase, firedAlerts);

  return NextResponse.json({ evaluated: true, alertsFired: firedAlerts.length });
}
