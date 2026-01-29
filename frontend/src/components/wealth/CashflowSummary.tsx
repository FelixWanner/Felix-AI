import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import clsx from 'clsx'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import { useMonthlyCashflow, useCashflowForecast } from '@/hooks/useWealth'

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
    month: string
    income: number
    expenses: number
    net: number
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
        {data.month}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-emerald-600 dark:text-emerald-400">Einnahmen:</span>
          <span className="font-medium">
            {formatCurrency(data.income)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-red-600 dark:text-red-400">Ausgaben:</span>
          <span className="font-medium">
            {formatCurrency(data.expenses)}
          </span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600 dark:text-gray-400">Netto:</span>
            <span className={clsx(
              'font-semibold',
              data.net >= 0 ? 'text-emerald-600' : 'text-red-600'
            )}>
              {data.net >= 0 ? '+' : ''}{formatCurrency(data.net)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Stat Item Component
// ─────────────────────────────────────────────────────────────

interface StatItemProps {
  icon: React.ElementType
  label: string
  value: number
  color: 'income' | 'expense' | 'neutral'
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
  const colorClasses = {
    income: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
    expense: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    neutral: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
  }

  return (
    <div className="flex items-center gap-3">
      <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {label}
        </p>
        <p className={clsx(
          'text-sm font-semibold',
          color === 'income' && 'text-emerald-600 dark:text-emerald-400',
          color === 'expense' && 'text-red-600 dark:text-red-400',
          color === 'neutral' && 'text-gray-900 dark:text-white'
        )}>
          {color === 'income' && '+'}{formatCurrency(value)}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function CashflowSummary() {
  const { data: cashflow, isLoading: cashflowLoading } = useMonthlyCashflow()
  const { data: forecast, isLoading: forecastLoading } = useCashflowForecast(6)

  // Prepare forecast chart data
  const chartData = useMemo(() => {
    if (!forecast || forecast.length === 0) return []

    return forecast.map(item => ({
      month: new Date(item.date).toLocaleDateString('de-DE', { month: 'short' }),
      income: item.expected_income || 0,
      expenses: Math.abs(item.expected_expenses || 0),
      net: (item.expected_income || 0) - Math.abs(item.expected_expenses || 0),
    }))
  }, [forecast])

  const isLoading = cashflowLoading || forecastLoading

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  const netCashflow = cashflow?.netCashflow || 0
  const isPositive = netCashflow >= 0

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BanknotesIcon className="h-5 w-5 text-wealth dark:text-wealth-light" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monatlicher Cashflow
          </h3>
        </div>
        <div className={clsx(
          'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
          isPositive
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        )}>
          {isPositive ? (
            <ArrowTrendingUpIcon className="h-4 w-4" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4" />
          )}
          <span>
            {isPositive ? '+' : ''}{formatCurrency(netCashflow)}
          </span>
        </div>
      </div>

      <div className="card-body space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownTrayIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                Einnahmen
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(cashflow?.monthlyIncome || 0)}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpTrayIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                Ausgaben
              </span>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(cashflow?.monthlyExpenses || 0)}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={BuildingOffice2Icon}
            label="Mieteinnahmen"
            value={cashflow?.rentalIncome || 0}
            color="income"
          />
          <StatItem
            icon={CreditCardIcon}
            label="Kreditraten"
            value={cashflow?.loanPayments || 0}
            color="expense"
          />
        </div>

        {/* Savings Rate */}
        {cashflow?.monthlyIncome && cashflow.monthlyIncome > 0 && (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sparquote
              </span>
              <span className={clsx(
                'text-sm font-semibold',
                netCashflow > 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {((netCashflow / cashflow.monthlyIncome) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  netCashflow > 0 ? 'bg-emerald-500' : 'bg-red-500'
                )}
                style={{
                  width: `${Math.min(100, Math.abs((netCashflow / cashflow.monthlyIncome) * 100))}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Forecast Chart */}
        {chartData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              6-Monats-Prognose
            </h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    hide
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
                  <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.net >= 0 ? '#10B981' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recurring Transactions Count */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            {cashflow?.recurringCount || 0} wiederkehrende Transaktionen
          </span>
          <a
            href="/wealth/transactions"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Verwalten →
          </a>
        </div>
      </div>
    </div>
  )
}
