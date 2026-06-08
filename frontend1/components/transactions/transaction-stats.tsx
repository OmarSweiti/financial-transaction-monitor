'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionStatus, type Transaction } from '@/lib/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Coins02Icon, 
  HourglassIcon, 
  CheckmarkCircle02Icon, 
  CancelCircleIcon 
} from '@hugeicons/core-free-icons';

// ─── Mock Exchange Rates for USD Normalisation ───────────────────────
// In a production application, these would be fetched from a live forex API.
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  CHF: 1.12,
  CAD: 0.73,
  AUD: 0.66,
  JPY: 0.0064,
};

function convertToUsd(amountStr: string, currency: string): number {
  const amount = parseFloat(amountStr);
  if (isNaN(amount)) return 0;
  
  const rate = EXCHANGE_RATES[currency.toUpperCase()] ?? 1.0;
  return amount * rate;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Props ─────────────────────────────────────────────────────────

interface TransactionStatsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

// ─── Skeletons ─────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="relative overflow-hidden border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-5 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-1 h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────

export function TransactionStats({ transactions, isLoading }: TransactionStatsProps) {
  const stats = useMemo(() => {
    let totalVolumeUsd = 0;
    let pendingReviewCount = 0;
    let approvedVolumeUsd = 0;
    let rejectedVolumeUsd = 0;

    for (const tx of transactions) {
      const usdValue = convertToUsd(tx.amount, tx.currency);

      totalVolumeUsd += usdValue;

      if (tx.status === TransactionStatus.PENDING_REVIEW) {
        pendingReviewCount += 1;
      } else if (tx.status === TransactionStatus.COMPLETED) {
        approvedVolumeUsd += usdValue;
      } else if (tx.status === TransactionStatus.REJECTED) {
        rejectedVolumeUsd += usdValue;
      }
    }

    return {
      totalVolumeUsd,
      pendingReviewCount,
      approvedVolumeUsd,
      rejectedVolumeUsd,
    };
  }, [transactions]);

  if (isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total volume */}
      <Card className="relative overflow-hidden border bg-card/60 transition-all hover:bg-card/90 hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Monitored</CardTitle>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HugeiconsIcon icon={Coins02Icon} strokeWidth={2} className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatUsd(stats.totalVolumeUsd)}</div>
          <p className="mt-1 text-xs text-muted-foreground">Normalized in USD equivalent</p>
        </CardContent>
      </Card>

      {/* Pending Reviews */}
      <Card className="relative overflow-hidden border bg-card/60 transition-all hover:bg-card/90 hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-400">
            <HugeiconsIcon icon={HourglassIcon} strokeWidth={2} className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.pendingReviewCount}{' '}
            <span className="text-sm font-medium text-muted-foreground">
              {stats.pendingReviewCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Requires manual intervention</p>
        </CardContent>
      </Card>

      {/* Approved Volume */}
      <Card className="relative overflow-hidden border bg-card/60 transition-all hover:bg-card/90 hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Approved Volume</CardTitle>
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatUsd(stats.approvedVolumeUsd)}</div>
          <p className="mt-1 text-xs text-muted-foreground">Settled completed funds</p>
        </CardContent>
      </Card>

      {/* Rejected Volume */}
      <Card className="relative overflow-hidden border bg-card/60 transition-all hover:bg-card/90 hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rejected Volume</CardTitle>
          <div className="flex size-8 items-center justify-center rounded-full bg-red-500/10 text-red-500 dark:bg-red-950/30 dark:text-red-400">
            <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatUsd(stats.rejectedVolumeUsd)}</div>
          <p className="mt-1 text-xs text-muted-foreground">Blocked / Failed transactions</p>
        </CardContent>
      </Card>
    </div>
  );
}
