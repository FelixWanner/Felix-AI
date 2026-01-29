import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  DailySnapshot,
  Account,
  Loan,
  Portfolio,
  Position,
  Property,
  RecurringTransaction,
  CashflowForecast,
} from '@/types'

// ─────────────────────────────────────────────────────────────
// Net Worth & Snapshots
// ─────────────────────────────────────────────────────────────

export function useLatestSnapshot() {
  return useQuery({
    queryKey: ['latest-snapshot'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_snapshots')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as DailySnapshot | null
    },
  })
}

export function useNetWorthHistory(days = 30) {
  return useQuery({
    queryKey: ['networth-history', days],
    queryFn: async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('daily_snapshots')
        .select('date, net_worth, total_assets, total_liabilities')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error
      return data as Pick<
        DailySnapshot,
        'date' | 'net_worth' | 'total_assets' | 'total_liabilities'
      >[]
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*, bank:banks(name)')
        .eq('is_active', true)
        .order('current_balance', { ascending: false })

      if (error) throw error
      return data as (Account & { bank: { name: string } | null })[]
    },
  })
}

export function useAccountsSummary() {
  return useQuery({
    queryKey: ['accounts-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, account_type, current_balance, property_id')
        .eq('is_active', true)

      if (error) throw error

      const accounts = data as Pick<
        Account,
        'id' | 'name' | 'account_type' | 'current_balance' | 'property_id'
      >[]

      // Calculate totals
      const totalBalance = accounts.reduce(
        (sum, acc) => sum + (acc.current_balance || 0),
        0
      )

      // Group by type
      const byType: Record<string, number> = {}
      accounts.forEach(acc => {
        const type = acc.account_type || 'sonstige'
        byType[type] = (byType[type] || 0) + (acc.current_balance || 0)
      })

      return {
        accounts,
        totalBalance,
        byType,
        count: accounts.length,
      }
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Loans
// ─────────────────────────────────────────────────────────────

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*, property:properties(name), bank:banks(name)')
        .order('current_balance', { ascending: false })

      if (error) throw error
      return data as (Loan & {
        property: { name: string } | null
        bank: { name: string } | null
      })[]
    },
  })
}

export function useLoansSummary() {
  return useQuery({
    queryKey: ['loans-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select(
          'id, current_balance, monthly_payment, interest_rate_nominal, interest_fixed_until'
        )

      if (error) throw error

      const loans = data as Pick<
        Loan,
        | 'id'
        | 'current_balance'
        | 'monthly_payment'
        | 'interest_rate_nominal'
        | 'interest_fixed_until'
      >[]

      const totalBalance = loans.reduce(
        (sum, loan) => sum + (loan.current_balance || 0),
        0
      )
      const totalMonthlyPayment = loans.reduce(
        (sum, loan) => sum + (loan.monthly_payment || 0),
        0
      )

      // Weighted average interest rate
      const weightedRate =
        totalBalance > 0
          ? loans.reduce(
              (sum, loan) =>
                sum +
                ((loan.current_balance || 0) * (loan.interest_rate_nominal || 0)) /
                  totalBalance,
              0
            )
          : 0

      // Find loans expiring soon (within 12 months)
      const now = new Date()
      const in12Months = new Date()
      in12Months.setMonth(in12Months.getMonth() + 12)

      const expiringSoon = loans.filter(loan => {
        if (!loan.interest_fixed_until) return false
        const expiryDate = new Date(loan.interest_fixed_until)
        return expiryDate >= now && expiryDate <= in12Months
      })

      return {
        totalBalance,
        totalMonthlyPayment,
        weightedAverageRate: weightedRate,
        count: loans.length,
        expiringSoonCount: expiringSoon.length,
      }
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Properties
// ─────────────────────────────────────────────────────────────

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('current_value', { ascending: false })

      if (error) throw error
      return data as Property[]
    },
  })
}

