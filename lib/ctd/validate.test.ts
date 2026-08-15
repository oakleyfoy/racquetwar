import { describe, expect, it } from "vitest";

import { validateApplication } from "./validate";
import { VALID_SUBMIT_BODY, validApplication } from "./test-fixtures";

describe("validateApplication", () => {
  it("accepts a complete application with the three stored acknowledgments", () => {
    const result = validateApplication(VALID_SUBMIT_BODY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.firstName).toBe("Jordan");
      expect(result.value.email).toBe("jordan.lee@example.com");
      expect(result.value.agreeNotGuaranteed).toBe(true);
      expect(result.value.agreeSelectionBasis).toBe(true);
      expect(result.value.agreeAccurate).toBe(true);
      expect(result.value).not.toHaveProperty("agreeNoUnauthorizedEvents");
    }
  });

  it("still requires the original identity and location fields", () => {
    expect(validateApplication(validApplication({ firstName: "" })).ok).toBe(false);
    expect(validateApplication(validApplication({ lastName: "" })).ok).toBe(false);
    expect(validateApplication(validApplication({ email: "not-an-email" })).ok).toBe(
      false,
    );
    expect(validateApplication(validApplication({ mobilePhone: "" })).ok).toBe(false);
    expect(validateApplication(validApplication({ city: "" })).ok).toBe(false);
    expect(validateApplication(validApplication({ zipCode: "" })).ok).toBe(false);
    expect(
      validateApplication(validApplication({ state: "", country: "United States" })).ok,
    ).toBe(false);
  });

  it("still requires a primary territory and territory scope", () => {
    const missingCity = validateApplication(
      validApplication({
        primaryTerritory: {
          city: "",
          country: "United States",
          state: "Tennessee",
          region: "",
        },
      }),
    );
    expect(missingCity.ok).toBe(false);

    const missingScope = validateApplication(validApplication({ territoryScope: "" }));
    expect(missingScope.ok).toBe(false);
  });

  it("still requires the three stored acknowledgements", () => {
    const result = validateApplication({
      ...VALID_SUBMIT_BODY,
      agreeAccurate: false,
    });
    expect(result).toEqual({
      ok: false,
      error: "Please confirm all three acknowledgements before submitting.",
    });
  });

  it("does not require a fourth unstored acknowledgment", () => {
    const result = validateApplication({
      ...validApplication(),
      agreeNoUnauthorizedEvents: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("agreeNoUnauthorizedEvents");
    }
  });

  it("does not invent or rename stored application fields", () => {
    const result = validateApplication(VALID_SUBMIT_BODY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(Object.keys(result.value).sort()).toEqual(
      [
        "additionalInfo",
        "additionalTerritories",
        "agreeAccurate",
        "agreeNotGuaranteed",
        "agreeSelectionBasis",
        "businessExperience",
        "city",
        "clubsLeagues",
        "country",
        "email",
        "employer",
        "firstName",
        "howHeard",
        "industry",
        "lastName",
        "mobilePhone",
        "peopleSupervised",
        "position",
        "primaryTerritory",
        "region",
        "skillLevel",
        "sportOther",
        "sports",
        "state",
        "territoryScope",
        "timeCommitment",
        "tournamentExperience",
        "tournamentExperienceDetail",
        "trainingStartDate",
        "whyCtd",
        "whySuccessful",
        "yearsManagementExperience",
        "zipCode",
      ].sort(),
    );
  });
});
