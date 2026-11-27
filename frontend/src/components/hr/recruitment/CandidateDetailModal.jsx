import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  User,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Download,
  ExternalLink,
  Globe,
  Briefcase,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck,
  Video,
  MapPin,
  Building,
  AlertCircle,
  Plus,
  Send,
  DollarSign,
  Paperclip
} from 'lucide-react';
import { recruitmentService, evidenceService } from '../../../services/hrService';
import StatusBadge from '../StatusBadge';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import EvidenceDrawer from '../EvidenceDrawer';
import { canConvertApplicant } from '../../../utils/rbac';
import { useAuth } from '../../../context/AuthContext';

export default function CandidateDetailModal({
  isOpen,
  onClose,
  applicationId,
  onUpdateSuccess
}) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status & Notes editing
  const [currentStatus, setCurrentStatus] = useState('submitted');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState('');

  // Interview modal & Evidence Drawer
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [evidenceDoc, setEvidenceDoc] = useState(null);

  // Convert to employee drawer / modal state
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [convertTitle, setConvertTitle] = useState('');
  const [convertDepartment, setConvertDepartment] = useState('');
  const [convertType, setConvertType] = useState('full-time');
  const [convertSalary, setConvertSalary] = useState('');
  const [convertStartDate, setConvertStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState(false);

  const fetchEvidence = async () => {
    if (!applicationId) return;
    try {
      const evRes = await evidenceService.getByEntity('JobApplication', applicationId);
      if (evRes.success) {
        setEvidenceDoc(evRes.data);
      }
    } catch {
      setEvidenceDoc(null);
    }
  };

  const fetchApplication = async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      setError('');
      const [res] = await Promise.all([
        recruitmentService.getJobApplicationById(applicationId),
        fetchEvidence()
      ]);
      if (res.success && res.data) {
        setApp(res.data);
        setCurrentStatus(res.data.applicationStatus || 'submitted');
        setRating(res.data.applicantRating || 0);
        setNotes(res.data.applicationNotes || '');
        setConvertTitle(res.data.jobPosting?.jobTitle || '');
        setConvertDepartment(res.data.jobPosting?.department || '');
      } else {
        setError(res.message || 'Failed to fetch candidate dossier');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading candidate details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && applicationId) {
      fetchApplication();
      setStatusSuccessMessage('');
      setConvertSuccess(false);
      setIsConvertOpen(false);
    }
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  const handleUpdateStatusAndRating = async (newStatus, newRating, newNotes) => {
    try {
      setSavingStatus(true);
      setStatusSuccessMessage('');
      const statusToUse = newStatus !== undefined ? newStatus : currentStatus;
      const ratingToUse = newRating !== undefined ? newRating : rating;
      const notesToUse = newNotes !== undefined ? newNotes : notes;

      const res = await recruitmentService.updateApplicationStatus(
        applicationId,
        statusToUse,
        ratingToUse || undefined,
        notesToUse
      );

      if (res.success) {
        setCurrentStatus(statusToUse);
        setRating(ratingToUse);
        setStatusSuccessMessage(isAmharic ? 'የእጩው ሁኔታ ተሻሽሏል' : 'Candidate dossier updated');
        if (onUpdateSuccess) onUpdateSuccess(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update candidate');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleConvertToEmployee = async (e) => {
    e.preventDefault();
    try {
      setConverting(true);
      setError('');

      const payload = {
        jobTitle: convertTitle,
        department: convertDepartment,
        employmentType: convertType,
        startDate: convertStartDate,
        baseSalary: convertSalary ? Number(convertSalary) : undefined
      };

      const res = await recruitmentService.convertToEmployee(applicationId, payload);
      if (res.success) {
        setConvertSuccess(true);
        setCurrentStatus('hired');
        setIsConvertOpen(false);
        fetchApplication();
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        setError(res.message || 'Failed to convert candidate to employee');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error converting candidate to employee');
    } finally {
      setConverting(false);
    }
  };

  const fullName = app
    ? [app.applicantName?.first, app.applicantName?.middle, app.applicantName?.last]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#152238]/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-black text-base shrink-0">
                {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {fullName || 'Candidate Dossier'}
                  </h2>
                  <StatusBadge status={currentStatus} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {app?.jobPosting?.jobTitle} • {app?.jobPosting?.department}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-sm">
                <div className="w-6 h-6 border-2 border-[#00ced1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>{isAmharic ? 'የእጩውን መረጃ በማምጣት ላይ...' : 'Loading candidate dossier...'}</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : !app ? null : (
              <>
                {statusSuccessMessage && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-2 text-xs font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{statusSuccessMessage}</span>
                  </div>
                )}

                {convertSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-black text-sm">
                        {isAmharic ? 'እጩው በተሳካ ሁኔታ ሰራተኛ ሆኗል!' : 'Candidate successfully converted to Employee!'}
                      </div>
                      <div className="text-xs">
                        {isAmharic
                          ? 'የሰራተኛው መዝገብ በሰራተኞች ዝርዝር ውስጥ ተካትቷል።'
                          : 'Official staff profile created and accessible in Employee Directory.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Action Bar: Status & Star Rating */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {isAmharic ? 'የእጩው ሁኔታ፡' : 'Application Stage:'}
                    </span>
                    <select
                      value={currentStatus}
                      onChange={(e) => handleUpdateStatusAndRating(e.target.value, rating, notes)}
                      disabled={savingStatus}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                    >
                      <option value="submitted">Submitted (አዲስ)</option>
                      <option value="under_review">Under Review (በግምገማ ላይ)</option>
                      <option value="shortlisted">Shortlisted (የተመረጠ)</option>
                      <option value="interview_scheduled">Interview Scheduled (ቀጠሮ የተያዘ)</option>
                      <option value="interviewed">Interviewed (ቃለ-መጠይቅ የተደረገ)</option>
                      <option value="offered">Offered (ቅጥር የቀረበ)</option>
                      <option value="hired">Hired (የተቀጠረ)</option>
                      <option value="rejected">Rejected (ያልተመረጠ)</option>
                      <option value="withdrawn">Withdrawn (ያቋረጠ)</option>
                    </select>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {isAmharic ? 'ደረጃ (Rating):' : 'Evaluation Rating:'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleUpdateStatusAndRating(currentStatus, star, notes)}
                          className="p-1 hover:scale-125 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Convert to Employee Button */}
                  {canConvertApplicant(user) && currentStatus !== 'hired' && (
                    <button
                      type="button"
                      onClick={() => setIsConvertOpen(!isConvertOpen)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isAmharic ? 'ወደ ሰራተኛነት ቀይር' : 'Convert to Employee'}</span>
                    </button>
                  )}
                </div>

                {/* Convert To Employee Drawer Form */}
                {isConvertOpen && (
                  <form
                    onSubmit={handleConvertToEmployee}
                    className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4 animate-in fade-in duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-500 font-black text-sm">
                        <UserCheck className="w-4 h-4" />
                        <span>{isAmharic ? 'እጩውን ወደ ቋሚ ሰራተኛነት መመዝገቢያ' : 'Convert Candidate to Official Employee'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsConvertOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        {isAmharic ? 'ዝጋ' : 'Cancel'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {isAmharic ? 'የስራ መደብ' : 'Job Title'}
                        </label>
                        <input
                          type="text"
                          required
                          value={convertTitle}
                          onChange={(e) => setConvertTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {isAmharic ? 'ዲፓርትመንት' : 'Department'}
                        </label>
                        <input
                          type="text"
                          required
                          value={convertDepartment}
                          onChange={(e) => setConvertDepartment(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {isAmharic ? 'የስራ ዓይነት' : 'Employment Type'}
                        </label>
                        <select
                          value={convertType}
                          onChange={(e) => setConvertType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
                        >
                          <option value="full-time">Full-Time</option>
                          <option value="part-time">Part-Time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {isAmharic ? 'መነሻ ደመወዝ (ETB)' : 'Starting Gross Salary (ETB)'}
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 25000"
                          value={convertSalary}
                          onChange={(e) => setConvertSalary(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {isAmharic ? 'የስራ መጀመሪያ ቀን' : 'Official Start Date'}
                        </label>
                        <input
                          type="date"
                          value={convertStartDate}
                          onChange={(e) => setConvertStartDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={converting}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {converting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{isAmharic ? 'በመቀየር ላይ...' : 'Converting...'}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isAmharic ? 'ቅጥሩን አጽድቅና መዝግብ' : 'Confirm Hire & Register Staff'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Candidate Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Contact & Dossier Links */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {isAmharic ? 'የመገኛ እና የግል መረጃ' : 'Contact & Profile'}
                    </h3>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400">{isAmharic ? 'ኢሜይል፡' : 'Email:'}</span>
                        <a
                          href={`mailto:${app.applicantContact?.email}`}
                          className="font-bold text-[#00ced1] hover:underline"
                        >
                          {app.applicantContact?.email}
                        </a>
                      </div>

                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400">{isAmharic ? 'ስልክ፡' : 'Phone:'}</span>
                        <a
                          href={`tel:${app.applicantContact?.phoneNumber}`}
                          className="font-bold text-slate-800 dark:text-slate-200 hover:underline"
                        >
                          {app.applicantContact?.phoneNumber}
                        </a>
                      </div>

                      {app.applicantContact?.telegramUsername && (
                        <div className="flex items-center gap-3">
                          <MessageCircle className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">Telegram:</span>
                          <a
                            href={`https://t.me/${app.applicantContact.telegramUsername.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-sky-400 hover:underline"
                          >
                            @{app.applicantContact.telegramUsername.replace('@', '')}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400">{isAmharic ? 'የስራ ልምድ፡' : 'Experience:'}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {app.yearsOfExperience || 0} {isAmharic ? 'ዓመታት' : 'years'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400">{isAmharic ? 'ያመለከተበት ቀን፡' : 'Applied On:'}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Resume & Portfolio Links */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {isAmharic ? 'ሰነዶች እና ማስረጃዎች' : 'Resume & Evidence Documents'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsEvidenceOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#00ced1]/10 hover:bg-[#00ced1]/20 text-[#00ced1] text-[11px] font-black transition-colors cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>
                          {isAmharic ? 'ማስረጃዎችን ያስተዳድሩ' : 'Evidence Drawer'} (
                          {evidenceDoc?.attachments?.length || 0})
                        </span>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                      {/* Evidence Attachments (All documents stored in Evidence table) */}
                      {evidenceDoc?.attachments?.length > 0 ? (
                        evidenceDoc.attachments.map((att) => (
                          <a
                            key={att._id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 hover:border-[#00ced1] transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-[#00ced1] shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {att.title || att.fileName}
                                </div>
                                <div className="text-[10px] text-slate-400 capitalize">
                                  {att.status} {att.fileSize ? `• ${(att.fileSize / 1024).toFixed(0)} KB` : ''}
                                </div>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-slate-400 group-hover:text-[#00ced1] transition-colors shrink-0" />
                          </a>
                        ))
                      ) : (
                        app.resume && (
                          <a
                            href={app.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 hover:border-[#00ced1] transition-all group"
                          >
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-[#00ced1]" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {isAmharic ? 'የሲቪ (Resume) ሰነድ ይመልከቱ' : 'Candidate Resume / CV'}
                              </span>
                            </div>
                            <Download className="w-4 h-4 text-slate-400 group-hover:text-[#00ced1] transition-colors" />
                          </a>
                        )
                      )}

                      {/* Portfolio Link */}
                      {app.portfolioLink && (
                        <a
                          href={app.portfolioLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 hover:border-[#00ced1] transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Globe className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {isAmharic ? 'የስራዎች ማሳያ (Portfolio)' : 'Online Portfolio'}
                            </span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                        </a>
                      )}

                      {/* LinkedIn Link */}
                      {app.linkedInLink && (
                        <a
                          href={app.linkedInLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 hover:border-sky-400 transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <ExternalLink className="w-4 h-4 text-sky-400" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              LinkedIn Profile
                            </span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Cover Letter & HR Notes */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {isAmharic ? 'የማመልከቻ ደብዳቤ (Cover Letter)' : 'Applicant Cover Letter'}
                    </h3>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {app.coverLetter || (
                        <span className="text-slate-400 italic">
                          {isAmharic ? 'ምንም የማመልከቻ ደብዳቤ አልቀረበም' : 'No cover letter provided.'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {isAmharic ? 'የሰው ኃይል አስተያየት እና ግምገማ' : 'HR Assessment & Notes'}
                    </h3>

                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={
                          isAmharic
                            ? 'ስለ እጩው ብቃት፣ የስነ-ምግባር ምልከታ ወይም ተጨማሪ ማስታወሻ ይጻፉ...'
                            : 'Enter HR interview feedback, technical assessment notes, cultural fit observations...'
                        }
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1] resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatusAndRating(currentStatus, rating, notes)}
                          disabled={savingStatus}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isAmharic ? 'ማስታወሻውን መዝግብ' : 'Save Notes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interview Rounds & Scheduling */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {isAmharic ? 'የቃለ-መጠይቅ ዙሮች እና ውጤቶች' : 'Interview Rounds & Schedule'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {app.interviews?.length || 0} {isAmharic ? 'የተመዘገቡ ቃለ-መጠይቆች' : 'rounds conducted or scheduled'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ced1]/10 hover:bg-[#00ced1]/20 text-[#00ced1] font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAmharic ? 'አዲስ ቃለ-መጠይቅ መድብ' : 'Schedule Round'}</span>
                    </button>
                  </div>

                  {app.interviews?.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                      {isAmharic ? 'እስካሁን ምንም ቃለ-መጠይቅ አልተመደበም።' : 'No interview rounds scheduled yet for this applicant.'}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {app.interviews.map((iv, idx) => (
                        <div
                          key={iv._id || idx}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-bold">
                              #{idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="capitalize">{iv.interviewFormat} Interview</span>
                                <StatusBadge status={iv.interviewStatus} />
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(iv.scheduledDate).toLocaleString()}</span>
                                {iv.interviewLocation && (
                                  <>
                                    <span>•</span>
                                    <span>{iv.interviewLocation}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {iv.onlineMeetingLink && (
                              <a
                                href={iv.onlineMeetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 rounded-lg bg-sky-500/10 text-sky-500 font-bold hover:bg-sky-500/20 transition-colors flex items-center gap-1"
                              >
                                <Video className="w-3 h-3" />
                                <span>Join Call</span>
                              </a>
                            )}
                            {iv.interviewScore !== undefined && (
                              <span className="font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500">
                                Score: {iv.interviewScore}/100
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#152238]/50">
            <span className="text-xs text-slate-400">
              ID: {app?._id}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              {isAmharic ? 'ዝጋ' : 'Close Dossier'}
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Interview Sub-Modal */}
      {isScheduleModalOpen && (
        <ScheduleInterviewModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          application={app}
          onSuccess={() => {
            fetchApplication();
            if (onUpdateSuccess) onUpdateSuccess();
          }}
        />
      )}

      {/* Evidence Drawer for Multiple Documents & Verification */}
      {isEvidenceOpen && app && (
        <EvidenceDrawer
          isOpen={isEvidenceOpen}
          onClose={() => {
            setIsEvidenceOpen(false);
            fetchEvidence();
          }}
          entityType="JobApplication"
          entityId={app._id}
          entityTitle={fullName}
        />
      )}
    </>
  );
}
