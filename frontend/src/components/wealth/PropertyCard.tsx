import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  BuildingOffice2Icon,
  MapPinIcon,
  UserGroupIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronRightIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import type { PropertyWithStats } from '@/hooks/useProperties'

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
// Property Type Labels
// ─────────────────────────────────────────────────────────────

const propertyTypeLabels: Record<string, string> = {
  mehrfamilienhaus: 'Mehrfamilienhaus',
  einfamilienhaus: 'Einfamilienhaus',
  eigentumswohnung: 'Eigentumswohnung',
  gewerbe: 'Gewerbe',
  gemischt: 'Gemischt',
}

// ─────────────────────────────────────────────────────────────
// Stat Badge Component
// ─────────────────────────────────────────────────────────────

interface StatBadgeProps {
  icon: React.ElementType
  label: string
  value: string | number
  subValue?: string
  color?: 'default' | 'success' | 'warning' | 'danger'
}

function StatBadge({ icon: Icon, label, value, subValue, color = 'default' }: StatBadgeProps) {
  const colorClasses = {
    default: 'text-gray-600 dark:text-gray-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className="flex items-center gap-2">
      <Icon className={clsx('h-4 w-4', colorClasses[color])} />
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={clsx('text-sm font-medium', colorClasses[color])}>
          {value}
          {subValue && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
              {subValue}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Occupancy Bar Component
// ─────────────────────────────────────────────────────────────

interface OccupancyBarProps {
  occupied: number
  total: number
}

function OccupancyBar({ occupied, total }: OccupancyBarProps) {
  const occupancyRate = total > 0 ? (occupied / total) * 100 : 0
  const isFullyOccupied = occupied === total && total > 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          Belegung: {occupied}/{total} Einheiten
        </span>
        <span className={clsx(
          'font-medium',
          isFullyOccupied ? 'text-emerald-600' : occupancyRate >= 80 ? 'text-amber-600' : 'text-red-600'
        )}>
          {occupancyRate.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all',
            isFullyOccupied ? 'bg-emerald-500' : occupancyRate >= 80 ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${occupancyRate}%` }}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main PropertyCard Component
// ─────────────────────────────────────────────────────────────

interface PropertyCardProps {
  property: PropertyWithStats
  compact?: boolean
}

export default function PropertyCard({ property, compact = false }: PropertyCardProps) {
  const totalUnits = property.units.length || property.unit_count || 0

  return (
    <Link
      to={`/wealth/properties/${property.id}`}
      className={clsx(
        'block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
        'transition-all duration-200 group'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <BuildingOffice2Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {property.name}
              </h3>
              {property.street && (
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  <span>{property.street}, {property.city}</span>
                </div>
              )}
              {property.property_type && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {propertyTypeLabels[property.property_type] || property.property_type}
                </span>
              )}
            </div>
          </div>

          {/* Tax-free badge */}
          {property.isTaxFree ? (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              <CheckBadgeIcon className="h-3.5 w-3.5" />
              Steuerfrei
            </span>
          ) : property.daysUntilTaxFree !== null && property.daysUntilTaxFree <= 365 ? (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              <ClockIcon className="h-3.5 w-3.5" />
              {Math.ceil(property.daysUntilTaxFree / 30)} Mon.
            </span>
          ) : null}
        </div>
      </div>

      {/* Stats Grid */}
      <div className={clsx('p-4', !compact && 'space-y-4')}>
        {/* Occupancy */}
        <OccupancyBar
          occupied={property.occupiedUnits}
          total={totalUnits}
        />

        {/* Main Stats */}
        <div className={clsx(
          'grid gap-4',
          compact ? 'grid-cols-2 mt-3' : 'grid-cols-2 sm:grid-cols-4'
        )}>
          <StatBadge
            icon={BanknotesIcon}
            label="Monatsmiete"
            value={formatCurrency(property.monthlyRentTotal)}
            color="success"
          />

          <StatBadge
            icon={property.netMonthlyCashflow >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
            label="Cashflow"
            value={formatCurrency(property.netMonthlyCashflow)}
            color={property.netMonthlyCashflow >= 0 ? 'success' : 'danger'}
          />

          {!compact && (
            <>
              <StatBadge
                icon={ArrowTrendingUpIcon}
                label="Bruttorendite"
                value={`${property.grossYield.toFixed(1)}%`}
                color={property.grossYield >= 5 ? 'success' : property.grossYield >= 3 ? 'default' : 'warning'}
              />

              <StatBadge
                icon={UserGroupIcon}
                label="Leerstand"
                value={`${property.vacancyRate.toFixed(0)}%`}
                subValue={property.vacantUnits > 0 ? `(${property.vacantUnits})` : undefined}
                color={property.vacancyRate === 0 ? 'success' : property.vacancyRate < 20 ? 'warning' : 'danger'}
              />
            </>
          )}
        </div>

        {/* Additional Info Row */}
        {!compact && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Wert: {formatCurrency(property.current_value || 0)}
              </span>
              <span>
                LTV: {property.ltvRatio.toFixed(0)}%
              </span>
              {property.purchase_date && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {new Date(property.purchase_date).getFullYear()}
                </span>
              )}
            </div>

            <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
          </div>
        )}
      </div>
    </Link>
  )
}
