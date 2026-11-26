import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function ApprovalTimeline({ stages = [] }) {
  const { t } = useTranslation();
  if (!stages || stages.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#152238]/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {t('approval.lifecycle')}
      </h4>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2">
        {stages.map((stage, idx) => {
          const isApproved = stage.status === 'approved';
          const isRejected = stage.status === 'rejected';

          const icon = isApproved ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : isRejected ? (
            <XCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <Clock className="w-4 h-4 text-amber-500" />
          );

          const borderColor = isApproved
            ? 'border-emerald-300 dark:border-emerald-800'
            : isRejected
            ? 'border-rose-300 dark:border-rose-800'
            : 'border-slate-200 dark:border-slate-700';

          const statusKey = (stage.status || 'pending').toLowerCase().trim();
          const statusLabel = t(`status.${statusKey}`, stage.status || 'Pending');

          return (
            <React.Fragment key={idx}>
              <div
                className={`flex-1 min-w-[120px] p-2.5 rounded-xl bg-white dark:bg-[#0e1626] border ${borderColor} flex items-center gap-2.5 shadow-xs`}
              >
                <div className="shrink-0">{icon}</div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {stage.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate">
                    {statusLabel} {stage.by ? `${t('approval.by')} ${stage.by}` : ''}
                  </p>
                  {stage.date && (
                    <p className="text-[9px] text-slate-400 dark:text-slate-500">
                      {new Date(stage.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {idx < stages.length - 1 && (
                <div className="hidden sm:block w-4 h-0.5 bg-slate-300 dark:bg-slate-700 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
