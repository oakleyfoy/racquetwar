import Link from "next/link";

import { PortalNav } from "@/components/ctd/portal-nav";
import { requireDirectorSession } from "@/lib/ctd/director-guard";
import { SPONSORSHIP_STATUS_LABELS } from "@/lib/ctd/portal-domain";
import { listSponsorships } from "@/lib/ctd/portal-db";
import { formatSubmittedAt } from "@/lib/ctd/report";

import { startSponsorshipAction } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DirectorSponsorshipsPage() {
  const director = await requireDirectorSession();
  const rows = await listSponsorships({ directorId: director.id });

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <PortalNav director={director} />
        <div className="ctd-admin-head">
          <div>
            <h1 className="ctd-section-title">Sponsorship requests</h1>
            <p className="ctd-section-hint">{rows.length} request{rows.length === 1 ? "" : "s"}</p>
          </div>
          <form action={startSponsorshipAction}>
            <button className="ctd-submit" type="submit">
              New request
            </button>
          </form>
        </div>
        {rows.length === 0 ? (
          <p className="ctd-empty">No sponsorship requests yet.</p>
        ) : (
          <ul className="ctd-activitylist">
            {rows.map((row) => (
              <li key={row.id}>
                <Link className="ctd-tablelink" href={`/tournament-director/portal/sponsorships/${row.id}`}>
                  {row.sponsorName || "Untitled request"}
                </Link>
                <div className="ctd-subtle">
                  <span className={`ctd-badge ctd-badge-${row.currentStatus}`}>
                    {SPONSORSHIP_STATUS_LABELS[row.currentStatus]}
                  </span>{" "}
                  Updated {formatSubmittedAt(row.updatedAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
