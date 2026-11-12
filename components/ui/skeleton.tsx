'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 rounded-lg',
        'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%]',
        'animate-[shimmer_1.5s_ease-in-out_infinite]',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full max-w-[80%]" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4', className)} {...props}>
      <Skeleton className="h-6 w-1/4" />
      <SkeletonText lines={3} />
      <Skeleton className="h-10 w-1/3" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 6, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { columns?: number }) {
  return (
    <div className={cn('grid gap-4', className)} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} {...props}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}