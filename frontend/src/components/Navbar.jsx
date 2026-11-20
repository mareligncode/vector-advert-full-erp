import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';
import VectorLogo from './VectorLogo';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#070b12]/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/login'}
          className="flex items-center gap-2 shrink-0 max-w-[50%] xs:max-w-none overflow-hidden"
        >
          <VectorLogo size="sm" />
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <LanguageToggle />
          <ThemeToggle variant="compact" />

          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 sm:gap-3 pl-1 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
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
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-900/40 transition-all duration-200 cursor-pointer"
                title={t('nav.logout')}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link
                to="/login"
                className="text-xs font-bold px-2 sm:px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:text-[#00ced1] dark:hover:text-[#00ced1] transition-colors whitespace-nowrap"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-white bg-[#00ced1] hover:bg-[#00b5b8] shadow-sm shadow-[#00ced1]/30 transition-all whitespace-nowrap cursor-pointer"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
