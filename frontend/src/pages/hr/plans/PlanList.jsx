import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import { planService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function PlanList() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await planService.getPlans();
        if (res.success) setPlans(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.plans.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.plans.subtitle')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 text-center text-xs text-slate-400">
        {loading ? (
          t('hrPages.plans.loading')
        ) : plans.length === 0 ? (
          <p>{t('hrPages.plans.empty')}</p>
        ) : (
          <div className="space-y-2">
            {plans.map((p) => (
              <div key={p._id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                <span className="capitalize">{p.type}</span>
                <StatusBadge status={p.approval?.status || 'draft'} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
