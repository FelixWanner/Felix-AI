import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { format, startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth, startOfWeek, endOfWeek, getQuarter, getWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { Target, Calendar, TrendingUp, AlertCircle, Plus, CheckCircle, Edit2, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import GoalForm from '@/components/GoalForm'

type Goal = Tables<'goals'>
type Task = Tables<'inbox_items'>

type TimeframeTab = 'yearly' | 'quarterly' | 'monthly' | 'weekly'

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TimeframeTab>('weekly')
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeframeTab>('weekly')
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const currentYear = new Date().getFullYear()
  const currentQuarter = getQuarter(new Date())
  const currentMonth = new Date().getMonth() + 1
  const currentWeek = getWeek(new Date(), { locale: de })

  useEffect(() => {
    loadGoalsData()
  }, [])

  async function loadGoalsData() {
    try {
      setLoading(true)
      setError(null)

      // Load active goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .in('status', ['active', 'in_progress'])
        .order('priority', { ascending: true })

      if (goalsError) throw goalsError

      // Load high-priority tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('priority', 3)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(10)

      if (tasksError) throw tasksError

      setGoals(goalsData || [])
      setTasks(tasksData || [])
    } catch (err) {
      console.error('Error loading goals data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load goals data')
    } finally {
      setLoading(false)
    }
  }

  const filterGoalsByTimeframe = (timeframe: string) => {
    const now = new Date()

    return goals.filter(g => {
      if (g.timeframe !== timeframe) return false

      switch (timeframe) {
        case 'yearly':
          return g.year === currentYear
        case 'quarterly':
          return g.year === currentYear && g.quarter === currentQuarter
        case 'monthly':
          return g.year === currentYear && g.month === currentMonth
        case 'weekly':
          return g.year === currentYear && g.week === currentWeek
        default:
          return false
      }
    })
  }

  const yearlyGoals = filterGoalsByTimeframe('yearly')
  const quarterlyGoals = filterGoalsByTimeframe('quarterly')
  const monthlyGoals = filterGoalsByTimeframe('monthly')
  const weeklyGoals = filterGoalsByTimeframe('weekly')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'active':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
    }
  }

  const renderGoalCard = (goal: Goal) => {
    const progressPercent = goal.progress_percent || 0
    const isOnTrack = progressPercent >= 50 && goal.status !== 'completed'

    return (
      <div
        key={goal.id}
        className="p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {goal.title}
              </h3>
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(goal.status)}`}>
                {goal.status}
              </span>
            </div>
            {goal.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 ml-3">
            <button
              onClick={() => handleEditGoal(goal)}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="Bearbeiten"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteGoal(goal.id)}
              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              title="Löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Fortschritt</span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                progressPercent === 100
                  ? 'bg-green-600 dark:bg-green-500'
                  : isOnTrack
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : 'bg-yellow-600 dark:bg-yellow-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Goal Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {goal.area && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Bereich:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">{goal.area}</span>
            </div>
          )}
          {goal.start_date && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Start:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {format(new Date(goal.start_date), 'dd.MM.yyyy', { locale: de })}
              </span>
            </div>
          )}
          {goal.end_date && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Ende:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {format(new Date(goal.end_date), 'dd.MM.yyyy', { locale: de })}
              </span>
            </div>
          )}
          {goal.target_value && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Ziel:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {goal.target_value} {goal.unit || ''}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    )
  }

  const getCurrentTabGoals = () => {
    switch (activeTab) {
      case 'yearly':
        return yearlyGoals
      case 'quarterly':
        return quarterlyGoals
      case 'monthly':
        return monthlyGoals
      case 'weekly':
        return weeklyGoals
    }
  }

  const getCurrentTabTitle = () => {
    switch (activeTab) {
      case 'yearly':
        return `Jahresziele ${currentYear}`
      case 'quarterly':
        return `Quartalsziele Q${currentQuarter} ${currentYear}`
      case 'monthly':
        return `Monatsziele ${format(new Date(), 'MMMM yyyy', { locale: de })}`
      case 'weekly':
        return `Wochenziele KW${currentWeek} ${currentYear}`
    }
  }

  const getTimeframeLabel = (tf: TimeframeTab) => {
    switch (tf) {
      case 'yearly':
        return 'Jahresziel'
      case 'quarterly':
        return 'Quartalsziel'
      case 'monthly':
        return 'Monatsziel'
      case 'weekly':
        return 'Wochenziel'
    }
  }

  const handleOpenAddModal = (timeframe: TimeframeTab) => {
    setCurrentTimeframe(timeframe)
    setShowAddModal(true)
  }

  const handleGoalCreated = () => {
    setShowAddModal(false)
    setEditingGoal(null)
    loadGoalsData()
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setCurrentTimeframe(goal.timeframe as TimeframeTab)
    setShowAddModal(true)
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Möchten Sie dieses Ziel wirklich löschen?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)

      if (error) {
        console.error('Error deleting goal:', error)
        alert('Fehler beim Löschen des Ziels: ' + error.message)
        return
      }

      await loadGoalsData()
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  const handleCloseGoalModal = () => {
    setShowAddModal(false)
    setEditingGoal(null)
  }

  const tabGoals = getCurrentTabGoals()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Target className="w-8 h-8" />
          Goals & Ziele
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Hierarchische Zielplanung: Jahr, Quartal, Monat, Woche
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Jahresziele
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {yearlyGoals.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentYear}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Quartalsziele
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {quarterlyGoals.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Q{currentQuarter} {currentYear}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Monatsziele
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {monthlyGoals.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {format(new Date(), 'MMMM', { locale: de })}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Wochenziele
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {weeklyGoals.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            KW{currentWeek}
          </div>
        </div>
      </div>

      {/* Timeframe Tabs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 flex-1">
            <button
              onClick={() => setActiveTab('yearly')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'yearly'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Jahr ({yearlyGoals.length})
            </button>
            <button
              onClick={() => setActiveTab('quarterly')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'quarterly'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Quartal ({quarterlyGoals.length})
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'monthly'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Monat ({monthlyGoals.length})
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'weekly'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Woche ({weeklyGoals.length})
            </button>
          </div>
          <button
            onClick={() => handleOpenAddModal(activeTab)}
            className="btn-primary text-sm flex items-center gap-2 ml-4"
          >
            <Plus className="w-4 h-4" />
            Neues {getTimeframeLabel(activeTab)}
          </button>
        </div>

        {/* Tab Content */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {getCurrentTabTitle()}
          </h3>

          {tabGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Keine Ziele für diesen Zeitraum. Erstelle ein neues Ziel!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tabGoals.map(renderGoalCard)}
            </div>
          )}
        </div>
      </div>

      {/* High-Priority Tasks Widget */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Wichtige Aufgaben (High Priority)
        </h2>

        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Keine wichtigen Aufgaben. Alles erledigt!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date()
              const isDueToday = task.due_date && format(new Date(task.due_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg flex items-center justify-between ${
                    isOverdue
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : isDueToday
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {task.description}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Überfällig
                        </span>
                      )}
                      {isDueToday && !isOverdue && (
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          Heute fällig
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseGoalModal}
        title={editingGoal ? "Ziel bearbeiten" : `Neues ${getTimeframeLabel(currentTimeframe)}`}
      >
        <GoalForm
          goal={editingGoal}
          timeframe={currentTimeframe}
          onSuccess={handleGoalCreated}
          onCancel={handleCloseGoalModal}
        />
      </Modal>
    </div>
  )
}
