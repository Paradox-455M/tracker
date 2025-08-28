create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',
  category text not null,
  description text,
  merchant text,
  tx_date timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_user on public.expenses(user_id);
create index if not exists idx_expenses_date on public.expenses(tx_date);
create index if not exists idx_expenses_category on public.expenses(category);

alter table public.expenses enable row level security;

create policy "Expenses are viewable by owner"
on public.expenses for select
using ( auth.uid() = user_id );

create policy "Expenses are insertable by owner"
on public.expenses for insert
with check ( auth.uid() = user_id );

create policy "Expenses are updatable by owner"
on public.expenses for update
using ( auth.uid() = user_id );

create policy "Expenses are deletable by owner"
on public.expenses for delete
using ( auth.uid() = user_id );

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

create policy "Budgets readable by owner"
on public.budgets for select
using ( auth.uid() = user_id );

create policy "Budgets insertable by owner"
on public.budgets for insert
with check ( auth.uid() = user_id );

create policy "Budgets updatable by owner"
on public.budgets for update
using ( auth.uid() = user_id );

create policy "Budgets deletable by owner"
on public.budgets for delete
using ( auth.uid() = user_id );

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

create policy "Insights readable by owner"
on public.insights for select
using ( auth.uid() = user_id );

create policy "Insights insertable by owner"
on public.insights for insert
with check ( auth.uid() = user_id );

create policy "Insights updatable by owner"
on public.insights for update
using ( auth.uid() = user_id );

create policy "Insights deletable by owner"
on public.insights for delete
using ( auth.uid() = user_id );


