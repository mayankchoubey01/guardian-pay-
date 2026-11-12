import { NextResponse } from 'next/server';
import { getAllContacts, getContactByHandle, createContact, getOrCreateContactFromScan } from '@/lib/contacts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get('handle');
    const name = searchParams.get('name');

    if (handle) {
      let contact = getContactByHandle(handle);
      if (!contact && name) {
        contact = getOrCreateContactFromScan(name, handle);
      }
      if (contact) {
        return NextResponse.json(contact);
      }
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contacts = getAllContacts();
    return NextResponse.json(contacts);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, handle, category, trust, avatar_color } = body;

    if (!name || !handle) {
      return NextResponse.json({ error: 'Name and handle are required' }, { status: 400 });
    }

    const contact = createContact({
      name: name.trim(),
      handle: handle.trim(),
      category: category || 'person',
      trust: trust || 'new',
      avatar_color: avatar_color || getRandomAvatarColor(),
      is_demo_seed: 0,
    });

    return NextResponse.json(contact);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getRandomAvatarColor(): string {
  const colors = ['#3b82f6', '#22c55e', '#ec4899', '#f59e0b', '#06b6d4', '#8b5cf6', '#6366f1', '#ef4444', '#14b8a6', '#f97316'];
  return colors[Math.floor(Math.random() * colors.length)];
}