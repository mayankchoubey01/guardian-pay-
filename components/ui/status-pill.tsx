'use client';

import React from 'react';
import { Badge } from './badge';

type StatusKey = 'captured' | 'held' | 'voided' | 'order_created' | 'expired' | 'payer_canceled' | 'failed';

interface StatusPillProps {
  status: string;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  ORDER_CREATED: 'Pending',
  HELD: 'Held',
  CAPTURED: 'Sent',
  VOIDED: 'Blocked',
  EXPIRED: 'Expired',
  PAYER_CANCELED: 'Canceled',
  FAILED: 'Failed',
};

const STATUS_MAP: Record<string, StatusKey> = {
  ORDER_CREATED: 'order_created',
  HELD: 'held',
  CAPTURED: 'captured',
  VOIDED: 'voided',
  EXPIRED: 'expired',
  PAYER_CANCELED: 'payer_canceled',
  FAILED: 'failed',
};

export function StatusPill({ status, className }: StatusPillProps) {
  const normalizedStatus = STATUS_MAP[status] || 'order_created';
  const label = STATUS_LABELS[status] || status;

  return (
    <Badge variant="status" status={normalizedStatus} className={className}>
      {label}
    </Badge>
  );
}