export function usePropertiesSummary() {
  return useQuery({
    queryKey: ['properties-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, current_value, unit_count')

      if (error) throw error

      const properties = data as Pick<
        Property,
        'id' | 'name' | 'current_value' | 'unit_count'
      >[]

      const totalValue = properties.reduce(
        (sum, p) => sum + (p.current_value || 0),
        0
      )
      const totalUnits = properties.reduce((sum, p) => sum + (p.unit_count || 0), 0)

      return {
        properties,
        totalValue,
        totalUnits,
        count: properties.length,
      }
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Investments / Portfolios
// ─────────────────────────────────────────────────────────────

export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*, positions(*)')
        .order('name')

      if (error) throw error
      return data as (Portfolio & { positions: Position[] })[]
    },
  })
}

export function useInvestmentsSummary() {
  return useQuery({
    queryKey: ['investments-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('id, name, asset_type, current_value, total_invested, unrealized_gain_loss')

      if (error) throw error

      const positions = data as Pick<
        Position,
        | 'id'
        | 'name'
        | 'asset_type'
        | 'current_value'
        | 'total_invested'
        | 'unrealized_gain_loss'
      >[]

      const totalValue = positions.reduce(
        (sum, p) => sum + (p.current_value || 0),
        0
      )
      const totalInvested = positions.reduce(
        (sum, p) => sum + (p.total_invested || 0),
        0
      )
      const totalGainLoss = positions.reduce(
        (sum, p) => sum + (p.unrealized_gain_loss || 0),
        0
      )

      // Group by asset type
      const byAssetType: Record<string, number> = {}
      positions.forEach(pos => {
        const type = pos.asset_type || 'sonstige'
        byAssetType[type] = (byAssetType[type] || 0) + (pos.current_value || 0)
      })

      return {
        totalValue,
        totalInvested,
        totalGainLoss,
        gainLossPercent:
          totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0,
        byAssetType,
        count: positions.length,
      }
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Companies
// ─────────────────────────────────────────────────────────────

export function useCompaniesSummary() {
  return useQuery({
    queryKey: ['companies-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, your_share_value')

      if (error) throw error

      const companies = data as { id: string; name: string; your_share_value: number | null }[]

      const totalValue = companies.reduce(
        (sum, c) => sum + (c.your_share_value || 0),
        0
      )

      return {
        companies,
        totalValue,
        count: companies.length,
      }
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Cashflow
// ─────────────────────────────────────────────────────────────

export function useRecurringTransactions() {
  return useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('is_active', true)
        .order('day_of_month')

      if (error) throw error
      return data as RecurringTransaction[]
    },
  })
}

export function useMonthlyCashflow() {
  return useQuery({
    queryKey: ['monthly-cashflow'],
    queryFn: async () => {
      // Get recurring transactions
      const { data: recurring, error: recurringError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('is_active', true)

      if (recurringError) throw recurringError

      const transactions = recurring as RecurringTransaction[]

      // Calculate monthly income and expenses
      let monthlyIncome = 0
      let monthlyExpenses = 0

      transactions.forEach(t => {
        const amount = t.amount || 0
        const frequency = t.frequency || 'monthly'

        // Normalize to monthly amount
        let monthlyAmount = amount
        if (frequency === 'yearly') monthlyAmount = amount / 12
        if (frequency === 'quarterly') monthlyAmount = amount / 3
        if (frequency === 'weekly') monthlyAmount = amount * 4.33

        if (t.type === 'income' || amount > 0) {
          monthlyIncome += Math.abs(monthlyAmount)
        } else {
          monthlyExpenses += Math.abs(monthlyAmount)
        }
      })

      // Get loan payments
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('monthly_payment')

      if (loansError) throw loansError

      const loanPayments = (loans as { monthly_payment: number | null }[]).reduce(
        (sum, l) => sum + (l.monthly_payment || 0),
        0
      )

      // Get expected rent from units
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('monthly_rent_cold, monthly_utilities_advance, status')
        .eq('status', 'vermietet')

      if (unitsError) throw unitsError

      const rentalIncome = (
        units as {
          monthly_rent_cold: number | null
          monthly_utilities_advance: number | null
        }[]
      ).reduce(
        (sum, u) =>
          sum + (u.monthly_rent_cold || 0) + (u.monthly_utilities_advance || 0),
        0
      )

      return {
        monthlyIncome: monthlyIncome + rentalIncome,
        monthlyExpenses: monthlyExpenses + loanPayments,
        rentalIncome,
        loanPayments,
        netCashflow: monthlyIncome + rentalIncome - monthlyExpenses - loanPayments,
        recurringCount: transactions.length,
      }
    },
  })
}

export function useCashflowForecast(months = 6) {
  return useQuery({
    queryKey: ['cashflow-forecast', months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashflow_forecast')
        .select('*')
        .order('date', { ascending: true })
        .limit(months)

      if (error) throw error
      return data as CashflowForecast[]
    },
  })
}

// ─────────────────────────────────────────────────────────────
// FIRE Calculation
// ─────────────────────────────────────────────────────────────

export function useFIREProgress() {
  return useQuery({
    queryKey: ['fire-progress'],
    queryFn: async () => {
      // Get latest snapshot
      const { data: snapshot, error: snapshotError } = await supabase
        .from('daily_snapshots')
        .select('net_worth')
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (snapshotError && snapshotError.code !== 'PGRST116') throw snapshotError

      // Get user preferences
      const { data: prefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('fire_target_amount, fire_withdrawal_rate, fire_monthly_expenses')
        .limit(1)
        .single()

      if (prefsError && prefsError.code !== 'PGRST116') throw prefsError

      const netWorth = snapshot?.net_worth || 0
      const targetAmount = prefs?.fire_target_amount || 0
      const withdrawalRate = prefs?.fire_withdrawal_rate || 4
      const monthlyExpenses = prefs?.fire_monthly_expenses || 0

      // Calculate progress
      const progress = targetAmount > 0 ? (netWorth / targetAmount) * 100 : 0

      // Calculate projected passive income (4% rule)
      const annualPassiveIncome = netWorth * (withdrawalRate / 100)
      const monthlyPassiveIncome = annualPassiveIncome / 12

      // Calculate coverage
      const expensesCovered =
        monthlyExpenses > 0 ? (monthlyPassiveIncome / monthlyExpenses) * 100 : 0

      // Estimate years to FIRE (simplified)
      const remaining = targetAmount - netWorth
      // Assume 7% annual return and current savings rate (simplified)
      const yearsToFIRE =
        remaining > 0 && netWorth > 0
          ? Math.log(targetAmount / netWorth) / Math.log(1.07)
          : remaining <= 0
          ? 0
          : null

      return {
        netWorth,
        targetAmount,
        progress: Math.min(100, progress),
        withdrawalRate,
        monthlyExpenses,
        monthlyPassiveIncome,
        expensesCovered,
        yearsToFIRE,
        isAchieved: progress >= 100,
      }
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Combined Asset Allocation
// ─────────────────────────────────────────────────────────────

export function useAssetAllocation() {
  return useQuery({
    queryKey: ['asset-allocation'],
    queryFn: async () => {
      // Get latest snapshot for totals
      const { data: snapshot, error: snapshotError } = await supabase
        .from('daily_snapshots')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (snapshotError && snapshotError.code !== 'PGRST116') throw snapshotError

      const cashValue = snapshot?.cash_value || 0
      const investmentValue = snapshot?.investment_value || 0
      const propertyValue = snapshot?.property_value || 0
      const companyValue = snapshot?.company_value || 0
      const totalAssets = snapshot?.total_assets || 0
      const totalLiabilities = snapshot?.total_liabilities || 0

      return {
        cash: {
          value: cashValue,
          percent: totalAssets > 0 ? (cashValue / totalAssets) * 100 : 0,
        },
        investments: {
          value: investmentValue,
          percent: totalAssets > 0 ? (investmentValue / totalAssets) * 100 : 0,
        },
        properties: {
          value: propertyValue,
          percent: totalAssets > 0 ? (propertyValue / totalAssets) * 100 : 0,
        },
        companies: {
          value: companyValue,
          percent: totalAssets > 0 ? (companyValue / totalAssets) * 100 : 0,
        },
        totalAssets,
        totalLiabilities,
        netWorth: snapshot?.net_worth || 0,
      }
    },
  })
}
