import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const APPLICATIONS_SOURCE = readFileSync(
  resolve(process.cwd(), "lib/ctd/applications.ts"),
  "utf8",
);
const SCHEMA_SOURCE = readFileSync(resolve(process.cwd(), "lib/ctd/db.ts"), "utf8");

const STORED_COLUMNS = [
  "program",
  "first_name",
  "last_name",
  "email",
  "mobile_phone",
  "city",
  "country",
  "state",
  "region",
  "zip_code",
  "primary_territory",
  "territory_scope",
  "additional_territories",
  "sports",
  "sport_other",
  "skill_level",
  "clubs_leagues",
  "tournament_experience",
  "tournament_experience_detail",
  "employer",
  "position",
  "years_management_experience",
  "industry",
  "people_supervised",
  "business_experience",
  "time_commitment",
  "why_ctd",
  "why_successful",
  "how_heard",
  "training_start_date",
  "additional_info",
  "agree_not_guaranteed",
  "agree_selection_basis",
  "agree_accurate",
  "source_page",
  "ip_hash",
];

describe("application database mappings", () => {
  it("inserts the same production columns and does not rename them", () => {
    for (const column of STORED_COLUMNS) {
      expect(APPLICATIONS_SOURCE).toContain(column);
    }

    expect(APPLICATIONS_SOURCE).not.toContain("agree_no_unauthorized");
    expect(APPLICATIONS_SOURCE).not.toContain("agreeNoUnauthorizedEvents");
  });

  it("bootstraps the existing table and does not alter production rows", () => {
    expect(SCHEMA_SOURCE).toContain("create table if not exists ctd_applications");
    expect(SCHEMA_SOURCE).toContain("agree_not_guaranteed boolean not null default false");
    expect(SCHEMA_SOURCE).toContain("agree_selection_basis boolean not null default false");
    expect(SCHEMA_SOURCE).toContain("agree_accurate boolean not null default false");
    expect(SCHEMA_SOURCE).not.toMatch(/\balter table\b/i);
    expect(SCHEMA_SOURCE).not.toMatch(/\bupdate ctd_applications\b/i);
    expect(SCHEMA_SOURCE).not.toMatch(/\bdelete from ctd_applications\b/i);
  });
});
