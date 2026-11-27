import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  Calendar,
  FileText,
  Paperclip,
  X,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { leaveService } from '../../../services/hrService';
import { getEmployeeFullName, getEmployeeInitial } from '../../../utils/rbac';
import StatusBadge from '../StatusBadge';

export default function LeaveReviewModal({ isOpen, onClose, request, isExecutive, onReviewed }) {
  const { t } = useTranslation();

  const [action, setAction] = useState('approved');
  const [comments, setComments] = useState('');
  const [bypassDoubleApproval, setBypassDoubleApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !request) return null;

  const handleReview = async (decision) => {
    try {
      setSubmitting(true);
      setError('');

      const options = {};
      if (bypassDoubleApproval && isExecutive) {
        options.bypassDoubleApproval = true;
      }

      const res = await leaveService.reviewRequest(request._id, decision, comments, options);
      if (res.success) {
        onReviewed?.();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || t('hrPages.leave.reviewFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const isPendingManager =
    request.requestStatus === 'pending_manager' ||
    (request.requestStatus === 'pending' && request.managerApproval?.status !== 'approved');

  const isPendingHR =
    request.requestStatus === 'pending_hr' ||
    (request.managerApproval?.status === 'approved' && request.hrApproval?.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('hrPages.leave.reviewModalTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                Application #{request._id.slice(-6).toUpperCase()}
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

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Applicant Profile Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
              {getEmployeeInitial(request.employee)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {getEmployeeFullName(request.employee)}
              </h4>
              <p className="text-[11px] text-slate-500">
                {request.employee?.jobTitle || 'Staff'} • {request.employee?.department || 'Department'}
              </p>
            </div>
          </div>
          <StatusBadge status={request.requestStatus} />
        </div>

        {/* Leave Request Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              {t('hrPages.leave.leaveType')}
            </span>
            <span className="font-bold capitalize text-slate-800 dark:text-slate-200">
              {t(`hrPages.leave.types.${request.leaveType}`, request.leaveType)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Duration
            </span>
            <span className="font-bold text-[#00ced1]">
              {request.totalLeaveDays} day(s)
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Date Span
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('hrPages.leave.reason')}
          </span>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {request.requestReason || 'No reason provided'}
          </div>
        </div>

        {/* Supporting Attachments */}
        {request.supportingAttachments?.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('hrPages.leave.attachments')}
            </span>
            <div className="flex flex-wrap gap-2">
              {request.supportingAttachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#00ced1]/10 text-xs text-slate-700 dark:text-slate-300 hover:text-[#00ced1] transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span>Attachment #{idx + 1}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Accrual Notice: Advance Leave Indicator */}
        {request.isAdvanceLeave && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-100">
                Advance Leave Application (Monthly Restriction Notice)
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                The employee requested <strong>{request.totalLeaveDays} day(s)</strong>, which exceeds their accrued balance of <strong>{request.accruedDaysAtRequest || 0} day(s)</strong> as of the request date. Approving this request advances leave against future months of this year.
              </p>
            </div>
          </div>
        )}

        {/* Double-Approval Lifecycle Status */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
            {t('hrPages.leave.approvalLifecycle')}
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Stage 1: Manager */}
            <div
              className={`p-3 rounded-2xl border ${
                request.managerApproval?.status === 'approved'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : request.managerApproval?.status === 'rejected'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px]">Stage 1: Line Manager</span>
                <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/30">
                  {request.managerApproval?.status || 'Pending'}
                </span>
              </div>
              {request.managerApproval?.comments && (
                <p className="text-[11px] text-slate-500 italic mt-1">
                  "{request.managerApproval.comments}"
                </p>
              )}
            </div>

            {/* Stage 2: HR */}
            <div
              className={`p-3 rounded-2xl border ${
                request.hrApproval?.status === 'approved'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : request.hrApproval?.status === 'rejected'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[11px]">Stage 2: HR Officer</span>
                <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/30">
                  {request.hrApproval?.status || 'Pending'}
                </span>
              </div>
              {request.hrApproval?.comments && (
                <p className="text-[11px] text-slate-500 italic mt-1">
                  "{request.hrApproval.comments}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Executive Direct Override Option */}
        {isExecutive && !['approved', 'rejected', 'cancelled'].includes(request.requestStatus) && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="bypassDouble"
              checked={bypassDoubleApproval}
              onChange={(e) => setBypassDoubleApproval(e.target.checked)}
              className="rounded text-[#00ced1] focus:ring-[#00ced1] cursor-pointer"
            />
            <label
              htmlFor="bypassDouble"
              className="text-xs font-bold text-amber-800 dark:text-amber-200 cursor-pointer"
            >
              {t('hrPages.leave.bypassDoubleApproval')}
            </label>
          </div>
        )}

        {/* Review Comments */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {t('hrPages.leave.comments')}
          </label>
          <textarea
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={t('hrPages.leave.commentsPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
          >
            {t('common.cancel')}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleReview('rejected')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>{t('hrPages.leave.reject')}</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleReview('approved')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('hrPages.leave.approve')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
