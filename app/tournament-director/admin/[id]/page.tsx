import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getApplication } from "@/lib/ctd/applications";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/ctd/fields";
import { applicantName, buildReport, formatSubmittedAt } from "@/lib/ctd/report";

import { AdminDeleteApplicationForm } from "@/components/ctd/admin-delete-application-form";

import { updateApplicationAction } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review application | Racquet War",
  robots: { index: false, follow: false },
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  // Guard before querying so a malformed id cannot raise a Postgres cast error.
  if (!UUID_PATTERN.test(id)) notFound();

  const application = await getApplication(id);
  if (!application) notFound();

  const sections = buildReport(application);

  return (
    <main className="ctd-main">
      <div className="ctd-card" style={{ marginTop: 24 }}>
        <Link className="ctd-back" href="/tournament-director/admin">
          ← All applications
        </Link>

        <div className="ctd-admin-head" style={{ marginTop: 12 }}>
          <div>
            <h1 className="ctd-section-title">{applicantName(application)}</h1>
            <p className="ctd-section-hint">
              Submitted {formatSubmittedAt(application.submittedAt)}
            </p>
          </div>
          <span className={`ctd-badge ctd-badge-${application.status}`}>
            {STATUS_LABELS[application.status]}
          </span>
        </div>

        {saved ? (
          <div className="ctd-saved" role="status">
            Changes saved.
          </div>
        ) : null}

        <form action={updateApplicationAction} className="ctd-reviewpanel">
          <input type="hidden" name="id" value={application.id} />

          <div className="ctd-grid ctd-grid-2">
            <div className="ctd-field">
              <label className="ctd-label" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="ctd-select"
                defaultValue={application.status}
              >
                {APPLICATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div className="ctd-field">
              <label className="ctd-label" htmlFor="contact">
                Contact
              </label>
              <p id="contact" className="ctd-contactline">
                <a href={`mailto:${application.email}`}>{application.email}</a>
                <br />
                <a href={`tel:${application.mobilePhone}`}>
                  {application.mobilePhone}
                </a>
              </p>
            </div>

            <div className="ctd-field ctd-span-2">
              <label className="ctd-label" htmlFor="adminNotes">
                Internal notes
              </label>
              <textarea
                id="adminNotes"
                name="adminNotes"
                className="ctd-textarea"
                defaultValue={application.adminNotes}
                placeholder="Interview notes, territory considerations, follow-up dates…"
              />
            </div>
          </div>

          <button className="ctd-submit" type="submit" style={{ marginTop: 16 }}>
            Save changes
          </button>
        </form>

        {sections.map((section) => (
          <section className="ctd-report-section" key={section.title}>
            <h2 className="ctd-report-title">{section.title}</h2>
            <dl className="ctd-report-list">
              {section.rows.map((row) => (
                <div className="ctd-report-row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd className={row.multiline ? "ctd-report-longtext" : undefined}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <AdminDeleteApplicationForm
          id={application.id}
          applicantLabel={applicantName(application)}
        />
      </div>
    </main>
  );
}
