"use server";

import { db } from "@/lib/db/db";
import { bookings } from "@/lib/db/schema";
import { eq, between } from "drizzle-orm";
import { startOfYear, endOfYear, format } from "date-fns";
import { z } from "zod";

/* ---------- validation ---------- */

const BookingInput = z.object({
    //id:             z.string().uuid(),
    date: z.coerce.date(),
    day: z.string().optional(),
    p: z.boolean().optional(),
    venue: z.string().min(1),
    uktVenue: z.string().optional(),
    affiliateVenue: z.string().optional(),
    otherVenue: z.string().optional(),
    venueIsTba: z.boolean().optional(),
    titleOfShow: z.string().min(1),
    showTitleIsTba: z.boolean().optional(),
    producer: z.string().optional(),
    pressContact: z.string().optional(),
    dateBkd: z.string().optional(),
    isSeasonGala: z.boolean().optional(),
    isOperaDance: z.boolean().optional(),
    userId: z.string().optional(),
    timeStamp: z.number().optional(),
});

/* ---------- CRUD ---------- */

export async function createBooking(raw: unknown) {
    const data = BookingInput.parse(raw);

    await db.insert(bookings).values({
        ...data,
        date: data.date.getTime(),
        p: data.p ? 1 : 0,
        venueIsTba: data.venueIsTba ? 1 : 0,
        showTitleIsTba: data.showTitleIsTba ? 1 : 0,
        isSeasonGala: data.isSeasonGala ? 1 : 0,
        isOperaDance: data.isOperaDance ? 1 : 0,
        createdAt: Date.now(),
    });
}

export async function updateBooking(id: string, raw: unknown) {
    // Accept partial updates; `id` is passed separately
    const data = BookingInput.partial().parse(raw);

    // Coerce types to match SQLite schema (ints for booleans, ms timestamp for date)
    const toUpdate: Record<string, any> = {};

    if (data.date !== undefined) toUpdate.date = data.date.getTime();
    if (data.day !== undefined) toUpdate.day = data.day;
    if (data.p !== undefined) toUpdate.p = data.p ? 1 : 0;
    if (data.venue !== undefined) toUpdate.venue = data.venue;
    if (data.uktVenue !== undefined) toUpdate.uktVenue = data.uktVenue;
    if (data.affiliateVenue !== undefined) toUpdate.affiliateVenue = data.affiliateVenue;
    if (data.otherVenue !== undefined) toUpdate.otherVenue = data.otherVenue;
    if (data.venueIsTba !== undefined) toUpdate.venueIsTba = data.venueIsTba ? 1 : 0;
    if (data.titleOfShow !== undefined) toUpdate.titleOfShow = data.titleOfShow;
    if (data.showTitleIsTba !== undefined) toUpdate.showTitleIsTba = data.showTitleIsTba ? 1 : 0;
    if (data.producer !== undefined) toUpdate.producer = data.producer;
    if (data.pressContact !== undefined) toUpdate.pressContact = data.pressContact;
    if (data.dateBkd !== undefined) toUpdate.dateBkd = data.dateBkd;
    if (data.isSeasonGala !== undefined) toUpdate.isSeasonGala = data.isSeasonGala ? 1 : 0;
    if (data.isOperaDance !== undefined) toUpdate.isOperaDance = data.isOperaDance ? 1 : 0;
    if (data.userId !== undefined) toUpdate.userId = data.userId;
    if (data.timeStamp !== undefined) toUpdate.timeStamp = data.timeStamp;

    await db
        .update(bookings)
        .set(toUpdate)
        .where(eq(bookings.id, Number(id)));
}

export async function deleteBooking(id: string) {
    await db.delete(bookings).where(eq(bookings.id, Number(id)));
}

/* ---------- reads ---------- */

export async function getYearData(year: number) {
    const start = startOfYear(new Date(year, 0, 1)).getTime();
    const end = endOfYear(new Date(year, 0, 1)).getTime();

    try {
        const rows = await db
            .select()
            .from(bookings)
            .where(between(bookings.date, start, end))
            .all();

        console.log(rows);

        /* shape identical to convertExcelDataToObject output */
        const Dates: Record<string, Record<string, any>> = {};
        rows.forEach((r) => {
            const ddmmyyyy = format(r.date, "dd/MM/yyyy"); // front‑end keeps same key
            const range = r.id; // uuid replaces Excel range

            Dates[ddmmyyyy] ??= {};
            Dates[ddmmyyyy][range] = { ...r, Date: ddmmyyyy, range };
        });

        return {
            Year: String(year),
            Range: "",
            Dates,
        };
    } catch (error) {
        console.log(error);
    }
}

/** optional single‑day query (replaces `searchGetAllRowsMatching`) */
export async function getDateData(ts: number) {
    return db.select().from(bookings).where(eq(bookings.date, ts)).all();
}
