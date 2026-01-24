import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { differenceInMonths, format, subMonths, startOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import type {
  PropertyOperatingData,
  PropertyOperatingDataInsert,
  PropertyOperatingDataUpdate,
  PropertyTechnicalStatus,
  PropertyTechnicalStatusInsert,
  PropertyTechnicalStatusUpdate,
  TenantChange,
  TenantChangeInsert,
  AlertThresholds,
  AlertThresholdsUpdate,
  PortfolioSnapshot,
  PropertyKPIs,
  PortfolioKPIs,
  RealEstateAlert,
  TrendDataPoint,
  WaterfallDataPoint,
  MaturityWallDataPoint,
  RiskBoardProperty,
  BenchmarkDataPoint,
  TrafficLightStatusType,
  DEFAULT_ALERT_THRESHOLDS,
  Property,
  Unit,
  Loan,
} from '@/types'
import { useAuth } from './useAuth'

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function getWorstStatus(statuses: TrafficLightStatusType[]): TrafficLightStatusType {
  if (statuses.includes('red')) return 'red'
  if (statuses.includes('yellow')) return 'yellow'
  return 'green'
}

function calculateDSCR(noi: number, debtService: number): number {
  if (debtService <= 0) return 999 // No debt = infinite coverage
  return noi / debtService
}

function getMonthKey(date: Date): string {
  return format(startOfMonth(date), 'yyyy-MM-dd')
}

// ─────────────────────────────────────────────────────────────
// Property Operating Data CRUD
// ─────────────────────────────────────────────────────────────

export function usePropertyOperatingData(propertyId: string | undefined, months = 12) {
  return useQuery({
    queryKey: ['property-operating-data', propertyId, months],
    queryFn: async () => {
      if (!propertyId) return []

      const startDate = format(subMonths(new Date(), months - 1), 'yyyy-MM-01')

      const { data, error } = await supabase
        .from('property_operating_data')
        .select('*')
        .eq('property_id', propertyId)
        .gte('month', startDate)
        .order('month', { ascending: false })

      if (error) throw error
      return data as PropertyOperatingData[]
    },
    enabled: !!propertyId,
  })
}

export function useUpsertPropertyOperatingData() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: PropertyOperatingDataInsert) => {
      const { data: existing } = await supabase
        .from('property_operating_data')
        .select('id')
        .eq('property_id', data.property_id)
        .eq('month', data.month)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('property_operating_data')
          .update({ ...data, user_id: user?.id })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('property_operating_data')
          .insert({ ...data, user_id: user?.id })
        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-operating-data', variables.property_id] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['property-kpis'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Property Technical Status CRUD
// ─────────────────────────────────────────────────────────────

export function usePropertyTechnicalStatus(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-technical-status', propertyId],
    queryFn: async () => {
      if (!propertyId) return null

      const { data, error } = await supabase
        .from('property_technical_status')
        .select('*')
        .eq('property_id', propertyId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as PropertyTechnicalStatus | null
    },
    enabled: !!propertyId,
  })
}

export function useUpsertPropertyTechnicalStatus() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: PropertyTechnicalStatusInsert | PropertyTechnicalStatusUpdate & { property_id: string }) => {
      const { data: existing } = await supabase
        .from('property_technical_status')
        .select('id')
        .eq('property_id', data.property_id)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('property_technical_status')
          .update({ ...data, user_id: user?.id })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('property_technical_status')
          .insert({ ...data, user_id: user?.id } as PropertyTechnicalStatusInsert)
        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-technical-status', variables.property_id] })
      queryClient.invalidateQueries({ queryKey: ['property-kpis'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Tenant Changes
// ─────────────────────────────────────────────────────────────

export function useTenantChanges(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['tenant-changes', propertyId],
    queryFn: async () => {
      if (!propertyId) return []

      const { data, error } = await supabase
        .from('tenant_changes')
        .select('*')
        .eq('property_id', propertyId)
        .order('change_date', { ascending: false })

      if (error) throw error
      return data as TenantChange[]
    },
    enabled: !!propertyId,
  })
}

export function useAddTenantChange() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: TenantChangeInsert) => {
      const { error } = await supabase
        .from('tenant_changes')
        .insert({ ...data, user_id: user?.id })
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-changes', variables.property_id] })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Alert Thresholds
// ─────────────────────────────────────────────────────────────

export function useAlertThresholds() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['alert-thresholds', user?.id],
    queryFn: async () => {
      if (!user?.id) return DEFAULT_ALERT_THRESHOLDS

      const { data, error } = await supabase
        .from('alert_thresholds')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as AlertThresholds | null
    },
    enabled: !!user?.id,
  })
}

