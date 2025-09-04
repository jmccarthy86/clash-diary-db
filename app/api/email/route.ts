import { NextResponse } from "next/server";
import * as brevo from "@getbrevo/brevo";
import { EmailData } from "@/lib/types";
import { getClashEmailContent } from "@/emails/clash";
import * as XLSX from "xlsx";
import { buildWorkbook } from "@/lib/export/xlsx";

const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
  throw new Error("BREVO_API_KEY is not set in the environment variables");
}

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

const emailTemplates: Record<string, (params?: Record<string, any>) => string> = {
  clash: getClashEmailContent,
};

export async function POST(request: Request) {
  try {
    const emailData: EmailData = await request.json();
    const { to, subject, templateName, sender, replyTo, params } = emailData;

    const htmlContent = emailTemplates[templateName](params);
    if (!htmlContent) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    if (typeof params === "undefined") {
      throw new Error("No params provided");
    }

    const rowsObj = JSON.parse(params.dateEntries);
    const rows = Object.values(rowsObj ?? {});
    if (!rows.length) throw new Error("No rows to attach");

    const wb = buildWorkbook(rowsObj);
    const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = to;
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.replyTo = replyTo;
    sendSmtpEmail.params = params;
    sendSmtpEmail.attachment = [
      {
        name: "first-night-diary.xlsx",
        content: Buffer.from(xlsxBuffer).toString("base64"),
      },
    ];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}

