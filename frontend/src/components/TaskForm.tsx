import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { Calendar, FileText, AlertCircle } from 'lucide-react'

type InboxItem = Tables<'inbox_items'>

interface TaskFormProps {
  task?: InboxItem | null
  onSuccess: () => void
  onCancel: () => void
}

export default function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<number>(1)
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const isEditMode = !!task

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setDescription(task.description || '')
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
      setPriority(task.priority || 1)
      setStatus(task.status as 'pending' | 'in_progress' | 'completed')
    }
  }, [task])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) {
      newErrors.title = 'Titel ist erforderlich'
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
        alert('Sie müssen angemeldet sein, um eine Aufgabe zu erstellen')
        return
      }

      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        priority: priority || 1,
        status,
        source: isEditMode ? task.source : 'manual',
        user_id: user.id,
      }

      let error

      if (isEditMode && task) {
        // Update existing task
        const { error: updateError } = await supabase
          .from('inbox_items')
          .update(taskData)
          .eq('id', task.id)
        error = updateError
      } else {
        // Create new task
        const { error: insertError } = await supabase
          .from('inbox_items')
          .insert([taskData])
        error = insertError
      }

      if (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} task:`, error)
        alert(`Fehler beim ${isEditMode ? 'Aktualisieren' : 'Erstellen'} der Aufgabe: ` + error.message)
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
          placeholder="z.B. Steuererklärung fertigstellen"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Beschreibung
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Weitere Details zur Aufgabe..."
        />
      </div>

      {/* Due Date and Priority in a row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Fälligkeitsdatum
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priorität
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Niedrig</option>
            <option value={2}>Mittel</option>
            <option value={3}>Hoch</option>
            <option value={4}>Sehr hoch</option>
          </select>
        </div>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'pending' | 'in_progress' | 'completed')}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="pending">Offen (Pending)</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="completed">Erledigt</option>
        </select>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-2">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Tipp:</p>
            <p>Die Aufgabe wird automatisch in Ihrer To-Do Liste angezeigt und kann später bearbeitet oder als erledigt markiert werden.</p>
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
            ? (isEditMode ? 'Wird aktualisiert...' : 'Wird erstellt...')
            : (isEditMode ? 'Aufgabe aktualisieren' : 'Aufgabe erstellen')
          }
        </button>
      </div>
    </form>
  )
}
