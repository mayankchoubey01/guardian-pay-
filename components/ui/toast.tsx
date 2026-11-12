'use client';

import { Toaster as SonnerToaster, toast as sonnerToast, type ExternalToast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="light"
      toastOptions={{
        classNames: {
          toast: 'bg-white border border-slate-200 shadow-lg rounded-lg',
          description: 'text-slate-600',
          actionButton: 'bg-slate-100 hover:bg-slate-200 text-slate-900',
          cancelButton: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300',
          closeButton: 'text-slate-400 hover:text-slate-600',
        },
      }}
    />
  );
}

interface ToastOptionsExtended extends ExternalToast {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

export function toast(message: string, options?: ToastOptionsExtended) {
  const { variant, ...rest } = options || {};
  
  switch (variant) {
    case 'success':
      return sonnerToast.success(message, rest);
    case 'error':
      return sonnerToast.error(message, rest);
    case 'warning':
      return sonnerToast.warning(message, rest);
    case 'info':
      return sonnerToast.info(message, rest);
    default:
      return sonnerToast(message, rest);
  }
}

toast.success = (message: string, options?: ExternalToast) => sonnerToast.success(message, options);
toast.error = (message: string, options?: ExternalToast) => sonnerToast.error(message, options);
toast.warning = (message: string, options?: ExternalToast) => sonnerToast.warning(message, options);
toast.info = (message: string, options?: ExternalToast) => sonnerToast.info(message, options);
toast.loading = (message: string, options?: ExternalToast) => sonnerToast.loading(message, options);
toast.dismiss = (toastId?: string | number) => sonnerToast.dismiss(toastId);
toast.promise = <T,>(promise: Promise<T>, messages: { loading: string; success: string | ((data: T) => string); error: string | ((error: Error) => string) }) => 
  sonnerToast.promise(promise, messages);