-- Split the single custom_scripts blob into head/body, matching the
-- funnel tracking spec (separate custom head vs body script injection).
alter table funnels drop column if exists custom_scripts;
alter table funnels add column if not exists custom_head_script text;
alter table funnels add column if not exists custom_body_script text;

-- Timestamp for when the visitor actually hit the booking redirect, so
-- analytics can report "booking redirects" distinctly from "leads routed"
-- (a lead can be routed but the visitor could close the tab first).
alter table funnel_submissions add column if not exists redirected_at timestamptz;
