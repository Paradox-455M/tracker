-- Ensure budgets and insights tables exist matching earlier schema; create if missing
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  limit_amount numeric(12,2) not null check (limit_amount >= 0),
  period_month int not null check (period_month between 1 and 12),
  period_year int not null check (period_year between 2000 and 2999),
  created_at timestamptz not null default now(),
  unique (user_id, category, period_month, period_year)
);

alter table public.budgets enable row level security;

create policy if not exists "Budgets readable by owner"
on public.budgets for select using (auth.uid() = user_id);

create policy if not exists "Budgets insertable by owner"
on public.budgets for insert with check (auth.uid() = user_id);

create policy if not exists "Budgets updatable by owner"
on public.budgets for update using (auth.uid() = user_id);

create policy if not exists "Budgets deletable by owner"
on public.budgets for delete using (auth.uid() = user_id);

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_key text not null,
  summary text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, period_key)
);

alter table public.insights enable row level security;

create policy if not exists "Insights readable by owner"
on public.insights for select using (auth.uid() = user_id);

create policy if not exists "Insights insertable by owner"
on public.insights for insert with check (auth.uid() = user_id);

create policy if not exists "Insights updatable by owner"
on public.insights for update using (auth.uid() = user_id);

create policy if not exists "Insights deletable by owner"
on public.insights for delete using (auth.uid() = user_id);


