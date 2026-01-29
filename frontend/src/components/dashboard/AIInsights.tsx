import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import clsx from 'clsx'
import {
  SparklesIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  FlagIcon,
  EyeIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { usePendingInsights } from '@/hooks/useDashboard'
import type { AIInsight } from '@/types'

// ─────────────────────────────────────────────────────────────
// Insight Type Icons
// ─────────────────────────────────────────────────────────────

const insightTypeIcons: Record<string, React.ElementType> = {
  // Wealth
  loan_rate_expiring: BanknotesIcon,
  tax_free_approaching: ArrowTrendingUpIcon,
  low_balance: BanknotesIcon,
  rent_missing: BanknotesIcon,
  invoice_due: BanknotesIcon,
  // Health
  habit_streak_risk: HeartIcon,
  health_warning: HeartIcon,
  low_sleep_score: HeartIcon,
  // Productivity
  task_overdue: ClipboardDocumentListIcon,
  meeting_conflict: ClipboardDocumentListIcon,
  // Goals
  goal_at_risk: FlagIcon,
  goal_milestone: FlagIcon,
  // Default
  default: LightBulbIcon,
}

// ─────────────────────────────────────────────────────────────
// Category Colors
// ─────────────────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  wealth: 'text-wealth dark:text-wealth-light bg-emerald-100 dark:bg-emerald-900/30',
  health: 'text-health dark:text-health-light bg-rose-100 dark:bg-rose-900/30',
  productivity:
    'text-productivity dark:text-productivity-light bg-blue-100 dark:bg-blue-900/30',
  goals: 'text-goals dark:text-goals-light bg-purple-100 dark:bg-purple-900/30',
}

// ─────────────────────────────────────────────────────────────
// Insight Card Component
// ─────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: AIInsight
  onMarkRead: (id: string) => void
}

function InsightCard({ insight, onMarkRead }: InsightCardProps) {
  const IconComponent =
    insightTypeIcons[insight.insight_type || ''] || insightTypeIcons.default
  const categoryColor = categoryColors[insight.category || ''] || categoryColors.goals

  const suggestedActions = insight.suggested_actions as
    | { action: string; label: string; url?: string }[]
    | null

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border transition-all',
        insight.is_read
          ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-70'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={clsx('p-2 rounded-lg', categoryColor)}>
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {insight.category}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {insight.insight_type?.replace(/_/g, ' ')}
            </span>
          </div>

          <h4
            className={clsx(
              'text-sm font-medium',
              insight.is_read
                ? 'text-gray-600 dark:text-gray-400'
                : 'text-gray-900 dark:text-white'
            )}
          >
            {insight.title}
          </h4>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {insight.message}
          </p>

          {/* Actions */}
          {suggestedActions && suggestedActions.length > 0 && !insight.is_read && (
            <div className="flex flex-wrap gap-2 mt-3">
              {suggestedActions.slice(0, 2).map((action, idx) =>
                action.url ? (
                  <a
                    key={idx}
                    href={action.url}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {action.label} →
                  </a>
                ) : (
                  <span
                    key={idx}
                    className="text-xs text-primary-600 dark:text-primary-400"
                  >
                    {action.label}
                  </span>
                )
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {formatDistanceToNow(new Date(insight.created_at), {
                addSuffix: true,
                locale: de,
              })}
            </p>

            {!insight.is_read && (
              <button
                onClick={() => onMarkRead(insight.id)}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <EyeIcon className="h-3.5 w-3.5" />
                Als gelesen markieren
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function AIInsights() {
  const { data: insights, isLoading } = usePendingInsights(8)
  const queryClient = useQueryClient()

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-insights'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const ids = insights?.filter(i => !i.is_read).map(i => i.id) || []
      if (ids.length === 0) return

      const { error } = await supabase
        .from('ai_insights')
        .update({ is_read: true })
        .in('id', ids)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-insights'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
        <div className="card-body space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  const hasInsights = insights && insights.length > 0
  const unreadCount = insights?.filter(i => !i.is_read).length || 0

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Insights
          </h3>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 rounded-full">
              {unreadCount} neu
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <CheckIcon className="h-4 w-4" />
            Alle gelesen
          </button>
        )}
      </div>

      <div className="card-body">
        {!hasInsights ? (
          <div className="text-center py-8">
            <SparklesIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Keine neuen Insights
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Die KI analysiert deine Daten kontinuierlich
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onMarkRead={id => markReadMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {hasInsights && (
        <div className="card-body border-t border-gray-200 dark:border-gray-700">
          <a
            href="/insights"
            className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Alle Insights anzeigen →
          </a>
        </div>
      )}
    </div>
  )
}
