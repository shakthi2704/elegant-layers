const TIMEZONE = "Asia/Colombo";

export function formatDate(date: Date) {
    return date.toLocaleDateString("en-LK", { timeZone: TIMEZONE });
}

export function formatDateTime(date: Date) {
    return date.toLocaleString("en-LK", { timeZone: TIMEZONE });
}

/**
 * True when an order's pickup moment (date + "HH:MM", both Colombo local
 * time) is already in the past. Colombo is a fixed UTC+05:30 with no DST.
 */
export function isPickupOverdue(
    pickupDate: Date,
    pickupTime: string,
    now: Date = new Date()
) {
    // pickupDate is stored as UTC midnight of the date that was entered
    const dateStr = pickupDate.toISOString().slice(0, 10);
    const pickupAt = new Date(`${dateStr}T${pickupTime}:00+05:30`);
    return pickupAt.getTime() < now.getTime();
}