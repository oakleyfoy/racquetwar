import type { Metadata } from "next";
import Link from "next/link";

import {
  countByStatus,
  listApplications,
  type ApplicationFilters,
} from "@/lib/ctd/applications";
import { isDatabaseConfigured } from "@/lib/ctd/db";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  formatTerritory,
} from "@/lib/ctd/fields";
import { formatSubmittedAt } from "@/lib/ctd/report";

import { logoutAction } from "./actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tournament Director applications | Racquet War",
  robots: { index: false, follow: false },
};

function buildExportHref(filters: ApplicationFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);

  const query = params.toString();
  return `/tournament-director/api/admin/export${query ? `?${query}` : ""}`;
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { status = "", search = "" } = await searchParams;
  const filters: ApplicationFilters = { status, search };

  if (!isDatabaseConfigured()) {
    return (
      <main className="ctd-main">
        <div className="ctd-card" style={{ padding: 32 }}>
          <div className="ctd-alert" role="alert">
            <strong>DATABASE_URL is not set.</strong> Add the Postgres connection
            string to this environment to review stored applications.
          </div>
        </div>
      </main>
    );
  }

  let applications;
  let counts: Record<string, number> = {};

  try {
    [applications, counts] = await Promise.all([
      listApplications(filters),
      countByStatus(),
    ]);
  } catch (error) {
    console.error("CTD admin list failed", error);
    return (
      <main className="ctd-main">
        <div className="ctd-card" style={{ padding: 32 }}>
          <div className="ctd-alert" role="alert">
            Could not reach the applications database. Check the Render Postgres
            instance and the DATABASE_URL value, then reload this page.
          </div>
        </div>
      </main>
    );
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <div className="ctd-admin-head">
          <div>
            <h1 className="ctd-section-title">Tournament Director applications</h1>
            <p className="ctd-section-hint">
              {total} total &middot; showing {applications.length}
            </p>
          </div>
          <div className="ctd-admin-actions">
            <a className="ctd-addbutton" href={buildExportHref(filters)}>
              Export CSV
            </a>
            <form action={logoutAction}>
              <button className="ctd-linkbutton" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="ctd-statusbar">
          {APPLICATION_STATUSES.map((value) => (
            <span key={value} className={`ctd-badge ctd-badge-${value}`}>
              {STATUS_LABELS[value]}: {counts[value] ?? 0}
            </span>
          ))}
        </div>

        <form className="ctd-filters" method="get">
          <input
            className="ctd-input"
            type="search"
            name="search"
            placeholder="Search name, email, city or territory"
            defaultValue={search}
          />
          <select className="ctd-select" name="status" defaultValue={status}>
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <button className="ctd-addbutton" type="submit">
            Filter
          </button>
          {status || search ? (
            <Link className="ctd-linkbutton" href="/tournament-director/admin">
              Clear
            </Link>
          ) : null}
        </form>

        {applications.length === 0 ? (
          <p className="ctd-empty">
            No applications match these filters yet.
          </p>
        ) : (
          <div className="ctd-tablewrap">
            <table className="ctd-table">
              <thead>
                <tr>
                  <th>Submitted</th>
                  <th>Applicant</th>
                  <th>Territory</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="ctd-nowrap">
                      {formatSubmittedAt(application.submittedAt)}
                    </td>
                    <td>
                      <strong>
                        {application.firstName} {application.lastName}
                      </strong>
                      <div className="ctd-subtle">{application.email}</div>
                      <div className="ctd-subtle">{application.mobilePhone}</div>
                    </td>
                    <td>{formatTerritory(application.primaryTerritory) || "—"}</td>
                    <td>{application.timeCommitment || "—"}</td>
                    <td>
                      <span className={`ctd-badge ctd-badge-${application.status}`}>
                        {STATUS_LABELS[application.status]}
                      </span>
                    </td>
                    <td className="ctd-nowrap">
                      <Link
                        className="ctd-tablelink"
                        href={`/tournament-director/admin/${application.id}`}
                      >
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
