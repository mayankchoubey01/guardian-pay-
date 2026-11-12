import { NextResponse } from 'next/server';
import db, { initDb } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/paypal';
import { config } from '@/lib/config';
import { randomUUID } from 'crypto';

initDb();

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    const headers = req.headers;
    const transmissionId = headers.get('paypal-transmission-id') || '';
    const transmissionTime = headers.get('paypal-transmission-time') || '';
    const certUrl = headers.get('paypal-cert-url') || '';
    const authAlgo = headers.get('paypal-auth-algo') || '';
    const transmissionSig = headers.get('paypal-transmission-sig') || '';

    // Verify webhook signature if webhook ID is set in environment
    if (config.paypalWebhookId) {
      const isValid = await verifyWebhookSignature({
        transmissionId,
        transmissionTime,
        certUrl,
        authAlgo,
        transmissionSig,
        webhookId: config.paypalWebhookId,
        webhookEvent: event,
      });

      if (!isValid) {
        console.warn('Rejected invalid PayPal webhook signature.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const eventId = event.id;
    const eventType = event.event_type;

    // Idempotency: check if event was already processed
    const existing = db.prepare('SELECT event_id FROM webhook_events WHERE event_id = ?').get(eventId);
    if (existing) {
      // Repeat webhook, return 200 immediately
      return NextResponse.json({ status: 'already_processed' }, { status: 200 });
    }

    // Record webhook event in DB
    db.prepare(`
      INSERT INTO webhook_events (event_id, type, received_at)
      VALUES (?, ?, ?)
    `).run(eventId, eventType, new Date().toISOString());

    const resource = event.resource;
    const customId = resource?.custom_id || resource?.supplementary_data?.related_ids?.order_id;

    // Handle known event types
    switch (eventType) {
      case 'PAYMENT.AUTHORIZATION.CREATED': {
        const authId = resource?.id;
        if (customId) {
          db.prepare(`
            UPDATE payments
            SET paypal_authorization_id = COALESCE(paypal_authorization_id, ?)
            WHERE id = ? OR paypal_order_id = ?
          `).run(authId, customId, customId);
        }
        break;
      }
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const captureId = resource?.id;
        if (customId) {
          db.prepare(`
            UPDATE payments
            SET paypal_capture_id = ?, status = 'CAPTURED'
            WHERE (id = ? OR paypal_order_id = ?) AND status != 'CAPTURED'
          `).run(captureId, customId, customId);
        }
        break;
      }
      case 'PAYMENT.AUTHORIZATION.VOIDED': {
        if (customId) {
          db.prepare(`
            UPDATE payments
            SET status = 'VOIDED'
            WHERE (id = ? OR paypal_order_id = ?) AND status != 'VOIDED'
          `).run(customId, customId);
        }
        break;
      }
      case 'PAYMENT.CAPTURE.DENIED': {
        if (customId) {
          db.prepare(`
            UPDATE payments
            SET status = 'FAILED'
            WHERE id = ? OR paypal_order_id = ?
          `).run(customId, customId);
        }
        break;
      }
    }

    // Log to audit log
    db.prepare(`
      INSERT INTO audit_log (id, payment_id, at, kind, detail_json)
      VALUES (?, ?, ?, 'WEBHOOK_RECEIVED', ?)
    `).run(
      `audit-${randomUUID()}`,
      customId || 'unknown',
      new Date().toISOString(),
      JSON.stringify({ eventId, eventType })
    );

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 200 }); // Always 200 to prevent infinite PayPal retry storms
  }
}

