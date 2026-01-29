import { useState } from 'react'
import clsx from 'clsx'
import {
  HomeIcon,
  UserIcon,
  BanknotesIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline'
import TenantCard from './TenantCard'
import type { Unit, Tenant } from '@/types'

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
// Status Configuration
// ─────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string
  color: string
  bgColor: string
  icon: React.ElementType
}

const statusConfigs: Record<string, StatusConfig> = {
  vermietet: {
    label: 'Vermietet',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: CheckCircleIcon,
  },
  leer: {
    label: 'Leer',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: XCircleIcon,
  },
  renovierung: {
    label: 'Renovierung',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: WrenchScrewdriverIcon,
  },
  eigennutzung: {
    label: 'Eigennutzung',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: HomeModernIcon,
  },
}

// ─────────────────────────────────────────────────────────────
// Unit Row Component
// ─────────────────────────────────────────────────────────────

interface UnitRowProps {
  unit: Unit & { tenant: Tenant | null }
  expanded: boolean
  onToggle: () => void
}

function UnitRow({ unit, expanded, onToggle }: UnitRowProps) {
  const status = unit.status || 'leer'
  const config = statusConfigs[status] || statusConfigs.leer
  const StatusIcon = config.icon

  const totalMonthlyRent = (unit.monthly_rent_cold || 0) + (unit.monthly_utilities_advance || 0)

  return (
    <div className={clsx(
      'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all',
      expanded ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''
    )}>
      {/* Header Row */}
      <div
        className={clsx(
          'flex items-center justify-between p-4 cursor-pointer transition-colors',
          'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Unit Icon & Name */}
          <div className="flex items-center gap-3">
            <div className={clsx('p-2 rounded-lg', config.bgColor)}>
              <HomeIcon className={clsx('h-5 w-5', config.color)} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {unit.name}
              </h4>
              {unit.floor !== null && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {unit.floor === 0 ? 'Erdgeschoss' : `${unit.floor}. OG`}
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <span className={clsx(
            'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
            config.bgColor, config.color
          )}>
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </span>

          {/* Size */}
          {unit.size_sqm && (
            <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <ArrowsPointingOutIcon className="h-4 w-4" />
              <span>{unit.size_sqm} m²</span>
            </div>
          )}

          {/* Rooms */}
          {unit.rooms && (
            <span className="hidden md:inline text-sm text-gray-500 dark:text-gray-400">
              {unit.rooms} Zimmer
            </span>
          )}
        </div>

        {/* Rent Info */}
        <div className="flex items-center gap-4">
          {status === 'vermietet' ? (
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalMonthlyRent)}/Mo
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatCurrency(unit.monthly_rent_cold || 0)} kalt
              </p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                -
              </p>
            </div>
          )}

          {/* Tenant indicator */}
          {unit.tenant && (
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              <UserIcon className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400 max-w-24 truncate">
                {unit.tenant.name}
              </span>
            </div>
          )}

          {/* Expand Button */}
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            {expanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unit Details */}
            <div className="space-y-4">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                Einheit Details
              </h5>

              <div className="grid grid-cols-2 gap-4">
                {unit.size_sqm && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Größe</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {unit.size_sqm} m²
                    </p>
                  </div>
                )}

                {unit.rooms && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Zimmer</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {unit.rooms}
                    </p>
                  </div>
                )}

                {unit.floor !== null && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Etage</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {unit.floor === 0 ? 'Erdgeschoss' : `${unit.floor}. OG`}
                    </p>
                  </div>
                )}

                {unit.unit_type && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Typ</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {unit.unit_type}
                    </p>
                  </div>
                )}
              </div>

              {/* Rent Details */}
              {status === 'vermietet' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h6 className="text-xs text-gray-500 dark:text-gray-400 mb-3">Mietdetails</h6>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Kaltmiete</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(unit.monthly_rent_cold || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">NK-Vorauszahlung</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(unit.monthly_utilities_advance || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Warmmiete</span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalMonthlyRent)}
                      </span>
                    </div>
                  </div>

                  {/* Price per sqm */}
                  {unit.size_sqm && unit.monthly_rent_cold && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <BanknotesIcon className="h-4 w-4" />
                      <span>
                        {(unit.monthly_rent_cold / unit.size_sqm).toFixed(2)} €/m²
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {unit.notes && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notizen</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {unit.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Tenant Info */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Mieter
              </h5>
              {unit.tenant ? (
                <TenantCard tenant={unit.tenant} />
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <UserIcon className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {status === 'leer' ? 'Nicht vermietet' : 'Kein Mieter zugeordnet'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Summary Stats Component
// ─────────────────────────────────────────────────────────────

interface SummaryStatsProps {
  units: (Unit & { tenant: Tenant | null })[]
}

function SummaryStats({ units }: SummaryStatsProps) {
  const occupied = units.filter(u => u.status === 'vermietet').length
  const vacant = units.filter(u => u.status === 'leer').length
  const renovation = units.filter(u => u.status === 'renovierung').length
  const selfUse = units.filter(u => u.status === 'eigennutzung').length

  const totalRent = units
    .filter(u => u.status === 'vermietet')
    .reduce((sum, u) => sum + (u.monthly_rent_cold || 0) + (u.monthly_utilities_advance || 0), 0)

  const totalSqm = units.reduce((sum, u) => sum + (u.size_sqm || 0), 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Gesamt</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{units.length}</p>
      </div>
      <div>
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Vermietet</p>
        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{occupied}</p>
      </div>
      <div>
        <p className="text-xs text-red-600 dark:text-red-400">Leer</p>
        <p className="text-lg font-semibold text-red-600 dark:text-red-400">{vacant}</p>
      </div>
      {renovation > 0 && (
        <div>
          <p className="text-xs text-amber-600 dark:text-amber-400">Renovierung</p>
          <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{renovation}</p>
        </div>
      )}
      {selfUse > 0 && (
        <div>
          <p className="text-xs text-blue-600 dark:text-blue-400">Eigennutzung</p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{selfUse}</p>
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Miete/Mo</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatCurrency(totalRent)}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Fläche</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalSqm} m²</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main UnitList Component
// ─────────────────────────────────────────────────────────────

interface UnitListProps {
  units: (Unit & { tenant: Tenant | null })[]
  showSummary?: boolean
}

export default function UnitList({ units, showSummary = true }: UnitListProps) {
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null)

  const handleToggle = (unitId: string) => {
    setExpandedUnit(prev => prev === unitId ? null : unitId)
  }

  if (units.length === 0) {
    return (
      <div className="text-center py-12">
        <HomeIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Keine Einheiten vorhanden
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showSummary && <SummaryStats units={units} />}

      <div className="space-y-3">
        {units.map(unit => (
          <UnitRow
            key={unit.id}
            unit={unit}
            expanded={expandedUnit === unit.id}
            onToggle={() => handleToggle(unit.id)}
          />
        ))}
      </div>
    </div>
  )
}
