import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LogOut,
  User as UserIcon,
  Shield,
  UserPlus,
  Menu,
  X,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import VectorLogo from './VectorLogo';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../context/AuthContext';

const CAN_REGISTER_ROLES = ['superadmin', 'ceo', 'cao', 'coo', 'hrmanager', 'hrofficer'];

export default function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/login'}
          className="flex items-center gap-2 shrink-0 max-w-[65%] xs:max-w-none overflow-hidden"
        >
          <VectorLogo size="sm" />
        </Link>

        {/* Desktop Controls (md and up) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <LanguageToggle />
          <ThemeToggle variant="compact" />

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              {/* Executive / HR Staff Registration Shortcut */}
              {isAuthorizedToRegister && (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-[#00ced1] hover:bg-[#00b5b8] shadow-sm shadow-[#00ced1]/30 transition-all cursor-pointer whitespace-nowrap"
                  title="Provision users & staff accounts"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Staff</span>
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
                className="text-xs font-bold px-3.5 py-1.5 rounded-xl text-slate-950 bg-[#00ced1] hover:bg-[#00b5b8] shadow-sm shadow-[#00ced1]/30 transition-all whitespace-nowrap cursor-pointer"
              >
                {t('nav.login')}
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

                  {/* Register Staff Link (if authorized) */}
                  {isAuthorizedToRegister && (
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-[#00ced1] hover:bg-[#00b5b8] shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserPlus className="w-4 h-4" />
                        <span>Register Staff / User</span>
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-wider bg-black/10 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    </Link>
                  )}
                </div>

                {/* Secondary Controls: Language */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Language
                  </span>
                  <LanguageToggle />
                </div>

                {/* Logout Button */}
                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-900/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Unauthenticated Mobile View */}
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-[#00ced1] hover:bg-[#00b5b8] shadow-sm transition-all"
                  >
                    {t('nav.login')}
                  </Link>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Language
                    </span>
                    <LanguageToggle />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
