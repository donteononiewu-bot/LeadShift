-- Lead sources are the specific traffic/campaign attribution behind a lead's
-- broad `leads.source` category (e.g. "Facebook - IUL Q4 campaign" vs just
-- 'meta_lead_ad'). Optional: leads can be captured without one.
create type lead_source_type as enum (
  'quiz', 'webhook', 'zapier', 'meta_lead_ad', 'manual', 'api'
);

create table if not exists lead_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type lead_source_type not null,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_sources_org_id_idx on lead_sources(org_id);

create trigger lead_sources_set_updated_at
  before update on lead_sources
  for each row execute function set_updated_at();
