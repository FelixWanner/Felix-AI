import clsx from 'clsx'
import type { TrafficLightStatusType } from '@/types'

// ─────────────────────────────────────────────────────────────
// Traffic Light Colors
// ─────────────────────────────────────────────────────────────

const statusColors = {
  green: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500',
    ring: 'ring-emerald-500/20',
  },
  yellow: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500',
    ring: 'ring-amber-500/20',
  },
  red: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500',
    ring: 'ring-red-500/20',
  },
}

const statusLabels: Record<TrafficLightStatusType, string> = {
  green: 'Gut',
  yellow: 'Achtung',
  red: 'Kritisch',
}

// ─────────────────────────────────────────────────────────────
// Traffic Light Indicator Component
// ─────────────────────────────────────────────────────────────

interface TrafficLightIndicatorProps {
  status: TrafficLightStatusType
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
  pulse?: boolean
}

export default function TrafficLightIndicator({
  status,
  size = 'md',
  showLabel = false,
  label,
  className,
  pulse = false,
}: TrafficLightIndicatorProps) {
  const colors = statusColors[status]

  const sizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const labelSizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <span
        className={clsx(
          'rounded-full',
          sizeClasses[size],
          colors.bg,
          pulse && status !== 'green' && 'animate-pulse'
        )}
        aria-label={statusLabels[status]}
      />
      {showLabel && (
        <span className={clsx(labelSizeClasses[size], colors.text, 'font-medium')}>
          {label || statusLabels[status]}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Traffic Light Badge Component
// ─────────────────────────────────────────────────────────────

interface TrafficLightBadgeProps {
  status: TrafficLightStatusType
  label?: string
  className?: string
}

export function TrafficLightBadge({
  status,
  label,
  className,
}: TrafficLightBadgeProps) {
  const colors = statusColors[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        colors.bgLight,
        colors.text,
        className
      )}
    >
      <span className={clsx('h-2 w-2 rounded-full', colors.bg)} />
      {label || statusLabels[status]}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Traffic Light Group (for showing multiple statuses)
// ─────────────────────────────────────────────────────────────

interface StatusItem {
  key: string
  label: string
  status: TrafficLightStatusType
}

interface TrafficLightGroupProps {
  items: StatusItem[]
  className?: string
  compact?: boolean
}

export function TrafficLightGroup({
  items,
  className,
  compact = false,
}: TrafficLightGroupProps) {
  if (compact) {
    return (
      <div className={clsx('flex items-center gap-1', className)}>
        {items.map(item => (
          <span
            key={item.key}
            className={clsx('h-3 w-3 rounded-full', statusColors[item.status].bg)}
            title={`${item.label}: ${statusLabels[item.status]}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {items.map(item => (
        <div key={item.key} className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {item.label}
          </span>
          <TrafficLightIndicator status={item.status} size="sm" showLabel />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Traffic Light Select (for forms)
// ─────────────────────────────────────────────────────────────

interface TrafficLightSelectProps {
  value: TrafficLightStatusType
  onChange: (status: TrafficLightStatusType) => void
  label?: string
  className?: string
}

export function TrafficLightSelect({
  value,
  onChange,
  label,
  className,
}: TrafficLightSelectProps) {
  const statuses: TrafficLightStatusType[] = ['green', 'yellow', 'red']

  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        {statuses.map(status => (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all',
              value === status
                ? [statusColors[status].border, statusColors[status].bgLight, 'ring-2', statusColors[status].ring]
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <span className={clsx('h-4 w-4 rounded-full', statusColors[status].bg)} />
            <span className={clsx(
              'text-sm font-medium',
              value === status ? statusColors[status].text : 'text-gray-600 dark:text-gray-400'
            )}>
              {statusLabels[status]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
