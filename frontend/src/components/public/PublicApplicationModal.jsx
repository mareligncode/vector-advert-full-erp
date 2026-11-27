import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Globe,
  ExternalLink,
  MessageCircle,
  Clock
} from 'lucide-react';
import { recruitmentService } from '../../services/hrService';

export default function PublicApplicationModal({ isOpen, onClose, job, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('1');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [linkedInLink, setLinkedInLink] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [supportingFiles, setSupportingFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedApp, setSubmittedApp] = useState(null);

  const fileInputRef = useRef(null);
  const supportingInputRef = useRef(null);

  if (!isOpen || !job) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setError(
          isAmharic
            ? 'የፋይል መጠን ከ15MB መብለጥ የለበትም'
            : 'File size must not exceed 15MB'
        );
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const handleSupportingFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) {
        setError(
          isAmharic
            ? `ፋይሉ ${file.name} ከ15MB በላይ ነው`
            : `File ${file.name} exceeds 15MB limit`
        );
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSupportingFiles((prev) => [...prev, ...validFiles]);
      setError('');
    }
    e.target.value = '';
  };

  const handleRemoveSupportingFile = (index) => {
    setSupportingFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError(
        isAmharic
          ? 'እባክዎ ሙሉ ስምዎን ያስገቡ'
          : 'Please provide your first and last name'
      );
      return;
    }

    if (!email.trim() || !phoneNumber.trim()) {
      setError(
        isAmharic
          ? 'እባክዎ ኢሜይል እና የስልክ ቁጥር ያስገቡ'
          : 'Please provide your email and phone number'
      );
      return;
    }

    if (!resumeFile && !resumeUrl.trim()) {
      setError(
        isAmharic
          ? 'እባክዎ CV/Resume ፋይል ያያይዙ ወይም ሊንክ ያስገቡ'
          : 'Please attach a CV/Resume document or link'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('jobPostingId', job._id);

      const applicantName = {
        first: firstName.trim(),
        middle: middleName.trim(),
        last: lastName.trim()
      };
      formData.append('applicantName', JSON.stringify(applicantName));

      const applicantContact = {
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        telegramUsername: telegramUsername.trim() || undefined
      };
      formData.append('applicantContact', JSON.stringify(applicantContact));

      formData.append('yearsOfExperience', Number(yearsOfExperience) || 0);
      if (portfolioLink.trim()) formData.append('portfolioLink', portfolioLink.trim());
      if (linkedInLink.trim()) formData.append('linkedInLink', linkedInLink.trim());
      if (coverLetter.trim()) formData.append('coverLetter', coverLetter.trim());

      if (resumeFile) {
        formData.append('resumeFile', resumeFile);
      } else if (resumeUrl.trim()) {
        formData.append('resume', resumeUrl.trim());
      }

      if (supportingFiles.length > 0) {
        supportingFiles.forEach((file) => {
          formData.append('documents', file);
        });
      }

      const res = await recruitmentService.submitApplication(formData);
      if (res.success) {
        setSubmittedApp(res.data);
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'ማመልከቻ ማስገባት አልተሳካም፡ እባክዎ እንደገና ይሞክሩ' : 'Failed to submit application. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAmharic ? 'ለስራ መደቡ ማመልከቻ አስገባ' : 'Apply for Position'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="font-bold text-[#00ced1]">{job.jobTitle}</span>
                <span>•</span>
                <span>{job.department}</span>
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
        {submittedApp ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {isAmharic ? 'ማመልከቻዎ በተሳካ ሁኔታ ደርሶናል!' : 'Application Submitted Successfully!'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isAmharic
                ? `ለ ${job.jobTitle} ያቀረቡት ማመልከቻ በHR ቡድናችን ተቀባይነት አግኝቷል። ማመልከቻዎ ሲገመገም በኢሜይል ወይም በስልክ እንደውላለን።`
                : `Thank you, ${firstName}! Your application for ${job.jobTitle} has been received. Our HR team will review your CV and reach out to you via email or phone.`}
            </p>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 inline-block font-mono text-xs text-slate-600 dark:text-slate-300">
              Reference: <strong className="text-[#00ced1]">{submittedApp._id}</strong>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#00ced1] hover:brightness-95 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {isAmharic ? 'ተመለስ' : 'Close & Done'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Applicant Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAmharic ? 'ስም (First Name)' : 'First Name'} *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Abebe"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAmharic ? 'የአባት ስም (Father Name)' : 'Middle Name'}
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. Kebede"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAmharic ? 'የአያት ስም (Grandfather Name)' : 'Last Name'} *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Tesfaye"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#00ced1]" />
                  <span>{isAmharic ? 'ኢሜይል አድራሻ' : 'Email Address'} *</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#00ced1]" />
                  <span>{isAmharic ? 'ስልክ ቁጥር' : 'Phone Number'} *</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0911223344"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-[#00ced1]" />
                  <span>Telegram (አማራጭ)</span>
                </label>
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>
            </div>

            {/* Experience & Professional Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>{isAmharic ? 'የስራ ልምድ (በዓመታት)' : 'Experience (Years)'} *</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span>{isAmharic ? 'የስራ ፖርትፎሊዮ ሊንክ' : 'Portfolio / GitHub'}</span>
                </label>
                <input
                  type="url"
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span>LinkedIn Link</span>
                </label>
                <input
                  type="url"
                  value={linkedInLink}
                  onChange={(e) => setLinkedInLink(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>
            </div>

            {/* Resume / CV Document Upload */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2.5">
              <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>{isAmharic ? 'የስራ ልምድ ሰነድ (CV / Resume) ያያይዙ' : 'Attach CV / Resume Document'} *</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 bg-white dark:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{resumeFile ? resumeFile.name : (isAmharic ? 'የCV ፋይል ይምረጡ (PDF / Word)' : 'Choose Resume (PDF/Word max 15MB)')}</span>
                </button>

                <span className="text-[11px] text-slate-400 text-center sm:text-left">
                  {isAmharic ? 'ወይም የቀጥታ ሊንክ ያስገቡ፦' : 'or paste document URL:'}
                </span>

                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => {
                    setResumeUrl(e.target.value);
                    if (e.target.value) setResumeFile(null);
                  }}
                  placeholder="https://drive.google.com/..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              {resumeFile && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                  <span className="truncate">✓ {resumeFile.name} ({(resumeFile.size / 1024).toFixed(0)} KB)</span>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="text-emerald-600 hover:text-emerald-800 text-[10px] font-bold ml-2 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Additional Supporting Documents (Multiple Files) */}
              <div className="pt-3 border-t border-indigo-200/50 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                    {isAmharic
                      ? 'ተጨማሪ ደጋፊ ሰነዶች (ሰርተፍኬቶች፣ ትራንስክሪፕት፣ ፖርትፎሊዮ - አማራጭ)'
                      : 'Additional Supporting Documents (Certificates, Transcripts, Portfolio - Optional)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => supportingInputRef.current?.click()}
                    className="text-[11px] font-black text-[#00ced1] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isAmharic ? '+ ፋይሎች ጨምር' : '+ Add Documents'}</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={supportingInputRef}
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.zip"
                  onChange={handleSupportingFilesChange}
                  className="hidden"
                />

                {supportingFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {supportingFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <span className="truncate text-slate-700 dark:text-slate-200 font-medium">
                          {file.name} ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSupportingFile(idx)}
                          className="text-rose-500 hover:text-rose-700 text-[11px] font-bold ml-2 cursor-pointer shrink-0"
                        >
                          {isAmharic ? 'አስወግድ' : 'Remove'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAmharic ? 'የሽኝት ደብዳቤ / ማጠቃለያ (Cover Letter - አማራጭ)' : 'Cover Letter / Introduction (Optional)'}
              </label>
              <textarea
                rows={3}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={
                  isAmharic
                    ? 'ስለራስዎ፣ ለዚህ ስራ መደብ ያለዎትን ተነሳሽነት እና ተዛማጅ ልምዶችዎን ባጭሩ ይግለጹ...'
                    : 'Tell us briefly about why you are a great fit for this position...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#00ced1] text-slate-950 hover:brightness-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {submitting
                    ? isAmharic ? 'በመላክ ላይ...' : 'Submitting Application...'
                    : isAmharic ? 'ማመልከቻውን ላክ' : 'Submit Application'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
