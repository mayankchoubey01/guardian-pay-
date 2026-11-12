'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMember } from '@/components/MemberContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  CreditCard, QrCode, Users, History, Shield, Plus,
  ArrowRight, Clock, ShieldAlert, DollarSign, CheckCircle2,
  XCircle, ShieldCheck, Bell, Sparkles
} from 'lucide-react';

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

const STATUS_ICONS: Record<string, React.ReactNode> = {
  captured: <CheckCircle2 className="w-4 h-4 text-success-600" />,
  held: <Clock className="w-4 h-4 text-warning-600" />,
  voided: <XCircle className="w-4 h-4 text-danger-600" />,
  failed: <XCircle className="w-4 h-4 text-danger-600" />,
  draft: <Clock className="w-4 h-4 text-slate-500" />,
  order_created: <CreditCard className="w-4 h-4 text-primary-600" />,
};

export default function HomePage() {
  const router = useRouter();
  const { activeMember, allMembers } = useMember();
  const [recentPayments, setRecentPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [heldCount, setHeldCount] = useState(0);
  const isHead = activeMember?.role === 'head';

  const fetchRecentPayments = async () => {
    try {
      const url = new URL('/api/payments', window.location.origin);
      if (!isHead) {
        url.searchParams.set('member_id', activeMember.id);
      }
      url.searchParams.set('limit', '5');
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecentPayments(data.slice(0, 5));
        if (isHead) {
          const held = data.filter((p: PaymentRow) => p.status === 'HELD').length;
          setHeldCount(held);
        }
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentPayments();
    const interval = setInterval(fetchRecentPayments, 10000);
    return () => clearInterval(interval);
  }, [activeMember.id, isHead]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      captured: { icon: <CheckCircle2 className="w-4 h-4 text-success-600" />, color: 'success', label: 'Completed' },
      held: { icon: <Clock className="w-4 h-4 text-warning-600" />, color: 'warning', label: 'Pending Review' },
      voided: { icon: <XCircle className="w-4 h-4 text-danger-600" />, color: 'danger', label: 'Blocked' },
      failed: { icon: <XCircle className="w-4 h-4 text-danger-600" />, color: 'danger', label: 'Failed' },
      draft: { icon: <Clock className="w-4 h-4 text-slate-500" />, color: 'slate', label: 'Draft' },
      order_created: { icon: <CreditCard className="w-4 h-4 text-primary-600" />, color: 'primary', label: 'Processing' },
    };
    return configs[status.toLowerCase()] || configs.draft;
  };

  const quickActions = [
    { href: '/send', icon: CreditCard, label: 'Send Money', desc: 'Pay contacts or scan QR' },
    { href: '/scan', icon: QrCode, label: 'Scan to Pay', desc: 'Scan Guardian Pay QR codes' },
    { href: '/contacts', icon: Users, label: 'Contacts', desc: 'Manage saved recipients' },
    { href: '/history', icon: History, label: 'History', desc: 'View your transactions' },
  ];

  const headActions = isHead ? [
    { href: '/dashboard', icon: ShieldCheck, label: 'Family Dashboard', desc: 'Monitor all family payments' },
    { href: '/members', icon: Users, label: 'Member Limits', desc: 'Set spending limits' },
    { href: '/notifications', icon: Bell, label: 'Notifications', desc: 'Review pending approvals' },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Welcome Header */}
      <div className="px-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isHead ? 'Family Guardian' : `Welcome, ${activeMember?.name}`}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isHead
                ? `Monitoring ${allMembers.length - 1} family members${heldCount > 0 ? ` • ${heldCount} pending` : ''}`
                : `Your Guardian protection is active`
              }
            </p>
          </div>
          {isHead && heldCount > 0 && (
            <Link href="/notifications" className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
              <Bell className="w-4 h-4" />
              {heldCount} pending review
            </Link>
          )}
        </div>
      </div>

      {/* Protection Status Card */}
      <Card className="px-2 relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start lg:items-center gap-3 lg:gap-4 relative z-10">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 lg:w-7 lg:h-7 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">Guardian Protection Active</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                {isHead
                  ? 'All family payments are monitored by AI'
                  : `Your payments are protected by ${activeMember?.role === 'head' ? 'unlimited access' : 'Guardian AI'}`
                }
              </p>
              <Badge variant="tier" tier="auto" className="text-xs mt-2 lg:hidden">
                AI Secured
              </Badge>
            </div>
            <Badge variant="tier" tier="auto" className="text-xs hidden lg:inline-flex">
              AI Secured
            </Badge>
          </div>

          {/* Animated background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-100/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-100/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats for Head */}
      {isHead && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-2">
          <QuickStat label="Pending" value={heldCount} icon={<Clock className="w-5 h-5 text-warning-600" />} accent="amber" />
          <QuickStat label="Family" value={allMembers.length - 1} icon={<Users className="w-5 h-5 text-primary-600" />} accent="teal" />
          <QuickStat label="Protected" icon={<ShieldAlert className="w-5 h-5 text-success-600" />} accent="green" value="Active" />
          <QuickStat label="AI Status" icon={<Sparkles className="w-5 h-5 text-teal-600" />} accent="teal" value="Online" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <ActionButton
                icon={action.icon}
                label={action.label}
                desc={action.desc}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Head Actions */}
      {isHead && headActions.length > 0 && (
        <div className="px-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Head Controls</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {headActions.map((action) => (
              <Link key={action.href} href={action.href} className="group">
                <ActionButton
                  icon={action.icon}
                  label={action.label}
                  desc={action.desc}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="px-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            <Link href="/history">View All <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        ) : recentPayments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No recent payments</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/send">Make your first payment</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentPayments.map((payment) => (
              <ActivityItem
                key={payment.id}
                payment={payment}
                statusConfig={getStatusConfig(payment.status)}
                formatDate={formatDate}
                showMember={isHead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Guardian Info for Non-Head */}
      {!isHead && (
        <Card className="px-2">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Your Protection Limits</h3>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <Badge variant="tier" tier="auto" className="text-xs">
                    Auto ≤ ${activeMember?.auto_limit}
                  </Badge>
                  <Badge variant="tier" tier="notify" className="text-xs">
                    Notify ${activeMember?.auto_limit}–${activeMember?.notify_limit}
                  </Badge>
                  <Badge variant="tier" tier="approval" className="text-xs">
                    {'Approval > $' + (activeMember?.notify_limit || 0)}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Guardian AI reviews every payment. Suspicious activity is held for family head review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickStat({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: 'teal' | 'green' | 'amber' | 'green' }) {
  const colorClasses = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={cn('p-3 rounded-2xl border', colorClasses[accent])}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className="p-1.5 rounded-lg bg-white/50">{icon}</div>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, desc }: { icon: React.ElementType; label: string; desc: string }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-200 transition-all duration-200 text-center group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 bg-teal-100 text-teal-600">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

function ActivityItem({ payment, statusConfig, formatDate, showMember }: {
  payment: PaymentRow;
  statusConfig: { icon: React.ReactNode; color: string; label: string };
  formatDate: (dateStr: string) => string;
  showMember: boolean;
}) {
  return (
    <Card className="border-slate-200 hover:border-slate-300 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-100">
            {statusConfig.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-slate-900 truncate">{payment.recipient_label}</p>
              <span className={cn('font-bold',
                payment.status === 'VOIDED' || payment.status === 'FAILED' ? 'text-danger-600' : 'text-slate-900'
              )}>
                ${payment.amount.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {showMember && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {payment.member_name}
                </span>
              )}
              <Badge variant="status" status={payment.status.toLowerCase() as any} className="text-xs">
                {statusConfig.label}
              </Badge>
              <Badge variant="tier" tier={payment.tier.toLowerCase() as any} className="text-xs">
                {payment.tier.toUpperCase()}
              </Badge>
            </div>

            <p className="text-xs text-slate-500 mt-1">{formatDate(payment.created_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}