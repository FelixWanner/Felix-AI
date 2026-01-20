import { Routes, Route } from 'react-router-dom'

function HealthOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Health</h1>
        <p className="text-gray-500">Habits, Training und Ernährung</p>
      </div>

      <div className="card">
        <p className="text-gray-500 text-center py-8">
          Health Module kommt bald...
        </p>
      </div>
    </div>
  )
}

export default function Health() {
  return (
    <Routes>
      <Route path="/" element={<HealthOverview />} />
    </Routes>
  )
}
