import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Plus } from 'lucide-react';
import { internshipService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function InternshipList() {
  const { t } = useTranslation();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        const res = await internshipService.getInternships();
        if (res.success) setInternships(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.internships.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.internships.subtitle')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 text-center text-xs text-slate-400">
        {loading ? (
          t('hrPages.internships.loading')
        ) : internships.length === 0 ? (
          <p>{t('hrPages.internships.empty')}</p>
        ) : (
          <div className="space-y-2">
            {internships.map((i) => (
              <div key={i._id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                <span>{i.internshipNumber}</span>
                <StatusBadge status={i.placement?.status || 'active'} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
