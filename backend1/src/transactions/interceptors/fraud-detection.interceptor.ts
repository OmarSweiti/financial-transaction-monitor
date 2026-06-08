import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { TransactionStatus } from '../enums/index.js';
import type { CreateTransactionDto } from '../dto/index.js';

@Injectable()
export class FraudDetectionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FraudDetectionInterceptor.name);
  private readonly FRAUD_THRESHOLD = 5000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as CreateTransactionDto;

    if (body && body.amount) {
      // Coerce amount safely since interceptor executes before ValidationPipe
      const numericAmount = typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount;
      
      if (!isNaN(numericAmount) && numericAmount > this.FRAUD_THRESHOLD) {
        const originalStatus = body.status;
        body.status = TransactionStatus.PENDING_REVIEW;
        this.logger.warn(
          `High-value transaction flagged for review: amount=${numericAmount} ${body.currency || 'USD'}. ` +
          `Status overridden: "${originalStatus || 'PENDING'}" → "${TransactionStatus.PENDING_REVIEW}"`
        );
      }
    }

    return next.handle();
  }
}
