import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import type { MaturityWallDataPoint } from '@/types'
import { formatCurrency, formatPercent } from './KPICard'

// ─────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: MaturityWallDataPoint }[]
}) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        Jahr {data.year}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Auslaufend</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(data.expiringAmount, true)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Anzahl Kredite</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {data.loanCount}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Ø LTV</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatPercent(data.avgLTV)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Maturity Wall Chart Component
// ─────────────────────────────────────────────────────────────

interface MaturityWallChartProps {
  data: MaturityWallDataPoint[]
  className?: string
  height?: number
}

export default function MaturityWallChart({
  data,
  className,
  height = 300,
}: MaturityWallChartProps) {
  const currentYear = new Date().getFullYear()

  // Calculate total for percentage display
  const totalExpiring = data.reduce((sum, d) => sum + d.expiringAmount, 0)

  // Determine bar colors based on year proximity
  const getBarColor = (year: number): string => {
    const yearsAway = year - currentYear
    if (yearsAway <= 1) return '#EF4444' // Red - urgent
    if (yearsAway <= 2) return '#F59E0B' // Amber - warning
    if (yearsAway <= 3) return '#3B82F6' // Blue - attention
    return '#10B981' // Green - ok
  }

  if (data.length === 0) {
    return (
      <div className={`card ${className || ''}`}>
        <div className="card-header flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Refinanzierungsrisiko
          </h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500 dark:text-gray-400">
              Keine Kredite mit Zinsbindungsende vorhanden
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className || ''}`}>
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Maturity Wall
          </h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Gesamt: {formatCurrency(totalExpiring, true)}
        </span>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="year"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-500 dark:text-gray-400"
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-500 dark:text-gray-400"
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={currentYear} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Heute', fill: '#EF4444', fontSize: 11 }} />
            <Bar
              dataKey="expiringAmount"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.year)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">&le; 1 Jahr</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">1-2 Jahre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">2-3 Jahre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">&gt; 3 Jahre</span>
          </div>
        </div>

        {/* Summary below chart */}
        {data.filter(d => d.year - currentYear <= 2).length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Achtung:</strong> {formatCurrency(
                data.filter(d => d.year - currentYear <= 2).reduce((sum, d) => sum + d.expiringAmount, 0),
                true
              )} Restschuld läuft in den nächsten 24 Monaten aus.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
