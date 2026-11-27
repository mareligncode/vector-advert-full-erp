import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Zap,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  FileText,
  LogOut,
  LogIn,
  CheckCheck
} from 'lucide-react';
import { attendanceService } from '../../../services/hrService';
import CameraCaptureModal from './CameraCaptureModal';
import StatusBadge from '../StatusBadge';

/**
 * Haversine formula to compute distance in meters between two lat/long points
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export default function TodayPunchTab({ config, todayLog, onAttendanceChanged }) {
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Geolocation
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoAccuracy, setGeoAccuracy] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  // Camera & Selfie
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [pendingPunch, setPendingPunch] = useState(null); // { type: 'check-in' | 'check-out', shift: string }

  // Selected Shift (defaults to 'auto' based on hour)
  const [shiftMode, setShiftMode] = useState('auto'); // 'auto' | 'morning' | 'afternoon'

  // Punch Submission State
  const [punching, setPunching] = useState(false);
  const [punchNotes, setPunchNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Live Clock updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current active shift
  const effectiveShift = useMemo(() => {
    if (shiftMode !== 'auto') return shiftMode;
    return currentTime.getHours() < 13 ? 'morning' : 'afternoon';
  }, [shiftMode, currentTime]);

  // Request browser geolocation
  const getBrowserLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(t('hrPages.attendance.geoUnsupported'));
      return;
    }
    setGettingLocation(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({
          lat: pos.coords.latitude,
          long: pos.coords.longitude
        });
        setGeoAccuracy(pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null);
        setGeoError('');
        setGettingLocation(false);
      },
      (err) => {
        setGeoError(t('hrPages.attendance.geoError', { msg: err.message }));
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    getBrowserLocation();
  }, []);

  // Proximity to configured office locations
  const proximityInfo = useMemo(() => {
    if (!geoCoords || !config?.locationReferences?.length) {
      return { isInside: false, nearestOffice: null, distance: null };
    }

    let nearestOffice = null;
    let minDistance = Infinity;

    config.locationReferences.forEach((office) => {
      if (office.location?.lat && office.location?.long) {
        const dist = calculateDistanceMeters(
          geoCoords.lat,
          geoCoords.long,
          office.location.lat,
          office.location.long
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestOffice = office;
        }
      }
    });

    if (!nearestOffice) {
      return { isInside: false, nearestOffice: null, distance: null };
    }

    const allowedRadius = nearestOffice.radiusMeters || config.maxAllowedDistanceMeters || 200;
    const isInside = minDistance <= allowedRadius;

    return {
      isInside,
      nearestOffice,
      distance: minDistance,
      allowedRadius
    };
  }, [geoCoords, config]);

  // Handle Selfie Captured (auto-submits if triggered from a pending punch action!)
  const handleCaptureSelfie = ({ dataUrl, file }) => {
    setSelfiePreview(dataUrl);
    setSelfieFile(file);
    setMessage(t('hrPages.attendance.selfieCaptured'));
    setTimeout(() => setMessage(''), 3000);

    // If there was a pending punch waiting for selfie, auto-execute it!
    if (pendingPunch) {
      const { type, shift } = pendingPunch;
      setPendingPunch(null);
      executePunch(type, shift, file);
    }
  };

  // Perform Check In / Check Out core API call
  const executePunch = async (punchType, shiftTarget, fileToUse = selfieFile) => {
    try {
      setPunching(true);
      setError('');
      setMessage('');

      const formData = new FormData();
      formData.append('shift', shiftTarget);

      if (geoCoords) {
        formData.append('lat', geoCoords.lat);
        formData.append('long', geoCoords.long);
      }

      if (fileToUse) {
        formData.append('selfie', fileToUse);
      }

      if (punchNotes.trim()) {
        formData.append('notes', punchNotes.trim());
      }

      const res =
        punchType === 'check-in'
          ? await attendanceService.checkIn(formData)
          : await attendanceService.checkOut(formData);

      if (res.success) {
        const defaultMsg =
          punchType === 'check-in'
            ? t('hrPages.attendance.checkInSuccess')
            : t('hrPages.attendance.checkOutSuccess');
        setMessage(res.message || defaultMsg);
        setSelfiePreview(null);
        setSelfieFile(null);
        setPunchNotes('');
        onAttendanceChanged?.();
      }
    } catch (err) {
      console.error('Punch failed:', err);
      setError(err.response?.data?.message || t('hrPages.attendance.punchFailed', { type: punchType }));
    } finally {
      setPunching(false);
    }
  };

  // Primary Punch Handler with Selfie Check
  const handlePunch = (punchType, shiftTarget = effectiveShift) => {
    // If selfie is required and not yet captured, open camera modal and remember action
    if (config?.isSelfieRequired && !selfieFile) {
      setPendingPunch({ type: punchType, shift: shiftTarget });
      setIsCameraModalOpen(true);
      return;
    }

    executePunch(punchType, shiftTarget, selfieFile);
  };

  // Shift status calculations
  const morningCheck = todayLog?.morningCheck;
  const afternoonCheck = todayLog?.afternoonCheck;

  // Active Clock-In status
  const isMorningClockedIn = Boolean(morningCheck?.checkIn?.time && !morningCheck?.checkOut?.time);
  const isAfternoonClockedIn = Boolean(afternoonCheck?.checkIn?.time && !afternoonCheck?.checkOut?.time);
  const isCurrentlyClockedIn = isMorningClockedIn || isAfternoonClockedIn;
  const activeShift = isAfternoonClockedIn ? 'afternoon' : isMorningClockedIn ? 'morning' : null;
  const activeCheckInTime = isAfternoonClockedIn
    ? afternoonCheck?.checkIn?.time
    : isMorningClockedIn
    ? morningCheck?.checkIn?.time
    : null;

  const isMorningDone = Boolean(morningCheck?.checkIn?.time && morningCheck?.checkOut?.time);
  const isAfternoonDone = Boolean(afternoonCheck?.checkIn?.time && afternoonCheck?.checkOut?.time);
  const isAllDone = isMorningDone && isAfternoonDone;

  // Schedule settings
  const morningStartTime = config?.morningTime?.startTime || '08:30';
  const morningEndTime = config?.morningTime?.endTime || '12:30';
  const lunchStartTime = config?.lunchTime?.startTime || config?.morningTime?.endTime || '12:30';
  const lunchEndTime = config?.lunchTime?.endTime || config?.afternoonTime?.startTime || '13:30';
  const afternoonStartTime = config?.afternoonTime?.startTime || '13:30';
  const afternoonEndTime = config?.afternoonTime?.endTime || '17:30';
  const lateGrace = config?.lateAllowedMinutes ?? 15;
  const earlyGrace = config?.earlyLeaveAllowedMinutes ?? 15;

  // Real-time calculation of timing status
  const timingStatus = useMemo(() => {
    const curMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    const [mStartH, mStartM] = morningStartTime.split(':').map(Number);
    const mStartTotal = mStartH * 60 + (mStartM || 0);

    const [lStartH, lStartM] = lunchStartTime.split(':').map(Number);
    const lStartTotal = lStartH * 60 + (lStartM || 0);

    const [lEndH, lEndM] = lunchEndTime.split(':').map(Number);
    const lEndTotal = lEndH * 60 + (lEndM || 0);

    const [aStartH, aStartM] = afternoonStartTime.split(':').map(Number);
    const aStartTotal = aStartH * 60 + (aStartM || 0);

    const [aEndH, aEndM] = afternoonEndTime.split(':').map(Number);
    const aEndTotal = aEndH * 60 + (aEndM || 0);

    const isLunchTime = curMinutes >= lStartTotal && curMinutes < lEndTotal;

    let morningLateMins = 0;
    if (curMinutes > mStartTotal + lateGrace && curMinutes < lStartTotal) {
      morningLateMins = curMinutes - mStartTotal;
    }

    let afternoonLateMins = 0;
    if (curMinutes > aStartTotal + lateGrace && curMinutes < aEndTotal) {
      afternoonLateMins = curMinutes - aStartTotal;
    }

    const isEarlyMorningLeave = curMinutes < lStartTotal - earlyGrace;
    const isEarlyAfternoonLeave = curMinutes < aEndTotal - earlyGrace;
    const isOvertimeNow = curMinutes >= aEndTotal + 30;

    return {
      isLunchTime,
      morningLateMins,
      afternoonLateMins,
      isEarlyMorningLeave,
      isEarlyAfternoonLeave,
      isOvertimeNow
    };
  }, [currentTime, morningStartTime, morningEndTime, lunchStartTime, lunchEndTime, afternoonStartTime, afternoonEndTime, lateGrace, earlyGrace]);

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* PROMINENT LIVE CLOCK-IN / CLOCK-OUT HERO BANNER */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-5 ${
          isCurrentlyClockedIn
            ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-emerald-950/20 border-emerald-500/40 text-white'
            : isAllDone
            ? 'bg-gradient-to-r from-cyan-950/30 via-slate-900 to-slate-900 border-cyan-500/30 text-white'
            : 'bg-white dark:bg-[#0e1626] border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white'
        }`}
      >
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold shadow-inner ${
              isCurrentlyClockedIn
                ? 'bg-emerald-500 shadow-emerald-500/30 animate-pulse'
                : isAllDone
                ? 'bg-[#00ced1]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isCurrentlyClockedIn ? (
              <Clock className="w-7 h-7" />
            ) : isAllDone ? (
              <CheckCheck className="w-7 h-7 text-slate-950" />
            ) : (
              <LogIn className="w-7 h-7 text-[#00ced1]" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCurrentlyClockedIn
                    ? 'bg-emerald-400 animate-ping'
                    : isAllDone
                    ? 'bg-cyan-400'
                    : 'bg-amber-400'
                }`}
              />
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isCurrentlyClockedIn
                  ? t('hrPages.attendance.currentlyClockedIn')
                  : isAllDone
                  ? t('hrPages.attendance.allShiftsDone')
                  : 'Ready to Record Attendance'}
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isCurrentlyClockedIn ? (
                <>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                    {activeShift} Shift
                  </span>
                  <span> • {t('hrPages.attendance.clockedInSince', { time: new Date(activeCheckInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}</span>
                </>
              ) : isMorningDone && !afternoonCheck?.checkIn?.time ? (
                <span>Morning shift checked out. Afternoon shift is ready for check-in.</span>
              ) : isAllDone ? (
                <span>You have successfully logged all shifts today. Have a great evening!</span>
              ) : (
                <span>You have not clocked in for {effectiveShift} shift today.</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Button: CLOCK OUT NOW or CLOCK IN NOW */}
        <div className="w-full md:w-auto flex items-center gap-3">
          {isCurrentlyClockedIn ? (
            <button
              type="button"
              onClick={() => handlePunch('check-out', activeShift)}
              disabled={punching}
              className="w-full md:w-auto py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2.5 transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span>{punching ? t('hrPages.attendance.recording') : t('hrPages.attendance.clockOutNow')}</span>
            </button>
          ) : !isAllDone ? (
            <button
              type="button"
              onClick={() => handlePunch('check-in', isMorningDone ? 'afternoon' : effectiveShift)}
              disabled={punching}
              className="w-full md:w-auto py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black bg-[#00ced1] hover:brightness-95 text-slate-950 shadow-lg shadow-[#00ced1]/20 flex items-center justify-center gap-2.5 transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-5 h-5 text-slate-950" />
              <span>
                {punching
                  ? t('hrPages.attendance.recording')
                  : `${t('hrPages.attendance.clockInNow')} (${isMorningDone ? 'Afternoon' : effectiveShift})`}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Top Hero: Digital Clock & Geofence Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Digital Clock Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a1220] to-[#0e1626] text-white border border-slate-800 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-[#00ced1]/10 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#00ced1] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00ced1] animate-pulse" />
                <span>Live Time</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Shift: <span className="text-[#00ced1] font-bold capitalize">{effectiveShift}</span>
              </span>
            </div>

            {/* Time String */}
            <div className="mt-3">
              <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {currentTime.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </p>
            </div>
          </div>

          {/* Today Attendance Summary Pill */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Today Status:</span>
            {todayLog?.attendanceStatus ? (
              <StatusBadge status={todayLog.attendanceStatus} size="sm" />
            ) : (
              <span className="text-xs text-slate-400 font-medium">Not Logged Yet</span>
            )}
          </div>
        </div>

        {/* GPS Geofence Radar Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  proximityInfo.isInside
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('hrPages.attendance.gpsTitle')}
                  </h3>
                  {proximityInfo.nearestOffice && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        proximityInfo.isInside
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                      }`}
                    >
                      {proximityInfo.isInside ? 'Within Perimeter' : 'Outside Office'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {geoCoords ? (
                    <>
                      <span>
                        {proximityInfo.nearestOffice
                          ? proximityInfo.isInside
                            ? t('hrPages.attendance.withinOfficeRadius', {
                                meters: proximityInfo.distance,
                                office: proximityInfo.nearestOffice.officeName
                              })
                            : t('hrPages.attendance.outsideOfficeRadius', {
                                meters: proximityInfo.distance,
                                allowed: proximityInfo.allowedRadius
                              })
                          : t('hrPages.attendance.acquired', {
                              lat: geoCoords.lat.toFixed(5),
                              long: geoCoords.long.toFixed(5)
                            })}
                      </span>
                      {geoAccuracy && (
                        <span className="ml-1 text-[11px] text-slate-400 font-mono">
                          (±{geoAccuracy}m)
                        </span>
                      )}
                    </>
                  ) : (
                    geoError || t('hrPages.attendance.detecting')
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={getBrowserLocation}
              disabled={gettingLocation}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
              title={t('hrPages.attendance.refreshGps')}
            >
              <RefreshCw className={`w-4 h-4 ${gettingLocation ? 'animate-spin text-[#00ced1]' : ''}`} />
            </button>
          </div>

          {/* Selfie Snapshot & Camera Trigger */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {selfiePreview ? (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#00ced1] shadow-xs shrink-0">
                  <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{selfiePreview ? 'Selfie Attached' : 'Selfie Verification'}</span>
                  {config?.isSelfieRequired && (
                    <span className="text-[10px] text-rose-500 font-bold">*Required</span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selfiePreview
                    ? 'Ready for punch submission'
                    : 'Snap camera photo before checking in/out'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="py-2 px-3.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[#00ced1]" />
              <span>{selfiePreview ? t('hrPages.attendance.retakeSelfie') : t('hrPages.attendance.takeSelfie')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Shift Mode & Optional Notes */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Shift selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {t('hrPages.attendance.selectShift')}:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#070b12] p-1 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShiftMode('auto')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                shiftMode === 'auto'
                  ? 'bg-white dark:bg-[#0e1626] text-[#00ced1] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Auto ({effectiveShift})
            </button>
            <button
              type="button"
              onClick={() => setShiftMode('morning')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                shiftMode === 'morning'
                  ? 'bg-white dark:bg-[#0e1626] text-[#00ced1] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t('hrPages.attendance.morningShift')}
            </button>
            <button
              type="button"
              onClick={() => setShiftMode('afternoon')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                shiftMode === 'afternoon'
                  ? 'bg-white dark:bg-[#0e1626] text-[#00ced1] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t('hrPages.attendance.afternoonShift')}
            </button>
          </div>
        </div>

        {/* Optional Notes */}
        <div className="w-full sm:flex-1 max-w-md">
          <input
            type="text"
            value={punchNotes}
            onChange={(e) => setPunchNotes(e.target.value)}
            placeholder={t('hrPages.attendance.notesPlaceholder')}
            className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070b12] text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00ced1]"
          />
        </div>
      </div>

      {/* Daily Shift & Lunch Schedule Timeline Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {t('hrPages.attendance.scheduleTimeline')}
              </h4>
              <p className="text-[11px] text-slate-500">
                Operating times with {lateGrace}m arrival grace period & {earlyGrace}m early departure buffer
              </p>
            </div>
          </div>

          {/* Real-time Indicator Badge */}
          {timingStatus.isLunchTime ? (
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 flex items-center gap-1.5 animate-pulse">
              <span>🥪</span>
              <span>{t('hrPages.attendance.lunchBreakActive', { start: lunchStartTime, end: lunchEndTime })}</span>
            </span>
          ) : timingStatus.morningLateMins > 0 && !morningCheck?.checkIn?.time ? (
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t('hrPages.attendance.lateAlert', { mins: timingStatus.morningLateMins })}</span>
            </span>
          ) : timingStatus.afternoonLateMins > 0 && !afternoonCheck?.checkIn?.time ? (
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t('hrPages.attendance.lateAlert', { mins: timingStatus.afternoonLateMins })}</span>
            </span>
          ) : timingStatus.isOvertimeNow ? (
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#00ced1]" />
              <span>Overtime Active</span>
            </span>
          ) : (
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('hrPages.attendance.withinGraceAlert', { mins: lateGrace })}</span>
            </span>
          )}
        </div>

        {/* 4-Step Interactive Timeline */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Step 1: Morning Entrance */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#00ced1] block flex items-center gap-1">
              <span>🌅 Morning Entrance</span>
            </span>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white">
              {morningStartTime}
            </p>
            <p className="text-[11px] text-slate-400">
              Grace up to <span className="font-semibold text-slate-600 dark:text-slate-300">+{lateGrace}m</span>
            </p>
          </div>

          {/* Step 2: Lunch Break Departure */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
              <span>🥪 Lunch Departure</span>
            </span>
            <p className="text-base font-black font-mono text-amber-800 dark:text-amber-300">
              {lunchStartTime}
            </p>
            <p className="text-[11px] text-slate-400">
              Break: <span className="font-semibold text-slate-600 dark:text-slate-300">{lunchStartTime} – {lunchEndTime}</span>
            </p>
          </div>

          {/* Step 3: Afternoon Return */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-teal-500 block flex items-center gap-1">
              <span>☀️ Afternoon Return</span>
            </span>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white">
              {afternoonStartTime}
            </p>
            <p className="text-[11px] text-slate-400">
              Grace up to <span className="font-semibold text-slate-600 dark:text-slate-300">+{lateGrace}m</span>
            </p>
          </div>

          {/* Step 4: Day Departure */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-500 block flex items-center gap-1">
              <span>🏁 Day Departure</span>
            </span>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white">
              {afternoonEndTime}
            </p>
            <p className="text-[11px] text-slate-400">
              Overtime after <span className="font-semibold text-slate-600 dark:text-slate-300">+30m</span>
            </p>
          </div>
        </div>
      </div>

      {/* Dual Shift Punch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Morning Shift Card */}
        <div
          className={`p-6 rounded-3xl bg-white dark:bg-[#0e1626] border shadow-xs flex flex-col justify-between space-y-5 transition-all ${
            isMorningClockedIn
              ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isMorningClockedIn ? 'bg-emerald-500 animate-ping' : 'bg-[#00ced1]'
                }`}
              />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('hrPages.attendance.morningShift')}
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
              {config?.morningTime?.startTime || '08:30'} – {config?.morningTime?.endTime || '12:30'}
            </span>
          </div>

          {/* Morning Check-In Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/70 dark:border-slate-800/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('hrPages.attendance.arrivalTitle')}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {morningCheck?.checkIn?.time
                    ? `Recorded at ${new Date(morningCheck.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Shift start check-in'}
                </p>
              </div>

              {morningCheck?.checkIn?.status && (
                <StatusBadge status={morningCheck.checkIn.status} size="sm" />
              )}
            </div>

            {morningCheck?.checkIn?.time ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <span>{t('hrPages.attendance.checkedInAt')}</span>
                <span className="font-mono font-bold">
                  {new Date(morningCheck.checkIn.time).toLocaleTimeString()}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handlePunch('check-in', 'morning')}
                disabled={punching}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-[#00ced1] hover:brightness-95 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-slate-950" />
                <span>{punching ? t('hrPages.attendance.recording') : t('hrPages.attendance.punchIn')}</span>
              </button>
            )}
          </div>

          {/* Morning Check-Out Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/70 dark:border-slate-800/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('hrPages.attendance.departureTitle')}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {morningCheck?.checkOut?.time
                    ? `Recorded at ${new Date(morningCheck.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : isMorningClockedIn
                    ? 'Awaiting your check-out'
                    : 'Midday departure'}
                </p>
              </div>

              {morningCheck?.checkOut?.status && (
                <StatusBadge status={morningCheck.checkOut.status} size="sm" />
              )}
            </div>

            {morningCheck?.checkOut?.time ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <span>{t('hrPages.attendance.checkedOutAt')}</span>
                <span className="font-mono font-bold">
                  {new Date(morningCheck.checkOut.time).toLocaleTimeString()}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handlePunch('check-out', 'morning')}
                disabled={punching || !morningCheck?.checkIn?.time}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 ${
                  isMorningClockedIn
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>
                  {punching
                    ? t('hrPages.attendance.recording')
                    : isMorningClockedIn
                    ? 'Clock Out Morning Shift'
                    : t('hrPages.attendance.punchOut')}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Afternoon Shift Card */}
        <div
          className={`p-6 rounded-3xl bg-white dark:bg-[#0e1626] border shadow-xs flex flex-col justify-between space-y-5 transition-all ${
            isAfternoonClockedIn
              ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
              : 'border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isAfternoonClockedIn ? 'bg-emerald-500 animate-ping' : 'bg-teal-400'
                }`}
              />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t('hrPages.attendance.afternoonShift')}
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
              {config?.afternoonTime?.startTime || '13:30'} – {config?.afternoonTime?.endTime || '17:30'}
            </span>
          </div>

          {/* Afternoon Check-In Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/70 dark:border-slate-800/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('hrPages.attendance.arrivalTitle')}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {afternoonCheck?.checkIn?.time
                    ? `Recorded at ${new Date(afternoonCheck.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Afternoon arrival'}
                </p>
              </div>

              {afternoonCheck?.checkIn?.status && (
                <StatusBadge status={afternoonCheck.checkIn.status} size="sm" />
              )}
            </div>

            {afternoonCheck?.checkIn?.time ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <span>{t('hrPages.attendance.checkedInAt')}</span>
                <span className="font-mono font-bold">
                  {new Date(afternoonCheck.checkIn.time).toLocaleTimeString()}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handlePunch('check-in', 'afternoon')}
                disabled={punching}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-[#00ced1] hover:brightness-95 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-slate-950" />
                <span>{punching ? t('hrPages.attendance.recording') : t('hrPages.attendance.punchIn')}</span>
              </button>
            )}
          </div>

          {/* Afternoon Check-Out Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/70 dark:border-slate-800/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {t('hrPages.attendance.departureTitle')}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {afternoonCheck?.checkOut?.time
                    ? `Recorded at ${new Date(afternoonCheck.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : isAfternoonClockedIn
                    ? 'Awaiting your end-of-day check-out'
                    : 'End of work day'}
                </p>
              </div>

              {afternoonCheck?.checkOut?.status && (
                <StatusBadge status={afternoonCheck.checkOut.status} size="sm" />
              )}
            </div>

            {afternoonCheck?.checkOut?.time ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <span>{t('hrPages.attendance.checkedOutAt')}</span>
                <span className="font-mono font-bold">
                  {new Date(afternoonCheck.checkOut.time).toLocaleTimeString()}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handlePunch('check-out', 'afternoon')}
                disabled={punching || !afternoonCheck?.checkIn?.time}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 ${
                  isAfternoonClockedIn
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>
                  {punching
                    ? t('hrPages.attendance.recording')
                    : isAfternoonClockedIn
                    ? 'Clock Out Afternoon Shift'
                    : t('hrPages.attendance.punchOut')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false);
          setPendingPunch(null);
        }}
        onCapture={handleCaptureSelfie}
      />
    </div>
  );
}
