-- Buyers purchase leads. Routing decisions are made against this table.
create type buyer_status as enum ('active', 'paused', 'archived');

create table if not exists buyers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  status buyer_status not null default 'active',

  -- Geography this buyer accepts. Empty array = all states.
  states text[] not null default '{}',

  -- Product lines this buyer accepts, e.g. 'iul', 'term', 'final_expense'.
  product_types text[] not null default '{}',

  -- Minimum lead intent score (0-100) this buyer will accept.
  min_intent_score int not null default 0,

  -- Price paid per accepted lead, used for highest-bidder routing strategies.
  price_per_lead numeric(10, 2) not null default 0,

  -- Relative weight for weighted round-robin distribution among tied buyers.
  weight int not null default 1,

  -- Manual ordering preference for the 'priority' routing strategy.
  -- Lower number = higher priority = tried first.
  priority int not null default 0,

  -- Caps. Null = unlimited. Counters reset on a rolling schedule.
  daily_cap int,
  weekly_cap int,
  monthly_cap int,
  daily_count int not null default 0,
  weekly_count int not null default 0,
  monthly_count int not null default 0,
  counts_reset_at timestamptz not null default now(),

  -- Availability window, in the org's timezone. Null = always available.
  available_start_time time,
  available_end_time time,
  available_days smallint[] not null default '{0,1,2,3,4,5,6}', -- 0=Sunday

  -- Instant-booking link shown/redirected to after a lead is routed here.
  booking_calendar_url text,

  -- Quick-access delivery endpoints. Multiple simultaneous delivery methods
  -- (including additional webhooks/CRM targets) live in buyer_delivery_methods;
  -- these two columns cover the two most common single-endpoint cases.
  webhook_url text,
  zapier_webhook_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists buyers_org_id_idx on buyers(org_id);
create index if not exists buyers_org_status_idx on buyers(org_id, status);
create index if not exists buyers_org_status_priority_idx
  on buyers(org_id, status, priority);

create trigger buyers_set_updated_at
  before update on buyers
  for each row execute function set_updated_at();

-- Helper: has this buyer hit any of its caps right now?
create or replace function buyer_is_capped(b buyers)
returns boolean
language sql
immutable
as $$
  select
    (b.daily_cap is not null and b.daily_count >= b.daily_cap) or
    (b.weekly_cap is not null and b.weekly_count >= b.weekly_cap) or
    (b.monthly_cap is not null and b.monthly_count >= b.monthly_cap)
$$;

-- A buyer can have several simultaneous delivery channels (e.g. webhook +
-- email + Zapier all enabled at once); each row is one channel's config.
create type delivery_method as enum ('email', 'sms', 'webhook', 'zapier', 'crm_api');

create table if not exists buyer_delivery_methods (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references buyers(id) on delete cascade,
  method delivery_method not null,

  -- e.g. { "url": "...", "headers": {...} } for webhook/zapier,
  -- { "to": "..." } for email, { "to": "+1..." } for sms.
  config jsonb not null default '{}'::jsonb,

  is_active boolean not null default true,
  is_primary boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists buyer_delivery_methods_buyer_id_idx
  on buyer_delivery_methods(buyer_id);

create trigger buyer_delivery_methods_set_updated_at
  before update on buyer_delivery_methods
  for each row execute function set_updated_at();
