import { Routes, Route } from 'react-router-dom'

function ProductivityOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Productivity</h1>
        <p className="text-gray-500">Aufgaben und Inbox verwalten</p>
      </div>

      <div className="card">
        <p className="text-gray-500 text-center py-8">
          Productivity Module kommt bald...
        </p>
      </div>
    </div>
  )
}

export default function Productivity() {
  return (
    <Routes>
      <Route path="/" element={<ProductivityOverview />} />
    </Routes>
  )
}
