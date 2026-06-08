'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './status-badge';
import { TransactionEmptyState } from './transaction-empty-state';
import { TransactionDialog } from './transaction-dialog';
import type { Transaction, PaginationMeta } from '@/lib/types';
import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Format a transaction decimal string using Intl.NumberFormat.
 * Handles sub-cent precisions (up to 4 decimal places) safely.
 */
function formatAmount(amount: string, currency: string): string {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return amount;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(numericAmount);
  } catch {
    // Fallback for custom or crypto currency formats
    return `${numericAmount.toFixed(4)} ${currency}`;
  }
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
}

// ─── Types ─────────────────────────────────────────────────────────

interface TransactionTableProps {
  transactions: Transaction[];
  meta: PaginationMeta;
  isLoading: boolean;
  hasFilters: boolean;
  onPageChange: (page: number) => void;
}

// ─── Loading Skeleton Rows ──────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="py-4">
            <Skeleton className="h-4 w-48 max-w-full" />
          </TableCell>
          <TableCell className="text-right py-4">
            <Skeleton className="ml-auto h-4 w-20" />
          </TableCell>
          <TableCell className="hidden sm:table-cell py-4">
            <Skeleton className="h-4 w-12" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-5 w-24" />
          </TableCell>
          <TableCell className="hidden md:table-cell py-4">
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell className="text-right py-4">
            <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Pagination Controls ───────────────────────────────────────────

interface PaginationControlsProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

function PaginationControls({ meta, onPageChange }: PaginationControlsProps) {
  const { page, totalPages, total } = meta;

  if (totalPages <= 1) return null;

  return (
    <div 
      className="flex items-center justify-between border-t px-4 py-3 bg-muted/20"
      aria-label="Table pagination navigation"
    >
      <p className="text-xs sm:text-sm text-muted-foreground">
        Showing Page <span className="font-semibold text-foreground">{page}</span> of{' '}
        <span className="font-semibold text-foreground">{totalPages}</span> ({total} transactions)
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Go to previous page"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export function TransactionTable({
  transactions,
  meta,
  isLoading,
  hasFilters,
  onPageChange,
}: TransactionTableProps) {
  const showEmpty = !isLoading && transactions.length === 0;

  return (
    <div className="w-full">
      <div className="relative overflow-x-auto rounded-t-2xl">
        <Table aria-label="Transactions Log Table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%] min-w-[180px]">Description</TableHead>
              <TableHead className="text-right w-[15%]">Amount</TableHead>
              <TableHead className="hidden sm:table-cell w-[10%]">Currency</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="hidden md:table-cell w-[15%]">Date</TableHead>
              <TableHead className="text-right w-[10%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody aria-busy={isLoading}>
            {isLoading ? (
              <TableSkeleton />
            ) : showEmpty ? (
              <TableRow>
                <TableCell colSpan={6} className="h-56">
                  <TransactionEmptyState hasFilters={hasFilters} />
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="max-w-[300px] truncate font-medium text-foreground py-3.5">
                    {tx.description}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-foreground py-3.5">
                    {formatAmount(tx.amount, tx.currency)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground py-3.5">
                    {tx.currency}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <StatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground py-3.5">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell className="text-right py-2 pr-4">
                    <TransactionDialog transaction={tx} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && !showEmpty && (
        <PaginationControls meta={meta} onPageChange={onPageChange} />
      )}
    </div>
  );
}
