import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  Calendar,
  Users,
  Layers,
  Sliders,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { leaveService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import {
  canViewAllLeave,
  canReviewLeave,
  canAdjustLeaveBalance,
  canInitializeLeave,
  hasAnyRole,
  EXECUTIVE_ROLES
} from '../../../utils/rbac';

// Subcomponents
import MyLeaveTab from '../../../components/hr/leave/MyLeaveTab';
import LeaveRegistryTab from '../../../components/hr/leave/LeaveRegistryTab';
import CompanyBalancesTab from '../../../components/hr/leave/CompanyBalancesTab';
import LeavePolicyConfigTab from '../../../components/hr/leave/LeavePolicyConfigTab';
import LeaveRequestModal from '../../../components/hr/leave/LeaveRequestModal';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';

export default function LeaveDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Active Tab: 'my-leave' | 'approvals' | 'balances'
  const [activeTab, setActiveTab] = useState('my-leave');

  // Shared Data
  const [balance, setBalance] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [evidenceTarget, setEvidenceTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // RBAC
  const isManager = canViewAllLeave(user);
  const isExecutive = hasAnyRole(user, EXECUTIVE_ROLES);
  const canAdjust = canAdjustLeaveBalance(user);

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
        setMyRequests(reqRes.value.data || []);
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

  const handleCancelRequest = async (id) => {
    if (!window.confirm(t('hrPages.leave.cancelConfirm'))) return;
    try {
      const res = await leaveService.cancelRequest(id);
      if (res.success) {
        setMessage('Leave request cancelled successfully');
        fetchLeaveData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('hrPages.leave.cancelFailed'));
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span>{t('hrPages.leave.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('hrPages.leave.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchLeaveData}
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
            <span>{t('hrPages.leave.submitBtn')}</span>
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

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
        {/* Tab 1: My Leave */}
        <button
          type="button"
          onClick={() => setActiveTab('my-leave')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'my-leave'
              ? 'bg-[#00ced1] text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>{t('hrPages.leave.tabMyLeave')}</span>
        </button>

        {/* Tab 2: Leave Approvals (Management / HR) */}
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
            <span>{t('hrPages.leave.tabApprovals')}</span>
          </button>
        )}

        {/* Tab 3: Company Balances (HR Admin / CEO) */}
        {canAdjust && (
          <button
            type="button"
            onClick={() => setActiveTab('balances')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'balances'
                ? 'bg-[#00ced1] text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('hrPages.leave.tabBalances')}</span>
          </button>
        )}

        {/* Tab 4: Policy & Rules (HR Admin / CEO) */}
        {canAdjust && (
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
            <span>{t('hrPages.leave.tabPolicy') || 'Policy & Rules'}</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'my-leave' && (
          <MyLeaveTab
            balance={balance}
            requests={myRequests}
            loading={loading}
            onApplyClick={() => setIsApplyModalOpen(true)}
            onCancelRequest={handleCancelRequest}
            onEvidenceOpen={(req) => setEvidenceTarget(req)}
            onRefresh={fetchLeaveData}
          />
        )}

        {activeTab === 'approvals' && isManager && (
          <LeaveRegistryTab
            isExecutive={isExecutive}
            onEvidenceOpen={(req) => setEvidenceTarget(req)}
          />
        )}

        {activeTab === 'balances' && canAdjust && (
          <CompanyBalancesTab canAdjust={canAdjust} />
        )}

        {activeTab === 'policy' && canAdjust && (
          <LeavePolicyConfigTab
            onConfigSaved={() => {
              fetchLeaveData();
            }}
          />
        )}
      </div>

      {/* Leave Application Modal */}
      {isApplyModalOpen && (
        <LeaveRequestModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          balance={balance}
          onSuccess={() => {
            setMessage(t('hrPages.leave.submitSuccess'));
            fetchLeaveData();
            setTimeout(() => setMessage(''), 4000);
          }}
        />
      )}

      {/* Universal Evidence Drawer */}
      <EvidenceDrawer
        isOpen={!!evidenceTarget}
        onClose={() => setEvidenceTarget(null)}
        entityType="LeaveRequest"
        entityId={evidenceTarget?._id}
        entityTitle={
          evidenceTarget
            ? `${t(`hrPages.leave.types.${evidenceTarget.leaveType}`, evidenceTarget.leaveType)} - ${evidenceTarget.totalLeaveDays}d`
            : t('hrPages.leave.modalTitle')
        }
      />
    </div>
  );
}
