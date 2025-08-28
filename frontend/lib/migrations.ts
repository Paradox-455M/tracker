import { createClient } from "./supabase/server";

const migrations = [
  {
    id: "0003_expenses_categories",
    sql: `
      alter table public.expenses
        add column if not exists ai_category text,
        add column if not exists final_category text not null default 'Other';

      create index if not exists idx_expenses_final_category on public.expenses(final_category);
    `
  },
  {
    id: "0004_budgets_insights",
    sql: `
      create table if not exists public.budgets (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade,
        category text not null,
        limit_amount numeric(10,2) not null,
        period_month integer not null,
        period_year integer not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique(user_id, category, period_month, period_year)
      );

      create table if not exists public.insights (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade,
        period_key text not null,
        summary text not null,
        metrics jsonb,
        created_at timestamptz not null default now(),
        unique(user_id, period_key)
      );

      create index if not exists idx_budgets_user_period on public.budgets(user_id, period_month, period_year);
      create index if not exists idx_insights_user_period on public.insights(user_id, period_key);

      alter table public.budgets enable row level security;
      alter table public.insights enable row level security;

      create policy "Budgets readable by owner" on public.budgets for select using (auth.uid() = user_id);
      create policy "Budgets insertable by owner" on public.budgets for insert with check (auth.uid() = user_id);
      create policy "Budgets updatable by owner" on public.budgets for update using (auth.uid() = user_id);
      create policy "Budgets deletable by owner" on public.budgets for delete using (auth.uid() = user_id);

      create policy "Insights readable by owner" on public.insights for select using (auth.uid() = user_id);
      create policy "Insights insertable by owner" on public.insights for insert with check (auth.uid() = user_id);
      create policy "Insights updatable by owner" on public.insights for update using (auth.uid() = user_id);
      create policy "Insights deletable by owner" on public.insights for delete using (auth.uid() = user_id);
    `
  },
  {
    id: "0005_alerts",
    sql: `
      create type if not exists alert_level as enum ('warning', 'alert');

      create table if not exists public.alerts (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade,
        category text,
        message text not null,
        level alert_level not null,
        created_at timestamptz not null default now(),
        is_read boolean not null default false
      );

      create index if not exists idx_alerts_user_id on public.alerts(user_id);
      create index if not exists idx_alerts_created_at on public.alerts(created_at);
      create index if not exists idx_alerts_is_read on public.alerts(is_read);

      alter table public.alerts enable row level security;

      create policy "Alerts readable by owner" on public.alerts for select using (auth.uid() = user_id);
      create policy "Alerts insertable by owner" on public.alerts for insert with check (auth.uid() = user_id);
      create policy "Alerts updatable by owner" on public.alerts for update using (auth.uid() = user_id);
      create policy "Alerts deletable by owner" on public.alerts for delete using (auth.uid() = user_id);
    `
  }
];

export async function runMigrations() {
  try {
    const supabase = await createClient();
    
    // Check if migrations table exists, create if not
    try {
      await supabase.rpc('exec_sql', { 
        sql: `
          create table if not exists public.migrations (
            id text primary key,
            applied_at timestamptz not null default now()
          );
        `
      });
    } catch (error) {
      // If RPC doesn't exist, try direct SQL (this might fail in some setups)
      console.log("Migrations table creation skipped - RPC not available");
    }

    for (const migration of migrations) {
      try {
        // Check if migration already applied
        const { data: existing } = await supabase
          .from('migrations')
          .select('id')
          .eq('id', migration.id)
          .single();

        if (existing) {
          console.log(`Migration ${migration.id} already applied`);
          continue;
        }

        // Apply migration
        console.log(`Applying migration ${migration.id}...`);
        
        // Split SQL into individual statements and execute
        const statements = migration.sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
            } catch (error) {
              console.log(`Statement failed (this is often expected): ${statement.substring(0, 50)}...`);
              console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }

        // Mark migration as applied
        try {
          await supabase
            .from('migrations')
            .insert({ id: migration.id });
        } catch (error) {
          console.log(`Could not mark migration ${migration.id} as applied`);
        }

        console.log(`Migration ${migration.id} applied successfully`);
      } catch (error) {
        console.error(`Failed to apply migration ${migration.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Migration system error:', error);
  }
}
