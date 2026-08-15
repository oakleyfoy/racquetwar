import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildAutoReplyHtml,
  buildAutoReplyText,
  buildInternalHtml,
  buildInternalText,
} from "./mail";
import { validApplication } from "./test-fixtures";

const SCHEMA_SOURCE = readFileSync(resolve(process.cwd(), "lib/ctd/db.ts"), "utf8");
const APPLICATIONS_SOURCE = readFileSync(
  resolve(process.cwd(), "lib/ctd/applications.ts"),
  "utf8",
);
const ACTIONS_SOURCE = readFileSync(
  resolve(process.cwd(), "app/tournament-director/admin/actions.ts"),
  "utf8",
);
const PROXY_SOURCE = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
const SUBMIT_SOURCE = readFileSync(
  resolve(process.cwd(), "app/tournament-director/api/submit/route.ts"),
  "utf8",
);
const PROGRAM_PAGE = readFileSync(
  resolve(process.cwd(), "components/ctd/ctd-program-page.tsx"),
  "utf8",
);
const APPLY_PAGE = readFileSync(
  resolve(process.cwd(), "app/tournament-director/page.tsx"),
  "utf8",
);
const FORM_SOURCE = readFileSync(
  resolve(process.cwd(), "components/ctd/ctd-application-form.tsx"),
  "utf8",
);
const FIELDS_SOURCE = readFileSync(
  resolve(process.cwd(), "lib/ctd/fields.ts"),
  "utf8",
);
const WORKFLOW_DB = readFileSync(
  resolve(process.cwd(), "lib/ctd/workflow-db.ts"),
  "utf8",
);
const INVITATION_SOURCE = readFileSync(
  resolve(process.cwd(), "lib/ctd/screening-invitation.ts"),
  "utf8",
);
const MAIL_SOURCE = readFileSync(resolve(process.cwd(), "lib/ctd/mail.ts"), "utf8");

