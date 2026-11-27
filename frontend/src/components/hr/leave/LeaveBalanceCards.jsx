import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  HeartPulse,
  Coffee,
  Baby,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

export default function LeaveBalanceCards({ balance, onApplyClick }) {
  const { t } = useTranslation();

  // Annual Leave calculations
  const annualTotal = (balance?.annualLeave?.annualTotalEntitlement ?? 16) + (balance?.carriedForwardDays ?? 0);
  const annualRemaining = balance?.annualLeave?.annualRemainingDays ?? balance?.annualRemainingDays ?? 16;
  const annualUsed = balance?.annualLeave?.annualUsedDays ?? balance?.annualUsedDays ?? 0;
  const annualAccrued = balance?.annualLeave?.annualAccruedDays ?? balance?.annualAccruedDays ?? 16;
  const accruedMonths = balance?.annualLeave?.accruedMonths ?? (new Date().getMonth() + 1);
  const monthlyRate = balance?.annualLeave?.monthlyAccrualRate ?? 1.33;
  const carriedForward = balance?.carriedForwardDays ?? 0;
  const annualPercent = Math.min(100, Math.round((annualUsed / (annualTotal || 1)) * 100));

  // Sick Leave calculations
  const sickTotal = balance?.sickLeave?.sickEntitlement ?? balance?.sickEntitlement ?? 15;
  const sickRemaining = balance?.sickLeave?.sickRemainingDays ?? balance?.sickRemainingDays ?? 15;
  const sickUsed = balance?.sickLeave?.sickUsedDays ?? balance?.sickUsedDays ?? 0;
  const sickPercent = Math.min(100, Math.round((sickUsed / (sickTotal || 1)) * 100));

  // Casual Leave calculations
  const casualTotal = balance?.casualLeave?.casualEntitlement ?? balance?.casualEntitlement ?? 5;
  const maxCasualPerMonth = balance?.casualLeave?.maxDaysPerMonth ?? 2;
  const casualRemaining = balance?.casualLeave?.casualRemainingDays ?? balance?.casualRemainingDays ?? 5;
  const casualUsed = balance?.casualLeave?.casualUsedDays ?? balance?.casualUsedDays ?? 0;
  const casualPercent = Math.min(100, Math.round((casualUsed / (casualTotal || 1)) * 100));

  // Maternity / Paternity
  const maternityRemaining = balance?.maternityLeave?.maternityRemainingDays ?? balance?.maternityRemainingDays ?? 120;
  const paternityRemaining = balance?.paternityLeave?.paternityRemainingDays ?? balance?.paternityRemainingDays ?? 10;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Annual Leave Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#00ced1]/50 transition-all group">
        <div>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00ced1]/10 text-[#00ced1] border border-[#00ced1]/20">
                {monthlyRate}d/mo
              </span>
              {carriedForward > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  +{carriedForward}d
                </span>
              )}
            </div>
          </div>

          <div className="mt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('hrPages.leave.annualLeave')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {annualRemaining}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                accrued ({accruedMonths}/12 mo)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#00ced1] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, 100 - annualPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Accrued: {annualAccrued}d</span>
            <span>Total: {annualTotal}d</span>
          </div>
        </div>
      </div>

      {/* 2. Sick Leave Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-rose-400/50 transition-all group">
        <div>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              Medical
            </span>
          </div>

          <div className="mt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('hrPages.leave.sickLeave')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {sickRemaining}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {t('hrPages.leave.daysLeft')} / {sickTotal}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, 100 - sickPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{t('hrPages.leave.entitled', { count: sickTotal })}</span>
            <span>{t('hrPages.leave.used', { count: sickUsed })}</span>
          </div>
        </div>
      </div>

      {/* 3. Casual Leave Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-400/50 transition-all group">
        <div>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Max {maxCasualPerMonth}d / mo
            </span>
          </div>

          <div className="mt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('hrPages.leave.casualLeave')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {casualRemaining}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {t('hrPages.leave.daysLeft')} / {casualTotal}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, 100 - casualPercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{t('hrPages.leave.entitled', { count: casualTotal })}</span>
            <span>{t('hrPages.leave.used', { count: casualUsed })}</span>
          </div>
        </div>
      </div>

      {/* 4. Maternity / Paternity / Legal Leave Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-400/50 transition-all group">
        <div>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold">
              <Baby className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
              Statutory
            </span>
          </div>

          <div className="mt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('hrPages.leave.maternityPaternity')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {maternityRemaining}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {t('hrPages.leave.days')} / {paternityRemaining}d Pat.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{t('hrPages.leave.legalMedicalNote')}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
