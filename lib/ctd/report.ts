import {
  AGREEMENTS,
  TERRITORY_SCOPES,
  formatTerritory,
  isUnitedStates,
  type CtdApplicationInput,
} from "./fields";

export type ReportSection = {
  title: string;
  rows: Array<{ label: string; value: string; multiline?: boolean }>;
};

const NOT_PROVIDED = "Not provided";

function text(value: string) {
  return value.trim() || NOT_PROVIDED;
}

function list(values: string[]) {
  return values.length ? values.join(", ") : NOT_PROVIDED;
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

/** Renders yyyy-mm-dd as a readable date without tripping over timezones. */
export function formatDate(value: string) {
  if (!value) return NOT_PROVIDED;

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatSubmittedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function territoryScopeLabel(scope: string) {
  return (
    TERRITORY_SCOPES.find((option) => option.value === scope)?.label ??
    NOT_PROVIDED
  );
}

export function applicantName(application: CtdApplicationInput) {
  return `${application.firstName} ${application.lastName}`.trim();
}

/**
 * The single description of an application used by the notification email and
 * the admin detail view, so both always show the same fields in the same order.
 */
export function buildReport(
  application: CtdApplicationInput,
): ReportSection[] {
  const usBased = isUnitedStates(application.country);

  const sections: ReportSection[] = [
    {
      title: "Basic Information",
      rows: [
        { label: "First Name", value: text(application.firstName) },
        { label: "Last Name", value: text(application.lastName) },
        { label: "Email Address", value: text(application.email) },
        { label: "Mobile Phone", value: text(application.mobilePhone) },
        { label: "City", value: text(application.city) },
        {
          label: usBased ? "State" : "State / Province / Region",
          value: text(usBased ? application.state : application.region),
        },
        { label: "Country", value: text(application.country) },
        {
          label: usBased ? "ZIP Code" : "Postal Code",
          value: text(application.zipCode),
        },
      ],
    },
    {
      title: "Territory Interest",
      rows: [
        {
          label: "Territory of Interest",
          value: text(formatTerritory(application.primaryTerritory)),
        },
        {
          label: "Interested In Managing",
          value: territoryScopeLabel(application.territoryScope),
        },
      ],
    },
    {
      title: "Racquet Sports Experience",
      rows: [
        { label: "Sports Played", value: list(application.sports) },
        { label: "Skill Level", value: text(application.skillLevel) },
        {
          label: "Clubs or Leagues",
          value: text(application.clubsLeagues),
          multiline: true,
        },
      ],
    },
    {
      title: "Tournament Experience",
      rows: [
        { label: "Experience", value: list(application.tournamentExperience) },
        {
          label: "Description",
          value: text(application.tournamentExperienceDetail),
          multiline: true,
        },
      ],
    },
    {
      title: "Professional Background",
      rows: [
        { label: "Current Employer", value: text(application.employer) },
        { label: "Current Position", value: text(application.position) },
        {
          label: "Years of Management Experience",
          value: text(application.yearsManagementExperience),
        },
        { label: "Industry", value: text(application.industry) },
        {
          label: "People Supervised",
          value: text(application.peopleSupervised),
        },
      ],
    },
    {
      title: "Business Experience",
      rows: [
        { label: "Experience", value: list(application.businessExperience) },
      ],
    },
    {
      title: "Time Commitment",
      rows: [
        {
          label: "Time Available",
          value: text(application.timeCommitment),
        },
      ],
    },
    {
      title: "Why Racquet War",
      rows: [
        {
          label: "Why they want to become a Certified Tournament Director",
          value: text(application.whyCtd),
          multiline: true,
        },
        {
          label: "Why they believe they would be successful",
          value: text(application.whySuccessful),
          multiline: true,
        },
      ],
    },
    {
      title: "Final Questions",
      rows: [
        { label: "How They Heard About RW", value: text(application.howHeard) },
        {
          label: "Could Begin Training",
          value: formatDate(application.trainingStartDate),
        },
        {
          label: "Anything Else",
          value: text(application.additionalInfo),
          multiline: true,
        },
      ],
    },
    {
      title: "Acknowledgements",
      rows: AGREEMENTS.map((agreement) => ({
        label: agreement.label,
        value: yesNo(application[agreement.name]),
      })),
    },
  ];

  if (application.sports.includes("Other") && application.sportOther) {
    const sportsSection = sections.find(
      (section) => section.title === "Racquet Sports Experience",
    );
    sportsSection?.rows.splice(1, 0, {
      label: "Other Sport",
      value: application.sportOther,
    });
  }

  if (application.additionalTerritories.length) {
    const territorySection = sections.find(
      (section) => section.title === "Territory Interest",
    );
    territorySection?.rows.push({
      label: "Additional Territories",
      value: application.additionalTerritories
        .map(formatTerritory)
        .filter(Boolean)
        .join("\n"),
      multiline: true,
    });
  }

  return sections;
}
