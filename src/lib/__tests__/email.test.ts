import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendMail = vi.fn();
const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));
const mockCreateTestAccount = vi.fn();
const mockGetTestMessageUrl = vi.fn();

vi.mock("nodemailer", () => ({
  default: {
    createTestAccount: (...args: unknown[]) => mockCreateTestAccount(...args),
    createTransport: (...args: unknown[]) => mockCreateTransport(...args),
    getTestMessageUrl: (...args: unknown[]) => mockGetTestMessageUrl(...args),
  },
}));

// Must import after mock setup
import { sendNotificationEmail } from "../email";

describe("sendNotificationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTestAccount.mockResolvedValue({
      smtp: { host: "smtp.ethereal.email", port: 587, secure: false },
      user: "test@ethereal.email",
      pass: "testpass",
    });
    mockSendMail.mockResolvedValue({ messageId: "test-id" });
    mockGetTestMessageUrl.mockReturnValue("https://ethereal.email/message/test");
  });

  it("calls transporter.sendMail with correct to, subject, and html", async () => {
    await sendNotificationEmail({
      to: "user@example.com",
      recipientName: "John",
      subject: "New rental request",
      body: "You have a new rental request.",
      linkUrl: "https://renthub.uz/rentals/123",
    });

    expect(mockSendMail).toHaveBeenCalledOnce();
    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.to).toBe("user@example.com");
    expect(callArgs.subject).toBe("New rental request");
    expect(callArgs.html).toContain("John");
    expect(callArgs.html).toContain("You have a new rental request.");
    expect(callArgs.html).toContain("https://renthub.uz/rentals/123");
    expect(callArgs.html).toContain("View Details");
  });

  it("logs Ethereal preview URL", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendNotificationEmail({
      to: "user@example.com",
      recipientName: "Jane",
      subject: "Test",
      body: "Test body",
      linkUrl: "https://renthub.uz/test",
    });

    expect(mockGetTestMessageUrl).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Email preview URL:",
      "https://ethereal.email/message/test"
    );
    consoleSpy.mockRestore();
  });

  it("creates Ethereal test account and transport", async () => {
    // Reset module to force fresh transporter creation
    vi.resetModules();

    const { sendNotificationEmail: freshSend } = await import("../email");

    await freshSend({
      to: "user@example.com",
      recipientName: "Test",
      subject: "Test",
      body: "Body",
      linkUrl: "https://renthub.uz",
    });

    expect(mockCreateTestAccount).toHaveBeenCalled();
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.ethereal.email",
        port: 587,
      })
    );
  });
});
