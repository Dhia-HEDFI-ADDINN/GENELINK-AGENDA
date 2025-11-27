'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  GlobeAltIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  BellIcon,
} from '@pti-calendar/design-system';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin, isAdminSGS } = useAuth();

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
    { name: 'Réseaux', href: '/dashboard/reseaux', icon: GlobeAltIcon, adminOnly: true },
    { name: 'Centres', href: '/dashboard/centres', icon: BuildingOfficeIcon },
    { name: 'Utilisateurs', href: '/dashboard/users', icon: UsersIcon },
    { name: 'Tarification', href: '/dashboard/tarifs', icon: CurrencyEuroIcon },
    { name: 'Rapports', href: '/dashboard/reports', icon: DocumentTextIcon },
    { name: 'Statistiques', href: '/dashboard/stats', icon: ChartBarIcon },
    { name: 'Notifications', href: '/dashboard/notifications', icon: BellIcon },
    { name: 'Paramètres', href: '/dashboard/settings', icon: Cog6ToothIcon, superOnly: true },
  ];

  const filteredNav = navigation.filter((item) => {
    if (item.superOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isAdminSGS) return false;
    return true;
  });

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`admin-sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">PTI Admin</h1>
                <p className="text-xs text-slate-400">Console SGS</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-slate-800">
              <XMarkIcon className="h-6 w-6 text-slate-400" />
            </button>
          </div>

          {/* User */}
          <div className="px-6 py-4 border-b border-slate-800">
            <p className="text-sm font-medium text-white">{user?.prenom} {user?.nom}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-600/20 text-primary-400">
              {user?.role}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <div className="admin-nav-section">Navigation</div>
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`admin-nav-item ${isActive ? 'admin-nav-item-active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-slate-800">
            <button onClick={logout} className="admin-nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function AdminMobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <button onClick={onMenuClick} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
        <span className="font-semibold text-gray-900">PTI Admin</span>
        <div className="w-10" />
      </div>
    </header>
  );
}

// Missing icon implementations
function GlobeAltIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function CurrencyEuroIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}
