import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Plus, Clock, FileText, CheckCircle, AlertCircle, Paperclip } from 'lucide-react';
import { leaveService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';

export default function LeaveDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startPeriod, setStartPeriod] = useState('full_day');
  const [endPeriod, setEndPeriod] = useState('full_day');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [evidenceTarget, setEvidenceTarget] = useState(null);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const [balRes, reqRes] = await Promise.allSettled([
        leaveService.getMyBalance(),
        leaveService.getMyRequests()
      ]);

      if (balRes.status === 'fulfilled' && balRes.value?.success) {
        setBalance(balRes.value.data);
      }
      if (reqRes.status === 'fulfilled' && reqRes.value?.success) {
        setRequests(reqRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setError(t('hrPages.leave.fillRequired'));
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const res = await leaveService.createRequest({
        leaveType,
        startDate,
        endDate,
        startDayPeriod: startPeriod,
        endDayPeriod: endPeriod,
        requestReason: reason
      });
      if (res.success) {
        setMessage(t('hrPages.leave.submitSuccess'));
        setShowModal(false);
        setReason('');
        setStartDate('');
        setEndDate('');
        fetchLeaveData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('hrPages.leave.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm(t('hrPages.leave.cancelConfirm'))) return;
    try {
      await leaveService.cancelRequest(id);
      fetchLeaveData();
    } catch (err) {
      alert(err.response?.data?.message || t('hrPages.leave.cancelFailed'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.leave.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.leave.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:brightness-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          style={{ backgroundColor: '#00ced1', color: '#020617' }}
        >
          <Plus className="w-4 h-4" style={{ color: '#020617' }} />
          <span style={{ color: '#020617' }}>{t('hrPages.leave.submitBtn')}</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('hrPages.leave.annualLeave')}</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {balance?.annualRemainingDays ?? 16} <span className="text-xs font-normal text-slate-400">{t('hrPages.leave.daysLeft')}</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{t('hrPages.leave.accrued', { count: balance?.annualAccruedDays ?? 0 })}</span>
            <span>{t('hrPages.leave.used', { count: balance?.annualUsedDays ?? 0 })}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('hrPages.leave.sickLeave')}</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {balance?.sickRemainingDays ?? 15} <span className="text-xs font-normal text-slate-400">{t('hrPages.leave.daysLeft')}</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{t('hrPages.leave.entitled', { count: balance?.sickEntitlement ?? 15 })}</span>
            <span>{t('hrPages.leave.used', { count: balance?.sickUsedDays ?? 0 })}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('hrPages.leave.casualLeave')}</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {balance?.casualRemainingDays ?? 5} <span className="text-xs font-normal text-slate-400">{t('hrPages.leave.daysLeft')}</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{t('hrPages.leave.entitled', { count: balance?.casualEntitlement ?? 5 })}</span>
            <span>{t('hrPages.leave.used', { count: balance?.casualUsedDays ?? 0 })}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('hrPages.leave.maternityPaternity')}</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {balance?.maternityRemainingDays ?? 120} <span className="text-xs font-normal text-slate-400">{t('hrPages.leave.days')}</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>{t('hrPages.leave.legalMedicalNote')}</span>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('hrPages.leave.myRequests')}</h3>
          <span className="text-xs text-slate-400">{t('hrPages.leave.recordsCount', { count: requests.length })}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">{t('hrPages.leave.loading')}</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {t('hrPages.leave.empty')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#152238] text-[11px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">{t('hrPages.leave.typeCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.datesCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.daysCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.reasonCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.statusCol')}</th>
                  <th className="py-3 px-4 text-right">{t('hrPages.leave.actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-[#152238]/30">
                    <td className="py-3 px-4 font-bold capitalize text-slate-800 dark:text-slate-200">
                      {t(`hrPages.leave.types.${req.leaveType}`, req.leaveType)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {t('hrPages.leave.dayUnit', { count: req.totalLeaveDays })}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {req.requestReason}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={req.requestStatus || 'pending'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEvidenceTarget(req)}
                          className="p-1 text-slate-400 hover:text-[#00ced1]"
                          title={t('hrPages.leave.attachments')}
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        {req.requestStatus?.includes('pending') && (
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(req._id)}
                            className="text-xs text-rose-500 hover:underline font-bold"
                          >
                            {t('hrPages.leave.cancel')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('hrPages.leave.modalTitle')}</h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('hrPages.leave.leaveType')}</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="annual">{t('hrPages.leave.types.annual')}</option>
                  <option value="sick">{t('hrPages.leave.types.sick')}</option>
                  <option value="casual">{t('hrPages.leave.types.casual')}</option>
                  <option value="maternity">{t('hrPages.leave.types.maternity')}</option>
                  <option value="paternity">{t('hrPages.leave.types.paternity')}</option>
                  <option value="unpaid">{t('hrPages.leave.types.unpaid')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('hrPages.leave.startDate')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('hrPages.leave.endDate')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('hrPages.leave.startPeriod')}</label>
                  <select
                    value={startPeriod}
                    onChange={(e) => setStartPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                  >
                    <option value="full_day">{t('hrPages.leave.periods.full_day')}</option>
                    <option value="morning">{t('hrPages.leave.periods.morning')}</option>
                    <option value="afternoon">{t('hrPages.leave.periods.afternoon')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('hrPages.leave.endPeriod')}</label>
                  <select
                    value={endPeriod}
                    onChange={(e) => setEndPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                  >
                    <option value="full_day">{t('hrPages.leave.periods.full_day')}</option>
                    <option value="morning">{t('hrPages.leave.periods.morning')}</option>
                    <option value="afternoon">{t('hrPages.leave.periods.afternoon')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{t('hrPages.leave.reason')}</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('hrPages.leave.reasonPlaceholder')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('hrPages.leave.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl font-bold text-slate-950"
                  style={{ backgroundColor: '#00ced1' }}
                >
                  {submitting ? t('hrPages.leave.submitting') : t('hrPages.leave.submitRequest')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Evidence Drawer */}
      <EvidenceDrawer
        isOpen={!!evidenceTarget}
        onClose={() => setEvidenceTarget(null)}
        entityType="LeaveRequest"
        entityId={evidenceTarget?._id}
        entityTitle={evidenceTarget ? `${t(`hrPages.leave.types.${evidenceTarget.leaveType}`, evidenceTarget.leaveType)}` : t('hrPages.leave.modalTitle')}
      />
    </div>
  );
}
