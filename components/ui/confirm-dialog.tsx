'use client';

import React from 'react';
import { AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './alert-dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  onOpenChange,
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} destructive={destructive} disabled={loading}>
              {loading ? 'Working…' : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
}