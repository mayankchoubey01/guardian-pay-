import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePolicyGate, GateMember } from '../lib/gate';
import { RiskAssessment } from '../lib/ai';

const headMember: GateMember = { id: 'dad', role: 'head', auto_limit: 999999, notify_limit: 999999 };
const adultMember: GateMember = { id: 'mom', role: 'adult', auto_limit: 25, notify_limit: 100 };
const teenMember: GateMember = { id: 'riya', role: 'teen', auto_limit: 10, notify_limit: 40 };
const childMember: GateMember = { id: 'aarav', role: 'child', auto_limit: 5, notify_limit: 20 };
const elderMember: GateMember = { id: 'grandma', role: 'elder', auto_limit: 10, notify_limit: 30 };

const safeAi: RiskAssessment = {
  risk_level: 'low',
  risk_score: 5,
  escalate: false,
  reasons: ['Standard routine payment'],
  scam_signals: [],
  summary_for_head: 'Routine transaction.',
  message_for_member: 'Payment safe.',
  follow_up_question: null,
};

const mediumAi: RiskAssessment = {
  ...safeAi,
  risk_level: 'medium',
  risk_score: 40,
  reasons: ['Unusual time of day'],
};

const highAi: RiskAssessment = {
  ...safeAi,
  risk_level: 'high',
  risk_score: 90,
  escalate: true,
  reasons: ['Urgent KYC request scam detected'],
  scam_signals: ['urgency', 'fake_verification'],
};

const uncertainAi: RiskAssessment = {
  ...safeAi,
  risk_level: 'uncertain',
  risk_score: 50,
  escalate: true,
  reasons: ['Thin or suspicious context'],
};

// Helper to create base gate input
import { SafetyCheckAnswers, EntryPath } from '../lib/gate';

function baseInput(overrides: Partial<{
  member: GateMember;
  amount: number;
  is_new_recipient: boolean;
  contact_trust: 'trusted' | 'known' | 'new';
  entry_path: EntryPath;
  safety_answers: SafetyCheckAnswers | null;
  ai_assessment: RiskAssessment | null;
}> = {}) {
  return {
    member: overrides.member || adultMember,
    amount: overrides.amount ?? 10,
    is_new_recipient: overrides.is_new_recipient ?? false,
    contact_trust: overrides.contact_trust ?? 'trusted',
    entry_path: overrides.entry_path ?? 'app',
    safety_answers: overrides.safety_answers ?? null,
    ai_assessment: overrides.ai_assessment ?? safeAi,
  };
}

test('1. Head payment is always AUTO regardless of amount or recipient', () => {
  const result = evaluatePolicyGate(baseInput({
    member: headMember,
    amount: 5000,
    is_new_recipient: true,
    ai_assessment: highAi,
  }));
  assert.equal(result.tier, 'AUTO');
});

test('2. Adult under auto limit ($20 <= $25) is AUTO', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 20,
  }));
  assert.equal(result.tier, 'AUTO');
});

test('3. Adult at exact auto limit ($25) is AUTO', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 25,
  }));
  assert.equal(result.tier, 'AUTO');
});

test('4. Adult between auto and notify limit ($50) is NOTIFY', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 50,
  }));
  assert.equal(result.tier, 'NOTIFY');
});

test('5. Adult over notify limit ($120 > $100) is APPROVAL', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 120,
  }));
  assert.equal(result.tier, 'APPROVAL');
});

test('6. Teen under auto limit ($8 <= $10) is AUTO', () => {
  const result = evaluatePolicyGate(baseInput({
    member: teenMember,
    amount: 8,
  }));
  assert.equal(result.tier, 'AUTO');
});

test('7. Teen over notify limit ($90 > $40) is APPROVAL', () => {
  const result = evaluatePolicyGate(baseInput({
    member: teenMember,
    amount: 90,
  }));
  assert.equal(result.tier, 'APPROVAL');
});

test('8. Child under auto limit ($4 <= $5) is AUTO', () => {
  const result = evaluatePolicyGate(baseInput({
    member: childMember,
    amount: 4,
  }));
  assert.equal(result.tier, 'AUTO');
});

test('9. Child between auto and notify ($15) is NOTIFY', () => {
  const result = evaluatePolicyGate(baseInput({
    member: childMember,
    amount: 15,
  }));
  assert.equal(result.tier, 'NOTIFY');
});

test('10. Elder under auto limit ($8 <= $10) is AUTO', () => {
  const result = evaluatePolicyGate(baseInput({
    member: elderMember,
    amount: 8,
  }));
  assert.equal(result.tier, 'AUTO');
});

test('11. AI Escalation: Elder small amount ($5) escalated to APPROVAL by high risk / scam', () => {
  const result = evaluatePolicyGate(baseInput({
    member: elderMember,
    amount: 5,
    is_new_recipient: true,
    ai_assessment: highAi,
  }));
  assert.equal(result.tier, 'APPROVAL');
  assert.equal(result.escalated_by_ai, true);
});

