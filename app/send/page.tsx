'use client';

import React, { useState } from 'react';
import { useMember } from '@/components/MemberContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import { AlertCircle, Info } from 'lucide-react';

export default function SendPage() {
  const { activeMember } = useMember();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (!recipient.trim()) {
      setError('Please enter a recipient name.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than $0.');
      return;
    }
    if (!reason.trim()) {
      setError('Please explain why you are making this payment.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: activeMember.id,
          recipient_label: recipient.trim(),
          amount: numAmount,
          reason_text: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate payment.');
      }

      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        window.location.href = `/status/${data.paymentId}`;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const isHead = activeMember?.role === 'head';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Send Money</h1>
        <p className="text-slate-600 mt-1">
          Sending as <strong>{activeMember.name}</strong> ({activeMember.role.toUpperCase()})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Payment</CardTitle>
          <CardDescription>
            Enter the payment details below. Our AI guardian will review it for safety before processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isHead ? (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium text-blue-900">Head of Family Account</p>
                <p className="text-sm text-blue-700 mt-1">
                  Payments made by the head are executed directly without holds, and logged to the family dashboard.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Info size={20} className="text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium text-green-900">Guardian Protection Policy</p>
                <p className="text-sm text-green-700 mt-1">
                  Payments up to ${activeMember.auto_limit} process automatically. Payments between ${activeMember.auto_limit} and ${activeMember.notify_limit} notify the head. Larger or suspicious payments are held safely until the head reviews them.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              label="Who are you paying?"
              placeholder="e.g. Campus Cafe, Whole Foods, Science Camp"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              disabled={loading}
              hint="Enter the store, person, or organization name."
            />

            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              hint="PayPal sandbox simulated test payment."
            />

            <Textarea
              label="Why are you paying?"
              placeholder="e.g. Books for chemistry class, lunch with friends..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={loading}
              rows={3}
              hint="Our AI guardian reads this to ensure your payment is safe."
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Consulting Guardian AI & Preparing PayPal...' : 'Continue with PayPal'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}