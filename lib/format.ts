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


/** Today's calendar date in Colombo as "YYYY-MM-DD". */
export function colomboToday(now: Date = new Date()) {
    return now.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

/** UTC instant for the start of a Colombo calendar day ("YYYY-MM-DD"). */
export function colomboDayStart(dateStr: string) {
    return new Date(`${dateStr}T00:00:00+05:30`);
}

/** UTC instant for the very end of a Colombo calendar day ("YYYY-MM-DD"). */
export function colomboDayEnd(dateStr: string) {
    return new Date(`${dateStr}T23:59:59.999+05:30`);
}