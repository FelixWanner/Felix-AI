import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  Pill,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Sunrise,
  Coffee,
  Dumbbell,
  Zap,
  Trophy,
  Utensils,
  Moon,
  Bed
} from 'lucide-react'

// Dein vollständiges Supplement-Protokoll
const SUPPLEMENT_PROTOCOL = [
  {
    slot_name: 'nuechtern',
    display_name: 'Morgens nüchtern',
    icon: Sunrise,
    color: 'yellow',
    supplements: [
      { name: 'Athlete Stack Men', dosage: '5 Scoops Powder', optional: false },
      { name: 'Glutamin', dosage: '10-20g', optional: false },
      { name: 'Vitamin C Drink', dosage: '1 Messlöffel', optional: false }
    ]
  },
  {
    slot_name: 'mahlzeit_1',
    display_name: 'Zur 1. Mahlzeit',
    icon: Coffee,
    color: 'orange',
    supplements: [
      { name: 'Vitamin D3 K2', dosage: '1 Kapsel', optional: false },
      { name: 'Curcumin', dosage: '1 Kapsel', optional: false },
      { name: 'Q10+', dosage: '1 Kapsel', optional: false },
      { name: 'Kreatin', dosage: '8 Gramm', optional: false },
      { name: 'Digestive Enzyme+', dosage: '1 Kapsel', optional: false }
    ]
  },
  {
    slot_name: 'pre_workout',
    display_name: 'Pre-Workout',
    icon: Zap,
    color: 'red',
    supplements: [
      { name: 'Crank', dosage: '1 Portion', optional: false }
    ]
  },
  {
    slot_name: 'intra_workout',
    display_name: 'Intra-Workout',
    icon: Dumbbell,
    color: 'purple',
    supplements: [
      { name: 'Elite Aminos', dosage: '2 Scoops', optional: false }
    ]
  },
  {
    slot_name: 'post_workout',
    display_name: 'Post-Training',
    icon: Trophy,
    color: 'green',
    supplements: [
      { name: 'Designer-Whey / Clear-Whey', dosage: '1 Portion', optional: false }
    ]
  },
  {
    slot_name: 'nach_mahlzeiten',
    display_name: 'Nach den Mahlzeiten',
    icon: Utensils,
    color: 'blue',
    supplements: [
      { name: 'Digestive Enzyme+', dosage: '1 Kapsel', optional: true },
      { name: 'Magnesium Complex', dosage: '1 Kapsel', optional: false },
      { name: 'Collagen Peptides', dosage: '1 Portion', optional: true }
    ]
  },
  {
    slot_name: 'letzte_mahlzeit',
    display_name: 'Nach der letzten Mahlzeit',
    icon: Moon,
    color: 'indigo',
    supplements: [
      { name: 'Curcumin', dosage: '1 Kapsel', optional: false },
      { name: 'Omega 3', dosage: '6 Kapseln', optional: false },
      { name: 'Ashwa+', dosage: '1 Kapsel', optional: false },
      { name: 'Zink', dosage: '1/2 Tablette', optional: false },
      { name: 'Q10+', dosage: '1 Kapsel', optional: false },
      { name: 'Digestive Enzyme+', dosage: '1 Kapsel', optional: true }
    ]
  },
  {
    slot_name: 'vor_schlafen',
    display_name: 'Vor dem Schlafen',
    icon: Bed,
    color: 'slate',
    supplements: [
      { name: 'ESN Sleep', dosage: '4 Scoops', optional: false }
    ]
  }
]

interface SupplementLog {
  id?: string
  user_id: string
  date: string
  slot_name: string
  supplement_name: string
  taken: boolean
  notes: string | null
}

interface Props {
  date: Date
}

