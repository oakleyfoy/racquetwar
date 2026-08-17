"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import { sendBulkScreeningInvitationsAction } from "@/app/tournament-director/admin/actions";
import type { BulkScreeningInvitationBatchResult } from "@/lib/ctd/bulk-screening-invitations";
import {
  canReceiveScreeningInvitation,
  hasUsableApplicantEmail,
  screeningInvitationIneligibilityLabel,
  type WorkflowStatus,
} from "@/lib/ctd/workflow";

export type AdminBulkApplicantView = {
  id: string;
  name: string;
  email: string;
  phone: string;
  territory: string;
  submittedLabel: string;
  status: WorkflowStatus;
  statusLabel: string;
  nextAction: string;
  followUpLabel: string;
  overdue: boolean;
  dueToday: boolean;
  screeningScheduledLabel: string | null;
  invitationStamp: string | null;
};

function skipPreview(row: AdminBulkApplicantView) {
  if (!canReceiveScreeningInvitation(row.status)) {
    return screeningInvitationIneligibilityLabel(row.status);
  }
  if (!hasUsableApplicantEmail(row.email)) {
    return "Applicant record is missing a valid email address.";
  }
  return null;
}

function ScreeningCell({ row }: { row: AdminBulkApplicantView }) {
  if (row.screeningScheduledLabel) {
    return (
      <>
        <div>{row.screeningScheduledLabel}</div>
        {row.invitationStamp ? (
          <div className="ctd-subtle">{row.invitationStamp}</div>
        ) : null}
      </>
    );
  }

  return <>{row.invitationStamp || "—"}</>;
}

function FollowUpCell({ row }: { row: AdminBulkApplicantView }) {
  return (
    <div>
      <div>{row.followUpLabel}</div>
      {row.overdue ? <span className="ctd-flag ctd-flag-overdue">Overdue</span> : null}
      {row.dueToday ? <span className="ctd-flag ctd-flag-today">Due today</span> : null}
    </div>
  );
}

