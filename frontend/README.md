# Frontend

## Auth setup
- In Supabase Dashboard → Authentication → Providers → Google: enable provider and enter your Google Client ID and Secret.
- Add `http://localhost:3001/auth/callback` (or port shown in dev logs) as an Authorized Callback URL in Supabase and Google console.

## DB migrations
- In Supabase SQL editor, run both:
  - `backend/supabase/migrations/0001_init.sql`
  - `backend/supabase/migrations/0002_users.sql`

## Env
See root README for envs. The frontend reads from `frontend/.env.local`.
