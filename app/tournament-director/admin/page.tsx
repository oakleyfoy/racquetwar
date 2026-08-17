import type { Metadata } from "next";
import Link from "next/link";

import { isDatabaseConfigured } from "@/lib/ctd/db";
import { formatTerritory } from "@/lib/ctd/fields";
import { formatSubmittedAt } from "@/lib/ctd/report";
import {
  getTrackerSummary,
  listTrackerApplications,
  listTrackerFilterOptions,
  type TrackerFilters,
} from "@/lib/ctd/workflow-db";
import {
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUSES,
} from "@/lib/ctd/workflow";
import {
  formatInstantInTimeZone,
  formatScreeningInvitationStamp,
} from "@/lib/ctd/workflow-time";

import { AdminApplicantBulkList } from "@/components/ctd/admin-applicant-bulk-list";
import { AdminPortalNav } from "@/components/ctd/admin-portal-nav";
import { getPortalDashboardCounts } from "@/lib/ctd/portal-db";

import { logoutAction } from "./actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CTD recruiting tracker | Racquet War",
  robots: { index: false, follow: false },
};

function buildFilterHref(filters: TrackerFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.state) params.set("state", filters.state);
  if (filters.territory) params.set("territory", filters.territory);
  if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
  if (filters.followUpDue) params.set("followUpDue", filters.followUpDue);
  if (filters.screeningDate) params.set("screeningDate", filters.screeningDate);
  if (filters.search) params.set("search", filters.search);
  const query = params.toString();
  return `/tournament-director/admin${query ? `?${query}` : ""}`;
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
    state?: string;
    territory?: string;
    assignedTo?: string;
    followUpDue?: string;
    screeningDate?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const filters: TrackerFilters = {
    status: params.status ?? "",
    search: params.search ?? "",
    state: params.state ?? "",
    territory: params.territory ?? "",
    assignedTo: params.assignedTo ?? "",
    followUpDue: params.followUpDue ?? "",
    screeningDate: params.screeningDate ?? "",
  };

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

  let rows;
  let summary;
  let options;
  let portalCounts = {
    eventsAwaitingReview: 0,
    eventsNeedsInformation: 0,
    eventsAuthorized: 0,
    sponsorshipsAwaitingReview: 0,
    sponsorshipsNeedsInformation: 0,
    sponsorshipsApproved: 0,
  };

  try {
    [rows, summary, options] = await Promise.all([
      listTrackerApplications(filters),
      getTrackerSummary(),
      listTrackerFilterOptions(),
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

  try {
    portalCounts = await getPortalDashboardCounts();
  } catch (error) {
    console.error("CTD portal dashboard counts failed", error);
  }

  const counts = [
    ["Total", summary.total, {}],
    ["New", summary.new, { status: "new" }],
    ["Needs Review", summary.needsReview, { status: "under_review" }],
    ["Screening", summary.screening, {}],
    ["Advanced", summary.advanced, { status: "advanced" }],
    ["On Hold", summary.onHold, { status: "on_hold" }],
    ["Selected", summary.selected, { status: "selected" }],
    ["Declined/Withdrawn", summary.declinedWithdrawn, {}],
    ["Follow-ups Due", summary.followUpsDue, { followUpDue: "any_open" }],
  ] as const;

  const hasFilters = Boolean(
    filters.status ||
      filters.search ||
      filters.state ||
      filters.territory ||
      filters.assignedTo ||
      filters.followUpDue ||
      filters.screeningDate,
  );

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <AdminPortalNav />
        <div className="ctd-admin-head">
          <div>
            <h1 className="ctd-section-title">CTD recruiting tracker</h1>
            <p className="ctd-section-hint">
              {summary.total} applicants &middot; showing {rows.length}
            </p>
          </div>
          <div className="ctd-admin-actions">
            <a
              className="ctd-addbutton"
              href="/tournament-director/api/admin/export"
            >
              Export CSV
            </a>
            <form action={logoutAction}>
              <button className="ctd-linkbutton" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {params.deleted ? (
          <div className="ctd-saved" role="status">
            Application deleted.
          </div>
        ) : null}

        {params.error === "notfound" ? (
          <div className="ctd-alert" role="alert">
            That application was not found. It may have been deleted already.
          </div>
        ) : null}

        <div className="ctd-summarygrid">
          <Link className="ctd-summarytile" href="/tournament-director/admin/events?status=submitted">
            <strong>{portalCounts.eventsAwaitingReview}</strong>
            <span>Event proposals awaiting review</span>
          </Link>
          <Link className="ctd-summarytile" href="/tournament-director/admin/events?status=needs_information">
            <strong>{portalCounts.eventsNeedsInformation}</strong>
            <span>Event proposals needing information</span>
          </Link>
          <Link className="ctd-summarytile" href="/tournament-director/admin/events?status=authorized">
            <strong>{portalCounts.eventsAuthorized}</strong>
            <span>Authorized upcoming events</span>
          </Link>
          <Link className="ctd-summarytile" href="/tournament-director/admin/sponsorships?status=submitted">
            <strong>{portalCounts.sponsorshipsAwaitingReview}</strong>
            <span>Sponsorships awaiting review</span>
          </Link>
          <Link className="ctd-summarytile" href="/tournament-director/admin/sponsorships?status=needs_information">
            <strong>{portalCounts.sponsorshipsNeedsInformation}</strong>
            <span>Sponsorships needing information</span>
          </Link>
          <Link className="ctd-summarytile" href="/tournament-director/admin/sponsorships?status=approved">
            <strong>{portalCounts.sponsorshipsApproved}</strong>
            <span>Approved active sponsorships</span>
          </Link>
        </div>

        <div className="ctd-summarygrid">
          {counts.map(([label, value, hrefFilters]) => (
            <Link
              key={label}
              className="ctd-summarytile"
              href={buildFilterHref(hrefFilters)}
            >
              <strong>{value}</strong>
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <form className="ctd-filters ctd-filters-grid" method="get">
          <input
            className="ctd-input"
            type="search"
            name="search"
            placeholder="Search name, email, phone, city, state, ZIP, or territory"
            defaultValue={filters.search}
          />
          <select className="ctd-select" name="status" defaultValue={filters.status}>
            <option value="">All statuses</option>
            {WORKFLOW_STATUSES.map((value) => (
              <option key={value} value={value}>
                {WORKFLOW_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <select className="ctd-select" name="state" defaultValue={filters.state}>
            <option value="">All states</option>
            {options.states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <select
            className="ctd-select"
            name="territory"
            defaultValue={filters.territory}
          >
            <option value="">All territories</option>
            {options.territories.map((territory) => (
              <option key={territory.value} value={territory.value}>
                {territory.label}
              </option>
            ))}
          </select>
          <select
            className="ctd-select"
            name="assignedTo"
            defaultValue={filters.assignedTo}
          >
            <option value="">All assigned</option>
            {options.assignees.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
          <select
            className="ctd-select"
            name="followUpDue"
            defaultValue={filters.followUpDue}
          >
            <option value="">Follow-ups</option>
            <option value="any_open">Open follow-ups</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due today</option>
          </select>
          <input
            className="ctd-input"
            type="date"
            name="screeningDate"
            defaultValue={filters.screeningDate}
            aria-label="Screening date"
          />
          <button className="ctd-addbutton" type="submit">
            Filter
          </button>
          {hasFilters ? (
            <Link className="ctd-linkbutton" href="/tournament-director/admin">
              Clear
            </Link>
          ) : null}
        </form>

        {rows.length === 0 ? (
          <p className="ctd-empty">No applications match these filters yet.</p>
        ) : (
          <AdminApplicantBulkList
            rows={rows.map((row) => ({
              id: row.application.id,
              name: `${row.application.firstName} ${row.application.lastName}`.trim(),
              email: row.application.email,
              phone: row.application.mobilePhone,
              territory: formatTerritory(row.application.primaryTerritory) || "—",
              submittedLabel: formatSubmittedAt(row.application.submittedAt),
              status: row.workflow.currentStatus,
              statusLabel: WORKFLOW_STATUS_LABELS[row.workflow.currentStatus],
              nextAction: row.workflow.nextAction || "—",
              followUpLabel: row.workflow.nextFollowUpAt
                ? formatSubmittedAt(row.workflow.nextFollowUpAt)
                : "—",
              overdue: row.hasOverdueFollowUp,
              dueToday: row.hasDueTodayFollowUp,
              screeningScheduledLabel: row.workflow.screeningScheduledAt
                ? formatInstantInTimeZone(
                    row.workflow.screeningScheduledAt,
                    row.workflow.screeningTimezone || "America/Chicago",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )
                : null,
              invitationStamp: formatScreeningInvitationStamp(
                row.lastScreeningInvitationAt,
                row.screeningInvitationSendCount,
              ),
            }))}
          />
        )}
      </div>
    </main>
  );
}
