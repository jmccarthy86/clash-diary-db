import { wpFetch } from "@/lib/wp/client";

export type NotificationStatus = "sent" | "failed" | "skipped";
export type NotificationType = "clash" | "pencil_confirmed" | "tba_reminder";

type NotificationActivity = {
    bookingId?: string | number | null;
    type: NotificationType;
    recipientEmail: string;
    subject: string;
    status: NotificationStatus;
    provider?: string;
    providerMessageId?: string;
    errorMessage?: string;
    trigger?: string;
    createdAt?: string;
    sentAt?: string;
};

export function extractBrevoMessageId(response: unknown): string {
    const data = response as any;
    return String(
        data?.body?.messageId ??
            data?.body?.messageIds?.[0] ??
            data?.messageId ??
            data?.messageIds?.[0] ??
            data?.response?.body?.messageId ??
            ""
    );
}

export function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;

    const maybe = error as any;
    return String(
        maybe?.body?.message ??
            maybe?.response?.body?.message ??
            maybe?.message ??
            "Unknown error"
    );
}

export async function recordBookingNotificationActivity(
    activity: NotificationActivity
): Promise<void> {
    const bookingId = activity.bookingId;
    if (bookingId === null || bookingId === undefined || bookingId === "") {
        return;
    }

    try {
        await wpFetch(`/wp-json/fnd/v1/bookings/${encodeURIComponent(String(bookingId))}/notifications`, {
            method: "POST",
            body: JSON.stringify({
                type: activity.type,
                recipient_email: activity.recipientEmail,
                subject: activity.subject,
                status: activity.status,
                provider: activity.provider ?? "brevo",
                provider_message_id: activity.providerMessageId ?? "",
                error_message: activity.errorMessage ?? "",
                trigger: activity.trigger ?? "",
                created_at: activity.createdAt ?? new Date().toISOString(),
                sent_at: activity.sentAt ?? (activity.status === "sent" ? new Date().toISOString() : ""),
            }),
        });
    } catch (error) {
        console.error("Failed to record booking notification activity:", error);
    }
}
