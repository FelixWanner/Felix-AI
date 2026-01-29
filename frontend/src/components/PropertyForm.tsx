import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { Home, AlertCircle, MapPin } from 'lucide-react'

type Property = Tables<'properties'>

interface PropertyFormProps {
  property?: Property | null
  onSuccess: () => void
  onCancel: () => void
}

export default function PropertyForm({ property, onSuccess, onCancel }: PropertyFormProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial' | 'mixed'>('residential')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [unitCount, setUnitCount] = useState('1')
  const [isSelfOccupied, setIsSelfOccupied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const isEditMode = !!property

  useEffect(() => {
    if (property) {
      setName(property.name || '')
      setAddress(property.address || '')
      setCity(property.city || '')
      setZipCode(property.zip_code || '')
      setPropertyType(property.property_type as 'residential' | 'commercial' | 'mixed')
      setPurchasePrice(property.purchase_price ? property.purchase_price.toString() : '')
      setCurrentValue(property.current_value ? property.current_value.toString() : '')
      setPurchaseDate(property.purchase_date ? property.purchase_date.split('T')[0] : '')
      setUnitCount(property.unit_count ? property.unit_count.toString() : '1')
      setIsSelfOccupied(property.is_self_occupied || false)
    }
  }, [property])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }

    if (!address.trim()) {
      newErrors.address = 'Adresse ist erforderlich'
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
        alert('Sie müssen angemeldet sein, um eine Immobilie zu erfassen')
        return
      }

      const propertyData = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim() || null,
        zip_code: zipCode.trim() || null,
        property_type: propertyType,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        current_value: currentValue ? parseFloat(currentValue) : null,
        purchase_date: purchaseDate || null,
        unit_count: parseInt(unitCount) || 1,
        is_self_occupied: isSelfOccupied,
        user_id: user.id,
      }

      let error

      if (isEditMode && property) {
        // Update existing property
        const { error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id)
        error = updateError
      } else {
        // Create new property
        const { error: insertError } = await supabase
          .from('properties')
          .insert([propertyData])
        error = insertError
      }

      if (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} property:`, error)
        alert(`Fehler beim ${isEditMode ? 'Aktualisieren' : 'Erfassen'} der Immobilie: ` + error.message)
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
          Objektname *
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
          placeholder="z.B. Mehrfamilienhaus Hauptstraße 42"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Adresse *
        </label>
        <input
          type="text"
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            errors.address
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="z.B. Hauptstraße 42"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.address}
          </p>
        )}
      </div>

      {/* City and Zip Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PLZ
          </label>
          <input
            type="text"
            id="zipCode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. 12345"
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stadt
          </label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Berlin"
          />
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Objekttyp
        </label>
        <select
          id="propertyType"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value as 'residential' | 'commercial' | 'mixed')}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="residential">Wohnimmobilie</option>
          <option value="commercial">Gewerbeimmobilie</option>
          <option value="mixed">Mischnutzung</option>
        </select>
      </div>

      {/* Purchase Price and Current Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kaufpreis (€)
          </label>
          <input
            type="number"
            id="purchasePrice"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            step="0.01"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. 250000"
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
            placeholder="z.B. 280000"
          />
        </div>
      </div>

      {/* Purchase Date and Unit Count */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kaufdatum
          </label>
          <input
            type="date"
            id="purchaseDate"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="unitCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Anzahl Einheiten
          </label>
          <input
            type="number"
            id="unitCount"
            value={unitCount}
            onChange={(e) => setUnitCount(e.target.value)}
            min="1"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Self Occupied Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isSelfOccupied"
          checked={isSelfOccupied}
          onChange={(e) => setIsSelfOccupied(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isSelfOccupied" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Eigengenutzt
        </label>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-2">
          <Home className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Hinweis:</p>
            <p>Die Immobilie wird in Ihrem Wealth-Modul angezeigt. ROI und Mieteinnahmen werden automatisch berechnet.</p>
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
            : (isEditMode ? 'Immobilie aktualisieren' : 'Immobilie erfassen')
          }
        </button>
      </div>
    </form>
  )
}
