'use client';

import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </AlertDialogPrimitive.Root>
  );
}

export function AlertDialogTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return <AlertDialogPrimitive.Trigger {...props}>{children}</AlertDialogPrimitive.Trigger>;
}

export function AlertDialogPortal({ children }: { children: React.ReactNode }) {
  return <AlertDialogPrimitive.Portal>{children}</AlertDialogPrimitive.Portal>;
}

export function AlertDialogOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn('fixed inset-0 bg-black/40 z-40 animate-in fade-in-0', className)}
      {...props}
    />
  );
}

export function AlertDialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <AlertDialogPrimitive.Content
      className={cn(
        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg',
        'bg-white rounded-lg shadow-lg border border-slate-200 p-6',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      {...props}
    />
  );
}

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-center', className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <AlertDialogPrimitive.Title className={cn('text-lg font-semibold text-slate-900 mb-2', className)} {...props} />
  );
}

export function AlertDialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <AlertDialogPrimitive.Description className={cn('text-sm text-slate-600 mb-6', className)} {...props} />
  );
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex gap-3 justify-end', className)} {...props} />;
}

export function AlertDialogCancel({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
        'focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-colors',
        className
      )}
      {...props}
    />
  );
}

export function AlertDialogAction({ className, destructive = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { destructive?: boolean }) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(
        'px-4 py-2 text-sm font-semibold rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 transition-colors',
        destructive
          ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600'
          : 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600',
        className
      )}
      {...props}
    />
  );
}