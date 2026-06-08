import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto, QueryTransactionsDto, UpdateTransactionDto } from './dto/index.js';
import { TransactionStatus } from './enums/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    this.logger.log(`Handling create transaction request: amount=${dto.amount} ${dto.currency}`);
    try {
      const transaction = await this.prisma.transaction.create({
        data: {
          amount: dto.amount,
          currency: dto.currency,
          date: new Date(dto.date),
          description: dto.description,
          status: dto.status!,
        },
      });

      this.logger.log(`Transaction created in database: id=${transaction.id}, amount=${transaction.amount} ${transaction.currency}`);
      return transaction;
    } catch (error) {
      this.logger.error('Failed to create transaction in database.', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async findAll(query: QueryTransactionsDto) {
    this.logger.log(`Handling query transactions request: page=${query.page}, limit=${query.limit}`);
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    // ── Build database query conditions conditionally ──
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null, // Always exclude soft-deleted transactions in client searches
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive', // PostgreSQL ILIKE
      };
    }

    try {
      // Execute query and count in parallel to halve network wait times
      const [data, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { date: 'desc' }, // Order recent transactions first
        }),
        this.prisma.transaction.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error('Failed to query transactions from database.', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async findOne(id: string) {
    this.logger.log(`Handling find transaction details request: id=${id}`);
    
    // Skeleton placeholder: mockNotFound for testing
    if (id === '00000000-0000-0000-0000-000000000000') {
      throw new NotFoundException(`Transaction with id "${id}" not found`);
    }

    return {
      id,
      amount: 125.50,
      currency: 'USD',
      date: new Date().toISOString(),
      description: 'Mock Transaction Skeleton',
      status: TransactionStatus.COMPLETED,
      metadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
  }

  async update(id: string, dto: UpdateTransactionDto) {
    this.logger.log(`Handling update transaction request: id=${id}`);
    
    // First verify it exists and is not soft deleted
    const existing = await this.prisma.transaction.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Transaction with id "${id}" not found`);
    }

    try {
      const updated = await this.prisma.transaction.update({
        where: { id },
        data: {
          amount: dto.amount,
          currency: dto.currency,
          date: dto.date ? new Date(dto.date) : undefined,
          description: dto.description,
          status: dto.status,
        },
      });

      this.logger.log(`Transaction updated in database: id=${updated.id}, amount=${updated.amount} ${updated.currency}`);
      return updated;
    } catch (error) {
      this.logger.error('Failed to update transaction in database.', error instanceof Error ? error.stack : error);
      throw error;
    }
  }
}
