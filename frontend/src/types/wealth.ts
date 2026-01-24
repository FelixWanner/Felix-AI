// ═══════════════════════════════════════════════════════════════
// Life OS - Wealth Module Domain Types
// ═══════════════════════════════════════════════════════════════

import { Tables, InsertTables, UpdateTables } from './database'

// ─────────────────────────────────────────────────────────────
// Base Types (from Supabase)
// ─────────────────────────────────────────────────────────────

export type Bank = Tables<'banks'>
export type BankInsert = InsertTables<'banks'>
export type BankUpdate = UpdateTables<'banks'>

export type Contact = Tables<'contacts'>
export type ContactInsert = InsertTables<'contacts'>
export type ContactUpdate = UpdateTables<'contacts'>

export type ContactSpecialty = Tables<'contact_specialties'>
export type ContactProperty = Tables<'contact_properties'>

export type Property = Tables<'properties'>
export type PropertyInsert = InsertTables<'properties'>
export type PropertyUpdate = UpdateTables<'properties'>

export type Account = Tables<'accounts'>
export type AccountInsert = InsertTables<'accounts'>
export type AccountUpdate = UpdateTables<'accounts'>

export type Unit = Tables<'units'>
export type UnitInsert = InsertTables<'units'>
export type UnitUpdate = UpdateTables<'units'>

export type Tenant = Tables<'tenants'>
export type TenantInsert = InsertTables<'tenants'>
export type TenantUpdate = UpdateTables<'tenants'>

export type Loan = Tables<'loans'>
export type LoanInsert = InsertTables<'loans'>
export type LoanUpdate = UpdateTables<'loans'>

export type LoanSchedule = Tables<'loan_schedule'>
export type LoanScenario = Tables<'loan_scenarios'>
export type PropertyScenario = Tables<'property_scenarios'>
export type PropertyMilestone = Tables<'property_milestones'>
export type PropertyTaxData = Tables<'property_tax_data'>

export type Transaction = Tables<'transactions'>
export type TransactionInsert = InsertTables<'transactions'>
export type TransactionUpdate = UpdateTables<'transactions'>

export type Invoice = Tables<'invoices'>
export type InvoiceInsert = InsertTables<'invoices'>
export type InvoiceUpdate = UpdateTables<'invoices'>

export type Company = Tables<'companies'>
export type CompanyInsert = InsertTables<'companies'>
export type CompanyUpdate = UpdateTables<'companies'>

export type CompanyFinancials = Tables<'company_financials'>

export type Portfolio = Tables<'portfolios'>
export type PortfolioInsert = InsertTables<'portfolios'>
export type PortfolioUpdate = UpdateTables<'portfolios'>

export type Position = Tables<'positions'>
export type PositionInsert = InsertTables<'positions'>
export type PositionUpdate = UpdateTables<'positions'>

export type PositionHistory = Tables<'position_history'>
export type SavingsPlan = Tables<'savings_plans'>
export type DailySnapshot = Tables<'daily_snapshots'>
export type RecurringTransaction = Tables<'recurring_transactions'>
export type CashflowForecast = Tables<'cashflow_forecast'>

// ─────────────────────────────────────────────────────────────
// Enums & Constants
// ─────────────────────────────────────────────────────────────

export const PropertyTypes = {
  APARTMENT_BUILDING: 'mehrfamilienhaus',
  SINGLE_FAMILY: 'einfamilienhaus',
  CONDO: 'eigentumswohnung',
  COMMERCIAL: 'gewerbe',
  MIXED_USE: 'gemischt',
} as const

export type PropertyType = (typeof PropertyTypes)[keyof typeof PropertyTypes]

export const AccountTypes = {
  CHECKING: 'girokonto',
  SAVINGS: 'sparkonto',
  DEPOSIT: 'kautionskonto',
  LOAN: 'kreditkonto',
  INVESTMENT: 'depotkonto',
  CREDIT_CARD: 'kreditkarte',
} as const

export type AccountType = (typeof AccountTypes)[keyof typeof AccountTypes]

export const UnitStatus = {
  OCCUPIED: 'vermietet',
  VACANT: 'leer',
  RENOVATION: 'renovierung',
  SELF_OCCUPIED: 'eigennutzung',
} as const

export type UnitStatusType = (typeof UnitStatus)[keyof typeof UnitStatus]

export const TenantStatus = {
  ACTIVE: 'aktiv',
  TERMINATED: 'gekündigt',
  MOVED_OUT: 'ausgezogen',
} as const

export type TenantStatusType = (typeof TenantStatus)[keyof typeof TenantStatus]

