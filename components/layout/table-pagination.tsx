import Link from "next/link";

import { Button } from "@/components/ui/button";

type Params = Record<string, string | undefined>;

/** Builds a link to another page, keeping the filters already in the URL. */
function buildHref(basePath: string, params: Params, page: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
    }
    if (page > 1) search.set("page", String(page));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
}

export function TablePagination({
    page,
    pageSize,
    total,
    basePath,
    params,
}: {
    page: number;
    pageSize: number;
    total: number;
    basePath: string;
    /** Every other value in the URL (view, filters) that must be kept. */
    params: Params;
}) {
    if (total === 0) return null;

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
                Showing {first}–{last} of {total}
            </p>

            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    {page > 1 ? (
                        <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={buildHref(basePath, params, page - 1)} />}
                        >
                            Previous
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" disabled>
                            Previous
                        </Button>
                    )}

                    <span className="px-1 text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>

                    {page < totalPages ? (
                        <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={buildHref(basePath, params, page + 1)} />}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" disabled>
                            Next
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}