-- Enable RLS everywhere and scope every row to the caller's organization.
-- Service-role requests (used by webhook ingestion, the funnel runtime, and
-- the routing engine) bypass RLS entirely, which is why those code paths
-- must run server-side with the service role key and never be exposed to
-- the browser.

alter table organizations enable row level security;
alter table users enable row level security;
alter table lead_sources enable row level security;
alter table buyers enable row level security;
alter table buyer_delivery_methods enable row level security;
alter table funnels enable row level security;
alter table funnel_pages enable row level security;
alter table funnel_questions enable row level security;
alter table leads enable row level security;
alter table funnel_submissions enable row level security;
alter table routing_rules enable row level security;
alter table routing_rule_buyers enable row level security;
alter table routing_events enable row level security;
alter table integrations enable row level security;
alter table pixels enable row level security;
alter table system_logs enable row level security;

create policy "members can view their organization"
  on organizations for select
  using (id = auth_org_id());

create policy "owners/admins can update their organization"
  on organizations for update
  using (id = auth_org_id() and exists (
    select 1 from users
    where users.id = auth.uid() and users.role in ('owner', 'admin')
  ));

create policy "members can view users in their org"
  on users for select
  using (org_id = auth_org_id());

create policy "users can update their own row"
  on users for update
  using (id = auth.uid());

-- Generic per-table policy set: select/insert/update/delete scoped to org_id.
create policy "org select lead_sources" on lead_sources for select using (org_id = auth_org_id());
create policy "org insert lead_sources" on lead_sources for insert with check (org_id = auth_org_id());
create policy "org update lead_sources" on lead_sources for update using (org_id = auth_org_id());
create policy "org delete lead_sources" on lead_sources for delete using (org_id = auth_org_id());

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

create policy "org select pixels" on pixels for select using (org_id = auth_org_id());
create policy "org insert pixels" on pixels for insert with check (org_id = auth_org_id());
create policy "org update pixels" on pixels for update using (org_id = auth_org_id());
create policy "org delete pixels" on pixels for delete using (org_id = auth_org_id());

create policy "org select system_logs" on system_logs for select using (org_id = auth_org_id());

-- buyer_delivery_methods is scoped via its parent buyer.
create policy "org select buyer_delivery_methods" on buyer_delivery_methods for select
  using (exists (select 1 from buyers where buyers.id = buyer_id and buyers.org_id = auth_org_id()));
create policy "org write buyer_delivery_methods" on buyer_delivery_methods for all
  using (exists (select 1 from buyers where buyers.id = buyer_id and buyers.org_id = auth_org_id()))
  with check (exists (select 1 from buyers where buyers.id = buyer_id and buyers.org_id = auth_org_id()));

-- funnel_pages is scoped via its parent funnel.
create policy "org select funnel_pages" on funnel_pages for select
  using (exists (select 1 from funnels where funnels.id = funnel_id and funnels.org_id = auth_org_id()));
create policy "org write funnel_pages" on funnel_pages for all
  using (exists (select 1 from funnels where funnels.id = funnel_id and funnels.org_id = auth_org_id()))
  with check (exists (select 1 from funnels where funnels.id = funnel_id and funnels.org_id = auth_org_id()));

-- funnel_questions is scoped via its parent page's funnel.
create policy "org select funnel_questions" on funnel_questions for select
  using (exists (
    select 1 from funnel_pages
    join funnels on funnels.id = funnel_pages.funnel_id
    where funnel_pages.id = funnel_page_id and funnels.org_id = auth_org_id()
  ));
create policy "org write funnel_questions" on funnel_questions for all
  using (exists (
    select 1 from funnel_pages
    join funnels on funnels.id = funnel_pages.funnel_id
    where funnel_pages.id = funnel_page_id and funnels.org_id = auth_org_id()
  ))
  with check (exists (
    select 1 from funnel_pages
    join funnels on funnels.id = funnel_pages.funnel_id
    where funnel_pages.id = funnel_page_id and funnels.org_id = auth_org_id()
  ));

-- funnel_submissions is scoped via its parent funnel.
create policy "org select funnel_submissions" on funnel_submissions for select
  using (exists (select 1 from funnels where funnels.id = funnel_id and funnels.org_id = auth_org_id()));

-- routing_rule_buyers / routing_events are scoped via their parent rule/lead.
create policy "org select routing_rule_buyers" on routing_rule_buyers for select
  using (exists (select 1 from routing_rules where routing_rules.id = routing_rule_id and routing_rules.org_id = auth_org_id()));
create policy "org write routing_rule_buyers" on routing_rule_buyers for all
  using (exists (select 1 from routing_rules where routing_rules.id = routing_rule_id and routing_rules.org_id = auth_org_id()))
  with check (exists (select 1 from routing_rules where routing_rules.id = routing_rule_id and routing_rules.org_id = auth_org_id()));

create policy "org select routing_events" on routing_events for select
  using (exists (select 1 from leads where leads.id = lead_id and leads.org_id = auth_org_id()));
