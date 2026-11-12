import db, { initDb } from './db';
import { randomUUID } from 'crypto';

export interface Contact {
  id: string;
  name: string;
  handle: string;
  category: 'utility' | 'store' | 'school' | 'pharmacy' | 'service' | 'person';
  trust: 'trusted' | 'known' | 'new';
  avatar_color: string;
  is_demo_seed: number;
}

export interface MemberRecentContact {
  contact_id: string;
  name: string;
  handle: string;
  category: string;
  trust: string;
  avatar_color: string;
  last_paid_at: string;
}

function ensureDbInitialized() {
  initDb();
}

export function getAllContacts(): Contact[] {
  ensureDbInitialized();
  return db.prepare('SELECT * FROM contacts ORDER BY name').all() as Contact[];
}

export function getContactById(id: string): Contact | undefined {
  ensureDbInitialized();
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as Contact | undefined;
}

export function getContactByHandle(handle: string): Contact | undefined {
  ensureDbInitialized();
  return db.prepare('SELECT * FROM contacts WHERE handle = ?').get(handle) as Contact | undefined;
}

export function createContact(contact: Omit<Contact, 'id'>): Contact {
  ensureDbInitialized();
  const id = `contact-${randomUUID()}`;
  const newContact = { id, ...contact };
  db.prepare(`
    INSERT INTO contacts (id, name, handle, category, trust, avatar_color, is_demo_seed)
    VALUES (@id, @name, @handle, @category, @trust, @avatar_color, @is_demo_seed)
  `).run(newContact);
  return newContact;
}

export function getOrCreateContactFromScan(name: string, handle: string): Contact {
  ensureDbInitialized();
  const existing = getContactByHandle(handle);
  if (existing) return existing;

  // Create new contact with trust "new" and category "person"
  return createContact({
    name: name.trim() || 'Unknown',
    handle: handle.trim(),
    category: 'person',
    trust: 'new',
    avatar_color: getRandomAvatarColor(),
    is_demo_seed: 0,
  });
}

export function getMemberRecentContacts(memberId: string, limit = 5): MemberRecentContact[] {
  ensureDbInitialized();
  const rows = db.prepare(`
    SELECT DISTINCT c.id as contact_id, c.name, c.handle, c.category, c.trust, c.avatar_color,
           MAX(p.created_at) as last_paid_at
    FROM payments p
    JOIN contacts c ON c.handle = (
      SELECT handle FROM contacts WHERE name = p.recipient_label LIMIT 1
    ) OR c.name = p.recipient_label
    WHERE p.member_id = ? AND p.status IN ('CAPTURED', 'HELD', 'VOIDED', 'EXPIRED')
    GROUP BY c.id, c.name, c.handle, c.category, c.trust, c.avatar_color
    ORDER BY last_paid_at DESC
    LIMIT ?
  `).all(memberId, limit) as MemberRecentContact[];

  return rows;
}

export function searchContacts(query: string): Contact[] {
  ensureDbInitialized();
  const term = `%${query.toLowerCase()}%`;
  return db.prepare(`
    SELECT * FROM contacts
    WHERE LOWER(name) LIKE ? OR LOWER(handle) LIKE ?
    ORDER BY
      CASE trust WHEN 'trusted' THEN 0 WHEN 'known' THEN 1 ELSE 2 END,
      name
  `).all(term, term) as Contact[];
}

function getRandomAvatarColor(): string {
  const colors = ['#3b82f6', '#22c55e', '#ec4899', '#f59e0b', '#06b6d4', '#8b5cf6', '#6366f1', '#ef4444', '#14b8a6', '#f97316'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export interface MemberRecentContact {
  contact_id: string;
  name: string;
  handle: string;
  category: string;
  trust: string;
  avatar_color: string;
  last_paid_at: string;
}