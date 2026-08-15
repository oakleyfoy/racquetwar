/**
 * Internal recruiting workflow for CTD applications.
 * Statuses live on companion tables, not on ctd_applications.
 */

export const WORKFLOW_ACTOR = "Oakley Foy";

export const ADMIN_TIMEZONE = "America/Chicago";

export const WORKFLOW_STATUSES = [
  "new",
  "under_review",
  "screening_invited",
  "screening_scheduled",
  "screening_completed",
  "advanced",
  "on_hold",
  "declined",
  "withdrawn",
  "selected",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  new: "New",
  under_review: "Under Review",
  screening_invited: "Screening Invited",
  screening_scheduled: "Screening Scheduled",
  screening_completed: "Screening Completed",
  advanced: "Advanced",
  on_hold: "On Hold",
  declined: "Declined",
  withdrawn: "Withdrawn",
  selected: "Selected",
};

export const ACTIVE_WORKFLOW_STATUSES = [
  "new",
  "under_review",
  "screening_invited",
  "screening_scheduled",
  "screening_completed",
  "advanced",
  "on_hold",
  "selected",
] as const;

export const SCREENING_STATUSES = [
  "screening_invited",
  "screening_scheduled",
  "screening_completed",
] as const;

export const CLOSED_WORKFLOW_STATUSES = ["declined", "withdrawn"] as const;

export const SCREENING_METHODS = [
  "phone",
  "microsoft_teams",
  "zoom",
  "google_meet",
  "other",
] as const;

export type ScreeningMethod = (typeof SCREENING_METHODS)[number];

export const SCREENING_METHOD_LABELS: Record<ScreeningMethod, string> = {
  phone: "Phone",
  microsoft_teams: "Microsoft Teams",
  zoom: "Zoom",
  google_meet: "Google Meet",
  other: "Other",
};

export const SCREENING_OUTCOMES = [
  "strong_fit",
  "possible_fit",
  "not_a_fit",
  "candidate_withdrew",
  "needs_additional_review",
] as const;

export type ScreeningOutcome = (typeof SCREENING_OUTCOMES)[number];

export const SCREENING_OUTCOME_LABELS: Record<ScreeningOutcome, string> = {
  strong_fit: "Strong fit",
  possible_fit: "Possible fit",
  not_a_fit: "Not a fit",
  candidate_withdrew: "Candidate withdrew",
  needs_additional_review: "Needs additional review",
};

export const ACTIVITY_TYPES = [
  "status_changed",
  "note_added",
  "screening_scheduled",
  "screening_rescheduled",
  "screening_canceled",
  "screening_outcome_recorded",
  "follow_up_created",
  "follow_up_completed",
  "follow_up_reopened",
  "candidate_email_sent",
  "candidate_email_failed",
  "assignment_changed",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  status_changed: "Status changed",
  note_added: "Note added",
  screening_scheduled: "Screening scheduled",
  screening_rescheduled: "Screening rescheduled",
  screening_canceled: "Screening canceled",
  screening_outcome_recorded: "Screening outcome recorded",
  follow_up_created: "Follow-up created",
  follow_up_completed: "Follow-up completed",
  follow_up_reopened: "Follow-up reopened",
  candidate_email_sent: "Candidate email sent",
  candidate_email_failed: "Candidate email failed",
  assignment_changed: "Assignment changed",
};

export const CANDIDATE_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Detroit",
  "America/Indiana/Indianapolis",
  "America/Boise",
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "America/St_Johns",
  "America/Puerto_Rico",
  "UTC",
] as const;

export function isWorkflowStatus(value: string): value is WorkflowStatus {
  return (WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function isScreeningMethod(value: string): value is ScreeningMethod {
  return (SCREENING_METHODS as readonly string[]).includes(value);
}

export function isScreeningOutcome(value: string): value is ScreeningOutcome {
  return (SCREENING_OUTCOMES as readonly string[]).includes(value);
}

export function defaultWorkflowStatus(
  stored: string | null | undefined,
): WorkflowStatus {
  return stored && isWorkflowStatus(stored) ? stored : "new";
}

export function requiresStatusConfirmation(
  from: WorkflowStatus,
  to: WorkflowStatus,
) {
  if (from === to) return false;
  if (to === "declined" || to === "selected") return true;
  if (from === "advanced" || from === "selected") return true;
  if (
    from === "withdrawn" &&
    (ACTIVE_WORKFLOW_STATUSES as readonly string[]).includes(to)
  ) {
    return true;
  }
  return false;
}

export function statusConfirmationMessage(
  from: WorkflowStatus,
  to: WorkflowStatus,
) {
  if (to === "declined") {
    return "Decline this candidate? This is an internal status change and will not email them.";
  }
  if (to === "selected") {
    return "Mark this candidate as selected for the initial group? This is an internal status only. It does not certify them, grant territory, or send an email.";
  }
  if (from === "advanced" || from === "selected") {
    return `Move this candidate backward from ${WORKFLOW_STATUS_LABELS[from]} to ${WORKFLOW_STATUS_LABELS[to]}? This will not send an email.`;
  }
  if (from === "withdrawn") {
    return `Return this withdrawn applicant to ${WORKFLOW_STATUS_LABELS[to]}? This will not send an email.`;
  }
  return `Change status to ${WORKFLOW_STATUS_LABELS[to]}? This will not send an email.`;
}

export type TrackerSummary = {
  total: number;
  new: number;
  needsReview: number;
  screening: number;
  advanced: number;
  onHold: number;
  selected: number;
  declinedWithdrawn: number;
  followUpsDue: number;
};

export function emptyTrackerSummary(): TrackerSummary {
  return {
    total: 0,
    new: 0,
    needsReview: 0,
    screening: 0,
    advanced: 0,
    onHold: 0,
    selected: 0,
    declinedWithdrawn: 0,
    followUpsDue: 0,
  };
}

export function summarizeWorkflowStatuses(
  statusCounts: Record<string, number>,
  followUpsDue: number,
): TrackerSummary {
  const count = (status: WorkflowStatus) => statusCounts[status] ?? 0;

  return {
    total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
    new: count("new"),
    needsReview: count("under_review"),
    screening:
      count("screening_invited") +
      count("screening_scheduled") +
      count("screening_completed"),
    advanced: count("advanced"),
    onHold: count("on_hold"),
    selected: count("selected"),
    declinedWithdrawn: count("declined") + count("withdrawn"),
    followUpsDue,
  };
}

export type FollowUpDueFilter = "any_open" | "overdue" | "today";

export function isFollowUpDueFilter(
  value: string,
): value is FollowUpDueFilter {
  return value === "any_open" || value === "overdue" || value === "today";
}
