import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildAutoReplyHtml,
  buildAutoReplyText,
  buildInternalHtml,
  buildInternalText,
} from "./mail";
import { CONTACT_EMAIL, PROGRAM_NAME } from "./site";
import { validApplication } from "./test-fixtures";

const MAIL_SOURCE = readFileSync(resolve(process.cwd(), "lib/ctd/mail.ts"), "utf8");

describe("applicant auto-reply rendering", () => {
  const application = validApplication({
    firstName: "Jordan",
    email: "jordan.lee@example.com",
    mobilePhone: "9015550100",
  });

  it("renders the program name in HTML instead of the broken expression", () => {
    const html = buildAutoReplyHtml(application);

    expect(html).toContain("RW Certified Tournament Director Program");
    expect(html).toContain(
      "Thank you for applying to the RW Certified Tournament Director Program operated by War Tournaments LLC.",
    );
    expect(html).not.toContain("{escapeHtml(PROGRAM_NAME)}");
    expect(html).not.toContain("escapeHtml(PROGRAM_NAME)");
    expect(html).not.toContain("PROGRAM_NAME");
  });

  it("includes the required applicant and program details", () => {
    const html = buildAutoReplyHtml(application);
    const text = buildAutoReplyText(application);

    for (const body of [html, text]) {
      expect(body).toContain("Jordan");
      expect(body).toContain(PROGRAM_NAME);
      expect(body).toContain("War Tournaments LLC");
      expect(body).toContain("Memphis, Tennessee, United States");
      expect(body).toContain("jordan.lee@example.com");
      expect(body).toContain("9015550100");
      expect(body).toContain("initial national group of 5–8 candidates");
      expect(body).toContain("Oakley@WarGroupLLC.com");
      expect(body).toContain("War Tournaments LLC | Racquet War");
    }
  });

  it("does not leave unresolved template expressions in the rendered email", () => {
    const html = buildAutoReplyHtml(application);
    const text = buildAutoReplyText(application);

    for (const body of [html, text]) {
      expect(body).not.toContain("{escapeHtml(");
      expect(body).not.toMatch(/\$\{escapeHtml\(/);
      expect(body).not.toContain("PROGRAM_NAME");
      expect(body).not.toContain("undefined");
      expect(body).not.toContain("[object Object]");
      expect(body).not.toMatch(/\$\{[A-Za-z]/);
    }
  });

  it("HTML-escapes applicant-supplied values", () => {
    const html = buildAutoReplyHtml(
      validApplication({
        firstName: `<img src=x onerror=alert(1)>`,
        email: `a&b@example.com`,
        mobilePhone: `901<script>alert(1)</script>`,
        primaryTerritory: {
          city: `Memphis<>`,
          country: "United States",
          state: "Tennessee",
          region: "",
        },
      }),
    );

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("a&amp;b@example.com");
    expect(html).toContain("901&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Memphis&lt;&gt;");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("renders the correct program name in the plain-text auto-reply", () => {
    const text = buildAutoReplyText(application);

    expect(text).toContain(
      "Thank you for applying to the RW Certified Tournament Director Program operated by War Tournaments LLC.",
    );
    expect(text).toContain(CONTACT_EMAIL);
    expect(text).not.toContain("{escapeHtml(PROGRAM_NAME)}");
  });
});

describe("staff notification rendering", () => {
  const application = validApplication();

  it("keeps the existing staff-notification wording", () => {
    const html = buildInternalHtml(application);
    const text = buildInternalText(application);

    expect(html).toContain("New Certified Tournament Director application");
    expect(text).toContain("New Certified Tournament Director application");
    expect(html).toContain("Jordan Lee");
    expect(html).toContain("jordan.lee@example.com");
    expect(html).toContain("Territory: Memphis, Tennessee, United States");
    expect(html).not.toContain("{escapeHtml(PROGRAM_NAME)}");
  });
});

describe("auto-reply source", () => {
  it("does not contain an uninterpolated escapeHtml expression", () => {
    expect(MAIL_SOURCE).not.toMatch(/[^$]\{escapeHtml\(/);
    expect(MAIL_SOURCE).toContain("${escapeHtml(PROGRAM_NAME)}");
    expect(MAIL_SOURCE).toContain("replyTo: transport.to");
  });
});
