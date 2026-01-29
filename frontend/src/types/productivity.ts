// ═══════════════════════════════════════════════════════════════
// Life OS - Productivity Module Domain Types
// ═══════════════════════════════════════════════════════════════

import { Tables, InsertTables, UpdateTables } from './database'
import { Property, Tenant, Contact } from './wealth'

// ─────────────────────────────────────────────────────────────
// Base Types (from Supabase)
// ─────────────────────────────────────────────────────────────

export type Client = Tables<'clients'>
export type ClientInsert = InsertTables<'clients'>
export type ClientUpdate = UpdateTables<'clients'>

export type InboxItem = Tables<'inbox_items'>
export type InboxItemInsert = InsertTables<'inbox_items'>
export type InboxItemUpdate = UpdateTables<'inbox_items'>

export type Meeting = Tables<'meetings'>
export type MeetingInsert = InsertTables<'meetings'>
export type MeetingUpdate = UpdateTables<'meetings'>

export type MeetingActionItem = Tables<'meeting_action_items'>

export type TimeEntry = Tables<'time_entries'>
export type TimeEntryInsert = InsertTables<'time_entries'>
export type TimeEntryUpdate = UpdateTables<'time_entries'>

export type Ticket = Tables<'tickets'>
export type TicketInsert = InsertTables<'tickets'>
export type TicketUpdate = UpdateTables<'tickets'>

export type TicketComment = Tables<'ticket_comments'>
export type TicketCommentInsert = InsertTables<'ticket_comments'>

export type Document = Tables<'documents'>
export type DocumentInsert = InsertTables<'documents'>
export type DocumentUpdate = UpdateTables<'documents'>

export type DocumentEmbedding = Tables<'document_embeddings'>

// ─────────────────────────────────────────────────────────────
// Enums & Constants
// ─────────────────────────────────────────────────────────────

export const InboxSources = {
  MANUAL: 'manual',
  EMAIL: 'email',
  MS_TODO: 'ms_todo',
  CALENDAR: 'calendar',
  TELEGRAM: 'telegram',
  MEETING: 'meeting',
  TICKET: 'ticket',
} as const

export type InboxSource = (typeof InboxSources)[keyof typeof InboxSources]

export const InboxStatuses = {
  INBOX: 'inbox',
  TODAY: 'today',
  NEXT: 'next',
  SCHEDULED: 'scheduled',
  SOMEDAY: 'someday',
  WAITING: 'waiting',
  DELEGATED: 'delegated',
  DONE: 'done',
} as const

export type InboxStatus = (typeof InboxStatuses)[keyof typeof InboxStatuses]

export const Priorities = {
  URGENT_IMPORTANT: 1,
  NOT_URGENT_IMPORTANT: 2,
  URGENT_NOT_IMPORTANT: 3,
  NOT_URGENT_NOT_IMPORTANT: 4,
} as const

export type Priority = (typeof Priorities)[keyof typeof Priorities]

export const Contexts = {
  COMPUTER: '@computer',
  PHONE: '@phone',
  HOME: '@home',
  OFFICE: '@office',
  ERRANDS: '@errands',
  ANYWHERE: '@anywhere',
  CALLS: '@calls',
  WAITING: '@waiting',
} as const

export type Context = (typeof Contexts)[keyof typeof Contexts]

export const TicketStatuses = {
  NEW: 'neu',
  IN_PROGRESS: 'in_bearbeitung',
  WAITING: 'wartend',
  COMPLETED: 'abgeschlossen',
  CANCELLED: 'storniert',
} as const

export type TicketStatus = (typeof TicketStatuses)[keyof typeof TicketStatuses]

export const TicketPriorities = {
  LOW: 'niedrig',
  MEDIUM: 'mittel',
  HIGH: 'hoch',
  URGENT: 'dringend',
} as const

export type TicketPriority = (typeof TicketPriorities)[keyof typeof TicketPriorities]

export const TicketCategories = {
  MAINTENANCE: 'wartung',
  REPAIR: 'reparatur',
  COMPLAINT: 'beschwerde',
  QUESTION: 'anfrage',
  CONTRACT: 'vertrag',
  BILLING: 'abrechnung',
  OTHER: 'sonstiges',
} as const

export type TicketCategory = (typeof TicketCategories)[keyof typeof TicketCategories]

export const BillingTypes = {
  HOURLY: 'stundensatz',
  FIXED: 'pauschal',
  RETAINER: 'retainer',
  PROJECT: 'projekt',
} as const

export type BillingType = (typeof BillingTypes)[keyof typeof BillingTypes]

export const DocumentTypes = {
  CONTRACT: 'vertrag',
  INVOICE: 'rechnung',
  PROTOCOL: 'protokoll',
  LETTER: 'brief',
  REPORT: 'bericht',
  PLAN: 'plan',
  CERTIFICATE: 'bescheinigung',
  OTHER: 'sonstiges',
} as const

export type DocumentType = (typeof DocumentTypes)[keyof typeof DocumentTypes]

// ─────────────────────────────────────────────────────────────
// Extended Types (with relations)
// ─────────────────────────────────────────────────────────────

