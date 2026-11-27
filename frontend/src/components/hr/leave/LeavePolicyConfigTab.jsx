import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sliders,
  Calendar,
  ShieldCheck,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  CalendarDays,
  HeartHandshake,
  Baby,
  Briefcase,
  Edit3,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { leaveService } from '../../../services/hrService';

// Ethiopian Calendar Month Definitions
const ETHIOPIAN_MONTHS = [
  { index: 1, am: 'መስከረም', en: 'Meskerem', season: 'Autumn (መኸር)' },
  { index: 2, am: 'ጥቅምት', en: 'Tikimt', season: 'Autumn (መኸር)' },
  { index: 3, am: 'ኅዳር', en: 'Hidar', season: 'Autumn (መኸር)' },
  { index: 4, am: 'ታኅሣሥ', en: 'Tahsas', season: 'Winter (በጋ)' },
  { index: 5, am: 'ጥር', en: 'Tir', season: 'Winter (በጋ)' },
  { index: 6, am: 'የካቲት', en: 'Yekatit', season: 'Winter (በጋ)' },
  { index: 7, am: 'መጋቢት', en: 'Megabit', season: 'Spring (በልግ)' },
  { index: 8, am: 'ሚያዝያ', en: 'Miyazya', season: 'Spring (በልግ)' },
  { index: 9, am: 'ግንቦት', en: 'Ginbot', season: 'Spring (በልግ)' },
  { index: 10, am: 'ሰኔ', en: 'Sene', season: 'Summer (ክረምት)' },
  { index: 11, am: 'ሐምሌ', en: 'Hamle', season: 'Summer (ክረምት)' },
  { index: 12, am: 'ነሐሴ', en: 'Nehase', season: 'Summer (ክረምት)' }
];

// Gregorian Months with Amharic Transliteration
const GREGORIAN_MONTHS = [
  { index: 1, am: 'ጃንዋሪ (January)', en: 'January' },
  { index: 2, am: 'ፌብሩዋሪ (February)', en: 'February' },
  { index: 3, am: 'ማርች (March)', en: 'March' },
  { index: 4, am: 'ኤፕሪል (April)', en: 'April' },
  { index: 5, am: 'ሜይ (May)', en: 'May' },
  { index: 6, am: 'ጁን (June)', en: 'June' },
  { index: 7, am: 'ጁላይ (July)', en: 'July' },
  { index: 8, am: 'ኦገስት (August)', en: 'August' },
  { index: 9, am: 'ሴፕቴምበር (September)', en: 'September' },
  { index: 10, am: 'ኦክቶበር (October)', en: 'October' },
  { index: 11, am: 'ኖቬምበር (November)', en: 'November' },
  { index: 12, am: 'ዲሴምበር (December)', en: 'December' }
];

