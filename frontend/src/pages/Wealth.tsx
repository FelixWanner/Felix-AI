import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Home, Sun, Plus, TrendingUp, Euro, Calendar, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '@/components/Modal'
import PropertyForm from '@/components/PropertyForm'
import SolarPanelForm from '@/components/SolarPanelForm'
import LoanManager from '@/components/LoanManager'

type Account = Tables<'accounts'>
type Transaction = Tables<'transactions'>
type Property = Tables<'properties'>

interface SolarPanel {
  id: string
  user_id: string
  name: string
  location: string | null
  installed_date: string | null
  capacity_kwp: number
  annual_yield_kwh: number | null
  feed_in_tariff: number | null
  installation_cost: number | null
  current_value: number | null
  status: string
  property_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface RentalIncome {
  property_id: string
  monthly_income: number
}

export default function Wealth() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [solarPanels, setSolarPanels] = useState<SolarPanel[]>([])
  const [rentalIncomes, setRentalIncomes] = useState<RentalIncome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [showAddSolarModal, setShowAddSolarModal] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editingSolarPanel, setEditingSolarPanel] = useState<SolarPanel | null>(null)
  const [expandedSolarLoans, setExpandedSolarLoans] = useState<string | null>(null)

  useEffect(() => {
    loadWealthData()
  }, [])

  async function loadWealthData() {
    try {
      setLoading(true)
      setError(null)

      // Load accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (accountsError) throw accountsError

      // Load recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(10)

      if (transactionsError) throw transactionsError

      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('name')

      if (propertiesError) throw propertiesError

      // Load solar panels
      const { data: solarData, error: solarError } = await supabase
        .from('solar_panels')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (solarError && solarError.code !== 'PGRST116') {
        console.warn('Solar panels table might not exist yet:', solarError)
      }

      // Calculate monthly rental income per property
      if (propertiesData && propertiesData.length > 0) {
        const propertyIds = propertiesData.map(p => p.id)

        // Get rental transactions for properties
        const { data: rentalData } = await supabase
          .from('transactions')
          .select('property_id, amount')
          .in('property_id', propertyIds)
          .eq('is_rental_income', true)
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if (rentalData) {
          const incomeMap = rentalData.reduce((acc, t) => {
            if (t.property_id) {
              acc[t.property_id] = (acc[t.property_id] || 0) + t.amount
            }
            return acc
          }, {} as Record<string, number>)

          const incomes = Object.entries(incomeMap).map(([property_id, monthly_income]) => ({
            property_id,
            monthly_income
          }))

          setRentalIncomes(incomes)
        }
      }

      setAccounts(accountsData || [])
      setTransactions(transactionsData || [])
      setProperties(propertiesData || [])
      setSolarPanels(solarData || [])
    } catch (err) {
      console.error('Error loading wealth data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load wealth data')
    } finally {
      setLoading(false)
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0)
  const totalPropertyValue = properties.reduce((sum, prop) => sum + (prop.current_value || 0), 0)
  const totalSolarValue = solarPanels.reduce((sum, panel) => sum + (panel.current_value || 0), 0)
  const netWorth = totalBalance + totalPropertyValue + totalSolarValue

  const totalRentalIncome = rentalIncomes.reduce((sum, r) => sum + r.monthly_income, 0)
  const totalSolarRevenue = solarPanels.reduce((sum, panel) => {
    const annualRevenue = (panel.annual_yield_kwh || 0) * (panel.feed_in_tariff || 0)
    return sum + (annualRevenue / 12) // Monthly revenue
  }, 0)

  const calculateROI = (currentValue: number, purchasePrice: number) => {
    if (!purchasePrice || purchasePrice === 0) return 0
    return ((currentValue - purchasePrice) / purchasePrice) * 100
  }

  const calculateSolarPaybackPeriod = (panel: SolarPanel) => {
    if (!panel.installation_cost || !panel.annual_yield_kwh || !panel.feed_in_tariff) return null
    const annualRevenue = panel.annual_yield_kwh * panel.feed_in_tariff
    if (annualRevenue === 0) return null
    return panel.installation_cost / annualRevenue
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const handlePropertyCreated = () => {
    setShowAddPropertyModal(false)
    setEditingProperty(null)
    loadWealthData()
  }

  const handleSolarPanelCreated = () => {
    setShowAddSolarModal(false)
    setEditingSolarPanel(null)
    loadWealthData()
  }

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property)
    setShowAddPropertyModal(true)
  }

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Möchten Sie diese Immobilie wirklich löschen?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) {
        console.error('Error deleting property:', error)
        alert('Fehler beim Löschen der Immobilie: ' + error.message)
        return
      }

      await loadWealthData()
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  const handleEditSolarPanel = (panel: SolarPanel) => {
    setEditingSolarPanel(panel)
    setShowAddSolarModal(true)
  }

  const handleDeleteSolarPanel = async (panelId: string) => {
    if (!confirm('Möchten Sie diese PV-Anlage wirklich löschen?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('solar_panels')
        .delete()
        .eq('id', panelId)

      if (error) {
        console.error('Error deleting solar panel:', error)
        alert('Fehler beim Löschen der PV-Anlage: ' + error.message)
        return
      }

      await loadWealthData()
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wealth</h1>
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wealth</h1>
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wealth</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Immobilien, Konten & Portfolios
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Net Worth
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR'
            }).format(netWorth)}
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Cash & Accounts
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR'
            }).format(totalBalance)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {accounts.length} Konten
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Properties
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR'
            }).format(totalPropertyValue)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {properties.length} Immobilien
          </div>
        </div>
      </div>

      {/* Accounts Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Bank Accounts
        </h2>
        {accounts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No accounts found. Sync your bank accounts to see them here.
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {account.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {account.account_type} {account.iban && `• ${account.iban}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('de-DE', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(account.current_balance)}
                  </div>
                  {account.last_synced_at && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Synced {format(new Date(account.last_synced_at), 'dd.MM.yyyy', { locale: de })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Properties Section - Detailed */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Home className="w-5 h-5" />
            Immobilien-Portfolio
          </h2>
          <button
            onClick={() => setShowAddPropertyModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neue Immobilie
          </button>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Keine Immobilien erfasst.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {properties.map((property) => {
              const rental = rentalIncomes.find(r => r.property_id === property.id)
              const monthlyIncome = rental?.monthly_income || 0
              const roi = property.purchase_price && property.current_value
                ? calculateROI(property.current_value, property.purchase_price)
                : 0

              return (
                <div
                  key={property.id}
                  className="p-5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {property.name}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {property.address}
                      </div>
                      {property.city && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {property.zip_code} {property.city}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        property.property_type === 'residential'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                          : property.property_type === 'commercial'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      }`}>
                        {property.property_type}
                      </span>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEditProperty(property)}
                          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aktueller Wert</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(property.current_value || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kaufpreis</div>
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {property.purchase_price ? formatCurrency(property.purchase_price) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg mb-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Einheiten</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {property.unit_count}
                      </div>
                    </div>
                    <div className="text-center border-l border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mieteinnahmen</div>
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(monthlyIncome)}/mo
                      </div>
                    </div>
                    <div className="text-center border-l border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">ROI</div>
                      <div className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                        roi > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {roi > 0 && <TrendingUp className="w-4 h-4" />}
                        {roi.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {property.purchase_date ? `Gekauft: ${format(new Date(property.purchase_date), 'MMM yyyy', { locale: de })}` : 'Kaufdatum unbekannt'}
                    </div>
                    <div>
                      {property.is_self_occupied ? 'Eigengenutzt' : 'Vermietet'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Solar Panels Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Sun className="w-5 h-5" />
            PV-Anlagen (Photovoltaik)
          </h2>
          <button
            onClick={() => setShowAddSolarModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neue PV-Anlage
          </button>
        </div>

        {solarPanels.length === 0 ? (
          <div className="text-center py-12">
            <Sun className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Keine PV-Anlagen erfasst.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {solarPanels.map((panel) => {
              const annualRevenue = (panel.annual_yield_kwh || 0) * (panel.feed_in_tariff || 0)
              const monthlyRevenue = annualRevenue / 12
              const paybackPeriod = calculateSolarPaybackPeriod(panel)
              const roi = panel.installation_cost && panel.current_value
                ? calculateROI(panel.current_value, panel.installation_cost)
                : 0

              return (
                <div
                  key={panel.id}
                  className="p-5 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Sun className="w-5 h-5 text-yellow-500" />
                        {panel.name}
                      </h3>
                      {panel.location && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {panel.location}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        panel.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {panel.status}
                      </span>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEditSolarPanel(panel)}
                          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSolarPanel(panel.id)}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Installationskosten</div>
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {panel.installation_cost ? formatCurrency(panel.installation_cost) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aktueller Wert</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {panel.current_value ? formatCurrency(panel.current_value) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Leistung (kWp)</div>
                      <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {panel.capacity_kwp.toLocaleString('de-DE', { maximumFractionDigits: 2 })} kWp
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Jahresertrag</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {panel.annual_yield_kwh?.toLocaleString('de-DE', { maximumFractionDigits: 0 }) || 'N/A'} kWh
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg mb-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Einspeisevergütung</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                        <Euro className="w-3 h-3" />
                        {panel.feed_in_tariff?.toFixed(4) || 'N/A'}/kWh
                      </div>
                    </div>
                    <div className="text-center border-l border-green-200 dark:border-green-700">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monatsertrag</div>
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(monthlyRevenue)}
                      </div>
                    </div>
                    <div className="text-center border-l border-green-200 dark:border-green-700">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Jahresertrag</div>
                      <div className="text-sm font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(annualRevenue)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Amortisationszeit</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {paybackPeriod ? `${paybackPeriod.toFixed(1)} Jahre` : 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">ROI</div>
                      <div className={`text-lg font-semibold ${
                        roi > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {roi.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {panel.installed_date && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      Installiert: {format(new Date(panel.installed_date), 'dd.MM.yyyy', { locale: de })}
                    </div>
                  )}

                  {/* Expandable Loans Section */}
                  <div className="mt-4 border-t border-yellow-200 dark:border-yellow-800 pt-3">
                    <button
                      onClick={() => setExpandedSolarLoans(expandedSolarLoans === panel.id ? null : panel.id)}
                      className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <span>Darlehen anzeigen</span>
                      {expandedSolarLoans === panel.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {expandedSolarLoans === panel.id && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800/70 rounded-lg">
                        <LoanManager assetId={panel.id} assetType="solar" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No transactions found. Sync your accounts to see transactions.
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {transaction.description || 'No description'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format(new Date(transaction.date), 'dd.MM.yyyy', { locale: de })}
                    {transaction.category && ` • ${transaction.category}`}
                  </div>
                </div>
                <div className={`font-semibold text-right ${
                  transaction.amount > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Property Modal */}
      <Modal
        isOpen={showAddPropertyModal}
        onClose={() => {
          setShowAddPropertyModal(false)
          setEditingProperty(null)
        }}
        title={editingProperty ? "Immobilie bearbeiten" : "Neue Immobilie"}
      >
        <PropertyForm
          property={editingProperty}
          onSuccess={handlePropertyCreated}
          onCancel={() => {
            setShowAddPropertyModal(false)
            setEditingProperty(null)
          }}
        />
      </Modal>

      {/* Add/Edit Solar Panel Modal */}
      <Modal
        isOpen={showAddSolarModal}
        onClose={() => {
          setShowAddSolarModal(false)
          setEditingSolarPanel(null)
        }}
        title={editingSolarPanel ? "PV-Anlage bearbeiten" : "Neue PV-Anlage"}
      >
        <SolarPanelForm
          solarPanel={editingSolarPanel}
          onSuccess={handleSolarPanelCreated}
          onCancel={() => {
            setShowAddSolarModal(false)
            setEditingSolarPanel(null)
          }}
        />
      </Modal>
    </div>
  )
}
