import { afterEach, describe, expect, it, vi } from "vitest";

import { PROGRAM_SLUG } from "./fields";
import { validApplication } from "./test-fixtures";
import {
  inviteApplicantForScreening,
  resetBulkInvitationLocksForTests,
  runAuthorizedBulkScreeningInvitations,
  sendBulkScreeningInvitations,
  uniqueApplicantIds,
  type InviteApplicantDeps,
} from "./bulk-screening-invitations";
import { deliverScreeningInvitation } from "./screening-invitation";
import type { WorkflowStatus } from "./workflow";

const BOOKING_URL = "https://outlook.office.com/book/example/?q=a&b=1";

const CARLA_ID = "11111111-1111-1111-1111-111111111111";
const JORDAN_ID = "22222222-2222-2222-2222-222222222222";
const MISSING_ID = "33333333-3333-3333-3333-333333333333";
const DECLINED_ID = "44444444-4444-4444-4444-444444444444";
const INVALID_EMAIL_ID = "55555555-5555-5555-5555-555555555555";

function record(
  id: string,
  overrides: Partial<ReturnType<typeof validApplication>> = {},
) {
  return {
    ...validApplication(overrides),
    id,
    program: PROGRAM_SLUG,
    submittedAt: "2026-08-01T00:00:00.000Z",
    status: "new" as const,
    adminNotes: "",
    sourcePage: "",
  };
}

const applicants = {
  [CARLA_ID]: record(CARLA_ID, {
    firstName: "Carla",
    lastName: "Kohls",
    email: "carla@example.com",
  }),
  [JORDAN_ID]: record(JORDAN_ID, {
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan.lee@example.com",
  }),
  [DECLINED_ID]: record(DECLINED_ID, {
    firstName: "Pat",
    lastName: "Rivera",
    email: "pat@example.com",
  }),
  [INVALID_EMAIL_ID]: record(INVALID_EMAIL_ID, {
    firstName: "No",
    lastName: "Email",
    email: "not-an-email",
  }),
};

const statuses: Record<string, WorkflowStatus> = {
  [CARLA_ID]: "screening_invited",
  [JORDAN_ID]: "under_review",
  [DECLINED_ID]: "declined",
  [INVALID_EMAIL_ID]: "new",
};

function createDeps(options?: {
  statuses?: Record<string, WorkflowStatus>;
  sendMessage?: ReturnType<typeof vi.fn>;
  markInvited?: ReturnType<typeof vi.fn>;
  recordActivity?: ReturnType<typeof vi.fn>;
  deliver?: InviteApplicantDeps["deliver"];
}): InviteApplicantDeps & {
  sendMessage: ReturnType<typeof vi.fn>;
  markInvited: ReturnType<typeof vi.fn>;
  recordActivity: ReturnType<typeof vi.fn>;
} {
  const sendMessage =
    options?.sendMessage ??
    vi.fn().mockResolvedValue({ mode: "smtp", replyTo: "staff@example.com" });
  const markInvited = options?.markInvited ?? vi.fn();
  const recordActivity = options?.recordActivity ?? vi.fn();
  const statusMap = options?.statuses ?? statuses;

  return {
    sendMessage,
    markInvited,
    recordActivity,
    getApplication: async (id) => applicants[id as keyof typeof applicants] ?? null,
    getWorkflow: async (id) => ({
      currentStatus: statusMap[id] ?? "new",
    }),
    deliver:
      options?.deliver ??
      ((application, previousStatus) =>
        deliverScreeningInvitation(application, previousStatus, {
          getBookingUrl: () => BOOKING_URL,
          sendMessage,
          markInvited,
          recordActivity,
        })),
  };
}

afterEach(() => {
  resetBulkInvitationLocksForTests();
});

describe("uniqueApplicantIds", () => {
  it("accepts only string IDs and ignores client-supplied emails or objects", () => {
    expect(
      uniqueApplicantIds([
        CARLA_ID,
        { id: JORDAN_ID, email: "attacker@evil.com" },
        "attacker@evil.com",
        CARLA_ID,
        "  ",
        12,
      ]),
    ).toEqual([CARLA_ID, "attacker@evil.com"]);
  });
});

