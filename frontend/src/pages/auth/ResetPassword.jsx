import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/authService';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.code.trim() || !formData.newPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword(
        formData.email.trim(),
        formData.code.trim(),
        formData.newPassword
      );

      if (res.success) {
        setSuccess(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password';
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
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{
                  backgroundColor: '#00ced1',
                  boxShadow: '0 4px 16px rgba(0, 206, 209, 0.4)'
                }}
              >
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('auth.resetPasswordTitle')}
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('auth.resetPasswordSub')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Screen */}
          {success ? (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                <div className="flex items-center justify-center gap-2 font-bold mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>{t('auth.resetSuccess')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: '#00ced1',
                  boxShadow: '0 4px 16px rgba(0, 206, 209, 0.4)'
                }}
              >
                <span>{t('auth.signInBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
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
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#00ced1]/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Reset Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('auth.resetCode')}
                </label>
                <input
                  type="text"
                  name="code"
                  maxLength={6}
                  value={formData.code}
                  onChange={handleChange}
                  placeholder={t('auth.resetCodePlaceholder')}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base font-mono tracking-widest text-center focus:outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#00ced1]/20 transition-all duration-200"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#00ced1]/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#00ced1]/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 cursor-pointer"
                style={{
                  backgroundColor: '#00ced1',
                  boxShadow: '0 4px 16px rgba(0, 206, 209, 0.4)'
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('auth.resetting')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.resetBtn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back link */}
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
