'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/components/MemberContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, CreditCard, Shield, Users, Building2, Pill, GraduationCap, Wrench, User, Filter, ChevronRight } from 'lucide-react';
import { Contact } from '@/lib/types';
import { toast } from '@/components/ui/toast';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  utility: <Building2 className="w-5 h-5" />,
  store: <CreditCard className="w-5 h-5" />,
  school: <GraduationCap className="w-5 h-5" />,
  pharmacy: <Pill className="w-5 h-5" />,
  service: <Wrench className="w-5 h-5" />,
  person: <User className="w-5 h-5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  utility: 'Utilities',
  store: 'Stores',
  school: 'Education',
  pharmacy: 'Healthcare',
  service: 'Services',
  person: 'People',
};

const TRUST_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  trusted: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  known: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  new: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export default function ContactsPage() {
  const router = useRouter();
  const { activeMember } = useMember();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [trustFilter, setTrustFilter] = useState<string>('ALL');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', handle: '', category: 'person', trust: 'new' });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.handle.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter(c => c.category === categoryFilter);
    }

    if (trustFilter !== 'ALL') {
      result = result.filter(c => c.trust === trustFilter);
    }

    return result.sort((a, b) => {
      const trustOrder = { trusted: 0, known: 1, new: 2 };
      return trustOrder[a.trust] - trustOrder[b.trust];
    });
  }, [contacts, searchQuery, categoryFilter, trustFilter]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.handle.trim()) return;

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });

      if (res.ok) {
        toast.success('Contact added');
        setShowAddContact(false);
        setNewContact({ name: '', handle: '', category: 'person', trust: 'new' });
        loadContacts();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add contact');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const navigateToPay = (contact: Contact) => {
    router.push(`/send?contact=${encodeURIComponent(contact.name)}&handle=${encodeURIComponent(contact.handle)}`);
  };

  const categories = ['utility', 'store', 'school', 'pharmacy', 'service', 'person'];
  const trustLevels = ['trusted', 'known', 'new'];

  return (
    <div className="max-w-md mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="px-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 text-sm mt-0.5">{contacts.length} saved contacts</p>
        </div>
        <Button onClick={() => setShowAddContact(true)} className="flex items-center gap-2" size="sm">
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Search */}
      <div className="px-2 relative">
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

      {/* Filter Chips */}
      <div className="px-2 flex gap-2 overflow-x-auto pb-2">
        <FilterChip label="All" active={categoryFilter === 'ALL'} onClick={() => setCategoryFilter('ALL')} />
        {categories.map(cat => (
          <FilterChip
            key={cat}
            label={CATEGORY_LABELS[cat]}
            active={categoryFilter === cat}
            onClick={() => setCategoryFilter(cat)}
            icon={CATEGORY_ICONS[cat]}
          />
        ))}
      </div>

      <div className="px-2 flex gap-2 overflow-x-auto pb-4">
        <FilterChip label="All Trust" active={trustFilter === 'ALL'} onClick={() => setTrustFilter('ALL')} />
        {trustLevels.map(trust => (
          <FilterChip
            key={trust}
            label={trust.charAt(0).toUpperCase() + trust.slice(1)}
            active={trustFilter === trust}
            onClick={() => setTrustFilter(trust)}
            color={trust}
          />
        ))}
      </div>

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <Card className="px-2">
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" aria-hidden="true" />
            <h3 className="font-semibold text-slate-900">No contacts found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting filters or add a new contact</p>
            <Button onClick={() => setShowAddContact(true)} className="mt-4">
              Add Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 px-2">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onPress={() => navigateToPay(contact)}
            />
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddContact(false)} aria-hidden="true" />
          <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-4 duration-300 sm:slide-in-from-bottom-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add New Contact</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddContact(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </Button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <Input
                label="Contact Name"
                placeholder="e.g. Grocery Mart, Dr. Smith, School Office"
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                required
              />

              <Input
                label="Phone / Handle"
                placeholder="e.g. +1-555-GROCER, +1-555-0123"
                value={newContact.handle}
                onChange={(e) => setNewContact(prev => ({ ...prev, handle: e.target.value }))}
                required
                hint="Used to identify the recipient"
              />

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewContact(prev => ({ ...prev, category: cat }))}
                      className={cn(
                        'p-3 rounded-xl border-2 transition-all text-center',
                        newContact.category === cat
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <div className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</div>
                      <span className="text-xs font-medium capitalize">{CATEGORY_LABELS[cat]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Trust Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {trustLevels.map(trust => (
                    <button
                      key={trust}
                      type="button"
                      onClick={() => setNewContact(prev => ({ ...prev, trust: trust as any }))}
                      className={cn(
                        'p-3 rounded-xl border-2 transition-all text-center',
                        newContact.trust === trust
                          ? `border-${TRUST_COLORS[trust].border.replace('border-', '')} bg-${TRUST_COLORS[trust].bg} text-${TRUST_COLORS[trust].text}`
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <span className="text-sm font-medium capitalize">{trust}</span>
                      <p className="text-xs mt-1 opacity-75">
                        {trust === 'trusted' ? 'Verified & safe' : trust === 'known' ? 'Previously paid' : 'New contact'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowAddContact(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Contact
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactCard({ contact, onPress }: { contact: Contact; onPress: () => void }) {
  const trustColors = TRUST_COLORS[contact.trust];

  return (
    <Card className="border-slate-200 hover:border-slate-300 transition-colors cursor-pointer" onClick={onPress}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
               style={{ backgroundColor: contact.avatar_color }}>
            {contact.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900 truncate">{contact.name}</p>
              <Badge variant="risk" level={contact.trust === 'trusted' ? 'low' : contact.trust === 'known' ? 'medium' : 'high'} className="text-xs" />
            </div>
            <p className="text-sm text-slate-500 truncate mt-0.5">{contact.handle}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                {CATEGORY_ICONS[contact.category]}
                {CATEGORY_LABELS[contact.category]}
              </span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', trustColors.bg, trustColors.text, trustColors.border)}>
                {contact.trust}
              </span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}

function FilterChip({ label, active, onClick, icon, color }: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  color?: string;
}) {
  const trustColors = color ? TRUST_COLORS[color] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0 flex items-center gap-1.5',
        active
          ? (trustColors
              ? `${trustColors.bg} ${trustColors.text} ${trustColors.border}`
              : 'bg-blue-50 text-blue-700 border-blue-200')
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      )}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}