import { notFound } from "next/navigation";

import { PrintButton } from "@/components/ctd/print-button";
import { requireDirectorSession } from "@/lib/ctd/director-guard";
import { NONCASH_TREATMENT_LABELS } from "@/lib/ctd/portal-domain";
import { getSponsorship, getSponsorshipApproval, UUID_PATTERN } from "@/lib/ctd/portal-db";
import { formatCents } from "@/lib/ctd/portal-money";
import { formatSubmittedAt } from "@/lib/ctd/report";
import { OPERATOR_NAME } from "@/lib/ctd/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SponsorshipApprovalPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const director = await requireDirectorSession();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const request = await getSponsorship(id, director.id);
  const approval = await getSponsorshipApproval(id);
  if (!request || !approval) notFound();

  const treatment =
    NONCASH_TREATMENT_LABELS[
      approval.noncashTreatment as keyof typeof NONCASH_TREATMENT_LABELS
    ] ?? approval.noncashTreatment;

  return (
    <main className="ctd-main ctd-print">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <h1 className="ctd-section-title">Sponsorship approval record</h1>
        <p className="ctd-section-hint">{OPERATOR_NAME}</p>
        <dl className="ctd-totals">
          <div><dt>Reference</dt><dd>{approval.referenceNumber}</dd></div>
          <div><dt>Approved sponsor</dt><dd>{approval.sponsor}</dd></div>
          <div><dt>Associated event or market</dt><dd>{approval.eventOrMarket}</dd></div>
          <div><dt>Approved cash value</dt><dd>{formatCents(approval.cashCents)}</dd></div>
          <div><dt>War Tournaments cash share 25%</dt><dd>{formatCents(approval.cashWarCents)}</dd></div>
          <div><dt>Director cash share 75%</dt><dd>{formatCents(approval.cashDirectorCents)}</dd></div>
          <div><dt>Approved noncash value</dt><dd>{formatCents(approval.approvedNoncashCents)}</dd></div>
          <div><dt>War Tournaments noncash share 25%</dt><dd>{formatCents(approval.noncashWarCents)}</dd></div>
          <div><dt>Director noncash share 75%</dt><dd>{formatCents(approval.noncashDirectorCents)}</dd></div>
          <div><dt>Approved sponsor benefits</dt><dd>{approval.approvedBenefits || "—"}</dd></div>
          <div><dt>Approved sponsorship period</dt><dd>{approval.approvedPeriod || "—"}</dd></div>
          <div><dt>Approved category restrictions</dt><dd>{approval.categoryRestrictions || "—"}</dd></div>
          <div><dt>Treatment of War Tournaments’ 25% noncash share</dt><dd>{treatment || "—"}</dd></div>
          <div><dt>Conditions</dt><dd>{approval.conditions || "None"}</dd></div>
          <div><dt>Approval date</dt><dd>{formatSubmittedAt(approval.approvedAt)}</dd></div>
          <div><dt>Administrator</dt><dd>{approval.approvedBy}</dd></div>
        </dl>
        <PrintButton />
      </div>
    </main>
  );
}
