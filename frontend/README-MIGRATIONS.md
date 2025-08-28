# Database Migrations

This project includes an automatic migration system that ensures your database schema is always up to date.

## How to Run Migrations

### Option 1: Using npm script (Recommended)
```bash
npm run migrate
```

### Option 2: Manual API call
```bash
curl -X POST http://localhost:3000/api/migrations/run
```

## What Migrations Do

The migration system automatically:

1. **Creates missing tables** (budgets, insights, alerts)
2. **Adds missing columns** (ai_category, final_category to expenses)
3. **Sets up Row Level Security (RLS) policies**
4. **Creates necessary indexes**
5. **Tracks which migrations have been applied**

## When to Run Migrations

- **First time setup**: After cloning the project
- **After pulling updates**: If new migrations were added
- **Database errors**: If you see "column not found" errors
- **Before starting development**: To ensure schema is current

## Migration Files

The system includes these migrations:

- `0003_expenses_categories`: Adds AI categorization columns
- `0004_budgets_insights`: Creates budgets and insights tables
- `0005_alerts`: Creates notification alerts system

## Troubleshooting

### "RPC not available" warning
This is normal if your Supabase project doesn't have the `exec_sql` function. The migration will still work for basic operations.

### Migration already applied
The system tracks applied migrations and won't re-run them.

### Server not running
Make sure to start your Next.js server first:
```bash
npm run dev
```

Then run migrations:
```bash
npm run migrate
```

## Manual Database Setup

If you prefer to run SQL manually in Supabase dashboard:

1. Go to SQL Editor in your Supabase project
2. Run the SQL from each migration file in order
3. This bypasses the automatic system but gives you full control
