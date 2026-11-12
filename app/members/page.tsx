'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMember, Member } from '@/components/MemberContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { Shield, User, Save, Loader2 } from 'lucide-react';

export default function MembersPage() {
  const { activeMember, allMembers } = useMember();
  const [members, setMembers] = useState<Member[]>(allMembers);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Enforce head-only access
  if (activeMember && activeMember.role !== 'head') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-8 text-center">
            <Shield size={48} className="mx-auto text-amber-500 mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Restricted to Head of Family</h2>
            <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
              <p className="text-sm text-amber-800">
                Only the head of family (Dad) can adjust payment limits. You are currently viewing as <strong>{activeMember.name}</strong>.
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

  const handleLimitChange = (id: string, field: 'auto_limit' | 'notify_limit', value: string) => {
    const num = parseFloat(value) || 0;
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: num } : m))
    );
  };

  const handleSave = async (member: Member) => {
    setSavingId(member.id);
    if (member.auto_limit > member.notify_limit) {
      toast.error(`Auto-approve limit cannot exceed the notify threshold for ${member.name}.`);
      setSavingId(null);
      return;
    }

    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          auto_limit: member.auto_limit,
          notify_limit: member.notify_limit,
        }),
      });

      if (!res.ok) throw new Error('Failed to update limits.');
      toast.success(`Successfully updated limits for ${member.name}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield size={24} className="text-blue-600" aria-hidden="true" />
          Family Member Protection Limits
        </h1>
        <p className="text-slate-600 mt-1">
          Configure spending boundaries for each family member. The Policy Gate enforces these rules automatically, while AI monitors transactions for scam risks.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6">
          {members.map((m) => {
            const isHead = m.role === 'head';
            return (
              <div key={m.id} className="border border-slate-200 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      {m.name}
                      <Badge variant="default" className="text-xs">{m.role.toUpperCase()}</Badge>
                    </h2>
                  </div>
                  {isHead && (
                    <span className="text-sm text-slate-500 italic">Head Account (No Spending Holds)</span>
                  )}
                </div>

                {isHead ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <User size={16} className="inline mr-1" aria-hidden="true" />
                      As Head of Family, Dad's payments are automatically approved and logged on the family dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Auto-Approve Up To ($ USD)"
                        type="number"
                        step="1"
                        min="0"
                        value={m.auto_limit}
                        onChange={(e) => handleLimitChange(m.id, 'auto_limit', e.target.value)}
                        hint="Payments under this amount complete instantly."
                      />

                      <Input
                        label="Notify Head Up To ($ USD)"
                        type="number"
                        step="1"
                        min="0"
                        value={m.notify_limit}
                        onChange={(e) => handleLimitChange(m.id, 'notify_limit', e.target.value)}
                        hint="Payments above this amount are held for Dad to confirm."
                      />
                    </div>

                    <Button
                      onClick={() => handleSave(m)}
                      disabled={savingId === m.id}
                      className="w-full sm:w-auto"
                    >
                      {savingId === m.id ? (
                        <>
                          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} aria-hidden="true" />
                          Save Limits for {m.name}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}