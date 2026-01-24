import { useState, useMemo } from 'react'
import clsx from 'clsx'
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import PropertyCard from './PropertyCard'
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
// Sort Options
// ─────────────────────────────────────────────────────────────

type SortField = 'name' | 'city' | 'cashflow' | 'yield' | 'vacancy' | 'value'
type SortDirection = 'asc' | 'desc'

interface SortOption {
  field: SortField
  label: string
  defaultDirection: SortDirection
}

const sortOptions: SortOption[] = [
  { field: 'name', label: 'Name', defaultDirection: 'asc' },
  { field: 'city', label: 'Stadt', defaultDirection: 'asc' },
  { field: 'cashflow', label: 'Cashflow', defaultDirection: 'desc' },
  { field: 'yield', label: 'Rendite', defaultDirection: 'desc' },
  { field: 'vacancy', label: 'Leerstand', defaultDirection: 'asc' },
  { field: 'value', label: 'Wert', defaultDirection: 'desc' },
]

// ─────────────────────────────────────────────────────────────
// Filter Chip Component
// ─────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string
  onRemove: () => void
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800"
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Table Row Component
// ─────────────────────────────────────────────────────────────

interface TableRowProps {
  property: PropertyWithStats
}

function TableRow({ property }: TableRowProps) {
  const totalUnits = property.units.length || property.unit_count || 0

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-3">
        <a
          href={`/wealth/properties/${property.id}`}
          className="flex items-center gap-3 group"
        >
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <BuildingOffice2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {property.name}
            </p>
            {property.street && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {property.street}, {property.postal_code} {property.city}
              </p>
            )}
          </div>
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className={clsx(
            'font-medium',
            property.vacancyRate === 0 ? 'text-emerald-600' : property.vacancyRate < 20 ? 'text-amber-600' : 'text-red-600'
          )}>
            {property.occupiedUnits}/{totalUnits}
          </span>
          <span className="text-xs text-gray-400">
            ({(100 - property.vacancyRate).toFixed(0)}%)
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={clsx(
          'font-medium',
          property.vacancyRate === 0 ? 'text-emerald-600' : property.vacancyRate < 10 ? 'text-amber-600' : 'text-red-600'
        )}>
          {property.vacancyRate.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
        {formatCurrency(property.monthlyRentTotal)}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={clsx(
          'font-medium',
          property.netMonthlyCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'
        )}>
          {formatCurrency(property.netMonthlyCashflow)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={clsx(
          'font-medium',
          property.grossYield >= 5 ? 'text-emerald-600' : property.grossYield >= 3 ? 'text-gray-600' : 'text-amber-600'
        )}>
          {property.grossYield.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <a
          href={`/wealth/properties/${property.id}`}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          Details →
        </a>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
// Main PropertyList Component
// ─────────────────────────────────────────────────────────────

interface PropertyListProps {
  properties: PropertyWithStats[]
  isLoading?: boolean
  cities?: string[]
}

export default function PropertyList({ properties, isLoading, cities = [] }: PropertyListProps) {
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [showVacancyOnly, setShowVacancyOnly] = useState(false)
  const [minYield, setMinYield] = useState<number | null>(null)

  // Sort state
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false)

  // Apply filters and sorting
  const filteredAndSorted = useMemo(() => {
    let result = [...properties]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.street?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
      )
    }

    // City filter
    if (selectedCity) {
      result = result.filter(p => p.city === selectedCity)
    }

    // Vacancy filter
    if (showVacancyOnly) {
      result = result.filter(p => p.vacancyRate > 0)
    }

    // Yield filter
    if (minYield !== null) {
      result = result.filter(p => p.grossYield >= minYield)
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '')
          break
        case 'cashflow':
          comparison = a.netMonthlyCashflow - b.netMonthlyCashflow
          break
        case 'yield':
          comparison = a.grossYield - b.grossYield
          break
        case 'vacancy':
          comparison = a.vacancyRate - b.vacancyRate
          break
        case 'value':
          comparison = (a.current_value || 0) - (b.current_value || 0)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [properties, searchQuery, selectedCity, showVacancyOnly, minYield, sortField, sortDirection])

  // Active filters
  const activeFilters = [
    selectedCity && { label: selectedCity, onRemove: () => setSelectedCity(null) },
    showVacancyOnly && { label: 'Mit Leerstand', onRemove: () => setShowVacancyOnly(false) },
    minYield !== null && { label: `>${minYield}% Rendite`, onRemove: () => setMinYield(null) },
  ].filter(Boolean) as FilterChipProps[]

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      const option = sortOptions.find(o => o.field === field)
      setSortDirection(option?.defaultDirection || 'asc')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Immobilie suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
            showFilters || activeFilters.length > 0
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
        >
          <FunnelIcon className="h-4 w-4" />
          Filter
          {activeFilters.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900 rounded-full">
              {activeFilters.length}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Bars3BottomLeftIcon className="h-4 w-4 text-gray-400" />
          <select
            value={sortField}
            onChange={e => handleSortChange(e.target.value as SortField)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
          >
            {sortOptions.map(option => (
              <option key={option.field} value={option.field}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {sortDirection === 'asc' ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-md transition-colors',
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stadt
              </label>
              <select
                value={selectedCity || ''}
                onChange={e => setSelectedCity(e.target.value || null)}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
              >
                <option value="">Alle Städte</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Vacancy Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={showVacancyOnly}
                  onChange={e => setShowVacancyOnly(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Nur mit Leerstand
                </span>
              </label>
            </div>

            {/* Yield Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mindestrendite
              </label>
              <select
                value={minYield ?? ''}
                onChange={e => setMinYield(e.target.value ? Number(e.target.value) : null)}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
              >
                <option value="">Keine</option>
                <option value="3">3% +</option>
                <option value="5">5% +</option>
                <option value="7">7% +</option>
                <option value="10">10% +</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">Aktive Filter:</span>
          {activeFilters.map((filter, idx) => (
            <FilterChip key={idx} {...filter} />
          ))}
          <button
            onClick={() => {
              setSelectedCity(null)
              setShowVacancyOnly(false)
              setMinYield(null)
            }}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Alle entfernen
          </button>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {filteredAndSorted.length} von {properties.length} Immobilien
      </p>

      {/* Content */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12">
          <BuildingOffice2Icon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Keine Immobilien gefunden
          </p>
          {(searchQuery || activeFilters.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCity(null)
                setShowVacancyOnly(false)
                setMinYield(null)
              }}
              className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSorted.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Immobilie
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Einheiten
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Leerstand
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Miete/Mo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cashflow
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rendite
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSorted.map(property => (
                  <TableRow key={property.id} property={property} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
