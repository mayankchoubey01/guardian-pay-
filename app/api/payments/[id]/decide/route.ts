import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { initDb } from '@/lib/db';
import { captureAuthorization, voidAuthorization } from '@/lib/paypal';

initDb();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, decided_by } = body; // action: 'approve' | 'block'

    if (!action || !['approve', 'block'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "block".' }, { status: 400 });
    }

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as any;
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }

    // Section 10: Head clicks Approve or Block twice, or in two tabs -> reject duplicate action
    if (payment.status !== 'HELD') {
      return NextResponse.json(
        {
          error: `This payment is already finalized with status "${payment.status}" (decided by ${payment.decided_by || 'system'}).`,
          status: payment.status,
          decided_by: payment.decided_by,
        },
        { status: 409 }
      );
    }

    const authId = payment.paypal_authorization_id;
    const nowIso = new Date().toISOString();
    const deciderName = decided_by || 'Dad (Head)';

    if (action === 'approve') {
      // 1. Capture held funds via PayPal REST API (or mock if seed/demo fallback)
      let captureId = `cap-${randomUUID()}`;
      if (authId && !authId.startsWith('MOCK-')) {
        const result = await captureAuthorization(authId);
        captureId = result.captureId;
      }

      db.prepare(`
        UPDATE payments
        SET status = 'CAPTURED',
            paypal_capture_id = ?,
            decided_by = ?,
            decided_at = ?
        WHERE id = ?
      `).run(captureId, deciderName, nowIso, id);

      db.prepare(`
        INSERT INTO audit_log (id, payment_id, at, kind, detail_json)
        VALUES (?, ?, ?, 'HEAD_APPROVED', ?)
      `).run(
        `audit-${randomUUID()}`,
        id,
        nowIso,
        JSON.stringify({ decider: deciderName, action: 'approve', captureId })
      );

      return NextResponse.json({ success: true, status: 'CAPTURED', captureId });
    } else {
      // 2. Void held funds via PayPal REST API (money released back to payer)
      if (authId && !authId.startsWith('MOCK-')) {
        await voidAuthorization(authId);
      }

      db.prepare(`
        UPDATE payments
        SET status = 'VOIDED',
            decided_by = ?,
            decided_at = ?
        WHERE id = ?
      `).run(deciderName, nowIso, id);

      db.prepare(`
        INSERT INTO notifications (id, created_at, kind, payment_id, read)
        VALUES (?, ?, 'blocked', ?, 0)
      `).run(`notif-${randomUUID()}`, nowIso, id);

      db.prepare(`
        INSERT INTO audit_log (id, payment_id, at, kind, detail_json)
        VALUES (?, ?, ?, 'HEAD_BLOCKED', ?)
      `).run(
        `audit-${randomUUID()}`,
        id,
        nowIso,
        JSON.stringify({ decider: deciderName, action: 'block' })
      );

      return NextResponse.json({ success: true, status: 'VOIDED' });
    }
  } catch (err: any) {
    console.error('Decision error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

