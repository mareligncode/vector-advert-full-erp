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
  FileText,
  Save,
  Check
} from 'lucide-react';
import { fieldVisitService, employeeService } from '../../../services/hrService';
import { getEmployeeFullName } from '../../../utils/rbac';

export default function EditFieldVisitModal({ isOpen, onClose, visit, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [visitStartTime, setVisitStartTime] = useState('09:00');
  const [visitEndTime, setVisitEndTime] = useState('17:00');
  const [visitAddress, setVisitAddress] = useState('');
  const [lat, setLat] = useState('');
  const [long, setLong] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(300);

  const [leader, setLeader] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [visitStatus, setVisitStatus] = useState('scheduled');
  const [visitReportNotes, setVisitReportNotes] = useState('');

  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Prefill visit data when opened
  useEffect(() => {
    if (!isOpen || !visit) return;

    setVisitPurpose(visit.visitPurpose || '');
    if (visit.visitDate) {
      setVisitDate(new Date(visit.visitDate).toISOString().split('T')[0]);
    } else {
      setVisitDate('');
    }

    if (visit.returnDate) {
      setReturnDate(new Date(visit.returnDate).toISOString().split('T')[0]);
    } else {
      setReturnDate('');
    }

    setVisitStartTime(visit.visitStartTime || '09:00');
    setVisitEndTime(visit.visitEndTime || '17:00');
    setVisitAddress(visit.visitAddress || '');

    if (visit.location?.lat !== null && visit.location?.lat !== undefined) {
      setLat(String(visit.location.lat));
    } else {
      setLat('');
    }

    if (visit.location?.long !== null && visit.location?.long !== undefined) {
      setLong(String(visit.location.long));
    } else {
      setLong('');
    }

    setRadiusMeters(visit.radiusMeters || 300);
    setLeader(visit.leader?._id || visit.leader || '');

    const empIds = Array.isArray(visit.employees)
      ? visit.employees.map((e) => (typeof e === 'object' && e !== null ? e._id : e))
      : [];
    setSelectedEmployees(empIds);

    setVisitStatus(visit.visitStatus || 'scheduled');
    setVisitReportNotes(visit.visitReportNotes || '');
    setError('');
  }, [isOpen, visit]);

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
        visitStatus,
        visitReportNotes: visitReportNotes.trim()
      };

      const res = await fieldVisitService.updateVisit(visit._id, payload);
      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'የመስክ ጉዞ ማስተካከል አልተሳካም' : 'Failed to update field visit')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !visit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAmharic ? 'የመስክ ጉዞ መረጃ ማስተካከያ (HR Edit)' : 'Edit Field Visit Assignment'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAmharic
                  ? 'የጉዞ ቀናት፣ የመመለሻ ቀን፣ መዳረሻ እና ተሳታፊ ሰራተኞችን ያሻሽሉ'
                  : 'Update itinerary dates, multi-day return date, site details, and team'}
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
              placeholder="Visit purpose or mission title"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAmharic ? 'የጉዞው ሁኔታ (Status)' : 'Visit Status'}
              </label>
              <select
                value={visitStatus}
                onChange={(e) => setVisitStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1] cursor-pointer"
              >
                <option value="scheduled">{isAmharic ? 'የታቀደ (Scheduled)' : 'Scheduled'}</option>
                <option value="in_progress">{isAmharic ? 'በስራ ላይ (In Progress)' : 'In Progress'}</option>
                <option value="completed">{isAmharic ? 'የተጠናቀቀ (Completed)' : 'Completed'}</option>
                <option value="cancelled">{isAmharic ? 'የተሰረዘ (Cancelled)' : 'Cancelled'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAmharic ? 'የተፈቀደ የፍተሻ ክልል (ሜትር)' : 'Geofence Radius (Meters - Optional)'}
              </label>
              <input
                type="number"
                min="50"
                max="5000"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Math.max(50, parseInt(e.target.value, 10) || 300))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
              />
            </div>
          </div>

          {/* Dates: Departure Date & Return Date (Multi-Day) */}
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
                  {isAmharic ? 'መነሻ ቀን (Departure Date)' : 'Departure Date'} *
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
                  {isAmharic ? 'ጉዞው ከአንድ ቀን በላይ የሚፈጅ ከሆነ የመመለሻ ቀንን ያስገቡ።' : 'Specify return date if trip spans across multiple days.'}
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
              placeholder="e.g. Hawassa Industrial Park, Shed 4"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Site Geofence Coordinates (Optional) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#00ced1]" />
                <span>{isAmharic ? 'የሳይት GPS መጋጠሚያዎች (አማራጭ - Optional)' : 'GPS Target Geofence (Optional)'}</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>
            <p className="text-[10px] text-slate-400">
              {isAmharic
                ? 'የGPS መጋጠሚያ ባይኖርም የመስክ ጉዞውን ማስመዝገብ ይችላሉ።'
                : 'GPS coordinates are optional. Check-ins can proceed with or without location perimeter.'}
            </p>
          </div>

          {/* Team Leader Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAmharic ? 'የቡድን መሪ (Designated Team Leader)' : 'Designated Team Leader'}</span>
            </label>
            <select
              value={leader}
              onChange={(e) => setLeader(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00ced1] cursor-pointer"
            >
              <option value="">{isAmharic ? '-- የቡድን መሪ ይምረጡ --' : '-- Select Team Leader --'}</option>
              {allEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {getEmployeeFullName(emp)} ({emp.employeeNumber || 'ID'}) - {emp.jobTitle || 'Staff'}
                </option>
              ))}
            </select>
          </div>

          {/* Team Members Multi-Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#00ced1]" />
              <span>
                {isAmharic ? 'ተሳታፊ ሰራተኞች' : 'Participating Field Team Members'} ({selectedEmployees.length})
              </span>
            </label>

            {loadingEmployees ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {isAmharic ? 'ሰራተኞችን በመጫን ላይ...' : 'Loading staff...'}
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-2 space-y-1">
                {allEmployees.map((emp) => {
                  const isSelected = selectedEmployees.includes(emp._id);
                  const isLeaderEmp = leader === emp._id;
                  return (
                    <div
                      key={emp._id}
                      onClick={() => handleToggleEmployee(emp._id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#00ced1]/15 text-[#00ced1] font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            isSelected
                              ? 'bg-[#00ced1] border-[#00ced1] text-slate-950'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span>{getEmployeeFullName(emp)}</span>
                        {isLeaderEmp && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                            Leader
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {emp.employeeNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes / Report */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAmharic ? 'የስራ መመሪያዎች / የጉዞ ሪፖርት ማስታወሻ' : 'Mission Brief / Visit Report Notes'}</span>
            </label>
            <textarea
              rows={3}
              value={visitReportNotes}
              onChange={(e) => setVisitReportNotes(e.target.value)}
              placeholder="Enter instructions, notes, or field report outcomes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>
                {submitting
                  ? t('common.saving')
                  : isAmharic
                  ? 'ለውጦችን መዝግብ'
                  : 'Save Changes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
