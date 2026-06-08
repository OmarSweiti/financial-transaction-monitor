'use client';

import { useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { TransactionFilters } from '@/components/transactions/transaction-filters';
import { TransactionVolumeChart } from '@/components/transactions/transaction-volume-chart';
import { TransactionStats } from '@/components/transactions/transaction-stats';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';
import { TransactionStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ── URL-Driven Parameter Parsing ────────────────────────────────────
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const search = searchParams.get('search') ?? '';
  const statusString = searchParams.get('status');
  
  // Safe validation of status enum parameters to prevent URL pollution
  const status = Object.values(TransactionStatus).includes(statusString as TransactionStatus)
    ? (statusString as TransactionStatus)
    : undefined;

  // ── Query Hook Binding ──────────────────────────────────────────────
  const { data, isLoading, isError } = useTransactions({
    page,
    limit: 20,
    search: search || undefined,
    status,
  });

  const transactions = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 };

  // ── Unified URL Sync Handler ────────────────────────────────────────
  const updateQueryParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Always reset pagination index when search/status filters change
      if ('search' in updates || 'status' in updates) {
        params.set('page', '1');
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      updateQueryParams({ search: value });
    },
    [updateQueryParams]
  );

  const handleStatusChange = useCallback(
    (value: TransactionStatus | undefined) => {
      updateQueryParams({ status: value });
    },
    [updateQueryParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateQueryParams({ page: String(newPage) });
    },
    [updateQueryParams]
  );

  const hasFilters = !!search || !!status;

  return (
    <div className="flex flex-col flex-1 bg-background">
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Transaction Monitor
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor, filter, and audit your financial transaction ledger in real time.
            </p>
          </div>
          {/* Form Creation Trigger Modal */}
          <div className="self-start sm:self-auto">
            <TransactionDialog />
          </div>
        </div>

        {/* Dynamic Status Statistics Widgets */}
        <div className="mb-8">
          <TransactionStats transactions={transactions} isLoading={isLoading} />
        </div>

        {/* Error Notification Alert */}
        {isError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
            Failed to query transactions. Verify that your PostgreSQL database and NestJS backend are active at{' '}
            <code className="rounded bg-red-100 dark:bg-red-900 px-1 py-0.5 text-xs">
              {process.env.NEXT_PUBLIC_API_URL}
            </code>
          </div>
        )}

        {/* Search & Status Filters */}
        <div className="mb-6">
          <TransactionFilters
            search={search}
            status={status}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Dashboard Panels */}
        <div className="grid gap-8">
          {/* Main Transaction table */}
          <div className="rounded-2xl border bg-card/40 backdrop-blur-sm ring-1 ring-foreground/5 shadow-sm">
            <TransactionTable
              transactions={transactions}
              meta={meta}
              isLoading={isLoading}
              hasFilters={hasFilters}
              onPageChange={handlePageChange}
            />
          </div>

          {/* Aggregated Analytics volume chart */}
          <TransactionVolumeChart transactions={transactions} />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 bg-background">
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 animate-pulse">
              <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
              </div>
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>

            <Skeleton className="h-12 w-full max-w-md mb-6 rounded-xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </main>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
