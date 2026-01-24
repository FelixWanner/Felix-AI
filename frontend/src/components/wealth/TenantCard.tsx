import { format, differenceInMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import clsx from 'clsx'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import type { Tenant } from '@/types'

// ─────────────────────────────────────────────────────────────
// Currency Formatter
// ─────────────────────────────────────────────────────────────

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─────────────────────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    aktiv: { label: 'Aktiv', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    gekündigt: { label: 'Gekündigt', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    ausgezogen: { label: 'Ausgezogen', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' },
  }

  const config = statusConfig[status] || statusConfig.aktiv

  return (
    <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full', config.color)}>
      {config.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Info Row Component
// ─────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ElementType
  label: string
  value: string | React.ReactNode
  color?: string
}

function InfoRow({ icon: Icon, label, value, color = 'text-gray-600 dark:text-gray-400' }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={clsx('h-4 w-4', color)} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main TenantCard Component
// ─────────────────────────────────────────────────────────────

interface TenantCardProps {
  tenant: Tenant
  compact?: boolean
  showUnit?: boolean
}

export default function TenantCard({ tenant, compact = false, showUnit = false }: TenantCardProps) {
  // Calculate tenancy duration
  const tenancyDuration = tenant.move_in_date
    ? differenceInMonths(new Date(), new Date(tenant.move_in_date))
    : null

  // Deposit status
  const hasDeposit = tenant.deposit_amount && tenant.deposit_amount > 0
  const depositPaid = tenant.deposit_paid ?? false

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
            <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {tenant.name}
            </p>
            {tenant.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tenant.email}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={tenant.status || 'aktiv'} />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
            <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {tenant.name}
            </h4>
            {tenancyDuration !== null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mieter seit {tenancyDuration} Monaten
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={tenant.status || 'aktiv'} />
      </div>

      {/* Contact Info */}
      <div className="space-y-3 mb-4">
        {tenant.email && (
          <InfoRow
            icon={EnvelopeIcon}
            label="E-Mail"
            value={
              <a
                href={`mailto:${tenant.email}`}
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {tenant.email}
              </a>
            }
          />
        )}

        {tenant.phone && (
          <InfoRow
            icon={PhoneIcon}
            label="Telefon"
            value={
              <a
                href={`tel:${tenant.phone}`}
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {tenant.phone}
              </a>
            }
          />
        )}

        {tenant.move_in_date && (
          <InfoRow
            icon={CalendarIcon}
            label="Einzug"
            value={format(new Date(tenant.move_in_date), 'd. MMMM yyyy', { locale: de })}
          />
        )}

        {tenant.move_out_date && (
          <InfoRow
            icon={CalendarIcon}
            label="Auszug"
            value={format(new Date(tenant.move_out_date), 'd. MMMM yyyy', { locale: de })}
            color="text-amber-600 dark:text-amber-400"
          />
        )}
      </div>

      {/* Deposit Info */}
      {hasDeposit && (
        <div className={clsx(
          'flex items-center gap-3 p-3 rounded-lg',
          depositPaid
            ? 'bg-emerald-50 dark:bg-emerald-900/20'
            : 'bg-amber-50 dark:bg-amber-900/20'
        )}>
          {depositPaid ? (
            <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
          <div className="flex-1">
            <p className={clsx(
              'text-sm font-medium',
              depositPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
            )}>
              Kaution: {formatCurrency(tenant.deposit_amount || 0)}
            </p>
            <p className={clsx(
              'text-xs',
              depositPaid ? 'text-emerald-600 dark:text-emerald-500' : 'text-amber-600 dark:text-amber-500'
            )}>
              {depositPaid ? 'Kaution bezahlt' : 'Kaution ausstehend'}
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {tenant.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notizen</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {tenant.notes}
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Empty State Component
// ─────────────────────────────────────────────────────────────

export function EmptyTenantState() {
  return (
    <div className="text-center py-6">
      <UserIcon className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Kein Mieter zugeordnet
      </p>
    </div>
  )
}
