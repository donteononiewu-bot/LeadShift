# LeadShift

A lead routing SaaS platform for life insurance / IUL agencies. Captures
leads from quizzes, webhooks, Zapier, and Meta Lead Ads, then routes each one
to the correct buyer based on state, product, caps, availability, and intent
score.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, RLS)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's values
supabase start                # or point at a hosted project
supabase db reset             # applies supabase/migrations
npm run dev
```

See `supabase/README.md` for the data model and multi-tenancy details.

## Project structure

```
src/
  app/
    (auth)/            login, signup
    (dashboard)/        dashboard, leads, buyers, funnels, routing-rules,
                         history, integrations, settings
    api/                webhooks (zapier/meta/generic), auth callback
  components/           ui, nav, dashboard, auth, funnels, settings
  lib/
    supabase/           browser/server/admin/middleware clients
    actions/             server actions (auth, settings)
    types/database.ts    hand-maintained Supabase types
    nav-items.ts
supabase/
  migrations/           schema, RLS policies, signup trigger
```

## Status

This first pass sets up the project structure, database schema, Supabase
auth, and the dashboard shell/navigation with all core pages wired to real
(currently empty) data. Still to build: the routing engine, webhook/Zapier/
Meta ingestion endpoints, the AI Funnel Builder backend, and full CRUD for
buyers/routing rules/funnels.
