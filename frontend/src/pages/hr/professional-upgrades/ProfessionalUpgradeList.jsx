import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Plus,
  Building,
  Calendar,
  DollarSign,
  Paperclip,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { professionalUpgradeService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';
import { useAuth } from '../../../context/AuthContext';
import { MANAGEMENT_ROLES, hasAnyRole } from '../../../utils/rbac';

export default function ProfessionalUpgradeList() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  const isManagement = hasAnyRole(user, MANAGEMENT_ROLES);

  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isManagement ? 'all' : 'my');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [evidenceTarget, setEvidenceTarget] = useState(null);

  // Create form
  const [upgradeType, setUpgradeType] = useState('certification');
  const [upgradeTitle, setUpgradeTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [companySponsorshipRequested, setCompanySponsorshipRequested] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchUpgrades = async () => {
    try {
      setLoading(true);
      const res =
        activeTab === 'all' && isManagement
          ? await professionalUpgradeService.getUpgrades({ limit: 100 })
          : await professionalUpgradeService.getMyUpgrades();
      if (res.success) setUpgrades(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpgrades();
  }, [activeTab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const res = await professionalUpgradeService.createUpgrade({
        upgradeType,
        upgradeTitle: upgradeTitle.trim(),
        institution: institution.trim(),
        fieldOfStudy: fieldOfStudy.trim(),
        startDate,
        expectedCompletionDate: expectedCompletionDate || undefined,
        estimatedCost: Number(estimatedCost) || 0,
        companySponsorshipRequested
      });
      if (res.success) {
        setIsCreateOpen(false);
        setUpgradeTitle('');
        setInstitution('');
        setFieldOfStudy('');
        fetchUpgrades();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit upgrade request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id, status) => {
    const notes =
      status === 'rejected'
        ? window.prompt(isAmharic ? 'ውድቅ የተደረገበትን ምክንያት ያስገቡ፡' : 'Enter rejection reason:')
        : 'Reviewed via HR Portal';
    if (status === 'rejected' && !notes) return;

    try {
      const res = await professionalUpgradeService.reviewUpgrade(id, status, notes);
      if (res.success) fetchUpgrades();
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.upgrades.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.upgrades.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isManagement && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#00ced1] text-white'
                    : 'bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800'
                }`}
              >
                {isAmharic ? 'ሁሉም ጥያቄዎች' : 'All Requests'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === 'my'
                    ? 'bg-[#00ced1] text-white'
                    : 'bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800'
                }`}
              >
                {isAmharic ? 'የእኔ ጥያቄዎች' : 'My Requests'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white text-xs font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAmharic ? 'አዲስ ጥያቄ አቅርብ' : 'Request Sponsorship'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{t('hrPages.upgrades.loading')}</div>
        ) : upgrades.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="font-bold text-slate-600 dark:text-slate-300">{t('hrPages.upgrades.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#152238] border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-black text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">{isAmharic ? 'ሰራተኛ / ፕሮግራም' : 'Employee & Program'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ተቋም' : 'Institution'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'የሚገመት ወጪ' : 'Est. Cost'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{isAmharic ? 'ተግባራት' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {upgrades.map((u) => {
                  const empName = u.employee
                    ? [u.employee.name?.first, u.employee.name?.last].filter(Boolean).join(' ')
                    : 'Self';
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 dark:hover:bg-[#152238]/50">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white">{u.upgradeTitle}</div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {empName} • {u.upgradeType}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold">{u.institution}</div>
                        <div className="text-[11px] text-slate-400">{u.fieldOfStudy}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        {Number(u.estimatedCost || 0).toLocaleString()} {isAmharic ? 'ብር' : 'ETB'}
                        {u.companySponsorshipRequested && (
                          <div className="text-[10px] text-[#00ced1] font-black">
                            {isAmharic ? 'ስፖንሰርሺፕ ተጠይቋል' : 'Sponsorship Requested'}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={u.requestStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEvidenceTarget(u)}
                            title={isAmharic ? 'ሰነዶች' : 'Evidence'}
                            className="p-1.5 text-slate-400 hover:text-[#00ced1] rounded-lg cursor-pointer"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>

                          {isManagement && (
                            <select
                              value={u.requestStatus}
                              onChange={(e) => handleReview(u._id, e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold text-[11px]"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="rejected">Rejected</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50">
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                {isAmharic ? 'የሙያ ማሻሻያ / የትምህርት ስፖንሰርሺፕ ጥያቄ' : 'Request Professional Upgrade'}
              </h2>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'የፕሮግራም ዓይነት' : 'Upgrade Type'}</label>
                  <select
                    value={upgradeType}
                    onChange={(e) => setUpgradeType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  >
                    <option value="degree">Bachelor's Degree</option>
                    <option value="masters">Master's Degree</option>
                    <option value="phd">PhD</option>
                    <option value="certification">Certification</option>
                    <option value="diploma">Diploma</option>
                    <option value="course">Short Course</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'የፕሮግራም ርዕስ *' : 'Program Title *'}</label>
                  <input
                    type="text"
                    required
                    value={upgradeTitle}
                    onChange={(e) => setUpgradeTitle(e.target.value)}
                    placeholder="e.g. MSc in Project Management"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'ተቋም / ዩኒቨርሲቲ *' : 'Institution *'}</label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'የትምህርት መስክ' : 'Field of Study'}</label>
                  <input
                    type="text"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'መጀመሪያ ቀን *' : 'Start Date *'}</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'ማብቂያ ቀን' : 'Expected End'}</label>
                  <input
                    type="date"
                    value={expectedCompletionDate}
                    onChange={(e) => setExpectedCompletionDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'ወጪ (ብር)' : 'Est. Cost (ETB)'}</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={companySponsorshipRequested}
                  onChange={(e) => setCompanySponsorshipRequested(e.target.checked)}
                  className="w-4 h-4 accent-[#00ced1]"
                />
                <span>{isAmharic ? 'የኩባንያ የትምህርት ወጪ ሽፋን (ስፖንሰርሺፕ) እጠይቃለሁ' : 'Request Company Tuition Sponsorship'}</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#00ced1] text-white font-black cursor-pointer"
                >
                  {submitting ? '...' : isAmharic ? 'ጥያቄውን ላክ' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {evidenceTarget && (
        <EvidenceDrawer
          isOpen={Boolean(evidenceTarget)}
          onClose={() => setEvidenceTarget(null)}
          entityType="ProfessionalUpgrade"
          entityId={evidenceTarget._id}
          entityTitle={evidenceTarget.upgradeTitle}
        />
      )}
    </div>
  );
}
