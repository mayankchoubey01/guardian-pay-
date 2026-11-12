import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { initDb } from '@/lib/db';
import { config } from '@/lib/config';

initDb();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('payment_id');

  if (!paymentId) {
    return NextResponse.redirect(`${config.appBaseUrl}/send`);
  }

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as any;
  if (payment && payment.status === 'ORDER_CREATED') {
    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE payments
      SET status = 'PAYER_CANCELED'
      WHERE id = ?
    `).run(paymentId);

    db.prepare(`
      INSERT INTO audit_log (id, payment_id, at, kind, detail_json)
      VALUES (?, ?, ?, 'PAYER_CANCELED', ?)
    `).run(
      `audit-${randomUUID()}`,
      paymentId,
      nowIso,
      JSON.stringify({ reason: 'Member canceled checkout on PayPal' })
    );
  }

  return NextResponse.redirect(`${config.appBaseUrl}/status/${paymentId}`);
}

