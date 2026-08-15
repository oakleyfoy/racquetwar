"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/ctd/admin-guard";
import {
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  isAdminConfigured,
  verifyPassword,
} from "@/lib/ctd/admin-session";
import { deleteApplication, updateApplication } from "@/lib/ctd/applications";
import {
  buildCandidateEmail,
  isCandidateEmailType,
  type CandidateEmailType,
  type ScreeningEmailDetails,
} from "@/lib/ctd/candidate-mail";
import { sendCandidateMessage } from "@/lib/ctd/mail";
import { deliverScreeningInvitation } from "@/lib/ctd/screening-invitation";
import {
  addFollowUp,
  addNote,
  cancelScreeningSchedule,
  getWorkflow,
  recordEmailActivity,
  recordScreeningOutcome,
  requireStoredApplication,
  saveScreeningSchedule,
  setFollowUpCompletion,
  updateWorkflowFields,
  UUID_PATTERN,
} from "@/lib/ctd/workflow-db";
import {
  isScreeningMethod,
  isScreeningOutcome,
  isWorkflowStatus,
  requiresStatusConfirmation,
  WORKFLOW_STATUS_LABELS,
  type WorkflowStatus,
} from "@/lib/ctd/workflow";
import { isValidIanaTimeZone, zonedDateTimeToUtc } from "@/lib/ctd/workflow-time";
import type { CtdApplicationRecord } from "@/lib/ctd/fields";

const ADMIN_PATH = "/tournament-director/admin";
const LOGIN_PATH = `${ADMIN_PATH}/login`;

function workspacePath(id: string, notice?: string) {
  return notice ? `${ADMIN_PATH}/${id}?notice=${notice}` : `${ADMIN_PATH}/${id}`;
}

async function requireWorkspaceApplication(id: string) {
  await requireAdminSession();
  const application = await requireStoredApplication(id);
  if (!application) redirect(`${ADMIN_PATH}?error=notfound`);
  return application;
}

function wantsEmail(formData: FormData) {
  const intent = String(formData.get("intent") ?? "");
  return (
    intent === "save_and_send" ||
    formData.get("sendEmail") === "1" ||
    formData.get("sendEmail") === "on"
  );
}

function confirmed(formData: FormData) {
  return (
    formData.get("confirmed") === "1" || formData.get("confirmSensitive") === "1"
  );
}

async function maybeSendCandidateEmail(
  application: CtdApplicationRecord,
  type: CandidateEmailType,
  send: boolean,
  screening?: ScreeningEmailDetails,
) {
  if (!send) return "saved" as const;

  const rendered = buildCandidateEmail(type, { application, screening });

  try {
    await sendCandidateMessage({
      to: application.email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
    await recordEmailActivity(application.id, {
      sent: true,
      emailType: type,
      detail: `Sent ${type.replaceAll("_", " ")} email.`,
    });
    return "emailed" as const;
  } catch (error) {
    console.error("CTD candidate email failed", error);
    await recordEmailActivity(application.id, {
      sent: false,
      emailType: type,
      detail: "Candidate email failed.",
    });
    return "email_failed" as const;
  }
}

function parseDueAt(formData: FormData, dateName: string, timeName: string) {
  const date = String(formData.get(dateName) ?? "").trim();
  const time = String(formData.get(timeName) ?? "").trim() || "09:00";
  const timeZone = String(formData.get("timeZone") ?? "America/Chicago").trim();
  if (!date) return null;
  return zonedDateTimeToUtc(date, time, timeZone);
}

export async function loginAction(formData: FormData) {
  if (!isAdminConfigured()) {
    redirect(`${LOGIN_PATH}?error=unconfigured`);
  }

  const password = String(formData.get("password") ?? "");

  if (!(await verifyPassword(password))) {
    redirect(`${LOGIN_PATH}?error=invalid`);
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, await createSessionToken(), SESSION_COOKIE_OPTIONS);

  redirect(ADMIN_PATH);
}

export async function logoutAction() {
  const store = await cookies();
  store.delete({ name: ADMIN_COOKIE, path: SESSION_COOKIE_OPTIONS.path });

  redirect(LOGIN_PATH);
}

export async function updateApplicationAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(ADMIN_PATH);

  await updateApplication(id, {
    status: String(formData.get("status") ?? ""),
    adminNotes: String(formData.get("adminNotes") ?? ""),
  });

  redirect(`${ADMIN_PATH}/${id}?saved=1`);
}

export async function deleteApplicationAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!UUID_PATTERN.test(id)) redirect(ADMIN_PATH);

  const deleted = await deleteApplication(id);
  redirect(deleted ? `${ADMIN_PATH}?deleted=1` : `${ADMIN_PATH}?error=notfound`);
}

