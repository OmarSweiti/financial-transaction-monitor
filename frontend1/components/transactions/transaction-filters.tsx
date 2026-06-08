'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionStatus, TRANSACTION_STATUS_LABELS } from '@/lib/types';

// ─── Types ─────────────────────────────────────────────────────────

interface TransactionFiltersProps {
  search: string;
  status: TransactionStatus | undefined;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: TransactionStatus | undefined) => void;
}

// ─── Debounce Hook ─────────────────────────────────────────────────

/**
 * Inline debounce implementation.
 *
 * Why not a library (lodash.debounce, use-debounce)?
 * - Avoids adding a dependency for a 10-line hook.
 * - Keeps the debounce lifecycle tied to React's effect cleanup,
 *   which is safer than imperative `.cancel()` calls.
 *
 * Why debounce here instead of in the hook?
 * - The useTransactions hook receives *committed* values and maps
 *   them directly to query keys. Debouncing at the component level
 *   means React Query only sees stable values, preventing cache
 *   thrashing and unnecessary network requests.
 */
function useDebouncedCallback(
  callback: (value: string) => void,
  delay: number,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (value: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(value), delay);
  };
}

// ─── Constants ─────────────────────────────────────────────────────

const ALL_STATUSES_VALUE = '__all__';

const STATUS_OPTIONS = Object.values(TransactionStatus);

// ─── Component ─────────────────────────────────────────────────────

export function TransactionFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: TransactionFiltersProps) {
  // Local input state for immediate feedback; parent gets debounced value.
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebouncedCallback(onSearchChange, 300);

  const [prevSearch, setPrevSearch] = useState(search);

  // Sync local state if parent resets search externally
  if (search !== prevSearch) {
    setLocalSearch(search);
    setPrevSearch(search);
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSearch(value);
  };

  const handleStatusChange = (value: string) => {
    onStatusChange(value === ALL_STATUSES_VALUE ? undefined : (value as TransactionStatus));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search input */}
      <div className="relative flex-1 sm:max-w-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <Input
          id="transaction-search"
          type="text"
          placeholder="Search descriptions..."
          value={localSearch}
          onChange={handleSearchChange}
          className="pl-9"
          aria-label="Search transactions by description"
        />
      </div>

      {/* Status filter */}
      <Select
        value={status ?? ALL_STATUSES_VALUE}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger
          id="transaction-status-filter"
          className="w-full sm:w-[180px]"
          aria-label="Filter by status"
        >
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_STATUSES_VALUE}>All Statuses</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {TRANSACTION_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
