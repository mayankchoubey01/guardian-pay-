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

export interface Member {
  id: string;
  name: string;
  role: 'head' | 'adult' | 'teen' | 'child' | 'elder';
  auto_limit: number;
  notify_limit: number;
  is_demo_seed: number;
}

export interface PaymentRow {
  id: string;
  member_id: string;
  member_name: string;
  recipient_label: string;
  amount: number;
  currency: string;
  risk_level: string;
  risk_score: number;
  tier: string;
  status: string;
  decided_by?: string;
  created_at: string;
}