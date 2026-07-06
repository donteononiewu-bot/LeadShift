-- Enable RLS everywhere and scope every row to the caller's organization.
-- Service-role requests (used by webhook ingestion + the routing engine)
-- bypass RLS entirely, which is why those code paths must run server-side
-- with the service role key and never be exposed to the browser.

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table buyers enable row level security;
alter table funnels enable row level security;
alter table leads enable row level security;
alter table lead_routing_attempts enable row level security;
alter table routing_rules enable row level security;
alter table routing_rule_buyers enable row level security;
alter table integrations enable row level security;
alter table system_events enable row level security;

create policy "members can view their organization"
  on organizations for select
  using (id = auth_org_id());

create policy "owners/admins can update their organization"
  on organizations for update
  using (id = auth_org_id() and exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role in ('owner', 'admin')
  ));

create policy "members can view profiles in their org"
  on profiles for select
  using (org_id = auth_org_id());

create policy "users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- Generic per-table policy set: select/insert/update/delete scoped to org_id.
create policy "org select buyers" on buyers for select using (org_id = auth_org_id());
create policy "org insert buyers" on buyers for insert with check (org_id = auth_org_id());
create policy "org update buyers" on buyers for update using (org_id = auth_org_id());
create policy "org delete buyers" on buyers for delete using (org_id = auth_org_id());

create policy "org select funnels" on funnels for select using (org_id = auth_org_id());
create policy "org insert funnels" on funnels for insert with check (org_id = auth_org_id());
create policy "org update funnels" on funnels for update using (org_id = auth_org_id());
create policy "org delete funnels" on funnels for delete using (org_id = auth_org_id());

create policy "org select leads" on leads for select using (org_id = auth_org_id());
create policy "org insert leads" on leads for insert with check (org_id = auth_org_id());
create policy "org update leads" on leads for update using (org_id = auth_org_id());
create policy "org delete leads" on leads for delete using (org_id = auth_org_id());

create policy "org select routing_rules" on routing_rules for select using (org_id = auth_org_id());
create policy "org insert routing_rules" on routing_rules for insert with check (org_id = auth_org_id());
create policy "org update routing_rules" on routing_rules for update using (org_id = auth_org_id());
create policy "org delete routing_rules" on routing_rules for delete using (org_id = auth_org_id());

create policy "org select integrations" on integrations for select using (org_id = auth_org_id());
create policy "org insert integrations" on integrations for insert with check (org_id = auth_org_id());
create policy "org update integrations" on integrations for update using (org_id = auth_org_id());
create policy "org delete integrations" on integrations for delete using (org_id = auth_org_id());

create policy "org select system_events" on system_events for select using (org_id = auth_org_id());

-- lead_routing_attempts / routing_rule_buyers are scoped via their parent lead/rule.
create policy "org select lead_routing_attempts" on lead_routing_attempts for select
  using (exists (select 1 from leads where leads.id = lead_id and leads.org_id = auth_org_id()));

create policy "org select routing_rule_buyers" on routing_rule_buyers for select
  using (exists (select 1 from routing_rules where routing_rules.id = routing_rule_id and routing_rules.org_id = auth_org_id()));

create policy "org write routing_rule_buyers" on routing_rule_buyers for all
  using (exists (select 1 from routing_rules where routing_rules.id = routing_rule_id and routing_rules.org_id = auth_org_id()))
  with check (exists (select 1 from routing_rules where routing_rules.id = routing_rule_id and routing_rules.org_id = auth_org_id()));
