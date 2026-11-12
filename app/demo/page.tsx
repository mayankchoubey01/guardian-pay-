'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/components/MemberContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { Shield, Play, RotateCcw, AlertTriangle, CheckCircle2, XCircle, DollarSign, User, Mail, CreditCard, QrCode, ScanLine, Wifi, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

export default function DemoPage() {
  const router = useRouter();
  const { setActiveMemberId, refreshUnreadCount } = useMember();
  const [loadingScenario, setLoadingScenario] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  // Generate QR codes on mount
  useEffect(() => {
    const generateQRCodes = async () => {
      const codes: Record<string, string> = {};
      
      // Grocery Mart (saved contact)
      codes['grocery'] = await QRCode.toDataURL(
        'fgpay://pay?name=Grocery%20Mart&id=%2B1-555-GROCER&amount=35&note=Weekly%20groceries'
      );
      
      // Prize Claim Center (new contact for scan demo)
      codes['prize'] = await QRCode.toDataURL(
        'fgpay://pay?name=Prize%20Claim%20Center&id=%2B1-555-PRIZE&amount=8&note=Congratulations%20you%20won!'
      );
      
      // KYC Verify Desk (for Path B link demo)
      codes['kyc'] = await QRCode.toDataURL(
        'fgpay://pay?name=KYC%20Verify%20Desk&id=%2B1-555-KYC&amount=5&note=Bank%20verification%20required'
      );
      
      setQrCodes(codes);
    };
    generateQRCodes();
  }, []);

  const scenarios = [
    {
      num: 1,
      title: 'Riya, Juice Bar, $4 → AUTO',
      memberId: 'riya',
      memberName: 'Riya (Teen)',
      contactName: 'Juice Bar',
      contactHandle: '+1-555-JUICE',
      amount: 4.0,
      note: '',
      expectedTier: 'AUTO',
      outcome: 'Trusted contact, small amount within auto limit. Processes instantly.',
      buttonText: 'Run: Riya pays Juice Bar $4 (AUTO)',
      icon: <CheckCircle2 size={18} className="text-green-600" />,
      color: 'green',
      path: 'app',
    },
    {
      num: 2,
      title: 'Mom, Grocery Mart, $35 → NOTIFY',
      memberId: 'mom',
      memberName: 'Mom (Adult)',
      contactName: 'Grocery Mart',
      contactHandle: '+1-555-GROCER',
      amount: 35.0,
      note: 'Weekly groceries',
      expectedTier: 'NOTIFY',
      outcome: 'Trusted contact, amount exceeds auto limit but within notify limit. Dad gets notified.',
      buttonText: 'Run: Mom pays Grocery Mart $35 (NOTIFY)',
      icon: <DollarSign size={18} className="text-amber-600" />,
      color: 'amber',
      path: 'app',
    },
    {
      num: 3,
      title: 'Riya, School Office, $90 → APPROVAL (Head approves)',
      memberId: 'riya',
      memberName: 'Riya (Teen)',
      contactName: 'School Office',
      contactHandle: '+1-555-SCHOOL',
      amount: 90.0,
      note: 'School trip fee',
      expectedTier: 'APPROVAL',
      outcome: 'Amount exceeds teen notify limit ($40). Held for head approval. Head clicks Approve → Captured.',
      buttonText: 'Run: Riya pays School Office $90 (APPROVAL)',
      icon: <CreditCard size={18} className="text-blue-600" />,
      color: 'blue',
      path: 'app',
    },
    {
      num: 4,
      title: 'Grandma, KYC Verify Desk (link) → Safety Check → HELD (Head blocks)',
      memberId: 'grandma',
      memberName: 'Grandma (Elder)',
      contactName: 'KYC Verify Desk',
      contactHandle: '+1-555-KYC',
      amount: 5.0,
      note: 'Bank verification required',
      expectedTier: 'APPROVAL',
      outcome: 'Path B (external link). Safety check: "Someone I don\'t know" + "Verifying my account" → forces APPROVAL. Head blocks → Voided.',
      buttonText: 'Run: Grandma opens payment link (Safety Check)',
      icon: <AlertTriangle size={18} className="text-red-600" />,
      color: 'red',
      path: 'link',
    },
    {
      num: 5,
      title: 'Mom, Scan QR → Prize Claim Center (new) → NOTIFY',
      memberId: 'mom',
      memberName: 'Mom (Adult)',
      contactName: 'Prize Claim Center',
      contactHandle: '+1-555-PRIZE',
      amount: 8.0,
      note: 'Congratulations you won!',
      expectedTier: 'NOTIFY',
      outcome: 'Path A (scan). New contact (trust: new) → at least NOTIFY. AI judges alone.',
      buttonText: 'Run: Mom scans Prize Claim QR (NOTIFY)',
      icon: <QrCode size={18} className="text-purple-600" />,
      color: 'purple',
      path: 'scan',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', button: 'bg-green-600 hover:bg-green-700' };
      case 'amber': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', button: 'bg-amber-600 hover:bg-amber-700' };
      case 'red': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', button: 'bg-red-600 hover:bg-red-700' };
      case 'blue': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', button: 'bg-blue-600 hover:bg-blue-700' };
      case 'purple': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', button: 'bg-purple-600 hover:bg-purple-700' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', button: 'bg-slate-600 hover:bg-slate-700' };
    }
  };

  const handleRunScenario = async (sc: typeof scenarios[0]) => {
    setLoadingScenario(sc.num);
    setMessage(null);

    setActiveMemberId(sc.memberId);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: sc.memberId,
          contact_handle: sc.contactHandle,
          contact_name: sc.contactName,
          amount: sc.amount,
          note_text: sc.note || null,
          entry_path: sc.path,
          safety_answers: sc.path === 'link' ? {
            asker: 'unknown_person',
            purpose: 'verify_account',
            extra_note: 'Demo: simulating link from unknown sender',
          } : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger scenario.');

      refreshUnreadCount();

      setMessage(
        `Created payment for ${sc.memberName}: $${sc.amount.toFixed(2)} to ${sc.contactName}. Resulting Tier: ${data.tier}.`
      );

      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        router.push(`/status/${data.paymentId}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Reset all demo data back to the clean initial seeded records (contacts + 25 payments)?')) return;
    setResetting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('Demo data successfully reset to clean seed records (contacts + payments).');
      toast.success('Demo data reset successfully');
      refreshUnreadCount();
      router.refresh();
    } catch (err: any) {
      setMessage(`Reset error: ${err.message}`);
      toast.error(err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div>
            <div className="flex items-center gap-2 text-slate-900 mb-1">
              <Shield size={24} className="text-purple-600" aria-hidden="true" />
              <CardTitle className="text-xl">Demo Scenarios Control Room</CardTitle>
            </div>
            <CardDescription>One-click repeatable scenarios for judging and video presentation.</CardDescription>
          </div>
          <Button
            variant="danger"
            onClick={handleResetData}
            disabled={resetting}
            className="whitespace-nowrap"
          >
            {resetting ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw size={18} aria-hidden="true" />
                Reset Demo Data
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
              {message}
            </div>
          )}

          {/* Sample QR Codes for Demo */}
          <div className="grid gap-4 md:grid-cols-3">
            {qrCodes.grocery && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <h4 className="font-medium text-slate-900 mb-2">Grocery Mart (Saved Contact)</h4>
                <p className="text-sm text-slate-600 mb-2">Scan to pay $35</p>
                <img src={qrCodes.grocery} alt="Grocery Mart QR" className="mx-auto w-32 h-32" />
                <p className="text-xs text-slate-500 mt-1">fgpay://pay?name=Grocery%20Mart&id=...</p>
              </div>
            )}
            {qrCodes.prize && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                <h4 className="font-medium text-purple-900 mb-2">Prize Claim Center (New Contact)</h4>
                <p className="text-sm text-purple-700 mb-2">Scan to pay $8</p>
                <img src={qrCodes.prize} alt="Prize Claim QR" className="mx-auto w-32 h-32" />
                <p className="text-xs text-purple-500 mt-1">fgpay://pay?name=Prize%20Claim...&id=...</p>
              </div>
            )}
            {qrCodes.kyc && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <h4 className="font-medium text-red-900 mb-2">KYC Verify Desk (Scam)</h4>
                <p className="text-sm text-red-700 mb-2">Open as payment link</p>
                <img src={qrCodes.kyc} alt="KYC Verify QR" className="mx-auto w-32 h-32" />
                <p className="text-xs text-red-500 mt-1">fgpay://pay?name=KYC%20Verify...&id=...</p>
              </div>
            )}
          </div>

          {scenarios.map((sc) => {
            const colors = getColorClasses(sc.color);
            return (
              <div
                key={sc.num}
                className={`border rounded-lg p-5 ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-slate-900">{sc.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {sc.icon}
                    <Badge
                      variant="tier"
                      tier={
                        sc.expectedTier.includes('APPROVAL') ? 'approval' :
                        sc.expectedTier === 'NOTIFY' ? 'notify' : 'auto'
                      }
                      className="text-xs"
                    >
                      {sc.expectedTier}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  <span className="px-2 py-1 bg-white/50 rounded text-slate-700">
                    <Wifi size={14} className="inline mr-1" />
                    {sc.path === 'app' ? 'In App' : sc.path === 'link' ? 'Link (Path B)' : 'Scan (Path A)'}
                  </span>
                </div>

                <p className="text-slate-700 mb-2">
                  <strong>Payer:</strong> {sc.memberName} &bull;
                  <strong>Contact:</strong> {sc.contactName} &bull;
                  <strong>Amount:</strong> ${sc.amount.toFixed(2)} USD
                </p>
                {sc.note && (
                  <p className="text-sm italic text-slate-600 mb-3">
                    Note: "{sc.note}"
                  </p>
                )}
                <p className="text-sm text-slate-600 mb-4">
                  <strong>Expected:</strong> {sc.outcome}
                </p>

                <Button
                  className={`${colors.button} w-full sm:w-auto`}
                  onClick={() => handleRunScenario(sc)}
                  disabled={loadingScenario !== null}
                >
                  {loadingScenario === sc.num ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Running Scenario...
                    </>
                  ) : (
                    <>
                      <Play size={18} aria-hidden="true" />
                      {sc.buttonText}
                    </>
                  )}
                </Button>
              </div>
            );
          })}

          {/* Additional test scenarios as simple buttons */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Additional Test Cases</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => toast.info('Test: empty note - add manually via /pay')}>
                <AlertCircle size={16} className="mr-2" />
                Empty note test
              </Button>
              <Button variant="outline" onClick={() => toast.info('Test: very long note - add manually via /pay')}>
                <AlertCircle size={16} className="mr-2" />
                Very long note test
              </Button>
              <Button variant="outline" onClick={() => toast.info('Test: prompt injection - add manually via /pay')}>
                <AlertCircle size={16} className="mr-2" />
                Prompt injection test
              </Button>
              <Button variant="outline" onClick={() => toast.info('Test: AI failure - disconnect network to test')}>
                <AlertCircle size={16} className="mr-2" />
                AI failure test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}