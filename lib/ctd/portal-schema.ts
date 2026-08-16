/** Additive Director portal tables. Never alter ctd_applications. */

export const PORTAL_SCHEMA_SQL = `
create table if not exists ctd_directors (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique references ctd_applications(id) on delete set null,
  email text not null,
  first_name text not null,
  last_name text not null,
  status text not null default 'active',
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deactivated_at timestamptz,
  deactivated_by text not null default ''
);

create unique index if not exists ctd_directors_email_idx
  on ctd_directors (lower(email));
create index if not exists ctd_directors_status_idx
  on ctd_directors (status);

create table if not exists ctd_director_login_tokens (
  id uuid primary key default gen_random_uuid(),
  director_id uuid not null references ctd_directors(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ctd_director_login_tokens_director_idx
  on ctd_director_login_tokens (director_id, expires_at desc);

create table if not exists ctd_director_sessions (
  id uuid primary key default gen_random_uuid(),
  director_id uuid not null references ctd_directors(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ctd_director_sessions_director_idx
  on ctd_director_sessions (director_id, expires_at desc);

create table if not exists ctd_event_proposals (
  id uuid primary key default gen_random_uuid(),
  director_id uuid not null references ctd_directors(id) on delete restrict,
  current_status text not null default 'draft',
  current_version integer not null default 1,
  event_name text not null default '',
  sport text not null default '',
  sport_other text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  postal_code text not null default '',
  country text not null default '',
  facility_name text not null default '',
  facility_contact_name text not null default '',
  facility_contact_email text not null default '',
  facility_contact_phone text not null default '',
  primary_start_date date,
  primary_end_date date,
  alternate_start_date date,
  alternate_end_date date,
  court_count integer,
  court_setting text not null default '',
  event_format text not null default '',
  divisions text not null default '',
  estimated_players integer not null default 0,
  recommended_entry_fee_cents integer not null default 0,
  recommended_team_fee_cents integer not null default 0,
  market_opportunity text not null default '',
  local_relationships text not null default '',
  competing_events text not null default '',
  facility_terms text not null default '',
  additional_notes text not null default '',
  over_budget boolean not null default false,
  over_budget_explanation text not null default '',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ctd_event_proposals_director_idx
  on ctd_event_proposals (director_id, updated_at desc);
create index if not exists ctd_event_proposals_status_idx
  on ctd_event_proposals (current_status, submitted_at desc);

create table if not exists ctd_event_budget_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references ctd_event_proposals(id) on delete cascade,
  sort_order integer not null default 0,
  category text not null default '',
  vendor text not null default '',
  description text not null default '',
  quantity_hundredths integer not null default 100,
  unit_cents integer not null default 0,
  cost_type text not null default 'fixed',
  quote_reference text not null default '',
  explanation text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ctd_event_budget_items_proposal_idx
  on ctd_event_budget_items (proposal_id, sort_order);

create table if not exists ctd_event_proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references ctd_event_proposals(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  unique (proposal_id, version_number)
);

create table if not exists ctd_event_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references ctd_event_proposals(id) on delete cascade,
  name text not null,
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  unique (proposal_id, name)
);

create table if not exists ctd_event_authorizations (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references ctd_event_proposals(id) on delete cascade,
  reference_number text not null unique,
  authorized_event_name text not null,
  facility text not null,
  approved_dates text not null,
  approved_sport_format text not null,
  approved_budget_cents integer not null,
  approved_expense_per_player_cents integer not null,
  special_conditions text not null default '',
  authorized_by text not null,
  authorized_at timestamptz not null default now()
);

create table if not exists ctd_sponsorship_requests (
  id uuid primary key default gen_random_uuid(),
  director_id uuid not null references ctd_directors(id) on delete restrict,
  event_proposal_id uuid references ctd_event_proposals(id) on delete set null,
  current_status text not null default 'draft',
  current_version integer not null default 1,
  sponsor_name text not null default '',
  sponsor_contact_name text not null default '',
  sponsor_email text not null default '',
  sponsor_phone text not null default '',
  sponsor_website text not null default '',
  business_category text not null default '',
  territory text not null default '',
  stage text not null default '',
  start_date date,
  end_date date,
  cash_cents integer not null default 0,
  includes_noncash boolean not null default false,
  noncash_description text not null default '',
  noncash_quantity text not null default '',
  requested_noncash_cents integer not null default 0,
  value_explanation text not null default '',
  delivery_date date,
  additional_notes text not null default '',
  requested_benefits jsonb not null default '[]'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ctd_sponsorship_requests_director_idx
  on ctd_sponsorship_requests (director_id, updated_at desc);
create index if not exists ctd_sponsorship_requests_status_idx
  on ctd_sponsorship_requests (current_status, submitted_at desc);
create index if not exists ctd_sponsorship_requests_event_idx
  on ctd_sponsorship_requests (event_proposal_id);

create table if not exists ctd_sponsorship_versions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references ctd_sponsorship_requests(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  created_by text not null default '',
  created_at timestamptz not null default now(),
  unique (request_id, version_number)
);

create table if not exists ctd_sponsorship_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references ctd_sponsorship_requests(id) on delete cascade,
  name text not null,
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  unique (request_id, name)
);

create table if not exists ctd_sponsorship_approvals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references ctd_sponsorship_requests(id) on delete cascade,
  reference_number text not null unique,
  approved_sponsor text not null,
  associated_event_or_market text not null,
  approved_cash_cents integer not null,
  approved_noncash_cents integer not null,
  approved_benefits text not null default '',
  approved_period text not null default '',
  category_restrictions text not null default '',
  noncash_treatment text not null default '',
  conditions text not null default '',
  approved_by text not null,
  approved_at timestamptz not null default now()
);

create table if not exists ctd_portal_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  note text not null,
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ctd_portal_notes_entity_idx
  on ctd_portal_notes (entity_type, entity_id, created_at desc);

create table if not exists ctd_portal_messages (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  director_id uuid not null references ctd_directors(id) on delete cascade,
  message text not null,
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ctd_portal_messages_entity_idx
  on ctd_portal_messages (entity_type, entity_id, created_at desc);

create table if not exists ctd_portal_activities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  activity_type text not null,
  previous_value text,
  new_value text,
  description text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ctd_portal_activities_entity_idx
  on ctd_portal_activities (entity_type, entity_id, created_at desc);

create table if not exists ctd_portal_files (
  id uuid primary key default gen_random_uuid(),
  director_id uuid not null references ctd_directors(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  original_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  sha256 text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

create index if not exists ctd_portal_files_entity_idx
  on ctd_portal_files (entity_type, entity_id, created_at desc);
`;
