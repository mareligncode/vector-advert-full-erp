import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Users,
  LocateFixed,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Shield,
  FileText
} from 'lucide-react';
import { fieldVisitService, employeeService } from '../../../services/hrService';
import { getEmployeeFullName } from '../../../utils/rbac';

export default function CreateFieldVisitModal({ isOpen, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [visitStartTime, setVisitStartTime] = useState('09:00');
  const [visitEndTime, setVisitEndTime] = useState('17:00');
  const [visitAddress, setVisitAddress] = useState('');
  const [lat, setLat] = useState('');
  const [long, setLong] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(300);

  const [leader, setLeader] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [visitReportNotes, setVisitReportNotes] = useState('');

  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch employees for assignment
  useEffect(() => {
    if (!isOpen) return;
    const fetchStaff = async () => {
      try {
        setLoadingEmployees(true);
        const res = await employeeService.getEmployees({ limit: 100, status: 'active' });
        if (res.success) {
          setAllEmployees(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load employees for field visit assignment:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchStaff();
  }, [isOpen]);

  // Use browser GPS for site coordinates
  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      setError(
        isAmharic
          ? 'የአካባቢ መገኛ (Geolocation) በአሳሽዎ አይደገፍም'
          : 'Geolocation is not supported by your browser'
      );
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLong(pos.coords.longitude.toFixed(6));
        setGettingGps(false);
      },
      (err) => {
        console.error(err);
        setError(
          isAmharic
            ? 'የአሁኑን የGPS መገኛ ማግኘት አልተቻለም፡ እባክዎ የአካባቢ ፈቃድ ይስጡ።'
            : 'Could not acquire current GPS location. Please allow location permissions.'
        );
        setGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleToggleEmployee = (empId) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!visitPurpose.trim() || !visitDate || !visitStartTime || !visitEndTime || !visitAddress.trim()) {
      setError(
        isAmharic
          ? 'እባክዎ ሁሉንም አስፈላጊ ክፍሎች ይሙሉ'
          : 'Please fill in all required fields'
      );
      return;
    }

    if (returnDate && new Date(returnDate) < new Date(visitDate)) {
      setError(
        isAmharic
          ? 'የመመለሻ ቀን ከመነሻ ቀን በፊት ሊሆን አይችልም'
          : 'Return date cannot be earlier than departure date'
      );
      return;
    }

    let locationPayload = null;
    const numLat = parseFloat(lat);
    const numLong = parseFloat(long);
    if (!isNaN(numLat) && !isNaN(numLong)) {
      locationPayload = {
        lat: numLat,
        long: numLong
      };
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        visitPurpose: visitPurpose.trim(),
        visitDate,
        returnDate: returnDate ? returnDate : null,
        visitStartTime,
        visitEndTime,
        visitAddress: visitAddress.trim(),
        location: locationPayload,
        radiusMeters: Number(radiusMeters) || 300,
        leader: leader || null,
        employees: selectedEmployees,
        visitReportNotes: visitReportNotes.trim()
      };

      const res = await fieldVisitService.createVisit(payload);
      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'የመስክ ጉዞ መመደብ አልተሳካም' : 'Failed to create field visit assignment')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAmharic ? 'አዲስ የመስክ ጉዞ መድብ' : 'Schedule Field Visit Assignment'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAmharic
                  ? 'የደንበኛ ስብሰባ፣ የሳይት ፍተሻ ወይም የውጭ ስራ መድቡ'
                  : 'Assign team, site location coordinates, and geofence perimeter'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Purpose */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'የመስክ ጉዞ ዓላማ / የስራ ርዕስ' : 'Visit Purpose / Assignment Title'}
            </label>
            <input
              type="text"
              value={visitPurpose}
              onChange={(e) => setVisitPurpose(e.target.value)}
              placeholder={
                isAmharic
                  ? 'ምሳሌ፡ የደንበኛ ማስታወቂያ ሰሌዳ ቦታ ፍተሻ (Site Inspection)...'
                  : 'e.g. Client billboard site inspection & measurements...'
              }
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Itinerary Dates: Departure Date & Multi-day Return Date */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isAmharic ? 'የጉዞ ቀናት (ከአንድ ቀን በላይ ለሚፈጁ ጉዞዎች)' : 'Trip Itinerary & Multi-Day Dates'}</span>
              </span>
              {returnDate && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  {isAmharic ? 'የብዙ ቀናት ጉዞ' : 'Multi-Day Mission'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAmharic ? 'የመነሻ ቀን (Departure Date)' : 'Departure Date'} *
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAmharic ? 'የመመለሻ ቀን (Return Date - አማራጭ)' : 'Return Date (Optional - Multi-day)'}
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={visitDate}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAmharic ? 'ጉዞው ከአንድ ቀን በላይ የሚፈጅ ከሆነ የመመለሻ ቀንን ያስገቡ።' : 'Specify if field trip takes more than 1 day.'}
                </p>
              </div>
            </div>

            {/* Shift Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-indigo-100 dark:border-indigo-900/30">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAmharic ? 'መጀመሪያ ሰዓት (Start Time)' : 'Daily Start Time'} *
                </label>
                <input
                  type="time"
                  value={visitStartTime}
                  onChange={(e) => setVisitStartTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAmharic ? 'ማብቂያ ሰዓት (End Time)' : 'Daily End Time'} *
                </label>
                <input
                  type="time"
                  value={visitEndTime}
                  onChange={(e) => setVisitEndTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>
            </div>
          </div>

          {/* Address & Destination Site */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'የሳይት አድራሻ / የመድረሻ ቦታ' : 'Destination Site Address'} *
            </label>
            <input
              type="text"
              value={visitAddress}
              onChange={(e) => setVisitAddress(e.target.value)}
              placeholder={
                isAmharic
                  ? 'ምሳሌ፡ ቦሌ መንገድ፣ ፍሬንድሺፕ ህንፃ ፊት ለፊት...'
                  : 'e.g. Bole Road, in front of Friendship Business Center...'
              }
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Site Geofence Coordinates (Optional) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#00ced1]" />
                <span>{isAmharic ? 'የቦታው GPS መጋጠሚያዎች (አማራጭ - Optional)' : 'GPS Target Geofence (Optional)'}</span>
              </span>
              <button
                type="button"
                onClick={handleUseCurrentGps}
                disabled={gettingGps}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#00ced1]/15 text-[#00ced1] hover:bg-[#00ced1]/25 flex items-center gap-1 transition-all cursor-pointer"
              >
                <LocateFixed className={`w-3 h-3 ${gettingGps ? 'animate-spin' : ''}`} />
                <span>{gettingGps ? (isAmharic ? 'በመውሰድ ላይ...' : 'Acquiring...') : (isAmharic ? 'የአሁኑን GPS ተጠቀም' : 'Use Current GPS')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Latitude (ላቲትዩድ - አማራጭ)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 9.012345 (Optional)"
                  className="w-full px-3 py-1.5 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Longitude (ሎንጊትዩድ - አማራጭ)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={long}
                  onChange={(e) => setLong(e.target.value)}
                  placeholder="e.g. 38.754321 (Optional)"
                  className="w-full px-3 py-1.5 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isAmharic ? 'የተፈቀደ ክልል (ሜትር)' : 'Allowed Radius (Meters)'}
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10) || 300)}
                  className="w-full px-3 py-1.5 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              {isAmharic
                ? 'የGPS መጋጠሚያ ካልተሞላ ሰራተኞች ያለ ርቀት ገደብ መግቢያቸውን ማረጋገጥ ይችላሉ።'
                : 'GPS coordinates are optional. If blank, check-in can be recorded anywhere.'}
            </p>
          </div>

          {/* Team Leader Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'የቡድን መሪ (Team Leader)' : 'Designated Team Leader'}
            </label>
            <select
              value={leader}
              onChange={(e) => setLeader(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            >
              <option value="">{isAmharic ? '-- የቡድን መሪ ይምረጡ --' : '-- Select Team Leader --'}</option>
              {allEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {getEmployeeFullName(emp)} ({emp.jobTitle || 'Staff'} • {emp.department || 'Operations'})
                </option>
              ))}
            </select>
          </div>

          {/* Participating Employees Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{isAmharic ? 'ተሳታፊ ሰራተኞች (Participating Staff)' : 'Assigned Team Members'}</span>
              <span className="text-[11px] text-[#00ced1] font-bold">
                {selectedEmployees.length} {isAmharic ? 'ተመርጠዋል' : 'selected'}
              </span>
            </label>
            <div className="max-h-36 overflow-y-auto p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
              {loadingEmployees ? (
                <p className="text-xs text-slate-400 text-center py-4">{t('common.loading')}</p>
              ) : allEmployees.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No employees available</p>
              ) : (
                allEmployees.map((emp) => {
                  const isChecked = selectedEmployees.includes(emp._id);
                  const isLeaderItem = leader === emp._id;
                  return (
                    <label
                      key={emp._id}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[#00ced1]/10 text-slate-900 dark:text-white font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEmployee(emp._id)}
                          className="w-4 h-4 rounded-md accent-[#00ced1] cursor-pointer"
                        />
                        <span>{getEmployeeFullName(emp)}</span>
                        {isLeaderItem && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            LEADER
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {emp.department || 'Operations'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Initial Briefing / Report Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'የስራ መመሪያ እና ማስታወሻ' : 'Briefing Instructions & Mission Scope'}
            </label>
            <textarea
              rows={2}
              value={visitReportNotes}
              onChange={(e) => setVisitReportNotes(e.target.value)}
              placeholder={
                isAmharic
                  ? 'ለቡድኑ የተሰጠ የስራ መመሪያ ወይም የሚሰበሰቡ መረጃዎችን ይግለጹ...'
                  : 'Specify instructions, client contact persons, deliverables, or checklist...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#00ced1] hover:brightness-95 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {submitting
                  ? isAmharic ? 'በመመዝገብ ላይ...' : 'Scheduling...'
                  : isAmharic ? 'የመስክ ጉዞውን መድብ' : 'Schedule Field Visit'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
