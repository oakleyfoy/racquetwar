import { beforeEach, describe, expect, it, vi } from "vitest";

const recordPortalActivity = vi.fn();
const sendCandidateMessage = vi.fn();
const getStaffNotifyAddress = vi.fn();

vi.mock("./portal-db", () => ({
  recordPortalActivity: (...args: unknown[]) => recordPortalActivity(...args),
}));

vi.mock("./mail", () => ({
  sendCandidateMessage: (...args: unknown[]) => sendCandidateMessage(...args),
  getStaffNotifyAddress: (...args: unknown[]) => getStaffNotifyAddress(...args),
}));

describe("portal notify failure isolation", () => {
  beforeEach(() => {
    recordPortalActivity.mockReset();
    sendCandidateMessage.mockReset();
    getStaffNotifyAddress.mockReset();
    getStaffNotifyAddress.mockReturnValue(null);
  });

  it("records a failed Director email and does not throw", async () => {
    sendCandidateMessage.mockRejectedValue(new Error("smtp down"));
    const { notifyPortal } = await import("./portal-mail");

    await expect(
      notifyPortal("event_submitted", {
        directorEmail: "director@example.com",
        firstName: "Jordan",
        title: "Memphis Open",
        entityType: "event",
        entityId: "11111111-1111-1111-1111-111111111111",
        staffSubject: "New event",
      }),
    ).resolves.toBeUndefined();

    expect(recordPortalActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "email_failed" }),
    );
  });

  it("sends a staff alert when a proposal is submitted", async () => {
    sendCandidateMessage.mockResolvedValue({ mode: "smtp" });
    getStaffNotifyAddress.mockReturnValue("oakley@example.com");
    const { notifyPortal } = await import("./portal-mail");

    await notifyPortal("event_submitted", {
      directorEmail: "director@example.com",
      firstName: "Carla",
      directorName: "Carla Kohls",
      title: "Grand Junction Open",
      location: "Grand Junction, Colorado",
      entityType: "event",
      entityId: "11111111-1111-1111-1111-111111111111",
      staffSubject: "Event proposal submitted by Carla Kohls",
      reviewUrl:
        "https://apply.wartournaments.com/tournament-director/admin/events/11111111-1111-1111-1111-111111111111",
    });

    expect(sendCandidateMessage).toHaveBeenCalledTimes(2);
    expect(sendCandidateMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "director@example.com",
        subject: "We received your event proposal",
      }),
    );
    expect(sendCandidateMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: "oakley@example.com",
        replyTo: "director@example.com",
        subject: "Event proposal submitted by Carla Kohls",
      }),
    );
    expect(sendCandidateMessage.mock.calls[1]?.[0].html).toContain("Review in admin");
    expect(sendCandidateMessage.mock.calls[1]?.[0].html).not.toContain("Hi Carla");
  });

  it("records a successful Director email", async () => {
    sendCandidateMessage.mockResolvedValue({ mode: "smtp" });
    const { notifyPortal } = await import("./portal-mail");

    await notifyPortal("sponsorship_approved", {
      directorEmail: "director@example.com",
      firstName: "Jordan",
      title: "Local Club",
      entityType: "sponsorship",
      entityId: "11111111-1111-1111-1111-111111111111",
      staffSubject: "Approved",
    });

    expect(recordPortalActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "email_sent" }),
    );
  });
});
