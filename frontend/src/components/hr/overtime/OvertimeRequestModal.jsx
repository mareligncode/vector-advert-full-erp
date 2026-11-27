import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Clock,
  Calendar,
  Zap,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Sun,
  Moon,
  CalendarDays,
  PartyPopper
} from 'lucide-react';
import { overtimeService } from '../../../services/hrService';

export default function OvertimeRequestModal({ isOpen, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [requestDate, setRequestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('20:30');
  const [overtimeType, setOvertimeType] = useState('normal_day');
  const [requestReason, setRequestReason] = useState('');
  const [advanceApprovalRequired, setAdvanceApprovalRequired] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeConfig, setActiveConfig] = useState(null);

  // Fetch active config for multipliers
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await overtimeService.getConfig();
        if (res.success && res.data) {
          setActiveConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to load overtime config:', err);
      }
    };
    if (isOpen) fetchConfig();
  }, [isOpen]);

  // Calculate duration between startTime and endTime
  const totalHours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let startTotalMins = startH * 60 + startM;
    let endTotalMins = endH * 60 + endM;

    // Handle overnight shifts across midnight
    if (endTotalMins < startTotalMins) {
      endTotalMins += 24 * 60;
    }

    const diffMins = endTotalMins - startTotalMins;
    if (diffMins <= 0) return 0;
    return Number((diffMins / 60).toFixed(1));
  }, [startTime, endTime]);

  // Rate multiplier based on selected category
  const rateMultiplier = useMemo(() => {
    if (!activeConfig) {
      if (overtimeType === 'night_shift') return 1.5;
      if (overtimeType === 'weekend') return 2.0;
      if (overtimeType === 'public_holiday') return 2.5;
      return 1.25;
    }
    switch (overtimeType) {
      case 'night_shift':
        return activeConfig.nightShiftMultiplier || 1.5;
      case 'weekend':
        return activeConfig.weekendMultiplier || 2.0;
      case 'public_holiday':
        return activeConfig.holidayMultiplier || 2.5;
      case 'normal_day':
      default:
        return activeConfig.dayShiftMultiplier || 1.25;
    }
  }, [overtimeType, activeConfig]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestDate || !startTime || !endTime || !requestReason.trim()) {
      setError(
        isAmharic
          ? 'እባክዎ ሁሉንም አስፈላጊ ክፍሎች ይሙሉ'
          : 'Please fill in all required fields'
      );
      return;
    }

    if (totalHours < 0.5) {
      setError(
        isAmharic
          ? 'የትርፍ ሰዓት ቆይታ ቢያንስ 30 ደቂቃ (0.5 ሰዓት) መሆን አለበት'
          : 'Overtime duration must be at least 30 minutes (0.5 hrs)'
      );
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        requestDate,
        startTime,
        endTime,
        totalHours,
        overtimeType,
        rateMultiplier,
        requestReason: requestReason.trim(),
        advanceApprovalRequired
      };

      const res = await overtimeService.createRequest(payload);
      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'የትርፍ ሰዓት ጥያቄ ማቅረብ አልተሳካም' : 'Failed to submit overtime request')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAmharic ? 'የትርፍ ሰዓት ማመልከቻ አቅርብ' : 'Apply for Overtime'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAmharic ? 'ተጨማሪ የስራ ሰዓት እና የፈረቃ ጥያቄ ይመዝግቡ' : 'Submit extra hours for multi-stage approval'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Overtime Category / Rate Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isAmharic ? 'የትርፍ ሰዓት አይነት እና ህጋዊ ተመን' : 'Overtime Category & Rate Multiplier'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Normal Working Day */}
              <button
                type="button"
                onClick={() => setOvertimeType('normal_day')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  overtimeType === 'normal_day'
                    ? 'border-[#00ced1] bg-[#00ced1]/10 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    1.25x
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight">
                  {isAmharic ? 'መደበኛ የስራ ቀን' : 'Normal Day'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">06:00 AM - 10:00 PM</p>
              </button>

              {/* Night Shift */}
              <button
                type="button"
                onClick={() => setOvertimeType('night_shift')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  overtimeType === 'night_shift'
                    ? 'border-[#00ced1] bg-[#00ced1]/10 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    1.50x
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight">
                  {isAmharic ? 'የሌሊት ፈረቃ' : 'Night Shift'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">10:00 PM - 06:00 AM</p>
              </button>

              {/* Weekend / Rest Day */}
              <button
                type="button"
                onClick={() => setOvertimeType('weekend')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  overtimeType === 'weekend'
                    ? 'border-[#00ced1] bg-[#00ced1]/10 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <CalendarDays className="w-4 h-4 text-purple-500" />
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    2.00x
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight">
                  {isAmharic ? 'የሳምንት እረፍት ቀን' : 'Weekly Rest Day'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isAmharic ? 'ቅዳሜ / እሁድ' : 'Weekend'}
                </p>
              </button>

              {/* Public Holiday */}
              <button
                type="button"
                onClick={() => setOvertimeType('public_holiday')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  overtimeType === 'public_holiday'
                    ? 'border-[#00ced1] bg-[#00ced1]/10 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <PartyPopper className="w-4 h-4 text-rose-500" />
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    2.50x
                  </span>
                </div>
                <p className="text-xs font-bold leading-tight">
                  {isAmharic ? 'የህዝብ በዓል ቀን' : 'Public Holiday'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isAmharic ? 'ህጋዊ የበዓል ቀን' : 'National Holiday'}
                </p>
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'የትርፍ ሰዓት ቀን' : 'Overtime Date'}
            </label>
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Shift Time Window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAmharic ? 'የመጀመሪያ ሰዓት' : 'Start Time'}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAmharic ? 'የማብቂያ ሰዓት' : 'End Time'}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>
          </div>

          {/* Live Calculated Duration Pill */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                {isAmharic ? 'የተሰላ ጠቅላላ ሰዓት፡' : 'Calculated Overtime Hours:'}
              </span>
              <p className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#00ced1]" />
                <span>{totalHours} {isAmharic ? 'ሰዓት' : 'hours'}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">
                {isAmharic ? 'የተመን ብዜት፡' : 'Multiplier Rate:'}
              </span>
              <p className="text-base font-black text-amber-500">
                {rateMultiplier}x
              </p>
            </div>
          </div>

          {/* Reason / Justification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'የትርፍ ሰዓት ስራ ምክንያት እና ዝርዝር' : 'Task Reason & Justification'}
            </label>
            <textarea
              rows={3}
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder={
                isAmharic
                  ? 'የተሰራውን ወይም የሚሰራውን አጣዳፊ ስራ ምክንያት ይግለጹ...'
                  : 'Describe the specific urgent tasks or assignments handled during overtime...'
              }
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Advance Approval Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="advanceCheck"
              checked={advanceApprovalRequired}
              onChange={(e) => setAdvanceApprovalRequired(e.target.checked)}
              className="w-4 h-4 rounded-md accent-[#00ced1] cursor-pointer mt-0.5"
            />
            <label htmlFor="advanceCheck" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              {isAmharic
                ? 'ቅድመ-ይሁንታ የተጠየቀበት ስራ ነው (ለስራ ሃላፊ እና ለHR ማጽደቂያ ይተላለፋል)'
                : 'Advance authorized overtime (Submits for multi-stage Manager & HR approval)'}
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || totalHours <= 0}
              className="px-5 py-2.5 rounded-xl bg-[#00ced1] hover:brightness-95 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? isAmharic ? 'በመላክ ላይ...' : 'Submitting...'
                  : isAmharic ? 'ጥያቄውን ላክ' : 'Submit Overtime Request'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
