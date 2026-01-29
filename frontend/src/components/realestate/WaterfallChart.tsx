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
import { ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import type { WaterfallDataPoint } from '@/types'
import { formatCurrency } from './KPICard'

// ─────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: WaterfallDataPoint }[]
}) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
        {data.name}
      </p>
      <p className="text-lg font-semibold" style={{ color: data.fill }}>
        {data.value >= 0 ? '+' : ''}{formatCurrency(data.value)}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Kumulativ: {formatCurrency(data.cumulative)}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Waterfall Chart Component
// ─────────────────────────────────────────────────────────────

interface WaterfallChartProps {
  data: WaterfallDataPoint[]
  className?: string
  height?: number
}

export default function WaterfallChart({
  data,
  className,
  height = 350,
}: WaterfallChartProps) {
  if (data.length === 0) {
    return (
      <div className={`card ${className || ''}`}>
        <div className="card-header flex items-center gap-2">
          <ArrowTrendingDownIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cashflow-Waterfall
          </h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500 dark:text-gray-400">
              Keine Daten vorhanden
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Transform data for waterfall visualization
  // We need invisible bars to create the "floating" effect
  const transformedData = data.map((item, index) => {
    let invisibleValue = 0

    if (index > 0 && item.type !== 'subtotal' && item.type !== 'total' && item.type !== 'start') {
      // Calculate where the bar should start
      const prevItem = data[index - 1]
      if (item.value < 0) {
        // For decreases, start at the cumulative value
        invisibleValue = item.cumulative
      } else {
        // For increases, start at the previous cumulative
        invisibleValue = prevItem.cumulative
      }
    }

    return {
      ...item,
      invisible: invisibleValue,
      displayValue: Math.abs(item.value),
    }
  })

  return (
    <div className={`card ${className || ''}`}>
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowTrendingDownIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cashflow-Waterfall
          </h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          monatlich
        </span>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={transformedData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'currentColor', fontSize: 11 }}
              className="text-gray-500 dark:text-gray-400"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-500 dark:text-gray-400"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />

            {/* Invisible spacer bars */}
            <Bar
              dataKey="invisible"
              fill="transparent"
              stackId="stack"
            />

            {/* Visible value bars */}
            <Bar
              dataKey="displayValue"
              stackId="stack"
              radius={[4, 4, 0, 0]}
            >
              {transformedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Start/Subtotal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Zufluss</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Abfluss</span>
          </div>
        </div>
      </div>
    </div>
  )
}
