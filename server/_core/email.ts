import nodemailer from "nodemailer";

// Get SMTP configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "TourFame.com";

if (!SMTP_USER || !SMTP_PASS) {
  console.warn("[Email] SMTP credentials not configured. Email sending will fail.");
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using configured SMTP settings
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("[Email] Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> {
  const baseUrl = process.env.VITE_OAUTH_PORTAL_URL?.replace("/api", "") || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a4d2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1a4d2e; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>重設密碼</h1>
        </div>
        <div class="content">
          <p>您好 ${userName}，</p>
          <p>我們收到了您的密碼重設請求。請點擊下方按鈕重設您的密碼：</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">重設密碼</a>
          </div>
          <p>或複製以下連結到瀏覽器：</p>
          <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          <p><strong>此連結將在 1 小時後過期。</strong></p>
          <p>如果您沒有請求重設密碼，請忽略此郵件。</p>
          <p>祝好，<br>TourFame.com 團隊</p>
        </div>
        <div class="footer">
          <p>© 2026 TourFame.com. 版權所有。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
您好 ${userName}，

我們收到了您的密碼重設請求。請訪問以下連結重設您的密碼：

${resetUrl}

此連結將在 1 小時後過期。

如果您沒有請求重設密碼，請忽略此郵件。

祝好，
TourFame.com 團隊
  `;

  return sendEmail({
    to: email,
    subject: "重設您的密碼 - TourFame.com",
    html,
    text,
  });
}
