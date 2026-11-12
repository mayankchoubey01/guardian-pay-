import * as fs from 'fs';
import * as path from 'path';

// Load .env explicitly if running in standalone script or Next.js
function loadDotenv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadDotenv();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.includes('your_') || val.trim().length === 0) {
    throw new Error(`Configuration Error: Missing required environment variable "${key}". Please check your .env file.`);
  }
  return val.trim();
}

function optionalEnv(key: string, fallback: string = ''): string {
  const val = process.env[key];
  if (!val || val.includes('your_')) return fallback;
  return val.trim();
}

export const config = {
  appBaseUrl: optionalEnv('APP_BASE_URL', 'http://localhost:3000'),
  paypalEnv: optionalEnv('PAYPAL_ENV', 'sandbox'),
  paypalBaseUrl: optionalEnv('PAYPAL_BASE_URL', 'https://api-m.sandbox.paypal.com'),
  paypalClientId: requireEnv('PAYPAL_CLIENT_ID'),
  paypalClientSecret: requireEnv('PAYPAL_CLIENT_SECRET'),
  paypalWebhookId: optionalEnv('PAYPAL_WEBHOOK_ID', ''),
  aiProvider: optionalEnv('AI_PROVIDER', 'gemini'),
  aiApiKey: requireEnv('AI_API_KEY'),
  aiModel: optionalEnv('AI_MODEL', 'gemini-3.5-flash'),
  zapierWebhookUrl: optionalEnv('ZAPIER_WEBHOOK_URL', ''),
};
