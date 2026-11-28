import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Banknote,
  FileSpreadsheet,
  Sliders,
  DollarSign,
  Settings,
  Plus,
  Eye,
  Printer,
  CheckCircle2,
  Users,
  TrendingUp,
  Search
} from 'lucide-react';
import { payrollService, employeeService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/hr/StatusBadge';
import { HR_ADMIN_ROLES, EXECUTIVE_ROLES, MANAGEMENT_ROLES, ROLES, hasAnyRole } from '../../../utils/rbac';

import PayslipDetailModal from '../../../components/hr/payroll/PayslipDetailModal';
import GeneratePayrollModal from '../../../components/hr/payroll/GeneratePayrollModal';
import PayrollRunDetailModal from '../../../components/hr/payroll/PayrollRunDetailModal';
import SalaryStructureModal from '../../../components/hr/payroll/SalaryStructureModal';
import LoanRequestModal from '../../../components/hr/payroll/LoanRequestModal';
import PayrollConfigPanel from '../../../components/hr/payroll/PayrollConfigPanel';

export default function PayrollDashboard() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  const isPayrollAdmin = hasAnyRole(user, [...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES]);
  const isConfigAdmin = hasAnyRole(user, [
    ROLES.SUPER_ADMIN,
    ROLES.CEO,
    ROLES.CAO,
    ROLES.COO,
    ROLES.HR_MANAGER,
    ROLES.FINANCE
  ]);
  const isApprover = hasAnyRole(user, [...MANAGEMENT_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES]);

  const [activeTab, setActiveTab] = useState(isPayrollAdmin ? 'runs' : 'payslips');
  const [loading, setLoading] = useState(true);

  // Data States
  const [myPayslips, setMyPayslips] = useState([]);
  const [runs, setRuns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);

  // Filters
  const [structSearch, setStructSearch] = useState('');

  // Modals
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [structureEmployee, setStructureEmployee] = useState(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  const fmt = (num) =>
    Number(num || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const fetchAllPayrollData = async () => {
    try {
      setLoading(true);
      const calls = [
        payrollService.getMyPayslips(),
        payrollService.getMyLoans()
      ];

      if (isPayrollAdmin) {
        calls.push(
          payrollService.getRuns({ limit: 50 }),
          employeeService.getEmployees({ limit: 200, status: 'active' }),
          payrollService.getStructures({ limit: 200 }),
          payrollService.getLoans({ limit: 100 })
        );
      }

      const results = await Promise.allSettled(calls);

      if (results[0].status === 'fulfilled' && results[0].value?.success) {
        setMyPayslips(results[0].value.data || []);
      }
      if (results[1].status === 'fulfilled' && results[1].value?.success) {
        setMyLoans(results[1].value.data || []);
      }

      if (isPayrollAdmin) {
        if (results[2]?.status === 'fulfilled' && results[2].value?.success) {
          setRuns(results[2].value.data || []);
        }
        if (results[3]?.status === 'fulfilled' && results[3].value?.success) {
          setEmployees(results[3].value.data || []);
        }
        if (results[4]?.status === 'fulfilled' && results[4].value?.success) {
          setStructures(results[4].value.data || []);
        }
        if (results[5]?.status === 'fulfilled' && results[5].value?.success) {
          setAllLoans(results[5].value.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPayrollData();
  }, []);

  const handlePrintPayslip = async (payslipId) => {
    try {
      const html = await payrollService.getPayslipHtml(payslipId);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch (err) {
      console.error('Failed to print payslip:', err);
    }
  };

  const handleLoanApprove = async (loanId, stage, decision) => {
    try {
      await payrollService.approveLoanStage(loanId, stage, decision, `${decision} via Payroll Hub`);
      fetchAllPayrollData();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleLoanDisburse = async (loanId) => {
    const ref = window.prompt('Enter Bank / Payment Reference:');
    if (!ref) return;
    try {
      await payrollService.disburseLoan(loanId, ref);
      fetchAllPayrollData();
    } catch (err) {
      alert(err.response?.data?.message || 'Disbursement failed');
    }
  };

  // Latest run summary for KPI cards
  const latestRun = runs[0];
  const latestSummary = latestRun?.financialSummary || {};

  // Map structures by employee ID
  const structureMap = {};
  structures.forEach((s) => {
    if (s.employee?._id) structureMap[s.employee._id] = s;
    else if (s.employee) structureMap[s.employee] = s;
  });

  const filteredEmployees = employees.filter((emp) => {
    if (!structSearch.trim()) return true;
    const q = structSearch.toLowerCase();
    const fullName = [emp.name?.first, emp.name?.middle, emp.name?.last]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return (
      fullName.includes(q) ||
      emp.employeeNumber?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q)
    );
  });

  const loansToDisplay = isPayrollAdmin ? allLoans : myLoans;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.payroll.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.payroll.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLoanModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#00ced1]" />
            <span>{isAmharic ? 'ቅድመ ደመወዝ / ብድር ጠይቅ' : 'Request Advance / Loan'}</span>
          </button>

          {isPayrollAdmin && (
            <button
              type="button"
              onClick={() => setIsGenerateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white text-xs font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAmharic ? 'ወርሃዊ ደመወዝ አስላ' : 'New Payroll Batch'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip (for HR/Finance) */}
      {isPayrollAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {isAmharic ? 'የቅርብ ጊዜ ጠቅላላ ደመወዝ' : 'Latest Batch Gross Pay'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {fmt(latestSummary.totalGrossPay)}{' '}
              <span className="text-xs text-slate-400">{isAmharic ? 'ብር' : 'ETB'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {latestRun
                ? `${latestRun.payrollCode} (${latestRun.totalEmployees} ${isAmharic ? 'ሰራተኞች' : 'staff'})`
                : isAmharic
                ? 'እስካሁን ባች የለም'
                : 'No runs yet'}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {isAmharic ? 'የተጣራ የሚከፈል ደመወዝ' : 'Latest Net Disbursed / Payable'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-500">
              {fmt(latestSummary.totalNetPay)}{' '}
              <span className="text-xs text-slate-400">{isAmharic ? 'ብር' : 'ETB'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isAmharic ? 'ከግብር እና ከጡረታ በኋላ የተጣራ ክፍያ' : 'Take-home after tax & pension'}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {isAmharic ? 'የገቢ ግብር እና የጡረታ ክፍያ' : 'PAYE Tax + Pension Remittance'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-500">
              {fmt(
                (latestSummary.totalIncomeTax || 0) +
                  (latestSummary.totalEmployeePension || 0) +
                  (latestSummary.totalEmployerPension || 0)
              )}{' '}
              <span className="text-xs text-slate-400">{isAmharic ? 'ብር' : 'ETB'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isAmharic ? 'የኢትዮጵያ ህጋዊ ግብር እና 18% ጡረታ' : 'Statutory Ethiopian tax & 18% pension'}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {isAmharic ? 'የተዋቀሩ የደመወዝ መዋቅሮች' : 'Configured Salary Structures'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#00ced1]">
              {structures.length} <span className="text-xs text-slate-400">/ {employees.length}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isAmharic ? 'ንቁ የሰራተኛ ውሎች' : 'Active employee contracts'}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 sm:gap-5 overflow-x-auto">
        {isPayrollAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('runs')}
            className={`pb-3 px-1 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'runs'
                ? 'border-[#00ced1] text-[#00ced1]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isAmharic ? 'የደመወዝ ባቾች (Batches)' : 'Payroll Batches'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('payslips')}
          className={`pb-3 px-1 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'payslips'
              ? 'border-[#00ced1] text-[#00ced1]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>{isAmharic ? 'የእኔ የደመወዝ ስሊፖች' : 'My Payslips'}</span>
        </button>

        {isPayrollAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('structures')}
            className={`pb-3 px-1 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'structures'
                ? 'border-[#00ced1] text-[#00ced1]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isAmharic ? 'የደመወዝ አወቃቀሮች' : 'Salary Structures'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`pb-3 px-1 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'loans'
              ? 'border-[#00ced1] text-[#00ced1]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>{isAmharic ? 'ቅድመ ደመወዝ እና ብድር' : 'Advances & Loans'}</span>
        </button>

        {isConfigAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-3 px-1 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'border-[#00ced1] text-[#00ced1]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{isAmharic ? 'የግብር እና የጡረታ ህጎች' : 'Tax & Statutory Rules'}</span>
          </button>
        )}
      </div>

      {/* =====================================================================
          TAB 1: PAYROLL BATCHES (RUNS)
      ====================================================================== */}
      {activeTab === 'runs' && isPayrollAdmin && (
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              {isAmharic ? 'የደመወዝ ባቾችን በመጫን ላይ...' : 'Loading payroll batches...'}
            </div>
          ) : runs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="font-bold text-slate-600 dark:text-slate-300">
                {isAmharic ? 'እስካሁን የተዘጋጀ የደመወዝ ባች የለም።' : 'No payroll batches generated yet.'}
              </p>
              <p>
                {isAmharic
                  ? 'ወርሃዊ የኢትዮጵያ ህጋዊ ደመወዝ ለማስላት "ወርሃዊ ደመወዝ አስላ" የሚለውን ይጫኑ።'
                  : 'Click "New Payroll Batch" to run monthly Ethiopian statutory payroll.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#152238] border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">{isAmharic ? 'የባች መለያ እና ርዕስ' : 'Batch Code & Title'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'ሰራተኞች' : 'Staff'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'ጠቅላላ ደመወዝ' : 'Total Gross'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'ግብር + ጡረታ' : 'PAYE + Pension'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'የተጣራ ክፍያ' : 'Net Payable'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-right">{isAmharic ? 'ተግባር' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {runs.map((run) => {
                    const fs = run.financialSummary || {};
                    return (
                      <tr
                        key={run._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-[#152238]/50 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedRunId(run._id)}
                            className="font-black text-[#00ced1] hover:underline text-left cursor-pointer"
                          >
                            {run.payrollCode}
                          </button>
                          <div className="text-[11px] text-slate-500">{run.title}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold">{run.totalEmployees}</td>
                        <td className="py-3.5 px-4 font-bold">{fmt(fs.totalGrossPay)} {isAmharic ? 'ብር' : 'ETB'}</td>
                        <td className="py-3.5 px-4 text-rose-500 font-bold">
                          {fmt((fs.totalIncomeTax || 0) + (fs.totalEmployeePension || 0))} {isAmharic ? 'ብር' : 'ETB'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                          {fmt(fs.totalNetPay)} {isAmharic ? 'ብር' : 'ETB'}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={run.payrollStatus} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedRunId(run._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00ced1]/10 hover:bg-[#00ced1]/20 text-[#00ced1] font-black cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isAmharic ? 'መርምር እና አጽድቅ' : 'Inspect & Approve'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: MY PAYSLIPS
      ====================================================================== */}
      {activeTab === 'payslips' && (
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">{t('hrPages.payroll.loading')}</div>
          ) : myPayslips.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">{t('hrPages.payroll.empty')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#152238] border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase font-black text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">{isAmharic ? 'የደረሰኝ ቁጥር' : 'Payslip #'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'የክፍያ ጊዜ' : 'Pay Period'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'ጠቅላላ ገቢ' : 'Gross Earnings'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'ተቀናሾች' : 'Deductions'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'የተጣራ ደመወዝ' : 'Net Salary'}</th>
                    <th className="py-3.5 px-4">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-right">{isAmharic ? 'ተግባራት' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {myPayslips.map((ps) => (
                    <tr key={ps._id} className="hover:bg-slate-50/70 dark:hover:bg-[#152238]/50">
                      <td className="py-3.5 px-4 font-black text-[#00ced1]">{ps.payslipNumber}</td>
                      <td className="py-3.5 px-4 font-bold">{ps.payrollRun?.title || (isAmharic ? 'ወርሃዊ' : 'Monthly')}</td>
                      <td className="py-3.5 px-4 font-bold">{fmt(ps.earnings?.grossEarnings)} {isAmharic ? 'ብር' : 'ETB'}</td>
                      <td className="py-3.5 px-4 text-rose-500 font-bold">
                        -{fmt(ps.deductions?.totalEmployeeDeductions)} {isAmharic ? 'ብር' : 'ETB'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        {fmt(ps.netSalary)} {isAmharic ? 'ብር' : 'ETB'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={ps.paymentStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPayslip(ps)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00ced1]/10 text-[#00ced1] font-bold hover:bg-[#00ced1]/20 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isAmharic ? 'ይመልከቱ' : 'View'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintPayslip(ps._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{isAmharic ? 'አትም' : 'Print'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: SALARY STRUCTURES
      ====================================================================== */}
      {activeTab === 'structures' && isPayrollAdmin && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={isAmharic ? 'በሰራተኛ ስም፣ መለያ ቁጥር ወይም ዲፓርትመንት ፈልግ...' : 'Search employee by name, ID, or department...'}
              value={structSearch}
              onChange={(e) => setStructSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs"
            />
          </div>

          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#152238] border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-black text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">{isAmharic ? 'ሰራተኛ' : 'Employee'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ዲፓርትመንት' : 'Department'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'መነሻ ደመወዝ' : 'Basic Salary'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'አበሎች' : 'Allowances'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ጡረታ / ትርፍ ሰዓት' : 'Pension / OT'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'የክፍያ ዘዴ' : 'Payment'}</th>
                  <th className="py-3.5 px-4 text-right">{isAmharic ? 'አዋቅር' : 'Configure'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredEmployees.map((emp) => {
                  const st = structureMap[emp._id];
                  const fullName = [emp.name?.first, emp.name?.middle, emp.name?.last]
                    .filter(Boolean)
                    .join(' ');
                  const totalAlw = (st?.earnings || []).reduce((acc, e) => acc + (e.amount || 0), 0);

                  return (
                    <tr key={emp._id} className="hover:bg-slate-50/70 dark:hover:bg-[#152238]/50">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white">{fullName}</div>
                        <div className="text-[11px] text-slate-400">
                          {emp.employeeNumber} • {emp.jobTitle}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{emp.department}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                        {fmt(st?.baseSalary ?? emp.basicSalary ?? 0)} {isAmharic ? 'ብር' : 'ETB'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-500">
                        +{fmt(totalAlw)} {isAmharic ? 'ብር' : 'ETB'} ({st?.earnings?.length || 0})
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-slate-500">
                          {st
                            ? `${st.isPensionEligible ? (isAmharic ? 'ጡረታ ✓' : 'Pension ✓') : (isAmharic ? 'ጡረታ የለም' : 'No Pension')} • ${st.isOvertimeEligible ? (isAmharic ? 'ትርፍ ሰዓት ✓' : 'OT ✓') : (isAmharic ? 'ትርፍ ሰዓት የለም' : 'No OT')}`
                            : isAmharic
                            ? 'መደበኛ'
                            : 'Default'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-slate-500">
                        {(st?.paymentMethod || 'bank_transfer').replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setStructureEmployee(emp)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ced1]/10 hover:bg-[#00ced1]/20 text-[#00ced1] font-black cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{isAmharic ? 'አዋቅር' : 'Configure'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: ADVANCES & LOANS
      ====================================================================== */}
      {activeTab === 'loans' && (
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-x-auto">
          {loansToDisplay.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              {isAmharic ? 'ምንም የቅድመ ደመወዝ ወይም የብድር ጥያቄ የለም።' : 'No salary advances or staff loans found.'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#152238] border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-black text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">{isAmharic ? 'ሰራተኛ' : 'Employee'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ዓይነት' : 'Type'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'የተጠየቀ መጠን' : 'Principal'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ወርሃዊ ክፍያ' : 'Installment'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ቀሪ ዕዳ' : 'Remaining'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                  {isApprover && <th className="py-3.5 px-4 text-right">{isAmharic ? 'ተግባራት' : 'Actions'}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loansToDisplay.map((loan) => {
                  const empName = loan.employee
                    ? [loan.employee.name?.first, loan.employee.name?.last].filter(Boolean).join(' ')
                    : isAmharic
                    ? 'የግል'
                    : 'Self';
                  return (
                    <tr key={loan._id} className="hover:bg-slate-50/70 dark:hover:bg-[#152238]/50">
                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                        {empName}
                        <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                          {loan.reason}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 capitalize font-bold">
                        {loan.requestType?.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold">{fmt(loan.amountRequested)} {isAmharic ? 'ብር' : 'ETB'}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {fmt(loan.monthlyDeductionAmount)} / {isAmharic ? 'በወር' : 'mo'} ({loan.totalInstallments}{isAmharic ? 'ወር' : 'm'})
                      </td>
                      <td className="py-3.5 px-4 font-black text-rose-500">
                        {fmt(loan.remainingBalance)} {isAmharic ? 'ብር' : 'ETB'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={loan.repaymentStatus} />
                      </td>
                      {isApprover && (
                        <td className="py-3.5 px-4 text-right space-x-1">
                          {loan.repaymentStatus === 'pending_approval' &&
                            loan.approvals?.hrApproval?.status !== 'approved' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleLoanApprove(loan._id, 'hrApproval', 'approved')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold cursor-pointer"
                                >
                                  {isAmharic ? 'HR አጽድቅ' : 'HR Approve'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLoanApprove(loan._id, 'hrApproval', 'rejected')}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 font-bold cursor-pointer"
                                >
                                  {isAmharic ? 'ውድቅ አድርግ' : 'Reject'}
                                </button>
                              </>
                            )}
                          {loan.repaymentStatus === 'pending_approval' &&
                            loan.approvals?.hrApproval?.status === 'approved' &&
                            loan.approvals?.financeApproval?.status !== 'approved' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleLoanApprove(loan._id, 'financeApproval', 'approved')
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-blue-500 text-white font-bold cursor-pointer"
                                >
                                  {isAmharic ? 'ፋይናንስ አጽድቅ' : 'Finance Approve'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleLoanApprove(loan._id, 'financeApproval', 'rejected')
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 font-bold cursor-pointer"
                                >
                                  {isAmharic ? 'ውድቅ አድርግ' : 'Reject'}
                                </button>
                              </>
                            )}
                          {loan.repaymentStatus === 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleLoanDisburse(loan._id)}
                              className="px-2.5 py-1 rounded-lg bg-[#00ced1] text-white font-bold cursor-pointer"
                            >
                              {isAmharic ? 'ክፈል (Disburse)' : 'Disburse'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: TAX & STATUTORY RULES
      ====================================================================== */}
      {activeTab === 'config' && isConfigAdmin && <PayrollConfigPanel />}

      {/* Modals */}
      {selectedPayslip && (
        <PayslipDetailModal
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
          payslip={selectedPayslip}
        />
      )}

      {isGenerateOpen && (
        <GeneratePayrollModal
          isOpen={isGenerateOpen}
          onClose={() => setIsGenerateOpen(false)}
          onSuccess={() => fetchAllPayrollData()}
        />
      )}

      {selectedRunId && (
        <PayrollRunDetailModal
          isOpen={Boolean(selectedRunId)}
          onClose={() => setSelectedRunId(null)}
          runId={selectedRunId}
          onUpdateSuccess={() => fetchAllPayrollData()}
        />
      )}

      {structureEmployee && (
        <SalaryStructureModal
          isOpen={Boolean(structureEmployee)}
          onClose={() => setStructureEmployee(null)}
          employee={structureEmployee}
          onSuccess={() => fetchAllPayrollData()}
        />
      )}

      {isLoanModalOpen && (
        <LoanRequestModal
          isOpen={isLoanModalOpen}
          onClose={() => setIsLoanModalOpen(false)}
          onSuccess={() => fetchAllPayrollData()}
        />
      )}
    </div>
  );
}
