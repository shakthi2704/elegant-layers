import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CakeOrderStatusActions } from "@/components/cake-orders/cake-order-status-actions";
import { SetAdvanceOutcomeButton } from "@/components/cake-orders/set-advance-outcome-button";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const STATUS_VARIANT: Record<
    string,
    "default" | "secondary" | "destructive"
> = {
    PENDING: "secondary",
    IN_PROGRESS: "default",
    READY: "default",
    COLLECTED: "secondary",
    CANCELLED: "destructive",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    CASH: "Cash",
    BANK_DEPOSIT: "Bank Deposit",
};

export default async function CakeOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await requireRole(["ADMIN", "CASHIER"]);
    const { id } = await params;

    const order = await prisma.cakeOrder.findUnique({
        where: { id },
        include: { customer: true, product: true, createdBy: true },
    });

    if (!order) {
        notFound();
    }

    const balanceDue =
        order.price && order.advancePaid
            ? order.price.toNumber() - order.advancePaid.toNumber()
            : order.price
                ? order.price.toNumber()
                : null;

    const isLocked =
        order.status === "COLLECTED" || order.status === "CANCELLED";

    return (
        <div className="max-w-2xl space-y-6 px-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold">
                        {order.cakeName}
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        {order.customer.name} · {order.customer.phone}
                    </p>
                </div>

                <Badge
                    variant={
                        STATUS_VARIANT[order.status] ?? "secondary"
                    }
                >
                    {order.status.replace("_", " ")}
                </Badge>
            </div>

            {/* Reference Image */}
            {order.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={order.imageUrl}
                    alt="Cake reference"
                    className="h-48 w-48 rounded-lg border object-cover"
                />
            ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                        No image
                    </p>
                </div>
            )}

            {/* Order Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">
                        Order Details
                    </CardTitle>

                    <CardDescription>
                        Details about the cake, pickup, and payment.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                    {/* Order Details */}
                    <section>
                        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                            Cake Details
                        </h2>

                        <dl className="grid grid-cols-2 gap-y-2 text-sm">
                            {order.product && (
                                <>
                                    <dt className="text-muted-foreground">
                                        Product
                                    </dt>

                                    <dd className="text-right">
                                        {order.product.name}
                                    </dd>
                                </>
                            )}

                            {order.shape && (
                                <>
                                    <dt className="text-muted-foreground">
                                        Shape
                                    </dt>

                                    <dd className="text-right">
                                        {order.shape}
                                    </dd>
                                </>
                            )}

                            {order.weight && (
                                <>
                                    <dt className="text-muted-foreground">
                                        Weight
                                    </dt>

                                    <dd className="text-right">
                                        {order.weight}
                                    </dd>
                                </>
                            )}

                            {order.message && (
                                <>
                                    <dt className="text-muted-foreground">
                                        Message
                                    </dt>

                                    <dd className="text-right">
                                        {order.message}
                                    </dd>
                                </>
                            )}

                            <dt className="text-muted-foreground">
                                Pickup
                            </dt>

                            <dd className="text-right">
                                {formatDate(order.pickupDate)} at{" "}
                                {order.pickupTime}
                            </dd>
                        </dl>
                    </section>

                    {/* Payment */}
                    {(order.price || order.advancePaid) && (
                        <section className="border-t pt-6">
                            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                                Payment
                            </h2>

                            <dl className="grid grid-cols-2 gap-y-2 text-sm">
                                {order.price && (
                                    <>
                                        <dt className="text-muted-foreground">
                                            Price
                                        </dt>

                                        <dd className="text-right">
                                            Rs.{" "}
                                            {Number(
                                                order.price
                                            ).toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </dd>
                                    </>
                                )}

                                {order.advancePaid && (
                                    <>
                                        <dt className="text-muted-foreground">
                                            Advance Paid
                                            {order.paymentMethod &&
                                                ` (${PAYMENT_METHOD_LABEL[order.paymentMethod]})`}
                                        </dt>

                                        <dd className="text-right">
                                            Rs.{" "}
                                            {Number(
                                                order.advancePaid
                                            ).toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </dd>
                                    </>
                                )}

                                {order.status === "CANCELLED" &&
                                    order.advancePaid && (
                                        <>
                                            <dt className="text-muted-foreground">
                                                Advance outcome
                                            </dt>

                                            <dd className="text-right">
                                                {order.advanceOutcome === "KEPT" &&
                                                    "Kept by the shop"}
                                                {order.advanceOutcome === "REFUNDED" &&
                                                    "Refunded to the customer"}
                                                {!order.advanceOutcome && (
                                                    <span className="text-amber-600 dark:text-amber-400">
                                                        Not recorded yet
                                                    </span>
                                                )}
                                                {order.advanceOutcomeAt &&
                                                    ` (${formatDate(order.advanceOutcomeAt)})`}
                                            </dd>
                                        </>
                                    )}

                                {balanceDue !== null &&
                                    order.status !== "CANCELLED" && (
                                        <>
                                            <dt className="font-medium">
                                                Balance Due
                                            </dt>

                                            <dd className="text-right text-base font-semibold">
                                                Rs.{" "}
                                                {balanceDue.toLocaleString("en-LK", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </dd>
                                        </>
                                    )}
                            </dl>
                        </section>
                    )}

                    {/* Notes */}
                    {order.notes && (
                        <section className="border-t pt-6">
                            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                                Notes
                            </h2>

                            <p className="whitespace-pre-wrap text-sm">
                                {order.notes}
                            </p>
                        </section>
                    )}

                    {/* Footer */}
                    <div className="border-t pt-6">
                        <p className="mb-4 text-xs text-muted-foreground">
                            Created by {order.createdBy.name} on{" "}
                            {formatDateTime(order.createdAt)}
                        </p>

                        <div className="flex w-full flex-wrap items-center justify-start gap-2">
                            {!isLocked && (
                                <Button
                                    variant="outline"
                                    nativeButton={false}
                                    render={
                                        <Link href={`/cake-orders/${order.id}/edit`} />
                                    }
                                >
                                    Edit
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                nativeButton={false}
                                render={
                                    <Link href={`/cake-orders/${order.id}/kot`} />
                                }
                            >
                                Print KOT
                            </Button>

                            {order.status !== "CANCELLED" && (
                                <Button
                                    variant="outline"
                                    nativeButton={false}
                                    render={
                                        <Link href={`/cake-orders/${order.id}/bill`} />
                                    }
                                >
                                    Customer Bill
                                </Button>
                            )}

                            <CakeOrderStatusActions
                                orderId={order.id}
                                status={order.status}
                                canCancel={user.role === "ADMIN"}
                                advancePaid={order.advancePaid?.toNumber() ?? 0}
                            />
                            {order.status === "CANCELLED" &&
                                user.role === "ADMIN" &&
                                order.advancePaid &&
                                order.advancePaid.toNumber() > 0 &&
                                !order.advanceOutcome && (
                                    <SetAdvanceOutcomeButton
                                        orderId={order.id}
                                        advancePaid={order.advancePaid.toNumber()}
                                    />
                                )}
                        </div>
                    </div>


                </CardContent>
            </Card>
        </div>
    );
}