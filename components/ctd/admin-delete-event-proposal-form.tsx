"use client";

import { deleteEventProposalAction } from "@/app/tournament-director/admin/portal-actions";

export function AdminDeleteEventProposalForm({
  id,
  label,
  compact = false,
}: {
  id: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <form
      action={deleteEventProposalAction}
      className={compact ? "ctd-inlineform" : "ctd-deletepanel"}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Permanently delete ${label}? This cannot be undone.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {compact ? null : (
        <>
          <h2 className="ctd-deletepanel-title">Remove event plan</h2>
          <p className="ctd-deletepanel-hint">
            Use this to clear test drafts or abandoned plans. The record and its
            attachments are deleted and cannot be recovered.
          </p>
        </>
      )}
      <button className={compact ? "ctd-linkbutton" : "ctd-deletebutton"} type="submit">
        Delete
      </button>
    </form>
  );
}
