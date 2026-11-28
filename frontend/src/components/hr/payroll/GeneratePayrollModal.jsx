import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { payrollService } from '../../../services/hrService';

export default function GeneratePayrollModal({ isOpen, onClose, onSuccess }) {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const now = new Date();
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const m = Number(periodMonth);
    const y = Number(periodYear);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const monthName = firstDay.toLocaleString('en-US', { month: 'long' });

    setTitle(`Payroll Batch — ${monthName} ${y}`);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
    setPaymentDate(lastDay.toISOString().split('T')[0]);
    setError('');
  }, [periodMonth, periodYear, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const res = await payrollService.generateRun({
        periodMonth: Number(periodMonth),
        periodYear: Number(periodYear),
        title: title.trim(),
        startDate,
        endDate,
        paymentDate,
        notes: notes.trim()
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to generate payroll batch');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error generating payroll batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isAmharic ? 'አዲስ ወርሃዊ የደመወዝ ስሌት (Payroll Batch)' : 'Generate Monthly Payroll Batch'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAmharic
                  ? 'የሁሉንም ሰራተኞች ደመወዝ፣ የስራ ሰዓት፣ ትርፍ ሰዓት እና ግብር በራስ-ሰር ያሰላል'
                  : 'Auto-calculates basic pay, attendance, overtime, PAYE tax, pension & loans'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAmharic ? 'ወር (Month)' : 'Period Month'}
              </label>
              <select
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white font-bold"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1, 1).toLocaleString('en-US', { month: 'long' })} ({m})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAmharic ? 'ዓመት (Year)' : 'Period Year'}
              </label>
              <input
                type="number"
                min="2020"
                max="2040"
                value={periodYear}
                onChange={(e) => setPeriodYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'የባች ስም (Batch Title)' : 'Batch Title'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAmharic ? 'መጀመሪያ ቀን' : 'Start Date'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAmharic ? 'ማብቂያ ቀን' : 'End Date'}
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAmharic ? 'የክፍያ ቀን' : 'Pay Date'}
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'ማስታወሻ' : 'Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAmharic ? 'ተጨማሪ ማስታወሻ (አማራጭ)...' : 'Optional payroll run remarks...'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Generating...' : isAmharic ? 'ስሌቱን አስጀምር' : 'Compute Payslips'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
