import type { CtdApplicationInput } from "./fields";

/** A complete valid payload for validation and submit-route tests. */
export function validApplication(
  overrides: Partial<CtdApplicationInput> = {},
): CtdApplicationInput {
  return {
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan.lee@example.com",
    mobilePhone: "9015550100",
    city: "Memphis",
    country: "United States",
    state: "Tennessee",
    region: "",
    zipCode: "38103",
    primaryTerritory: {
      city: "Memphis",
      country: "United States",
      state: "Tennessee",
      region: "",
    },
    territoryScope: "one",
    additionalTerritories: [],
    sports: ["Tennis"],
    sportOther: "",
    skillLevel: "Advanced",
    clubsLeagues: "",
    tournamentExperience: ["Directed tournaments"],
    tournamentExperienceDetail: "",
    employer: "",
    position: "",
    yearsManagementExperience: "",
    industry: "",
    peopleSupervised: "",
    businessExperience: [],
    timeCommitment: "15–25 hours/week",
    whyCtd: "",
    whySuccessful: "",
    howHeard: "",
    trainingStartDate: "",
    additionalInfo: "",
    agreeNotGuaranteed: true,
    agreeSelectionBasis: true,
    agreeAccurate: true,
    ...overrides,
  };
}

export const VALID_SUBMIT_BODY = {
  ...validApplication(),
  company: "",
  recaptchaToken: "test-token",
};
