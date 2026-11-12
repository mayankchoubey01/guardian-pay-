import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const memberCheck = db.prepare('SELECT COUNT(*) as count FROM members').get() as { count: number };
    return NextResponse.json({
      status: 'healthy',
      app: 'Guardian Pay',
      time: new Date().toISOString(),
      database: memberCheck.count > 0 ? 'connected' : 'empty',
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'unhealthy', error: err.message },
      { status: 500 }
    );
  }
}