export async function updateWorkflowStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const application = await requireWorkspaceApplication(id);
  const workflow = await getWorkflow(application.id);
  const next = String(formData.get("status") ?? "");

  if (!isWorkflowStatus(next)) {
    redirect(workspacePath(id, "invalid_status"));
  }

  if (requiresStatusConfirmation(workflow.currentStatus, next) && !confirmed(formData)) {
    redirect(workspacePath(id, "confirm_required"));
  }

  if (workflow.currentStatus !== next) {
    await updateWorkflowFields(
      application.id,
      { currentStatus: next },
      {
        activityType: "status_changed",
        previousValue: workflow.currentStatus,
        newValue: next,
        description: `Status changed to ${WORKFLOW_STATUS_LABELS[next]}.`,
      },
    );
  }

  const assignedTo = String(formData.get("assignedTo") ?? "");
  const nextAction = String(formData.get("nextAction") ?? "");
  if (
    assignedTo !== workflow.assignedTo ||
    nextAction !== workflow.nextAction
  ) {
    await updateWorkflowFields(
      application.id,
      { assignedTo, nextAction },
      assignedTo !== workflow.assignedTo
        ? {
            activityType: "assignment_changed",
            previousValue: workflow.assignedTo,
            newValue: assignedTo,
            description: assignedTo
              ? `Assigned to ${assignedTo}.`
              : "Assignment cleared.",
          }
        : undefined,
    );
  }

  redirect(workspacePath(id, "saved"));
}

export async function addNoteAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireWorkspaceApplication(id);

  try {
    await addNote(id, String(formData.get("note") ?? ""));
  } catch {
    redirect(workspacePath(id, "note_required"));
  }

  redirect(workspacePath(id, "note_added"));
}

export async function addFollowUpAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireWorkspaceApplication(id);

  try {
    await addFollowUp(id, {
      description: String(formData.get("actionDescription") ?? ""),
      dueAt: parseDueAt(formData, "dueDate", "dueTime"),
      assignedTo: String(formData.get("assignedTo") ?? ""),
    });
  } catch {
    redirect(workspacePath(id, "followup_required"));
  }

  redirect(workspacePath(id, "followup_added"));
}

export async function toggleFollowUpAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireWorkspaceApplication(id);
  const followUpId = String(formData.get("followUpId") ?? "");
  const completed = String(formData.get("completed") ?? "") === "1";

  try {
    await setFollowUpCompletion(id, followUpId, completed);
  } catch {
    redirect(workspacePath(id, "followup_missing"));
  }

  redirect(workspacePath(id, "followup_updated"));
}

function readScreeningInput(formData: FormData) {
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const timeZone = String(formData.get("timeZone") ?? "").trim();
  const method = String(formData.get("method") ?? "").trim();
  const locationOrLink = String(formData.get("locationOrLink") ?? "").trim();
  const preparationNote = String(formData.get("preparationNote") ?? "").trim();

  if (!date || !time) throw new Error("Enter a date and time.");
  if (!isValidIanaTimeZone(timeZone)) throw new Error("Enter a valid timezone.");
  if (!isScreeningMethod(method)) throw new Error("Choose a screening method.");

  return {
    scheduledAt: zonedDateTimeToUtc(date, time, timeZone),
    timeZone,
    method,
    locationOrLink,
    preparationNote,
  };
}

async function saveOptionalPrepNote(applicationId: string, note: string) {
  if (!note.trim()) return;
  await addNote(
    applicationId,
    `Screening preparation (internal):\n${note.trim()}`,
  );
}

export async function sendScreeningInvitationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const application = await requireWorkspaceApplication(id);
  if (!confirmed(formData)) {
    redirect(workspacePath(id, "confirm_required"));
  }

  const workflow = await getWorkflow(application.id);
  const result = await deliverScreeningInvitation(
    application,
    workflow.currentStatus,
  );

  if (result.ok) {
    redirect(workspacePath(id, "invited"));
  }

  redirect(
    workspacePath(
      id,
      result.reason === "missing_booking_url"
        ? "booking_url_missing"
        : "email_failed",
    ),
  );
}

export async function confirmBookingAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const application = await requireWorkspaceApplication(id);

  let screening;
  try {
    screening = readScreeningInput(formData);
  } catch {
    redirect(workspacePath(id, "schedule_invalid"));
  }

  await saveScreeningSchedule(application.id, screening, "schedule");
  await saveOptionalPrepNote(application.id, screening.preparationNote);
  redirect(workspacePath(id, "booking_confirmed"));
}

export async function scheduleScreeningAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const application = await requireWorkspaceApplication(id);
  const send = wantsEmail(formData);
  if (send && !confirmed(formData)) {
    redirect(workspacePath(id, "confirm_required"));
  }

  let screening;
  try {
    screening = readScreeningInput(formData);
  } catch {
    redirect(workspacePath(id, "schedule_invalid"));
  }

  const existing = await getWorkflow(application.id);
  const mode = existing.screeningScheduledAt ? "reschedule" : "schedule";
  await saveScreeningSchedule(application.id, screening, mode);
  await saveOptionalPrepNote(application.id, screening.preparationNote);

  const emailType: CandidateEmailType =
    mode === "reschedule" ? "screening_reschedule" : "screening_confirmation";
  const notice = await maybeSendCandidateEmail(
    application,
    emailType,
    send,
    {
      scheduledAt: screening.scheduledAt.toISOString(),
      timeZone: screening.timeZone,
      method: screening.method,
      locationOrLink: screening.locationOrLink,
    },
  );

  redirect(workspacePath(id, notice === "saved" ? (mode === "reschedule" ? "rescheduled" : "scheduled") : notice));
}

