import { NextResponse } from "next/server";
import * as brevo from "@getbrevo/brevo";
import { getTbaReminderEmailContent } from "@/emails/tbaReminder";

const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set in the environment variables");
}

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

type ReminderItem = {
    date: string;
    title: string;
    venue: string;
    needsTitle: boolean;
    needsVenue: boolean;
};

type ReminderPayload = {
    email: string;
    items: ReminderItem[];
    loginUrl?: string;
    siteName?: string;
};

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

    let payload: ReminderPayload;
    try {
        payload = (await request.json()) as ReminderPayload;
    } catch (error) {
        return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const recipient = (payload?.email || "").trim();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (!recipient || !items.length) {
        return NextResponse.json(
            { success: false, error: "Missing recipient or items" },
            { status: 400 }
        );
    }

    const subject =
        payload.siteName && payload.siteName.trim() !== ""
            ? `[Action] Update TBA details for upcoming bookings at ${payload.siteName}`
            : "[Action] Update TBA details for upcoming bookings";
    const htmlContent = getTbaReminderEmailContent({
        items,
        loginUrl: payload.loginUrl ?? "",
        siteName: payload.siteName ?? "",
    });

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: recipient, name: recipient }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: "SOLT", email: "noreply@solt.co.uk" };
    sendSmtpEmail.params = payload;

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        return NextResponse.json({ success: true, sent: 1 }, { status: 200 });
    } catch (error) {
        console.error("Error sending TBA reminder:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send reminder" },
            { status: 500 }
        );
    }
}
