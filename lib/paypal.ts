import { config } from './config';
import { randomUUID } from 'crypto';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp ms
}

let cachedToken: CachedToken | null = null;

// Get or refresh OAuth token (cached with safe 60s buffer)
export async function getPayPalAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64');
  const res = await fetch(`${config.paypalBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    const debugId = res.headers.get('paypal-debug-id');
    throw new Error(`PayPal Auth Error (${res.status}, PayPal-Debug-Id: ${debugId}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

// Create an order with intent AUTHORIZE (money placed on hold)
export async function createAuthorizeOrder(params: {
  paymentId: string;
  amount: number;
  memo: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approveUrl: string }> {
  let token = await getPayPalAccessToken();
  const requestId = randomUUID();

  const formattedAmount = params.amount.toFixed(2);

  const payload = {
    intent: 'AUTHORIZE',
    purchase_units: [
      {
        reference_id: params.paymentId,
        custom_id: params.paymentId,
        amount: {
          currency_code: 'USD',
          value: formattedAmount,
        },
        description: params.memo.slice(0, 120),
      },
    ],
    application_context: {
      brand_name: 'Guardian Pay',
      landing_page: 'LOGIN',
      user_action: 'CONTINUE',
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
    },
  };

  let res = await fetch(`${config.paypalBaseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId,
    },
    body: JSON.stringify(payload),
  });

  // Re-fetch token on 401
  if (res.status === 401) {
    token = await getPayPalAccessToken(true);
    res = await fetch(`${config.paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': requestId,
      },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    const debugId = res.headers.get('paypal-debug-id');
    throw new Error(`Create Order Failed (${res.status}, PayPal-Debug-Id: ${debugId}): ${text}`);
  }

  const order = (await res.json()) as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };

  const approveLink = order.links.find((l) => l.rel === 'approve');
  if (!approveLink) {
    throw new Error(`Order ${order.id} missing approve link`);
  }

  return {
    orderId: order.id,
    approveUrl: approveLink.href,
  };
}

// Authorize the approved order (locks the hold on funds)
export async function authorizeOrder(orderId: string): Promise<{ authorizationId: string; status: string }> {
  let token = await getPayPalAccessToken();
  const requestId = randomUUID();

  let res = await fetch(`${config.paypalBaseUrl}/v2/checkout/orders/${orderId}/authorize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId,
    },
  });

  if (res.status === 401) {
    token = await getPayPalAccessToken(true);
    res = await fetch(`${config.paypalBaseUrl}/v2/checkout/orders/${orderId}/authorize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': requestId,
      },
    });
  }

  if (!res.ok) {
    const text = await res.text();
    const debugId = res.headers.get('paypal-debug-id');
    throw new Error(`Authorize Order Failed (${res.status}, PayPal-Debug-Id: ${debugId}): ${text}`);
  }

  const data = (await res.json()) as any;
  const auth = data.purchase_units?.[0]?.payments?.authorizations?.[0];
  if (!auth?.id) {
    throw new Error(`Authorization ID not found in PayPal response: ${JSON.stringify(data)}`);
  }

  return {
    authorizationId: auth.id,
    status: auth.status,
  };
}

// Capture authorization (head approves payment -> money transfers)
export async function captureAuthorization(authorizationId: string): Promise<{ captureId: string; status: string }> {
  let token = await getPayPalAccessToken();
  const requestId = randomUUID();

  let res = await fetch(`${config.paypalBaseUrl}/v2/payments/authorizations/${authorizationId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': requestId,
    },
    body: JSON.stringify({ final_capture: true }),
  });

  if (res.status === 401) {
    token = await getPayPalAccessToken(true);
    res = await fetch(`${config.paypalBaseUrl}/v2/payments/authorizations/${authorizationId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': requestId,
      },
      body: JSON.stringify({ final_capture: true }),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    const debugId = res.headers.get('paypal-debug-id');
    throw new Error(`Capture Failed (${res.status}, PayPal-Debug-Id: ${debugId}): ${text}`);
  }

  const data = (await res.json()) as any;
  return {
    captureId: data.id,
    status: data.status,
  };
}

// Void authorization (head blocks payment -> money released)
export async function voidAuthorization(authorizationId: string): Promise<void> {
  let token = await getPayPalAccessToken();

  let res = await fetch(`${config.paypalBaseUrl}/v2/payments/authorizations/${authorizationId}/void`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    token = await getPayPalAccessToken(true);
    res = await fetch(`${config.paypalBaseUrl}/v2/payments/authorizations/${authorizationId}/void`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    const debugId = res.headers.get('paypal-debug-id');
    throw new Error(`Void Failed (${res.status}, PayPal-Debug-Id: ${debugId}): ${text}`);
  }
}

// Verify incoming PayPal Webhook signature
export async function verifyWebhookSignature(params: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookId: string;
  webhookEvent: any;
}): Promise<boolean> {
  let token = await getPayPalAccessToken();

  const payload = {
    auth_algo: params.authAlgo,
    cert_url: params.certUrl,
    transmission_id: params.transmissionId,
    transmission_sig: params.transmissionSig,
    transmission_time: params.transmissionTime,
    webhook_id: params.webhookId,
    webhook_event: params.webhookEvent,
  };

  const res = await fetch(`${config.paypalBaseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return false;
  }

  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === 'SUCCESS';
}

