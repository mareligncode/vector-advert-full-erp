import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Clock,
  MapPin,
  Camera,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Shield,
  LocateFixed,
  Zap,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { attendanceService } from '../../../services/hrService';

export default function AttendanceConfigTab({ initialConfig, onConfigUpdated }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [morningStart, setMorningStart] = useState('08:30');
  const [morningEnd, setMorningEnd] = useState('12:30');
  const [lunchStart, setLunchStart] = useState('12:30');
  const [lunchEnd, setLunchEnd] = useState('13:30');
  const [afternoonStart, setAfternoonStart] = useState('13:30');
  const [afternoonEnd, setAfternoonEnd] = useState('17:30');

  const [isSelfieRequired, setIsSelfieRequired] = useState(true);
  const [isLocationRequired, setIsLocationRequired] = useState(true);
  const [autoOvertimeAllow, setAutoOvertimeAllow] = useState(false);
  const [lateAllowedMinutes, setLateAllowedMinutes] = useState(15);
  const [earlyLeaveAllowedMinutes, setEarlyLeaveAllowedMinutes] = useState(15);
  const [maxAllowedDistanceMeters, setMaxAllowedDistanceMeters] = useState(200);

  const [offices, setOffices] = useState([]);

  // New Office Card Form State
  const [isAddingOffice, setIsAddingOffice] = useState(false);
  const [newOffice, setNewOffice] = useState({
    officeName: '',
    address: '',
    lat: '',
    long: '',
    radiusMeters: 200
  });

  // Edit Office Card Form State
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingOffice, setEditingOffice] = useState({
    officeName: '',
    address: '',
    lat: '',
    long: '',
    radiusMeters: 200
  });

  useEffect(() => {
    if (initialConfig) {
      setMorningStart(initialConfig.morningTime?.startTime || '08:30');
      setMorningEnd(initialConfig.morningTime?.endTime || '12:30');
      setLunchStart(initialConfig.lunchTime?.startTime || initialConfig.morningTime?.endTime || '12:30');
      setLunchEnd(initialConfig.lunchTime?.endTime || initialConfig.afternoonTime?.startTime || '13:30');
      setAfternoonStart(initialConfig.afternoonTime?.startTime || '13:30');
      setAfternoonEnd(initialConfig.afternoonTime?.endTime || '17:30');

      setIsSelfieRequired(initialConfig.isSelfieRequired ?? true);
      setIsLocationRequired(initialConfig.isLocationRequired ?? true);
      setAutoOvertimeAllow(initialConfig.autoOvertimeAllow ?? false);
      setLateAllowedMinutes(initialConfig.lateAllowedMinutes ?? 15);
      setEarlyLeaveAllowedMinutes(initialConfig.earlyLeaveAllowedMinutes ?? 15);
      setMaxAllowedDistanceMeters(initialConfig.maxAllowedDistanceMeters ?? 200);

      setOffices(
        (initialConfig.locationReferences || []).map((loc) => ({
          _id: loc._id,
          officeName: loc.officeName,
          address: loc.address || '',
          lat: loc.location?.lat || 0,
          long: loc.location?.long || 0,
          radiusMeters: loc.radiusMeters || 200
        }))
      );
    }
  }, [initialConfig]);

  // Use browser GPS to auto-populate office coordinates
  const handleUseCurrentGpsForOffice = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewOffice((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(6)),
          long: Number(pos.coords.longitude.toFixed(6))
        }));
      },
      (err) => {
        alert(`Failed to acquire GPS: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleAddOffice = () => {
    if (!newOffice.officeName.trim() || !newOffice.lat || !newOffice.long) {
      setError('Please provide office name and valid GPS coordinates (latitude & longitude)');
      return;
    }

    setOffices([
      ...offices,
      {
        officeName: newOffice.officeName.trim(),
        address: newOffice.address.trim(),
        lat: Number(newOffice.lat),
        long: Number(newOffice.long),
        radiusMeters: Number(newOffice.radiusMeters) || 200
      }
    ]);

    setNewOffice({
      officeName: '',
      address: '',
      lat: '',
      long: '',
      radiusMeters: 200
    });
    setIsAddingOffice(false);
    setError('');
  };

  const handleRemoveOffice = (index) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    }
    setOffices(offices.filter((_, idx) => idx !== index));
  };

  const handleStartEditOffice = (index) => {
    const target = offices[index];
    if (!target) return;
    setEditingIndex(index);
    setEditingOffice({
      officeName: target.officeName || '',
      address: target.address || '',
      lat: target.lat !== undefined ? target.lat : '',
      long: target.long !== undefined ? target.long : '',
      radiusMeters: target.radiusMeters || 200
    });
    setIsAddingOffice(false);
  };

  const handleCancelEditOffice = () => {
    setEditingIndex(null);
    setEditingOffice({
      officeName: '',
      address: '',
      lat: '',
      long: '',
      radiusMeters: 200
    });
  };

  const handleUseCurrentGpsForEdit = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditingOffice((prev) => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(6)),
          long: Number(pos.coords.longitude.toFixed(6))
        }));
      },
      (err) => {
        alert(`Failed to acquire GPS: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveEditOffice = () => {
    if (!editingOffice.officeName.trim() || editingOffice.lat === '' || editingOffice.long === '') {
      setError('Please provide office name and valid GPS coordinates (latitude & longitude)');
      return;
    }

    const updated = [...offices];
    updated[editingIndex] = {
      ...updated[editingIndex],
      officeName: editingOffice.officeName.trim(),
      address: editingOffice.address.trim(),
      lat: Number(editingOffice.lat),
      long: Number(editingOffice.long),
      radiusMeters: Number(editingOffice.radiusMeters) || 200
    };

    setOffices(updated);
    setEditingIndex(null);
    setError('');
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const payload = {
        morningTime: { startTime: morningStart, endTime: morningEnd },
        lunchTime: { startTime: lunchStart, endTime: lunchEnd },
        afternoonTime: { startTime: afternoonStart, endTime: afternoonEnd },
        isSelfieRequired,
        isLocationRequired,
        autoOvertimeAllow,
        lateAllowedMinutes: Number(lateAllowedMinutes),
        earlyLeaveAllowedMinutes: Number(earlyLeaveAllowedMinutes),
        maxAllowedDistanceMeters: Number(maxAllowedDistanceMeters),
        locationReferences: offices.map((o) => ({
          officeName: o.officeName,
          address: o.address,
          location: { lat: Number(o.lat), long: Number(o.long) },
          radiusMeters: Number(o.radiusMeters) || 200
        }))
      };

      const res = await attendanceService.updateConfig(payload);
      if (res.success) {
        setMessage(t('hrPages.attendance.configSavedSuccess'));
        onConfigUpdated?.(res.data);
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSaveConfig} className="space-y-6">
      {/* Header Notice */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Shifts & Timings Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t('hrPages.attendance.shiftTimings')}
            </h3>
            <p className="text-xs text-slate-500">Configure standard operating hours for morning and afternoon shifts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Morning Shift */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00ced1]" />
                <span>{t('hrPages.attendance.morningShift')}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Shift 1</span>
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Morning Entrance (Clock In)
                </label>
                <input
                  type="time"
                  value={morningStart}
                  onChange={(e) => setMorningStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Morning Exit / Lunch Break
                </label>
                <input
                  type="time"
                  value={morningEnd}
                  onChange={(e) => {
                    setMorningEnd(e.target.value);
                    setLunchStart(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
            </div>
          </div>

          {/* Lunch Break Window */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>{t('hrPages.attendance.lunchBreakTitle')}</span>
              </span>
              <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">Break Window</span>
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.lunchStartTime')}
                </label>
                <input
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.lunchEndTime')}
                </label>
                <input
                  type="time"
                  value={lunchEnd}
                  onChange={(e) => {
                    setLunchEnd(e.target.value);
                    setAfternoonStart(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
            </div>
          </div>

          {/* Afternoon Shift */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                <span>{t('hrPages.attendance.afternoonShift')}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Shift 2</span>
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Afternoon Entrance (Return)
                </label>
                <input
                  type="time"
                  value={afternoonStart}
                  onChange={(e) => setAfternoonStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Day Departure (Clock Out)
                </label>
                <input
                  type="time"
                  value={afternoonEnd}
                  onChange={(e) => setAfternoonEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policies & Verification Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t('hrPages.attendance.policiesTitle')}
            </h3>
            <p className="text-xs text-slate-500">Security enforcement and automated calculations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Selfie Policy Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {t('hrPages.attendance.reqSelfie')}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {t('hrPages.attendance.reqSelfieDesc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSelfieRequired}
                onChange={(e) => setIsSelfieRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ced1]"></div>
            </label>
          </div>

          {/* GPS Location Geofence Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {t('hrPages.attendance.reqGps')}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {t('hrPages.attendance.reqGpsDesc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isLocationRequired}
                onChange={(e) => setIsLocationRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ced1]"></div>
            </label>
          </div>

          {/* Auto Overtime Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {t('hrPages.attendance.autoOvertime')}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {t('hrPages.attendance.autoOvertimeDesc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoOvertimeAllow}
                onChange={(e) => setAutoOvertimeAllow(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ced1]"></div>
            </label>
          </div>
        </div>

        {/* Grace Period & Default Max Distance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('hrPages.attendance.gracePeriod')}
            </label>
            <input
              type="number"
              min="0"
              value={lateAllowedMinutes}
              onChange={(e) => setLateAllowedMinutes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('hrPages.attendance.earlyLeaveBuffer')}
            </label>
            <input
              type="number"
              min="0"
              value={earlyLeaveAllowedMinutes}
              onChange={(e) => setEarlyLeaveAllowedMinutes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('hrPages.attendance.maxDistance')}
            </label>
            <input
              type="number"
              min="50"
              value={maxAllowedDistanceMeters}
              onChange={(e) => setMaxAllowedDistanceMeters(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
            />
          </div>
        </div>
      </div>

      {/* Office Locations & Geofences Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('hrPages.attendance.officesTitle')}
              </h3>
              <p className="text-xs text-slate-500">Add physical offices, branches, and GPS boundaries</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingOffice(!isAddingOffice)}
            className="py-2 px-3.5 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('hrPages.attendance.addOffice')}</span>
          </button>
        </div>

        {/* New Office Collapsible Form */}
        {isAddingOffice && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {t('hrPages.attendance.addOffice')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.officeName')} *
                </label>
                <input
                  type="text"
                  value={newOffice.officeName}
                  onChange={(e) => setNewOffice({ ...newOffice, officeName: e.target.value })}
                  placeholder="e.g. Headquarters - Addis Ababa"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.officeAddress')}
                </label>
                <input
                  type="text"
                  value={newOffice.address}
                  onChange={(e) => setNewOffice({ ...newOffice, address: e.target.value })}
                  placeholder="e.g. Bole Road, Vector Tower"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-500">
                    {t('hrPages.attendance.latitude')} *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentGpsForOffice}
                    className="text-[10px] text-[#00ced1] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <LocateFixed className="w-3 h-3" />
                    <span>{t('hrPages.attendance.useCurrentLocation')}</span>
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  value={newOffice.lat}
                  onChange={(e) => setNewOffice({ ...newOffice, lat: e.target.value })}
                  placeholder="e.g. 9.005401"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.longitude')} *
                </label>
                <input
                  type="number"
                  step="any"
                  value={newOffice.long}
                  onChange={(e) => setNewOffice({ ...newOffice, long: e.target.value })}
                  placeholder="e.g. 38.784015"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {t('hrPages.attendance.radius')}
                </label>
                <input
                  type="number"
                  value={newOffice.radiusMeters}
                  onChange={(e) => setNewOffice({ ...newOffice, radiusMeters: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingOffice(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleAddOffice}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 cursor-pointer"
              >
                Add Office
              </button>
            </div>
          </div>
        )}

        {/* Registered Offices Grid */}
        {offices.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Building className="w-8 h-8 text-slate-400 mx-auto opacity-40" />
            <p className="text-xs text-slate-500 font-medium">
              {t('hrPages.attendance.noOffices')}
            </p>
            <button
              type="button"
              onClick={() => setIsAddingOffice(true)}
              className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-[#00ced1]/10 text-[#00ced1] hover:bg-[#00ced1]/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('hrPages.attendance.addOffice')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offices.map((office, idx) => {
              const isEditing = editingIndex === idx;

              if (isEditing) {
                return (
                  <div
                    key={idx}
                    className="col-span-1 md:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-[#070b12] border-2 border-[#00ced1]/60 space-y-4 shadow-sm animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-[#00ced1]" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('hrPages.attendance.editOffice')}: <span className="text-[#00ced1]">{office.officeName}</span>
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelEditOffice}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {t('hrPages.attendance.officeName')} *
                        </label>
                        <input
                          type="text"
                          value={editingOffice.officeName}
                          onChange={(e) => setEditingOffice({ ...editingOffice, officeName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {t('hrPages.attendance.officeAddress')}
                        </label>
                        <input
                          type="text"
                          value={editingOffice.address}
                          onChange={(e) => setEditingOffice({ ...editingOffice, address: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-500">
                            {t('hrPages.attendance.latitude')} *
                          </label>
                          <button
                            type="button"
                            onClick={handleUseCurrentGpsForEdit}
                            className="text-[10px] text-[#00ced1] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <LocateFixed className="w-3 h-3" />
                            <span>{t('hrPages.attendance.useCurrentLocation')}</span>
                          </button>
                        </div>
                        <input
                          type="number"
                          step="any"
                          value={editingOffice.lat}
                          onChange={(e) => setEditingOffice({ ...editingOffice, lat: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {t('hrPages.attendance.longitude')} *
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editingOffice.long}
                          onChange={(e) => setEditingOffice({ ...editingOffice, long: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          {t('hrPages.attendance.radius')}
                        </label>
                        <input
                          type="number"
                          value={editingOffice.radiusMeters}
                          onChange={(e) => setEditingOffice({ ...editingOffice, radiusMeters: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handleCancelEditOffice}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditOffice}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('hrPages.attendance.applyChanges')}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between gap-3 group hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {office.officeName}
                      </h5>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#00ced1]/10 text-[#00ced1] shrink-0 font-mono">
                        {office.radiusMeters}m
                      </span>
                    </div>
                    {office.address && (
                      <p className="text-[11px] text-slate-500 truncate">{office.address}</p>
                    )}
                    <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-400">
                      <span>GPS: {office.lat}, {office.long}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditOffice(idx)}
                      className="p-1.5 rounded-xl hover:bg-[#00ced1]/15 text-slate-400 hover:text-[#00ced1] transition-colors cursor-pointer"
                      title={t('hrPages.attendance.editOffice')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveOffice(idx)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove Office"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="py-3 px-8 rounded-2xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? t('common.saving') : t('hrPages.attendance.saveConfig')}</span>
        </button>
      </div>
    </form>
  );
}
