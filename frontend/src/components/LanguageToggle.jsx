import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language || 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'am' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      type="button"
      title={t('lang.switch')}
      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#00ced1] dark:hover:border-[#00ced1] text-xs font-semibold shadow-xs transition-all duration-200 shrink-0 cursor-pointer"
    >
      <Globe className="w-3.5 h-3.5 text-[#00ced1] shrink-0" />
      <span className="hidden sm:inline">{currentLang === 'en' ? 'English (EN)' : 'አማርኛ (AM)'}</span>
      <span className="sm:hidden font-bold">{currentLang === 'en' ? 'EN' : 'አማ'}</span>
    </button>
  );
}

