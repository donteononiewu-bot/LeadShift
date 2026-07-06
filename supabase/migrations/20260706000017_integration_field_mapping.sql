-- Integrations move from one-per-type to any number per org, each optionally
-- scoped to a specific funnel/campaign (per the "unique intake URL per
-- funnel/campaign" requirement) and carrying its own field-mapping config.
alter table integrations add column if not exists funnel_id uuid references funnels(id) on delete set null;
create index if not exists integrations_funnel_id_idx on integrations(funnel_id);

-- config jsonb now conventionally holds:
--   { "fieldMapping": { "<leadField>": "<incoming JSON path>" },
--     "requiredFields": ["<incoming JSON path>", ...] }
-- No schema change needed for that (jsonb is already flexible) — just
-- documenting the convention here since it's load-bearing for intake.
