import type { Metadata } from "next";
import Link from "next/link";

import { AdminPortalNav } from "@/components/ctd/admin-portal-nav";
import { requireAdminSession } from "@/lib/ctd/admin-guard";
import { listDirectors } from "@/lib/ctd/director-db";
import { SPONSORSHIP_STATUS_LABELS, SPONSORSHIP_STATUSES } from "@/lib/ctd/portal-domain";
import { listAdminSponsorships } from "@/lib/ctd/portal-db";
import { formatSubmittedAt } from "@/lib/ctd/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sponsorships | CTD admin",
  robots: { index: false, follow: false },
};

export default async function AdminSponsorshipsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    directorId?: string;
    dateFrom?: string;
    dateTo?: string;
    market?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const filters = {
    search: params.search ?? "",
    status: params.status ?? "",
    directorId: params.directorId ?? "",
    dateFrom: params.dateFrom ?? "",
    dateTo: params.dateTo ?? "",
    market: params.market ?? "",
    sort: params.sort ?? "",
    page: Number(params.page || 1),
  };
  const [list, directors] = await Promise.all([
    listAdminSponsorships(filters),
    listDirectors(),
  ]);

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <AdminPortalNav />
        <h1 className="ctd-section-title">Sponsorship requests</h1>
        <p className="ctd-section-hint">
          {list.total} request{list.total === 1 ? "" : "s"}
        </p>
        <form className="ctd-filters ctd-filters-grid" method="get">
          <input className="ctd-input" type="search" name="search" placeholder="Search sponsor, market, or Director" defaultValue={filters.search} />
          <select className="ctd-select" name="status" defaultValue={filters.status}>
            <option value="">All statuses</option>
            {SPONSORSHIP_STATUSES.map((status) => (
              <option key={status} value={status}>{SPONSORSHIP_STATUS_LABELS[status]}</option>
            ))}
          </select>
          <select className="ctd-select" name="directorId" defaultValue={filters.directorId}>
            <option value="">All Directors</option>
            {directors.map((director) => (
              <option key={director.id} value={director.id}>
                {director.firstName} {director.lastName}
              </option>
            ))}
          </select>
          <input className="ctd-input" type="text" name="market" placeholder="Event or market" defaultValue={filters.market} />
          <input className="ctd-input" type="date" name="dateFrom" defaultValue={filters.dateFrom} aria-label="From date" />
          <input className="ctd-input" type="date" name="dateTo" defaultValue={filters.dateTo} aria-label="To date" />
          <select className="ctd-select" name="sort" defaultValue={filters.sort}>
            <option value="">Last activity</option>
            <option value="submitted">Submitted date</option>
            <option value="name">Sponsor name</option>
          </select>
          <button className="ctd-addbutton" type="submit">Filter</button>
        </form>
        {list.rows.length === 0 ? (
          <p className="ctd-empty">No sponsorship requests match these filters.</p>
        ) : (
          <div className="ctd-tablewrap">
            <table className="ctd-table">
              <thead>
                <tr>
                  <th>Sponsor</th>
                  <th>Director</th>
                  <th>Event / market</th>
                  <th>Submitted</th>
                  <th>Last activity</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.sponsorName}</strong>
                      {row.openAction ? <div><span className="ctd-flag ctd-flag-today">Open action</span></div> : null}
                    </td>
                    <td>
                      {row.directorName}
                      <div className="ctd-subtle">{row.directorEmail}</div>
                    </td>
                    <td>{row.eventName || row.territory || "—"}</td>
                    <td className="ctd-nowrap">{row.submittedAt ? formatSubmittedAt(row.submittedAt) : "—"}</td>
                    <td className="ctd-nowrap">{formatSubmittedAt(row.updatedAt)}</td>
                    <td>
                      <span className={`ctd-badge ctd-badge-${row.status}`}>
                        {SPONSORSHIP_STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td>
                      <Link className="ctd-tablelink" href={`/tournament-director/admin/sponsorships/${row.id}`}>
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
