import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { payrollService } from '../../../services/hrService';

export default function SalaryStructureModal({ isOpen, onClose, employee, onSuccess }) {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [baseSalary, setBaseSalary] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [branch, setBranch] = useState('');

  const [isOvertimeEligible, setIsOvertimeEligible] = useState(true);
  const [isPensionEligible, setIsPensionEligible] = useState(true);
  const [isTaxExempt, setIsTaxExempt] = useState(false);

  const [earnings, setEarnings] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && employee) {
      const loadStructure = async () => {
        try {
          setLoading(true);
          setError('');
          const res = await payrollService.getEmployeeStructure(employee._id);
          if (res.success && res.data) {
            const s = res.data;
            setBaseSalary(s.baseSalary ?? employee.basicSalary ?? 0);
            setPaymentMethod(s.paymentMethod || 'bank_transfer');
            setBankName(s.bankAccount?.bankName || '');
            setAccountNumber(s.bankAccount?.accountNumber || '');
            setHolderName(s.bankAccount?.holderName || '');
            setBranch(s.bankAccount?.branch || '');
            setIsOvertimeEligible(s.isOvertimeEligible ?? true);
            setIsPensionEligible(s.isPensionEligible ?? true);
            setIsTaxExempt(s.isTaxExempt ?? false);
            setEarnings(Array.isArray(s.earnings) ? s.earnings : []);
            setDeductions(Array.isArray(s.deductions) ? s.deductions : []);
            setNotes(s.notes || '');
          }
        } catch (err) {
          console.error(err);
          setBaseSalary(employee.basicSalary || 0);
        } finally {
          setLoading(false);
        }
      };
      loadStructure();
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const fullName = [employee.name?.first, employee.name?.middle, employee.name?.last]
    .filter(Boolean)
    .join(' ');

  const addEarning = () => {
    setEarnings([
      ...earnings,
      { title: 'Transport Allowance', amount: 0, isTaxable: false, taxExemptLimit: 2200, isRecurring: true }
    ]);
  };

  const removeEarning = (idx) => {
    setEarnings(earnings.filter((_, i) => i !== idx));
  };

  const updateEarning = (idx, field, val) => {
    const copy = [...earnings];
    copy[idx] = { ...copy[idx], [field]: val };
    setEarnings(copy);
  };

  const addDeduction = () => {
    setDeductions([
      ...deductions,
      { title: 'Cost Sharing / Savings', amount: 0, deductionType: 'fixed', percentageRate: 0, isPreTax: false, isRecurring: true }
    ]);
  };

  const removeDeduction = (idx) => {
    setDeductions(deductions.filter((_, i) => i !== idx));
  };

  const updateDeduction = (idx, field, val) => {
    const copy = [...deductions];
    copy[idx] = { ...copy[idx], [field]: val };
    setDeductions(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        employeeId: employee._id,
        baseSalary: Number(baseSalary) || 0,
        paymentMethod,
        bankAccount: {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          holderName: holderName.trim(),
          branch: branch.trim()
        },
        isOvertimeEligible,
        isPensionEligible,
        isTaxExempt,
        earnings: earnings.map((er) => ({
          title: er.title,
          amount: Number(er.amount) || 0,
          isTaxable: Boolean(er.isTaxable),
          taxExemptLimit: Number(er.taxExemptLimit) || 0,
          isRecurring: er.isRecurring ?? true
        })),
        deductions: deductions.map((d) => ({
          title: d.title,
          amount: Number(d.amount) || 0,
          deductionType: d.deductionType || 'fixed',
          percentageRate: Number(d.percentageRate) || 0,
          isPreTax: Boolean(d.isPreTax),
          isRecurring: d.isRecurring ?? true
        })),
        notes: notes.trim()
      };

      const res = await payrollService.upsertStructure(payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to save salary structure');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving salary structure');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAllowances = earnings.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const estGross = (Number(baseSalary) || 0) + totalAllowances;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isAmharic ? 'የደመወዝ አወቃቀር (Salary Structure)' : 'Employee Salary Structure'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {fullName} ({employee.employeeNumber}) • {employee.department}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading salary structure...</div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Base Salary & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAmharic ? 'መነሻ ደመወዝ (ብር) *' : 'Basic Salary (ETB) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white font-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAmharic ? 'የክፍያ ዘዴ' : 'Payment Method'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white font-bold"
                  >
                    <option value="bank_transfer">{isAmharic ? 'የባንክ ዝውውር (Bank Transfer)' : 'Bank Transfer'}</option>
                    <option value="cash">{isAmharic ? 'በጥሬ ገንዘብ (Cash)' : 'Cash'}</option>
                    <option value="cheque">{isAmharic ? 'በቼክ (Cheque)' : 'Cheque'}</option>
                  </select>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {isAmharic ? 'ግምታዊ ወርሃዊ ጠቅላላ' : 'Est. Monthly Gross'}
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {estGross.toLocaleString()} {isAmharic ? 'ብር' : 'ETB'}
                  </span>
                </div>
              </div>

              {/* Statutory Toggles */}
              <div className="flex flex-wrap gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={isPensionEligible}
                    onChange={(e) => setIsPensionEligible(e.target.checked)}
                    className="w-4 h-4 accent-[#00ced1]"
                  />
                  <span>{isAmharic ? 'ለጡረታ ብቁ (7% / 11%)' : 'Pension Eligible (7% / 11%)'}</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={isOvertimeEligible}
                    onChange={(e) => setIsOvertimeEligible(e.target.checked)}
                    className="w-4 h-4 accent-[#00ced1]"
                  />
                  <span>{isAmharic ? 'ለትርፍ ሰዓት ክፍያ ብቁ' : 'Overtime Eligible'}</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={isTaxExempt}
                    onChange={(e) => setIsTaxExempt(e.target.checked)}
                    className="w-4 h-4 accent-[#00ced1]"
                  />
                  <span>{isAmharic ? 'ከገቢ ግብር ነጻ' : 'Income Tax Exempt'}</span>
                </label>
              </div>

              {/* Bank Account */}
              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="font-black text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Bank Disbursement Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Bank Name (e.g. CBE)"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                    />
                    <input
                      type="text"
                      placeholder="Branch Name"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                    />
                  </div>
                </div>
              )}

              {/* Earnings / Allowances Builder */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-500 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <TrendingUp className="w-4 h-4" />
                    <span>Recurring Allowances & Earnings</span>
                  </span>
                  <button
                    type="button"
                    onClick={addEarning}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 font-black hover:bg-emerald-500/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Allowance</span>
                  </button>
                </div>

                {earnings.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-800"
                  >
                    <input
                      type="text"
                      placeholder="Allowance Title"
                      value={item.title}
                      onChange={(e) => updateEarning(idx, 'title', e.target.value)}
                      className="col-span-5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => updateEarning(idx, 'amount', e.target.value)}
                      className="col-span-3 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold"
                    />
                    <label className="col-span-3 flex items-center gap-1.5 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={item.isTaxable}
                        onChange={(e) => updateEarning(idx, 'isTaxable', e.target.checked)}
                        className="accent-[#00ced1]"
                      />
                      <span>Taxable</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeEarning(idx)}
                      className="col-span-1 text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Deductions Builder */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-rose-500 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <TrendingDown className="w-4 h-4" />
                    <span>Recurring Custom Deductions</span>
                  </span>
                  <button
                    type="button"
                    onClick={addDeduction}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-500 font-black hover:bg-rose-500/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Deduction</span>
                  </button>
                </div>

                {deductions.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-800"
                  >
                    <input
                      type="text"
                      placeholder="Deduction Title"
                      value={item.title}
                      onChange={(e) => updateDeduction(idx, 'title', e.target.value)}
                      className="col-span-5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                    />
                    <select
                      value={item.deductionType}
                      onChange={(e) => updateDeduction(idx, 'deductionType', e.target.value)}
                      className="col-span-3 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                    >
                      <option value="fixed">Fixed (ETB)</option>
                      <option value="percentage">% of Base</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Value"
                      value={item.deductionType === 'percentage' ? item.percentageRate : item.amount}
                      onChange={(e) =>
                        updateDeduction(
                          idx,
                          item.deductionType === 'percentage' ? 'percentageRate' : 'amount',
                          e.target.value
                        )
                      }
                      className="col-span-3 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => removeDeduction(idx)}
                      className="col-span-1 text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-6 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Salary Structure'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
