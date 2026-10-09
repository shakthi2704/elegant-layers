import { requireRole } from "@/lib/require-role";
import { createExpense } from "@/app/(dashboard)/expenses/actions";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewExpensePage() {
    await requireRole(["ADMIN"]);

    return (
        <div className="space-y-6 px-6">
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-xl">Record Expense</CardTitle>

                    <p className="pt-1 text-sm text-muted-foreground">
                        Record money spent on running the shop, such as rent,
                        bills or salaries. Stock purchases belong in Purchases,
                        not here. An expense can&apos;t be edited later, only
                        voided with a reason.
                    </p>
                </CardHeader>
            </Card>

            <ExpenseForm action={createExpense} />
        </div>
    );
}