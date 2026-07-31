import { Pool } from "pg";

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
`;

/**
 * Applies the schema on first use. Cached as a single promise so concurrent
 * requests during a cold start do not race each other.
 */
export function ensureSchema() {
  if (!globalForDb.ctdSchemaReady) {
    globalForDb.ctdSchemaReady = getPool()
      .query(SCHEMA_SQL)
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

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
