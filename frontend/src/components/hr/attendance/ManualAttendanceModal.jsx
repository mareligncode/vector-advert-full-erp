import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Edit3,
  Calendar,
  Clock,
  Save,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
  FileText
} from 'lucide-react';
import { attendanceService } from '../../../services/hrService';

const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'absent', label: 'Absent' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'field_visit', label: 'Field Visit' },
  { value: 'holiday', label: 'Holiday' }
];

export default function ManualAttendanceModal({
  isOpen,
  onClose,
  record,
  onSuccess
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [morningInTime, setMorningInTime] = useState('');
  const [morningOutTime, setMorningOutTime] = useState('');
  const [afternoonInTime, setAfternoonInTime] = useState('');
  const [afternoonOutTime, setAfternoonOutTime] = useState('');
  const [isLate, setIsLate] = useState(false);
  const [minutesLate, setMinutesLate] = useState(0);
  const [hasOvertime, setHasOvertime] = useState(false);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [notes, setNotes] = useState('');

  const toTimeString = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (record) {
      setAttendanceStatus(record.attendanceStatus || 'present');
      setMorningInTime(toTimeString(record.morningCheck?.checkIn?.time));
      setMorningOutTime(toTimeString(record.morningCheck?.checkOut?.time));
      setAfternoonInTime(toTimeString(record.afternoonCheck?.checkIn?.time));
      setAfternoonOutTime(toTimeString(record.afternoonCheck?.checkOut?.time));
      setIsLate(Boolean(record.late?.isLate));
      setMinutesLate(record.late?.minutesLate || 0);
      setHasOvertime(Boolean(record.overtime?.hasOvertime));
      setOvertimeHours(record.overtime?.numberOfHours || 0);
      setNotes(record.notes || '');
      setError('');
      setSuccessMsg('');
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const emp = record.employee || {};
  const empName = emp.name
    ? `${emp.name.first || ''} ${emp.name.last || ''}`.trim()
    : emp.employeeNumber || 'Employee';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      // Build updated payload preserving dates
      const baseDate = new Date(record.attendanceDate);

      const buildDateTime = (timeStr) => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':').map(Number);
        const d = new Date(baseDate);
        d.setHours(hours, minutes, 0, 0);
        return d;
      };

      const payload = {
        attendanceStatus,
        late: {
          isLate,
          minutesLate: isLate ? Number(minutesLate) : 0
        },
        overtime: {
          hasOvertime,
          numberOfHours: hasOvertime ? Number(overtimeHours) : 0
        },
        notes
      };

      // Morning shift times
      if (morningInTime) {
        payload['morningCheck.checkIn.time'] = buildDateTime(morningInTime);
      }
      if (morningOutTime) {
        payload['morningCheck.checkOut.time'] = buildDateTime(morningOutTime);
      }

      // Afternoon shift times
      if (afternoonInTime) {
        payload['afternoonCheck.checkIn.time'] = buildDateTime(afternoonInTime);
      }
      if (afternoonOutTime) {
        payload['afternoonCheck.checkOut.time'] = buildDateTime(afternoonOutTime);
      }

      const res = await attendanceService.manualUpdate(record._id, payload);
      if (res.success) {
        setSuccessMsg(t('hrPages.attendance.adjustmentSuccess'));
        setTimeout(() => {
          onSuccess?.(res.data);
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('hrPages.attendance.adjustmentTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {empName} ({emp.employeeNumber || 'EMP'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Overall Attendance Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('hrPages.attendance.selectStatus')}
            </label>
            <select
              value={attendanceStatus}
              onChange={(e) => setAttendanceStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#00ced1]"
            >
              {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Morning Shift Times */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#00ced1]" />
              <span>{t('hrPages.attendance.morningShift')} (08:30 – 12:30)</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.morningCheckIn')}
                </label>
                <input
                  type="time"
                  value={morningInTime}
                  onChange={(e) => setMorningInTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.morningCheckOut')}
                </label>
                <input
                  type="time"
                  value={morningOutTime}
                  onChange={(e) => setMorningOutTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
            </div>
          </div>

          {/* Afternoon Shift Times */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('hrPages.attendance.afternoonShift')} (13:30 – 17:30)</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.afternoonCheckIn')}
                </label>
                <input
                  type="time"
                  value={afternoonInTime}
                  onChange={(e) => setAfternoonInTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.afternoonCheckOut')}
                </label>
                <input
                  type="time"
                  value={afternoonOutTime}
                  onChange={(e) => setAfternoonOutTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
            </div>
          </div>

          {/* Lateness & Overtime Overrides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Late Adjust */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLate}
                  onChange={(e) => setIsLate(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00ced1] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('hrPages.attendance.isLateToggle')}</span>
                </span>
              </label>
              {isLate && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {t('hrPages.attendance.minutesLateInput')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minutesLate}
                    onChange={(e) => setMinutesLate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070b12] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Overtime Adjust */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOvertime}
                  onChange={(e) => setHasOvertime(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00ced1] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#00ced1]" />
                  <span>{t('hrPages.attendance.hasOvertimeToggle')}</span>
                </span>
              </label>
              {hasOvertime && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {t('hrPages.attendance.overtimeHoursInput')}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070b12] text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes / Reason for Adjustment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('hrPages.attendance.adjustmentNotes')}</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved manual adjustment per Manager request..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070b12] text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00ced1]"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? t('common.saving') : t('hrPages.attendance.saveChanges')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
