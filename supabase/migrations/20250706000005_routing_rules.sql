-- Routing rules are evaluated in priority order for each incoming lead.
-- The first matching rule determines the candidate buyer pool and strategy;
-- the routing engine then picks among candidates using the strategy.
create type routing_strategy as enum (
  'priority',        -- first available buyer in explicit priority order
  'weighted_round_robin',
  'highest_price',   -- highest price_per_lead wins
  'highest_intent_match' -- buyer whose min_intent_score is closest to the lead's score
);

create table if not exists routing_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  priority int not null default 0, -- lower = evaluated first

  -- Match conditions. All present conditions must match (AND).
  states text[] not null default '{}',           -- empty = any state
  product_types text[] not null default '{}',    -- empty = any product
  min_intent_score int not null default 0,
  max_intent_score int not null default 100,
  sources lead_source[] not null default '{}',    -- empty = any source

  strategy routing_strategy not null default 'priority',

  -- Explicit ordering of buyer_ids for the 'priority' strategy.
  buyer_priority uuid[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routing_rules_org_id_idx on routing_rules(org_id);
create index if not exists routing_rules_org_active_priority_idx
  on routing_rules(org_id, is_active, priority);

create trigger routing_rules_set_updated_at
  before update on routing_rules
  for each row execute function set_updated_at();

alter table lead_routing_attempts
  add constraint lead_routing_attempts_routing_rule_id_fkey
  foreign key (routing_rule_id) references routing_rules(id) on delete set null;

-- Buyers eligible for a rule, many-to-many, used by non-priority strategies
-- where explicit ordering doesn't apply but a buyer pool still needs scoping.
create table if not exists routing_rule_buyers (
  routing_rule_id uuid not null references routing_rules(id) on delete cascade,
  buyer_id uuid not null references buyers(id) on delete cascade,
  primary key (routing_rule_id, buyer_id)
);
