import { afterEach, describe, expect, it, vi } from "vitest";

import { buildCandidateEmail } from "./candidate-mail";
import { getScreeningBookingUrl, isSafeHttpUrl } from "./scheduling";
import { deliverScreeningInvitation } from "./screening-invitation";
import { validApplication } from "./test-fixtures";

const BOOKING_URL = "https://outlook.office.com/book/example/?q=a&b=1";

const application = {
  ...validApplication({ firstName: "Jordan" }),
  id: "11111111-1111-1111-1111-111111111111",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Microsoft Bookings screening invitation", () => {
  it("cannot send without CTD_SCREENING_BOOKING_URL", async () => {
    const markInvited = vi.fn();
    const sendMessage = vi.fn();
    const recordActivity = vi.fn();

    const result = await deliverScreeningInvitation(application, "under_review", {
      getBookingUrl: () => null,
      sendMessage,
      markInvited,
      recordActivity,
    });

    expect(result).toEqual({
      ok: false,
      statusChanged: false,
      reason: "missing_booking_url",
    });
    expect(sendMessage).not.toHaveBeenCalled();
    expect(markInvited).not.toHaveBeenCalled();
    expect(recordActivity).toHaveBeenCalledWith(application.id, {
      sent: false,
      emailType: "screening_invitation",
      detail:
        "Screening invitation was not sent because CTD_SCREENING_BOOKING_URL is not configured.",
    });
  });

  it("includes the escaped booking URL in HTML and the raw URL in plain text", () => {
    const rendered = buildCandidateEmail("screening_invitation", {
      application,
      bookingUrl: BOOKING_URL,
    });

    expect(rendered.subject).toBe(
      "Schedule Your RW Tournament Director Screening Call",
    );
    expect(rendered.html).toContain("CHOOSE YOUR SCREENING TIME");
    expect(rendered.text).toContain("CHOOSE YOUR SCREENING TIME");
    expect(rendered.html).toContain(BOOKING_URL.replaceAll("&", "&amp;"));
    expect(rendered.text).toContain(BOOKING_URL);
    expect(rendered.html).toContain('href="https://outlook.office.com/book/example/?q=a&amp;b=1"');
    expect(rendered.html).not.toContain('href="https://outlook.office.com/book/example/?q=a&b=1"');
  });

  it("never includes internal notes in the invitation", () => {
    const rendered = buildCandidateEmail("screening_invitation", {
      application,
      bookingUrl: BOOKING_URL,
    });

    expect(rendered.html).not.toContain("Internal — not visible to applicant");
    expect(rendered.text).not.toContain("private concern");
    expect(rendered.html).not.toContain("{escapeHtml(");
    expect(rendered.html).not.toContain("PROGRAM_NAME");
  });

  it("changes status to Screening Invited only after a successful send", async () => {
    const markInvited = vi.fn();
    const sendMessage = vi.fn().mockResolvedValue({ mode: "smtp", replyTo: "staff@example.com" });
    const recordActivity = vi.fn();

    const result = await deliverScreeningInvitation(application, "under_review", {
      getBookingUrl: () => BOOKING_URL,
      sendMessage,
      markInvited,
      recordActivity,
    });

    expect(result).toEqual({ ok: true, statusChanged: true });
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(markInvited).toHaveBeenCalledWith(application.id, "under_review");
    expect(recordActivity).toHaveBeenCalledWith(application.id, {
      sent: true,
      emailType: "screening_invitation",
      detail: "Sent Microsoft Bookings screening invitation.",
    });
    expect(markInvited.mock.invocationCallOrder[0]).toBeGreaterThan(
      sendMessage.mock.invocationCallOrder[0],
    );
  });

  it("does not change status when the email send fails", async () => {
    const markInvited = vi.fn();
    const sendMessage = vi.fn().mockRejectedValue(new Error("transport down"));
    const recordActivity = vi.fn();

    const result = await deliverScreeningInvitation(application, "under_review", {
      getBookingUrl: () => BOOKING_URL,
      sendMessage,
      markInvited,
      recordActivity,
    });

    expect(result).toEqual({
      ok: false,
      statusChanged: false,
      reason: "send_failed",
    });
    expect(markInvited).not.toHaveBeenCalled();
    expect(recordActivity).toHaveBeenCalledWith(application.id, {
      sent: false,
      emailType: "screening_invitation",
      detail: "Screening invitation email failed.",
    });
  });

  it("reads only a safe server-side booking URL", () => {
    vi.stubEnv("CTD_SCREENING_BOOKING_URL", BOOKING_URL);
    expect(getScreeningBookingUrl()).toBe(BOOKING_URL);

    vi.stubEnv("CTD_SCREENING_BOOKING_URL", "javascript:alert(1)");
    expect(getScreeningBookingUrl()).toBeNull();
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });
});
