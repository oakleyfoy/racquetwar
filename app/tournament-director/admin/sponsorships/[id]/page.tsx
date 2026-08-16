import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPortalNav } from "@/components/ctd/admin-portal-nav";
import { requireAdminSession } from "@/lib/ctd/admin-guard";
import { getDirector } from "@/lib/ctd/director-db";
import {
  NONCASH_TREATMENT_LABELS,
  NONCASH_TREATMENTS,
  SPONSOR_BENEFIT_LABELS,
  SPONSORSHIP_ACKNOWLEDGMENTS,
  SPONSORSHIP_STATUS_LABELS,
  SPONSORSHIP_STATUSES,
} from "@/lib/ctd/portal-domain";
import {
  getEventProposal,
  getSponsorship,
  getSponsorshipApproval,
  listPortalActivities,
  listPortalFiles,
  listPortalMessages,
  listPortalNotes,
  UUID_PATTERN,
} from "@/lib/ctd/portal-db";
import { calculateSponsorshipSplit, formatCents, parseCents } from "@/lib/ctd/portal-money";
import { formatSubmittedAt } from "@/lib/ctd/report";

import {
  addPortalMessageAction,
  addPortalNoteAction,
  adminSponsorshipStatusAction,
  approveSponsorshipAction,
} from "../../portal-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review sponsorship | CTD admin",
  robots: { index: false, follow: false },
};

