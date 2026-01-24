// ═══════════════════════════════════════════════════════════════
// Life OS - Goals Module Domain Types
// ═══════════════════════════════════════════════════════════════

import { Tables, InsertTables, UpdateTables, Json } from './database'

// ─────────────────────────────────────────────────────────────
// Base Types (from Supabase)
// ─────────────────────────────────────────────────────────────

export type Goal = Tables<'goals'>
export type GoalInsert = InsertTables<'goals'>
export type GoalUpdate = UpdateTables<'goals'>

export type GoalKeyResult = Tables<'goal_key_results'>
export type GoalKeyResultInsert = InsertTables<'goal_key_results'>
export type GoalKeyResultUpdate = UpdateTables<'goal_key_results'>

export type GoalCheckin = Tables<'goal_checkins'>
export type GoalCheckinInsert = InsertTables<'goal_checkins'>

export type DailyLog = Tables<'daily_logs'>
export type DailyLogInsert = InsertTables<'daily_logs'>
export type DailyLogUpdate = UpdateTables<'daily_logs'>

export type WeeklyReview = Tables<'weekly_reviews'>
export type WeeklyReviewInsert = InsertTables<'weekly_reviews'>
export type WeeklyReviewUpdate = UpdateTables<'weekly_reviews'>

// AI Copilot types (related to goals)
export type AIInsight = Tables<'ai_insights'>
export type TelegramMessage = Tables<'telegram_messages'>
export type TelegramReminder = Tables<'telegram_reminders'>

// ─────────────────────────────────────────────────────────────
// Enums & Constants
// ─────────────────────────────────────────────────────────────

export const Timeframes = {
  YEAR: 'year',
  QUARTER: 'quarter',
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
} as const

export type Timeframe = (typeof Timeframes)[keyof typeof Timeframes]

export const GoalAreas = {
  WEALTH: 'wealth',
  HEALTH: 'health',
  CAREER: 'career',
  RELATIONSHIPS: 'relationships',
  PERSONAL_GROWTH: 'personal_growth',
  LIFESTYLE: 'lifestyle',
} as const

export type GoalArea = (typeof GoalAreas)[keyof typeof GoalAreas]

export const GoalStatuses = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DEFERRED: 'deferred',
} as const

export type GoalStatus = (typeof GoalStatuses)[keyof typeof GoalStatuses]

export const TargetTypes = {
  BOOLEAN: 'boolean',
  NUMERIC: 'numeric',
  MILESTONE: 'milestone',
} as const

export type TargetType = (typeof TargetTypes)[keyof typeof TargetTypes]

export const TrackStatuses = {
  ON_TRACK: 'on_track',
  BEHIND: 'behind',
  AT_RISK: 'at_risk',
  NO_DEADLINE: 'no_deadline',
} as const

export type TrackStatus = (typeof TrackStatuses)[keyof typeof TrackStatuses]

export const InsightPriorities = {
  INFO: 'info',
  WARNING: 'warning',
  ACTION_REQUIRED: 'action_required',
} as const

export type InsightPriority = (typeof InsightPriorities)[keyof typeof InsightPriorities]

export const InsightCategories = {
  WEALTH: 'wealth',
  HEALTH: 'health',
  PRODUCTIVITY: 'productivity',
  GOALS: 'goals',
} as const

export type InsightCategory = (typeof InsightCategories)[keyof typeof InsightCategories]

// ─────────────────────────────────────────────────────────────
// Extended Types (with relations)
// ─────────────────────────────────────────────────────────────

export interface GoalWithRelations extends Goal {
  key_results?: GoalKeyResult[]
  checkins?: GoalCheckin[]
  parent_goal?: Goal | null
  child_goals?: Goal[]
  linked_tasks_count?: number
}

export interface GoalWithProgress extends Goal {
  key_results_count: number
  key_results_completed: number
  child_goals_count: number
  days_remaining: number | null
  track_status: TrackStatus
  parent_goal_title?: string | null
}

export interface DailyLogWithRelations extends DailyLog {
  garmin_stats?: Tables<'garmin_daily_stats'> | null
  nutrition?: Tables<'daily_nutrition'> | null
}

export interface WeeklyReviewWithGoals extends WeeklyReview {
  completed_goals: { id: string; title: string }[]
  missed_goals: { id: string; title: string }[]
  active_goals: Goal[]
}

// ─────────────────────────────────────────────────────────────
// Aggregated / Calculated Types
// ─────────────────────────────────────────────────────────────

export interface GoalHierarchy {
  year_goals: GoalWithProgress[]
  quarter_goals: GoalWithProgress[]
  month_goals: GoalWithProgress[]
  week_goals: GoalWithProgress[]
}

export interface GoalTree {
  id: string
  title: string
  timeframe: Timeframe
  area: GoalArea | null
  progress_percent: number | null
  status: GoalStatus
  depth: number
  root_id: string
  path: string[]
  children?: GoalTree[]
}

export interface OKRSummary {
  objective: Goal
  key_results: GoalKeyResult[]
  overall_progress: number
  key_results_on_track: number
  key_results_at_risk: number
  key_results_behind: number
}

export interface GoalAreaSummary {
  area: GoalArea
  active_goals: number
  completed_goals: number
  avg_progress: number
  next_deadline: string | null
}

export interface MorningIntention {
  date: string
  mood: number | null
  energy: number | null
  intention: string | null
  top_3_priorities: string[]
}

