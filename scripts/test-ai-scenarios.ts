import { assessPaymentRisk, RiskEngineInput, EntryPath } from '../lib/ai';
import { evaluatePolicyGate } from '../lib/gate';
import { getMemberPatternProfile, getMemberById } from '../lib/members';
import { SafetyCheckAnswers } from '../lib/gate';

async function runDemoScenarios() {
  console.log('--- Testing 4 Demo Scenarios with Live Gemini AI & Policy Gate ---\n');

  const scenarios: Array<{ name: string; input: RiskEngineInput }> = [
    {
      name: 'Scenario 1: Riya, $4, Juice Bar (Trusted, in app)',
      input: {
        contact_name: 'Juice Bar',
        contact_category: 'store',
        contact_trust: 'known',
        contact_handle: '+1-555-JUICE',
        has_paid_before: true,
        amount: 4.00,
        member_role: 'teen',
        pattern_profile: {
          averageAmount: 12.50,
          paymentCountLast24h: 1,
          usualRecipients: ['Campus Cafe', 'Campus Bookstore'],
          totalPastPayments: 6,
          largestAmount: 28.50,
          hasPaidContact: () => true,
        },
        entry_path: 'app',
        note_text: 'Snacks and juice after tennis',
        safety_answers: null,
        local_hour: 14,
      },
    },
    {
      name: 'Scenario 2: Mom, $35, Grocery Mart (Trusted, in app)',
      input: {
        contact_name: 'Grocery Mart',
        contact_category: 'store',
        contact_trust: 'trusted',
        contact_handle: '+1-555-GROCER',
        has_paid_before: true,
        amount: 35.00,
        member_role: 'adult',
        pattern_profile: {
          averageAmount: 45.00,
          paymentCountLast24h: 0,
          usualRecipients: ['Fresh Farm Produce', 'SuperMart'],
          totalPastPayments: 8,
          largestAmount: 85.00,
          hasPaidContact: () => true,
        },
        entry_path: 'app',
        note_text: 'Weekly groceries for family dinner',
        safety_answers: null,
        local_hour: 10,
      },
    },
    {
      name: 'Scenario 3: Grandma, $5, KYC Verify Desk (New, scam, link)',
      input: {
        contact_name: 'KYC Verify Desk',
        contact_category: 'person',
        contact_trust: 'new',
        contact_handle: '+1-555-KYC',
        has_paid_before: false,
        amount: 5.00,
        member_role: 'elder',
        pattern_profile: {
          averageAmount: 15.00,
          paymentCountLast24h: 0,
          usualRecipients: ['Pharmacy', 'Chemist'],
          totalPastPayments: 5,
          largestAmount: 48.00,
          hasPaidContact: () => false,
        },
        entry_path: 'link',
        note_text: 'Bank said verify KYC today or my account will be blocked',
        safety_answers: {
          asker: 'unknown_person',
          purpose: 'verify_account',
          extra_note: 'Urgent message received',
        },
        local_hour: 11,
      },
    },
    {
      name: 'Scenario 4: Riya, $90, School Office (Trusted, in app)',
      input: {
        contact_name: 'School Office',
        contact_category: 'school',
        contact_trust: 'trusted',
        contact_handle: '+1-555-SCHOOL',
        has_paid_before: false,
        amount: 90.00,
        member_role: 'teen',
        pattern_profile: {
          averageAmount: 12.50,
          paymentCountLast24h: 0,
          usualRecipients: ['Campus Cafe'],
          totalPastPayments: 6,
          largestAmount: 35.00,
          hasPaidContact: () => false,
        },
        entry_path: 'app',
        note_text: 'School trip fee for annual biology excursion',
        safety_answers: null,
        local_hour: 15,
      },
    },
  ];

  for (const s of scenarios) {
    console.log(`=======================================================`);
    console.log(`Running: ${s.name}`);
    console.log(`=======================================================`);
    const ai = await assessPaymentRisk(s.input);
    console.log('AI Output:');
    console.log(`- Risk Level: ${ai.risk_level} (Score: ${ai.risk_score})`);
    console.log(`- Escalate: ${ai.escalate}`);
    console.log(`- Scam Signals: ${JSON.stringify(ai.scam_signals)}`);
    console.log(`- Reasons: ${ai.reasons.join(', ')}`);
    console.log(`- Summary for Head: "${ai.summary_for_head}"`);
    console.log(`- Message for Member: "${ai.message_for_member}"`);

    const memberLimits = {
      head: { auto: 999999, notify: 999999 },
      adult: { auto: 25, notify: 100 },
      teen: { auto: 10, notify: 40 },
      child: { auto: 5, notify: 20 },
      elder: { auto: 10, notify: 30 },
    }[s.input.member_role];

    const decision = evaluatePolicyGate({
      member: {
        id: s.input.member_role,
        role: s.input.member_role,
        auto_limit: memberLimits.auto,
        notify_limit: memberLimits.notify,
      },
      amount: s.input.amount,
      is_new_recipient: !s.input.has_paid_before,
      contact_trust: s.input.contact_trust,
      entry_path: s.input.entry_path,
      safety_answers: s.input.safety_answers as SafetyCheckAnswers | null,
      ai_assessment: ai,
    });

    console.log(`\nPOLICY GATE DECISION:`);
    console.log(`- Final Tier: ${decision.tier} (Baseline: ${decision.baseline_tier}, Escalated by AI: ${decision.escalated_by_ai})`);
    console.log(`- Decision Reason: ${decision.reason}\n`);
  }
}

runDemoScenarios();