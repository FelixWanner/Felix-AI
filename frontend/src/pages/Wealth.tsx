import { Routes, Route } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Building2, Wallet, TrendingUp, CreditCard } from 'lucide-react'

function WealthOverview() {
  const { data: snapshot } = useQuery({
    queryKey: ['latestSnapshot'],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_snapshots')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single()
      return data
    },
  })

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wealth Management</h1>
        <p className="text-gray-500">Dein Vermögensüberblick</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="stat-label">Nettovermögen</p>
              <p className="stat-value text-xl">{formatCurrency(snapshot?.net_worth)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="stat-label">Liquidität</p>
              <p className="stat-value text-xl">{formatCurrency(snapshot?.cash_value)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="stat-label">Immobilien</p>
              <p className="stat-value text-xl">{formatCurrency(snapshot?.property_value)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="stat-label">Investments</p>
              <p className="stat-value text-xl">{formatCurrency(snapshot?.investment_value)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/wealth/properties" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900">Immobilien</h3>
          <p className="text-sm text-gray-500 mt-1">Portfolio verwalten</p>
        </a>
        <a href="/wealth/accounts" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900">Konten</h3>
          <p className="text-sm text-gray-500 mt-1">Bankkonten übersicht</p>
        </a>
        <a href="/wealth/loans" className="card hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900">Darlehen</h3>
          <p className="text-sm text-gray-500 mt-1">Finanzierungen</p>
        </a>
      </div>
    </div>
  )
}

export default function Wealth() {
  return (
    <Routes>
      <Route path="/" element={<WealthOverview />} />
    </Routes>
  )
}
