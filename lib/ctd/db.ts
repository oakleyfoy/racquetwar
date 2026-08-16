import { Pool } from "pg";

import { PORTAL_SCHEMA_SQL } from "./portal-schema";

/**
 * Next.js reloads modules in development and can run multiple server instances,
 * so the pool and the schema bootstrap are cached on globalThis to avoid opening
 * a new pool on every reload.
 */
const globalForDb = globalThis as unknown as {
  ctdPool?: Pool;
  ctdSchemaReady?: Promise<void>;
};

function requireConnectionString() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local for local development or to the Render service environment.",
    );
  }

  return connectionString;
}

/**
 * Render's managed Postgres requires TLS over its external hostname but not
 * over its internal one, and local Postgres usually has none. `DATABASE_SSL`
 * overrides the guess when needed.
 */
function shouldUseSsl(connectionString: string) {
  const override = process.env.DATABASE_SSL;
  if (override === "true") return true;
  if (override === "false") return false;

  return !/@(localhost|127\.0\.0\.1)/.test(connectionString);
}

export function getPool() {
  if (!globalForDb.ctdPool) {
    const connectionString = requireConnectionString();

    globalForDb.ctdPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: shouldUseSsl(connectionString)
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return globalForDb.ctdPool;
}

const SCHEMA_SQL = `
create table if not exists ctd_applications (
  id uuid primary key default gen_random_uuid(),
  program text not null default 'certified-tournament-director',
  submitted_at timestamptz not null default now(),

  first_name text not null,
  last_name text not null,
  email text not null,
  mobile_phone text not null,
  city text not null,
  country text not null,
  state text,
  region text,
  zip_code text not null,

  primary_territory jsonb not null default '{}'::jsonb,
  territory_scope text,
  additional_territories jsonb not null default '[]'::jsonb,

  sports text[] not null default '{}',
  sport_other text,
  skill_level text,
  clubs_leagues text,

  tournament_experience text[] not null default '{}',
  tournament_experience_detail text,

  employer text,
  position text,
  years_management_experience text,
  industry text,
  people_supervised text,

  business_experience text[] not null default '{}',

  time_commitment text,

  why_ctd text,
  why_successful text,

  how_heard text,
  training_start_date date,
  additional_info text,

  agree_not_guaranteed boolean not null default false,
  agree_selection_basis boolean not null default false,
  agree_accurate boolean not null default false,

  status text not null default 'new',
  admin_notes text not null default '',
  source_page text not null default '',
  ip_hash text
);

create index if not exists ctd_applications_submitted_at_idx
  on ctd_applications (submitted_at desc);
create index if not exists ctd_applications_status_idx
  on ctd_applications (status);
create index if not exists ctd_applications_email_idx
  on ctd_applications (email);

create table if not exists ctd_application_workflows (
  application_id uuid primary key references ctd_applications(id) on delete cascade,
  current_status text not null default 'new',
  assigned_to text not null default '',
  next_action text not null default '',
  next_follow_up_at timestamptz,
  screening_scheduled_at timestamptz,
  screening_timezone text not null default '',
  screening_method text not null default '',
  screening_location_or_link text not null default '',
  screening_outcome text not null default '',
  screening_summary text not null default '',
  recommended_next_step text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ctd_application_workflows_status_idx
  on ctd_application_workflows (current_status);
create index if not exists ctd_application_workflows_follow_up_idx
  on ctd_application_workflows (next_follow_up_at);
create index if not exists ctd_application_workflows_screening_idx
  on ctd_application_workflows (screening_scheduled_at);

create table if not exists ctd_application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references ctd_applications(id) on delete cascade,
  note text not null,
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ctd_application_notes_application_idx
  on ctd_application_notes (application_id, created_at desc);

create table if not exists ctd_application_follow_ups (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references ctd_applications(id) on delete cascade,
  action_description text not null,
  due_at timestamptz,
  completed_at timestamptz,
  assigned_to text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ctd_application_follow_ups_application_idx
  on ctd_application_follow_ups (application_id, created_at desc);
create index if not exists ctd_application_follow_ups_due_idx
  on ctd_application_follow_ups (due_at)
  where completed_at is null;

create table if not exists ctd_application_activities (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references ctd_applications(id) on delete cascade,
  activity_type text not null,
  previous_value text,
  new_value text,
  description text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ctd_application_activities_application_idx
  on ctd_application_activities (application_id, created_at desc);
`

/**
 * Applies the schema on first use. Cached as a single promise so concurrent
 * requests during a cold start do not race each other.
 */
export function ensureSchema() {
  if (!globalForDb.ctdSchemaReady) {
    globalForDb.ctdSchemaReady = getPool()
      .query(`${SCHEMA_SQL}\n${PORTAL_SCHEMA_SQL}`)
      .then(() => undefined)
      .catch((error) => {
        // Clear the cache so a transient failure does not poison every later request.
        globalForDb.ctdSchemaReady = undefined;
        throw error;
      });
  }

  return globalForDb.ctdSchemaReady;
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
) {
  await ensureSchema();
  return getPool().query<T>(text, params);
}

export async function withTransaction<T>(
  work: (client: {
    query: typeof query;
  }) => Promise<T>,
) {
  await ensureSchema();
  const client = await getPool().connect();

  try {
    await client.query("begin");
    const result = await work({
      query: (text, params = []) => client.query(text, params),
    });
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
