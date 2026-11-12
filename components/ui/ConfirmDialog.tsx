'use client';

import React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-in fade-in-0" />
        <AlertDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'bg-white rounded-lg shadow-lg border border-slate-200 p-6 w-full max-w-sm'
          )}
        >
          <AlertDialog.Title className="text-lg font-semibold text-slate-900 mb-2">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-slate-600 mb-6">
            {description}
          </AlertDialog.Description>

          <div className="flex gap-3 justify-end">
            <AlertDialog.Cancel asChild>
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-colors"
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 transition-colors',
                  destructive
                    ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600'
                )}
              >
                {loading ? 'Working…' : confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