export interface InboxItemWithRelations extends InboxItem {
  property?: Property | null
  tenant?: Tenant | null
  contact?: Contact | null
  client?: Client | null
  goal?: { id: string; title: string } | null
}

export interface MeetingWithRelations extends Meeting {
  client?: Client | null
  property?: Property | null
  action_items?: MeetingActionItem[]
}

export interface TicketWithRelations extends Ticket {
  property?: Property | null
  unit?: { id: string; unit_number: string } | null
  assigned_contact?: Contact | null
  comments?: TicketComment[]
}

export interface TimeEntryWithRelations extends TimeEntry {
  client?: Client | null
  meeting?: Meeting | null
  inbox_item?: InboxItem | null
}

export interface DocumentWithRelations extends Document {
  property?: Property | null
  unit?: { id: string; unit_number: string } | null
  tenant?: Tenant | null
  embeddings_count?: number
}

export interface ClientWithRelations extends Client {
  time_entries?: TimeEntry[]
  meetings?: Meeting[]
  inbox_items?: InboxItem[]
}

// ─────────────────────────────────────────────────────────────
// Aggregated / Calculated Types
// ─────────────────────────────────────────────────────────────

export interface InboxStats {
  total: number
  by_status: Record<InboxStatus, number>
  by_priority: Record<number, number>
  overdue: number
  due_today: number
  due_this_week: number
  unprocessed: number
}

export interface MeetingAttendee {
  name: string
  email?: string
  response_status?: 'accepted' | 'declined' | 'tentative' | 'none'
}

export interface TaskSummary {
  id: string
  title: string
  status: InboxStatus
  priority: number | null
  due_date: string | null
  context: string | null
  is_overdue: boolean
  source: InboxSource
  property_name?: string
  client_name?: string
}

export interface TimeTrackingSummary {
  date_range: { from: string; to: string }
  total_hours: number
  billable_hours: number
  non_billable_hours: number
  billable_revenue: number
  by_client: { client_name: string; hours: number; revenue: number }[]
  by_day: { date: string; hours: number }[]
}

export interface TicketSummary {
  total: number
  by_status: Record<TicketStatus, number>
  by_priority: Record<TicketPriority, number>
  by_category: Record<TicketCategory, number>
  avg_resolution_time_days: number
  overdue: number
}

export interface MeetingSummary {
  today: Meeting[]
  upcoming: Meeting[]
  past_week: Meeting[]
  total_hours_this_week: number
  total_hours_this_month: number
}

export interface DocumentSearchResult {
  id: string
  document_id: string
  document_title: string
  document_type: string | null
  property_name: string | null
  chunk_index: number
  content: string
  similarity: number
}

// ─────────────────────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────────────────────

export interface ProductivityDashboardData {
  inbox_stats: InboxStats
  today_tasks: TaskSummary[]
  today_meetings: MeetingSummary['today']
  upcoming_meetings: MeetingSummary['upcoming']
  time_tracking: TimeTrackingSummary
  open_tickets: TicketSummary
  recent_documents: Document[]
}

export interface DailyPlan {
  date: string
  top_priorities: TaskSummary[]
  scheduled_tasks: TaskSummary[]
  meetings: Meeting[]
  time_blocks: TimeBlock[]
  estimated_work_hours: number
}

export interface TimeBlock {
  id: string
  start_time: string
  end_time: string
  type: 'meeting' | 'focus' | 'task' | 'break'
  title: string
  linked_item_id?: string
}

// ─────────────────────────────────────────────────────────────
// Filter & Query Types
// ─────────────────────────────────────────────────────────────

export interface InboxFilters {
  status?: InboxStatus | InboxStatus[]
  priority?: Priority | Priority[]
  context?: Context
  source?: InboxSource
  property_id?: string
  client_id?: string
  due_date_from?: string
  due_date_to?: string
  search?: string
  is_billable?: boolean
}

export interface TicketFilters {
  status?: TicketStatus | TicketStatus[]
  priority?: TicketPriority
  category?: TicketCategory
  property_id?: string
  assigned_to?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface MeetingFilters {
  client_id?: string
  property_id?: string
  date_from?: string
  date_to?: string
  is_billable?: boolean
}

export interface TimeEntryFilters {
  client_id?: string
  date_from?: string
  date_to?: string
  is_billable?: boolean
  is_billed?: boolean
}

export interface DocumentFilters {
  document_type?: DocumentType
  property_id?: string
  tenant_id?: string
  search?: string
  is_indexed?: boolean
}

// ─────────────────────────────────────────────────────────────
// Action Types
// ─────────────────────────────────────────────────────────────

export interface CreateTaskFromEmail {
  subject: string
  sender: string
  body: string
  received_at: string
  source_id: string
}

export interface CreateTaskFromMeeting {
  meeting_id: string
  extracted_text: string
  assigned_to?: string
  due_date?: string
}

export interface BulkTaskUpdate {
  task_ids: string[]
  status?: InboxStatus
  priority?: Priority
  scheduled_date?: string
  context?: Context
}
