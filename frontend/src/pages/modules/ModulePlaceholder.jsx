import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2,
  Users
} from 'lucide-react';
import { ERP_MODULES } from '../../components/Sidebar';

export default function ModulePlaceholder() {
  const { t } = useTranslation();
  const location = useLocation();

  // Find module by path
  const currentModule =
    ERP_MODULES.find((m) => m.path === location.pathname) || {
      id: '--',
      name: 'Enterprise Subsystem',
      func: 'Operations and departmental resource management',
      icon: Layers,
      status: 'development'
    };

  const moduleName = currentModule.key
    ? t(`sidebar.items.${currentModule.key}.name`, currentModule.name)
    : t('modulePlaceholder.defaultName');
  const moduleFunc = currentModule.key
    ? t(`sidebar.items.${currentModule.key}.func`, currentModule.func)
    : t('modulePlaceholder.defaultFunc');

  const Icon = currentModule.icon;

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-white via-cyan-50/20 to-blue-50/30 dark:from-[#0e1626] dark:via-[#111c30] dark:to-[#152238] border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#00ced1] bg-[#00ced1]/10 border border-[#00ced1]/20">
            <span className="font-mono">{t('modulePlaceholder.moduleLabel')} {currentModule.id}</span>
            <span>&bull;</span>
            <span>{t('modulePlaceholder.brandTag')}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0 shadow-sm">
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {moduleName} {t('modulePlaceholder.moduleSuffix')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {moduleFunc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap & Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00ced1]">
            <Clock className="w-4 h-4" />
            <span>{t('modulePlaceholder.roadmapHeading')}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {t('modulePlaceholder.roadmapTitle')}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('modulePlaceholder.roadmapDesc', { name: moduleName })}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/hr"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 shadow-sm hover:brightness-95 transition-all"
              style={{ backgroundColor: '#00ced1' }}
            >
              <Users className="w-4 h-4" />
              <span>{t('modulePlaceholder.exploreHr')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            >
              <span>{t('modulePlaceholder.backDashboard')}</span>
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('modulePlaceholder.moduleStatus')}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t('modulePlaceholder.inPipeline')}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('modulePlaceholder.pipelineDesc')}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">{t('modulePlaceholder.readyModule')}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('modulePlaceholder.readyHr')}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
