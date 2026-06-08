import { IsEnum, IsISO8601, IsNumber, IsOptional, IsPositive, IsString, Length, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus } from '../enums/index.js';

export class UpdateTransactionDto {
  /**
   * Optional transaction amount to update.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'amount must be a number with at most 4 decimal places' })
  @IsPositive({ message: 'amount must be strictly greater than 0' })
  @Type(() => Number)
  amount?: number;

  /**
   * Optional currency code.
   */
  @IsOptional()
  @IsString({ message: 'currency must be a string' })
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a valid 3-letter ISO 4217 currency code (e.g., USD, EUR)',
  })
  currency?: string;

  /**
   * Optional transaction date.
   */
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'date must be a valid ISO 8601 date string' })
  date?: string;

  /**
   * Optional description.
   */
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @Length(1, 500, { message: 'description must be between 1 and 500 characters' })
  description?: string;

  /**
   * Optional status.
   */
  @IsOptional()
  @IsEnum(TransactionStatus, {
    message: `status must be one of: ${Object.values(TransactionStatus).join(', ')}`,
  })
  status?: TransactionStatus;
}
