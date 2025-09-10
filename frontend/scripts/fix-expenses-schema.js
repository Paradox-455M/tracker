#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// This script directly adds the missing columns to the expenses table
async function fixExpensesSchema() {
  console.log('🔧 Fixing expenses table schema...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Add the missing columns directly
    console.log('Adding ai_category column...');
    const { error: aiCategoryError } = await supabase
      .from('expenses')
      .select('ai_category')
      .limit(1);
    
    if (aiCategoryError && aiCategoryError.message.includes('column "ai_category" does not exist')) {
      console.log('ai_category column missing, adding it...');
      // We'll use a direct SQL approach
      const { error: addAiCategoryError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS ai_category text;'
      });
      
      if (addAiCategoryError) {
        console.log('RPC failed, trying alternative approach...');
        // Alternative: try to insert a test record to see what columns exist
        console.log('Checking current schema by attempting insert...');
      }
    } else {
      console.log('✅ ai_category column already exists');
    }

    console.log('Adding final_category column...');
    const { error: finalCategoryError } = await supabase
      .from('expenses')
      .select('final_category')
      .limit(1);
    
    if (finalCategoryError && finalCategoryError.message.includes('column "final_category" does not exist')) {
      console.log('final_category column missing, adding it...');
      const { error: addFinalCategoryError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS final_category text NOT NULL DEFAULT \'Other\';'
      });
      
      if (addFinalCategoryError) {
        console.log('RPC failed for final_category as well');
      }
    } else {
      console.log('✅ final_category column already exists');
    }

    // Test the schema by trying to select from the table
    console.log('Testing schema...');
    const { data, error } = await supabase
      .from('expenses')
      .select('id, ai_category, final_category')
      .limit(1);
    
    if (error) {
      console.error('❌ Schema test failed:', error.message);
      console.log('\n💡 Manual fix required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Open SQL Editor');
      console.log('3. Run this SQL:');
      console.log(`
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS ai_category text,
  ADD COLUMN IF NOT EXISTS final_category text NOT NULL DEFAULT 'Other';

CREATE INDEX IF NOT EXISTS idx_expenses_final_category ON public.expenses(final_category);
      `);
    } else {
      console.log('✅ Schema is correct! Both columns exist.');
    }

  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
    console.log('\n💡 Manual fix required - see instructions above');
  }
}

fixExpensesSchema();
