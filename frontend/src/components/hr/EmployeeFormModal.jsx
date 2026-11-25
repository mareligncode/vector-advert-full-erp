import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Banknote,
  Shield,
  Key,
  Copy,
  Check,
  AlertCircle,
  Save,
  UserPlus,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Building2,
  Users
} from 'lucide-react';
import { employeeService } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';
import {
  canViewFinancials,
  canManageUserAccount,
  DEPARTMENTS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES,
  ALL_ROLES,
  RELIGIONS,
  BLOOD_GROUPS,
  EDUCATION_LEVELS,
  WORK_LOCATIONS,
  BRANCHES,
  GUARANTOR_RELATIONSHIPS
} from '../../utils/rbac';

export default function EmployeeFormModal({ isOpen, onClose, employee, onSuccess }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();
  const isEditMode = !!employee;
  const showFinancials = canViewFinancials(user);
  const showUserProvisioning = !isEditMode && canManageUserAccount(user);

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [managerOptions, setManagerOptions] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    // Name
    firstName: '',
    middleName: '',
    lastName: '',
    // Personal
    gender: 'male',
    dateOfBirth: '',
    nationality: 'Ethiopian',
    maritalStatus: 'single',
    homeAddress: '',
    religion: '',
    bloodGroup: '',
    // Contact
    primaryPhone: '',
    alternativePhone: '',
    email: '',
    // Job & Org
    employeeNumber: '',
    department: 'Human Resources',
    jobTitle: '',
    manager: '',
    employmentStatus: 'probation',
    employmentType: 'full-time',
    workLocation: 'Headquarters (HQ)',
    branch: 'Main Branch - Bole',
    hireDate: new Date().toISOString().split('T')[0],
    probationEndDate: '',
    contractEndDate: '',
    // Financial (ETB)
    basicSalary: '',
    bankName: 'Commercial Bank of Ethiopia',
    bankHolderName: '',
    bankAccountNumber: '',
    // Fayda National ID
    fanNumber: '',
    finNumber: '',
    // Warranty / Guarantor
    guarantorName: '',
    guarantorPhone: '',
    guarantorRelationship: 'Parent',
    guarantorFan: '',
    guarantorFin: '',
    // Current Education Level
    educationLevel: '',
    fieldOfStudy: '',
    institution: '',
    graduationYear: '',
    // Emergency Contact
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: 'Spouse',
    // User Account Provisioning
    createUserAccount: false,
    userRole: 'employee',
    customPassword: ''
  });

  // Fetch active employees for manager dropdown
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadPotentialManagers = async () => {
      try {
        const res = await employeeService.getEmployees({ limit: 100, employmentStatus: 'active' });
        if (res.success && res.data && isMounted) {
          // Filter out current employee in edit mode to avoid self-referencing hierarchy
          const filtered = isEditMode
            ? res.data.filter((emp) => emp._id !== employee._id)
            : res.data;
          setManagerOptions(filtered);
        }
      } catch (err) {
        console.error('Failed to load manager candidates:', err);
      }
    };

    loadPotentialManagers();
    return () => {
      isMounted = false;
    };
  }, [isOpen, isEditMode, employee]);

  // Populate form if in edit mode
  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.name?.first || '',
        middleName: employee.name?.middle || '',
        lastName: employee.name?.last || '',
        gender: employee.gender || 'male',
        dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
        nationality: employee.nationality || 'Ethiopian',
        maritalStatus: employee.maritalStatus || 'single',
        homeAddress: employee.homeAddress || '',
        religion: employee.religion || '',
        bloodGroup: employee.bloodGroup || '',
        primaryPhone: employee.primaryPhone || '',
        alternativePhone: employee.alternativePhone || '',
        email: employee.email || '',
        employeeNumber: employee.employeeNumber || '',
        department: employee.department || 'Human Resources',
        jobTitle: employee.jobTitle || '',
        manager: typeof employee.manager === 'object' && employee.manager?._id ? employee.manager._id : employee.manager || '',
        employmentStatus: employee.employmentStatus || 'probation',
        employmentType: employee.employmentType || 'full-time',
        workLocation: employee.workLocation || 'Headquarters (HQ)',
        branch: employee.branch || 'Main Branch - Bole',
        hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
        probationEndDate: employee.probationEndDate ? employee.probationEndDate.split('T')[0] : '',
        contractEndDate: employee.contractEndDate ? employee.contractEndDate.split('T')[0] : '',
        basicSalary: employee.basicSalary != null ? String(employee.basicSalary) : '',
        bankName: employee.bankAccounts?.[0]?.bankName || 'Commercial Bank of Ethiopia',
        bankHolderName: employee.bankAccounts?.[0]?.holderName || '',
        bankAccountNumber: employee.bankAccounts?.[0]?.accountNumber || '',
        fanNumber: employee.nationalId?.fanNumber || '',
        finNumber: employee.nationalId?.finNumber || '',
        // Warranty / Guarantor
        guarantorName: employee.guarantors?.[0]?.name || '',
        guarantorPhone: employee.guarantors?.[0]?.phone || '',
        guarantorRelationship: employee.guarantors?.[0]?.relationship || 'Parent',
        guarantorFan: employee.guarantors?.[0]?.nationalId?.fanNumber || '',
        guarantorFin: employee.guarantors?.[0]?.nationalId?.finNumber || '',
        // Education
        educationLevel: employee.education?.level || '',
        fieldOfStudy: employee.education?.fieldOfStudy || '',
        institution: employee.education?.institution || '',
        graduationYear: employee.education?.graduationYear || '',
        // Emergency
        emergencyName: employee.emergencyContacts?.[0]?.name || '',
        emergencyPhone: employee.emergencyContacts?.[0]?.phone || '',
        emergencyRelation: employee.emergencyContacts?.[0]?.relationship || 'Spouse',
        createUserAccount: false,
        userRole: 'employee',
        customPassword: ''
      });
    } else {
      // Reset form for create
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        gender: 'male',
        dateOfBirth: '',
        nationality: 'Ethiopian',
        maritalStatus: 'single',
        homeAddress: '',
        religion: '',
        bloodGroup: '',
        primaryPhone: '',
        alternativePhone: '',
        email: '',
        employeeNumber: '',
        department: 'Human Resources',
        jobTitle: '',
        manager: '',
        employmentStatus: 'probation',
        employmentType: 'full-time',
        workLocation: 'Headquarters (HQ)',
        branch: 'Main Branch - Bole',
        hireDate: new Date().toISOString().split('T')[0],
        probationEndDate: '',
        contractEndDate: '',
        basicSalary: '',
        bankName: 'Commercial Bank of Ethiopia',
        bankHolderName: '',
        bankAccountNumber: '',
        fanNumber: '',
        finNumber: '',
        guarantorName: '',
        guarantorPhone: '',
        guarantorRelationship: 'Parent',
        guarantorFan: '',
        guarantorFin: '',
        educationLevel: '',
        fieldOfStudy: '',
        institution: '',
        graduationYear: '',
        emergencyName: '',
        emergencyPhone: '',
        emergencyRelation: 'Spouse',
        createUserAccount: false,
        userRole: 'employee',
        customPassword: ''
      });
    }
    setError('');
    setActiveTab('personal');
    setCreatedCredentials(null);
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Vector ERP Credentials:\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.temporaryPassword}\nLogin at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError(isAmharic ? 'የመጀመሪያ እና የአያት ስም የግዴታ ነው።' : 'First and last names are mandatory.');
      setActiveTab('personal');
      return;
    }

    if (!formData.primaryPhone.trim()) {
      setError(isAmharic ? 'ዋና ስልክ ቁጥር የግዴታ ነው።' : 'Primary phone number is required.');
      setActiveTab('personal');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: {
          first: formData.firstName.trim(),
          middle: formData.middleName.trim(),
          last: formData.lastName.trim()
        },
        gender: formData.gender, // strictly 'male' or 'female'
        religion: formData.religion || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        education: {
          level: formData.educationLevel || undefined,
          fieldOfStudy: formData.fieldOfStudy.trim() || undefined,
          institution: formData.institution.trim() || undefined,
          graduationYear: formData.graduationYear.trim() || undefined
        },
        manager: formData.manager || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        nationality: formData.nationality.trim(),
        maritalStatus: formData.maritalStatus,
        homeAddress: formData.homeAddress.trim() || undefined,
        primaryPhone: formData.primaryPhone.trim(),
        alternativePhone: formData.alternativePhone.trim() || undefined,
        email: formData.email.trim() ? formData.email.trim().toLowerCase() : undefined,
        department: formData.department,
        jobTitle: formData.jobTitle.trim() || undefined,
        employmentStatus: formData.employmentStatus,
        employmentType: formData.employmentType,
        workLocation: formData.workLocation.trim() || undefined,
        branch: formData.branch.trim() || undefined,
        hireDate: formData.hireDate || undefined,
        probationEndDate: formData.probationEndDate || undefined,
        contractEndDate: formData.contractEndDate || undefined,
        nationalId: {
          ...(employee?.nationalId || {}),
          fanNumber: formData.fanNumber.trim() || undefined,
          finNumber: formData.finNumber.trim() || undefined,
          status: employee?.nationalId?.status || 'pending',
          frontImageUrl: employee?.nationalId?.frontImageUrl || undefined,
          backImageUrl: employee?.nationalId?.backImageUrl || undefined,
          approvedBy: employee?.nationalId?.approvedBy || undefined,
          approvedAt: employee?.nationalId?.approvedAt || undefined
        }
      };

      // Only pass employeeNumber if explicitly set in edit mode (auto-generated in create mode)
      if (isEditMode && formData.employeeNumber.trim()) {
        payload.employeeNumber = formData.employeeNumber.trim();
      }

      // Warranty / Guarantor
      const hasGuarantorData = !!(
        formData.guarantorName.trim() ||
        formData.guarantorPhone.trim() ||
        formData.guarantorFan.trim() ||
        formData.guarantorFin.trim()
      );

      if (hasGuarantorData) {
        const existingGuarantor = employee?.guarantors?.[0] || {};
        payload.guarantors = [
          {
            name: formData.guarantorName.trim() || 'Guarantor',
            phone: formData.guarantorPhone.trim() || '',
            relationship: formData.guarantorRelationship || 'Parent',
            nationalId: {
              ...(existingGuarantor.nationalId || {}),
              fanNumber: formData.guarantorFan.trim() || undefined,
              finNumber: formData.guarantorFin.trim() || undefined,
              status: existingGuarantor.nationalId?.status || 'pending',
              frontImageUrl: existingGuarantor.nationalId?.frontImageUrl || undefined,
              backImageUrl: existingGuarantor.nationalId?.backImageUrl || undefined,
              approvedBy: existingGuarantor.nationalId?.approvedBy || undefined,
              approvedAt: existingGuarantor.nationalId?.approvedAt || undefined
            }
          }
        ];
      } else if (isEditMode) {
        payload.guarantors = [];
      }

      // Financials (if permitted)
      if (showFinancials) {
        if (formData.basicSalary !== '') {
          payload.basicSalary = Number(formData.basicSalary);
        }
        if (formData.bankAccountNumber.trim()) {
          const autoHolder = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
          payload.bankAccounts = [
            {
              bankName: formData.bankName,
              holderName: formData.bankHolderName.trim() || autoHolder,
              accountNumber: formData.bankAccountNumber.trim(),
              isPrimary: true
            }
          ];
        }
      }

      // Emergency Contacts
      if (formData.emergencyName.trim() && formData.emergencyPhone.trim()) {
        payload.emergencyContacts = [
          {
            name: formData.emergencyName.trim(),
            phone: formData.emergencyPhone.trim(),
            relationship: formData.emergencyRelation
          }
        ];
      }

      // User account inline provisioning (Create mode only)
      if (!isEditMode && formData.createUserAccount) {
        if (!formData.email.trim()) {
          setError(isAmharic ? 'የስርዓት መለያ ለመክፈት ኢሜይል ማስገባት ያስፈልጋል።' : 'Email is required when creating a system login account.');
          setActiveTab('personal');
          setLoading(false);
          return;
        }

        payload.createUser = {
          email: formData.email.trim().toLowerCase(),
          roles: [formData.userRole],
          password: formData.customPassword.trim() || undefined
        };
      }

      let res;
      if (isEditMode) {
        res = await employeeService.updateEmployee(employee._id, payload);
      } else {
        res = await employeeService.createEmployee(payload);
      }

      if (res.success) {
        if (res.createdUser && res.createdUser.temporaryPassword) {
          setCreatedCredentials({
            email: res.createdUser.email,
            temporaryPassword: res.createdUser.temporaryPassword,
            roles: res.createdUser.roles
          });
          if (onSuccess) onSuccess(res.data);
        } else {
          if (onSuccess) onSuccess(res.data);
          onClose();
        }
      } else {
        setError(res.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Save employee error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save employee profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0">
              {isEditMode ? <User className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isEditMode
                  ? `${t('employee.editPersonnel', 'Edit Personnel')}: #${employee?.employeeNumber}`
                  : t('employee.registerNew', 'Register New Personnel')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditMode
                  ? 'Update employee profile details, hierarchy, warranty & qualifications'
                  : 'Add a new employee with auto-assigned ID, guarantor warranty & qualifications'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Credentials Success Modal Card */}
        {createdCredentials ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300">
                <Check className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold">Personnel Created & Login Account Provisioned!</h3>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                A system login account has been successfully linked to this employee. Please securely copy and share these temporary credentials with the staff member.
              </p>

              <div className="p-4 rounded-xl bg-white dark:bg-[#0e1626] border border-emerald-300 dark:border-emerald-800/80 space-y-2.5 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Login Email</span>
                  <span className="text-slate-900 dark:text-white font-bold">{createdCredentials.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Temporary Password</span>
                  <span className="text-[#00ced1] font-bold text-sm tracking-wider select-all">
                    {createdCredentials.temporaryPassword}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Assigned Role</span>
                  <span className="capitalize text-slate-700 dark:text-slate-300">{createdCredentials.roles?.[0]}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#00ced1] text-[#020617] hover:brightness-95 transition-all cursor-pointer shadow-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Credentials Copied!' : 'Copy Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {t('common.close', 'Done')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0 bg-slate-50/50 dark:bg-[#070b12]/40">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'personal'
                    ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t('employee.personalTab', '1. Personal & Contact')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('job')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'job'
                    ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t('employee.jobTab', '2. Job & Organization')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('financial')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'financial'
                    ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t('employee.financialTab', '3. Financial & Fayda ID')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('warranty')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'warranty'
                    ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>{t('employee.warrantyEducationTab', '4. Warranty & Education')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('emergency')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'emergency'
                    ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t('employee.emergencyAccountTab', '5. Emergency & Account')}
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Tab Contents - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              {/* TAB 1: Personal & Contact */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.firstName', 'First Name')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="e.g. Abebe / አበበ"
                        className="brand-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.middleName', "Father's Name (Middle)")}
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        placeholder="e.g. Kebede / ከበደ"
                        className="brand-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.lastName', "Grandfather's Name (Last)")} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="e.g. Tadesse / ታደሰ"
                        className="brand-input"
                      />
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.primaryPhone', 'Primary Phone')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="primaryPhone"
                        required
                        value={formData.primaryPhone}
                        onChange={handleChange}
                        placeholder="e.g. 0911234567"
                        className="brand-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.alternativePhone', 'Alternative Phone')}
                      </label>
                      <input
                        type="tel"
                        name="alternativePhone"
                        value={formData.alternativePhone}
                        onChange={handleChange}
                        placeholder="e.g. 0922334455"
                        className="brand-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.email', 'Email Address')}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. abebe@vectoradvert.com"
                        className="brand-input"
                      />
                    </div>
                  </div>

                  {/* Gender (Male / Female ONLY - other removed), DOB, Marital, Nationality */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.gender', 'Gender')} <span className="text-rose-500">*</span>
                      </label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="brand-input">
                        <option value="male">{t('employee.male', 'Male')}</option>
                        <option value="female">{t('employee.female', 'Female')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.dateOfBirth', 'Date of Birth')}
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="brand-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.maritalStatus', 'Marital Status')}
                      </label>
                      <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="brand-input">
                        <option value="single">Single / ያላገባ</option>
                        <option value="married">Married / ያገባ</option>
                        <option value="divorced">Divorced / የተፋታ</option>
                        <option value="widowed">Widowed / የሞተበት</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.nationality', 'Nationality')}
                      </label>
                      <input
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        className="brand-input"
                      />
                    </div>
                  </div>

                  {/* Religion & Blood Group */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.religion', 'Religion')}
                      </label>
                      <select name="religion" value={formData.religion} onChange={handleChange} className="brand-input">
                        <option value="">{t('employee.selectReligion', '-- Select Religion --')}</option>
                        {RELIGIONS.map((rel) => (
                          <option key={rel.value} value={rel.value}>
                            {isAmharic ? rel.amLabel : rel.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.bloodGroup', 'Blood Group')}
                      </label>
                      <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="brand-input font-bold">
                        <option value="">{t('employee.selectBloodGroup', '-- Select Blood Group --')}</option>
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('employee.homeAddress', 'Residential Home Address')}
                    </label>
                    <input
                      type="text"
                      name="homeAddress"
                      value={formData.homeAddress}
                      onChange={handleChange}
                      placeholder="e.g. Bole Subcity, Woreda 03, House #142 / ቦሌ ክፍለ ከተማ፣ ወረዳ 03"
                      className="brand-input"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Job & Organization */}
              {activeTab === 'job' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Auto-generation Employee ID */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.employeeId', 'Employee ID #')}
                      </label>
                      {isEditMode ? (
                        <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-[#00ced1] text-xs">
                          #{formData.employeeNumber}
                        </div>
                      ) : (
                        <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>{t('employee.autoGenerated', 'Auto-generated by System (e.g. EMP-0001)')}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.department', 'Department')} <span className="text-rose-500">*</span>
                      </label>
                      <select name="department" value={formData.department} onChange={handleChange} className="brand-input">
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.jobTitle', 'Job Title')} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        required
                        value={formData.jobTitle}
                        onChange={handleChange}
                        placeholder="e.g. Senior Graphic Designer"
                        className="brand-input"
                      />
                    </div>
                  </div>

                  {/* Manager / Supervisor Hierarchy */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#00ced1]" />
                      <span>{t('employee.manager', 'Direct Manager / Supervisor')}</span>
                    </label>
                    <select
                      name="manager"
                      value={formData.manager}
                      onChange={handleChange}
                      className="brand-input"
                    >
                      <option value="">{t('employee.noManager', 'None / Top Executive')}</option>
                      {managerOptions.map((mgr) => {
                        const mgrName = mgr.name ? `${mgr.name.first} ${mgr.name.last}` : mgr.employeeNumber;
                        return (
                          <option key={mgr._id} value={mgr._id}>
                            #{mgr.employeeNumber} - {mgrName} ({mgr.jobTitle || mgr.department})
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Select the employee's direct reporting supervisor for approval workflows.
                    </p>
                  </div>

                  {/* Employment Status & Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.employmentStatus', 'Employment Status')}
                      </label>
                      <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className="brand-input">
                        {EMPLOYMENT_STATUSES.map((st) => (
                          <option key={st.value} value={st.value}>
                            {isAmharic ? st.amLabel : st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.employmentType', 'Employment Type')}
                      </label>
                      <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="brand-input">
                        {EMPLOYMENT_TYPES.map((tItem) => (
                          <option key={tItem.value} value={tItem.value}>
                            {isAmharic ? tItem.amLabel : tItem.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* SEPARATE Work Location & Branch */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#152238]/40 border border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#00ced1]" />
                        <span>{t('employee.workLocation', 'Work Location')}</span>
                      </label>
                      <select
                        name="workLocation"
                        value={formData.workLocation}
                        onChange={handleChange}
                        className="brand-input"
                      >
                        {WORK_LOCATIONS.map((loc) => (
                          <option key={loc.value} value={loc.value}>
                            {isAmharic ? loc.amLabel : loc.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#00ced1]" />
                        <span>{t('employee.branch', 'Branch')}</span>
                      </label>
                      <select
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        className="brand-input"
                      >
                        {BRANCHES.map((br) => (
                          <option key={br.value} value={br.value}>
                            {isAmharic ? br.amLabel : br.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.hireDate', 'Hire Date')}
                      </label>
                      <input
                        type="date"
                        name="hireDate"
                        value={formData.hireDate}
                        onChange={handleChange}
                        className="brand-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.probationEndDate', 'Probation End Date')}
                      </label>
                      <input
                        type="date"
                        name="probationEndDate"
                        value={formData.probationEndDate}
                        onChange={handleChange}
                        className="brand-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('employee.contractEndDate', 'Contract Expiry Date')}
                      </label>
                      <input
                        type="date"
                        name="contractEndDate"
                        value={formData.contractEndDate}
                        onChange={handleChange}
                        className="brand-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Financial & Fayda ID */}
              {activeTab === 'financial' && (
                <div className="space-y-4">
                  {/* Financial Section (RBAC Protected) */}
                  {showFinancials ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                        <Banknote className="w-4 h-4 text-[#00ced1]" />
                        <span>Compensation & Banking (Confidential)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {t('employee.basicSalary', 'Basic Monthly Salary (ETB)')}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            name="basicSalary"
                            value={formData.basicSalary}
                            onChange={handleChange}
                            placeholder="e.g. 25000"
                            className="brand-input font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {t('employee.bankName', 'Bank Name')}
                          </label>
                          <select name="bankName" value={formData.bankName} onChange={handleChange} className="brand-input">
                            <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia (CBE)</option>
                            <option value="Awash Bank">Awash Bank</option>
                            <option value="Dashen Bank">Dashen Bank</option>
                            <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                            <option value="Nib International Bank">Nib International Bank</option>
                            <option value="Hibret Bank">Hibret Bank</option>
                            <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia (Coop)</option>
                            <option value="Zemen Bank">Zemen Bank</option>
                            <option value="Telebirr">Telebirr SuperApp</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {t('employee.bankHolderName', 'Account Holder Name')}
                          </label>
                          <input
                            type="text"
                            name="bankHolderName"
                            value={formData.bankHolderName}
                            onChange={handleChange}
                            placeholder="Full name as on bank passbook"
                            className="brand-input"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {t('employee.bankAccountNumber', 'Account Number')}
                          </label>
                          <input
                            type="text"
                            name="bankAccountNumber"
                            value={formData.bankAccountNumber}
                            onChange={handleChange}
                            placeholder="e.g. 100012345678"
                            className="brand-input font-mono"
                          />
                        </div>
                        <div className="flex items-center text-[11px] text-slate-400 pt-5">
                          <span>Salaries and payroll transfers will be disbursed to this verified bank account.</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs">
                      Financial compensation details are restricted to HR Executives and Finance officers.
                    </div>
                  )}

                  {/* Fayda National ID Section */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                      <Shield className="w-4 h-4 text-[#00ced1]" />
                      <span>{t('employee.faydaNationalId', 'Fayda Ethiopian National ID (Digital Verification)')}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.fanNumber', 'FAN (Fayda Identification Number - 16 Digits)')}
                        </label>
                        <input
                          type="text"
                          name="fanNumber"
                          value={formData.fanNumber}
                          onChange={handleChange}
                          placeholder="e.g. 1234-5678-9012-3456"
                          className="brand-input font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.finNumber', 'FIN (Fayda Individual Number - 12 Digits)')}
                        </label>
                        <input
                          type="text"
                          name="finNumber"
                          value={formData.finNumber}
                          onChange={handleChange}
                          placeholder="e.g. 1234-5678-9012"
                          className="brand-input font-mono font-bold"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      National ID card photos (Front & Back) can be uploaded on the employee profile page after registration.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: Warranty & Education */}
              {activeTab === 'warranty' && (
                <div className="space-y-4">
                  {/* WARRANTY / GUARANTOR SECTION */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                      <HeartHandshake className="w-4 h-4 text-[#00ced1]" />
                      <span>{t('employee.warrantyTitle', 'Warranty / Guarantor')}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {t('employee.warrantySubtitle', 'Guarantor personal information, contact, and Fayda National ID for legal guarantee')}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.guarantorName', 'Guarantor Full Name')}
                        </label>
                        <input
                          type="text"
                          name="guarantorName"
                          value={formData.guarantorName}
                          onChange={handleChange}
                          placeholder="e.g. Girma Tesfaye / ግርማ ተስፋዬ"
                          className="brand-input"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.guarantorPhone', 'Guarantor Phone Number')}
                        </label>
                        <input
                          type="tel"
                          name="guarantorPhone"
                          value={formData.guarantorPhone}
                          onChange={handleChange}
                          placeholder="e.g. 0911554433"
                          className="brand-input"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.guarantorRelationship', 'Guarantor Relationship')}
                        </label>
                        <select
                          name="guarantorRelationship"
                          value={formData.guarantorRelationship}
                          onChange={handleChange}
                          className="brand-input"
                        >
                          {GUARANTOR_RELATIONSHIPS.map((rel) => (
                            <option key={rel.value} value={rel.value}>
                              {isAmharic ? rel.amLabel : rel.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.guarantorFan', 'Guarantor Fayda FAN (16 Digits)')}
                        </label>
                        <input
                          type="text"
                          name="guarantorFan"
                          value={formData.guarantorFan}
                          onChange={handleChange}
                          placeholder="e.g. 9876-5432-1098-7654"
                          className="brand-input font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.guarantorFin', 'Guarantor Fayda FIN (12 Digits)')}
                        </label>
                        <input
                          type="text"
                          name="guarantorFin"
                          value={formData.guarantorFin}
                          onChange={handleChange}
                          placeholder="e.g. 9876-5432-1098"
                          className="brand-input font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CURRENT EDUCATION LEVEL SECTION */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                      <GraduationCap className="w-4 h-4 text-[#00ced1]" />
                      <span>{t('employee.educationTitle', 'Education Level & Current Qualifications')}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {t('employee.educationSubtitle', 'Highest education attained, institution, major field of study, and graduation year')}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.educationLevel', 'Education Level')}
                        </label>
                        <select
                          name="educationLevel"
                          value={formData.educationLevel}
                          onChange={handleChange}
                          className="brand-input"
                        >
                          <option value="">-- Select Education Level --</option>
                          {EDUCATION_LEVELS.map((ed) => (
                            <option key={ed.value} value={ed.value}>
                              {isAmharic ? ed.amLabel : ed.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.fieldOfStudy', 'Field of Study / Major')}
                        </label>
                        <input
                          type="text"
                          name="fieldOfStudy"
                          value={formData.fieldOfStudy}
                          onChange={handleChange}
                          placeholder="e.g. Graphic Design, Marketing, Accounting"
                          className="brand-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.institution', 'Institution / University')}
                        </label>
                        <input
                          type="text"
                          name="institution"
                          value={formData.institution}
                          onChange={handleChange}
                          placeholder="e.g. Addis Ababa University"
                          className="brand-input"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.graduationYear', 'Graduation Date / Year')}
                        </label>
                        <input
                          type="text"
                          name="graduationYear"
                          value={formData.graduationYear}
                          onChange={handleChange}
                          placeholder="e.g. 2023 / 2015 E.C."
                          className="brand-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Emergency Contacts & System Account */}
              {activeTab === 'emergency' && (
                <div className="space-y-4">
                  {/* Emergency Contact */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      {t('employee.emergencyContact', 'Primary Emergency Contact')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.emergencyName', 'Contact Name')}
                        </label>
                        <input
                          type="text"
                          name="emergencyName"
                          value={formData.emergencyName}
                          onChange={handleChange}
                          placeholder="e.g. Tigist Haile"
                          className="brand-input"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.emergencyPhone', 'Contact Phone')}
                        </label>
                        <input
                          type="tel"
                          name="emergencyPhone"
                          value={formData.emergencyPhone}
                          onChange={handleChange}
                          placeholder="e.g. 0911998877"
                          className="brand-input"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('employee.emergencyRelation', 'Relationship')}
                        </label>
                        <select name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} className="brand-input">
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Child">Child</option>
                          <option value="Friend">Friend / Colleague</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* System Account Provisioning (Create mode only) */}
                  {showUserProvisioning && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-[#00ced1]" />
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            System Login Account Provisioning
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="createUserAccount"
                            checked={formData.createUserAccount}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00ced1]"></div>
                        </label>
                      </div>

                      {formData.createUserAccount && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              ERP System Role
                            </label>
                            <select name="userRole" value={formData.userRole} onChange={handleChange} className="brand-input">
                              {ALL_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Custom Password (leave blank for random)
                            </label>
                            <input
                              type="text"
                              name="customPassword"
                              value={formData.customPassword}
                              onChange={handleChange}
                              placeholder="Auto-generated secure password"
                              className="brand-input font-mono"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 sm:col-span-2">
                            The user will be required to change their temporary password upon first login to the ERP.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#070b12]/40">
              <div className="flex items-center gap-2">
                {activeTab !== 'personal' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'job') setActiveTab('personal');
                      if (activeTab === 'financial') setActiveTab('job');
                      if (activeTab === 'warranty') setActiveTab('financial');
                      if (activeTab === 'emergency') setActiveTab('warranty');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
                  >
                    {t('employee.back', 'Back')}
                  </button>
                )}
                {activeTab !== 'emergency' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'personal') setActiveTab('job');
                      if (activeTab === 'job') setActiveTab('financial');
                      if (activeTab === 'financial') setActiveTab('warranty');
                      if (activeTab === 'warranty') setActiveTab('emergency');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs cursor-pointer"
                  >
                    {t('employee.nextTab', 'Next Tab')}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t('employee.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:brightness-95 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#00ced1', color: '#020617' }}
                >
                  <Save className="w-4 h-4" style={{ color: '#020617' }} />
                  <span style={{ color: '#020617' }}>
                    {loading
                      ? t('employee.saving', 'Saving...')
                      : isEditMode
                      ? t('employee.update', 'Update Employee')
                      : t('employee.save', 'Save Employee')}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
