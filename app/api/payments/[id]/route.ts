import { NextResponse } from 'next/server';
import db, { initDb } from '@/lib/db';

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

    // Check if authorization has expired (24h deadline)
    if (
      payment.status === 'HELD' &&
      payment.decision_deadline &&
      new Date(payment.decision_deadline).getTime() < Date.now()
    ) {
      // Auto-void expired authorization
      db.prepare(`
        UPDATE payments
        SET status = 'EXPIRED'
        WHERE id = ?
      `).run(payment.id);

      db.prepare(`
        INSERT INTO notifications (id, created_at, kind, payment_id, read)
        VALUES (?, ?, 'expired', ?, 0)
      `).run(`notif-${Date.now()}`, new Date().toISOString(), payment.id);

      payment.status = 'EXPIRED';
    }

    return NextResponse.json(payment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

