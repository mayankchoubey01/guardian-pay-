import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { initDb } from '@/lib/db';
import { generateWeeklySummary } from '@/lib/ai';

export const dynamic = 'force-dynamic';

initDb();

export async function GET() {
  try {
    const latest = db.prepare('SELECT * FROM summaries ORDER BY created_at DESC LIMIT 1').get() as any;
    return NextResponse.json({ summary: latest ? latest.text : null, created_at: latest?.created_at });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const payments = db.prepare(`
      SELECT p.amount, p.recipient_label, p.status, p.tier, p.reason_text, m.name as member_name
      FROM payments p
      JOIN members m ON p.member_id = m.id
      WHERE p.created_at >= ?
      ORDER BY p.created_at ASC
    `).all(sevenDaysAgo) as any[];

    let historyText = `Total payments in the past 7 days: ${payments.length}.\n`;
    for (const p of payments) {
      historyText += `- ${p.member_name} paid $${p.amount.toFixed(2)} to ${p.recipient_label} (${p.status}, tier ${p.tier}): "${p.reason_text}"\n`;
    }

    const summaryText = await generateWeeklySummary(historyText);
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO summaries (id, created_at, text)
      VALUES (?, ?, ?)
    `).run(`sum-${randomUUID()}`, nowIso, summaryText);

    return NextResponse.json({ summary: summaryText, created_at: nowIso });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
