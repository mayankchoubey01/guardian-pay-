'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600 border border-transparent',
    secondary: 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-300 focus-visible:outline-blue-600',
    success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:outline-green-600 border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 border border-transparent',
    ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:outline-blue-600 border border-transparent',
    outline: 'border border-slate-300 bg-transparent hover:bg-slate-50 focus-visible:outline-blue-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  if (asChild) {
    return (
      <React.Fragment>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          const childProps = child.props as React.HTMLAttributes<HTMLElement>;
          return React.cloneElement(child as React.ReactElement<any>, {
            className: cn(baseStyles, variants[variant], sizes[size], childProps.className),
            disabled: loading || disabled,
            ...props,
          });
        })}
      </React.Fragment>
    );
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}