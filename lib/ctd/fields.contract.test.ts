import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AGREEMENTS,
  AUTHORIZATION_NOTICE,
  COUNTRIES,
  PROGRAM_SLUG,
  RECAPTCHA_ACTION,
  SPORTS,
  UNITED_STATES,
  US_STATES,
} from "./fields";

const FORM_SOURCE = readFileSync(
  resolve(process.cwd(), "components/ctd/ctd-application-form.tsx"),
  "utf8",
);

const REQUIRED_FIELD_IDS = [
  "firstName",
  "lastName",
  "email",
  "mobilePhone",
  "country",
  "city",
  "state",
  "zipCode",
] as const;

const OPTIONAL_FIELD_IDS = [
  "employer",
  "position",
  "yearsManagementExperience",
  "industry",
  "peopleSupervised",
  "skillLevel",
  "clubsLeagues",
  "tournamentExperienceDetail",
  "whyCtd",
  "whySuccessful",
  "howHeard",
  "trainingStartDate",
  "additionalInfo",
  "company",
] as const;

describe("application field contract", () => {
  it("keeps the stored agreement field names", () => {
    expect(AGREEMENTS.map((agreement) => agreement.name)).toEqual([
      "agreeNotGuaranteed",
      "agreeSelectionBasis",
      "agreeAccurate",
    ]);
  });

  it("keeps exactly three required persisted acknowledgments", () => {
    expect(AGREEMENTS).toHaveLength(3);
    expect(AGREEMENTS.map((agreement) => agreement.name)).toEqual([
      "agreeNotGuaranteed",
      "agreeSelectionBasis",
      "agreeAccurate",
    ]);
    expect(FORM_SOURCE).not.toContain("agreeNoUnauthorizedEvents");
    expect(FORM_SOURCE).toContain("AUTHORIZATION_NOTICE");
    expect(FORM_SOURCE).toContain("ctd-warning");
    expect(AUTHORIZATION_NOTICE).toContain("without written authorization from War Tournaments LLC");
    expect(FORM_SOURCE).toContain("{AGREEMENTS.map((agreement) => (");
    expect(FORM_SOURCE.match(/name=\{agreement\.name\}/g)).toHaveLength(1);
  });

  it("keeps the country and state lists used by the live form", () => {
    expect(COUNTRIES[0]).toBe(UNITED_STATES);
    expect(COUNTRIES).toContain("Canada");
    expect(COUNTRIES).toContain("Other");
    expect(COUNTRIES).toHaveLength(84);
    expect(US_STATES).toContain("Tennessee");
    expect(US_STATES).toContain("Northern Mariana Islands");
    expect(US_STATES).toHaveLength(56);
  });

  it("keeps the program slug, recaptcha action, and sport options", () => {
    expect(PROGRAM_SLUG).toBe("certified-tournament-director");
    expect(RECAPTCHA_ACTION).toBe("ctd_application");
    expect(SPORTS).toEqual([
      "Tennis",
      "Pickleball",
      "Padel",
      "Platform Tennis",
      "Other",
    ]);
  });

  it("still renders every existing application field", () => {
    for (const fieldId of [...REQUIRED_FIELD_IDS, ...OPTIONAL_FIELD_IDS]) {
      expect(FORM_SOURCE).toContain(`id="${fieldId}"`);
    }

    expect(FORM_SOURCE).toContain('name="territoryScope"');
    expect(FORM_SOURCE).toContain('name="sports"');
    expect(FORM_SOURCE).toContain('name="tournamentExperience"');
    expect(FORM_SOURCE).toContain('name="businessExperience"');
    expect(FORM_SOURCE).toContain('name="timeCommitment"');
    expect(FORM_SOURCE).toContain("agreeNotGuaranteed");
    expect(FORM_SOURCE).toContain("agreeSelectionBasis");
    expect(FORM_SOURCE).toContain("agreeAccurate");
  });

  it("keeps existing required fields required in the form markup", () => {
    const markupRequiredIds = REQUIRED_FIELD_IDS.filter((id) => id !== "country");
    for (const fieldId of markupRequiredIds) {
      const start = FORM_SOURCE.indexOf(`id="${fieldId}"`);
      const fieldBlock = FORM_SOURCE.slice(start, start + 280);
      expect(fieldBlock, fieldId).toMatch(/required/);
    }
  });

  it("still posts to the existing submission endpoint", () => {
    expect(FORM_SOURCE).toContain('fetch("/tournament-director/api/submit"');
    expect(FORM_SOURCE).toContain('method: "POST"');
    expect(FORM_SOURCE).toContain("recaptchaToken");
    expect(FORM_SOURCE).toContain("https://www.google.com/recaptcha/api.js?render=");
  });
});
