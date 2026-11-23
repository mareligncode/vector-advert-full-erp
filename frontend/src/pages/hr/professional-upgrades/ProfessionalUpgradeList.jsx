import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { professionalUpgradeService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function ProfessionalUpgradeList() {
  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpgrades = async () => {
      try {
        setLoading(true);
        const res = await professionalUpgradeService.getMyUpgrades();
        if (res.success) setUpgrades(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpgrades();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#00ced1]" />
            <span>Professional Upgrades</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Degree and professional certificate company sponsorship requests.
          </p>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 text-center text-xs text-slate-400">
        {loading ? (
          'Loading upgrades...'
        ) : upgrades.length === 0 ? (
          <p>No sponsorship requests submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {upgrades.map((u) => (
              <div key={u._id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                <span className="font-bold text-slate-900 dark:text-white">{u.upgradeTitle}</span>
                <StatusBadge status={u.requestStatus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
