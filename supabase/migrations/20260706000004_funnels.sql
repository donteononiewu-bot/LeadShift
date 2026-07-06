-- Funnels/quizzes are the lead-capture front doors. Structure is normalized
-- across funnels -> funnel_pages -> funnel_questions so the funnel builder
-- (and AI Funnel Builder) can edit individual steps/questions directly.
create type funnel_type as enum ('quiz', 'form', 'landing_page');
create type funnel_status as enum ('draft', 'published', 'archived');

create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  type funnel_type not null default 'quiz',
  status funnel_status not null default 'draft',

  -- Branding.
  primary_color text not null default '#3563ff',
  logo_url text,
  favicon_url text,

  -- Tracking.
  meta_pixel_id text,
  custom_scripts text, -- raw <script> HTML injected on the public funnel page

  -- Populated when the funnel was produced by the AI Funnel Builder.
  ai_generated boolean not null default false,
  ai_prompt text,

  -- Denormalized counters, kept in sync by triggers on funnel_submissions.
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

-- One step in a funnel: could be the landing page, a question, the contact
-- info capture step, the result page, or the booking redirect page.
create type funnel_page_type as enum (
  'landing', 'question', 'contact_info', 'result', 'booking_redirect'
);

create table if not exists funnel_pages (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references funnels(id) on delete cascade,
  page_type funnel_page_type not null,
  title text,
  subtitle text,
  position int not null default 0,

  -- Free-form content for non-question pages (landing/result copy, CTA
  -- button text, etc.) Question pages store their data in funnel_questions.
  content jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (funnel_id, position)
);

create index if not exists funnel_pages_funnel_id_idx on funnel_pages(funnel_id);

create trigger funnel_pages_set_updated_at
  before update on funnel_pages
  for each row execute function set_updated_at();

create type funnel_question_type as enum (
  'single_choice', 'multiple_choice', 'text', 'number', 'boolean', 'dropdown', 'slider', 'date'
);

create table if not exists funnel_questions (
  id uuid primary key default gen_random_uuid(),
  funnel_page_id uuid not null references funnel_pages(id) on delete cascade,
  question_text text not null,
  question_type funnel_question_type not null default 'single_choice',

  -- Choice options for single/multiple_choice/dropdown: [{ "label": "...", "value": "..." }]
  options jsonb not null default '[]'::jsonb,

  is_required boolean not null default true,
  position int not null default 0,

  -- If set, the answer is written directly onto this leads column
  -- (e.g. 'state', 'product_type', 'date_of_birth') in addition to `answers`.
  lead_field_mapping text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (funnel_page_id, position)
);

create index if not exists funnel_questions_funnel_page_id_idx
  on funnel_questions(funnel_page_id);

create trigger funnel_questions_set_updated_at
  before update on funnel_questions
  for each row execute function set_updated_at();
