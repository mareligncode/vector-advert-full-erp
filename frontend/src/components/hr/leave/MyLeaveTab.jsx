import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  Plus,
  Clock,
  FileText,
  Paperclip,
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  Search
} from 'lucide-react';
import LeaveBalanceCards from './LeaveBalanceCards';
import StatusBadge from '../StatusBadge';
import LeaveDetailModal from './LeaveDetailModal';

export default function MyLeaveTab({
  balance,
  requests,
  loading,
  onApplyClick,
  onCancelRequest,
  onEvidenceOpen,
  onRefresh
}) {
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);

  const filteredRequests = requests.filter((r) => {
    if (!statusFilter) return true;
    if (statusFilter === 'pending') {
      return ['pending', 'pending_manager', 'pending_hr'].includes(r.requestStatus);
    }
    return r.requestStatus === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Balances Overview */}
      <LeaveBalanceCards balance={balance} onApplyClick={onApplyClick} />

      {/* 2. My Applications Section */}
      <div className="rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('hrPages.leave.myRequests')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('hrPages.leave.recordsCount', { count: filteredRequests.length })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00ced1]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onApplyClick}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('hrPages.leave.submitBtn')}</span>
            </button>
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {t('hrPages.leave.loading')}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-3">
            <p>{t('hrPages.leave.empty')}</p>
            <button
              type="button"
              onClick={onApplyClick}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00ced1]/15 text-[#00ced1] hover:bg-[#00ced1]/25 inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('hrPages.leave.submitBtn')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#070b12] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('hrPages.leave.typeCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.datesCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.daysCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.reasonCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.statusCol')}</th>
                  <th className="py-3 px-4 text-right">{t('hrPages.leave.actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRequests.map((req) => (
                  <tr
                    key={req._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-[#152238]/30 transition-colors"
                  >
                    {/* Leave Type */}
                    <td className="py-3 px-4">
                      <span className="font-bold capitalize text-slate-900 dark:text-white block">
                        {t(`hrPages.leave.types.${req.leaveType}`, req.leaveType)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t(`hrPages.leave.periods.${req.startDayPeriod}`, req.startDayPeriod)}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>

                    {/* Days */}
                    <td className="py-3 px-4">
                      <span className="font-black text-[#00ced1]">
                        {t('hrPages.leave.dayUnit', { count: req.totalLeaveDays })}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={req.requestReason}>
                      {req.requestReason}
                    </td>

                    {/* Status & Review Stage */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <StatusBadge status={req.requestStatus} />
                        {req.isAdvanceLeave && (
                          <span className="text-[10px] block px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit">
                            Advance Request
                          </span>
                        )}
                        {req.requestStatus === 'pending_manager' && (
                          <span className="text-[10px] block text-amber-500 font-bold">
                            Stage 1: Manager
                          </span>
                        )}
                        {req.requestStatus === 'pending_hr' && (
                          <span className="text-[10px] block text-[#00ced1] font-bold">
                            Stage 2: HR Review
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(req)}
                          className="p-1.5 text-slate-400 hover:text-[#00ced1] rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEvidenceOpen?.(req)}
                          className="p-1.5 text-slate-400 hover:text-[#00ced1] rounded-lg transition-colors cursor-pointer"
                          title={t('hrPages.leave.attachments')}
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>

                        {['pending', 'pending_manager', 'pending_hr'].includes(req.requestStatus) && (
                          <button
                            type="button"
                            onClick={() => onCancelRequest?.(req._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title={t('hrPages.leave.cancel')}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Detail Modal */}
      {selectedDetail && (
        <LeaveDetailModal
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          request={selectedDetail}
        />
      )}
    </div>
  );
}
