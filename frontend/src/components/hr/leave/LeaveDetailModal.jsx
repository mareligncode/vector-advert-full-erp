import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  Calendar,
  Clock,
  X,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  User
} from 'lucide-react';
import StatusBadge from '../StatusBadge';

export default function LeaveDetailModal({ isOpen, onClose, request }) {
  const { t } = useTranslation();

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Leave Request Details
              </h3>
              <p className="text-xs text-slate-400">
                Application #{request._id?.slice(-6)?.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Type Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              {t('hrPages.leave.leaveType')}
            </span>
            <span className="text-sm font-black capitalize text-slate-900 dark:text-white">
              {t(`hrPages.leave.types.${request.leaveType}`, request.leaveType)}
            </span>
          </div>
          <StatusBadge status={request.requestStatus} />
        </div>

        {/* Dates & Duration */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Duration
            </span>
            <span className="font-black text-[#00ced1] text-sm">
              {request.totalLeaveDays} day(s)
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {t(`hrPages.leave.periods.${request.startDayPeriod}`, request.startDayPeriod)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Dates
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300 block">
              {new Date(request.startDate).toLocaleDateString()}
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300 block">
              to {new Date(request.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('hrPages.leave.reason')}
          </span>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
            {request.requestReason}
          </div>
        </div>

        {/* Double-Approval Audit Log */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('hrPages.leave.approvalLifecycle')}
          </h5>
          <div className="space-y-2 text-xs">
            {/* Stage 1: Line Manager */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Stage 1: Department Manager Review
                </span>
                <span className="text-[10px] text-slate-400">
                  {request.managerApproval?.approvedAt
                    ? `Decided on ${new Date(request.managerApproval.approvedAt).toLocaleDateString()}`
                    : 'Awaiting manager review'}
                </span>
                {request.managerApproval?.comments && (
                  <p className="text-[11px] text-slate-500 italic mt-1">
                    "{request.managerApproval.comments}"
                  </p>
                )}
              </div>
              <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-slate-800">
                {request.managerApproval?.status || 'Pending'}
              </span>
            </div>

            {/* Stage 2: HR Officer */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Stage 2: HR Officer Final Approval
                </span>
                <span className="text-[10px] text-slate-400">
                  {request.hrApproval?.approvedAt
                    ? `Decided on ${new Date(request.hrApproval.approvedAt).toLocaleDateString()}`
                    : 'Awaiting HR final review'}
                </span>
                {request.hrApproval?.comments && (
                  <p className="text-[11px] text-slate-500 italic mt-1">
                    "{request.hrApproval.comments}"
                  </p>
                )}
              </div>
              <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-slate-800">
                {request.hrApproval?.status || 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Close */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
