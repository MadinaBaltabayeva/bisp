import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

/**
 * Get or create the Nodemailer transporter singleton.
 * Uses Ethereal test accounts in development.
 */
async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}

/**
 * Build a simple branded HTML email template.
 */
function buildEmailHtml({
  recipientName,
  body,
  linkUrl,
}: {
  recipientName: string;
  body: string;
  linkUrl: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #2563eb; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">RentHub</h1>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hi ${recipientName},</p>
        <p>${body}</p>
        <a href="${linkUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          View Details
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px;">
          You can disable email notifications in your account settings.
        </p>
      </div>
    </div>
  `.trim();
}

interface SendNotificationEmailParams {
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  linkUrl: string;
}

/**
 * Send a notification email using Nodemailer.
 * Uses Ethereal in development and logs the preview URL.
 */
export async function sendNotificationEmail({
  to,
  recipientName,
  subject,
  body,
  linkUrl,
}: SendNotificationEmailParams): Promise<void> {
  const transport = await getTransporter();

  const html = buildEmailHtml({ recipientName, body, linkUrl });

  const info = await transport.sendMail({
    from: '"RentHub" <notifications@renthub.uz>',
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("Email preview URL:", previewUrl);
  }
}
