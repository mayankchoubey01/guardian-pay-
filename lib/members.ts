import db, { initDb } from './db';
import { getContactByHandle } from './contacts';

initDb();

export interface Member {
  id: string;
  name: string;
  role: 'head' | 'adult' | 'teen' | 'child' | 'elder';
  auto_limit: number;
  notify_limit: number;
  is_demo_seed: number;
}

export interface MemberPatternProfile {
  averageAmount: number;
  paymentCountLast24h: number;
  usualRecipients: string[];
  totalPastPayments: number;
  largestAmount: number;
  hasPaidContact: (handle: string) => boolean;
}

export function getAllMembers(): Member[] {
  return db.prepare('SELECT * FROM members ORDER BY id').all() as Member[];
}

export function getMemberById(id: string): Member | undefined {
  return db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Member | undefined;
}

export function updateMemberLimits(id: string, autoLimit: number, notifyLimit: number): void {
  db.prepare(`
    UPDATE members
    SET auto_limit = ?, notify_limit = ?
    WHERE id = ?
  `).run(autoLimit, notifyLimit, id);
}

// Computes the member's pattern profile based on past payments
export function getMemberPatternProfile(memberId: string): MemberPatternProfile {
  const pastPayments = db.prepare(`
    SELECT amount, recipient_label, created_at
    FROM payments
    WHERE member_id = ? AND status IN ('CAPTURED', 'HELD')
    ORDER BY created_at DESC
  `).all(memberId) as Array<{ amount: number; recipient_label: string; created_at: string }>;

  if (pastPayments.length === 0) {
    return {
      averageAmount: 0,
      paymentCountLast24h: 0,
      usualRecipients: [],
      totalPastPayments: 0,
      largestAmount: 0,
      hasPaidContact: () => false,
    };
  }

  const sum = pastPayments.reduce((acc, p) => acc + p.amount, 0);
  const averageAmount = Math.round((sum / pastPayments.length) * 100) / 100;
  const largestAmount = Math.max(...pastPayments.map(p => p.amount));

  // Payments in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const paymentCountLast24h = pastPayments.filter((p) => p.created_at >= oneDayAgo).length;

  // Most frequent recipients
  const counts: Record<string, number> = {};
  for (const p of pastPayments) {
    counts[p.recipient_label] = (counts[p.recipient_label] || 0) + 1;
  }
  const usualRecipients = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([recipient]) => recipient);

  // Helper to check if member has paid a contact by handle
  const hasPaidContact = (handle: string): boolean => {
    const contact = getContactByHandle(handle);
    if (!contact) return false;
    return pastPayments.some(p => 
      p.recipient_label.toLowerCase() === contact.name.toLowerCase()
    );
  };

  return {
    averageAmount,
    paymentCountLast24h,
    usualRecipients,
    totalPastPayments: pastPayments.length,
    largestAmount,
    hasPaidContact,
  };
}

// Check whether a recipient is new for this specific member
export function isRecipientNewForMember(memberId: string, recipient: string): boolean {
  const existing = db.prepare(`
    SELECT COUNT(*) as count
    FROM payments
    WHERE member_id = ? AND LOWER(recipient_label) = LOWER(?)
  `).get(memberId, recipient.trim()) as { count: number };

  return existing.count === 0;
}

