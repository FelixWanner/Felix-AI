import { useMemo } from 'react'
import clsx from 'clsx'
import {
  FireIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useFIREProgress } from '@/hooks/useWealth'

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
// Progress Bar Component
// ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  progress: number
  target: number
  current: number
}

function ProgressBar({ progress, target, current }: ProgressBarProps) {
  const cappedProgress = Math.min(100, progress)
  const milestones = [25, 50, 75, 100]

  return (
    <div className="space-y-2">
      {/* Labels */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Aktuell: {formatCompactCurrency(current)}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Ziel: {formatCompactCurrency(target)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-1000 ease-out',
              progress >= 100
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
                : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
            )}
            style={{ width: `${cappedProgress}%` }}
          />
        </div>

        {/* Milestone Markers */}
        <div className="absolute inset-0 flex items-center">
          {milestones.map(milestone => (
            <div
              key={milestone}
              className="absolute h-4 w-0.5 bg-gray-300 dark:bg-gray-600"
              style={{ left: `${milestone}%`, transform: 'translateX(-50%)' }}
            />
          ))}
        </div>
      </div>

      {/* Milestone Labels */}
      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string
  subValue?: string
  color?: string
}

function StatCard({ icon: Icon, label, value, subValue, color = 'text-gray-600 dark:text-gray-400' }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
        <Icon className={clsx('h-4 w-4', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {subValue}
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function FireProgress() {
  const { data: fire, isLoading } = useFIREProgress()

  // Calculate additional metrics
  const metrics = useMemo(() => {
    if (!fire) return null

    const yearsText = fire.yearsToFIRE !== null
      ? fire.yearsToFIRE < 1
        ? 'Weniger als 1 Jahr'
        : `~${Math.round(fire.yearsToFIRE)} Jahre`
      : 'Nicht berechenbar'

    return {
      yearsText,
      safeWithdrawal: (fire.netWorth * fire.withdrawalRate) / 100,
      coveragePercent: fire.expensesCovered,
    }
  }, [fire])

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
        <div className="card-body space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!fire || fire.targetAmount === 0) {
    return (
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <FireIcon className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            FIRE Progress
          </h3>
        </div>
        <div className="card-body">
          <div className="text-center py-8">
            <FireIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Kein FIRE-Ziel definiert
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Definiere dein Ziel in den Einstellungen
            </p>
            <a
              href="/settings"
              className="inline-block mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Zu den Einstellungen →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FireIcon className={clsx(
            'h-5 w-5',
            fire.isAchieved ? 'text-orange-500' : 'text-emerald-500'
          )} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            FIRE Progress
          </h3>
        </div>
        {fire.isAchieved && (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 rounded-full">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            FIRE erreicht!
          </span>
        )}
      </div>

      <div className="card-body space-y-6">
        {/* Main Progress Display */}
        <div className="text-center">
          <div className="inline-flex items-baseline gap-2">
            <span className={clsx(
              'text-5xl font-bold',
              fire.isAchieved
                ? 'text-orange-500'
                : 'text-emerald-500'
            )}>
              {fire.progress.toFixed(1)}%
            </span>
            <span className="text-lg text-gray-500 dark:text-gray-400">
              erreicht
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar
          progress={fire.progress}
          target={fire.targetAmount}
          current={fire.netWorth}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={CalendarDaysIcon}
            label="Verbleibende Zeit"
            value={metrics?.yearsText || '-'}
            color={fire.isAchieved ? 'text-orange-500' : 'text-emerald-500'}
          />
          <StatCard
            icon={BanknotesIcon}
            label="Safe Withdrawal (4%)"
            value={formatCurrency(fire.monthlyPassiveIncome)}/Mo
            subValue={`${formatCompactCurrency(metrics?.safeWithdrawal || 0)}/Jahr`}
            color="text-blue-500"
          />
        </div>

        {/* Expenses Coverage */}
        {fire.monthlyExpenses > 0 && (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Ausgabendeckung
              </span>
              <span className={clsx(
                'text-sm font-semibold',
                fire.expensesCovered >= 100
                  ? 'text-emerald-500'
                  : fire.expensesCovered >= 50
                  ? 'text-yellow-500'
                  : 'text-red-500'
              )}>
                {fire.expensesCovered.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  fire.expensesCovered >= 100
                    ? 'bg-emerald-500'
                    : fire.expensesCovered >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${Math.min(100, fire.expensesCovered)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Passiv: {formatCurrency(fire.monthlyPassiveIncome)}/Mo
              </span>
              <span>
                Ausgaben: {formatCurrency(fire.monthlyExpenses)}/Mo
              </span>
            </div>
          </div>
        )}

        {/* 4% Rule Explanation */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Die 4%-Regel</p>
            <p className="text-blue-600 dark:text-blue-400">
              Bei einem Entnahmesatz von {fire.withdrawalRate}% kannst du theoretisch{' '}
              {formatCurrency(fire.monthlyPassiveIncome)} pro Monat entnehmen,
              ohne dein Kapital langfristig zu reduzieren.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="card-body border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Ziel: {formatCurrency(fire.targetAmount)}
          </span>
          <a
            href="/settings"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Ziel anpassen →
          </a>
        </div>
      </div>
    </div>
  )
}
