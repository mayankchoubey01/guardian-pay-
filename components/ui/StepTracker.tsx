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
}

export function StepTracker({ status, statusMessage }: StepTrackerProps) {
  return (
    <div>
      {/* Step indicators */}
      <ol className="flex items-center w-full mb-4" aria-label="Payment progress">
        {STEPS.map((step, idx) => {
          const done = isComplete(status, step.key);
          const current = isCurrent(status, step.key);
          return (
            <li
              key={step.key}
              className={cn('flex items-center', idx < STEPS.length - 1 && 'flex-1')}
              aria-current={current ? 'step' : undefined}
            >
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                    done
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : current
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-slate-300 text-slate-400'
                  )}
                >
                  {done ? <Check size={14} aria-hidden /> : idx + 1}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:block',
                    done || current ? 'text-blue-700' : 'text-slate-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    done ? 'bg-blue-500' : 'bg-slate-200'
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Live region for screen readers */}
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

