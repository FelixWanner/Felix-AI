import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  ListTodo,
  Heart,
  Target,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Wealth', href: '/wealth', icon: Wallet },
  { name: 'Productivity', href: '/productivity', icon: ListTodo },
  { name: 'Health', href: '/health', icon: Heart },
  { name: 'Goals', href: '/goals', icon: Target },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Life OS</span>
          </Link>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Link
            to="/settings"
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-4 text-lg font-semibold">Life OS</span>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
