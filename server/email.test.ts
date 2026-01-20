import { describe, it, expect } from "vitest";
import { sendEmail } from "./_core/email";

describe("Email Service", () => {
  it("should send test email successfully", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Email - SMTP Configuration",
      html: "<p>This is a test email to verify SMTP configuration.</p>",
      text: "This is a test email to verify SMTP configuration.",
    });

    // If SMTP credentials are correct, sendEmail should return true
    // If credentials are wrong, it will return false
    expect(result).toBe(true);
  }, 30000); // 30 second timeout for email sending
});
