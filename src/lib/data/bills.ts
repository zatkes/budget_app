import { createClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/date";
import type { RecurringBill } from "@/lib/types";

export type BillWithStatus = RecurringBill & {
  daysUntilDue: number;
  status: "overdue" | "due_soon" | "upcoming";
};

function statusFor(daysUntilDue: number): BillWithStatus["status"] {
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 14) return "due_soon";
  return "upcoming";
}

export async function getUpcomingBills(): Promise<BillWithStatus[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_bills")
    .select(
      "id, name, icon, category_id, expected_amount, frequency_months, next_due_on, last_paid_on, owner_scope, is_active",
    )
    .eq("is_active", true)
    .order("next_due_on");
  if (error) throw error;

  return (data ?? []).map((bill) => {
    const daysUntilDue = daysUntil(bill.next_due_on);
    return { ...bill, daysUntilDue, status: statusFor(daysUntilDue) };
  });
}
