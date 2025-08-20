import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const PASTOR_TZ = "America/New_York";
export const SLOT_STEP_MIN = 30;

export const AVAIL_WINDOWS_NY: Record<number, Array<{ start: string; end: string }>> = {
    1: [{ start: "14:00", end: "17:00" }], // Monday
    3: [{ start: "14:00", end: "17:00" }], // Wednesday
    6: [{ start: "14:00", end: "18:00" }], // Saturday
};

const parseHM = (hm: string) => {
    const [h, m] = hm.split(":").map(Number);
    return { h, m };
};

/** Generate Date[] UTC instants for every slot start within NY day (yyyy-MM-dd). */
export function buildNySlotsToUTC(nyYmd: string): Date[] {
    const dayStartNY = toZonedTime(new Date(`${nyYmd}T00:00:00`), PASTOR_TZ);
    const dow = dayStartNY.getDay();
    const windows = AVAIL_WINDOWS_NY[dow] || [];
    const out: Date[] = [];

    for (const w of windows) {
        const { h: sh, m: sm } = parseHM(w.start);
        const { h: eh, m: em } = parseHM(w.end);

        let cursorNY = toZonedTime(new Date(`${nyYmd}T00:00:00`), PASTOR_TZ);
        cursorNY.setHours(sh, sm, 0, 0);

        const endNY = toZonedTime(new Date(`${nyYmd}T00:00:00`), PASTOR_TZ);
        endNY.setHours(eh, em, 0, 0);

        while (cursorNY < endNY) {
            const slotUTC = fromZonedTime(cursorNY, PASTOR_TZ);
            out.push(slotUTC);
            cursorNY = new Date(cursorNY.getTime() + SLOT_STEP_MIN * 60 * 1000);
        }
    }

    return out;
}

/** Given a UTC instant, return its NY 24h "HH:mm" key */
export function toNy24(utcInstant: Date): string {
    return formatInTimeZone(utcInstant, PASTOR_TZ, "HH:mm");
}

/** Given a NY date (yyyy-MM-dd), produce the set of NY 24h slot keys for that day. */
export function nySlots24ForDate(nyYmd: string): string[] {
    return buildNySlotsToUTC(nyYmd).map((d) => toNy24(d));
}

/** Convert NY HH:mm (on a given NY date) to the corresponding UTC ISO string. */
export function nyHmToUtcIso(nyYmd: string, nyHm: string): string {
    const ny = toZonedTime(new Date(`${nyYmd}T00:00:00`), PASTOR_TZ);
    const [h, m] = nyHm.split(":").map(Number);
    ny.setHours(h, m, 0, 0);
    const utc = fromZonedTime(ny, PASTOR_TZ);
    return utc.toISOString();
}