export default function SupplementChecklist({ date }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({})
  const [supplementLogs, setSupplementLogs] = useState<Record<string, SupplementLog>>({})
  const [slotNotes, setSlotNotes] = useState<Record<string, string>>({})
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>({})

  const dateStr = format(date, 'yyyy-MM-dd')

  useEffect(() => {
    if (user) {
      loadSupplementLogs()
    }
    // Alle Slots standardmäßig expandiert
    const expanded: Record<string, boolean> = {}
    SUPPLEMENT_PROTOCOL.forEach(slot => {
      expanded[slot.slot_name] = true
    })
    setExpandedSlots(expanded)
  }, [user, date])

  async function loadSupplementLogs() {
    if (!user) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('daily_supplement_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)

      if (error) {
        console.log('Error loading supplement data:', error.message)
        setLoading(false)
        return
      }

      const logsMap: Record<string, SupplementLog> = {}
      const notesMap: Record<string, string> = {}

      data?.forEach(log => {
        const key = `${log.slot_name}:${log.supplement_name}`
        logsMap[key] = log
        if (log.notes) {
          notesMap[log.slot_name] = log.notes
        }
      })

      setSupplementLogs(logsMap)
      setSlotNotes(notesMap)
    } catch (error) {
      console.error('Error loading supplement logs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleSupplement(slotName: string, supplementName: string) {
    if (!user) return

    const key = `${slotName}:${supplementName}`
    const currentLog = supplementLogs[key]
    const newTaken = !currentLog?.taken

    // Optimistic update
    setSupplementLogs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        user_id: user.id,
        date: dateStr,
        slot_name: slotName,
        supplement_name: supplementName,
        taken: newTaken,
        notes: slotNotes[slotName] || null
      }
    }))

    try {
      const { error } = await supabase
        .from('daily_supplement_tracking')
        .upsert({
          user_id: user.id,
          date: dateStr,
          slot_name: slotName,
          supplement_name: supplementName,
          taken: newTaken,
          notes: slotNotes[slotName] || null
        }, {
          onConflict: 'user_id,date,slot_name,supplement_name'
        })

      if (error) {
        console.error('Error saving supplement log:', error)
        // Revert on error
        loadSupplementLogs()
      }
    } catch (error) {
      console.error('Error toggling supplement:', error)
    }
  }

  async function markSlotComplete(slotName: string) {
    const slot = SUPPLEMENT_PROTOCOL.find(s => s.slot_name === slotName)
    if (!slot || !user) return

    setSaving(true)
    try {
      for (const supp of slot.supplements) {
        const key = `${slotName}:${supp.name}`
        if (!supplementLogs[key]?.taken) {
          await toggleSupplement(slotName, supp.name)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  async function saveSlotNotes(slotName: string) {
    if (!user) return

    const slot = SUPPLEMENT_PROTOCOL.find(s => s.slot_name === slotName)
    if (!slot) return

    try {
      // Speichere Notiz für alle Supplements in diesem Slot
      for (const supp of slot.supplements) {
        const key = `${slotName}:${supp.name}`
        const currentLog = supplementLogs[key]

        await supabase
          .from('daily_supplement_tracking')
          .upsert({
            user_id: user.id,
            date: dateStr,
            slot_name: slotName,
            supplement_name: supp.name,
            taken: currentLog?.taken ?? false,
            notes: slotNotes[slotName] || null
          }, {
            onConflict: 'user_id,date,slot_name,supplement_name'
          })
      }
    } catch (error) {
      console.error('Error saving notes:', error)
    }
  }

  function toggleSlotExpansion(slotName: string) {
    setExpandedSlots(prev => ({
      ...prev,
      [slotName]: !prev[slotName]
    }))
  }

  function getSlotProgress(slotName: string) {
    const slot = SUPPLEMENT_PROTOCOL.find(s => s.slot_name === slotName)
    if (!slot) return { completed: 0, total: 0, percent: 0 }

    const total = slot.supplements.filter(s => !s.optional).length
    const completed = slot.supplements.filter(s => {
      if (s.optional) return false
      const key = `${slotName}:${s.name}`
      return supplementLogs[key]?.taken
    }).length

    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  function getTotalProgress() {
    let completed = 0
    let total = 0

    SUPPLEMENT_PROTOCOL.forEach(slot => {
      slot.supplements.forEach(supp => {
        if (!supp.optional) {
          total++
          const key = `${slot.slot_name}:${supp.name}`
          if (supplementLogs[key]?.taken) completed++
        }
      })
    })

    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  const totalProgress = getTotalProgress()

  const colorClasses: Record<string, { bg: string, border: string, text: string, icon: string }> = {
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300', icon: 'text-yellow-600 dark:text-yellow-400' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', icon: 'text-orange-600 dark:text-orange-400' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-300', icon: 'text-red-600 dark:text-red-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', icon: 'text-purple-600 dark:text-purple-400' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', icon: 'text-green-600 dark:text-green-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-600 dark:text-blue-400' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300', icon: 'text-indigo-600 dark:text-indigo-400' },
    slate: { bg: 'bg-slate-50 dark:bg-slate-900/20', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', icon: 'text-slate-600 dark:text-slate-400' }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">Lade Supplements...</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header mit Gesamtfortschritt */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Pill className="w-5 h-5 text-primary-600" />
          Supplement-Checkliste
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {totalProgress.completed}/{totalProgress.total} erledigt
          </div>
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                totalProgress.percent === 100 ? 'bg-green-500' : 'bg-primary-600'
              }`}
              style={{ width: `${totalProgress.percent}%` }}
            />
          </div>
          <span className={`text-sm font-medium ${
            totalProgress.percent === 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'
          }`}>
            {totalProgress.percent}%
          </span>
        </div>
      </div>

      {/* Supplement Slots */}
      <div className="space-y-4">
        {SUPPLEMENT_PROTOCOL.map((slot) => {
          const progress = getSlotProgress(slot.slot_name)
          const colors = colorClasses[slot.color]
          const IconComponent = slot.icon
          const isExpanded = expandedSlots[slot.slot_name]
          const isComplete = progress.percent === 100

          return (
            <div
              key={slot.slot_name}
              className={`rounded-lg border ${colors.border} overflow-hidden`}
            >
              {/* Slot Header */}
              <div
                className={`${colors.bg} px-4 py-3 cursor-pointer`}
                onClick={() => toggleSlotExpansion(slot.slot_name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                    <span className={`font-medium ${colors.text}`}>
                      {slot.display_name}
                    </span>
                    {isComplete && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${colors.text}`}>
                      {progress.completed}/{progress.total}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Supplement Liste */}
              {isExpanded && (
                <div className="px-4 py-3 space-y-2 bg-white dark:bg-gray-800">
                  {slot.supplements.map((supp) => {
                    const key = `${slot.slot_name}:${supp.name}`
                    const isTaken = supplementLogs[key]?.taken ?? false

                    return (
                      <div
                        key={supp.name}
                        className="flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors"
                      >
                        <button
                          onClick={() => toggleSupplement(slot.slot_name, supp.name)}
                          className="flex-shrink-0"
                        >
                          {isTaken ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                          )}
                        </button>
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => toggleSupplement(slot.slot_name, supp.name)}
                        >
                          <div className={`font-medium ${
                            isTaken
                              ? 'text-green-600 dark:text-green-400 line-through'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {supp.name}
                            {supp.optional && (
                              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal">
                                (optional)
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {supp.dosage}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Schnell alle markieren + Notizen */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => markSlotComplete(slot.slot_name)}
                      disabled={saving || isComplete}
                      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        isComplete
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isComplete ? 'Alle erledigt ✓' : 'Alle abhaken'}
                    </button>

                    <button
                      onClick={() => setShowNotes(prev => ({ ...prev, [slot.slot_name]: !prev[slot.slot_name] }))}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <StickyNote className="w-4 h-4" />
                      Notiz
                    </button>
                  </div>

                  {/* Notiz-Feld */}
                  {showNotes[slot.slot_name] && (
                    <div className="pt-2">
                      <textarea
                        value={slotNotes[slot.slot_name] || ''}
                        onChange={(e) => setSlotNotes(prev => ({ ...prev, [slot.slot_name]: e.target.value }))}
                        onBlur={() => saveSlotNotes(slot.slot_name)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        placeholder="Notiz hinzufügen..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
