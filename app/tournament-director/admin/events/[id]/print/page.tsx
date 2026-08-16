import { notFound } from "next/navigation";

import { PrintButton } from "@/components/ctd/print-button";
import { requireAdminSession } from "@/lib/ctd/admin-guard";
import { getEventAuthorization, getEventProposal, UUID_PATTERN } from "@/lib/ctd/portal-db";
import { formatCents } from "@/lib/ctd/portal-money";
import { formatSubmittedAt } from "@/lib/ctd/report";
import { OPERATOR_NAME } from "@/lib/ctd/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminEventPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const proposal = await getEventProposal(id);
  const authorization = await getEventAuthorization(id);
  if (!proposal || !authorization) notFound();

  return (
    <main className="ctd-main ctd-print">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <h1 className="ctd-section-title">Event authorization record</h1>
        <p className="ctd-section-hint">{OPERATOR_NAME}</p>
        <dl className="ctd-totals">
          <div><dt>Reference</dt><dd>{authorization.referenceNumber}</dd></div>
          <div><dt>Authorized event name</dt><dd>{authorization.eventName}</dd></div>
          <div><dt>Facility</dt><dd>{authorization.facility}</dd></div>
          <div><dt>Approved dates</dt><dd>{authorization.dates}</dd></div>
          <div><dt>Approved sport and format</dt><dd>{authorization.sportFormat}</dd></div>
          <div><dt>Approved budget amount</dt><dd>{formatCents(authorization.budgetCents)}</dd></div>
          <div><dt>Approved expense per player</dt><dd>{formatCents(authorization.expensePerPlayerCents)}</dd></div>
          <div><dt>Special conditions</dt><dd>{authorization.specialConditions || "None"}</dd></div>
          <div><dt>Authorization date</dt><dd>{formatSubmittedAt(authorization.authorizedAt)}</dd></div>
          <div><dt>Administrator</dt><dd>{authorization.authorizedBy}</dd></div>
        </dl>
        <PrintButton />
      </div>
    </main>
  );
}
