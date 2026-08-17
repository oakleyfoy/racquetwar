import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const saveEventFormAction = vi.fn();
const saveSponsorshipFormAction = vi.fn();
const activateDirectorFromApplication = vi.fn();
const issueDirectorLoginLink = vi.fn();
const createEventDraft = vi.fn();
const submitEventProposal = vi.fn();
const submitSponsorship = vi.fn();
const savePortalFile = vi.fn();
const notifyPortal = vi.fn();
const sendCandidateMessage = vi.fn();

vi.mock("next/link", () => ({
  default: function Link({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/app/tournament-director/portal/actions", () => ({
  saveEventFormAction: (...args: unknown[]) => saveEventFormAction(...args),
  saveSponsorshipFormAction: (...args: unknown[]) =>
    saveSponsorshipFormAction(...args),
}));

vi.mock("@/lib/ctd/director-db", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ctd/director-db")>(
    "@/lib/ctd/director-db",
  );
  return {
    ...actual,
    activateDirectorFromApplication: (...args: unknown[]) =>
      activateDirectorFromApplication(...args),
    issueDirectorLoginLink: (...args: unknown[]) =>
      issueDirectorLoginLink(...args),
  };
});

vi.mock("@/lib/ctd/portal-db", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ctd/portal-db")>(
    "@/lib/ctd/portal-db",
  );
  return {
    ...actual,
    createEventDraft: (...args: unknown[]) => createEventDraft(...args),
    submitEventProposal: (...args: unknown[]) => submitEventProposal(...args),
    submitSponsorship: (...args: unknown[]) => submitSponsorship(...args),
    savePortalFile: (...args: unknown[]) => savePortalFile(...args),
  };
});

vi.mock("@/lib/ctd/portal-mail", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ctd/portal-mail")>(
    "@/lib/ctd/portal-mail",
  );
  return {
    ...actual,
    notifyPortal: (...args: unknown[]) => notifyPortal(...args),
  };
});

vi.mock("@/lib/ctd/mail", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ctd/mail")>(
    "@/lib/ctd/mail",
  );
  return {
    ...actual,
    sendCandidateMessage: (...args: unknown[]) => sendCandidateMessage(...args),
  };
});

import { AdminFormPreviewLanding } from "@/components/ctd/admin-form-preview-landing";
import { AdminFormPreviewShell } from "@/components/ctd/admin-form-preview";
import { PortalEventForm } from "@/components/ctd/portal-event-form";
import { PortalSponsorshipForm } from "@/components/ctd/portal-sponsorship-form";
import {
  BUDGET_DISCLAIMER,
  DOUBLE_COUNT_RULE,
  EVENT_ACKNOWLEDGMENTS,
  PRICING_NOTICE,
  SPONSORSHIP_ACKNOWLEDGMENTS,
} from "@/lib/ctd/portal-domain";
import { calculateEventBudget, calculateSponsorshipSplit, formatCents } from "@/lib/ctd/portal-money";

import { blankEventPreview, blankSponsorshipPreview } from "./form-preview-data";
import {
  PREVIEW_BANNER_TEXT,
  PREVIEW_BANNER_TITLE,
  PREVIEW_DIRECTOR_NAME,
} from "./form-preview";

function mutationCalls() {
  return [
    saveEventFormAction,
    saveSponsorshipFormAction,
    activateDirectorFromApplication,
    issueDirectorLoginLink,
    createEventDraft,
    submitEventProposal,
    submitSponsorship,
    savePortalFile,
    notifyPortal,
    sendCandidateMessage,
  ];
}

