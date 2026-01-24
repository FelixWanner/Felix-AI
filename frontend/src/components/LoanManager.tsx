import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Trash2, Edit2, X, Check, TrendingDown, Calendar } from 'lucide-react'

interface AssetLoan {
  id: string
  user_id: string
  property_id: string | null
  solar_panel_id: string | null
  loan_name: string
  lender_name: string | null
  loan_type: string | null
  principal_amount: number
  interest_rate: number
  term_months: number
  monthly_payment: number | null
  start_date: string
  end_date: string | null
  notes: string | null
}

interface Props {
  assetId: string
  assetType: 'property' | 'solar'
}

export default function LoanManager({ assetId, assetType }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loans, setLoans] = useState<AssetLoan[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingLoan, setEditingLoan] = useState<string | null>(null)

  // Form state
  const [loanName, setLoanName] = useState('')
  const [lenderName, setLenderName] = useState('')
  const [loanType, setLoanType] = useState('')
  const [principalAmount, setPrincipalAmount] = useState<number | null>(null)
  const [interestRate, setInterestRate] = useState<number | null>(null)
  const [termMonths, setTermMonths] = useState<number | null>(null)
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user && assetId) {
      loadLoans()
    }
  }, [user, assetId])

  async function loadLoans() {
    if (!user || !assetId) return
    setLoading(true)

    try {
      const column = assetType === 'property' ? 'property_id' : 'solar_panel_id'
      const { data, error } = await supabase
        .from('asset_loans')
        .select('*')
        .eq('user_id', user.id)
        .eq(column, assetId)
        .order('start_date', { ascending: false })

      if (error) throw error
      setLoans(data || [])
    } catch (error) {
      console.error('Error loading loans:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!user || !loanName.trim() || !principalAmount || !interestRate || !termMonths || !startDate) {
      alert('Bitte fülle alle Pflichtfelder aus (Name, Betrag, Zinssatz, Laufzeit, Startdatum)')
      return
    }

    try {
      const loanData = {
        user_id: user.id,
        [assetType === 'property' ? 'property_id' : 'solar_panel_id']: assetId,
        loan_name: loanName.trim(),
        lender_name: lenderName.trim() || null,
        loan_type: loanType.trim() || null,
        principal_amount: principalAmount,
        interest_rate: interestRate,
        term_months: termMonths,
        monthly_payment: monthlyPayment,
        start_date: startDate,
        end_date: endDate || null,
        notes: notes.trim() || null
      }

      if (editingLoan) {
        const { error } = await supabase
          .from('asset_loans')
          .update(loanData)
          .eq('id', editingLoan)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('asset_loans')
          .insert(loanData)

        if (error) throw error
      }

      resetForm()
      await loadLoans()
    } catch (error) {
      console.error('Error saving loan:', error)
      alert('Fehler beim Speichern des Darlehens')
    }
  }

  async function handleDelete(loanId: string) {
    if (!confirm('Darlehen wirklich löschen?')) return

    try {
      const { error } = await supabase
        .from('asset_loans')
        .delete()
        .eq('id', loanId)

      if (error) throw error
      await loadLoans()
    } catch (error) {
      console.error('Error deleting loan:', error)
      alert('Fehler beim Löschen des Darlehens')
    }
  }

  function handleEdit(loan: AssetLoan) {
    setEditingLoan(loan.id)
    setLoanName(loan.loan_name)
    setLenderName(loan.lender_name || '')
    setLoanType(loan.loan_type || '')
    setPrincipalAmount(loan.principal_amount)
    setInterestRate(loan.interest_rate)
    setTermMonths(loan.term_months)
    setMonthlyPayment(loan.monthly_payment)
    setStartDate(loan.start_date)
    setEndDate(loan.end_date || '')
    setNotes(loan.notes || '')
    setShowForm(true)
  }

  function resetForm() {
    setLoanName('')
    setLenderName('')
    setLoanType('')
    setPrincipalAmount(null)
    setInterestRate(null)
    setTermMonths(null)
    setMonthlyPayment(null)
    setStartDate('')
    setEndDate('')
    setNotes('')
    setShowForm(false)
    setEditingLoan(null)
  }

  function calculateMonthsElapsed(startDate: string): number {
    const start = new Date(startDate)
    const now = new Date()
    const years = now.getFullYear() - start.getFullYear()
    const months = now.getMonth() - start.getMonth()
    return Math.max(0, years * 12 + months)
  }

  function calculateMonthsRemaining(startDate: string, termMonths: number): number {
    const elapsed = calculateMonthsElapsed(startDate)
    return Math.max(0, termMonths - elapsed)
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal_amount, 0)
  const totalMonthlyPayment = loans.reduce((sum, loan) => sum + (loan.monthly_payment || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Darlehen ({loans.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Abbrechen
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Darlehen hinzufügen
            </>
          )}
        </button>
      </div>

      {/* Summary */}
      {loans.length > 0 && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Gesamtdarlehen</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalPrincipal)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Monatliche Rate (gesamt)</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalMonthlyPayment)}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {editingLoan ? 'Darlehen bearbeiten' : 'Neues Darlehen'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Darlehensname *
              </label>
              <input
                type="text"
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. Hauptdarlehen, Nachrangdarlehen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kreditgeber
              </label>
              <input
                type="text"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. Sparkasse, KfW"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Darlehenstyp
              </label>
              <input
                type="text"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. Annuitätendarlehen"
                list="loan-type-suggestions"
              />
              <datalist id="loan-type-suggestions">
                <option value="Annuitätendarlehen" />
                <option value="Tilgungsdarlehen" />
                <option value="Endfälliges Darlehen" />
                <option value="KfW-Darlehen" />
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Darlehensbetrag (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={principalAmount || ''}
                onChange={(e) => setPrincipalAmount(e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zinssatz (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={interestRate || ''}
                onChange={(e) => setInterestRate(e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="3.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Laufzeit (Monate) *
              </label>
              <input
                type="number"
                value={termMonths || ''}
                onChange={(e) => setTermMonths(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="240"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monatliche Rate (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={monthlyPayment || ''}
                onChange={(e) => setMonthlyPayment(e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="650"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Startdatum *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enddatum (optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notizen
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Zusätzliche Informationen zum Darlehen..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {editingLoan ? 'Speichern' : 'Hinzufügen'}
            </button>
          </div>
        </div>
      )}

      {/* Loans List */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">Lade...</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          Keine Darlehen erfasst. Klicke auf "Darlehen hinzufügen", um zu starten.
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => {
            const monthsElapsed = calculateMonthsElapsed(loan.start_date)
            const monthsRemaining = calculateMonthsRemaining(loan.start_date, loan.term_months)
            const progressPercent = (monthsElapsed / loan.term_months) * 100

            return (
              <div
                key={loan.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {loan.loan_name}
                    </h4>
                    {loan.lender_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {loan.lender_name}
                        {loan.loan_type && ` • ${loan.loan_type}`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(loan)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Darlehensbetrag</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(loan.principal_amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Zinssatz</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {loan.interest_rate.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Monatliche Rate</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {loan.monthly_payment ? formatCurrency(loan.monthly_payment) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Restlaufzeit
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {monthsRemaining} von {loan.term_months} Mon.
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Fortschritt</span>
                    <span>{progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Start: {format(new Date(loan.start_date), 'dd.MM.yyyy', { locale: de })}
                  {loan.end_date && (
                    <> • Ende: {format(new Date(loan.end_date), 'dd.MM.yyyy', { locale: de })}</>
                  )}
                </div>

                {loan.notes && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                    {loan.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
