// Auto-generated types from Supabase
// Run `npx supabase gen types typescript` to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Base Tables
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_data: Json | null
          new_data: Json | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          user_id?: string | null
          created_at?: string
        }
      }
      sync_status: {
        Row: {
          id: string
          source: string
          last_sync_at: string | null
          status: string
          error_message: string | null
          records_synced: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source: string
          last_sync_at?: string | null
          status?: string
          error_message?: string | null
          records_synced?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source?: string
          last_sync_at?: string | null
          status?: string
          error_message?: string | null
          records_synced?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      // Wealth Module
      properties: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          postal_code: string
          country: string
          property_type: string
          purchase_date: string | null
          purchase_price: number | null
          current_value: number | null
          size_sqm: number | null
          year_built: number | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          postal_code: string
          country?: string
          property_type: string
          purchase_date?: string | null
          purchase_price?: number | null
          current_value?: number | null
          size_sqm?: number | null
          year_built?: number | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          postal_code?: string
          country?: string
          property_type?: string
          purchase_date?: string | null
          purchase_price?: number | null
          current_value?: number | null
          size_sqm?: number | null
          year_built?: number | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Add more tables as needed
      // This file should be auto-generated from Supabase
    }
    Views: {
      v_daily_dashboard: {
        Row: {
          metric_date: string | null
          total_portfolio_value: number | null
          monthly_rental_income: number | null
          occupied_units: number | null
          total_units: number | null
          pending_tasks: number | null
          unread_emails: number | null
          todays_meetings: number | null
          open_tickets: number | null
          habits_completed_today: number | null
          total_habits: number | null
          current_streak: number | null
          goals_progress: number | null
        }
      }
    }
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      get_habit_streak: {
        Args: {
          habit_id: string
        }
        Returns: number
      }
      calculate_readiness_score: {
        Args: {
          user_id: string
          check_date: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
