import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Clock,
  MapPin,
  Camera,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit,
  User,
  Shield,
  ExternalLink,
  Zap,
  Info
} from 'lucide-react';
import StatusBadge from '../StatusBadge';

export default function AttendanceDetailModal({
  isOpen,
  onClose,
  record,
  onEditClick,
  canEdit = false
}) {
  const { t } = useTranslation();
  const [activePhoto, setActivePhoto] = useState(null);

  if (!isOpen || !record) return null;

  const emp = record.employee || {};
  const empName = emp.name
    ? `${emp.name.first || ''} ${emp.name.last || ''}`.trim()
    : emp.employeeNumber || 'Employee';

  const morningIn = record.morningCheck?.checkIn;
  const morningOut = record.morningCheck?.checkOut;
  const afternoonIn = record.afternoonCheck?.checkIn;
  const afternoonOut = record.afternoonCheck?.checkOut;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    try {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('hrPages.attendance.detailsTitle')}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(record.attendanceDate)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditClick?.(record);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#00ced1] hover:bg-[#00ced1]/10 border border-[#00ced1]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{t('hrPages.attendance.adjustRecord')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Employee Header Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00ced1]/20 to-teal-500/20 text-[#00ced1] flex items-center justify-center font-bold text-base border border-[#00ced1]/30">
                {emp.name?.first ? emp.name.first[0].toUpperCase() : <User className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {empName}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {emp.employeeNumber || 'EMP'}
                  </span>
                  <span>•</span>
                  <span>{emp.department || 'Department'}</span>
                  <span>•</span>
                  <span>{emp.jobTitle || 'Role'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={record.attendanceStatus} size="lg" />
            </div>
          </div>

          {/* Key Metrics / Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 capitalize">
                {record.attendanceStatus?.replace('_', ' ')}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Late Status</span>
              <p className="text-xs font-bold mt-1 text-slate-900 dark:text-white flex items-center gap-1.5">
                {record.late?.isLate ? (
                  <span className="text-amber-500 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{record.late.minutesLate || 0} mins</span>
                  </span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>On Time</span>
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Overtime</span>
              <p className="text-xs font-bold mt-1 text-slate-900 dark:text-white flex items-center gap-1.5">
                {record.overtime?.hasOvertime ? (
                  <span className="text-[#00ced1] flex items-center gap-1 font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{record.overtime.numberOfHours || 0} hrs</span>
                  </span>
                ) : (
                  <span className="text-slate-400">None</span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Location</span>
              <p className="text-xs font-bold mt-1 text-slate-700 dark:text-slate-300 truncate" title={record.morningCheck?.locationRef || 'Designated Office'}>
                {record.morningCheck?.locationRef || record.afternoonCheck?.locationRef || 'Office'}
              </p>
            </div>
          </div>

          {/* Morning Shift Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ced1]" />
                <span>{t('hrPages.attendance.morningDetails')}</span>
              </h5>
              <span className="text-[11px] text-slate-400">08:30 – 12:30</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Morning In */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Check-In</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {formatTime(morningIn?.time)}
                  </span>
                </div>

                {morningIn?.status && (
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={morningIn.status} size="sm" />
                    {morningIn.distanceMeters !== undefined && (
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(morningIn.distanceMeters)}m from office)
                      </span>
                    )}
                  </div>
                )}

                {morningIn?.selfie && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setActivePhoto(morningIn.selfie)}
                      className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 block cursor-pointer"
                    >
                      <img
                        src={morningIn.selfie}
                        alt="Morning In Selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Morning Out */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Check-Out</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {formatTime(morningOut?.time)}
                  </span>
                </div>

                {morningOut?.status && (
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={morningOut.status} size="sm" />
                    {morningOut.distanceMeters !== undefined && (
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(morningOut.distanceMeters)}m from office)
                      </span>
                    )}
                  </div>
                )}

                {morningOut?.selfie && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setActivePhoto(morningOut.selfie)}
                      className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 block cursor-pointer"
                    >
                      <img
                        src={morningOut.selfie}
                        alt="Morning Out Selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Afternoon Shift Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span>{t('hrPages.attendance.afternoonDetails')}</span>
              </h5>
              <span className="text-[11px] text-slate-400">13:30 – 17:30</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Afternoon In */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Check-In</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {formatTime(afternoonIn?.time)}
                  </span>
                </div>

                {afternoonIn?.status && (
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={afternoonIn.status} size="sm" />
                    {afternoonIn.distanceMeters !== undefined && (
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(afternoonIn.distanceMeters)}m from office)
                      </span>
                    )}
                  </div>
                )}

                {afternoonIn?.selfie && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setActivePhoto(afternoonIn.selfie)}
                      className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 block cursor-pointer"
                    >
                      <img
                        src={afternoonIn.selfie}
                        alt="Afternoon In Selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Afternoon Out */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Check-Out</span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {formatTime(afternoonOut?.time)}
                  </span>
                </div>

                {afternoonOut?.status && (
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={afternoonOut.status} size="sm" />
                    {afternoonOut.distanceMeters !== undefined && (
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(afternoonOut.distanceMeters)}m from office)
                      </span>
                    )}
                  </div>
                )}

                {afternoonOut?.selfie && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setActivePhoto(afternoonOut.selfie)}
                      className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 block cursor-pointer"
                    >
                      <img
                        src={afternoonOut.selfie}
                        alt="Afternoon Out Selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {record.notes && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>{t('hrPages.attendance.auditNotes')}</span>
              </span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-5">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>

      {/* Enlarged Selfie Lightbox */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-lg max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <img src={activePhoto} alt="Verification Selfie Enlarge" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
