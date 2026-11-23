import React, { useState, useEffect } from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { recruitmentService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function JobPostingsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await recruitmentService.getJobPostings();
        if (res.success) setJobs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#00ced1]" />
            <span>Recruitment & Talent Acquisition</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage job vacancies, candidate review pipeline, and interview scoring.
          </p>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 text-center text-xs text-slate-400">
        {loading ? (
          'Loading vacancies...'
        ) : jobs.length === 0 ? (
          <p>No active job postings currently open.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((j) => (
              <div key={j._id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                <span className="font-bold text-slate-900 dark:text-white">{j.jobTitle}</span>
                <span>{j.department}</span>
                <StatusBadge status={j.postingStatus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
