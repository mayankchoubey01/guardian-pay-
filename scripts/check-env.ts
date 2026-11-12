import * as fs from 'fs';
import * as path from 'path';

// Simple script to verify which environment variables are set without logging their secret values
function checkEnv() {
  // Load .env manually if not already loaded by runner
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

  const requiredKeys = [
    'APP_BASE_URL',
    'PAYPAL_ENV',
    'PAYPAL_BASE_URL',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'AI_PROVIDER',
    'AI_API_KEY',
    'AI_MODEL',
  ];

  const optionalKeys = ['PAYPAL_WEBHOOK_ID', 'ZAPIER_WEBHOOK_URL'];

  console.log('--- Environment Check ---');
  let allRequiredSet = true;

  for (const key of requiredKeys) {
    const val = process.env[key];
    const isSet = Boolean(val && !val.includes('your_') && val.trim().length > 0);
    console.log(`[${isSet ? 'OK' : 'MISSING'}] ${key}`);
    if (!isSet) allRequiredSet = false;
  }

  for (const key of optionalKeys) {
    const val = process.env[key];
    const isSet = Boolean(val && !val.includes('your_') && val.trim().length > 0);
    console.log(`[${isSet ? 'SET' : 'OPTIONAL'}] ${key}`);
  }

  console.log('-------------------------');
  if (allRequiredSet) {
    console.log('SUCCESS: All required environment variables are set.');
    process.exit(0);
  } else {
    console.log('WARNING: Some required environment variables are missing or still placeholder values.');
    process.exit(1);
  }
}

checkEnv();

