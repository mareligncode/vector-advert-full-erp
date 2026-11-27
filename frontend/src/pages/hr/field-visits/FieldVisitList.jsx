import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Navigation,
  Eye,
  Camera,
  FileText,
  RotateCcw,
  ExternalLink,
  Shield,
  Layers,
  Paperclip,
  Edit3
} from 'lucide-react';
import { fieldVisitService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import {
  canManageFieldVisits,
  canCreateFieldVisit,
  canEditFieldVisit,
  canDeleteFieldVisit,
  getEmployeeFullName,
  getEmployeeInitial
} from '../../../utils/rbac';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';

// Subcomponents
import CreateFieldVisitModal from '../../../components/hr/field-visits/CreateFieldVisitModal';
import EditFieldVisitModal from '../../../components/hr/field-visits/EditFieldVisitModal';
import FieldCheckInModal from '../../../components/hr/field-visits/FieldCheckInModal';
import FieldVisitDetailModal from '../../../components/hr/field-visits/FieldVisitDetailModal';
import FieldVisitRegistryTab from '../../../components/hr/field-visits/FieldVisitRegistryTab';

export default function FieldVisitList() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  // Active Tab: 'my-visits' | 'registry'
  const [activeTab, setActiveTab] = useState('my-visits');

  // Data
  const [myVisits, setMyVisits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [checkInTarget, setCheckInTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [evidenceTarget, setEvidenceTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // RBAC Privileges
  const isManager = canManageFieldVisits(user);
  const canCreate = canCreateFieldVisit(user);
  const canEdit = canEditFieldVisit(user);
  const canDelete = canDeleteFieldVisit(user);

  const fetchFieldVisitData = async () => {
    try {
      setLoading(true);
      const [myRes, sumRes] = await Promise.allSettled([
        fieldVisitService.getMyVisits(),
        fieldVisitService.getMySummary()
      ]);

      if (myRes.status === 'fulfilled' && myRes.value?.success) {
        setMyVisits(myRes.value.data || []);
      }
      if (sumRes.status === 'fulfilled' && sumRes.value?.success) {
        setSummary(sumRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load field visit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldVisitData();
  }, []);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <span>{isAmharic ? 'የመስክ ጉዞዎች አስተዳደር' : 'Field Visits & Client Missions'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isAmharic
              ? 'የውጭ ስራዎችን፣ የደንበኛ ሳይት ፍተሻዎችን እና በGPS የተረጋገጡ የመስክ መግባቶችን ይከታተሉ።'
              : 'Dispatch field teams, monitor destination perimeters, and verify live on-site GPS check-ins.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchFieldVisitData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={t('common.refresh')}
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00ced1]' : ''}`} />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{isAmharic ? 'አዲስ የመስክ ጉዞ መድብ' : 'Schedule Field Visit'}</span>
            </button>
          )}
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

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isAmharic ? 'የእኔ የመስክ ጉዞዎች' : 'Assigned Visits'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {summary?.totalAssigned || myVisits.length}
            </p>
          </div>
        </div>

        {/* In-Progress */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isAmharic ? 'በስራ ላይ ያሉ' : 'In-Progress'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {summary?.inProgressCount || 0}
            </p>
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isAmharic ? 'የተጠናቀቁ' : 'Completed'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {summary?.completedCount || 0}
            </p>
          </div>
        </div>

        {/* Verified Check-Ins */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isAmharic ? 'የተረጋገጡ መግባቶች' : 'My Check-Ins'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {summary?.myCheckInsCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
        {/* Tab 1: My Field Visits */}
        <button
          type="button"
          onClick={() => setActiveTab('my-visits')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'my-visits'
              ? 'bg-[#00ced1] text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{isAmharic ? 'የእኔ የመስክ ጉዞዎች' : 'My Field Visits'}</span>
        </button>

        {/* Tab 2: All Field Visits Directory (Management & HR) */}
        {isManager && (
          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'registry'
                ? 'bg-[#00ced1] text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isAmharic ? 'የድርጅቱ የመስክ ጉዞዎች ማህደር' : 'Field Visits Registry'}</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div>
        {/* Tab 1: My Field Visits */}
        {activeTab === 'my-visits' && (
          <div>
            {loading ? (
              <div className="py-20 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-[#00ced1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-medium">{t('common.loading')}</span>
              </div>
            ) : myVisits.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-2">
                <MapPin className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  {isAmharic
                    ? 'እስካሁን ምንም የተመደበልዎት የመስክ ጉዞ የለም'
                    : 'No field visit missions assigned to you'}
                </p>
                <p className="text-xs text-slate-500">
                  {isAmharic
                    ? 'አዳዲስ የመስክ ስራዎች ሲመደቡ እዚህ ይታያሉ።'
                    : 'When you are assigned to a field visit team or designated as leader, it will appear here.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myVisits.map((v) => {
                  const checkInCount = (v.checkIns || []).length;
                  const isLeader =
                    user?.employee &&
                    v.leader &&
                    (v.leader._id === user.employee._id || v.leader === user.employee._id);

                  return (
                    <div
                      key={v._id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                    >
                      {/* Top Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#00ced1] transition-colors">
                            {v.visitPurpose}
                          </h3>
                          <StatusBadge status={v.visitStatus} />
                        </div>

                        {/* Schedule */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(v.visitDate).toLocaleDateString()}
                              {v.returnDate && ` – ${new Date(v.returnDate).toLocaleDateString()}`}
                            </span>
                          </span>
                          {v.returnDate && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                              {isAmharic ? 'የብዙ ቀናት' : 'Multi-Day'}
                            </span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{v.visitStartTime} – {v.visitEndTime}</span>
                          </span>
                        </div>

                        {/* Destination */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 line-clamp-1">
                          <Navigation className="w-3.5 h-3.5 text-[#00ced1] shrink-0" />
                          <span className="truncate">{v.visitAddress}</span>
                        </p>
                      </div>

                      {/* Team / Leader & Checked-In Staff Visibility Box */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">
                            {isAmharic ? 'የቡድን መሪ፡' : 'Leader:'} <strong className="text-slate-900 dark:text-white">{getEmployeeFullName(v.leader) || '—'}</strong>
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            checkInCount > 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {checkInCount} / {(v.employees || []).length + (v.leader ? 1 : 0)} {isAmharic ? 'ገብተዋል' : 'checked in'}
                          </span>
                        </div>

                        {/* Who Checked In List */}
                        {checkInCount > 0 && (
                          <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                              {isAmharic ? 'የገቡ ሰራተኞች (Checked In Staff):' : 'Checked In Staff:'}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {(v.checkIns || []).map((c, idx) => (
                                <span
                                  key={c._id || idx}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>{getEmployeeFullName(c.employee)}</span>
                                  <span className="opacity-70 font-mono text-[9px]">
                                    ({new Date(c.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setDetailTarget(v)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAmharic ? 'ዝርዝር' : 'Details'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setEditTarget(v)}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#00ced1] cursor-pointer"
                              title={isAmharic ? 'መረጃ አሻሽል' : 'Edit Visit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEvidenceTarget(v)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title={isAmharic ? 'አባሪዎች' : 'Evidence'}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>

                          {v.visitStatus !== 'completed' && v.visitStatus !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => setCheckInTarget(v)}
                              className="px-3 py-1.5 rounded-xl bg-[#00ced1] hover:brightness-95 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{isAmharic ? 'መግቢያ' : 'Check-In'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Field Visits Directory (Management & HR) */}
        {activeTab === 'registry' && isManager && (
          <FieldVisitRegistryTab
            onViewDetails={(v) => setDetailTarget(v)}
            onCheckInClick={(v) => setCheckInTarget(v)}
            onEvidenceOpen={(v) => setEvidenceTarget(v)}
            onEditVisit={(v) => setEditTarget(v)}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )}
      </div>

      {/* Create Field Visit Modal */}
      {isCreateModalOpen && (
        <CreateFieldVisitModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setMessage(
              isAmharic
                ? 'አዲስ የመስክ ጉዞ በተሳካ ሁኔታ ተመድቧል!'
                : 'Field visit assignment created successfully!'
            );
            fetchFieldVisitData();
            setTimeout(() => setMessage(''), 4000);
          }}
        />
      )}

      {/* Edit Field Visit Modal (HR & Management) */}
      {editTarget && (
        <EditFieldVisitModal
          isOpen={!!editTarget}
          visit={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setMessage(
              isAmharic
                ? 'የመስክ ጉዞ መረጃ በተሳካ ሁኔታ ተሻሽሏል!'
                : 'Field visit assignment updated successfully!'
            );
            fetchFieldVisitData();
            setTimeout(() => setMessage(''), 4000);
          }}
        />
      )}

      {/* On-Site Field Check-In Modal */}
      {checkInTarget && (
        <FieldCheckInModal
          isOpen={!!checkInTarget}
          visit={checkInTarget}
          onClose={() => setCheckInTarget(null)}
          onSuccess={(res) => {
            setMessage(
              isAmharic
                ? res.distanceMeters !== null
                  ? `በቦታው መገኘትዎ በተሳካ ሁኔታ ተረጋግጧል (${res.distanceMeters}m)`
                  : 'የመስክ መግቢያዎ በተሳካ ሁኔታ ተመዝግቧል!'
                : res.distanceMeters !== null
                ? `On-site field check-in verified successfully (${res.distanceMeters}m from site target)!`
                : 'Field check-in recorded successfully!'
            );
            fetchFieldVisitData();
            setTimeout(() => setMessage(''), 4000);
          }}
        />
      )}

      {/* Field Visit Detail & Audit Modal */}
      {detailTarget && (
        <FieldVisitDetailModal
          isOpen={!!detailTarget}
          visit={detailTarget}
          isLeaderOrManager={isManager}
          onClose={() => setDetailTarget(null)}
          onEditClick={(v) => {
            setDetailTarget(null);
            setEditTarget(v);
          }}
          onUpdated={() => {
            fetchFieldVisitData();
          }}
        />
      )}

      {/* Universal Evidence Drawer */}
      <EvidenceDrawer
        isOpen={!!evidenceTarget}
        onClose={() => setEvidenceTarget(null)}
        entityType="FieldVisit"
        entityId={evidenceTarget?._id}
        entityTitle={
          evidenceTarget
            ? `${isAmharic ? 'የመስክ ጉዞ' : 'Field Visit'} - ${evidenceTarget.visitPurpose}`
            : 'Field Visit'
        }
      />
    </div>
  );
}
