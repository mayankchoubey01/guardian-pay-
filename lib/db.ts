import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

// Ensure database directory exists (using dot-directory to prevent Next.js dev file-watcher reload loops)
const dbDir = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Migrate from old data folder if needed
const oldDbPath = path.resolve(process.cwd(), 'data', 'guardian.db');
const dbPath = path.join(dbDir, 'guardian.db');
if (fs.existsSync(oldDbPath) && !fs.existsSync(dbPath)) {
  try {
    fs.copyFileSync(oldDbPath, dbPath);
  } catch {}
}
const db = new Database(dbPath);

// Enable WAL mode for concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize database tables
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      auto_limit REAL NOT NULL,
      notify_limit REAL NOT NULL,
      is_demo_seed INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      category TEXT NOT NULL,
      trust TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      is_demo_seed INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      recipient_label TEXT NOT NULL,
      is_new_recipient INTEGER NOT NULL DEFAULT 0,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      reason_text TEXT NOT NULL,
      risk_level TEXT NOT NULL DEFAULT 'low',
      risk_score REAL NOT NULL DEFAULT 0,
      ai_json TEXT,
      tier TEXT NOT NULL DEFAULT 'AUTO',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      paypal_order_id TEXT,
      paypal_authorization_id TEXT,
      paypal_capture_id TEXT,
      decided_by TEXT,
      decided_at TEXT,
      decision_deadline TEXT,
      is_demo_seed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(member_id) REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      kind TEXT NOT NULL,
      payment_id TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(payment_id) REFERENCES payments(id)
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      event_id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      received_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      at TEXT NOT NULL,
      kind TEXT NOT NULL,
      detail_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      text TEXT NOT NULL
    );
  `);

  seedInitialDataIfEmpty();
}

// Seed the 5 family members and ~25 realistic payments over 3 weeks
export function seedInitialDataIfEmpty() {
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get() as { count: number };
  if (memberCount.count === 0) {
    seedMembers();
    seedContacts();
    seedPayments();
  }
}

export function seedMembers() {
  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO members (id, name, role, auto_limit, notify_limit, is_demo_seed)
    VALUES (@id, @name, @role, @auto_limit, @notify_limit, @is_demo_seed)
  `);

  const familyMembers = [
    { id: 'dad', name: 'Dad', role: 'head', auto_limit: 999999, notify_limit: 999999, is_demo_seed: 1 },
    { id: 'mom', name: 'Mom', role: 'adult', auto_limit: 25, notify_limit: 100, is_demo_seed: 1 },
    { id: 'riya', name: 'Riya', role: 'teen', auto_limit: 10, notify_limit: 40, is_demo_seed: 1 },
    { id: 'aarav', name: 'Aarav', role: 'child', auto_limit: 5, notify_limit: 20, is_demo_seed: 1 },
    { id: 'grandma', name: 'Grandma', role: 'elder', auto_limit: 10, notify_limit: 30, is_demo_seed: 1 },
  ];

  const transaction = db.transaction((members) => {
    for (const m of members) insertMember.run(m);
  });
  transaction(familyMembers);
}

export function seedContacts() {
  const insertContact = db.prepare(`
    INSERT OR IGNORE INTO contacts (id, name, handle, category, trust, avatar_color, is_demo_seed)
    VALUES (@id, @name, @handle, @category, @trust, @avatar_color, @is_demo_seed)
  `);

  const contacts = [
    { id: 'contact-01', name: 'Electricity Board', handle: '+1-800-ELECTRIC', category: 'utility', trust: 'trusted', avatar_color: '#3b82f6', is_demo_seed: 1 },
    { id: 'contact-02', name: 'Grocery Mart', handle: '+1-555-GROCER', category: 'store', trust: 'trusted', avatar_color: '#22c55e', is_demo_seed: 1 },
    { id: 'contact-03', name: 'City Pharmacy', handle: '+1-555-MEDS', category: 'pharmacy', trust: 'trusted', avatar_color: '#ec4899', is_demo_seed: 1 },
    { id: 'contact-04', name: 'School Office', handle: '+1-555-SCHOOL', category: 'school', trust: 'trusted', avatar_color: '#f59e0b', is_demo_seed: 1 },
    { id: 'contact-05', name: 'Juice Bar', handle: '+1-555-JUICE', category: 'store', trust: 'known', avatar_color: '#06b6d4', is_demo_seed: 1 },
    { id: 'contact-06', name: 'Local Plumber', handle: '+1-555-PLUMB', category: 'service', trust: 'known', avatar_color: '#8b5cf6', is_demo_seed: 1 },
    { id: 'contact-07', name: 'Mobile Recharge', handle: '+1-555-RECHARGE', category: 'utility', trust: 'trusted', avatar_color: '#6366f1', is_demo_seed: 1 },
    { id: 'contact-08', name: 'Corner Tea Stall', handle: '+1-555-TEA', category: 'store', trust: 'known', avatar_color: '#ef4444', is_demo_seed: 1 },
  ];

  const transaction = db.transaction((contacts) => {
    for (const c of contacts) insertContact.run(c);
  });
  transaction(contacts);
}

