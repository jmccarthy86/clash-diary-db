import { NextResponse } from "next/server";
import * as brevo from "@getbrevo/brevo";
import { EmailData } from "@/lib/types";
import { getClashEmailContent } from "@/emails/clash";
import { getPencilConfirmedEmailContent } from "@/emails/pencilConfirmed";
import * as XLSX from "xlsx";
import { buildWorkbook } from "@/lib/export/xlsx";
import {
  extractBrevoMessageId,
  extractErrorMessage,
  recordBookingNotificationActivity,
  type NotificationType,
} from "@/lib/notifications";

const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
  throw new Error("BREVO_API_KEY is not set in the environment variables");
}

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

const emailTemplates: Record<string, (params?: Record<string, any>) => string> = {
  clash: getClashEmailContent,
  pencilConfirmed: getPencilConfirmedEmailContent,
};

function notificationTypeForTemplate(templateName: string): NotificationType | null {
  if (templateName === "clash") return "clash";
  if (templateName === "pencilConfirmed") return "pencil_confirmed";
  return null;
}

function notificationBookingId(params: Record<string, any> | undefined): string | number | null {
  return params?.notificationBookingId ?? params?.bookingId ?? null;
}

export async function POST(request: Request) {
  let emailData: EmailData | null = null;
  try {
    emailData = await request.json();
    const { to, subject, templateName, sender, replyTo, params } = emailData;

    const templateFn = emailTemplates[templateName];
    if (!templateFn) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const htmlContent = templateFn(params);
    if (!htmlContent) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    if (typeof params === "undefined") {
      throw new Error("No params provided");
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = to;
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.replyTo = replyTo;
    sendSmtpEmail.params = params;

    if (templateName === "clash") {
      const rowsObj = JSON.parse(params.dateEntries);
      const rows = Object.values(rowsObj ?? {});
      if (!rows.length) throw new Error("No rows to attach");

      const wb = buildWorkbook(rowsObj);
      const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      sendSmtpEmail.attachment = [
        {
          name: "first-night-diary.xlsx",
          content: Buffer.from(xlsxBuffer).toString("base64"),
        },
      ];
    }

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    const notificationType = notificationTypeForTemplate(templateName);
    if (notificationType) {
      await Promise.all(
        to.map((recipient) =>
          recordBookingNotificationActivity({
            bookingId: notificationBookingId(params),
            type: notificationType,
            recipientEmail: recipient.email,
            subject,
            status: "sent",
            providerMessageId: extractBrevoMessageId(data),
            trigger: params?.notificationTrigger ?? "",
          })
        )
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    const notificationType = emailData
      ? notificationTypeForTemplate(emailData.templateName)
      : null;
    if (emailData && notificationType) {
      await Promise.all(
        emailData.to.map((recipient) =>
          recordBookingNotificationActivity({
            bookingId: notificationBookingId(emailData?.params),
            type: notificationType,
            recipientEmail: recipient.email,
            subject: emailData?.subject ?? "",
            status: "failed",
            errorMessage: extractErrorMessage(error),
            trigger: emailData?.params?.notificationTrigger ?? "",
          })
        )
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
