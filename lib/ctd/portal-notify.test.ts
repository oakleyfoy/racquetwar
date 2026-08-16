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
