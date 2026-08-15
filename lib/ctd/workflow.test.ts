import { describe, expect, it } from "vitest";

import {
  defaultWorkflowStatus,
  requiresStatusConfirmation,
  summarizeWorkflowStatuses,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUSES,
} from "./workflow";

describe("workflow statuses", () => {
  it("uses the approved internal statuses and labels", () => {
    expect([...WORKFLOW_STATUSES]).toEqual([
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
    ]);
    expect(WORKFLOW_STATUS_LABELS.new).toBe("New");
    expect(WORKFLOW_STATUS_LABELS.under_review).toBe("Under Review");
    expect(WORKFLOW_STATUS_LABELS.selected).toBe("Selected");
  });

  it("treats missing workflow records as New", () => {
    expect(defaultWorkflowStatus(null)).toBe("new");
    expect(defaultWorkflowStatus(undefined)).toBe("new");
    expect(defaultWorkflowStatus("not-a-status")).toBe("new");
    expect(defaultWorkflowStatus("advanced")).toBe("advanced");
  });

  it("requires confirmation for sensitive transitions only", () => {
    expect(requiresStatusConfirmation("new", "under_review")).toBe(false);
    expect(requiresStatusConfirmation("under_review", "declined")).toBe(true);
    expect(requiresStatusConfirmation("advanced", "selected")).toBe(true);
    expect(requiresStatusConfirmation("selected", "advanced")).toBe(true);
    expect(requiresStatusConfirmation("advanced", "on_hold")).toBe(true);
    expect(requiresStatusConfirmation("withdrawn", "under_review")).toBe(true);
    expect(requiresStatusConfirmation("declined", "declined")).toBe(false);
  });

  it("summarizes tracker counts from workflow statuses", () => {
    const summary = summarizeWorkflowStatuses(
      {
        new: 2,
        under_review: 1,
        screening_invited: 1,
        screening_scheduled: 1,
        declined: 1,
        withdrawn: 1,
      },
      3,
    );

    expect(summary.total).toBe(7);
    expect(summary.new).toBe(2);
    expect(summary.needsReview).toBe(1);
    expect(summary.screening).toBe(2);
    expect(summary.declinedWithdrawn).toBe(2);
    expect(summary.followUpsDue).toBe(3);
  });
});
