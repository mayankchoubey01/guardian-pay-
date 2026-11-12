import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type RiskLevel = 'low' | 'medium' | 'high' | 'uncertain';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  className?: string;
}

const CONFIG: Record<RiskLevel, { label: string; icon: React.ElementType; classes: string }> = {
  low: {
    label: 'Low risk',
    icon: CheckCircle2,
    classes: 'bg-primary-100 text-primary-700 border border-primary-200',
  },
  medium: {
    label: 'Medium risk',
    icon: AlertTriangle,
    classes: 'bg-primary-100 text-primary-700 border border-primary-200',
  },
  high: {
    label: 'High risk',
    icon: ShieldAlert,
    classes: 'bg-primary-100 text-primary-700 border border-primary-200',
  },
  uncertain: {
    label: 'Uncertain',
    icon: HelpCircle,
    classes: 'bg-slate-100 text-slate-800 border border-slate-200',
  },
};

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  const cfg = CONFIG[level] ?? CONFIG.uncertain;
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold',
        cfg.classes,
        className
      )}
      aria-label={`Risk level: ${cfg.label}${score !== undefined ? `, score ${score}` : ''}`}
    >
      <Icon size={14} aria-hidden="true" />
      {cfg.label}
      {score !== undefined && (
        <span className="opacity-70 font-normal">({score}/100)</span>
      )}
    </span>
  );
}