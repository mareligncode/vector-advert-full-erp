import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { payrollService } from '../../../services/hrService';

export default function LoanRequestModal({ isOpen, onClose, onSuccess }) {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [requestType, setRequestType] = useState('salary_advance');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [numberOfInstallments, setNumberOfInstallments] = useState(1);
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const monthlyInstallment =
    principalAmount && numberOfInstallments
      ? (Number(principalAmount) / Number(numberOfInstallments)).toFixed(2)
      : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!principalAmount || Number(principalAmount) <= 0) {
      setError('Please enter a valid loan/advance amount');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await payrollService.applyForLoan({
        requestType,
        amountRequested: Number(principalAmount),
        totalInstallments: Number(numberOfInstallments) || 1,
        reason: reason.trim()
      });
      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to submit loan request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting loan request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isAmharic ? 'የቅድመ ደመወዝ / ብድር መጠየቂያ' : 'Request Salary Advance / Loan'}
              </h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 cursor-pointer">
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

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'የጥያቄ ዓይነት' : 'Request Type'}
            </label>
            <select
              value={requestType}
              onChange={(e) => {
                setRequestType(e.target.value);
                if (e.target.value === 'salary_advance') setNumberOfInstallments(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white font-bold"
            >
              <option value="salary_advance">
                {isAmharic ? 'የቅድመ ደመወዝ ክፍያ (Salary Advance)' : 'Salary Advance (Next Payroll)'}
              </option>
              <option value="staff_loan">
                {isAmharic ? 'የሰራተኛ ብድር (በወራት የሚከፈል)' : 'Staff Loan (Multi-Month Installments)'}
              </option>
              <option value="emergency_loan">
                {isAmharic ? 'የአስቸኳይ ጊዜ ብድር' : 'Emergency Loan'}
              </option>
              <option value="education_loan">
                {isAmharic ? 'የትምህርት ብድር' : 'Education Loan'}
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAmharic ? 'መጠን (ብር) *' : 'Amount (ETB) *'}
              </label>
              <input
                type="number"
                required
                min="1"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] font-black"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAmharic ? 'የመክፈያ ወራት' : 'Repayment Months'}
              </label>
              <input
                type="number"
                min="1"
                max="36"
                value={numberOfInstallments}
                onChange={(e) => setNumberOfInstallments(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] font-bold"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#00ced1]/10 border border-[#00ced1]/20 flex items-center justify-between">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              {isAmharic ? 'ወርሃዊ ተቀናሽ፡' : 'Monthly Deduction:'}
            </span>
            <span className="font-black text-[#00ced1] text-sm">
              {monthlyInstallment} {isAmharic ? 'ብር / በወር' : 'ETB / mo'}
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'ምክንያት *' : 'Reason *'}
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isAmharic ? 'የቅድመ ደመወዙን ወይም የብድሩን ምክንያት ይግለጹ...' : 'Explain purpose of advance or loan...'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? (isAmharic ? 'በመላክ ላይ...' : 'Submitting...') : (isAmharic ? 'ጥያቄውን ላክ' : 'Submit Request')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
