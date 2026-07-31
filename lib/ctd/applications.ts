import { query } from "./db";
import {
  APPLICATION_STATUSES,
  PROGRAM_SLUG,
  formatTerritory,
  type ApplicationStatus,
  type CtdApplicationInput,
  type CtdApplicationRecord,
  type Territory,
  type TerritoryScope,
} from "./fields";

type ApplicationRow = {
  id: string;
  program: string;
  submitted_at: Date;
  first_name: string;
  last_name: string;
  email: string;
  mobile_phone: string;
  city: string;
  country: string;
  state: string | null;
  region: string | null;
  zip_code: string;
  primary_territory: Territory | null;
  territory_scope: string | null;
  additional_territories: Territory[] | null;
  sports: string[] | null;
  sport_other: string | null;
  skill_level: string | null;
  clubs_leagues: string | null;
  tournament_experience: string[] | null;
  tournament_experience_detail: string | null;
  employer: string | null;
  position: string | null;
  years_management_experience: string | null;
  industry: string | null;
  people_supervised: string | null;
  business_experience: string[] | null;
  time_commitment: string | null;
  why_ctd: string | null;
  why_successful: string | null;
  how_heard: string | null;
  training_start_date: string | null;
  additional_info: string | null;
  agree_not_guaranteed: boolean;
  agree_selection_basis: boolean;
  agree_accurate: boolean;
  status: string;
  admin_notes: string | null;
  source_page: string | null;
  [key: string]: unknown;
};

/** `training_start_date` is cast in SQL so node-postgres cannot shift it by a timezone. */
const SELECT_COLUMNS = `
  id, program, submitted_at, first_name, last_name, email, mobile_phone,
  city, country, state, region, zip_code,
  primary_territory, territory_scope, additional_territories,
  sports, sport_other, skill_level, clubs_leagues,
  tournament_experience, tournament_experience_detail,
  employer, position, years_management_experience, industry, people_supervised,
  business_experience, time_commitment, why_ctd, why_successful,
  how_heard, to_char(training_start_date, 'YYYY-MM-DD') as training_start_date,
  additional_info, agree_not_guaranteed, agree_selection_basis, agree_accurate,
  status, admin_notes, source_page
`;

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

function mapRow(row: ApplicationRow): CtdApplicationRecord {
  return {
    id: row.id,
    program: row.program,
    submittedAt: row.submitted_at.toISOString(),
    status: isApplicationStatus(row.status) ? row.status : "new",
    adminNotes: row.admin_notes ?? "",
    sourcePage: row.source_page ?? "",

    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    mobilePhone: row.mobile_phone,
    city: row.city,
    country: row.country,
    state: row.state ?? "",
    region: row.region ?? "",
    zipCode: row.zip_code,

    primaryTerritory: row.primary_territory ?? {
      city: "",
      country: row.country,
      state: "",
      region: "",
    },
    territoryScope: (row.territory_scope ?? "") as TerritoryScope | "",
    additionalTerritories: row.additional_territories ?? [],

    sports: row.sports ?? [],
    sportOther: row.sport_other ?? "",
    skillLevel: row.skill_level ?? "",
    clubsLeagues: row.clubs_leagues ?? "",

    tournamentExperience: row.tournament_experience ?? [],
    tournamentExperienceDetail: row.tournament_experience_detail ?? "",

    employer: row.employer ?? "",
    position: row.position ?? "",
    yearsManagementExperience: row.years_management_experience ?? "",
    industry: row.industry ?? "",
    peopleSupervised: row.people_supervised ?? "",

    businessExperience: row.business_experience ?? [],
    timeCommitment: row.time_commitment ?? "",

    whyCtd: row.why_ctd ?? "",
    whySuccessful: row.why_successful ?? "",

    howHeard: row.how_heard ?? "",
    trainingStartDate: row.training_start_date ?? "",
    additionalInfo: row.additional_info ?? "",

    agreeNotGuaranteed: row.agree_not_guaranteed,
    agreeSelectionBasis: row.agree_selection_basis,
    agreeAccurate: row.agree_accurate,
  };
}

export async function insertApplication(
  input: CtdApplicationInput,
  meta: { sourcePage?: string; ipHash?: string } = {},
) {
  const result = await query<{ id: string; submitted_at: Date }>(
    `insert into ctd_applications (
      program, first_name, last_name, email, mobile_phone, city, country,
      state, region, zip_code, primary_territory, territory_scope,
      additional_territories, sports, sport_other, skill_level, clubs_leagues,
      tournament_experience, tournament_experience_detail, employer, position,
      years_management_experience, industry, people_supervised,
      business_experience, time_commitment, why_ctd, why_successful, how_heard,
      training_start_date, additional_info, agree_not_guaranteed,
      agree_selection_basis, agree_accurate, source_page, ip_hash
    ) values (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11::jsonb, $12,
      $13::jsonb, $14, $15, $16, $17,
      $18, $19, $20, $21,
      $22, $23, $24,
      $25, $26, $27, $28, $29,
      nullif($30, '')::date, $31, $32,
      $33, $34, $35, $36
    ) returning id, submitted_at`,
    [
      PROGRAM_SLUG,
      input.firstName,
      input.lastName,
      input.email,
      input.mobilePhone,
      input.city,
      input.country,
      input.state,
      input.region,
      input.zipCode,
      JSON.stringify(input.primaryTerritory),
      input.territoryScope,
      JSON.stringify(input.additionalTerritories),
      input.sports,
      input.sportOther,
      input.skillLevel,
      input.clubsLeagues,
      input.tournamentExperience,
      input.tournamentExperienceDetail,
      input.employer,
      input.position,
      input.yearsManagementExperience,
      input.industry,
      input.peopleSupervised,
      input.businessExperience,
      input.timeCommitment,
      input.whyCtd,
      input.whySuccessful,
      input.howHeard,
      input.trainingStartDate,
      input.additionalInfo,
      input.agreeNotGuaranteed,
      input.agreeSelectionBasis,
      input.agreeAccurate,
      meta.sourcePage ?? "",
      meta.ipHash ?? null,
    ],
  );

  return {
    id: result.rows[0].id,
    submittedAt: result.rows[0].submitted_at.toISOString(),
  };
}

