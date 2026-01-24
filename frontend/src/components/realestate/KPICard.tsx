import clsx from 'clsx'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

// ─────────────────────────────────────────────────────────────
// Currency & Number Formatters
// ─────────────────────────────────────────────────────────────

export const formatCurrency = (value: number, compact = false): string => {
  if (compact) {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M €`
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}k €`
    }
  }
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatPercent = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`
}

export const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// ─────────────────────────────────────────────────────────────
// KPI Card Component
// ─────────────────────────────────────────────────────────────

type KPIVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'

interface KPICardProps {
  label: string
  value: string | number
  subValue?: string
  icon?: React.ElementType
  trend?: number
  trendLabel?: string
  variant?: KPIVariant
  className?: string
  onClick?: () => void
  tooltip?: string
  compact?: boolean
}

const variantStyles: Record<KPIVariant, { bg: string; text: string; icon: string }> = {
  default: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-900 dark:text-white',
    icon: 'text-gray-500 dark:text-gray-400',
  },
  success: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-900 dark:text-emerald-100',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-900 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-900 dark:text-red-100',
    icon: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-900 dark:text-blue-100',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  primary: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-900 dark:text-violet-100',
    icon: 'text-violet-600 dark:text-violet-400',
  },
}

export default function KPICard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  className,
  onClick,
  tooltip,
  compact = false,
}: KPICardProps) {
  const styles = variantStyles[variant]

  const content = (
    <div
      className={clsx(
        'card',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <div className={clsx('p-4', compact && 'p-3')}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className={clsx(
                'text-gray-600 dark:text-gray-400 truncate',
                compact ? 'text-xs' : 'text-sm'
              )}>
                {label}
              </p>
              {tooltip && (
                <span className="group relative">
                  <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {tooltip}
                  </span>
                </span>
              )}
            </div>
            <p className={clsx(
              'font-semibold text-gray-900 dark:text-white truncate',
              compact ? 'text-lg mt-0.5' : 'text-2xl mt-1'
            )}>
              {value}
            </p>
            {subValue && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {subValue}
              </p>
            )}
          </div>

          {Icon && (
            <div className={clsx('p-2 rounded-lg', styles.bg)}>
              <Icon className={clsx('h-5 w-5', styles.icon)} />
            </div>
          )}
        </div>

        {(trend !== undefined || trendLabel) && (
          <div className="mt-2 flex items-center gap-1">
            {trend !== undefined && (
              <>
                {trend >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={clsx(
                  'text-sm font-medium',
                  trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {trend >= 0 ? '+' : ''}{formatPercent(trend)}
                </span>
              </>
            )}
            {trendLabel && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return content
}

// ─────────────────────────────────────────────────────────────
// Mini KPI Card (for inline displays)
// ─────────────────────────────────────────────────────────────

interface MiniKPICardProps {
  label: string
  value: string | number
  variant?: KPIVariant
  className?: string
}

export function MiniKPICard({
  label,
  value,
  variant = 'default',
  className,
}: MiniKPICardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={clsx('rounded-lg p-3', styles.bg, className)}>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className={clsx('text-lg font-semibold mt-0.5', styles.text)}>
        {value}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// KPI Grid Container
// ─────────────────────────────────────────────────────────────

interface KPIGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 6
  className?: string
}

export function KPIGrid({ children, columns = 4, className }: KPIGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }

  return (
    <div className={clsx('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  )
}
