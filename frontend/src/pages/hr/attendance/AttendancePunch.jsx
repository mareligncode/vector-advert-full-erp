import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, MapPin, Camera, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { attendanceService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/hr/StatusBadge';

export default function AttendancePunch() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getTodayAttendance();
      if (res.success) {
        setTodayLog(res.data);
      }
    } catch (err) {
      console.error('Failed to get today attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBrowserLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(t('hrPages.attendance.geoUnsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({
          lat: pos.coords.latitude,
          long: pos.coords.longitude
        });
        setGeoError('');
      },
      (err) => {
        setGeoError(t('hrPages.attendance.geoError', { msg: err.message }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchTodayAttendance();
    getBrowserLocation();
  }, []);

  const handlePunch = async (type = 'check-in') => {
    try {
      setPunching(true);
      setError('');
      setMessage('');

      const formData = new FormData();
      if (geoCoords) {
        formData.append('lat', geoCoords.lat);
        formData.append('long', geoCoords.long);
      }

      const res =
        type === 'check-in'
          ? await attendanceService.checkIn(formData)
          : await attendanceService.checkOut(formData);

      if (res.success) {
        setMessage(type === 'check-in' ? t('hrPages.attendance.checkInSuccess') : t('hrPages.attendance.checkOutSuccess'));
        fetchTodayAttendance();
      }
    } catch (err) {
      setError(err.response?.data?.message || t('hrPages.attendance.punchFailed', { type }));
    } finally {
      setPunching(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.attendance.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.attendance.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTodayAttendance}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={t('common.refresh')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Geolocation Status Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">{t('hrPages.attendance.gpsTitle')}</p>
            <p className="text-[11px] text-slate-500">
              {geoCoords
                ? t('hrPages.attendance.acquired', { lat: geoCoords.lat.toFixed(5), long: geoCoords.long.toFixed(5) })
                : geoError || t('hrPages.attendance.detecting')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={getBrowserLocation}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
        >
          {t('hrPages.attendance.refreshGps')}
        </button>
      </div>

      {/* Punch Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Morning / Check-in */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00ced1]">{t('hrPages.attendance.morningShift')}</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{t('hrPages.attendance.arrivalTitle')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('hrPages.attendance.arrivalDesc')}</p>
          </div>

          {todayLog?.morningCheck?.checkIn?.time ? (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
              <span>{t('hrPages.attendance.checkedInAt')}</span>
              <span className="font-mono font-bold">
                {new Date(todayLog.morningCheck.checkIn.time).toLocaleTimeString()}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handlePunch('check-in')}
              disabled={punching}
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-slate-950 flex items-center justify-center gap-2 shadow-sm transition-all hover:brightness-95 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#00ced1' }}
            >
              <Clock className="w-4 h-4" />
              <span>{punching ? t('hrPages.attendance.recording') : t('hrPages.attendance.punchIn')}</span>
            </button>
          )}
        </div>

        {/* Afternoon / Check-out */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('hrPages.attendance.shiftEnd')}</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{t('hrPages.attendance.departureTitle')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('hrPages.attendance.departureDesc')}</p>
          </div>

          {todayLog?.afternoonCheck?.checkOut?.time || todayLog?.morningCheck?.checkOut?.time ? (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
              <span>{t('hrPages.attendance.checkedOutAt')}</span>
              <span className="font-mono font-bold">
                {new Date(
                  todayLog?.afternoonCheck?.checkOut?.time || todayLog?.morningCheck?.checkOut?.time
                ).toLocaleTimeString()}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handlePunch('check-out')}
              disabled={punching || !todayLog}
              className="w-full py-3 px-4 rounded-2xl text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              <span>{punching ? t('hrPages.attendance.recording') : t('hrPages.attendance.punchOut')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
