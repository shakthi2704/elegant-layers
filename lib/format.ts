const TIMEZONE = "Asia/Colombo";

export function formatDate(date: Date) {
    return date.toLocaleDateString("en-LK", { timeZone: TIMEZONE });
}

export function formatDateTime(date: Date) {
    return date.toLocaleString("en-LK", { timeZone: TIMEZONE });
}