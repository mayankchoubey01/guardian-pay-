import { NextResponse } from 'next/server';
import db, { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

initDb();

export async function GET() {
  try {
    const notifications = db.prepare(`
      SELECT n.*, p.amount, p.recipient_label, p.status as payment_status, p.tier, m.name as member_name
      FROM notifications n
      JOIN payments p ON n.payment_id = p.id
      JOIN members m ON p.member_id = m.id
      ORDER BY n.created_at DESC
    `).all();

    return NextResponse.json(notifications);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { notification_id } = await req.json();
    if (notification_id) {
      db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notification_id);
    } else {
      db.prepare('UPDATE notifications SET read = 1').run();
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
