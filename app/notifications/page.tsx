'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMember } from '@/components/MemberContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { Shield, Bell, Mail, CheckCircle2, ShieldAlert, Clock, AlertTriangle, Download } from 'lucide-react';

interface NotificationItem {
  id: string;
  created_at: string;
  kind: 'notify' | 'approval_needed' | 'blocked' | 'expired';
  payment_id: string;
  read: number;
  amount: number;
  recipient_label: string;
  payment_status: string;
  tier: string;
  member_name: string;
}

export default function NotificationsPage() {
  const { activeMember, refreshUnreadCount } = useMember();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      await fetchNotifications();
      refreshUnreadCount();
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark as read');
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
                Only the head of family (Dad) can view the notification inbox. You are currently viewing as <strong>{activeMember.name}</strong>.
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

  const getNotificationConfig = (kind: NotificationItem['kind']) => {
    switch (kind) {
      case 'approval_needed':
        return { label: 'APPROVAL NEEDED', variant: 'tier' as const, tier: 'approval' as const, icon: <AlertTriangle size={16} className="text-red-600" aria-hidden="true" />, alertClass: 'bg-red-50 border-red-200' };
      case 'blocked':
        return { label: 'PAYMENT BLOCKED', variant: 'status' as const, status: 'voided' as const, icon: <ShieldAlert size={16} className="text-red-600" aria-hidden="true" />, alertClass: 'bg-red-50 border-red-200' };
      case 'expired':
        return { label: 'EXPIRED HOLD', variant: 'status' as const, status: 'expired' as const, icon: <Clock size={16} className="text-amber-600" aria-hidden="true" />, alertClass: 'bg-amber-50 border-amber-200' };
      case 'notify':
      default:
        return { label: 'NOTIFICATION', variant: 'tier' as const, tier: 'notify' as const, icon: <Bell size={16} className="text-amber-600" aria-hidden="true" />, alertClass: 'bg-amber-50 border-amber-200' };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div>
            <div className="flex items-center gap-2 text-slate-900 mb-1">
              <Bell size={24} className="text-blue-600" aria-hidden="true" />
              <CardTitle className="text-xl">Head of Family Inbox</CardTitle>
            </div>
            <CardDescription>Payment notifications, approval alerts, and scam warnings.</CardDescription>
          </div>
          <Button
            variant="secondary"
            onClick={handleMarkAllRead}
            disabled={notifications.every((n) => n.read === 1)}
            className="whitespace-nowrap"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            Mark All as Read
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-100 rounded-lg p-4 h-20" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bell size={48} className="mx-auto text-slate-300 mb-3" aria-hidden="true" />
              <p className="text-lg font-medium text-slate-900">No notifications yet</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const isUnread = n.read === 0;
                const config = getNotificationConfig(n.kind);

                return (
                  <Link
                    key={n.id}
                    href={`/review/${n.payment_id}`}
                    className={`
                      flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors
                      ${isUnread ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {config.icon}
                        <Badge variant={config.variant} {...(config.variant === 'tier' ? { tier: config.tier } : { status: config.status })} />
                        {isUnread && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">NEW</span>
                        )}
                      </div>
                      <p className="font-medium text-slate-900 truncate">
                        {n.member_name} requested ${n.amount.toFixed(2)} to {n.recipient_label}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {new Date(n.created_at).toLocaleString()} • Status: {n.payment_status}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Download size={18} className="text-slate-400" aria-hidden="true" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}