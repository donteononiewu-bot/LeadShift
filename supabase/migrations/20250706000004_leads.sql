create type lead_source as enum ('quiz', 'webhook', 'zapier', 'meta_lead_ad', 'manual', 'api');
create type lead_status as enum ('new', 'routing', 'routed', 'rejected', 'sold', 'failed');

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  funnel_id uuid references funnels(id) on delete set null,

  source lead_source not null,
  status lead_status not null default 'new',

  first_name text,
  last_name text,
  email text,
  phone text,
  state text, -- two-letter US state code
  zip text,
  date_of_birth date,
  product_type text, -- 'iul', 'term', 'final_expense', etc.

  -- 0-100 computed score used by routing rules to prioritize/filter buyers.
  intent_score int not null default 50,

  -- Full original submission payload, whatever the source sent.
  raw_payload jsonb not null default '{}'::jsonb,

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

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- One row per buyer a lead was tried against during routing, in order.
-- This is the audit trail for "why did lead X go to buyer Y".
create table if not exists lead_routing_attempts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  buyer_id uuid not null references buyers(id) on delete cascade,
  routing_rule_id uuid, -- references routing_rules(id), fk added after that table exists
  attempt_order int not null,
  outcome text not null, -- 'accepted', 'rejected_cap', 'rejected_state', 'rejected_score', 'rejected_availability', 'delivery_failed'
  response_status int,
  response_body text,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists lead_routing_attempts_lead_id_idx on lead_routing_attempts(lead_id);