describe("workflow schema and isolation", () => {
  it("adds companion tables without destructively changing ctd_applications", () => {
    expect(SCHEMA_SOURCE).toContain("create table if not exists ctd_applications");
    expect(SCHEMA_SOURCE).toContain("create table if not exists ctd_application_workflows");
    expect(SCHEMA_SOURCE).toContain("create table if not exists ctd_application_notes");
    expect(SCHEMA_SOURCE).toContain("create table if not exists ctd_application_follow_ups");
    expect(SCHEMA_SOURCE).toContain("create table if not exists ctd_application_activities");
    expect(SCHEMA_SOURCE).toContain("ctd_application_workflows_status_idx");
    expect(SCHEMA_SOURCE).toContain("ctd_application_workflows_follow_up_idx");
    expect(SCHEMA_SOURCE).toContain("ctd_application_workflows_screening_idx");
    expect(SCHEMA_SOURCE).not.toMatch(/\balter table\b/i);
    expect(SCHEMA_SOURCE).not.toMatch(/\bupdate ctd_applications\b/i);
    expect(SCHEMA_SOURCE).not.toMatch(/\bdelete from ctd_applications\b/i);
    expect(SCHEMA_SOURCE).not.toMatch(/\bdrop table\b/i);
  });

  it("cascades workflow rows when an application is permanently deleted", () => {
    expect(SCHEMA_SOURCE).toMatch(
      /ctd_application_workflows \([\s\S]*references ctd_applications\(id\) on delete cascade/,
    );
    expect(SCHEMA_SOURCE).toMatch(
      /ctd_application_notes \([\s\S]*references ctd_applications\(id\) on delete cascade/,
    );
    expect(SCHEMA_SOURCE).toMatch(
      /ctd_application_follow_ups \([\s\S]*references ctd_applications\(id\) on delete cascade/,
    );
    expect(SCHEMA_SOURCE).toMatch(
      /ctd_application_activities \([\s\S]*references ctd_applications\(id\) on delete cascade/,
    );
    expect(APPLICATIONS_SOURCE).toContain(
      "delete from ctd_applications where id = $1 and program = $2",
    );
  });

  it("defaults missing workflow rows to New and records status history", () => {
    expect(WORKFLOW_DB).toContain("coalesce(w.current_status, 'new')");
    expect(WORKFLOW_DB).toContain("order by created_at desc");
    expect(WORKFLOW_DB).toContain("screening_scheduled");
    expect(WORKFLOW_DB).toContain("screening_rescheduled");
    expect(WORKFLOW_DB).toContain("screening_canceled");
    expect(INVITATION_SOURCE).toContain('currentStatus: "screening_invited"');
    expect(INVITATION_SOURCE).toContain("status_changed");
    expect(ACTIONS_SOURCE).toContain("activityType: \"status_changed\"");
  });

  it("does not expose notes or workflow data on public routes or submit", () => {
    expect(SUBMIT_SOURCE).not.toContain("ctd_application_notes");
    expect(SUBMIT_SOURCE).not.toContain("current_status");
    expect(SUBMIT_SOURCE).not.toContain("Internal — not visible");
    expect(PROGRAM_PAGE).not.toContain("ctd_application_");
    expect(APPLY_PAGE).not.toContain("ctd_application_");
    expect(FORM_SOURCE).not.toContain("workflow");
    expect(PROGRAM_PAGE).not.toContain("CTD_SCREENING_BOOKING_URL");
    expect(APPLY_PAGE).not.toContain("CTD_SCREENING_BOOKING_URL");
    expect(SUBMIT_SOURCE).not.toContain("CTD_SCREENING_BOOKING_URL");
    expect(FORM_SOURCE).not.toContain("CTD_SCREENING_BOOKING_URL");
    expect(SUBMIT_SOURCE).toContain(
      '"Thank you. Your application has been received and a confirmation email is on its way."',
    );
  });

  it("keeps existing application fields, acknowledgments, and column mappings", () => {
    expect(FIELDS_SOURCE).toContain('name: "agreeNotGuaranteed"');
    expect(FIELDS_SOURCE).toContain('name: "agreeSelectionBasis"');
    expect(FIELDS_SOURCE).toContain('name: "agreeAccurate"');
    expect(FIELDS_SOURCE).not.toContain("agreeNoUnauthorized");
    expect(APPLICATIONS_SOURCE).toContain("agree_not_guaranteed");
    expect(APPLICATIONS_SOURCE).toContain("agree_selection_basis");
    expect(APPLICATIONS_SOURCE).toContain("agree_accurate");
  });

  it("protects new admin mutations with the existing session", () => {
    expect(PROXY_SOURCE).toContain('"/tournament-director/admin/:path*"');
    expect(PROXY_SOURCE).toContain('"/tournament-director/api/admin/:path*"');
    expect(ACTIONS_SOURCE).toContain("requireAdminSession");
    expect(ACTIONS_SOURCE).toContain("requireWorkspaceApplication");
    expect(ACTIONS_SOURCE.match(/requireAdminSession|requireWorkspaceApplication/g)?.length).toBeGreaterThan(8);
    expect(ACTIONS_SOURCE).toContain("wantsEmail");
    const statusAction = ACTIONS_SOURCE.slice(
      ACTIONS_SOURCE.indexOf("export async function updateWorkflowStatusAction"),
      ACTIONS_SOURCE.indexOf("export async function addNoteAction"),
    );
    expect(statusAction).toContain("updateWorkflowFields");
    expect(statusAction).not.toContain("maybeSendCandidateEmail");
    expect(statusAction).not.toContain("sendCandidateMessage");
  });

  it("sends candidate mail through the existing transport with staff Reply-To", () => {
    expect(MAIL_SOURCE).toContain("export async function sendCandidateMessage");
    expect(MAIL_SOURCE).toContain("replyTo: transport.to");
    expect(MAIL_SOURCE).toContain("const transport = microsoft ?? smtp");
  });
});

describe("existing notification emails remain unchanged", () => {
  const application = validApplication();

  it("keeps the applicant confirmation wording", () => {
    const html = buildAutoReplyHtml(application);
    const text = buildAutoReplyText(application);

    expect(html).toContain(
      "Thank you for applying to the RW Certified Tournament Director Program operated by War Tournaments LLC.",
    );
    expect(text).toContain(
      "Thank you for applying to the RW Certified Tournament Director Program operated by War Tournaments LLC.",
    );
    expect(html).not.toContain("{escapeHtml(PROGRAM_NAME)}");
  });

  it("keeps the staff-notification wording", () => {
    expect(buildInternalHtml(application)).toContain(
      "New Certified Tournament Director application",
    );
    expect(buildInternalText(application)).toContain(
      "New Certified Tournament Director application",
    );
  });
});
