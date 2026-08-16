import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalEventForm } from "@/components/ctd/portal-event-form";
import { PortalNav } from "@/components/ctd/portal-nav";
import { requireDirectorSession } from "@/lib/ctd/director-guard";
import { directorDisplayName } from "@/lib/ctd/director-db";
import {
  directorCanEditEvent,
  directorCanWithdrawEvent,
  EVENT_STATUS_LABELS,
} from "@/lib/ctd/portal-domain";
import {
  getEventAuthorization,
  getEventProposal,
  listPortalFiles,
  listPortalMessages,
  UUID_PATTERN,
} from "@/lib/ctd/portal-db";
import { formatCents } from "@/lib/ctd/portal-money";
import { formatSubmittedAt } from "@/lib/ctd/report";

import { copyEventProposalAction, withdrawEventProposalAction } from "../../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  saved: "Draft saved. You can continue later.",
  submitted: "Proposal submitted. War Tournaments LLC will review it. This does not authorize the event.",
  withdrawn: "Proposal withdrawn.",
  copied: "A new draft was created from the previous proposal.",
};

export default async function DirectorEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const director = await requireDirectorSession();
  const { id } = await params;
  const { notice, error } = await searchParams;
  if (!UUID_PATTERN.test(id)) notFound();
  const proposal = await getEventProposal(id, director.id);
  if (!proposal) notFound();
  const [authorization, messages, files] = await Promise.all([
    getEventAuthorization(id),
    listPortalMessages("event", id),
    listPortalFiles("event", id),
  ]);
  const canEdit = directorCanEditEvent(proposal.currentStatus);

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <PortalNav director={director} />
        <Link className="ctd-back" href="/tournament-director/portal/events">
          ← Event proposals
        </Link>
        <div className="ctd-admin-head">
          <div>
            <h1 className="ctd-section-title">
              {proposal.eventName || "Untitled event proposal"}
            </h1>
            <p className="ctd-section-hint">
              Last updated {formatSubmittedAt(proposal.updatedAt)}
            </p>
          </div>
          <span className={`ctd-badge ctd-badge-${proposal.currentStatus}`}>
            {EVENT_STATUS_LABELS[proposal.currentStatus]}
          </span>
        </div>
        {notice && NOTICES[notice] ? (
          <div className="ctd-saved" role="status">
            {NOTICES[notice]}
          </div>
        ) : null}
        {error ? (
          <div className="ctd-alert" role="alert">
            {error}
          </div>
        ) : null}
        {proposal.currentStatus === "approved_authorization_pending" ? (
          <div className="ctd-alert" role="status">
            This proposal is approved pending written authorization. It does not
            allow you to market or operate the event.
          </div>
        ) : null}
        {authorization ? (
          <section className="ctd-reviewpanel">
            <h2 className="ctd-report-title">Written authorization</h2>
            <p>
              Reference {authorization.referenceNumber}. Authorized{" "}
              {formatSubmittedAt(authorization.authorizedAt)} by{" "}
              {authorization.authorizedBy}.
            </p>
            <p>Approved budget: {formatCents(authorization.budgetCents)}</p>
            <p>Expense per player: {formatCents(authorization.expensePerPlayerCents)}</p>
            {authorization.specialConditions ? (
              <p>Conditions: {authorization.specialConditions}</p>
            ) : null}
            <Link
              className="ctd-tablelink"
              href={`/tournament-director/portal/events/${id}/print`}
            >
              Print or download authorization
            </Link>
          </section>
        ) : null}
        {messages.length ? (
          <section className="ctd-reviewpanel">
            <h2 className="ctd-report-title">Messages from War Tournaments</h2>
            <ul className="ctd-notelist">
              {messages.map((item) => (
                <li key={item.id}>
                  <div className="ctd-subtle">{formatSubmittedAt(item.createdAt)}</div>
                  <p className="ctd-notebody">{item.message}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {files.length ? (
          <section className="ctd-reviewpanel">
            <h2 className="ctd-report-title">Supporting documents</h2>
            <ul className="ctd-notelist">
              {files.map((file) => (
                <li key={file.id}>
                  <a className="ctd-tablelink" href={`/tournament-director/portal/files/${file.id}`}>
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <PortalEventForm
          proposal={proposal}
          directorName={directorDisplayName(director)}
          canEdit={canEdit}
        />
        <div className="ctd-buttonrow">
          <form action={copyEventProposalAction}>
            <input type="hidden" name="id" value={proposal.id} />
            <button className="ctd-addbutton" type="submit">
              Copy into a new draft
            </button>
          </form>
          {directorCanWithdrawEvent(proposal.currentStatus) ? (
            <form action={withdrawEventProposalAction}>
              <input type="hidden" name="id" value={proposal.id} />
              <button className="ctd-deletebutton" type="submit">
                Withdraw proposal
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
