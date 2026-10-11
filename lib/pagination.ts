/** Rows shown per page on paginated tables. */
export const PAGE_SIZE = 50;

/** Reads ?page= from the URL; anything that isn't a whole number >= 1 is page 1. */
export function parsePage(raw: string | undefined): number {
    const n = Number.parseInt(raw ?? "", 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** A page number past the end falls back to the last page. */
export function clampPage(
    page: number,
    total: number,
    pageSize: number = PAGE_SIZE
): number {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return Math.min(page, totalPages);
}