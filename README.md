AI Money Coach – Monorepo

Structure
- `frontend/` – Next.js app (App Router, Tailwind)
- `backend/supabase/` – SQL migrations and DB artifacts

Environment variables
Copy `frontend/.env.example` to `frontend/.env.local` and fill:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
OPENAI_API_KEY=<optional-for-later>
NEXT_PUBLIC_CRYPTO_SALT=ai-finance-demo
```

Supabase setup
1) Create a Supabase project
2) Open SQL editor and run `backend/supabase/migrations/0001_init.sql`

Development
```
npm run dev
```

Routes (frontend)
- `/` landing (CTA to sign in)
- `/login` email magic link + Google
- `/auth/callback` OAuth exchange
- `/app` protected dashboard (+ Expenses, Budgets, Insights placeholders)
