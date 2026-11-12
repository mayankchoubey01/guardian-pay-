import { NextResponse } from 'next/server';
import { getMemberRecentContacts } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contacts = getMemberRecentContacts(id, 5);
    return NextResponse.json(contacts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}