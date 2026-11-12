import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { initDb } from '@/lib/db';
import { authorizeOrder, captureAuthorization } from '@/lib/paypal';
import { config } from '@/lib/config';

initDb();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('payment_id');
  const token = searchParams.get('token'); // PayPal Order ID

  if (!paymentId) {
    return NextResponse.redirect(`${config.appBaseUrl}/send`);
  }

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as any;
  if (!payment) {
    return NextResponse.redirect(`${config.appBaseUrl}/send`);
  }

  // Idempotency: if already processed past ORDER_CREATED, just redirect to status page
  if (payment.status !== 'ORDER_CREATED') {
    return NextResponse.redirect(`${config.appBaseUrl}/status/${paymentId}`);
  }

  const orderId = payment.paypal_order_id || token;
  const nowIso = new Date().toISOString();

  try {
    // 1. Authorize the approved PayPal order (places the hold)
    const { authorizationId } = await authorizeOrder(orderId);

    // 2. Decide action based on Policy Gate tier
    if (payment.tier === 'AUTO' || payment.tier === 'NOTIFY') {
      // Capture immediately
      const capture = await captureAuthorization(authorizationId);

      db.prepare(`
        UPDATE payments
        SET paypal_authorization_id = ?,
            paypal_capture_id = ?,
            status = 'CAPTURED',
            decided_by = ?,
            decided_at = ?
        WHERE id = ?
      `).run(
        authorizationId,
        capture.captureId,
        payment.tier === 'AUTO' ? 'System (Auto)' : 'System (Notify)',
        nowIso,
        paymentId
      );

      if (payment.tier === 'NOTIFY') {
        db.prepare(`
          INSERT INTO notifications (id, created_at, kind, payment_id, read)
          VALUES (?, ?, 'notify', ?, 0)
        `).run(`notif-${randomUUID()}`, nowIso, paymentId);
      }

      db.prepare(`
        INSERT INTO audit_log (id, payment_id, at, kind, detail_json)
        VALUES (?, ?, ?, 'PAYMENT_CAPTURED', ?)
      `).run(
        `audit-${randomUUID()}`,
        paymentId,
        nowIso,
        JSON.stringify({ authorizationId, captureId: capture.captureId, tier: payment.tier })
      );
    } else {
      // APPROVAL tier: Hold the funds, alert Head of family
      db.prepare(`
        UPDATE payments
        SET paypal_authorization_id = ?,
            status = 'HELD'
        WHERE id = ?
      `).run(authorizationId, paymentId);

      db.prepare(`
        INSERT INTO notifications (id, created_at, kind, payment_id, read)
        VALUES (?, ?, 'approval_needed', ?, 0)
      `).run(`notif-${randomUUID()}`, nowIso, paymentId);

      db.prepare(`
        INSERT INTO audit_log (id, payment_id, at, kind, detail_json)
        VALUES (?, ?, ?, 'PAYMENT_HELD', ?)
      `).run(
        `audit-${randomUUID()}`,
        paymentId,
        nowIso,
        JSON.stringify({ authorizationId, tier: 'APPROVAL' })
      );
    }

    return NextResponse.redirect(`${config.appBaseUrl}/status/${paymentId}`);
  } catch (err: any) {
    console.error('Authorization/Capture failed on return:', err);
    db.prepare(`
      UPDATE payments
      SET status = 'FAILED'
      WHERE id = ?
    `).run(paymentId);

    db.prepare(`
      INSERT INTO audit_log (id, payment_id, at, kind, detail_json)
      VALUES (?, ?, ?, 'PAYMENT_FAILED', ?)
    `).run(
      `audit-${randomUUID()}`,
      paymentId,
      nowIso,
      JSON.stringify({ error: err.message })
    );

    return NextResponse.redirect(`${config.appBaseUrl}/status/${paymentId}?error=${encodeURIComponent(err.message)}`);
  }
}

