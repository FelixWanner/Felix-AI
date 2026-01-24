import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

type GarminDailyStats = Tables<'garmin_daily_stats'>
type Habit = Tables<'habits'>
type Workout = Tables<'workouts'>

export default function Health() {
  const [garminStats, setGarminStats] = useState<GarminDailyStats | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHealthData()
  }, [])

  async function loadHealthData() {
    try {
      setLoading(true)
      setError(null)

      // Load latest Garmin stats
      const { data: garminData, error: garminError } = await supabase
        .from('garmin_daily_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (garminError) throw garminError

      // Load active habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (habitsError) throw habitsError

      // Load recent workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false })
        .limit(5)

      if (workoutsError) throw workoutsError

      setGarminStats(garminData)
      setHabits(habitsData || [])
      setRecentWorkouts(workoutsData || [])
    } catch (err) {
      console.error('Error loading health data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load health data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health</h1>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health</h1>
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Habits, Ernährung & Training
        </p>
      </div>

      {/* Garmin Stats Overview */}
      {garminStats && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Today's Metrics
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({format(new Date(garminStats.date), 'dd.MM.yyyy', { locale: de })})
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Steps
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {garminStats.steps?.toLocaleString('de-DE') || '-'}
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Sleep Score
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {garminStats.sleep_score || '-'}
              </div>
              {garminStats.sleep_duration_minutes && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.floor(garminStats.sleep_duration_minutes / 60)}h {garminStats.sleep_duration_minutes % 60}m
                </div>
              )}
            </div>

            <div className="card">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Body Battery
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {garminStats.body_battery_end || '-'}
              </div>
              {garminStats.body_battery_start && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Start: {garminStats.body_battery_start}
                </div>
              )}
            </div>

            <div className="card">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Avg Stress
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {garminStats.stress_avg || '-'}
              </div>
              {garminStats.stress_max && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Max: {garminStats.stress_max}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sleep Breakdown */}
      {garminStats && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Sleep Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Deep Sleep</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {garminStats.deep_sleep_minutes ? `${garminStats.deep_sleep_minutes} min` : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Light Sleep</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {garminStats.light_sleep_minutes ? `${garminStats.light_sleep_minutes} min` : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">REM Sleep</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {garminStats.rem_sleep_minutes ? `${garminStats.rem_sleep_minutes} min` : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Awake</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {garminStats.awake_minutes ? `${garminStats.awake_minutes} min` : '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Habits */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Active Habits
        </h2>
        {habits.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No active habits. Create habits to track your progress.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {habit.name}
                    </div>
                    {habit.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {habit.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {habit.frequency}
                      {habit.target_value && ` • Target: ${habit.target_value} ${habit.unit || ''}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Workouts
          </h2>
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {workout.type || 'Workout'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(workout.date), 'dd.MM.yyyy', { locale: de })}
                      {workout.duration_minutes && ` • ${workout.duration_minutes} min`}
                      {workout.calories_burned && ` • ${workout.calories_burned} kcal`}
                    </div>
                  </div>
                  <div className="text-right">
                    {workout.avg_hr && (
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Avg HR: {workout.avg_hr} bpm
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
