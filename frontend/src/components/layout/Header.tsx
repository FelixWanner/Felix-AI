import { useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search */}
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Suchen
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 dark:text-white bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-0 sm:text-sm"
            placeholder="Suchen..."
            type="search"
            name="search"
          />
        </form>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Dark mode toggle */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            onClick={toggleDarkMode}
          >
            <span className="sr-only">Toggle dark mode</span>
            {darkMode ? (
              <SunIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <MoonIcon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-700"
            aria-hidden="true"
          />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-white"
                  aria-hidden="true"
                >
                  Admin
                </span>
              </span>
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-gray-900/5 dark:ring-gray-700 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/settings"
                      className={clsx(
                        active ? 'bg-gray-50 dark:bg-gray-700' : '',
                        'block px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
                      )}
                    >
                      Einstellungen
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={clsx(
                        active ? 'bg-gray-50 dark:bg-gray-700' : '',
                        'block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white'
                      )}
                    >
                      Abmelden
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}
