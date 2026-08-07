import { requireRole } from "@/lib/require-role";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function InventoryPage() {
  await requireRole(["ADMIN"]);
  return <ComingSoon title="Inventory" />;
}
