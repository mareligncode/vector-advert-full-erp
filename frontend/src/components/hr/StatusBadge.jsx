import React from 'react';

const STATUS_MAP = {
  // General / Employment
  active: { label: 'Active', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/60' },
  probation: { label: 'Probation', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' },
  suspended: { label: 'Suspended', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/60' },
  terminated: { label: 'Terminated', bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
  resigned: { label: 'Resigned', bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
  on_leave: { label: 'On Leave', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/60' },

  // Approvals & Workflow
  approved: { label: 'Approved', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/60' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/60' },
  pending: { label: 'Pending', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' },
  pending_manager: { label: 'Pending Manager', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' },
  pending_hr: { label: 'Pending HR', bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800/60' },
  pending_finance: { label: 'Pending Finance', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/60' },
  pending_executive: { label: 'Pending Executive', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/60' },
  disbursed: { label: 'Disbursed', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/60' },
  draft: { label: 'Draft', bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-700' },

  // Attendance
  present: { label: 'Present', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/60' },
  late: { label: 'Late', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' },
  absent: { label: 'Absent', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/60' },
  excused: { label: 'Excused', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/60' },
  half_day: { label: 'Half Day', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/60' },
  field_visit: { label: 'Field Visit', bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800/60' },

  // Verification & Review
  verified: { label: 'Verified', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/60' },
  unverified: { label: 'Unverified', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' }
};

export default function StatusBadge({ status, customLabel, size = 'md' }) {
  const normalized = (status || '').toLowerCase().trim();
  const config = STATUS_MAP[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700'
  };

  const label = customLabel || config.label;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs font-bold'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} shadow-xs capitalize tracking-tight whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-80" />
      <span>{label}</span>
    </span>
  );
}
