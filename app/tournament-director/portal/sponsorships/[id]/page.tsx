import Link from "next/link";
import { notFound } from "next/navigation";

import { PortalNav } from "@/components/ctd/portal-nav";
import { PortalSponsorshipForm } from "@/components/ctd/portal-sponsorship-form";
import { requireDirectorSession } from "@/lib/ctd/director-guard";
import { directorDisplayName } from "@/lib/ctd/director-db";
import {
  directorCanEditSponsorship,
  directorCanWithdrawSponsorship,
  SPONSORSHIP_STATUS_LABELS,
} from "@/lib/ctd/portal-domain";
import {
  getSponsorship,
  getSponsorshipApproval,
  listEventProposals,
  listPortalFiles,
  listPortalMessages,
  UUID_PATTERN,
} from "@/lib/ctd/portal-db";
import { formatCents } from "@/lib/ctd/portal-money";
import { formatSubmittedAt } from "@/lib/ctd/report";

import { withdrawSponsorshipAction } from "../../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  saved: "Draft saved. You can continue later.",
  submitted: "Sponsorship request submitted. This does not approve sponsor benefits or use of RW marks.",
  withdrawn: "Request withdrawn.",
};

export default async function DirectorSponsorshipDetailPage({
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
  const request = await getSponsorship(id, director.id);
  if (!request) notFound();
  const [approval, events, messages, files] = await Promise.all([
    getSponsorshipApproval(id),
    listEventProposals({ directorId: director.id }),
    listPortalMessages("sponsorship", id),
    listPortalFiles("sponsorship", id),
  ]);
  const canEdit = directorCanEditSponsorship(request.currentStatus);

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <PortalNav director={director} />
        <Link className="ctd-back" href="/tournament-director/portal/sponsorships">
          ← Sponsorship requests
        </Link>
        <div className="ctd-admin-head">
          <div>
            <h1 className="ctd-section-title">
              {request.sponsorName || "Untitled sponsorship request"}
            </h1>
            <p className="ctd-section-hint">
              Last updated {formatSubmittedAt(request.updatedAt)}
            </p>
          </div>
          <span className={`ctd-badge ctd-badge-${request.currentStatus}`}>
            {SPONSORSHIP_STATUS_LABELS[request.currentStatus]}
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
        {approval ? (
          <section className="ctd-reviewpanel">
            <h2 className="ctd-report-title">Approval record</h2>
            <p>Reference {approval.referenceNumber}</p>
            <p>Approved cash: {formatCents(approval.cashCents)}</p>
            <p>Approved noncash: {formatCents(approval.approvedNoncashCents)}</p>
            {approval.conditions ? <p>Conditions: {approval.conditions}</p> : null}
            <Link
              className="ctd-tablelink"
              href={`/tournament-director/portal/sponsorships/${id}/print`}
            >
              Print or download approval
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
        <PortalSponsorshipForm
          request={request}
          directorName={directorDisplayName(director)}
          events={events}
          canEdit={canEdit}
        />
        {directorCanWithdrawSponsorship(request.currentStatus) ? (
          <form action={withdrawSponsorshipAction}>
            <input type="hidden" name="id" value={request.id} />
            <button className="ctd-deletebutton" type="submit">
              Withdraw request
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
