# Database

Migrations run in filename order and set up the full LeadShift schema:

1. `init_orgs_users` — organizations (tenants) and users (auth.users extension)
2. `lead_sources` — campaign/UTM attribution behind a lead's broad source
3. `buyers` — lead buyers: caps, states, priority, weight, booking URL, webhook/Zapier URLs, plus `buyer_delivery_methods` for additional simultaneous delivery channels
4. `funnels` — quiz/funnel metadata, plus `funnel_pages` and `funnel_questions` for the normalized step-by-step builder
5. `leads` — captured leads (with duplicate detection + intent score) and `routing_events`, the audit trail of routing decisions
6. `funnel_submissions` — every quiz run, linked to the lead it produced
7. `routing_rules` — conditions + strategy used to pick a buyer for a lead, plus `routing_rule_buyers`
8. `integrations` — Zapier / Meta Lead Ads / generic webhook / CRM connections
9. `pixels` — Meta/Google/TikTok conversion tracking pixels fired by the funnel runtime
10. `system_logs` — append-only event log for the System History page
11. `handle_new_user` — trigger that provisions an org + owner user on signup
12. `rls_policies` — row-level security scoping every table to the caller's org

## Local development

```bash
supabase start
supabase db reset   # applies all migrations + seed.sql
```

Then copy `.env.example` to `.env.local` and fill in the values `supabase start`
prints out (API URL + anon key), or your hosted project's values from
Settings > API in the Supabase dashboard.

## Multi-tenancy model

Every table carries `org_id` (directly, or transitively through a parent
table — `buyer_delivery_methods`, `funnel_pages`, `funnel_questions`,
`funnel_submissions`, `routing_rule_buyers`, and `routing_events` are scoped
via a join back to their parent's `org_id`). RLS policies restrict all
client-side (anon/auth) access to `org_id = auth_org_id()`, a
`security definer` function that looks up the caller's org from `users`.
Server code paths that must act across orgs (webhook ingestion, the funnel
runtime, the routing engine) use the Supabase **service role** key, which
bypasses RLS — those code paths only ever run in API routes/server actions,
never in the browser.

## Key design notes

- **Leads dedupe, not reject.** There's no unique constraint on
  `leads.email`/`leads.phone` — the same person can submit more than once
  over time. Instead, `duplicate_status` (`unique` / `duplicate` /
  `possible_duplicate`) and `duplicate_of_lead_id` record what the routing
  engine found, and routing rules/settings decide what to do about it.
- **`buyers` has quick-access delivery fields** (`webhook_url`,
  `zapier_webhook_url`, `email`, `phone`) for the common single-endpoint
  cases, plus a `buyer_delivery_methods` table for buyers that need several
  simultaneous channels (e.g. webhook *and* SMS *and* a CRM API) with
  independent enable/disable and per-channel config.
- **Funnels are normalized**, not a single JSON blob: `funnels` holds
  metadata/branding/tracking, `funnel_pages` holds ordered steps (landing,
  question, contact info, result, booking redirect), and
  `funnel_questions` holds each question within a question-type page,
  optionally mapped onto a `leads` column via `lead_field_mapping`.
- **`routing_events`** is the per-buyer-attempt audit trail for a lead
  (which buyers were tried, in what order, and why each was accepted or
  rejected) — this is what the System History and per-lead routing
  explanation views read from.
