import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle({ variant = 'segmented' }) {
  const { themeMode, setThemeMode } = useTheme();
  const { t } = useTranslation();

  const options = [
    { mode: 'light', label: t('theme.light'), icon: Sun },
    { mode: 'dark', label: t('theme.dark'), icon: Moon },
    { mode: 'system', label: t('theme.system'), icon: Monitor }
  ];

  if (variant === 'compact') {
    return (
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
        {options.map(({ mode, label, icon: Icon }) => {
          const isActive = themeMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setThemeMode(mode)}
              title={label}
              type="button"
              className={`p-1 sm:p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-[#00ced1] shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = themeMode === mode;
        return (
          <button
            key={mode}
            onClick={() => setThemeMode(mode)}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              isActive
                ? 'bg-white dark:bg-slate-900 text-[#00ced1] shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00ced1]' : ''}`} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
