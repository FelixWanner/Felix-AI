import {
  BanknotesIcon,
  BuildingOffice2Icon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import {
  NetWorthCard,
  AssetAllocationChart,
  FireProgress,
  CashflowSummary,
} from '@/components/wealth'
import {
  useAccountsSummary,
  usePropertiesSummary,
  useLoansSummary,
  useInvestmentsSummary,
} from '@/hooks/useWealth'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────
// Currency Formatter
// ─────────────────────────────────────────────────────────────

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─────────────────────────────────────────────────────────────
// Quick Link Card Component
// ─────────────────────────────────────────────────────────────

interface QuickLinkProps {
  href: string
  icon: React.ElementType
  title: string
  value: string
  count?: number
  color: string
}

function QuickLink({ href, icon: Icon, title, value, count, color }: QuickLinkProps) {
  return (
    <a
      href={href}
      className={clsx(
        'block p-4 rounded-xl border transition-all',
        'bg-white dark:bg-gray-800',
        'border-gray-200 dark:border-gray-700',
        'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
        'group'
      )}
    >
      <div className="flex items-start justify-between">
        <div className={clsx('p-2 rounded-lg', color)}>
          <Icon className="h-5 w-5" />
        </div>
        {count !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {count} Einträge
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
          {value}
        </p>
      </div>
      <div className="mt-3 text-sm text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
        Details anzeigen →
      </div>
    </a>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Overview Component
// ─────────────────────────────────────────────────────────────

export default function WealthOverview() {
  const { data: accounts, isLoading: accountsLoading } = useAccountsSummary()
  const { data: properties, isLoading: propertiesLoading } = usePropertiesSummary()
  const { data: loans, isLoading: loansLoading } = useLoansSummary()
  const { data: investments, isLoading: investmentsLoading } = useInvestmentsSummary()

  const isLoading = accountsLoading || propertiesLoading || loansLoading || investmentsLoading

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Vermögensübersicht
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Deine finanzielle Gesamtübersicht auf einen Blick
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Net Worth Card */}
          <NetWorthCard days={30} />

          {/* FIRE Progress */}
          <FireProgress />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Asset Allocation */}
          <AssetAllocationChart />

          {/* Cashflow Summary */}
          <CashflowSummary />
        </div>
      </div>

      {/* Quick Links Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bereiche verwalten
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Accounts */}
          <QuickLink
            href="/wealth/accounts"
            icon={BanknotesIcon}
            title="Konten & Cash"
            value={isLoading ? '...' : formatCurrency(accounts?.totalBalance || 0)}
            count={accounts?.count}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          />

          {/* Properties */}
          <QuickLink
            href="/wealth/properties"
            icon={BuildingOffice2Icon}
            title="Immobilien"
            value={isLoading ? '...' : formatCurrency(properties?.totalValue || 0)}
            count={properties?.count}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          />

          {/* Investments */}
          <QuickLink
            href="/wealth/investments"
            icon={ChartBarIcon}
            title="Investments"
            value={isLoading ? '...' : formatCurrency(investments?.totalValue || 0)}
            count={investments?.count}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          />

          {/* Loans */}
          <QuickLink
            href="/wealth/loans"
            icon={CreditCardIcon}
            title="Kredite"
            value={isLoading ? '...' : formatCurrency(loans?.totalBalance || 0)}
            count={loans?.count}
            color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          />
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Investments Performance */}
        {investments && investments.totalInvested > 0 && (
          <div className="card">
            <div className="card-body">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Investment Performance
              </h4>
              <div className="flex items-baseline gap-2">
                <span className={clsx(
                  'text-2xl font-bold',
                  investments.gainLossPercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {investments.gainLossPercent >= 0 ? '+' : ''}
                  {investments.gainLossPercent.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({investments.totalGainLoss >= 0 ? '+' : ''}
                  {formatCurrency(investments.totalGainLoss)})
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Investiert: {formatCurrency(investments.totalInvested)}
              </p>
            </div>
          </div>
        )}

        {/* Loan Info */}
        {loans && loans.count > 0 && (
          <div className="card">
            <div className="card-body">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Kreditübersicht
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loans.weightedAverageRate.toFixed(2)}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Ø Zinssatz
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Monatliche Rate: {formatCurrency(loans.totalMonthlyPayment)}
              </p>
              {loans.expiringSoonCount > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {loans.expiringSoonCount} Kredit(e) laufen bald aus
                </p>
              )}
            </div>
          </div>
        )}

        {/* Properties Info */}
        {properties && properties.count > 0 && (
          <div className="card">
            <div className="card-body">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Immobilien
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {properties.count}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Objekt{properties.count !== 1 ? 'e' : ''}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {properties.totalUnits} Einheit{properties.totalUnits !== 1 ? 'en' : ''} gesamt
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
