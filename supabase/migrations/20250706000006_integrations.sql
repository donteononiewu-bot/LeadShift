create type integration_type as enum ('zapier', 'meta_lead_ads', 'webhook', 'crm');
create type integration_status as enum ('connected', 'disconnected', 'error');

create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  type integration_type not null,
  name text not null,
  status integration_status not null default 'disconnected',

  -- Per-type settings: API keys, page IDs, field mappings, inbound secret, etc.
  config jsonb not null default '{}'::jsonb,

  -- Stable per-integration ingest key used to authenticate inbound webhooks
  -- at /api/webhooks/[type]?key=... without exposing org internals.
  ingest_key uuid not null default gen_random_uuid(),

  last_event_at timestamptz,
  last_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integrations_org_id_idx on integrations(org_id);
create unique index if not exists integrations_ingest_key_idx on integrations(ingest_key);

create trigger integrations_set_updated_at
  before update on integrations
  for each row execute function set_updated_at();
