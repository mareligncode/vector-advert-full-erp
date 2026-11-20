import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Clock,
  Users,
  Send,
  Briefcase,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  const [telegramData, setTelegramData] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unlinkSuccess, setUnlinkSuccess] = useState('');

  const fetchTelegramInfo = async () => {
    try {
      setTelegramLoading(true);
      const res = await authService.getTelegramLinkCode();
      if (res.success && res.data) {
        setTelegramData(res.data);
      }
    } catch (err) {
      console.error('Failed to get Telegram info:', err);
    } finally {
      setTelegramLoading(false);
    }
  };

  useEffect(() => {
    fetchTelegramInfo();
  }, []);

  const handleCopyLink = () => {
    if (telegramData?.deepLink) {
      navigator.clipboard.writeText(telegramData.deepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUnlink = async () => {
    try {
      setTelegramLoading(true);
      const res = await authService.unlinkTelegram();
      if (res.success) {
        setUnlinkSuccess(res.message || 'Telegram unlinked');
        await refreshUser();
        await fetchTelegramInfo();
        setTimeout(() => setUnlinkSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to unlink:', err);
    } finally {
      setTelegramLoading(false);
    }
  };

  const modules = [
    {
      title: t('dashboard.moduleAttendance'),
      icon: Clock,
      color: 'from-cyan-500 to-blue-600',
      desc: 'GPS clock-in, overtime tracking & daily logs'
    },
    {
      title: t('dashboard.moduleEmployees'),
      icon: Users,
      color: 'from-teal-500 to-emerald-600',
      desc: 'Staff profiles, departments & documents'
    },
    {
      title: t('dashboard.moduleRecruitment'),
      icon: Briefcase,
      color: 'from-blue-600 to-indigo-600',
      desc: 'Vacancies, applicants & interview scoring'
    },
    {
      title: t('dashboard.moduleOvertime'),
      icon: Sparkles,
      color: 'from-amber-500 to-orange-600',
      desc: 'Requests, multi-tier approvals & calculations'
    },
    {
      title: t('dashboard.modulePlans'),
      icon: FileSpreadsheet,
      color: 'from-purple-600 to-pink-600',
      desc: 'Strategic objectives, targets & progress'
    },
    {
      title: t('dashboard.moduleTraining'),
      icon: Award,
      color: 'from-emerald-500 to-teal-600',
      desc: 'Professional upgrades & skill development'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-white via-cyan-50/20 to-blue-50/30 dark:from-[#0e1626] dark:via-[#111c30] dark:to-[#152238] shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold text-[#008182] dark:text-[#38ded0] bg-[#00ced1]/10 border border-[#00ced1]/20 mb-3 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Vector Advert ERP 2.0</span>
          </div>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
            {t('dashboard.welcomeUser')}{' '}
            <span className="brand-gradient-text">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-base text-slate-600 dark:text-slate-300">
            {t('dashboard.subtitle')}
          </p>

          {/* User Roles & Status */}
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-2.5">
            {user?.roles?.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-[#00ced1] shrink-0" />
                {t(`roles.${role}`, role)}
              </span>
            ))}

            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {t('auth.statusActive')}
            </span>
          </div>
        </div>

        {/* Ambient Decorative Gradient in Background */}
        <div
          className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #00ced1, #0090ff)' }}
        />
      </div>

      {/* Grid: Telegram Integration Card & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Telegram Integration Card */}
        <div className="lg:col-span-1 rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-[#0090ff] flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {t('dashboard.telegramSection')}
                  </h3>
                  <span
                    className={`text-[11px] sm:text-xs font-semibold ${
                      telegramData?.isLinked || user?.telegramChatId
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {telegramData?.isLinked || user?.telegramChatId
                      ? t('dashboard.telegramConnected')
                      : t('dashboard.telegramNotConnected')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchTelegramInfo}
                disabled={telegramLoading}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${telegramLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              {t('dashboard.telegramSub')}
            </p>

            {unlinkSuccess && (
              <div className="mb-4 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl">
                {unlinkSuccess}
              </div>
            )}

            {/* If linked */}
            {telegramData?.isLinked || user?.telegramChatId ? (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 break-all">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Linked account: @{telegramData?.telegramUsername || user?.telegramUsername || 'Telegram User'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={telegramLoading}
                  className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                >
                  {t('dashboard.unlinkTelegramBtn')}
                </button>
              </div>
            ) : (
              /* If not linked */
              <div className="space-y-3">
                {telegramData?.deepLink ? (
                  <>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {t('dashboard.deepLinkNote')}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={telegramData.deepLink}
                        className="min-w-0 flex-1 px-3 py-1.5 bg-slate-100 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="shrink-0 p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#00ced1] hover:text-white transition-colors cursor-pointer"
                        title={t('common.copy')}
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <a
                      href={telegramData.deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #00ced1 0%, #0090ff 100%)'
                      }}
                    >
                      <span>{t('dashboard.linkTelegramBtn')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={fetchTelegramInfo}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white shadow-sm hover:brightness-105 transition-all cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #00ced1 0%, #0090ff 100%)'
                    }}
                  >
                    {t('dashboard.linkTelegramBtn')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick ERP Modules Grid */}
        <div className="lg:col-span-2">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t('dashboard.quickActions')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div
                  key={i}
                  className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 hover:border-[#00ced1]/60 dark:hover:border-[#00ced1]/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-200`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#00ced1] transition-colors truncate">
                        {mod.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
