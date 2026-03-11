# Supabase Setup

## 1. Environment

Create `apps/web/.env.local` from `apps/web/.env.example` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 2. Apply SQL

Run the migration SQL in your Supabase SQL editor:

```bash
npm run supabase:migration:print
```

Then run the seed SQL:

```bash
npm run supabase:seed:print
```

Paste the output into the Supabase SQL editor, or apply it through your preferred SQL workflow.

## 3. What You Get

- Graffiti Run workspace and owner
- Seed topics and topic checks
- Templates
- Draft history and comments
- Facebook publishing channel stub
- One queued publish job
- One published post metric record

## 4. Operational Endpoints

After seeding and starting the app:

- `POST /api/topics/ingest`
- `POST /api/publish-jobs/:id/run`

Both endpoints are safe for local development and use stubbed providers/adapters when live integrations are unavailable.