export default function LeavePolicyConfigTab({ onConfigSaved }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Policy Form State
  const [annualEntitlementDefault, setAnnualEntitlementDefault] = useState(16);
  const [enforceMonthlyAccrual, setEnforceMonthlyAccrual] = useState(true);
  const [allowAdvanceLeave, setAllowAdvanceLeave] = useState(true);
  const [restrictProbationEmployees, setRestrictProbationEmployees] = useState(true);
  const [maxCarryForwardDays, setMaxCarryForwardDays] = useState(5);

  const [casualEntitlementDefault, setCasualEntitlementDefault] = useState(5);
  const [casualMaxDaysPerMonth, setCasualMaxDaysPerMonth] = useState(2);

  const [sickEntitlementDefault, setSickEntitlementDefault] = useState(15);
  const [maternityEntitlementDefault, setMaternityEntitlementDefault] = useState(120);
  const [paternityEntitlementDefault, setPaternityEntitlementDefault] = useState(10);
  const [compassionateEntitlementDefault, setCompassionateEntitlementDefault] = useState(3);

  // Cycle Mode: 'hire_date' (Employee registration month) | 'ethiopian_calendar' | 'gregorian_calendar'
  const [accrualCycleMode, setAccrualCycleMode] = useState('hire_date');

  // Preview helper for registration month simulation (default: 1 = registration month)
  const [previewHireMonth, setPreviewHireMonth] = useState(1);

  // Custom Monthly Schedule: Array of 12 values
  const [isCustomScheduleActive, setIsCustomScheduleActive] = useState(false);
  const [monthlySchedule, setMonthlySchedule] = useState([
    1.5, 2.5, 4.0, 5.5, 6.5, 8.0, 9.5, 10.5, 12.0, 13.5, 14.5, 16.0
  ]);

  // Fetch active configuration from backend
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getConfig();
      if (res.success && res.data) {
        const c = res.data;
        const total = c.annualEntitlementDefault ?? 16;
        setAnnualEntitlementDefault(total);
        setEnforceMonthlyAccrual(c.enforceMonthlyAccrual ?? true);
        setAllowAdvanceLeave(c.allowAdvanceLeave ?? true);
        setRestrictProbationEmployees(c.restrictProbationEmployees ?? true);
        setMaxCarryForwardDays(c.maxCarryForwardDays ?? 5);

        setCasualEntitlementDefault(c.casualEntitlementDefault ?? 5);
        setCasualMaxDaysPerMonth(c.casualMaxDaysPerMonth ?? 2);

        setSickEntitlementDefault(c.sickEntitlementDefault ?? 15);
        setMaternityEntitlementDefault(c.maternityEntitlementDefault ?? 120);
        setPaternityEntitlementDefault(c.paternityEntitlementDefault ?? 10);
        setCompassionateEntitlementDefault(c.compassionateEntitlementDefault ?? 3);

        setAccrualCycleMode(c.accrualCycleMode || 'hire_date');
        setIsCustomScheduleActive(Boolean(c.isCustomScheduleActive));

        if (Array.isArray(c.customMonthlyAccrualSchedule) && c.customMonthlyAccrualSchedule.length === 12) {
          setMonthlySchedule(c.customMonthlyAccrualSchedule);
        } else {
          // Compute default half-day progression for 12 months
          const rate = total / 12;
          const defaultSched = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            return Math.min(total, Math.round(rate * m * 2) / 2);
          });
          setMonthlySchedule(defaultSched);
        }
      }
    } catch (err) {
      console.error('Failed to load leave config:', err);
      setError(err.response?.data?.message || 'Failed to load policy configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Compute monthly rate
  const monthlyAccrualRate = useMemo(() => {
    const total = Number(annualEntitlementDefault) || 16;
    return Number((total / 12).toFixed(2));
  }, [annualEntitlementDefault]);

  // Reset/Recalculate monthly schedule from annual entitlement
  const handleAutoRecalculateSchedule = () => {
    const total = Number(annualEntitlementDefault) || 16;
    const rate = total / 12;
    const newSched = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return Math.min(total, Math.round(rate * m * 2) / 2);
    });
    setMonthlySchedule(newSched);
    setIsCustomScheduleActive(false);
  };

  // Update a single month value in schedule
  const handleMonthScheduleChange = (monthIndex, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    const updated = [...monthlySchedule];
    updated[monthIndex] = num;
    setMonthlySchedule(updated);
    setIsCustomScheduleActive(true);
  };

  // Generate table rows based on selected cycle mode
  const simulationRows = useMemo(() => {
    const total = Number(annualEntitlementDefault) || 16;
    const rate = total / 12;
    const currentMonthNum = new Date().getMonth() + 1; // 1 to 12

    return Array.from({ length: 12 }, (_, idx) => {
      const monthNum = idx + 1;
      const exact = Number((rate * monthNum).toFixed(2));
      const usable = monthlySchedule[idx] ?? Math.min(total, Math.round(rate * monthNum * 2) / 2);

      let primaryLabel = '';
      let secondaryLabel = '';

      if (accrualCycleMode === 'hire_date') {
        // Month 1 is the employee registration / hire month
        const hireBaseOffset = (previewHireMonth - 1 + idx) % 12;
        const ethMonth = ETHIOPIAN_MONTHS[hireBaseOffset];
        const gregMonth = GREGORIAN_MONTHS[hireBaseOffset];

        if (monthNum === 1) {
          primaryLabel = isAmharic ? '1ኛ ወር (የቅጥር/ምዝገባ ወር)' : 'Month 1 (Registration Month)';
        } else {
          primaryLabel = isAmharic ? `${monthNum}ኛ ወር (የስራ ዘመን)` : `Month ${monthNum} (Tenure)`;
        }
        secondaryLabel = isAmharic
          ? `የቀን መቁጠሪያ፡ ${ethMonth.am} (${gregMonth.en})`
          : `Calendar: ${ethMonth.am} / ${gregMonth.en}`;
      } else if (accrualCycleMode === 'ethiopian_calendar') {
        const eth = ETHIOPIAN_MONTHS[idx];
        primaryLabel = isAmharic ? eth.am : `${eth.en} (${eth.am})`;
        secondaryLabel = `${eth.season} • ወር ${monthNum}`;
      } else {
        const greg = GREGORIAN_MONTHS[idx];
        primaryLabel = isAmharic ? greg.am : greg.en;
        secondaryLabel = `Month ${monthNum}`;
      }

      return {
        monthNum,
        primaryLabel,
        secondaryLabel,
        exact,
        usable,
        isCurrent: accrualCycleMode === 'hire_date' ? monthNum === 1 : monthNum === currentMonthNum
      };
    });
  }, [
    annualEntitlementDefault,
    monthlySchedule,
    accrualCycleMode,
    previewHireMonth,
    isAmharic
  ]);

  // Presets
  const applyPreset = (presetType) => {
    if (presetType === 'ethiopian') {
      setAnnualEntitlementDefault(16);
      setEnforceMonthlyAccrual(true);
      setAllowAdvanceLeave(true);
      setRestrictProbationEmployees(true);
      setMaxCarryForwardDays(5);
      setCasualEntitlementDefault(5);
      setCasualMaxDaysPerMonth(2);
      setSickEntitlementDefault(15);
      setMaternityEntitlementDefault(120);
      setPaternityEntitlementDefault(10);
      setCompassionateEntitlementDefault(3);
      setAccrualCycleMode('hire_date');
      const rate = 16 / 12;
      setMonthlySchedule(Array.from({ length: 12 }, (_, i) => Math.min(16, Math.round(rate * (i + 1) * 2) / 2)));
      setIsCustomScheduleActive(false);
    } else if (presetType === 'tech') {
      setAnnualEntitlementDefault(20);
      setEnforceMonthlyAccrual(true);
      setAllowAdvanceLeave(true);
      setRestrictProbationEmployees(false);
      setMaxCarryForwardDays(7);
      setCasualEntitlementDefault(7);
      setCasualMaxDaysPerMonth(3);
      setSickEntitlementDefault(20);
      setMaternityEntitlementDefault(120);
      setPaternityEntitlementDefault(14);
      setCompassionateEntitlementDefault(5);
      setAccrualCycleMode('hire_date');
      const rate = 20 / 12;
      setMonthlySchedule(Array.from({ length: 12 }, (_, i) => Math.min(20, Math.round(rate * (i + 1) * 2) / 2)));
      setIsCustomScheduleActive(false);
    }
  };

  // Save handler
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = {
        annualEntitlementDefault: Number(annualEntitlementDefault),
        enforceMonthlyAccrual,
        allowAdvanceLeave,
        restrictProbationEmployees,
        maxCarryForwardDays: Number(maxCarryForwardDays),

        casualEntitlementDefault: Number(casualEntitlementDefault),
        casualMaxDaysPerMonth: Number(casualMaxDaysPerMonth),

        sickEntitlementDefault: Number(sickEntitlementDefault),
        maternityEntitlementDefault: Number(maternityEntitlementDefault),
        paternityEntitlementDefault: Number(paternityEntitlementDefault),
        compassionateEntitlementDefault: Number(compassionateEntitlementDefault),

        accrualCycleMode,
        isCustomScheduleActive,
        customMonthlyAccrualSchedule: monthlySchedule
      };

      const res = await leaveService.updateConfig(payload);
      if (res.success) {
        setMessage(
          isAmharic
            ? 'የፈቃድ ፖሊሲ እና ወርሃዊ የፈቃድ ስሌት ደንቦች በተሳካ ሁኔታ ተመዝግበዋል!'
            : 'Leave policy and monthly accrual rules updated successfully!'
        );
        if (onConfigSaved) onConfigSaved(res.data);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to save leave config:', err);
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'የፈቃድ ፖሊሲ ቅንብሩን መመዝገብ አልተሳካም' : 'Failed to save leave policy')
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
      {/* Header and Quick Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ced1]/20 text-[#00ced1] text-xs font-bold mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'የፈቃድ ፖሊሲ እና ወርሃዊ ደንቦች' : 'Leave Policies & Monthly Rules'}</span>
          </div>
          <h2 className="text-lg md:text-xl font-black">
            {isAmharic ? 'የፈቃድ ድልድል እና የፖሊሲ ደንቦች' : 'Leave Entitlements & Policy Rules'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {isAmharic
              ? 'የድርጅቱን ዓመታዊ ፈቃድ ድልድል፣ ከሰራተኛው ምዝገባ ወር የሚጀምር ተከታታይ ስሌት፣ የድንገተኛ ፈቃድ ገደብ እና ወርሃዊ የፈቃድ ሰንጠረዥ ያዋቅሩ።'
              : 'Configure company-wide leave entitlements, registration-month anchored accruals, monthly casual caps, and custom month-by-month schedules.'}
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('ethiopian')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00ced1]" />
            <span>{isAmharic ? 'የኢትዮጵያ የስራ አዋጅ (16 ቀናት)' : 'Labor Proclamation (16 Days)'}</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('tech')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAmharic ? 'የድርጅት ልዩ ፓኬጅ (20 ቀናት)' : 'Enterprise Package (20 Days)'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Accrual Cycle & Base Setting */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAmharic ? 'የፈቃድ ስሌት መነሻ ዑደት (Accrual Base)' : 'Accrual Starting Cycle & Calendar'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAmharic ? 'የሰራተኛው የ1ኛ ወር ፈቃድ መነሻ መቼ እንደሚሆን ይወስኑ' : 'Define when Month 1 accrual begins'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAccrualCycleMode('hire_date')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    accrualCycleMode === 'hire_date'
                      ? 'border-[#00ced1] bg-[#00ced1]/10 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-black flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#00ced1]" />
                    <span>{isAmharic ? 'የሰራተኛው ቅጥር ወር' : 'Employee Hire Month'}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isAmharic ? '1ኛ ወር ሰራተኛው ከተመዘገበበት/ከተቀጠረበት ወር ይጀምራል' : 'Month 1 starts from registration month'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccrualCycleMode('ethiopian_calendar')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    accrualCycleMode === 'ethiopian_calendar'
                      ? 'border-[#00ced1] bg-[#00ced1]/10 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-black flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAmharic ? 'የኢትዮጵያ ዘመን አቆጣጠር' : 'Ethiopian Calendar'}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isAmharic ? '1ኛ ወር ከመስከረም ይጀምራል' : 'Month 1 starts from Meskerem (መስከረም)'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccrualCycleMode('gregorian_calendar')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    accrualCycleMode === 'gregorian_calendar'
                      ? 'border-[#00ced1] bg-[#00ced1]/10 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-black flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span>{isAmharic ? 'የፈረንጆች አቆጣጠር' : 'Gregorian Calendar'}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isAmharic ? '1ኛ ወር ከጃንዋሪ ይጀምራል' : 'Month 1 starts from January'}
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Annual Leave & Monthly Accruals */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAmharic ? 'ዓመታዊ ፈቃድ እና ወርሃዊ የተጠራቀመ ስሌት ፖሊሲ' : 'Annual Leave Policy & Monthly Accruals'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAmharic ? 'መሰረታዊ ወርሃዊ ተከታታይ ስሌት፦ ' : 'Base pro-rata rate: '}
                    <span className="font-bold text-[#00ced1]">{monthlyAccrualRate} {isAmharic ? 'ቀን/ወር' : 'days/month'}</span>
                  </p>
                </div>
              </div>

              {/* Annual Entitlement Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAmharic ? 'ዓመታዊ የሚገባ ፈቃድ (ቀናት/ዓመት)' : 'Annual Entitlement (Days/Year)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    step="1"
                    value={annualEntitlementDefault}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setAnnualEntitlementDefault(val);
                      if (!isCustomScheduleActive) {
                        const rate = val / 12;
                        setMonthlySchedule(
                          Array.from({ length: 12 }, (_, i) => Math.min(val, Math.round(rate * (i + 1) * 2) / 2))
                        );
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isAmharic ? 'በስራ አዋጅ መሰረት ነባሪው 16 ቀናት ነው።' : 'Statutory baseline is 16 days.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAmharic ? 'ወደ ቀጣዩ ዓመት የሚተላለፍ ከፍተኛ ቀናት' : 'Max Carry-Forward Days'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="1"
                    value={maxCarryForwardDays}
                    onChange={(e) => setMaxCarryForwardDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isAmharic ? 'ካልተጠቀሙበት ወደ ቀጣይ ዓመት የሚዞር ጣሪያ' : 'Max unused days rolled over into next year.'}
                  </p>
                </div>
              </div>

              {/* Policy Toggles */}
              <div className="space-y-3 pt-2">
                {/* Enforce Monthly Accrual Toggle */}
                <div className="flex items-start justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAmharic ? 'ወርሃዊ ተከታታይ የተጠራቀመ ፈቃድ ስሌት አስገድድ' : 'Enforce Monthly Pro-Rata Accrual'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAmharic
                        ? 'የፈቃድ ቀናት በዓመቱ መጀመሪያ በአንድ ጊዜ ከመሰጠት ይልቅ በየወሩ ተሰልቶ እንዲሰጥ አድርግ።'
                        : 'Calculate usable leave gradually month-by-month instead of granting all days on Jan 1.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceMonthlyAccrual}
                    onChange={(e) => setEnforceMonthlyAccrual(e.target.checked)}
                    className="w-5 h-5 rounded-md accent-[#00ced1] cursor-pointer mt-0.5"
                  />
                </div>

                {/* Allow Advance Leave Toggle */}
                <div className="flex items-start justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAmharic ? 'ቅድመ-ፈቃድ (Advance Leave) ማመልከቻ ፍቀድ' : 'Allow Advance Leave Application'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAmharic
                        ? 'ሰራተኞች ገና ያልተጠራቀመ ዓመታዊ ፈቃድ በልዩ ፈቃድ ማመልከቻ እንዲጠይቁ ፍቀድ።'
                        : 'Permit staff to apply ahead for unaccrued annual days with special Advance Leave approval notice.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowAdvanceLeave}
                    onChange={(e) => setAllowAdvanceLeave(e.target.checked)}
                    className="w-5 h-5 rounded-md accent-[#00ced1] cursor-pointer mt-0.5"
                  />
                </div>

                {/* Restrict Probation Employees Toggle */}
                <div className="flex items-start justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="pr-4">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAmharic ? 'በሙከራ ጊዜ ዓመታዊ ፈቃድ ከልክል' : 'Restrict Annual Leave During Probation'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAmharic
                        ? 'የሙከራ ጊዜ ላይ ያሉ ሰራተኞች ያለ HR ልዩ ይሁንታ ዓመታዊ ፈቃድ እንዳይወስዱ ገድብ።'
                        : 'Block probationary staff from taking annual leave unless explicitly submitted or approved by HR.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={restrictProbationEmployees}
                    onChange={(e) => setRestrictProbationEmployees(e.target.checked)}
                    className="w-5 h-5 rounded-md accent-[#00ced1] cursor-pointer mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* 3. Casual Leave Policy & Monthly Cap */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAmharic ? 'የድንገተኛ ፈቃድ ፖሊሲ እና የወር ገደብ' : 'Casual Leave Policy & Monthly Cap'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAmharic ? 'በአንድ ወር የሚወሰድ የአጭር ጊዜ ድንገተኛ ፈቃድ ገደብ' : 'Short emergency leave cap per month'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAmharic ? 'ዓመታዊ የድንገተኛ ፈቃድ መጠን (ቀናት)' : 'Annual Casual Entitlement (Days)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={casualEntitlementDefault}
                    onChange={(e) => setCasualEntitlementDefault(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAmharic ? 'በአንድ ወር የሚፈቀድ ከፍተኛ ድንገተኛ ፈቃድ' : 'Max Casual Days Per Month'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={casualMaxDaysPerMonth}
                    onChange={(e) => setCasualMaxDaysPerMonth(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isAmharic ? 'በአንድ ወር ውስጥ የሚወሰደውን መጠን ይገድባል (ነባሪ፡ 2 ቀናት/ወር)።' : 'Cap per single month (Default: 2 days/month).'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Statutory & Special Leave Entitlements */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAmharic ? 'ህጋዊ እና ልዩ የፈቃድ መብቶች' : 'Statutory & Special Leave Entitlements'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAmharic ? 'የህመም፣ የወሊድ እና የሀዘን ፈቃድ ቀናት' : 'Medical, parental, and compassionate allocations'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                    <span>{isAmharic ? 'የህመም ፈቃድ ቀናት (በዓመት)' : 'Sick Leave Days (Per Year)'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={sickEntitlementDefault}
                    onChange={(e) => setSickEntitlementDefault(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Baby className="w-3.5 h-3.5 text-pink-500" />
                    <span>{isAmharic ? 'የወሊድ ፈቃድ ቀናት' : 'Maternity Leave Days'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={maternityEntitlementDefault}
                    onChange={(e) => setMaternityEntitlementDefault(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Baby className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isAmharic ? 'የአባትነት ፈቃድ ቀናት' : 'Paternity Leave Days'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={paternityEntitlementDefault}
                    onChange={(e) => setPaternityEntitlementDefault(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isAmharic ? 'የሀዘን ፈቃድ ቀናት' : 'Compassionate Leave Days'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={compassionateEntitlementDefault}
                    onChange={(e) => setCompassionateEntitlementDefault(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#00ced1] hover:brightness-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00ced1]/20 transition-all cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? t('common.submitting')
                    : isAmharic
                    ? 'የፈቃድ ፖሊሲ ቅንብሩን መዝግብ'
                    : 'Save Leave Policy Configuration'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Editable Live Monthly Accrual Table (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-6">
              {/* Header with Title and Reset/Auto Button */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAmharic ? 'የወርሃዊ ፈቃድ ሰንጠረዥ (በHR የሚስተካከል)' : 'Monthly Accrual Table (Editable by HR)'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isAmharic
                        ? `${annualEntitlementDefault} ቀን/ዓመት (${monthlyAccrualRate} ቀን/ወር)`
                        : `${annualEntitlementDefault} days/year (${monthlyAccrualRate} d/mo)`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoRecalculateSchedule}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                  title={isAmharic ? 'በነባሪ ቀመር እንደገና አስላ' : 'Reset to default formula'}
                >
                  <RotateCcw className="w-3 h-3 text-[#00ced1]" />
                  <span>{isAmharic ? 'በቀመር አስላ' : 'Auto-Fill'}</span>
                </button>
              </div>

              {/* Hire Month Simulation Selector (When in Hire Date mode) */}
              {accrualCycleMode === 'hire_date' && (
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isAmharic ? 'የሰራተኛው የቅጥር/ምዝገባ ወር ይምረጡ፡' : 'Simulate for Hire/Registration Month:'}</span>
                    </span>
                  </div>
                  <select
                    value={previewHireMonth}
                    onChange={(e) => setPreviewHireMonth(parseInt(e.target.value, 10))}
                    className="w-full text-xs font-bold py-1.5 px-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  >
                    {ETHIOPIAN_MONTHS.map((m) => (
                      <option key={m.index} value={m.index}>
                        {m.index}ኛ ወር - {m.am} ({m.en})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    {isAmharic
                      ? `ሰራተኛው በ${ETHIOPIAN_MONTHS[previewHireMonth - 1]?.am} ሲቀጠር 1ኛ ወር ${ETHIOPIAN_MONTHS[previewHireMonth - 1]?.am} ይሆናል።`
                      : `When hired in ${ETHIOPIAN_MONTHS[previewHireMonth - 1]?.am}, Month 1 starts in that month.`}
                  </p>
                </div>
              )}

              {/* Informational banner */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <Info className="w-4 h-4 shrink-0 text-[#00ced1] mt-0.5" />
                <span>
                  {isAmharic
                    ? 'የHR ስራ አስኪያጅ ወይም ኦፊሰር ለእያንዳንዱ ወር የሚገባውን የፈቃድ መጠን በቀጥታ በሰንጠረዡ ውስጥ ማስተካከል ይችላሉ።'
                    : 'HR Managers & Officers can directly edit usable days for each month in the table below.'}
                </span>
              </div>

              {/* Editable Simulation Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">{isAmharic ? 'ወር / የጊዜ ሰሌዳ' : 'Month / Schedule'}</th>
                      <th className="py-2.5 px-2 text-right">{isAmharic ? 'ትክክለኛ' : 'Exact'}</th>
                      <th className="py-2.5 px-3 text-right">{isAmharic ? 'የሚገባው (ሊቀየር የሚችል)' : 'Usable (Editable)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {simulationRows.map((row, idx) => (
                      <tr
                        key={row.monthNum}
                        className={`transition-colors ${
                          row.isCurrent
                            ? 'bg-[#00ced1]/10 font-bold text-slate-900 dark:text-white'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                          {row.monthNum}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                            <span>{row.primaryLabel}</span>
                            {row.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-[#00ced1] text-slate-950 uppercase tracking-wider">
                                {isAmharic ? 'አሁን' : 'NOW'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {row.secondaryLabel}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 font-mono text-[10px]">
                          {row.exact}d
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              min="0"
                              max={annualEntitlementDefault * 2}
                              step="0.5"
                              value={row.usable}
                              onChange={(e) => handleMonthScheduleChange(idx, e.target.value)}
                              className="w-16 px-2 py-1 text-right text-xs font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#00ced1] focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                            />
                            <span className="text-[10px] text-slate-400">d</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Status Note */}
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px]">
                <strong>{isAmharic ? 'የፖሊሲ ደንብ፦' : 'Policy Rule:'}</strong>{' '}
                {isAmharic
                  ? 'ሰራተኛው በሰራበት ወር ከተጠራቀመለት ፈቃድ በላይ ሲጠይቅ የቅድመ-ፈቃድ (Advance Leave) ማጽደቂያ ሂደት ይጀምራል።'
                  : 'If an employee applies for more than their current month accrued balance, it triggers the Advance Leave Approval Workflow.'}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
