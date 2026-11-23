import React, { useState, useEffect } from 'react';
import { CalendarCheck, Plus, Clock, FileText, CheckCircle, AlertCircle, Paperclip } from 'lucide-react';
import { leaveService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';

export default function LeaveDashboard() {
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
      setError('Please fill in all required fields');
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
        setMessage('Leave request submitted successfully!');
        setShowModal(false);
        setReason('');
        setStartDate('');
        setEndDate('');
        fetchLeaveData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await leaveService.cancelRequest(id);
      fetchLeaveData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel leave request');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#00ced1]" />
            <span>Leave Management & Balances</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track your accrued annual leave, submit time-off requests, and review approval stages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:brightness-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          style={{ backgroundColor: '#00ced1', color: '#020617' }}
        >
          <Plus className="w-4 h-4" style={{ color: '#020617' }} />
          <span style={{ color: '#020617' }}>Submit Leave Request</span>
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Annual Leave</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {balance?.annualRemainingDays ?? 16} <span className="text-xs font-normal text-slate-400">days left</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Accrued: {balance?.annualAccruedDays ?? 0}</span>
            <span>Used: {balance?.annualUsedDays ?? 0}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sick Leave</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {balance?.sickRemainingDays ?? 15} <span className="text-xs font-normal text-slate-400">days left</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Entitled: {balance?.sickEntitlement ?? 15}</span>
            <span>Used: {balance?.sickUsedDays ?? 0}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Casual Leave</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {balance?.casualRemainingDays ?? 5} <span className="text-xs font-normal text-slate-400">days left</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Entitled: {balance?.casualEntitlement ?? 5}</span>
            <span>Used: {balance?.casualUsedDays ?? 0}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maternity / Paternity</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {balance?.maternityRemainingDays ?? 120} <span className="text-xs font-normal text-slate-400">days</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>Legal entitlement with medical certification</span>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Leave Requests</h3>
          <span className="text-xs text-slate-400">{requests.length} records</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            You haven't submitted any leave requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#152238] text-[11px] font-bold text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-[#152238]/30">
                    <td className="py-3 px-4 font-bold capitalize text-slate-800 dark:text-slate-200">
                      {req.leaveType}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {req.totalLeaveDays} day(s)
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
                          title="Attachments"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        {req.requestStatus?.includes('pending') && (
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(req._id)}
                            className="text-xs text-rose-500 hover:underline font-bold"
                          >
                            Cancel
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
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Leave Request</h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">End Date</label>
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
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Start Period</label>
                  <select
                    value={startPeriod}
                    onChange={(e) => setStartPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                  >
                    <option value="full_day">Full Day</option>
                    <option value="morning">Morning Half</option>
                    <option value="afternoon">Afternoon Half</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">End Period</label>
                  <select
                    value={endPeriod}
                    onChange={(e) => setEndPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                  >
                    <option value="full_day">Full Day</option>
                    <option value="morning">Morning Half</option>
                    <option value="afternoon">Afternoon Half</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reason</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide reason for time-off..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl font-bold text-slate-950"
                  style={{ backgroundColor: '#00ced1' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
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
        entityTitle={evidenceTarget ? `${evidenceTarget.leaveType} leave` : 'Leave Request'}
      />
    </div>
  );
}
