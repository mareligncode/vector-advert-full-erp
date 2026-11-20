import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VectorLogo from '../../components/VectorLogo';

const AVAILABLE_ROLES = [
  'employee',
  'designer',
  'finance',
  'purchasing',
  'storekeeper',
  'frontdesk',
  'intern',
  'departmenthead',
  'manager',
  'hrofficer',
  'hrmanager'
];

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    setSuccessMsg('');

    if (!formData.email.trim() || !formData.password) {
      setError(t('auth.invalidEmail'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    try {
      setLoading(true);
      const res = await register(
        formData.email.trim(),
        formData.password,
        [formData.role]
      );
      if (res.success) {
        setSuccessMsg(t('auth.registerSuccess'));
        setTimeout(() => {
          navigate('/dashboard');
        }, 600);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create account';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 xs:p-4 sm:p-6 lg:p-8 py-6 sm:py-10">
      <div className="w-full max-w-lg">
        {/* Brand Card */}
        <div className="bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <VectorLogo size="lg" showText={false} />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('auth.createAccount')}
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('auth.signUpSub')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
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

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('auth.roles')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#00ced1]/20 transition-all duration-200 cursor-pointer"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-white dark:bg-[#152238] text-slate-900 dark:text-white">
                      {t(`roles.${r}`, r)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
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
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#00ced1]/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
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
                  <span>{t('auth.signingUp')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.signUpBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className="font-bold text-[#00ced1] hover:text-[#00b5b8] hover:underline transition-colors"
              >
                {t('nav.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