export function useUpdateAlertThresholds() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: Partial<AlertThresholdsUpdate>) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data: existing } = await supabase
        .from('alert_thresholds')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('alert_thresholds')
          .update(data)
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('alert_thresholds')
          .insert({ ...data, user_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] })
      queryClient.invalidateQueries({ queryKey: ['real-estate-alerts'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Property KPIs (computed)
// ─────────────────────────────────────────────────────────────

export function usePropertyKPIs(propertyId?: string) {
  return useQuery({
    queryKey: ['property-kpis', propertyId],
    queryFn: async () => {
      // Fetch all properties
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('*')
        .order('name')

      if (propError) throw propError

      // Filter if propertyId provided
      const targetProperties = propertyId
        ? (properties as Property[]).filter(p => p.id === propertyId)
        : (properties as Property[])

      // Fetch all units
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*')

      if (unitsError) throw unitsError

      // Fetch all loans
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')

      if (loansError) throw loansError

      // Fetch operating data for current month
      const currentMonth = getMonthKey(new Date())
      const { data: operatingData, error: opError } = await supabase
        .from('property_operating_data')
        .select('*')
        .eq('month', currentMonth)

      if (opError) throw opError

      // Fetch technical status
      const { data: technicalStatus, error: techError } = await supabase
        .from('property_technical_status')
        .select('*')

      if (techError) throw techError

      // Fetch tenant changes
      const { data: tenantChanges, error: changeError } = await supabase
        .from('tenant_changes')
        .select('*')
        .order('change_date', { ascending: false })

      if (changeError) throw changeError

      // Calculate KPIs for each property
      const kpis: PropertyKPIs[] = targetProperties.map(property => {
        const propertyUnits = (units as Unit[]).filter(u => u.property_id === property.id)
        const propertyLoans = (loans as Loan[]).filter(l => l.property_id === property.id)
        const opData = (operatingData as PropertyOperatingData[]).find(o => o.property_id === property.id)
        const techStatus = (technicalStatus as PropertyTechnicalStatus[]).find(t => t.property_id === property.id)
        const lastChange = (tenantChanges as TenantChange[]).find(c => c.property_id === property.id)

        // Unit calculations
        const unitCount = propertyUnits.length || property.unit_count || 1
        const occupiedUnits = propertyUnits.filter(u => u.status === 'vermietet').length
        const vacantUnits = propertyUnits.filter(u => u.status === 'leer').length
        const totalSqm = property.total_sqm || propertyUnits.reduce((sum, u) => sum + (u.size_sqm || 0), 0)

        // Rental calculations
        const actualColdRent = opData?.actual_cold_rent ||
          propertyUnits.filter(u => u.status === 'vermietet').reduce((sum, u) => sum + (u.monthly_rent_cold || 0), 0)
        const targetColdRent = opData?.target_cold_rent ||
          propertyUnits.reduce((sum, u) => sum + (u.market_rent_cold || u.monthly_rent_cold || 0), 0)

        // Costs
        const allocableCosts = opData?.allocable_costs || 0
        const nonAllocableCosts = opData?.non_allocable_costs || 0
        const maintenanceActual = opData?.maintenance_actual || 0
        const maintenancePlanned = opData?.maintenance_planned || 0
        const capexActual = opData?.capex_actual || 0
        const capexPlanned = opData?.capex_planned || 0
        const vacancyDays = opData?.vacancy_days || 0
        const rentArrears = opData?.rent_arrears || 0

        // Loan calculations
        const loanBalance = propertyLoans.reduce((sum, l) => sum + (l.current_balance || 0), 0)
        const monthlyDebtService = propertyLoans.reduce((sum, l) => sum + (l.monthly_payment || 0), 0)
        const monthlyInterest = propertyLoans.reduce((sum, l) => {
          const rate = (l.interest_rate_nominal || 0) / 100 / 12
          return sum + ((l.current_balance || 0) * rate)
        }, 0)
        const monthlyPrincipal = monthlyDebtService - monthlyInterest
        const avgInterestRate = loanBalance > 0
          ? propertyLoans.reduce((sum, l) => sum + ((l.current_balance || 0) * (l.interest_rate_nominal || 0)), 0) / loanBalance
          : 0
        const specialRepaymentAllowed = propertyLoans
          .filter(l => l.special_repayment_allowed)
          .reduce((sum, l) => sum + ((l.special_repayment_percent || 0) / 100 * (l.original_amount || 0) - (l.special_repayment_used_this_year || 0)), 0)

        // Earliest interest expiry
        const loansWithExpiry = propertyLoans.filter(l => l.interest_fixed_until)
        const earliestExpiry = loansWithExpiry.length > 0
          ? loansWithExpiry.reduce((earliest, l) =>
              !earliest || (l.interest_fixed_until && l.interest_fixed_until < earliest) ? l.interest_fixed_until : earliest
            , null as string | null)
          : null
        const monthsUntilInterestExpiry = earliestExpiry
          ? differenceInMonths(new Date(earliestExpiry), new Date())
          : null

        // Technical status
        const heatingStatus = (techStatus?.heating_status || 'green') as TrafficLightStatusType
        const roofStatus = (techStatus?.roof_status || 'green') as TrafficLightStatusType
        const moistureStatus = (techStatus?.moisture_status || 'green') as TrafficLightStatusType
        const electricalStatus = (techStatus?.electrical_status || 'green') as TrafficLightStatusType
        const plumbingStatus = (techStatus?.plumbing_status || 'green') as TrafficLightStatusType
        const facadeStatus = (techStatus?.facade_status || 'green') as TrafficLightStatusType
        const windowsStatus = (techStatus?.windows_status || 'green') as TrafficLightStatusType
        const worstTechnicalStatus = getWorstStatus([
          heatingStatus, roofStatus, moistureStatus, electricalStatus, plumbingStatus, facadeStatus, windowsStatus
        ])

        // Valuation
        const currentMarketValue = property.current_value || property.purchase_price || 0
        const conservativeMarketValue = property.conservative_market_value || currentMarketValue
        const equity = conservativeMarketValue - loanBalance
        const ltv = conservativeMarketValue > 0 ? (loanBalance / conservativeMarketValue) * 100 : 0

        // Computed metrics
        const noi = actualColdRent - nonAllocableCosts
        const netCashflow = noi - monthlyDebtService
        const netCashflowWithCapex = netCashflow - capexActual
        const dscr = calculateDSCR(noi, monthlyDebtService)
        const grossYield = currentMarketValue > 0 ? (actualColdRent * 12 / currentMarketValue) * 100 : 0
        const netYield = currentMarketValue > 0 ? (noi * 12 / currentMarketValue) * 100 : 0
        const rentPerSqm = totalSqm > 0 ? actualColdRent / totalSqm : 0
        const targetRentPerSqm = totalSqm > 0 ? targetColdRent / totalSqm : 0
        const costsPerSqm = totalSqm > 0 ? nonAllocableCosts / totalSqm : 0
        const capexPerSqm = totalSqm > 0 ? capexActual / totalSqm : 0
        const vacancyRate = unitCount > 0 ? (vacantUnits / unitCount) * 100 : 0
        const arrearsRate = actualColdRent > 0 ? (rentArrears / actualColdRent) * 100 : 0
        const capexBudgetUsed = capexPlanned > 0 ? (capexActual / capexPlanned) * 100 : 0

        return {
          propertyId: property.id,
          propertyName: property.name,
          propertyAddress: property.address,
          actualColdRent,
          targetColdRent,
          vacancyDays,
          rentArrears,
          allocableCosts,
          nonAllocableCosts,
          maintenanceActual,
          maintenancePlanned,
          capexActual,
          capexPlanned,
          loanBalance,
          monthlyDebtService,
          monthlyInterest,
          monthlyPrincipal,
          interestRate: avgInterestRate,
          interestFixedUntil: earliestExpiry,
          monthsUntilInterestExpiry,
          specialRepaymentAllowed,
          totalSqm,
          unitCount,
          occupiedUnits,
          vacantUnits,
          lastTenantChange: lastChange?.change_date || null,
          heatingStatus,
          roofStatus,
          moistureStatus,
          electricalStatus,
          plumbingStatus,
          facadeStatus,
          windowsStatus,
          worstTechnicalStatus,
          currentMarketValue,
          conservativeMarketValue,
          equity,
          ltv,
          noi,
          netCashflow,
          netCashflowWithCapex,
          dscr,
          grossYield,
          netYield,
          rentPerSqm,
          targetRentPerSqm,
          costsPerSqm,
          capexPerSqm,
          vacancyRate,
          arrearsRate,
          capexBudgetUsed,
        } as PropertyKPIs
      })

      return propertyId ? kpis[0] || null : kpis
    },
    staleTime: 60000,
  })
}

// ─────────────────────────────────────────────────────────────
// Portfolio KPIs (aggregated)
// ─────────────────────────────────────────────────────────────

export function usePortfolioKPIs() {
  const { data: propertyKPIs } = usePropertyKPIs()

  return useQuery({
    queryKey: ['portfolio-kpis'],
    queryFn: async () => {
      const kpis = propertyKPIs as PropertyKPIs[] | undefined
      if (!kpis || kpis.length === 0) {
        return null
      }

      // Aggregate all properties
      const totalPropertyValue = kpis.reduce((sum, p) => sum + p.currentMarketValue, 0)
      const totalConservativeValue = kpis.reduce((sum, p) => sum + p.conservativeMarketValue, 0)
      const totalLoanBalance = kpis.reduce((sum, p) => sum + p.loanBalance, 0)
      const totalEquity = kpis.reduce((sum, p) => sum + p.equity, 0)
      const portfolioLTV = totalConservativeValue > 0 ? (totalLoanBalance / totalConservativeValue) * 100 : 0

      const totalActualRent = kpis.reduce((sum, p) => sum + p.actualColdRent, 0)
      const totalTargetRent = kpis.reduce((sum, p) => sum + p.targetColdRent, 0)
      const totalAllocableCosts = kpis.reduce((sum, p) => sum + p.allocableCosts, 0)
      const totalNonAllocableCosts = kpis.reduce((sum, p) => sum + p.nonAllocableCosts, 0)
      const totalDebtService = kpis.reduce((sum, p) => sum + p.monthlyDebtService, 0)
      const totalNOI = kpis.reduce((sum, p) => sum + p.noi, 0)
      const netCashflow = kpis.reduce((sum, p) => sum + p.netCashflow, 0)
      const totalCapexActual = kpis.reduce((sum, p) => sum + p.capexActual, 0)
      const netCashflowWithCapex = netCashflow - totalCapexActual

      const dscr = calculateDSCR(totalNOI, totalDebtService)

      // Units
      const totalUnits = kpis.reduce((sum, p) => sum + p.unitCount, 0)
      const occupiedUnits = kpis.reduce((sum, p) => sum + p.occupiedUnits, 0)
      const vacantUnits = kpis.reduce((sum, p) => sum + p.vacantUnits, 0)
      const vacancyRateUnits = totalUnits > 0 ? (vacantUnits / totalUnits) * 100 : 0

      // Area
      const totalSqm = kpis.reduce((sum, p) => sum + p.totalSqm, 0)
      const occupiedSqm = kpis.reduce((sum, p) => sum + (p.totalSqm * (p.occupiedUnits / Math.max(p.unitCount, 1))), 0)
      const vacancyRateSqm = totalSqm > 0 ? ((totalSqm - occupiedSqm) / totalSqm) * 100 : 0

      // Arrears
      const totalArrears = kpis.reduce((sum, p) => sum + p.rentArrears, 0)
      const arrearsRate = totalActualRent > 0 ? (totalArrears / totalActualRent) * 100 : 0
      const rentLossRate = totalTargetRent > 0 ? ((totalTargetRent - totalActualRent) / totalTargetRent) * 100 : 0

      // CapEx
      const totalCapexPlanned = kpis.reduce((sum, p) => sum + p.capexPlanned, 0)
      const capexPerSqmAnnual = totalSqm > 0 ? (totalCapexActual * 12) / totalSqm : 0
      const capexBudgetUsedPercent = totalCapexPlanned > 0 ? (totalCapexActual / totalCapexPlanned) * 100 : 0

      // Cash-on-Cash (approximation using purchase price as equity invested)
      const { data: properties } = await supabase.from('properties').select('purchase_price')
      const totalEquityInvested = (properties || []).reduce((sum, p: { purchase_price: number | null }) => sum + (p.purchase_price || 0), 0) - totalLoanBalance
      const annualNetCashflow = netCashflow * 12
      const cashOnCash = totalEquityInvested > 0 ? (annualNetCashflow / totalEquityInvested) * 100 : 0

      // Risk metrics
      const loansExpiringWithin12Months = kpis.filter(p =>
        p.monthsUntilInterestExpiry !== null && p.monthsUntilInterestExpiry <= 12
      ).length
      const loansExpiringWithin24Months = kpis.filter(p =>
        p.monthsUntilInterestExpiry !== null && p.monthsUntilInterestExpiry <= 24
      ).length
      const refinancingRiskAmount = kpis
        .filter(p => p.monthsUntilInterestExpiry !== null && p.monthsUntilInterestExpiry <= 24)
        .reduce((sum, p) => sum + p.loanBalance, 0)
      const avgWeightedInterestRate = totalLoanBalance > 0
        ? kpis.reduce((sum, p) => sum + (p.loanBalance * p.interestRate), 0) / totalLoanBalance
        : 0
      const propertiesWithTechnicalIssues = kpis.filter(p =>
        p.worstTechnicalStatus === 'red' || p.worstTechnicalStatus === 'yellow'
      ).length

      return {
        totalPropertyValue,
        totalConservativeValue,
        totalLoanBalance,
        totalEquity,
        portfolioLTV,
        totalActualRent,
        totalTargetRent,
        totalAllocableCosts,
        totalNonAllocableCosts,
        totalDebtService,
        totalNOI,
        netCashflow,
        netCashflowWithCapex,
        dscr,
        vacancyRateUnits,
        vacancyRateSqm,
        arrearsRate,
        rentLossRate,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        totalSqm,
        occupiedSqm,
        totalCapexActual,
        totalCapexPlanned,
        capexPerSqmAnnual,
        capexBudgetUsedPercent,
        totalEquityInvested,
        annualNetCashflow,
        cashOnCash,
        loansExpiringWithin12Months,
        loansExpiringWithin24Months,
        refinancingRiskAmount,
        avgWeightedInterestRate,
        propertiesWithTechnicalIssues,
      } as PortfolioKPIs
    },
    enabled: !!propertyKPIs && (propertyKPIs as PropertyKPIs[]).length > 0,
    staleTime: 60000,
  })
}

// ─────────────────────────────────────────────────────────────
// Real Estate Alerts
// ─────────────────────────────────────────────────────────────

export function useRealEstateAlerts() {
  const { data: propertyKPIs } = usePropertyKPIs()
  const { data: thresholds } = useAlertThresholds()

  return useQuery({
    queryKey: ['real-estate-alerts', propertyKPIs, thresholds],
    queryFn: () => {
      const kpis = propertyKPIs as PropertyKPIs[] | undefined
      if (!kpis) return []

      const t = thresholds || DEFAULT_ALERT_THRESHOLDS
      const alerts: RealEstateAlert[] = []
      let alertId = 0

      kpis.forEach(prop => {
        // DSCR Check
        if (prop.dscr < (t.dscr_critical ?? DEFAULT_ALERT_THRESHOLDS.dscr_critical)) {
          alerts.push({
            id: `alert-${++alertId}`,
            type: 'dscr_low',
            severity: 'critical',
            title: `DSCR kritisch: ${prop.propertyName}`,
            message: `DSCR von ${prop.dscr.toFixed(2)} liegt unter ${t.dscr_critical}`,
            propertyId: prop.propertyId,
            propertyName: prop.propertyName,
            value: prop.dscr,
            threshold: t.dscr_critical ?? undefined,
            actionUrl: `/wealth/properties/${prop.propertyId}`,
            createdAt: new Date().toISOString(),
          })
        } else if (prop.dscr < (t.dscr_warning ?? DEFAULT_ALERT_THRESHOLDS.dscr_warning)) {
          alerts.push({
            id: `alert-${++alertId}`,
            type: 'dscr_low',
            severity: 'warning',
            title: `DSCR niedrig: ${prop.propertyName}`,
            message: `DSCR von ${prop.dscr.toFixed(2)} liegt unter ${t.dscr_warning}`,
            propertyId: prop.propertyId,
            propertyName: prop.propertyName,
            value: prop.dscr,
            threshold: t.dscr_warning ?? undefined,
            actionUrl: `/wealth/properties/${prop.propertyId}`,
            createdAt: new Date().toISOString(),
          })
        }

        // Interest Expiry Check
        if (prop.monthsUntilInterestExpiry !== null) {
          const ltv_high = t.ltv_high_threshold ?? DEFAULT_ALERT_THRESHOLDS.ltv_high_threshold
          if (
            prop.monthsUntilInterestExpiry <= (t.interest_expiry_critical_months ?? DEFAULT_ALERT_THRESHOLDS.interest_expiry_critical_months) &&
            prop.ltv > ltv_high
          ) {
            alerts.push({
              id: `alert-${++alertId}`,
              type: 'high_ltv_refinancing',
              severity: 'critical',
              title: `Refinanzierungsrisiko: ${prop.propertyName}`,
              message: `Zinsbindung endet in ${prop.monthsUntilInterestExpiry} Monaten bei LTV ${prop.ltv.toFixed(1)}%`,
              propertyId: prop.propertyId,
              propertyName: prop.propertyName,
              value: prop.monthsUntilInterestExpiry,
              threshold: t.interest_expiry_critical_months ?? undefined,
              actionUrl: `/wealth/properties/${prop.propertyId}`,
              createdAt: new Date().toISOString(),
            })
          } else if (prop.monthsUntilInterestExpiry <= (t.interest_expiry_warning_months ?? DEFAULT_ALERT_THRESHOLDS.interest_expiry_warning_months)) {
            alerts.push({
              id: `alert-${++alertId}`,
              type: 'interest_expiring',
              severity: 'warning',
              title: `Zinsbindung endet: ${prop.propertyName}`,
              message: `Zinsbindung endet in ${prop.monthsUntilInterestExpiry} Monaten`,
              propertyId: prop.propertyId,
              propertyName: prop.propertyName,
              value: prop.monthsUntilInterestExpiry,
              threshold: t.interest_expiry_warning_months ?? undefined,
              actionUrl: `/wealth/properties/${prop.propertyId}`,
              createdAt: new Date().toISOString(),
            })
          }
        }

        // Rent Arrears Check
        const arrearsMonths = prop.actualColdRent > 0 ? prop.rentArrears / prop.actualColdRent : 0
        if (arrearsMonths >= (t.arrears_critical_months ?? DEFAULT_ALERT_THRESHOLDS.arrears_critical_months)) {
          alerts.push({
            id: `alert-${++alertId}`,
            type: 'rent_arrears',
            severity: 'critical',
            title: `Mietrückstände kritisch: ${prop.propertyName}`,
            message: `Rückstände von ${prop.rentArrears.toFixed(0)} € (${arrearsMonths.toFixed(1)} Monatsmieten)`,
            propertyId: prop.propertyId,
            propertyName: prop.propertyName,
            value: arrearsMonths,
            threshold: t.arrears_critical_months ?? undefined,
            actionUrl: `/wealth/properties/${prop.propertyId}`,
            createdAt: new Date().toISOString(),
          })
        } else if (arrearsMonths >= (t.arrears_warning_months ?? DEFAULT_ALERT_THRESHOLDS.arrears_warning_months)) {
          alerts.push({
            id: `alert-${++alertId}`,
            type: 'rent_arrears',
            severity: 'warning',
            title: `Mietrückstände: ${prop.propertyName}`,
            message: `Rückstände von ${prop.rentArrears.toFixed(0)} € (${arrearsMonths.toFixed(1)} Monatsmieten)`,
            propertyId: prop.propertyId,
            propertyName: prop.propertyName,
            value: arrearsMonths,
            threshold: t.arrears_warning_months ?? undefined,
            actionUrl: `/wealth/properties/${prop.propertyId}`,
            createdAt: new Date().toISOString(),
          })
        }

        // Vacancy Check
        if (prop.vacancyDays >= (t.vacancy_critical_days ?? DEFAULT_ALERT_THRESHOLDS.vacancy_critical_days)) {
          alerts.push({
            id: `alert-${++alertId}`,
            type: 'vacancy_long',
            severity: 'critical',
            title: `Langer Leerstand: ${prop.propertyName}`,
            message: `${prop.vacancyDays} Tage Leerstand`,
            propertyId: prop.propertyId,
            propertyName: prop.propertyName,
            value: prop.vacancyDays,
            threshold: t.vacancy_critical_days ?? undefined,
            actionUrl: `/wealth/properties/${prop.propertyId}`,
            createdAt: new Date().toISOString(),
          })
        } else if (prop.vacancyDays >= (t.vacancy_warning_days ?? DEFAULT_ALERT_THRESHOLDS.vacancy_warning_days)) {
          alerts.push({
            id: `alert-${++alertId}`,
            type: 'vacancy_long',
            severity: 'warning',
            title: `Leerstand: ${prop.propertyName}`,
            message: `${prop.vacancyDays} Tage Leerstand`,
            propertyId: prop.propertyId,
            propertyName: prop.propertyName,
            value: prop.vacancyDays,
            threshold: t.vacancy_warning_days ?? undefined,
            actionUrl: `/wealth/properties/${prop.propertyId}`,
            createdAt: new Date().toISOString(),
          })
        }

        // CapEx Budget Check
        if (prop.capexPlanned > 0) {
          if (prop.capexBudgetUsed >= (t.capex_critical_percent ?? DEFAULT_ALERT_THRESHOLDS.capex_critical_percent)) {
            alerts.push({
              id: `alert-${++alertId}`,
              type: 'capex_budget_high',
              severity: 'critical',
              title: `CapEx-Budget überschritten: ${prop.propertyName}`,
              message: `${prop.capexBudgetUsed.toFixed(0)}% des CapEx-Budgets verbraucht`,
              propertyId: prop.propertyId,
              propertyName: prop.propertyName,
              value: prop.capexBudgetUsed,
              threshold: t.capex_critical_percent ?? undefined,
              actionUrl: `/wealth/properties/${prop.propertyId}`,
              createdAt: new Date().toISOString(),
            })
          } else if (prop.capexBudgetUsed >= (t.capex_warning_percent ?? DEFAULT_ALERT_THRESHOLDS.capex_warning_percent)) {
            alerts.push({
              id: `alert-${++alertId}`,
              type: 'capex_budget_high',
              severity: 'warning',
              title: `CapEx-Budget hoch: ${prop.propertyName}`,
              message: `${prop.capexBudgetUsed.toFixed(0)}% des CapEx-Budgets verbraucht`,
              propertyId: prop.propertyId,
              propertyName: prop.propertyName,
              value: prop.capexBudgetUsed,
              threshold: t.capex_warning_percent ?? undefined,
              actionUrl: `/wealth/properties/${prop.propertyId}`,
              createdAt: new Date().toISOString(),
            })
          }
        }

        // Technical Status Check
        if (prop.worstTechnicalStatus === 'red') {
          alerts.push({
            id: `alert-${++alertId}`,
            type: 'technical_issue',
            severity: 'critical',
            title: `Technisches Problem: ${prop.propertyName}`,
            message: 'Kritischer technischer Zustand erfordert Aufmerksamkeit',
            propertyId: prop.propertyId,
            propertyName: prop.propertyName,
            actionUrl: `/wealth/properties/${prop.propertyId}`,
            createdAt: new Date().toISOString(),
          })
        } else if (prop.worstTechnicalStatus === 'yellow') {
          alerts.push({
            id: `alert-${++alertId}`,
            type: 'technical_issue',
            severity: 'warning',
            title: `Technische Prüfung: ${prop.propertyName}`,
            message: 'Technischer Zustand sollte überprüft werden',
            propertyId: prop.propertyId,
            propertyName: prop.propertyName,
            actionUrl: `/wealth/properties/${prop.propertyId}`,
            createdAt: new Date().toISOString(),
          })
        }
      })

      // Sort by severity
      const severityOrder = { critical: 0, warning: 1, info: 2 }
      return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    },
    enabled: !!propertyKPIs,
  })
}

// ─────────────────────────────────────────────────────────────
// Trend Data (12 months)
// ─────────────────────────────────────────────────────────────

export function useTrendData(months = 12) {
  return useQuery({
    queryKey: ['trend-data', months],
    queryFn: async () => {
      const startDate = format(subMonths(new Date(), months - 1), 'yyyy-MM-01')

      const { data, error } = await supabase
        .from('property_operating_data')
        .select('*')
        .gte('month', startDate)
        .order('month', { ascending: true })

      if (error) throw error

      // Group by month and aggregate
      const monthlyData = new Map<string, TrendDataPoint>()

      // Initialize all months
      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        const monthKey = format(date, 'yyyy-MM')
        monthlyData.set(monthKey, {
          month: monthKey,
          monthLabel: format(date, 'MMM yy', { locale: de }),
          netCashflow: 0,
          vacancyDays: 0,
          rentArrears: 0,
          capex: 0,
          noi: 0,
        })
      }

      // Aggregate data
      (data as PropertyOperatingData[]).forEach(op => {
        const monthKey = format(new Date(op.month), 'yyyy-MM')
        const existing = monthlyData.get(monthKey)
        if (existing) {
          const noi = (op.actual_cold_rent || 0) - (op.non_allocable_costs || 0)
          // Note: For trend data, we'd need to join with loans for accurate netCashflow
          existing.noi += noi
          existing.netCashflow += noi // Simplified - would need debt service for accuracy
          existing.vacancyDays += op.vacancy_days || 0
          existing.rentArrears += op.rent_arrears || 0
          existing.capex += (op.capex_actual || 0)
        }
      })

      return Array.from(monthlyData.values())
    },
    staleTime: 300000, // 5 minutes
  })
}

// ─────────────────────────────────────────────────────────────
// Waterfall Data
// ─────────────────────────────────────────────────────────────

export function useWaterfallData() {
  const { data: portfolioKPIs } = usePortfolioKPIs()

  return useQuery({
    queryKey: ['waterfall-data', portfolioKPIs],
    queryFn: () => {
      if (!portfolioKPIs) return []

      const sollmiete = portfolioKPIs.totalTargetRent
      const leerstand = portfolioKPIs.totalTargetRent - portfolioKPIs.totalActualRent
      const rueckstaende = portfolioKPIs.totalActualRent * (portfolioKPIs.arrearsRate / 100)
      const istmiete = portfolioKPIs.totalActualRent
      const nkUmlagefaehig = portfolioKPIs.totalAllocableCosts
      const nkNichtUmlagefaehig = portfolioKPIs.totalNonAllocableCosts
      const noi = portfolioKPIs.totalNOI
      const schuldendienst = portfolioKPIs.totalDebtService
      const nettoCF = portfolioKPIs.netCashflow

      const data: WaterfallDataPoint[] = [
        { name: 'Soll-Miete', value: sollmiete, cumulative: sollmiete, type: 'start', fill: '#3B82F6' },
        { name: 'Leerstand', value: -leerstand, cumulative: sollmiete - leerstand, type: 'decrease', fill: '#EF4444' },
        { name: 'Rückstände', value: -rueckstaende, cumulative: sollmiete - leerstand - rueckstaende, type: 'decrease', fill: '#F97316' },
        { name: 'Ist-Miete', value: istmiete, cumulative: istmiete, type: 'subtotal', fill: '#10B981' },
        { name: 'NK (umlagef.)', value: nkUmlagefaehig, cumulative: istmiete + nkUmlagefaehig, type: 'increase', fill: '#6366F1' },
        { name: 'NK (n.umlagef.)', value: -nkNichtUmlagefaehig, cumulative: istmiete + nkUmlagefaehig - nkNichtUmlagefaehig, type: 'decrease', fill: '#EF4444' },
        { name: 'NOI', value: noi, cumulative: noi, type: 'subtotal', fill: '#10B981' },
        { name: 'Schuldendienst', value: -schuldendienst, cumulative: noi - schuldendienst, type: 'decrease', fill: '#EF4444' },
        { name: 'Netto-CF', value: nettoCF, cumulative: nettoCF, type: 'total', fill: nettoCF >= 0 ? '#10B981' : '#EF4444' },
      ]

      return data
    },
    enabled: !!portfolioKPIs,
  })
}

// ─────────────────────────────────────────────────────────────
// Maturity Wall
// ─────────────────────────────────────────────────────────────

export function useMaturityWall() {
  return useQuery({
    queryKey: ['maturity-wall'],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from('loans')
        .select('current_balance, interest_fixed_until, property_id')
        .not('interest_fixed_until', 'is', null)

      if (error) throw error

      // Get property values for LTV calculation
      const { data: properties } = await supabase
        .from('properties')
        .select('id, current_value, conservative_market_value')

      const propertyValues = new Map((properties || []).map(p => [
        p.id,
        p.conservative_market_value || p.current_value || 0
      ]))

      // Group by year
      const yearlyData = new Map<number, { amount: number; count: number; totalLTV: number }>()

      (loans as Loan[]).forEach(loan => {
        if (loan.interest_fixed_until) {
          const year = new Date(loan.interest_fixed_until).getFullYear()
          const existing = yearlyData.get(year) || { amount: 0, count: 0, totalLTV: 0 }
          const balance = loan.current_balance || 0
          const propertyValue = propertyValues.get(loan.property_id || '') || 0
          const ltv = propertyValue > 0 ? (balance / propertyValue) * 100 : 0

          existing.amount += balance
          existing.count += 1
          existing.totalLTV += ltv
          yearlyData.set(year, existing)
        }
      })

      // Convert to array and sort
      const result: MaturityWallDataPoint[] = Array.from(yearlyData.entries())
        .map(([year, data]) => ({
          year,
          expiringAmount: data.amount,
          loanCount: data.count,
          avgLTV: data.count > 0 ? data.totalLTV / data.count : 0,
        }))
        .sort((a, b) => a.year - b.year)

      return result
    },
    staleTime: 300000,
  })
}

// ─────────────────────────────────────────────────────────────
// Risk Board
// ─────────────────────────────────────────────────────────────

export function useRiskBoard(limit = 10) {
  const { data: propertyKPIs } = usePropertyKPIs()
  const { data: alerts } = useRealEstateAlerts()

  return useQuery({
    queryKey: ['risk-board', propertyKPIs, alerts, limit],
    queryFn: () => {
      const kpis = propertyKPIs as PropertyKPIs[] | undefined
      if (!kpis) return []

      // Calculate risk score for each property
      const riskProperties: RiskBoardProperty[] = kpis.map(prop => {
        let riskScore = 0

        // DSCR risk (0-30 points)
        if (prop.dscr < 1.0) riskScore += 30
        else if (prop.dscr < 1.1) riskScore += 25
        else if (prop.dscr < 1.2) riskScore += 15
        else if (prop.dscr < 1.5) riskScore += 5

        // Interest expiry risk (0-25 points)
        if (prop.monthsUntilInterestExpiry !== null) {
          if (prop.monthsUntilInterestExpiry <= 12 && prop.ltv > 80) riskScore += 25
          else if (prop.monthsUntilInterestExpiry <= 18) riskScore += 20
          else if (prop.monthsUntilInterestExpiry <= 24) riskScore += 15
          else if (prop.monthsUntilInterestExpiry <= 36) riskScore += 5
        }

        // Arrears risk (0-20 points)
        const arrearsMonths = prop.actualColdRent > 0 ? prop.rentArrears / prop.actualColdRent : 0
        if (arrearsMonths >= 2) riskScore += 20
        else if (arrearsMonths >= 1) riskScore += 15
        else if (arrearsMonths >= 0.5) riskScore += 8

        // Technical risk (0-15 points)
        if (prop.worstTechnicalStatus === 'red') riskScore += 15
        else if (prop.worstTechnicalStatus === 'yellow') riskScore += 7

        // LTV risk (0-10 points)
        if (prop.ltv > 90) riskScore += 10
        else if (prop.ltv > 80) riskScore += 6
        else if (prop.ltv > 70) riskScore += 3

        const propAlerts = (alerts || []).filter(a => a.propertyId === prop.propertyId)

        return {
          propertyId: prop.propertyId,
          propertyName: prop.propertyName,
          propertyAddress: prop.propertyAddress,
          riskScore: Math.min(100, riskScore),
          interestExpiringMonths: prop.monthsUntilInterestExpiry,
          dscr: prop.dscr,
          arrears: prop.rentArrears,
          arrearsMonths,
          ltv: prop.ltv,
          technicalWorstStatus: prop.worstTechnicalStatus,
          alerts: propAlerts,
        }
      })

      // Sort by risk score and return top N
      return riskProperties
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, limit)
    },
    enabled: !!propertyKPIs,
  })
}

// ─────────────────────────────────────────────────────────────
// Benchmark Data
// ─────────────────────────────────────────────────────────────

export function useBenchmarkData() {
  const { data: propertyKPIs } = usePropertyKPIs()

  return useQuery({
    queryKey: ['benchmark-data', propertyKPIs],
    queryFn: () => {
      const kpis = propertyKPIs as PropertyKPIs[] | undefined
      if (!kpis) return []

      return kpis.map(prop => ({
        propertyId: prop.propertyId,
        propertyName: prop.propertyName,
        actualRentPerSqm: prop.rentPerSqm,
        targetRentPerSqm: prop.targetRentPerSqm,
        costsPerSqm: prop.costsPerSqm,
        capexPerSqm: prop.capexPerSqm,
        noiPerSqm: prop.totalSqm > 0 ? prop.noi / prop.totalSqm : 0,
      })) as BenchmarkDataPoint[]
    },
    enabled: !!propertyKPIs,
  })
}
