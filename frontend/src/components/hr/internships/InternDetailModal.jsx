import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  Building,
  Calendar,
  Paperclip,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Award,
  Plus
} from 'lucide-react';
import { internshipService, evidenceService } from '../../../services/hrService';
import StatusBadge from '../StatusBadge';
import EvidenceDrawer from '../EvidenceDrawer';
import { canConvertApplicant, DEPARTMENTS } from '../../../utils/rbac';
import { useAuth } from '../../../context/AuthContext';

export default function InternDetailModal({ isOpen, onClose, internId, onUpdateSuccess }) {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  const [intern, setIntern] = useState(null);
  const [evidenceDoc, setEvidenceDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Evidence Drawer
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  // Evaluation form
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [evalScore, setEvalScore] = useState(85);
  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalCertIssued, setEvalCertIssued] = useState(false);
  const [savingEval, setSavingEval] = useState(false);

  // Convert to employee form
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [empNumber, setEmpNumber] = useState('');
  const [empTitle, setEmpTitle] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState(false);

  const fetchEvidence = async () => {
    if (!internId) return;
    try {
      const evRes = await evidenceService.getByEntity('Internship', internId);
      if (evRes.success) setEvidenceDoc(evRes.data);
    } catch {
      setEvidenceDoc(null);
    }
  };

  const fetchIntern = async () => {
    if (!internId) return;
    try {
      setLoading(true);
      setError('');
      const [res] = await Promise.all([
        internshipService.getInternshipById(internId),
        fetchEvidence()
      ]);
      if (res.success && res.data) {
        setIntern(res.data);
        setEmpTitle(res.data.placement?.internshipPosition || 'Junior Staff');
        setEmpDept(res.data.placement?.assignedDepartment || DEPARTMENTS[0]);
        setEmpNumber(`EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      } else {
        setError(res.message || 'Failed to fetch intern profile');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading intern profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && internId) {
      fetchIntern();
      setIsEvalOpen(false);
      setIsConvertOpen(false);
      setConvertSuccess(false);
    }
  }, [isOpen, internId]);

  if (!isOpen) return null;

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await internshipService.updateStatus(internId, newStatus);
      if (res.success) {
        fetchIntern();
        if (onUpdateSuccess) onUpdateSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddEvaluation = async (e) => {
    e.preventDefault();
    try {
      setSavingEval(true);
      const res = await internshipService.addEvaluation(internId, {
        score: Number(evalScore),
        feedback: evalFeedback,
        certificateIssued: evalCertIssued
      });
      if (res.success) {
        setIsEvalOpen(false);
        setEvalFeedback('');
        fetchIntern();
        if (onUpdateSuccess) onUpdateSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save evaluation');
    } finally {
      setSavingEval(false);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    try {
      setConverting(true);
      setError('');
      const res = await internshipService.convertToEmployee(internId, {
        employeeNumber: empNumber.trim(),
        jobTitle: empTitle.trim(),
        department: empDept,
        basicSalary: Number(empSalary) || 0,
        employmentType: 'full-time'
      });
      if (res.success) {
        setConvertSuccess(true);
        setIsConvertOpen(false);
        fetchIntern();
        if (onUpdateSuccess) onUpdateSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert intern to employee');
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#152238]/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-black">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {intern?.fullName || 'Intern Dossier'}
                  </h2>
                  {intern && <StatusBadge status={intern.placement?.status || 'active'} />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {intern?.internshipNumber} • {intern?.placement?.internshipPosition || 'Intern'} ({intern?.placement?.assignedDepartment})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading intern profile...</div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : !intern ? null : (
              <>
                {convertSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {isAmharic
                        ? 'ተለማማጁ በተሳካ ሁኔታ ወደ ቋሚ ሰራተኛነት ተቀይሯል!'
                        : 'Intern successfully converted to official Employee!'}
                    </span>
                  </div>
                )}

                {/* Status & Action Bar */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-500">
                      {isAmharic ? 'የልምምድ ሁኔታ፡' : 'Placement Status:'}
                    </span>
                    <select
                      value={intern.placement?.status || 'active'}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold text-slate-900 dark:text-white"
                    >
                      <option value="applied">Applied</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="terminated">Terminated</option>
                      <option value="withdrawn">Withdrawn</option>
                      <option value="converted_to_employee">Converted to Employee</option>
                    </select>
                  </div>

                  {canConvertApplicant(user) && intern.placement?.status !== 'converted_to_employee' && (
                    <button
                      type="button"
                      onClick={() => setIsConvertOpen(!isConvertOpen)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{isAmharic ? 'ወደ ሰራተኛነት ቀይር' : 'Convert to Employee'}</span>
                    </button>
                  )}
                </div>

                {/* Convert Form */}
                {isConvertOpen && (
                  <form
                    onSubmit={handleConvert}
                    className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3"
                  >
                    <div className="font-black text-emerald-500 flex items-center justify-between">
                      <span>{isAmharic ? 'ተለማማጁን ወደ ሰራተኛነት መቀየሪያ' : 'Convert Intern to Full-Time Employee'}</span>
                      <button
                        type="button"
                        onClick={() => setIsConvertOpen(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold mb-1">Employee ID *</label>
                        <input
                          type="text"
                          required
                          value={empNumber}
                          onChange={(e) => setEmpNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Job Title *</label>
                        <input
                          type="text"
                          required
                          value={empTitle}
                          onChange={(e) => setEmpTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Department</label>
                        <select
                          value={empDept}
                          onChange={(e) => setEmpDept(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238]"
                        >
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Basic Salary (ETB)</label>
                        <input
                          type="number"
                          value={empSalary}
                          onChange={(e) => setEmpSalary(e.target.value)}
                          placeholder="e.g. 12000"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={converting}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black cursor-pointer"
                      >
                        {converting ? 'Converting...' : 'Confirm Hire'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Academic & Contact */}
                  <div className="space-y-4">
                    <h3 className="font-black uppercase tracking-wider text-slate-400">
                      {isAmharic ? 'የግል እና የትምህርት መረጃ' : 'Contact & Academic Profile'}
                    </h3>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-[#00ced1]">{intern.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-bold">{intern.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>
                          {intern.academicProfile?.university || 'N/A'} — {intern.academicProfile?.departmentOfStudy || ''} (Year {intern.academicProfile?.yearOfStudy || '-'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span>
                          {intern.placement?.assignedDepartment} • Type:{' '}
                          <strong className="capitalize">{intern.type}</strong>
                          {intern.type === 'paid' && ` (${intern.stipendAmount} ETB/mo)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>
                          {intern.placement?.startDate
                            ? new Date(intern.placement.startDate).toLocaleDateString()
                            : 'N/A'}{' '}
                          →{' '}
                          {intern.placement?.endDate
                            ? new Date(intern.placement.endDate).toLocaleDateString()
                            : 'Ongoing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence & Documents */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black uppercase tracking-wider text-slate-400">
                        {isAmharic ? 'ሰነዶች እና ማስረጃዎች' : 'Evidence & Documents'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsEvidenceOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#00ced1]/10 hover:bg-[#00ced1]/20 text-[#00ced1] font-black cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Evidence Drawer ({evidenceDoc?.attachments?.length || 0})</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                      {evidenceDoc?.attachments?.length > 0 ? (
                        evidenceDoc.attachments.map((att) => (
                          <a
                            key={att._id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 hover:border-[#00ced1] transition-all"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-[#00ced1] shrink-0" />
                              <div className="min-w-0">
                                <div className="font-bold truncate">{att.title || att.fileName}</div>
                                <div className="text-[10px] text-slate-400 capitalize">{att.status}</div>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-slate-400 shrink-0" />
                          </a>
                        ))
                      ) : (
                        <div className="text-center text-slate-400 py-4">
                          {isAmharic
                            ? 'ምንም ሰነድ አልተያያዘም። በEvidence Drawer በኩል መጨመር ይችላሉ።'
                            : 'No documents attached yet. Open Evidence Drawer to upload.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Evaluations Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>{isAmharic ? 'የልምምድ ግምገማዎች እና ሰርተፍኬት' : 'Evaluations & Certification'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEvalOpen(!isEvalOpen)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00ced1]/10 hover:bg-[#00ced1]/20 text-[#00ced1] font-black cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAmharic ? 'ግምገማ ጨምር' : 'Add Evaluation'}</span>
                    </button>
                  </div>

                  {isEvalOpen && (
                    <form
                      onSubmit={handleAddEvaluation}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold mb-1">Score (0 - 100) *</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            required
                            value={evalScore}
                            onChange={(e) => setEvalScore(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                          />
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                            <input
                              type="checkbox"
                              checked={evalCertIssued}
                              onChange={(e) => setEvalCertIssued(e.target.checked)}
                              className="w-4 h-4 accent-[#00ced1]"
                            />
                            <span>Completion Certificate Issued</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Supervisor Feedback *</label>
                        <textarea
                          rows={2}
                          required
                          value={evalFeedback}
                          onChange={(e) => setEvalFeedback(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEvalOpen(false)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingEval}
                          className="px-4 py-1.5 rounded-xl bg-[#00ced1] text-white font-black cursor-pointer"
                        >
                          {savingEval ? 'Saving...' : 'Save Evaluation'}
                        </button>
                      </div>
                    </form>
                  )}

                  {intern.evaluations?.length > 0 ? (
                    <div className="space-y-2">
                      {intern.evaluations.map((ev, i) => (
                        <div
                          key={ev._id || i}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>Score: {ev.score}/100</span>
                              {ev.certificateIssued && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black">
                                  Certified
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">{ev.feedback}</p>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {new Date(ev.evaluationDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      {isAmharic ? 'እስካሁን ምንም ግምገማ አልተመዘገበም።' : 'No evaluations logged yet.'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50/50 dark:bg-[#152238]/50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              {isAmharic ? 'ዝጋ' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {isEvidenceOpen && intern && (
        <EvidenceDrawer
          isOpen={isEvidenceOpen}
          onClose={() => {
            setIsEvidenceOpen(false);
            fetchEvidence();
          }}
          entityType="Internship"
          entityId={intern._id}
          entityTitle={`${intern.fullName} (${intern.internshipNumber})`}
        />
      )}
    </>
  );
}