describe("inviteApplicantForScreening", () => {
  it("sends one eligible applicant and records applicant-level history", async () => {
    const deps = createDeps({
      statuses: { [JORDAN_ID]: "under_review" },
    });

    const result = await inviteApplicantForScreening(JORDAN_ID, deps);

    expect(result).toMatchObject({
      applicationId: JORDAN_ID,
      name: "Jordan Lee",
      outcome: "sent",
      statusChanged: true,
    });
    expect(deps.sendMessage).toHaveBeenCalledTimes(1);
    expect(deps.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jordan.lee@example.com",
        subject: "Schedule Your RW Tournament Director Screening Call",
      }),
    );
    expect(deps.markInvited).toHaveBeenCalledWith(JORDAN_ID, "under_review");
    expect(deps.recordActivity).toHaveBeenCalledWith(JORDAN_ID, {
      sent: true,
      emailType: "screening_invitation",
      detail: "Sent Microsoft Bookings screening invitation.",
    });
  });

  it("resends to Screening Invited without changing status", async () => {
    const deps = createDeps();
    const result = await inviteApplicantForScreening(CARLA_ID, deps);

    expect(result.outcome).toBe("sent");
    expect(result.statusChanged).toBe(false);
    expect(deps.markInvited).not.toHaveBeenCalled();
    expect(deps.recordActivity).toHaveBeenCalledWith(CARLA_ID, {
      sent: true,
      emailType: "screening_invitation",
      detail: "Resent Microsoft Bookings screening invitation.",
    });
  });

  it("skips ineligible statuses", async () => {
    const deps = createDeps();
    const result = await inviteApplicantForScreening(DECLINED_ID, deps);

    expect(result).toMatchObject({
      outcome: "skipped",
      reason: "ineligible_status",
    });
    expect(deps.sendMessage).not.toHaveBeenCalled();
    expect(deps.markInvited).not.toHaveBeenCalled();
  });

  it("skips a missing applicant ID", async () => {
    const deps = createDeps();
    const result = await inviteApplicantForScreening(MISSING_ID, deps);

    expect(result).toMatchObject({
      outcome: "skipped",
      reason: "not_found",
    });
    expect(deps.sendMessage).not.toHaveBeenCalled();
  });

  it("skips an invalid ID that is not a UUID", async () => {
    const deps = createDeps();
    const result = await inviteApplicantForScreening("not-a-uuid", deps);

    expect(result.reason).toBe("invalid_id");
    expect(deps.getApplication).toBeDefined();
    expect(deps.sendMessage).not.toHaveBeenCalled();
  });

  it("skips an applicant with a missing or invalid email", async () => {
    const deps = createDeps();
    const result = await inviteApplicantForScreening(INVALID_EMAIL_ID, deps);

    expect(result).toMatchObject({
      outcome: "skipped",
      reason: "invalid_email",
    });
    expect(deps.sendMessage).not.toHaveBeenCalled();
  });
});

