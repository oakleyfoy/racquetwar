import { describe, expect, it } from "vitest";

import {
  buildCandidateEmail,
  CANDIDATE_EMAIL_TYPES,
  candidateEmailContainsForbiddenContent,
} from "./candidate-mail";
import { validApplication } from "./test-fixtures";
import { CONTACT_EMAIL, PROGRAM_NAME } from "./site";

const application = validApplication({
  firstName: `<img src=x onerror=alert(1)>`,
  lastName: "Lee",
  email: "a&b@example.com",
});

const screening = {
  scheduledAt: "2026-08-15T18:00:00.000Z",
  timeZone: "America/Chicago",
  method: "zoom" as const,
  locationOrLink: `<script>alert(1)</script>`,
};

const bookingUrl = "https://outlook.office.com/book/example/?q=a&b=1";

describe("candidate email templates", () => {
  it("renders the exact program name and Oakley's contact in every template", () => {
    for (const type of CANDIDATE_EMAIL_TYPES) {
      const rendered = buildCandidateEmail(type, {
        application,
        screening,
        bookingUrl,
      });

      if (type === "screening_invitation") {
        expect(rendered.subject).toBe(
          "Schedule Your RW Tournament Director Screening Call",
        );
      } else if (type.startsWith("screening_")) {
        expect(rendered.subject).toContain("RW Tournament Director");
      } else {
        expect(rendered.subject).toContain(
          "RW Certified Tournament Director Program",
        );
      }
      expect(rendered.html).toContain(PROGRAM_NAME);
      expect(rendered.text).toContain(PROGRAM_NAME);
      expect(rendered.html).toContain(CONTACT_EMAIL);
      expect(rendered.text).toContain(CONTACT_EMAIL);
      expect(rendered.html).toContain("War Tournaments LLC | Racquet War");
      expect(rendered.text).toContain("War Tournaments LLC | Racquet War");
    }
  });

  it("uses the approved screening subjects", () => {
    expect(
      buildCandidateEmail("screening_invitation", { application, bookingUrl }).subject,
    ).toBe("Schedule Your RW Tournament Director Screening Call");
    expect(
      buildCandidateEmail("screening_confirmation", { application, screening }).subject,
    ).toBe("Your RW Tournament Director Screening Call Is Scheduled");
    expect(
      buildCandidateEmail("screening_reschedule", { application, screening }).subject,
    ).toBe("Updated RW Tournament Director Screening Call");
    expect(buildCandidateEmail("screening_cancellation", { application }).subject).toBe(
      "Update Regarding Your RW Tournament Director Screening Call",
    );
  });

  it("does not leave unresolved template expressions", () => {
    for (const type of CANDIDATE_EMAIL_TYPES) {
      const rendered = buildCandidateEmail(type, {
        application,
        screening,
        bookingUrl,
      });
      expect(candidateEmailContainsForbiddenContent(rendered)).toBe(false);
      expect(rendered.html).not.toContain("{escapeHtml(");
      expect(rendered.html).not.toMatch(/\$\{escapeHtml\(/);
      expect(rendered.html).not.toContain("PROGRAM_NAME");
      expect(rendered.html).not.toContain("undefined");
      expect(rendered.html).not.toContain("[object Object]");
    }
  });

  it("HTML-escapes applicant and administrator-entered values", () => {
    const rendered = buildCandidateEmail("screening_confirmation", {
      application,
      screening,
    });

    expect(rendered.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(rendered.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(rendered.html).not.toContain("<img src=x onerror=alert(1)>");
    expect(rendered.html).not.toContain("<script>alert(1)</script>");
  });

  it("never includes internal notes in candidate emails", () => {
    const internalNote = "Do not tell the candidate about this private concern.";
    for (const type of CANDIDATE_EMAIL_TYPES) {
      const rendered = buildCandidateEmail(type, {
        application,
        screening,
        bookingUrl,
      });
      expect(rendered.html).not.toContain(internalNote);
      expect(rendered.text).not.toContain("Internal — not visible to applicant");
      expect(
        candidateEmailContainsForbiddenContent(rendered, internalNote),
      ).toBe(false);
    }
  });

  it("states that advancement and selection are not certification or territory grants", () => {
    for (const type of ["advancement", "hold", "decline", "selection"] as const) {
      const rendered = buildCandidateEmail(type, { application });
      expect(rendered.text).toContain("not certification");
      expect(rendered.text).toContain("does not grant territory");
      expect(rendered.text).toContain("Written authorization from War Tournaments LLC");
      expect(rendered.text).toContain("operated by War Tournaments LLC");
      expect(rendered.text).not.toMatch(/\b(?:19|20)\d{2}\b/);
    }
  });
});
