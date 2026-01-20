// ═══════════════════════════════════════════════════════════════
// Life OS - Health Module Domain Types
// ═══════════════════════════════════════════════════════════════

import { Tables, InsertTables, UpdateTables } from './database'

// ─────────────────────────────────────────────────────────────
// Base Types (from Supabase)
// ─────────────────────────────────────────────────────────────

export type Habit = Tables<'habits'>
export type HabitInsert = InsertTables<'habits'>
export type HabitUpdate = UpdateTables<'habits'>

export type HabitLog = Tables<'habit_logs'>
export type HabitLogInsert = InsertTables<'habit_logs'>
export type HabitLogUpdate = UpdateTables<'habit_logs'>

export type DailyNutrition = Tables<'daily_nutrition'>
export type DailyNutritionInsert = InsertTables<'daily_nutrition'>
export type DailyNutritionUpdate = UpdateTables<'daily_nutrition'>

export type Supplement = Tables<'supplements'>
export type SupplementInsert = InsertTables<'supplements'>
export type SupplementUpdate = UpdateTables<'supplements'>

export type SupplementLog = Tables<'supplement_logs'>
export type SupplementLogInsert = InsertTables<'supplement_logs'>

export type SupplementCycle = Tables<'supplement_cycles'>
export type SupplementCycleInsert = InsertTables<'supplement_cycles'>
export type SupplementCycleUpdate = UpdateTables<'supplement_cycles'>

export type GarminDailyStats = Tables<'garmin_daily_stats'>

export type TrainingPlan = Tables<'training_plans'>
export type TrainingPlanInsert = InsertTables<'training_plans'>
export type TrainingPlanUpdate = UpdateTables<'training_plans'>

export type TrainingPlanDay = Tables<'training_plan_days'>
export type TrainingPlanDayInsert = InsertTables<'training_plan_days'>

export type Exercise = Tables<'exercises'>
export type ExerciseInsert = InsertTables<'exercises'>
export type ExerciseUpdate = UpdateTables<'exercises'>

export type Workout = Tables<'workouts'>
export type WorkoutInsert = InsertTables<'workouts'>
export type WorkoutUpdate = UpdateTables<'workouts'>

export type WorkoutSet = Tables<'workout_sets'>
export type WorkoutSetInsert = InsertTables<'workout_sets'>

export type DailyReadiness = Tables<'daily_readiness'>

// ─────────────────────────────────────────────────────────────
// Enums & Constants
// ─────────────────────────────────────────────────────────────

export const HabitCategories = {
  MORNING: 'morgen',
  EVENING: 'abend',
  FITNESS: 'fitness',
  NUTRITION: 'ernährung',
  MINDSET: 'mindset',
  SLEEP: 'schlaf',
  PRODUCTIVITY: 'produktivität',
  SOCIAL: 'sozial',
} as const

export type HabitCategory = (typeof HabitCategories)[keyof typeof HabitCategories]

export const HabitFrequencies = {
  DAILY: 'täglich',
  WEEKLY: 'wöchentlich',
  SPECIFIC_DAYS: 'bestimmte_tage',
} as const

export type HabitFrequency = (typeof HabitFrequencies)[keyof typeof HabitFrequencies]

export const SupplementCategories = {
  VITAMIN: 'vitamin',
  MINERAL: 'mineral',
  AMINO_ACID: 'aminosäure',
  HERB: 'pflanzlich',
  HORMONE: 'hormon',
  PEPTIDE: 'peptid',
  NOOTROPIC: 'nootropikum',
  OTHER: 'sonstiges',
} as const

export type SupplementCategory = (typeof SupplementCategories)[keyof typeof SupplementCategories]

export const SupplementTimings = {
  MORNING_EMPTY: 'morgens_nüchtern',
  MORNING_FOOD: 'morgens_mit_essen',
  PRE_WORKOUT: 'vor_training',
  POST_WORKOUT: 'nach_training',
  AFTERNOON: 'nachmittags',
  EVENING: 'abends',
  BEFORE_BED: 'vor_schlaf',
  WITH_MEALS: 'zu_mahlzeiten',
} as const

