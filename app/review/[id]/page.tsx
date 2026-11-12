'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMember } from '@/components/MemberContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/ui/risk-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Clock, DollarSign, User, Mail, CreditCard, ArrowLeft, ShieldAlert, HelpCircle } from 'lucide-react';

interface PaymentDetail {
  id: string;
  member_id: string;
  member_name: string;
  member_role: string;
  recipient_label: string;
  amount: number;
  currency: string;
  reason_text: string;
  risk_level: 'low' | 'medium' | 'high' | 'uncertain';
  risk_score: number;
  tier: string;
  status: string;
  decided_by?: string;
  decided_at?: string;
  decision_deadline?: string;
  ai_parsed?: {
    risk_level: string;
    risk_score: number;
    escalate: boolean;
    reasons: string[];
    scam_signals: string[];
    summary_for_head: string;
    message_for_member: string;
  };
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { activeMember } = useMember();

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'block' | null>(null);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`/api/payments/${id}`);
      if (!res.ok) throw new Error('Payment not found');
      const data = await res.json();
      setPayment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const handleDecision = async (action: 'approve' | 'block') => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/payments/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          decided_by: `${activeMember.name} (Head)`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute decision.');
      }

      setConfirmAction(null);
      toast.success(action === 'approve' ? 'Payment approved and captured' : 'Payment blocked and hold released');
      await fetchPayment();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Enforce head-only access
  if (activeMember && activeMember.role !== 'head') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-8 text-center">
            <ShieldAlert size={48} className="mx-auto text-amber-500 mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Restricted to Head of Family</h2>
            <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <p className="text-sm text-amber-800">
                Only the head of family (Dad) can approve or block held payments. You are currently viewing as <strong>{activeMember.name}</strong>.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Please use the <strong>"Viewing as"</strong> switcher at the top to switch to Dad.
              </p>
            </div>
            <Button asChild className="mt-6">
              <Link href="/send">Go to Send Money</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !payment) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-900">Loading Payment Review...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAlreadyDecided = payment.status !== 'HELD';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div>
            <Badge variant="tier" tier="approval" className="mb-2">HEAD DECISION PAGE</Badge>
            <CardTitle className="text-2xl">Payment Safety Review</CardTitle>
            <p className="text-slate-600 mt-1">
              Payment requested by <strong>{payment.member_name}</strong> ({payment.member_role.toUpperCase()})
            </p>
          </div>
          <span className="text-sm text-slate-500">ID: {payment.id}</span>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" role="alert">
              {error}
            </div>
          )}

          {isAlreadyDecided && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Decision Finalized:</strong> This payment was marked as <strong>{payment.status}</strong> by {payment.decided_by || 'System'}{' '}
                {payment.decided_at ? `on ${new Date(payment.decided_at).toLocaleString()}` : ''}.
              </p>
            </div>
          )}

          {/* Amount & Recipient Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Recipient</p>
                <p className="text-2xl font-bold text-slate-900">{payment.recipient_label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Requested Amount</p>
                <p className="text-3xl font-bold text-blue-600">${payment.amount.toFixed(2)} {payment.currency}</p>
              </div>
            </div>
          </div>

          {/* Member Stated Reason */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">What {payment.member_name} wrote:</h3>
            <div className="p-4 bg-white border-2 border-slate-200 rounded-lg">
              <p className="text-lg italic text-slate-900">"{payment.reason_text}"</p>
            </div>
          </div>

          {/* AI Guardian Assessment Card */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <ShieldAlert size={20} aria-hidden="true" />
                Guardian AI Risk Assessment
              </h3>
              <RiskBadge level={payment.risk_level} score={payment.risk_score} />
            </div>

            {payment.ai_parsed?.summary_for_head && (
              <p className="text-purple-800 mb-4 text-lg">{payment.ai_parsed.summary_for_head}</p>
            )}

            {payment.ai_parsed?.reasons && payment.ai_parsed.reasons.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-purple-900 mb-2">Flagged Signals:</p>
                <ul className="space-y-1 pl-4 text-purple-800">
                  {payment.ai_parsed.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {payment.ai_parsed?.scam_signals && payment.ai_parsed.scam_signals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {payment.ai_parsed.scam_signals.map((sig, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300 rounded"
                  >
                    #{sig}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 24-Hour Expiry Deadline */}
          {payment.decision_deadline && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock size={20} className="text-amber-600 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-amber-800">
                <strong>Decision Deadline:</strong> {new Date(payment.decision_deadline).toLocaleString()} (protective hold auto-releases if no action is taken within 24 hours).
              </p>
            </div>
          )}

          {/* Action Buttons with Confirmation Step */}
          {!isAlreadyDecided && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              {confirmAction === null ? (
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setConfirmAction('approve')}
                    disabled={submitting}
                  >
                    Approve (Capture Funds)
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    className="flex-1"
                    onClick={() => setConfirmAction('block')}
                    disabled={submitting}
                  >
                    Block (Void & Release Hold)
                  </Button>
                </div>
              ) : (
                <AlertDialog open={true} onOpenChange={() => setConfirmAction(null)}>
                  <AlertDialogPortal>
                    <AlertDialogOverlay />
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Confirm {confirmAction === 'approve' ? 'Approval' : 'Block'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {confirmAction === 'approve'
                            ? 'Are you sure you want to capture the funds and allow this payment to proceed?'
                            : 'Are you sure you want to block this payment and release the money back to the family member?'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConfirmAction(null)} disabled={submitting}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDecision(confirmAction!)}
                          destructive={confirmAction === 'block'}
                          disabled={submitting}
                        >
                          {submitting ? 'Executing via PayPal...' : `Yes, ${confirmAction === 'approve' ? 'Approve Payment' : 'Block Payment'}`}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialogPortal>
                </AlertDialog>
              )}
            </div>
          )}

          <div className="pt-6 border-t border-slate-200">
            <Button variant="secondary" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft size={18} aria-hidden="true" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}