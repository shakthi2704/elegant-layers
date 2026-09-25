import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CakeOrderStatusFilterSelect } from "@/components/cake-orders/cake-order-status-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  IN_PROGRESS: "default",
  READY: "default",
  COLLECTED: "secondary",
  CANCELLED: "destructive",
};

const ACTIVE_STATUSES = ["PENDING", "IN_PROGRESS", "READY"] as const;

export default async function CakeOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["ADMIN", "CASHIER"]);
  const { status } = await searchParams;

  const where: Prisma.CakeOrderWhereInput =
    status && status !== "ACTIVE"
      ? { status: status as Prisma.EnumCakeOrderStatusFilter["equals"] }
      : { status: { in: [...ACTIVE_STATUSES] } };

  const orders = await prisma.cakeOrder.findMany({
    where,
    include: { customer: true },
    orderBy: [{ pickupDate: "asc" }, { pickupTime: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cake Orders</h1>
          <p className="text-sm text-muted-foreground">
            Custom cake orders, sorted by soonest pickup.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/cake-orders/new" />}>
          New Order
        </Button>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-4 rounded-lg border border-border p-4"
      >
        <CakeOrderStatusFilterSelect defaultValue={status ?? "ACTIVE"} />
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/cake-orders" />}
          >
            Clear
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Cake</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.customer.name}</TableCell>
                <TableCell>{order.cakeName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(order.pickupDate)} at {order.pickupTime}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
                    {order.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{order.price ? `Rs. ${order.price.toString()}` : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/cake-orders/${order.id}`} />}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No cake orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}