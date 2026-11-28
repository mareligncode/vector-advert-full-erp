import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Search,
  Eye,
  Banknote,
  ShieldCheck,
  AlertCircle,
  Send
} from 'lucide-react';
import { payrollService } from '../../../services/hrService';
import StatusBadge from '../StatusBadge';
import PayslipDetailModal from './PayslipDetailModal';
import { useAuth } from '../../../context/AuthContext';
import { HR_ADMIN_ROLES, EXECUTIVE_ROLES, ROLES, hasAnyRole } from '../../../utils/rbac';

export default function PayrollRunDetailModal({ isOpen, onClose, runId, onUpdateSuccess }) {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  const [run, setRun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Disbursement form
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [sourceBank, setSourceBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [paymentRef, setPaymentRef] = useState('');

  const fetchRunDetails = async () => {
    if (!runId) return;
    try {
      setLoading(true);
      setError('');
      const [runRes, slipsRes] = await Promise.all([
        payrollService.getRunById(runId),
        payrollService.getPayslips({ payrollRunId: runId, limit: 200 })
      ]);
      if (runRes.success) setRun(runRes.data);
      if (slipsRes.success) setPayslips(slipsRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load payroll batch details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && runId) {
      fetchRunDetails();
      setIsDisburseOpen(false);
    }
  }, [isOpen, runId]);

  if (!isOpen) return null;

  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const handleStageAction = async (stage, decision) => {
    const comments =
      decision === 'rejected'
        ? window.prompt('Enter rejection reason:')
        : 'Approved via Payroll Dashboard';
    if (decision === 'rejected' && !comments) return;

    try {
      setActionLoading(true);
      setError('');
      const res = await payrollService.approveRunStage(runId, stage, decision, comments);
      if (res.success) {
        fetchRunDetails();
        if (onUpdateSuccess) onUpdateSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Approval action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await payrollService.recalculateRun(runId);
      if (res.success) {
        fetchRunDetails();
        if (onUpdateSuccess) onUpdateSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Recalculation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburse = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError('');
      const res = await payrollService.disburseRun(runId, {
        sourceBankAccount: sourceBank,
        paymentReference: paymentRef
      });
      if (res.success) {
        setIsDisburseOpen(false);
        fetchRunDetails();
        if (onUpdateSuccess) onUpdateSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Disbursement failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRun = async () => {
    if (!window.confirm('Cancel and remove this draft/pending payroll batch?')) return;
    try {
      setActionLoading(true);
      const res = await payrollService.cancelRun(runId);
      if (res.success) {
        if (onUpdateSuccess) onUpdateSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayslips = payslips.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.employeeSnapshot?.fullName?.toLowerCase().includes(q) ||
      p.employeeSnapshot?.employeeNumber?.toLowerCase().includes(q) ||
      p.employeeSnapshot?.department?.toLowerCase().includes(q) ||
      p.payslipNumber?.toLowerCase().includes(q)
    );
  });

  const canHRApprove = hasAnyRole(user, HR_ADMIN_ROLES);
  const canFinanceApprove = hasAnyRole(user, [ROLES.FINANCE, ROLES.SUPER_ADMIN, ROLES.CEO]);
  const canExecApprove = hasAnyRole(user, EXECUTIVE_ROLES);

  const summary = run?.financialSummary || {};

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#152238]/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {run?.payrollCode} — {run?.title}
                  </h2>
                  {run && <StatusBadge status={run.payrollStatus} />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {run?.totalEmployees || 0} employees • Pay Date:{' '}
                  {run?.paymentDate ? new Date(run.paymentDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {run && !['disbursed', 'cancelled'].includes(run.payrollStatus) && (
                <>
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#00ced1] ${actionLoading ? 'animate-spin' : ''}`} />
                    <span>Recalculate</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRun}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs font-bold hover:bg-rose-500/20 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Batch</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading payroll batch...</div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : !run ? null : (
              <>
                {/* Financial Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400">
                      {isAmharic ? 'ጠቅላላ ደመወዝ (Gross)' : 'Total Gross Pay'}
                    </div>
                    <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {fmt(summary.totalGrossPay)} {isAmharic ? 'ብር' : 'ETB'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400">
                      {isAmharic ? 'የገቢ ግብር (PAYE)' : 'Income Tax (PAYE)'}
                    </div>
                    <div className="text-base font-black text-rose-500 mt-0.5">
                      {fmt(summary.totalIncomeTax)} {isAmharic ? 'ብር' : 'ETB'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400">
                      {isAmharic ? 'ጡረታ (7% + 11%)' : 'Pension (7% + 11%)'}
                    </div>
                    <div className="text-base font-black text-amber-500 mt-0.5">
                      {fmt((summary.totalEmployeePension || 0) + (summary.totalEmployerPension || 0))}{' '}
                      {isAmharic ? 'ብር' : 'ETB'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {isAmharic ? 'ጠቅላላ የተጣራ ክፍያ' : 'Total Net Payable'}
                    </div>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {fmt(summary.totalNetPay)} {isAmharic ? 'ብር' : 'ETB'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400">
                      {isAmharic ? 'ጠቅላላ የኩባንያ ወጪ' : 'Total Company Cost'}
                    </div>
                    <div className="text-base font-black text-[#00ced1] mt-0.5">
                      {fmt(summary.totalCompanyCost)} {isAmharic ? 'ብር' : 'ETB'}
                    </div>
                  </div>
                </div>

                {/* Multi-Stage Odoo Approval Pipeline */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#00ced1]" />
                    <span>
                      {isAmharic
                        ? 'ባለብዙ ደረጃ ማጽደቂያ እና የክፍያ ሂደት'
                        : 'Multi-Stage Approval & Disbursement Pipeline'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Stage 1: HR */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{isAmharic ? '1. የHR ግምገማ' : '1. HR Review'}</span>
                        <StatusBadge status={run.approvals?.hrApproval?.status || 'pending'} />
                      </div>
                      {run.payrollStatus === 'pending_hr_review' && canHRApprove && (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStageAction('hrApproval', 'approved')}
                            disabled={actionLoading}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white font-bold cursor-pointer"
                          >
                            {isAmharic ? 'አጽድቅ' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStageAction('hrApproval', 'rejected')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 font-bold cursor-pointer"
                          >
                            {isAmharic ? 'ውድቅ' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stage 2: Finance */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{isAmharic ? '2. የፋይናንስ ማረጋገጫ' : '2. Finance Check'}</span>
                        <StatusBadge status={run.approvals?.financeApproval?.status || 'pending'} />
                      </div>
                      {run.payrollStatus === 'pending_finance_approval' && canFinanceApprove && (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStageAction('financeApproval', 'approved')}
                            disabled={actionLoading}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white font-bold cursor-pointer"
                          >
                            {isAmharic ? 'አጽድቅ' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStageAction('financeApproval', 'rejected')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 font-bold cursor-pointer"
                          >
                            {isAmharic ? 'ውድቅ' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stage 3: Executive */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{isAmharic ? '3. የአመራር ፊርማ' : '3. Executive Sign-Off'}</span>
                        <StatusBadge status={run.approvals?.executiveApproval?.status || 'pending'} />
                      </div>
                      {run.payrollStatus === 'pending_executive_approval' && canExecApprove && (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStageAction('executiveApproval', 'approved')}
                            disabled={actionLoading}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white font-bold cursor-pointer"
                          >
                            {isAmharic ? 'አጽድቅ' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStageAction('executiveApproval', 'rejected')}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 font-bold cursor-pointer"
                          >
                            {isAmharic ? 'ውድቅ' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stage 4: Disburse */}
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{isAmharic ? '4. የባንክ ክፍያ' : '4. Bank Disbursement'}</span>
                        <StatusBadge status={run.payrollStatus === 'disbursed' ? 'paid' : 'pending'} />
                      </div>
                      {run.payrollStatus === 'approved' && canFinanceApprove && (
                        <button
                          type="button"
                          onClick={() => setIsDisburseOpen(!isDisburseOpen)}
                          className="w-full py-1.5 rounded-lg bg-[#00ced1] text-white font-black cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isAmharic ? 'ደመወዝ ክፈል' : 'Disburse Payroll'}</span>
                        </button>
                      )}
                      {run.payrollStatus === 'disbursed' && (
                        <span className="text-[10px] text-emerald-500 font-bold truncate">
                          {isAmharic ? 'ማጣቀሻ፡' : 'Ref:'} {run.disbursementDetails?.paymentReference || 'Disbursed'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Disburse Form */}
                  {isDisburseOpen && (
                    <form
                      onSubmit={handleDisburse}
                      className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-wrap items-end gap-3"
                    >
                      <div className="flex-1 min-w-[200px]">
                        <label className="block font-bold mb-1">Source Bank Account</label>
                        <input
                          type="text"
                          required
                          value={sourceBank}
                          onChange={(e) => setSourceBank(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block font-bold mb-1">Bank Transfer Reference *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. TXN-CBE-20261128"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-black cursor-pointer"
                      >
                        Confirm & Mark All Paid
                      </button>
                    </form>
                  )}
                </div>

                {/* Employee Payslips inside Batch */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="font-black text-slate-900 dark:text-white">
                      Employee Payslips in Batch ({filteredPayslips.length})
                    </h3>
                    <div className="relative max-w-xs w-full">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search employee or slip #..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238]"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-[#152238] border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-black text-slate-500">
                        <tr>
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Worked</th>
                          <th className="py-3 px-4">Basic</th>
                          <th className="py-3 px-4">Gross Pay</th>
                          <th className="py-3 px-4">PAYE Tax</th>
                          <th className="py-3 px-4">Pension (7%)</th>
                          <th className="py-3 px-4">Net Pay</th>
                          <th className="py-3 px-4 text-right">Slip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredPayslips.map((ps) => (
                          <tr
                            key={ps._id}
                            className="hover:bg-slate-50/70 dark:hover:bg-[#152238]/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-black text-slate-900 dark:text-white">
                                {ps.employeeSnapshot?.fullName}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {ps.employeeSnapshot?.employeeNumber} • {ps.employeeSnapshot?.department}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {ps.attendanceSummary?.daysWorked || 0}/{ps.attendanceSummary?.expectedWorkingDays || 0}d
                            </td>
                            <td className="py-3 px-4 font-bold">{fmt(ps.earnings?.basicSalary)}</td>
                            <td className="py-3 px-4 font-bold">{fmt(ps.earnings?.grossEarnings)}</td>
                            <td className="py-3 px-4 text-rose-500 font-bold">
                              -{fmt(ps.deductions?.statutoryDeductions?.incomeTax)}
                            </td>
                            <td className="py-3 px-4 text-rose-500 font-bold">
                              -{fmt(ps.deductions?.statutoryDeductions?.employeePension)}
                            </td>
                            <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">
                              {fmt(ps.netSalary)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedPayslip(ps)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00ced1]/10 text-[#00ced1] font-bold hover:bg-[#00ced1]/20 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedPayslip && (
        <PayslipDetailModal
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
          payslip={selectedPayslip}
        />
      )}
    </>
  );
}
