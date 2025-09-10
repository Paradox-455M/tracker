#!/usr/bin/env node

const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Function to check if server is ready
async function waitForServer(maxAttempts = 30, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/migrations/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    
    console.log(`⏳ Waiting for server to start... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

// Function to run migrations
async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/migrations/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Migrations completed successfully!');
      return true;
    } else {
      console.error('❌ Migration failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
    return false;
  }
}

// Main function
async function startWithMigrations() {
  console.log('🚀 Starting Next.js server with automatic migrations...');
  
  // Start the Next.js server
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  // Wait for server to be ready
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.error('❌ Server failed to start within timeout');
    serverProcess.kill();
    process.exit(1);
  }

  // Run migrations
  const migrationSuccess = await runMigrations();
  if (!migrationSuccess) {
    console.error('❌ Migrations failed, but server is running');
    console.log('💡 You can run migrations manually with: npm run migrate');
  }

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill();
    process.exit(0);
  });
}

startWithMigrations().catch(error => {
  console.error('❌ Failed to start with migrations:', error);
  process.exit(1);
});
