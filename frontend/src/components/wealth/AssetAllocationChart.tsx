import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useAssetAllocation } from '@/hooks/useWealth'

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
// Asset Categories Configuration
// ─────────────────────────────────────────────────────────────

interface AssetCategory {
  key: string
  label: string
  color: string
  icon: React.ElementType
}

const assetCategories: AssetCategory[] = [
  {
    key: 'properties',
    label: 'Immobilien',
    color: '#10B981', // emerald-500
    icon: BuildingOffice2Icon,
  },
  {
    key: 'investments',
    label: 'Investments',
    color: '#3B82F6', // blue-500
    icon: ChartBarIcon,
  },
  {
    key: 'cash',
    label: 'Cash',
    color: '#F59E0B', // amber-500
    icon: BanknotesIcon,
  },
  {
    key: 'companies',
    label: 'Unternehmen',
    color: '#8B5CF6', // violet-500
    icon: BuildingStorefrontIcon,
  },
]

// ─────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────

interface TooltipPayload {
  name: string
  value: number
  payload: {
    name: string
    value: number
    percent: number
    color: string
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
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {data.name}
        </span>
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        {formatCurrency(data.value)}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {data.percent.toFixed(1)}% des Portfolios
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Legend Item
// ─────────────────────────────────────────────────────────────

interface LegendItemProps {
  category: AssetCategory
  value: number
  percent: number
}

function LegendItem({ category, value, percent }: LegendItemProps) {
  const IconComponent = category.icon

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <IconComponent
            className="h-4 w-4"
            style={{ color: category.color }}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {category.label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatCompactCurrency(value)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className="text-sm font-semibold"
          style={{ color: category.color }}
        >
          {percent.toFixed(1)}%
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function AssetAllocationChart() {
  const { data: allocation, isLoading } = useAssetAllocation()

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!allocation) return []

    return assetCategories
      .map(cat => ({
        name: cat.label,
        value: allocation[cat.key as keyof typeof allocation]?.value || 0,
        percent: allocation[cat.key as keyof typeof allocation]?.percent || 0,
        color: cat.color,
      }))
      .filter(item => item.value > 0)
  }, [allocation])

  // Calculate totals
  const totalAssets = allocation?.totalAssets || 0
  const totalLiabilities = allocation?.totalLiabilities || 0

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-64">
            <div className="w-48 h-48 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartPieIcon className="h-5 w-5 text-wealth dark:text-wealth-light" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Asset Allocation
          </h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Gesamt: {formatCompactCurrency(totalAssets)}
        </span>
      </div>

      <div className="card-body">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ChartPieIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Keine Asset-Daten vorhanden
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Label */}
              <div className="relative -mt-[156px] pointer-events-none">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Netto
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCompactCurrency(allocation?.netWorth || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1">
              {assetCategories.map(cat => (
                <LegendItem
                  key={cat.key}
                  category={cat}
                  value={
                    allocation?.[cat.key as keyof typeof allocation]?.value || 0
                  }
                  percent={
                    allocation?.[cat.key as keyof typeof allocation]?.percent || 0
                  }
                />
              ))}

              {/* Liabilities */}
              {totalLiabilities > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  <div className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <BanknotesIcon className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Verbindlichkeiten
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Kredite & Schulden
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-500">
                        -{formatCompactCurrency(totalLiabilities)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="card-body border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <a
            href="/wealth/properties"
            className={clsx(
              'text-xs px-3 py-1.5 rounded-full transition-colors',
              'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
              'hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
            )}
          >
            Immobilien
          </a>
          <a
            href="/wealth/investments"
            className={clsx(
              'text-xs px-3 py-1.5 rounded-full transition-colors',
              'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
              'hover:bg-blue-200 dark:hover:bg-blue-900/50'
            )}
          >
            Investments
          </a>
          <a
            href="/wealth/accounts"
            className={clsx(
              'text-xs px-3 py-1.5 rounded-full transition-colors',
              'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
              'hover:bg-amber-200 dark:hover:bg-amber-900/50'
            )}
          >
            Konten
          </a>
          <a
            href="/wealth/loans"
            className={clsx(
              'text-xs px-3 py-1.5 rounded-full transition-colors',
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
              'hover:bg-red-200 dark:hover:bg-red-900/50'
            )}
          >
            Kredite
          </a>
        </div>
      </div>
    </div>
  )
}
