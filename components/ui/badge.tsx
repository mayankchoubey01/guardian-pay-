'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, ShieldAlert, HelpCircle, Info } from 'lucide-react';

type RiskLevel = 'low' | 'medium' | 'high' | 'uncertain';
type Status = 'captured' | 'held' | 'voided' | 'order_created' | 'expired' | 'payer_canceled' | 'failed';
type Tier = 'auto' | 'notify' | 'approval';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'risk' | 'status' | 'tier' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
  level?: RiskLevel;
  status?: Status;
  tier?: Tier;
  score?: number;
  icon?: React.ReactNode;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; icon: React.ElementType; classes: string }> = {
  low: { label: 'Low risk', icon: CheckCircle2, classes: 'bg-primary-100 text-primary-700 border border-primary-200' },
  medium: { label: 'Medium risk', icon: AlertTriangle, classes: 'bg-primary-100 text-primary-700 border border-primary-200' },
  high: { label: 'High risk', icon: ShieldAlert, classes: 'bg-primary-100 text-primary-700 border border-primary-200' },
  uncertain: { label: 'Uncertain', icon: HelpCircle, classes: 'bg-slate-100 text-slate-800 border border-slate-200' },
};

const STATUS_CONFIG: Record<Status, { label: string; classes: string }> = {
  captured: { label: 'Sent', classes: 'bg-success-100 text-success-700 border border-success-200' },
  held: { label: 'Held', classes: 'bg-warning-100 text-warning-700 border border-warning-200' },
  voided: { label: 'Blocked', classes: 'bg-danger-100 text-danger-700 border border-danger-200' },
  order_created: { label: 'Pending', classes: 'bg-primary-100 text-primary-700 border border-primary-200' },
  expired: { label: 'Expired', classes: 'bg-slate-100 text-slate-800 border border-slate-200' },
  payer_canceled: { label: 'Canceled', classes: 'bg-slate-100 text-slate-800 border border-slate-200' },
  failed: { label: 'Failed', classes: 'bg-danger-100 text-danger-700 border border-danger-200' },
};

const TIER_CONFIG: Record<Tier, { label: string; classes: string }> = {
  auto: { label: 'AUTO', classes: 'bg-primary-100 text-primary-700 border border-primary-200' },
  notify: { label: 'NOTIFY', classes: 'bg-primary-100 text-primary-700 border border-primary-200' },
  approval: { label: 'APPROVAL', classes: 'bg-primary-100 text-primary-700 border border-primary-200' },
};

const VARIANT_CLASSES: Record<string, string> = {
  secondary: 'bg-slate-100 text-slate-800 border border-slate-200',
  outline: 'bg-transparent text-slate-700 border border-slate-300',
  success: 'bg-success-100 text-success-700 border border-success-200',
  warning: 'bg-warning-100 text-warning-700 border border-warning-200',
  destructive: 'bg-danger-100 text-danger-700 border border-danger-200',
};

export function Badge({ className, variant = 'default', level, status, tier, score, icon, children, ...props }: BadgeProps) {
  let config: { label: string; icon?: React.ElementType; classes: string } | null = null;
  let displayIcon = icon;
  let displayLabel = children;

  if (variant === 'risk' && level) {
    config = RISK_CONFIG[level];
    displayLabel = children || config.label;
    displayIcon = icon || (config.icon ? <config.icon size={12} aria-hidden="true" /> : null);
  } else if (variant === 'status' && status) {
    config = STATUS_CONFIG[status];
    displayLabel = children || config.label;
  } else if (variant === 'tier' && tier) {
    config = TIER_CONFIG[tier];
    displayLabel = children || config.label;
  } else if (VARIANT_CLASSES[variant]) {
    config = { label: children as string, classes: VARIANT_CLASSES[variant] };
  } else {
    config = { label: children as string, classes: 'bg-slate-100 text-slate-700 border border-slate-200' };
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border',
        config?.classes,
        className
      )}
      aria-label={variant === 'risk' && level ? `Risk level: ${config?.label}${score !== undefined ? `, score ${score}` : ''}` : undefined}
      {...props}
    >
      {displayIcon}
      {displayLabel}
      {variant === 'risk' && score !== undefined && (
        <span className="opacity-70 font-normal">({score}/100)</span>
      )}
    </span>
  );
}