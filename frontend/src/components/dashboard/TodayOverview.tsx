import { useMemo } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import clsx from 'clsx'
import {
  SunIcon,
  MoonIcon,
  HeartIcon,
  BoltIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'
import {
  useGarminStats,
  useDailyReadiness,
  useTodayHabits,
  useTodayMeetings,
  useTodayTasks,
} from '@/hooks/useDashboard'

// ─────────────────────────────────────────────────────────────
// Garmin Stats Card
// ─────────────────────────────────────────────────────────────

function GarminStatsCard() {
  const { data: garmin, isLoading } = useGarminStats()
  const { data: readiness } = useDailyReadiness()

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="card-body">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const sleepHours = garmin?.sleep_duration_minutes
    ? (garmin.sleep_duration_minutes / 60).toFixed(1)
    : null

  const sleepQuality = garmin?.sleep_score
    ? garmin.sleep_score >= 80
      ? 'excellent'
      : garmin.sleep_score >= 60
      ? 'good'
      : garmin.sleep_score >= 40
      ? 'fair'
      : 'poor'
    : null

  const sleepQualityColors = {
    excellent: 'text-green-600 dark:text-green-400',
    good: 'text-blue-600 dark:text-blue-400',
    fair: 'text-yellow-600 dark:text-yellow-400',
    poor: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Garmin Stats
        </h3>
        {readiness && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Readiness
            </span>
            <span
              className={clsx(
                'text-lg font-bold',
                readiness.readiness_score && readiness.readiness_score >= 70
                  ? 'text-green-600 dark:text-green-400'
                  : readiness.readiness_score && readiness.readiness_score >= 50
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {readiness.readiness_score || '-'}%
            </span>
          </div>
        )}
      </div>
      <div className="card-body">
        {!garmin ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Keine Garmin-Daten für heute verfügbar
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Sleep */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MoonIcon className="h-5 w-5 text-indigo-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Schlaf
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sleepHours || '-'}
                </span>
                <span className="text-sm text-gray-500">Std</span>
              </div>
              {sleepQuality && (
                <span className={clsx('text-xs', sleepQualityColors[sleepQuality])}>
                  Score: {garmin.sleep_score}
                </span>
              )}
            </div>

            {/* Body Battery */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BoltIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Body Battery
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {garmin.body_battery_start || '-'}
                </span>
                <span className="text-sm text-gray-500">%</span>
              </div>
              {garmin.body_battery_charged && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  +{garmin.body_battery_charged} geladen
                </span>
              )}
            </div>

            {/* Stress */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HeartIcon className="h-5 w-5 text-red-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Stress
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {garmin.stress_avg || '-'}
                </span>
                <span className="text-sm text-gray-500">avg</span>
              </div>
              {garmin.resting_hr && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Ruhe-HF: {garmin.resting_hr}
                </span>
              )}
            </div>

            {/* HRV */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <SunIcon className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  HRV
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {garmin.hrv_value || '-'}
                </span>
                <span className="text-sm text-gray-500">ms</span>
              </div>
              {garmin.hrv_status && (
                <span
                  className={clsx(
                    'text-xs',
                    garmin.hrv_status === 'high'
                      ? 'text-green-600 dark:text-green-400'
                      : garmin.hrv_status === 'normal'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {garmin.hrv_status}
                </span>
              )}
            </div>
          </div>
        )}

        {readiness?.recommendation && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Empfehlung:</strong> {readiness.recommendation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Habits Card
// ─────────────────────────────────────────────────────────────

function HabitsCard() {
  const { data: habits, isLoading } = useTodayHabits()

  const { completed, total, percentage } = useMemo(() => {
    if (!habits) return { completed: 0, total: 0, percentage: 0 }
    const total = habits.length
    const completed = habits.filter(h => h.is_completed).length
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [habits])

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="card-body">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Habits
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completed}/{total}
          </span>
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-health rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <div className="card-body">
        {!habits?.length ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Keine Habits definiert
          </p>
        ) : (
          <ul className="space-y-2">
            {habits.slice(0, 8).map(habit => (
              <li
                key={habit.id}
                className={clsx(
                  'flex items-center justify-between p-2 rounded-lg transition-colors',
                  habit.is_completed
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-gray-50 dark:bg-gray-800/50'
                )}
              >
                <div className="flex items-center gap-3">
                  {habit.is_completed ? (
                    <CheckCircleSolidIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <span
                    className={clsx(
                      'text-sm',
                      habit.is_completed
                        ? 'text-gray-500 dark:text-gray-400 line-through'
                        : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {habit.name}
                  </span>
                </div>
                {habit.target_value && habit.unit && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {habit.today_log?.value || 0}/{habit.target_value} {habit.unit}
                  </span>
                )}
              </li>
            ))}
            {habits.length > 8 && (
              <li className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                +{habits.length - 8} weitere
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Schedule Card
// ─────────────────────────────────────────────────────────────

function ScheduleCard() {
  const { data: meetings, isLoading: meetingsLoading } = useTodayMeetings()
  const { data: tasks, isLoading: tasksLoading } = useTodayTasks()

  const isLoading = meetingsLoading || tasksLoading

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="card-body">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Heute
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {format(now, "EEEE, d. MMMM", { locale: de })}
        </p>
      </div>
      <div className="card-body space-y-4">
        {/* Meetings */}
        {meetings && meetings.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Termine
            </h4>
            <ul className="space-y-2">
              {meetings.map(meeting => (
                <li
                  key={meeting.id}
                  className="flex items-start gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {meeting.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {meeting.start_time &&
                        format(new Date(meeting.start_time), 'HH:mm')}
                      {meeting.duration_minutes && ` (${meeting.duration_minutes} min)`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tasks */}
        {tasks && tasks.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Aufgaben
            </h4>
            <ul className="space-y-2">
              {tasks.slice(0, 5).map(task => (
                <li
                  key={task.id}
                  className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {task.title}
                    </p>
                    {task.estimated_minutes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ~{task.estimated_minutes} min
                      </p>
                    )}
                  </div>
                  {task.priority && task.priority <= 2 && (
                    <span className="badge-danger text-xs">P{task.priority}</span>
                  )}
                </li>
              ))}
              {tasks.length > 5 && (
                <li className="text-center text-sm text-gray-500 dark:text-gray-400 pt-1">
                  +{tasks.length - 5} weitere
                </li>
              )}
            </ul>
          </div>
        )}

        {(!meetings || meetings.length === 0) && (!tasks || tasks.length === 0) && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Keine Termine oder Aufgaben für heute
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function TodayOverview() {
  return (
    <div className="space-y-6">
      <GarminStatsCard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitsCard />
        <ScheduleCard />
      </div>
    </div>
  )
}
