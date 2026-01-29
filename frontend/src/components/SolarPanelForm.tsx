import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { Sun, AlertCircle, Zap, Euro } from 'lucide-react'

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

interface SolarPanelFormProps {
  solarPanel?: SolarPanel | null
  onSuccess: () => void
  onCancel: () => void
}

export default function SolarPanelForm({ solarPanel, onSuccess, onCancel }: SolarPanelFormProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [installedDate, setInstalledDate] = useState('')
  const [capacityKwp, setCapacityKwp] = useState('')
  const [annualYieldKwh, setAnnualYieldKwh] = useState('')
  const [feedInTariff, setFeedInTariff] = useState('')
  const [installationCost, setInstallationCost] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>('active')
  const [propertyId, setPropertyId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const isEditMode = !!solarPanel

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    if (solarPanel) {
      setName(solarPanel.name || '')
      setLocation(solarPanel.location || '')
      setInstalledDate(solarPanel.installed_date ? solarPanel.installed_date.split('T')[0] : '')
      setCapacityKwp(solarPanel.capacity_kwp ? solarPanel.capacity_kwp.toString() : '')
      setAnnualYieldKwh(solarPanel.annual_yield_kwh ? solarPanel.annual_yield_kwh.toString() : '')
      setFeedInTariff(solarPanel.feed_in_tariff ? solarPanel.feed_in_tariff.toString() : '')
      setInstallationCost(solarPanel.installation_cost ? solarPanel.installation_cost.toString() : '')
      setCurrentValue(solarPanel.current_value ? solarPanel.current_value.toString() : '')
      setStatus(solarPanel.status as 'active' | 'inactive' | 'maintenance')
      setPropertyId(solarPanel.property_id || '')
      setNotes(solarPanel.notes || '')
    }
  }, [solarPanel])

  async function loadProperties() {
    try {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .order('name')

      setProperties(data || [])
    } catch (err) {
      console.error('Error loading properties:', err)
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }

    if (!capacityKwp || parseFloat(capacityKwp) <= 0) {
      newErrors.capacityKwp = 'Leistung (kWp) muss größer als 0 sein'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Sie müssen angemeldet sein, um eine PV-Anlage zu erfassen')
        return
      }

      const solarPanelData = {
        name: name.trim(),
        location: location.trim() || null,
        installed_date: installedDate || null,
        capacity_kwp: parseFloat(capacityKwp),
        annual_yield_kwh: annualYieldKwh ? parseFloat(annualYieldKwh) : null,
        feed_in_tariff: feedInTariff ? parseFloat(feedInTariff) : null,
        installation_cost: installationCost ? parseFloat(installationCost) : null,
        current_value: currentValue ? parseFloat(currentValue) : null,
        status,
        property_id: propertyId || null,
        notes: notes.trim() || null,
        user_id: user.id,
      }

      let error

      if (isEditMode && solarPanel) {
        // Update existing solar panel
        const { error: updateError } = await supabase
          .from('solar_panels')
          .update(solarPanelData)
          .eq('id', solarPanel.id)
        error = updateError
      } else {
        // Create new solar panel
        const { error: insertError } = await supabase
          .from('solar_panels')
          .insert([solarPanelData])
        error = insertError
      }

      if (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} solar panel:`, error)
        alert(`Fehler beim ${isEditMode ? 'Aktualisieren' : 'Erfassen'} der PV-Anlage: ` + error.message)
        return
      }

      onSuccess()
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Anlagenname *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            errors.name
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="z.B. PV-Anlage Dach Süd"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Location and Property */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Standort
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Hauptstraße 42, Berlin"
          />
        </div>
        <div>
          <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Zugeordnete Immobilie
          </label>
          <select
            id="propertyId"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Keine Zuordnung</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Capacity (kWp) - REQUIRED */}
      <div>
        <label htmlFor="capacityKwp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Zap className="w-4 h-4 inline mr-1" />
          Leistung (kWp) *
        </label>
        <input
          type="number"
          id="capacityKwp"
          value={capacityKwp}
          onChange={(e) => setCapacityKwp(e.target.value)}
          step="0.01"
          className={`w-full px-3 py-2 rounded-lg border ${
            errors.capacityKwp
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="z.B. 9.95"
        />
        {errors.capacityKwp && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.capacityKwp}
          </p>
        )}
      </div>

      {/* Annual Yield and Feed-in Tariff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="annualYieldKwh" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Jahresertrag (kWh)
          </label>
          <input
            type="number"
            id="annualYieldKwh"
            value={annualYieldKwh}
            onChange={(e) => setAnnualYieldKwh(e.target.value)}
            step="1"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. 10000"
          />
        </div>
        <div>
          <label htmlFor="feedInTariff" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Euro className="w-4 h-4 inline mr-1" />
            Einspeisevergütung (€/kWh)
          </label>
          <input
            type="number"
            id="feedInTariff"
            value={feedInTariff}
            onChange={(e) => setFeedInTariff(e.target.value)}
            step="0.0001"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. 0.0823"
          />
        </div>
      </div>

      {/* Installation Cost and Current Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="installationCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Installationskosten (€)
          </label>
          <input
            type="number"
            id="installationCost"
            value={installationCost}
            onChange={(e) => setInstallationCost(e.target.value)}
            step="0.01"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. 18000"
          />
        </div>
        <div>
          <label htmlFor="currentValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aktueller Wert (€)
          </label>
          <input
            type="number"
            id="currentValue"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            step="0.01"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. 15000"
          />
        </div>
      </div>

      {/* Installed Date and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="installedDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Installationsdatum
          </label>
          <input
            type="date"
            id="installedDate"
            value={installedDate}
            onChange={(e) => setInstalledDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'maintenance')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
            <option value="maintenance">Wartung</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notizen
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Zusätzliche Informationen zur PV-Anlage..."
        />
      </div>

      {/* Info box */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex gap-2">
          <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Tipp:</p>
            <p>Die PV-Anlage wird in Ihrem Wealth-Modul angezeigt. ROI, Amortisationszeit und Erträge werden automatisch berechnet.</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
          disabled={loading}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="flex-1 btn-primary"
          disabled={loading}
        >
          {loading
            ? (isEditMode ? 'Wird aktualisiert...' : 'Wird gespeichert...')
            : (isEditMode ? 'PV-Anlage aktualisieren' : 'PV-Anlage erfassen')
          }
        </button>
      </div>
    </form>
  )
}
