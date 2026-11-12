import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import db, { initDb } from '@/lib/db';
import { voidAuthorization } from '@/lib/paypal';

initDb();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = db.prepare(`
      SELECT p.*, m.name as member_name, m.role as member_role
      FROM payments p
      JOIN members m ON p.member_id = m.id
      WHERE p.id = ?
    `).get(id) as any;

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.ai_json) {
      try {
        payment.ai_parsed = JSON.parse(payment.ai_json);
      } catch {
        payment.ai_parsed = null;
      }
    }

    // Release an expired hold at PayPal before marking it expired locally.
    if (
      payment.status === 'HELD' &&
      payment.decision_deadline &&
      new Date(payment.decision_deadline).getTime() < Date.now()
    ) {
      const authorizationId = payment.paypal_authorization_id;
      if (!authorizationId) {
        return NextResponse.json(
          { error: 'Expired payment has no PayPal authorization to release.' },
          { status: 409 }
        );
      }

      try {
        if (!authorizationId.startsWith('MOCK-')) {
          await voidAuthorization(authorizationId);
        }
      } catch (voidError: any) {
        console.error('Failed to release expired PayPal authorization:', voidError);
        return NextResponse.json(
          { error: 'Could not release the expired PayPal hold. Please retry or review it manually.' },
          { status: 502 }
        );
      }

      const nowIso = new Date().toISOString();
      const result = db.prepare(`
        UPDATE payments
        SET status = 'EXPIRED'
        WHERE id = ? AND status = 'HELD'
      `).run(payment.id);

      if (result.changes > 0) {
        db.prepare(`
          INSERT INTO notifications (id, created_at, kind, payment_id, read)
          VALUES (?, ?, 'expired', ?, 0)
        `).run(`notif-${randomUUID()}`, nowIso, payment.id);

        db.prepare(`
          INSERT INTO audit_log (id, payment_id, at, kind, detail_json)
          VALUES (?, ?, ?, 'PAYMENT_EXPIRED_AND_VOIDED', ?)
        `).run(
          `audit-${randomUUID()}`,
          payment.id,
          nowIso,
          JSON.stringify({ authorizationId })
        );
      }

      payment.status = 'EXPIRED';
    }

    return NextResponse.json(payment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

