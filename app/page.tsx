'use client';

import React from 'react';
import Link from 'next/link';
import { useMember } from '@/components/MemberContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { activeMember } = useMember();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="text-center py-12 px-6">
        <Badge variant="tier" tier="approval" className="mb-4 inline-flex" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          PayPal AI Hackathon 2026 Prototype
        </Badge>
        <div className="flex items-center justify-center gap-3 mb-4">
          <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h1 className="text-4xl font-bold text-slate-900">Family Guardian</h1>
        </div>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          An AI agent that watches a family&rsquo;s payments and acts <em>before</em> money moves: small payments go through, medium ones notify the head of the family, and large or suspicious ones are held until the head decides.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild size="lg">
            <Link href="/send">Send Money Now <ArrowRight size={18} aria-hidden="true" /></Link>
          </Button>
          <Button variant="secondary" asChild size="lg">
            <Link href="/dashboard">View Family Dashboard</Link>
          </Button>
          <Button variant="secondary" asChild size="lg">
            <Link href="/demo">Run Demo Scenarios</Link>
          </Button>
        </div>
      </Card>

      {/* How It Works Section */}
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">How Family Guardian Protects the Family</h2>
          <p className="text-slate-600 mt-1">Three tiers of protection, enforced by policy and AI.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-slate-200 rounded-lg p-5">
            <Badge variant="tier" tier="auto" className="mb-3 inline-flex" style={{ fontSize: '0.75rem' }}>
              TIER 1: AUTO
            </Badge>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Frictionless Routine</h3>
            <p className="text-slate-600 text-sm">
              Routine payments under the member's limit to familiar recipients are captured immediately. No delays, no friction.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-5">
            <Badge variant="tier" tier="notify" className="mb-3 inline-flex" style={{ fontSize: '0.75rem' }}>
              TIER 2: NOTIFY
            </Badge>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Transparent Visibility</h3>
            <p className="text-slate-600 text-sm">
              Moderate payments go through right away, while automatically pinging the head of family with a real-time notification.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-5">
            <Badge variant="tier" tier="approval" className="mb-3 inline-flex" style={{ fontSize: '0.75rem' }}>
              TIER 3: APPROVAL
            </Badge>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Protective PayPal Hold</h3>
            <p className="text-slate-600 text-sm">
              Payments over limits or flagged with scam signals (urgency, KYC threats, gift cards) are held in PayPal authorization. Nothing moves until the head approves or blocks.
            </p>
          </div>
        </div>
      </Card>

      {/* Family Roles */}
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">The Family Profile</h2>
          <p className="text-slate-600 mt-1">
            Test any family member's perspective using the <strong>"Viewing as"</strong> switcher in the top bar:
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { name: 'Dad', role: 'Head of Family', desc: 'Approves/Blocks holds, views dashboard & reports', color: 'blue' },
            { name: 'Mom', role: 'Adult', desc: 'Auto: $25 • Notify: $100', color: 'green' },
            { name: 'Riya', role: 'Teen', desc: 'Auto: $10 • Notify: $40', color: 'amber' },
            { name: 'Aarav', role: 'Child', desc: 'Auto: $5 • Notify: $20', color: 'red' },
            { name: 'Grandma', role: 'Elder', desc: 'Auto: $10 • Notify: $30', color: 'purple' },
          ].map((member) => (
            <div key={member.name} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-bold text-slate-900">{member.name}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-600">{member.role}</span>
              </div>
              <p className="text-sm text-slate-600">{member.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}