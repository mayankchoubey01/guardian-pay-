'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ className, label, hint, error, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-900 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border rounded-lg',
          'transition-colors duration-150',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          !error && 'border-slate-300 hover:border-slate-400',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export function Textarea({ className, label, hint, error, id, ...props }: Omit<InputProps, 'type'> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-semibold text-slate-900 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border rounded-lg resize-y min-h-[100px]',
          'transition-colors duration-150',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          !error && 'border-slate-300 hover:border-slate-400',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">{error}</p>
      )}
      {hint && !error && (
        <p id={`${textareaId}-hint`} className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label className={cn('block text-sm font-semibold text-slate-900 mb-1.5', className)} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
    </label>
  );
}