import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Circle, Calendar, User, AlertCircle, Video, ChevronDown, ChevronUp } from 'lucide-react'

interface ActionItem {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  meeting_action_items?: {
    meeting_id: string
    assigned_to: string | null
    extracted_text: string | null
    meetings?: {
      title: string
      start_time: string
    }
  }[]
}

interface MeetingActionItemsProps {
  className?: string
  limit?: number
  showTitle?: boolean
}

export default function MeetingActionItems({
  className = '',
  limit = 10,
  showTitle = true
}: MeetingActionItemsProps) {
  const [items, setItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    loadActionItems()
  }, [])

  async function loadActionItems() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('inbox_items')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          due_date,
          created_at,
          meeting_action_items (
            meeting_id,
            assigned_to,
            extracted_text,
            meetings (
              title,
              start_time
            )
          )
        `)
        .eq('source', 'meeting')
        .neq('status', 'completed')
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error loading meeting action items:', error)
        return
      }

      setItems((data as ActionItem[]) || [])
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleItemStatus(item: ActionItem) {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed'

    const { error } = await supabase
      .from('inbox_items')
      .update({ status: newStatus })
      .eq('id', item.id)

    if (error) {
      console.error('Error updating status:', error)
      return
    }

    // Reload items after status change
    loadActionItems()
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-amber-500'
      case 'low':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  function getPriorityBadge(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  function formatDueDate(dateString: string | null): string {
    if (!dateString) return ''

    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Heute'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Morgen'
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    }
  }

  function isOverdue(dateString: string | null): boolean {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  if (loading) {
    return (
      <div className={`card ${className}`}>
        {showTitle && (
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-500" />
              Meeting-Aufgaben
            </h3>
          </div>
        )}
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={`card ${className}`}>
        {showTitle && (
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-500" />
              Meeting-Aufgaben
            </h3>
          </div>
        )}
        <div className="card-body">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Keine offenen Meeting-Aufgaben
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Aufgaben aus Meeting-Protokollen erscheinen hier
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      {showTitle && (
        <div
          className="card-header flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            Meeting-Aufgaben
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({items.length} offen)
            </span>
          </h3>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      )}

      {expanded && (
        <div className="card-body p-0">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => {
              const meetingInfo = item.meeting_action_items?.[0]?.meetings
              const assignedTo = item.meeting_action_items?.[0]?.assigned_to
              const overdue = isOverdue(item.due_date)

              return (
                <li key={item.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleItemStatus(item)}
                      className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-green-500 transition-colors"
                    >
                      {item.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${
                          item.status === 'completed'
                            ? 'text-gray-400 line-through'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {item.title}
                        </p>
                        <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(item.priority)}`}>
                          {item.priority === 'high' ? 'Hoch' : item.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {meetingInfo && (
                          <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" />
                            {meetingInfo.title}
                          </span>
                        )}

                        {assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {assignedTo}
                          </span>
                        )}

                        {item.due_date && (
                          <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                            {overdue && <AlertCircle className="w-3.5 h-3.5" />}
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDueDate(item.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
