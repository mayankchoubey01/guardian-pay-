import { NextResponse } from 'next/server';
import db, { initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

initDb();

export async function GET() {
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0').get() as { count: number };
    return NextResponse.json({ count: row?.count || 0 });
  } catch (err: any) {
    return NextResponse.json({ count: 0 });
  }
}
