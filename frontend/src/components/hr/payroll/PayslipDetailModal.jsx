import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Printer,
  Banknote,
  Building,
  Calendar,
  Clock,
  CheckCircle2,
  User,
  CreditCard,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import StatusBadge from '../StatusBadge';
import { payrollService } from '../../../services/hrService';

export default function PayslipDetailModal({ isOpen, onClose, payslip }) {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const [printing, setPrinting] = useState(false);

  if (!isOpen || !payslip) return null;

  const fmt = (num) =>
    Number(num || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const handlePrintHtml = async () => {
    try {
      setPrinting(true);
      const html = await payrollService.getPayslipHtml(payslip._id);
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
      }
    } catch (err) {
      console.error('Failed to open printable payslip:', err);
    } finally {
      setPrinting(false);
    }
  };

  const snap = payslip.employeeSnapshot || {};
  const att = payslip.attendanceSummary || {};
  const ot = payslip.overtimeSummary || {};
  const earn = payslip.earnings || {};
  const ded = payslip.deductions || {};
  const stat = ded.statutoryDeductions || {};
  const nonStat = ded.nonStatutoryDeductions || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-[#152238]/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {payslip.payslipNumber}
                </h2>
                <StatusBadge status={payslip.paymentStatus} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {payslip.payrollRun?.title || 'Monthly Salary Slip'} • {snap.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintHtml}
              disabled={printing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#00ced1]" />
              <span>{printing ? 'Opening...' : isAmharic ? 'አትም (Print)' : 'Print Payslip'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Employee & Bank Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{isAmharic ? 'የሰራተኛ መረጃ' : 'Employee Details'}</span>
              </div>
              <div className="font-black text-sm text-slate-900 dark:text-white">{snap.fullName}</div>
              <div className="text-slate-500 dark:text-slate-400">
                {snap.employeeNumber} • {snap.jobTitle}
              </div>
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building className="w-3 h-3" />
                <span>{snap.department}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{isAmharic ? 'የስራ ቀናት እና ትርፍ ሰዓት' : 'Worked Days & Overtime'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAmharic ? 'የሚጠበቅ / የተሰራ ቀን፡' : 'Expected / Worked:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {att.expectedWorkingDays || 0}{isAmharic ? 'ቀ' : 'd'} / {att.daysWorked || 0}{isAmharic ? 'ቀ' : 'd'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAmharic ? 'የሚከፈል / የማይከፈል ፈቃድ፡' : 'Paid / Unpaid Leave:'}</span>
                <span className="font-bold">
                  {att.paidLeaveDays || 0}{isAmharic ? 'ቀ' : 'd'} / {att.unpaidLeaveDays || 0}{isAmharic ? 'ቀ' : 'd'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAmharic ? 'ጠቅላላ ትርፍ ሰዓት፡' : 'Total Overtime:'}</span>
                <span className="font-bold text-[#00ced1]">{ot.totalOvertimeHours || 0} {isAmharic ? 'ሰዓት' : 'hrs'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                <span>{isAmharic ? 'የተጣራ ክፍያ (Net Pay)' : 'Net Take-Home Pay'}</span>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 my-1">
                {fmt(payslip.netSalary)} <span className="text-xs font-bold">ETB</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                {payslip.paymentMethod?.replace('_', ' ').toUpperCase()}
                {snap.bankAccount?.bankName ? ` • ${snap.bankAccount.bankName}` : ''}
                {snap.bankAccount?.accountNumber ? ` (${snap.bankAccount.accountNumber})` : ''}
              </div>
            </div>
          </div>

          {/* Odoo-Style Two-Column Computation: Earnings vs Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EARNINGS */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-emerald-500/10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>{isAmharic ? 'ገቢዎች እና አበሎች (Earnings)' : 'Earnings & Allowances'}</span>
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {fmt(earn.grossEarnings)} ETB
                </span>
              </div>

              <div className="p-4 space-y-2.5 bg-white dark:bg-[#0e1626]">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-300">{isAmharic ? 'መነሻ ደመወዝ (በውል)' : 'Basic Salary (Contract)'}</span>
                  <span className="font-bold">{fmt(earn.basicSalary)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-300">{isAmharic ? 'የተሰራ መነሻ ደመወዝ' : 'Earned Basic Salary (Prorated)'}</span>
                  <span className="font-bold">{fmt(earn.earnedBasicSalary)}</span>
                </div>

                {(earn.allowances || []).map((alw, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60"
                  >
                    <span className="text-slate-600 dark:text-slate-300">
                      {alw.title}{' '}
                      <span className="text-[10px] text-slate-400">
                        ({alw.isTaxable ? (isAmharic ? 'ግብር የሚከፈልበት' : 'Taxable') : (isAmharic ? 'ከግብር ነጻ' : 'Exempt')})
                      </span>
                    </span>
                    <span className="font-bold">{fmt(alw.amount)}</span>
                  </div>
                ))}

                {earn.overtimePay > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-300">
                      {isAmharic ? 'የትርፍ ሰዓት ክፍያ' : 'Overtime Pay'} ({ot.totalOvertimeHours} {isAmharic ? 'ሰዓት' : 'hrs'})
                    </span>
                    <span className="font-bold text-[#00ced1]">{fmt(earn.overtimePay)}</span>
                  </div>
                )}

                {earn.bonuses > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-300">{isAmharic ? 'ቦነስ' : 'Bonuses'}</span>
                    <span className="font-bold">{fmt(earn.bonuses)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 font-black text-slate-900 dark:text-white">
                  <span>{isAmharic ? 'ጠቅላላ ገቢ (Gross)' : 'Gross Earnings'}</span>
                  <span>{fmt(earn.grossEarnings)} {isAmharic ? 'ብር' : 'ETB'}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{isAmharic ? 'ግብር የሚታሰብበት ገቢ' : 'Taxable Income Base'}</span>
                  <span>{fmt(earn.taxableIncome)} {isAmharic ? 'ብር' : 'ETB'}</span>
                </div>
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-rose-500/10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-black text-rose-500 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" />
                  <span>{isAmharic ? 'ተቀናሾች እና ግብር (Deductions)' : 'Statutory & Other Deductions'}</span>
                </span>
                <span className="font-black text-rose-500">
                  -{fmt(ded.totalEmployeeDeductions)} ETB
                </span>
              </div>

              <div className="p-4 space-y-2.5 bg-white dark:bg-[#0e1626]">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-300">{isAmharic ? 'የኢትዮጵያ የገቢ ግብር (PAYE)' : 'Ethiopian Income Tax (PAYE)'}</span>
                  <span className="font-bold text-rose-500">-{fmt(stat.incomeTax)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-300">{isAmharic ? 'የሰራተኛ ጡረታ (7%)' : 'Employee Pension (7%)'}</span>
                  <span className="font-bold text-rose-500">-{fmt(stat.employeePension)}</span>
                </div>

                {nonStat.loanRepayment > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-300">{isAmharic ? 'የሰራተኛ ብድር ክፍያ' : 'Staff Loan Repayment'}</span>
                    <span className="font-bold text-rose-500">-{fmt(nonStat.loanRepayment)}</span>
                  </div>
                )}

                {nonStat.salaryAdvanceDeduction > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-300">{isAmharic ? 'የቅድመ ደመወዝ ተቀናሽ' : 'Salary Advance Deduction'}</span>
                    <span className="font-bold text-rose-500">
                      -{fmt(nonStat.salaryAdvanceDeduction)}
                    </span>
                  </div>
                )}

                {nonStat.attendancePenaltyDeduction > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-300">{isAmharic ? 'የመዘግየት ቅጣት' : 'Late Arrival Penalty'}</span>
                    <span className="font-bold text-rose-500">
                      -{fmt(nonStat.attendancePenaltyDeduction)}
                    </span>
                  </div>
                )}

                {(nonStat.customDeductions || []).map((cd, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60"
                  >
                    <span className="text-slate-600 dark:text-slate-300">{cd.title}</span>
                    <span className="font-bold text-rose-500">-{fmt(cd.amount)}</span>
                  </div>
                ))}

                <div className="flex justify-between pt-2 font-black text-slate-900 dark:text-white">
                  <span>{isAmharic ? 'ጠቅላላ የሰራተኛ ተቀናሾች' : 'Total Employee Deductions'}</span>
                  <span className="text-rose-500">-{fmt(ded.totalEmployeeDeductions)} {isAmharic ? 'ብር' : 'ETB'}</span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#152238] flex justify-between text-[11px] text-slate-500">
                  <span>{isAmharic ? 'የአሰሪ ጡረታ መዋጮ (11% ማስታወሻ)፡' : 'Employer Pension Contribution (11% Memo):'}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {fmt(stat.employerPension)} {isAmharic ? 'ብር' : 'ETB'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#152238]/50">
          <span className="text-[11px] text-slate-400">
            Generated by Vector Advert Payroll Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
          >
            {isAmharic ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
