import { NextResponse } from "next/server";
import * as brevo from "@getbrevo/brevo";
import { format } from "date-fns";
import { getPencilConfirmedEmailContent } from "@/emails/pencilConfirmed";
import { getYearData } from "@/lib/actions/bookings";
import {
    formatDateLiteralDDMMYYYY,
    resolveTitleOfShow,
    resolveVenueDisplay,
    toBooleanLike,
} from "@/lib/utils";

const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set in the environment variables");
}

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

type PencilWebhookPayload = {
    date: string;
    booking: Record<string, any>;
};

function parseDateLiteral(value: string): Date | null {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [year, month, day] = trimmed.split("-").map(Number);
        return new Date(year, month - 1, day);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        const [day, month, year] = trimmed.split("/").map(Number);
        return new Date(year, month - 1, day);
    }
    if (/^\d{8}$/.test(trimmed)) {
        const year = Number(trimmed.slice(0, 4));
        const month = Number(trimmed.slice(4, 6));
        const day = Number(trimmed.slice(6, 8));
        if (year >= 1900 && year <= 2100) {
            return new Date(year, month - 1, day);
        }
    }
    if (/^\d+$/.test(trimmed)) {
        const numeric = Number(trimmed);
        const ms = trimmed.length >= 13 ? numeric : numeric * 1000;
        const parsed = new Date(ms);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeEmail(value: unknown): string {
    if (typeof value !== "string") return "";
    return value.trim();
}

function getBearerToken(authHeader: string | null): string {
    if (!authHeader) return "";
    const lower = authHeader.toLowerCase();
    if (!lower.startsWith("bearer ")) return "";
    return authHeader.slice(7).trim();
}

export async function POST(request: Request) {
    const webhookSecret = process.env.CLASH_WEBHOOK_SECRET;
    if (!webhookSecret) {
        return NextResponse.json(
            { success: false, error: "CLASH_WEBHOOK_SECRET is not configured" },
            { status: 500 }
        );
    }

    const token =
        getBearerToken(request.headers.get("authorization")) ||
        (request.headers.get("x-clash-secret") ?? "");
    if (!token || token !== webhookSecret) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let payload: PencilWebhookPayload;
    try {
        payload = (await request.json()) as PencilWebhookPayload;
    } catch (error) {
        return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const dateValue = typeof payload?.date === "string" ? payload.date : "";
    const booking = payload?.booking ?? null;
    if (!dateValue || !booking || typeof booking !== "object") {
        return NextResponse.json(
            { success: false, error: "Missing date or booking payload" },
            { status: 400 }
        );
    }

    const parsedDate = parseDateLiteral(dateValue);
    if (!parsedDate) {
        return NextResponse.json({ success: false, error: "Invalid date format" }, { status: 400 });
    }

    const yearData = await getYearData(parsedDate.getFullYear());
    if (!yearData || !yearData.Dates) {
        return NextResponse.json(
            { success: true, sent: 0, reason: "no_data" },
            { status: 200 }
        );
    }

    const dateKey = formatDateLiteralDDMMYYYY(parsedDate);
    const dateEntries = yearData.Dates[dateKey];
    if (!dateEntries || Object.keys(dateEntries).length < 2) {
        return NextResponse.json(
            { success: true, sent: 0, reason: "no_clash" },
            { status: 200 }
        );
    }

    const emails: string[] = [];
    const newEmail = normalizeEmail(booking.pressContact);
    if (newEmail) emails.push(newEmail);
    Object.values(dateEntries).forEach((entry: any) => {
        const pc = normalizeEmail(entry?.pressContact);
        if (pc) emails.push(pc);
    });

    const uniqueEmails = Array.from(new Set(emails));
    if (!uniqueEmails.length) {
        return NextResponse.json(
            { success: true, sent: 0, reason: "no_recipients" },
            { status: 200 }
        );
    }

    const venuePayload = {
        venue: booking.venue,
        otherVenue: booking.otherVenue,
        affiliateVenue: booking.affiliateVenue,
        uktVenue: booking.uktVenue,
        venueIsTba: toBooleanLike(booking.venueIsTba),
        soltMemberNonSoltVenue: toBooleanLike(booking.soltMemberNonSoltVenue),
    };

    const paramsBase = {
        date: format(parsedDate, "dd/MM/yyyy"),
        rawDate: format(parsedDate, "yyyy-MM-dd"),
        venue: resolveVenueDisplay(venuePayload),
        titleOfShow: resolveTitleOfShow(booking.titleOfShow, booking.showTitleIsTba),
    } as Record<string, any>;

    let sent = 0;
    const failed: string[] = [];

    for (const email of uniqueEmails) {
        const params = { ...paramsBase, name: email, email };
        const htmlContent = getPencilConfirmedEmailContent(params);

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{ email, name: email }];
        sendSmtpEmail.subject = "SOLT & UK Theatre First Night Diary update";
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { name: "SOLT", email: "noreply@solt.co.uk" };
        sendSmtpEmail.params = params;

        try {
            await apiInstance.sendTransacEmail(sendSmtpEmail);
            sent += 1;
        } catch (error) {
            console.error("Error sending pencilled confirmation email:", error);
            failed.push(email);
        }
    }

    return NextResponse.json(
        { success: failed.length === 0, sent, failed },
        { status: 200 }
    );
}