export const LoanTypes = {
  ANNUITY: 'annuität',
  INTEREST_ONLY: 'endfällig',
  VARIABLE: 'variabel',
  KFW: 'kfw',
} as const

export type LoanType = (typeof LoanTypes)[keyof typeof LoanTypes]

export const ContactTypes = {
  BANK: 'bank',
  PROPERTY_MANAGER: 'hausverwaltung',
  CRAFTSMAN: 'handwerker',
  TAX_ADVISOR: 'steuerberater',
  LAWYER: 'anwalt',
  INSURANCE: 'versicherung',
  UTILITY: 'versorger',
  OTHER: 'sonstige',
} as const

export type ContactType = (typeof ContactTypes)[keyof typeof ContactTypes]

export const AssetTypes = {
  STOCK: 'aktie',
  ETF: 'etf',
  FUND: 'fonds',
  BOND: 'anleihe',
  CRYPTO: 'crypto',
  COMMODITY: 'rohstoff',
  REIT: 'reit',
  OTHER: 'sonstige',
} as const

export type AssetType = (typeof AssetTypes)[keyof typeof AssetTypes]

// ─────────────────────────────────────────────────────────────
// Extended Types (with relations)
// ─────────────────────────────────────────────────────────────

export interface PropertyWithRelations extends Property {
  units?: Unit[]
  loans?: Loan[]
  accounts?: Account[]
  property_manager?: Contact | null
  tax_data?: PropertyTaxData | null
  contacts?: (ContactProperty & { contact: Contact })[]
}

export interface UnitWithRelations extends Unit {
  property?: Property
  tenant?: Tenant | null
}

export interface TenantWithRelations extends Tenant {
  unit?: Unit | null
  deposit_account?: Account | null
}

export interface LoanWithRelations extends Loan {
  property?: Property | null
  bank?: Bank | null
  account?: Account | null
  schedule?: LoanSchedule[]
  scenarios?: LoanScenario[]
}

export interface AccountWithRelations extends Account {
  bank?: Bank | null
  property?: Property | null
}

export interface PortfolioWithRelations extends Portfolio {
  positions?: Position[]
  account?: Account | null
  savings_plans?: SavingsPlan[]
}

export interface PositionWithRelations extends Position {
  portfolio?: Portfolio
  history?: PositionHistory[]
}

export interface ContactWithRelations extends Contact {
  specialties?: ContactSpecialty[]
  properties?: (ContactProperty & { property: Property })[]
}

// ─────────────────────────────────────────────────────────────
// Aggregated / Calculated Types
// ─────────────────────────────────────────────────────────────

export interface PropertySummary {
  id: string
  name: string
  address: string | null
  city: string | null
  unit_count: number
  occupied_units: number
  vacancy_rate: number
  monthly_rent_total: number
  monthly_costs: number
  net_operating_income: number
  current_value: number | null
  total_loan_balance: number
  equity: number
  ltv_ratio: number
  purchase_date: string | null
  tax_free_date: string | null
  is_tax_free: boolean
}

export interface AccountSummary {
  total_balance: number
  by_type: Record<AccountType, number>
  by_property: Record<string, number>
  low_balance_accounts: Account[]
}

export interface LoanSummary {
  total_balance: number
  total_monthly_payment: number
  weighted_interest_rate: number
  loans_expiring_soon: Loan[]
  special_repayment_available: number
}

export interface PortfolioSummary {
  total_invested: number
  current_value: number
  unrealized_gain_loss: number
  unrealized_gain_loss_percent: number
  by_asset_type: Record<AssetType, number>
  top_performers: Position[]
  worst_performers: Position[]
}

export interface NetWorthSnapshot {
  date: string
  total_assets: number
  total_liabilities: number
  net_worth: number
  cash_value: number
  investment_value: number
  property_value: number
  company_value: number
  change_from_previous: number
  change_percent: number
}

export interface CashflowProjection {
  month: string
  expected_income: number
  expected_expenses: number
  net_cashflow: number
  cumulative_balance: number
}

export interface FIREProgress {
  current_net_worth: number
  target_amount: number
  progress_percent: number
  monthly_expenses: number
  withdrawal_rate: number
  years_to_target: number | null
  projected_passive_income: number
  is_achieved: boolean
}

// ─────────────────────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────────────────────

export interface WealthDashboardData {
  net_worth: NetWorthSnapshot
  properties: PropertySummary[]
  accounts: AccountSummary
  loans: LoanSummary
  portfolios: PortfolioSummary
  cashflow_forecast: CashflowProjection[]
  fire_progress: FIREProgress
  alerts: WealthAlert[]
}

export interface WealthAlert {
  id: string
  type:
    | 'loan_expiring'
    | 'low_balance'
    | 'rent_missing'
    | 'vacancy'
    | 'tax_free_approaching'
    | 'special_repayment'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  entity_type: string
  entity_id: string
  action_url?: string
}

