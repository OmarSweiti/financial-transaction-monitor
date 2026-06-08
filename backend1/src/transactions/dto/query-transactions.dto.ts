import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus } from '../enums/index.js';

export class QueryTransactionsDto {
  /**
   * Page number for offset-based pagination.
   *
   * ── Validation:
   * - `@Type(() => Number)`: Express query strings are parsed as strings. We explicitly 
   *   cast this to a number before run-time validation.
   * - `@IsInt`: Page number must be a round integer.
   * - `@Min(1)`: Prevents offset errors (cannot have a page < 1).
   * - Default value: `1` ensures paginated responses if the client leaves it out.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page: number = 1;

  /**
   * Number of items returned per query.
   *
   * ── Validation:
   * - `@IsInt` / `@Min(1)`: Limits must be positive integers.
   * - `@Max(100)`: Restricts page limit ceiling to prevent Denial of Service vectors 
   *   (e.g., a client requesting 1,000,000 items in a single call).
   * - Default value: `20` offers a solid compromise for table sizes.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit: number = 20;

  /**
   * Optional search keyword targeting the transaction description.
   */
  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;

  /**
   * Optional filter targeting the transaction status.
   *
   * ── Validation:
   * - `@IsEnum`: Client can only filter by verified transaction statuses.
   */
  @IsOptional()
  @IsEnum(TransactionStatus, {
    message: `status must be one of: ${Object.values(TransactionStatus).join(', ')}`,
  })
  status?: TransactionStatus;
}
