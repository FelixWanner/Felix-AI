import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import FitnessHabitTracker from '../components/FitnessHabitTracker'
import SupplementChecklist from '../components/SupplementChecklist'
import {
  Dumbbell,
  Heart,
  Apple,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  TrendingUp,
  Moon,
  Battery
} from 'lucide-react'

interface BodyTracking {
  id?: string
  user_id: string
  date: string
  weight_kg: number | null
  waist_cm: number | null
  blood_pressure_sys: number | null
  blood_pressure_dia: number | null
  resting_heart_rate: number | null
  sleep_score: number | null
  body_battery: number | null
  notes: string
}

interface NutritionCompliance {
  id?: string
  user_id: string
  date: string
  plan_followed: boolean
  deviation_reason: string
  deviation_category: string
  meal_replaced: string
  water_liters: number | null
  salt_sufficient: boolean
  ingredients_weighed: boolean
  post_workout_part1_correct: boolean
  post_workout_part2_correct: boolean
}

interface CardioSession {
  id?: string
  user_id: string
  date: string
  cardio_type: string
  duration_minutes: number | null
  avg_heart_rate: number | null
  hr_range_low: number | null
  hr_range_high: number | null
  cardio_before_strength: boolean
  notes: string
}

export default function Fitness() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Body Tracking State
  const [weightKg, setWeightKg] = useState<number | null>(null)
  const [waistCm, setWaistCm] = useState<number | null>(null)
  const [bpSys, setBpSys] = useState<number | null>(null)
  const [bpDia, setBpDia] = useState<number | null>(null)
  const [restingHr, setRestingHr] = useState<number | null>(null)
  const [sleepScore, setSleepScore] = useState<number | null>(null)
  const [bodyBattery, setBodyBattery] = useState<number | null>(null)
  const [bodyNotes, setBodyNotes] = useState('')

  // Nutrition Compliance State
  const [planFollowed, setPlanFollowed] = useState(true)
  const [deviationReason, setDeviationReason] = useState('')
  const [deviationCategory, setDeviationCategory] = useState('')
  const [mealReplaced, setMealReplaced] = useState('')
  const [waterLiters, setWaterLiters] = useState<number | null>(null)
  const [saltSufficient, setSaltSufficient] = useState(true)
  const [ingredientsWeighed, setIngredientsWeighed] = useState(true)
  const [postWorkoutPart1, setPostWorkoutPart1] = useState(true)
  const [postWorkoutPart2, setPostWorkoutPart2] = useState(true)

  // Cardio State
  const [hasCardio, setHasCardio] = useState(false)
  const [cardioType, setCardioType] = useState('nüchtern')
  const [cardioDuration, setCardioDuration] = useState<number | null>(null)
  const [avgHeartRate, setAvgHeartRate] = useState<number | null>(null)
  const [hrRangeLow, setHrRangeLow] = useState<number | null>(120)
  const [hrRangeHigh, setHrRangeHigh] = useState<number | null>(140)
  const [cardioNotes, setCardioNotes] = useState('')

  const dateStr = format(currentDate, 'yyyy-MM-dd')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, currentDate])

  // Realtime subscription for cross-device sync
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('fitness-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'body_tracking',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Only reload if the change is for the current date
          if (payload.new && (payload.new as any).date === dateStr) {
            loadData()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, dateStr])

  async function loadData() {
    if (!user) return
    setLoading(true)

    try {
      // Load Body Tracking
      const { data: bodyData } = await supabase
        .from('body_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single()

      if (bodyData) {
        setWeightKg(bodyData.weight_kg)
        setWaistCm(bodyData.waist_cm)
        setBpSys(bodyData.blood_pressure_sys)
        setBpDia(bodyData.blood_pressure_dia)
        setRestingHr(bodyData.resting_heart_rate)
        setSleepScore(bodyData.sleep_score)
        setBodyBattery(bodyData.body_battery)
        setBodyNotes(bodyData.notes || '')
      }

      // Load Nutrition Compliance
      const { data: nutritionData } = await supabase
        .from('nutrition_compliance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single()

      if (nutritionData) {
        setPlanFollowed(nutritionData.plan_followed)
        setDeviationReason(nutritionData.deviation_reason || '')
        setDeviationCategory(nutritionData.deviation_category || '')
        setMealReplaced(nutritionData.meal_replaced || '')
        setWaterLiters(nutritionData.water_liters)
        setSaltSufficient(nutritionData.salt_sufficient ?? true)
        setIngredientsWeighed(nutritionData.ingredients_weighed ?? true)
        setPostWorkoutPart1(nutritionData.post_workout_part1_correct ?? true)
        setPostWorkoutPart2(nutritionData.post_workout_part2_correct ?? true)
      }

      // Load Cardio Session
      const { data: cardioData } = await supabase
        .from('cardio_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single()

      if (cardioData) {
        setHasCardio(true)
        setCardioType(cardioData.cardio_type || 'nüchtern')
        setCardioDuration(cardioData.duration_minutes)
        setAvgHeartRate(cardioData.avg_heart_rate)
        setHrRangeLow(cardioData.hr_range_low)
        setHrRangeHigh(cardioData.hr_range_high)
        setCardioNotes(cardioData.notes || '')
      } else {
        setHasCardio(false)
      }

      // Load Supplement Compliance
      const { data: suppCompData } = await supabase
        .from('supplement_compliance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)

      const complianceMap: Record<string, boolean> = {}
      if (suppCompData) {
        suppCompData.forEach(item => {
          complianceMap[item.slot_name] = item.taken
        })
      }
      setSupplementCompliance(complianceMap)

    } catch (error) {
      console.error('Error loading fitness data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)

    try {
      // Save Body Tracking - only include non-null values to avoid overwriting
      const bodyData: Partial<BodyTracking> = {
        user_id: user.id,
        date: dateStr,
      }
      // Only add fields that have actual values
      if (weightKg !== null) bodyData.weight_kg = weightKg
      if (waistCm !== null) bodyData.waist_cm = waistCm
      if (bpSys !== null) bodyData.blood_pressure_sys = bpSys
      if (bpDia !== null) bodyData.blood_pressure_dia = bpDia
      if (restingHr !== null) bodyData.resting_heart_rate = restingHr
      if (sleepScore !== null) bodyData.sleep_score = sleepScore
      if (bodyBattery !== null) bodyData.body_battery = bodyBattery
      if (bodyNotes) bodyData.notes = bodyNotes

      // Check if record exists
      const { data: existing } = await supabase
        .from('body_tracking')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single()

      if (existing) {
        // Update only the fields we have
        await supabase
          .from('body_tracking')
          .update(bodyData)
          .eq('id', existing.id)
      } else {
        // Insert new record
        await supabase
          .from('body_tracking')
          .insert(bodyData as BodyTracking)
      }

      // Save Nutrition Compliance
      const nutritionData: NutritionCompliance = {
        user_id: user.id,
        date: dateStr,
        plan_followed: planFollowed,
        deviation_reason: deviationReason,
        deviation_category: deviationCategory,
        meal_replaced: mealReplaced,
        water_liters: waterLiters,
        salt_sufficient: saltSufficient,
        ingredients_weighed: ingredientsWeighed,
        post_workout_part1_correct: postWorkoutPart1,
        post_workout_part2_correct: postWorkoutPart2
      }

      await supabase
        .from('nutrition_compliance')
        .upsert(nutritionData, { onConflict: 'user_id,date' })

      // Save or Delete Cardio Session
      if (hasCardio) {
        const cardioData: CardioSession = {
          user_id: user.id,
          date: dateStr,
          cardio_type: cardioType,
          duration_minutes: cardioDuration,
          avg_heart_rate: avgHeartRate,
          hr_range_low: hrRangeLow,
          hr_range_high: hrRangeHigh,
          cardio_before_strength: false,
          notes: cardioNotes
        }

        await supabase
          .from('cardio_sessions')
          .upsert(cardioData, { onConflict: 'user_id,date' })
      } else {
        // Delete cardio session if hasCardio is false
        await supabase
          .from('cardio_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('date', dateStr)
      }

      alert('Daten erfolgreich gespeichert!')
    } catch (error) {
      console.error('Error saving fitness data:', error)
      alert('Fehler beim Speichern der Daten')
    } finally {
      setSaving(false)
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-8 h-8 text-primary-600" />
            Fitness Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Maximale Plan-Compliance mit minimaler Erfassungszeit
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

      {/* Monday Reminder */}
      {currentDate.getDay() === 1 && !weightKg && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                Montags-Pflicht: Körper-Tracking
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Jeden Montag ist das vollständige Körper-Tracking verpflichtend. Bitte erfasse mindestens dein Gewicht (nüchtern).
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Lade Daten...</div>
      ) : (
        <>
          {/* Body Tracking */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Körper-Tracking
              {currentDate.getDay() === 1 && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Montags-Pflicht
                </span>
              )}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gewicht (nüchtern) [kg]
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg || ''}
                  onChange={(e) => setWeightKg(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="75.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taillenumfang [cm]
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={waistCm || ''}
                  onChange={(e) => setWaistCm(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="85.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ruhepuls [bpm]
                </label>
                <input
                  type="number"
                  value={restingHr || ''}
                  onChange={(e) => setRestingHr(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Blutdruck SYS [mmHg]
                </label>
                <input
                  type="number"
                  value={bpSys || ''}
                  onChange={(e) => setBpSys(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Blutdruck DIA [mmHg]
                </label>
                <input
                  type="number"
                  value={bpDia || ''}
                  onChange={(e) => setBpDia(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="80"
                />
              </div>
            </div>

            {/* Recovery Metrics - Pflichtfelder */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                Recovery-Metriken
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  Pflicht
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sleep Score (0-100)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={sleepScore || ''}
                      onChange={(e) => setSleepScore(e.target.value ? parseInt(e.target.value) : null)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        sleepScore === null
                          ? 'border-red-300 dark:border-red-600'
                          : sleepScore >= 80
                          ? 'border-green-500 dark:border-green-600'
                          : sleepScore >= 60
                          ? 'border-yellow-500 dark:border-yellow-600'
                          : 'border-red-500 dark:border-red-600'
                      }`}
                      placeholder="85"
                    />
                    {sleepScore !== null && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${
                        sleepScore >= 80 ? 'text-green-600' : sleepScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {sleepScore >= 80 ? 'Gut' : sleepScore >= 60 ? 'OK' : 'Niedrig'}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Body Battery (0-100)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={bodyBattery || ''}
                      onChange={(e) => setBodyBattery(e.target.value ? parseInt(e.target.value) : null)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        bodyBattery === null
                          ? 'border-red-300 dark:border-red-600'
                          : bodyBattery >= 70
                          ? 'border-green-500 dark:border-green-600'
                          : bodyBattery >= 40
                          ? 'border-yellow-500 dark:border-yellow-600'
                          : 'border-red-500 dark:border-red-600'
                      }`}
                      placeholder="75"
                    />
                    {bodyBattery !== null && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${
                        bodyBattery >= 70 ? 'text-green-600' : bodyBattery >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {bodyBattery >= 70 ? 'Voll' : bodyBattery >= 40 ? 'Mittel' : 'Niedrig'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notizen
              </label>
              <textarea
                value={bodyNotes}
                onChange={(e) => setBodyNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Optionale Notizen..."
              />
            </div>
          </div>

          {/* Nutrition Compliance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Apple className="w-5 h-5 text-green-600" />
              Ernährungs-Compliance
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={planFollowed}
                    onChange={(e) => setPlanFollowed(e.target.checked)}
                    className="w-5 h-5 text-primary-600 rounded"
                  />
                  <span className="text-gray-900 dark:text-white font-medium">Plan vollständig befolgt</span>
                </label>
              </div>

              {!planFollowed && (
                <div className="pl-7 space-y-3 border-l-2 border-orange-400">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Abweichungsgrund
                    </label>
                    <textarea
                      value={deviationReason}
                      onChange={(e) => setDeviationReason(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Was ist passiert?"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Kategorie
                      </label>
                      <select
                        value={deviationCategory}
                        onChange={(e) => setDeviationCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Auswählen...</option>
                        <option value="geschaeftsessen">Geschäftsessen</option>
                        <option value="reise">Reise</option>
                        <option value="krankheit">Krankheit</option>
                        <option value="sonstiges">Sonstiges</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Welche Mahlzeit?
                      </label>
                      <input
                        type="text"
                        value={mealReplaced}
                        onChange={(e) => setMealReplaced(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="z.B. Mahlzeit 2"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wasser [Liter] (Ziel: 4L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={waterLiters || ''}
                    onChange={(e) => setWaterLiters(e.target.value ? parseFloat(e.target.value) : null)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      waterLiters && waterLiters >= 4
                        ? 'border-green-500 dark:border-green-600'
                        : waterLiters && waterLiters < 4
                        ? 'border-orange-500 dark:border-orange-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="4.0"
                  />
                </div>

                <label className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={saltSufficient}
                    onChange={(e) => setSaltSufficient(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Salz ausreichend</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ingredientsWeighed}
                    onChange={(e) => setIngredientsWeighed(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Zutaten abgewogen</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={postWorkoutPart1}
                    onChange={(e) => setPostWorkoutPart1(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Post-Workout Teil 1 korrekt</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={postWorkoutPart2}
                    onChange={(e) => setPostWorkoutPart2(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Post-Workout Teil 2 korrekt</span>
                </label>
              </div>
            </div>
          </div>

          {/* Cardio */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Cardio
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasCardio}
                  onChange={(e) => setHasCardio(e.target.checked)}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <span className="text-gray-900 dark:text-white font-medium">Cardio durchgeführt</span>
              </label>

              {hasCardio && (
                <div className="pl-7 space-y-3 border-l-2 border-red-400">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Typ
                      </label>
                      <select
                        value={cardioType}
                        onChange={(e) => setCardioType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="nüchtern">Nüchtern</option>
                        <option value="post_workout">Post-Workout</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dauer [Min]
                      </label>
                      <input
                        type="number"
                        value={cardioDuration || ''}
                        onChange={(e) => setCardioDuration(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Durchschn. HF [bpm]
                      </label>
                      <input
                        type="number"
                        value={avgHeartRate || ''}
                        onChange={(e) => setAvgHeartRate(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="130"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        HF min [bpm]
                      </label>
                      <input
                        type="number"
                        value={hrRangeLow || ''}
                        onChange={(e) => setHrRangeLow(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="120"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        HF max [bpm]
                      </label>
                      <input
                        type="number"
                        value={hrRangeHigh || ''}
                        onChange={(e) => setHrRangeHigh(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="140"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notizen
                    </label>
                    <textarea
                      value={cardioNotes}
                      onChange={(e) => setCardioNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="z.B. Stepper, Laufband, etc."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supplements - Detaillierte Checkliste */}
          <SupplementChecklist date={currentDate} />

          {/* Habit Tracking */}
          <FitnessHabitTracker date={currentDate} />

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Speichere...' : 'Daten speichern'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
