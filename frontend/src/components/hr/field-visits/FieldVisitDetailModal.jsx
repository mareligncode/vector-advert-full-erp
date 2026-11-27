import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Users,
  Navigation,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Shield,
  Camera,
  Check,
  Edit3
} from 'lucide-react';
import { fieldVisitService } from '../../../services/hrService';
import StatusBadge from '../StatusBadge';
import { getEmployeeFullName, getEmployeeInitial } from '../../../utils/rbac';

export default function FieldVisitDetailModal({
  isOpen,
  onClose,
  visit,
  isLeaderOrManager,
  onUpdated,
  onEditClick
}) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [reportNotes, setReportNotes] = useState(visit?.visitReportNotes || '');
  const [status, setStatus] = useState(visit?.visitStatus || 'scheduled');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !visit) return null;

  const leaderName = getEmployeeFullName(visit.leader);
  const mapUrl =
    visit.location?.lat && visit.location?.long
      ? `https://www.google.com/maps?q=${visit.location.lat},${visit.location.long}`
      : null;

  const handleUpdate = async (newStatus) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const targetStatus = newStatus || status;
      const res = await fieldVisitService.updateVisit(visit._id, {
        visitReportNotes: reportNotes.trim(),
        visitStatus: targetStatus
      });

      if (res.success) {
        setStatus(targetStatus);
        setSuccess(
          isAmharic
            ? 'የመስክ ጉዞ መረጃ በተሳካ ሁኔታ ተዘምኗል'
            : 'Field visit details updated successfully'
        );
        onUpdated(res.data);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'ማዘመን አልተሳካም' : 'Failed to update field visit')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {visit.visitPurpose}
                </h3>
                <StatusBadge status={status} />
              </div>
              <p className="text-xs text-slate-500">
                {isAmharic ? 'የመስክ ጉዞ ዝርዝር እና የፍተሻ ታሪክ' : 'Field assignment details & live check-in audit log'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLeaderOrManager && onEditClick && (
              <button
                type="button"
                onClick={() => onEditClick(visit)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#00ced1] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title={isAmharic ? 'መረጃ አሻሽል' : 'Edit Field Visit'}
              >
                <Edit3 className="w-3.5 h-3.5 text-[#00ced1]" />
                <span className="hidden sm:inline">{isAmharic ? 'አሻሽል (Edit)' : 'Edit'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Schedule & Location Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {visit.returnDate ? (isAmharic ? 'የጉዞ ቀናት' : 'Trip Dates') : (isAmharic ? 'ቀን' : 'Date')}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {new Date(visit.visitDate).toLocaleDateString()}
                  {visit.returnDate && ` – ${new Date(visit.returnDate).toLocaleDateString()}`}
                </span>
              </p>
              {visit.returnDate && (
                <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  {isAmharic ? 'የብዙ ቀናት ጉዞ' : 'Multi-Day'}
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {isAmharic ? 'የሰዓት ክልል' : 'Window'}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{visit.visitStartTime} – {visit.visitEndTime}</span>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {isAmharic ? 'የተፈቀደ ክልል' : 'Allowed Radius'}
              </span>
              <p className="text-xs font-black text-[#00ced1]">
                {visit.radiusMeters || 300} meters
              </p>
            </div>
          </div>

          {/* Destination Address & Map Link */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isAmharic ? 'የሳይት አድራሻ እና መጋጠሚያዎች' : 'Site Address & Target Coordinates'}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#00ced1] shrink-0" />
                <span>{visit.visitAddress}</span>
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {visit.location?.lat != null && visit.location?.long != null
                  ? `Lat: ${visit.location.lat}, Long: ${visit.location.long}`
                  : (isAmharic ? 'GPS መጋጠሚያ አልተወሰነም (አማራጭ)' : 'GPS coordinates: Optional (Not set)')}
              </p>
            </div>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#00ced1] text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
              >
                <span>{isAmharic ? 'ካርታ ክፈት' : 'Open Map'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Assigned Team & Leader */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAmharic ? 'የተመደበው ቡድን እና የመግቢያ ሁኔታ' : 'Assigned Team Members & Check-In Status'}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {(visit.checkIns || []).length} / {(visit.employees || []).length + (visit.leader ? 1 : 0)} {isAmharic ? 'ገብተዋል' : 'checked in'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Leader */}
              {visit.leader && (() => {
                const leaderCheckIn = (visit.checkIns || []).find((c) => {
                  const cEmpId = c.employee?._id || c.employee;
                  const lId = visit.leader?._id || visit.leader;
                  return cEmpId && lId && cEmpId.toString() === lId.toString();
                });

                return (
                  <div className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                        {getEmployeeInitial(visit.leader)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{leaderName}</p>
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            LEADER
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{visit.leader.jobTitle || 'Team Leader'}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {leaderCheckIn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isAmharic ? 'ገብቷል' : 'Checked In'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                          <span>{isAmharic ? 'አልገባም' : 'Pending'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Members */}
              {(visit.employees || []).map((emp) => {
                const memberCheckIn = (visit.checkIns || []).find((c) => {
                  const cEmpId = c.employee?._id || c.employee;
                  const eId = emp._id || emp;
                  return cEmpId && eId && cEmpId.toString() === eId.toString();
                });

                return (
                  <div key={emp._id || emp} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#00ced1]/15 text-[#00ced1] font-bold text-xs flex items-center justify-center shrink-0">
                        {getEmployeeInitial(emp)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{getEmployeeFullName(emp)}</p>
                        <p className="text-[10px] text-slate-500 truncate">{emp.jobTitle || 'Participant'}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {memberCheckIn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isAmharic ? 'ገብቷል' : 'Checked In'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                          <span>{isAmharic ? 'አልገባም' : 'Pending'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* On-Site Check-In Timeline / Log */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{isAmharic ? 'የቦታው መግቢያ ማረጋገጫ ታሪክ' : 'On-Site Verification Check-Ins'}</span>
              <span className="text-[11px] text-[#00ced1] font-bold">
                {visit.checkIns?.length || 0} {isAmharic ? 'መግባቶች' : 'check-ins'}
              </span>
            </span>

            {(!visit.checkIns || visit.checkIns.length === 0) ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                {isAmharic ? 'እስካሁን በቦታው የተመዘገበ መግቢያ የለም።' : 'No staff check-ins logged yet.'}
              </div>
            ) : (
              <div className="space-y-2">
                {visit.checkIns.map((c, i) => (
                  <div
                    key={c._id || i}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      {c.selfie ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                          <img src={c.selfie} alt="Selfie" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {getEmployeeFullName(c.employee)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {new Date(c.checkInTime).toLocaleTimeString()} • {c.distanceMeters !== undefined ? `${c.distanceMeters}m away` : 'On-site'}
                        </p>
                        {c.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">
                            "{c.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Field Visit Report Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAmharic ? 'የመስክ ጉዞ ሪፖርት እና ማጠቃለያ' : 'Mission Outcome & Field Report Notes'}
            </label>
            {isLeaderOrManager ? (
              <textarea
                rows={3}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder={
                  isAmharic
                    ? 'በመስክ ጉዞው የተከናወኑ ስራዎች፣ ውጤቶች ወይም ግኝቶችን ያክሉ...'
                    : 'Document findings, client feedback, delivered items, or survey measurements...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                {visit.visitReportNotes || (isAmharic ? 'ምንም ሪፖርት አልተመዘገበም' : 'No report notes submitted yet.')}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isAmharic ? 'ዝጋ' : 'Close'}
          </button>

          {isLeaderOrManager && (
            <div className="flex items-center gap-2">
              {status !== 'completed' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleUpdate('completed')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAmharic ? 'ጉዞውን አጠናቅቅ' : 'Complete Visit'}</span>
                </button>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={() => handleUpdate()}
                className="px-4 py-2.5 rounded-xl bg-[#00ced1] hover:brightness-95 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{saving ? (isAmharic ? 'በመመዝገብ ላይ...' : 'Saving...') : (isAmharic ? 'ሪፖርቱን መዝግብ' : 'Save Report')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
