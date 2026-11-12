'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'paypal_hold', label: 'PayPal Hold' },
  { key: 'safety_check', label: 'Safety Check' },
  { key: 'decision', label: 'Decision' },
  { key: 'sent', label: 'Sent' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

function statusToStep(status: string): StepKey {
  switch (status) {
    case 'ORDER_CREATED': return 'submitted';
    case 'HELD': return 'decision';
    case 'CAPTURED': return 'sent';
    case 'VOIDED': return 'decision';
    case 'EXPIRED': return 'decision';
    case 'PAYER_CANCELED': return 'submitted';
    case 'FAILED': return 'submitted';
    default: return 'submitted';
  }
}

function isComplete(status: string, stepKey: StepKey): boolean {
  const order: StepKey[] = ['submitted', 'paypal_hold', 'safety_check', 'decision', 'sent'];
  const current = statusToStep(status);
  return order.indexOf(stepKey) < order.indexOf(current);
}

function isCurrent(status: string, stepKey: StepKey): boolean {
  return statusToStep(status) === stepKey;
}

interface StepTrackerProps {
  status: string;
  statusMessage?: string;
  className?: string;
}

export function StepTracker({ status, statusMessage, className }: StepTrackerProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <ol className="flex items-center w-full" aria-label="Payment progress" role="list">
        {STEPS.map((step, idx) => {
          const done = isComplete(status, step.key);
          const current = isCurrent(status, step.key);
          return (
            <li
              key={step.key}
              className={cn('flex items-center', idx < STEPS.length - 1 && 'flex-1')}
              aria-current={current ? 'step' : undefined}
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                    done
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : current
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-slate-300 text-slate-400'
                  )}
                  aria-label={done ? `Step ${idx + 1} completed` : current ? `Step ${idx + 1} current` : `Step ${idx + 1} pending`}
                >
                  {done ? <Check size={16} aria-hidden="true" /> : idx + 1}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block text-center w-24',
                    done || current ? 'text-blue-700' : 'text-slate-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn('flex-1 h-1 mx-1', done ? 'bg-blue-500' : 'bg-slate-200')}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {statusMessage && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="text-sm text-slate-600 text-center"
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}