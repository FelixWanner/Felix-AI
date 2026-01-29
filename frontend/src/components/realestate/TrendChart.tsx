import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import type { TrendDataPoint } from '@/types'
import { formatCurrency } from './KPICard'

// ─────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────

interface TooltipPayload {
  name: string
  value: number
  color: string
  dataKey: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {getDataKeyLabel(entry.dataKey)}
              </span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatValue(entry.dataKey, entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getDataKeyLabel(key: string): string {
  const labels: Record<string, string> = {
    netCashflow: 'Netto-Cashflow',
    noi: 'NOI',
    vacancyDays: 'Leerstandstage',
    rentArrears: 'Rückstände',
    capex: 'CapEx',
  }
  return labels[key] || key
}

function formatValue(key: string, value: number): string {
  if (key === 'vacancyDays') return `${value} Tage`
  return formatCurrency(value)
}

// ─────────────────────────────────────────────────────────────
// Trend Chart Component
// ─────────────────────────────────────────────────────────────

interface TrendChartProps {
  data: TrendDataPoint[]
  className?: string
  height?: number
  showLegend?: boolean
  metrics?: ('netCashflow' | 'noi' | 'vacancyDays' | 'rentArrears' | 'capex')[]
}

export default function TrendChart({
  data,
  className,
  height = 300,
  showLegend = true,
  metrics = ['netCashflow', 'vacancyDays', 'rentArrears', 'capex'],
}: TrendChartProps) {
  // Calculate averages for reference lines
  const averages = useMemo(() => {
    if (data.length === 0) return { netCashflow: 0, noi: 0, vacancyDays: 0 }
    return {
      netCashflow: data.reduce((sum, d) => sum + d.netCashflow, 0) / data.length,
      noi: data.reduce((sum, d) => sum + d.noi, 0) / data.length,
      vacancyDays: data.reduce((sum, d) => sum + d.vacancyDays, 0) / data.length,
    }
  }, [data])

  if (data.length === 0) {
    return (
      <div className={`card ${className || ''}`}>
        <div className="card-header flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            12-Monats-Trend
          </h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500 dark:text-gray-400">
              Keine Trenddaten vorhanden
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className || ''}`}>
      <div className="card-header flex items-center gap-2">
        <ChartBarIcon className="h-5 w-5 text-violet-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          12-Monats-Trend
        </h3>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-500 dark:text-gray-400"
            />
            <YAxis
              yAxisId="currency"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-500 dark:text-gray-400"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="days"
              orientation="right"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-500 dark:text-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => getDataKeyLabel(value)}
              />
            )}

            {/* Net Cashflow - Primary Line */}
            {metrics.includes('netCashflow') && (
              <Line
                yAxisId="currency"
                type="monotone"
                dataKey="netCashflow"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}

            {/* NOI Line */}
            {metrics.includes('noi') && (
              <Line
                yAxisId="currency"
                type="monotone"
                dataKey="noi"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}

            {/* Vacancy Days - Area */}
            {metrics.includes('vacancyDays') && (
              <Area
                yAxisId="days"
                type="monotone"
                dataKey="vacancyDays"
                fill="#F59E0B"
                fillOpacity={0.2}
                stroke="#F59E0B"
                strokeWidth={1}
              />
            )}

            {/* Rent Arrears - Bars */}
            {metrics.includes('rentArrears') && (
              <Bar
                yAxisId="currency"
                dataKey="rentArrears"
                fill="#EF4444"
                fillOpacity={0.7}
                radius={[2, 2, 0, 0]}
              />
            )}

            {/* CapEx - Bars */}
            {metrics.includes('capex') && (
              <Bar
                yAxisId="currency"
                dataKey="capex"
                fill="#8B5CF6"
                fillOpacity={0.7}
                radius={[2, 2, 0, 0]}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Simple Cashflow Trend (mini version)
// ─────────────────────────────────────────────────────────────

interface MiniTrendChartProps {
  data: TrendDataPoint[]
  className?: string
  height?: number
}

export function MiniTrendChart({
  data,
  className,
  height = 100,
}: MiniTrendChartProps) {
  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <Line
          type="monotone"
          dataKey="netCashflow"
          stroke="#10B981"
          strokeWidth={2}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="netCashflow"
          fill="#10B981"
          fillOpacity={0.1}
          stroke="none"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
