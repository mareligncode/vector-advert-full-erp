import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  Eye,
  FileText,
  Star,
  Building,
  MapPin,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Video,
  ChevronRight
} from 'lucide-react';
import { recruitmentService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';
import { useAuth } from '../../../context/AuthContext';
import { canPostJob, canManageRecruitment, DEPARTMENTS } from '../../../utils/rbac';

import CreateJobModal from '../../../components/hr/recruitment/CreateJobModal';
import EditJobModal from '../../../components/hr/recruitment/EditJobModal';
import CandidateDetailModal from '../../../components/hr/recruitment/CandidateDetailModal';
import ScheduleInterviewModal from '../../../components/hr/recruitment/ScheduleInterviewModal';

export default function JobPostingsList() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  // Active Tab: 'vacancies' | 'candidates' | 'interviews'
  const [activeTab, setActiveTab] = useState('vacancies');

  // Job Vacancies State
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobSearch, setJobSearch] = useState('');
  const [jobDeptFilter, setJobDeptFilter] = useState('all');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');

  // Candidate Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appSearch, setAppSearch] = useState('');
  const [appJobFilter, setAppJobFilter] = useState('all');
  const [appStatusFilter, setAppStatusFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [scheduleTargetApp, setScheduleTargetApp] = useState(null);

  // Copy careers URL state
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await recruitmentService.getJobPostings({ limit: 100 });
      if (res.success) {
        setJobs(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load vacancies:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const res = await recruitmentService.getJobApplications({ limit: 200 });
      if (res.success) {
        setApplications(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const handleCopyCareersUrl = () => {
    const url = `${window.location.origin}/careers`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTogglePublish = async (job) => {
    try {
      const nextStatus = job.postingStatus === 'published' ? 'closed' : 'published';
      const res = await recruitmentService.updateJobPostingStatus(job._id, nextStatus);
      if (res.success) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Failed to toggle vacancy status:', err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (
      !window.confirm(
        isAmharic
          ? 'ይህን የስራ ማስታወቂያ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?'
          : 'Are you sure you want to delete this vacancy?'
      )
    ) {
      return;
    }
    try {
      const res = await recruitmentService.deleteJobPosting(jobId);
      if (res.success) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (
      !window.confirm(
        isAmharic
          ? 'ይህን የማመልከቻ መዝገብ መሰረዝ ይፈልጋሉ?'
          : 'Are you sure you want to delete this candidate application?'
      )
    ) {
      return;
    }
    try {
      const res = await recruitmentService.deleteJobApplication(appId);
      if (res.success) {
        fetchApplications();
      }
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const handleQuickStatusChange = async (appId, nextStatus) => {
    try {
      const res = await recruitmentService.updateApplicationStatus(appId, nextStatus);
      if (res.success) {
        fetchApplications();
      }
    } catch (err) {
      console.error('Failed to update applicant status:', err);
    }
  };

  // Filtered Vacancies
  const filteredJobs = jobs.filter((job) => {
    if (jobDeptFilter !== 'all' && job.department !== jobDeptFilter) return false;
    if (jobStatusFilter !== 'all' && job.postingStatus !== jobStatusFilter) return false;
    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase();
      const matchTitle = job.jobTitle?.toLowerCase().includes(q);
      const matchDept = job.department?.toLowerCase().includes(q);
      const matchLoc = job.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchDept && !matchLoc) return false;
    }
    return true;
  });

  // Filtered Candidates
  const filteredApps = applications.filter((app) => {
    if (appJobFilter !== 'all' && app.jobPosting?._id !== appJobFilter) return false;
    if (appStatusFilter !== 'all' && app.applicationStatus !== appStatusFilter) return false;
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase();
      const fullName = [
        app.applicantName?.first,
        app.applicantName?.middle,
        app.applicantName?.last
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchEmail = app.applicantContact?.email?.toLowerCase().includes(q);
      const matchPhone = app.applicantContact?.phoneNumber?.toLowerCase().includes(q);
      const matchJob = app.jobPosting?.jobTitle?.toLowerCase().includes(q);
      if (!fullName.includes(q) && !matchEmail && !matchPhone && !matchJob) return false;
    }
    return true;
  });

  // Extract all scheduled interviews across all applications
  const allInterviews = applications
    .flatMap((app) =>
      (app.interviews || []).map((iv) => ({
        ...iv,
        applicationId: app._id,
        applicantName: app.applicantName,
        applicantContact: app.applicantContact,
        jobPosting: app.jobPosting
      }))
    )
    .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));

  // Key Metrics
  const publishedCount = jobs.filter((j) => j.postingStatus === 'published').length;
  const totalAppsCount = applications.length;
  const inPipelineCount = applications.filter((a) =>
    ['under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered'].includes(
      a.applicationStatus
    )
  ).length;
  const hiredCount = applications.filter((a) => a.applicationStatus === 'hired').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#00ced1]" />
            <span>{isAmharic ? 'የቅጥር እና የተሰጥዖ አስተዳደር' : 'Recruitment & Talent Acquisition'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isAmharic
              ? 'የስራ ክፍት ማስታወቂያዎችን፣ የእጩዎችን የቅጥር ሂደት እና ቃለ-መጠይቆችን ያስተዳድሩ።'
              : 'Post public vacancies, review applicants, and coordinate interview pipelines.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Public Careers Portal Link */}
          <Link
            to="/careers"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#00ced1]" />
            <span>{isAmharic ? 'የስራ ገጹን ይመልከቱ (/careers)' : 'Public Careers Portal'}</span>
          </Link>

          {/* Copy Public Link */}
          <button
            type="button"
            onClick={handleCopyCareersUrl}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs transition-all cursor-pointer"
            title="Copy Public Careers URL"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">{isAmharic ? 'ተቀድቷል!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'ሊንኩን ቅዳ' : 'Copy URL'}</span>
              </>
            )}
          </button>

          {/* Post New Vacancy (Only HR Authorized) */}
          {canPostJob(user) && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white text-xs font-black shadow-lg shadow-[#00ced1]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAmharic ? 'አዲስ የስራ ማስታወቂያ' : 'Post New Vacancy'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Key Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAmharic ? 'ይፋ የሆኑ ክፍት ስራዎች' : 'Active Vacancies'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {publishedCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {jobs.length} {isAmharic ? 'አጠቃላይ የስራ መደቦች' : 'total openings posted'}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAmharic ? 'የገቡ ማመልከቻዎች' : 'Total Applicants'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalAppsCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isAmharic ? 'ከህዝብ ድረ-ገጽ የቀረቡ' : 'received via public portal'}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAmharic ? 'በግምገማ / ቃለ-መጠይቅ ላይ' : 'Active in Pipeline'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {inPipelineCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {allInterviews.length} {isAmharic ? 'ቃለ-መጠይቆች ተይዘዋል' : 'interviews logged'}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAmharic ? 'የተቀጠሩ እጩዎች' : 'Hired Candidates'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {hiredCount}
          </div>
          <div className="text-xs text-emerald-500 mt-1 font-bold">
            {isAmharic ? 'ወደ ሰራተኛነት ተቀይረዋል' : 'Successfully onboarded'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('vacancies')}
          className={`pb-3 px-2 text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap border-b-2 flex items-center gap-2 ${
            activeTab === 'vacancies'
              ? 'border-[#00ced1] text-[#00ced1]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{isAmharic ? 'የስራ ክፍት ማስታወቂያዎች' : 'Job Vacancies'}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
            {jobs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 px-2 text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap border-b-2 flex items-center gap-2 ${
            activeTab === 'candidates'
              ? 'border-[#00ced1] text-[#00ced1]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isAmharic ? 'የእጩዎች ማመልከቻ ዝርዝር' : 'Candidate Pipeline'}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
            {applications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interviews')}
          className={`pb-3 px-2 text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap border-b-2 flex items-center gap-2 ${
            activeTab === 'interviews'
              ? 'border-[#00ced1] text-[#00ced1]'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isAmharic ? 'የቃለ-መጠይቆች ሰሌዳ' : 'Interview Board'}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
            {allInterviews.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: JOB VACANCIES & OPENINGS
      ========================================================================== */}
      {activeTab === 'vacancies' && (
        <div className="space-y-4">
          {/* Vacancy Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isAmharic ? 'በስራ መደብ ወይም ቦታ ፈልግ...' : 'Search vacancies by title or location...'}
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={jobDeptFilter}
                onChange={(e) => setJobDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              >
                <option value="all">{isAmharic ? 'ሁሉም ዲፓርትመንት' : 'All Departments'}</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              >
                <option value="all">{isAmharic ? 'ሁሉም ሁኔታዎች' : 'All Statuses'}</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Vacancies List */}
          {loadingJobs ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-[#00ced1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>{isAmharic ? 'ክፍት የስራ መደቦችን በማምጣት ላይ...' : 'Loading job vacancies...'}</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0e1626] border border-dashed border-slate-200 dark:border-slate-800">
              <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">
                {isAmharic ? 'ምንም የስራ ማስታወቂያ አልተገኘም' : 'No job vacancies found'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAmharic
                  ? 'አዲስ የስራ ማስታወቂያ ለመለጠፍ "አዲስ የስራ ማስታወቂያ" የሚለውን ይጫኑ።'
                  : 'Get started by creating your first job opening.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => {
                const appCount = applications.filter((a) => a.jobPosting?._id === job._id).length;
                const isPublished = job.postingStatus === 'published';

                return (
                  <div
                    key={job._id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-[#00ced1]/50 transition-all group"
                  >
                    <div>
                      {/* Top Header inside card */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                            {job.jobTitle}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{job.department}</span>
                          </div>
                        </div>
                        <StatusBadge status={job.postingStatus} />
                      </div>

                      {/* Badges / Specs */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize">
                          {job.employmentType}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize">
                          {job.experienceLevel} level
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 text-[11px] font-bold">
                          {job.numberOfOpenings || 1} {isAmharic ? 'ቦታዎች' : 'openings'}
                        </span>
                      </div>

                      {/* Location & Deadline */}
                      <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        {job.applicationDeadline && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {isAmharic ? 'የማብቂያ ቀን፡' : 'Deadline:'}{' '}
                              {new Date(job.applicationDeadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom stats & Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      {/* Applicants pill -> Switch to candidates tab with filter */}
                      <button
                        type="button"
                        onClick={() => {
                          setAppJobFilter(job._id);
                          setActiveTab('candidates');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-[#00ced1] hover:underline cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {appCount} {isAmharic ? 'አመልካቾች' : 'Applicants'}
                        </span>
                      </button>

                      {/* Action Icons */}
                      <div className="flex items-center gap-1">
                        {/* Toggle Publish */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(job)}
                          title={isPublished ? 'Unpublish (Hide)' : 'Publish to Careers Portal'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isPublished
                              ? 'text-emerald-500 hover:bg-emerald-500/10'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        {/* View in public careers */}
                        <Link
                          to={`/careers?job=${job._id}`}
                          target="_blank"
                          title="View on Public Careers"
                          className="p-1.5 text-slate-400 hover:text-[#00ced1] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Edit Vacancy */}
                        <button
                          type="button"
                          onClick={() => setEditingJob(job)}
                          title="Edit Vacancy"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Vacancy */}
                        <button
                          type="button"
                          onClick={() => handleDeleteJob(job._id)}
                          title="Delete Vacancy"
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: CANDIDATE PIPELINE & APPLICATIONS
      ========================================================================== */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isAmharic ? 'በእጩ ስም፣ ኢሜይል ወይም ስልክ ፈልግ...' : 'Search applicants by name, email or phone...'}
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={appJobFilter}
                onChange={(e) => setAppJobFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00ced1] max-w-xs truncate"
              >
                <option value="all">{isAmharic ? 'ሁሉም የስራ መደቦች' : 'All Job Vacancies'}</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.jobTitle}
                  </option>
                ))}
              </select>

              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1626] text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              >
                <option value="all">{isAmharic ? 'ሁሉም ደረጃዎች' : 'All Pipeline Stages'}</option>
                <option value="submitted">Submitted (አዲስ)</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interviewed">Interviewed</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired (የተቀጠረ)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            {loadingApps ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-[#00ced1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>{isAmharic ? 'የእጩዎችን ማመልከቻ በማምጣት ላይ...' : 'Loading candidate applications...'}</span>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">
                  {isAmharic ? 'ምንም የማመልከቻ መዝገብ አልተገኘም' : 'No candidate applications found'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAmharic
                    ? 'አመልካቾች በህዝብ የስራ ገጽ (/careers) በኩል ማመልከት ይችላሉ።'
                    : 'Job seekers apply through the public careers page (/careers).'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#152238] border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">{isAmharic ? 'እጩ / አመልካች' : 'Candidate'}</th>
                      <th className="py-3.5 px-4">{isAmharic ? 'የስራ መደብ' : 'Job Position'}</th>
                      <th className="py-3.5 px-4">{isAmharic ? 'ልምድና ደረጃ' : 'Exp & Rating'}</th>
                      <th className="py-3.5 px-4">{isAmharic ? 'የማመልከቻ ቀን' : 'Applied Date'}</th>
                      <th className="py-3.5 px-4">{isAmharic ? 'ደረጃ (Stage)' : 'Pipeline Stage'}</th>
                      <th className="py-3.5 px-4 text-right">{isAmharic ? 'ተግባራት' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredApps.map((app) => {
                      const fullName = [
                        app.applicantName?.first,
                        app.applicantName?.middle,
                        app.applicantName?.last
                      ]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <tr
                          key={app._id}
                          className="hover:bg-slate-50/70 dark:hover:bg-[#152238]/50 transition-colors"
                        >
                          {/* Candidate info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#00ced1]/15 text-[#00ced1] font-black text-xs flex items-center justify-center shrink-0">
                                {fullName ? fullName.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAppId(app._id);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="font-black text-slate-900 dark:text-white hover:text-[#00ced1] transition-colors text-left cursor-pointer"
                                >
                                  {fullName}
                                </button>
                                <div className="text-[11px] text-slate-400">
                                  {app.applicantContact?.email} • {app.applicantContact?.phoneNumber}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Position */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {app.jobPosting?.jobTitle || 'General Application'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {app.jobPosting?.department || 'N/A'}
                            </div>
                          </td>

                          {/* Experience & Rating */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {app.yearsOfExperience || 0}y exp
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= (app.applicantRating || 0)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-200 dark:text-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          {/* Stage Dropdown */}
                          <td className="py-3.5 px-4">
                            <select
                              value={app.applicationStatus || 'submitted'}
                              onChange={(e) => handleQuickStatusChange(app._id, e.target.value)}
                              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                            >
                              <option value="submitted">Submitted</option>
                              <option value="under_review">Under Review</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="interview_scheduled">Interview</option>
                              <option value="interviewed">Interviewed</option>
                              <option value="offered">Offered</option>
                              <option value="hired">Hired</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Resume */}
                              {app.resume && (
                                <a
                                  href={app.resume}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View Resume"
                                  className="p-1.5 text-slate-400 hover:text-[#00ced1] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                </a>
                              )}

                              {/* Schedule interview */}
                              <button
                                type="button"
                                onClick={() => setScheduleTargetApp(app)}
                                title="Schedule Interview"
                                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>

                              {/* Review Dossier */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAppId(app._id);
                                  setIsDetailModalOpen(true);
                                }}
                                title="View Dossier"
                                className="p-1.5 text-[#00ced1] hover:bg-[#00ced1]/10 rounded-lg transition-colors cursor-pointer font-bold text-xs flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                <span>{isAmharic ? 'ይመልከቱ' : 'Dossier'}</span>
                              </button>

                              {/* Delete application */}
                              <button
                                type="button"
                                onClick={() => handleDeleteApplication(app._id)}
                                title="Delete Application"
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* =========================================================================
          TAB 3: INTERVIEW BOARD
      ========================================================================== */}
      {activeTab === 'interviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {isAmharic ? 'የተመዘገቡ ቃለ-መጠይቆች' : 'Scheduled & Completed Interviews'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {allInterviews.length} {isAmharic ? 'አጠቃላይ ቃለ መጠይቆች' : 'total interview sessions logged'}
              </p>
            </div>
          </div>

          {allInterviews.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0e1626] border border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">
                {isAmharic ? 'ምንም የተመዘገበ ቃለ-መጠይቅ የለም' : 'No interviews scheduled yet'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAmharic
                  ? 'ከእጩዎች ዝርዝር ውስጥ "ቃለ-መጠይቅ መድብ" የሚለውን በመጫን መርሐግብር ማስያዝ ይችላሉ።'
                  : 'Schedule interviews directly from Candidate Pipeline.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allInterviews.map((iv, index) => {
                const candName = [
                  iv.applicantName?.first,
                  iv.applicantName?.middle,
                  iv.applicantName?.last
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div
                    key={iv._id || index}
                    className="p-5 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Header inside Interview card */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppId(iv.applicationId);
                              setIsDetailModalOpen(true);
                            }}
                            className="font-black text-sm text-slate-900 dark:text-white hover:text-[#00ced1] text-left cursor-pointer"
                          >
                            {candName || 'Candidate'}
                          </button>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {iv.jobPosting?.jobTitle || 'Position'}
                          </div>
                        </div>
                        <StatusBadge status={iv.interviewStatus} />
                      </div>

                      {/* Scheduled Time */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2 font-bold">
                          <Clock className="w-3.5 h-3.5 text-[#00ced1]" />
                          <span>{new Date(iv.scheduledDate).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="capitalize">{iv.interviewFormat} Format</span>
                          {iv.interviewLocation && (
                            <>
                              <span>•</span>
                              <span>{iv.interviewLocation}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Feedback / Score if recorded */}
                      {iv.interviewScore !== undefined && (
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Interview Score:</span>
                          <span className="font-black text-amber-500">
                            {iv.interviewScore} / 100
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      {iv.onlineMeetingLink ? (
                        <a
                          href={iv.onlineMeetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-sky-500 hover:underline"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Online Call</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">In-Person Session</span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppId(iv.applicationId);
                          setIsDetailModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 font-black text-[#00ced1] hover:underline cursor-pointer"
                      >
                        <span>{isAmharic ? 'ዝርዝር' : 'Details'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS
      ========================================================================== */}
      {/* Create Vacancy Modal */}
      {isCreateModalOpen && (
        <CreateJobModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchJobs();
          }}
        />
      )}

      {/* Edit Vacancy Modal */}
      {editingJob && (
        <EditJobModal
          isOpen={Boolean(editingJob)}
          onClose={() => setEditingJob(null)}
          job={editingJob}
          onSuccess={() => {
            fetchJobs();
          }}
        />
      )}

      {/* Candidate Dossier Detail Modal */}
      {isDetailModalOpen && (
        <CandidateDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAppId(null);
          }}
          applicationId={selectedAppId}
          onUpdateSuccess={() => {
            fetchApplications();
          }}
        />
      )}

      {/* Schedule Interview Modal */}
      {scheduleTargetApp && (
        <ScheduleInterviewModal
          isOpen={Boolean(scheduleTargetApp)}
          onClose={() => setScheduleTargetApp(null)}
          application={scheduleTargetApp}
          onSuccess={() => {
            fetchApplications();
          }}
        />
      )}
    </div>
  );
}
