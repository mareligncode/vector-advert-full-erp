import React, { useState, useEffect } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { fieldVisitService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function FieldVisitList() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setLoading(true);
        const res = await fieldVisitService.getMyVisits();
        if (res.success) setVisits(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#00ced1]" />
            <span>Field Visits & Client Sites</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Schedule on-site client visits, GPS check-in, and report notes.
          </p>
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 text-center text-xs text-slate-400">
        {loading ? (
          'Loading field visits...'
        ) : visits.length === 0 ? (
          <p>No client field visits scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {visits.map((v) => (
              <div key={v._id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                <span>{v.visitPurpose}</span>
                <span>{new Date(v.visitDate).toLocaleDateString()}</span>
                <StatusBadge status={v.visitStatus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
