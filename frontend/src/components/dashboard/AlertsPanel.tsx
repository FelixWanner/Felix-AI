import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import clsx from 'clsx'
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  CheckIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useAlerts } from '@/hooks/useDashboard'
import type { AIInsight } from '@/types'

// ─────────────────────────────────────────────────────────────
// Priority Config
// ─────────────────────────────────────────────────────────────

const priorityConfig = {
  action_required: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    label: 'Aktion erforderlich',
    labelBg: 'bg-red-100 dark:bg-red-900/40',
    labelText: 'text-red-800 dark:text-red-300',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    label: 'Warnung',
    labelBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    labelText: 'text-yellow-800 dark:text-yellow-300',
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Info',
    labelBg: 'bg-blue-100 dark:bg-blue-900/40',
    labelText: 'text-blue-800 dark:text-blue-300',
  },
} as const

// ─────────────────────────────────────────────────────────────
// Category Config
// ─────────────────────────────────────────────────────────────

const categoryConfig = {
  wealth: {
    color: 'text-wealth dark:text-wealth-light',
    label: 'Vermögen',
  },
  health: {
    color: 'text-health dark:text-health-light',
    label: 'Gesundheit',
  },
  productivity: {
    color: 'text-productivity dark:text-productivity-light',
    label: 'Produktivität',
  },
  goals: {
    color: 'text-goals dark:text-goals-light',
    label: 'Ziele',
  },
} as const

// ─────────────────────────────────────────────────────────────
// Alert Item Component
// ─────────────────────────────────────────────────────────────

interface AlertItemProps {
  alert: AIInsight
  onDismiss: (id: string) => void
  onAction: (id: string) => void
}

function AlertItem({ alert, onDismiss, onAction }: AlertItemProps) {
  const priority = alert.priority as keyof typeof priorityConfig
  const category = alert.category as keyof typeof categoryConfig
  const config = priorityConfig[priority] || priorityConfig.info
  const catConfig = categoryConfig[category]
  const Icon = config.icon

  const suggestedActions = alert.suggested_actions as
    | { action: string; label: string; url?: string }[]
    | null

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border transition-all',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={clsx('h-5 w-5 mt-0.5 flex-shrink-0', config.iconColor)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={clsx(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                config.labelBg,
                config.labelText
              )}
            >
              {config.label}
            </span>
            {catConfig && (
              <span className={clsx('text-xs', catConfig.color)}>
                {catConfig.label}
              </span>
            )}
          </div>

          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {alert.title}
          </h4>

          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {alert.message}
          </p>

          {suggestedActions && suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {suggestedActions.map((action, idx) =>
                action.url ? (
                  <a
                    key={idx}
                    href={action.url}
                    className="btn-sm btn-primary text-xs"
                  >
                    {action.label}
                  </a>
                ) : (
                  <button
                    key={idx}
                    onClick={() => onAction(alert.id)}
                    className="btn-sm btn-primary text-xs"
                  >
                    {action.label}
                  </button>
                )
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {formatDistanceToNow(new Date(alert.created_at), {
              addSuffix: true,
              locale: de,
            })}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onAction(alert.id)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Als erledigt markieren"
          >
            <CheckIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Ausblenden"
          >
            <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function AlertsPanel() {
  const { data: alerts, isLoading } = useAlerts()
  const queryClient = useQueryClient()

  // Dismiss mutation (mark as read)
  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['pending-insights'] })
    },
  })

  // Action mutation (mark as actioned)
  const actionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_actioned: true, is_read: true })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['pending-insights'] })
    },
  })

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
        </div>
        <div className="card-body space-y-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  const hasAlerts = alerts && alerts.length > 0
  const actionRequiredCount =
    alerts?.filter(a => a.priority === 'action_required').length || 0

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellAlertIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Alerts
          </h3>
          {actionRequiredCount > 0 && (
            <span className="flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {actionRequiredCount}
            </span>
          )}
        </div>
        {hasAlerts && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {alerts.length} aktiv
          </span>
        )}
      </div>

      <div className="card-body">
        {!hasAlerts ? (
          <div className="text-center py-8">
            <CheckIcon className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Keine aktiven Alerts
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Alles sieht gut aus!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={id => dismissMutation.mutate(id)}
                onAction={id => actionMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
