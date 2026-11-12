'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMember } from '@/components/MemberContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { Filter, Search, Download, CreditCard, Shield, Clock, XCircle, CheckCircle2 } from 'lucide-react';

interface PaymentRow {
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

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  captured: { icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, color: 'green', label: 'Completed' },
  held: { icon: <Clock className="w-4 h-4 text-amber-600" />, color: 'amber', label: 'Pending Review' },
  voided: { icon: <XCircle className="w-4 h-4 text-red-600" />, color: 'red', label: 'Blocked' },
  failed: { icon: <XCircle className="w-4 h-4 text-red-600" />, color: 'red', label: 'Failed' },
  draft: { icon: <Clock className="w-4 h-4 text-slate-500" />, color: 'slate', label: 'Draft' },
  order_created: { icon: <CreditCard className="w-4 h-4 text-blue-600" />, color: 'blue', label: 'Processing' },
};

const TIER_COLORS: Record<string, string> = {
  auto: 'green',
  notify: 'amber',
  approval: 'red',
};

export default function HistoryPage() {
  const { activeMember } = useMember();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('ALL');

  const fetchPayments = async () => {
    try {
      const url = new URL('/api/payments', window.location.origin);
      url.searchParams.set('member_id', activeMember.id);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 5000);
    return () => clearInterval(interval);
  }, [activeMember.id]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesRecipient = payment.recipient_label.toLowerCase().includes(query);
        const matchesAmount = payment.amount.toString().includes(query);
        if (!matchesRecipient && !matchesAmount) return false;
      }

      if (statusFilter !== 'ALL' && payment.status.toUpperCase() !== statusFilter) {
        return false;
      }

      if (tierFilter !== 'ALL' && payment.tier.toLowerCase() !== tierFilter.toLowerCase()) {
        return false;
      }

      if (dateRange !== 'ALL') {
        const paymentDate = new Date(payment.created_at).getTime();
        const now = Date.now();
        const dayMs = 86400000;
        let cutoff = 0;

        switch (dateRange) {
          case 'TODAY': cutoff = now - dayMs; break;
          case 'WEEK': cutoff = now - 7 * dayMs; break;
          case 'MONTH': cutoff = now - 30 * dayMs; break;
        }

        if (paymentDate < cutoff) return false;
      }

      return true;
    });
  }, [payments, searchQuery, statusFilter, tierFilter, dateRange]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getStatusConfig = (status: string) => STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG.draft;

  const stats = useMemo(() => {
    const captured = payments.filter(p => p.status === 'CAPTURED');
    const held = payments.filter(p => p.status === 'HELD');
    const voided = payments.filter(p => p.status === 'VOIDED');
    const thisMonth = captured.filter(p => new Date(p.created_at).getTime() > Date.now() - 30 * 86400000);

    return {
      totalSpent: captured.reduce((sum, p) => sum + p.amount, 0),
      thisMonthSpent: thisMonth.reduce((sum, p) => sum + p.amount, 0),
      pendingCount: held.length,
      blockedCount: voided.length,
      blockedAmount: voided.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [payments]);

  return (
    <div className="max-w-md mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="px-2">
        <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
        <p className="text-slate-500 text-sm mt-0.5">Your transactions as <span className="font-medium text-slate-900">{activeMember?.name}</span></p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 px-2">
        <StatCard
          label="Spent This Month"
          value={`$${stats.thisMonthSpent.toFixed(2)}`}
          icon={<CreditCard className="w-5 h-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          label="Total Spent"
          value={`$${stats.totalSpent.toFixed(2)}`}
          icon={<CreditCard className="w-5 h-5 text-green-600" />}
          color="green"
        />
        <StatCard
          label="Pending Review"
          value={String(stats.pendingCount)}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          color="amber"
        />
        <StatCard
          label="Protected"
          value={`$${stats.blockedAmount.toFixed(2)}`}
          icon={<Shield className="w-5 h-5 text-red-600" />}
          color="red"
        />
      </div>

      {/* Filters */}
      <Card className="px-2">
        <CardContent className="p-4 pt-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search recipient or amount..."
              className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search payments"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 px-2">
            <FilterChip
              label="All Status"
              active={statusFilter === 'ALL'}
              onClick={() => setStatusFilter('ALL')}
            />
            <FilterChip
              label="Completed"
              active={statusFilter === 'CAPTURED'}
              onClick={() => setStatusFilter('CAPTURED')}
              color="green"
            />
            <FilterChip
              label="Pending"
              active={statusFilter === 'HELD'}
              onClick={() => setStatusFilter('HELD')}
              color="amber"
            />
            <FilterChip
              label="Blocked"
              active={statusFilter === 'VOIDED'}
              onClick={() => setStatusFilter('VOIDED')}
              color="red"
            />
          </div>

          {/* Tier & Date filters */}
          <div className="grid grid-cols-2 gap-2">
            <FilterSelect
              value={tierFilter}
              onChange={setTierFilter}
              options={[
                { value: 'ALL', label: 'All Tiers' },
                { value: 'AUTO', label: 'Auto' },
                { value: 'NOTIFY', label: 'Notify' },
                { value: 'APPROVAL', label: 'Approval' },
              ]}
              label="Tier"
            />
            <FilterSelect
              value={dateRange}
              onChange={setDateRange}
              options={[
                { value: 'ALL', label: 'All Time' },
                { value: 'TODAY', label: 'Today' },
                { value: 'WEEK', label: 'This Week' },
                { value: 'MONTH', label: 'This Month' },
              ]}
              label="Period"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      {loading ? (
        <div className="space-y-3 px-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <Card className="px-2">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto text-slate-300 mb-4" aria-hidden="true" />
            <h3 className="font-semibold text-slate-900">No payments found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or make your first payment</p>
            <Button asChild className="mt-4">
              <a href="/send">Send Money</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 px-2">
          {filteredPayments.map((payment) => {
            const statusConfig = getStatusConfig(payment.status);
            const tierColor = TIER_COLORS[payment.tier.toLowerCase()] || 'slate';

            return (
              <PaymentCard
                key={payment.id}
                payment={payment}
                statusConfig={statusConfig}
                tierColor={tierColor}
                formatDate={formatDate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={cn('p-4 rounded-2xl border', colorClasses[color as keyof typeof colorClasses] || colorClasses.blue)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className="p-1.5 rounded-lg bg-white/50">{icon}</div>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function FilterChip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0',
        active
          ? (color ? colorClasses[color as keyof typeof colorClasses] : 'bg-blue-50 text-blue-700 border-blue-200')
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      )}
    >
      {label}
    </button>
  );
}

function FilterSelect({ value, onChange, options, label }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <div className="relative">
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function PaymentCard({ payment, statusConfig, tierColor, formatDate }: {
  payment: PaymentRow;
  statusConfig: { icon: React.ReactNode; color: string; label: string };
  tierColor: string;
  formatDate: (dateStr: string) => string;
}) {
  return (
    <Card className="border-slate-200 hover:border-slate-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            `bg-${statusConfig.color}-100 text-${statusConfig.color}-600`
          )}>
            {statusConfig.icon}
          </div>

          {/* Payment Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900 truncate">{payment.recipient_label}</p>
              <span className={cn('font-bold text-lg',
                payment.status === 'VOIDED' || payment.status === 'FAILED' ? 'text-red-600' : 'text-slate-900'
              )}>
                ${payment.amount.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="status" status={payment.status.toLowerCase() as any} className="text-xs">
                {statusConfig.label}
              </Badge>
              <Badge variant="tier" tier={tierColor as any} className="text-xs">
                {payment.tier.toUpperCase()}
              </Badge>
              {payment.risk_level && payment.risk_level !== 'low' && (
                <Badge variant="risk" level={payment.risk_level as any} score={payment.risk_score} className="text-xs" />
              )}
            </div>

            <p className="text-xs text-slate-500 mt-2">{formatDate(payment.created_at)}</p>
          </div>

          {/* Chevron */}
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}