import React from 'react';
import { CheckCircle, Clock, Lock, Pause, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'revoked' | 'expired' | 'frozen' | 'suspended';
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  active: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: 'Active',
  },
  revoked: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: 'Revoked',
  },
  expired: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-400',
    icon: <Clock className="w-3.5 h-3.5" />,
    label: 'Expired',
  },
  frozen: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: <Lock className="w-3.5 h-3.5" />,
    label: 'Frozen',
  },
  suspended: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: <Pause className="w-3.5 h-3.5" />,
    label: 'Suspended',
  },
};

/**
 * Renders a status badge for a certificate
 * Displays the certificate status with appropriate color, icon, and label
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.active;

  return (
    <span
      className={`text-xs ${config.bg} ${config.text} px-2 py-1 rounded-full font-medium flex items-center gap-1.5 w-fit ${className}`}
      role="status"
      aria-label={`Certificate status: ${config.label}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

/**
 * Utility function to check if a certificate status is active (revocable)
 */
export const isRevocableStatus = (status: string): boolean => {
  return status === 'active';
};

/**
 * Utility function to get a user-friendly message for why a certificate cannot be revoked
 */
export const getRevocationBlockedMessage = (status: string): string => {
  switch (status) {
    case 'revoked':
      return 'This certificate has already been revoked.';
    case 'expired':
      return 'Cannot revoke an expired certificate.';
    case 'frozen':
      return 'Cannot revoke a frozen certificate. Please unfreeze it first.';
    case 'suspended':
      return 'Cannot revoke a suspended certificate. Please reinstate it first.';
    default:
      return 'Cannot revoke this certificate.';
  }
};

export default StatusBadge;
