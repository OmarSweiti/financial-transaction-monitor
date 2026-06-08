import { IsEnum, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus } from '../enums/index.js';

export class CreateTransactionDto {
  /**
   * Transaction amount.
   *
   * ── Validation:
   * - `@IsNumber` with `maxDecimalPlaces: 4` matches the database schema scale
   *   and rejects strings/nested objects before coercion.
   * - `@IsPositive` enforces amount > 0, preventing negative or zero-value transactions.
   * - `@Type` converts string inputs (from JSON/forms) to number before validation.
   */
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'amount must be a number with at most 4 decimal places' })
  @IsPositive({ message: 'amount must be strictly greater than 0' })
  @Type(() => Number)
  amount: number;

  /**
   * ISO 4217 standard currency code (e.g. USD, EUR, GBP).
   *
   * ── Validation:
   * - `@Matches(/^[A-Z]{3}$/)` verifies that the input matches standard 3-letter uppercase 
   *   ISO 4217 formats.
   */
  @IsString({ message: 'currency must be a string' })
  @IsNotEmpty({ message: 'currency is required' })
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a valid 3-letter ISO 4217 currency code (e.g., USD, EUR)',
  })
  currency: string;

  /**
   * Date the transaction occurred.
   *
   * ── Validation:
   * - `@IsISO8601` ensures strict formatting compliance (YYYY-MM-DD or full UTC timestamp).
   */
  @IsISO8601({ strict: true }, { message: 'date must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'date is required' })
  date: string;

  /**
   * Human-readable description of the transaction.
   *
   * ── Validation:
   * - `@Length(1, 500)` ensures descriptions are not empty and stay within
   *   database schema constraints (db.VarChar(500)), preventing truncation errors.
   */
  @IsString({ message: 'description must be a string' })
  @Length(1, 500, { message: 'description must be between 1 and 500 characters' })
  description: string;

  /**
   * Transaction status.
   *
   * ── Validation:
   * - `@IsEnum` maps exactly to the database enum levels, rejecting arbitrary strings.
   * - `@IsOptional` allows the client to omit the status, defaulting to PENDING.
   */
  @IsOptional()
  @IsEnum(TransactionStatus, {
    message: `status must be one of: ${Object.values(TransactionStatus).join(', ')}`,
  })
  status?: TransactionStatus = TransactionStatus.PENDING;
}
