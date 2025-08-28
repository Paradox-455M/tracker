#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/migrations/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Migrations completed successfully!');
      console.log(result.message);
    } else {
      console.error('❌ Migration failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
    console.log('\n💡 Make sure your Next.js server is running with: npm run dev');
    process.exit(1);
  }
}

runMigrations();
