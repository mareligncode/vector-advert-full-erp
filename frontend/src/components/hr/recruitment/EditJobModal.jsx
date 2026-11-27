import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';
import { recruitmentService } from '../../../services/hrService';
import { DEPARTMENTS } from '../../../utils/rbac';

export default function EditJobModal({ isOpen, onClose, job, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0] || 'Creative & Design');
  const [location, setLocation] = useState('Addis Ababa, Ethiopia (HQ)');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [numberOfOpenings, setNumberOfOpenings] = useState(1);
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [postingStatus, setPostingStatus] = useState('published');
  const [jobDescription, setJobDescription] = useState('');
  const [jobRequirements, setJobRequirements] = useState(['']);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      setJobTitle(job.jobTitle || '');
      setDepartment(job.department || DEPARTMENTS[0] || '');
      setLocation(job.location || 'Addis Ababa, Ethiopia (HQ)');
      setEmploymentType(job.employmentType || 'full-time');
      setExperienceLevel(job.experienceLevel || 'mid');
      setNumberOfOpenings(job.numberOfOpenings || 1);
      setPostingStatus(job.postingStatus || 'published');
      setJobDescription(job.jobDescription || '');
      setJobRequirements(
        Array.isArray(job.jobRequirements) && job.jobRequirements.length > 0
          ? job.jobRequirements
          : ['']
      );
      if (job.applicationDeadline) {
        setApplicationDeadline(new Date(job.applicationDeadline).toISOString().split('T')[0]);
      } else {
        setApplicationDeadline('');
      }
      setError('');
    }
  }, [job]);

  if (!isOpen || !job) return null;

  const handleAddRequirement = () => {
    setJobRequirements([...jobRequirements, '']);
  };

  const handleRemoveRequirement = (idx) => {
    setJobRequirements(jobRequirements.filter((_, i) => i !== idx));
  };

  const handleRequirementChange = (idx, value) => {
    const updated = [...jobRequirements];
    updated[idx] = value;
    setJobRequirements(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      setError(isAmharic ? 'እባክዎ የስራ መደቡን ርዕስ ያስገቡ' : 'Please provide a job title');
      return;
    }
    if (!jobDescription.trim()) {
      setError(isAmharic ? 'እባክዎ የስራ መግለጫ ያስገቡ' : 'Please provide job description');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const cleanReqs = jobRequirements.map((r) => r.trim()).filter(Boolean);

      const payload = {
        jobTitle: jobTitle.trim(),
        department,
        location: location.trim(),
        employmentType,
        experienceLevel,
        numberOfOpenings: Number(numberOfOpenings) || 1,
        postingStatus,
        jobDescription: jobDescription.trim(),
        jobRequirements: cleanReqs
      };

      if (applicationDeadline) {
        payload.applicationDeadline = applicationDeadline;
      }

      const res = await recruitmentService.updateJobPosting(job._id, payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to update job posting');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error updating job vacancy');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#152238]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isAmharic ? 'የስራ ማስታወቂያውን ያሻሽሉ' : 'Edit Job Vacancy'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {job.jobTitle} • {job.department}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs sm:text-sm">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Job Title */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'የስራ መደብ ርዕስ *' : 'Job Title *'}
            </label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Row: Department & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'ዲፓርትመንት *' : 'Department *'}</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'የስራ ቦታ *' : 'Work Location *'}</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>
          </div>

          {/* Row: Employment Type, Experience Level, Openings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'የስራ አይነት' : 'Employment Type'}</span>
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              >
                <option value="full-time">{isAmharic ? 'ሙሉ ሰዓት (Full-Time)' : 'Full-Time'}</option>
                <option value="part-time">{isAmharic ? 'የትርፍ ሰዓት (Part-Time)' : 'Part-Time'}</option>
                <option value="contract">{isAmharic ? 'ኮንትራት (Contract)' : 'Contract'}</option>
                <option value="freelance">{isAmharic ? 'ፍሪላንስ (Freelance)' : 'Freelance'}</option>
                <option value="internship">{isAmharic ? 'የልምምድ (Internship)' : 'Internship'}</option>
                <option value="temporary">{isAmharic ? 'ጊዜያዊ (Temporary)' : 'Temporary'}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAmharic ? 'የልምድ ደረጃ' : 'Experience Level'}
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              >
                <option value="entry">Entry Level</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'የክፍት ቦታዎች ብዛት' : 'No. of Openings'}</span>
              </label>
              <input
                type="number"
                min="1"
                value={numberOfOpenings}
                onChange={(e) => setNumberOfOpenings(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>
          </div>

          {/* Row: Deadline & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'የማመልከቻ ማብቂያ ቀን' : 'Application Deadline'}</span>
              </label>
              <input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAmharic ? 'የማስታወቂያው ሁኔታ' : 'Publication Status'}
              </label>
              <select
                value={postingStatus}
                onChange={(e) => setPostingStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              >
                <option value="published">{isAmharic ? 'ይፋ ሆኗል (Published - Public)' : 'Published (Publicly Visible)'}</option>
                <option value="draft">{isAmharic ? 'ረቂቅ (Draft)' : 'Draft (Hidden)'}</option>
                <option value="on_hold">{isAmharic ? 'ለጊዜው የቆመ (On Hold)' : 'On Hold'}</option>
                <option value="closed">{isAmharic ? 'የተዘጋ (Closed)' : 'Closed'}</option>
                <option value="archived">{isAmharic ? 'የተመዘገበ / አሮጌ (Archived)' : 'Archived'}</option>
              </select>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAmharic ? 'የስራ መግለጫና ኃላፊነቶች *' : 'Job Description & Duties *'}</span>
            </label>
            <textarea
              rows={4}
              required
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1] resize-none"
            />
          </div>

          {/* Job Requirements */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                {isAmharic ? 'የስራው መስፈርቶች' : 'Key Requirements & Qualifications'}
              </label>
              <button
                type="button"
                onClick={handleAddRequirement}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#00ced1] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'መስፈርት ጨምር' : 'Add Item'}</span>
              </button>
            </div>
            <div className="space-y-2">
              {jobRequirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleRequirementChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                  />
                  {jobRequirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white font-black shadow-lg shadow-[#00ced1]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAmharic ? 'ለውጦችን መዝግብ' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
