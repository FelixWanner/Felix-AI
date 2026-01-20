import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Activity,
  Target,
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default function Dashboard() {
  const today = new Date()
  const dateStr = format(today, 'EEEE, d. MMMM yyyy', { locale: de })

  const { data: netWorth } = useQuery({
    queryKey: ['netWorth'],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_snapshots')
        .select('*')
        .order('date', { ascending: false })
        .limit(2)
      return data
    },
  })

  const { data: tasks } = useQuery({
    queryKey: ['pendingTasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inbox_items')
        .select('*')
        .in('status', ['inbox', 'today'])
        .limit(5)
      return data || []
    },
  })

  const { data: habits } = useQuery({
    queryKey: ['todayHabits'],
    queryFn: async () => {
      const { data } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .limit(10)
      return data || []
    },
  })

  const { data: garminStats } = useQuery({
    queryKey: ['garminStats'],
    queryFn: async () => {
      const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('garmin_daily_stats')
        .select('*')
        .eq('date', yesterday)
        .single()
      return data
    },
  })

  const latestNetWorth = netWorth?.[0]?.net_worth || 0
  const previousNetWorth = netWorth?.[1]?.net_worth || latestNetWorth
  const netWorthChange = latestNetWorth - previousNetWorth
  const netWorthChangePercent = previousNetWorth > 0
    ? ((netWorthChange / previousNetWorth) * 100).toFixed(2)
    : '0.00'

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">{dateStr}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Nettovermögen</p>
              <p className="stat-value">{formatCurrency(latestNetWorth)}</p>
            </div>
            <div className={`p-3 rounded-full ${netWorthChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {netWorthChange >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
          <p className={`text-sm mt-2 ${netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netWorthChange >= 0 ? '+' : ''}{formatCurrency(netWorthChange)} ({netWorthChangePercent}%)
          </p>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Offene Aufgaben</p>
              <p className="stat-value">{tasks?.length || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {tasks?.filter(t => t.status === 'today').length || 0} für heute
          </p>
        </div>

        {/* Habits */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Habits heute</p>
              <p className="stat-value">0/{habits?.length || 0}</p>
            </div>
            <div className="p-3 rounded-full bg-pink-100">
              <CheckCircle className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">0% erledigt</p>
        </div>

        {/* Health */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Sleep Score</p>
              <p className="stat-value">{garminStats?.sleep_score || '-'}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {garminStats?.steps?.toLocaleString('de-DE') || '-'} Schritte gestern
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Prioritäten heute</h2>
            <a href="/productivity" className="text-sm text-primary-600 hover:text-primary-700">
              Alle anzeigen
            </a>
          </div>
          <div className="space-y-3">
            {tasks?.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">{task.title}</span>
                {task.due_date && (
                  <span className="ml-auto text-xs text-gray-500">
                    {format(new Date(task.due_date), 'd. MMM', { locale: de })}
                  </span>
                )}
              </div>
            ))}
            {(!tasks || tasks.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                Keine offenen Aufgaben
              </p>
            )}
          </div>
        </div>

        {/* Goals Progress */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Ziel-Fortschritt</h2>
            <a href="/goals" className="text-sm text-primary-600 hover:text-primary-700">
              Alle anzeigen
            </a>
          </div>
          <div className="space-y-4">
            {[
              { name: 'FIRE Progress', progress: 35, color: 'bg-wealth' },
              { name: 'Fitness Ziele', progress: 60, color: 'bg-health' },
              { name: 'Quartals OKRs', progress: 45, color: 'bg-goals' },
            ].map((goal) => (
              <div key={goal.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{goal.name}</span>
                  <span className="text-gray-500">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${goal.color} h-2 rounded-full transition-all`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
