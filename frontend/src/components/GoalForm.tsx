import { useState, useEffect, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { getQuarter, getWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'

type Goal = Tables<'goals'>

interface GoalFormProps {
  goal?: Goal | null
  timeframe: 'yearly' | 'quarterly' | 'monthly' | 'weekly'
  onSuccess: () => void
  onCancel: () => void
}

const AREA_OPTIONS = [
  { value: '', label: 'Kein Bereich' },
  { value: 'Health', label: 'Health' },
  { value: 'Wealth', label: 'Wealth' },
  { value: 'Productivity', label: 'Productivity' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Career', label: 'Career' },
  { value: 'Relationships', label: 'Relationships' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function GoalForm({ goal, timeframe, onSuccess, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState('')
  const [status, setStatus] = useState('active')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditMode = !!goal

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '')
      setDescription(goal.description || '')
      setArea(goal.area || '')
      setStatus(goal.status || 'active')
      setStartDate(goal.start_date ? goal.start_date.split('T')[0] : '')
      setEndDate(goal.end_date ? goal.end_date.split('T')[0] : '')
      setTargetValue(goal.target_value ? goal.target_value.toString() : '')
      setUnit(goal.unit || '')
    }
  }, [goal])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Titel ist erforderlich'
    } else if (title.trim().length < 3) {
      newErrors.title = 'Titel muss mindestens 3 Zeichen lang sein'
    }

    // Date validation
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end < start) {
        newErrors.endDate = 'Enddatum muss nach Startdatum liegen'
      }
    }

    // Target value validation
    if (targetValue) {
      const value = parseFloat(targetValue)
      if (isNaN(value) || value <= 0) {
        newErrors.targetValue = 'Zielwert muss eine positive Zahl sein'
      }
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
        alert('Sie müssen angemeldet sein, um ein Ziel zu erstellen')
        return
      }

      const currentYear = new Date().getFullYear()
      const currentQuarter = getQuarter(new Date())
      const currentMonth = new Date().getMonth() + 1
      const currentWeek = getWeek(new Date(), { locale: de })

      const goalData = {
        title: title.trim(),
        description: description.trim() || null,
        area: area || null,
        status,
        timeframe: isEditMode ? goal.timeframe : timeframe,
        year: isEditMode ? goal.year : currentYear,
        quarter: isEditMode ? goal.quarter : (timeframe === 'quarterly' ? currentQuarter : null),
        month: isEditMode ? goal.month : (timeframe === 'monthly' ? currentMonth : null),
        week: isEditMode ? goal.week : (timeframe === 'weekly' ? currentWeek : null),
        start_date: startDate || null,
        end_date: endDate || null,
        target_value: targetValue ? parseFloat(targetValue) : null,
        unit: unit.trim() || null,
        current_value: isEditMode ? goal.current_value : 0,
        progress_percent: isEditMode ? goal.progress_percent : 0,
      }

      let error

      if (isEditMode && goal) {
        // Update existing goal
        const { error: updateError } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', goal.id)
        error = updateError
      } else {
        // Create new goal
        const { error: insertError } = await supabase
          .from('goals')
          .insert([goalData])
        error = insertError
      }

      if (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} goal:`, error)
        alert(`Fehler beim ${isEditMode ? 'Aktualisieren' : 'Erstellen'} des Ziels: ` + error.message)
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Ziel-Titel <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="z.B. 10kg abnehmen"
          autoFocus
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Beschreibung
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Details und Kontext zum Ziel..."
        />
      </div>

      {/* Area & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bereich
          </label>
          <select
            id="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {AREA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Start & End Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Startdatum
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Enddatum
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.endDate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Target Value & Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="targetValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Zielwert
          </label>
          <input
            type="number"
            id="targetValue"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            step="0.01"
            min="0"
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.targetValue ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="z.B. 10"
          />
          {errors.targetValue && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.targetValue}</p>
          )}
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Einheit
          </label>
          <input
            type="text"
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. kg, EUR, Stunden"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center gap-2"
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading
            ? (isEditMode ? 'Wird aktualisiert...' : 'Wird erstellt...')
            : (isEditMode ? 'Ziel aktualisieren' : 'Ziel erstellen')
          }
        </button>
      </div>
    </form>
  )
}
