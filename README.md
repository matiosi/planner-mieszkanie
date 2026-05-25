# FlatFinish Planner

Polish-first MVP for managing an apartment finishing project. The app uses Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Storage/RLS, `@react-pdf/renderer`, `jszip`, and `react-zoom-pan-pinch`.

No AI integration is included. The `Co teraz?` view is deterministic and uses database rules only.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Link Supabase and apply migrations:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

5. Enable Google OAuth in Supabase Auth and add this callback URL:

```txt
http://localhost:3000/auth/callback
```

6. Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Supabase Folder

Supabase configuration and migrations live in:

```txt
supabase/
```

Pushes to `main` that change `supabase/**` can automatically apply migrations through `.github/workflows/supabase-migrations.yml` after GitHub secrets are configured.

## Available Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```

## MVP Scope

- Google login through Supabase Auth
- protected `/projects/*`
- project CRUD and demo project
- dashboard
- rooms, budget, tasks, products, decisions, vendors
- inspiration uploads and URL inspirations
- private Supabase Storage with signed URLs
- per-room designer brief PDFs and ZIP export
- original/designer plan uploads
- split plan comparison with zoom and pan
- deterministic `Co teraz?` next actions

## Security Model

- `projects.owner_id` owns the project.
- Project-scoped tables use `project_id`.
- Initial RLS permits only the project owner.
- Storage paths use `users/{auth.uid()}/projects/{projectId}/...`.
- Buckets are private.

This keeps the schema ready for future `project_members` collaboration without changing every table.
