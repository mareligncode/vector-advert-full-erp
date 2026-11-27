import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, X, RotateCcw, Check, Upload, AlertCircle, RefreshCw } from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [startingCamera, setStartingCamera] = useState(false);

  // Start webcam video stream
  const startCamera = async () => {
    try {
      setCameraError('');
      setStartingCamera(true);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam is not supported on this browser or connection');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraError(err.message || 'Unable to access web camera');
    } finally {
      setStartingCamera(false);
    }
  };

  // Stop camera stream on unmount or close
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCapturedFile(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Snap image from live video
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror image for natural selfie view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    // Convert dataURL to Blob / File
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedFile(file);
        }
      },
      'image/jpeg',
      0.85
    );

    stopCamera();
  };

  // Fallback: Upload from file picker
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedFile(file);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setCapturedImage(uploadEvent.target?.result);
      };
      reader.readAsDataURL(file);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage && capturedFile) {
      onCapture({ dataUrl: capturedImage, file: capturedFile });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {t('hrPages.attendance.takeSelfie')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Selfie"
                className="w-full h-full object-cover"
              />
            ) : cameraError ? (
              <div className="p-4 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300">
                  {t('hrPages.attendance.cameraAccessError', { msg: cameraError })}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t('hrPages.attendance.uploadFallback')}</span>
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {startingCamera && (
                  <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-white text-xs gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#00ced1]" />
                    <span>Connecting camera...</span>
                  </div>
                )}
                {/* Target overlay oval */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-44 h-56 rounded-[50%] border-2 border-dashed border-[#00ced1]/50" />
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Action buttons */}
          <div className="w-full mt-6 flex items-center justify-between gap-3">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('hrPages.attendance.retakeSelfie')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('common.confirm')}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={t('hrPages.attendance.uploadFallback')}
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </button>

                <button
                  type="button"
                  onClick={handleSnap}
                  disabled={startingCamera || !!cameraError}
                  className="flex-1 py-3 px-6 rounded-2xl text-xs font-bold bg-[#00ced1] text-slate-950 hover:brightness-95 flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t('hrPages.attendance.takeSelfie')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
