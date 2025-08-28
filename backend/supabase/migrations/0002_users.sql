-- USERS profile table, linked to auth.users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(), -- app-level id
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_auth_user_id on public.users (auth_user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

alter table public.users enable row level security;

-- Owner policies: a user may read/update their own profile by matching auth.uid() to auth_user_id
create policy "Users readable by owner"
on public.users for select
using (auth.uid() = auth_user_id);

create policy "Users updatable by owner"
on public.users for update
using (auth.uid() = auth_user_id);

-- Inserts are typically done server-side during auth callback using service role; allow insert if matches owner
create policy "Users insertable by owner"
on public.users for insert
with check (auth.uid() = auth_user_id);


