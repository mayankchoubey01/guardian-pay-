'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
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
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-600 border border-transparent',
    secondary: 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-300 focus-visible:outline-primary-600',
    success: 'bg-success-600 text-white hover:bg-success-700 focus-visible:outline-success-600 border border-transparent',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus-visible:outline-danger-600 border border-transparent',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus-visible:outline-warning-600 border border-transparent',
    ghost: 'text-slate-900 hover:bg-slate-100 focus-visible:outline-primary-600 border border-transparent',
    outline: 'border border-slate-300 bg-transparent hover:bg-slate-50 focus-visible:outline-primary-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2.5 rounded-full',
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