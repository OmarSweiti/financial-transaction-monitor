'use client';

import { Badge } from '@/components/ui/badge';
import { TransactionStatus, TRANSACTION_STATUS_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Status → visual mapping.
 *
 * Each status gets a tailored color scheme that works in both light
 * and dark mode. We use custom Tailwind classes instead of Badge
 * variants because the shadcn variants (default, secondary, destructive)
 * don't have enough granularity for 4 distinct financial states.
 */
const STATUS_STYLES: Record<TransactionStatus, string> = {
  [TransactionStatus.COMPLETED]:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  [TransactionStatus.PENDING]:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  [TransactionStatus.REJECTED]:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400',
  [TransactionStatus.PENDING_REVIEW]:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400',
};

interface StatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_STYLES[status], className)}
    >
      {TRANSACTION_STATUS_LABELS[status]}
    </Badge>
  );
}
