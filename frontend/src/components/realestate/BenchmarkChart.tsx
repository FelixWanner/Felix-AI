import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartBarSquareIcon } from '@heroicons/react/24/outline'
import type { BenchmarkDataPoint } from '@/types'

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
                {entry.name}
              </span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              {entry.value.toFixed(2)} €/m²
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Benchmark Chart Component
// ─────────────────────────────────────────────────────────────

interface BenchmarkChartProps {
  data: BenchmarkDataPoint[]
  className?: string
  height?: number
}

export default function BenchmarkChart({
  data,
  className,
  height = 350,
}: BenchmarkChartProps) {
  if (data.length === 0) {
    return (
      <div className={`card ${className || ''}`}>
        <div className="card-header flex items-center gap-2">
          <ChartBarSquareIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Benchmark €/m²
          </h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500 dark:text-gray-400">
              Keine Benchmark-Daten vorhanden
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate averages for reference
  const avgActualRent = data.reduce((sum, d) => sum + d.actualRentPerSqm, 0) / data.length
  const avgTargetRent = data.reduce((sum, d) => sum + d.targetRentPerSqm, 0) / data.length

  return (
    <div className={`card ${className || ''}`}>
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBarSquareIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Benchmark €/m²
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Ø Ist: {avgActualRent.toFixed(2)} €/m²</span>
          <span>Ø Soll: {avgTargetRent.toFixed(2)} €/m²</span>
        </div>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="propertyName"
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
              tickFormatter={(value) => `${value.toFixed(0)}`}
              label={{
                value: '€/m²',
                angle: -90,
                position: 'insideLeft',
                className: 'fill-gray-500 dark:fill-gray-400',
                fontSize: 11,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  actualRentPerSqm: 'Ist-Miete',
                  targetRentPerSqm: 'Soll-Miete',
                  costsPerSqm: 'NK (n. umlagef.)',
                  capexPerSqm: 'CapEx',
                }
                return labels[value] || value
              }}
            />

            {/* Ist-Miete */}
            <Bar
              dataKey="actualRentPerSqm"
              name="actualRentPerSqm"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
            />

            {/* Soll-Miete */}
            <Bar
              dataKey="targetRentPerSqm"
              name="targetRentPerSqm"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />

            {/* NK nicht umlagefähig */}
            <Bar
              dataKey="costsPerSqm"
              name="costsPerSqm"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
            />

            {/* CapEx */}
            <Bar
              dataKey="capexPerSqm"
              name="capexPerSqm"
              fill="#8B5CF6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Gap Analysis */}
        {avgTargetRent > avgActualRent && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Mietpotenzial:</strong> Im Durchschnitt liegt die Ist-Miete{' '}
              {((1 - avgActualRent / avgTargetRent) * 100).toFixed(1)}% unter der Marktmiete.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Compact Rent Comparison (for property detail)
// ─────────────────────────────────────────────────────────────

interface RentComparisonProps {
  actualRentPerSqm: number
  targetRentPerSqm: number
  className?: string
}

export function RentComparison({
  actualRentPerSqm,
  targetRentPerSqm,
  className,
}: RentComparisonProps) {
  const gap = targetRentPerSqm - actualRentPerSqm
  const gapPercent = targetRentPerSqm > 0 ? (gap / targetRentPerSqm) * 100 : 0
  const isUnderRented = gap > 0.5 // More than 0.50€/m² gap

  return (
    <div className={`flex items-center gap-4 ${className || ''}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Ist-Miete</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {actualRentPerSqm.toFixed(2)} €/m²
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${Math.min(100, (actualRentPerSqm / targetRentPerSqm) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-gray-500 dark:text-gray-400">Soll: {targetRentPerSqm.toFixed(2)} €/m²</span>
          {isUnderRented && (
            <span className="text-blue-600 dark:text-blue-400">
              +{gapPercent.toFixed(1)}% Potenzial
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
