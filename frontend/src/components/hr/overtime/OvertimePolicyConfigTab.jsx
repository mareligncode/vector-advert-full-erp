import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sliders,
  Zap,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sun,
  Moon,
  CalendarDays,
  PartyPopper,
  ShieldCheck,
  Clock,
  Info
} from 'lucide-react';
import { overtimeService } from '../../../services/hrService';

export default function OvertimePolicyConfigTab({ onConfigSaved }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [dayShiftMultiplier, setDayShiftMultiplier] = useState(1.25);
  const [nightShiftMultiplier, setNightShiftMultiplier] = useState(1.5);
  const [weekendMultiplier, setWeekendMultiplier] = useState(2.0);
  const [holidayMultiplier, setHolidayMultiplier] = useState(2.5);
  const [maxMonthlyHoursAlert, setMaxMonthlyHoursAlert] = useState(30);
  const [requireAdvanceApproval, setRequireAdvanceApproval] = useState(true);
  const [nightShiftStart, setNightShiftStart] = useState('22:00');
  const [nightShiftEnd, setNightShiftEnd] = useState('06:00');

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await overtimeService.getConfig();
      if (res.success && res.data) {
        const c = res.data;
        setDayShiftMultiplier(c.dayShiftMultiplier ?? 1.25);
        setNightShiftMultiplier(c.nightShiftMultiplier ?? 1.5);
        setWeekendMultiplier(c.weekendMultiplier ?? 2.0);
        setHolidayMultiplier(c.holidayMultiplier ?? 2.5);
        setMaxMonthlyHoursAlert(c.maxMonthlyHoursAlert ?? 30);
        setRequireAdvanceApproval(c.requireAdvanceApproval ?? true);
        setNightShiftStart(c.nightShiftStart || '22:00');
        setNightShiftEnd(c.nightShiftEnd || '06:00');
      }
    } catch (err) {
      console.error('Failed to load overtime policy:', err);
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'የትርፍ ሰዓት ፖሊሲ መጫን አልተሳካም' : 'Failed to load overtime policy')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const applyLaborProclamationPreset = () => {
    setDayShiftMultiplier(1.25);
    setNightShiftMultiplier(1.5);
    setWeekendMultiplier(2.0);
    setHolidayMultiplier(2.5);
    setMaxMonthlyHoursAlert(30);
    setRequireAdvanceApproval(true);
    setNightShiftStart('22:00');
    setNightShiftEnd('06:00');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = {
        dayShiftMultiplier: Number(dayShiftMultiplier),
        nightShiftMultiplier: Number(nightShiftMultiplier),
        weekendMultiplier: Number(weekendMultiplier),
        holidayMultiplier: Number(holidayMultiplier),
        maxMonthlyHoursAlert: Number(maxMonthlyHoursAlert),
        requireAdvanceApproval,
        nightShiftStart,
        nightShiftEnd
      };

      const res = await overtimeService.updateConfig(payload);
      if (res.success) {
        setMessage(
          isAmharic
            ? 'የትርፍ ሰዓት ፖሊሲ እና ተመኖች በተሳካ ሁኔታ ተዘምነዋል!'
            : 'Overtime policy and multiplier rates updated successfully!'
        );
        if (onConfigSaved) onConfigSaved(res.data);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'የትርፍ ሰዓት ፖሊሲን መመዝገብ አልተሳካም' : 'Failed to save overtime policy')
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="w-6 h-6 border-2 border-[#00ced1] border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-sm font-medium">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ced1]/20 text-[#00ced1] text-xs font-bold mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'የትርፍ ሰዓት ፖሊሲ እና ተመኖች' : 'Overtime Policy & Rates'}</span>
          </div>
          <h2 className="text-lg md:text-xl font-black">
            {isAmharic ? 'የትርፍ ሰዓት ተመን ብዜቶች እና ደንቦች' : 'Statutory Overtime Rates & Policy Rules'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {isAmharic
              ? 'በኢትዮጵያ የስራ አዋጅ ቁጥር 1156/2011 መሰረት የትርፍ ሰዓት ክፍያ ተመኖችን፣ የሌሊት ፈረቃ ሰዓታትን እና ወርሃዊ ጣሪያዎችን ያዋቅሩ።'
              : 'Configure legal overtime rate multipliers, night shift windows, and monthly caps according to Ethiopian Labor Proclamation No. 1156/2019.'}
          </p>
        </div>

        <button
          type="button"
          onClick={applyLaborProclamationPreset}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition-all cursor-pointer border border-white/10 self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00ced1]" />
          <span>{isAmharic ? 'የስራ አዋጅ 1156/2011 ተመን' : 'Labor Proclamation 1156/2019'}</span>
        </button>
      </div>

      {/* Notices */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rate Multipliers Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAmharic ? 'የስራ ፈረቃ ክፍያ ተመን ብዜቶች' : 'Shift Multiplier Rates'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAmharic ? 'በመደበኛ ሰዓት ተመን ላይ የሚባዛ ብዜት' : 'Multiplier applied to normal hourly rate'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Day Shift */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{isAmharic ? 'መደበኛ የቀን ፈረቃ' : 'Normal Day Shift'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">06:00 - 22:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={dayShiftMultiplier}
                    onChange={(e) => setDayShiftMultiplier(parseFloat(e.target.value) || 1.25)}
                    className="w-full px-3 py-2 text-right font-black text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                  <span className="font-bold text-xs text-slate-400">x</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAmharic ? 'የስራ አዋጅ ነባሪ፡ 1.25x' : 'Proclamation standard: 1.25x'}
                </p>
              </div>

              {/* Night Shift */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>{isAmharic ? 'የሌሊት ፈረቃ' : 'Night Shift'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">22:00 - 06:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={nightShiftMultiplier}
                    onChange={(e) => setNightShiftMultiplier(parseFloat(e.target.value) || 1.5)}
                    className="w-full px-3 py-2 text-right font-black text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                  <span className="font-bold text-xs text-slate-400">x</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAmharic ? 'የስራ አዋጅ ነባሪ፡ 1.50x' : 'Proclamation standard: 1.50x'}
                </p>
              </div>

              {/* Weekend / Rest Day */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-purple-500" />
                    <span>{isAmharic ? 'የሳምንት እረፍት ቀን' : 'Weekly Rest Day'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Weekend</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1.0"
                    max="4.0"
                    step="0.05"
                    value={weekendMultiplier}
                    onChange={(e) => setWeekendMultiplier(parseFloat(e.target.value) || 2.0)}
                    className="w-full px-3 py-2 text-right font-black text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                  <span className="font-bold text-xs text-slate-400">x</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAmharic ? 'የስራ አዋጅ ነባሪ፡ 2.00x' : 'Proclamation standard: 2.00x'}
                </p>
              </div>

              {/* Public Holiday */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <PartyPopper className="w-4 h-4 text-rose-500" />
                    <span>{isAmharic ? 'የህዝብ በዓል ቀን' : 'Public Holiday'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1.0"
                    max="5.0"
                    step="0.05"
                    value={holidayMultiplier}
                    onChange={(e) => setHolidayMultiplier(parseFloat(e.target.value) || 2.5)}
                    className="w-full px-3 py-2 text-right font-black text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                  <span className="font-bold text-xs text-slate-400">x</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAmharic ? 'የስራ አዋጅ ነባሪ፡ 2.50x' : 'Proclamation standard: 2.50x'}
                </p>
              </div>
            </div>
          </div>

          {/* Thresholds & Windows Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAmharic ? 'የሌሊት ፈረቃ ሰዓታት እና ወርሃዊ ጣሪያ' : 'Night Windows & Monthly Caps'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAmharic ? 'የሌሊት ሰዓት ክልል እና የሰራተኛ ከፍተኛ የትርፍ ሰዓት ጣሪያ' : 'Shift boundaries and safety alerts'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAmharic ? 'የሌሊት ፈረቃ መጀመሪያ' : 'Night Shift Starts'}
                </label>
                <input
                  type="time"
                  value={nightShiftStart}
                  onChange={(e) => setNightShiftStart(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAmharic ? 'የሌሊት ፈረቃ ማብቂያ' : 'Night Shift Ends'}
                </label>
                <input
                  type="time"
                  value={nightShiftEnd}
                  onChange={(e) => setNightShiftEnd(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAmharic ? 'ወርሃዊ ከፍተኛ የትርፍ ሰዓት ማስጠንቀቂያ (ሰዓት)' : 'Monthly Max Hours Alert Threshold'}
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={maxMonthlyHoursAlert}
                onChange={(e) => setMaxMonthlyHoursAlert(parseInt(e.target.value, 10) || 30)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {isAmharic
                  ? 'ሰራተኛው በወር ከዚህ ሰዓት በላይ ሲሰራ ለማኔጅመንት የማስጠንቀቂያ ምልክት ያሳያል።'
                  : 'Triggers audit warning when employee exceeds this monthly overtime limit.'}
              </p>
            </div>

            {/* Advance Approval Toggle */}
            <div className="flex items-start justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="pr-4">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {isAmharic ? 'ቅድመ-ፈቃድ ግዴታ አድርግ' : 'Require Advance Overtime Authorization'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAmharic
                    ? 'ሰራተኞች ትርፍ ሰዓት ከመስራታቸው በፊት በስራ ሃላፊያቸው ማጽደቅ አለባቸው።'
                    : 'Staff must submit for manager pre-approval before performing overtime duties.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={requireAdvanceApproval}
                onChange={(e) => setRequireAdvanceApproval(e.target.checked)}
                className="w-5 h-5 rounded-md accent-[#00ced1] cursor-pointer mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#00ced1] hover:brightness-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00ced1]/20 transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>
              {saving
                ? isAmharic ? 'በመመዝገብ ላይ...' : 'Saving...'
                : isAmharic ? 'የትርፍ ሰዓት ፖሊሲውን መዝግብ' : 'Save Overtime Policy Configuration'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
