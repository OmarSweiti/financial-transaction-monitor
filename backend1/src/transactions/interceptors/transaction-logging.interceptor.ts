import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class TransactionLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('TransactionsHTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = httpCtx.getResponse<Response>();
        const duration = Date.now() - start;
        this.logger.log(`${method} ${url} → ${response.statusCode} (${duration}ms)`);
      }),
    );
  }
}
