import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: any; // Type as any to prevent strict type check mismatch across pg versions

  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }

    const isDevelopment = configService.get<string>('NODE_ENV') === 'development';

    // ── Configure connection pool settings for production-grade scale ──
    const pool = new Pool({
      connectionString,
      max: configService.get<number>('DB_POOL_MAX', 10),         // Cap connections to prevent exhausting PG limits
      idleTimeoutMillis: configService.get<number>('DB_IDLE_TIMEOUT', 30000), // Close idle connections after 30s
      connectionTimeoutMillis: configService.get<number>('DB_CONN_TIMEOUT', 5000), // Return timeout error if pool is full (5s)
    });
    const adapter = new PrismaPg(pool);

    // Pass adapter and logging preferences to the Prisma Client
    super({
      adapter,
      log: isDevelopment
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    let retries = 5;
    const retryDelayMs = 3000;

    // ── Resilient Database Startup retry loop ──
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to the PostgreSQL database.');

        // Wire query logging events to the NestJS Logger only in development
        if (this.configService.get<string>('NODE_ENV') === 'development') {
          // @ts-ignore - dynamic event listeners typing in Prisma Client
          this.$on('query', (e: any) => {
            this.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
          });
        }
        return;
      } catch (error) {
        retries--;
        this.logger.warn(
          `Failed to connect to PostgreSQL. Retrying in ${retryDelayMs / 1000}s... (${retries} retries left)`,
        );
        
        if (retries === 0) {
          this.logger.error('PostgreSQL database connection retry exhausted. Exiting application.', error);
          throw error;
        }
        
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Initiating graceful shutdown for PostgreSQL client...');
      await this.$disconnect();
      await this.pool.end();
      this.logger.log('PostgreSQL database connections successfully closed.');
    } catch (error) {
      this.logger.error('Error occurred while disconnecting from the PostgreSQL database.', error);
    }
  }
}
