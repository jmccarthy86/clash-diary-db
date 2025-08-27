import { NextResponse } from "next/server";
import * as brevo from "@getbrevo/brevo";
import { EmailData } from "@/lib/types";
import { getClashEmailContent } from "@/emails/clash";

const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
    throw new Error("BREVO_API_KEY is not set in the environment variables");
}

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

// export const runtime = 'edge';

const emailTemplates: Record<string, (params?: Record<string, string>) => string> = {
    clash: getClashEmailContent,
    // Add more email templates here
};

export async function POST(request: Request) {
    try {
        const emailData: EmailData = await request.json();
        const { to, subject, templateName, sender, replyTo, params } = emailData;

        console.log(emailData);

        const htmlContent = emailTemplates[templateName](params);
        if (!htmlContent) {
            throw new Error(`Email template '${templateName}' not found`);
        }

        if (typeof params === "undefined") {
            throw new Error("No params provided");
        }

        const csvData = JSON.parse(params.dateEntries);

        // Generate the CSV content
        const csvHeaders = Object.keys(csvData[Object.keys(csvData)[0]]).join(",");
        const csvRows = Object.keys(csvData)
            .map((key) => Object.values(csvData[key]).join(","))
            .join("\n");
        const csvContent = `${csvHeaders}\n${csvRows}`;

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = to;
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = sender;
        sendSmtpEmail.replyTo = replyTo;
        sendSmtpEmail.params = params;
        sendSmtpEmail.attachment = [
            {
                name: "first-night-diary.csv",
                content: Buffer.from(csvContent).toString("base64"),
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