// ─────────────────────────────────────────────────────────────
// Filter & Query Types
// ─────────────────────────────────────────────────────────────

export interface PropertyFilters {
  property_type?: PropertyType
  city?: string
  has_vacancy?: boolean
  min_value?: number
  max_value?: number
}

export interface TransactionFilters {
  account_id?: string
  property_id?: string
  category?: string
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  is_rental_income?: boolean
}

export interface LoanFilters {
  property_id?: string
  bank_id?: string
  expiring_before?: string
  interest_type?: string
}

export interface PositionFilters {
  portfolio_id?: string
  asset_type?: AssetType
  min_value?: number
}

// ─────────────────────────────────────────────────────────────
// Real Estate Dashboard Types
// ─────────────────────────────────────────────────────────────

// Base Types (new tables)
export type PropertyOperatingData = Tables<'property_operating_data'>
export type PropertyOperatingDataInsert = InsertTables<'property_operating_data'>
export type PropertyOperatingDataUpdate = UpdateTables<'property_operating_data'>

export type PropertyTechnicalStatus = Tables<'property_technical_status'>
export type PropertyTechnicalStatusInsert = InsertTables<'property_technical_status'>
export type PropertyTechnicalStatusUpdate = UpdateTables<'property_technical_status'>

export type TenantChange = Tables<'tenant_changes'>
export type TenantChangeInsert = InsertTables<'tenant_changes'>

export type AlertThresholds = Tables<'alert_thresholds'>
export type AlertThresholdsInsert = InsertTables<'alert_thresholds'>
export type AlertThresholdsUpdate = UpdateTables<'alert_thresholds'>

export type PortfolioSnapshot = Tables<'portfolio_snapshots'>
export type PortfolioSnapshotInsert = InsertTables<'portfolio_snapshots'>

// ─────────────────────────────────────────────────────────────
// Traffic Light Status (Ampel-System)
// ─────────────────────────────────────────────────────────────

export const TrafficLightStatus = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
} as const

export type TrafficLightStatusType = (typeof TrafficLightStatus)[keyof typeof TrafficLightStatus]

export const TenantChangeTypes = {
  MOVE_IN: 'move_in',
  MOVE_OUT: 'move_out',
  RENT_INCREASE: 'rent_increase',
  RENT_DECREASE: 'rent_decrease',
} as const

export type TenantChangeType = (typeof TenantChangeTypes)[keyof typeof TenantChangeTypes]

// ─────────────────────────────────────────────────────────────
// Property KPIs (Per-Property Computed Metrics)
// ─────────────────────────────────────────────────────────────

export interface PropertyKPIs {
  propertyId: string
  propertyName: string
  propertyAddress: string | null

  // Rental Income
  actualColdRent: number
  targetColdRent: number
  vacancyDays: number
  rentArrears: number

  // Operating Costs
  allocableCosts: number
  nonAllocableCosts: number

  // Maintenance & CapEx
  maintenanceActual: number
  maintenancePlanned: number
  capexActual: number
  capexPlanned: number

  // Financing
  loanBalance: number
  monthlyDebtService: number
  monthlyInterest: number
  monthlyPrincipal: number
  interestRate: number
  interestFixedUntil: string | null
  monthsUntilInterestExpiry: number | null
  specialRepaymentAllowed: number

  // Property Info
  totalSqm: number
  unitCount: number
  occupiedUnits: number
  vacantUnits: number
  lastTenantChange: string | null

  // Technical Status (Traffic Lights)
  heatingStatus: TrafficLightStatusType
  roofStatus: TrafficLightStatusType
  moistureStatus: TrafficLightStatusType
  electricalStatus: TrafficLightStatusType
  plumbingStatus: TrafficLightStatusType
  facadeStatus: TrafficLightStatusType
  windowsStatus: TrafficLightStatusType
  worstTechnicalStatus: TrafficLightStatusType

  // Valuation
  currentMarketValue: number
  conservativeMarketValue: number
  equity: number
  ltv: number

  // Computed Metrics
  noi: number // Net Operating Income = actualColdRent - nonAllocableCosts
  netCashflow: number // NOI - debtService
  netCashflowWithCapex: number // netCashflow - capexActual
  dscr: number // NOI / debtService
  grossYield: number // (actualColdRent * 12) / currentMarketValue * 100
  netYield: number // (noi * 12) / currentMarketValue * 100
  rentPerSqm: number
  targetRentPerSqm: number
  costsPerSqm: number
  capexPerSqm: number
  vacancyRate: number // vacantUnits / unitCount * 100
  arrearsRate: number // rentArrears / actualColdRent * 100
  capexBudgetUsed: number // capexActual / capexPlanned * 100
}

