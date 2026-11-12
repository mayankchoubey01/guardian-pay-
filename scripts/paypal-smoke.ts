import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';

// Load environment variables from .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found.');
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  const env: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
  return env;
}

const env = loadEnv();
const BASE_URL = env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = env.PAYPAL_CLIENT_SECRET;
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/approved`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is missing in .env');
  process.exit(1);
}

// 1. Get OAuth Token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get PayPal token (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  console.log(`[PASS] Step 1: Got OAuth token (valid for ${data.expires_in} seconds)`);
  return data.access_token;
}

// 2. Create Order with intent = AUTHORIZE
async function createAuthorizeOrder(
  token: string,
  amount: string,
  memo: string
): Promise<{ id: string; approveUrl: string }> {
  const requestId = randomUUID();
  const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId,
    },
    body: JSON.stringify({
      intent: 'AUTHORIZE',
      purchase_units: [
        {
          reference_id: `ref-${Date.now()}`,
          amount: {
            currency_code: 'USD',
            value: amount,
          },
          description: memo,
        },
      ],
      application_context: {
        brand_name: 'Family Guardian Smoke Test',
        landing_page: 'LOGIN',
        user_action: 'CONTINUE',
        return_url: REDIRECT_URI,
        cancel_url: `http://localhost:${PORT}/cancel`,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const debugId = res.headers.get('paypal-debug-id');
    throw new Error(`Create order failed (${res.status}, PayPal-Debug-Id: ${debugId}): ${text}`);
  }

  const order = (await res.json()) as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };

  const approveLink = order.links.find((l) => l.rel === 'approve');
  if (!approveLink) {
    throw new Error(`No approve link found in order ${order.id}`);
  }

  console.log(`[PASS] Step 2: Created order ${order.id} (intent: AUTHORIZE, amount: $${amount})`);
  return { id: order.id, approveUrl: approveLink.href };
}

// 3. Authorize the approved order (places the hold)
async function authorizeOrder(token: string, orderId: string): Promise<string> {
  const requestId = randomUUID();
  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}/authorize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    const debugId = res.headers.get('paypal-debug-id');
    throw new Error(`Authorize failed (${res.status}, PayPal-Debug-Id: ${debugId}): ${text}`);
  }

  const data = (await res.json()) as any;
  const authorizationId =
    data.purchase_units?.[0]?.payments?.authorizations?.[0]?.id;

  if (!authorizationId) {
    throw new Error(`Authorization ID missing in response: ${JSON.stringify(data)}`);
  }

  console.log(`[PASS] Step 3: Order ${orderId} Authorized! Hold placed. Auth ID: ${authorizationId}`);
  return authorizationId;
}

// 4. Capture the authorization (money moves)
async function captureAuthorization(token: string, authId: string): Promise<string> {
  const requestId = randomUUID();
  const res = await fetch(`${BASE_URL}/v2/payments/authorizations/${authId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId,
    },
    body: JSON.stringify({ final_capture: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    const debugId = res.headers.get('paypal-debug-id');
    throw new Error(`Capture failed (${res.status}, PayPal-Debug-Id: ${debugId}): ${text}`);
  }

  const data = (await res.json()) as any;
  console.log(`[PASS] Step 4: Authorization ${authId} Captured! Capture ID: ${data.id}, Status: ${data.status}`);
  return data.id;
}

// 5. Void the authorization (money released / held funds canceled)
async function voidAuthorization(token: string, authId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/v2/payments/authorizations/${authId}/void`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    const debugId = res.headers.get('paypal-debug-id');
    throw new Error(`Void failed (${res.status}, PayPal-Debug-Id: ${debugId}): ${text}`);
  }

  console.log(`[PASS] Step 5: Authorization ${authId} Voided! Money released back to payer.`);
}

// Main execution runner
async function runSmokeTest() {
  console.log('==================================================');
  console.log('   PayPal Sandbox Smoke Test (Phase 1 Proof)      ');
  console.log('==================================================\n');

  const token = await getAccessToken();

  let currentResolve: ((orderId: string) => void) | null = null;

  // Start small local listener to catch user return redirect
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    if (url.pathname === '/approved') {
      const tokenParam = url.searchParams.get('token');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #f0fdf4;">
            <h1 style="color: #166534;">Payment Approved in Sandbox!</h1>
            <p style="font-size: 18px; color: #15803d;">You can close this tab now and look back at your terminal.</p>
          </body>
        </html>
      `);
      if (currentResolve && tokenParam) {
        currentResolve(tokenParam);
      }
    } else if (url.pathname === '/cancel') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Payment was canceled by user.</h1>');
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, async () => {
    try {
      // -----------------------------------------------------------------
      // TEST 1: Authorize -> Capture (Simulating Approved Payment)
      // -----------------------------------------------------------------
      console.log('\n--- TEST 1: Authorize then Capture ($10.00 USD) ---');
      const order1 = await createAuthorizeOrder(token, '10.00', 'Smoke Test 1 - Capture');

      console.log('\n>>> Please approve Test Order 1 in your browser:');
      console.log(`>>> URL: ${order1.approveUrl}\n`);
      console.log('Opening browser automatically...');
      exec(`open "${order1.approveUrl}"`);

      const approvedOrderId1 = await new Promise<string>((resolve) => {
        currentResolve = resolve;
      });

      console.log(`Buyer returned from PayPal with approved order: ${approvedOrderId1}`);
      const authId1 = await authorizeOrder(token, approvedOrderId1);
      await captureAuthorization(token, authId1);
      console.log('>>> TEST 1 COMPLETE: Authorize -> Capture works!\n');

      // -----------------------------------------------------------------
      // TEST 2: Authorize -> Void (Simulating Head Blocking Payment)
      // -----------------------------------------------------------------
      console.log('--- TEST 2: Authorize then Void ($5.00 USD) ---');
      const order2 = await createAuthorizeOrder(token, '5.00', 'Smoke Test 2 - Void');

      console.log('\n>>> Please approve Test Order 2 in your browser:');
      console.log(`>>> URL: ${order2.approveUrl}\n`);
      console.log('Opening browser automatically...');
      exec(`open "${order2.approveUrl}"`);

      const approvedOrderId2 = await new Promise<string>((resolve) => {
        currentResolve = resolve;
      });

      console.log(`Buyer returned from PayPal with approved order: ${approvedOrderId2}`);
      const authId2 = await authorizeOrder(token, approvedOrderId2);
      await voidAuthorization(token, authId2);
      console.log('>>> TEST 2 COMPLETE: Authorize -> Void works!\n');

      console.log('==================================================');
      console.log('ALL PHASE 1 CHECKS PASSED:');
      console.log('  1. OAuth token retrieval: SUCCESS');
      console.log('  2. Create order with intent AUTHORIZE: SUCCESS');
      console.log('  3. Authorize order (placing hold): SUCCESS');
      console.log('  4. Capture authorization: SUCCESS');
      console.log('  5. Void authorization (release hold): SUCCESS');
      console.log('==================================================');

      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('\nSMOKE TEST FAILED:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runSmokeTest();

