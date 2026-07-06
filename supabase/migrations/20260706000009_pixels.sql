-- Conversion tracking pixels fired from the public funnel runtime.
create type pixel_type as enum (
  'facebook', 'google_ads', 'tiktok', 'snapchat', 'google_analytics', 'custom'
);

create table if not exists pixels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  funnel_id uuid references funnels(id) on delete cascade, -- null = applies to all funnels
  name text not null,
  type pixel_type not null,
  pixel_id text not null,

  -- Maps internal events to pixel-specific event names, e.g.
  -- { "funnel_view": "PageView", "lead_submitted": "Lead" }
  event_mappings jsonb not null default '{}'::jsonb,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pixels_org_id_idx on pixels(org_id);
create index if not exists pixels_funnel_id_idx on pixels(funnel_id);

create trigger pixels_set_updated_at
  before update on pixels
  for each row execute function set_updated_at();
