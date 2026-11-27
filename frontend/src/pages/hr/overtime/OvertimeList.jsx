import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Sliders,
  Sun,
  Moon,
  CalendarDays,
  PartyPopper,
  Paperclip,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { overtimeService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import {
  canViewAllOvertime,
  canReviewOvertime,
  canConfigureOvertime,
  hasAnyRole,
  EXECUTIVE_ROLES
} from '../../../utils/rbac';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';

// Subcomponents
import OvertimeRequestModal from '../../../components/hr/overtime/OvertimeRequestModal';
import OvertimeReviewModal from '../../../components/hr/overtime/OvertimeReviewModal';
import OvertimeRegistryTab from '../../../components/hr/overtime/OvertimeRegistryTab';
import OvertimePolicyConfigTab from '../../../components/hr/overtime/OvertimePolicyConfigTab';

export default function OvertimeList() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  // Active Tab: 'my-overtime' | 'approvals' | 'policy'
  const [activeTab, setActiveTab] = useState('my-overtime');

  // Data State
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [evidenceTarget, setEvidenceTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // RBAC Privileges
  const isManager = canViewAllOvertime(user);
  const canConfigure = canConfigureOvertime(user);
  const isExecutive = hasAnyRole(user, EXECUTIVE_ROLES);

  const fetchOvertimeData = async () => {
    try {
      setLoading(true);
      const [reqRes, sumRes] = await Promise.allSettled([
        overtimeService.getMyRequests(),
        overtimeService.getMySummary()
      ]);

      if (reqRes.status === 'fulfilled' && reqRes.value?.success) {
        setRequests(reqRes.value.data || []);
      }
      if (sumRes.status === 'fulfilled' && sumRes.value?.success) {
        setSummary(sumRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load overtime data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertimeData();
  }, []);

  const handleCancelRequest = async (id) => {
    if (
      !window.confirm(
        isAmharic
          ? 'እርግጠኛ ነዎት ይህን የትርፍ ሰዓት ጥያቄ መሰረዝ ይፈልጋሉ?'
          : 'Are you sure you want to cancel this overtime request?'
      )
    )
      return;

    try {
      const res = await overtimeService.cancelRequest(id);
      if (res.success) {
        setMessage(
          isAmharic
            ? 'የትርፍ ሰዓት ጥያቄው በተሳካ ሁኔታ ተሰርዟል'
            : 'Overtime request cancelled successfully'
        );
        fetchOvertimeData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'ጥያቄውን መሰረዝ አልተሳካም' : 'Failed to cancel overtime request')
      );
      setTimeout(() => setError(''), 4000);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'night_shift':
        return {
          label: isAmharic ? 'የሌሊት ፈረቃ (1.5x)' : 'Night Shift (1.5x)',
          color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
        };
      case 'weekend':
        return {
          label: isAmharic ? 'የእረፍት ቀን (2.0x)' : 'Weekend (2.0x)',
          color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
        };
      case 'public_holiday':
        return {
          label: isAmharic ? 'የበዓል ቀን (2.5x)' : 'Public Holiday (2.5x)',
          color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
        };
      case 'normal_day':
      default:
        return {
          label: isAmharic ? 'መደበኛ ቀን (1.25x)' : 'Normal Day (1.25x)',
          color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
        };
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span>{isAmharic ? 'የትርፍ ሰዓት አስተዳደር' : 'Overtime Management'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isAmharic
              ? 'የትርፍ ሰዓት ጥያቄዎችን ያቅርቡ፣ ይከታተሉ እና የማጽደቂያ ደረጃዎችን ይመርምሩ።'
              : 'Submit overtime hours, track approvals, and configure statutory multiplier rates.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchOvertimeData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={t('common.refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00ced1]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{isAmharic ? 'የትርፍ ሰዓት ጠይቅ' : 'Apply for Overtime'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Hours */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isAmharic ? 'ይሁንታ ያገኘ ሰዓት' : 'Approved Hours'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {summary?.totalApprovedHours || 0} <span className="text-xs font-bold text-slate-400">hrs</span>
            </p>
          </div>
        </div>

        {/* Pending Hours */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isAmharic ? 'በማጽደቅ ሂደት ላይ' : 'Pending Hours'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {summary?.totalPendingHours || 0} <span className="text-xs font-bold text-slate-400">hrs</span>
            </p>
          </div>
        </div>

        {/* Normal Day OT (1.25x) */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isAmharic ? 'መደበኛ ቀን (1.25x)' : 'Day Shift (1.25x)'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {summary?.hoursByType?.normal_day || 0} <span className="text-xs font-bold text-slate-400">hrs</span>
            </p>
          </div>
        </div>

        {/* Special Multiplier OT (1.5x - 2.5x) */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isAmharic ? 'ልዩ ፈረቃ (1.5x-2.5x)' : 'Special OT (1.5x-2.5x)'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {(summary?.hoursByType?.night_shift || 0) +
                (summary?.hoursByType?.weekend || 0) +
                (summary?.hoursByType?.public_holiday || 0)}{' '}
              <span className="text-xs font-bold text-slate-400">hrs</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
        {/* Tab 1: My Overtime */}
        <button
          type="button"
          onClick={() => setActiveTab('my-overtime')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'my-overtime'
              ? 'bg-[#00ced1] text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isAmharic ? 'የእኔ ትርፍ ሰዓት' : 'My Overtime Requests'}</span>
        </button>

        {/* Tab 2: Approvals Registry (Management / HR) */}
        {isManager && (
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-[#00ced1] text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isAmharic ? 'የትርፍ ሰዓት ማጽደቂያ' : 'Overtime Approvals'}</span>
          </button>
        )}

        {/* Tab 3: Policy & Multiplier Rates (HR Admin / CEO) */}
        {canConfigure && (
          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'policy'
                ? 'bg-[#00ced1] text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isAmharic ? 'ደንቦች እና ተመኖች' : 'Policy & Rates'}</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div>
        {/* Tab 1: My Overtime */}
        {activeTab === 'my-overtime' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">{isAmharic ? 'ቀን' : 'Date'}</th>
                    <th className="py-3 px-3">{isAmharic ? 'የሰዓት ክልል' : 'Time Window'}</th>
                    <th className="py-3 px-3">{isAmharic ? 'አይነት' : 'Category'}</th>
                    <th className="py-3 px-3 text-right">{isAmharic ? 'ሰዓታት' : 'Hours'}</th>
                    <th className="py-3 px-4">{isAmharic ? 'ምክንያት' : 'Reason'}</th>
                    <th className="py-3 px-3">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{isAmharic ? 'እርምጃዎች' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="w-5 h-5 border-2 border-[#00ced1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>{t('common.loading')}</span>
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Zap className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold">
                          {isAmharic
                            ? 'እስካሁን ምንም የትርፍ ሰዓት ጥያቄ አላቀረቡም'
                            : "You haven't submitted any overtime requests yet"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => {
                      const badge = getTypeBadge(r.overtimeType);
                      const isPending = ['pending', 'pending_manager', 'pending_hr'].includes(r.requestStatus);

                      return (
                        <tr
                          key={r._id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {new Date(r.requestDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {r.startTime} – {r.endTime}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-[#00ced1] font-mono whitespace-nowrap">
                            {r.totalHours} hrs
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-500 text-[11px]">
                            {r.requestReason}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <StatusBadge status={r.requestStatus} />
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Attachments */}
                              <button
                                type="button"
                                onClick={() => setEvidenceTarget(r)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                title={isAmharic ? 'አባሪዎች እና ማስረጃዎች' : 'Attachments & Evidence'}
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </button>

                              {/* Cancel Button */}
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelRequest(r._id)}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                                  title={isAmharic ? 'ጥያቄውን ሰርዝ' : 'Cancel Request'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Approvals Registry (Management / HR) */}
        {activeTab === 'approvals' && isManager && (
          <OvertimeRegistryTab
            onReviewRequest={(req) => setReviewTarget(req)}
            onEvidenceOpen={(req) => setEvidenceTarget(req)}
            isExecutive={isExecutive}
          />
        )}

        {/* Tab 3: Policy & Multipliers (HR Admin / CEO) */}
        {activeTab === 'policy' && canConfigure && (
          <OvertimePolicyConfigTab onConfigSaved={fetchOvertimeData} />
        )}
      </div>

      {/* Apply Overtime Modal */}
      {isApplyModalOpen && (
        <OvertimeRequestModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onSuccess={() => {
            setMessage(
              isAmharic
                ? 'የትርፍ ሰዓት ጥያቄ በተሳካ ሁኔታ ቀርቧል!'
                : 'Overtime request submitted successfully!'
            );
            fetchOvertimeData();
            setTimeout(() => setMessage(''), 4000);
          }}
        />
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <OvertimeReviewModal
          isOpen={!!reviewTarget}
          request={reviewTarget}
          isExecutive={isExecutive}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            setMessage(
              isAmharic
                ? 'የትርፍ ሰዓት ውሳኔ በተሳካ ሁኔታ ተመዝግቧል!'
                : 'Overtime review decision recorded successfully!'
            );
            fetchOvertimeData();
            setTimeout(() => setMessage(''), 4000);
          }}
        />
      )}

      {/* Universal Evidence Drawer */}
      <EvidenceDrawer
        isOpen={!!evidenceTarget}
        onClose={() => setEvidenceTarget(null)}
        entityType="OvertimeRequest"
        entityId={evidenceTarget?._id}
        entityTitle={
          evidenceTarget
            ? `${isAmharic ? 'የትርፍ ሰዓት' : 'Overtime'} - ${new Date(evidenceTarget.requestDate).toLocaleDateString()} (${evidenceTarget.totalHours}h)`
            : 'Overtime'
        }
      />
    </div>
  );
}
