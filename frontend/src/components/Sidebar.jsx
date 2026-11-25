import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Headphones,
  Palette,
  Printer,
  Megaphone,
  Warehouse,
  ShoppingCart,
  Scissors,
  Banknote,
  Lightbulb,
  Truck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';

export const ERP_MODULES = [
  {
    id: '01',
    key: 'hr',
    name: 'HR',
    func: 'People, payroll & attendance',
    path: '/hr',
    icon: Users,
    status: 'active'
  },
  {
    id: '02',
    key: 'frontdesk',
    name: 'Front Desk',
    func: 'Client intake & job tracking',
    path: '/front-desk',
    icon: Headphones,
    status: 'development'
  },
  {
    id: '03',
    key: 'design',
    name: 'Design',
    func: 'Briefs, proofs & approvals',
    path: '/design',
    icon: Palette,
    status: 'development'
  },
  {
    id: '04',
    key: 'machine',
    name: 'Machine',
    func: 'Press scheduling & maintenance',
    path: '/machine',
    icon: Printer,
    status: 'development'
  },
  {
    id: '05',
    key: 'marketing',
    name: 'Marketing',
    func: 'Leads, campaigns & pipeline',
    path: '/marketing',
    icon: Megaphone,
    status: 'development'
  },
  {
    id: '06',
    key: 'store',
    name: 'Store',
    func: 'Inventory & stock movements',
    path: '/store',
    icon: Warehouse,
    status: 'development'
  },
  {
    id: '07',
    key: 'purchaser',
    name: 'Purchaser',
    func: 'Suppliers, POs & procurement',
    path: '/purchaser',
    icon: ShoppingCart,
    status: 'development'
  },
  {
    id: '08',
    key: 'finishing',
    name: 'Finishing',
    func: 'Lamination, binding & QC',
    path: '/finishing',
    icon: Scissors,
    status: 'development'
  },
  {
    id: '09',
    key: 'finance',
    name: 'Finance',
    func: 'Invoices, expenses & reporting',
    path: '/finance',
    icon: Banknote,
    status: 'development'
  },
  {
    id: '10',
    key: 'creative',
    name: 'Creative',
    func: 'Concepts, assets & brand library',
    path: '/creative',
    icon: Lightbulb,
    status: 'development'
  },
  {
    id: '11',
    key: 'logistics',
    name: 'Logistics',
    func: 'Dispatch, delivery & fleet',
    path: '/logistics',
    icon: Truck,
    status: 'development'
  },
  {
    id: '12',
    key: 'it',
    name: 'IT',
    func: 'Systems, users & access control',
    path: '/it',
    icon: ShieldCheck,
    status: 'development'
  }
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={closeMobile}
        />
      )}

      {/* Main Sidebar Aside - Fixed on left directly under Header with zero menu in between */}
      <aside
        className={`fixed md:static z-30 h-full bg-white dark:bg-[#0e1626] border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between shrink-0 shadow-sm ${
          isMobileOpen
            ? 'top-0 left-0 w-72 h-screen z-50'
            : '-left-72 md:left-auto top-0 h-screen md:h-full ' +
              (isCollapsed ? 'md:w-20' : 'md:w-64 lg:w-72')
        }`}
      >
        {/* Top Header / Brand Sub-rail */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 shrink-0 transition-colors duration-200">
          <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'md:hidden' : 'flex'}`}>
            <div className="w-8 h-8 rounded-xl bg-[#00ced1]/15 text-[#008182] dark:text-[#00ced1] flex items-center justify-center shrink-0 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                {t('sidebar.title')}
              </h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block truncate">
                {t('sidebar.subtitle')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={closeMobile}
              className="md:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('sidebar.close')}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Desktop Collapse Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-[#00ced1]" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Modules Nav List - Independent scroll container */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 space-y-1 scrollbar-none">
          {/* Dashboard Home Link */}
          <NavLink
            to="/dashboard"
            onClick={closeMobile}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                isActive
                  ? 'bg-[#00ced1] text-[#020617] shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152238] hover:text-[#00ced1]'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? t('sidebar.dashboardOverview') : ''}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{t('sidebar.dashboard')}</span>}
          </NavLink>

          <div className="my-2 border-t border-slate-100 dark:border-slate-800/80" />

          {/* 12 Core Modules */}
          {ERP_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isHr = mod.id === '01';
            const isActive = location.pathname.startsWith(mod.path);
            const modName = t(`sidebar.items.${mod.key}.name`, mod.name);
            const modFunc = t(`sidebar.items.${mod.key}.func`, mod.func);

            return (
              <NavLink
                key={mod.id}
                to={mod.path}
                onClick={closeMobile}
                className={`group flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs transition-all relative ${
                  isActive
                    ? 'bg-[#00ced1] text-[#020617] font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152238] hover:text-[#00ced1]'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? `${modName} - ${modFunc}` : ''}
              >
                {/* Module Icon */}
                <Icon className="w-4 h-4 shrink-0" />

                {/* Text & Function Subtitle (Shown when Expanded) */}
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold truncate">{modName}</span>
                      {isHr ? (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase border transition-colors ${
                            isActive
                              ? 'bg-[#020617]/15 text-[#020617] border-[#020617]/20'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {t('sidebar.active')}
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold transition-colors ${
                            isActive
                              ? 'bg-[#020617]/15 text-[#020617]'
                              : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80'
                          }`}
                        >
                          {t('sidebar.soon')}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] truncate leading-tight mt-0.5 ${
                        isActive ? 'text-slate-900/80' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {modFunc}
                    </p>
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer / Status Card */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0 transition-colors duration-200">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-[#008182] dark:text-[#00ced1] shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  {t('sidebar.versionTitle')}
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{t('sidebar.versionSub')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
