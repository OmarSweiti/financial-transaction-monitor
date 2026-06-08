// ─── Transaction Status ────────────────────────────────────────────
// Mirrors the NestJS backend's TransactionStatus enum.
export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

/** Human-readable labels mapped to status for UI displays */
export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: 'Pending',
  [TransactionStatus.COMPLETED]: 'Completed',
  [TransactionStatus.REJECTED]: 'Rejected',
  [TransactionStatus.PENDING_REVIEW]: 'Pending Review',
};

// ─── Core Transaction Entity ───────────────────────────────────────
export interface Transaction {
  id: string;
  amount: string;                 // Note: PostgreSQL Decimal(18,4) serializes as a string in JSON payloads to prevent JS floating-point precision loss
  currency: string;               // ISO 4217 code
  date: string;                   // ISO 8601 timestamp
  description: string;
  status: TransactionStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;       // Soft delete support
}

// ─── API Response Formats ──────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsResponse {
  data: Transaction[];
  meta: PaginationMeta;
}

// ─── API Request Formats ───────────────────────────────────────────
export interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: TransactionStatus;
}

export interface CreateTransactionInput {
  amount: number;
  currency: string;
  date: string;
  description: string;
  status?: TransactionStatus;
}
