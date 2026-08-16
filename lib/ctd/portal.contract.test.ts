import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildAutoReplyHtml, buildAutoReplyText } from "./mail";
import { validApplication } from "./test-fixtures";

const root = process.cwd();
const read = (relativePath: string) =>
  readFileSync(resolve(root, relativePath), "utf8");

function walk(directory: string, files: string[] = []) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
}

const DIRECTOR_COPY_FILES = [
  "lib/ctd/portal-domain.ts",
  "lib/ctd/portal-mail.ts",
  "components/ctd/portal-event-form.tsx",
  "components/ctd/portal-sponsorship-form.tsx",
  "components/ctd/portal-nav.tsx",
  ...walk(resolve(root, "app/tournament-director/portal")).map((file) =>
    file.slice(root.length + 1).replaceAll("\\", "/"),
  ),
];

const YEAR_PATTERN = /\b(?:19|20)\d{2}\b/;

describe("portal security and isolation contracts", () => {
  const portalDb = read("lib/ctd/portal-db.ts");
  const portalSchema = read("lib/ctd/portal-schema.ts");
  const dbSource = read("lib/ctd/db.ts");
  const applications = read("lib/ctd/applications.ts");
  const directorActions = read("app/tournament-director/portal/actions.ts");
  const adminPortalActions = read("app/tournament-director/admin/portal-actions.ts");
  const adminActions = read("app/tournament-director/admin/actions.ts");
  const proxy = read("proxy.ts");
  const robots = read("app/robots.ts");
  const submit = read("app/tournament-director/api/submit/route.ts");
  const publicPage = read("app/tournament-director/page.tsx");
  const programPage = read("components/ctd/ctd-program-page.tsx");
  const directorGuard = read("lib/ctd/director-guard.ts");
  const directorFiles = read("app/tournament-director/portal/files/[id]/route.ts");
  const adminFiles = read("app/tournament-director/admin/files/[id]/route.ts");
  const mail = read("lib/ctd/mail.ts");
  const directorSession = read("lib/ctd/director-session.ts");
  const directorDb = read("lib/ctd/director-db.ts");

  it("does not mutate existing application records or columns", () => {
    expect(portalSchema).not.toMatch(/\balter table\b/i);
    expect(portalSchema).not.toMatch(/\bupdate ctd_applications\b/i);
    expect(portalSchema).not.toMatch(/\bdelete from ctd_applications\b/i);
    expect(portalDb).not.toMatch(/\bupdate ctd_applications\b/i);
    expect(portalDb).not.toMatch(/\bdelete from ctd_applications\b/i);
    expect(dbSource).not.toMatch(/\balter table\b/i);
    expect(applications).toContain("agree_not_guaranteed");
    expect(applications).toContain("agree_selection_basis");
    expect(applications).toContain("agree_accurate");
  });

  it("protects Director and admin routes and enforces record ownership", () => {
    expect(proxy).toContain('"/tournament-director/portal/:path*"');
    expect(proxy).toContain('"/tournament-director/admin/:path*"');
    expect(proxy).toContain("verifyDirectorCookie");
    expect(proxy).toContain("verifySessionToken");
    expect(directorGuard).toContain("loadDirectorFromCookie");
    expect(directorActions).toContain("requireDirectorSession");
    expect(directorActions).not.toContain("authorizeEventProposal");
    expect(directorActions).not.toContain("approveSponsorship");
    expect(directorActions).not.toContain("adminSetEventStatus");
    expect(adminPortalActions).toContain("requireAdminSession");
    expect(adminActions).toContain("requireAdminSession");
    expect(portalDb).toContain("export async function getEventProposal");
    expect(portalDb).toContain("and director_id = $2");
    expect(robots).toContain("/tournament-director/portal");
  });

  it("does not expose portal records on public pages or the application submit route", () => {
    expect(submit).not.toContain("ctd_event_proposals");
    expect(submit).not.toContain("ctd_sponsorship");
    expect(submit).not.toContain("ctd_portal_notes");
    expect(publicPage).not.toContain("ctd_event_proposals");
    expect(programPage).not.toContain("ctd_directors");
    expect(publicPage).not.toContain("Internal — not visible");
  });

  it("stores Director tokens hashed with expiry and revocation", () => {
    expect(directorSession).toContain("hashToken");
    expect(directorDb).toContain("token_hash");
    expect(directorDb).toContain("revoked_at");
    expect(directorDb).toContain("expires_at");
    expect(directorDb).toContain("currentStatus !== \"selected\"");
    expect(directorDb).toContain("setDirectorActive");
    expect(directorDb).not.toMatch(/\bpassword\b/i);
    expect(directorActions).not.toMatch(/\bpassword\b/i);
  });

  it("authorizes attachments for the owning Director or an admin only", () => {
    expect(directorFiles).toContain("loadDirectorFromCookie");
    expect(directorFiles).toContain("file.director_id !== director.id");
    expect(adminFiles).toContain("verifySessionToken");
    expect(directorFiles).not.toContain("process.env.DATABASE_URL");
  });

  it("keeps internal notes out of Director views and emails", () => {
    expect(directorActions).not.toContain("listPortalNotes");
    expect(read("app/tournament-director/portal/events/[id]/page.tsx")).not.toContain(
      "listPortalNotes",
    );
    expect(read("lib/ctd/portal-mail.ts")).not.toContain("listPortalNotes");
    expect(read("lib/ctd/portal-mail.ts")).not.toContain("internal note");
  });

  it("does not change existing confirmation or screening emails", () => {
    const application = validApplication();
    expect(buildAutoReplyHtml(application)).toContain(
      "Thank you for applying to the RW Certified Tournament Director Program operated by War Tournaments LLC.",
    );
    expect(buildAutoReplyText(application)).toContain(
      "Thank you for applying to the RW Certified Tournament Director Program operated by War Tournaments LLC.",
    );
    expect(mail).toContain("export async function sendCandidateMessage");
    expect(mail).toContain("replyTo: transport.to");
  });

  it("does not use Founding, exclusive territory, or a calendar year in new Director-facing copy", () => {
    for (const relativePath of DIRECTOR_COPY_FILES) {
      const source = read(relativePath);
      expect(source, relativePath).not.toMatch(/Founding/i);
      expect(source, relativePath).not.toMatch(/exclusive territor/i);
      expect(source, relativePath).not.toMatch(YEAR_PATTERN);
    }
  });

  it("records activity and isolates email failures from stored submissions", () => {
    expect(portalDb).toContain("insert into ctd_portal_activities");
    expect(portalDb).toContain("activity_type");
    expect(directorActions).toContain("void notifyPortal");
    expect(adminPortalActions).toContain("void notifyPortal");
    expect(portalDb).not.toContain("notifyPortal");
  });
});
