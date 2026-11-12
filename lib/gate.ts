import { RiskAssessment } from './ai';

export type PolicyTier = 'AUTO' | 'NOTIFY' | 'APPROVAL';
export type EntryPath = 'app' | 'scan' | 'link';

export interface GateMember {
  id: string;
  role: 'head' | 'adult' | 'teen' | 'child' | 'elder';
  auto_limit: number;
  notify_limit: number;
}

export interface SafetyCheckAnswers {
  asker: 'shop_service' | 'family_friend' | 'unknown_person' | 'not_sure';
  purpose: 'buying' | 'bill_fee' | 'prize_refund_reward' | 'verify_account' | 'other';
  extra_note?: string;
}

export interface GateInput {
  member: GateMember;
  amount: number;
  is_new_recipient: boolean;
  contact_trust: 'trusted' | 'known' | 'new';
  entry_path: EntryPath;
  safety_answers: SafetyCheckAnswers | null;
  ai_assessment: RiskAssessment | null;
}

export interface GateDecision {
  tier: PolicyTier;
  reason: string;
  baseline_tier: PolicyTier;
  escalated_by_ai: boolean;
}

const TIER_RANK: Record<PolicyTier, number> = {
  AUTO: 1,
  NOTIFY: 2,
  APPROVAL: 3,
};

function rankToTier(rank: number): PolicyTier {
  if (rank >= 3) return 'APPROVAL';
  if (rank === 2) return 'NOTIFY';
  return 'AUTO';
}

/**
 * Pure policy gate function.
 * Enforces rule hierarchy where AI can only escalate, never downgrade.
 */
export function evaluatePolicyGate(input: GateInput): GateDecision {
  const { member, amount, is_new_recipient, contact_trust, entry_path, safety_answers, ai_assessment } = input;

  // Head of family is never held - always AUTO
  if (member.role === 'head') {
    return {
      tier: 'AUTO',
      reason: 'Head of family payment - automatic execution',
      baseline_tier: 'AUTO',
      escalated_by_ai: false,
    };
  }

  // 1. Compute baseline tier strictly from amount and member limits
  let baseline: PolicyTier = 'APPROVAL';
  if (amount <= member.auto_limit) {
    baseline = 'AUTO';
  } else if (amount <= member.notify_limit) {
    baseline = 'NOTIFY';
  } else {
    baseline = 'APPROVAL';
  }

  // 2. Rule: A new recipient (trust "new") moves AUTO up to NOTIFY for non-head
  let amountAndRecipientTier = baseline;
  if (is_new_recipient && baseline === 'AUTO') {
    amountAndRecipientTier = 'NOTIFY';
  }

  // 2b. Rule: A new contact (trust "new") raises AUTO to at least NOTIFY for any non-head member
  if (contact_trust === 'new' && amountAndRecipientTier === 'AUTO') {
    amountAndRecipientTier = 'NOTIFY';
  }

  // 2c. Rule: Path B (link) to a new contact is at least NOTIFY
  if (entry_path === 'link' && is_new_recipient && amountAndRecipientTier === 'AUTO') {
    amountAndRecipientTier = 'NOTIFY';
  }

  // 2d. Rule: Path B plus asker "unknown_person" forces APPROVAL
  if (entry_path === 'link' && safety_answers?.asker === 'unknown_person') {
    return {
      tier: 'APPROVAL',
      reason: 'External link + unknown asker - held for head review',
      baseline_tier: amountAndRecipientTier,
      escalated_by_ai: true,
    };
  }

  // 2e. Rule: Path B plus asker "not_sure" forces APPROVAL
  if (entry_path === 'link' && safety_answers?.asker === 'not_sure') {
    return {
      tier: 'APPROVAL',
      reason: 'External link + unsure asker - held for head review',
      baseline_tier: amountAndRecipientTier,
      escalated_by_ai: true,
    };
  }

  // 2f. Rule: Path B plus purpose "prize_refund_reward" or "verify_account" forces APPROVAL
  if (entry_path === 'link' && safety_answers?.purpose === 'prize_refund_reward') {
    return {
      tier: 'APPROVAL',
      reason: 'External link + prize/refund/reward claim - held for head review',
      baseline_tier: amountAndRecipientTier,
      escalated_by_ai: true,
    };
  }
  if (entry_path === 'link' && safety_answers?.purpose === 'verify_account') {
    return {
      tier: 'APPROVAL',
      reason: 'External link + account verification request - held for head review',
      baseline_tier: amountAndRecipientTier,
      escalated_by_ai: true,
    };
  }

  // 3. Rule: If AI assessment failed, missing, or timed out -> force APPROVAL
  if (!ai_assessment) {
    return {
      tier: 'APPROVAL',
      reason: 'AI check unavailable - held for safety review',
      baseline_tier: amountAndRecipientTier,
      escalated_by_ai: true,
    };
  }

  // 4. Determine AI required tier
  let aiRequiredTier: PolicyTier = 'AUTO';
  if (
    ai_assessment.escalate ||
    ai_assessment.risk_level === 'high' ||
    ai_assessment.risk_level === 'uncertain'
  ) {
    aiRequiredTier = 'APPROVAL';
  } else if (ai_assessment.risk_level === 'medium') {
    aiRequiredTier = 'NOTIFY';
  }

  // 5. AI can NEVER lower tier below the baseline minimum
  const baselineRank = TIER_RANK[amountAndRecipientTier];
  const aiRank = TIER_RANK[aiRequiredTier];
  const finalRank = Math.max(baselineRank, aiRank);
  const finalTier = rankToTier(finalRank);

  const escalatedByAi = finalRank > baselineRank;

  let reason = `Amount $${amount.toFixed(2)} falls within ${finalTier} tier`;
  if (escalatedByAi) {
    reason = `AI escalated from ${amountAndRecipientTier} to ${finalTier}: ${ai_assessment.reasons.join('; ')}`;
  } else if (is_new_recipient && baseline === 'AUTO' && finalTier === 'NOTIFY') {
    reason = 'New recipient policy moved tier from AUTO to NOTIFY';
  } else if (contact_trust === 'new' && baseline === 'AUTO' && finalTier === 'NOTIFY') {
    reason = 'New contact (trust: new) moved tier from AUTO to NOTIFY';
  } else if (entry_path === 'link' && is_new_recipient && baseline === 'AUTO' && finalTier === 'NOTIFY') {
    reason = 'External link to new contact moved tier from AUTO to NOTIFY';
  }

  return {
    tier: finalTier,
    reason,
    baseline_tier: amountAndRecipientTier,
    escalated_by_ai: escalatedByAi,
  };
}