'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  children: React.ReactNode;
}

export function Select({ 
  className, 
  label, 
  hint, 
  error, 
  placeholder, 
  value, 
  onChange, 
  disabled,
  children,
  'aria-label': ariaLabel,
  ...props 
}: SelectProps) {
  const selectId = React.useId();
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-slate-900 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full appearance-none px-3.5 py-2.5 pr-10 text-sm font-normal text-slate-900 bg-white border rounded-lg',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500',
            !error && 'border-slate-300 hover:border-slate-400',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          aria-label={ariaLabel}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;
            const childProps = child.props as { value?: string };
            return React.cloneElement(child as React.ReactElement<any>, {
              key: childProps.value,
            });
          })}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </div>
      {error && (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SelectItem({ value, children, disabled }: SelectItemProps) {
  return <option value={value} disabled={disabled}>{children}</option>;
}