import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { recruitmentService, employeeService } from '../../../services/hrService';

export default function ScheduleInterviewModal({ isOpen, onClose, application, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [interviewFormat, setInterviewFormat] = useState('in-person');
  const [scheduledDate, setScheduledDate] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('Vector Advert HQ, Main Meeting Room');
  const [onlineMeetingLink, setOnlineMeetingLink] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [employees, setEmployees] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set default scheduled date to tomorrow at 10:00 AM
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      tmrw.setHours(10, 0, 0, 0);
      setScheduledDate(tmrw.toISOString().slice(0, 16));

      // Fetch employees for interviewer selection
      const fetchStaff = async () => {
        try {
          const res = await employeeService.getEmployees({ limit: 100, status: 'active' });
          if (res.success) {
            setEmployees(res.data || []);
            if (res.data?.length > 0) {
              setInterviewer(res.data[0]._id);
            }
          }
        } catch (err) {
          console.error('Failed to fetch staff for interviewer selection', err);
        }
      };
      fetchStaff();
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !application) return null;

  const applicantFullName = [
    application.applicantName?.first,
    application.applicantName?.middle,
    application.applicantName?.last
  ]
    .filter(Boolean)
    .join(' ');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledDate) {
      setError(isAmharic ? 'እባክዎ የቃለ-መጠይቅ ቀን እና ሰዓት ይምረጡ' : 'Please choose an interview date and time');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        interviewFormat,
        scheduledDate: new Date(scheduledDate).toISOString(),
        interviewLocation: interviewFormat === 'in-person' ? interviewLocation : undefined,
        onlineMeetingLink: interviewFormat === 'online' ? onlineMeetingLink : undefined,
        interviewer: interviewer || undefined,
        interviewStatus: 'scheduled'
      };

      const res = await recruitmentService.scheduleInterview(application._id, payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to schedule interview');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error scheduling interview');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#152238]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isAmharic ? 'ቃለ-መጠይቅ መድቡ' : 'Schedule Interview'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {applicantFullName} • {application.jobPosting?.jobTitle || 'Candidate'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Format Radio Selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isAmharic ? 'የቃለ መጠይቅ ዓይነት' : 'Interview Format'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'in-person', label: isAmharic ? 'በአካል' : 'In-Person', icon: MapPin },
                { id: 'online', label: isAmharic ? 'በኦንላይን' : 'Online Video', icon: Video },
                { id: 'phone', label: isAmharic ? 'በስልክ' : 'Phone Call', icon: Phone }
              ].map((fmt) => {
                const Icon = fmt.icon;
                const active = interviewFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setInterviewFormat(fmt.id)}
                    className={`py-2.5 px-3 rounded-xl border flex flex-col items-center gap-1.5 font-bold transition-all cursor-pointer ${
                      active
                        ? 'border-[#00ced1] bg-[#00ced1]/10 text-[#00ced1]'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scheduled Date & Time */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAmharic ? 'የቃለ መጠይቅ ቀንና ሰዓት *' : 'Scheduled Date & Time *'}</span>
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Location or Meeting Link */}
          {interviewFormat === 'in-person' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'የስብሰባ ክፍል / ቦታ' : 'Interview Room / Location'}</span>
              </label>
              <input
                type="text"
                value={interviewLocation}
                onChange={(e) => setInterviewLocation(e.target.value)}
                placeholder="Vector Advert HQ, Main Meeting Room"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>
          )}

          {interviewFormat === 'online' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAmharic ? 'የቪዲዮ ጥሪ ሊንክ (Google Meet / Zoom)' : 'Online Meeting Link'}</span>
              </label>
              <input
                type="url"
                value={onlineMeetingLink}
                onChange={(e) => setOnlineMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xyz-abcd-efg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>
          )}

          {/* Assigned Interviewer */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAmharic ? 'ቃለ-መጠይቅ አድራጊ ሰራተኛ' : 'Assigned Interviewer'}</span>
            </label>
            <select
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            >
              <option value="">{isAmharic ? '-- ሰራተኛ ይምረጡ --' : '-- Select Interviewer --'}</option>
              {employees.map((emp) => {
                const name = [emp.name?.first, emp.name?.middle, emp.name?.last].filter(Boolean).join(' ');
                return (
                  <option key={emp._id} value={emp._id}>
                    {name} ({emp.jobTitle} • {emp.department})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white font-black shadow-lg shadow-[#00ced1]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isAmharic ? 'በመመደብ ላይ...' : 'Scheduling...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAmharic ? 'ቀጠሮውን አጽድቅ' : 'Confirm Interview'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