export function seedPayments() {
  const insertPayment = db.prepare(`
    INSERT OR IGNORE INTO payments (
      id, member_id, created_at, recipient_label, is_new_recipient,
      amount, currency, reason_text, risk_level, risk_score,
      ai_json, tier, status, paypal_order_id, paypal_authorization_id,
      paypal_capture_id, decided_by, decided_at, decision_deadline, is_demo_seed
    ) VALUES (
      @id, @member_id, @created_at, @recipient_label, @is_new_recipient,
      @amount, @currency, @reason_text, @risk_level, @risk_score,
      @ai_json, @tier, @status, @paypal_order_id, @paypal_authorization_id,
      @paypal_capture_id, @decided_by, @decided_at, @decision_deadline, 1
    )
  `);

  // Helper to generate past dates
  const now = Date.now();
  const dayMs = 86400000;
  const past = (daysAgo: number, hoursAgo: number = 0) =>
    new Date(now - daysAgo * dayMs - hoursAgo * 3600000).toISOString();

  const seedList = [
    // Dad payments (head - always AUTO, no limits)
    { id: 'pay-seed-01', member_id: 'dad', created_at: past(20), recipient_label: 'City Power & Electric', is_new_recipient: 0, amount: 84.50, reason_text: 'Monthly electricity bill', risk_level: 'low', risk_score: 5, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-02', member_id: 'dad', created_at: past(16), recipient_label: 'Metro Water Utility', is_new_recipient: 0, amount: 42.10, reason_text: 'Quarterly water utility bill', risk_level: 'low', risk_score: 5, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-03', member_id: 'dad', created_at: past(11), recipient_label: 'Home Internet Fiber', is_new_recipient: 0, amount: 60.00, reason_text: 'High-speed broadband recharge', risk_level: 'low', risk_score: 5, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-04', member_id: 'dad', created_at: past(6), recipient_label: 'Whole Foods Market', is_new_recipient: 0, amount: 125.40, reason_text: 'Family bi-weekly grocery run', risk_level: 'low', risk_score: 10, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-05', member_id: 'dad', created_at: past(2), recipient_label: 'Speedy Gas Station', is_new_recipient: 0, amount: 45.00, reason_text: 'Car fuel refill', risk_level: 'low', risk_score: 5, tier: 'AUTO', status: 'CAPTURED' },

    // Mom payments (adult: $25 auto / $100 notify / >100 approval)
    { id: 'pay-seed-06', member_id: 'mom', created_at: past(19), recipient_label: 'Corner Organic Market', is_new_recipient: 0, amount: 18.50, reason_text: 'Fresh vegetables and milk', risk_level: 'low', risk_score: 5, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-07', member_id: 'mom', created_at: past(15), recipient_label: 'Fresh Farm Produce', is_new_recipient: 0, amount: 22.00, reason_text: 'Fruits and weekly bread', risk_level: 'low', risk_score: 8, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-08', member_id: 'mom', created_at: past(12), recipient_label: 'SuperMart Groceries', is_new_recipient: 0, amount: 68.20, reason_text: 'Monthly pantry restock', risk_level: 'low', risk_score: 15, tier: 'NOTIFY', status: 'CAPTURED' },
    { id: 'pay-seed-09', member_id: 'mom', created_at: past(8), recipient_label: 'Dr. Smith Clinic', is_new_recipient: 0, amount: 85.00, reason_text: 'Routine pediatric checkup', risk_level: 'low', risk_score: 15, tier: 'NOTIFY', status: 'CAPTURED' },
    { id: 'pay-seed-10', member_id: 'mom', created_at: past(3), recipient_label: 'Springfield Academy Uniforms', is_new_recipient: 1, amount: 140.00, reason_text: 'Winter uniform sets for Aarav', risk_level: 'medium', risk_score: 35, tier: 'APPROVAL', status: 'CAPTURED', decided_by: 'Dad', decided_at: past(3) },

    // Riya payments (teen: $10 auto / $40 notify / >40 approval)
    { id: 'pay-seed-11', member_id: 'riya', created_at: past(18), recipient_label: 'Campus Cafe & Juice', is_new_recipient: 0, amount: 6.50, reason_text: 'Smoothie after basketball practice', risk_level: 'low', risk_score: 5, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-12', member_id: 'riya', created_at: past(14), recipient_label: 'Stationery Corner', is_new_recipient: 0, amount: 8.00, reason_text: 'Notebooks and highlighters for chemistry', risk_level: 'low', risk_score: 5, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-13', member_id: 'riya', created_at: past(10), recipient_label: 'BookNest Store', is_new_recipient: 0, amount: 28.50, reason_text: 'Calculus textbook and reference guide', risk_level: 'low', risk_score: 12, tier: 'NOTIFY', status: 'CAPTURED' },
    { id: 'pay-seed-14', member_id: 'riya', created_at: past(7), recipient_label: 'Music Academy Online', is_new_recipient: 0, amount: 35.00, reason_text: 'Monthly guitar lesson subscription', risk_level: 'low', risk_score: 10, tier: 'NOTIFY', status: 'CAPTURED' },
    { id: 'pay-seed-15', member_id: 'riya', created_at: past(4), recipient_label: 'State Robotics League', is_new_recipient: 1, amount: 75.00, reason_text: 'Annual high school robotics registration', risk_level: 'low', risk_score: 20, tier: 'APPROVAL', status: 'CAPTURED', decided_by: 'Dad', decided_at: past(4) },

    // Aarav payments (child: $5 auto / $20 notify / >20 approval)
    { id: 'pay-seed-16', member_id: 'aarav', created_at: past(17), recipient_label: 'School Cafeteria', is_new_recipient: 0, amount: 3.50, reason_text: 'Lunch chocolate pudding cup', risk_level: 'low', risk_score: 2, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-17', member_id: 'aarav', created_at: past(13), recipient_label: 'School Cafeteria', is_new_recipient: 0, amount: 4.25, reason_text: 'Apple slices and milk carton', risk_level: 'low', risk_score: 2, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-18', member_id: 'aarav', created_at: past(9), recipient_label: 'Toy & Hobby Shack', is_new_recipient: 0, amount: 14.99, reason_text: 'Lego bricks starter pack', risk_level: 'low', risk_score: 15, tier: 'NOTIFY', status: 'CAPTURED' },
    { id: 'pay-seed-19', member_id: 'aarav', created_at: past(5), recipient_label: 'Art Supply Store', is_new_recipient: 0, amount: 18.00, reason_text: 'Crayons and poster colors for school project', risk_level: 'low', risk_score: 12, tier: 'NOTIFY', status: 'CAPTURED' },
    { id: 'pay-seed-20', member_id: 'aarav', created_at: past(1), recipient_label: 'Science Camp Registration', is_new_recipient: 1, amount: 45.00, reason_text: 'Weekend space science workshop', risk_level: 'low', risk_score: 25, tier: 'APPROVAL', status: 'CAPTURED', decided_by: 'Dad', decided_at: past(1) },

    // Grandma payments (elder: $10 auto / $30 notify / >30 approval)
    { id: 'pay-seed-21', member_id: 'grandma', created_at: past(21), recipient_label: 'Sunrise Community Pharmacy', is_new_recipient: 0, amount: 8.50, reason_text: 'Vitamin C and throat lozenges', risk_level: 'low', risk_score: 5, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-22', member_id: 'grandma', created_at: past(16), recipient_label: 'Sunrise Community Pharmacy', is_new_recipient: 0, amount: 9.20, reason_text: 'Herbal tea and compression bandage', risk_level: 'low', risk_score: 5, tier: 'AUTO', status: 'CAPTURED' },
    { id: 'pay-seed-23', member_id: 'grandma', created_at: past(11), recipient_label: 'Main Street Chemist', is_new_recipient: 0, amount: 26.00, reason_text: 'Blood pressure maintenance refill', risk_level: 'low', risk_score: 10, tier: 'NOTIFY', status: 'CAPTURED' },
    { id: 'pay-seed-24', member_id: 'grandma', created_at: past(6), recipient_label: 'Sunrise Community Pharmacy', is_new_recipient: 0, amount: 48.00, reason_text: 'Monthly joint supplement capsules', risk_level: 'low', risk_score: 18, tier: 'APPROVAL', status: 'CAPTURED', decided_by: 'Dad', decided_at: past(6) },
    { id: 'pay-seed-25', member_id: 'grandma', created_at: past(2), recipient_label: 'Fast Support Helpdesk', is_new_recipient: 1, amount: 25.00, reason_text: 'Caller said urgent virus scan required', risk_level: 'high', risk_score: 85, tier: 'APPROVAL', status: 'VOIDED', decided_by: 'Dad', decided_at: past(2) },
  ];

  const transaction = db.transaction((payments) => {
    for (const p of payments) {
      insertPayment.run({
        ...p,
        currency: 'USD',
        ai_json: JSON.stringify({
          risk_level: p.risk_level,
          risk_score: p.risk_score,
          escalate: p.risk_level === 'high',
          reasons: [p.reason_text],
          scam_signals: p.risk_level === 'high' ? ['urgency', 'impersonation'] : [],
          summary_for_head: `Payment of $${p.amount} to ${p.recipient_label}.`,
          message_for_member: `Payment recorded.`,
          follow_up_question: null,
        }),
        paypal_order_id: `MOCK-ORDER-${p.id}`,
        paypal_authorization_id: `MOCK-AUTH-${p.id}`,
        paypal_capture_id: p.status === 'CAPTURED' ? `MOCK-CAP-${p.id}` : null,
        decided_by: p.decided_by || null,
        decided_at: p.decided_at || null,
        decision_deadline: null,
      });
    }
  });

  transaction(seedList);
}

// Reset demo data back to clean initial state
export function resetDemoData() {
  db.exec(`
    DELETE FROM audit_log;
    DELETE FROM notifications;
    DELETE FROM webhook_events;
    DELETE FROM summaries;
    DELETE FROM payments;
    DELETE FROM contacts;
    DELETE FROM members;
  `);
  seedMembers();
  seedContacts();
  seedPayments();
}

export default db;
