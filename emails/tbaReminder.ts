type ReminderItem = {
    date: string;
    title: string;
    venue: string;
    needsTitle: boolean;
    needsVenue: boolean;
};

type ReminderParams = {
    items: ReminderItem[];
    loginUrl?: string;
    siteName?: string;
};

export function getTbaReminderEmailContent(params: ReminderParams): string {
    const { items = [], loginUrl = "", siteName = "" } = params;
    const item = items[0] || {
        date: "",
        title: "TBA",
        venue: "TBA",
        needsTitle: true,
        needsVenue: true,
    };

    const needs: string[] = [];
    if (item.needsTitle) needs.push("title");
    if (item.needsVenue) needs.push("venue");
    const needsStr = needs.length ? needs.join(" and ") : "details";

    let summary = "";
    if (item.needsTitle && item.needsVenue) {
        summary = `Your booking on ${escapeHtml(item.date)} still has TBA details for the title and venue.`;
    } else if (item.needsTitle) {
        summary = `Your booking on ${escapeHtml(item.date)} at ${escapeHtml(
            item.venue || "TBA"
        )} still has a TBA title.`;
    } else if (item.needsVenue) {
        summary = `Your booking on ${escapeHtml(item.date)} — ${escapeHtml(
            item.title || "TBA"
        )} — still has a TBA venue.`;
    } else {
        summary = `Your booking on ${escapeHtml(item.date)} still has TBA details.`;
    }

    const cta =
        loginUrl && loginUrl.trim() !== ""
            ? `<p style="margin:16px 0 8px 0;"><a href="${escapeHtml(
                  loginUrl
              )}" style="background:#111827;color:#fff;text-decoration:none;padding:10px 16px;border-radius:4px;display:inline-block;">Update bookings</a></p>`
            : "";

    const body = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#202124;">
        <p style="margin:0 0 12px 0;">Hi,</p>
        <p style="margin:0 0 12px 0;">${summary} It is happening in about 30 days. Please update the missing ${escapeHtml(
            needsStr
        )}.</p>
        ${cta}
        <p style="margin:0 0 12px 0;">Thanks,<br>SOLT & UK Theatre team</p>
    </div>`;

    return body;
}

function escapeHtml(input: string): string {
    return String(input || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
