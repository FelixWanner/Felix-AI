import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import SupplementPeptideLog from '../components/SupplementPeptideLog'
import { useDashboardRealtime } from '@/hooks/useDashboard'
import {
  BookOpen,
  Calendar,
  Check,
  X,
  Lightbulb,
  AlertTriangle,
  Smile,
  ChevronLeft,
  ChevronRight,
  Pill,
  Moon,
  Zap,
  Brain,
  TrendingUp,
  Award,
  Flame,
  Trophy,
  ThumbsDown,
  Star,
} from 'lucide-react'

interface DailyLog {
  id?: string
  user_id: string
  date: string
  sleep_duration?: number
  energy_morning?: number
  stress_level?: number
  mood?: number
  modafinil_taken?: boolean
  top_lever?: string
  distraction?: string
  what_went_well?: string
  created_at?: string
  updated_at?: string
}

interface DailyOutcome {
  id?: string
  user_id: string
  date: string
  outcome_text: string
  is_non_negotiable: boolean
  why_important?: string
  completed: boolean
}

interface HabitDefinition {
  id: string
  user_id: string
  name: string
  description?: string
  category?: string
  target_value?: string
  is_active: boolean
  sort_order: number
  habit_type: 'good' | 'bad'
  points: number
}

interface UserStats {
  id: string
  user_id: string
  total_points: number
  current_level: number
  points_to_next_level: number
  longest_streak: number
  current_streak: number
  total_habits_completed: number
  total_outcomes_completed: number
}

interface HabitStreak {
  id: string
  user_id: string
  habit_id: string
  current_streak: number
  longest_streak: number
  last_completed_date?: string
}

interface DailyHabitLog {
  id?: string
  user_id: string
  habit_id: string
  date: string
  completed: boolean
  value?: string
  notes?: string
}

interface JournalPrompts {
  wichtigster_hebel?: string
  ablenkungen?: string
  was_war_gut?: string
}

