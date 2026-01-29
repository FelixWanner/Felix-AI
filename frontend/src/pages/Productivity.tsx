import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'
import { format, isToday, isThisWeek, isPast, startOfDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { Mail, CheckSquare, Archive, FileText, Calendar, AlertCircle, Plus, Edit2, Trash2, Video, Clock, MapPin, Users, Sparkles } from 'lucide-react'
import Modal from '@/components/Modal'
import TaskForm from '@/components/TaskForm'
import EmailForm from '@/components/EmailForm'
import MeetingForm from '@/components/MeetingForm'
import MeetingMinutesForm from '@/components/MeetingMinutesForm'

type InboxItem = Tables<'inbox_items'>
type Client = Tables<'clients'>
type Meeting = Tables<'meetings'>

type EmailFilter = 'all' | 'unread' | 'read' | 'archived'
type TaskFilter = 'all' | 'today' | 'week' | 'overdue'

export default function Productivity() {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [emailFilter, setEmailFilter] = useState<EmailFilter>('unread')
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')

  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showAddEmailModal, setShowAddEmailModal] = useState(false)
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false)
  const [showMeetingDetailModal, setShowMeetingDetailModal] = useState(false)
  const [showMeetingMinutesModal, setShowMeetingMinutesModal] = useState(false)
  const [editingTask, setEditingTask] = useState<InboxItem | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  useEffect(() => {
    loadProductivityData()
  }, [])

  async function loadProductivityData() {
    try {
      setLoading(true)
      setError(null)

      // Load inbox items
      const { data: inboxData, error: inboxError } = await supabase
        .from('inbox_items')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (inboxError) throw inboxError

      // Load active clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (clientsError) throw clientsError

      // Load recent meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(5)

      if (meetingsError) throw meetingsError

      setInboxItems(inboxData || [])
      setClients(clientsData || [])
      setMeetings(meetingsData || [])
    } catch (err) {
      console.error('Error loading productivity data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load productivity data')
    } finally {
      setLoading(false)
    }
  }

  // Separate emails and tasks
  const emails = inboxItems.filter(item => item.source === 'email')
  const tasks = inboxItems.filter(item => item.source !== 'email')

  // Filter emails
  const filteredEmails = emails.filter(email => {
    if (emailFilter === 'unread') return email.status !== 'completed'
    if (emailFilter === 'read') return email.status === 'completed'
    if (emailFilter === 'archived') return email.status === 'archived'
    return true
  })

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const today = startOfDay(new Date())
    const dueDate = task.due_date ? startOfDay(new Date(task.due_date)) : null

    if (taskFilter === 'today') {
      return dueDate && isToday(dueDate)
    }
    if (taskFilter === 'week') {
      return dueDate && isThisWeek(dueDate, { locale: de })
    }
    if (taskFilter === 'overdue') {
      return dueDate && isPast(dueDate) && !isToday(dueDate) && task.status !== 'completed'
    }
    return task.status !== 'completed'
  })

  // Sort tasks by priority and due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First by priority (higher number = higher priority)
    if ((b.priority || 0) !== (a.priority || 0)) {
      return (b.priority || 0) - (a.priority || 0)
    }
    // Then by due date (earlier dates first)
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })

  const unreadEmailsCount = emails.filter(e => e.status !== 'completed' && e.status !== 'archived').length
  const pendingTasks = tasks.filter(item => item.status === 'pending').length
  const inProgressTasks = tasks.filter(item => item.status === 'in_progress').length
  const activeClientsCount = clients.length

  const handleMarkAsRead = async (itemId: string) => {
    try {
      await supabase
        .from('inbox_items')
        .update({ status: 'completed' })
        .eq('id', itemId)

      await loadProductivityData()
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const handleArchive = async (itemId: string) => {
    try {
      await supabase
        .from('inbox_items')
        .update({ status: 'archived' })
        .eq('id', itemId)

      await loadProductivityData()
    } catch (err) {
      console.error('Error archiving:', err)
    }
  }

  const handleConvertToTask = async (email: InboxItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Sie müssen angemeldet sein')
        return
      }

      // Create a new task from the email
      const { error } = await supabase
        .from('inbox_items')
        .insert([{
          title: email.title,
          description: email.description,
          source: 'manual',
          status: 'pending',
          priority: 2,
          user_id: user.id
        }])

      if (error) {
        console.error('Error converting to task:', error)
        alert('Fehler beim Erstellen der Aufgabe: ' + error.message)
        return
      }

      // Mark the email as completed (read)
      await supabase
        .from('inbox_items')
        .update({ status: 'completed' })
        .eq('id', email.id)

      await loadProductivityData()
    } catch (err) {
      console.error('Error converting to task:', err)
      alert('Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  const handleToggleTask = async (itemId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      await supabase
        .from('inbox_items')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', itemId)

      await loadProductivityData()
    } catch (err) {
      console.error('Error toggling task:', err)
    }
  }

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
    if (priority >= 3) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    if (priority === 2) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
  }

  const getPriorityLabel = (priority: number | null) => {
    if (!priority) return 'Normal'
    if (priority >= 3) return 'High'
    if (priority === 2) return 'Medium'
    return 'Low'
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    const today = startOfDay(new Date())
    const due = startOfDay(new Date(dueDate))
    return isPast(due) && !isToday(due)
  }

  const handleTaskCreated = () => {
    setShowAddTaskModal(false)
    setEditingTask(null)
    loadProductivityData()
  }

  const handleEmailCreated = () => {
    setShowAddEmailModal(false)
    loadProductivityData()
  }

  const handleEditTask = (task: InboxItem) => {
    setEditingTask(task)
    setShowAddTaskModal(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('inbox_items')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('Error deleting task:', error)
        alert('Fehler beim Löschen der Aufgabe: ' + error.message)
        return
      }

      await loadProductivityData()
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  const handleCloseTaskModal = () => {
    setShowAddTaskModal(false)
    setEditingTask(null)
  }

  const handleMeetingCreated = () => {
    setShowAddMeetingModal(false)
    setEditingMeeting(null)
    loadProductivityData()
  }

  const handleCloseMeetingModal = () => {
    setShowAddMeetingModal(false)
    setEditingMeeting(null)
  }

  const handleOpenMeetingDetail = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setShowMeetingDetailModal(true)
  }

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setShowMeetingDetailModal(false)
    setShowAddMeetingModal(true)
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Möchten Sie dieses Meeting wirklich löschen?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId)

      if (error) {
        console.error('Error deleting meeting:', error)
        alert('Fehler beim Löschen des Meetings: ' + error.message)
        return
      }

      setShowMeetingDetailModal(false)
      setSelectedMeeting(null)
      await loadProductivityData()
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productivity</h1>
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productivity</h1>
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productivity</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Kunden, Inbox & Meetings
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Mail className="w-4 h-4" />
            Ungelesene Emails
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {unreadEmailsCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            von {emails.length} gesamt
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <CheckSquare className="w-4 h-4" />
            Offene Aufgaben
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {tasks.filter(t => t.status !== 'completed').length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pendingTasks} pending • {inProgressTasks} in progress
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Active Clients
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {activeClientsCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Clients
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Meetings
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {meetings.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Recent meetings
          </div>
        </div>
      </div>

      {/* Email Inbox */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Inbox
          </h2>
          <button
            onClick={() => setShowAddEmailModal(true)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neue Email
          </button>
        </div>

        {/* Email Filter Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setEmailFilter('unread')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              emailFilter === 'unread'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Ungelesen ({emails.filter(e => e.status !== 'completed' && e.status !== 'archived').length})
          </button>
          <button
            onClick={() => setEmailFilter('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              emailFilter === 'all'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Alle ({emails.length})
          </button>
          <button
            onClick={() => setEmailFilter('archived')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              emailFilter === 'archived'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Archiviert ({emails.filter(e => e.status === 'archived').length})
          </button>
        </div>

        {filteredEmails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {emailFilter === 'unread' ? 'Keine ungelesenen Emails. Du bist auf dem neuesten Stand!' : 'Keine Emails gefunden.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
              >
                <Mail className={`w-5 h-5 mt-0.5 ${
                  email.status === 'completed' || email.status === 'archived'
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`font-medium ${
                      email.status === 'completed' || email.status === 'archived'
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {email.title}
                    </div>
                    {email.status !== 'completed' && email.status !== 'archived' && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                  {email.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                      {email.description}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {email.created_at && format(new Date(email.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </span>
                    {email.source_id && <span>Von: {email.source_id}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {email.status !== 'completed' && email.status !== 'archived' && (
                    <>
                      <button
                        onClick={() => handleMarkAsRead(email.id)}
                        className="text-xs px-3 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        title="Als gelesen markieren"
                      >
                        Gelesen
                      </button>
                      <button
                        onClick={() => handleArchive(email.id)}
                        className="text-xs px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center gap-1"
                        title="Archivieren"
                      >
                        <Archive className="w-3 h-3" />
                        Archiv
                      </button>
                      <button
                        onClick={() => handleConvertToTask(email)}
                        className="text-xs px-3 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                        title="Zu Aufgabe konvertieren"
                      >
                        <FileText className="w-3 h-3" />
                        Task
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* To-Do Liste */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            To-Do Liste
          </h2>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neue Aufgabe
          </button>
        </div>

        {/* Task Filter Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTaskFilter('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              taskFilter === 'all'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Alle ({tasks.filter(t => t.status !== 'completed').length})
          </button>
          <button
            onClick={() => setTaskFilter('today')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              taskFilter === 'today'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Heute
          </button>
          <button
            onClick={() => setTaskFilter('week')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              taskFilter === 'week'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Diese Woche
          </button>
          <button
            onClick={() => setTaskFilter('overdue')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              taskFilter === 'overdue'
                ? 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Überfällig
          </button>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {taskFilter === 'overdue' ? 'Keine überfälligen Aufgaben!' : 'Keine Aufgaben gefunden.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task) => {
              const overdue = isOverdue(task.due_date)
              const dueToday = task.due_date && isToday(new Date(task.due_date))

              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-4 rounded-lg transition-colors ${
                    task.status === 'completed'
                      ? 'bg-gray-50 dark:bg-gray-800/30 opacity-60'
                      : overdue
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : dueToday
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => handleToggleTask(task.id, task.status)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`font-medium ${
                        task.status === 'completed'
                          ? 'text-gray-500 dark:text-gray-500 line-through'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      {overdue && (
                        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Überfällig
                        </span>
                      )}
                      {dueToday && !overdue && (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                          <Calendar className="w-3 h-3" />
                          Heute fällig
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {task.description}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Fällig: {format(new Date(task.due_date), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded ${
                        task.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      }`}>
                        {task.status}
                      </span>
                      {task.source && task.source !== 'manual' && (
                        <span>Quelle: {task.source}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Clients Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Active Clients
        </h2>
        {clients.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No active clients found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {client.name}
                </div>
                {client.company && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {client.company}
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {client.contact_email && `${client.contact_email}`}
                  {client.hourly_rate && ` • ${new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(client.hourly_rate)}/hr`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meetings Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5" />
            Meetings
          </h2>
          <button
            onClick={() => setShowAddMeetingModal(true)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neues Meeting
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Keine Meetings vorhanden.
            </p>
            <button
              onClick={() => setShowAddMeetingModal(true)}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Erstes Meeting erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => handleOpenMeetingDetail(meeting)}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {meeting.title}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {meeting.start_time && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(meeting.start_time), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </span>
                      )}
                      {meeting.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meeting.duration_minutes} min
                        </span>
                      )}
                      {meeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {meeting.location}
                        </span>
                      )}
                    </div>
                    {meeting.summary && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                        {meeting.summary}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {meeting.transcript && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        Minutes
                      </span>
                    )}
                    {meeting.is_billable && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        Abrechenbar
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={showAddTaskModal}
        onClose={handleCloseTaskModal}
        title={editingTask ? "Aufgabe bearbeiten" : "Neue Aufgabe"}
      >
        <TaskForm
          task={editingTask}
          onSuccess={handleTaskCreated}
          onCancel={handleCloseTaskModal}
        />
      </Modal>

      {/* Add Email Modal */}
      <Modal
        isOpen={showAddEmailModal}
        onClose={() => setShowAddEmailModal(false)}
        title="Neue Email"
      >
        <EmailForm
          onSuccess={handleEmailCreated}
          onCancel={() => setShowAddEmailModal(false)}
        />
      </Modal>

      {/* Add/Edit Meeting Modal */}
      <Modal
        isOpen={showAddMeetingModal}
        onClose={handleCloseMeetingModal}
        title={editingMeeting ? "Meeting bearbeiten" : "Neues Meeting"}
      >
        <MeetingForm
          meeting={editingMeeting}
          onSuccess={handleMeetingCreated}
          onCancel={handleCloseMeetingModal}
        />
      </Modal>

      {/* Meeting Detail Modal */}
      <Modal
        isOpen={showMeetingDetailModal}
        onClose={() => {
          setShowMeetingDetailModal(false)
          setSelectedMeeting(null)
        }}
        title={selectedMeeting?.title || 'Meeting Details'}
      >
        {selectedMeeting && (
          <div className="space-y-6">
            {/* Meeting Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                {selectedMeeting.start_time && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(selectedMeeting.start_time), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </span>
                )}
                {selectedMeeting.duration_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedMeeting.duration_minutes} min
                  </span>
                )}
              </div>
              {selectedMeeting.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  {selectedMeeting.location}
                </div>
              )}
              {selectedMeeting.attendees && Array.isArray(selectedMeeting.attendees) && selectedMeeting.attendees.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Users className="w-4 h-4 mt-0.5" />
                  <div className="flex flex-wrap gap-2">
                    {(selectedMeeting.attendees as { name: string; email?: string }[]).map((attendee, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
                        {attendee.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Minutes / Transcript */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Meeting Minutes
              </h4>
              {selectedMeeting.transcript ? (
                <div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedMeeting.transcript}
                  </div>
                  <button
                    onClick={() => {
                      setShowMeetingDetailModal(false)
                      setShowMeetingMinutesModal(true)
                    }}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Minutes bearbeiten
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                  <FileText className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Noch keine Meeting Minutes vorhanden
                  </p>
                  <button
                    onClick={() => {
                      setShowMeetingDetailModal(false)
                      setShowMeetingMinutesModal(true)
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Minutes hinzufügen
                  </button>
                </div>
              )}
            </div>

            {/* Summary */}
            {selectedMeeting.summary && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Zusammenfassung
                </h4>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-gray-700 dark:text-gray-300">
                  {selectedMeeting.summary}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleEditMeeting(selectedMeeting)}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Bearbeiten
              </button>
              <button
                onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                className="btn-secondary text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Löschen
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Meeting Minutes Modal */}
      <Modal
        isOpen={showMeetingMinutesModal}
        onClose={() => {
          setShowMeetingMinutesModal(false)
        }}
        title={`Meeting Minutes: ${selectedMeeting?.title || ''}`}
      >
        {selectedMeeting && (
          <MeetingMinutesForm
            meeting={selectedMeeting}
            onSuccess={() => {
              setShowMeetingMinutesModal(false)
              setSelectedMeeting(null)
              loadProductivityData()
            }}
            onCancel={() => {
              setShowMeetingMinutesModal(false)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
