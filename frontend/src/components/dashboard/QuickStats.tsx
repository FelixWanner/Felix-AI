import clsx from 'clsx'
import {
  BanknotesIcon,
  FireIcon,
  InboxIcon,
  ExclamationTriangleIcon,
  TicketIcon,
  FlagIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { useQuickStats } from '@/hooks/useDashboard'

// ─────────────────────────────────────────────────────────────
// Format Helpers
// ─────────────────────────────────────────────────────────────

function formatCurrency(value: number, short = false): string {
  if (short) {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M €`
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(0)}K €`
    }
  }
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  iconColor: string
  iconBgColor: string
  trend?: {
    value: number
    isPositive: boolean
  }
  href?: string
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBgColor,
  trend,
  href,
}: StatCardProps) {
  const content = (
    <div className="stat-card hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <p
              className={clsx(
                'text-sm font-medium mt-1',
                trend.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </p>
          )}
        </div>
        <div className={clsx('p-3 rounded-lg', iconBgColor)}>
          <Icon className={clsx('h-6 w-6', iconColor)} />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <a href={href}>{content}</a>
  }

  return content
}

// ─────────────────────────────────────────────────────────────
// FIRE Progress Card
// ─────────────────────────────────────────────────────────────

interface FIREProgressCardProps {
  progress: number
  target: number
  netWorth: number
}

function FIREProgressCard({ progress, target, netWorth }: FIREProgressCardProps) {
  const remaining = Math.max(0, target - netWorth)

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="stat-label">FIRE Progress</p>
          <p className="stat-value mt-1">{progress.toFixed(1)}%</p>
        </div>
        <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
          <FireIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, progress)}%`,
            background: `linear-gradient(90deg, #f97316 0%, #eab308 ${
              progress > 50 ? '50%' : '100%'
            }, #22c55e 100%)`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{formatCurrency(netWorth, true)}</span>
        <span>Ziel: {formatCurrency(target, true)}</span>
      </div>

      {remaining > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Noch {formatCurrency(remaining, true)} bis zur finanziellen Freiheit
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Asset Breakdown Card
// ─────────────────────────────────────────────────────────────

interface AssetBreakdownProps {
  cash: number
  investments: number
  property: number
  totalAssets: number
}

function AssetBreakdownCard({
  cash,
  investments,
  property,
  totalAssets,
}: AssetBreakdownProps) {
  const items = [
    {
      label: 'Cash',
      value: cash,
      color: 'bg-blue-500',
      percent: totalAssets > 0 ? (cash / totalAssets) * 100 : 0,
    },
    {
      label: 'Investments',
      value: investments,
      color: 'bg-purple-500',
      percent: totalAssets > 0 ? (investments / totalAssets) * 100 : 0,
    },
    {
      label: 'Immobilien',
      value: property,
      color: 'bg-green-500',
      percent: totalAssets > 0 ? (property / totalAssets) * 100 : 0,
    },
  ]

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="stat-label">Assets</p>
          <p className="stat-value mt-1">{formatCurrency(totalAssets, true)}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
          <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
      </div>

      {/* Stacked Bar */}
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        {items.map(item => (
          <div
            key={item.label}
            className={clsx('h-full', item.color)}
            style={{ width: `${item.percent}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={clsx('w-2.5 h-2.5 rounded-full', item.color)} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function QuickStats() {
  const { data: stats, isLoading } = useQuickStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28" />
              </div>
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Net Worth */}
        <StatCard
          title="Nettovermögen"
          value={formatCurrency(stats.net_worth, true)}
          subtitle={`Verbindlichkeiten: ${formatCurrency(stats.total_liabilities, true)}`}
          icon={BanknotesIcon}
          iconColor="text-wealth dark:text-wealth-light"
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
          href="/wealth"
        />

        {/* Inbox */}
        <StatCard
          title="Inbox"
          value={stats.inbox_count}
          subtitle={
            stats.overdue_count > 0
              ? `${stats.overdue_count} überfällig`
              : 'Alles aktuell'
          }
          icon={InboxIcon}
          iconColor="text-productivity dark:text-productivity-light"
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          href="/productivity/inbox"
        />

        {/* Open Tickets */}
        <StatCard
          title="Offene Tickets"
          value={stats.open_tickets}
          icon={TicketIcon}
          iconColor="text-yellow-600 dark:text-yellow-400"
          iconBgColor="bg-yellow-100 dark:bg-yellow-900/30"
          href="/productivity/tickets"
        />

        {/* Active Goals */}
        <StatCard
          title="Aktive Ziele"
          value={stats.active_goals}
          icon={FlagIcon}
          iconColor="text-goals dark:text-goals-light"
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          href="/goals"
        />
      </div>

      {/* Second Row - FIRE & Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FIREProgressCard
          progress={stats.fire_progress}
          target={stats.fire_target}
          netWorth={stats.net_worth}
        />
        <AssetBreakdownCard
          cash={stats.cash_value}
          investments={stats.investment_value}
          property={stats.property_value}
          totalAssets={stats.total_assets}
        />
      </div>
    </div>
  )
}