test('12. AI Escalation: Medium risk moves AUTO to at least NOTIFY', () => {
  const result = evaluatePolicyGate(baseInput({
    member: teenMember,
    amount: 5,
    ai_assessment: mediumAi,
  }));
  assert.equal(result.tier, 'NOTIFY');
  assert.equal(result.escalated_by_ai, true);
});

test('13. No-Downgrade Rule: AI low risk cannot downgrade an over-limit payment from APPROVAL', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 250,
    ai_assessment: safeAi,
  }));
  assert.equal(result.tier, 'APPROVAL');
});

test('14. AI Failure Fallback: Missing AI output forces APPROVAL with AI check unavailable', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    ai_assessment: null,
  }));
  assert.equal(result.tier, 'APPROVAL');
  assert.match(result.reason, /AI check unavailable/i);
});

test('15. AI Uncertain: Uncertain risk forces APPROVAL', () => {
  const result = evaluatePolicyGate(baseInput({
    member: teenMember,
    amount: 5,
    ai_assessment: uncertainAi,
  }));
  assert.equal(result.tier, 'APPROVAL');
});

test('16. New Recipient Rule: Moves AUTO up to NOTIFY for non-head', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 15,
    is_new_recipient: true,
  }));
  assert.equal(result.tier, 'NOTIFY');
});

test('17. Prompt Injection Resilience: Gate enforces amount-based rules even with prompt injection text', () => {
  const result = evaluatePolicyGate(baseInput({
    member: childMember,
    amount: 500,
    is_new_recipient: true,
    ai_assessment: safeAi,
  }));
  assert.equal(result.tier, 'APPROVAL');
});

// --- NEW TESTS FOR UPDATED GATE RULES ---

test('18. New Contact Trust "new" raises AUTO to NOTIFY for non-head', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10, // would be AUTO
    contact_trust: 'new',
  }));
  assert.equal(result.tier, 'NOTIFY');
});

test('19. New Contact Trust "known" does not raise AUTO', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    contact_trust: 'known',
  }));
  assert.equal(result.tier, 'AUTO');
});

test('20. Path B (link) + asker "unknown_person" forces APPROVAL', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    entry_path: 'link',
    safety_answers: { asker: 'unknown_person', purpose: 'buying' },
  }));
  assert.equal(result.tier, 'APPROVAL');
  assert.match(result.reason, /unknown asker/i);
});

test('21. Path B (link) + asker "not_sure" forces APPROVAL', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    entry_path: 'link',
    safety_answers: { asker: 'not_sure', purpose: 'buying' },
  }));
  assert.equal(result.tier, 'APPROVAL');
});

test('22. Path B (link) + purpose "prize_refund_reward" forces APPROVAL', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    entry_path: 'link',
    safety_answers: { asker: 'shop_service', purpose: 'prize_refund_reward' },
  }));
  assert.equal(result.tier, 'APPROVAL');
  assert.match(result.reason, /prize.*refund.*reward/i);
});

test('23. Path B (link) + purpose "verify_account" forces APPROVAL', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    entry_path: 'link',
    safety_answers: { asker: 'shop_service', purpose: 'verify_account' },
  }));
  assert.equal(result.tier, 'APPROVAL');
  assert.match(result.reason, /account verification/i);
});

test('24. Path B (link) to new contact is at least NOTIFY', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    is_new_recipient: true,
    entry_path: 'link',
    safety_answers: { asker: 'shop_service', purpose: 'buying' },
  }));
  assert.equal(result.tier, 'NOTIFY');
});

test('25. Trusted contact with normal amount stays AUTO', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    contact_trust: 'trusted',
    is_new_recipient: false,
    entry_path: 'app',
  }));
  assert.equal(result.tier, 'AUTO');
});

test('26. Scan path (Path A) to new contact raises AUTO to NOTIFY', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    is_new_recipient: true,
    contact_trust: 'new',
    entry_path: 'scan',
  }));
  assert.equal(result.tier, 'NOTIFY');
});

test('27. AI Failure with new contact trust "new" forces APPROVAL', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    contact_trust: 'new',
    ai_assessment: null,
  }));
  assert.equal(result.tier, 'APPROVAL');
  assert.match(result.reason, /AI check unavailable/i);
});

test('28. Elder with new contact trust "new" and small amount goes to NOTIFY (not APPROVAL unless AI escalates)', () => {
  const result = evaluatePolicyGate(baseInput({
    member: elderMember,
    amount: 5,
    contact_trust: 'new',
    ai_assessment: safeAi,
  }));
  assert.equal(result.tier, 'NOTIFY');
});

test('29. Path B with "shop_service" asker and "buying" purpose stays at amount-based tier', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 10,
    entry_path: 'link',
    safety_answers: { asker: 'shop_service', purpose: 'buying' },
  }));
  assert.equal(result.tier, 'AUTO');
});

test('30. Path B with "family_friend" asker and "bill_fee" purpose stays at amount-based tier', () => {
  const result = evaluatePolicyGate(baseInput({
    member: adultMember,
    amount: 50, // NOTIFY tier by amount
    entry_path: 'link',
    safety_answers: { asker: 'family_friend', purpose: 'bill_fee' },
  }));
  assert.equal(result.tier, 'NOTIFY');
});