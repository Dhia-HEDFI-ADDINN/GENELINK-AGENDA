'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  HomeIcon,
  ClockIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@pti-calendar/design-system';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Planning', href: '/dashboard/planning', icon: CalendarIcon },
  { name: 'Rendez-vous', href: '/dashboard/rdv', icon: ClockIcon },
  { name: 'Contrôleurs', href: '/dashboard/controleurs', icon: UsersIcon },
  { name: 'Statistiques', href: '/dashboard/stats', icon: ChartBarIcon },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">PTI Calendar</h1>
                <p className="text-xs text-gray-400">Espace Pro</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-800"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-gray-800">
            <p className="text-sm font-medium text-white">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-gray-400">{user?.centre_nom}</p>
            <p className="text-xs text-primary-400 mt-1">{user?.role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-gray-800">
            <button
              onClick={logout}
              className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900">PTI Calendar</span>
        </div>
        <div className="w-10" />
      </div>
    </header>
  );
}