export type ApplicationFilters = {
  status?: string;
  search?: string;
};

export async function listApplications(filters: ApplicationFilters = {}) {
  const conditions: string[] = ["program = $1"];
  const params: unknown[] = [PROGRAM_SLUG];

  if (filters.status && isApplicationStatus(filters.status)) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    const index = params.length;
    conditions.push(`(
      lower(first_name || ' ' || last_name) like $${index}
      or lower(email) like $${index}
      or lower(coalesce(state, '')) like $${index}
      or lower(coalesce(region, '')) like $${index}
      or lower(city) like $${index}
      or lower(coalesce(primary_territory ->> 'city', '')) like $${index}
    )`);
  }

  const result = await query<ApplicationRow>(
    `select ${SELECT_COLUMNS} from ctd_applications
     where ${conditions.join(" and ")}
     order by submitted_at desc
     limit 1000`,
    params,
  );

  return result.rows.map(mapRow);
}

export async function getApplication(id: string) {
  const result = await query<ApplicationRow>(
    `select ${SELECT_COLUMNS} from ctd_applications where id = $1`,
    [id],
  );

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function updateApplication(
  id: string,
  updates: { status?: string; adminNotes?: string },
) {
  const status =
    updates.status && isApplicationStatus(updates.status)
      ? updates.status
      : null;

  await query(
    `update ctd_applications
     set status = coalesce($2, status),
         admin_notes = coalesce($3, admin_notes)
     where id = $1`,
    [id, status, updates.adminNotes ?? null],
  );
}

/** Permanently removes one row. Scoped to this program so ids cannot cross forms. */
export async function deleteApplication(id: string): Promise<boolean> {
  const result = await query(
    `delete from ctd_applications where id = $1 and program = $2`,
    [id, PROGRAM_SLUG],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function countByStatus() {
  const result = await query<{ status: string; count: string }>(
    `select status, count(*)::text as count
     from ctd_applications
     where program = $1
     group by status`,
    [PROGRAM_SLUG],
  );

  const counts: Record<string, number> = {};
  for (const row of result.rows) {
    counts[row.status] = Number(row.count);
  }

  return counts;
}

const CSV_COLUMNS: Array<[string, (record: CtdApplicationRecord) => string]> = [
  ["Submitted", (r) => r.submittedAt],
  ["Status", (r) => r.status],
  ["First Name", (r) => r.firstName],
  ["Last Name", (r) => r.lastName],
  ["Email", (r) => r.email],
  ["Mobile Phone", (r) => r.mobilePhone],
  ["City", (r) => r.city],
  ["State/Region", (r) => r.state || r.region],
  ["Country", (r) => r.country],
  ["ZIP/Postal Code", (r) => r.zipCode],
  ["Primary Territory", (r) => formatTerritory(r.primaryTerritory)],
  ["Territory Scope", (r) => r.territoryScope],
  [
    "Additional Territories",
    (r) => r.additionalTerritories.map(formatTerritory).join(" | "),
  ],
  ["Sports", (r) => r.sports.join(", ")],
  ["Other Sport", (r) => r.sportOther],
  ["Skill Level", (r) => r.skillLevel],
  ["Clubs/Leagues", (r) => r.clubsLeagues],
  ["Tournament Experience", (r) => r.tournamentExperience.join(", ")],
  ["Tournament Experience Detail", (r) => r.tournamentExperienceDetail],
  ["Employer", (r) => r.employer],
  ["Position", (r) => r.position],
  ["Years Management Experience", (r) => r.yearsManagementExperience],
  ["Industry", (r) => r.industry],
  ["People Supervised", (r) => r.peopleSupervised],
  ["Business Experience", (r) => r.businessExperience.join(", ")],
  ["Time Commitment", (r) => r.timeCommitment],
  ["Why CTD", (r) => r.whyCtd],
  ["Why Successful", (r) => r.whySuccessful],
  ["How Heard", (r) => r.howHeard],
  ["Training Start Date", (r) => r.trainingStartDate],
  ["Additional Info", (r) => r.additionalInfo],
  ["Admin Notes", (r) => r.adminNotes],
];

/**
 * A leading apostrophe, plus, equals, minus or at sign makes Excel treat a cell
 * as a formula, so those values get prefixed with a single quote.
 */
function escapeCsvCell(value: string) {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replaceAll('"', '""')}"`;
}

export function toCsv(records: CtdApplicationRecord[]) {
  const header = CSV_COLUMNS.map(([label]) => escapeCsvCell(label)).join(",");
  const rows = records.map((record) =>
    CSV_COLUMNS.map(([, accessor]) => escapeCsvCell(accessor(record) ?? "")).join(
      ",",
    ),
  );

  return [header, ...rows].join("\r\n");
}