export type SupplementTiming = (typeof SupplementTimings)[keyof typeof SupplementTimings]

export const CycleStatuses = {
  PLANNED: 'geplant',
  ACTIVE: 'aktiv',
  COMPLETED: 'abgeschlossen',
  PAUSED: 'pausiert',
} as const

export type CycleStatus = (typeof CycleStatuses)[keyof typeof CycleStatuses]

export const TrainingTypes = {
  STRENGTH: 'kraft',
  HYPERTROPHY: 'hypertrophie',
  CARDIO: 'cardio',
  HIIT: 'hiit',
  MOBILITY: 'mobilität',
  RECOVERY: 'regeneration',
} as const

export type TrainingType = (typeof TrainingTypes)[keyof typeof TrainingTypes]

export const MuscleGroups = {
  CHEST: 'brust',
  BACK: 'rücken',
  SHOULDERS: 'schultern',
  BICEPS: 'bizeps',
  TRICEPS: 'trizeps',
  LEGS: 'beine',
  GLUTES: 'gesäß',
  CORE: 'core',
  FULL_BODY: 'ganzkörper',
} as const

export type MuscleGroup = (typeof MuscleGroups)[keyof typeof MuscleGroups]

export const HRVStatuses = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
} as const

export type HRVStatus = (typeof HRVStatuses)[keyof typeof HRVStatuses]

export const ReadinessLevels = {
  LOW: 'niedrig',
  MODERATE: 'moderat',
  HIGH: 'hoch',
  OPTIMAL: 'optimal',
} as const

export type ReadinessLevel = (typeof ReadinessLevels)[keyof typeof ReadinessLevels]

// ─────────────────────────────────────────────────────────────
// Extended Types (with relations)
// ─────────────────────────────────────────────────────────────

export interface HabitWithStreak extends Habit {
  current_streak: number
  longest_streak: number
  completion_rate_30d: number
  last_completed: string | null
  today_log?: HabitLog | null
}

export interface SupplementWithLog extends Supplement {
  today_logs: SupplementLog[]
  taken_today: boolean
  active_cycle?: SupplementCycle | null
}

export interface TrainingPlanWithDays extends TrainingPlan {
  days: TrainingPlanDay[]
}

export interface WorkoutWithSets extends Workout {
  sets: (WorkoutSet & { exercise: Exercise })[]
  plan_day?: TrainingPlanDay | null
}

export interface ExerciseWithHistory extends Exercise {
  personal_records: {
    weight: number
    reps: number
    date: string
  }[]
  recent_sets: WorkoutSet[]
}

// ─────────────────────────────────────────────────────────────
// Aggregated / Calculated Types
// ─────────────────────────────────────────────────────────────

export interface HabitDayStatus {
  habit_id: string
  habit_name: string
  category: string | null
  target_value: number | null
  unit: string | null
  is_completed: boolean
  value?: number
  is_scheduled_today: boolean
}

export interface DailyHabitSummary {
  date: string
  habits: HabitDayStatus[]
  completed_count: number
  total_scheduled: number
  completion_percent: number
}

export interface WeeklyHabitGrid {
  habits: {
    id: string
    name: string
    category: string | null
    days: {
      date: string
      is_completed: boolean
      value?: number
    }[]
    weekly_completion_rate: number
  }[]
  week_start: string
  week_end: string
}

export interface NutritionSummary {
  date: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  water_ml: number
  targets: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    water_ml: number
  }
  target_percent: {
    calories: number
    protein: number
    carbs: number
    fat: number
    water: number
  }
}

export interface SupplementSchedule {
  timing: SupplementTiming
  supplements: SupplementWithLog[]
}

export interface DailySupplementChecklist {
  date: string
  schedule: SupplementSchedule[]
  total_supplements: number
  taken_count: number
  completion_percent: number
}

