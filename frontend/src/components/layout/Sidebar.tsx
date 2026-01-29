import { Fragment } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  HomeIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  FlagIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon,
  CreditCardIcon,
  ChartBarIcon,
  InboxIcon,
  CalendarIcon,
  TicketIcon,
  SparklesIcon,
  BeakerIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
]

const modules = [
  {
    name: 'Wealth',
    color: 'text-wealth',
    items: [
      { name: 'Overview', href: '/wealth', icon: BanknotesIcon },
      { name: 'Immobilien', href: '/wealth/properties', icon: BuildingOffice2Icon },
      { name: 'Konten', href: '/wealth/accounts', icon: CreditCardIcon },
      { name: 'Kredite', href: '/wealth/loans', icon: BanknotesIcon },
      { name: 'Investments', href: '/wealth/investments', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Productivity',
    color: 'text-productivity',
    items: [
      { name: 'Overview', href: '/productivity', icon: ClipboardDocumentListIcon },
      { name: 'Inbox', href: '/productivity/inbox', icon: InboxIcon },
      { name: 'Aufgaben', href: '/productivity/tasks', icon: ClipboardDocumentListIcon },
      { name: 'Termine', href: '/productivity/meetings', icon: CalendarIcon },
      { name: 'Tickets', href: '/productivity/tickets', icon: TicketIcon },
    ],
  },
  {
    name: 'Health',
    color: 'text-health',
    items: [
      { name: 'Overview', href: '/health', icon: HeartIcon },
      { name: 'Habits', href: '/health/habits', icon: SparklesIcon },
      { name: 'Ernährung', href: '/health/nutrition', icon: HeartIcon },
      { name: 'Supplements', href: '/health/supplements', icon: BeakerIcon },
      { name: 'Training', href: '/health/training', icon: BoltIcon },
    ],
  },
  {
    name: 'Goals',
    color: 'text-goals',
    items: [
      { name: 'Overview', href: '/goals', icon: FlagIcon },
      { name: 'OKRs', href: '/goals/okrs', icon: FlagIcon },
      { name: 'Journal', href: '/goals/journal', icon: ClipboardDocumentListIcon },
      { name: 'Reviews', href: '/goals/reviews', icon: CalendarIcon },
    ],
  },
]

function SidebarContent() {
  const location = useLocation()

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
          Life OS
        </span>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {/* Main navigation */}
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    end
                    className={({ isActive }) =>
                      clsx(
                        isActive
                          ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                      )
                    }
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>

          {/* Modules */}
          {modules.map((module) => (
            <li key={module.name}>
              <div className={clsx('text-xs font-semibold leading-6', module.color)}>
                {module.name}
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {module.items.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      end={item.href === `/wealth` || item.href === `/productivity` || item.href === `/health` || item.href === `/goals`}
                      className={({ isActive }) =>
                        clsx(
                          isActive
                            ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                          'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          ))}

          {/* Settings at bottom */}
          <li className="mt-auto">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                clsx(
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                  'group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                )
              }
            >
              <Cog6ToothIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
              Einstellungen
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  // Mobile sidebar (with dialog)
  if (typeof open !== 'undefined' && onClose) {
    return (
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    )
  }

  // Desktop sidebar (static)
  return <SidebarContent />
}
