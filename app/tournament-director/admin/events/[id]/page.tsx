import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPortalNav } from "@/components/ctd/admin-portal-nav";
import { requireAdminSession } from "@/lib/ctd/admin-guard";
import { getDirector } from "@/lib/ctd/director-db";
import {
  EVENT_ACKNOWLEDGMENTS,
  EVENT_SPORT_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_STATUSES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/ctd/portal-domain";
import {
  getEventAuthorization,
  getEventProposal,
  listEventVersions,
  listPortalActivities,
  listPortalFiles,
  listPortalMessages,
  listPortalNotes,
  UUID_PATTERN,
} from "@/lib/ctd/portal-db";
import { formatCents } from "@/lib/ctd/portal-money";
import { formatSubmittedAt } from "@/lib/ctd/report";

import {
  addPortalMessageAction,
  addPortalNoteAction,
  adminEventStatusAction,
  authorizeEventAction,
} from "../../portal-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review event proposal | CTD admin",
  robots: { index: false, follow: false },
};

export default async function AdminEventWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const { notice, error } = await searchParams;
  if (!UUID_PATTERN.test(id)) notFound();
  const proposal = await getEventProposal(id);
  if (!proposal) notFound();
  const director = await getDirector(proposal.directorId);
  const [authorization, notes, messages, activities, files, versions] = await Promise.all([
    getEventAuthorization(id),
    listPortalNotes("event", id),
    listPortalMessages("event", id),
    listPortalActivities("event", id),
    listPortalFiles("event", id),
    listEventVersions(id),
  ]);

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <AdminPortalNav />
        <Link className="ctd-back" href="/tournament-director/admin/events">
          ← Event proposals
        </Link>
        <div className="ctd-admin-head">
          <div>
            <h1 className="ctd-section-title">{proposal.eventName || "Untitled proposal"}</h1>
            <p className="ctd-section-hint">
              {director ? `${director.firstName} ${director.lastName} · ${director.email}` : proposal.directorId}
            </p>
          </div>
          <span className={`ctd-badge ctd-badge-${proposal.currentStatus}`}>
            {EVENT_STATUS_LABELS[proposal.currentStatus]}
          </span>
        </div>
        {notice ? <div className="ctd-saved" role="status">Saved.</div> : null}
        {error ? <div className="ctd-alert" role="alert">{error}</div> : null}
        {proposal.totals.overBaseline ? (
          <div className="ctd-alert" role="status">
            Over the $65 per projected player baseline. Director explanation:{" "}
            {proposal.overBudgetExplanation || "None provided."}
          </div>
        ) : null}

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Proposal</h2>
          <dl className="ctd-totals">
            <div><dt>Sport</dt><dd>{EVENT_SPORT_LABELS[proposal.sport as keyof typeof EVENT_SPORT_LABELS] || proposal.sport} {proposal.sportOther}</dd></div>
            <div><dt>Location</dt><dd>{[proposal.address, proposal.city, proposal.state, proposal.postalCode, proposal.country].filter(Boolean).join(", ")}</dd></div>
            <div><dt>Facility</dt><dd>{proposal.facilityName || "—"}</dd></div>
            <div><dt>Facility contact</dt><dd>{[proposal.facilityContactName, proposal.facilityContactEmail, proposal.facilityContactPhone].filter(Boolean).join(" · ") || "—"}</dd></div>
            <div><dt>Primary dates</dt><dd>{[proposal.primaryStartDate, proposal.primaryEndDate].filter(Boolean).join(" to ") || "—"}</dd></div>
            <div><dt>Alternate dates</dt><dd>{[proposal.alternateStartDate, proposal.alternateEndDate].filter(Boolean).join(" to ") || "—"}</dd></div>
            <div><dt>Courts</dt><dd>{proposal.courtCount || "—"} {proposal.courtSetting}</dd></div>
            <div><dt>Format</dt><dd>{proposal.eventFormat || "—"}</dd></div>
            <div><dt>Divisions</dt><dd>{proposal.divisions || "—"}</dd></div>
            <div><dt>Market opportunity</dt><dd>{proposal.marketOpportunity || "—"}</dd></div>
            <div><dt>Local relationships</dt><dd>{proposal.localRelationships || "—"}</dd></div>
            <div><dt>Competing events</dt><dd>{proposal.competingEvents || "—"}</dd></div>
            <div><dt>Facility terms</dt><dd>{proposal.facilityTerms || "—"}</dd></div>
            <div><dt>Notes</dt><dd>{proposal.additionalNotes || "—"}</dd></div>
          </dl>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Budget</h2>
          <ul className="ctd-notelist">
            {proposal.items.map((item, index) => (
              <li key={index}>
                <strong>{EXPENSE_CATEGORY_LABELS[item.category as keyof typeof EXPENSE_CATEGORY_LABELS] || item.category}</strong>
                <div className="ctd-subtle">{item.vendor} · {item.description} · {item.quantity} × {item.unitCost} ({item.costType})</div>
                {item.explanation ? <p className="ctd-notebody">{item.explanation}</p> : null}
              </li>
            ))}
          </ul>
          <dl className="ctd-totals">
            <div><dt>Estimated players</dt><dd>{proposal.totals.estimatedPlayers}</dd></div>
            <div><dt>Recommended entry fee</dt><dd>{formatCents(proposal.totals.recommendedEntryFeeCents)}</dd></div>
            <div><dt>Estimated gross</dt><dd>{formatCents(proposal.totals.estimatedGrossCents)}</dd></div>
            <div><dt>RW fee ($35 / eligible player)</dt><dd>{formatCents(proposal.totals.rwFeeCents)}</dd></div>
            <div><dt>Total expenses</dt><dd>{formatCents(proposal.totals.totalExpensesCents)}</dd></div>
            <div><dt>Expense per player</dt><dd>{formatCents(proposal.totals.expensePerPlayerCents)}</dd></div>
            <div><dt>Estimated remaining / Director compensation</dt><dd>{formatCents(proposal.totals.estimatedDirectorCompensationCents)}</dd></div>
          </dl>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Acknowledgments</h2>
          <ul className="ctd-notelist">
            {EVENT_ACKNOWLEDGMENTS.map((item) => (
              <li key={item.name}>
                {proposal.acknowledgments[item.name] ? "Acknowledged" : "Not acknowledged"} — {item.label}
              </li>
            ))}
          </ul>
        </section>

        {files.length ? (
          <section className="ctd-reviewpanel">
            <h2 className="ctd-report-title">Supporting documents</h2>
            <ul className="ctd-notelist">
              {files.map((file) => (
                <li key={file.id}>
                  <a className="ctd-tablelink" href={`/tournament-director/admin/files/${file.id}`}>{file.name}</a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Status</h2>
          <form action={adminEventStatusAction}>
            <input type="hidden" name="id" value={id} />
            <select className="ctd-select" name="status" defaultValue={proposal.currentStatus}>
              {EVENT_STATUSES.filter((status) => status !== "authorized" && status !== "draft").map((status) => (
                <option key={status} value={status}>{EVENT_STATUS_LABELS[status]}</option>
              ))}
            </select>
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="directorMessage">Director-visible message</label>
              <textarea id="directorMessage" name="directorMessage" className="ctd-textarea" />
            </div>
            <button className="ctd-addbutton" type="submit">Update status</button>
          </form>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Authorization</h2>
          <p className="ctd-section-hint">
            Only Authorized creates written event authorization. Approved — Authorization
            Pending does not permit marketing or operation.
          </p>
          {authorization ? (
            <>
              <p>Reference {authorization.referenceNumber}</p>
              <p>Authorized {formatSubmittedAt(authorization.authorizedAt)} by {authorization.authorizedBy}</p>
              <Link className="ctd-tablelink" href={`/tournament-director/admin/events/${id}/print`}>
                Print authorization record
              </Link>
            </>
          ) : null}
          <form action={authorizeEventAction}>
            <input type="hidden" name="id" value={id} />
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="specialConditions">Special conditions</label>
              <textarea id="specialConditions" name="specialConditions" className="ctd-textarea" defaultValue={authorization?.specialConditions} />
            </div>
            <button className="ctd-submit" type="submit">
              {authorization ? "Amend authorization" : "Authorize event"}
            </button>
          </form>
        </section>

        <section className="ctd-reviewpanel">
          <span className="ctd-internal-label">Internal — not visible to the Director</span>
          <h2 className="ctd-report-title">Internal notes</h2>
          <form action={addPortalNoteAction}>
            <input type="hidden" name="entityType" value="event" />
            <input type="hidden" name="entityId" value={id} />
            <textarea name="note" className="ctd-textarea" />
            <button className="ctd-addbutton" type="submit">Add internal note</button>
          </form>
          <ul className="ctd-notelist">
            {notes.map((note) => (
              <li key={note.id}>
                <div className="ctd-subtle">{formatSubmittedAt(note.createdAt)} · {note.createdBy}</div>
                <p className="ctd-notebody">{note.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Director-visible messages</h2>
          <form action={addPortalMessageAction}>
            <input type="hidden" name="entityType" value="event" />
            <input type="hidden" name="entityId" value={id} />
            <input type="hidden" name="directorId" value={proposal.directorId} />
            <textarea name="message" className="ctd-textarea" />
            <button className="ctd-addbutton" type="submit">Send message</button>
          </form>
          <ul className="ctd-notelist">
            {messages.map((item) => (
              <li key={item.id}>
                <div className="ctd-subtle">{formatSubmittedAt(item.createdAt)}</div>
                <p className="ctd-notebody">{item.message}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Submission versions</h2>
          <ul className="ctd-activitylist">
            {versions.map((version) => (
              <li key={version.version}>Version {version.version} · {formatSubmittedAt(version.createdAt)}</li>
            ))}
          </ul>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Activity</h2>
          <ul className="ctd-activitylist">
            {activities.map((item) => (
              <li key={item.id}>
                {formatSubmittedAt(item.createdAt)} · {item.activityType}
                {item.previousValue || item.newValue ? ` · ${item.previousValue ?? "—"} → ${item.newValue ?? "—"}` : ""}
                <div className="ctd-subtle">{item.description}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
