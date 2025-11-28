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
  ServerStackIcon,
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
    { name: 'Utilisateurs', href: '/dashboard/utilisateurs', icon: UsersIcon },
    { name: 'Rapports', href: '/dashboard/rapports', icon: ChartBarIcon },
    { name: 'Audit Trail', href: '/dashboard/audit', icon: DocumentTextIcon, adminOnly: true },
    { name: 'Monitoring', href: '/dashboard/monitoring', icon: ServerStackIcon, superOnly: true },
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
