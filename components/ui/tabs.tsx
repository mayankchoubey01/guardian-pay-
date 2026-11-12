'use client';

import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {}

export function Tabs({ className, ...props }: TabsProps) {
  return <TabsPrimitive.Root className={cn('', className)} {...props} />;
}

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500',
        className
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {}

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm',
        className
      )}
      {...props}
    />
  );
}

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'mt-4 ring-0 focus-visible:ring-2 focus-visible:ring-blue-500',
        'animate-in fade-in-0 zoom-in-95 data-[state=active]:animate-in data-[state=inactive]:animate-out',
        className
      )}
      {...props}
    />
  );
}