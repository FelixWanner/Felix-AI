import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface WeeklyData {
  week_start: string
  week_end: string
  avg_weight_kg: number | null
  weight_change_kg: number | null
  training_sessions_completed: number
  cardio_sessions_completed: number
  nutrition_compliance_percent: number | null
  supplement_compliance_percent: number | null
  deviations: Array<{ date: string; reason: string; category: string }>
  wellbeing_avg: number | null
  stress_avg: number | null
  sleep_avg: number | null
}

export default function WeeklyUpdate() {
  const { user } = useAuth()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null)
  const [copied, setCopied] = useState(false)
  const [additionalNotes, setAdditionalNotes] = useState('')

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }) // Sunday

  useEffect(() => {
    if (user) {
      loadWeeklyData()
    }
  }, [user, currentWeek])

  async function loadWeeklyData() {
    if (!user) return
    setLoading(true)

    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd')
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

      // Get body tracking data for average weight
      const { data: bodyData } = await supabase
        .from('body_tracking')
        .select('weight_kg')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)
        .not('weight_kg', 'is', null)

      const avgWeight = bodyData && bodyData.length > 0
        ? bodyData.reduce((sum, d) => sum + (d.weight_kg || 0), 0) / bodyData.length
        : null

      // Get previous week's average for comparison
      const prevWeekStart = format(subWeeks(weekStart, 1), 'yyyy-MM-dd')
      const prevWeekEnd = format(subWeeks(weekEnd, 1), 'yyyy-MM-dd')

      const { data: prevBodyData } = await supabase
        .from('body_tracking')
        .select('weight_kg')
        .eq('user_id', user.id)
        .gte('date', prevWeekStart)
        .lte('date', prevWeekEnd)
        .not('weight_kg', 'is', null)

      const prevAvgWeight = prevBodyData && prevBodyData.length > 0
        ? prevBodyData.reduce((sum, d) => sum + (d.weight_kg || 0), 0) / prevBodyData.length
        : null

      const weightChange = avgWeight && prevAvgWeight ? avgWeight - prevAvgWeight : null

      // Get training sessions
      const { data: trainingData } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)

      const trainingSessions = trainingData?.length || 0

      // Get cardio sessions
      const { data: cardioData } = await supabase
        .from('cardio_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)

      const cardioSessions = cardioData?.length || 0

      // Get nutrition compliance
      const { data: nutritionData } = await supabase
        .from('nutrition_compliance')
        .select('plan_followed, deviation_reason, deviation_category, date')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)

      const nutritionCompliance = nutritionData && nutritionData.length > 0
        ? (nutritionData.filter(d => d.plan_followed).length / nutritionData.length) * 100
        : null

      const deviations = nutritionData
        ?.filter(d => !d.plan_followed && d.deviation_reason)
        .map(d => ({
          date: d.date,
          reason: d.deviation_reason || '',
          category: d.deviation_category || ''
        })) || []

      // Get supplement compliance
      const { data: supplementData } = await supabase
        .from('supplement_compliance')
        .select('taken')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)

      const supplementCompliance = supplementData && supplementData.length > 0
        ? (supplementData.filter(d => d.taken).length / supplementData.length) * 100
        : null

      // Get daily logs for wellbeing/stress/sleep
      const { data: dailyLogsData } = await supabase
        .from('daily_logs')
        .select('mood, stress_level, sleep_duration')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr)

      const wellbeingAvg = dailyLogsData && dailyLogsData.length > 0
        ? dailyLogsData.reduce((sum, d) => sum + (d.mood || 0), 0) / dailyLogsData.length
        : null

      const stressAvg = dailyLogsData && dailyLogsData.length > 0
        ? dailyLogsData.reduce((sum, d) => sum + (d.stress_level || 0), 0) / dailyLogsData.length
        : null

      const sleepAvg = dailyLogsData && dailyLogsData.length > 0
        ? dailyLogsData.reduce((sum, d) => sum + (d.sleep_duration || 0), 0) / dailyLogsData.length
        : null

      setWeeklyData({
        week_start: weekStartStr,
        week_end: weekEndStr,
        avg_weight_kg: avgWeight,
        weight_change_kg: weightChange,
        training_sessions_completed: trainingSessions,
        cardio_sessions_completed: cardioSessions,
        nutrition_compliance_percent: nutritionCompliance,
        supplement_compliance_percent: supplementCompliance,
        deviations,
        wellbeing_avg: wellbeingAvg,
        stress_avg: stressAvg,
        sleep_avg: sleepAvg
      })
    } catch (error) {
      console.error('Error loading weekly data:', error)
    } finally {
      setLoading(false)
    }
  }

  function generateWhatsAppText(): string {
    if (!weeklyData) return ''

    const weekNumber = format(weekStart, 'w', { locale: de })
    const year = format(weekStart, 'yyyy')

    let text = `=== WEEKLY UPDATE ===\n`
    text += `Woche: KW ${weekNumber} ${year}\n\n`

    text += `📊 Gewicht:\n`
    if (weeklyData.avg_weight_kg) {
      text += `- Durchschnitt: ${weeklyData.avg_weight_kg.toFixed(1)} kg\n`
    } else {
      text += `- Durchschnitt: Keine Daten\n`
    }
    if (weeklyData.weight_change_kg !== null) {
      const sign = weeklyData.weight_change_kg >= 0 ? '+' : ''
      text += `- Veränderung: ${sign}${weeklyData.weight_change_kg.toFixed(1)} kg\n`
    }
    text += `\n`

    text += `✅ Compliance:\n`
    if (weeklyData.nutrition_compliance_percent !== null) {
      const nutritionDays = Math.round((weeklyData.nutrition_compliance_percent / 100) * 7)
      text += `- Ernährung: ${weeklyData.nutrition_compliance_percent.toFixed(0)}% (${nutritionDays}/7 Tage)\n`
    } else {
      text += `- Ernährung: Keine Daten\n`
    }
    text += `- Training: ${weeklyData.training_sessions_completed} Einheiten\n`
    text += `- Cardio: ${weeklyData.cardio_sessions_completed} Einheiten\n`
    if (weeklyData.supplement_compliance_percent !== null) {
      text += `- Supplements: ${weeklyData.supplement_compliance_percent.toFixed(0)}%\n`
    }
    text += `\n`

    if (weeklyData.deviations.length > 0) {
      text += `⚠️ Abweichungen:\n`
      weeklyData.deviations.forEach(dev => {
        const dateFormatted = format(new Date(dev.date), 'dd.MM.', { locale: de })
        text += `- ${dateFormatted}: ${dev.reason}\n`
      })
      text += `\n`
    }

    text += `💪 Recovery:\n`
    if (weeklyData.sleep_avg !== null) {
      text += `- Schlaf: ${weeklyData.sleep_avg.toFixed(1)} Std (Ø)\n`
    }
    if (weeklyData.stress_avg !== null) {
      text += `- Stress: ${weeklyData.stress_avg.toFixed(1)}/5\n`
    }
    if (weeklyData.wellbeing_avg !== null) {
      text += `- Wohlbefinden: ${weeklyData.wellbeing_avg.toFixed(1)}/5\n`
    }

    if (additionalNotes) {
      text += `\n📝 Bemerkungen:\n${additionalNotes}\n`
    }

    return text
  }

  async function handleCopyToClipboard() {
    const text = generateWhatsAppText()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      alert('Fehler beim Kopieren in die Zwischenablage')
    }
  }

  function handleDownloadText() {
    const text = generateWhatsAppText()
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weekly-update-kw${format(weekStart, 'w')}-${format(weekStart, 'yyyy')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function goToPreviousWeek() {
    setCurrentWeek(subWeeks(currentWeek, 1))
  }

  function goToNextWeek() {
    setCurrentWeek(addWeeks(currentWeek, 1))
  }

  function goToCurrentWeek() {
    setCurrentWeek(new Date())
  }

  const isCurrentWeek = format(weekStart, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-8 h-8 text-primary-600" />
          Weekly Update Generator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Automatische Zusammenfassung für deinen Coach
        </p>
      </div>

      {/* Week Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              KW {format(weekStart, 'w', { locale: de })} - {format(weekStart, 'dd.MM.', { locale: de })} bis {format(weekEnd, 'dd.MM.yyyy', { locale: de })}
            </span>
            {!isCurrentWeek && (
              <button
                onClick={goToCurrentWeek}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Aktuelle Woche
              </button>
            )}
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Lade Daten...</div>
      ) : weeklyData ? (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weight Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gewicht</div>
              {weeklyData.avg_weight_kg ? (
                <>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {weeklyData.avg_weight_kg.toFixed(1)} kg
                  </div>
                  {weeklyData.weight_change_kg !== null && (
                    <div className={`flex items-center gap-1 text-sm mt-1 ${
                      weeklyData.weight_change_kg > 0 ? 'text-green-600' :
                      weeklyData.weight_change_kg < 0 ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {weeklyData.weight_change_kg > 0 ? <TrendingUp className="w-4 h-4" /> :
                       weeklyData.weight_change_kg < 0 ? <TrendingDown className="w-4 h-4" /> :
                       <Minus className="w-4 h-4" />}
                      {weeklyData.weight_change_kg >= 0 ? '+' : ''}{weeklyData.weight_change_kg.toFixed(1)} kg
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 dark:text-gray-500">Keine Daten</div>
              )}
            </div>

            {/* Training Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Training & Cardio</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {weeklyData.training_sessions_completed + weeklyData.cardio_sessions_completed} Einheiten
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {weeklyData.training_sessions_completed} Training, {weeklyData.cardio_sessions_completed} Cardio
              </div>
            </div>

            {/* Compliance Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ernährung</div>
              {weeklyData.nutrition_compliance_percent !== null ? (
                <>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {weeklyData.nutrition_compliance_percent.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {Math.round((weeklyData.nutrition_compliance_percent / 100) * 7)}/7 Tage plan-konform
                  </div>
                </>
              ) : (
                <div className="text-gray-400 dark:text-gray-500">Keine Daten</div>
              )}
            </div>
          </div>

          {/* Deviations */}
          {weeklyData.deviations.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-4">
              <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">Abweichungen</h3>
              <ul className="space-y-1">
                {weeklyData.deviations.map((dev, idx) => (
                  <li key={idx} className="text-sm text-orange-800 dark:text-orange-300">
                    <span className="font-medium">{format(new Date(dev.date), 'dd.MM.', { locale: de })}:</span> {dev.reason}
                    {dev.category && <span className="text-orange-600 dark:text-orange-400 ml-2">({dev.category})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recovery Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recovery Metriken</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Schlaf (Ø)</div>
                {weeklyData.sleep_avg !== null ? (
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {weeklyData.sleep_avg.toFixed(1)} Std
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500">-</div>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Stress (Ø)</div>
                {weeklyData.stress_avg !== null ? (
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {weeklyData.stress_avg.toFixed(1)}/5
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500">-</div>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Wohlbefinden (Ø)</div>
                {weeklyData.wellbeing_avg !== null ? (
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {weeklyData.wellbeing_avg.toFixed(1)}/5
                  </div>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500">-</div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Zusätzliche Bemerkungen</h3>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Optionale zusätzliche Bemerkungen für den Coach..."
            />
          </div>

          {/* WhatsApp Export Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">WhatsApp Export Vorschau</h3>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono border border-gray-200 dark:border-gray-700">
              {generateWhatsAppText()}
            </pre>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCopyToClipboard}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    In Zwischenablage kopieren
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadText}
                className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 font-medium"
              >
                <Download className="w-5 h-5" />
                Als .txt speichern
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Keine Daten für diese Woche</div>
      )}
    </div>
  )
}
