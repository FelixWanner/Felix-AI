import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  XMarkIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline'
import type { RealEstateAlert, AlertSeverity } from '@/types'

// ─────────────────────────────────────────────────────────────
// Severity Styling
// ─────────────────────────────────────────────────────────────

const severityStyles: Record<AlertSeverity, {
  bg: string
  border: string
  text: string
  icon: string
  iconBg: string
}> = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
  },
}

const severityIcons: Record<AlertSeverity, React.ElementType> = {
  critical: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
}

const severityLabels: Record<AlertSeverity, string> = {
  critical: 'Kritisch',
  warning: 'Warnung',
  info: 'Info',
}

// ─────────────────────────────────────────────────────────────
// Single Alert Item
// ─────────────────────────────────────────────────────────────

interface AlertItemProps {
  alert: RealEstateAlert
  onDismiss?: (id: string) => void
  compact?: boolean
}

function AlertItem({ alert, onDismiss, compact = false }: AlertItemProps) {
  const styles = severityStyles[alert.severity]
  const Icon = severityIcons[alert.severity]

  const content = (
    <div className={clsx(
      'flex items-start gap-3',
      compact ? 'p-2' : 'p-3'
    )}>
      <div className={clsx('rounded-full p-1.5', styles.iconBg)}>
        <Icon className={clsx('h-4 w-4', styles.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx(
          'font-medium',
          styles.text,
          compact ? 'text-xs' : 'text-sm'
        )}>
          {alert.title}
        </p>
        {!compact && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {alert.message}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {alert.actionUrl && (
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
        )}
        {onDismiss && (
          <button
            onClick={(e) => {
              e.preventDefault()
              onDismiss(alert.id)
            }}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )

  if (alert.actionUrl) {
    return (
      <Link
        to={alert.actionUrl}
        className={clsx(
          'block rounded-lg border transition-colors',
          styles.bg,
          styles.border,
          'hover:opacity-90'
        )}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className={clsx(
      'rounded-lg border',
      styles.bg,
      styles.border
    )}>
      {content}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Alerts Panel
// ─────────────────────────────────────────────────────────────

interface RealEstateAlertsProps {
  alerts: RealEstateAlert[]
  maxVisible?: number
  onDismiss?: (id: string) => void
  className?: string
  title?: string
  compact?: boolean
  showEmpty?: boolean
}

export default function RealEstateAlerts({
  alerts,
  maxVisible = 5,
  onDismiss,
  className,
  title = 'Warnungen',
  compact = false,
  showEmpty = true,
}: RealEstateAlertsProps) {
  const visibleAlerts = alerts.slice(0, maxVisible)
  const hiddenCount = alerts.length - maxVisible

  // Count by severity
  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  if (alerts.length === 0 && !showEmpty) {
    return null
  }

  return (
    <div className={clsx('card', className)}>
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellAlertIcon className={clsx(
            'h-5 w-5',
            criticalCount > 0 ? 'text-red-500' : warningCount > 0 ? 'text-amber-500' : 'text-gray-400'
          )} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                {criticalCount} kritisch
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                {warningCount} Warnungen
              </span>
            )}
          </div>
        )}
      </div>

      <div className="card-body">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3 mb-3">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Keine aktiven Warnungen
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Alle Immobilien sind im grünen Bereich
            </p>
          </div>
        ) : (
          <div className={clsx('space-y-2', compact && 'space-y-1')}>
            {visibleAlerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={onDismiss}
                compact={compact}
              />
            ))}
            {hiddenCount > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                + {hiddenCount} weitere Warnungen
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Alert Badge (for headers/summaries)
// ─────────────────────────────────────────────────────────────

interface AlertBadgeProps {
  alerts: RealEstateAlert[]
  className?: string
}

export function AlertBadge({ alerts, className }: AlertBadgeProps) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  if (criticalCount === 0 && warningCount === 0) {
    return null
  }

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {criticalCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium">
          <ExclamationCircleIcon className="h-3 w-3" />
          {criticalCount}
        </span>
      )}
      {warningCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium">
          <ExclamationTriangleIcon className="h-3 w-3" />
          {warningCount}
        </span>
      )}
    </div>
  )
}
