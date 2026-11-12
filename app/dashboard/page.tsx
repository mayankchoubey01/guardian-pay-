'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMember } from '@/components/MemberContext';
import { AllCommunityModule, ModuleRegistry, ColDef, RowClickedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton, SkeletonCard, SkeletonTableRow } from '@/components/ui/skeleton';
import { Select, SelectItem } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import {
  Plus, Filter, Search, RefreshCw, Brain, AlertTriangle, Shield,
  ShieldAlert, DollarSign, Clock, Download, CreditCard, Users,
  BarChart3, TrendingUp, ShieldCheck
} from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);

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

export default function DashboardPage() {
  const router = useRouter();
  const { activeMember, allMembers } = useMember();
  const gridRef = useRef<any>(null);

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');

  // Weekly AI Summary state
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [summaryDate, setSummaryDate] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
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

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/summary');
      if (res.ok) {
        const data = await res.json();
        setWeeklySummary(data.summary);
        setSummaryDate(data.created_at);
      }
    } catch {
      // Keep silent
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await fetch('/api/summary', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setWeeklySummary(data.summary);
        setSummaryDate(data.created_at);
        toast.success('Weekly summary generated');
      } else {
        toast.error('Failed to generate summary');
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
      toast.error('Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchSummary();
    const interval = setInterval(fetchPayments, 5000);
    return () => clearInterval(interval);
  }, []);

  // Metrics calculations
  const metrics = useMemo(() => {
    const heldNow = payments.filter((p) => p.status === 'HELD').length;
    const blockedCount = payments.filter((p) => p.status === 'VOIDED').length;
    const protectedAmount = payments
      .filter((p) => p.status === 'VOIDED')
      .reduce((sum, p) => sum + p.amount, 0);

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const spentThisWeek = payments
      .filter((p) => p.status === 'CAPTURED' && new Date(p.created_at).getTime() >= sevenDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const spentThisMonth = payments
      .filter((p) => p.status === 'CAPTURED' && new Date(p.created_at).getTime() >= thirtyDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    const totalCaptured = payments.filter((p) => p.status === 'CAPTURED').length;
    const avgAmount = totalCaptured > 0
      ? payments.filter((p) => p.status === 'CAPTURED').reduce((sum, p) => sum + p.amount, 0) / totalCaptured
      : 0;

    return {
      heldNow,
      blockedCount,
      protectedAmount: protectedAmount.toFixed(2),
      spentThisWeek: spentThisWeek.toFixed(2),
      spentThisMonth: spentThisMonth.toFixed(2),
      totalTransactions: payments.length,
      capturedCount: totalCaptured,
      avgAmount: avgAmount.toFixed(2),
    };
  }, [payments]);

  // Filtered rows by member
  const filteredRows = useMemo(() => {
    let result = payments;

    if (selectedMember !== 'ALL') {
      result = result.filter((p) => p.member_id.toLowerCase() === selectedMember.toLowerCase());
    }

    if (selectedStatus !== 'ALL') {
      result = result.filter((p) => p.status === selectedStatus);
    }

    if (selectedTier !== 'ALL') {
      result = result.filter((p) => p.tier.toUpperCase() === selectedTier);
    }

    return result;
  }, [payments, selectedMember, selectedStatus, selectedTier]);

  // Column definitions for AG Grid
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Member',
        field: 'member_name',
        filter: true,
        sortable: true,
        width: 130,
        cellRenderer: (params: any) => {
          const member = allMembers.find(m => m.name === params.value);
          const color = member ? getRoleColor(member.role) : '#6366f1';
          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
                {params.value?.charAt(0)}
              </div>
              <strong className="text-sm">{params.value}</strong>
            </div>
          );
        },
      },
      {
        headerName: 'Recipient',
        field: 'recipient_label',
        filter: true,
        sortable: true,
        flex: 1,
        minWidth: 180,
        cellRenderer: (params: any) => (
          <div className="font-medium text-slate-900">{params.value}</div>
        ),
      },
      {
        headerName: 'Amount',
        field: 'amount',
        sortable: true,
        width: 120,
        cellRenderer: (params: any) => (
          <span className="font-semibold text-slate-900">${Number(params.value).toFixed(2)}</span>
        ),
      },
      {
        headerName: 'Risk',
        field: 'risk_level',
        sortable: true,
        width: 110,
        cellRenderer: (params: any) => {
          const val = (params.value || 'low').toLowerCase();
          return (
            <Badge variant="risk" level={val as any} score={params.data?.risk_score} className="text-xs" />
          );
        },
      },
      {
        headerName: 'Tier',
        field: 'tier',
        sortable: true,
        width: 100,
        cellRenderer: (params: any) => {
          const val = params.value;
          return <Badge variant="tier" tier={val.toLowerCase() as any} className="text-xs" />;
        },
      },
      {
        headerName: 'Status',
        field: 'status',
        sortable: true,
        width: 130,
        cellRenderer: (params: any) => {
          const status = params.value;
          return <Badge variant="status" status={status.toLowerCase() as any} className="text-xs" />;
        },
      },
      {
        headerName: 'Decided By',
        field: 'decided_by',
        width: 130,
        valueFormatter: (params) => params.value || 'Pending',
        cellRenderer: (params: any) => (
          <span className="text-sm text-slate-600">{params.value || 'Pending'}</span>
        ),
      },
      {
        headerName: 'Date',
        field: 'created_at',
        sortable: true,
        width: 150,
        valueFormatter: (params) => params.value ? formatDate(params.value) : '',
      },
    ],
    [allMembers]
  );

  const onRowClicked = (event: RowClickedEvent) => {
    if (event.data?.id) {
      router.push(`/review/${event.data.id}`);
    }
  };

  // Enforce head-only access
  if (activeMember && activeMember.role !== 'head') {
    return (
      <div className="max-w-md mx-auto space-y-4 pb-8 px-2">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 mx-auto text-amber-500 mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Head of Family Only</h2>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <p className="text-sm text-amber-800">
                The Family Dashboard is only accessible to the head of family (Dad). You are currently viewing as <strong>{activeMember.name}</strong>.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Please use the <strong>"Viewing as"</strong> switcher at the top to switch to Dad.
              </p>
            </div>
            <Button asChild className="mt-6 w-full sm:w-auto">
              <Link href="/send">Go to Send Money</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Family Financial Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Real-time monitoring of all family payment activities and protective holds.
          </p>
        </div>
        <Button asChild>
          <Link href="/send" className="flex items-center gap-2">
            <Plus size={18} aria-hidden="true" />
            Send Money
          </Link>
        </Button>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Held Now"
          value={metrics.heldNow}
          icon={<Clock size={20} />}
          color="amber"
          trend="+2 today"
        />
        <MetricCard
          label="Blocked Risks"
          value={metrics.blockedCount}
          icon={<ShieldAlert size={20} />}
          color="red"
          trend={`$${metrics.protectedAmount} protected`}
        />
        <MetricCard
          label="This Week"
          value={`$${metrics.spentThisWeek}`}
          icon={<CreditCard size={20} />}
          color="blue"
          trend={`${metrics.capturedCount} transactions`}
        />
        <MetricCard
          label="This Month"
          value={`$${metrics.spentThisMonth}`}
          icon={<TrendingUp size={20} />}
          color="green"
          trend={`Avg $${metrics.avgAmount}`}
        />
      </div>

      {/* Member Breakdown */}
      <div className="grid gap-3 sm:grid-cols-2">
        {allMembers.filter(m => m.role !== 'head').map((member) => {
          const memberPayments = payments.filter(p => p.member_id === member.id);
          const captured = memberPayments.filter(p => p.status === 'CAPTURED');
          const held = memberPayments.filter(p => p.status === 'HELD');
          const voided = memberPayments.filter(p => p.status === 'VOIDED');
          const spent = captured.reduce((sum, p) => sum + p.amount, 0);
          const protectedAmt = voided.reduce((sum, p) => sum + p.amount, 0);

          return (
            <MemberCard
              key={member.id}
              member={member}
              stats={{
                transactions: memberPayments.length,
                spent: spent.toFixed(2),
                pending: held.length,
                blocked: voided.length,
                protected: protectedAmt.toFixed(2),
              }}
            />
          );
        })}
      </div>

      {/* Weekly AI Summary Box */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div>
            <div className="flex items-center gap-2 text-purple-900 mb-1">
              <Brain size={20} aria-hidden="true" />
              <CardTitle className="text-xl">Guardian AI Weekly Intelligence Report</CardTitle>
            </div>
            {summaryDate && (
              <p className="text-sm text-purple-600">
                Generated on {new Date(summaryDate).toLocaleString()}
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={handleGenerateSummary}
            disabled={generatingSummary}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {generatingSummary ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Synthesizing 7-day logs...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" aria-hidden="true" />
                Generate New Summary
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-purple-900">
            {weeklySummary ||
              'No weekly summary generated yet. Click "Generate New Summary" to have Guardian AI analyze all transactions across the family.'}
          </p>
        </CardContent>
      </Card>

      {/* AG Grid Table Container */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-xl">All Family Transactions</CardTitle>
            <p className="text-slate-600 mt-1 text-sm">
              Click any row to open the full decision and risk analysis page. Total: {payments.length} payments
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Quick search payments..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  value={quickFilter}
                  onChange={(e) => setQuickFilter(e.target.value)}
                  aria-label="Quick search payments"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterSelect
                  value={selectedMember}
                  onChange={setSelectedMember}
                  options={[
                    { value: 'ALL', label: 'All Members' },
                    ...allMembers.filter(m => m.role !== 'head').map(m => ({ value: m.id, label: m.name })),
                  ]}
                  placeholder="All Members"
                  icon={<Users className="w-4 h-4" />}
                />
                <FilterSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[
                    { value: 'ALL', label: 'All Status' },
                    { value: 'CAPTURED', label: 'Completed' },
                    { value: 'HELD', label: 'Pending' },
                    { value: 'VOIDED', label: 'Blocked' },
                    { value: 'FAILED', label: 'Failed' },
                    { value: 'ORDER_CREATED', label: 'Processing' },
                  ]}
                  placeholder="All Status"
                  icon={<Filter className="w-4 h-4" />}
                />
                <FilterSelect
                  value={selectedTier}
                  onChange={setSelectedTier}
                  options={[
                    { value: 'ALL', label: 'All Tiers' },
                    { value: 'AUTO', label: 'Auto' },
                    { value: 'NOTIFY', label: 'Notify' },
                    { value: 'APPROVAL', label: 'Approval' },
                  ]}
                  placeholder="All Tiers"
                  icon={<ShieldCheck className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 550, width: '100%' }}>
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={8} />
                ))}
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                No payments found. Try adjusting your filters or search.
              </div>
            ) : (
              <AgGridReact
                ref={gridRef}
                rowData={filteredRows}
                columnDefs={columnDefs}
                quickFilterText={quickFilter}
                onRowClicked={onRowClicked}
                pagination={true}
                paginationPageSize={15}
                rowSelection="single"
                animateRows={true}
                theme="legacy"
                className="ag-theme-quartz"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, icon, color, trend }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className={cn('p-4 rounded-2xl border', colorClasses[color as keyof typeof colorClasses] || colorClasses.blue)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className="p-2 rounded-xl bg-white/50">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
    </div>
  );
}

