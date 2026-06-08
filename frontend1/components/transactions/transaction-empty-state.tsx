'use client';

interface TransactionEmptyStateProps {
  hasFilters: boolean;
}

/**
 * Empty state displayed when the transactions list is empty.
 *
 * Shows a different message depending on whether filters are active,
 * guiding the user toward the right next action.
 */
export function TransactionEmptyState({ hasFilters }: TransactionEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Icon area — simple SVG circle with a document icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
      <h3 className="mb-1 text-base font-medium text-foreground">
        No transactions found
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
          : 'Transactions will appear here once they are created.'}
      </p>
    </div>
  );
}
