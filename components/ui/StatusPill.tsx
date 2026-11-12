import React from 'react';
import { cn } from '@/lib/utils';

type Status =
  | 'ORDER_CREATED'
  | 'HELD'
  | 'CAPTURED'
  | 'VOIDED'
  | 'EXPIRED'
  | 'PAYER_CANCELED'
  | 'FAILED'
  | string;

interface StatusPillProps {
  status: Status;
  className?: string;
}

function getStyles(status: Status) {
  switch (status) {
    case 'CAPTURED':
      return 'bg-green-50 text-green-800 border border-green-200';
    case 'HELD':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'VOIDED':
      return 'bg-red-50 text-red-800 border border-red-200';
    case 'ORDER_CREATED':
      return 'bg-blue-50 text-blue-800 border border-blue-200';
    case 'EXPIRED':
    case 'PAYER_CANCELED':
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    case 'FAILED':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

function getLabel(status: Status) {
  switch (status) {
    case 'ORDER_CREATED': return 'Pending';
    case 'HELD': return 'Held';
    case 'CAPTURED': return 'Sent';
    case 'VOIDED': return 'Blocked';
    case 'EXPIRED': return 'Expired';
    case 'PAYER_CANCELED': return 'Canceled';
    case 'FAILED': return 'Failed';
    default: return status;
  }
}

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        getStyles(status),
        className
      )}
    >
      {getLabel(status)}
    </span>
  );
}

