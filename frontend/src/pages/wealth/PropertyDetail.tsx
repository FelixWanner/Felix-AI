import { useParams, Link } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import clsx from 'clsx'
import {
  BuildingOffice2Icon,
  MapPinIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  BanknotesIcon,
  DocumentTextIcon,
  TicketIcon,
  ChartBarIcon,
  CreditCardIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { UnitList } from '@/components/wealth'
import {
  usePropertyDetail,
  usePropertyTickets,
  usePropertyDocuments,
} from '@/hooks/useProperties'

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
// Loading Skeleton
// ─────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  icon?: React.ElementType
  color?: 'default' | 'success' | 'warning' | 'danger'
}

function StatCard({ label, value, subValue, icon: Icon, color = 'default' }: StatCardProps) {
  const colorClasses = {
    default: 'text-gray-900 dark:text-white',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className={clsx('text-lg font-semibold', colorClasses[color])}>{value}</p>
      {subValue && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subValue}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Contact Card Component
// ─────────────────────────────────────────────────────────────

interface ContactCardProps {
  name: string
  role?: string
  email?: string | null
  phone?: string | null
  company?: string | null
}

function ContactCard({ name, role, email, phone, company }: ContactCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
        <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white">{name}</p>
        {(role || company) && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {role}{role && company && ' • '}{company}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              <EnvelopeIcon className="h-3.5 w-3.5" />
              E-Mail
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              Anrufen
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Loan Row Component
// ─────────────────────────────────────────────────────────────

interface LoanRowProps {
  loan: {
    id: string
    contract_number?: string | null
    current_balance?: number | null
    monthly_payment?: number | null
    interest_rate_nominal?: number | null
    interest_fixed_until?: string | null
    bank?: { name: string } | null
  }
}

function LoanRow({ loan }: LoanRowProps) {
  const isExpiringSoon = loan.interest_fixed_until
    ? differenceInDays(new Date(loan.interest_fixed_until), new Date()) <= 365
    : false

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <CreditCardIcon className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {loan.bank?.name || 'Unbekannte Bank'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {loan.contract_number || 'Keine Vertragsnummer'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatCurrency(loan.current_balance || 0)}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{loan.interest_rate_nominal?.toFixed(2)}%</span>
          <span>•</span>
          <span>{formatCurrency(loan.monthly_payment || 0)}/Mo</span>
        </div>
        {isExpiringSoon && (
          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 text-xs font-medium rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <ExclamationTriangleIcon className="h-3 w-3" />
            Läuft bald aus
          </span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Account Row Component
// ─────────────────────────────────────────────────────────────

interface AccountRowProps {
  account: {
    id: string
    name: string
    account_type?: string | null
    current_balance?: number | null
    bank?: { name: string } | null
  }
}

function AccountRow({ account }: AccountRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <BanknotesIcon className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {account.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {account.bank?.name || account.account_type || 'Konto'}
          </p>
        </div>
      </div>
      <p className={clsx(
        'text-sm font-semibold',
        (account.current_balance || 0) >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400'
      )}>
        {formatCurrency(account.current_balance || 0)}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Scenario Card Component
// ─────────────────────────────────────────────────────────────

interface ScenarioCardProps {
  scenario: {
    id: string
    name: string
    description?: string | null
    scenario_type?: string | null
    calculated_value?: number | null
    created_at: string
  }
}

function ScenarioCard({ scenario }: ScenarioCardProps) {
  const typeLabels: Record<string, string> = {
    sale: 'Verkauf',
    refinance: 'Refinanzierung',
    tax_free: '10-Jahres-Frist',
    renovation: 'Renovierung',
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 mb-2">
            {typeLabels[scenario.scenario_type || ''] || 'Szenario'}
          </span>
          <h4 className="font-medium text-gray-900 dark:text-white">{scenario.name}</h4>
          {scenario.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {scenario.description}
            </p>
          )}
        </div>
        {scenario.calculated_value && (
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(scenario.calculated_value)}
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main PropertyDetail Component
// ─────────────────────────────────────────────────────────────

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: property, isLoading } = usePropertyDetail(id)
  const { data: tickets } = usePropertyTickets(id)
  const { data: documents } = usePropertyDocuments(id)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <BuildingOffice2Icon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Immobilie nicht gefunden
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Die angeforderte Immobilie existiert nicht oder wurde gelöscht.
        </p>
        <Link
          to="/wealth/properties"
          className="text-primary-600 dark:text-primary-400 hover:underline"
        >
          ← Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  const totalUnits = property.units.length || property.unit_count || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Gradient Header */}
        <div className="h-24 bg-gradient-to-r from-emerald-500 to-emerald-600" />

        <div className="px-6 pb-6">
          {/* Property Icon & Title */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-8 gap-4">
            <div className="flex items-end gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <BuildingOffice2Icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <Link
                    to="/wealth/properties"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <ArrowLeftIcon className="h-4 w-4 inline mr-1" />
                    Immobilien
                  </Link>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {property.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {property.isTaxFree ? (
                <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  <CheckBadgeIcon className="h-4 w-4" />
                  Steuerfrei
                </span>
              ) : property.daysUntilTaxFree !== null && (
                <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  <ClockIcon className="h-4 w-4" />
                  Noch {Math.ceil(property.daysUntilTaxFree / 30)} Monate bis steuerfrei
                </span>
              )}
              <button className="btn-secondary flex items-center gap-2">
                <PencilIcon className="h-4 w-4" />
                Bearbeiten
              </button>
            </div>
          </div>

          {/* Address & Meta */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
            {property.street && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                {property.street}, {property.postal_code} {property.city}
              </span>
            )}
            {property.purchase_date && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                Gekauft am {format(new Date(property.purchase_date), 'd. MMMM yyyy', { locale: de })}
              </span>
            )}
            {property.property_type && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs capitalize">
                {property.property_type}
              </span>
            )}
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
            <StatCard
              label="Wert"
              value={formatCurrency(property.current_value || 0)}
              icon={BanknotesIcon}
            />
            <StatCard
              label="Belegung"
              value={`${property.occupiedUnits}/${totalUnits}`}
              subValue={`${(100 - property.vacancyRate).toFixed(0)}%`}
              color={property.vacancyRate === 0 ? 'success' : property.vacancyRate < 20 ? 'warning' : 'danger'}
            />
            <StatCard
              label="Miete/Monat"
              value={formatCurrency(property.monthlyRentTotal)}
              icon={BanknotesIcon}
              color="success"
            />
            <StatCard
              label="Cashflow"
              value={formatCurrency(property.netMonthlyCashflow)}
              icon={property.netMonthlyCashflow >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
              color={property.netMonthlyCashflow >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              label="Bruttorendite"
              value={`${property.grossYield.toFixed(1)}%`}
              icon={ChartBarIcon}
              color={property.grossYield >= 5 ? 'success' : property.grossYield >= 3 ? 'default' : 'warning'}
            />
            <StatCard
              label="LTV"
              value={`${property.ltvRatio.toFixed(0)}%`}
              subValue={formatCurrency(property.equity) + ' Eigenkapital'}
            />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Units Section */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Einheiten
              </h2>
              <button className="btn-secondary text-sm flex items-center gap-1">
                <PlusIcon className="h-4 w-4" />
                Einheit
              </button>
            </div>
            <div className="card-body">
              <UnitList units={property.units} showSummary={true} />
            </div>
          </div>

          {/* Loans Section */}
          {property.loans.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Darlehen
                </h2>
              </div>
              <div className="card-body space-y-3">
                {property.loans.map(loan => (
                  <LoanRow key={loan.id} loan={loan} />
                ))}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Gesamtschuld</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(property.totalLoanBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Monatliche Rate</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(property.monthlyLoanPayments)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scenarios Section */}
          {property.scenarios.length > 0 && (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Szenarien
                </h2>
                <button className="btn-secondary text-sm flex items-center gap-1">
                  <PlusIcon className="h-4 w-4" />
                  Szenario
                </button>
              </div>
              <div className="card-body space-y-3">
                {property.scenarios.map(scenario => (
                  <ScenarioCard key={scenario.id} scenario={scenario} />
                ))}
              </div>
            </div>
          )}

          {/* Tax-Free Milestone */}
          {property.taxFreeDate && !property.isTaxFree && (
            <div className="card bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                      10-Jahres-Frist (Spekulationsfrist)
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Ab dem {format(property.taxFreeDate, 'd. MMMM yyyy', { locale: de })} können
                      Sie diese Immobilie steuerfrei verkaufen.
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 mb-1">
                        <span>Fortschritt</span>
                        <span>Noch {property.daysUntilTaxFree} Tage</span>
                      </div>
                      <div className="h-2 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${Math.max(0, 100 - (property.daysUntilTaxFree! / 3650) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Property Manager */}
          {property.manager && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Hausverwaltung
                </h2>
              </div>
              <div className="card-body">
                <ContactCard
                  name={property.manager.name}
                  role="Hausverwaltung"
                  company={property.manager.company}
                  email={property.manager.email}
                  phone={property.manager.phone}
                />
              </div>
            </div>
          )}

          {/* Other Contacts */}
          {property.contacts.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Kontakte
                </h2>
              </div>
              <div className="card-body space-y-3">
                {property.contacts.map(contact => (
                  <ContactCard
                    key={contact.id}
                    name={contact.name}
                    role={contact.specialty}
                    company={contact.company}
                    email={contact.email}
                    phone={contact.phone}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Accounts */}
          {property.accounts.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Konten
                </h2>
              </div>
              <div className="card-body space-y-2">
                {property.accounts.map(account => (
                  <AccountRow key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}

          {/* Tickets/Tasks */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tickets
              </h2>
              <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Alle anzeigen
              </button>
            </div>
            <div className="card-body">
              {tickets && tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.slice(0, 5).map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <TicketIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white truncate max-w-48">
                          {ticket.title}
                        </span>
                      </div>
                      <span className={clsx(
                        'text-xs px-2 py-0.5 rounded-full',
                        ticket.status === 'offen'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      )}>
                        {ticket.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <TicketIcon className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Keine offenen Tickets</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dokumente
              </h2>
              <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Alle anzeigen
              </button>
            </div>
            <div className="card-body">
              {documents && documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.slice(0, 5).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white truncate">
                        {doc.title || doc.filename}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Keine Dokumente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
