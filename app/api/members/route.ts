import { NextResponse } from 'next/server';
import { getAllMembers, updateMemberLimits } from '@/lib/members';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const members = getAllMembers();
    return NextResponse.json(members);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, auto_limit, notify_limit } = body;
    if (!id || auto_limit === undefined || notify_limit === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    updateMemberLimits(id, Number(auto_limit), Number(notify_limit));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
