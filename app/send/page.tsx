'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/components/MemberContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info, CreditCard, QrCode, Users, Search, Plus, Scan, Shield, ArrowRight } from 'lucide-react';

type SendTab = 'scan' | 'contacts' | 'new';

export default function SendPage() {
  const router = useRouter();
  const { activeMember } = useMember();
  interface Contact {
  id: string;
  name: string;
  handle: string;
  category: string;
  trust: string;
  avatar_color: string;
}

  const [activeTab, setActiveTab] = useState<SendTab>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    reason: '',
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
        setFilteredContacts(data);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      setFilteredContacts(contacts.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.handle.toLowerCase().includes(term)
      ));
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(formData.amount);
    if (!formData.recipient.trim()) {
      setError('Please select or enter a recipient.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than $0.');
      return;
    }
    if (!formData.reason.trim()) {
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
          recipient_label: formData.recipient.trim(),
          amount: numAmount,
          reason_text: formData.reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate payment.');
      }

      toast.success('Payment initiated! Redirecting to PayPal...');

      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        router.push(`/status/${data.paymentId}`);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const selectContact = (contact: { name: string }) => {
    setFormData(prev => ({ ...prev, recipient: contact.name }));
    setActiveTab('new');
  };

  const isHead = activeMember?.role === 'head';

  const getTierInfo = () => {
    if (isHead) return { tier: 'UNLIMITED', color: 'blue', text: 'No limits - payments process instantly' };
    const auto = activeMember?.auto_limit || 0;
    const notify = activeMember?.notify_limit || 0;
    return {
      tier: `$${auto} / $${notify}`,
      color: 'green',
      text: `Auto ≤ $${auto} • Notify $${auto}–$${notify} • Approval > $${notify}`
    };
  };

  const tierInfo = getTierInfo();

  return (
    <div className="max-w-md mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="px-2">
        <h1 className="text-2xl font-bold text-slate-900">Send Money</h1>
        <p className="text-slate-500 text-sm mt-0.5">Sending as <span className="font-medium text-slate-900">{activeMember?.name}</span></p>
      </div>

      {/* Member Tier Badge */}
      <div className={cn('px-4 py-3 rounded-2xl border flex items-center gap-3',
        tierInfo.color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
      )}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
          tierInfo.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
        )}>
          {tierInfo.color === 'blue' ? <Shield className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 text-sm">{activeMember?.role === 'head' ? 'Head of Family' : 'Guardian Protection'}</p>
          <p className="text-xs text-slate-600 mt-0.5">{tierInfo.text}</p>
        </div>
        <Badge variant="tier" tier={tierInfo.color === 'blue' ? 'auto' : 'notify'} className="text-xs">
          {tierInfo.tier}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SendTab)} className="w-full">
        <TabsList className="bg-slate-100 rounded-xl p-1 w-full">
          <TabsTrigger value="contacts" className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium">
            <Users className="w-4 h-4" aria-hidden="true" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium">
            <QrCode className="w-4 h-4" aria-hidden="true" />
            Scan to Pay
          </TabsTrigger>
          <TabsTrigger value="new" className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium">
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Payment
          </TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="mt-4 animate-in fade-in duration-200">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search contacts"
            />
          </div>

          {filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" aria-hidden="true" />
              <p className="font-medium">No contacts found</p>
              <p className="text-sm mt-1">Try a different search or add a new payment</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => selectContact(contact)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                       style={{ backgroundColor: contact.avatar_color }}>
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{contact.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{contact.category} • {contact.trust}</p>
                  </div>
                  <Badge variant="risk" level={contact.trust === 'trusted' ? 'low' : contact.trust === 'known' ? 'medium' : 'high'} className="text-xs" />
                  <ArrowRight className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Scan Tab */}
        <TabsContent value="scan" className="mt-4 animate-in fade-in duration-200">
          <ScanToPay onScanComplete={(data) => {
            const params = new URLSearchParams(data.split('?')[1] || '');
            setFormData(prev => ({
              ...prev,
              recipient: params.get('name') || '',
              amount: params.get('amount') || '',
              reason: params.get('note') || '',
            }));
            setActiveTab('new');
            toast.success('QR code scanned! Review and confirm payment.');
          }} />
        </TabsContent>

        {/* New Payment Tab */}
        <TabsContent value="new" className="mt-4 animate-in fade-in duration-200">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4" role="alert">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Who are you paying?"
              placeholder="e.g. Campus Cafe, Whole Foods, Science Camp"
              value={formData.recipient}
              onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
              required
              disabled={loading}
              hint="Enter store, person, or organization name"
            />

            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
              disabled={loading}
              hint="PayPal sandbox - simulated test payment"
            />

            <Textarea
              label="Why are you paying?"
              placeholder="e.g. Books for chemistry class, lunch with friends..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
              disabled={loading}
              rows={3}
              hint="Our AI guardian reads this to ensure your payment is safe"
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? (
                <>Consulting Guardian AI... <ArrowRight className="w-4 h-4 animate-spin" aria-hidden="true" /></>
              ) : (
                <>Continue with PayPal <ArrowRight className="w-4 h-4" aria-hidden="true" /></>
              )}
            </Button>
          </form>

          {/* Safety Notice */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-slate-700">
                <p className="font-medium">How Guardian Protects You</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>AI analyzes every payment for scam signals</li>
                  <li>Small amounts process instantly</li>
                  <li>Larger/suspicious payments held for family head review</li>
                  <li>Money only moves after approval or auto-capture</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// QR Code Scanner Component
function ScanToPay({ onScanComplete }: { onScanComplete: (data: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (scanning) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [scanning]);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        startScanLoop();
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permission to scan QR codes.');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
  };

  const startScanLoop = () => {
    if (!scanning || !videoRef.current) return;

    scanTimeoutRef.current = setTimeout(() => {
      startScanLoop();
    }, 100);
  };

  const handleManualScan = () => {
    const testData = prompt('Enter fgpay:// URL or scan data (for demo):',
      'fgpay://pay?name=Grocery%20Mart&id=%2B1-555-GROCER&amount=35&note=Weekly%20groceries');
    if (testData) {
      onScanComplete(testData);
    }
  };

  return (
    <div className="space-y-4">
      {!scanning && !scannedData ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <QrCode className="w-12 h-12 text-white" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Scan to Pay</h3>
          <p className="text-slate-500 text-sm mt-1">Point camera at a Guardian Pay QR code to pay instantly</p>

          <div className="mt-6 space-y-3">
            <Button onClick={() => setScanning(true)} className="w-full" size="lg">
              <Scan className="w-5 h-5 mr-2" aria-hidden="true" />
              Open Camera & Scan
            </Button>
            <Button variant="outline" onClick={handleManualScan} className="w-full">
              Enter Code Manually
            </Button>
          </div>
        </div>
      ) : scanning ? (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            playsInline
            autoPlay
            muted
            aria-label="QR code scanner camera"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
            <div className="w-48 h-48 border-2 border-white/50 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-pulse" />
              <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-white/30 rounded-lg pointer-events-none" />
            </div>
            <p className="mt-4 text-center text-sm opacity-80">Position QR code within the frame</p>
            <Button variant="ghost" className="mt-4 text-white hover:bg-white/10" onClick={() => setScanning(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
            <Shield className="w-8 h-8 text-green-600" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">QR Code Scanned!</h3>
          <p className="text-slate-500 text-sm mt-1">{scannedData}</p>
          <Button className="w-full mt-4" onClick={() => { setScannedData(null); setScanning(false); }}>
            Scan Another
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}