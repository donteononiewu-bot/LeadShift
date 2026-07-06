# Database

Migrations run in filename order and set up the full LeadShift schema:

1. `init_orgs_profiles` — organizations (tenants) and profiles (auth.users extension)
2. `buyers` — lead buyers: caps, states, product types, availability, delivery config
3. `funnels` — quizzes/forms used to capture leads
4. `leads` — captured leads + routing attempt audit trail
5. `routing_rules` — conditions + strategy used to pick a buyer for a lead
6. `integrations` — Zapier / Meta Lead Ads / generic webhook connections
7. `system_history` — append-only event log for the System History page
8. `handle_new_user` — trigger that provisions an org + owner profile on signup
9. `rls_policies` — row-level security scoping every table to the caller's org

## Local development

```bash
supabase start
supabase db reset   # applies all migrations + seed.sql
```

Then copy `.env.example` to `.env.local` and fill in the values `supabase start`
prints out (API URL + anon key), or your hosted project's values from
Settings > API in the Supabase dashboard.

## Multi-tenancy model

Every table carries `org_id`. RLS policies restrict all client-side (anon/auth)
access to `org_id = auth_org_id()`, a `security definer` function that looks up
the caller's org from `profiles`. Server code paths that must act across orgs
(webhook ingestion, the routing engine) use the Supabase **service role** key,
which bypasses RLS — those code paths only ever run in API routes/server
actions, never in the browser.
