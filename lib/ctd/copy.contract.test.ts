import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AGREEMENTS,
  AUTHORIZATION_NOTICE,
  PROGRAM_SUBTITLE,
  PROGRAM_TITLE,
  SELECTION_NOTICE,
} from "./fields";
import { PROGRAM_FAQS, PROGRAM_FINAL_CTA, PROGRAM_HERO } from "./program-content";
import {
  APPLICATION_EYEBROW,
  APPLICATION_HERO_BADGES,
  APPLICATION_PATH,
  APPLICATION_PRIVACY_COPY,
  APPLICATION_SEO,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  OPERATOR_NAME,
  PROGRAM_NAME,
  PROGRAM_PATH,
  PROGRAM_SEO,
  PROGRAM_SUPPORT_ID,
} from "./site";

const PUBLIC_COPY_FILES = [
  "lib/ctd/site.ts",
  "lib/ctd/fields.ts",
  "lib/ctd/program-content.ts",
  "components/ctd/ctd-site-footer.tsx",
  "components/ctd/ctd-program-page.tsx",
  "components/ctd/ctd-application-form.tsx",
  "app/tournament-director/page.tsx",
  "app/tournament-director/layout.tsx",
  "app/tournament-director-program/page.tsx",
  "app/tournament-director-program/layout.tsx",
  "app/layout.tsx",
];

const YEAR_PATTERN = /\b(?:19|20)\d{2}\b/;

describe("public marketing copy", () => {
  it("uses the official program name and operator", () => {
    expect(PROGRAM_NAME).toBe("RW Certified Tournament Director Program");
    expect(OPERATOR_NAME).toBe("War Tournaments LLC");
    expect(APPLICATION_EYEBROW).toBe(PROGRAM_NAME);
    expect(PROGRAM_TITLE).toBe("Apply to Become an RW Certified Tournament Director");
    expect(PROGRAM_SUBTITLE).toContain("initial national group of 5–8 candidates");
    expect(SELECTION_NOTICE).toContain("War Tournaments LLC");
    expect(SELECTION_NOTICE).toContain("initial national group of 5–8 candidates");
  });

  it("keeps Oakley’s contact details exact", () => {
    expect(CONTACT_EMAIL).toBe("Oakley@WarGroupLLC.com");
    expect(CONTACT_PHONE).toBe("(901) 359-3035");
  });

  it("links the two public routes to each other", () => {
    expect(APPLICATION_PATH).toBe("/tournament-director");
    expect(PROGRAM_PATH).toBe("/tournament-director-program");
    expect(PROGRAM_SUPPORT_ID).toBe("program-support");
    expect(PROGRAM_HERO.title).toBe("Bring Racquet War to Your Market");
  });

  it("uses the required SEO titles and descriptions", () => {
    expect(PROGRAM_SEO).toEqual({
      title: "RW Certified Tournament Director Program | War Tournaments",
      description:
        "Learn how to become an RW Certified Tournament Director and develop professionally supported Racquet War events in your local market.",
    });
    expect(APPLICATION_SEO).toEqual({
      title: "Apply | RW Certified Tournament Director Program",
      description:
        "Apply for consideration for the RW Certified Tournament Director Program operated by War Tournaments LLC.",
    });
  });

  it("updates the application acknowledgments without renaming stored fields", () => {
    expect(AGREEMENTS[0].label).toContain("does not guarantee acceptance or certification");
    expect(AGREEMENTS[1].label).toContain("War Tournaments LLC");
    expect(AGREEMENTS).toHaveLength(3);
    expect(AGREEMENTS[2].label).toBe(
      "I certify that the information provided in this application is accurate.",
    );
    expect(AUTHORIZATION_NOTICE).toBe(
      "Candidates may not announce, market, register players for, collect money for or operate a Racquet War event without written authorization from War Tournaments LLC.",
    );
    expect(APPLICATION_PRIVACY_COPY).toContain("War Tournaments LLC");
    expect(APPLICATION_HERO_BADGES).toEqual([
      "Initial group of 5–8 candidates",
      "Potential ZIP-code territory after certification",
      "Takes about 10 minutes",
    ]);
  });

  it("does not use Founding, exclusive territory, or a calendar year in visible copy", () => {
    for (const relativePath of PUBLIC_COPY_FILES) {
      const source = readFileSync(resolve(process.cwd(), relativePath), "utf8");
      expect(source, relativePath).not.toMatch(/Founding/i);
      expect(source, relativePath).not.toMatch(/exclusive territor/i);
      expect(source, relativePath).not.toMatch(YEAR_PATTERN);
    }
  });

  it("identifies War Tournaments LLC as the program operator in the FAQ and disclaimer", () => {
    expect(PROGRAM_FAQS[0].answer).toContain("independent contractors");
    expect(PROGRAM_FINAL_CTA.disclaimer).toContain(
      "administered by War Tournaments LLC",
    );
  });
});
