import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  GarminDailyStats,
  DailyNutrition,
  DailyReadiness,
  Habit,
  HabitLog,
  Meeting,
  InboxItem,
  AIInsight,
  DailySnapshot,
  DailyLog,
} from '@/types'

// ─────────────────────────────────────────────────────────────
// Today's Date Helper
// ─────────────────────────────────────────────────────────────

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ─────────────────────────────────────────────────────────────
// Garmin Stats
// ─────────────────────────────────────────────────────────────

export function useGarminStats(date?: string) {
  const targetDate = date || getTodayISO()

  return useQuery({
    queryKey: ['garmin-stats', targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('garmin_daily_stats')
        .select('*')
        .eq('date', targetDate)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as GarminDailyStats | null
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Daily Readiness
// ─────────────────────────────────────────────────────────────

export function useDailyReadiness(date?: string) {
  const targetDate = date || getTodayISO()

  return useQuery({
    queryKey: ['daily-readiness', targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_readiness')
        .select('*')
        .eq('date', targetDate)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as DailyReadiness | null
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Habits with Today's Logs
// ─────────────────────────────────────────────────────────────

export function useTodayHabits() {
  const today = getTodayISO()

  return useQuery({
    queryKey: ['today-habits', today],
    queryFn: async () => {
      // Get active habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (habitsError) throw habitsError

      // Get today's logs
      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('date', today)

      if (logsError) throw logsError

      // Merge habits with their logs
      const logsMap = new Map(logs?.map(log => [log.habit_id, log]) || [])

      return (habits || []).map(habit => ({
        ...habit,
        today_log: logsMap.get(habit.id) || null,
        is_completed: logsMap.get(habit.id)?.is_completed || false,
      }))
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Today's Schedule (Meetings)
// ─────────────────────────────────────────────────────────────

export function useTodayMeetings() {
  const today = getTodayISO()

  return useQuery({
    queryKey: ['today-meetings', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`)
        .order('start_time')

      if (error) throw error
      return data as Meeting[]
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Today's Tasks (Due or Scheduled)
// ─────────────────────────────────────────────────────────────

export function useTodayTasks() {
  const today = getTodayISO()

  return useQuery({
    queryKey: ['today-tasks', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbox_items')
        .select('*')
        .or(`due_date.eq.${today},scheduled_date.eq.${today},status.eq.today`)
        .not('status', 'in', '("done","delegated")')
        .order('priority')
        .limit(10)

      if (error) throw error
      return data as InboxItem[]
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Quick Stats
// ─────────────────────────────────────────────────────────────

export function useQuickStats() {
  return useQuery({
    queryKey: ['quick-stats'],
    queryFn: async () => {
      // Get latest net worth snapshot
      const { data: snapshot, error: snapshotError } = await supabase
        .from('daily_snapshots')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (snapshotError && snapshotError.code !== 'PGRST116') throw snapshotError

      // Get inbox count
      const { count: inboxCount, error: inboxError } = await supabase
        .from('inbox_items')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("done","delegated")')

      if (inboxError) throw inboxError

      // Get overdue count
      const today = getTodayISO()
      const { count: overdueCount, error: overdueError } = await supabase
        .from('inbox_items')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', today)
        .not('status', 'in', '("done","delegated")')

      if (overdueError) throw overdueError

      // Get open tickets count
      const { count: ticketsCount, error: ticketsError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("abgeschlossen","storniert")')

      if (ticketsError) throw ticketsError

      // Get active goals count
      const { count: goalsCount, error: goalsError } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .in('status', ['not_started', 'in_progress'])

      if (goalsError) throw goalsError

      // Get user preferences for FIRE calculation
      const { data: prefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('fire_target_amount, fire_withdrawal_rate, fire_monthly_expenses')
        .limit(1)
        .single()

      if (prefsError && prefsError.code !== 'PGRST116') throw prefsError

      // Calculate FIRE progress
      const netWorth = snapshot?.net_worth || 0
      const fireTarget = prefs?.fire_target_amount || 0
      const fireProgress = fireTarget > 0 ? (netWorth / fireTarget) * 100 : 0

      return {
        net_worth: netWorth,
        total_assets: snapshot?.total_assets || 0,
        total_liabilities: snapshot?.total_liabilities || 0,
        cash_value: snapshot?.cash_value || 0,
        investment_value: snapshot?.investment_value || 0,
        property_value: snapshot?.property_value || 0,
        inbox_count: inboxCount || 0,
        overdue_count: overdueCount || 0,
        open_tickets: ticketsCount || 0,
        active_goals: goalsCount || 0,
        fire_progress: Math.min(100, fireProgress),
        fire_target: fireTarget,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ─────────────────────────────────────────────────────────────
// AI Insights (Pending)
// ─────────────────────────────────────────────────────────────

export function usePendingInsights(limit = 10) {
  return useQuery({
    queryKey: ['pending-insights', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .or('is_read.eq.false,and(priority.eq.action_required,is_actioned.eq.false)')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Sort by priority
      return (data as AIInsight[]).sort((a, b) => {
        const priorityOrder = { action_required: 1, warning: 2, info: 3 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 4
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 4
        return aPriority - bPriority
      })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Alerts (High Priority Insights)
// ─────────────────────────────────────────────────────────────

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .in('priority', ['action_required', 'warning'])
        .eq('is_actioned', false)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      return data as AIInsight[]
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Daily Log
// ─────────────────────────────────────────────────────────────

export function useDailyLog(date?: string) {
  const targetDate = date || getTodayISO()

  return useQuery({
    queryKey: ['daily-log', targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('date', targetDate)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as DailyLog | null
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Realtime Subscriptions
// ─────────────────────────────────────────────────────────────

export function useDashboardRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Subscribe to habit_logs changes
    const habitLogsChannel = supabase
      .channel('habit-logs-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['today-habits'] })
        }
      )
      .subscribe()

    // Subscribe to ai_insights changes
    const insightsChannel = supabase
      .channel('insights-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_insights' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-insights'] })
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
        }
      )
      .subscribe()

    // Subscribe to inbox_items changes
    const inboxChannel = supabase
      .channel('inbox-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inbox_items' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['today-tasks'] })
          queryClient.invalidateQueries({ queryKey: ['quick-stats'] })
        }
      )
      .subscribe()

    // Subscribe to meetings changes
    const meetingsChannel = supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['today-meetings'] })
        }
      )
      .subscribe()

    // Subscribe to daily_snapshots for net worth updates
    const snapshotsChannel = supabase
      .channel('snapshots-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'daily_snapshots' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['quick-stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(habitLogsChannel)
      supabase.removeChannel(insightsChannel)
      supabase.removeChannel(inboxChannel)
      supabase.removeChannel(meetingsChannel)
      supabase.removeChannel(snapshotsChannel)
    }
  }, [queryClient])
}

// ─────────────────────────────────────────────────────────────
// Toggle Habit Completion
// ─────────────────────────────────────────────────────────────

export function useToggleHabit() {
  const queryClient = useQueryClient()
  const today = getTodayISO()

  return useMutation({
    mutationFn: async ({
      habitId,
      isCompleted,
      value,
    }: {
      habitId: string
      isCompleted: boolean
      value?: number
    }) => {
      // Check if a log exists for today
      const { data: existingLog, error: fetchError } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('habit_id', habitId)
        .eq('date', today)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('habit_logs')
          .update({
            is_completed: isCompleted,
            value: value ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLog.id)

        if (error) throw error
      } else {
        // Create new log
        const { error } = await supabase.from('habit_logs').insert({
          habit_id: habitId,
          date: today,
          is_completed: isCompleted,
          value: value ?? null,
        })

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-habits'] })
    },
  })
}
