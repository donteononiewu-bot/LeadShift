-- Funnels/quizzes are the lead-capture front doors. Config drives a dynamic
-- multi-step form; ai_generated funnels store the prompt used to create them.
create type funnel_type as enum ('quiz', 'form', 'landing_page');
create type funnel_status as enum ('draft', 'published', 'archived');

create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  type funnel_type not null default 'quiz',
  status funnel_status not null default 'draft',

  -- Steps/questions/branching logic, rendered by the funnel runtime.
  config jsonb not null default '{"steps": []}'::jsonb,

  -- Populated when the funnel was produced by the AI Funnel Builder.
  ai_generated boolean not null default false,
  ai_prompt text,

  views int not null default 0,
  submissions int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (org_id, slug)
);

create index if not exists funnels_org_id_idx on funnels(org_id);

create trigger funnels_set_updated_at
  before update on funnels
  for each row execute function set_updated_at();
