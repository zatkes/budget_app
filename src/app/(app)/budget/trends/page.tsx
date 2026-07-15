import Link from "next/link";
import { getSpendHistory } from "@/lib/data/budgets";
import { getCashFlowHistory, getHouseholdIncomeSetting } from "@/lib/data/cashflow";
import { SpendTrendChart } from "@/components/SpendTrendChart";
import { NetCashFlowChart } from "@/components/NetCashFlowChart";
import { CategoryTrendRow } from "@/components/CategoryTrendRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setHouseholdIncomeEstimate } from "../actions";

export default async function BudgetTrendsPage() {
  const [{ points, categories }, cashFlow, income] = await Promise.all([
    getSpendHistory(6),
    getCashFlowHistory(6),
    getHouseholdIncomeSetting(),
  ]);

  return (
    <div className="flex flex-col gap-6 pt-2 pb-4">
      <Button
        variant="link"
        size="sm"
        nativeButton={false}
        render={<Link href="/budget" />}
        className="w-fit px-0 text-[var(--link)]"
      >
        ← Back
      </Button>
      <div>
        <h1 className="font-display text-2xl font-bold">Spending trends</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Last {points.length} cycles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Total spend per cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendTrendChart points={points} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Cash flow: net per cycle</CardTitle>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            What&apos;s left after spending, each cycle.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <NetCashFlowChart points={cashFlow.points} />
          <form
            action={async (formData: FormData) => {
              "use server";
              await setHouseholdIncomeEstimate(Number(formData.get("income")));
            }}
            className="flex items-center gap-2"
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Income estimate per cycle
            </span>
            <Input key={income} type="number" step="1" name="income" defaultValue={income} className="w-28" />
            <Button type="submit" variant="outline" size="sm">
              Save
            </Button>
          </form>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Manual for now - your salary-receiving account isn&apos;t connected via Akahu yet, so this is
            an estimate rather than synced income.
          </p>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 font-display text-[17px] font-bold">By category</div>
        <div className="flex flex-col gap-2.5">
          {categories.map((c) => (
            <CategoryTrendRow key={c.id} category={c} points={points} />
          ))}
        </div>
      </div>
    </div>
  );
}
