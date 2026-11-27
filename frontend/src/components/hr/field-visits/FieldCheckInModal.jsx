import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  MapPin,
  Camera,
  LocateFixed,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Upload,
  RefreshCw
} from 'lucide-react';
import { fieldVisitService } from '../../../services/hrService';

// Haversine formula to calculate distance in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export default function FieldCheckInModal({ isOpen, onClose, visit, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [currentCoords, setCurrentCoords] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [acquiringGps, setAcquiringGps] = useState(true);
  const [gpsError, setGpsError] = useState('');

  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Request browser geolocation immediately upon opening
  const acquireLocation = () => {
    if (!navigator.geolocation) {
      setGpsError(
        isAmharic
          ? 'የአካባቢ መገኛ (Geolocation) በአሳሽዎ አይደገፍም'
          : 'Geolocation is not supported by your browser'
      );
      setAcquiringGps(false);
      return;
    }

    setAcquiringGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, long: longitude });

        if (visit?.location) {
          const dist = getDistanceMeters(
            latitude,
            longitude,
            visit.location.lat,
            visit.location.long
          );
          setDistanceMeters(dist);
        }
        setAcquiringGps(false);
      },
      (err) => {
        console.error(err);
        setGpsError(
          isAmharic
            ? 'የአካባቢ መገኛ ፈቃድ አልተገኘም፡ እባክዎ GPS ያብሩ እና ፈቃድ ይስጡ።'
            : 'Could not access GPS location. Please enable location permissions.'
        );
        setAcquiringGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (isOpen) {
      acquireLocation();
    } else {
      setCurrentCoords(null);
      setDistanceMeters(null);
      setSelfieFile(null);
      setSelfiePreview(null);
      setNotes('');
      setError('');
    }
  }, [isOpen, visit]);

  const handleSelfieChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      const url = URL.createObjectURL(file);
      setSelfiePreview(url);
    }
  };

  if (!isOpen || !visit) return null;

  const allowedRadius = visit.radiusMeters || 300;
  const isWithinRadius = distanceMeters !== null && distanceMeters <= allowedRadius;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      if (currentCoords && currentCoords.lat !== undefined && currentCoords.long !== undefined) {
        formData.append('lat', currentCoords.lat);
        formData.append('long', currentCoords.long);
      }
      if (notes.trim()) formData.append('notes', notes.trim());
      if (selfieFile) formData.append('selfie', selfieFile);

      const res = await fieldVisitService.checkInVisit(visit._id, formData);
      if (res.success) {
        onSuccess(res);
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isAmharic ? 'የመስክ መግቢያ መመዝገብ አልተሳካም' : 'Field check-in failed')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAmharic ? 'በቦታው ተገኝተህ መዝግብ (Field Check-In)' : 'On-Site Field Check-In'}
              </h3>
              <p className="text-xs text-slate-500">
                {visit.visitPurpose}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Site Target Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {isAmharic ? 'የመድረሻ ቦታ' : 'Destination Site'}
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-[#00ced1] shrink-0" />
              <span>{visit.visitAddress}</span>
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {visit.location?.lat != null && visit.location?.long != null
                ? `GPS: ${visit.location.lat}, ${visit.location.long} • ${isAmharic ? 'የተፈቀደ ርቀት፡' : 'Radius:'} ${allowedRadius}m`
                : (isAmharic ? 'የሳይት GPS መጋጠሚያ አልተመዘገበም (አማራጭ)' : 'Site GPS coordinates not set (Optional)')}
            </p>
          </div>

          {/* Live Geofence Proximity Status (Optional) */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              acquiringGps
                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                : currentCoords
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  acquiringGps
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    : currentCoords
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                {acquiringGps ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : currentCoords ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  {acquiringGps
                    ? isAmharic ? 'የGPS መገኛዎን በማስላት ላይ...' : 'Acquiring GPS location (Optional)...'
                    : currentCoords
                    ? distanceMeters !== null
                      ? isWithinRadius
                        ? isAmharic ? 'በተፈቀደው የቦታ ክልል ውስጥ ነዎት' : 'Within Allowed Site Perimeter'
                        : isAmharic ? 'ከተፈቀደው ክልል ውጭ ነዎት (ይፈቀዳል)' : 'Outside Geofence (Allowed)'
                      : isAmharic ? 'የአሁኑ GPS ተገኝቷል' : 'GPS Detected (Location Logged)'
                    : isAmharic ? 'GPS አልተገኘም (አማራጭ ነው)' : 'GPS Skipped / Not Available (Optional)'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5 font-mono">
                  {distanceMeters !== null ? (
                    <span>
                      {isAmharic ? `ከቦታው ${distanceMeters} ሜትር ርቀዋል` : `${distanceMeters}m from site target`}
                    </span>
                  ) : currentCoords ? (
                    <span>{currentCoords.lat.toFixed(4)}, {currentCoords.long.toFixed(4)}</span>
                  ) : (
                    <span>{gpsError || (isAmharic ? 'ያለ GPS መመዝገብ ይችላሉ' : 'You can check-in without GPS')}</span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={acquireLocation}
              disabled={acquiringGps}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
              title="Re-check GPS"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          </div>

          {/* Camera Selfie Verification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#00ced1]" />
                <span>{isAmharic ? 'የማረጋገጫ ፎቶ (Selfie Photo)' : 'On-Site Verification Photo'}</span>
              </span>
              <span className="text-[10px] text-slate-400">Optional</span>
            </label>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="user"
                onChange={handleSelfieChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#00ced1] text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4 text-[#00ced1]" />
                <span>{selfiePreview ? (isAmharic ? 'ፎቶ ቀይር' : 'Change Photo') : (isAmharic ? 'ፎቶ አንሳ / ምረጥ' : 'Snap Photo / Upload')}</span>
              </button>

              {selfiePreview && (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shrink-0">
                  <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* On-Site Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'የመግቢያ ማስታወሻ / ሁኔታ' : 'On-Site Check-In Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isAmharic
                  ? 'ምሳሌ፡ በቦታው ደርሻለሁ፣ ከደንበኛው ጋር ስብሰባ ጀምረናል...'
                  : 'e.g. Arrived on-site, met with client contact and started survey...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
            />
          </div>

          {/* Actions */}
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
                  ? isAmharic ? 'በመመዝገብ ላይ...' : 'Recording...'
                  : isAmharic ? 'መግቢያውን አረጋግጥ' : 'Confirm Field Check-In'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