export interface EveningReflection {
  date: string
  mood: number | null
  energy: number | null
  wins: string[]
  lessons: string[]
  gratitude: string[]
  tomorrow_focus: string | null
}

export interface DailyStats {
  date: string
  tasks_completed_count: number | null
  tasks_total_count: number | null
  billable_hours: number | null
  meetings_count: number | null
  habits_completed_percent: number | null
}

export interface WeeklySummary {
  year: number
  week_number: number
  start_date: string
  end_date: string
  productivity: {
    tasks_completed: number
    tasks_created: number
    tasks_overdue: number
    meetings_count: number
    meetings_hours: number
    billable_hours: number
    billable_revenue: number
  }
  health: {
    avg_sleep_score: number | null
    avg_stress: number | null
    workouts_completed: number
    workouts_planned: number
    habits_completion_rate: number | null
  }
  goals: {
    completed: { id: string; title: string }[]
    missed: { id: string; title: string }[]
  }
  reflection: {
    wins: string[]
    challenges: string[]
    lessons_learned: string | null
    next_week_focus: string | null
    overall_rating: number | null
  }
  comparison: {
    tasks_change: number
    billable_hours_change: number
    sleep_score_change: number | null
    habits_change: number | null
  }
}

// ─────────────────────────────────────────────────────────────
// AI Copilot Types
// ─────────────────────────────────────────────────────────────

export interface InsightWithAction extends AIInsight {
  suggested_actions_parsed: {
    action: string
    label: string
    url?: string
  }[]
}

export interface PendingInsight {
  id: string
  type: string
  category: InsightCategory
  priority: InsightPriority
  title: string
  message: string
  related_entity_type: string | null
  related_entity_id: string | null
  created_at: string
  sort_priority: number
}

export interface MorningBriefing {
  date: string
  garmin: {
    sleep_score: number | null
    sleep_duration_hours: number | null
    body_battery: number | null
    yesterday_stress: number | null
  }
  readiness: {
    score: number
    recommendation: string
  }
  schedule: {
    meetings: { time: string; title: string; duration: number }[]
    tasks: { title: string; priority: number | null; context: string | null }[]
    overdue_count: number
  }
  habits: { name: string; target_value: number | null; unit: string | null }[]
  supplements: { name: string; dosage: number | null; unit: string | null; timing: string }[]
  training: {
    plan_name: string
    day_name: string | null
    focus_areas: string[]
    duration: number | null
  } | null
  insights: PendingInsight[]
  weather?: Json
}

// ─────────────────────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────────────────────

export interface GoalsDashboardData {
  hierarchy: GoalHierarchy
  area_summaries: GoalAreaSummary[]
  current_okrs: OKRSummary[]
  recent_checkins: GoalCheckin[]
  today_log: DailyLog | null
  this_week_review: WeeklyReview | null
  pending_insights: PendingInsight[]
}

export interface DailyDashboardData {
  date: string
  morning: MorningIntention | null
  evening: EveningReflection | null
  stats: DailyStats
  garmin: {
    sleep_score: number | null
    body_battery_start: number | null
    body_battery_end: number | null
    stress_avg: number | null
    steps: number | null
  }
  nutrition: {
    calories: number | null
    protein_g: number | null
    water_ml: number | null
  }
  readiness: {
    score: number | null
    recommendation: string | null
  }
  counts: {
    inbox_count: number
    due_today_count: number
    overdue_count: number
    meetings_today_count: number
    total_habits: number
    completed_habits: number
    open_tickets_count: number
    active_goals_count: number
    pending_insights_count: number
  }
}

// ─────────────────────────────────────────────────────────────
// Filter & Query Types
// ─────────────────────────────────────────────────────────────

export interface GoalFilters {
  timeframe?: Timeframe
  area?: GoalArea
  status?: GoalStatus | GoalStatus[]
  year?: number
  quarter?: number
  parent_goal_id?: string
}

export interface DailyLogFilters {
  date_from?: string
  date_to?: string
  has_morning?: boolean
  has_evening?: boolean
}

export interface WeeklyReviewFilters {
  year?: number
  week_from?: number
  week_to?: number
}

export interface InsightFilters {
  category?: InsightCategory
  priority?: InsightPriority
  is_read?: boolean
  is_actioned?: boolean
}

// ─────────────────────────────────────────────────────────────
// Action Types
// ─────────────────────────────────────────────────────────────

export interface CreateGoalFromParent {
  parent_goal_id: string
  timeframe: Timeframe
  title: string
  description?: string
  target_type?: TargetType
  target_value?: number
  unit?: string
  start_date?: string
  end_date?: string
}

export interface UpdateGoalProgress {
  goal_id: string
  current_value: number
  notes?: string
}

export interface CreateKeyResult {
  goal_id: string
  title: string
  target_value: number
  unit?: string
}

export interface LogMorning {
  date: string
  mood: number
  energy: number
  intention?: string
  top_3_priorities?: string[]
}

export interface LogEvening {
  date: string
  mood: number
  energy: number
  wins?: string[]
  lessons?: string[]
  gratitude?: string[]
  tomorrow_focus?: string
}

export interface CreateWeeklyReview {
  year: number
  week_number: number
  wins?: string[]
  challenges?: string[]
  lessons_learned?: string
  next_week_focus?: string
  overall_rating?: number
}

export interface MarkInsightActioned {
  insight_id: string
  action_taken?: string
}
