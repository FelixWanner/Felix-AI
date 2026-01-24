import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { FileText, Sparkles, Loader2, AlertCircle, CheckCircle, ListTodo } from 'lucide-react'

type Meeting = Tables<'meetings'>

interface ActionItem {
  title: string
  description?: string
  assigned_to?: string
  due_date?: string
  priority: number
}

interface ProcessingResult {
  action_items: ActionItem[]
  summary: string
}

interface MeetingMinutesFormProps {
  meeting: Meeting
  onSuccess: () => void
  onCancel: () => void
}

export default function MeetingMinutesForm({ meeting, onSuccess, onCancel }: MeetingMinutesFormProps) {
  const [transcript, setTranscript] = useState(meeting.transcript || '')
  const [summary, setSummary] = useState(meeting.summary || '')
  const [loading, setLoading] = useState(false)
  const [processingAI, setProcessingAI] = useState(false)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'

  const handleSaveMinutes = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('meetings')
        .update({
          transcript: transcript.trim() || null,
          summary: summary.trim() || null,
        })
        .eq('id', meeting.id)

      if (updateError) {
        throw updateError
      }

      onSuccess()
    } catch (err) {
      console.error('Error saving meeting minutes:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessWithAI = async () => {
    if (!transcript.trim()) {
      setError('Bitte geben Sie zuerst die Meeting-Notizen ein')
      return
    }

    setProcessingAI(true)
    setError(null)
    setProcessingResult(null)

    try {
      const response = await fetch(`${N8N_WEBHOOK_URL}/process-meeting-minutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meeting_id: meeting.id,
          meeting_title: meeting.title,
          meeting_date: meeting.start_time,
          attendees: meeting.attendees,
          transcript: transcript.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ProcessingResult = await response.json()

      setProcessingResult(result)

      // Auto-fill summary if returned
      if (result.summary) {
        setSummary(result.summary)
      }

    } catch (err) {
      console.error('Error processing with AI:', err)
      setError(
        err instanceof Error
          ? `AI-Verarbeitung fehlgeschlagen: ${err.message}`
          : 'AI-Verarbeitung fehlgeschlagen'
      )
    } finally {
      setProcessingAI(false)
    }
  }

  return (
    <form onSubmit={handleSaveMinutes} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Meeting Transcript / Notes */}
      <div>
        <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FileText className="w-4 h-4 inline mr-1" />
          Meeting-Notizen / Protokoll
        </label>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Geben Sie hier die Meeting-Notizen oder das Transkript ein...

Beispiel:
- Felix stellt die neuen Quartalszahlen vor
- Maria berichtet über den Projektfortschritt
- Action Item: Felix erstellt bis Freitag den Report
- Action Item: Maria kümmert sich um die Kundenpräsentation bis nächste Woche"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Tipp: Schreiben Sie Action Items mit "Action Item:" oder "TODO:" am Anfang, damit die KI sie leichter erkennt.
        </p>
      </div>

      {/* AI Processing Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleProcessWithAI}
          disabled={processingAI || !transcript.trim()}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingAI ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verarbeite mit AI...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Mit AI verarbeiten
            </>
          )}
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Extrahiert automatisch Action Items und erstellt eine Zusammenfassung
        </span>
      </div>

      {/* AI Processing Result */}
      {processingResult && (
        <div className="space-y-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">AI-Verarbeitung erfolgreich!</span>
          </div>

          {/* Extracted Action Items */}
          {processingResult.action_items && processingResult.action_items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Extrahierte Action Items ({processingResult.action_items.length})
              </h4>
              <div className="space-y-2">
                {processingResult.action_items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {item.description}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {item.assigned_to && (
                        <span>Zuständig: {item.assigned_to}</span>
                      )}
                      {item.due_date && (
                        <span>Fällig: {item.due_date}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded ${
                        item.priority >= 3 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        item.priority === 2 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {item.priority >= 3 ? 'Hoch' : item.priority === 2 ? 'Mittel' : 'Normal'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                Diese Action Items wurden als Aufgaben in Ihrer Inbox erstellt.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Sparkles className="w-4 h-4 inline mr-1" />
          Zusammenfassung
        </label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Kurze Zusammenfassung des Meetings (kann von der KI automatisch erstellt werden)"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
          disabled={loading || processingAI}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="flex-1 btn-primary"
          disabled={loading || processingAI}
        >
          {loading ? 'Wird gespeichert...' : 'Minutes speichern'}
        </button>
      </div>
    </form>
  )
}