export default function Journal() {
  // Enable realtime updates for cross-device sync
  useDashboardRealtime()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Daily Log State
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null)
  const [sleepHours, setSleepHours] = useState<number>(7)
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [stressLevel, setStressLevel] = useState<number>(3)
  const [mood, setMood] = useState<number>(3)
  const [modafinilTaken, setModafinilTaken] = useState<boolean>(false)

  // Daily Outcomes State
  const [outcomes, setOutcomes] = useState<DailyOutcome[]>([])
  const [newOutcome, setNewOutcome] = useState('')
  const [newOutcomeIsNonNegotiable, setNewOutcomeIsNonNegotiable] = useState(false)
  const [newOutcomeWhy, setNewOutcomeWhy] = useState('')

  // Habits State
  const [habits, setHabits] = useState<HabitDefinition[]>([])
  const [habitLogs, setHabitLogs] = useState<DailyHabitLog[]>([])

  // Gamification State
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [habitStreaks, setHabitStreaks] = useState<HabitStreak[]>([])

  // Journal Prompts State
  const [hebel, setHebel] = useState('')
  const [ablenkungen, setAblenkungen] = useState('')
  const [wasWarGut, setWasWarGut] = useState('')

  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr

  useEffect(() => {
    loadJournalData()
  }, [currentDate])

  async function loadJournalData() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load daily log
      const { data: logData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single()

      if (logData) {
        setDailyLog(logData)
        setSleepHours(logData.sleep_duration || 7)
        setEnergyLevel(logData.energy_morning || 3)
        setStressLevel(logData.stress_level || 3)
        setMood(logData.mood || 3)
        setModafinilTaken(logData.modafinil_taken || false)

        // Load journal prompts from dedicated columns
        setHebel(logData.top_lever || '')
        setAblenkungen(logData.distraction || '')
        setWasWarGut(logData.what_went_well || '')
      }

      // Load outcomes
      const { data: outcomesData } = await supabase
        .from('daily_outcomes')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .order('created_at', { ascending: true })

      setOutcomes(outcomesData || [])

      // Load habit definitions
      const { data: habitsData } = await supabase
        .from('habit_definitions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      setHabits(habitsData || [])

      // Load habit logs for this date
      const { data: logsData } = await supabase
        .from('daily_habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)

      setHabitLogs(logsData || [])

      // Load user stats
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setUserStats(statsData)

      // Load habit streaks
      const { data: streaksData } = await supabase
        .from('habit_streaks')
        .select('*')
        .eq('user_id', user.id)

      setHabitStreaks(streaksData || [])

    } catch (err) {
      console.error('Error loading journal data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveDailyLog() {
    try {
      setSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Sie müssen angemeldet sein')
        return
      }

      const logData = {
        user_id: user.id,
        date: dateStr,
        sleep_duration: sleepHours,
        energy_morning: energyLevel,
        stress_level: stressLevel,
        mood: mood,
        modafinil_taken: modafinilTaken,
        top_lever: hebel.trim() || null,
        distraction: ablenkungen.trim() || null,
        what_went_well: wasWarGut.trim() || null,
      }

      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from('daily_logs')
        .upsert(logData, { onConflict: 'user_id,date' })
        .select()
        .single()

      if (error) {
        console.error('Error saving daily log:', error)
        alert('Fehler beim Speichern: ' + error.message)
        throw error
      }
      setDailyLog(data)

      alert('Erfolgreich gespeichert!')

    } catch (err) {
      console.error('Error saving daily log:', err)
    } finally {
      setSaving(false)
    }
  }

  async function addOutcome() {
    if (!newOutcome.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (outcomes.length >= 3) {
        alert('Maximal 3 Outcomes pro Tag')
        return
      }

      const outcomeData: DailyOutcome = {
        user_id: user.id,
        date: dateStr,
        outcome_text: newOutcome.trim(),
        is_non_negotiable: newOutcomeIsNonNegotiable,
        why_important: newOutcomeWhy.trim() || undefined,
        completed: false,
      }

      const { data, error } = await supabase
        .from('daily_outcomes')
        .insert([outcomeData])
        .select()
        .single()

      if (error) throw error

      setOutcomes([...outcomes, data])
      setNewOutcome('')
      setNewOutcomeIsNonNegotiable(false)
      setNewOutcomeWhy('')
    } catch (err) {
      console.error('Error adding outcome:', err)
      alert('Fehler beim Hinzufügen des Outcomes')
    }
  }

  async function toggleOutcome(outcome: DailyOutcome) {
    try {
      const { error } = await supabase
        .from('daily_outcomes')
        .update({ completed: !outcome.completed })
        .eq('id', outcome.id)

      if (error) throw error

      setOutcomes(
        outcomes.map((o) =>
          o.id === outcome.id ? { ...o, completed: !o.completed } : o
        )
      )
    } catch (err) {
      console.error('Error toggling outcome:', err)
    }
  }

  async function deleteOutcome(outcomeId: string) {
    try {
      const { error } = await supabase
        .from('daily_outcomes')
        .delete()
        .eq('id', outcomeId)

      if (error) throw error

      setOutcomes(outcomes.filter((o) => o.id !== outcomeId))
    } catch (err) {
      console.error('Error deleting outcome:', err)
    }
  }

  async function toggleHabit(habit: HabitDefinition) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const existingLog = habitLogs.find((l) => l.habit_id === habit.id)
      const newCompletedState = existingLog ? !existingLog.completed : true

      if (existingLog) {
        // Toggle existing
        const { error } = await supabase
          .from('daily_habit_logs')
          .update({ completed: newCompletedState })
          .eq('id', existingLog.id)

        if (error) throw error

        setHabitLogs(
          habitLogs.map((l) =>
            l.id === existingLog.id ? { ...l, completed: newCompletedState } : l
          )
        )
      } else {
        // Create new log
        const logData: DailyHabitLog = {
          user_id: user.id,
          habit_id: habit.id,
          date: dateStr,
          completed: true,
        }

        const { data, error } = await supabase
          .from('daily_habit_logs')
          .insert([logData])
          .select()
          .single()

        if (error) throw error

        setHabitLogs([...habitLogs, data])
      }

      // Call database function to update streaks and points
      if (newCompletedState) {
        await supabase.rpc('update_habit_streak', {
          p_user_id: user.id,
          p_habit_id: habit.id,
          p_date: dateStr,
          p_completed: true
        })

        // Reload stats and streaks
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setUserStats(statsData)

        const { data: streaksData } = await supabase
          .from('habit_streaks')
          .select('*')
          .eq('user_id', user.id)

        setHabitStreaks(streaksData || [])
      }

    } catch (err) {
      console.error('Error toggling habit:', err)
    }
  }

  function getHabitCompleted(habitId: string): boolean {
    const log = habitLogs.find((l) => l.habit_id === habitId)
    return log?.completed || false
  }

  function getHabitStreak(habitId: string): HabitStreak | null {
    return habitStreaks.find((s) => s.habit_id === habitId) || null
  }

  function navigateDate(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tagebuch</h1>
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  const goodHabits = habits.filter((h) => h.habit_type === 'good')
  const badHabits = habits.filter((h) => h.habit_type === 'bad')
  const completedGoodHabits = goodHabits.filter((h) => getHabitCompleted(h.id)).length
  const completedBadHabits = badHabits.filter((h) => getHabitCompleted(h.id)).length
  const completedOutcomes = outcomes.filter((o) => o.completed).length

  // Calculate progress percentage for level
  const levelProgress = userStats ? ((100 - userStats.points_to_next_level) / 100) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Tagebuch
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tägliche Reflexion, Gewohnheiten & Ziele
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentDate, 'EEEE, dd. MMMM yyyy', { locale: de })}
            </div>
            {isToday && (
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Heute
              </div>
            )}
          </div>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gamification Stats */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userStats.current_level}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Fortschritt</span>
                <span>{100 - userStats.points_to_next_level}/100</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Punkte</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats.total_points}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Aktueller Streak</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats.current_streak} Tage
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Bester Streak</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userStats.longest_streak} Tage
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Schlaf</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {sleepHours}h
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Energie</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {energyLevel}/5
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Stress</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {stressLevel}/5
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Smile className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Stimmung</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {mood}/5
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Modafinil</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {modafinilTaken ? 'Ja' : 'Nein'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Check-in & Outcomes */}
        <div className="space-y-6">
          {/* Daily Check-in */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Täglicher Check-in
            </h2>

            <div className="space-y-4">
              {/* Sleep */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schlaf (Stunden): {sleepHours}
                </label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Energy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Energie-Level: {energyLevel}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Stress */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stress-Level: {stressLevel}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stimmung: {mood}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Modafinil */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="modafinil"
                  checked={modafinilTaken}
                  onChange={(e) => setModafinilTaken(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="modafinil" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modafinil genommen
                </label>
              </div>

              <button
                onClick={saveDailyLog}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? 'Wird gespeichert...' : 'Speichern'}
              </button>
            </div>
          </div>

          {/* Top 3 Outcomes */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top 3 Outcomes ({completedOutcomes}/{outcomes.length})
            </h2>

            <div className="space-y-3 mb-4">
              {outcomes.map((outcome) => (
                <div
                  key={outcome.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <button
                    onClick={() => toggleOutcome(outcome)}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      outcome.completed
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {outcome.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className={`font-medium ${outcome.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {outcome.outcome_text}
                      {outcome.is_non_negotiable && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                          Non-Negotiable
                        </span>
                      )}
                    </div>
                    {outcome.why_important && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Warum: {outcome.why_important}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteOutcome(outcome.id!)}
                    className="flex-shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              ))}
            </div>

            {outcomes.length < 3 && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  placeholder="Neues Outcome..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyDown={(e) => e.key === 'Enter' && addOutcome()}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="non-negotiable"
                    checked={newOutcomeIsNonNegotiable}
                    onChange={(e) => setNewOutcomeIsNonNegotiable(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="non-negotiable" className="text-sm text-gray-700 dark:text-gray-300">
                    Non-Negotiable
                  </label>
                </div>
                {newOutcomeIsNonNegotiable && (
                  <input
                    type="text"
                    value={newOutcomeWhy}
                    onChange={(e) => setNewOutcomeWhy(e.target.value)}
                    placeholder="Warum ist es wichtig?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                )}
                <button onClick={addOutcome} className="btn-secondary w-full">
                  Outcome hinzufügen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Habits & Journal */}
        <div className="space-y-6">
          {/* Good Habits */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
              Gute Gewohnheiten ({completedGoodHabits}/{goodHabits.length})
            </h2>

            <div className="space-y-2">
              {goodHabits.map((habit) => {
                const completed = getHabitCompleted(habit.id)
                const streak = getHabitStreak(habit.id)
                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => toggleHabit(habit)}
                  >
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        completed
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {completed && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {habit.name}
                      </div>
                      {habit.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {habit.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {streak && streak.current_streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <Flame className="w-4 h-4" />
                          <span className="text-sm font-semibold">{streak.current_streak}</span>
                        </div>
                      )}
                      <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                        +{habit.points}
                      </div>
                      {habit.target_value && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {habit.target_value}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {goodHabits.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Keine guten Gewohnheiten. Standard-Gewohnheiten werden beim ersten Login erstellt.
              </div>
            )}
          </div>

          {/* Bad Habits */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              Schlechte Gewohnheiten ({completedBadHabits}/{badHabits.length})
            </h2>

            <div className="space-y-2">
              {badHabits.map((habit) => {
                const completed = getHabitCompleted(habit.id)
                const streak = getHabitStreak(habit.id)
                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => toggleHabit(habit)}
                  >
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        completed
                          ? 'bg-red-600 border-red-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {completed && <X className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${completed ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {habit.name}
                      </div>
                      {habit.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {habit.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {completed && (
                        <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                          {habit.points}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {badHabits.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Keine schlechten Gewohnheiten erfasst.
              </div>
            )}
          </div>

          {/* Journal Prompts */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Journal-Prompts
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Was war heute der wichtigste Hebel?
                </label>
                <textarea
                  value={hebel}
                  onChange={(e) => setHebel(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Der eine Faktor, der am meisten bewegt hat..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Welche Ablenkungen gab es?
                </label>
                <textarea
                  value={ablenkungen}
                  onChange={(e) => setAblenkungen(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Was hat dich vom Wesentlichen abgehalten..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Was war heute gut?
                </label>
                <textarea
                  value={wasWarGut}
                  onChange={(e) => setWasWarGut(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Erfolge, schöne Momente, Dankbarkeit..."
                />
              </div>

              <button
                onClick={saveDailyLog}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? 'Wird gespeichert...' : 'Journal speichern'}
              </button>
            </div>
          </div>

          {/* Supplement & Peptide Log */}
          <SupplementPeptideLog date={currentDate} />
        </div>
      </div>
    </div>
  )
}
