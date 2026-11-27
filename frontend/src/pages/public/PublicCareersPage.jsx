import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Filter,
  MapPin,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Building,
  ShieldCheck,
  Send,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { recruitmentService } from '../../services/hrService';
import PublicApplicationModal from '../../components/public/PublicApplicationModal';

export default function PublicCareersPage() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const [searchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyTargetJob, setApplyTargetJob] = useState(null);

  const fetchPublicJobs = async () => {
    try {
      setLoading(true);
      const res = await recruitmentService.getJobPostings({ status: 'published', limit: 100 });
      if (res.success) {
        setJobs(res.data || []);

        // If a specific job ID was in search param
        const targetId = searchParams.get('job');
        if (targetId && res.data) {
          const match = res.data.find((j) => j._id === targetId);
          if (match) setSelectedJob(match);
        } else if (res.data?.length > 0 && !selectedJob) {
          setSelectedJob(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load public career jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicJobs();
  }, []);

  const departments = ['all', ...Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)))];

  const filteredJobs = jobs.filter((j) => {
    const matchesDept = selectedDepartment === 'all' || j.department === selectedDepartment;
    const matchesType = selectedType === 'all' || j.employmentType === selectedType;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      j.jobTitle.toLowerCase().includes(term) ||
      (j.jobDescription || '').toLowerCase().includes(term) ||
      (j.location || '').toLowerCase().includes(term);

    return matchesDept && matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#00ced1] selection:text-slate-950">
      {/* Public Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#00ced1] to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-[#00ced1]/20">
              V
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>VECTOR</span>
                <span className="text-[#00ced1] font-mono text-xs px-1.5 py-0.5 rounded-md bg-[#00ced1]/15">
                  CAREERS
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Staff Sign In
            </Link>
            <Link
              to="/hr"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center gap-1.5"
            >
              <span>HR Platform</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#00ced1]" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 py-12 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(#00ced1_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ced1]/15 border border-[#00ced1]/30 text-[#00ced1] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'የክፍት የስራ መደቦች ማስታወቂያ' : 'Open Vacancies & Career Opportunities'}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {isAmharic ? 'የስራ ጉዞዎን ከቬክተር አድቨርት ጋር ይገንቡ' : 'Grow Your Career With Vector Advert Enterprise'}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
              {isAmharic
                ? 'በማስታወቂያ፣ በህትመት ቴክኖሎጂ እና በድርጅት ስራዎች ውስጥ ግንባር ቀደም የሆነውን ቡድናችንን ይቀላቀሉ። ምንም ዓይነት መለያ መፍጠር ሳያስፈልግዎ በቀጥታ ማመልከት ይችላሉ።'
                : 'Join our leading design, manufacturing, print production, and operations team. Apply directly without creating any account.'}
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mt-8 p-3 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isAmharic
                    ? 'በስራ ርዕስ፣ በክፍል ወይም በከተማ ይፈልጉ...'
                    : 'Search by job title, department, or location...'
                }
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700/60 bg-slate-800/60 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00ced1]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="flex-1 sm:flex-none text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-700/60 bg-slate-800/60 text-slate-200 focus:outline-none focus:border-[#00ced1] cursor-pointer"
              >
                <option value="all">{isAmharic ? 'ሁሉም ክፍሎች (All)' : 'All Departments'}</option>
                {departments.filter((d) => d !== 'all').map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex-1 sm:flex-none text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-700/60 bg-slate-800/60 text-slate-200 focus:outline-none focus:border-[#00ced1] cursor-pointer"
              >
                <option value="all">{isAmharic ? 'ሁሉም አይነት (All Types)' : 'All Work Types'}</option>
                <option value="full-time">Full-Time (ሙሉ ሰዓት)</option>
                <option value="part-time">Part-Time (የትርፍ ሰዓት)</option>
                <option value="contract">Contract (የውል)</option>
                <option value="internship">Internship (ልምምድ)</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Job Board Section: List & Detail Pane */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#00ced1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs font-bold tracking-wider uppercase">Loading Openings...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400 max-w-md mx-auto space-y-3">
            <Briefcase className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-white">
              {isAmharic ? 'ምንም ክፍት የስራ መደብ አልተገኘም' : 'No Matching Vacancies Found'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAmharic
                ? 'እባክዎ የፍለጋ ቃላቶችን ወይም ማጣሪያዎችን ይቀይሩ።'
                : 'Try adjusting your search keywords or department filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Job Cards List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isAmharic ? 'ክፍት መደቦች' : 'Active Vacancies'} ({filteredJobs.length})
                </span>
              </div>

              {filteredJobs.map((j) => {
                const isSelected = selectedJob?._id === j._id;
                return (
                  <div
                    key={j._id}
                    onClick={() => setSelectedJob(j)}
                    className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-900 border-[#00ced1] shadow-lg shadow-[#00ced1]/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#00ced1]/15 text-[#00ced1] uppercase tracking-wider mb-2">
                          {j.department}
                        </span>
                        <h3 className="text-base font-black text-white group-hover:text-[#00ced1] transition-colors">
                          {j.jobTitle}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 capitalize shrink-0">
                        {j.employmentType}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{j.location}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{j.numberOfOpenings || 1} open</span>
                      </span>
                      {j.applicationDeadline && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[11px] text-amber-400">
                            <Clock className="w-3 h-3" />
                            <span>Deadline: {new Date(j.applicationDeadline).toLocaleDateString()}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Active Job Description & Apply Panel (7 cols) */}
            {selectedJob && (
              <div className="lg:col-span-7 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 lg:sticky lg:top-24 shadow-2xl">
                {/* Header */}
                <div className="border-b border-slate-800 pb-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-[#00ced1]/20 text-[#00ced1] uppercase tracking-wider">
                      {selectedJob.department}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setApplyTargetJob(selectedJob);
                        setIsApplyModalOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#00ced1] hover:brightness-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-[#00ced1]/20 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAmharic ? 'አሁን አመልክት (Apply Now)' : 'Apply Now'}</span>
                    </button>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {selectedJob.jobTitle}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-4 h-4 text-[#00ced1]" />
                      <span>{selectedJob.location}</span>
                    </span>
                    <span>•</span>
                    <span className="capitalize font-bold text-slate-200">
                      {selectedJob.employmentType}
                    </span>
                    <span>•</span>
                    <span className="capitalize text-slate-400">
                      Level: <strong className="text-white">{selectedJob.experienceLevel}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedJob.numberOfOpenings || 1} {isAmharic ? 'ክፍት ቦታዎች' : 'Openings'}
                    </span>
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isAmharic ? 'የስራ መግለጫ እና ኃላፊነቶች' : 'Job Description & Scope'}
                  </h4>
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                    {selectedJob.jobDescription}
                  </div>
                </div>

                {/* Requirements */}
                {Array.isArray(selectedJob.jobRequirements) && selectedJob.jobRequirements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {isAmharic ? 'የስራው መስፈርቶች' : 'Requirements & Qualifications'}
                    </h4>
                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2">
                      {selectedJob.jobRequirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-[#00ced1] shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply Bottom CTA */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-850 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-bold text-white">
                      {isAmharic ? 'ለዚህ ስራ መደብ ዝግጁ ነዎት?' : 'Ready to apply for this position?'}
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAmharic
                        ? 'ያለምንም መለያ መክፈት CV በማያያዝ ማመልከት ይችላሉ።'
                        : 'No account needed. Simply fill in your details and attach your CV.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setApplyTargetJob(selectedJob);
                      setIsApplyModalOpen(true);
                    }}
                    className="px-6 py-3 rounded-xl bg-[#00ced1] hover:brightness-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00ced1]/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'አሁን ማመልከቻ አስገባ' : 'Submit Application'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Public Application Modal */}
      {isApplyModalOpen && applyTargetJob && (
        <PublicApplicationModal
          isOpen={isApplyModalOpen}
          job={applyTargetJob}
          onClose={() => {
            setIsApplyModalOpen(false);
            setApplyTargetJob(null);
          }}
          onSuccess={() => {
            fetchPublicJobs();
          }}
        />
      )}

      {/* Public Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Vector Advert Enterprise ERP Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
