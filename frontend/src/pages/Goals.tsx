import { Routes, Route } from 'react-router-dom'

function GoalsOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Goals & OKRs</h1>
        <p className="text-gray-500">Ziele und Key Results verwalten</p>
      </div>

      <div className="card">
        <p className="text-gray-500 text-center py-8">
          Goals Module kommt bald...
        </p>
      </div>
    </div>
  )
}

export default function Goals() {
  return (
    <Routes>
      <Route path="/" element={<GoalsOverview />} />
    </Routes>
  )
}
