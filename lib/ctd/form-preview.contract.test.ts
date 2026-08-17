import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("admin form preview contracts", () => {
  const landing = read("app/tournament-director/admin/forms-preview/page.tsx");
  const eventPage = read(
    "app/tournament-director/admin/forms-preview/event/page.tsx",
  );
  const sponsorshipPage = read(
    "app/tournament-director/admin/forms-preview/sponsorship/page.tsx",
  );
  const layout = read("app/tournament-director/admin/forms-preview/layout.tsx");
  const previewConstants = read("lib/ctd/form-preview.ts");
  const eventForm = read("components/ctd/portal-event-form.tsx");
  const sponsorshipForm = read("components/ctd/portal-sponsorship-form.tsx");
  const shell = read("components/ctd/admin-form-preview.tsx");
  const nav = read("components/ctd/admin-portal-nav.tsx");
  const proxy = read("proxy.ts");
  const directorEventPage = read(
    "app/tournament-director/portal/events/[id]/page.tsx",
  );
  const directorSponsorshipPage = read(
    "app/tournament-director/portal/sponsorships/[id]/page.tsx",
  );

  it("requires an admin session and noindex on every preview route", () => {
    for (const source of [landing, eventPage, sponsorshipPage, layout]) {
      expect(source).toContain("requireAdminSession");
    }
    expect(layout).toContain("index: false");
    expect(proxy).toContain('"/tournament-director/admin/:path*"');
    expect(nav).toContain("/tournament-director/admin/forms-preview");
    expect(nav).toContain("Preview Director Forms");
  });

  it("reuses the real Director form components in admin-preview mode", () => {
    expect(eventPage).toContain("PortalEventForm");
    expect(eventPage).toContain('mode="admin-preview"');
    expect(sponsorshipPage).toContain("PortalSponsorshipForm");
    expect(sponsorshipPage).toContain('mode="admin-preview"');
    expect(previewConstants).not.toContain("portal-db");
    expect(eventForm).toContain('mode = "director"');
    expect(sponsorshipForm).toContain('mode = "director"');
  });

  it("does not accept record IDs or expose mutation actions from preview pages", () => {
    for (const source of [landing, eventPage, sponsorshipPage, layout]) {
      expect(source).not.toContain("searchParams");
      expect(source).not.toContain("applicationId");
      expect(source).not.toContain("directorId");
      expect(source).not.toContain("saveEventFormAction");
      expect(source).not.toContain("saveSponsorshipFormAction");
      expect(source).not.toContain("activateDirector");
      expect(source).not.toContain("issueDirectorLoginLink");
      expect(source).not.toContain("createEventDraft");
      expect(source).not.toContain("submitEventProposal");
      expect(source).not.toContain("submitSponsorship");
      expect(source).not.toContain("savePortalFile");
      expect(source).not.toContain("notifyPortal");
      expect(source).not.toContain("sendCandidateMessage");
      expect(source).not.toMatch(/localStorage|sessionStorage/);
    }
    expect(eventForm).toContain("action={isPreview ? undefined : saveEventFormAction}");
    expect(sponsorshipForm).toContain(
      "action={isPreview ? undefined : saveSponsorshipFormAction}",
    );
  });

  it("keeps preview data browser-only and resettable", () => {
    expect(shell).toContain("RESET PREVIEW");
    expect(shell).toContain("setResetKey");
    expect(shell).not.toMatch(/localStorage|sessionStorage|document.cookie/);
    expect(eventPage).toContain("blankEventPreview");
    expect(eventPage).toContain("form-preview-data");
    expect(sponsorshipPage).toContain("blankSponsorshipPreview");
    expect(sponsorshipPage).toContain("events={[]}");
  });

  it("leaves existing Director form pages on the real save actions", () => {
    expect(directorEventPage).toContain("PortalEventForm");
    expect(directorEventPage).not.toContain("admin-preview");
    expect(directorSponsorshipPage).toContain("PortalSponsorshipForm");
    expect(directorSponsorshipPage).not.toContain("admin-preview");
  });
});
