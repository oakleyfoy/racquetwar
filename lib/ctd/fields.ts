/**
 * Canonical option lists and types for the Certified Tournament Director
 * application. The form UI, validation, database layer, notification email and
 * CSV export all read from here so the wording can only be changed in one place.
 */

export const PROGRAM_SLUG = "certified-tournament-director";

/** Shared by the browser (token generation) and the server (token verification). */
export const RECAPTCHA_ACTION = "ctd_application";

export const PROGRAM_TITLE =
  "Apply to Become an RW Certified Tournament Director";

export const PROGRAM_SUBTITLE =
  "War Tournaments LLC is selecting an initial national group of 5–8 candidates to develop and operate professionally supported Racquet War events in their local markets.";

export const UNITED_STATES = "United States";

export const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "Puerto Rico",
  "Guam",
  "U.S. Virgin Islands",
  "American Samoa",
  "Northern Mariana Islands",
] as const;

/**
 * United States and Canada are pinned to the top because they are the launch
 * markets; everything after them is alphabetical.
 */
export const COUNTRIES = [
  UNITED_STATES,
  "Canada",
  "Argentina",
  "Australia",
  "Austria",
  "Bahamas",
  "Bahrain",
  "Barbados",
  "Belgium",
  "Bermuda",
  "Brazil",
  "Bulgaria",
  "Cayman Islands",
  "Chile",
  "China",
  "Colombia",
  "Costa Rica",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Guatemala",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kenya",
  "Kuwait",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Malta",
  "Mexico",
  "Monaco",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Saudi Arabia",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Thailand",
  "Trinidad and Tobago",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "Uruguay",
  "Venezuela",
  "Vietnam",
  "Other",
] as const;

export const SPORTS = [
  "Tennis",
  "Pickleball",
  "Padel",
  "Platform Tennis",
  "Other",
] as const;

export const SPORT_OTHER = "Other";

export const SKILL_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Competitive",
  "Teaching Professional",
] as const;

export const TERRITORY_SCOPES = [
  { value: "one", label: "One territory" },
  { value: "multiple", label: "Multiple territories" },
  { value: "unsure", label: "Not sure yet" },
] as const;

export type TerritoryScope = (typeof TERRITORY_SCOPES)[number]["value"];

export const TOURNAMENT_EXPERIENCE_OPTIONS = [
  "Directed tournaments",
  "Organized leagues",
  "Organized events",
  "Managed volunteers",
  "Worked at sporting events",
  "None of the above",
] as const;

/** Selecting this clears every other option in the group, and vice versa. */
export const TOURNAMENT_EXPERIENCE_NONE = "None of the above";

export const BUSINESS_EXPERIENCE_OPTIONS = [
  "Owned a business",
  "Managed a business",
  "Managed a budget",
  "Sold sponsorships",
  "Managed employees",
  "Worked in sales",
  "Marketing",
  "Customer Service",
] as const;

export const SUPERVISED_COUNTS = ["0", "1–5", "6–20", "21–50", "50+"] as const;

export const TIME_COMMITMENTS = [
  "Full Time",
  "25+ hours/week",
  "15–25 hours/week",
  "5–15 hours/week",
  "Seasonal only",
] as const;

export const HOW_HEARD_OPTIONS = [
  "Referral",
  "Facebook",
  "Instagram",
  "Website",
  "Friend",
  "Teaching Pro",
  "Club",
  "Google",
  "Email",
  "Text Message",
  "Other",
] as const;

export const AGREEMENTS = [
  {
    name: "agreeNotGuaranteed",
    label:
      "I understand this is an application to join the RW Certified Tournament Director Program and does not guarantee acceptance or certification.",
  },
  {
    name: "agreeSelectionBasis",
    label:
      "I understand that certification, events, compensation and territory are not guaranteed and require written approval from War Tournaments LLC.",
  },
  {
    name: "agreeAccurate",
    label:
      "I certify that the information provided in this application is accurate.",
  },
] as const;

export type AgreementName = (typeof AGREEMENTS)[number]["name"];

/** Informational only. Not a checkbox and not a stored field. */
export const AUTHORIZATION_NOTICE =
  "Candidates may not announce, market, register players for, collect money for or operate a Racquet War event without written authorization from War Tournaments LLC.";

export const SELECTION_NOTICE =
  "War Tournaments LLC is selecting an initial national group of 5–8 candidates for the RW Certified Tournament Director Program. Acceptance is competitive. Only candidates who demonstrate strong leadership, professionalism, local-market potential and a commitment to delivering an exceptional player experience will be invited into the program.";

export const APPLICATION_STATUSES = [
  "new",
  "contacted",
  "interviewing",
  "approved",
  "declined",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interviewing: "Interviewing",
  approved: "Approved",
  declined: "Declined",
};

/** A territory an applicant wants to run events in. */
export type Territory = {
  city: string;
  country: string;
  /** Populated when country is the United States. */
  state: string;
  /** Free text used in place of `state` outside the United States. */
  region: string;
};

export const EMPTY_TERRITORY: Territory = {
  city: "",
  country: UNITED_STATES,
  state: "",
  region: "",
};

/** The full application payload, shared by the client form and the API route. */
export type CtdApplicationInput = {
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  city: string;
  country: string;
  state: string;
  region: string;
  zipCode: string;

  primaryTerritory: Territory;
  territoryScope: TerritoryScope | "";
  additionalTerritories: Territory[];

  sports: string[];
  sportOther: string;
  skillLevel: string;
  clubsLeagues: string;

  tournamentExperience: string[];
  tournamentExperienceDetail: string;

  employer: string;
  position: string;
  yearsManagementExperience: string;
  industry: string;
  peopleSupervised: string;

  businessExperience: string[];

  timeCommitment: string;

  whyCtd: string;
  whySuccessful: string;

  howHeard: string;
  trainingStartDate: string;
  additionalInfo: string;

  agreeNotGuaranteed: boolean;
  agreeSelectionBasis: boolean;
  agreeAccurate: boolean;
};

/** A stored application, as returned from Postgres. */
export type CtdApplicationRecord = CtdApplicationInput & {
  id: string;
  program: string;
  submittedAt: string;
  status: ApplicationStatus;
  adminNotes: string;
  sourcePage: string;
};

export function isUnitedStates(country: string) {
  return country === UNITED_STATES;
}

/** Renders a territory as a single human readable line. */
export function formatTerritory(territory: Territory) {
  const area = isUnitedStates(territory.country)
    ? territory.state
    : territory.region;

  return [territory.city, area, territory.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}
