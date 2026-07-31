"use client";

import { deleteApplicationAction } from "@/app/tournament-director/admin/actions";

export function AdminDeleteApplicationForm({
  id,
  applicantLabel,
}: {
  id: string;
  applicantLabel: string;
}) {
  return (
    <form
      action={deleteApplicationAction}
      className="ctd-deletepanel"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Permanently delete the application from ${applicantLabel}? This cannot be undone.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <h2 className="ctd-deletepanel-title">Remove application</h2>
      <p className="ctd-deletepanel-hint">
        Use this to clear test submissions or obvious spam. The record and its
        data are deleted from the database and cannot be recovered.
      </p>
      <button className="ctd-deletebutton" type="submit">
        Delete application
      </button>
    </form>
  );
}
