'use client';

import React from 'react';
import { Badge } from './badge';
import { CheckCircle2, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';

type RiskLevel = 'low' | 'medium' | 'high' | 'uncertain';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  className?: string;
  showLabel?: boolean;
}

function getRiskIcon(level: RiskLevel) {
  switch (level) {
    case 'low': return <CheckCircle2 size={12} aria-hidden="true" />;
    case 'medium': return <AlertTriangle size={12} aria-hidden="true" />;
    case 'high': return <ShieldAlert size={12} aria-hidden="true" />;
    case 'uncertain': return <HelpCircle size={12} aria-hidden="true" />;
  }
}

function getRiskLabel(level: RiskLevel) {
  switch (level) {
    case 'low': return 'Low risk';
    case 'medium': return 'Medium risk';
    case 'high': return 'High risk';
    case 'uncertain': return 'Uncertain';
  }
}

export function RiskBadge({ level, score, className, showLabel = true }: RiskBadgeProps) {
  return (
    <Badge
      variant="risk"
      level={level}
      score={score}
      className={className}
      icon={getRiskIcon(level)}
    >
      {showLabel && getRiskLabel(level)}
    </Badge>
  );
}