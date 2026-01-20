// ═══════════════════════════════════════════════════════════════
// Life OS - Auto-generated Database Types
// Generated from Supabase Schema
// ═══════════════════════════════════════════════════════════════

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
      // ─────────────────────────────────────────────────────────────
      // Base Tables (00001_initial_schema)
      // ─────────────────────────────────────────────────────────────
      sync_status: {
        Row: {
          id: string
          source: string
          last_sync_at: string | null
          last_sync_status: string | null
          items_synced: number
          errors: Json | null
          next_scheduled_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source: string
          last_sync_at?: string | null
          last_sync_status?: string | null
          items_synced?: number
          errors?: Json | null
          next_scheduled_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          source?: string
          last_sync_at?: string | null
          last_sync_status?: string | null
          items_synced?: number
          errors?: Json | null
          next_scheduled_sync?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          timestamp: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          source: string | null
        }
        Insert: {
          id?: string
          timestamp?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          source?: string | null
        }
        Update: {
          id?: string
          timestamp?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          source?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          timezone: string
          locale: string
          currency: string
          default_dashboard_view: string
          telegram_chat_id: number | null
          email_notifications: boolean
          telegram_notifications: boolean
          fire_target_amount: number | null
          fire_withdrawal_rate: number
          fire_monthly_expenses: number | null
          protein_target_g: number
          calorie_target: number
          sleep_target_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          timezone?: string
          locale?: string
          currency?: string
          default_dashboard_view?: string
          telegram_chat_id?: number | null
          email_notifications?: boolean
          telegram_notifications?: boolean
          fire_target_amount?: number | null
          fire_withdrawal_rate?: number
          fire_monthly_expenses?: number | null
          protein_target_g?: number
          calorie_target?: number
          sleep_target_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          timezone?: string
          locale?: string
          currency?: string
          default_dashboard_view?: string
          telegram_chat_id?: number | null
          email_notifications?: boolean
          telegram_notifications?: boolean
          fire_target_amount?: number | null
          fire_withdrawal_rate?: number
          fire_monthly_expenses?: number | null
          protein_target_g?: number
          calorie_target?: number
          sleep_target_hours?: number
          created_at?: string
          updated_at?: string
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Wealth Module (00002_wealth_module)
      // ─────────────────────────────────────────────────────────────
      banks: {
        Row: {
          id: string
          name: string
          bic: string | null
          contact_id: string | null
          online_banking_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          bic?: string | null
          contact_id?: string | null
          online_banking_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          bic?: string | null
          contact_id?: string | null
          online_banking_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          contact_type: string
          company_name: string | null
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          mobile: string | null
          address: string | null
          city: string | null
          zip_code: string | null
          website: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_type: string
          company_name?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          mobile?: string | null
          address?: string | null
          city?: string | null
          zip_code?: string | null
          website?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_type?: string
          company_name?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          mobile?: string | null
          address?: string | null
          city?: string | null
          zip_code?: string | null
          website?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contact_specialties: {
        Row: {
          id: string
          contact_id: string
          specialty: string
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          specialty: string
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          specialty?: string
          created_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          name: string
          address: string | null
          city: string | null
          zip_code: string | null
          purchase_date: string | null
          purchase_price: number | null
          current_value: number | null
          property_type: string | null
          is_self_occupied: boolean
          unit_count: number
          property_manager_id: string | null
          utility_billing_type: string | null
          primary_account_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          city?: string | null
          zip_code?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          current_value?: number | null
          property_type?: string | null
          is_self_occupied?: boolean
          unit_count?: number
          property_manager_id?: string | null
          utility_billing_type?: string | null
          primary_account_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          city?: string | null
          zip_code?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          current_value?: number | null
          property_type?: string | null
          is_self_occupied?: boolean
          unit_count?: number
          property_manager_id?: string | null
          utility_billing_type?: string | null
          primary_account_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_properties: {
        Row: {
          id: string
          contact_id: string
          property_id: string
          role: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          property_id: string
          role?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          property_id?: string
          role?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          name: string
          iban: string | null
          bank_id: string | null
          account_type: string
          property_id: string | null
          purpose: string | null
          current_balance: number
          bhb_account_id: string | null
          last_synced_at: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          iban?: string | null
          bank_id?: string | null
          account_type: string
          property_id?: string | null
          purpose?: string | null
          current_balance?: number
          bhb_account_id?: string | null
          last_synced_at?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          iban?: string | null
          bank_id?: string | null
          account_type?: string
          property_id?: string | null
          purpose?: string | null
          current_balance?: number
          bhb_account_id?: string | null
          last_synced_at?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          property_id: string
          unit_number: string | null
          floor: number | null
          size_sqm: number | null
          rooms: number | null
          monthly_rent_cold: number | null
          monthly_utilities_advance: number | null
          status: string
          current_tenant_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_number?: string | null
          floor?: number | null
          size_sqm?: number | null
          rooms?: number | null
          monthly_rent_cold?: number | null
          monthly_utilities_advance?: number | null
          status?: string
          current_tenant_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          unit_number?: string | null
          floor?: number | null
          size_sqm?: number | null
          rooms?: number | null
          monthly_rent_cold?: number | null
          monthly_utilities_advance?: number | null
          status?: string
          current_tenant_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          unit_id: string | null
          name: string
          email: string | null
          phone: string | null
          contract_start: string | null
          contract_end: string | null
          deposit_amount: number | null
          deposit_paid: boolean
          deposit_account_id: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          contract_start?: string | null
          contract_end?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean
          deposit_account_id?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string | null
          name?: string
          email?: string | null
          phone?: string | null
          contract_start?: string | null
          contract_end?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean
          deposit_account_id?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          property_id: string | null
          bank_id: string | null
          account_id: string | null
          loan_number: string | null
          loan_type: string | null
          original_amount: number
          current_balance: number | null
          disbursed_amount: number | null
          interest_rate_nominal: number | null
          interest_rate_effective: number | null
          interest_fixed_from: string | null
          interest_fixed_until: string | null
          interest_type: string | null
          initial_repayment_rate: number | null
          monthly_payment: number | null
          annual_annuity: number | null
          payment_day: number | null
          special_repayment_allowed: boolean
          special_repayment_percent: number | null
          special_repayment_used_this_year: number
          start_date: string | null
          end_date: string | null
          remaining_term_months: number | null
          collateral_type: string | null
          collateral_amount: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          bank_id?: string | null
          account_id?: string | null
          loan_number?: string | null
          loan_type?: string | null
          original_amount: number
          current_balance?: number | null
          disbursed_amount?: number | null
          interest_rate_nominal?: number | null
          interest_rate_effective?: number | null
          interest_fixed_from?: string | null
          interest_fixed_until?: string | null
          interest_type?: string | null
          initial_repayment_rate?: number | null
          monthly_payment?: number | null
          annual_annuity?: number | null
          payment_day?: number | null
          special_repayment_allowed?: boolean
          special_repayment_percent?: number | null
          special_repayment_used_this_year?: number
          start_date?: string | null
          end_date?: string | null
          remaining_term_months?: number | null
          collateral_type?: string | null
          collateral_amount?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          bank_id?: string | null
          account_id?: string | null
          loan_number?: string | null
          loan_type?: string | null
          original_amount?: number
          current_balance?: number | null
          disbursed_amount?: number | null
          interest_rate_nominal?: number | null
          interest_rate_effective?: number | null
          interest_fixed_from?: string | null
          interest_fixed_until?: string | null
          interest_type?: string | null
          initial_repayment_rate?: number | null
          monthly_payment?: number | null
          annual_annuity?: number | null
          payment_day?: number | null
          special_repayment_allowed?: boolean
          special_repayment_percent?: number | null
          special_repayment_used_this_year?: number
          start_date?: string | null
          end_date?: string | null
          remaining_term_months?: number | null
          collateral_type?: string | null
          collateral_amount?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      loan_schedule: {
        Row: {
          id: string
          loan_id: string
          payment_date: string
          payment_number: number | null
          opening_balance: number | null
          interest_portion: number | null
          principal_portion: number | null
          total_payment: number | null
          closing_balance: number | null
          is_special_repayment: boolean
          is_actual: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          payment_date: string
          payment_number?: number | null
          opening_balance?: number | null
          interest_portion?: number | null
          principal_portion?: number | null
          total_payment?: number | null
          closing_balance?: number | null
          is_special_repayment?: boolean
          is_actual?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          payment_date?: string
          payment_number?: number | null
          opening_balance?: number | null
          interest_portion?: number | null
          principal_portion?: number | null
          total_payment?: number | null
          closing_balance?: number | null
          is_special_repayment?: boolean
          is_actual?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      loan_scenarios: {
        Row: {
          id: string
          loan_id: string
          name: string
          new_interest_rate: number | null
          new_monthly_payment: number | null
          remaining_term_months: number | null
          total_interest_cost: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          name: string
          new_interest_rate?: number | null
          new_monthly_payment?: number | null
          remaining_term_months?: number | null
          total_interest_cost?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          name?: string
          new_interest_rate?: number | null
          new_monthly_payment?: number | null
          remaining_term_months?: number | null
          total_interest_cost?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      property_scenarios: {
        Row: {
          id: string
          property_id: string
          name: string
          scenario_type: string | null
          target_date: string | null
          holding_period_years: number | null
          is_tax_free: boolean | null
          estimated_sale_price: number | null
          sale_costs_percent: number | null
          remaining_loan_balance: number | null
          capital_gains_tax: number | null
          net_proceeds: number | null
          total_invested: number | null
          total_rental_income: number | null
          total_costs: number | null
          total_profit: number | null
          roi_percent: number | null
          irr_percent: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          name: string
          scenario_type?: string | null
          target_date?: string | null
          holding_period_years?: number | null
          is_tax_free?: boolean | null
          estimated_sale_price?: number | null
          sale_costs_percent?: number | null
          remaining_loan_balance?: number | null
          capital_gains_tax?: number | null
          net_proceeds?: number | null
          total_invested?: number | null
          total_rental_income?: number | null
          total_costs?: number | null
          total_profit?: number | null
          roi_percent?: number | null
          irr_percent?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          name?: string
          scenario_type?: string | null
          target_date?: string | null
          holding_period_years?: number | null
          is_tax_free?: boolean | null
          estimated_sale_price?: number | null
          sale_costs_percent?: number | null
          remaining_loan_balance?: number | null
          capital_gains_tax?: number | null
          net_proceeds?: number | null
          total_invested?: number | null
          total_rental_income?: number | null
          total_costs?: number | null
          total_profit?: number | null
          roi_percent?: number | null
          irr_percent?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      property_milestones: {
        Row: {
          id: string
          property_id: string
          milestone_type: string
          target_date: string
          is_reached: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          milestone_type: string
          target_date: string
          is_reached?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          milestone_type?: string
          target_date?: string
          is_reached?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      property_tax_data: {
        Row: {
          id: string
          property_id: string
          building_value: number | null
          land_value: number | null
          afa_rate: number | null
          afa_annual: number | null
          afa_remaining: number | null
          afa_start_date: string | null
          renovation_costs_deductible: number | null
          renovation_afa_rate: number | null
          annual_interest_deductible: number | null
          annual_maintenance_deductible: number | null
          annual_management_fees: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          building_value?: number | null
          land_value?: number | null
          afa_rate?: number | null
          afa_annual?: number | null
          afa_remaining?: number | null
          afa_start_date?: string | null
          renovation_costs_deductible?: number | null
          renovation_afa_rate?: number | null
          annual_interest_deductible?: number | null
          annual_maintenance_deductible?: number | null
          annual_management_fees?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          building_value?: number | null
          land_value?: number | null
          afa_rate?: number | null
          afa_annual?: number | null
          afa_remaining?: number | null
          afa_start_date?: string | null
          renovation_costs_deductible?: number | null
          renovation_afa_rate?: number | null
          annual_interest_deductible?: number | null
          annual_maintenance_deductible?: number | null
          annual_management_fees?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          bhb_transaction_id: string | null
          account_id: string | null
          property_id: string | null
          unit_id: string | null
          date: string
          amount: number
          description: string | null
          category: string | null
          counterparty: string | null
          is_rental_income: boolean
          notes: string | null
          created_at: string
          synced_at: string
        }
        Insert: {
          id?: string
          bhb_transaction_id?: string | null
          account_id?: string | null
          property_id?: string | null
          unit_id?: string | null
          date: string
          amount: number
          description?: string | null
          category?: string | null
          counterparty?: string | null
          is_rental_income?: boolean
          notes?: string | null
          created_at?: string
          synced_at?: string
        }
        Update: {
          id?: string
          bhb_transaction_id?: string | null
          account_id?: string | null
          property_id?: string | null
          unit_id?: string | null
          date?: string
          amount?: number
          description?: string | null
          category?: string | null
          counterparty?: string | null
          is_rental_income?: boolean
          notes?: string | null
          created_at?: string
          synced_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          gmi_document_id: string | null
          property_id: string | null
          vendor: string | null
          invoice_number: string | null
          invoice_date: string | null
          amount: number | null
          currency: string
          vat_amount: number | null
          due_date: string | null
          payment_status: string | null
          category: string | null
          pdf_url: string | null
          matched_transaction_id: string | null
          notes: string | null
          created_at: string
          synced_at: string
        }
        Insert: {
          id?: string
          gmi_document_id?: string | null
          property_id?: string | null
          vendor?: string | null
          invoice_number?: string | null
          invoice_date?: string | null
          amount?: number | null
          currency?: string
          vat_amount?: number | null
          due_date?: string | null
          payment_status?: string | null
          category?: string | null
          pdf_url?: string | null
          matched_transaction_id?: string | null
          notes?: string | null
          created_at?: string
          synced_at?: string
        }
        Update: {
          id?: string
          gmi_document_id?: string | null
          property_id?: string | null
          vendor?: string | null
          invoice_number?: string | null
          invoice_date?: string | null
          amount?: number | null
          currency?: string
          vat_amount?: number | null
          due_date?: string | null
          payment_status?: string | null
          category?: string | null
          pdf_url?: string | null
          matched_transaction_id?: string | null
          notes?: string | null
          created_at?: string
          synced_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          legal_form: string | null
          industry: string | null
          your_share_percent: number | null
          total_company_value: number | null
          your_share_value: number | null
          employees_count: number | null
          annual_revenue: number | null
          annual_profit: number | null
          is_property_related: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          legal_form?: string | null
          industry?: string | null
          your_share_percent?: number | null
          total_company_value?: number | null
          your_share_value?: number | null
          employees_count?: number | null
          annual_revenue?: number | null
          annual_profit?: number | null
          is_property_related?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          legal_form?: string | null
          industry?: string | null
          your_share_percent?: number | null
          total_company_value?: number | null
          your_share_value?: number | null
          employees_count?: number | null
          annual_revenue?: number | null
          annual_profit?: number | null
          is_property_related?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      company_financials: {
        Row: {
          id: string
          company_id: string
          year: number
          revenue: number | null
          expenses: number | null
          profit: number | null
          your_distribution: number | null
          document_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          year: number
          revenue?: number | null
          expenses?: number | null
          profit?: number | null
          your_distribution?: number | null
          document_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          year?: number
          revenue?: number | null
          expenses?: number | null
          profit?: number | null
          your_distribution?: number | null
          document_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          name: string
          broker: string | null
          account_id: string | null
          api_connected: boolean
          last_synced_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          broker?: string | null
          account_id?: string | null
          api_connected?: boolean
          last_synced_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          broker?: string | null
          account_id?: string | null
          api_connected?: boolean
          last_synced_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          portfolio_id: string
          isin: string | null
          symbol: string | null
          name: string
          asset_type: string | null
          quantity: number | null
          avg_buy_price: number | null
          current_price: number | null
          total_invested: number | null
          current_value: number | null
          unrealized_gain_loss: number | null
          last_updated_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          isin?: string | null
          symbol?: string | null
          name: string
          asset_type?: string | null
          quantity?: number | null
          avg_buy_price?: number | null
          current_price?: number | null
          total_invested?: number | null
          current_value?: number | null
          unrealized_gain_loss?: number | null
          last_updated_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          isin?: string | null
          symbol?: string | null
          name?: string
          asset_type?: string | null
          quantity?: number | null
          avg_buy_price?: number | null
          current_price?: number | null
          total_invested?: number | null
          current_value?: number | null
          unrealized_gain_loss?: number | null
          last_updated_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      position_history: {
        Row: {
          id: string
          position_id: string
          date: string
          price: number | null
          value: number | null
          created_at: string
        }
        Insert: {
          id?: string
          position_id: string
          date: string
          price?: number | null
          value?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          position_id?: string
          date?: string
          price?: number | null
          value?: number | null
          created_at?: string
        }
      }
      savings_plans: {
        Row: {
          id: string
          portfolio_id: string
          position_id: string | null
          amount: number
          frequency: string | null
          execution_day: number | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          position_id?: string | null
          amount: number
          frequency?: string | null
          execution_day?: number | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          position_id?: string | null
          amount?: number
          frequency?: string | null
          execution_day?: number | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_snapshots: {
        Row: {
          id: string
          date: string
          total_assets: number | null
          total_liabilities: number | null
          net_worth: number | null
          cash_value: number | null
          investment_value: number | null
          property_value: number | null
          company_value: number | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          total_assets?: number | null
          total_liabilities?: number | null
          net_worth?: number | null
          cash_value?: number | null
          investment_value?: number | null
          property_value?: number | null
          company_value?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          total_assets?: number | null
          total_liabilities?: number | null
          net_worth?: number | null
          cash_value?: number | null
          investment_value?: number | null
          property_value?: number | null
          company_value?: number | null
          created_at?: string
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          name: string
          amount: number
          type: string | null
          frequency: string | null
          day_of_month: number | null
          account_id: string | null
          property_id: string | null
          category: string | null
          is_active: boolean
          next_occurrence: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          amount: number
          type?: string | null
          frequency?: string | null
          day_of_month?: number | null
          account_id?: string | null
          property_id?: string | null
          category?: string | null
          is_active?: boolean
          next_occurrence?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          amount?: number
          type?: string | null
          frequency?: string | null
          day_of_month?: number | null
          account_id?: string | null
          property_id?: string | null
          category?: string | null
          is_active?: boolean
          next_occurrence?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cashflow_forecast: {
        Row: {
          id: string
          date: string
          forecast_type: string | null
          expected_rent: number | null
          expected_other_income: number | null
          expected_loan_payments: number | null
          expected_utilities: number | null
          expected_insurance: number | null
          expected_maintenance: number | null
          expected_other_expenses: number | null
          expected_net_cashflow: number | null
          cumulative_balance: number | null
          scenario: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          forecast_type?: string | null
          expected_rent?: number | null
          expected_other_income?: number | null
          expected_loan_payments?: number | null
          expected_utilities?: number | null
          expected_insurance?: number | null
          expected_maintenance?: number | null
          expected_other_expenses?: number | null
          expected_net_cashflow?: number | null
          cumulative_balance?: number | null
          scenario?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          forecast_type?: string | null
          expected_rent?: number | null
          expected_other_income?: number | null
          expected_loan_payments?: number | null
          expected_utilities?: number | null
          expected_insurance?: number | null
          expected_maintenance?: number | null
          expected_other_expenses?: number | null
          expected_net_cashflow?: number | null
          cumulative_balance?: number | null
          scenario?: string | null
          created_at?: string
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Productivity Module (00003_productivity_module)
      // ─────────────────────────────────────────────────────────────
      clients: {
        Row: {
          id: string
          name: string
          company: string | null
          contact_email: string | null
          contact_phone: string | null
          hourly_rate: number | null
          billing_type: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          hourly_rate?: number | null
          billing_type?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          hourly_rate?: number | null
          billing_type?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inbox_items: {
        Row: {
          id: string
          title: string
          description: string | null
          source: string
          source_id: string | null
          source_url: string | null
          status: string
          priority: number | null
          due_date: string | null
          scheduled_date: string | null
          estimated_minutes: number | null
          context: string | null
          property_id: string | null
          tenant_id: string | null
          contact_id: string | null
          project_id: string | null
          goal_id: string | null
          is_billable: boolean
          client_id: string | null
          actual_minutes: number | null
          created_at: string
          completed_at: string | null
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          source: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          priority?: number | null
          due_date?: string | null
          scheduled_date?: string | null
          estimated_minutes?: number | null
          context?: string | null
          property_id?: string | null
          tenant_id?: string | null
          contact_id?: string | null
          project_id?: string | null
          goal_id?: string | null
          is_billable?: boolean
          client_id?: string | null
          actual_minutes?: number | null
          created_at?: string
          completed_at?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          source?: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          priority?: number | null
          due_date?: string | null
          scheduled_date?: string | null
          estimated_minutes?: number | null
          context?: string | null
          property_id?: string | null
          tenant_id?: string | null
          contact_id?: string | null
          project_id?: string | null
          goal_id?: string | null
          is_billable?: boolean
          client_id?: string | null
          actual_minutes?: number | null
          created_at?: string
          completed_at?: string | null
          synced_at?: string | null
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          title: string
          source: string | null
          source_id: string | null
          start_time: string | null
          end_time: string | null
          duration_minutes: number | null
          attendees: Json | null
          location: string | null
          transcript: string | null
          summary: string | null
          audio_url: string | null
          client_id: string | null
          property_id: string | null
          is_billable: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          source?: string | null
          source_id?: string | null
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          attendees?: Json | null
          location?: string | null
          transcript?: string | null
          summary?: string | null
          audio_url?: string | null
          client_id?: string | null
          property_id?: string | null
          is_billable?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          source?: string | null
          source_id?: string | null
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          attendees?: Json | null
          location?: string | null
          transcript?: string | null
          summary?: string | null
          audio_url?: string | null
          client_id?: string | null
          property_id?: string | null
          is_billable?: boolean
          created_at?: string
        }
      }
      meeting_action_items: {
        Row: {
          id: string
          meeting_id: string
          inbox_item_id: string | null
          extracted_text: string | null
          assigned_to: string | null
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          inbox_item_id?: string | null
          extracted_text?: string | null
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          inbox_item_id?: string | null
          extracted_text?: string | null
          assigned_to?: string | null
          due_date?: string | null
          created_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          date: string
          client_id: string | null
          description: string | null
          duration_minutes: number
          source: string | null
          meeting_id: string | null
          inbox_item_id: string | null
          is_billable: boolean
          is_billed: boolean
          invoice_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          client_id?: string | null
          description?: string | null
          duration_minutes: number
          source?: string | null
          meeting_id?: string | null
          inbox_item_id?: string | null
          is_billable?: boolean
          is_billed?: boolean
          invoice_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          client_id?: string | null
          description?: string | null
          duration_minutes?: number
          source?: string | null
          meeting_id?: string | null
          inbox_item_id?: string | null
          is_billable?: boolean
          is_billed?: boolean
          invoice_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          ticket_number: string | null
          title: string
          description: string | null
          property_id: string | null
          unit_id: string | null
          reported_by: string | null
          reported_at: string
          priority: string | null
          category: string | null
          status: string
          assigned_to_contact_id: string | null
          assigned_to_internal: boolean
          estimated_cost: number | null
          actual_cost: number | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number?: string | null
          title: string
          description?: string | null
          property_id?: string | null
          unit_id?: string | null
          reported_by?: string | null
          reported_at?: string
          priority?: string | null
          category?: string | null
          status?: string
          assigned_to_contact_id?: string | null
          assigned_to_internal?: boolean
          estimated_cost?: number | null
          actual_cost?: number | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string | null
          title?: string
          description?: string | null
          property_id?: string | null
          unit_id?: string | null
          reported_by?: string | null
          reported_at?: string
          priority?: string | null
          category?: string | null
          status?: string
          assigned_to_contact_id?: string | null
          assigned_to_internal?: boolean
          estimated_cost?: number | null
          actual_cost?: number | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ticket_comments: {
        Row: {
          id: string
          ticket_id: string
          comment: string
          author_type: string | null
          attachments: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          comment: string
          author_type?: string | null
          attachments?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          comment?: string
          author_type?: string | null
          attachments?: Json | null
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          document_type: string | null
          property_id: string | null
          unit_id: string | null
          tenant_id: string | null
          file_path: string | null
          file_size: number | null
          mime_type: string | null
          uploaded_at: string
          is_indexed: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          document_type?: string | null
          property_id?: string | null
          unit_id?: string | null
          tenant_id?: string | null
          file_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          uploaded_at?: string
          is_indexed?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          document_type?: string | null
          property_id?: string | null
          unit_id?: string | null
          tenant_id?: string | null
          file_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          uploaded_at?: string
          is_indexed?: boolean
          metadata?: Json | null
          created_at?: string
        }
      }
      document_embeddings: {
        Row: {
          id: string
          document_id: string
          chunk_index: number
          content: string
          embedding: number[] | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          chunk_index: number
          content: string
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          chunk_index?: number
          content?: string
          embedding?: number[] | null
          metadata?: Json | null
          created_at?: string
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Health Module (00004_health_module)
      // ─────────────────────────────────────────────────────────────
      habits: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          frequency: string | null
          target_value: number | null
          unit: string | null
          target_days: Json | null
          reminder_time: string | null
          is_active: boolean
          sort_order: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          frequency?: string | null
          target_value?: number | null
          unit?: string | null
          target_days?: Json | null
          reminder_time?: string | null
          is_active?: boolean
          sort_order?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          frequency?: string | null
          target_value?: number | null
          unit?: string | null
          target_days?: Json | null
          reminder_time?: string | null
          is_active?: boolean
          sort_order?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          date: string
          value: number | null
          is_completed: boolean
          notes: string | null
          logged_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          date: string
          value?: number | null
          is_completed?: boolean
          notes?: string | null
          logged_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          date?: string
          value?: number | null
          is_completed?: boolean
          notes?: string | null
          logged_at?: string
        }
      }
      daily_nutrition: {
        Row: {
          id: string
          date: string
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          fiber_g: number | null
          water_ml: number | null
          source: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          water_ml?: number | null
          source?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          water_ml?: number | null
          source?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      supplements: {
        Row: {
          id: string
          name: string
          brand: string | null
          category: string | null
          dosage_amount: number | null
          dosage_unit: string | null
          frequency: string | null
          timing: string | null
          cycle_on_days: number | null
          cycle_off_days: number | null
          current_stock: number | null
          reorder_threshold: number | null
          supplier: string | null
          cost_per_unit: number | null
          is_active: boolean
          notes: string | null
          warnings: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          brand?: string | null
          category?: string | null
          dosage_amount?: number | null
          dosage_unit?: string | null
          frequency?: string | null
          timing?: string | null
          cycle_on_days?: number | null
          cycle_off_days?: number | null
          current_stock?: number | null
          reorder_threshold?: number | null
          supplier?: string | null
          cost_per_unit?: number | null
          is_active?: boolean
          notes?: string | null
          warnings?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string | null
          category?: string | null
          dosage_amount?: number | null
          dosage_unit?: string | null
          frequency?: string | null
          timing?: string | null
          cycle_on_days?: number | null
          cycle_off_days?: number | null
          current_stock?: number | null
          reorder_threshold?: number | null
          supplier?: string | null
          cost_per_unit?: number | null
          is_active?: boolean
          notes?: string | null
          warnings?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      supplement_logs: {
        Row: {
          id: string
          supplement_id: string
          date: string
          time: string | null
          dosage_taken: number | null
          is_taken: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          supplement_id: string
          date: string
          time?: string | null
          dosage_taken?: number | null
          is_taken?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          supplement_id?: string
          date?: string
          time?: string | null
          dosage_taken?: number | null
          is_taken?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      supplement_cycles: {
        Row: {
          id: string
          name: string
          supplements: Json | null
          start_date: string | null
          end_date: string | null
          status: string | null
          protocol: Json | null
          notes: string | null
          results: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          supplements?: Json | null
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          protocol?: Json | null
          notes?: string | null
          results?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          supplements?: Json | null
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          protocol?: Json | null
          notes?: string | null
          results?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      garmin_daily_stats: {
        Row: {
          id: string
          date: string
          sleep_score: number | null
          sleep_duration_minutes: number | null
          deep_sleep_minutes: number | null
          light_sleep_minutes: number | null
          rem_sleep_minutes: number | null
          awake_minutes: number | null
          body_battery_start: number | null
          body_battery_end: number | null
          body_battery_charged: number | null
          body_battery_drained: number | null
          stress_avg: number | null
          stress_max: number | null
          rest_stress_minutes: number | null
          low_stress_minutes: number | null
          medium_stress_minutes: number | null
          high_stress_minutes: number | null
          steps: number | null
          active_calories: number | null
          total_calories: number | null
          intensity_minutes: number | null
          floors_climbed: number | null
          resting_hr: number | null
          hrv_status: string | null
          hrv_value: number | null
          synced_at: string
        }
        Insert: {
          id?: string
          date: string
          sleep_score?: number | null
          sleep_duration_minutes?: number | null
          deep_sleep_minutes?: number | null
          light_sleep_minutes?: number | null
          rem_sleep_minutes?: number | null
          awake_minutes?: number | null
          body_battery_start?: number | null
          body_battery_end?: number | null
          body_battery_charged?: number | null
          body_battery_drained?: number | null
          stress_avg?: number | null
          stress_max?: number | null
          rest_stress_minutes?: number | null
          low_stress_minutes?: number | null
          medium_stress_minutes?: number | null
          high_stress_minutes?: number | null
          steps?: number | null
          active_calories?: number | null
          total_calories?: number | null
          intensity_minutes?: number | null
          floors_climbed?: number | null
          resting_hr?: number | null
          hrv_status?: string | null
          hrv_value?: number | null
          synced_at?: string
        }
        Update: {
          id?: string
          date?: string
          sleep_score?: number | null
          sleep_duration_minutes?: number | null
          deep_sleep_minutes?: number | null
          light_sleep_minutes?: number | null
          rem_sleep_minutes?: number | null
          awake_minutes?: number | null
          body_battery_start?: number | null
          body_battery_end?: number | null
          body_battery_charged?: number | null
          body_battery_drained?: number | null
          stress_avg?: number | null
          stress_max?: number | null
          rest_stress_minutes?: number | null
          low_stress_minutes?: number | null
          medium_stress_minutes?: number | null
          high_stress_minutes?: number | null
          steps?: number | null
          active_calories?: number | null
          total_calories?: number | null
          intensity_minutes?: number | null
          floors_climbed?: number | null
          resting_hr?: number | null
          hrv_status?: string | null
          hrv_value?: number | null
          synced_at?: string
        }
      }
      training_plans: {
        Row: {
          id: string
          name: string
          type: string | null
          days_per_week: number | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: string | null
          days_per_week?: number | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string | null
          days_per_week?: number | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      training_plan_days: {
        Row: {
          id: string
          plan_id: string
          day_of_week: number | null
          name: string | null
          focus_areas: Json | null
          estimated_duration_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          day_of_week?: number | null
          name?: string | null
          focus_areas?: Json | null
          estimated_duration_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          day_of_week?: number | null
          name?: string | null
          focus_areas?: Json | null
          estimated_duration_minutes?: number | null
          created_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          muscle_group: string | null
          equipment_needed: string | null
          instructions: string | null
          video_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          muscle_group?: string | null
          equipment_needed?: string | null
          instructions?: string | null
          video_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          muscle_group?: string | null
          equipment_needed?: string | null
          instructions?: string | null
          video_url?: string | null
          created_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          date: string
          plan_day_id: string | null
          start_time: string | null
          end_time: string | null
          duration_minutes: number | null
          type: string | null
          location: string | null
          garmin_activity_id: string | null
          avg_hr: number | null
          max_hr: number | null
          calories_burned: number | null
          perceived_exertion: number | null
          energy_level_before: number | null
          mood_after: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          plan_day_id?: string | null
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          type?: string | null
          location?: string | null
          garmin_activity_id?: string | null
          avg_hr?: number | null
          max_hr?: number | null
          calories_burned?: number | null
          perceived_exertion?: number | null
          energy_level_before?: number | null
          mood_after?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          plan_day_id?: string | null
          start_time?: string | null
          end_time?: string | null
          duration_minutes?: number | null
          type?: string | null
          location?: string | null
          garmin_activity_id?: string | null
          avg_hr?: number | null
          max_hr?: number | null
          calories_burned?: number | null
          perceived_exertion?: number | null
          energy_level_before?: number | null
          mood_after?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      workout_sets: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          set_number: number | null
          weight: number | null
          reps: number | null
          is_warmup: boolean
          is_pr: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          set_number?: number | null
          weight?: number | null
          reps?: number | null
          is_warmup?: boolean
          is_pr?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          set_number?: number | null
          weight?: number | null
          reps?: number | null
          is_warmup?: boolean
          is_pr?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      daily_readiness: {
        Row: {
          id: string
          date: string
          sleep_score: number | null
          hrv_status: string | null
          body_battery: number | null
          stress_avg: number | null
          previous_workout_intensity: number | null
          readiness_score: number | null
          recommendation: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          sleep_score?: number | null
          hrv_status?: string | null
          body_battery?: number | null
          stress_avg?: number | null
          previous_workout_intensity?: number | null
          readiness_score?: number | null
          recommendation?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          sleep_score?: number | null
          hrv_status?: string | null
          body_battery?: number | null
          stress_avg?: number | null
          previous_workout_intensity?: number | null
          readiness_score?: number | null
          recommendation?: string | null
          notes?: string | null
          created_at?: string
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Goals Module (00005_goals_module)
      // ─────────────────────────────────────────────────────────────
      goals: {
        Row: {
          id: string
          title: string
          description: string | null
          timeframe: string
          parent_goal_id: string | null
          area: string | null
          start_date: string | null
          end_date: string | null
          year: number | null
          quarter: number | null
          month: number | null
          week: number | null
          target_type: string | null
          target_value: number | null
          current_value: number | null
          unit: string | null
          progress_percent: number | null
          status: string
          priority: number | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          timeframe: string
          parent_goal_id?: string | null
          area?: string | null
          start_date?: string | null
          end_date?: string | null
          year?: number | null
          quarter?: number | null
          month?: number | null
          week?: number | null
          target_type?: string | null
          target_value?: number | null
          current_value?: number | null
          unit?: string | null
          progress_percent?: number | null
          status?: string
          priority?: number | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          timeframe?: string
          parent_goal_id?: string | null
          area?: string | null
          start_date?: string | null
          end_date?: string | null
          year?: number | null
          quarter?: number | null
          month?: number | null
          week?: number | null
          target_type?: string | null
          target_value?: number | null
          current_value?: number | null
          unit?: string | null
          progress_percent?: number | null
          status?: string
          priority?: number | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      goal_key_results: {
        Row: {
          id: string
          goal_id: string
          title: string
          target_value: number | null
          current_value: number | null
          unit: string | null
          progress_percent: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          title: string
          target_value?: number | null
          current_value?: number | null
          unit?: string | null
          progress_percent?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          title?: string
          target_value?: number | null
          current_value?: number | null
          unit?: string | null
          progress_percent?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      goal_checkins: {
        Row: {
          id: string
          goal_id: string
          date: string
          progress_update: string | null
          blockers: string | null
          next_actions: string | null
          confidence_level: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          date: string
          progress_update?: string | null
          blockers?: string | null
          next_actions?: string | null
          confidence_level?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          date?: string
          progress_update?: string | null
          blockers?: string | null
          next_actions?: string | null
          confidence_level?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      daily_logs: {
        Row: {
          id: string
          date: string
          morning_mood: number | null
          morning_energy: number | null
          morning_intention: string | null
          top_3_priorities: Json | null
          evening_mood: number | null
          evening_energy: number | null
          wins: Json | null
          lessons: Json | null
          gratitude: Json | null
          tomorrow_focus: string | null
          tasks_completed_count: number | null
          tasks_total_count: number | null
          billable_hours: number | null
          meetings_count: number | null
          habits_completed_percent: number | null
          garmin_stats_id: string | null
          nutrition_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          morning_mood?: number | null
          morning_energy?: number | null
          morning_intention?: string | null
          top_3_priorities?: Json | null
          evening_mood?: number | null
          evening_energy?: number | null
          wins?: Json | null
          lessons?: Json | null
          gratitude?: Json | null
          tomorrow_focus?: string | null
          tasks_completed_count?: number | null
          tasks_total_count?: number | null
          billable_hours?: number | null
          meetings_count?: number | null
          habits_completed_percent?: number | null
          garmin_stats_id?: string | null
          nutrition_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          morning_mood?: number | null
          morning_energy?: number | null
          morning_intention?: string | null
          top_3_priorities?: Json | null
          evening_mood?: number | null
          evening_energy?: number | null
          wins?: Json | null
          lessons?: Json | null
          gratitude?: Json | null
          tomorrow_focus?: string | null
          tasks_completed_count?: number | null
          tasks_total_count?: number | null
          billable_hours?: number | null
          meetings_count?: number | null
          habits_completed_percent?: number | null
          garmin_stats_id?: string | null
          nutrition_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_reviews: {
        Row: {
          id: string
          year: number
          week_number: number
          start_date: string | null
          end_date: string | null
          tasks_completed: number | null
          tasks_created: number | null
          tasks_overdue: number | null
          meetings_count: number | null
          meetings_hours: number | null
          billable_hours: number | null
          billable_revenue: number | null
          focus_sessions_count: number | null
          focus_hours_total: number | null
          inbox_processed: number | null
          inbox_remaining: number | null
          weekly_goals_completed: Json | null
          weekly_goals_missed: Json | null
          avg_sleep_score: number | null
          avg_stress: number | null
          workouts_completed: number | null
          workouts_planned: number | null
          habits_completion_rate: number | null
          wins: Json | null
          challenges: Json | null
          lessons_learned: string | null
          next_week_focus: string | null
          overall_rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          year: number
          week_number: number
          start_date?: string | null
          end_date?: string | null
          tasks_completed?: number | null
          tasks_created?: number | null
          tasks_overdue?: number | null
          meetings_count?: number | null
          meetings_hours?: number | null
          billable_hours?: number | null
          billable_revenue?: number | null
          focus_sessions_count?: number | null
          focus_hours_total?: number | null
          inbox_processed?: number | null
          inbox_remaining?: number | null
          weekly_goals_completed?: Json | null
          weekly_goals_missed?: Json | null
          avg_sleep_score?: number | null
          avg_stress?: number | null
          workouts_completed?: number | null
          workouts_planned?: number | null
          habits_completion_rate?: number | null
          wins?: Json | null
          challenges?: Json | null
          lessons_learned?: string | null
          next_week_focus?: string | null
          overall_rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          year?: number
          week_number?: number
          start_date?: string | null
          end_date?: string | null
          tasks_completed?: number | null
          tasks_created?: number | null
          tasks_overdue?: number | null
          meetings_count?: number | null
          meetings_hours?: number | null
          billable_hours?: number | null
          billable_revenue?: number | null
          focus_sessions_count?: number | null
          focus_hours_total?: number | null
          inbox_processed?: number | null
          inbox_remaining?: number | null
          weekly_goals_completed?: Json | null
          weekly_goals_missed?: Json | null
          avg_sleep_score?: number | null
          avg_stress?: number | null
          workouts_completed?: number | null
          workouts_planned?: number | null
          habits_completion_rate?: number | null
          wins?: Json | null
          challenges?: Json | null
          lessons_learned?: string | null
          next_week_focus?: string | null
          overall_rating?: number | null
          created_at?: string
        }
      }

      // ─────────────────────────────────────────────────────────────
      // AI Copilot Module (00006_ai_copilot_module)
      // ─────────────────────────────────────────────────────────────
      ai_insights: {
        Row: {
          id: string
          insight_type: string | null
          category: string | null
          priority: string | null
          title: string | null
          message: string | null
          data: Json | null
          suggested_actions: Json | null
          is_read: boolean
          is_actioned: boolean
          related_entity_type: string | null
          related_entity_id: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          insight_type?: string | null
          category?: string | null
          priority?: string | null
          title?: string | null
          message?: string | null
          data?: Json | null
          suggested_actions?: Json | null
          is_read?: boolean
          is_actioned?: boolean
          related_entity_type?: string | null
          related_entity_id?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          insight_type?: string | null
          category?: string | null
          priority?: string | null
          title?: string | null
          message?: string | null
          data?: Json | null
          suggested_actions?: Json | null
          is_read?: boolean
          is_actioned?: boolean
          related_entity_type?: string | null
          related_entity_id?: string | null
          created_at?: string
          expires_at?: string | null
        }
      }
      telegram_messages: {
        Row: {
          id: string
          telegram_message_id: number | null
          chat_id: number | null
          direction: string | null
          message_type: string | null
          content: string | null
          transcription: string | null
          intent_detected: string | null
          entities_extracted: Json | null
          action_taken: string | null
          response_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          telegram_message_id?: number | null
          chat_id?: number | null
          direction?: string | null
          message_type?: string | null
          content?: string | null
          transcription?: string | null
          intent_detected?: string | null
          entities_extracted?: Json | null
          action_taken?: string | null
          response_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          telegram_message_id?: number | null
          chat_id?: number | null
          direction?: string | null
          message_type?: string | null
          content?: string | null
          transcription?: string | null
          intent_detected?: string | null
          entities_extracted?: Json | null
          action_taken?: string | null
          response_time_ms?: number | null
          created_at?: string
        }
      }
      telegram_reminders: {
        Row: {
          id: string
          reminder_type: string | null
          scheduled_time: string | null
          scheduled_days: Json | null
          message_template: string | null
          is_active: boolean
          last_sent_at: string | null
          conditions: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reminder_type?: string | null
          scheduled_time?: string | null
          scheduled_days?: Json | null
          message_template?: string | null
          is_active?: boolean
          last_sent_at?: string | null
          conditions?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reminder_type?: string | null
          scheduled_time?: string | null
          scheduled_days?: Json | null
          message_template?: string | null
          is_active?: boolean
          last_sent_at?: string | null
          conditions?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          document_id: string
          document_title: string
          document_type: string
          property_name: string
          chunk_index: number
          content: string
          similarity: number
        }[]
      }
      match_documents_by_property: {
        Args: {
          query_embedding: number[]
          filter_property_id: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          document_id: string
          document_title: string
          document_type: string
          chunk_index: number
          content: string
          similarity: number
        }[]
      }
      match_documents_by_type: {
        Args: {
          query_embedding: number[]
          filter_document_type: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          document_id: string
          document_title: string
          property_name: string
          chunk_index: number
          content: string
          similarity: number
        }[]
      }
      calculate_readiness_score: {
        Args: {
          target_date: string
        }
        Returns: {
          readiness_score: number
          recommendation: string
          factors: Json
        }[]
      }
      get_habit_streak: {
        Args: {
          p_habit_id: string
        }
        Returns: {
          current_streak: number
          longest_streak: number
          last_completed: string
          completion_rate_30d: number
        }[]
      }
      update_goal_progress: {
        Args: {
          p_goal_id: string
        }
        Returns: void
      }
      get_goal_children: {
        Args: {
          p_goal_id: string
        }
        Returns: {
          id: string
          title: string
          timeframe: string
          progress_percent: number
          status: string
          depth: number
        }[]
      }
      fill_daily_log_stats: {
        Args: {
          target_date: string
        }
        Returns: void
      }
      update_daily_readiness: {
        Args: {
          target_date: string
        }
        Returns: void
      }
      cleanup_old_insights: {
        Args: {
          days_to_keep?: number
        }
        Returns: number
      }
      generate_weekly_review_metrics: {
        Args: {
          p_year: number
          p_week: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Helper Types
// ═══════════════════════════════════════════════════════════════

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]
