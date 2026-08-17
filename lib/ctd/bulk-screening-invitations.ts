import {
  deliverScreeningInvitation,
  type ScreeningInvitationApplication,
} from "./screening-invitation";
import {
  getWorkflow,
  requireStoredApplication,
  UUID_PATTERN,
} from "./workflow-db";
import {
  canReceiveScreeningInvitation,
  defaultWorkflowStatus,
  hasUsableApplicantEmail,
  screeningInvitationIneligibilityLabel,
} from "./workflow";

export type BulkScreeningInvitationReason =
  | "invalid_id"
  | "not_found"
  | "ineligible_status"
  | "invalid_email"
  | "missing_booking_url"
  | "send_failed"
  | "already_processing";

export type BulkScreeningInvitationItem = {
  applicationId: string;
  name: string;
  outcome: "sent" | "skipped" | "failed";
  reason?: BulkScreeningInvitationReason;
  message: string;
  statusChanged: boolean;
};

export type BulkScreeningInvitationBatchResult = {
  selectedCount: number;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  alreadyProcessing: boolean;
  items: BulkScreeningInvitationItem[];
};

export type InviteApplicantDeps = {
  getApplication: (
    id: string,
  ) => Promise<ScreeningInvitationApplication | null>;
  getWorkflow: (id: string) => Promise<{ currentStatus: string }>;
  deliver: typeof deliverScreeningInvitation;
};

const inFlightBatches = new Set<string>();

export function resetBulkInvitationLocksForTests() {
  inFlightBatches.clear();
}

export function defaultInviteApplicantDeps(): InviteApplicantDeps {
  return {
    getApplication: requireStoredApplication,
    getWorkflow,
    deliver: deliverScreeningInvitation,
  };
}

export function uniqueApplicantIds(applicationIds: unknown): string[] {
  if (!Array.isArray(applicationIds)) return [];

  const seen = new Set<string>();
  const ids: string[] = [];

  for (const value of applicationIds) {
    if (typeof value !== "string") continue;
    const id = value.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }

  return ids;
}

function item(
  applicationId: string,
  name: string,
  outcome: BulkScreeningInvitationItem["outcome"],
  message: string,
  reason?: BulkScreeningInvitationReason,
  statusChanged = false,
): BulkScreeningInvitationItem {
  return { applicationId, name, outcome, reason, message, statusChanged };
}

export async function inviteApplicantForScreening(
  applicationId: string,
  deps: InviteApplicantDeps = defaultInviteApplicantDeps(),
): Promise<BulkScreeningInvitationItem> {
  if (!UUID_PATTERN.test(applicationId)) {
    return item(
      applicationId,
      "Unknown applicant",
      "skipped",
      "Invalid applicant ID.",
      "invalid_id",
    );
  }

  const application = await deps.getApplication(applicationId);
  if (!application) {
    return item(
      applicationId,
      "Unknown applicant",
      "skipped",
      "Applicant was not found.",
      "not_found",
    );
  }

  const name =
    `${application.firstName ?? ""} ${application.lastName ?? ""}`.trim() ||
    "Unknown applicant";
  const workflow = await deps.getWorkflow(application.id);
  const status = defaultWorkflowStatus(workflow.currentStatus);

  if (!canReceiveScreeningInvitation(status)) {
    return item(
      application.id,
      name,
      "skipped",
      screeningInvitationIneligibilityLabel(status),
      "ineligible_status",
    );
  }

  if (!hasUsableApplicantEmail(application.email)) {
    return item(
      application.id,
      name,
      "skipped",
      "Applicant record is missing a valid email address.",
      "invalid_email",
    );
  }

  const result = await deps.deliver(application, status);

  if (result.ok) {
    return item(
      application.id,
      name,
      "sent",
      result.statusChanged
        ? "Screening invitation sent."
        : "Screening invitation resent.",
      undefined,
      result.statusChanged,
    );
  }

  return item(
    application.id,
    name,
    "failed",
    result.reason === "missing_booking_url"
      ? "Screening booking URL is not configured."
      : "Invitation could not be sent.",
    result.reason,
  );
}

function batchKey(ids: string[]) {
  return [...ids].sort().join(",");
}

function emptyBatch(
  selectedCount: number,
  alreadyProcessing = false,
): BulkScreeningInvitationBatchResult {
  return {
    selectedCount,
    sentCount: 0,
    skippedCount: 0,
    failedCount: 0,
    alreadyProcessing,
    items: [],
  };
}

export async function sendBulkScreeningInvitations(
  applicationIds: unknown,
  deps: InviteApplicantDeps = defaultInviteApplicantDeps(),
  locks: Set<string> = inFlightBatches,
): Promise<BulkScreeningInvitationBatchResult> {
  const ids = uniqueApplicantIds(applicationIds);
  if (ids.length === 0) return emptyBatch(0);

  const key = batchKey(ids);
  if (locks.has(key)) {
    return emptyBatch(ids.length, true);
  }

  locks.add(key);

  try {
    const items: BulkScreeningInvitationItem[] = [];

    for (const id of ids) {
      try {
        items.push(await inviteApplicantForScreening(id, deps));
      } catch (error) {
        console.error("CTD bulk screening invitation failed", {
          applicationId: id,
          error,
        });
        items.push(
          item(
            id,
            "Unknown applicant",
            "failed",
            "Invitation could not be sent.",
            "send_failed",
          ),
        );
      }
    }

    return {
      selectedCount: ids.length,
      sentCount: items.filter((entry) => entry.outcome === "sent").length,
      skippedCount: items.filter((entry) => entry.outcome === "skipped").length,
      failedCount: items.filter((entry) => entry.outcome === "failed").length,
      alreadyProcessing: false,
      items,
    };
  } finally {
    locks.delete(key);
  }
}

export async function runAuthorizedBulkScreeningInvitations(
  applicationIds: unknown,
  requireAdmin: () => Promise<void>,
  deps: InviteApplicantDeps = defaultInviteApplicantDeps(),
) {
  await requireAdmin();
  return sendBulkScreeningInvitations(applicationIds, deps);
}
