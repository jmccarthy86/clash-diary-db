"use server";

import { startOfYear, endOfYear, format } from "date-fns";
import { z } from "zod";
import { wpFetch } from "@/lib/wp/client";

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

/* ---------- CRUD via WordPress REST ---------- */

// Note: The WP plugin/ACF prefer a plain calendar day string (YYYY-MM-DD).
// The plugin normalizes this to UK midnight and stores both string and ms.

export async function createBooking(raw: unknown) {
    const data = BookingInput.parse(raw);
    const payload = {
        // Send as YYYY-MM-DD; plugin converts to UK midnight and stores date_ms
        date: format(data.date, "yyyy-MM-dd"),
        day: data.day ?? format(data.date, "EEEE"),
        p: Boolean(data.p ?? false),
        venue: data.venue ?? "",
        ukt_venue: data.uktVenue ?? "",
        affiliate_venue: data.affiliateVenue ?? "",
        other_venue: data.otherVenue ?? "",
        venue_is_tba: Boolean(data.venueIsTba ?? false),
        title_of_show: data.titleOfShow ?? "",
        show_title_is_tba: Boolean(data.showTitleIsTba ?? false),
        producer: data.producer ?? "",
        press_contact: data.pressContact ?? "",
        date_bkd: data.dateBkd ?? "",
        is_season_gala: Boolean(data.isSeasonGala ?? false),
        is_opera_dance: Boolean(data.isOperaDance ?? false),
        user_id: data.userId ?? "",
        time_stamp: data.timeStamp ?? Date.now(),
    };
    await wpFetch("/wp-json/fnd/v1/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateBooking(id: string, raw: unknown) {
    const data = BookingInput.partial().parse(raw);
    const payload: Record<string, any> = {};
    if (data.date !== undefined) payload.date = format(data.date, "yyyy-MM-dd");
    if (data.day !== undefined) payload.day = data.day;
    if (data.p !== undefined) payload.p = Boolean(data.p);
    if (data.venue !== undefined) payload.venue = data.venue;
    if (data.uktVenue !== undefined) payload.ukt_venue = data.uktVenue;
    if (data.affiliateVenue !== undefined) payload.affiliate_venue = data.affiliateVenue;
    if (data.otherVenue !== undefined) payload.other_venue = data.otherVenue;
    if (data.venueIsTba !== undefined) payload.venue_is_tba = Boolean(data.venueIsTba);
    if (data.titleOfShow !== undefined) payload.title_of_show = data.titleOfShow;
    if (data.showTitleIsTba !== undefined) payload.show_title_is_tba = Boolean(data.showTitleIsTba);
    if (data.producer !== undefined) payload.producer = data.producer;
    if (data.pressContact !== undefined) payload.press_contact = data.pressContact;
    if (data.dateBkd !== undefined) payload.date_bkd = data.dateBkd;
    if (data.isSeasonGala !== undefined) payload.is_season_gala = Boolean(data.isSeasonGala);
    if (data.isOperaDance !== undefined) payload.is_opera_dance = Boolean(data.isOperaDance);
    if (data.userId !== undefined) payload.user_id = data.userId;
    if (data.timeStamp !== undefined) payload.time_stamp = data.timeStamp;

    await wpFetch(`/wp-json/fnd/v1/bookings/${id}`, {
        // Use POST for broader host compatibility; plugin accepts POST or PATCH
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function deleteBooking(id: string) {
    // Use POST-friendly delete endpoint to avoid blocked DELETE methods
    await wpFetch(`/wp-json/fnd/v1/bookings/${id}/delete`, {
        method: "POST",
    });
}

/* ---------- reads ---------- */

export async function getYearData(year: number) {
    // Prefer a WP aggregation endpoint; fallback composes here if needed
    const data = await wpFetch(`/wp-json/fnd/v1/bookings/year/${year}`, {
        method: "GET",
    });
    return data;
}

/** optional single‑day query */
export async function getDateData(ts: number) {
    return wpFetch(`/wp-json/fnd/v1/bookings/date?ts=${encodeURIComponent(ts)}`);
}
