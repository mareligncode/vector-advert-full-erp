import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LogOut,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Paperclip,
  Eye,
  X,
  AlertCircle,
  ShieldCheck,
  Award,
  CheckSquare
} from 'lucide-react';
import { clearanceService, employeeService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';
import { useAuth } from '../../../context/AuthContext';
import { HR_ADMIN_ROLES, MANAGEMENT_ROLES, hasAnyRole } from '../../../utils/rbac';

const DEPT_LABELS = {
  department_head: { en: 'Department Head', am: 'የዲፓርትመንት ኃላፊ' },
  store: { en: 'Store & Assets', am: 'ግምጃ ቤት እና ንብረት' },
  it: { en: 'IT & Access Control', am: 'አይቲ እና ሲስተም' },
  finance: { en: 'Finance & Settlement', am: 'ፋይናንስ እና ክፍያ' },
  hr: { en: 'Human Resources', am: 'የሰው ኃይል (HR)' }
};

export default function ClearanceList() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  const isManagement = hasAnyRole(user, MANAGEMENT_ROLES);
  const isHRAdmin = hasAnyRole(user, HR_ADMIN_ROLES);

  const [clearances, setClearances] = useState([]);
  const [myClearance, setMyClearance] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isInitOpen, setIsInitOpen] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [evidenceTarget, setEvidenceTarget] = useState(null);

  // Initiate Form
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [resignationDate, setResignationDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const calls = [clearanceService.getMyClearance().catch(() => ({ data: null }))];
      if (isManagement) {
        calls.push(
          clearanceService.getClearances({ limit: 100 }),
          employeeService.getEmployees({ limit: 200 })
        );
      }
      const results = await Promise.allSettled(calls);
      if (results[0].status === 'fulfilled' && results[0].value?.data) {
        setMyClearance(results[0].value.data);
      } else {
        setMyClearance(null);
      }
      if (isManagement) {
        if (results[1]?.status === 'fulfilled' && results[1].value?.success) {
          setClearances(results[1].value.data || []);
        }
        if (results[2]?.status === 'fulfilled' && results[2].value?.success) {
          setEmployees(results[2].value.data || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleInitiate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await clearanceService.initiateClearance({
        employeeId: isHRAdmin && targetEmployeeId ? targetEmployeeId : undefined,
        resignationDate,
        lastWorkingDay,
        reasonForLeaving: reasonForLeaving.trim()
      });
      if (res.success) {
        setIsInitOpen(false);
        setReasonForLeaving('');
        fetchAll();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to initiate clearance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeptSignoff = async (clearanceId, department, status, items) => {
    const note =
      status === 'rejected'
        ? window.prompt(isAmharic ? 'ውድቅ የተደረገበትን ምክንያት ያስገቡ፡' : 'Enter rejection reason:')
        : '';
    if (status === 'rejected' && !note) return;

    try {
      const updatedItems = (items || []).map((it) => ({
        ...it,
        cleared: status === 'approved' ? true : it.cleared
      }));
      const res = await clearanceService.updateDepartmentClearance(clearanceId, department, {
        status,
        note,
        items: updatedItems
      });
      if (res.success) {
        setSelectedClearance(res.data);
        fetchAll();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Department sign-off failed (check role authorization)');
    }
  };

  const handleFinalize = async (clearanceId) => {
    try {
      const res = await clearanceService.finalizeClearance(clearanceId);
      if (res.success) {
        setSelectedClearance(res.data);
        fetchAll();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to finalize clearance');
    }
  };

  const listToDisplay = isManagement
    ? clearances
    : myClearance
    ? [myClearance]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LogOut className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.clearance.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.clearance.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInitOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white text-xs font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isAmharic ? 'የመልቀቂያ ሂደት ጀምር' : 'Initiate Clearance'}</span>
        </button>
      </div>

      {/* Clearances Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">{t('hrPages.clearance.loading')}</div>
        ) : listToDisplay.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <LogOut className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="font-bold text-slate-600 dark:text-slate-300">{t('hrPages.clearance.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#152238] border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-black text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">{isAmharic ? 'ሰራተኛ' : 'Employee'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'የመጨረሻ የስራ ቀን' : 'Last Working Day'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'የዲፓርትመንቶች ፊርማ' : 'Dept Sign-Offs'}</th>
                  <th className="py-3.5 px-4">{isAmharic ? 'አጠቃላይ ሁኔታ' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{isAmharic ? 'ተግባራት' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {listToDisplay.map((c) => {
                  const empName = c.employee
                    ? [c.employee.name?.first, c.employee.name?.last].filter(Boolean).join(' ')
                    : 'Employee';
                  const approvedDepts = (c.clearances || []).filter((d) => d.status === 'approved').length;
                  const totalDepts = (c.clearances || []).length;

                  return (
                    <tr key={c._id} className="hover:bg-slate-50/70 dark:hover:bg-[#152238]/50">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white">{empName}</div>
                        <div className="text-[11px] text-slate-400">
                          {c.employee?.employeeNumber} • {c.employee?.department}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        {new Date(c.lastWorkingDay).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-[#00ced1]/10 text-[#00ced1] font-black text-[11px]">
                          {approvedDepts} / {totalDepts} {isAmharic ? 'ጸድቋል' : 'Cleared'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.overallClearanceStatus || 'pending'} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEvidenceTarget(c)}
                            title={isAmharic ? 'ማስረጃዎች' : 'Evidence'}
                            className="p-1.5 text-slate-400 hover:text-[#00ced1] rounded-lg cursor-pointer"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedClearance(c)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00ced1]/10 hover:bg-[#00ced1]/20 text-[#00ced1] font-black cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isAmharic ? 'ዝርዝር እና ፊርማ' : 'Checklist'}</span>
                          </button>
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

      {/* Initiate Clearance Modal */}
      {isInitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50">
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                {isAmharic ? 'የመልቀቂያ ሂደት ማስጀመሪያ' : 'Initiate Exit Clearance'}
              </h2>
              <button type="button" onClick={() => setIsInitOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInitiate} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {isHRAdmin && (
                <div>
                  <label className="block font-bold mb-1">
                    {isAmharic ? 'ሰራተኛ (ለራስዎ ከሆነ ባዶ ይተዉ)' : 'Employee (leave blank for self)'}
                  </label>
                  <select
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  >
                    <option value="">-- {isAmharic ? 'የራሴ መለያ' : 'Self'} --</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {[e.name?.first, e.name?.last].filter(Boolean).join(' ')} ({e.employeeNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'የመልቀቂያ ቀን *' : 'Resignation Date *'}</label>
                  <input
                    type="date"
                    required
                    value={resignationDate}
                    onChange={(e) => setResignationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'የመጨረሻ የስራ ቀን *' : 'Last Working Day *'}</label>
                  <input
                    type="date"
                    required
                    value={lastWorkingDay}
                    onChange={(e) => setLastWorkingDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">{isAmharic ? 'የመልቀቂያ ምክንያት *' : 'Reason for Leaving *'}</label>
                <textarea
                  rows={3}
                  required
                  value={reasonForLeaving}
                  onChange={(e) => setReasonForLeaving(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInitOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#00ced1] text-white font-black cursor-pointer"
                >
                  {submitting ? '...' : isAmharic ? 'ሂደቱን ጀምር' : 'Submit Clearance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clearance Checklist Detail Modal */}
      {selectedClearance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50">
              <div>
                <h2 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    {[selectedClearance.employee?.name?.first, selectedClearance.employee?.name?.last]
                      .filter(Boolean)
                      .join(' ')}
                  </span>
                  <StatusBadge status={selectedClearance.overallClearanceStatus} />
                </h2>
                <p className="text-xs text-slate-400">
                  {isAmharic ? 'ምክንያት፡' : 'Reason:'} {selectedClearance.reasonForLeaving}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClearance(null)}
                className="p-2 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {(selectedClearance.clearances || []).map((dept) => {
                const label = DEPT_LABELS[dept.department]?.[isAmharic ? 'am' : 'en'] || dept.department;
                return (
                  <div
                    key={dept._id || dept.department}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#00ced1]" />
                        <span>{label}</span>
                        <StatusBadge status={dept.status} />
                      </div>

                      {dept.status !== 'approved' && isManagement && (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeptSignoff(selectedClearance._id, dept.department, 'approved', dept.items)
                            }
                            className="px-3 py-1 rounded-xl bg-emerald-500 text-white font-bold cursor-pointer"
                          >
                            {isAmharic ? 'አጽድቅ' : 'Clear & Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeptSignoff(selectedClearance._id, dept.department, 'rejected', dept.items)
                            }
                            className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-500 font-bold cursor-pointer"
                          >
                            {isAmharic ? 'ውድቅ' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {(dept.items || []).map((item, idx) => (
                        <div
                          key={item._id || idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200/70 dark:border-slate-700/60"
                        >
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200 font-medium">
                            <input
                              type="checkbox"
                              checked={Boolean(item.cleared)}
                              disabled={!isManagement || dept.status === 'approved'}
                              onChange={() => {
                                const updatedItems = dept.items.map((it, i) =>
                                  i === idx ? { ...it, cleared: !it.cleared } : it
                                );
                                handleDeptSignoff(
                                  selectedClearance._id,
                                  dept.department,
                                  dept.status === 'pending' ? 'pending' : dept.status,
                                  updatedItems
                                );
                              }}
                              className="accent-[#00ced1] w-3.5 h-3.5"
                            />
                            <span className={item.cleared ? 'line-through opacity-70' : ''}>{item.name}</span>
                          </label>
                          {item.remarks && (
                            <span className="text-[11px] text-slate-400 italic">{item.remarks}</span>
                          )}
                        </div>
                      ))}
                      {dept.note && (
                        <div className="text-[11px] text-slate-400 pt-1">
                          <strong>{isAmharic ? 'ማስታወሻ፡' : 'Note:'}</strong> {dept.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isHRAdmin &&
                selectedClearance.overallClearanceStatus !== 'completed' &&
                (selectedClearance.clearances || []).every((d) => d.status === 'approved') && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleFinalize(selectedClearance._id)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <Award className="w-4 h-4" />
                      <span>{isAmharic ? 'መልቀቂያውን አጠናቅቅ' : 'Finalize Exit Clearance'}</span>
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {evidenceTarget && (
        <EvidenceDrawer
          isOpen={Boolean(evidenceTarget)}
          onClose={() => setEvidenceTarget(null)}
          entityType="Clearance"
          entityId={evidenceTarget._id}
          entityTitle={isAmharic ? 'የመልቀቂያ ሰነዶች' : 'Clearance Documents'}
        />
      )}
    </div>
  );
}