function MemberCard({ member, stats }: {
  member: { id: string; name: string; role: string; auto_limit: number; notify_limit: number };
  stats: { transactions: number; spent: string; pending: number; blocked: number; protected: string };
}) {
  const roleColor = getRoleColor(member.role);

  return (
    <Card className="border-slate-200 hover:border-slate-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: roleColor }}>
            {member.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{member.name}</p>
            <p className="text-xs text-slate-500 capitalize">{member.role}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Auto / Notify</p>
            <p className="font-medium text-sm">${member.auto_limit} / ${member.notify_limit}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.transactions}</p>
            <p className="text-xs text-slate-500">Total Txns</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-2xl font-bold text-green-600">${stats.spent}</p>
            <p className="text-xs text-slate-500">Spent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">{stats.blocked}</p>
            <p className="text-xs text-slate-500">Blocked</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-xl font-bold text-green-600">${stats.protected}</p>
            <p className="text-xs text-slate-500">Protected</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600">{((stats.transactions - stats.pending - stats.blocked) || 0)}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({ value, onChange, options, placeholder, icon }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full appearance-none py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white',
          icon ? 'pl-10 pr-8' : 'pl-3 pr-8'
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function formatDate(dateStr: string) {
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
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'head': return '#3b82f6';
    case 'adult': return '#22c55e';
    case 'teen': return '#f59e0b';
    case 'child': return '#ef4444';
    case 'elder': return '#8b5cf6';
    default: return '#6366f1';
  }
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}