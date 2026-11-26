import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Banknote,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  AlertCircle,
  Plus
} from 'lucide-react';
import { payrollService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function PayrollDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [myPayslips, setMyPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payslips');
  const [selectedPayslipHtml, setSelectedPayslipHtml] = useState(null);

  const isFinanceOrHR = user?.roles?.some((r) =>
    ['superadmin', 'ceo', 'cao', 'coo', 'hrmanager', 'finance'].includes(r)
  );

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const [payslipRes, runsRes] = await Promise.allSettled([
        payrollService.getMyPayslips(),
        isFinanceOrHR ? payrollService.getRuns() : Promise.resolve({ data: [] })
      ]);

      if (payslipRes.status === 'fulfilled' && payslipRes.value?.success) {
        setMyPayslips(payslipRes.value.data || []);
      }
      if (runsRes.status === 'fulfilled' && runsRes.value?.success) {
        setRuns(runsRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const handleViewPayslipHtml = async (payslipId) => {
    window.open(`/api/payroll/payslips/${payslipId}/html`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.payroll.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.payroll.subtitle')}
          </p>
        </div>

        {isFinanceOrHR && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('runs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'runs'
                  ? 'bg-[#00ced1] text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {t('hrPages.payroll.batchesTab')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payslips')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'payslips'
                  ? 'bg-[#00ced1] text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {t('hrPages.payroll.myPayslipsTab')}
            </button>
          </div>
        )}
      </div>

      {/* Statutory Rules Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/50 via-teal-50/20 to-cyan-50/30 dark:from-emerald-950/20 dark:via-cyan-950/10 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300">
            {t('hrPages.payroll.complianceTitle')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            {t('hrPages.payroll.complianceDesc')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-[#152238] border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
            {t('hrPages.payroll.pensionBadge')}
          </span>
          <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-[#152238] border border-cyan-200 dark:border-cyan-800 text-[#00ced1]">
            {t('hrPages.payroll.currencyBadge')}
          </span>
        </div>
      </div>

      {/* Main View Tab */}
      {activeTab === 'payslips' ? (
        /* My Payslips */
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('hrPages.payroll.myMonthlyPayslips')}</h3>
            <span className="text-xs text-slate-400">{t('hrPages.payroll.payslipsAvailable', { count: myPayslips.length })}</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">{t('hrPages.payroll.loadingPayslips')}</div>
          ) : myPayslips.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {t('hrPages.payroll.noPayslips')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#152238] text-[11px] font-bold text-slate-400 uppercase">
                  <tr>
                    <th className="py-3 px-4">{t('hrPages.payroll.payslipNo')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.grossEarnings')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.incomeTax')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.pension7')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.netSalary')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.status')}</th>
                    <th className="py-3 px-4 text-right">{t('hrPages.payroll.document')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myPayslips.map((ps) => (
                    <tr key={ps._id} className="hover:bg-slate-50/50 dark:hover:bg-[#152238]/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {ps.payslipNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-semibold">
                        {(ps.earnings?.grossEarnings || 0).toLocaleString()} {t('common.currencyEtb')}
                      </td>
                      <td className="py-3.5 px-4 text-rose-600 dark:text-rose-400">
                        {(ps.deductions?.statutoryDeductions?.incomeTax || 0).toLocaleString()} {t('common.currencyEtb')}
                      </td>
                      <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400">
                        {(ps.deductions?.statutoryDeductions?.employeePension || 0).toLocaleString()} {t('common.currencyEtb')}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        {(ps.netSalary || 0).toLocaleString()} {t('common.currencyEtb')}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={ps.paymentStatus || 'pending'} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewPayslipHtml(ps._id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-[#00ced1] hover:underline"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{t('hrPages.payroll.viewPrint')}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Payroll Runs (Management / Finance) */
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('hrPages.payroll.monthlyBatches')}</h3>
            <span className="text-xs text-slate-400">{t('hrPages.payroll.batchesCount', { count: runs.length })}</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">{t('hrPages.payroll.loadingBatches')}</div>
          ) : runs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">{t('hrPages.payroll.noRuns')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#152238] text-[11px] font-bold text-slate-400 uppercase">
                  <tr>
                    <th className="py-3 px-4">{t('hrPages.payroll.batchCode')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.period')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.totalStaff')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.grossCost')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.netDisbursement')}</th>
                    <th className="py-3 px-4">{t('hrPages.payroll.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {runs.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-[#152238]/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {r.payrollCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">
                        {r.title || `${r.periodMonth}/${r.periodYear}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {t('hrPages.payroll.employeesCount', { count: r.totalEmployees })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {(r.financialSummary?.totalGrossPay || 0).toLocaleString()} {t('common.currencyEtb')}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        {(r.financialSummary?.totalNetPay || 0).toLocaleString()} {t('common.currencyEtb')}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.payrollStatus || 'draft'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
