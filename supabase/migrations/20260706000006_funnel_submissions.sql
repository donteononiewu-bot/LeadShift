-- Every completed (or partial) funnel run. The routing engine consumes the
-- finished submission to create a lead, then links it back here.
create table if not exists funnel_submissions (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references funnels(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,

  -- { "<question_id>": "<answer>" }, mirrors leads.answers once a lead exists.
  answers jsonb not null default '{}'::jsonb,

  completed boolean not null default false,
  ip_address inet,
  user_agent text,
  referrer text,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,

  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists funnel_submissions_funnel_id_idx
  on funnel_submissions(funnel_id);
create index if not exists funnel_submissions_lead_id_idx
  on funnel_submissions(lead_id);

-- Keep funnels.submissions in sync whenever a submission is completed.
create or replace function increment_funnel_submissions()
returns trigger
language plpgsql
as $$
begin
  if new.completed and (tg_op = 'INSERT' or old.completed is distinct from new.completed) then
    update funnels set submissions = submissions + 1 where id = new.funnel_id;
  end if;
  return new;
end;
$$;

create trigger funnel_submissions_increment_count
  after insert or update on funnel_submissions
  for each row execute function increment_funnel_submissions();
