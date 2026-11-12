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
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { Plus, Filter, Search, RefreshCw, Brain, AlertTriangle, Shield, ShieldAlert, DollarSign, Clock, Download, CreditCard } from 'lucide-react';

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
  const { activeMember } = useMember();
  const gridRef = useRef<any>(null);

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState('ALL');

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
    const interval = setInterval(fetchPayments, 3000);
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

    return {
      heldNow,
      blockedCount,
      protectedAmount: protectedAmount.toFixed(2),
      spentThisWeek: spentThisWeek.toFixed(2),
    };
  }, [payments]);

  // Filtered rows by member
  const filteredRows = useMemo(() => {
    if (selectedMember === 'ALL') return payments;
    return payments.filter((p) => p.member_id.toLowerCase() === selectedMember.toLowerCase());
  }, [payments, selectedMember]);

  // Column definitions for AG Grid
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Member',
        field: 'member_name',
        filter: true,
        sortable: true,
        width: 140,
        cellRenderer: (params: any) => <strong>{params.value}</strong>,
      },
      {
        headerName: 'Recipient',
        field: 'recipient_label',
        filter: true,
        sortable: true,
        flex: 1,
        minWidth: 180,
      },
      {
        headerName: 'Amount',
        field: 'amount',
        sortable: true,
        width: 130,
        cellRenderer: (params: any) => (
          <span className="font-semibold">${Number(params.value).toFixed(2)} USD</span>
        ),
      },
      {
        headerName: 'Risk Level',
        field: 'risk_level',
        sortable: true,
        width: 150,
        cellRenderer: (params: any) => {
          const val = (params.value || 'low').toLowerCase();
          return (
            <Badge variant="risk" level={val as any} score={params.data?.risk_score} />
          );
        },
      },
      {
        headerName: 'Policy Tier',
        field: 'tier',
        sortable: true,
        width: 130,
        cellRenderer: (params: any) => {
          const val = params.value;
          return <Badge variant="tier" tier={val.toLowerCase() as any} />;
        },
      },
      {
        headerName: 'Status',
        field: 'status',
        sortable: true,
        width: 140,
        cellRenderer: (params: any) => {
          const status = params.value;
          return <Badge variant="status" status={status.toLowerCase() as any} />;
        },
      },
      {
        headerName: 'Decided By',
        field: 'decided_by',
        width: 160,
        valueFormatter: (params) => params.value || 'Pending',
      },
      {
        headerName: 'Created',
        field: 'created_at',
        sortable: true,
        width: 180,
        valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : ''),
      },
    ],
    []
  );

  const onRowClicked = (event: RowClickedEvent) => {
    if (event.data?.id) {
      router.push(`/review/${event.data.id}`);
    }
  };

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
                The Family Dashboard is only accessible to the head of family (Dad). You are currently viewing as <strong>{activeMember.name}</strong>.
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

  return (
    <div className="space-y-6">
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Held Now (Pending)"
          value={metrics.heldNow}
          accent="amber"
          icon={<Clock size={24} className="text-amber-500" aria-hidden="true" />}
        />
        <StatCard
          label="Blocked Scams/Risks"
          value={metrics.blockedCount}
          accent="red"
          icon={<ShieldAlert size={24} className="text-red-500" aria-hidden="true" />}
        />
        <StatCard
          label="Protected Amount"
          value={`$${metrics.protectedAmount}`}
          accent="green"
          icon={<DollarSign size={24} className="text-green-500" aria-hidden="true" />}
        />
        <StatCard
          label="Spent This Week"
          value={`$${metrics.spentThisWeek}`}
          accent="blue"
          icon={<CreditCard size={24} className="text-blue-500" aria-hidden="true" />}
        />
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
              Click any row to open the full decision and risk analysis page.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Quick search payments..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={quickFilter}
                  onChange={(e) => setQuickFilter(e.target.value)}
                  aria-label="Quick search payments"
                />
              </div>

              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                <Select
                  value={selectedMember}
                  onChange={setSelectedMember}
                  aria-label="Filter transactions by family member"
                  placeholder="All Members"
                >
                  <SelectItem value="ALL">All Members</SelectItem>
                  <SelectItem value="dad">Dad</SelectItem>
                  <SelectItem value="mom">Mom</SelectItem>
                  <SelectItem value="riya">Riya</SelectItem>
                  <SelectItem value="aarav">Aarav</SelectItem>
                  <SelectItem value="grandma">Grandma</SelectItem>
                </Select>
              </div>
            </div>
          </div>

          <div style={{ height: 520, width: '100%' }}>
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={8} />
                ))}
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
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
                paginationPageSize={10}
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