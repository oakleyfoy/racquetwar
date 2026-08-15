import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CONTACT_EMAIL } from "./site";

const MAIL_SOURCE = readFileSync(resolve(process.cwd(), "lib/ctd/mail.ts"), "utf8");
const ENV_EXAMPLE = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");

describe("application mail addressing", () => {
  it("notifies the CTD inbox and sends as the configured mailbox", () => {
    expect(MAIL_SOURCE).toContain('env("MAIL_FROM_EMAIL") ?? env("FORM_FROM_EMAIL")');
    expect(MAIL_SOURCE).toContain('env("CTD_TO_EMAIL") ?? env("INQUIRY_TO_EMAIL")');
    expect(ENV_EXAMPLE).toMatch(/CTD_TO_EMAIL=oakley@wargroupllc\.com/i);
    expect(ENV_EXAMPLE).toContain("MAIL_FROM_EMAIL=");
  });

  it("directs applicant replies to the staff inbox and staff replies to the applicant", () => {
    expect(MAIL_SOURCE).toContain("replyTo: application.email");
    expect(MAIL_SOURCE).toContain("replyTo: transport.to");
    expect(MAIL_SOURCE).toContain("to: transport.to");
    expect(MAIL_SOURCE).toContain("to: application.email");
    expect(MAIL_SOURCE).toContain("CONTACT_EMAIL");
    expect(CONTACT_EMAIL).toBe("Oakley@WarGroupLLC.com");
  });

  it("prefers Microsoft Graph and uses SMTP only as a fallback", () => {
    expect(MAIL_SOURCE).toContain("const transport = microsoft ?? smtp");
    expect(MAIL_SOURCE).toContain("getMicrosoftMailConfig");
    expect(MAIL_SOURCE).toContain("getSmtpMailConfig");
    expect(MAIL_SOURCE).not.toMatch(/war.?campaign/i);
  });
});