export function AdminApplicantBulkList({
  rows,
}: {
  rows: AdminBulkApplicantView[];
}) {
  const router = useRouter();
  const sendingRef = useRef(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<BulkScreeningInvitationBatchResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const selectedRows = useMemo(
    () => rows.filter((row) => selected.has(row.id)),
    [rows, selected],
  );
  const eligibleRows = selectedRows.filter((row) => !skipPreview(row));
  const skippedRows = selectedRows
    .map((row) => {
      const reason = skipPreview(row);
      return reason ? { row, reason } : null;
    })
    .filter((entry): entry is { row: AdminBulkApplicantView; reason: string } =>
      Boolean(entry),
    );

  const allVisibleSelected =
    rows.length > 0 && rows.every((row) => selected.has(row.id));
  const someVisibleSelected = rows.some((row) => selected.has(row.id));

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const row of rows) {
        if (checked) next.add(row.id);
        else next.delete(row.id);
      }
      return next;
    });
  }

  function closeConfirm() {
    if (isPending || sendingRef.current) return;
    setConfirmOpen(false);
  }

  function confirmSend() {
    if (sendingRef.current || isPending || eligibleRows.length === 0) return;
    sendingRef.current = true;
    startTransition(async () => {
      try {
        const batch = await sendBulkScreeningInvitationsAction(
          selectedRows.map((row) => row.id),
        );
        setResult(batch);
        setConfirmOpen(false);
        const retryIds = new Set(
          batch.items
            .filter((item) => item.outcome === "failed")
            .map((item) => item.applicationId),
        );
        setSelected(retryIds);
        router.refresh();
      } finally {
        sendingRef.current = false;
      }
    });
  }

  const failedItems = result?.items.filter((item) => item.outcome === "failed") ?? [];

  return (
    <>
      {result ? (
        <div
          className={result.failedCount || result.alreadyProcessing ? "ctd-alert" : "ctd-saved"}
          role="status"
        >
          {result.alreadyProcessing ? (
            <strong>This send is already in progress.</strong>
          ) : (
            <>
              <strong>Screening Invitations Complete</strong>
              <div>{result.sentCount} sent successfully</div>
              {result.skippedCount ? (
                <div>{result.skippedCount} not sent</div>
              ) : null}
              {result.failedCount ? <div>{result.failedCount} failed</div> : null}
              {failedItems.length ? (
                <ul className="ctd-bulk-resultlist">
                  {failedItems.map((item) => (
                    <li key={item.applicationId}>
                      {item.name} — {item.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {selected.size > 0 ? (
        <div className="ctd-bulkbar" role="region" aria-label="Bulk applicant actions">
          <strong>
            {selected.size} applicant{selected.size === 1 ? "" : "s"} selected
          </strong>
          <button
            className="ctd-addbutton"
            type="button"
            onClick={() => setConfirmOpen(true)}
          >
            Send / Resend Screening Invitation
          </button>
          <button
            className="ctd-linkbutton"
            type="button"
            onClick={() => setSelected(new Set())}
          >
            Clear selection
          </button>
        </div>
      ) : null}

      <div className="ctd-tablewrap ctd-desktop-table">
        <table className="ctd-table">
          <thead>
            <tr>
              <th className="ctd-selectcol">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(node) => {
                    if (node) {
                      node.indeterminate = someVisibleSelected && !allVisibleSelected;
                    }
                  }}
                  onChange={(event) => toggleAllVisible(event.target.checked)}
                  aria-label="Select all visible"
                  title="Select all visible"
                />
              </th>
              <th>Applicant</th>
              <th>Territory</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Next action</th>
              <th>Follow-up</th>
              <th>Screening</th>
              <th className="ctd-reviewcol">Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="ctd-selectcol">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={(event) => toggleOne(row.id, event.target.checked)}
                    aria-label={`Select ${row.name}`}
                  />
                </td>
                <td>
                  <Link
                    className="ctd-tablelink"
                    href={`/tournament-director/admin/${row.id}`}
                  >
                    <strong>{row.name}</strong>
                  </Link>
                  <div className="ctd-subtle">{row.email}</div>
                  <div className="ctd-subtle">{row.phone}</div>
                </td>
                <td>{row.territory}</td>
                <td className="ctd-nowrap">{row.submittedLabel}</td>
                <td>
                  <span className={`ctd-badge ctd-badge-${row.status}`}>
                    {row.statusLabel}
                  </span>
                </td>
                <td>{row.nextAction}</td>
                <td>
                  <FollowUpCell row={row} />
                </td>
                <td>
                  <ScreeningCell row={row} />
                </td>
                <td className="ctd-nowrap ctd-reviewcol">
                  <Link
                    className="ctd-tablelink"
                    href={`/tournament-director/admin/${row.id}`}
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ctd-trackercards">
        {rows.map((row) => (
          <article className="ctd-trackercard" key={row.id}>
            <div className="ctd-admin-head" style={{ paddingTop: 0 }}>
              <div className="ctd-cardselect">
                <input
                  type="checkbox"
                  checked={selected.has(row.id)}
                  onChange={(event) => toggleOne(row.id, event.target.checked)}
                  aria-label={`Select ${row.name}`}
                />
                <span>
                  <Link
                    className="ctd-tablelink"
                    href={`/tournament-director/admin/${row.id}`}
                  >
                    <strong>{row.name}</strong>
                  </Link>
                  <div className="ctd-subtle">{row.email}</div>
                  <div className="ctd-subtle">{row.phone}</div>
                </span>
              </div>
              <span className={`ctd-badge ctd-badge-${row.status}`}>
                {row.statusLabel}
              </span>
            </div>
            <p className="ctd-subtle">Territory: {row.territory}</p>
            <p className="ctd-subtle">Submitted: {row.submittedLabel}</p>
            <p className="ctd-subtle">Next action: {row.nextAction}</p>
            <FollowUpCell row={row} />
            {row.screeningScheduledLabel || row.invitationStamp ? (
              <p className="ctd-subtle">
                Screening:{" "}
                {row.screeningScheduledLabel || row.invitationStamp}
                {row.screeningScheduledLabel && row.invitationStamp
                  ? ` · ${row.invitationStamp}`
                  : null}
              </p>
            ) : null}
            <Link
              className="ctd-tablelink"
              href={`/tournament-director/admin/${row.id}`}
            >
              Review complete application
            </Link>
          </article>
        ))}
      </div>

      {confirmOpen ? (
        <div
          className="ctd-modal-backdrop"
          role="presentation"
          onClick={closeConfirm}
        >
          <div
            className="ctd-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ctd-bulk-invite-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="ctd-section-title" id="ctd-bulk-invite-title">
              Send Screening Invitation
            </h2>
            <p>
              You are about to send the RW Certified Tournament Director
              Screening Call invitation to {eligibleRows.length} applicant
              {eligibleRows.length === 1 ? "" : "s"}.
            </p>
            <p className="ctd-subtle">
              This will send an email to each selected applicant using the
              current screening invitation template and scheduling link.
            </p>
            <p>
              {selectedRows.length} applicant{selectedRows.length === 1 ? "" : "s"}{" "}
              selected
              <br />
              {eligibleRows.length} eligible
              {skippedRows.length ? (
                <>
                  <br />
                  {skippedRows.length} will not be sent
                </>
              ) : null}
            </p>
            {skippedRows.length ? (
              <ul className="ctd-bulk-resultlist">
                {skippedRows.map(({ row, reason }) => (
                  <li key={row.id}>
                    {row.name} — {reason}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="ctd-modal-actions">
              <button
                className="ctd-linkbutton"
                type="button"
                onClick={closeConfirm}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                className="ctd-submit"
                type="button"
                onClick={confirmSend}
                disabled={isPending || eligibleRows.length === 0}
              >
                {isPending
                  ? "Sending..."
                  : `Send ${eligibleRows.length} invitation${eligibleRows.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
