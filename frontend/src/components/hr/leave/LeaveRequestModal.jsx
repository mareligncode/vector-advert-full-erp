import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  Calendar,
  Clock,
  X,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { leaveService } from '../../../services/hrService';

export default function LeaveRequestModal({ isOpen, onClose, balance, onSuccess }) {
  const { t } = useTranslation();

  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startPeriod, setStartPeriod] = useState('full_day');
  const [endPeriod, setEndPeriod] = useState('full_day');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState('');
  const [isAdvanceLeave, setIsAdvanceLeave] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate balances
  const monthlyAccruedBalance = useMemo(() => {
    if (!balance) return 0;
    return balance.annualLeave?.annualRemainingDays ?? balance.annualRemainingDays ?? 16;
  }, [balance]);

  const yearlyTotalBalance = useMemo(() => {
    if (!balance) return 16;
    return Math.max(
      0,
      (balance.annualLeave?.annualTotalEntitlement ?? 16) +
        (balance.carriedForwardDays ?? 0) -
        (balance.annualLeave?.annualUsedDays ?? 0)
    );
  }, [balance]);

  const availableBalance = useMemo(() => {
    if (!balance) return 0;
    switch (leaveType) {
      case 'annual':
        return monthlyAccruedBalance;
      case 'sick':
        return balance.sickLeave?.sickRemainingDays ?? balance.sickRemainingDays ?? 15;
      case 'casual':
        return balance.casualLeave?.casualRemainingDays ?? balance.casualRemainingDays ?? 5;
      case 'maternity':
        return balance.maternityLeave?.maternityRemainingDays ?? balance.maternityRemainingDays ?? 120;
      case 'paternity':
        return balance.paternityLeave?.paternityRemainingDays ?? balance.paternityRemainingDays ?? 10;
      case 'unpaid':
      case 'other':
        return 999;
      default:
        return 0;
    }
  }, [balance, leaveType, monthlyAccruedBalance]);

  // Compute total days requested dynamically
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return 0;

    // Millisecond difference
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let total = diffDays;

    if (diffDays === 1) {
      if (startPeriod !== 'full_day' || endPeriod !== 'full_day') {
        total = 0.5;
      }
    } else {
      if (startPeriod !== 'full_day') total -= 0.5;
      if (endPeriod !== 'full_day') total -= 0.5;
    }

    return Math.max(0.5, total);
  }, [startDate, endDate, startPeriod, endPeriod]);

  // Monthly and yearly restriction checks
  const isExceedingYearly = leaveType === 'annual' && calculatedDays > yearlyTotalBalance;
  const isExceedingMonthlyAccrual = leaveType === 'annual' && calculatedDays > monthlyAccruedBalance && calculatedDays <= yearlyTotalBalance;
  const isExceedingCasualMonthly = leaveType === 'casual' && calculatedDays > 2;

  const isOverLimit = useMemo(() => {
    if (leaveType === 'unpaid' || leaveType === 'other') return false;
    if (leaveType === 'annual') {
      if (isExceedingYearly) return true;
      if (isExceedingMonthlyAccrual && !isAdvanceLeave) return true;
      return false;
    }
    if (leaveType === 'casual') {
      if (isExceedingCasualMonthly) return true;
      return calculatedDays > availableBalance;
    }
    return calculatedDays > availableBalance;
  }, [leaveType, calculatedDays, availableBalance, isExceedingYearly, isExceedingMonthlyAccrual, isAdvanceLeave, isExceedingCasualMonthly]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      setError(t('hrPages.leave.fillRequired'));
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before or equal to end date.');
      return;
    }

    if (isOverLimit) {
      setError(
        t('hrPages.leave.insufficientBalance', {
          requested: calculatedDays,
          available: availableBalance
        })
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        leaveType,
        startDate,
        endDate,
        startDayPeriod: startPeriod,
        endDayPeriod: endPeriod,
        totalLeaveDays: calculatedDays,
        isAdvanceLeave: Boolean(isAdvanceLeave),
        requestReason: reason.trim(),
        supportingAttachments: attachment ? [attachment] : []
      };

      const res = await leaveService.createRequest(payload);
      if (res.success) {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || t('hrPages.leave.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('hrPages.leave.modalTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                Submit an official time-off request for management & HR approval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Leave Type & Available Balance Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('hrPages.leave.leaveType')} *
              </label>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  isOverLimit
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-[#00ced1]/10 text-[#00ced1] border border-[#00ced1]/20'
                }`}
              >
                {t('hrPages.leave.daysLeft')}: {availableBalance === 999 ? 'Unlimited' : availableBalance}
              </span>
            </div>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#00ced1]"
            >
              <option value="annual">{t('hrPages.leave.types.annual')}</option>
              <option value="sick">{t('hrPages.leave.types.sick')}</option>
              <option value="casual">{t('hrPages.leave.types.casual')}</option>
              <option value="maternity">{t('hrPages.leave.types.maternity')}</option>
              <option value="paternity">{t('hrPages.leave.types.paternity')}</option>
              <option value="unpaid">{t('hrPages.leave.types.unpaid')}</option>
              <option value="other">{t('hrPages.leave.types.other')}</option>
            </select>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('hrPages.leave.startDate')} *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#00ced1]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('hrPages.leave.endDate')} *
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#00ced1]"
              />
            </div>
          </div>

          {/* Period Selectors (Half Day / Full Day) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('hrPages.leave.startPeriod')}
              </label>
              <select
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
              >
                <option value="full_day">{t('hrPages.leave.periods.full_day')}</option>
                <option value="morning">{t('hrPages.leave.periods.morning')}</option>
                <option value="afternoon">{t('hrPages.leave.periods.afternoon')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('hrPages.leave.endPeriod')}
              </label>
              <select
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
              >
                <option value="full_day">{t('hrPages.leave.periods.full_day')}</option>
                <option value="morning">{t('hrPages.leave.periods.morning')}</option>
                <option value="afternoon">{t('hrPages.leave.periods.afternoon')}</option>
              </select>
            </div>
          </div>

          {/* Calculated Duration Banner */}
          {calculatedDays > 0 && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                isOverLimit
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                  : 'bg-[#00ced1]/10 border-[#00ced1]/20 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00ced1]" />
                <span className="font-semibold">
                  Requested Duration: <span className="font-black text-sm">{calculatedDays}</span> day(s)
                </span>
              </div>
              {isOverLimit ? (
                <span className="text-[11px] font-bold text-rose-500">
                  {isExceedingYearly
                    ? `Exceeds yearly total by ${(calculatedDays - yearlyTotalBalance).toFixed(1)}d`
                    : isExceedingMonthlyAccrual
                    ? `Exceeds monthly accrual by ${(calculatedDays - monthlyAccruedBalance).toFixed(1)}d`
                    : isExceedingCasualMonthly
                    ? 'Exceeds monthly casual cap (max 2d)'
                    : `Exceeds balance by ${(calculatedDays - availableBalance).toFixed(1)}d`}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isAdvanceLeave ? 'Advance Leave Selected' : 'Within Balance'}
                </span>
              )}
            </div>
          )}

          {/* Monthly Restriction: Advance Request Notice & Checkbox */}
          {isExceedingMonthlyAccrual && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 text-amber-800 dark:text-amber-200 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Monthly Accrual Notice: Advance Request Required</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                You have accrued <strong>{monthlyAccruedBalance} day(s)</strong> as of this month. Your request of <strong>{calculatedDays} day(s)</strong> exceeds your current monthly accrual, but is within your yearly entitlement ({yearlyTotalBalance} days).
              </p>
              <label className="flex items-center gap-2.5 pt-1 font-bold text-amber-900 dark:text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdvanceLeave}
                  onChange={(e) => setIsAdvanceLeave(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00ced1] focus:ring-[#00ced1] cursor-pointer"
                />
                <span>Apply as Advance Leave (Requires HR Manager / CEO approval)</span>
              </label>
            </div>
          )}

          {/* Monthly Restriction: Casual Leave Monthly Cap */}
          {isExceedingCasualMonthly && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-semibold animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Monthly Restriction: Casual leave is restricted to a maximum of 2 days in a single calendar month.</span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {t('hrPages.leave.reason')} *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('hrPages.leave.reasonPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
            />
          </div>

          {/* Supporting Evidence URL / Note */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Supporting Attachment URL / File Reference (Optional)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Paperclip className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={attachment}
                  onChange={(e) => setAttachment(e.target.value)}
                  placeholder="e.g. Medical certificate URL or file reference..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || isOverLimit}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{submitting ? t('hrPages.leave.submitting') : t('hrPages.leave.submitRequest')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
