import { requireRole } from "@/lib/require-role";
import { CurrentTime } from "@/components/layout/current-time";
import { TodaysSalesCard } from "@/components/dashboard/todays-sales-card";
import { CakeOrdersCard } from "@/components/dashboard/cake-orders-card";
import { StockAlertsCard } from "@/components/dashboard/stock-alerts-card";
import { HeldBillsCard } from "@/components/dashboard/held-bills-card";
import { UpcomingPickupsCard } from "@/components/dashboard/upcoming-pickups-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SalesTrendCard } from "@/components/dashboard/sales-trend-card";
import { CakeBalanceCard } from "@/components/dashboard/cake-balance-card";
import { MonthSummaryCard } from "@/components/dashboard/month-summary-card";
import {
  Card,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireRole(["ADMIN", "CASHIER"]);
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6 px-6">
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user.name}
            </p>
          </div>

          <div className="flex items-center sm:justify-end">
            <CurrentTime />
          </div>
        </div>
      </Card>
      <QuickActions isAdmin={isAdmin} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isAdmin && <TodaysSalesCard />}
        {isAdmin && <MonthSummaryCard />}
        <CakeOrdersCard />
        {isAdmin && <CakeBalanceCard />}
        {isAdmin && <StockAlertsCard />}
        <HeldBillsCard />

      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {isAdmin && <SalesTrendCard />}
        <UpcomingPickupsCard />
      </div>
    </div>
  );
}