'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMember } from '@/components/MemberContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import { 
  Search, QrCode, ScanLine, Plus, ArrowRight, 
  Shield, CheckCircle2, AlertCircle, X, 
  Loader2, Image, Camera, Upload, Wifi, WifiOff
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function PayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeMember } = useMember();
  
  // State
  const [contacts, setContacts] = useState<any[]>([]);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactHandle, setNewContactHandle] = useState('');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isPathB, setIsPathB] = useState(false);
  const [safetyAnswers, setSafetyAnswers] = useState<{
    asker?: 'shop_service' | 'family_friend' | 'unknown_person' | 'not_sure';
    purpose?: 'buying' | 'bill_fee' | 'prize_refund_reward' | 'verify_account' | 'other';
    extra_note?: string;
  }>({});

  // Check if this is Path B (opened from link)
  useEffect(() => {
    const src = searchParams.get('src');
    const to = searchParams.get('to');
    const id = searchParams.get('id');
    const amt = searchParams.get('amount');
    const noteParam = searchParams.get('note');
    
    if (src === 'link' || (to && id)) {
      setIsPathB(true);
      // Pre-fill from URL params
      if (to) setSearchQuery(to);
      if (amt) setAmount(amt);
      if (noteParam) setNote(noteParam);
      
      // Try to find or create contact
      if (to && id) {
        fetch(`/api/contacts?handle=${encodeURIComponent(id)}&name=${encodeURIComponent(to)}`)
          .then(r => r.json())
          .then(c => {
            if (c.id) {
              setSelectedContact(c);
              setSearchQuery('');
            }
          });
      }
    }
  }, [searchParams]);

  // Fetch contacts and recent contacts on mount
  useEffect(() => {
    fetchContacts();
    fetchRecentContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const fetchRecentContacts = async () => {
    try {
      const res = await fetch(`/api/members/${activeMember.id}/recent-contacts`);
      if (res.ok) {
        const data = await res.json();
        setRecentContacts(data);
      }
    } catch (err) {
      console.error('Failed to fetch recent contacts:', err);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);
    setSearchQuery('');
  };

  const handleCreateNewContact = async () => {
    if (!newContactName.trim() || !newContactHandle.trim()) {
      toast.error('Name and phone/ID are required');
      return;
    }
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContactName.trim(),
          handle: newContactHandle.trim(),
          category: 'person',
          trust: 'new',
        }),
      });
      if (res.ok) {
        const contact = await res.json();
        setSelectedContact(contact);
        setShowNewContact(false);
        setNewContactName('');
        setNewContactHandle('');
        toast.success('Contact created');
      } else {
        throw new Error('Failed to create contact');
      }
    } catch (err) {
      toast.error('Failed to create contact');
    }
  };

  const handlePay = async () => {
    if (!selectedContact) {
      toast.error('Please select a contact');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // For Path B, show safety check first
      if (isPathB && !safetyAnswers.asker) {
        // This shouldn't happen as safety check is shown before calling this
        return;
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: activeMember.id,
          contact_id: selectedContact.id,
          amount: parseFloat(amount),
          note_text: note.trim() || null,
          entry_path: isPathB ? 'link' : 'app',
          safety_answers: isPathB ? safetyAnswers : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate payment');

      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        router.push(`/status/${data.paymentId}`);
      }
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handleScanResult = (result: string) => {
    setScannerError(null);
    // Parse fgpay://pay?name=NAME&id=HANDLE&amount=AMOUNT&note=TEXT
    try {
      const url = new URL(result);
      if (url.protocol !== 'fgpay:') throw new Error('Invalid format');
      
      const name = url.searchParams.get('name') || '';
      const handle = url.searchParams.get('id') || '';
      const amt = url.searchParams.get('amount') || '';
      const noteParam = url.searchParams.get('note') || '';
      
      if (!handle) throw new Error('Missing handle in QR code');
      
      // Find or create contact
      fetch(`/api/contacts?handle=${encodeURIComponent(handle)}&name=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(contact => {
          if (contact.id) {
            setSelectedContact(contact);
            if (amt) setAmount(amt);
            if (noteParam) setNote(noteParam);
            setShowScanner(false);
            toast.success('Contact found from QR code');
          }
        });
    } catch (err) {
      setScannerError('Invalid QR code format. Please use a Family Guardian QR code.');
    }
  };

  // Render safety check for Path B
  if (isPathB && !safetyAnswers.asker && selectedContact) {
    return (
      <div className="max-w-sm mx-auto px-4 py-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-amber-600" />
            </div>
            <CardTitle>You opened this payment from a link</CardTitle>
            <CardDescription>
              Quick check before you pay to {selectedContact.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Who is asking you to pay?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'shop_service', label: 'A shop or service I use' },
                  { value: 'family_friend', label: 'A family member or friend' },
                  { value: 'unknown_person', label: 'Someone I don\'t know' },
                  { value: 'not_sure', label: 'I\'m not sure' },
                ] as const).map(opt => (
                  <Button
                    key={opt.value}
                    variant={safetyAnswers.asker === opt.value ? 'primary' : 'outline'}
                    className="h-auto py-3 text-sm"
                    onClick={() => setSafetyAnswers({...safetyAnswers, asker: opt.value})}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                What is it for?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'buying', label: 'Buying something' },
                  { value: 'bill_fee', label: 'A bill or fee' },
                  { value: 'prize_refund_reward', label: 'A prize, refund or reward' },
                  { value: 'verify_account', label: 'Verifying my account' },
                  { value: 'other', label: 'Something else' },
                ] as const).map(opt => (
                  <Button
                    key={opt.value}
                    variant={safetyAnswers.purpose === opt.value ? 'primary' : 'outline'}
                    className="h-auto py-3 text-sm"
                    onClick={() => setSafetyAnswers({...safetyAnswers, purpose: opt.value})}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Anything else we should know? (optional)
              </label>
              <Textarea
                value={safetyAnswers.extra_note || ''}
                onChange={e => setSafetyAnswers({...safetyAnswers, extra_note: e.target.value})}
                placeholder="Max 140 characters"
                maxLength={140}
                rows={2}
              />
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {}}
              disabled={!safetyAnswers.asker || !safetyAnswers.purpose}
            >
              Continue to Pay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTrustBadge = (trust: string) => {
    switch (trust) {
      case 'trusted': return <Badge variant="success" className="text-xs">Trusted</Badge>;
      case 'known': return <Badge variant="secondary" className="text-xs">Known</Badge>;
      case 'new': return <Badge variant="warning" className="text-xs">New</Badge>;
      default: return <Badge variant="outline" className="text-xs">{trust}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => (
    <Badge variant="outline" className="text-xs">{category}</Badge>
  );

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Send Money</h1>
        <span className="text-sm text-slate-500">
          {activeMember.name} ({activeMember.role})
        </span>
      </div>

      {/* Head account notice */}
      {activeMember.role === 'head' && (
        <div className="text-center text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
          Head payments are logged, not held
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search name or number"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search contacts"
        />
      </div>

      {/* Scan button */}
      <Button 
        className="w-full" 
        size="lg"
        variant="secondary"
        onClick={() => setShowScanner(true)}
        disabled={loading}
      >
        <QrCode size={20} className="mr-2" />
        Scan to Pay
      </Button>

      {/* Recent contacts */}
      {recentContacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentContacts.map(rc => (
              <div 
                key={rc.contact_id}
                className="flex-shrink-0 w-16 flex flex-col items-center"
                onClick={() => {
                  const contact = contacts.find(c => c.id === rc.contact_id);
                  if (contact) handleSelectContact(contact);
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" 
                     style={{ backgroundColor: rc.avatar_color }}>
                  {rc.name.charAt(0)}
                </div>
                <span className="text-xs text-center truncate w-full mt-1">{rc.name}</span>
                {getTrustBadge(rc.trust) && <div className="mt-1">{getTrustBadge(rc.trust)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All contacts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">All Contacts</h3>
        </div>
        {filteredContacts.map(contact => (
          <Button
            key={contact.id}
            variant={selectedContact?.id === contact.id ? 'primary' : 'outline'}
            className="w-full justify-between text-left h-auto py-3"
            onClick={() => handleSelectContact(contact)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" 
                   style={{ backgroundColor: contact.avatar_color }}>
                {contact.name.charAt(0)}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium truncate">{contact.name}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  {getCategoryBadge(contact.category)}
                  {getTrustBadge(contact.trust)}
                </div>
              </div>
            </div>
            {selectedContact?.id === contact.id && (
              <CheckCircle2 size={20} className="text-blue-600" />
            )}
          </Button>
        ))}
        {/* Pay someone new */}
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600 hover:bg-slate-50"
          onClick={() => setShowNewContact(true)}
        >
          <Plus size={20} className="mr-2 text-slate-400" />
          Pay someone new
        </Button>
      </div>

      {/* Amount screen */}
      {selectedContact && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl" 
                   style={{ backgroundColor: selectedContact.avatar_color }}>
                {selectedContact.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{selectedContact.name}</div>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  {getCategoryBadge(selectedContact.category)}
                  {getTrustBadge(selectedContact.trust)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-900">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-2xl font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  inputMode="decimal"
                />
              </div>
              <div className="flex gap-2">
                {['10', '20', '50'].map(amt => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setAmount(amt)}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900">Add a note (optional)</label>
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Weekly groceries, School trip fee..."
                maxLength={140}
                rows={2}
              />
              <p className="text-xs text-slate-500 text-right">{note.length}/140</p>
            </div>

            <div className="text-center text-sm text-slate-500 pt-2">
              <Shield size={14} className="inline mr-1" />
              Every payment is checked by Family Guardian
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePay}
              disabled={loading || !amount || parseFloat(amount) <= 0}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${parseFloat(amount || '0').toFixed(2)}`
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scan QR Code</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowScanner(false)}>
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none" 
                     style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
                <div className="text-center p-4">
                  <ScanLine size={48} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-slate-600">Point at a QR code</p>
                  <p className="text-xs text-slate-400 mt-1">Format: fgpay://pay?name=...&id=...&amount=...</p>
                </div>
                {/* In a real app, this would be a camera view with html5-qrcode */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => setScannerError('Camera not available in web preview. Use "Upload a QR image" or "Use a sample QR (demo)".')}>
                    <Camera size={20} className="mr-2" />
                    Open Camera
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setScannerError('File upload not implemented in demo. Use "Use a sample QR (demo)".');
                      }
                    };
                    input.click();
                  }}>
                    <Upload size={20} className="mr-2" />
                    Upload a QR image
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    // Demo: simulate scanning Grocery Mart QR
                    handleScanResult('fgpay://pay?name=Grocery%20Mart&id=%2B1-555-GROCER&amount=35&note=Weekly%20groceries');
                  }}>
                    Use a sample QR (demo)
                  </Button>
                </div>
              </div>
              {scannerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {scannerError}
                </div>
              )}
              <div className="text-center text-sm text-slate-500">
                Demo QR codes available on /demo page
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Contact Modal */}
      {showNewContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Pay Someone New</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                placeholder="e.g. John's Coffee Shop"
                value={newContactName}
                onChange={e => setNewContactName(e.target.value)}
              />
              <Input
                label="Phone or ID"
                placeholder="e.g. +1-555-1234"
                value={newContactHandle}
                onChange={e => setNewContactHandle(e.target.value)}
              />
              <p className="text-sm text-slate-500">
                This creates a new contact with trust level "New"
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowNewContact(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreateNewContact}>
                  Add & Pay
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-12 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PayPageContent />
    </Suspense>
  );
}