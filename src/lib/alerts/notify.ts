import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { prevCycleStart } from "@/lib/date";
import { sendPushToAll } from "@/lib/push/webpush";
import type { FiredAlert } from "./evaluate";

// Sends one push notification per fired alert, deep-linking into the exact
// filtered Activity view that explains it. Push delivery failures (not
// configured yet, every subscription pruned) are swallowed - the alert is
// already durably recorded in alert_log regardless of whether push works.
export async function notifyFiredAlerts(supabase: SupabaseClient, alerts: FiredAlert[]): Promise<void> {
  for (const alert of alerts) {
    const url =
      alert.alertType === "balance_cap"
        ? `/activity?category=${alert.categoryId}`
        : `/activity?category=${alert.categoryId}&from=${prevCycleStart(alert.periodEnd)}&to=${alert.periodEnd}`;

    await sendPushToAll(supabase, {
      title: alert.alertType === "hard" ? `${alert.categoryName}: over budget` : alert.categoryName,
      body: alert.message,
      url,
    }).catch(() => {});
  }
}
