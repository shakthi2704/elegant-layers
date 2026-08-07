import { requireRole } from "@/lib/require-role";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function ReportsPage() {
  await requireRole(["ADMIN"]);
  return <ComingSoon title="Reports" />;
}
