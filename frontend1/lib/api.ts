import axios, { AxiosError } from 'axios';
import type {
  Transaction,
  TransactionsResponse,
  TransactionFilters,
  CreateTransactionInput,
} from './types';

// ─── Custom Application API Error Class ─────────────────────────────
export class ApiError extends Error {
  public status: number;
  public validationErrors?: string[];

  constructor(message: string, status: number, validationErrors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

// ─── Environment Validation ─────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_API_URL. ' +
    'Copy .env.example to .env.local and configure it before starting the app.'
  );
}

// ─── Axios Instance Setup ───────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10-second timeout limit
});

// ─── Global Error Interceptor ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string | string[]; error?: string }>) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Standardize NestJS ValidationPipe errors (400 Bad Request returns validation array)
      const rawMessage = data?.message;
      const validationErrors = Array.isArray(rawMessage) ? rawMessage : undefined;
      const displayMessage = Array.isArray(rawMessage)
        ? 'Validation failed. Please check your inputs.'
        : rawMessage || data?.error || 'An error occurred on the server.';

      return Promise.reject(new ApiError(displayMessage, status, validationErrors));
    }

    if (error.request) {
      // Request was made but no response was received (network failure)
      return Promise.reject(
        new ApiError('Network connection failure. Make sure the API server is online.', 0)
      );
    }

    return Promise.reject(new ApiError(error.message || 'An unexpected error occurred.', 500));
  }
);

// ─── Transaction Endpoint Services ──────────────────────────────────
export const transactionApi = {
  /**
   * Fetch paginated list of transactions with optional search and status parameters.
   */
  async getTransactions(filters: TransactionFilters = {}): Promise<TransactionsResponse> {
    const { data } = await api.get<TransactionsResponse>('/transactions', {
      params: {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined, // Strip empty strings to prevent query noise
        status: filters.status || undefined,
      },
    });
    return data;
  },

  /**
   * Post a new transaction to the backend.
   */
  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const { data } = await api.post<Transaction>('/transactions', input);
    return data;
  },

  /**
   * Fetch a single transaction by its unique UUID ID.
   */
  async getTransaction(id: string): Promise<Transaction> {
    const { data } = await api.get<Transaction>(`/transactions/${id}`);
    return data;
  },

  /**
   * Update an existing transaction by ID.
   */
  async updateTransaction(id: string, input: Partial<CreateTransactionInput>): Promise<Transaction> {
    const { data } = await api.patch<Transaction>(`/transactions/${id}`, input);
    return data;
  },
};

export default api;
