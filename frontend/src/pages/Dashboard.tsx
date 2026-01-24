import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { format, isThisWeek, getWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { CheckSquare, Target, Mail, Plus, Calendar, TrendingUp, AlertCircle, Building2, ChevronRight } from 'lucide-react'
import Modal from '@/components/Modal'
import GoalForm from '@/components/GoalForm'
import MeetingActionItems from '@/components/MeetingActionItems'
import AIChatPanel from '@/components/AIChatPanel'
import { useDashboardRealtime } from '@/hooks/useDashboard'

// Real Estate Components
import PortfolioKPICards, { PortfolioSummaryStats } from '@/components/realestate/PortfolioKPICards'
import RealEstateAlerts from '@/components/realestate/RealEstateAlerts'
import TrendChart, { MiniTrendChart } from '@/components/realestate/TrendChart'
import WaterfallChart from '@/components/realestate/WaterfallChart'
import MaturityWallChart from '@/components/realestate/MaturityWallChart'

// Real Estate Hooks
import {
  usePortfolioKPIs,
  useRealEstateAlerts,
  useTrendData,
  useWaterfallData,
  useMaturityWall,
} from '@/hooks/useRealEstateDashboard'

type Task = Tables<'inbox_items'>
type Goal = Tables<'goals'>

export default function Dashboard() {
  // Enable realtime updates
  useDashboardRealtime()

  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [emails, setEmails] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [showRealEstateSection, setShowRealEstateSection] = useState(true)

  // Real Estate Data
  const { data: portfolioKPIs, isLoading: kpisLoading } = usePortfolioKPIs()
  const { data: alerts = [], isLoading: alertsLoading } = useRealEstateAlerts()
  const { data: trendData = [], isLoading: trendLoading } = useTrendData(12)
  const { data: waterfallData = [], isLoading: waterfallLoading } = useWaterfallData()
  const { data: maturityData = [], isLoading: maturityLoading } = useMaturityWall()

  const today = new Date()
  const dateStr = format(today, 'EEEE, d. MMMM yyyy', { locale: de })
  const hour = new Date().getHours()
  const currentWeek = getWeek(new Date(), { locale: de })
  const currentYear = new Date().getFullYear()

  let greeting = 'Guten Tag'
  if (hour < 6) greeting = 'Gute Nacht'
  else if (hour < 12) greeting = 'Guten Morgen'
  else if (hour < 14) greeting = 'Mahlzeit'
  else if (hour < 18) greeting = 'Guten Tag'
  else if (hour < 22) greeting = 'Guten Abend'
  else greeting = 'Gute Nacht'

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)

      // Load top 5 high-priority tasks
      const { data: tasksData } = await supabase
        .from('inbox_items')
        .select('*')
        .neq('source', 'email')
        .neq('status', 'completed')
        .gte('priority', 2)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true })
        .limit(5)

      // Load current week goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('timeframe', 'weekly')
        .eq('year', currentYear)
        .eq('week', currentWeek)
        .in('status', ['active', 'in_progress'])

      // Load unread emails
      const { data: emailsData } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('source', 'email')
        .neq('status', 'completed')
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(5)

      setTasks(tasksData || [])
      setGoals(goalsData || [])
      setEmails(emailsData || [])
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
    if (priority >= 3) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    if (priority === 2) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const handleGoalCreated = () => {
    setShowAddGoalModal(false)
    loadDashboardData()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {greeting}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {dateStr}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a
            href="/productivity"
            className="flex items-center justify-center gap-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Neue Aufgabe</span>
          </a>

          <button
            onClick={() => setShowAddGoalModal(true)}
            className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors w-full"
          >
            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-200">Neues Ziel</span>
          </button>

          <a
            href="/productivity"
            className="flex items-center justify-center gap-2 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-200">Email verarbeiten</span>
          </a>

          <a
            href="/wealth"
            className="flex items-center justify-center gap-2 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">Finanzen prüfen</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wichtige Aufgaben diese Woche */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Wichtige Aufgaben diese Woche
            </h2>
            <a
              href="/productivity"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Alle ansehen
            </a>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Keine wichtigen Aufgaben. Alles erledigt!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => {
                const overdue = isOverdue(task.due_date)

                return (
                  <a
                    key={task.id}
                    href="/productivity"
                    className={`block p-3 rounded-lg transition-colors ${
                      overdue
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {task.due_date && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(task.due_date), 'dd.MM.yyyy', { locale: de })}
                            </span>
                          )}
                          {overdue && (
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Überfällig
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority === 3 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Aktuelle Wochenziele */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Wochenziele KW{currentWeek}
            </h2>
            <a
              href="/goals"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Alle Ziele
            </a>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Keine Wochenziele gesetzt.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map(goal => {
                const progressPercent = goal.progress_percent || 0

                return (
                  <a
                    key={goal.id}
                    href="/goals"
                    className="block p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                      {goal.title}
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Fortschritt</span>
                        <span className="font-semibold">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            progressPercent === 100
                              ? 'bg-green-600 dark:bg-green-500'
                              : progressPercent >= 50
                              ? 'bg-blue-600 dark:bg-blue-500'
                              : 'bg-yellow-600 dark:bg-yellow-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    {goal.area && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Bereich: {goal.area}
                      </div>
                    )}
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ungelesene Emails */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Ungelesene Emails
          </h2>
          <a
            href="/productivity"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Zur Inbox
          </a>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Keine ungelesenen Emails. Inbox Zero!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {emails.map(email => (
              <a
                key={email.id}
                href="/productivity"
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
              >
                <Mail className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {email.title}
                  </div>
                  {email.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                      {email.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {email.created_at && format(new Date(email.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </div>
                </div>
                <span className="flex h-2 w-2 mt-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Meeting Action Items */}
      <MeetingActionItems limit={5} />

      {/* Immobilien-Portfolio Übersicht */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Immobilien-Portfolio
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRealEstateSection(!showRealEstateSection)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {showRealEstateSection ? 'Einklappen' : 'Ausklappen'}
            </button>
            <a
              href="/wealth"
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Alle Details
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {showRealEstateSection && (
          <>
            {/* Portfolio KPIs */}
            {kpisLoading ? (
              <div className="animate-pulse">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : portfolioKPIs ? (
              <PortfolioKPICards kpis={portfolioKPIs} compact />
            ) : (
              <div className="card p-6 text-center">
                <Building2 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Keine Immobiliendaten vorhanden
                </p>
              </div>
            )}

            {/* Alerts & Mini Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real Estate Alerts */}
              {alertsLoading ? (
                <div className="card animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                  </div>
                </div>
              ) : (
                <RealEstateAlerts
                  alerts={alerts}
                  maxVisible={4}
                  title="Immobilien-Warnungen"
                  compact
                />
              )}

              {/* Trend Chart Mini */}
              {trendLoading ? (
                <div className="card animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ) : (
                <TrendChart
                  data={trendData}
                  height={200}
                  showLegend={false}
                  metrics={['netCashflow', 'noi']}
                />
              )}
            </div>

            {/* Waterfall & Maturity Wall */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Waterfall Chart */}
              {waterfallLoading ? (
                <div className="card animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ) : (
                <WaterfallChart data={waterfallData} height={280} />
              )}

              {/* Maturity Wall */}
              {maturityLoading ? (
                <div className="card animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ) : (
                <MaturityWallChart data={maturityData} height={280} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Module
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/wealth" className="card hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wealth</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Immobilien, Konten & PV-Anlagen
            </p>
          </a>

          <a href="/productivity" className="card hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Productivity</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tasks, Emails & Meetings
            </p>
          </a>

          <a href="/health" className="card hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">🏃</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Health</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Habits, Ernährung & Training
            </p>
          </a>

          <a href="/goals" className="card hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Goals</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ziele, Reviews & FIRE
            </p>
          </a>
        </div>
      </div>

      {/* Add Goal Modal */}
      <Modal
        isOpen={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        title="Neues Wochenziel"
      >
        <GoalForm
          timeframe="weekly"
          onSuccess={handleGoalCreated}
          onCancel={() => setShowAddGoalModal(false)}
        />
      </Modal>

      {/* AI Chat Panel */}
      <AIChatPanel />
    </div>
  )
}
