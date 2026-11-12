'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export function Separator({ className, orientation = 'horizontal', decorative = true, ...props }: SeparatorProps) {
  return (
    <div
      className={cn(
        'shrink-0 bg-slate-200',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'w-[1px] h-full',
        className
      )}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      {...props}
    />
  );
}