import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  TodayOverview,
  QuickStats,
  AlertsPanel,
  AIInsights,
} from '@/components/dashboard'
import { useDashboardRealtime } from '@/hooks/useDashboard'

// ─────────────────────────────────────────────────────────────
// Greeting Helper
// ─────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 6) return 'Gute Nacht'
  if (hour < 12) return 'Guten Morgen'
  if (hour < 14) return 'Mahlzeit'
  if (hour < 18) return 'Guten Tag'
  if (hour < 22) return 'Guten Abend'
  return 'Gute Nacht'
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  // Enable realtime subscriptions
  useDashboardRealtime()

  const today = new Date()
  const greeting = getGreeting()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {format(today, "EEEE, d. MMMM yyyy", { locale: de })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <a
            href="/productivity/inbox"
            className="btn-secondary text-sm"
          >
            Inbox
          </a>
          <a
            href="/health/habits"
            className="btn-secondary text-sm"
          >
            Habits
          </a>
          <a
            href="/goals/journal"
            className="btn-primary text-sm"
          >
            Journal
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Today Overview (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <TodayOverview />
        </div>

        {/* Right Column - Alerts & Insights */}
        <div className="space-y-6">
          <AlertsPanel />
          <AIInsights />
        </div>
      </div>
    </div>
  )
}
