import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { initDb } from '@/lib/db';
import { getMemberById, getMemberPatternProfile } from '@/lib/members';
import { getContactById, getContactByHandle, createContact, getOrCreateContactFromScan } from '@/lib/contacts';
import { assessPaymentRisk } from '@/lib/ai';
import { evaluatePolicyGate } from '@/lib/gate';
import { createAuthorizeOrder } from '@/lib/paypal';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

initDb();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('member_id');
    const status = searchParams.get('status');

    let query = 'SELECT p.*, m.name as member_name, m.role as member_role FROM payments p JOIN members m ON p.member_id = m.id';
    const conditions: string[] = [];
    const params: any[] = [];

    if (memberId) {
      conditions.push('p.member_id = ?');
      params.push(memberId);
    }
    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY p.created_at DESC';

    const payments = db.prepare(query).all(...params);
    return NextResponse.json(payments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      member_id, 
      contact_id, 
      contact_handle, 
      contact_name, 
      amount, 
      note_text, 
      entry_path, 
      safety_answers 
    } = body;

    // Validate required fields
    if (!member_id) {
      return NextResponse.json({ error: 'Member ID is required.' }, { status: 400 });
    }
    if (!contact_id && !contact_handle) {
      return NextResponse.json({ error: 'Contact is required.' }, { status: 400 });
    }
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });
    }
    // Validate amount has at most 2 decimals
    if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
      return NextResponse.json({ error: 'Amount must have at most 2 decimal places.' }, { status: 400 });
    }
    // Validate note length
    if (note_text && note_text.length > 140) {
      return NextResponse.json({ error: 'Note must be 140 characters or less.' }, { status: 400 });
    }

    const member = getMemberById(member_id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    // Resolve contact
    let contact: ReturnType<typeof getContactById> | ReturnType<typeof getOrCreateContactFromScan>;
    let isNewRecipient = false;
    
    if (contact_id) {
      const found = getContactById(contact_id);
      if (!found) {
        return NextResponse.json({ error: 'Contact not found.' }, { status: 404 });
      }
      contact = found;
      isNewRecipient = contact.trust === 'new';
    } else if (contact_handle) {
      // Path A: scan or new entry
      contact = getOrCreateContactFromScan(contact_name || 'Unknown', contact_handle);
      isNewRecipient = contact.trust === 'new';
    } else {
      return NextResponse.json({ error: 'Contact is required.' }, { status: 400 });
    }

    const paymentId = `pay-${randomUUID()}`;
    const patternProfile = getMemberPatternProfile(member.id);
    const hasPaidBefore = patternProfile.hasPaidContact(contact.handle);
    const localHour = new Date().getHours();
    
    // Determine entry path: 'link' if safety_answers provided or src=link in referrer
    const detectedEntryPath = (entry_path === 'link' || safety_answers) ? 'link' : (entry_path || 'app');

    // 1. Run AI Risk Engine
    const aiAssessment = await assessPaymentRisk({
      contact_name: contact.name,
      contact_category: contact.category,
      contact_trust: contact.trust,
      contact_handle: contact.handle,
      has_paid_before: hasPaidBefore,
      amount: numericAmount,
      member_role: member.role,
      pattern_profile: patternProfile,
      entry_path: detectedEntryPath,
      note_text: note_text?.trim() || null,
      safety_answers: safety_answers || null,
      local_hour: localHour,
    });

    // 2. Evaluate Policy Gate
    const gateDecision = evaluatePolicyGate({
      member: {
        id: member.id,
        role: member.role,
        auto_limit: member.auto_limit,
        notify_limit: member.notify_limit,
      },
      amount: numericAmount,
      is_new_recipient: isNewRecipient,
      contact_trust: contact.trust,
      entry_path: detectedEntryPath,
      safety_answers: safety_answers || null,
      ai_assessment: aiAssessment,
    });

    const nowIso = new Date().toISOString();
    // 24 hour deadline for held payments
    const deadlineIso =
      gateDecision.tier === 'APPROVAL'
        ? new Date(Date.now() + 24 * 3600 * 1000).toISOString()
        : null;

    // 3. Insert initial payment record into SQLite
    db.prepare(`
      INSERT INTO payments (
        id, member_id, created_at, recipient_label, is_new_recipient,
        amount, currency, reason_text, risk_level, risk_score,
        ai_json, tier, status, decision_deadline, is_demo_seed
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, 'USD', ?, ?, ?,
        ?, ?, 'DRAFT', ?, 0
      )
    `).run(
      paymentId,
      member.id,
      nowIso,
      contact.name,
      isNewRecipient ? 1 : 0,
      numericAmount,
      note_text?.trim() || '',
      aiAssessment.risk_level,
      aiAssessment.risk_score,
      JSON.stringify(aiAssessment),
      gateDecision.tier,
      deadlineIso
    );

    // 4. Log to audit_log
    db.prepare(`
      INSERT INTO audit_log (id, payment_id, at, kind, detail_json)
      VALUES (?, ?, ?, 'PAYMENT_CREATED', ?)
    `).run(
      `audit-${randomUUID()}`,
      paymentId,
      nowIso,
      JSON.stringify({
        member: member.id,
        contact: contact.id,
        amount: numericAmount,
        tier: gateDecision.tier,
        gateReason: gateDecision.reason,
        aiAssessment,
        entry_path: detectedEntryPath,
        safety_answers: safety_answers || null,
      })
    );

    // For Path B (link), if tier is APPROVAL, we need to show safety check first
    // But we still create the PayPal order and place the hold
    // The safety check happens BEFORE the member confirms on PayPal
    
    // 5. Create PayPal Order with intent AUTHORIZE
    const returnUrl = `${config.appBaseUrl}/api/paypal/return?payment_id=${paymentId}`;
    const cancelUrl = `${config.appBaseUrl}/api/paypal/cancel?payment_id=${paymentId}`;

    const order = await createAuthorizeOrder({
      paymentId,
      amount: numericAmount,
      memo: `Payment to ${contact.name}: ${note_text?.trim() || 'No note'}`,
      returnUrl,
      cancelUrl,
    });

    // Update payment with PayPal order ID and transition to ORDER_CREATED
    db.prepare(`
      UPDATE payments
      SET paypal_order_id = ?, status = 'ORDER_CREATED'
      WHERE id = ?
    `).run(order.orderId, paymentId);

    // For Path B with safety check needed, we could return a different response
    // But for now, we always redirect to PayPal - the safety check is shown before this API call
    // from the frontend

    return NextResponse.json({
      paymentId,
      paypalOrderId: order.orderId,
      approveUrl: order.approveUrl,
      tier: gateDecision.tier,
      riskLevel: aiAssessment.risk_level,
      needsSafetyCheck: detectedEntryPath === 'link' && gateDecision.tier === 'APPROVAL',
    });
  } catch (err: any) {
    console.error('Error creating payment:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}