describe("admin Director form preview", () => {
  it("renders the preview landing cards", () => {
    const html = renderToStaticMarkup(<AdminFormPreviewLanding />);
    expect(html).toContain("Proposed Event &amp; Budget Form");
    expect(html).toContain("Sponsorship Disclosure and Approval Request");
    expect(html).toContain("PREVIEW EVENT FORM");
    expect(html).toContain("PREVIEW SPONSORSHIP FORM");
    expect(html).toContain('href="/tournament-director/admin/forms-preview/event"');
    expect(html).toContain(
      'href="/tournament-director/admin/forms-preview/sponsorship"',
    );
  });

  it("renders the complete event form from the shared component", () => {
    const html = renderToStaticMarkup(
      <AdminFormPreviewShell>
        <PortalEventForm
          mode="admin-preview"
          proposal={blankEventPreview()}
          directorName={PREVIEW_DIRECTOR_NAME}
          canEdit
        />
      </AdminFormPreviewShell>,
    );

    expect(html).toContain(PREVIEW_BANNER_TITLE);
    expect(html).toContain(PREVIEW_BANNER_TEXT);
    expect(html).toContain("BACK TO FORM PREVIEWS");
    expect(html).toContain("RESET PREVIEW");
    expect(html).toContain("Event information");
    expect(html).toContain("Proposed facility name");
    expect(html).toContain("Primary start date");
    expect(html).toContain("Proposed event format");
    expect(html).toContain("Local market opportunity");
    expect(html).toContain("Recommended entry fee per player");
    expect(html).toContain(PRICING_NOTICE);
    expect(html).toContain("Proposed budget");
    expect(html).toContain("Fixed cost");
    expect(html).toContain("Per-player cost");
    expect(html).toContain("RW fee at $35 per eligible player");
    expect(html).toContain("Estimated gross registration revenue");
    expect(html).toContain("Total proposed event expenses");
    expect(html).toContain("Estimated remaining after RW fee and expenses");
    expect(html).toContain("Estimated Director compensation");
    expect(html).toContain(BUDGET_DISCLAIMER);
    expect(html).toContain("Explanation if expenses exceed $65 per projected player");
    for (const item of EVENT_ACKNOWLEDGMENTS) {
      expect(html).toContain(item.label);
    }
    expect(html).toContain("SAVE DRAFT — PREVIEW ONLY");
    expect(html).toContain("SUBMIT — PREVIEW ONLY");
    expect(html).toContain("File uploads are disabled in preview mode.");
    expect(html).not.toContain('type="file"');
    expect(html).toContain("disabled");
    expect(html).toContain(PREVIEW_DIRECTOR_NAME);
    expect(html).not.toContain("Oakley");
  });

  it("renders the complete sponsorship form from the shared component", () => {
    const html = renderToStaticMarkup(
      <AdminFormPreviewShell>
        <PortalSponsorshipForm
          mode="admin-preview"
          request={blankSponsorshipPreview()}
          directorName={PREVIEW_DIRECTOR_NAME}
          events={[]}
          canEdit
        />
      </AdminFormPreviewShell>,
    );

    expect(html).toContain("Sponsor information");
    expect(html).toContain("Sponsor/company name");
    expect(html).toContain("Sponsor contact name");
    expect(html).toContain("Associated event (optional)");
    expect(html).toContain("General market sponsorship — not yet linked to an event");
    expect(html).toContain("Territory or market");
    expect(html).toContain("Sponsorship stage");
    expect(html).toContain("Cash sponsorship amount");
    expect(html).toContain("Noncash goods or services are included");
    expect(html).toContain("Requested sponsor benefits");
    expect(html).toContain("War Tournaments share: 25%");
    expect(html).toContain("Director share: 75%");
    expect(html).toContain("Requested noncash — War Tournaments share 25% (illustration only)");
    expect(html).toContain("$0.00 until War Tournaments approves a value");
    expect(html).toContain(DOUBLE_COUNT_RULE);
    for (const item of SPONSORSHIP_ACKNOWLEDGMENTS) {
      expect(html).toContain(item.label);
    }
    expect(html).toContain("File uploads are disabled in preview mode.");
    expect(html).toContain("SAVE DRAFT — PREVIEW ONLY");
    expect(html).toContain("SUBMIT — PREVIEW ONLY");
  });

  it("uses the same event calculations as the production form", () => {
    const proposal = blankEventPreview();
    proposal.estimatedPlayers = "10";
    proposal.recommendedEntryFee = "80.00";
    proposal.items = [
      {
        category: "facility_court",
        vendor: "",
        description: "",
        quantity: "1",
        unitCost: "200.00",
        costType: "fixed",
        quoteReference: "",
        explanation: "",
      },
    ];
    const expected = calculateEventBudget(10, 8000, [
      { costType: "fixed", quantityHundredths: 100, unitCents: 20000 },
    ]);
    const html = renderToStaticMarkup(
      <PortalEventForm
        mode="admin-preview"
        proposal={proposal}
        directorName={PREVIEW_DIRECTOR_NAME}
        canEdit
      />,
    );
    expect(html).toContain(formatCents(expected.rwFeeCents));
    expect(html).toContain(formatCents(expected.estimatedGrossCents));
    expect(html).toContain(formatCents(expected.totalExpensesCents));
    expect(html).toContain(formatCents(expected.estimatedDirectorCompensationCents));
    expect(expected.rwFeeCents).toBe(35000);
  });

  it("shows the $65 warning in preview when expenses exceed the baseline", () => {
    const proposal = blankEventPreview();
    proposal.estimatedPlayers = "2";
    proposal.recommendedEntryFee = "150.00";
    proposal.items = [
      {
        category: "facility_court",
        vendor: "",
        description: "",
        quantity: "1",
        unitCost: "200.00",
        costType: "fixed",
        quoteReference: "",
        explanation: "",
      },
    ];
    const html = renderToStaticMarkup(
      <PortalEventForm
        mode="admin-preview"
        proposal={proposal}
        directorName={PREVIEW_DIRECTOR_NAME}
        canEdit
      />,
    );
    expect(html).toContain("$65 per projected player planning baseline");
  });

  it("uses the same sponsorship 25/75 calculations as the production form", () => {
    const request = blankSponsorshipPreview();
    request.cashAmount = "1000.00";
    request.includesNoncash = true;
    request.requestedNoncashValue = "400.00";
    const cash = calculateSponsorshipSplit(100000, 0);
    const noncash = calculateSponsorshipSplit(0, 40000);
    const html = renderToStaticMarkup(
      <PortalSponsorshipForm
        mode="admin-preview"
        request={request}
        directorName={PREVIEW_DIRECTOR_NAME}
        events={[]}
        canEdit
      />,
    );
    expect(html).toContain(formatCents(cash.cashWarCents));
    expect(html).toContain(formatCents(cash.cashDirectorCents));
    expect(html).toContain(formatCents(noncash.noncashWarCents));
    expect(html).toContain(formatCents(noncash.noncashDirectorCents));
  });

  it("keeps the Director form actions enabled outside preview", () => {
    const html = renderToStaticMarkup(
      <PortalEventForm
        proposal={blankEventPreview()}
        directorName="Jordan Example"
        canEdit
      />,
    );
    expect(html).toContain("Save draft");
    expect(html).toContain("Submit proposal");
    expect(html).not.toContain("PREVIEW ONLY");
    expect(html).toContain('type="file"');
    expect(html).not.toContain("File uploads are disabled in preview mode.");
  });

  it("does not call mutation or email functions when preview markup is rendered", () => {
    renderToStaticMarkup(
      <AdminFormPreviewShell>
        <PortalEventForm
          mode="admin-preview"
          proposal={blankEventPreview()}
          directorName={PREVIEW_DIRECTOR_NAME}
          canEdit
        />
        <PortalSponsorshipForm
          mode="admin-preview"
          request={blankSponsorshipPreview()}
          directorName={PREVIEW_DIRECTOR_NAME}
          events={[]}
          canEdit
        />
      </AdminFormPreviewShell>,
    );

    for (const fn of mutationCalls()) {
      expect(fn).not.toHaveBeenCalled();
    }
  });
});
