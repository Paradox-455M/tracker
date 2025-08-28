create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  message text not null,
  level text not null check (level in ('warning','alert')),
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create index if not exists idx_alerts_user_created on public.alerts(user_id, created_at desc);
create index if not exists idx_alerts_unread on public.alerts(user_id, is_read) where is_read = false;

alter table public.alerts enable row level security;

create policy if not exists "Alerts readable by owner"
on public.alerts for select using (auth.uid() = user_id);

create policy if not exists "Alerts insertable by owner"
on public.alerts for insert with check (auth.uid() = user_id);

create policy if not exists "Alerts updatable by owner"
on public.alerts for update using (auth.uid() = user_id);


