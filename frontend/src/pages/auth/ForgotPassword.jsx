import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, KeyRound, Send } from 'lucide-react';
import { authService } from '../../services/authService';
import VectorLogo from '../../components/VectorLogo';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    if (!email.trim()) {
      setError(t('auth.invalidEmail'));
      return;
    }

    try {
      setLoading(true);
      const res = await authService.forgotPassword(email.trim());
      if (res.success) {
        setSuccessInfo(res);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('auth.requestCodeFailed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 xs:p-4 sm:p-6 lg:p-8 py-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg"
                style={{
                  backgroundColor: '#00ced1',
                  boxShadow: '0 4px 16px rgba(0, 206, 209, 0.4)'
                }}
              >
                <KeyRound className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('auth.forgotPasswordTitle')}
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('auth.forgotPasswordSub')}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner & Next Step */}
          {successInfo ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{t('auth.codeSentSuccess')}</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {successInfo.message}
                </p>

                {/* Dev Mode Code Preview if available */}
                {successInfo.resetCode && (
                  <div className="mt-3 p-2.5 bg-white dark:bg-[#152238] rounded-xl border border-emerald-300 dark:border-emerald-800 text-center font-mono font-bold tracking-widest text-slate-900 dark:text-white text-base">
                    {successInfo.resetCode}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: '#00ced1',
                  boxShadow: '0 4px 16px rgba(0, 206, 209, 0.4)'
                }}
              >
                <span>{t('auth.resetPasswordTitle')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#00ced1]/20 transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 cursor-pointer"
                style={{
                  backgroundColor: '#00ced1',
                  boxShadow: '0 4px 16px rgba(0, 206, 209, 0.4)'
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>{t('auth.sendingCode')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.sendCodeBtn')}</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#00ced1] dark:hover:text-[#00ced1] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('auth.backToLogin')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
