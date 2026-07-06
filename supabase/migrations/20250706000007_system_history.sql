-- Append-only audit log surfaced on the "System History" page: every lead
-- capture, routing decision, integration event, and settings change.
create type system_event_severity as enum ('info', 'warning', 'error');

create table if not exists system_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null, -- null = system/automation
  severity system_event_severity not null default 'info',

  entity_type text not null, -- 'lead', 'buyer', 'routing_rule', 'integration', 'funnel', 'auth'
  entity_id uuid,

  event_type text not null, -- 'lead.captured', 'lead.routed', 'buyer.capped', 'integration.error', ...
  message text not null,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists system_events_org_created_idx
  on system_events(org_id, created_at desc);
create index if not exists system_events_org_entity_idx
  on system_events(org_id, entity_type, entity_id);
