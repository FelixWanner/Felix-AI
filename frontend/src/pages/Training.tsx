import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  Dumbbell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Award,
  TrendingUp
} from 'lucide-react'

interface TrainingSession {
  id?: string
  user_id: string
  date: string
  session_name: string
  start_time: string | null
  end_time: string | null
  plan_followed: boolean
  deviation_reason: string
  intensity_discipline: boolean
  notes: string
}

interface TrainingSet {
  id?: string
  user_id: string
  session_id: string
  exercise_name: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  is_pr: boolean
  comment: string
}

interface SetInput {
  exercise_name: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  comment: string
}

export default function Training() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Session State
  const [session, setSession] = useState<TrainingSession | null>(null)
  const [sessionName, setSessionName] = useState('Tag 1')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [planFollowed, setPlanFollowed] = useState(true)
  const [deviationReason, setDeviationReason] = useState('')
  const [intensityDiscipline, setIntensityDiscipline] = useState(true)
  const [notes, setNotes] = useState('')

  // Sets State
  const [sets, setSets] = useState<TrainingSet[]>([])
  const [newSet, setNewSet] = useState<SetInput>({
    exercise_name: '',
    set_number: 1,
    weight_kg: null,
    reps: null,
    rpe: null,
    comment: ''
  })

  // PR History for automatic PR detection
  const [prHistory, setPrHistory] = useState<Record<string, { weight: number; reps: number }>>({})

  const dateStr = format(currentDate, 'yyyy-MM-dd')

  useEffect(() => {
    if (user) {
      loadData()
      loadPRHistory()
    }
  }, [user, currentDate])

  async function loadData() {
    if (!user) return
    setLoading(true)

    try {
      // Load Training Session
      const { data: sessionData } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single()

      if (sessionData) {
        setSession(sessionData)
        setSessionName(sessionData.session_name || 'Tag 1')
        setStartTime(sessionData.start_time || '')
        setEndTime(sessionData.end_time || '')
        setPlanFollowed(sessionData.plan_followed ?? true)
        setDeviationReason(sessionData.deviation_reason || '')
        setIntensityDiscipline(sessionData.intensity_discipline ?? true)
        setNotes(sessionData.notes || '')

        // Load Sets
        const { data: setsData } = await supabase
          .from('training_sets')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('exercise_name', { ascending: true })
          .order('set_number', { ascending: true })

        if (setsData) {
          setSets(setsData)
        }
      } else {
        // Reset form
        setSession(null)
        setSessionName('Tag 1')
        setStartTime('')
        setEndTime('')
        setPlanFollowed(true)
        setDeviationReason('')
        setIntensityDiscipline(true)
        setNotes('')
        setSets([])
      }
    } catch (error) {
      console.error('Error loading training data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPRHistory() {
    if (!user) return

    // Load the best weight × reps for each exercise
    const { data } = await supabase
      .from('training_sets')
      .select('exercise_name, weight_kg, reps')
      .eq('user_id', user.id)
      .not('weight_kg', 'is', null)
      .not('reps', 'is', null)

    if (data) {
      const history: Record<string, { weight: number; reps: number }> = {}
      data.forEach(set => {
        const score = (set.weight_kg || 0) * (set.reps || 0)
        const key = set.exercise_name
        if (!history[key] || (history[key].weight * history[key].reps) < score) {
          history[key] = { weight: set.weight_kg || 0, reps: set.reps || 0 }
        }
      })
      setPrHistory(history)
    }
  }

  async function handleSaveSession() {
    if (!user) return
    setSaving(true)

    try {
      // Save or create session
      const sessionData: TrainingSession = {
        id: session?.id,
        user_id: user.id,
        date: dateStr,
        session_name: sessionName,
        start_time: startTime || null,
        end_time: endTime || null,
        plan_followed: planFollowed,
        deviation_reason: deviationReason,
        intensity_discipline: intensityDiscipline,
        notes: notes
      }

      const { data: savedSession, error } = await supabase
        .from('training_sessions')
        .upsert(sessionData, { onConflict: 'user_id,date' })
        .select()
        .single()

      if (error) throw error

      setSession(savedSession)
      alert('Session erfolgreich gespeichert!')
      await loadData()
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Fehler beim Speichern der Session')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddSet() {
    if (!user || !session) {
      alert('Bitte speichere zuerst die Session!')
      return
    }

    if (!newSet.exercise_name || !newSet.weight_kg || !newSet.reps) {
      alert('Bitte fülle Übung, Gewicht und Wiederholungen aus')
      return
    }

    try {
      // Check for PR
      const currentScore = (newSet.weight_kg || 0) * (newSet.reps || 0)
      const prScore = prHistory[newSet.exercise_name]
        ? prHistory[newSet.exercise_name].weight * prHistory[newSet.exercise_name].reps
        : 0
      const isPR = currentScore > prScore

      const setData: TrainingSet = {
        user_id: user.id,
        session_id: session.id!,
        exercise_name: newSet.exercise_name,
        set_number: newSet.set_number,
        weight_kg: newSet.weight_kg,
        reps: newSet.reps,
        rpe: newSet.rpe,
        is_pr: isPR,
        comment: newSet.comment
      }

      const { error } = await supabase
        .from('training_sets')
        .insert(setData)

      if (error) throw error

      // Update PR history
      if (isPR) {
        setPrHistory({
          ...prHistory,
          [newSet.exercise_name]: { weight: newSet.weight_kg!, reps: newSet.reps! }
        })
      }

      // Reset form and increment set number for same exercise
      const nextSetNumber = newSet.set_number + 1
      setNewSet({
        exercise_name: newSet.exercise_name,
        set_number: nextSetNumber,
        weight_kg: newSet.weight_kg,
        reps: null,
        rpe: null,
        comment: ''
      })

      await loadData()
    } catch (error) {
      console.error('Error adding set:', error)
      alert('Fehler beim Hinzufügen des Satzes')
    }
  }

  async function handleDeleteSet(setId: string) {
    if (!confirm('Satz wirklich löschen?')) return

    try {
      const { error } = await supabase
        .from('training_sets')
        .delete()
        .eq('id', setId)

      if (error) throw error
      await loadData()
      await loadPRHistory()
    } catch (error) {
      console.error('Error deleting set:', error)
      alert('Fehler beim Löschen des Satzes')
    }
  }

  function goToPreviousDay() {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  function goToNextDay() {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  // Group sets by exercise
  const setsByExercise: Record<string, TrainingSet[]> = {}
  sets.forEach(set => {
    if (!setsByExercise[set.exercise_name]) {
      setsByExercise[set.exercise_name] = []
    }
    setsByExercise[set.exercise_name].push(set)
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-primary-600" />
            Training Tracker
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tracke deine Sets, Gewichte und PRs
          </p>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })}
            </span>
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Heute
              </button>
            )}
          </div>

          <button
            onClick={goToNextDay}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Lade Daten...</div>
      ) : (
        <>
          {/* Session Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Session Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Name
                </label>
                <select
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Tag 1">Tag 1</option>
                  <option value="Tag 2">Tag 2</option>
                  <option value="Tag 3">Tag 3</option>
                  <option value="Tag 4">Tag 4</option>
                  <option value="Tag 5">Tag 5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Zeit
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Zeit
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={planFollowed}
                  onChange={(e) => setPlanFollowed(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-gray-900 dark:text-white">Plan vollständig befolgt</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={intensityDiscipline}
                  onChange={(e) => setIntensityDiscipline(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-gray-900 dark:text-white">Intensitätsdisziplin eingehalten (nur letzter Satz bis Muskelversagen)</span>
              </label>

              {!planFollowed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Abweichungsgrund
                  </label>
                  <textarea
                    value={deviationReason}
                    onChange={(e) => setDeviationReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="z.B. Übung besetzt, Schmerz, Zeitslot..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Notizen
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Optionale Notizen zur Session..."
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveSession}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Speichere...' : 'Session speichern'}
              </button>
            </div>
          </div>

          {/* Add Set Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-600" />
              Neuer Satz
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Übung
                </label>
                <input
                  type="text"
                  value={newSet.exercise_name}
                  onChange={(e) => setNewSet({ ...newSet, exercise_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="z.B. Bankdrücken"
                  list="exercise-suggestions"
                />
                <datalist id="exercise-suggestions">
                  {Object.keys(setsByExercise).map(ex => (
                    <option key={ex} value={ex} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Satz #
                </label>
                <input
                  type="number"
                  value={newSet.set_number}
                  onChange={(e) => setNewSet({ ...newSet, set_number: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gewicht [kg]
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newSet.weight_kg || ''}
                  onChange={(e) => setNewSet({ ...newSet, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reps
                </label>
                <input
                  type="number"
                  value={newSet.reps || ''}
                  onChange={(e) => setNewSet({ ...newSet, reps: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RPE (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newSet.rpe || ''}
                  onChange={(e) => setNewSet({ ...newSet, rpe: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kommentar (optional)
              </label>
              <input
                type="text"
                value={newSet.comment}
                onChange={(e) => setNewSet({ ...newSet, comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. leichte Schmerzen, gute Form..."
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddSet}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Satz hinzufügen
              </button>
            </div>
          </div>

          {/* Sets by Exercise */}
          {Object.keys(setsByExercise).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                Absolvierte Sätze
              </h2>

              <div className="space-y-6">
                {Object.entries(setsByExercise).map(([exercise, exerciseSets]) => (
                  <div key={exercise} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">{exercise}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <th className="pb-2 pr-4">Satz</th>
                            <th className="pb-2 pr-4">Gewicht</th>
                            <th className="pb-2 pr-4">Reps</th>
                            <th className="pb-2 pr-4">RPE</th>
                            <th className="pb-2 pr-4">Kommentar</th>
                            <th className="pb-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {exerciseSets.map((set) => (
                            <tr key={set.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                              <td className="py-2 pr-4 text-gray-900 dark:text-white">#{set.set_number}</td>
                              <td className="py-2 pr-4 text-gray-900 dark:text-white">{set.weight_kg} kg</td>
                              <td className="py-2 pr-4 text-gray-900 dark:text-white">{set.reps}</td>
                              <td className="py-2 pr-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  set.rpe && set.rpe >= 9 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  set.rpe && set.rpe >= 7 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {set.rpe || '-'}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">
                                {set.is_pr && (
                                  <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold mr-2">
                                    <Award className="w-4 h-4" />
                                    PR!
                                  </span>
                                )}
                                {set.comment}
                              </td>
                              <td className="py-2">
                                <button
                                  onClick={() => handleDeleteSet(set.id!)}
                                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
