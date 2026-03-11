# Graffiti Run Content Engine

Production-minded SaaS scaffold for discovering topic opportunities, generating branded drafts, routing them through review, and preparing them for publishing and analytics.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase-ready schema and client helpers

## Workspace Layout

```text
/apps/web
/data
/supabase/migrations
/supabase/seed.sql
```

## Getting Started

1. Install dependencies from the repo root:

```bash
npm install
```

2. Start the web app:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Environment

Create `apps/web/.env.local` from `apps/web/.env.example` when wiring Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The app runs locally with mock data if these are absent.

## Auth Flow

- With Supabase env configured, middleware protects app routes and redirects unauthenticated users to `/login`.
- Login uses Supabase magic links and returns through `/auth/callback`.
- Workspace resolution uses the signed-in user's `workspace_members` record to pick the active workspace context.
- Without Supabase env, the app stays in mock mode and uses the seeded local workspace owner.

## Current Data Flow

- Pages now call async feature services.
- Feature services prefer Supabase-backed queries through the server client.
- If environment keys are missing or tables are empty, the app falls back to deterministic local mock data.
- This keeps local development stable while making the app ready for real persistence.

## Seed Workflow

- Apply the migration in [supabase/migrations/20260310143000_initial_schema.sql](/Users/williamsfamily/Desktop/Graffiti-run/supabase/migrations/20260310143000_initial_schema.sql).
- Run [supabase/seed.sql](/Users/williamsfamily/Desktop/Graffiti-run/supabase/seed.sql) to create a real Graffiti Run workspace, topics, templates, draft history, publishing channel stub, and performance metrics.
- After seeding, the topic queue and draft studio mutations can operate against Supabase instead of falling back to in-memory demo data.

## Triggering Operations

- Use the `Run ingestion` button on `/topics`, or call `POST /api/topics/ingest`.
- Use the `Run now` button on queued jobs in `/publishing`, or call `POST /api/publish-jobs/:id/run`.
- Both flows are local-safe: ingestion uses normalized mock candidates, and publishing uses a stubbed Facebook-ready adapter until live credentials exist.

## Authorization

- Server actions and operation endpoints now enforce workspace-role permissions before mutating data.
- Draft creation requires `createDrafts`.
- Review decisions require `approveDrafts`.
- Publish execution and scheduling require `publishDrafts`.
- Provider and publishing dispatch now go through integration registries, so real adapters can be added without rewriting workflow code.

## Included In This Scaffold

- Workspace-scoped domain model
- Seeded Graffiti Run workspace assumptions
- Topic queue, draft studio, templates, publishing, and analytics screens
- Service contracts for ingestion, safety, rights, drafting, rendering, publishing, and analytics
- Initial Supabase SQL schema and seed data
- Deterministic mock fixtures for local development

## Notes

- Publishing is adapter-ready for Facebook but stubbed for local use.
- Analytics use seeded data in the UI while the schema and service contracts are shaped for live sync later.
- Template rendering is static-composition-first for MVP.
