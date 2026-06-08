'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TransactionStatus, TRANSACTION_STATUS_LABELS, type Transaction } from '@/lib/types';
import { transactionApi } from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Loading03Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';

interface TransactionDialogProps {
  transaction?: Transaction;
}

// ─── Zod Schema for DTO Matching Validation ─────────────────────────
const createSchema = z.object({
  amount: z
    .number({ message: 'Amount must be a number' })
    .positive('Amount must be strictly greater than 0')
    .refine(
      (val) => {
        const decimals = val.toString().split('.')[1]?.length ?? 0;
        return decimals <= 4;
      },
      { message: 'Amount can have at most 4 decimal places' }
    ),
  currency: z
    .string()
    .length(3, 'Currency must be a valid 3-letter ISO code')
    .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters'),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date' }),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description cannot exceed 500 characters'),
  status: z.nativeEnum(TransactionStatus),
});

type FormInput = z.infer<typeof createSchema>;

export function TransactionDialog({ transaction }: TransactionDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEditMode = !!transaction;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      amount: transaction ? parseFloat(transaction.amount) : undefined,
      currency: transaction ? transaction.currency : 'USD',
      date: transaction ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0], // YYYY-MM-DD
      description: transaction ? transaction.description : '',
      status: transaction ? transaction.status : TransactionStatus.PENDING,
    },
  });

  const selectedCurrency = watch('currency');
  const selectedStatus = watch('status');

  // ─── Mutation Query ────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (input: FormInput) => {
      if (isEditMode && transaction) {
        return transactionApi.updateTransaction(transaction.id, input);
      } else {
        return transactionApi.createTransaction(input);
      }
    },
    onSuccess: (data) => {
      // Invalidate query to trigger react-query update
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Close modal & reset form
      setIsOpen(false);
      reset();

      // Core evaluation point: trigger alerts if the backend interceptor modified status
      if (data.status === TransactionStatus.PENDING_REVIEW) {
        toast.warning(
          `High-value transaction ${isEditMode ? 'updated' : 'logged'} ($${data.amount}). It has been flagged as "Pending Review" by the fraud interceptor!`,
          { duration: 6000 }
        );
      } else {
        toast.success(`Transaction ${isEditMode ? 'updated' : 'logged'} successfully!`);
      }
    },
    onError: (error: any) => {
      // Display NestJS validation exception details if available
      const errMsg = error.validationErrors
        ? error.validationErrors.join(' | ')
        : error.message || `Failed to ${isEditMode ? 'update' : 'create'} transaction.`;
      toast.error(errMsg);
    },
  });

  const onSubmit = (data: FormInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        reset();
      } else if (isEditMode && transaction) {
        reset({
          amount: parseFloat(transaction.amount),
          currency: transaction.currency,
          date: transaction.date.split('T')[0],
          description: transaction.description,
          status: transaction.status,
        });
      }
    }}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors animate-fade-in"
            aria-label="Edit transaction"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} className="size-4" />
          </Button>
        ) : (
          <Button className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98]">
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2.5} className="size-4" />
            <span>Log Transaction</span>
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] rounded-2xl border bg-background p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {isEditMode ? 'Edit Transaction' : 'Log Transaction'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Amount input */}
          <div className="space-y-1">
            <label htmlFor="amount" className="text-xs font-semibold text-muted-foreground">Amount</label>
            <Input
              id="amount"
              type="number"
              step="any"
              placeholder="0.00"
              {...register('amount', { valueAsNumber: true })}
              className={errors.amount ? 'border-red-500 focus-visible:ring-red-500' : ''}
              disabled={mutation.isPending}
            />
            {errors.amount && (
              <p className="text-xs text-red-500 mt-0.5">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Currency Select */}
            <div className="space-y-1">
              <label htmlFor="currency" className="text-xs font-semibold text-muted-foreground">Currency</label>
              <Select
                value={selectedCurrency}
                onValueChange={(val) => setValue('currency', val, { shouldValidate: true })}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="USD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CHF">CHF (₣)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-xs text-red-500 mt-0.5">{errors.currency.message}</p>
              )}
            </div>

            {/* Status Select */}
            <div className="space-y-1">
              <label htmlFor="status" className="text-xs font-semibold text-muted-foreground">Initial Status</label>
              <Select
                value={selectedStatus}
                onValueChange={(val) => setValue('status', val as TransactionStatus, { shouldValidate: true })}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pending" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TransactionStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {TRANSACTION_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-red-500 mt-0.5">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Date Input */}
          <div className="space-y-1">
            <label htmlFor="date" className="text-xs font-semibold text-muted-foreground">Transaction Date</label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={errors.date ? 'border-red-500 focus-visible:ring-red-500' : ''}
              disabled={mutation.isPending}
            />
            {errors.date && (
              <p className="text-xs text-red-500 mt-0.5">{errors.date.message}</p>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <label htmlFor="description" className="text-xs font-semibold text-muted-foreground">Description</label>
            <Input
              id="description"
              type="text"
              placeholder="e.g. AWS monthly subscription"
              {...register('description')}
              className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
              disabled={mutation.isPending}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-0.5">{errors.description.message}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="gap-2"
            >
              {mutation.isPending ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                  <span>{isEditMode ? 'Saving...' : 'Logging...'}</span>
                </>
              ) : (
                <span>{isEditMode ? 'Save Changes' : 'Submit'}</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
