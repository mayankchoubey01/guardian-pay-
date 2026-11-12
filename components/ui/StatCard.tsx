import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'blue' | 'green' | 'red' | 'amber' | 'default';
}

const ACCENT_CLASSES: Record<string, string> = {
  blue: 'border-l-4 border-l-blue-500',
  green: 'border-l-4 border-l-green-500',
  red: 'border-l-4 border-l-red-500',
  amber: 'border-l-4 border-l-amber-500',
  default: '',
};

export function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 p-5 flex flex-col gap-1 shadow-sm',
        ACCENT_CLASSES[accent]
      )}
    >
      <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

