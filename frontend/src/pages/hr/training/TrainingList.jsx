import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { trainingService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function TrainingList() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        setLoading(true);
        const res = await trainingService.getMyTrainings();
        if (res.success) setTrainings(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainings();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-[#00ced1]" />
            <span>Training & Skill Development</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Workshops, skill development programs, and certifications.
          </p>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 text-center text-xs text-slate-400">
        {loading ? (
          'Loading training programs...'
        ) : trainings.length === 0 ? (
          <p>No enrolled trainings at this moment.</p>
        ) : (
          <div className="space-y-2">
            {trainings.map((t) => (
              <div key={t._id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
