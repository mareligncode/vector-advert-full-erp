import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b12] gap-4">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-3 border-[#00ced1]/20 border-t-[#00ced1] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-[#00ced1]">
            V
          </div>
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Enforce password change on first login when user has a temporary password
  if (user?.mustChangePassword) {
    if (location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }
  } else if (location.pathname === '/change-password') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}