export async function cancelScreeningAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const application = await requireWorkspaceApplication(id);
  const send = wantsEmail(formData);
  if (send && !confirmed(formData)) {
    redirect(workspacePath(id, "confirm_required"));
  }

  await cancelScreeningSchedule(application.id);
  const notice = await maybeSendCandidateEmail(
    application,
    "screening_cancellation",
    send,
  );
  redirect(workspacePath(id, notice === "saved" ? "canceled" : notice));
}

export async function sendCandidateEmailAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const application = await requireWorkspaceApplication(id);
  const type = String(formData.get("emailType") ?? "");
  if (!isCandidateEmailType(type) || !confirmed(formData)) {
    redirect(workspacePath(id, "confirm_required"));
  }

  const workflow = await getWorkflow(application.id);
  const screening =
    workflow.screeningScheduledAt && isScreeningMethod(workflow.screeningMethod)
      ? {
          scheduledAt: workflow.screeningScheduledAt,
          timeZone: workflow.screeningTimezone || "America/Chicago",
          method: workflow.screeningMethod,
          locationOrLink: workflow.screeningLocationOrLink,
        }
      : undefined;

  if (type === "screening_invitation") {
    const result = await deliverScreeningInvitation(
      application,
      workflow.currentStatus,
    );
    redirect(
      workspacePath(
        id,
        result.ok
          ? "invited"
          : result.reason === "missing_booking_url"
            ? "booking_url_missing"
            : "email_failed",
      ),
    );
  }

  if (
    (type === "screening_confirmation" || type === "screening_reschedule") &&
    !screening
  ) {
    redirect(workspacePath(id, "schedule_invalid"));
  }

  const notice = await maybeSendCandidateEmail(application, type, true, screening);
  redirect(workspacePath(id, notice));
}

export async function recordScreeningOutcomeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireWorkspaceApplication(id);
  const outcome = String(formData.get("outcome") ?? "");
  if (!isScreeningOutcome(outcome)) {
    redirect(workspacePath(id, "outcome_invalid"));
  }

  await recordScreeningOutcome(id, {
    outcome,
    summary: String(formData.get("summary") ?? ""),
    recommendedNextStep: String(formData.get("recommendedNextStep") ?? ""),
  });
  redirect(workspacePath(id, "outcome"));
}

async function changeStatusWithReason(
  formData: FormData,
  next: WorkflowStatus,
  reasonField: string,
  notice: string,
  emailType?: CandidateEmailType,
) {
  const id = String(formData.get("id") ?? "");
  const application = await requireWorkspaceApplication(id);
  const workflow = await getWorkflow(application.id);
  const reason = String(formData.get(reasonField) ?? "").trim();

  if (!reason) redirect(workspacePath(id, "reason_required"));
  if (requiresStatusConfirmation(workflow.currentStatus, next) && !confirmed(formData)) {
    redirect(workspacePath(id, "confirm_required"));
  }

  const extra: {
    nextFollowUpAt?: Date | null;
    nextAction?: string;
  } = {};

  if (next === "on_hold") {
    const followUp = parseDueAt(formData, "holdDueDate", "holdDueTime");
    if (!followUp) redirect(workspacePath(id, "hold_date_required"));
    extra.nextFollowUpAt = followUp;
    extra.nextAction = reason;
    await addFollowUp(application.id, {
      description: `On hold: ${reason}`,
      dueAt: followUp,
      assignedTo: String(formData.get("assignedTo") ?? workflow.assignedTo),
    });
  }

  await updateWorkflowFields(
    application.id,
    { currentStatus: next, ...extra },
    {
      activityType: "status_changed",
      previousValue: workflow.currentStatus,
      newValue: next,
      description: reason,
    },
  );

  const send = wantsEmail(formData);
  if (send && emailType) {
    const emailNotice = await maybeSendCandidateEmail(application, emailType, true);
    redirect(workspacePath(id, emailNotice));
  }

  redirect(workspacePath(id, notice));
}

export async function advanceCandidateAction(formData: FormData) {
  await changeStatusWithReason(
    formData,
    "advanced",
    "reason",
    "advanced",
    "advancement",
  );
}

export async function holdCandidateAction(formData: FormData) {
  await changeStatusWithReason(formData, "on_hold", "reason", "hold", "hold");
}

export async function declineCandidateAction(formData: FormData) {
  await changeStatusWithReason(
    formData,
    "declined",
    "reason",
    "declined",
    "decline",
  );
}

export async function selectCandidateAction(formData: FormData) {
  await changeStatusWithReason(
    formData,
    "selected",
    "reason",
    "selected",
    "selection",
  );
}
