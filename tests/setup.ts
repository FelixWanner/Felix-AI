import { config } from 'dotenv';

// Load environment variables from .env.test or .env
config({ path: '.env.test' });
config({ path: '.env' });

// Test environment configuration
export const TEST_CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:8000',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'test-anon-key',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || 'test-service-key',
  N8N_URL: process.env.N8N_URL || 'http://localhost:5678',
  N8N_API_KEY: process.env.N8N_API_KEY || 'test-api-key',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'test-bot-token',
  TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL || 'http://localhost:5678/webhook/telegram',
};
