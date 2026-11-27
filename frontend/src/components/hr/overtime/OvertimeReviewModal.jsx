import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Building,
  User,
  Zap,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { overtimeService } from '../../../services/hrService';
import { getEmployeeFullName, getEmployeeInitial } from '../../../utils/rbac';

export default function OvertimeReviewModal({ isOpen, onClose, request, isExecutive, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [decision, setDecision] = useState('approved');
  const [comments, setComments] = useState('');
  const [bypassDoubleApproval, setBypassDoubleApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !request) return null;

  const emp = request.employee;
  const fullName = getEmployeeFullName(emp);
  const initial = getEmployeeInitial(emp);

  // Type labels and multipliers
  const getTypeBadge = (type, multiplier) => {
    switch (type) {
      case 'night_shift':
        return {
          label: isAmharic ? 'የሌሊት ፈረቃ (Night Shift)' : 'Night Shift',
          bg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
        };
      case 'weekend':
        return {
          label: isAmharic ? 'የሳምንት እረፍት ቀን (Weekend)' : 'Weekly Rest Day',
          bg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20'
        };
      case 'public_holiday':
        return {
          label: isAmharic ? 'የህዝብ በዓል ቀን (Public Holiday)' : 'Public Holiday',
          bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20'
        };
      case 'normal_day':
      default:
        return {
          label: isAmharic ? 'መደበኛ የስራ ቀን (Normal Day)' : 'Normal Day',
          bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20'
        };
    }
  };

  const typeInfo = getTypeBadge(request.overtimeType, request.rateMultiplier);

  const handleSubmit = async (actionDecision) => {
    try {
      setLoading(true);
      setError('');

      const res = await overtimeService.decideRequest(request._id, actionDecision, comments, {
        bypassDoubleApproval: isExecutive && bypassDoubleApproval
      });

      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'ውሳኔውን መመዝገብ አልተሳካም' : 'Failed to record review decision')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAmharic ? 'የትርፍ ሰዓት ማመልከቻ መመርመሪያ' : 'Review Overtime Application'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAmharic ? 'የስራ ሃላፊ እና የHR ይሁንታ ደረጃዎች' : 'Multi-tier Manager and HR approval workflow'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Applicant Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ced1] to-teal-600 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs">
                {initial}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{fullName}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>{emp?.employeeNumber || 'EMP'}</span>
                  <span>•</span>
                  <span>{emp?.jobTitle || 'Staff'}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {emp?.department || 'Operations'}
              </span>
            </div>
          </div>

          {/* Overtime Request Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {isAmharic ? 'ቀን' : 'Date'}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(request.requestDate).toLocaleDateString()}</span>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {isAmharic ? 'የሰዓት ክልል' : 'Window'}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                {request.startTime} – {request.endTime}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {isAmharic ? 'ቆይታ' : 'Hours'}
              </span>
              <p className="text-xs font-black text-[#00ced1] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{request.totalHours} hrs</span>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {isAmharic ? 'ተመን' : 'Rate'}
              </span>
              <p className="text-xs font-black text-amber-500">
                {request.rateMultiplier || 1.25}x
              </p>
            </div>
          </div>

          {/* Type Badge Card */}
          <div className="flex items-center justify-between p-3 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-medium">
              {isAmharic ? 'የትርፍ ሰዓት ምድብ፡' : 'Overtime Classification:'}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${typeInfo.bg}`}>
              {typeInfo.label}
            </span>
          </div>

          {/* Reason Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <span className="text-[11px] font-bold text-slate-500">
              {isAmharic ? 'የቀረበው የስራ ምክንያት፡' : 'Applicant Justification:'}
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {request.requestReason || '—'}
            </p>
          </div>

          {/* Multi-stage Pipeline Progress */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAmharic ? 'የማጽደቅ ሂደት ደረጃዎች' : 'Approval Pipeline'}
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Stage 1: Department Manager */}
              <div
                className={`p-3 rounded-2xl border text-xs ${
                  request.managerApproval?.status === 'approved'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : request.managerApproval?.status === 'rejected'
                    ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{isAmharic ? 'ደረጃ 1፡ የስራ ክፍል ሃላፊ' : 'Stage 1: Manager'}</span>
                  <span className="uppercase text-[9px] font-black">
                    {request.managerApproval?.status || 'pending'}
                  </span>
                </div>
                {request.managerApproval?.comments && (
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    "{request.managerApproval.comments}"
                  </p>
                )}
              </div>

              {/* Stage 2: HR Officer */}
              <div
                className={`p-3 rounded-2xl border text-xs ${
                  request.hrApproval?.status === 'approved'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : request.hrApproval?.status === 'rejected'
                    ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{isAmharic ? 'ደረጃ 2፡ የHR ኦፊሰር' : 'Stage 2: HR Officer'}</span>
                  <span className="uppercase text-[9px] font-black">
                    {request.hrApproval?.status || 'pending'}
                  </span>
                </div>
                {request.hrApproval?.comments && (
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    "{request.hrApproval.comments}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Executive Direct Approval Bypass Option */}
          {isExecutive && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-start gap-2.5">
              <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="execBypass" className="text-xs font-bold text-purple-950 dark:text-purple-200 cursor-pointer">
                    {isAmharic
                      ? 'የዋና ስራ አስፈፃሚ ቀጥታ ማጽደቂያ (Executive Override)'
                      : 'Executive Direct Approval (Approve both stages immediately)'}
                  </label>
                  <input
                    type="checkbox"
                    id="execBypass"
                    checked={bypassDoubleApproval}
                    onChange={(e) => setBypassDoubleApproval(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Decision Comments Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'የገምጋሚው አስተያየት እና ውሳኔ' : 'Review Comments / Decision Notes'}
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                isAmharic
                  ? 'የማጽደቂያ ወይም የውድቅ ማድረጊያ ምክንያት ያክሉ...'
                  : 'Add audit notes or feedback for the applicant...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isAmharic ? 'ዝጋ' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('rejected')}
              className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>{isAmharic ? 'ውድቅ አድርግ' : 'Reject Request'}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('approved')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? (isAmharic ? 'በመመዝገብ ላይ...' : 'Saving...') : (isAmharic ? 'ጥያቄውን አጽድቅ' : 'Approve Request')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
