'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';

/**
 * Wraps the app in React Query's QueryClientProvider and Sonner's Toaster.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,  // 30s — avoids rapid re-fetches on filter changes
            retry: 1,             // Single retry on transient failures
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Toast provider to display visual alerts on transaction logging actions */}
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