export interface GarminSummary {
  date: string
  sleep: {
    score: number | null
    duration_hours: number | null
    deep_percent: number | null
    rem_percent: number | null
    quality_rating: 'poor' | 'fair' | 'good' | 'excellent'
  }
  body_battery: {
    start: number | null
    end: number | null
    charged: number | null
    drained: number | null
  }
  stress: {
    avg: number | null
    max: number | null
    high_stress_minutes: number | null
  }
  activity: {
    steps: number | null
    active_calories: number | null
    intensity_minutes: number | null
    floors_climbed: number | null
  }
  heart: {
    resting_hr: number | null
    hrv_status: HRVStatus | null
    hrv_value: number | null
  }
}

export interface ReadinessAssessment {
  date: string
  score: number
  level: ReadinessLevel
  recommendation: string
  factors: {
    sleep_score: { value: number; weight: number; contribution: number }
    hrv_status: { value: string; weight: number; contribution: number }
    body_battery: { value: number; weight: number; contribution: number }
    stress_avg: { value: number; weight: number; contribution: number }
    previous_workout: { value: number; weight: number; contribution: number }
  }
  suggested_workout_intensity: 'rest' | 'light' | 'moderate' | 'high'
}

export interface WorkoutSummary {
  id: string
  date: string
  type: string | null
  duration_minutes: number | null
  exercises_count: number
  total_sets: number
  total_volume: number
  calories_burned: number | null
  perceived_exertion: number | null
  personal_records: number
}

export interface TrainingProgress {
  exercise_id: string
  exercise_name: string
  muscle_group: string | null
  history: {
    date: string
    max_weight: number
    total_volume: number
    sets_count: number
  }[]
  current_1rm_estimate: number
  progress_percent_30d: number
}

// ─────────────────────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────────────────────

export interface HealthDashboardData {
  readiness: ReadinessAssessment
  garmin_today: GarminSummary
  habits_today: DailyHabitSummary
  supplements_today: DailySupplementChecklist
  nutrition_today: NutritionSummary
  today_workout: WorkoutSummary | null
  weekly_trends: {
    avg_sleep_score: number
    avg_stress: number
    workouts_completed: number
    habits_completion_rate: number
  }
  upcoming_training: {
    plan_name: string
    day_name: string | null
    focus_areas: string[]
    estimated_duration: number | null
  } | null
}

export interface MorningBriefingHealth {
  sleep_score: number | null
  sleep_duration_hours: number | null
  body_battery: number | null
  readiness_score: number
  readiness_recommendation: string
  today_habits: HabitDayStatus[]
  today_supplements: SupplementSchedule[]
  today_training: {
    plan_name: string
    day_name: string | null
    focus_areas: string[]
  } | null
}

// ─────────────────────────────────────────────────────────────
// Filter & Query Types
// ─────────────────────────────────────────────────────────────

export interface HabitFilters {
  category?: HabitCategory
  is_active?: boolean
  frequency?: HabitFrequency
}

export interface SupplementFilters {
  category?: SupplementCategory
  timing?: SupplementTiming
  is_active?: boolean
  low_stock?: boolean
}

export interface WorkoutFilters {
  date_from?: string
  date_to?: string
  type?: TrainingType
  plan_id?: string
}

export interface GarminFilters {
  date_from?: string
  date_to?: string
}

// ─────────────────────────────────────────────────────────────
// Action Types
// ─────────────────────────────────────────────────────────────

export interface LogHabit {
  habit_id: string
  date: string
  value?: number
  is_completed: boolean
  notes?: string
}

export interface LogSupplement {
  supplement_id: string
  date: string
  time: string
  dosage_taken?: number
  notes?: string
}

export interface LogWorkoutSet {
  workout_id: string
  exercise_id: string
  set_number: number
  weight: number
  reps: number
  is_warmup?: boolean
  notes?: string
}

export interface CreateWorkoutFromPlan {
  plan_day_id: string
  date: string
  start_time: string
}
