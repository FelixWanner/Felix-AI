import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Pill, Plus, Trash2, Clock } from 'lucide-react'

interface SupplementPeptideEntry {
  id?: string
  user_id: string
  date: string
  time: string
  substance_name: string
  substance_type: 'supplement' | 'peptide' | 'medication'
  dose: string
  notes: string
}

interface Props {
  date: Date
}

export default function SupplementPeptideLog({ date }: Props) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<SupplementPeptideEntry[]>([])
  const [loading, setLoading] = useState(false)

  // Form State
  const [showForm, setShowForm] = useState(false)
  const [time, setTime] = useState(format(new Date(), 'HH:mm'))
  const [substanceName, setSubstanceName] = useState('')
  const [substanceType, setSubstanceType] = useState<'supplement' | 'peptide' | 'medication'>('supplement')
  const [dose, setDose] = useState('')
  const [notes, setNotes] = useState('')

  const dateStr = format(date, 'yyyy-MM-dd')

  useEffect(() => {
    if (user) {
      loadEntries()
    }
  }, [user, date])

  async function loadEntries() {
    if (!user) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('supplement_peptide_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .order('time', { ascending: true })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading supplement/peptide log:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddEntry() {
    if (!user || !substanceName || !dose || !time) {
      alert('Bitte fülle alle Pflichtfelder aus (Substanz, Dosis, Uhrzeit)')
      return
    }

    try {
      const entryData: SupplementPeptideEntry = {
        user_id: user.id,
        date: dateStr,
        time,
        substance_name: substanceName,
        substance_type: substanceType,
        dose,
        notes
      }

      const { error } = await supabase
        .from('supplement_peptide_log')
        .insert(entryData)

      if (error) throw error

      // Reset form
      setSubstanceName('')
      setDose('')
      setNotes('')
      setTime(format(new Date(), 'HH:mm'))
      setSubstanceType('supplement')
      setShowForm(false)

      await loadEntries()
    } catch (error) {
      console.error('Error adding entry:', error)
      alert('Fehler beim Hinzufügen des Eintrags')
    }
  }

  async function handleDeleteEntry(id: string) {
    if (!confirm('Eintrag wirklich löschen?')) return

    try {
      const { error } = await supabase
        .from('supplement_peptide_log')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadEntries()
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Fehler beim Löschen des Eintrags')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'peptide':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'medication':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'peptide':
        return 'Peptid'
      case 'medication':
        return 'Medikament'
      default:
        return 'Supplement'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Supplement & Peptide Log
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Abbrechen' : 'Eintrag hinzufügen'}
        </button>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Uhrzeit *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ *
              </label>
              <select
                value={substanceType}
                onChange={(e) => setSubstanceType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="supplement">Supplement</option>
                <option value="peptide">Peptid</option>
                <option value="medication">Medikament</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Substanz *
              </label>
              <input
                type="text"
                value={substanceName}
                onChange={(e) => setSubstanceName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. Kreatin, BPC-157"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dosis *
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. 5g, 250mcg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="z.B. subkutan, mit Nahrung, etc."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAddEntry}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">Lade Einträge...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Keine Einträge für diesen Tag. Klicke auf "Eintrag hinzufügen", um zu starten.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0 flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                <Clock className="w-4 h-4" />
                {entry.time}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {entry.substance_name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(entry.substance_type)}`}>
                    {getTypeLabel(entry.substance_type)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.dose}
                  </span>
                </div>
                {entry.notes && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.notes}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDeleteEntry(entry.id!)}
                className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