// ─────────────────────────────────────────────────────────────
// Portfolio KPIs (Aggregated Metrics)
// ─────────────────────────────────────────────────────────────

export interface PortfolioKPIs {
  // Core Values
  totalPropertyValue: number
  totalConservativeValue: number
  totalLoanBalance: number
  totalEquity: number
  portfolioLTV: number

  // Income & Cashflow (Monthly)
  totalActualRent: number
  totalTargetRent: number
  totalAllocableCosts: number
  totalNonAllocableCosts: number
  totalDebtService: number
  totalNOI: number
  netCashflow: number
  netCashflowWithCapex: number

  // Ratios
  dscr: number
  vacancyRateUnits: number
  vacancyRateSqm: number
  arrearsRate: number
  rentLossRate: number // (targetRent - actualRent) / targetRent * 100

  // Units & Area
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  totalSqm: number
  occupiedSqm: number

  // CapEx
  totalCapexActual: number
  totalCapexPlanned: number
  capexPerSqmAnnual: number
  capexBudgetUsedPercent: number

  // Cash-on-Cash (requires equity invested data)
  totalEquityInvested: number
  annualNetCashflow: number
  cashOnCash: number

  // Risk Metrics
  loansExpiringWithin12Months: number
  loansExpiringWithin24Months: number
  refinancingRiskAmount: number
  avgWeightedInterestRate: number
  propertiesWithTechnicalIssues: number
}

// ─────────────────────────────────────────────────────────────
// Real Estate Alerts
// ─────────────────────────────────────────────────────────────

export type RealEstateAlertType =
  | 'dscr_low'
  | 'interest_expiring'
  | 'high_ltv_refinancing'
  | 'rent_arrears'
  | 'vacancy_long'
  | 'capex_budget_high'
  | 'technical_issue'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface RealEstateAlert {
  id: string
  type: RealEstateAlertType
  severity: AlertSeverity
  title: string
  message: string
  propertyId?: string
  propertyName?: string
  loanId?: string
  value?: number
  threshold?: number
  actionUrl?: string
  createdAt: string
}

// ─────────────────────────────────────────────────────────────
// Chart Data Types
// ─────────────────────────────────────────────────────────────

export interface TrendDataPoint {
  month: string // YYYY-MM
  monthLabel: string // e.g., "Jan 24"
  netCashflow: number
  vacancyDays: number
  rentArrears: number
  capex: number
  noi: number
}

export interface WaterfallDataPoint {
  name: string
  value: number
  cumulative: number
  type: 'start' | 'increase' | 'decrease' | 'subtotal' | 'total'
  fill: string
}

export interface MaturityWallDataPoint {
  year: number
  expiringAmount: number
  loanCount: number
  avgLTV: number
}

export interface RiskBoardProperty {
  propertyId: string
  propertyName: string
  propertyAddress: string | null
  riskScore: number // 0-100, higher = riskier
  interestExpiringMonths: number | null
  dscr: number
  arrears: number
  arrearsMonths: number // arrears as fraction of monthly rent
  ltv: number
  technicalWorstStatus: TrafficLightStatusType
  alerts: RealEstateAlert[]
}

export interface BenchmarkDataPoint {
  propertyId: string
  propertyName: string
  actualRentPerSqm: number
  targetRentPerSqm: number
  costsPerSqm: number
  capexPerSqm: number
  noiPerSqm: number
}

// ─────────────────────────────────────────────────────────────
// Default Alert Thresholds
// ─────────────────────────────────────────────────────────────

export const DEFAULT_ALERT_THRESHOLDS = {
  dscr_warning: 1.2,
  dscr_critical: 1.1,
  interest_expiry_warning_months: 24,
  interest_expiry_critical_months: 18,
  ltv_high_threshold: 80,
  arrears_warning_months: 0.5,
  arrears_critical_months: 1.0,
  vacancy_warning_days: 30,
  vacancy_critical_days: 60,
  capex_warning_percent: 70,
  capex_critical_percent: 90,
} as const

// ─────────────────────────────────────────────────────────────
// Real Estate Dashboard Data
// ─────────────────────────────────────────────────────────────

export interface RealEstateDashboardData {
  portfolioKPIs: PortfolioKPIs
  propertyKPIs: PropertyKPIs[]
  alerts: RealEstateAlert[]
  trendData: TrendDataPoint[]
  waterfallData: WaterfallDataPoint[]
  maturityWall: MaturityWallDataPoint[]
  riskBoard: RiskBoardProperty[]
  benchmarks: BenchmarkDataPoint[]
}
