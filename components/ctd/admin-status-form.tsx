"use client";

import { updateWorkflowStatusAction } from "@/app/tournament-director/admin/actions";
import {
  requiresStatusConfirmation,
  statusConfirmationMessage,
  type WorkflowStatus,
} from "@/lib/ctd/workflow";

export function AdminStatusForm({
  applicationId,
  currentStatus,
  children,
}: {
  applicationId: string;
  currentStatus: WorkflowStatus;
  children: React.ReactNode;
}) {
  return (
    <form
      action={updateWorkflowStatusAction}
      onSubmit={(event) => {
        const form = event.currentTarget;
        const selected = String(
          new FormData(form).get("status") ?? currentStatus,
        ) as WorkflowStatus;
        if (!requiresStatusConfirmation(currentStatus, selected)) return;

        if (!window.confirm(statusConfirmationMessage(currentStatus, selected))) {
          event.preventDefault();
          return;
        }

        let confirmed = form.querySelector<HTMLInputElement>(
          'input[name="confirmed"]',
        );
        if (!confirmed) {
          confirmed = document.createElement("input");
          confirmed.type = "hidden";
          confirmed.name = "confirmed";
          form.appendChild(confirmed);
        }
        confirmed.value = "1";
      }}
    >
      <input type="hidden" name="id" value={applicationId} />
      {children}
    </form>
  );
}
