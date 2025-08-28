alter table public.expenses
  add column if not exists ai_category text,
  add column if not exists final_category text not null default 'Other';

create index if not exists idx_expenses_final_category on public.expenses(final_category);

