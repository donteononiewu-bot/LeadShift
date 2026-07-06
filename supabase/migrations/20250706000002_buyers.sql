-- Buyers purchase leads. Routing decisions are made against this table.
create type buyer_status as enum ('active', 'paused', 'archived');
create type delivery_method as enum ('webhook', 'email', 'sms', 'crm_api');

create table if not exists buyers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  contact_email text,
  contact_phone text,
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

  -- Caps. Null = unlimited. Current counters reset by scheduled jobs / triggers.
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

  delivery_method delivery_method not null default 'webhook',
  delivery_config jsonb not null default '{}'::jsonb, -- url, headers, email, field mapping

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists buyers_org_id_idx on buyers(org_id);
create index if not exists buyers_org_status_idx on buyers(org_id, status);

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
