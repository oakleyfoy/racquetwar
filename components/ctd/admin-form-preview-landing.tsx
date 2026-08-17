import Link from "next/link";

export function AdminFormPreviewLanding() {
  return (
    <div className="ctd-workflow-grid">
      <article className="ctd-reviewpanel">
        <h2 className="ctd-report-title">Proposed Event & Budget Form</h2>
        <p className="ctd-section-hint">
          Inspect the complete event proposal, budget rows, and calculations a
          Director will complete.
        </p>
        <Link
          className="ctd-submit"
          href="/tournament-director/admin/forms-preview/event"
        >
          PREVIEW EVENT FORM
        </Link>
      </article>
      <article className="ctd-reviewpanel">
        <h2 className="ctd-report-title">
          Sponsorship Disclosure and Approval Request
        </h2>
        <p className="ctd-section-hint">
          Inspect the complete sponsorship request, benefits, and 25%/75%
          calculations a Director will complete.
        </p>
        <Link
          className="ctd-submit"
          href="/tournament-director/admin/forms-preview/sponsorship"
        >
          PREVIEW SPONSORSHIP FORM
        </Link>
      </article>
    </div>
  );
}
