import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LogOut,
  User as UserIcon,
  Users,
  Shield,
  UserPlus,
  Menu,
  X,
  LayoutDashboard,
  Sparkles,
  Clock,
  CalendarCheck,
  Zap,
  MapPin,
  Briefcase,
  GraduationCap,
  Banknote,
  Award,
  BookOpen,
  FileSpreadsheet,
  PanelLeft,
  Layers
} from 'lucide-react';
import VectorLogo from './VectorLogo';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const CAN_REGISTER_ROLES = ['superadmin', 'ceo', 'cao', 'coo', 'hrmanager', 'hrofficer'];

const HR_NAV_ITEMS = [
  { to: '/hr', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/hr/employees', label: 'Employees', icon: Users },
  { to: '/hr/attendance', label: 'Attendance', icon: Clock },
  { to: '/hr/leave', label: 'Leave', icon: CalendarCheck },
  { to: '/hr/overtime', label: 'Overtime', icon: Zap },
  { to: '/hr/field-visits', label: 'Field Visits', icon: MapPin },
  { to: '/hr/recruitment', label: 'Recruitment', icon: Briefcase },
  { to: '/hr/internships', label: 'Internships', icon: GraduationCap },
  { to: '/hr/payroll', label: 'Payroll', icon: Banknote },
  { to: '/hr/clearance', label: 'Clearance', icon: LogOut },
  { to: '/hr/training', label: 'Training', icon: Award },
  { to: '/hr/upgrades', label: 'Upgrades', icon: BookOpen },
  { to: '/hr/plans', label: 'Plans', icon: FileSpreadsheet }
];

export default function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { isCollapsed, toggleCollapse, toggleMobile, openMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const isAuthorizedToRegister = user?.roles?.some((r) => CAN_REGISTER_ROLES.includes(r));

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#070b12]/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo + Sidebar Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleMobile();
                } else {
                  toggleCollapse();
                }
              }}
              className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand ERP Modules Sidebar' : 'Collapse ERP Modules Sidebar'}
              aria-label="Toggle ERP Modules Sidebar"
            >
              <PanelLeft className="w-5 h-5 text-[#00ced1]" />
            </button>
          )}

          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="flex items-center gap-2 shrink-0 max-w-[65%] xs:max-w-none overflow-hidden"
          >
            <VectorLogo size="sm" />
          </Link>
        </div>

        {/* Desktop Controls (md and up) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <LanguageToggle />
          <ThemeToggle variant="compact" />

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              {/* HR Portal Shortcut */}
              <Link
                to="/hr"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer whitespace-nowrap"
                title="Access Vector HR Subsystem"
              >
                <Users className="w-3.5 h-3.5 text-[#00ced1]" />
                <span>HR Portal</span>
              </Link>

              {/* Executive / HR Staff Registration Shortcut */}
              {isAuthorizedToRegister && (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm shadow-[#00ced1]/30 hover:brightness-95 transition-all cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: '#00ced1', color: '#020617' }}
                  title="Provision users & staff accounts"
                >
                  <UserPlus className="w-3.5 h-3.5" style={{ color: '#020617' }} />
                  <span style={{ color: '#020617' }}>Register Staff</span>
                </Link>
              )}

              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
                  {user?.email}
                </span>
                <span className="text-[10px] text-[#00ced1] font-semibold flex items-center gap-1 justify-end">
                  <Shield className="w-2.5 h-2.5" />
                  {t(`roles.${user?.roles?.[0]}`, user?.roles?.[0] || 'Employee')}
                </span>
              </div>

              <button
                onClick={handleLogout}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-900/40 transition-all duration-200 cursor-pointer"
                title={t('nav.logout')}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link
                to="/login"
                className="text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm shadow-[#00ced1]/30 hover:brightness-95 transition-all whitespace-nowrap cursor-pointer"
                style={{ backgroundColor: '#00ced1', color: '#020617' }}
              >
                <span style={{ color: '#020617' }}>{t('nav.login')}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Action Controls & Hamburger (below md) */}
        <div className="flex md:hidden items-center gap-1.5">
          <ThemeToggle variant="compact" />

          {/* Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00ced1]/40 transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-[#00ced1]" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* HR Subsystem Tab Menu Ribbon - Attached directly to header with zero gap */}
      {isAuthenticated && location.pathname.startsWith('/hr') && (
        <div className="w-full border-t border-slate-200/70 dark:border-slate-800/80 bg-white/95 dark:bg-[#0e1626]/95">
          <div className="w-full px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
              {HR_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#00ced1] text-[#020617] shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152238] hover:text-[#00ced1]'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0e1626] shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
            {isAuthenticated ? (
              <>
                {/* User Info Card in Drawer */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0 font-black text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user?.email}
                      </p>
                      <span className="text-[10px] text-[#00ced1] font-semibold flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        {t(`roles.${user?.roles?.[0]}`, user?.roles?.[0] || 'Employee')}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                    Active
                  </span>
                </div>

                {/* ERP Modules Quick Opener */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openMobile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-[#00ced1]/10 hover:bg-[#00ced1]/20 border border-[#00ced1]/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#00ced1]" />
                    <span>View 12 ERP Modules</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00ced1] text-[#020617]">
                    12 Modules
                  </span>
                </button>

                {/* Navigation Links */}
                <div className="space-y-1.5">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-[#00ced1] transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#00ced1]" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/hr"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-[#00ced1] transition-colors"
                  >
                    <Users className="w-4 h-4 text-[#00ced1]" />
                    <span>HR Portal</span>
                  </Link>

                  {isAuthorizedToRegister && (
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
                      style={{ backgroundColor: '#00ced1', color: '#020617' }}
                    >
                      <UserPlus className="w-4 h-4" style={{ color: '#020617' }} />
                      <span style={{ color: '#020617' }}>Register Staff</span>
                    </Link>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <LanguageToggle />
                  <button
                    onClick={handleLogout}
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center text-xs font-bold rounded-xl shadow-sm transition-all"
                  style={{ backgroundColor: '#00ced1', color: '#020617' }}
                >
                  <span style={{ color: '#020617' }}>{t('nav.login')}</span>
                </Link>
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-center">
                  <LanguageToggle />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
