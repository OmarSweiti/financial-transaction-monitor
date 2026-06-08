import dotenv from 'dotenv';
import path from 'path';

// Load env variables using process.cwd() to support both ESM and CommonJS runtimes
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient, TransactionStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;

/**
 * Prisma seed script — populates the database with 20 realistic
 * sample transactions for development, testing, and UI demonstration.
 *
 * Key features:
 * - **Idempotent**: Clears existing data safely before insertion.
 * - **Compliance**: Adheres to CreateTransactionDto structure and Transaction db constraints.
 * - **Auditability**: Contains mixed statuses, standard currencies, and high-value transactions (>5,000).
 */

const SEED_TRANSACTIONS = [
  // ── High-value transactions (amount > 5000) ── triggers review overrides
  {
    amount: 12500.00,
    currency: 'USD',
    date: new Date('2026-05-01T09:15:00Z'),
    description: 'Commercial property lease deposit — Q3 2026',
    status: TransactionStatus.PENDING_REVIEW,
  },
  {
    amount: 8750.50,
    currency: 'EUR',
    date: new Date('2026-05-03T14:30:00Z'),
    description: 'Bulk server hardware procurement — Frankfurt DC',
    status: TransactionStatus.PENDING_REVIEW,
  },
  {
    amount: 24000.00,
    currency: 'GBP',
    date: new Date('2026-05-05T11:00:00Z'),
    description: 'Annual enterprise software license renewal — Salesforce',
    status: TransactionStatus.COMPLETED,
  },
  {
    amount: 6200.00,
    currency: 'USD',
    date: new Date('2026-05-07T16:45:00Z'),
    description: 'Employee relocation reimbursement — NYC to Austin',
    status: TransactionStatus.PENDING_REVIEW,
  },
  {
    amount: 15000.00,
    currency: 'CHF',
    date: new Date('2026-05-10T08:20:00Z'),
    description: 'Cross-border consulting fee — Zurich advisory engagement',
    status: TransactionStatus.PENDING,
  },
  {
    amount: 9999.99,
    currency: 'CAD',
    date: new Date('2026-05-12T13:10:00Z'),
    description: 'Marketing campaign budget — Canadian market expansion',
    status: TransactionStatus.PENDING_REVIEW,
  },

  // ── Medium-value transactions ──
  {
    amount: 3200.00,
    currency: 'USD',
    date: new Date('2026-05-14T10:00:00Z'),
    description: 'Monthly cloud infrastructure — AWS us-east-1',
    status: TransactionStatus.COMPLETED,
  },
  {
    amount: 1850.75,
    currency: 'EUR',
    date: new Date('2026-05-15T09:30:00Z'),
    description: 'Office supplies and ergonomic furniture — Berlin HQ',
    status: TransactionStatus.COMPLETED,
  },
  {
    amount: 4500.00,
    currency: 'GBP',
    date: new Date('2026-05-16T15:20:00Z'),
    description: 'Quarterly security audit — penetration testing engagement',
    status: TransactionStatus.PENDING,
  },
  {
    amount: 2100.00,
    currency: 'USD',
    date: new Date('2026-05-17T12:00:00Z'),
    description: 'Team offsite venue booking — Portland retreat',
    status: TransactionStatus.COMPLETED,
  },
  {
    amount: 3750.00,
    currency: 'JPY',
    date: new Date('2026-05-18T07:45:00Z'),
    description: 'Translation services — product documentation localization',
    status: TransactionStatus.REJECTED,
  },
  {
    amount: 980.00,
    currency: 'AUD',
    date: new Date('2026-05-19T11:30:00Z'),
    description: 'Domain renewals and SSL certificates — annual batch',
    status: TransactionStatus.COMPLETED,
  },

  // ── Small-value transactions ──
  {
    amount: 149.99,
    currency: 'USD',
    date: new Date('2026-05-20T08:15:00Z'),
    description: 'SaaS subscription — Figma professional plan',
    status: TransactionStatus.COMPLETED,
  },
  {
    amount: 320.00,
    currency: 'EUR',
    date: new Date('2026-05-21T14:00:00Z'),
    description: 'Conference registration — React Summit Amsterdam',
    status: TransactionStatus.PENDING,
  },
  {
    amount: 75.50,
    currency: 'USD',
    date: new Date('2026-05-22T16:30:00Z'),
    description: 'Business lunch — client onboarding meeting',
    status: TransactionStatus.COMPLETED,
  },
  {
    amount: 499.00,
    currency: 'GBP',
    date: new Date('2026-05-23T10:45:00Z'),
    description: 'Online training — Advanced TypeScript masterclass',
    status: TransactionStatus.COMPLETED,
  },
  {
    amount: 210.00,
    currency: 'USD',
    date: new Date('2026-05-24T09:00:00Z'),
    description: 'Ride-share expenses — week of 2026-05-18',
    status: TransactionStatus.REJECTED,
  },
  {
    amount: 45.00,
    currency: 'CAD',
    date: new Date('2026-05-25T13:20:00Z'),
    description: 'Postage and courier fees — contract documents',
    status: TransactionStatus.COMPLETED,
  },
  {
    amount: 1200.00,
    currency: 'USD',
    date: new Date('2026-05-26T11:10:00Z'),
    description: 'Legal review — vendor contract amendment',
    status: TransactionStatus.PENDING,
  },
  {
    amount: 650.00,
    currency: 'EUR',
    date: new Date('2026-05-27T15:50:00Z'),
    description: 'Photography services — product catalog shoot',
    status: TransactionStatus.COMPLETED,
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  // Set up connection pool adapter matching Prisma 7 requirements
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🧹 Clearing existing transactions...');
    const { count } = await prisma.transaction.deleteMany();
    console.log(`   Deleted ${count} existing records.`);

    console.log('🌱 Seeding 20 sample transactions...');
    const created = await prisma.transaction.createMany({
      data: SEED_TRANSACTIONS,
    });
    console.log(`   Successfully created ${created.count} transactions.`);

    // ── Output seed audit count groupings ──
    const statusCounts = await prisma.transaction.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    
    console.log('\n📊 Seed summary:');
    for (const group of statusCounts) {
      console.log(`   ${group.status}: ${group._count.status}`);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Database seeding failed:', error);
  process.exit(1);
});
