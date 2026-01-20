import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  Property,
  Unit,
  Tenant,
  Loan,
  Account,
  Contact,
  PropertyScenario,
  PropertyMilestone,
  PropertyTaxData,
} from '@/types'

// ─────────────────────────────────────────────────────────────
// Property Summary Type
// ─────────────────────────────────────────────────────────────

export interface PropertyWithStats extends Property {
  units: (Unit & { tenant: Tenant | null })[]
  loans: (Loan & { bank: { name: string } | null })[]
  accounts: (Account & { bank: { name: string } | null })[]
  occupiedUnits: number
  vacantUnits: number
  vacancyRate: number
  monthlyRentTotal: number
  monthlyUtilitiesTotal: number
  monthlyLoanPayments: number
  netMonthlyCashflow: number
  grossYield: number
  netYield: number
  totalLoanBalance: number
  equity: number
  ltvRatio: number
  isTaxFree: boolean
  taxFreeDate: Date | null
  daysUntilTaxFree: number | null
}

// ─────────────────────────────────────────────────────────────
// All Properties with Stats
// ─────────────────────────────────────────────────────────────

export function usePropertiesWithStats() {
  return useQuery({
    queryKey: ['properties-with-stats'],
    queryFn: async () => {
      // Fetch properties
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('*')
        .order('name')

      if (propError) throw propError

      // Fetch all units with tenants
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*, tenant:tenants(*)')

      if (unitsError) throw unitsError

      // Fetch all loans
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*, bank:banks(name)')

      if (loansError) throw loansError

      // Fetch all accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*, bank:banks(name)')
        .eq('is_active', true)

      if (accountsError) throw accountsError

      // Calculate stats for each property
      const propertiesWithStats: PropertyWithStats[] = (properties as Property[]).map(property => {
        const propertyUnits = (units as (Unit & { tenant: Tenant | null })[])
          .filter(u => u.property_id === property.id)
        const propertyLoans = (loans as (Loan & { bank: { name: string } | null })[])
          .filter(l => l.property_id === property.id)
        const propertyAccounts = (accounts as (Account & { bank: { name: string } | null })[])
          .filter(a => a.property_id === property.id)

        // Unit stats
        const occupiedUnits = propertyUnits.filter(u => u.status === 'vermietet').length
        const vacantUnits = propertyUnits.filter(u => u.status === 'leer').length
        const totalUnits = propertyUnits.length || property.unit_count || 1
        const vacancyRate = totalUnits > 0 ? (vacantUnits / totalUnits) * 100 : 0

        // Rental income
        const monthlyRentTotal = propertyUnits
          .filter(u => u.status === 'vermietet')
          .reduce((sum, u) => sum + (u.monthly_rent_cold || 0), 0)
        const monthlyUtilitiesTotal = propertyUnits
          .filter(u => u.status === 'vermietet')
          .reduce((sum, u) => sum + (u.monthly_utilities_advance || 0), 0)

        // Loan payments
        const monthlyLoanPayments = propertyLoans
          .reduce((sum, l) => sum + (l.monthly_payment || 0), 0)
        const totalLoanBalance = propertyLoans
          .reduce((sum, l) => sum + (l.current_balance || 0), 0)

        // Net cashflow
        const netMonthlyCashflow = monthlyRentTotal + monthlyUtilitiesTotal - monthlyLoanPayments

        // Yield calculations
        const currentValue = property.current_value || property.purchase_price || 0
        const annualRent = monthlyRentTotal * 12
        const grossYield = currentValue > 0 ? (annualRent / currentValue) * 100 : 0
        const annualNetIncome = (monthlyRentTotal - monthlyLoanPayments) * 12
        const netYield = currentValue > 0 ? (annualNetIncome / currentValue) * 100 : 0

        // Equity & LTV
        const equity = currentValue - totalLoanBalance
        const ltvRatio = currentValue > 0 ? (totalLoanBalance / currentValue) * 100 : 0

        // Tax-free status (10 years after purchase in Germany)
        let isTaxFree = false
        let taxFreeDate: Date | null = null
        let daysUntilTaxFree: number | null = null

        if (property.purchase_date) {
          taxFreeDate = new Date(property.purchase_date)
          taxFreeDate.setFullYear(taxFreeDate.getFullYear() + 10)
          const now = new Date()
          isTaxFree = now >= taxFreeDate
          if (!isTaxFree) {
            daysUntilTaxFree = Math.ceil((taxFreeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          }
        }

        return {
          ...property,
          units: propertyUnits,
          loans: propertyLoans,
          accounts: propertyAccounts,
          occupiedUnits,
          vacantUnits,
          vacancyRate,
          monthlyRentTotal,
          monthlyUtilitiesTotal,
          monthlyLoanPayments,
          netMonthlyCashflow,
          grossYield,
          netYield,
          totalLoanBalance,
          equity,
          ltvRatio,
          isTaxFree,
          taxFreeDate,
          daysUntilTaxFree,
        }
      })

      return propertiesWithStats
    },
    staleTime: 60000, // 1 minute
  })
}

// ─────────────────────────────────────────────────────────────
// Single Property with Full Details
// ─────────────────────────────────────────────────────────────

export interface PropertyDetail extends PropertyWithStats {
  manager: Contact | null
  contacts: (Contact & { specialty?: string })[]
  scenarios: PropertyScenario[]
  milestones: PropertyMilestone[]
  taxData: PropertyTaxData | null
}

export function usePropertyDetail(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-detail', propertyId],
    queryFn: async () => {
      if (!propertyId) return null

      // Fetch property
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (propError) throw propError

      // Fetch units with tenants
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*, tenant:tenants(*)')
        .eq('property_id', propertyId)
        .order('name')

      if (unitsError) throw unitsError

      // Fetch loans
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*, bank:banks(name)')
        .eq('property_id', propertyId)
        .order('contract_number')

      if (loansError) throw loansError

      // Fetch accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*, bank:banks(name)')
        .eq('property_id', propertyId)
        .eq('is_active', true)
        .order('name')

      if (accountsError) throw accountsError

      // Fetch property manager
      let manager: Contact | null = null
      if (property.property_manager_id) {
        const { data: managerData } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', property.property_manager_id)
          .single()
        manager = managerData as Contact | null
      }

      // Fetch other contacts linked to this property
      const { data: contactLinks, error: contactsError } = await supabase
        .from('contact_properties')
        .select('role, contact:contacts(*)')
        .eq('property_id', propertyId)

      if (contactsError) throw contactsError

      const contacts = (contactLinks || [])
        .filter(cl => cl.contact)
        .map(cl => ({
          ...(cl.contact as Contact),
          specialty: cl.role || undefined,
        }))

      // Fetch scenarios
      const { data: scenarios, error: scenariosError } = await supabase
        .from('property_scenarios')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (scenariosError) throw scenariosError

      // Fetch milestones
      const { data: milestones, error: milestonesError } = await supabase
        .from('property_milestones')
        .select('*')
        .eq('property_id', propertyId)
        .order('milestone_date', { ascending: true })

      if (milestonesError) throw milestonesError

      // Fetch tax data
      const { data: taxData, error: taxDataError } = await supabase
        .from('property_tax_data')
        .select('*')
        .eq('property_id', propertyId)
        .single()

      if (taxDataError && taxDataError.code !== 'PGRST116') throw taxDataError

      // Calculate stats
      const propertyUnits = units as (Unit & { tenant: Tenant | null })[]
      const propertyLoans = loans as (Loan & { bank: { name: string } | null })[]
      const propertyAccounts = accounts as (Account & { bank: { name: string } | null })[]

      const occupiedUnits = propertyUnits.filter(u => u.status === 'vermietet').length
      const vacantUnits = propertyUnits.filter(u => u.status === 'leer').length
      const totalUnits = propertyUnits.length || property.unit_count || 1
      const vacancyRate = totalUnits > 0 ? (vacantUnits / totalUnits) * 100 : 0

      const monthlyRentTotal = propertyUnits
        .filter(u => u.status === 'vermietet')
        .reduce((sum, u) => sum + (u.monthly_rent_cold || 0), 0)
      const monthlyUtilitiesTotal = propertyUnits
        .filter(u => u.status === 'vermietet')
        .reduce((sum, u) => sum + (u.monthly_utilities_advance || 0), 0)
      const monthlyLoanPayments = propertyLoans
        .reduce((sum, l) => sum + (l.monthly_payment || 0), 0)
      const totalLoanBalance = propertyLoans
        .reduce((sum, l) => sum + (l.current_balance || 0), 0)

      const netMonthlyCashflow = monthlyRentTotal + monthlyUtilitiesTotal - monthlyLoanPayments
      const currentValue = property.current_value || property.purchase_price || 0
      const annualRent = monthlyRentTotal * 12
      const grossYield = currentValue > 0 ? (annualRent / currentValue) * 100 : 0
      const annualNetIncome = (monthlyRentTotal - monthlyLoanPayments) * 12
      const netYield = currentValue > 0 ? (annualNetIncome / currentValue) * 100 : 0
      const equity = currentValue - totalLoanBalance
      const ltvRatio = currentValue > 0 ? (totalLoanBalance / currentValue) * 100 : 0

      let isTaxFree = false
      let taxFreeDate: Date | null = null
      let daysUntilTaxFree: number | null = null

      if (property.purchase_date) {
        taxFreeDate = new Date(property.purchase_date)
        taxFreeDate.setFullYear(taxFreeDate.getFullYear() + 10)
        const now = new Date()
        isTaxFree = now >= taxFreeDate
        if (!isTaxFree) {
          daysUntilTaxFree = Math.ceil((taxFreeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }
      }

      return {
        ...property,
        units: propertyUnits,
        loans: propertyLoans,
        accounts: propertyAccounts,
        occupiedUnits,
        vacantUnits,
        vacancyRate,
        monthlyRentTotal,
        monthlyUtilitiesTotal,
        monthlyLoanPayments,
        netMonthlyCashflow,
        grossYield,
        netYield,
        totalLoanBalance,
        equity,
        ltvRatio,
        isTaxFree,
        taxFreeDate,
        daysUntilTaxFree,
        manager,
        contacts,
        scenarios: scenarios as PropertyScenario[],
        milestones: milestones as PropertyMilestone[],
        taxData: taxData as PropertyTaxData | null,
      } as PropertyDetail
    },
    enabled: !!propertyId,
    staleTime: 60000,
  })
}

// ─────────────────────────────────────────────────────────────
// Property Tickets (from productivity module)
// ─────────────────────────────────────────────────────────────

export function usePropertyTickets(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-tickets', propertyId],
    queryFn: async () => {
      if (!propertyId) return []

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!propertyId,
  })
}

// ─────────────────────────────────────────────────────────────
// Property Documents (from documents module)
// ─────────────────────────────────────────────────────────────

export function usePropertyDocuments(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-documents', propertyId],
    queryFn: async () => {
      if (!propertyId) return []

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!propertyId,
  })
}

// ─────────────────────────────────────────────────────────────
// Property Cities (for filtering)
// ─────────────────────────────────────────────────────────────

export function usePropertyCities() {
  return useQuery({
    queryKey: ['property-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('city')
        .not('city', 'is', null)

      if (error) throw error

      const cities = [...new Set((data as { city: string }[]).map(p => p.city))]
        .filter(Boolean)
        .sort()

      return cities
    },
  })
}
