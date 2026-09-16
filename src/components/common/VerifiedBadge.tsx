import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true
}) => {
  if (status !== 'verified') {
    return null; // Do not display badge for pending, under_review, rejected, suspended
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-teal-50 text-teal-700 border border-teal-200 ${textSizes[size]}`}
      title="Medical council registration reviewed and verified by platform administrator"
    >
      <ShieldCheck className={`${iconSizes[size]} text-teal-600`} />
      {showLabel && <span>Verified Doctor</span>}
    </span>
  );
};
