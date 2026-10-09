import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export type StockFilters = {
    type?: string; // "INGREDIENT" | "PRODUCT" | anything else = all
    low?: string; // "1" = only Low and Out items
    q?: string; // part of an item name
};

type StockStatus = "OUT" | "LOW" | "OK";

type StockRow = {
    key: string;
    name: string;
    type: "Ingredient" | "Product";
    category: string;
    current: number;
    minimum: number;
    unit: string;
    status: StockStatus;
};

function getStatus(current: number, minimum: number): StockStatus {
    if (current <= 0) return "OUT";
    if (current <= minimum) return "LOW";
    return "OK";
}

export async function StockTable({ filters }: { filters: StockFilters }) {
    const showIngredients = filters.type !== "PRODUCT";
    const showProducts = filters.type !== "INGREDIENT";

    const search = filters.q?.trim();
    const nameFilter = search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {};

    const ingredients = showIngredients
        ? await prisma.ingredient.findMany({
            where: nameFilter,
            orderBy: { name: "asc" },
        })
        : [];

    const products = showProducts
        ? await prisma.product.findMany({
            where: { isFinishedProduct: true, ...nameFilter },
            include: { category: true },
            orderBy: { name: "asc" },
        })
        : [];

    const allRows: StockRow[] = [
        ...ingredients.map((i): StockRow => {
            const current = i.currentStock.toNumber();
            const minimum = i.minimumStock.toNumber();
            return {
                key: `ingredient-${i.id}`,
                name: i.name,
                type: "Ingredient",
                category: "—",
                current,
                minimum,
                unit: i.unit,
                status: getStatus(current, minimum),
            };
        }),
        ...products.map((p): StockRow => {
            const current = p.currentStock.toNumber();
            const minimum = p.minimumStock.toNumber();
            return {
                key: `product-${p.id}`,
                name: p.name,
                type: "Product",
                category: p.category.name,
                current,
                minimum,
                unit: p.unit,
                status: getStatus(current, minimum),
            };
        }),
    ];

    const rows =
        filters.low === "1"
            ? allRows.filter((r) => r.status !== "OK")
            : allRows;

    const lowCount = rows.filter((r) => r.status === "LOW").length;
    const outCount = rows.filter((r) => r.status === "OUT").length;

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
                {rows.length} items · {lowCount} low · {outCount} out of stock
            </p>

            <div className="overflow-hidden rounded-md">
                <Table className="w-full border border-border text-sm">
                    <TableHeader className="bg-muted">
                        <TableRow>
                            <TableHead className="px-4 py-2.5 font-medium">Item</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Type</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Category</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Current Stock</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Minimum</TableHead>
                            <TableHead className="px-4 py-2.5 font-medium">Status</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-border bg-muted/20">
                        {rows.map((r) => (
                            <TableRow key={r.key}>
                                <TableCell className="px-4 py-2.5 font-medium">{r.name}</TableCell>
                                <TableCell className="px-4 py-2.5 text-muted-foreground">
                                    {r.type}
                                </TableCell>
                                <TableCell className="px-4 py-2.5 text-muted-foreground">
                                    {r.category}
                                </TableCell>
                                <TableCell className="px-4 py-2.5">
                                    {r.current} {r.unit}
                                </TableCell>
                                <TableCell className="px-4 py-2.5 text-muted-foreground">
                                    {r.minimum} {r.unit}
                                </TableCell>
                                <TableCell className="px-4 py-2.5">
                                    <Badge
                                        variant={
                                            r.status === "OUT"
                                                ? "destructive"
                                                : r.status === "LOW"
                                                    ? "outline"
                                                    : "secondary"
                                        }
                                    >
                                        {r.status === "OUT"
                                            ? "Out"
                                            : r.status === "LOW"
                                                ? "Low"
                                                : "OK"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}

                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="px-4 py-10 text-center text-muted-foreground"
                                >
                                    No items found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}