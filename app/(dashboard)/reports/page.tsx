import { requireRole } from "@/lib/require-role";
import { resolvePeriod } from "@/lib/reports";
import { ReportFilterBar } from "@/components/reports/report-filter-bar";
import { ProfitSummary } from "@/components/reports/profit-summary";
import { DailyIncomeTable } from "@/components/reports/daily-income-table";
import { ProductSalesTable } from "@/components/reports/product-sales-table";
import { WasteTable } from "@/components/reports/waste-table";
import { DiscardedCakesTable } from "@/components/reports/discarded-cakes-table";
import {
  ReportTabs,
  parseReportView,
} from "@/components/reports/report-tabs";

import {
  Card,
} from "@/components/ui/card";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; from?: string; to?: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { view: rawView, from, to } = await searchParams;

  const view = parseReportView(rawView);
  const period = resolvePeriod(from, to);

  return (
    <div className="space-y-6 px-6">
      <Card className="p-4">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Profit, daily income and product sales for a period. The
            period starts as the current month.
          </p>
        </div></Card>

      <Card className="flex flex-wrap gap-2 p-4">
        <ReportTabs active={view} from={period.from} to={period.to} />
      </Card>



      <ReportFilterBar view={view} from={period.from} to={period.to} />

      {view === "summary" && <ProfitSummary period={period} />}
      {view === "daily" && <DailyIncomeTable period={period} />}
      {view === "products" && <ProductSalesTable period={period} />}
      {view === "waste" && (
        <div className="space-y-8">
          <WasteTable period={period} />
          <DiscardedCakesTable period={period} />
        </div>
      )}
    </div>
  );
}