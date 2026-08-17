import {
  buildCandidateEmail,
  type CandidateEmailContext,
} from "./candidate-mail";
import { sendCandidateMessage } from "./mail";
import { getScreeningBookingUrl } from "./scheduling";
import {
  recordEmailActivity,
  updateWorkflowFields,
} from "./workflow-db";
import { WORKFLOW_STATUS_LABELS } from "./workflow";

export type ScreeningInvitationApplication = CandidateEmailContext["application"] & {
  id: string;
};

export type ScreeningInvitationResult =
  | { ok: true; statusChanged: boolean }
  | {
      ok: false;
      statusChanged: false;
      reason: "missing_booking_url" | "send_failed";
    };

export type ScreeningInvitationDeps = {
  getBookingUrl: () => string | null;
  sendMessage: typeof sendCandidateMessage;
  markInvited: (applicationId: string, previousStatus: string) => Promise<void>;
  recordActivity: typeof recordEmailActivity;
};

export async function markApplicantScreeningInvited(
  applicationId: string,
  previousStatus: string,
) {
  await updateWorkflowFields(
    applicationId,
    { currentStatus: "screening_invited" },
    {
      activityType: "status_changed",
      previousValue: previousStatus,
      newValue: "screening_invited",
      description: `Status changed to ${WORKFLOW_STATUS_LABELS.screening_invited} after the Bookings invitation was sent.`,
    },
  );
}

export function defaultScreeningInvitationDeps(): ScreeningInvitationDeps {
  return {
    getBookingUrl: getScreeningBookingUrl,
    sendMessage: sendCandidateMessage,
    markInvited: markApplicantScreeningInvited,
    recordActivity: recordEmailActivity,
  };
}

export async function deliverScreeningInvitation(
  application: ScreeningInvitationApplication,
  previousStatus: string,
  deps: ScreeningInvitationDeps = defaultScreeningInvitationDeps(),
): Promise<ScreeningInvitationResult> {
  const bookingUrl = deps.getBookingUrl();

  if (!bookingUrl) {
    await deps.recordActivity(application.id, {
      sent: false,
      emailType: "screening_invitation",
      detail:
        "Screening invitation was not sent because CTD_SCREENING_BOOKING_URL is not configured.",
    });
    return {
      ok: false,
      statusChanged: false,
      reason: "missing_booking_url",
    };
  }

  const rendered = buildCandidateEmail("screening_invitation", {
    application,
    bookingUrl,
  });

  try {
    await deps.sendMessage({
      to: application.email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
  } catch (error) {
    console.error("CTD screening invitation failed", error);
    await deps.recordActivity(application.id, {
      sent: false,
      emailType: "screening_invitation",
      detail: "Screening invitation email failed.",
    });
    return { ok: false, statusChanged: false, reason: "send_failed" };
  }

  const alreadyInvited = previousStatus === "screening_invited";
  if (!alreadyInvited) {
    await deps.markInvited(application.id, previousStatus);
  }
  await deps.recordActivity(application.id, {
    sent: true,
    emailType: "screening_invitation",
    detail: alreadyInvited
      ? "Resent Microsoft Bookings screening invitation."
      : "Sent Microsoft Bookings screening invitation.",
  });

  return { ok: true, statusChanged: !alreadyInvited };
}
