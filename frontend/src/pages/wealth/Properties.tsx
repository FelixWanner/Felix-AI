import { Link } from 'react-router-dom'
import {
  BuildingOffice2Icon,
  PlusIcon,
  ArrowLeftIcon,
  BanknotesIcon,
  HomeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { PropertyList } from '@/components/wealth'
import { usePropertiesWithStats, usePropertyCities } from '@/hooks/useProperties'

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
// Summary Card Component
// ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subValue?: string
  color: string
}

function SummaryCard({ icon: Icon, label, value, subValue, color }: SummaryCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
          {subValue && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Properties Page Component
// ─────────────────────────────────────────────────────────────

export default function Properties() {
  const { data: properties, isLoading } = usePropertiesWithStats()
  const { data: cities } = usePropertyCities()

  // Calculate aggregate stats
  const stats = properties ? {
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum, p) => sum + (p.units.length || p.unit_count || 0), 0),
    occupiedUnits: properties.reduce((sum, p) => sum + p.occupiedUnits, 0),
    vacantUnits: properties.reduce((sum, p) => sum + p.vacantUnits, 0),
    totalValue: properties.reduce((sum, p) => sum + (p.current_value || 0), 0),
    totalRent: properties.reduce((sum, p) => sum + p.monthlyRentTotal, 0),
    totalCashflow: properties.reduce((sum, p) => sum + p.netMonthlyCashflow, 0),
    avgYield: properties.length > 0
      ? properties.reduce((sum, p) => sum + p.grossYield, 0) / properties.length
      : 0,
    avgVacancy: properties.length > 0
      ? properties.reduce((sum, p) => sum + p.vacancyRate, 0) / properties.length
      : 0,
  } : null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/wealth"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Immobilien
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Übersicht aller Immobilien und Einheiten
            </p>
          </div>
        </div>

        <button className="btn-primary flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Immobilie hinzufügen
        </button>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard
            icon={BuildingOffice2Icon}
            label="Immobilien"
            value={stats.totalProperties}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          />
          <SummaryCard
            icon={HomeIcon}
            label="Einheiten"
            value={stats.totalUnits}
            subValue={`${stats.occupiedUnits} vermietet`}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          />
          <SummaryCard
            icon={BanknotesIcon}
            label="Gesamtwert"
            value={formatCurrency(stats.totalValue)}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
          />
          <SummaryCard
            icon={BanknotesIcon}
            label="Miete/Monat"
            value={formatCurrency(stats.totalRent)}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          />
          <SummaryCard
            icon={ChartBarIcon}
            label="Ø Rendite"
            value={`${stats.avgYield.toFixed(1)}%`}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          />
          <SummaryCard
            icon={HomeIcon}
            label="Ø Leerstand"
            value={`${stats.avgVacancy.toFixed(1)}%`}
            subValue={stats.vacantUnits > 0 ? `${stats.vacantUnits} leer` : undefined}
            color={stats.avgVacancy > 0
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }
          />
        </div>
      )}

      {/* Properties List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <PropertyList
          properties={properties || []}
          isLoading={isLoading}
          cities={cities || []}
        />
      </div>
    </div>
  )
}
