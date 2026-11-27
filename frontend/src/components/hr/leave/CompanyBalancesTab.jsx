import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Calendar,
  Sparkles,
  Edit3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  X,
  Layers
} from 'lucide-react';
import { leaveService } from '../../../services/hrService';
import { getEmployeeFullName, getEmployeeInitial } from '../../../utils/rbac';

export default function CompanyBalancesTab({ canAdjust }) {
  const { t } = useTranslation();

  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [initYear, setInitYear] = useState(new Date().getFullYear());
  const [carryForwardMax, setCarryForwardMax] = useState(5);
  const [initLoading, setInitLoading] = useState(false);

  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustAnnualRemaining, setAdjustAnnualRemaining] = useState(16);
  const [adjustSickRemaining, setAdjustSickRemaining] = useState(15);
  const [adjustCasualRemaining, setAdjustCasualRemaining] = useState(5);
  const [adjustCarried, setAdjustCarried] = useState(0);
  const [adjustLoading, setAdjustLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const params = { year: selectedYear };
      if (departmentFilter) params.department = departmentFilter;

      const res = await leaveService.getAllBalances(params);
      if (res.success) {
        setBalances(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load leave balances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [selectedYear, departmentFilter]);

  const handleInitYear = async (e) => {
    e.preventDefault();
    try {
      setInitLoading(true);
      setError('');
      const res = await leaveService.initializeYearBalances({
        year: Number(initYear),
        carryForwardMax: Number(carryForwardMax)
      });
      if (res.success) {
        setMessage(t('hrPages.leave.initSuccess'));
        setIsInitModalOpen(false);
        fetchBalances();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('hrPages.leave.initFailed'));
    } finally {
      setInitLoading(false);
    }
  };

  const openAdjustModal = (b) => {
    setAdjustTarget(b);
    setAdjustAnnualRemaining(b.annualLeave?.annualRemainingDays ?? 16);
    setAdjustSickRemaining(b.sickLeave?.sickRemainingDays ?? 15);
    setAdjustCasualRemaining(b.casualLeave?.casualRemainingDays ?? 5);
    setAdjustCarried(b.carriedForwardDays ?? 0);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustTarget) return;

    try {
      setAdjustLoading(true);
      setError('');

      const adjustments = {
        annualLeave: { annualRemainingDays: Number(adjustAnnualRemaining) },
        sickLeave: { sickRemainingDays: Number(adjustSickRemaining) },
        casualLeave: { casualRemainingDays: Number(adjustCasualRemaining) },
        carriedForwardDays: Number(adjustCarried)
      };

      const res = await leaveService.adjustBalance(adjustTarget._id, adjustments);
      if (res.success) {
        setMessage(t('hrPages.leave.adjustSuccess'));
        setAdjustTarget(null);
        fetchBalances();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('hrPages.leave.adjustFailed'));
    } finally {
      setAdjustLoading(false);
    }
  };

  const filteredBalances = balances.filter((b) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const empName = getEmployeeFullName(b.employee).toLowerCase();
    const numMatch = b.employee?.employeeNumber?.toLowerCase().includes(term);
    return empName.includes(term) || numMatch;
  });

  return (
    <div className="space-y-4">
      {/* Alert Messages */}
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

      {/* Control Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name or ID..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            {[2024, 2025, 2026, 2027].map((yr) => (
              <option key={yr} value={yr}>
                Year {yr}
              </option>
            ))}
          </select>

          {canAdjust && (
            <button
              type="button"
              onClick={() => setIsInitModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00ced1]/15 text-[#00ced1] hover:bg-[#00ced1]/25 flex items-center gap-1.5 transition-all cursor-pointer border border-[#00ced1]/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('hrPages.leave.initBalancesBtn')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchBalances}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={t('common.refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00ced1]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Balances Table */}
      <div className="rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('hrPages.leave.balancesTitle')} ({selectedYear})
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#00ced1]/10 text-[#00ced1]">
              {filteredBalances.length} staff
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {t('hrPages.leave.loading')}
          </div>
        ) : filteredBalances.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {t('hrPages.leave.emptyBalances')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#070b12] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Annual Leave (Rem / Total)</th>
                  <th className="py-3 px-4">Sick Leave (Rem / Ent)</th>
                  <th className="py-3 px-4">Casual Leave</th>
                  <th className="py-3 px-4">Carried Over</th>
                  {canAdjust && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredBalances.map((b) => (
                  <tr
                    key={b._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-[#152238]/30 transition-colors"
                  >
                    {/* Employee */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#00ced1]/10 text-[#00ced1] flex items-center justify-center font-bold text-xs shrink-0">
                          {getEmployeeInitial(b.employee)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {getEmployeeFullName(b.employee)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {b.employee?.employeeNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {b.employee?.department || '—'}
                    </td>

                    {/* Annual Leave */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#00ced1]">
                          {b.annualLeave?.annualRemainingDays ?? 16}d
                        </span>
                        <span className="text-[10px] text-slate-400">
                          / {b.annualLeave?.annualTotalEntitlement ?? 16}d
                        </span>
                      </div>
                    </td>

                    {/* Sick Leave */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-500">
                          {b.sickLeave?.sickRemainingDays ?? 15}d
                        </span>
                        <span className="text-[10px] text-slate-400">
                          / {b.sickLeave?.sickEntitlement ?? 15}d
                        </span>
                      </div>
                    </td>

                    {/* Casual Leave */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-amber-500">
                        {b.casualLeave?.casualRemainingDays ?? 5}d
                      </span>
                    </td>

                    {/* Carried Forward */}
                    <td className="py-3 px-4">
                      <span className="text-slate-600 dark:text-slate-300 font-mono">
                        +{b.carriedForwardDays || 0}d
                      </span>
                    </td>

                    {/* Actions */}
                    {canAdjust && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openAdjustModal(b)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#00ced1] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Adjust Balance"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{t('hrPages.leave.adjustBalanceBtn')}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Initialize Year Modal */}
      {isInitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00ced1]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('hrPages.leave.initBalancesTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {t('hrPages.leave.initBalancesDesc')}
            </p>

            <form onSubmit={handleInitYear} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('hrPages.leave.targetYear')}
                </label>
                <input
                  type="number"
                  value={initYear}
                  onChange={(e) => setInitYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('hrPages.leave.carryForwardMax')}
                </label>
                <input
                  type="number"
                  value={carryForwardMax}
                  onChange={(e) => setCarryForwardMax(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInitModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={initLoading}
                  className="px-4 py-1.5 rounded-xl font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {initLoading ? 'Initializing...' : 'Run Initialization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Individual Balance Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#00ced1]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('hrPages.leave.adjustBalanceTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold">
              Employee: {getEmployeeFullName(adjustTarget.employee)} ({adjustTarget.employee?.employeeNumber})
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('hrPages.leave.annualRemaining')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={adjustAnnualRemaining}
                  onChange={(e) => setAdjustAnnualRemaining(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('hrPages.leave.sickRemaining')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={adjustSickRemaining}
                  onChange={(e) => setAdjustSickRemaining(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('hrPages.leave.casualRemaining')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={adjustCasualRemaining}
                  onChange={(e) => setAdjustCasualRemaining(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Carried Forward Days
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={adjustCarried}
                  onChange={(e) => setAdjustCarried(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-1.5 rounded-xl font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {adjustLoading ? 'Saving...' : 'Save Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
