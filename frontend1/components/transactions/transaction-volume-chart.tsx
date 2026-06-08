'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  TransactionStatus,
  TRANSACTION_STATUS_LABELS,
  type Transaction,
} from '@/lib/types';

// ─── Exchange Rates for USD Normalisation ───────────────────────────
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  CHF: 1.12,
  CAD: 0.73,
  AUD: 0.66,
  JPY: 0.0064,
};

function convertToUsd(amountStr: string, currency: string): number {
  const amount = parseFloat(amountStr);
  if (isNaN(amount)) return 0;
  const rate = EXCHANGE_RATES[currency.toUpperCase()] ?? 1.0;
  return amount * rate;
}

// ─── Chart Gradients ────────────────────────────────────────────────
// Defined as ID keys matching the SVG <defs> linearGradients below
const GRADIENT_IDS: Record<TransactionStatus, string> = {
  [TransactionStatus.COMPLETED]: 'url(#gradient-completed)',
  [TransactionStatus.PENDING]: 'url(#gradient-pending)',
  [TransactionStatus.REJECTED]: 'url(#gradient-rejected)',
  [TransactionStatus.PENDING_REVIEW]: 'url(#gradient-pending-review)',
};

// ─── Aggregation ───────────────────────────────────────────────────

interface ChartDataPoint {
  status: string;
  statusKey: TransactionStatus;
  volume: number; // USD sum
  count: number;  // Record count
}

function aggregateData(transactions: Transaction[]): ChartDataPoint[] {
  const map: Record<TransactionStatus, { volume: number; count: number }> = {
    [TransactionStatus.PENDING]: { volume: 0, count: 0 },
    [TransactionStatus.COMPLETED]: { volume: 0, count: 0 },
    [TransactionStatus.REJECTED]: { volume: 0, count: 0 },
    [TransactionStatus.PENDING_REVIEW]: { volume: 0, count: 0 },
  };

  for (const tx of transactions) {
    const usdValue = convertToUsd(tx.amount, tx.currency);
    if (tx.status in map) {
      map[tx.status].volume += usdValue;
      map[tx.status].count += 1;
    }
  }

  return Object.entries(map).map(([key, data]) => ({
    status: TRANSACTION_STATUS_LABELS[key as TransactionStatus],
    statusKey: key as TransactionStatus,
    volume: Math.round(data.volume * 100) / 100, // Round decimal noise
    count: data.count,
  }));
}

// ─── Formatters ────────────────────────────────────────────────────

function formatVolume(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatTooltipVolume(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── Custom Tooltip ────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  mode: 'volume' | 'count';
}

function CustomTooltip({ active, payload, mode }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload as ChartDataPoint;
  const isVolume = mode === 'volume';

  return (
    <div className="rounded-xl border bg-popover/90 backdrop-blur-md p-3 text-sm shadow-xl ring-1 ring-black/5 dark:ring-white/5">
      <p className="font-semibold text-foreground">{item.status}</p>
      <p className="mt-1 text-muted-foreground">
        {isVolume ? (
          <>
            Total Volume:{' '}
            <span className="font-bold text-foreground">{formatTooltipVolume(item.volume)}</span>
          </>
        ) : (
          <>
            Transaction Count:{' '}
            <span className="font-bold text-foreground">{item.count} {item.count === 1 ? 'record' : 'records'}</span>
          </>
        )}
      </p>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────

interface TransactionVolumeChartProps {
  transactions: Transaction[];
}

export function TransactionVolumeChart({ transactions }: TransactionVolumeChartProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'volume' | 'count'>('volume');

  // Defer rendering until client-mount to prevent Next.js SSR hydration warnings
  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => aggregateData(transactions), [transactions]);
  const hasData = chartData.some((d) => (mode === 'volume' ? d.volume : d.count) > 0);

  if (!mounted) {
    return (
      <Card className="border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-44" />
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card/40 backdrop-blur-sm shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6">
        <div>
          <CardTitle className="text-lg font-bold text-foreground">Analytics Summary</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === 'volume' ? 'Total transaction amount (USD equivalent) grouped by status' : 'Total number of transactions logged per status'}
          </p>
        </div>
        
        {/* Toggle Mode buttons */}
        <div className="flex rounded-xl bg-muted/60 p-1 self-start sm:self-auto border shadow-inner">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('volume')}
            className={`rounded-lg px-3 text-xs font-semibold transition-all ${
              mode === 'volume' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            By Volume ($)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('count')}
            className={`rounded-lg px-3 text-xs font-semibold transition-all ${
              mode === 'count' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            By Count (#)
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground border border-dashed rounded-xl bg-muted/10">
            No transaction records available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
            >
              {/* Define linear gradient vectors for status fills */}
              <defs>
                <linearGradient id="gradient-completed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradient-pending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradient-rejected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradient-pending-review" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                className="stroke-muted/40" 
              />
              <XAxis
                dataKey="status"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fontWeight: 500 }}
                className="fill-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={mode === 'volume' ? formatVolume : (val) => String(val)}
                tick={{ fontSize: 11, fontWeight: 500 }}
                className="fill-muted-foreground"
                width={50}
              />
              <Tooltip
                content={<CustomTooltip mode={mode} />}
                cursor={{ fill: 'color-mix(in srgb, var(--muted) 15%, transparent)', radius: 6 }}
              />
              <Bar
                dataKey={mode === 'volume' ? 'volume' : 'count'}
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.statusKey}
                    fill={GRADIENT_IDS[entry.statusKey]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
