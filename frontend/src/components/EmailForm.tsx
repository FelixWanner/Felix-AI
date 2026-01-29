import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, AlertCircle, FileText } from 'lucide-react'

interface EmailFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function EmailForm({ onSuccess, onCancel }: EmailFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) {
      newErrors.title = 'Betreff ist erforderlich'
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
        alert('Sie müssen angemeldet sein, um eine Email zu erfassen')
        return
      }

      const emailData = {
        title: title.trim(),
        description: description.trim() || null,
        source: 'email',
        source_id: sourceId.trim() || null,
        status: 'pending',
        user_id: user.id,
      }

      const { error } = await supabase
        .from('inbox_items')
        .insert([emailData])

      if (error) {
        console.error('Error creating email:', error)
        alert('Fehler beim Erfassen der Email: ' + error.message)
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
      {/* Title (Subject) */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Betreff *
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
          placeholder="z.B. Anfrage von Kunde XY"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Source ID (From/Sender) */}
      <div>
        <label htmlFor="sourceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Von (Email-Adresse)
        </label>
        <input
          type="email"
          id="sourceId"
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="z.B. kunde@example.com"
        />
      </div>

      {/* Description (Message Body) */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nachricht
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email-Inhalt..."
        />
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-2">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Hinweis:</p>
            <p>Diese Email wird in Ihrer Inbox angezeigt und kann als gelesen markiert, archiviert oder in eine Aufgabe umgewandelt werden.</p>
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
          {loading ? 'Wird gespeichert...' : 'Email erfassen'}
        </button>
      </div>
    </form>
  )
}
