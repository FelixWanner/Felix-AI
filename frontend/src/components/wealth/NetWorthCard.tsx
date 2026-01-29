import { useMemo } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useLatestSnapshot, useNetWorthHistory } from '@/hooks/useWealth'

// ─────────────────────────────────────────────────────────────
// Currency Formatter
// ─────────────────────────────────────────────────────────────

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatCompactCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M €`
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k €`
  }
  return formatCurrency(value)
}

// ─────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────

interface TooltipPayload {
  value: number
  payload: {
    date: string
    net_worth: number
    total_assets: number
    total_liabilities: number
  }
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {format(new Date(data.date), 'd. MMMM yyyy', { locale: de })}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Nettovermögen:</span>
          <span className="font-medium text-wealth dark:text-wealth-light">
            {formatCurrency(data.net_worth)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Assets:</span>
          <span className="text-gray-700 dark:text-gray-300">
            {formatCurrency(data.total_assets)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 dark:text-gray-400">Verbindlichkeiten:</span>
          <span className="text-gray-700 dark:text-gray-300">
            {formatCurrency(data.total_liabilities)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

interface NetWorthCardProps {
  days?: number
}

export default function NetWorthCard({ days = 30 }: NetWorthCardProps) {
  const { data: snapshot, isLoading: snapshotLoading } = useLatestSnapshot()
  const { data: history, isLoading: historyLoading } = useNetWorthHistory(days)

  // Calculate trend
  const trend = useMemo(() => {
    if (!history || history.length < 2) return null

    const first = history[0]
    const last = history[history.length - 1]
    const change = last.net_worth - first.net_worth
    const percentChange = first.net_worth !== 0
      ? (change / first.net_worth) * 100
      : 0

    return {
      change,
      percentChange,
      isPositive: change >= 0,
    }
  }, [history])

  // Chart data
  const chartData = useMemo(() => {
    if (!history) return []
    return history.map(item => ({
      ...item,
      date: item.date,
      net_worth: item.net_worth || 0,
      total_assets: item.total_assets || 0,
      total_liabilities: item.total_liabilities || 0,
    }))
  }, [history])

  // Y-axis domain
  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 100000]
    const values = chartData.map(d => d.net_worth)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1
    return [Math.floor((min - padding) / 10000) * 10000, Math.ceil((max + padding) / 10000) * 10000]
  }, [chartData])

  const isLoading = snapshotLoading || historyLoading

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6" />
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    )
  }

  const netWorth = snapshot?.net_worth || 0
  const totalAssets = snapshot?.total_assets || 0
  const totalLiabilities = snapshot?.total_liabilities || 0

  return (
    <div className="card overflow-hidden">
      {/* Header Section */}
      <div className="card-body border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BanknotesIcon className="h-5 w-5 text-wealth dark:text-wealth-light" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Nettovermögen
              </span>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(netWorth)}
            </p>

            {/* Trend */}
            {trend && (
              <div className="flex items-center gap-2 mt-2">
                <div
                  className={clsx(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
                    trend.isPositive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  )}
                >
                  {trend.isPositive ? (
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                  )}
                  <span>
                    {trend.isPositive ? '+' : ''}
                    {formatCompactCurrency(trend.change)}
                  </span>
                  <span className="text-xs opacity-75">
                    ({trend.isPositive ? '+' : ''}{trend.percentChange.toFixed(1)}%)
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  letzte {days} Tage
                </span>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="text-right space-y-1">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Assets</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatCurrency(totalAssets)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Verbindlichkeiten</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatCurrency(totalLiabilities)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card-body pt-4">
        <div className="h-48">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'd.M.', { locale: de })}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={yDomain}
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="net_worth"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#netWorthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Keine historischen Daten vorhanden
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="card-body pt-0 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Stand: {snapshot?.date
              ? format(new Date(snapshot.date), 'd. MMMM yyyy', { locale: de })
              : 'Keine Daten'}
          </span>
          <a
            href="/wealth"
            className="text-wealth dark:text-wealth-light hover:underline"
          >
            Details anzeigen →
          </a>
        </div>
      </div>
    </div>
  )
}
