import {
  BuildingOffice2Icon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  HomeModernIcon,
  CurrencyEuroIcon,
  ArrowTrendingUpIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline'
import KPICard, { KPIGrid, formatCurrency, formatPercent, formatNumber } from './KPICard'
import type { PortfolioKPIs } from '@/types'

// ─────────────────────────────────────────────────────────────
// Portfolio KPI Cards
// ─────────────────────────────────────────────────────────────

interface PortfolioKPICardsProps {
  kpis: PortfolioKPIs
  className?: string
  compact?: boolean
}

export default function PortfolioKPICards({
  kpis,
  className,
  compact = false,
}: PortfolioKPICardsProps) {
  // Determine variants based on values
  const dscrVariant = kpis.dscr < 1.1 ? 'danger' : kpis.dscr < 1.2 ? 'warning' : 'success'
  const cashflowVariant = kpis.netCashflow < 0 ? 'danger' : kpis.netCashflow < 1000 ? 'warning' : 'success'
  const vacancyVariant = kpis.vacancyRateUnits > 10 ? 'danger' : kpis.vacancyRateUnits > 5 ? 'warning' : 'success'
  const ltvVariant = kpis.portfolioLTV > 80 ? 'danger' : kpis.portfolioLTV > 70 ? 'warning' : 'success'

  return (
    <KPIGrid columns={compact ? 3 : 4} className={className}>
      {/* Portfolio Value */}
      <KPICard
        label="Portfolio-Wert"
        value={formatCurrency(kpis.totalPropertyValue, true)}
        subValue={`Konservativ: ${formatCurrency(kpis.totalConservativeValue, true)}`}
        icon={BuildingOffice2Icon}
        variant="primary"
        compact={compact}
        tooltip="Gesamtwert aller Immobilien"
      />

      {/* Equity */}
      <KPICard
        label="Eigenkapital"
        value={formatCurrency(kpis.totalEquity, true)}
        subValue={`LTV: ${formatPercent(kpis.portfolioLTV)}`}
        icon={BanknotesIcon}
        variant={ltvVariant}
        compact={compact}
        tooltip="Marktwert minus Restschulden"
      />

      {/* Monthly NOI */}
      <KPICard
        label="NOI / Monat"
        value={formatCurrency(kpis.totalNOI)}
        subValue={`Ist-Miete: ${formatCurrency(kpis.totalActualRent)}`}
        icon={CurrencyEuroIcon}
        variant="info"
        compact={compact}
        tooltip="Net Operating Income = Ist-Miete minus nicht umlagefähige NK"
      />

      {/* Net Cashflow */}
      <KPICard
        label="Netto-Cashflow"
        value={formatCurrency(kpis.netCashflow)}
        subValue={`inkl. CapEx: ${formatCurrency(kpis.netCashflowWithCapex)}`}
        icon={ArrowTrendingUpIcon}
        variant={cashflowVariant}
        compact={compact}
        tooltip="NOI minus Schuldendienst"
      />

      {/* DSCR */}
      <KPICard
        label="DSCR"
        value={formatNumber(kpis.dscr, 2)}
        subValue={`Schuldendienst: ${formatCurrency(kpis.totalDebtService)}/M`}
        icon={ChartBarIcon}
        variant={dscrVariant}
        compact={compact}
        tooltip="Debt Service Coverage Ratio = NOI / Schuldendienst"
      />

      {/* Vacancy Rate */}
      <KPICard
        label="Leerstandsquote"
        value={formatPercent(kpis.vacancyRateUnits)}
        subValue={`${kpis.vacantUnits} von ${kpis.totalUnits} Einheiten`}
        icon={HomeModernIcon}
        variant={vacancyVariant}
        compact={compact}
      />

      {/* Cash-on-Cash */}
      <KPICard
        label="Cash-on-Cash"
        value={formatPercent(kpis.cashOnCash)}
        subValue={`Jährl. CF: ${formatCurrency(kpis.annualNetCashflow, true)}`}
        icon={BanknotesIcon}
        variant="default"
        compact={compact}
        tooltip="Jährlicher Netto-Cashflow / eingesetztes Eigenkapital"
      />

      {/* Refinancing Risk */}
      <KPICard
        label="Refinanzierungsrisiko"
        value={formatCurrency(kpis.refinancingRiskAmount, true)}
        subValue={`${kpis.loansExpiringWithin24Months} Kredite in 24M`}
        icon={ShieldExclamationIcon}
        variant={kpis.loansExpiringWithin12Months > 0 ? 'danger' : kpis.loansExpiringWithin24Months > 0 ? 'warning' : 'success'}
        compact={compact}
        tooltip="Restschuld mit Zinsbindung < 24 Monate"
      />
    </KPIGrid>
  )
}

// ─────────────────────────────────────────────────────────────
// Summary Stats Row (compact version for headers)
// ─────────────────────────────────────────────────────────────

interface SummaryStatsProps {
  kpis: PortfolioKPIs
  className?: string
}

export function PortfolioSummaryStats({ kpis, className }: SummaryStatsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-6 ${className || ''}`}>
      <div className="flex items-center gap-2">
        <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {kpis.totalUnits} Einheiten
        </span>
      </div>
      <div className="flex items-center gap-2">
        <BanknotesIcon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatCurrency(kpis.totalPropertyValue, true)} Wert
        </span>
      </div>
      <div className="flex items-center gap-2">
        <CurrencyEuroIcon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatCurrency(kpis.netCashflow)}/M Cashflow
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ChartBarIcon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatNumber(kpis.dscr, 2)} DSCR
        </span>
      </div>
      {kpis.propertiesWithTechnicalIssues > 0 && (
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
          <span className="text-sm text-amber-600 dark:text-amber-400">
            {kpis.propertiesWithTechnicalIssues} techn. Probleme
          </span>
        </div>
      )}
    </div>
  )
}
