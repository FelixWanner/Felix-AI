import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import WealthOverview from '@/pages/wealth/Overview'

// Lazy load pages (to be implemented)
// import Productivity from '@/pages/productivity'
// import Health from '@/pages/health'
// import Goals from '@/pages/goals'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Diese Seite wird noch implementiert.
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Dashboard */}
        <Route index element={<Dashboard />} />

        {/* Wealth Module */}
        <Route path="wealth">
          <Route index element={<WealthOverview />} />
          <Route path="properties" element={<PlaceholderPage title="Immobilien" />} />
          <Route path="accounts" element={<PlaceholderPage title="Konten" />} />
          <Route path="loans" element={<PlaceholderPage title="Kredite" />} />
          <Route path="investments" element={<PlaceholderPage title="Investments" />} />
        </Route>

        {/* Productivity Module */}
        <Route path="productivity">
          <Route index element={<PlaceholderPage title="Productivity Overview" />} />
          <Route path="inbox" element={<PlaceholderPage title="Unified Inbox" />} />
          <Route path="tasks" element={<PlaceholderPage title="Aufgaben" />} />
          <Route path="meetings" element={<PlaceholderPage title="Termine" />} />
          <Route path="tickets" element={<PlaceholderPage title="Tickets" />} />
        </Route>

        {/* Health Module */}
        <Route path="health">
          <Route index element={<PlaceholderPage title="Health Overview" />} />
          <Route path="habits" element={<PlaceholderPage title="Habits" />} />
          <Route path="nutrition" element={<PlaceholderPage title="Ernährung" />} />
          <Route path="supplements" element={<PlaceholderPage title="Supplements" />} />
          <Route path="training" element={<PlaceholderPage title="Training" />} />
          <Route path="garmin" element={<PlaceholderPage title="Garmin Daten" />} />
        </Route>

        {/* Goals Module */}
        <Route path="goals">
          <Route index element={<PlaceholderPage title="Goals Overview" />} />
          <Route path="okrs" element={<PlaceholderPage title="OKRs" />} />
          <Route path="journal" element={<PlaceholderPage title="Journal" />} />
          <Route path="reviews" element={<PlaceholderPage title="Reviews" />} />
        </Route>

        {/* Settings */}
        <Route path="settings" element={<PlaceholderPage title="Einstellungen" />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
