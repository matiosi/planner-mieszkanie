# Supabase Setup

## 1. Create Project

Create a Supabase project and copy:

- Project URL
- anon public key

Paste them into `.env`.

## 2. Run Migration

The Supabase project lives in the `supabase/` folder:

```txt
supabase/config.toml
supabase/migrations/20260525000000_flatfinish_mvp.sql
```

For local/manual setup, link the project and push migrations:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration creates:

- enums
- MVP tables
- indexes
- `updated_at` triggers
- RLS policies
- private `inspirations` and `plans` buckets
- storage policies scoped to `users/{auth.uid()}`

## 3. Enable Google Auth

In Supabase:

```txt
Authentication → Providers → Google
```

Set the Google client credentials and add redirect URLs:

```txt
http://localhost:3000/auth/callback
https://YOUR_DOMAIN/auth/callback
```

For local development, also set:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 4. Storage Rules

The migration creates private buckets:

```txt
inspirations
plans
```

Files are uploaded under:

```txt
users/{userId}/projects/{projectId}/...
```

The app renders private images with signed URLs.

## 5. Automatic Migration Updates

GitHub Actions workflow:

```txt
.github/workflows/supabase-migrations.yml
```

It runs automatically on pushes to `main` when files under `supabase/**` change.

Add these repository secrets in GitHub:

```txt
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
```

Do not commit service role keys or database passwords.
