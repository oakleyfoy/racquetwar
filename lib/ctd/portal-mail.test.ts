import { describe, expect, it } from "vitest";

import { buildPortalEmail, portalEmailHasForbiddenContent, PORTAL_MAIL_TYPES } from "./portal-mail";

describe("portal notification emails", () => {
  it("renders every portal mail type without unresolved template expressions", () => {
    for (const type of PORTAL_MAIL_TYPES) {
      const rendered = buildPortalEmail(type, {
        firstName: "Jordan",
        title: "Memphis Open",
        detail: "Please add the facility quote.",
      });
      expect(rendered.subject).toBeTruthy();
      expect(rendered.html).toContain("Jordan");
      expect(rendered.html).toContain("Memphis Open");
      expect(rendered.html).toContain("War Tournaments LLC");
      expect(portalEmailHasForbiddenContent(rendered)).toBe(false);
      expect(rendered.html).not.toContain("{escapeHtml(");
      expect(rendered.html).not.toMatch(/\$\{[A-Za-z]/);
    }
  });

  it("escapes user-supplied content and excludes internal notes", () => {
    const rendered = buildPortalEmail("event_needs_information", {
      firstName: `<img src=x onerror=alert(1)>`,
      title: `Open & "City"`,
      detail: `<script>alert(1)</script>`,
    });
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).not.toContain("<img src=x");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(
      portalEmailHasForbiddenContent(rendered, "INTERNAL NOTE KEEP SECRET"),
    ).toBe(false);
    expect(rendered.html).not.toContain("INTERNAL NOTE KEEP SECRET");
    expect(rendered.text).not.toContain("INTERNAL NOTE KEEP SECRET");
  });
});
