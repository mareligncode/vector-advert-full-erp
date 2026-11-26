import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react';
import { trainingService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function TrainingList() {
  const { t } = useTranslation();
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
            <span>{t('hrPages.training.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.training.subtitle')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 text-center text-xs text-slate-400">
        {loading ? (
          t('hrPages.training.loading')
        ) : trainings.length === 0 ? (
          <p>{t('hrPages.training.empty')}</p>
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
