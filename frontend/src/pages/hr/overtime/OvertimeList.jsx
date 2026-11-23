import React, { useState, useEffect } from 'react';
import { Zap, Plus, Clock } from 'lucide-react';
import { overtimeService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function OvertimeList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOvertime = async () => {
      try {
        setLoading(true);
        const res = await overtimeService.getMyRequests();
        if (res.success) setRequests(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOvertime();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#00ced1]" />
            <span>Overtime Requests & Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track calculated overtime hours, weekend multipliers, and manager decisions.
          </p>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 text-center text-xs text-slate-400">
        {loading ? (
          'Loading overtime records...'
        ) : requests.length === 0 ? (
          <p>No overtime requests logged yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r._id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                <span>{new Date(r.requestDate).toLocaleDateString()}</span>
                <span>{r.totalHours} hrs</span>
                <StatusBadge status={r.requestStatus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
