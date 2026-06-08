import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { transactionApi } from '@/lib/api';
import type { TransactionFilters } from '@/lib/types';

/**
 * React Query hook for the paginated transactions list.
 *
 * Key design decisions:
 *
 * 1. Query key includes the full filters object. React Query deeply
 *    compares the key, so any filter/page change auto-triggers a
 *    refetch without manual invalidation.
 *
 * 2. `placeholderData: keepPreviousData` — keeps the old page visible
 *    while the next page loads. Without this, every pagination click
 *    would flash the loading skeleton, which feels janky.
 *
 * 3. The hook receives *committed* filter values (already debounced
 *    by the TransactionFilters component). This keeps the query cache
 *    clean — no intermediate "typing" states pollute it.
 */
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionApi.getTransactions(filters),
    placeholderData: keepPreviousData,
  });
}
