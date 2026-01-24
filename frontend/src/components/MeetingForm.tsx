import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { Calendar, MapPin, Users, AlertCircle, Plus, X, Building2, CreditCard } from 'lucide-react'

type Meeting = Tables<'meetings'>
type Client = Tables<'clients'>

interface Attendee {
  name: string
  email?: string
}

interface MeetingFormProps {
  meeting?: Meeting | null
  onSuccess: () => void
  onCancel: () => void
}

export default function MeetingForm({ meeting, onSuccess, onCancel }: MeetingFormProps) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [newAttendeeName, setNewAttendeeName] = useState('')
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('')
  const [clientId, setClientId] = useState<string>('')
  const [isBillable, setIsBillable] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const isEditMode = !!meeting

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title || '')
      setStartTime(meeting.start_time ? formatDateTimeLocal(meeting.start_time) : '')
      setEndTime(meeting.end_time ? formatDateTimeLocal(meeting.end_time) : '')
      setLocation(meeting.location || '')
      setAttendees(meeting.attendees as Attendee[] || [])
      setClientId(meeting.client_id || '')
      setIsBillable(meeting.is_billable || false)
    }
  }, [meeting])

  function formatDateTimeLocal(isoString: string): string {
    const date = new Date(isoString)
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  async function loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('name')

    setClients(data || [])
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) {
      newErrors.title = 'Titel ist erforderlich'
    }

    if (!startTime) {
      newErrors.startTime = 'Startzeit ist erforderlich'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddAttendee = () => {
    if (newAttendeeName.trim()) {
      setAttendees([
        ...attendees,
        { name: newAttendeeName.trim(), email: newAttendeeEmail.trim() || undefined }
      ])
      setNewAttendeeName('')
      setNewAttendeeEmail('')
    }
  }

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index))
  }

  const calculateDuration = (): number | null => {
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      const diffMs = end.getTime() - start.getTime()
      return Math.round(diffMs / 60000)
    }
    return null
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
        alert('Sie müssen angemeldet sein, um ein Meeting zu erstellen')
        return
      }

      const meetingData = {
        title: title.trim(),
        start_time: startTime ? new Date(startTime).toISOString() : null,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        duration_minutes: calculateDuration(),
        location: location.trim() || null,
        attendees: attendees.length > 0 ? attendees : null,
        client_id: clientId || null,
        is_billable: isBillable,
        source: isEditMode ? meeting.source : 'manual',
        user_id: user.id,
      }

      let error

      if (isEditMode && meeting) {
        const { error: updateError } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', meeting.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('meetings')
          .insert([meetingData])
        error = insertError
      }

      if (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} meeting:`, error)
        alert(`Fehler beim ${isEditMode ? 'Aktualisieren' : 'Erstellen'} des Meetings: ` + error.message)
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
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Titel *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            errors.title
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="z.B. Quartalsreview mit Team"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Start Time and End Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Startzeit *
          </label>
          <input
            type="datetime-local"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              errors.startTime
                ? 'border-red-300 dark:border-red-700'
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.startTime && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.startTime}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Endzeit
          </label>
          <input
            type="datetime-local"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Ort
        </label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="z.B. Büro, Zoom, Teams"
        />
      </div>

      {/* Attendees */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Users className="w-4 h-4 inline mr-1" />
          Teilnehmer
        </label>

        {/* Existing Attendees */}
        {attendees.length > 0 && (
          <div className="mb-3 space-y-2">
            {attendees.map((attendee, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700"
              >
                <div className="flex-1">
                  <span className="text-sm text-gray-900 dark:text-white">{attendee.name}</span>
                  {attendee.email && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({attendee.email})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttendee(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Attendee */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newAttendeeName}
            onChange={(e) => setNewAttendeeName(e.target.value)}
            placeholder="Name"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            type="email"
            value={newAttendeeEmail}
            onChange={(e) => setNewAttendeeEmail(e.target.value)}
            placeholder="Email (optional)"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="button"
            onClick={handleAddAttendee}
            disabled={!newAttendeeName.trim()}
            className="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Client and Billable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Building2 className="w-4 h-4 inline mr-1" />
            Kunde
          </label>
          <select
            id="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Kein Kunde</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.company && `(${client.company})`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Abrechenbar
            </span>
          </label>
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
            ? (isEditMode ? 'Wird aktualisiert...' : 'Wird erstellt...')
            : (isEditMode ? 'Meeting aktualisieren' : 'Meeting erstellen')
          }
        </button>
      </div>
    </form>
  )
}
