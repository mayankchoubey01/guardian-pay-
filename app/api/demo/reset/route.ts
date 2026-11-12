import { NextResponse } from 'next/server';
import { resetDemoData } from '@/lib/db';

export async function POST() {
  try {
    resetDemoData();
    return NextResponse.json({ success: true, message: 'Demo data reset successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

