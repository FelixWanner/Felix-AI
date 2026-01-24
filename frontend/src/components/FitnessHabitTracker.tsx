import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle, XCircle, Plus, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react'

interface FitnessHabit {
  id: string
  user_id: string
  habit_name: string
  habit_type: 'good' | 'bad'
  description: string | null
}

interface FitnessHabitLog {
  id?: string
  user_id: string
  habit_id: string
  date: string
  completed: boolean
  notes: string | null
}

interface Props {
  date: Date
}

export default function FitnessHabitTracker({ date }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // All habits from database
  const [allHabits, setAllHabits] = useState<FitnessHabit[]>([])
  const [habitLogs, setHabitLogs] = useState<FitnessHabitLog[]>([])

  // Form state
  const [showGoodForm, setShowGoodForm] = useState(false)
  const [showBadForm, setShowBadForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitDescription, setNewHabitDescription] = useState('')

  const dateStr = format(date, 'yyyy-MM-dd')

  useEffect(() => {
    if (user) {
      loadHabits()
      loadHabitLogs()
    }
  }, [user, date])

  async function loadHabits() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('fitness_habits')
        .select('*')
        .eq('user_id', user.id)
        .order('habit_name')

      if (error) throw error
      setAllHabits(data || [])
    } catch (error) {
      console.error('Error loading habits:', error)
    }
  }

  async function loadHabitLogs() {
    if (!user) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('fitness_habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)

      if (error) throw error
      setHabitLogs(data || [])
    } catch (error) {
      console.error('Error loading habit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddHabit(habitType: 'good' | 'bad') {
    if (!user || !newHabitName.trim()) {
      alert('Bitte gib einen Gewohnheitsnamen ein')
      return
    }

    try {
      const { data, error } = await supabase
        .from('fitness_habits')
        .insert({
          user_id: user.id,
          habit_name: newHabitName.trim(),
          habit_type: habitType,
          description: newHabitDescription.trim() || null
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          alert('Diese Gewohnheit existiert bereits')
        } else {
          throw error
        }
        return
      }

      // Automatically log it for today
      await toggleHabit(data.id, true)

      // Reset form
      setNewHabitName('')
      setNewHabitDescription('')
      setShowGoodForm(false)
      setShowBadForm(false)

      await loadHabits()
    } catch (error) {
      console.error('Error adding habit:', error)
      alert('Fehler beim Hinzufügen der Gewohnheit')
    }
  }

  async function handleDeleteHabit(habitId: string) {
    if (!confirm('Gewohnheit wirklich löschen? Alle zugehörigen Logs werden ebenfalls gelöscht.')) return

    try {
      const { error } = await supabase
        .from('fitness_habits')
        .delete()
        .eq('id', habitId)

      if (error) throw error
      await loadHabits()
      await loadHabitLogs()
    } catch (error) {
      console.error('Error deleting habit:', error)
      alert('Fehler beim Löschen der Gewohnheit')
    }
  }

  async function toggleHabit(habitId: string, forceCompleted?: boolean) {
    if (!user) return

    try {
      const existingLog = habitLogs.find(log => log.habit_id === habitId)
      const newCompletedState = forceCompleted !== undefined ? forceCompleted : !existingLog?.completed

      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('fitness_habit_logs')
          .update({ completed: newCompletedState })
          .eq('id', existingLog.id)

        if (error) throw error
      } else {
        // Create new log
        const { error } = await supabase
          .from('fitness_habit_logs')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            date: dateStr,
            completed: newCompletedState,
            notes: null
          })

        if (error) throw error
      }

      await loadHabitLogs()
    } catch (error) {
      console.error('Error toggling habit:', error)
      alert('Fehler beim Aktualisieren der Gewohnheit')
    }
  }

  function isHabitCompleted(habitId: string): boolean {
    const log = habitLogs.find(l => l.habit_id === habitId)
    return log?.completed || false
  }

  const goodHabits = allHabits.filter(h => h.habit_type === 'good')
  const badHabits = allHabits.filter(h => h.habit_type === 'bad')

  const completedGoodHabits = goodHabits.filter(h => isHabitCompleted(h.id)).length
  const completedBadHabits = badHabits.filter(h => isHabitCompleted(h.id)).length

  return (
    <div className="space-y-6">
      {/* Good Habits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            Gute Gewohnheiten ({completedGoodHabits}/{goodHabits.length})
          </h2>
          <button
            onClick={() => setShowGoodForm(!showGoodForm)}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            {showGoodForm ? 'Abbrechen' : 'Hinzufügen'}
          </button>
        </div>

        {/* Add Good Habit Form */}
        {showGoodForm && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gewohnheit *
              </label>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. 10.000 Schritte, Dehnen, Eisbad"
                list="good-habits-suggestions"
              />
              <datalist id="good-habits-suggestions">
                {goodHabits.map(h => (
                  <option key={h.id} value={h.habit_name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Beschreibung (optional)
              </label>
              <input
                type="text"
                value={newHabitDescription}
                onChange={(e) => setNewHabitDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. Mindestens 10 Minuten"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleAddHabit('good')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>
          </div>
        )}

        {/* Good Habits List */}
        {loading ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">Lade...</div>
        ) : goodHabits.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Keine guten Gewohnheiten. Klicke auf "Hinzufügen", um zu starten.
          </div>
        ) : (
          <div className="space-y-2">
            {goodHabits.map((habit) => {
              const completed = isHabitCompleted(habit.id)
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className="flex-shrink-0"
                  >
                    {completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                  </button>

                  <div className="flex-1 cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                    <div className={`font-medium ${completed ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                      {habit.habit_name}
                    </div>
                    {habit.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {habit.description}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bad Habits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            Schlechte Gewohnheiten ({completedBadHabits}/{badHabits.length})
          </h2>
          <button
            onClick={() => setShowBadForm(!showBadForm)}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            {showBadForm ? 'Abbrechen' : 'Hinzufügen'}
          </button>
        </div>

        {/* Add Bad Habit Form */}
        {showBadForm && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schlechte Gewohnheit *
              </label>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. Alkohol, Süßigkeiten, Zu spät schlafen"
                list="bad-habits-suggestions"
              />
              <datalist id="bad-habits-suggestions">
                {badHabits.map(h => (
                  <option key={h.id} value={h.habit_name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Beschreibung (optional)
              </label>
              <input
                type="text"
                value={newHabitDescription}
                onChange={(e) => setNewHabitDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. Mehr als 1 Bier"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleAddHabit('bad')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>
          </div>
        )}

        {/* Bad Habits List */}
        {loading ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">Lade...</div>
        ) : badHabits.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Keine schlechten Gewohnheiten erfasst.
          </div>
        ) : (
          <div className="space-y-2">
            {badHabits.map((habit) => {
              const completed = isHabitCompleted(habit.id)
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className="flex-shrink-0"
                  >
                    {completed ? (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                  </button>

                  <div className="flex-1 cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                    <div className={`font-medium ${completed ? 'text-red-600 dark:text-red-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                      {habit.habit_name}
                    </div>
                    {habit.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {habit.description}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