export default async function AdminSponsorshipWorkspacePage({
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
  const request = await getSponsorship(id);
  if (!request) notFound();
  const director = await getDirector(request.directorId);
  const linkedEvent = request.eventProposalId
    ? await getEventProposal(request.eventProposalId)
    : null;
  const [approval, notes, messages, activities, files] = await Promise.all([
    getSponsorshipApproval(id),
    listPortalNotes("sponsorship", id),
    listPortalMessages("sponsorship", id),
    listPortalActivities("sponsorship", id),
    listPortalFiles("sponsorship", id),
  ]);
  const requestedSplit = calculateSponsorshipSplit(
    request.cashAmount ? parseCents(request.cashAmount) : 0,
    0,
  );

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <AdminPortalNav />
        <Link className="ctd-back" href="/tournament-director/admin/sponsorships">
          ← Sponsorship requests
        </Link>
        <div className="ctd-admin-head">
          <div>
            <h1 className="ctd-section-title">{request.sponsorName || "Untitled request"}</h1>
            <p className="ctd-section-hint">
              {director ? `${director.firstName} ${director.lastName} · ${director.email}` : request.directorId}
            </p>
          </div>
          <span className={`ctd-badge ctd-badge-${request.currentStatus}`}>
            {SPONSORSHIP_STATUS_LABELS[request.currentStatus]}
          </span>
        </div>
        {notice ? <div className="ctd-saved" role="status">Saved.</div> : null}
        {error ? <div className="ctd-alert" role="alert">{error}</div> : null}

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Sponsor details</h2>
          <dl className="ctd-totals">
            <div><dt>Contact</dt><dd>{[request.sponsorContactName, request.sponsorEmail, request.sponsorPhone].filter(Boolean).join(" · ") || "—"}</dd></div>
            <div><dt>Website</dt><dd>{request.sponsorWebsite || "—"}</dd></div>
            <div><dt>Category</dt><dd>{request.businessCategory || "—"}</dd></div>
            <div><dt>Associated event</dt><dd>{linkedEvent?.eventName || "General market sponsorship"}</dd></div>
            <div><dt>Territory or market</dt><dd>{request.territory || "—"}</dd></div>
            <div><dt>Stage</dt><dd>{request.stage || "—"}</dd></div>
            <div><dt>Period</dt><dd>{[request.startDate, request.endDate].filter(Boolean).join(" to ") || "—"}</dd></div>
            <div><dt>Requested cash</dt><dd>{request.cashAmount || "0.00"}</dd></div>
            <div><dt>Requested noncash</dt><dd>{request.includesNoncash ? `${request.requestedNoncashValue} — ${request.noncashDescription}` : "None"}</dd></div>
            <div><dt>Value explanation</dt><dd>{request.valueExplanation || "—"}</dd></div>
            <div><dt>Notes</dt><dd>{request.additionalNotes || "—"}</dd></div>
          </dl>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Requested benefits</h2>
          <ul className="ctd-notelist">
            {request.benefits.filter((item) => item.selected).map((item) => (
              <li key={item.id}>
                {SPONSOR_BENEFIT_LABELS[item.id as keyof typeof SPONSOR_BENEFIT_LABELS] || item.id}
                {item.explanation ? <p className="ctd-notebody">{item.explanation}</p> : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">25% / 75% calculations</h2>
          <dl className="ctd-totals">
            <div><dt>Cash — War Tournaments 25%</dt><dd>{formatCents(requestedSplit.cashWarCents)}</dd></div>
            <div><dt>Cash — Director 75%</dt><dd>{formatCents(requestedSplit.cashDirectorCents)}</dd></div>
            <div><dt>Approved noncash</dt><dd>{approval ? formatCents(approval.approvedNoncashCents) : "Not yet approved"}</dd></div>
          </dl>
          <p className="ctd-notice">
            Donated products, goods or services may not be counted both as sponsorship
            value and as a purchased event expense.
          </p>
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
          <h2 className="ctd-report-title">Acknowledgments</h2>
          <ul className="ctd-notelist">
            {SPONSORSHIP_ACKNOWLEDGMENTS.map((item) => (
              <li key={item.name}>
                {request.acknowledgments[item.name] ? "Acknowledged" : "Not acknowledged"} — {item.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="ctd-reviewpanel">
          <h2 className="ctd-report-title">Status</h2>
          <form action={adminSponsorshipStatusAction}>
            <input type="hidden" name="id" value={id} />
            <select className="ctd-select" name="status" defaultValue={request.currentStatus}>
              {SPONSORSHIP_STATUSES.filter((status) => status !== "approved" && status !== "approved_with_conditions" && status !== "draft").map((status) => (
                <option key={status} value={status}>{SPONSORSHIP_STATUS_LABELS[status]}</option>
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
          <h2 className="ctd-report-title">Approval</h2>
          {approval ? (
            <>
              <p>Reference {approval.referenceNumber}</p>
              <p>Approved cash {formatCents(approval.cashCents)} · noncash {formatCents(approval.approvedNoncashCents)}</p>
              <Link className="ctd-tablelink" href={`/tournament-director/admin/sponsorships/${id}/print`}>
                Print approval record
              </Link>
            </>
          ) : null}
          <form action={approveSponsorshipAction}>
            <input type="hidden" name="id" value={id} />
            <div className="ctd-workflow-grid">
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="approvedCash">Approved cash value</label>
                <input id="approvedCash" name="approvedCash" className="ctd-input" defaultValue={approval ? (approval.cashCents / 100).toFixed(2) : request.cashAmount} />
              </div>
              <div className="ctd-field">
                <label className="ctd-label" htmlFor="approvedNoncash">Approved noncash value</label>
                <input id="approvedNoncash" name="approvedNoncash" className="ctd-input" defaultValue={approval ? (approval.approvedNoncashCents / 100).toFixed(2) : "0.00"} />
              </div>
            </div>
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="approvedBenefits">Approved sponsor benefits</label>
              <textarea id="approvedBenefits" name="approvedBenefits" className="ctd-textarea" defaultValue={approval?.approvedBenefits} />
            </div>
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="approvedPeriod">Approved sponsorship period</label>
              <input id="approvedPeriod" name="approvedPeriod" className="ctd-input" defaultValue={approval?.approvedPeriod || [request.startDate, request.endDate].filter(Boolean).join(" to ")} />
            </div>
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="categoryRestrictions">Approved category restrictions</label>
              <textarea id="categoryRestrictions" name="categoryRestrictions" className="ctd-textarea" defaultValue={approval?.categoryRestrictions} />
            </div>
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="noncashTreatment">Treatment of War Tournaments’ 25% noncash share</label>
              <select id="noncashTreatment" name="noncashTreatment" className="ctd-select" defaultValue={approval?.noncashTreatment}>
                <option value="">Select if noncash is approved</option>
                {NONCASH_TREATMENTS.map((value) => (
                  <option key={value} value={value}>{NONCASH_TREATMENT_LABELS[value]}</option>
                ))}
              </select>
            </div>
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="conditions">Conditions</label>
              <textarea id="conditions" name="conditions" className="ctd-textarea" defaultValue={approval?.conditions} />
            </div>
            <label className="ctd-check">
              <input type="checkbox" name="withConditions" value="1" defaultChecked={request.currentStatus === "approved_with_conditions"} />
              <span>Approve with conditions</span>
            </label>
            <button className="ctd-submit" type="submit">
              {approval ? "Amend approval" : "Approve sponsorship"}
            </button>
          </form>
        </section>

        <section className="ctd-reviewpanel">
          <span className="ctd-internal-label">Internal — not visible to the Director</span>
          <h2 className="ctd-report-title">Internal notes</h2>
          <form action={addPortalNoteAction}>
            <input type="hidden" name="entityType" value="sponsorship" />
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
            <input type="hidden" name="entityType" value="sponsorship" />
            <input type="hidden" name="entityId" value={id} />
            <input type="hidden" name="directorId" value={request.directorId} />
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
          <h2 className="ctd-report-title">Activity</h2>
          <ul className="ctd-activitylist">
            {activities.map((item) => (
              <li key={item.id}>
                {formatSubmittedAt(item.createdAt)} · {item.activityType}
                <div className="ctd-subtle">{item.description}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
