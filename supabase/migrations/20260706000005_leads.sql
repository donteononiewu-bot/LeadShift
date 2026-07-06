create type lead_status as enum ('new', 'routing', 'routed', 'rejected', 'sold', 'failed', 'unmatched');
create type lead_duplicate_status as enum ('unique', 'duplicate', 'possible_duplicate');

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  funnel_id uuid references funnels(id) on delete set null,
  lead_source_id uuid references lead_sources(id) on delete set null,

  source lead_source_type not null,
  status lead_status not null default 'new',

  name text,
  email text,
  phone text,
  state text, -- two-letter US state code
  zip text,
  date_of_birth date,
  product_type text, -- 'iul', 'term', 'final_expense', etc.

  -- Raw quiz/form answers, keyed by question id: { "<question_id>": "..." }
  answers jsonb not null default '{}'::jsonb,

  -- 0-100 computed score used by routing rules to prioritize/filter buyers.
  intent_score int not null default 50,

  -- Full original submission payload, whatever the source sent.
  raw_payload jsonb not null default '{}'::jsonb,

  duplicate_status lead_duplicate_status not null default 'unique',
  duplicate_of_lead_id uuid references leads(id) on delete set null,

  assigned_buyer_id uuid references buyers(id) on delete set null,
  routed_at timestamptz,
  routing_duration_ms int, -- time from capture to routed, target < 2000ms

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_org_id_idx on leads(org_id);
create index if not exists leads_org_status_idx on leads(org_id, status);
create index if not exists leads_org_created_idx on leads(org_id, created_at desc);
create index if not exists leads_assigned_buyer_idx on leads(assigned_buyer_id);
create index if not exists leads_funnel_id_idx on leads(funnel_id);
-- Duplicate detection looks leads up by email/phone within an org.
create index if not exists leads_org_email_idx on leads(org_id, email);
create index if not exists leads_org_phone_idx on leads(org_id, phone);

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- One row per buyer a lead was tried against during routing, in order.
-- This is the audit trail for "why did lead X go to buyer Y".
create type routing_outcome as enum (
  'accepted',
  'rejected_cap',
  'rejected_state',
  'rejected_score',
  'rejected_availability',
  'rejected_paused',
  'delivery_failed',
  'delivery_success'
);

create table if not exists routing_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  buyer_id uuid references buyers(id) on delete cascade,
  routing_rule_id uuid, -- references routing_rules(id), fk added once that table exists
  attempt_order int not null default 0,
  outcome routing_outcome not null,
  explanation text, -- human-readable reason, surfaced in System History
  response_status int,
  response_body text,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists routing_events_lead_id_idx on routing_events(lead_id);
create index if not exists routing_events_buyer_id_idx on routing_events(buyer_id);