describe("sendBulkScreeningInvitations", () => {
  it("sends one eligible applicant", async () => {
    const deps = createDeps({
      statuses: { [JORDAN_ID]: "new" },
    });
    const result = await sendBulkScreeningInvitations([JORDAN_ID], deps);

    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.items[0]?.statusChanged).toBe(true);
  });

  it("sends multiple eligible applicants as individual messages", async () => {
    const deps = createDeps({
      statuses: {
        [CARLA_ID]: "screening_invited",
        [JORDAN_ID]: "new",
      },
    });
    const result = await sendBulkScreeningInvitations([CARLA_ID, JORDAN_ID], deps);

    expect(result.sentCount).toBe(2);
    expect(deps.sendMessage).toHaveBeenCalledTimes(2);
    expect(deps.sendMessage.mock.calls[0]?.[0].to).toBe("carla@example.com");
    expect(deps.sendMessage.mock.calls[1]?.[0].to).toBe("jordan.lee@example.com");
    expect(deps.markInvited).toHaveBeenCalledTimes(1);
    expect(deps.markInvited).toHaveBeenCalledWith(JORDAN_ID, "new");
  });

  it("keeps Screening Invited on resend and transitions a first-time invite", async () => {
    const deps = createDeps({
      statuses: {
        [CARLA_ID]: "screening_invited",
        [JORDAN_ID]: "under_review",
      },
    });
    const result = await sendBulkScreeningInvitations([CARLA_ID, JORDAN_ID], deps);
    const byId = Object.fromEntries(result.items.map((item) => [item.applicationId, item]));

    expect(byId[CARLA_ID]?.statusChanged).toBe(false);
    expect(byId[JORDAN_ID]?.statusChanged).toBe(true);
    expect(deps.markInvited).toHaveBeenCalledTimes(1);
    expect(deps.markInvited).toHaveBeenCalledWith(JORDAN_ID, "under_review");
  });

  it("handles a mixed batch of eligible and ineligible applicants", async () => {
    const deps = createDeps();
    const result = await sendBulkScreeningInvitations(
      [CARLA_ID, DECLINED_ID, MISSING_ID],
      deps,
    );

    expect(result.sentCount).toBe(1);
    expect(result.skippedCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(deps.sendMessage).toHaveBeenCalledTimes(1);
    expect(result.items.map((item) => item.reason)).toEqual([
      undefined,
      "ineligible_status",
      "not_found",
    ]);
  });

  it("continues after a partial send failure", async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error("transport down"))
      .mockResolvedValue({ mode: "smtp", replyTo: "staff@example.com" });
    const deps = createDeps({
      sendMessage,
      statuses: {
        [CARLA_ID]: "screening_invited",
        [JORDAN_ID]: "new",
      },
    });

    const result = await sendBulkScreeningInvitations([CARLA_ID, JORDAN_ID], deps);

    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.items[0]).toMatchObject({
      name: "Carla Kohls",
      outcome: "failed",
      reason: "send_failed",
      message: "Invitation could not be sent.",
    });
    expect(result.items[1]?.outcome).toBe("sent");
    expect(deps.markInvited).toHaveBeenCalledTimes(1);
    expect(result.items[0]?.message).not.toContain("transport down");
  });

  it("does not trust recipient emails from client input", async () => {
    const deps = createDeps();
    const result = await sendBulkScreeningInvitations(
      [
        CARLA_ID,
        { id: JORDAN_ID, email: "attacker@evil.com" },
        "attacker@evil.com",
      ],
      deps,
    );

    expect(result.selectedCount).toBe(2);
    expect(deps.sendMessage).toHaveBeenCalledTimes(1);
    expect(deps.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ to: "carla@example.com" }),
    );
    expect(deps.sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: "attacker@evil.com" }),
    );
    expect(result.items.some((item) => item.reason === "invalid_id")).toBe(true);
  });

  it("rejects a second overlapping submission of the same batch", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const deps = createDeps({
      deliver: async () => {
        await gate;
        return { ok: true, statusChanged: false };
      },
    });

    const firstPromise = sendBulkScreeningInvitations([CARLA_ID], deps);
    const second = await sendBulkScreeningInvitations([CARLA_ID], deps);
    expect(second.alreadyProcessing).toBe(true);
    expect(second.sentCount).toBe(0);
    release();
    const first = await firstPromise;
    expect(first.sentCount).toBe(1);
    expect(first.alreadyProcessing).toBe(false);
  });
});

describe("runAuthorizedBulkScreeningInvitations", () => {
  it("requires an admin session before sending", async () => {
    const requireAdmin = vi.fn().mockRejectedValue(new Error("REDIRECT:/tournament-director/admin/login"));
    const deps = createDeps();

    await expect(
      runAuthorizedBulkScreeningInvitations([CARLA_ID], requireAdmin, deps),
    ).rejects.toThrow("REDIRECT:/tournament-director/admin/login");
    expect(deps.sendMessage).not.toHaveBeenCalled();
  });

  it("sends after an authenticated admin session is verified", async () => {
    const requireAdmin = vi.fn().mockResolvedValue(undefined);
    const deps = createDeps();
    const result = await runAuthorizedBulkScreeningInvitations(
      [CARLA_ID],
      requireAdmin,
      deps,
    );

    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(result.sentCount).toBe(1);
  });
});
