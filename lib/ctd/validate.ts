import {
  AGREEMENTS,
  BUSINESS_EXPERIENCE_OPTIONS,
  COUNTRIES,
  EMPTY_TERRITORY,
  HOW_HEARD_OPTIONS,
  SKILL_LEVELS,
  SPORTS,
  SUPERVISED_COUNTS,
  TERRITORY_SCOPES,
  TIME_COMMITMENTS,
  TOURNAMENT_EXPERIENCE_NONE,
  TOURNAMENT_EXPERIENCE_OPTIONS,
  UNITED_STATES,
  US_STATES,
  isUnitedStates,
  type CtdApplicationInput,
  type Territory,
  type TerritoryScope,
} from "./fields";

const SHORT = 200;
const LONG = 5000;
const MAX_ADDITIONAL_TERRITORIES = 25;

export type ValidationResult =
  | { ok: true; value: CtdApplicationInput }
  | { ok: false; error: string };

function clean(value: unknown, maxLength = SHORT) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanBoolean(value: unknown) {
  return value === true || value === "true" || value === "on";
}

/** Keeps only values that appear in the canonical option list. */
function cleanChoices(value: unknown, allowed: readonly string[]) {
  if (!Array.isArray(value)) return [];
  const permitted = new Set(allowed);
  return Array.from(
    new Set(
      value
        .map((entry) => clean(entry))
        .filter((entry) => permitted.has(entry)),
    ),
  );
}

function cleanChoice(value: unknown, allowed: readonly string[]) {
  const candidate = clean(value);
  return allowed.includes(candidate) ? candidate : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Accepts an empty string or a yyyy-mm-dd date that is a real calendar day. */
function cleanDate(value: unknown) {
  const candidate = clean(value, 10);
  if (!candidate) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return "";

  const parsed = new Date(`${candidate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  if (parsed.toISOString().slice(0, 10) !== candidate) return "";

  return candidate;
}

function cleanTerritory(value: unknown): Territory {
  const source = (value ?? {}) as Record<string, unknown>;
  const country = cleanChoice(source.country, COUNTRIES) || UNITED_STATES;

  return {
    city: clean(source.city),
    country,
    state: isUnitedStates(country) ? cleanChoice(source.state, US_STATES) : "",
    region: isUnitedStates(country) ? "" : clean(source.region),
  };
}

function territoryArea(territory: Territory) {
  return isUnitedStates(territory.country) ? territory.state : territory.region;
}

function hasTerritoryContent(territory: Territory) {
  return Boolean(territory.city || territoryArea(territory));
}

/**
 * Normalizes an untrusted request body into a complete application, rejecting
 * anything that fails a required-field or option-list check.
 */
export function validateApplication(body: unknown): ValidationResult {
  const source = (body ?? {}) as Record<string, unknown>;

  const country = cleanChoice(source.country, COUNTRIES) || UNITED_STATES;
  const usBased = isUnitedStates(country);

  const territoryScope = cleanChoice(
    source.territoryScope,
    TERRITORY_SCOPES.map((scope) => scope.value),
  ) as TerritoryScope | "";

  const primaryTerritory = cleanTerritory(source.primaryTerritory);

  const additionalTerritories =
    territoryScope === "multiple" && Array.isArray(source.additionalTerritories)
      ? source.additionalTerritories
          .slice(0, MAX_ADDITIONAL_TERRITORIES)
          .map(cleanTerritory)
          .filter(hasTerritoryContent)
      : [];

  const sports = cleanChoices(source.sports, SPORTS);

  const tournamentExperienceRaw = cleanChoices(
    source.tournamentExperience,
    TOURNAMENT_EXPERIENCE_OPTIONS,
  );

  // "None of the above" is exclusive, so it wins if it somehow arrives alongside others.
  const tournamentExperience = tournamentExperienceRaw.includes(
    TOURNAMENT_EXPERIENCE_NONE,
  )
    ? [TOURNAMENT_EXPERIENCE_NONE]
    : tournamentExperienceRaw;

  const value: CtdApplicationInput = {
    firstName: clean(source.firstName),
    lastName: clean(source.lastName),
    email: clean(source.email).toLowerCase(),
    mobilePhone: clean(source.mobilePhone, 40),
    city: clean(source.city),
    country,
    state: usBased ? cleanChoice(source.state, US_STATES) : "",
    region: usBased ? "" : clean(source.region),
    zipCode: clean(source.zipCode, 20),

    primaryTerritory,
    territoryScope,
    additionalTerritories,

    sports,
    sportOther: sports.includes("Other") ? clean(source.sportOther) : "",
    skillLevel: cleanChoice(source.skillLevel, SKILL_LEVELS),
    clubsLeagues: clean(source.clubsLeagues, LONG),

    tournamentExperience,
    tournamentExperienceDetail: clean(source.tournamentExperienceDetail, LONG),

    employer: clean(source.employer),
    position: clean(source.position),
    yearsManagementExperience: clean(source.yearsManagementExperience, 20),
    industry: clean(source.industry),
    peopleSupervised: cleanChoice(source.peopleSupervised, SUPERVISED_COUNTS),

    businessExperience: cleanChoices(
      source.businessExperience,
      BUSINESS_EXPERIENCE_OPTIONS,
    ),

    timeCommitment: cleanChoice(source.timeCommitment, TIME_COMMITMENTS),

    whyCtd: clean(source.whyCtd, LONG),
    whySuccessful: clean(source.whySuccessful, LONG),

    howHeard: cleanChoice(source.howHeard, HOW_HEARD_OPTIONS),
    trainingStartDate: cleanDate(source.trainingStartDate),
    additionalInfo: clean(source.additionalInfo, LONG),

    agreeNotGuaranteed: cleanBoolean(source.agreeNotGuaranteed),
    agreeSelectionBasis: cleanBoolean(source.agreeSelectionBasis),
    agreeAccurate: cleanBoolean(source.agreeAccurate),
  };

  if (!value.firstName) return { ok: false, error: "Please enter your first name." };
  if (!value.lastName) return { ok: false, error: "Please enter your last name." };
  if (!isValidEmail(value.email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!value.mobilePhone) {
    return { ok: false, error: "Please enter your mobile phone number." };
  }
  if (!value.city) return { ok: false, error: "Please enter your city." };
  if (usBased && !value.state) {
    return { ok: false, error: "Please select your state." };
  }
  if (!usBased && !value.region) {
    return { ok: false, error: "Please enter your state, province, or region." };
  }
  if (!value.zipCode) {
    return {
      ok: false,
      error: usBased
        ? "Please enter your ZIP code."
        : "Please enter your postal code.",
    };
  }

  if (!value.primaryTerritory.city || !territoryArea(value.primaryTerritory)) {
    return {
      ok: false,
      error: "Please tell us which territory you are interested in.",
    };
  }

  if (!value.territoryScope) {
    return {
      ok: false,
      error: "Please tell us whether you are interested in one or multiple territories.",
    };
  }

  const missingAgreement = AGREEMENTS.find((agreement) => !value[agreement.name]);
  if (missingAgreement) {
    return {
      ok: false,
      error: "Please confirm all three acknowledgements before submitting.",
    };
  }

  return { ok: true, value };
}

export { EMPTY_TERRITORY };
