import { EmailData } from "@/lib/types";

export function getPencilConfirmedEmailContent(params: EmailData["params"]): string {
    const title = (params?.titleOfShow as string | undefined) || "TBA";
    const venue = (params?.venue as string | undefined) || "TBA";
    const rawDate = (params?.rawDate as string | undefined) || "";

    const diaryLink = rawDate
        ? `https://solt.co.uk/first-night-diary?selectedDate=${rawDate}`
        : "https://solt.co.uk/first-night-diary";

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            strong { font-family: "Century Gothic", sans-serif; }
          </style>
        </head>
        <body>
            <p style="margin: 0;">${escapeHtml(title)} ${escapeHtml(venue)}, which was previously a pencilled booking, has now been confirmed.</p>
            <br/>
            <p style="margin: 0;">Follow this link to see the full diary: <a href="${escapeHtml(
                diaryLink
            )}">SOLT First Night Diary</a>.</p>
            <br/>
            <p style="margin: 0;">Best wishes,</p>
            <p style="margin: 0;">SOLT & UK Theatre</p>
        </body>
      </html>
    `;
}

function escapeHtml(input: string): string {
    return String(input || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
