import { useState, useEffect } from 'react'
import { format, subWeeks, startOfWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Droplet,
  Heart,
  Dumbbell
} from 'lucide-react'

interface WeeklyBodyStats {
  week_start: string
  avg_weight_kg: number | null
  min_weight_kg: number | null
  max_weight_kg: number | null
  avg_waist_cm: number | null
  avg_bp_sys: number | null
  avg_bp_dia: number | null
  avg_resting_hr: number | null
  data_points: number
}

interface WeeklyNutritionStats {
  week_start: string
  total_days: number
  compliant_days: number
  compliance_percent: number
  avg_water_liters: number | null
}

interface WeeklyTrainingStats {
  week_start: string
  total_sessions: number
  total_sets: number
  total_volume: number | null
  avg_rpe: number | null
  total_prs: number
}

export default function FitnessStats() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [weeks, setWeeks] = useState(8) // Show last 8 weeks

  const [bodyStats, setBodyStats] = useState<WeeklyBodyStats[]>([])
  const [nutritionStats, setNutritionStats] = useState<WeeklyNutritionStats[]>([])
  const [trainingStats, setTrainingStats] = useState<WeeklyTrainingStats[]>([])

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user, weeks])

  async function loadStats() {
    if (!user) return
    setLoading(true)

    try {
      const startDate = format(subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weeks), 'yyyy-MM-dd')

      // Load body tracking stats
      const { data: bodyData } = await supabase
        .from('body_tracking_weekly_stats')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_start', startDate)
        .order('week_start', { ascending: false })

      setBodyStats(bodyData || [])

      // Load nutrition stats
      const { data: nutritionData } = await supabase
        .from('nutrition_compliance_weekly_stats')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_start', startDate)
        .order('week_start', { ascending: false })

      setNutritionStats(nutritionData || [])

      // Load training stats
      const { data: trainingData } = await supabase
        .from('training_volume_weekly_stats')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_start', startDate)
        .order('week_start', { ascending: false })

      setTrainingStats(trainingData || [])
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  function getTrendIcon(current: number | null, previous: number | null, higherIsBetter: boolean = true) {
    if (!current || !previous) return null
    const increased = current > previous
    const color = increased === higherIsBetter ? 'text-green-600' : 'text-red-600'
    return increased ? (
      <TrendingUp className={`w-4 h-4 ${color}`} />
    ) : (
      <TrendingDown className={`w-4 h-4 ${color}`} />
    )
  }

  function getTrendValue(current: number | null, previous: number | null): string {
    if (!current || !previous) return '-'
    const diff = current - previous
    const sign = diff >= 0 ? '+' : ''
    return `${sign}${diff.toFixed(1)}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary-600" />
          Fitness Statistiken & Trends
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Deine Entwicklung über die letzten {weeks} Wochen
        </p>
      </div>

      {/* Week Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setWeeks(4)}
          className={`px-4 py-2 rounded-lg ${
            weeks === 4
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          4 Wochen
        </button>
        <button
          onClick={() => setWeeks(8)}
          className={`px-4 py-2 rounded-lg ${
            weeks === 8
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          8 Wochen
        </button>
        <button
          onClick={() => setWeeks(12)}
          className={`px-4 py-2 rounded-lg ${
            weeks === 12
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          12 Wochen
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Lade Statistiken...</div>
      ) : (
        <>
          {/* Body Tracking Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Körper-Tracking Trends
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pr-4">Woche</th>
                    <th className="pb-2 pr-4">Gewicht Ø</th>
                    <th className="pb-2 pr-4">Trend</th>
                    <th className="pb-2 pr-4">Taillenumfang Ø</th>
                    <th className="pb-2 pr-4">Ruhepuls Ø</th>
                    <th className="pb-2 pr-4">Blutdruck Ø</th>
                    <th className="pb-2 pr-4">Messungen</th>
                  </tr>
                </thead>
                <tbody>
                  {bodyStats.map((week, index) => {
                    const prevWeek = bodyStats[index + 1]
                    return (
                      <tr key={week.week_start} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">
                          KW {format(new Date(week.week_start), 'w', { locale: de })}
                        </td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                          {week.avg_weight_kg ? `${week.avg_weight_kg.toFixed(1)} kg` : '-'}
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-1">
                            {getTrendIcon(week.avg_weight_kg, prevWeek?.avg_weight_kg, false)}
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {getTrendValue(week.avg_weight_kg, prevWeek?.avg_weight_kg)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                          {week.avg_waist_cm ? `${week.avg_waist_cm.toFixed(1)} cm` : '-'}
                        </td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                          {week.avg_resting_hr ? `${Math.round(week.avg_resting_hr)} bpm` : '-'}
                        </td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                          {week.avg_bp_sys && week.avg_bp_dia
                            ? `${Math.round(week.avg_bp_sys)}/${Math.round(week.avg_bp_dia)}`
                            : '-'}
                        </td>
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">
                          {week.data_points}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {bodyStats.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Noch keine Daten vorhanden. Starte mit dem täglichen Tracking!
              </div>
            )}
          </div>

          {/* Nutrition Compliance Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-green-600" />
              Ernährungs-Compliance & Wasser
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pr-4">Woche</th>
                    <th className="pb-2 pr-4">Compliance</th>
                    <th className="pb-2 pr-4">Tage nach Plan</th>
                    <th className="pb-2 pr-4">Wasser Ø (Ziel: 4L)</th>
                    <th className="pb-2 pr-4">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {nutritionStats.map((week, index) => {
                    const prevWeek = nutritionStats[index + 1]
                    return (
                      <tr key={week.week_start} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">
                          KW {format(new Date(week.week_start), 'w', { locale: de })}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              week.compliance_percent >= 90
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : week.compliance_percent >= 70
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {week.compliance_percent.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                          {week.compliant_days}/{week.total_days}
                        </td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                          {week.avg_water_liters ? (
                            <span
                              className={
                                week.avg_water_liters >= 4
                                  ? 'text-green-600 dark:text-green-400 font-medium'
                                  : 'text-gray-900 dark:text-white'
                              }
                            >
                              {week.avg_water_liters.toFixed(1)}L
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-1">
                            {getTrendIcon(week.compliance_percent, prevWeek?.compliance_percent)}
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {getTrendValue(week.compliance_percent, prevWeek?.compliance_percent)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {nutritionStats.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Noch keine Ernährungs-Daten vorhanden.
              </div>
            )}
          </div>

          {/* Training Volume Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-purple-600" />
              Training Volume & Intensität
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pr-4">Woche</th>
                    <th className="pb-2 pr-4">Einheiten</th>
                    <th className="pb-2 pr-4">Sätze</th>
                    <th className="pb-2 pr-4">Volumen (kg)</th>
                    <th className="pb-2 pr-4">RPE Ø</th>
                    <th className="pb-2 pr-4">PRs</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingStats.map((week, index) => {
                    const prevWeek = trainingStats[index + 1]
                    return (
                      <tr key={week.week_start} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">
                          KW {format(new Date(week.week_start), 'w', { locale: de })}
                        </td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                          {week.total_sessions}
                        </td>
                        <td className="py-2 pr-4 text-gray-900 dark:text-white">
                          {week.total_sets}
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-900 dark:text-white">
                              {week.total_volume ? Math.round(week.total_volume).toLocaleString() : '-'}
                            </span>
                            {getTrendIcon(week.total_volume, prevWeek?.total_volume)}
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              week.avg_rpe && week.avg_rpe >= 9
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : week.avg_rpe && week.avg_rpe >= 7
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}
                          >
                            {week.avg_rpe ? week.avg_rpe.toFixed(1) : '-'}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {week.total_prs > 0 && (
                            <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold">
                              <Heart className="w-4 h-4" />
                              {week.total_prs}
                            </span>
                          )}
                          {week.total_prs === 0 && <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {trainingStats.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Noch keine Training-Daten vorhanden.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
