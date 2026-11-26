import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Lock,
  UserPlus,
  Shield,
  Key,
  Check,
  Copy,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UserCheck,
  Phone,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import api from '../../services/api';
import VectorLogo from '../../components/VectorLogo';

const ROLE_LABELS = {
  ceo: 'Chief Executive Officer (CEO)',
  cao: 'Chief Administrative Officer (CAO)',
  coo: 'Chief Operating Officer (COO)',
  hrmanager: 'HR Manager',
  hrofficer: 'HR Officer',
  finance: 'Finance / Accountant',
  purchasing: 'Purchasing Officer',
  storekeeper: 'Storekeeper / Inventory',
  frontdesk: 'Front Desk / Receptionist',
  departmenthead: 'Department Head',
  manager: 'Operations Manager',
  designer: 'Creative Designer',
  employee: 'General Employee',
  intern: 'Intern'
};

export default function Register() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [selectedRole, setSelectedRole] = useState('');
  const [email, setEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);

  // Employee profile details (for HR Manager / Employee onboarding)
  const [includeEmployeeDetails, setIncludeEmployeeDetails] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState({
    firstName: '',
    lastName: '',
    primaryPhone: '',
    department: '',
    jobTitle: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const res = await authService.getRegistrationPermissions();
        if (res.success && res.data) {
          setPermissions(res.data);
          if (res.data.allowedRoles && res.data.allowedRoles.length > 0) {
            setSelectedRole(res.data.allowedRoles[0]);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || t('auth.permissionsFailed'));
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const creds = `Vector Advert ERP Credentials:\nEmail: ${createdResult.email}\nTemporary Password: ${createdResult.temporaryPassword}\nRole: ${createdResult.roles?.join(', ')}\nNote: You will be prompted to change this password on your first login.`;
    navigator.clipboard.writeText(creds);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('auth.invalidEmail'));
      return;
    }

    if (!autoGeneratePassword && customPassword.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    try {
      setLoading(true);

      // If HR Manager is provisioning an employee with personal details:
      if (includeEmployeeDetails && (selectedRole === 'employee' || selectedRole === 'intern' || selectedRole === 'designer')) {
        if (!employeeDetails.firstName || !employeeDetails.lastName || !employeeDetails.primaryPhone) {
          setError(t('auth.firstLastPhoneRequired'));
          setLoading(false);
          return;
        }

        const employeePayload = {
          name: {
            first: employeeDetails.firstName.trim(),
            last: employeeDetails.lastName.trim()
          },
          email: email.trim().toLowerCase(),
          primaryPhone: employeeDetails.primaryPhone.trim(),
          department: employeeDetails.department || 'General',
          jobTitle: employeeDetails.jobTitle || ROLE_LABELS[selectedRole] || selectedRole,
          createUser: {
            email: email.trim().toLowerCase(),
            password: autoGeneratePassword ? undefined : customPassword,
            roles: [selectedRole]
          }
        };

        const empRes = await api.post('/employees', employeePayload);
        if (empRes.data.success) {
          setCreatedResult({
            email: empRes.data.createdUser?.email || email,
            roles: empRes.data.createdUser?.roles || [selectedRole],
            temporaryPassword: empRes.data.createdUser?.temporaryPassword,
            employeeNumber: empRes.data.data?.employeeNumber,
            employeeName: `${employeeDetails.firstName} ${employeeDetails.lastName}`
          });
        }
      } else {
        // Standard Executive User Account Registration
        const payload = {
          email: email.trim().toLowerCase(),
          roles: [selectedRole],
          password: autoGeneratePassword ? undefined : customPassword
        };

        const res = await api.post('/auth/register', payload);
        if (res.data.success) {
          setCreatedResult({
            email: res.data.data.email,
            roles: res.data.data.roles,
            temporaryPassword: res.data.data.temporaryPassword
          });
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('auth.registerFailed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setEmail('');
    setCustomPassword('');
    setAutoGeneratePassword(true);
    setIncludeEmployeeDetails(false);
    setEmployeeDetails({
      firstName: '',
      lastName: '',
      primaryPhone: '',
      department: '',
      jobTitle: ''
    });
    setCreatedResult(null);
    setError('');
  };

  if (loadingPermissions) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-[#00ced1]/20 border-t-[#00ced1] animate-spin" />
          <p className="text-xs font-semibold text-slate-500">{t('auth.checkingPermissions')}</p>
        </div>
      </div>
    );
  }

  // If user does not have permission to register any roles
  if (!permissions?.canRegister || permissions.allowedRoles?.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-900/40">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('auth.regRestrictedTitle')}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('auth.regRestrictedSub')}
          </p>
          <div className="mt-4 p-3 bg-slate-50 dark:bg-[#152238] rounded-xl text-left text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
            <div>• {t('auth.hierarchyCeo')}</div>
            <div>• {t('auth.hierarchyCao')}</div>
            <div>• {t('auth.hierarchyCoo')}</div>
            <div>• {t('auth.hierarchyHr')}</div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold hover:brightness-95 shadow-md transition-all cursor-pointer"
              style={{ backgroundColor: '#00ced1', color: '#020617' }}
            >
              <span style={{ color: '#020617' }}>{t('auth.returnDashboard')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 xs:p-4 sm:p-6 lg:p-8 py-6 sm:py-10">
      <div className="w-full max-w-xl">
        <div className="bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 shadow-sm shrink-0"
                style={{ backgroundColor: '#00ced1' }}
              >
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  {t('auth.regPortalTitle')}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('auth.authorizedAs')}: <span className="font-semibold text-[#00ced1] uppercase">{t(`roles.${user?.roles?.[0]}`, user?.roles?.[0])}</span>
                </p>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="text-xs font-bold text-slate-500 hover:text-[#00ced1] transition-colors"
            >
              {t('nav.dashboard')}
            </Link>
          </div>

          {/* Success Result Modal / Card */}
          {createdResult ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  {t('auth.provisionSuccessTitle')}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  {t('auth.provisionSuccessSub')}
                </p>

                {/* Credentials Display Card */}
                <div className="mt-4 p-4 rounded-xl bg-white dark:bg-[#152238] border border-emerald-300 dark:border-emerald-700/80 text-left space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">{t('auth.emailLabel')}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{createdResult.email}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">{t('auth.assignedRoleLabel')}</span>
                    <span className="font-bold text-[#00ced1] uppercase">{createdResult.roles?.map((r) => t(`roles.${r}`, r)).join(', ')}</span>
                  </div>

                  {createdResult.employeeNumber && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">{t('auth.employeeIdLabel')}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{createdResult.employeeNumber}</span>
                    </div>
                  )}

                  {createdResult.temporaryPassword && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        {t('auth.tempPasswordShareLabel')}
                      </span>
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700">
                        <span className="font-mono font-black text-sm text-[#00ced1] tracking-wider select-all">
                          {createdResult.temporaryPassword}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCredentials}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-slate-950 bg-[#00ced1] hover:bg-[#00b5b8] transition-colors cursor-pointer"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? t('common.copied') : t('common.copy')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold hover:brightness-95 shadow-md transition-all cursor-pointer text-center"
                  style={{ backgroundColor: '#00ced1', color: '#020617' }}
                >
                  <span style={{ color: '#020617' }}>{t('auth.registerAnother')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('nav.dashboard')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('auth.assignRoleLabel')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {permissions.allowedRoles?.map((r) => {
                    const isSelected = selectedRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#00ced1] bg-[#00ced1]/10 text-[#00ced1] font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#152238] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs truncate">{t(`roles.${r}`, ROLE_LABELS[r] || r)}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('auth.userEmailLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.userEmailPlaceholder')}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#00ced1] focus:ring-2 focus:ring-[#00ced1]/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Option */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00ced1]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {t('auth.tempRandomPassword')}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGeneratePassword}
                      onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00ced1]"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {autoGeneratePassword
                    ? t('auth.tempRandomDesc')
                    : t('auth.customPasswordDesc')}
                </p>

                {!autoGeneratePassword && (
                  <div className="relative pt-1">
                    <input
                      type="text"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder={t('auth.customPasswordPlaceholder')}
                      className="w-full px-3 py-2 bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
                    />
                  </div>
                )}
              </div>

              {/* Optional Employee Details Section (For HR Manager or employee roles) */}
              {(selectedRole === 'employee' || selectedRole === 'intern' || selectedRole === 'designer') && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#00ced1]" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('auth.includeEmployeeDetails')}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeEmployeeDetails}
                        onChange={(e) => setIncludeEmployeeDetails(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00ced1]"></div>
                    </label>
                  </div>

                  {includeEmployeeDetails && (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={t('auth.firstNameReq')}
                          value={employeeDetails.firstName}
                          onChange={(e) =>
                            setEmployeeDetails((p) => ({ ...p, firstName: e.target.value }))
                          }
                          className="px-3 py-2 text-xs bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder={t('auth.lastNameReq')}
                          value={employeeDetails.lastName}
                          onChange={(e) =>
                            setEmployeeDetails((p) => ({ ...p, lastName: e.target.value }))
                          }
                          className="px-3 py-2 text-xs bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={t('auth.phoneReq')}
                          value={employeeDetails.primaryPhone}
                          onChange={(e) =>
                            setEmployeeDetails((p) => ({ ...p, primaryPhone: e.target.value }))
                          }
                          className="px-3 py-2 text-xs bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder={t('auth.deptPlaceholder')}
                          value={employeeDetails.department}
                          onChange={(e) =>
                            setEmployeeDetails((p) => ({ ...p, department: e.target.value }))
                          }
                          className="px-3 py-2 text-xs bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-95 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 cursor-pointer"
                style={{
                  backgroundColor: '#00ced1',
                  color: '#020617',
                  boxShadow: '0 4px 16px rgba(0, 206, 209, 0.4)'
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span style={{ color: '#020617' }}>{t('auth.provisioning')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" style={{ color: '#020617' }} />
                    <span style={{ color: '#020617' }}>{t('auth.createUserBtn')}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
