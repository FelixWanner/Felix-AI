import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          name: string
          address: string | null
          city: string | null
          current_value: number | null
          property_type: string | null
          unit_count: number
          created_at: string
        }
      }
      accounts: {
        Row: {
          id: string
          name: string
          iban: string | null
          account_type: string
          current_balance: number
          is_active: boolean
        }
      }
      inbox_items: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: number | null
          due_date: string | null
          created_at: string
        }
      }
      habits: {
        Row: {
          id: string
          name: string
          category: string | null
          frequency: string | null
          is_active: boolean
        }
      }
      goals: {
        Row: {
          id: string
          title: string
          timeframe: string
          area: string | null
          progress_percent: number | null
          status: string
        }
      }
      daily_snapshots: {
        Row: {
          id: string
          date: string
          net_worth: number | null
          cash_value: number | null
          investment_value: number | null
          property_value: number | null
        }
      }
      garmin_daily_stats: {
        Row: {
          id: string
          date: string
          sleep_score: number | null
          body_battery_start: number | null
          stress_avg: number | null
          steps: number | null
        }
      }
    }
  }
}
