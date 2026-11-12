'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StepTracker } from '@/components/ui/step-tracker';
import { RiskBadge } from '@/components/ui/risk-badge';
import { StatusPill } from '@/components/ui/status-pill';
import { CheckCircle2, AlertTriangle, ShieldAlert, HelpCircle, XCircle, Clock, CreditCard, User, Mail, DollarSign, Shield } from 'lucide-react';

interface PaymentDetail {
  id: string;
  member_id: string;
  member_name: string;
  recipient_label: string;
  amount: number;
  currency: string;
  reason_text: string; // now used for note_text
  risk_level: string;
  risk_score: number;
  tier: string;
  status: string;
  decided_by?: string;
  decided_at?: string;
  decision_deadline?: string;
  ai_parsed?: {
    message_for_member?: string;
    reasons?: string[];
    scam_signals?: string[];
    summary_for_head?: string;
  };
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'ORDER_CREATED':
      return {
        headline: 'Waiting for PayPal Approval',
        description: 'Please complete the approval on PayPal to place the protective hold.',
        alertType: 'warning' as const,
      };
    case 'HELD':
      return {
        headline: 'On Hold',
        description: 'Waiting for head of family to confirm. No money has left your account.',
        alertType: 'warning' as const,
      };
    case 'CAPTURED':
      return {
        headline: 'Paid',
        description: 'Your payment went through successfully.',
        alertType: 'success' as const,
      };
    case 'VOIDED':
      return {
        headline: 'Blocked',
        description: 'The payment was blocked to keep you safe. The hold has been released.',
        alertType: 'error' as const,
      };
    case 'EXPIRED':
      return {
        headline: 'Expired',
        description: 'The 24-hour review deadline passed. The hold has been released.',
        alertType: 'info' as const,
      };
    case 'PAYER_CANCELED':
      return {
        headline: 'Canceled',
        description: 'You canceled this payment on PayPal. No money was moved.',
        alertType: 'info' as const,
      };
    case 'FAILED':
      return {
        headline: 'Failed',
        description: 'The transaction could not be completed. Please try again.',
        alertType: 'error' as const,
      };
    default:
      return {
        headline: 'Checking...',
        description: 'Your payment is being analyzed.',
        alertType: 'info' as const,
      };
  }
}

function getStatusIcons(status: string) {
  switch (status) {
    case 'ORDER_CREATED': return <CreditCard size={20} className="text-blue-600" aria-hidden="true" />;
    case 'HELD': return <Shield size={20} className="text-amber-600" aria-hidden="true" />;
    case 'CAPTURED': return <CheckCircle2 size={20} className="text-green-600" aria-hidden="true" />;
    case 'VOIDED': return <ShieldAlert size={20} className="text-red-600" aria-hidden="true" />;
    case 'EXPIRED': return <Clock size={20} className="text-slate-600" aria-hidden="true" />;
    case 'PAYER_CANCELED': return <XCircle size={20} className="text-slate-600" aria-hidden="true" />;
    case 'FAILED': return <AlertTriangle size={20} className="text-red-600" aria-hidden="true" />;
    default: return <Clock size={20} className="text-slate-600" aria-hidden="true" />;
  }
}

export default function PaymentStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/payments/${id}`);
      if (!res.ok) {
        throw new Error('Payment not found');
      }
      const data = await res.json();
      setPayment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !payment) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-900">Checking payment status...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-lg font-semibold text-slate-900">Payment Not Found</h2>
            <p className="text-slate-600 mt-1">{error || 'Unable to retrieve payment information.'}</p>
            <Button asChild className="mt-4">
              <Link href="/pay">Back to Pay</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payment.status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div>
            <span className="text-sm text-slate-500">ID: {payment.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={payment.status} />
            {payment.tier && <Badge variant="tier" tier={payment.tier.toLowerCase() as any} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
            {getStatusIcons(payment.status)}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{statusConfig.headline}</h1>
              <p className="text-slate-600 mt-1" aria-live="polite">{statusConfig.description}</p>
            </div>
          </div>

          {/* AI Message for member - calm, clear result */}
          {payment.ai_parsed?.message_for_member && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg" role="status" aria-live="polite">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-purple-600" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Guardian AI</span>
              </div>
              <p className="text-slate-700">{payment.ai_parsed.message_for_member}</p>
            </div>
          )}

          {/* Step Tracker */}
          <StepTracker
            status={payment.status}
            statusMessage={
              payment.status === 'HELD'
                ? 'Awaiting head of family decision. Money is safely held by PayPal.'
                : payment.status === 'ORDER_CREATED'
                ? 'Complete the PayPal checkout to place the hold.'
                : undefined
            }
          />

          {/* Payment Details */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Payment Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-4">
                <dt className="text-slate-500">Member:</dt>
                <dd className="font-semibold text-slate-900 text-right">{payment.member_name}</dd>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-4">
                <dt className="text-slate-500">Recipient:</dt>
                <dd className="font-semibold text-slate-900 text-right">{payment.recipient_label}</dd>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-4">
                <dt className="text-slate-500">Amount:</dt>
                <dd className="font-bold text-2xl text-blue-600 text-right">${payment.amount.toFixed(2)} {payment.currency}</dd>
              </div>
              {payment.reason_text && (
                <div className="grid grid-cols-[auto_1fr] gap-4">
                  <dt className="text-slate-500">Note:</dt>
                  <dd className="text-slate-900 text-right">{payment.reason_text}</dd>
                </div>
              )}
              <div className="grid grid-cols-[auto_1fr] gap-4">
                <dt className="text-slate-500">Policy Tier:</dt>
                <dd className="font-semibold text-slate-900 text-right">
                  <Badge variant="tier" tier={payment.tier.toLowerCase() as any} />
                </dd>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-4">
                <dt className="text-slate-500">Risk Level:</dt>
                <dd className="text-right">
                  <RiskBadge level={payment.risk_level as any} score={payment.risk_score} />
                </dd>
              </div>
              {payment.decided_by && (
                <div className="grid grid-cols-[auto_1fr] gap-4">
                  <dt className="text-slate-500">Decided By:</dt>
                  <dd className="font-semibold text-slate-900 text-right">{payment.decided_by}</dd>
                </div>
              )}
              {payment.decided_at && (
                <div className="grid grid-cols-[auto_1fr] gap-4">
                  <dt className="text-slate-500">Decided At:</dt>
                  <dd className="text-slate-900 text-right">{new Date(payment.decided_at).toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button asChild className="flex-1">
              <Link href="/pay">Send Another Payment</Link>
            </Button>
            <Button variant="secondary" asChild className="flex-1">
              <Link href="/dashboard">Go to Family Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}