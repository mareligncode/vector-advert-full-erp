import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { clearanceService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function ClearanceList() {
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClearances = async () => {
      try {
        setLoading(true);
        const res = await clearanceService.getMyClearance();
        if (res.success && res.data) setClearances([res.data]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClearances();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LogOut className="w-6 h-6 text-[#00ced1]" />
            <span>Employee Clearance & Offboarding</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Multi-department checklist (Dept Head, Store, IT, Finance, HR) and exit certification.
          </p>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 text-center text-xs text-slate-400">
        {loading ? (
          'Loading clearances...'
        ) : clearances.length === 0 ? (
          <p>No active exit clearances.</p>
        ) : (
          <div className="space-y-2">
            {clearances.map((c) => (
              <div key={c._id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                <span>Last day: {new Date(c.lastWorkingDay).toLocaleDateString()}</span>
                <StatusBadge status={c.overallStatus || 'pending'} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
