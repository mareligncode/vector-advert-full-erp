import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  Plus,
  Search,
  Users,
  CheckCircle2,
  UserCheck,
  Award,
  Eye,
  Edit,
  Trash2,
  Paperclip,
  Building,
  BookOpen,
  Calendar
} from 'lucide-react';
import { internshipService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';
import RegisterInternModal from '../../../components/hr/internships/RegisterInternModal';
import EditInternModal from '../../../components/hr/internships/EditInternModal';
import InternDetailModal from '../../../components/hr/internships/InternDetailModal';
import { useAuth } from '../../../context/AuthContext';
import { canCreateEmployee, canDeleteEmployee, DEPARTMENTS } from '../../../utils/rbac';

export default function InternshipList() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [selectedInternId, setSelectedInternId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [evidenceTarget, setEvidenceTarget] = useState(null);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const res = await internshipService.getInternships({ limit: 150 });
      if (res.success) {
        setInternships(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load internships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleStatusChange = async (id, nextStatus) => {
    try {
      const res = await internshipService.updateStatus(id, nextStatus);
      if (res.success) {
        fetchInternships();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        isAmharic
          ? 'ይህን የተለማማጅ መዝገብ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?'
          : 'Are you sure you want to delete this internship record?'
      )
    ) {
      return;
    }
    try {
      const res = await internshipService.deleteInternship(id);
      if (res.success) {
        fetchInternships();
      }
    } catch (err) {
      console.error('Failed to delete intern:', err);
    }
  };

  const filteredInterns = internships.filter((item) => {
    if (deptFilter !== 'all' && item.placement?.assignedDepartment !== deptFilter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.placement?.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const fullName = [item.name?.first, item.name?.middle, item.name?.last]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchNum = item.internshipNumber?.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      const matchUni = item.academicProfile?.university?.toLowerCase().includes(q);
      if (!fullName.includes(q) && !matchNum && !matchEmail && !matchUni) return false;
    }
    return true;
  });

  // Metrics
  const totalCount = internships.length;
  const activeCount = internships.filter((i) => i.placement?.status === 'active').length;
  const completedCount = internships.filter((i) => i.placement?.status === 'completed').length;
  const convertedCount = internships.filter(
    (i) => i.placement?.status === 'converted_to_employee'
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.internships.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.internships.subtitle')}
          </p>
        </div>

        {canCreateEmployee(user) && (
          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white text-xs font-black shadow-lg shadow-[#00ced1]/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isAmharic ? 'አዲስ ተለማማጅ መዝግብ' : 'Register Intern'}</span>
          </button>
        )}
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAmharic ? 'ጠቅላላ ተለማማጆች' : 'Total Interns'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalCount}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAmharic ? 'በልምምድ ላይ ያሉ' : 'Active Placements'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {activeCount}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAmharic ? 'ያጠናቀቁ' : 'Completed'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {completedCount}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAmharic ? 'ሰራተኛ የሆኑ' : 'Converted to Staff'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {convertedCount}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              isAmharic
                ? 'በስም፣ በመለያ ቁጥር (INT-) ወይም በዩኒቨርሲቲ ፈልግ...'
                : 'Search by name, INT number, email, or university...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="all">{isAmharic ? 'ሁሉም ዲፓርትመንት' : 'All Departments'}</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="all">{isAmharic ? 'ሁሉም ዓይነት' : 'All Types'}</option>
            <option value="tutorial">Tutorial (Unpaid)</option>
            <option value="paid">Paid Stipend</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="all">{isAmharic ? 'ሁሉም ሁኔታ' : 'All Statuses'}</option>
            <option value="applied">Applied</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="converted_to_employee">Converted to Staff</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {t('hrPages.internships.loading')}
          </div>
        ) : filteredInterns.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {t('hrPages.internships.empty')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#152238] border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">{isAmharic ? 'ተለማማጅ' : 'Intern'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ዩኒቨርሲቲ / ትምህርት' : 'University & Study'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ምደባ' : 'Placement'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ዓይነት' : 'Type'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{isAmharic ? 'ተግባራት' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredInterns.map((intern) => {
                  const fullName =
                    intern.fullName ||
                    [intern.name?.first, intern.name?.middle, intern.name?.last]
                      .filter(Boolean)
                      .join(' ');
                  const supName = intern.placement?.supervisor
                    ? [intern.placement.supervisor.name?.first, intern.placement.supervisor.name?.last]
                        .filter(Boolean)
                        .join(' ')
                    : null;

                  return (
                    <tr
                      key={intern._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#152238]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#00ced1]/15 text-[#00ced1] font-black flex items-center justify-center shrink-0">
                            {fullName ? fullName.charAt(0).toUpperCase() : 'I'}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInternId(intern._id);
                                setIsDetailOpen(true);
                              }}
                              className="font-black text-slate-900 dark:text-white hover:text-[#00ced1] text-left cursor-pointer"
                            >
                              {fullName}
                            </button>
                            <div className="text-[11px] text-slate-400">
                              <span className="font-mono font-bold text-[#00ced1]">
                                {intern.internshipNumber}
                              </span>{' '}
                              • {intern.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{intern.academicProfile?.university || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {intern.academicProfile?.departmentOfStudy || 'General'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {intern.placement?.internshipPosition || 'Intern'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {intern.placement?.assignedDepartment || 'Unassigned'}
                          {supName && ` • Sup: ${supName}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            intern.type === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                          }`}
                        >
                          {intern.type === 'paid'
                            ? `Paid (${intern.stipendAmount} ETB)`
                            : 'Tutorial'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={intern.placement?.status || 'active'}
                          onChange={(e) => handleStatusChange(intern._id, e.target.value)}
                          className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold text-[11px] text-slate-800 dark:text-slate-200"
                        >
                          <option value="applied">Applied</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="terminated">Terminated</option>
                          <option value="withdrawn">Withdrawn</option>
                          <option value="converted_to_employee">Converted</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEvidenceTarget(intern)}
                            title="Evidence & Documents"
                            className="p-1.5 text-slate-400 hover:text-[#00ced1] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInternId(intern._id);
                              setIsDetailOpen(true);
                            }}
                            title="View Dossier"
                            className="p-1.5 text-[#00ced1] hover:bg-[#00ced1]/10 rounded-lg cursor-pointer font-bold flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>{isAmharic ? 'ዝርዝር' : 'Dossier'}</span>
                          </button>

                          {canCreateEmployee(user) && (
                            <button
                              type="button"
                              onClick={() => setEditingIntern(intern)}
                              title="Edit Intern"
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canDeleteEmployee(user) && (
                            <button
                              type="button"
                              onClick={() => handleDelete(intern._id)}
                              title="Delete Intern"
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* Modals */}
      {isRegisterOpen && (
        <RegisterInternModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onSuccess={() => fetchInternships()}
        />
      )}

      {editingIntern && (
        <EditInternModal
          isOpen={Boolean(editingIntern)}
          onClose={() => setEditingIntern(null)}
          intern={editingIntern}
          onSuccess={() => fetchInternships()}
        />
      )}

      {isDetailOpen && (
        <InternDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedInternId(null);
          }}
          internId={selectedInternId}
          onUpdateSuccess={() => fetchInternships()}
        />
      )}

      {evidenceTarget && (
        <EvidenceDrawer
          isOpen={Boolean(evidenceTarget)}
          onClose={() => setEvidenceTarget(null)}
          entityType="Internship"
          entityId={evidenceTarget._id}
          entityTitle={`${evidenceTarget.fullName} (${evidenceTarget.internshipNumber})`}
        />
      )}
    </div>
  );
}
